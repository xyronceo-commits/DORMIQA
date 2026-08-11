import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  sendPasswordResetEmail, 
  onAuthStateChanged,
  updateProfile as firebaseUpdateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  orderBy, 
  limit, 
  serverTimestamp 
} from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import firebaseConfig from '../../firebase-applet-config.json';
import { User, UserRole, Listing, InspectionBooking, Review, ReportItem, AgentVerification, NotificationItem, MessageThread, Message } from '../types';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore (using custom databaseId if specified)
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Initialize Auth & Storage
export const auth = getAuth(app);
export const storage = getStorage(app);
export { onAuthStateChanged };

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function uploadFileToFirebaseStorage(path: string, file: File): Promise<string> {
  try {
    const fileRef = storageRef(storage, path);
    const snapshot = await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (err) {
    console.warn('Firebase storage upload fallback:', err);
    return URL.createObjectURL(file);
  }
}

// Google OAuth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firebase Cloud Messaging safely
let messaging: ReturnType<typeof getMessaging> | null = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      try {
        messaging = getMessaging(app);
      } catch (err) {
        console.warn('Firebase Messaging init warning:', err);
      }
    }
  }).catch(() => {});
}

// ================= FIREBASE AUTHENTICATION & OAUTH =================

export async function loginWithGoogle(preferredRole: UserRole = 'student'): Promise<FirebaseUser> {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  
  // Create or update Firestore user document
  const userRef = doc(db, 'users', user.uid);
  try {
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      await setDoc(userRef, {
        id: user.uid,
        email: user.email || '',
        name: user.displayName || 'Dormiqa User',
        role: preferredRole,
        avatar: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
        createdAt: new Date().toISOString(),
        isVerifiedAgent: preferredRole === 'agent',
        verificationStatus: preferredRole === 'agent' ? 'verified' : 'none',
        fcmToken: null,
      });
    } else if (preferredRole && userDoc.data()?.role !== preferredRole) {
      // Merge role if user explicitly selected agent or student sign in/up
      await setDoc(userRef, { 
        role: preferredRole,
        isVerifiedAgent: preferredRole === 'agent' ? true : (userDoc.data()?.isVerifiedAgent || false)
      }, { merge: true });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
  }
  
  return user;
}

export async function registerWithEmail(
  email: string, 
  pass: string, 
  name: string, 
  role: UserRole, 
  additionalData: Partial<User> = {}
): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  const fUser = cred.user;

  if (name) {
    await firebaseUpdateProfile(fUser, { displayName: name });
  }

  const userObj: User = {
    id: fUser.uid,
    email: fUser.email || email,
    name: name || (role === 'agent' ? 'Property Agent' : 'Student Scholar'),
    role,
    isVerifiedAgent: role === 'agent',
    verificationStatus: role === 'agent' ? 'verified' : 'none',
    emailVerified: fUser.emailVerified || false,
    avatar: fUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    createdAt: new Date().toISOString(),
    ...additionalData,
  };

  try {
    await setDoc(doc(db, 'users', fUser.uid), userObj);
  } catch (err) {
    console.warn('Firestore setDoc user creation notice:', err);
  }
  return userObj;
}

export async function resendFirebaseEmailVerification(targetEmail?: string): Promise<void> {
  const emailToUse = targetEmail || auth.currentUser?.email;
  if (!emailToUse) {
    throw new Error('No active email address provided for verification code dispatch.');
  }
  const res = await fetch('/api/auth/send-verification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: emailToUse })
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to dispatch 6-digit verification code.');
  }
}

export async function checkFirebaseEmailVerified(): Promise<boolean> {
  if (auth.currentUser) {
    await auth.currentUser.reload();
    return auth.currentUser.emailVerified;
  }
  return false;
}

export async function loginWithEmail(email: string, pass: string): Promise<FirebaseUser> {
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  return cred.user;
}

export async function logoutFirebase(): Promise<void> {
  await firebaseSignOut(auth);
}

export async function resetFirebasePassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function fetchFirestoreUserProfile(uid: string): Promise<User | null> {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      return snap.data() as User;
    }
  } catch (err) {
    console.warn('Failed to fetch user profile from Firestore:', err);
  }
  return null;
}

export async function updateFirestoreUserProfile(uid: string, updates: Partial<User>): Promise<void> {
  await updateDoc(doc(db, 'users', uid), updates);
}

// ================= FIREBASE CLOUD MESSAGING & PUSH NOTIFICATIONS =================

export async function requestFCMNotificationPermission(userId?: string): Promise<string | null> {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) return null;

    const permission = await Notification.requestPermission();
    if (permission === 'granted' && messaging) {
      // VAPID key optional or retrieved from config
      const token = await getToken(messaging, {
        vapidKey: firebaseConfig.recaptchaSiteKey || undefined
      }).catch((err) => {
        console.log('FCM token generation notice:', err.message);
        return null;
      });

      if (token && userId) {
        // Store FCM Token in user's document
        await setDoc(doc(db, 'fcmTokens', userId), {
          userId,
          token,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }
      return token;
    }
  } catch (err) {
    console.warn('FCM Permission request error:', err);
  }
  return null;
}

export function subscribeToFCMIncomingMessages(callback: (payload: any) => void) {
  if (!messaging) return () => {};
  return onMessage(messaging, (payload) => {
    console.log('FCM Message Received in Foreground:', payload);
    callback(payload);
  });
}

// ================= FIRESTORE REAL-TIME DATA LISTENERS & CRUD =================

// Real-time Listings Listener
export function subscribeFirestoreListings(callback: (listings: Listing[]) => void) {
  const listingsRef = collection(db, 'listings');
  const q = query(listingsRef, orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const items: Listing[] = [];
    snapshot.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...docSnap.data() } as Listing);
    });
    callback(items);
  }, (error) => {
    console.warn('Firestore listings snapshot error:', error);
  });
}

export async function saveListingToFirestore(listing: Partial<Listing>): Promise<string> {
  const listingsRef = collection(db, 'listings');
  const newDoc = await addDoc(listingsRef, {
    ...listing,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  await updateDoc(newDoc, { id: newDoc.id });
  return newDoc.id;
}

export async function updateListingInFirestore(listingId: string, updates: Partial<Listing>): Promise<void> {
  const listingRef = doc(db, 'listings', listingId);
  await updateDoc(listingRef, {
    ...updates,
    updatedAt: new Date().toISOString()
  });
}

export async function deleteListingFromFirestore(listingId: string): Promise<void> {
  await deleteDoc(doc(db, 'listings', listingId));
}

// Real-time Inspection Bookings Listener
export function subscribeFirestoreInspections(userId: string, isAgent: boolean, callback: (bookings: InspectionBooking[]) => void) {
  const inspRef = collection(db, 'inspections');
  const q = isAgent 
    ? query(inspRef, where('agentId', '==', userId))
    : query(inspRef, where('studentId', '==', userId));

  return onSnapshot(q, (snapshot) => {
    const items: InspectionBooking[] = [];
    snapshot.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...docSnap.data() } as InspectionBooking);
    });
    callback(items);
  }, (err) => {
    console.warn('Inspections subscription error:', err);
  });
}

export async function createInspectionInFirestore(booking: Partial<InspectionBooking>): Promise<string> {
  const ref = collection(db, 'inspections');
  const newDoc = await addDoc(ref, {
    ...booking,
    createdAt: new Date().toISOString()
  });
  await updateDoc(newDoc, { id: newDoc.id });

  // Also push a Firebase notification doc to the agent
  if (booking.agentId) {
    await sendFirestoreNotification({
      userId: booking.agentId,
      type: 'inspection_update',
      title: 'New Inspection Request (Firebase)',
      body: `${booking.studentName || 'A student'} requested inspection for ${booking.listingTitle || 'your listing'} on ${booking.date} at ${booking.timeSlot}.`,
      read: false,
    });
  }

  return newDoc.id;
}

export const saveInspectionToFirestore = createInspectionInFirestore;

export async function updateInspectionStatusInFirestore(bookingId: string, status: string, studentId?: string, listingTitle?: string): Promise<void> {
  const ref = doc(db, 'inspections', bookingId);
  await updateDoc(ref, { status });

  if (studentId) {
    await sendFirestoreNotification({
      userId: studentId,
      type: 'inspection_update',
      title: `Inspection ${status.toUpperCase()} (Firebase)`,
      body: `Your inspection booking for "${listingTitle || 'accommodation'}" was marked as ${status}.`,
      read: false,
    });
  }
}

// Real-time Notifications Listener
export function subscribeFirestoreNotifications(userId: string, callback: (notifications: NotificationItem[]) => void) {
  const notifRef = collection(db, 'notifications');
  const q = query(notifRef, where('userId', 'in', [userId, 'all']), limit(50));

  return onSnapshot(q, (snapshot) => {
    const items: NotificationItem[] = [];
    snapshot.forEach((d) => {
      items.push({ id: d.id, ...d.data() } as NotificationItem);
    });
    items.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
    callback(items);
  }, (err) => {
    console.warn('Notifications subscription warning:', err);
  });
}

export async function sendFirestoreNotification(notif: Partial<NotificationItem>): Promise<void> {
  const ref = collection(db, 'notifications');
  await addDoc(ref, {
    ...notif,
    timestamp: new Date().toISOString(),
    read: false
  });
}

export async function markNotificationReadInFirestore(notifId: string): Promise<void> {
  const ref = doc(db, 'notifications', notifId);
  await updateDoc(ref, { read: true });
}

// Real-time Reviews Listener
export function subscribeFirestoreReviews(listingId: string, callback: (reviews: Review[]) => void) {
  const ref = collection(db, 'reviews');
  const q = query(ref, where('listingId', '==', listingId));

  return onSnapshot(q, (snapshot) => {
    const items: Review[] = [];
    snapshot.forEach((d) => {
      items.push({ id: d.id, ...d.data() } as Review);
    });
    callback(items);
  }, (err) => {
    console.warn('Reviews subscription error:', err);
  });
}

export async function submitReviewToFirestore(review: Partial<Review>): Promise<string> {
  const ref = collection(db, 'reviews');
  const newDoc = await addDoc(ref, {
    ...review,
    createdAt: new Date().toISOString()
  });
  await updateDoc(newDoc, { id: newDoc.id });
  return newDoc.id;
}

// Agent Verification Requests in Firestore
export async function submitVerificationToFirestore(verif: Partial<AgentVerification>): Promise<string> {
  const ref = collection(db, 'verifications');
  const newDoc = await addDoc(ref, {
    ...verif,
    submittedAt: new Date().toISOString(),
    status: 'pending'
  });
  await updateDoc(newDoc, { id: newDoc.id });
  return newDoc.id;
}

// Safety Reports in Firestore
export async function submitReportToFirestore(report: Partial<ReportItem>): Promise<string> {
  const ref = collection(db, 'reports');
  const newDoc = await addDoc(ref, {
    ...report,
    createdAt: new Date().toISOString(),
    status: 'open'
  });
  await updateDoc(newDoc, { id: newDoc.id });
  return newDoc.id;
}

// Real-time Messaging (Threads & Chat Messages) in Firestore
export function subscribeFirestoreThreads(userId: string, isAgent: boolean, callback: (threads: MessageThread[]) => void) {
  const ref = collection(db, 'threads');
  const q = isAgent 
    ? query(ref, where('agentId', '==', userId))
    : query(ref, where('studentId', '==', userId));

  return onSnapshot(q, (snapshot) => {
    const items: MessageThread[] = [];
    snapshot.forEach((d) => {
      items.push({ id: d.id, ...d.data() } as MessageThread);
    });
    // Sort descending by lastMessageTime
    items.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
    callback(items);
  }, (err) => {
    console.warn('Threads subscription warning:', err);
  });
}

export function subscribeFirestoreMessages(threadId: string, callback: (messages: Message[]) => void) {
  const ref = collection(db, 'messages');
  const q = query(ref, where('threadId', '==', threadId));

  return onSnapshot(q, (snapshot) => {
    const items: Message[] = [];
    snapshot.forEach((d) => {
      items.push({ id: d.id, ...d.data() } as Message);
    });
    items.sort((a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime());
    callback(items);
  }, (err) => {
    console.warn('Messages subscription warning:', err);
  });
}

export async function createOrGetFirestoreThread(data: {
  listingId: string;
  listingTitle: string;
  studentId: string;
  studentName: string;
  agentId: string;
  agentName: string;
  initialMessage?: string;
}): Promise<string> {
  const threadsRef = collection(db, 'threads');
  const q = query(
    threadsRef,
    where('listingId', '==', data.listingId),
    where('studentId', '==', data.studentId),
    where('agentId', '==', data.agentId)
  );
  const snap = await getDocs(q);

  let threadId = '';
  const now = new Date().toISOString();

  if (!snap.empty) {
    threadId = snap.docs[0].id;
    if (data.initialMessage) {
      await updateDoc(doc(db, 'threads', threadId), {
        lastMessage: data.initialMessage,
        lastMessageTime: now,
      });
    }
  } else {
    const newDoc = await addDoc(threadsRef, {
      listingId: data.listingId,
      listingTitle: data.listingTitle,
      studentId: data.studentId,
      studentName: data.studentName,
      agentId: data.agentId,
      agentName: data.agentName,
      lastMessage: data.initialMessage || 'Started a conversation',
      lastMessageTime: now,
      unreadCount: 1,
    });
    threadId = newDoc.id;
    await updateDoc(newDoc, { id: threadId });
  }

  if (data.initialMessage) {
    await sendFirestoreMessage({
      threadId,
      senderId: data.studentId,
      senderRole: 'student',
      text: data.initialMessage,
    });

    // Notify agent of new message
    await sendFirestoreNotification({
      userId: data.agentId,
      type: 'message',
      title: `New Message from ${data.studentName}`,
      body: `Re: ${data.listingTitle}: "${data.initialMessage}"`,
      read: false,
    });
  }

  return threadId;
}

export async function sendFirestoreMessage(msg: {
  threadId: string;
  senderId: string;
  senderRole: 'student' | 'agent';
  text: string;
}): Promise<string> {
  const messagesRef = collection(db, 'messages');
  const now = new Date().toISOString();
  const newDoc = await addDoc(messagesRef, {
    threadId: msg.threadId,
    senderId: msg.senderId,
    senderRole: msg.senderRole,
    text: msg.text,
    timestamp: now,
    read: false,
  });
  await updateDoc(newDoc, { id: newDoc.id });

  // Update parent thread lastMessage
  const threadRef = doc(db, 'threads', msg.threadId);
  await updateDoc(threadRef, {
    lastMessage: msg.text,
    lastMessageTime: now,
  });

  return newDoc.id;
}

// Fetch listings directly from Firestore
export async function fetchFirestoreListings(): Promise<Listing[]> {
  try {
    const listingsRef = collection(db, 'listings');
    const snapshot = await getDocs(listingsRef);
    const items: Listing[] = [];
    snapshot.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...docSnap.data() } as Listing);
    });
    return items;
  } catch (err) {
    console.warn('Failed to fetch firestore listings:', err);
    return [];
  }
}

