import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, Listing, University, NotificationItem } from '../types';
import { INITIAL_NOTIFICATIONS, INITIAL_UNIVERSITIES } from '../data/mockData';
import { 
  auth, 
  onAuthStateChanged, 
  loginWithGoogle, 
  registerWithEmail, 
  loginWithEmail, 
  logoutFirebase, 
  resetFirebasePassword, 
  resendFirebaseEmailVerification,
  checkFirebaseEmailVerified,
  fetchFirestoreUserProfile, 
  updateFirestoreUserProfile, 
  requestFCMNotificationPermission, 
  subscribeToFCMIncomingMessages, 
  subscribeFirestoreNotifications, 
  markNotificationReadInFirestore,
  formatFirebaseAuthError
} from '../lib/firebase';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

interface AuthContextType {
  user: User | null;
  role: UserRole;
  setRole: (role: UserRole) => void;
  login: (email: string, role: UserRole, name?: string) => void;
  loginGoogleOAuth: (preferredRole?: UserRole) => Promise<void>;
  signUpEmailFirebase: (email: string, pass: string, name: string, role: UserRole, extra?: Partial<User>) => Promise<void>;
  signInEmailFirebase: (email: string, pass: string) => Promise<void>;
  resetPasswordFirebase: (email: string) => Promise<void>;
  resendVerificationEmail: (targetEmail?: string) => Promise<void>;
  checkVerificationStatus: () => Promise<boolean>;
  logout: () => void;
  savedAccounts: User[];
  switchAccount: (userId: string) => void;
  deleteAccount: (userId: string) => void;
  updateProfile: (updatedData: Partial<User>) => void;
  isProfileModalOpen: boolean;
  setProfileModalOpen: (open: boolean) => void;
  savedListingIds: string[];
  toggleSaveListing: (id: string) => void;
  isSaved: (id: string) => boolean;
  selectedUniversity: University | null;
  setSelectedUniversity: (uni: University | null) => void;
  activeView: string;
  setActiveView: (view: string) => void;
  selectedInfoDocId: string;
  setSelectedInfoDocId: (docId: string) => void;
  selectedListing: Listing | null;
  setSelectedListing: (listing: Listing | null) => void;
  isAuthModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  authModalTab: 'login' | 'student_signup' | 'agent_signup' | 'admin_login' | 'forgot_password' | 'email_verification_sent' | 'google_onboarding';
  setAuthModalTab: (tab: 'login' | 'student_signup' | 'agent_signup' | 'admin_login' | 'forgot_password' | 'email_verification_sent' | 'google_onboarding') => void;
  notifications: NotificationItem[];
  unreadCount: number;
  markNotificationRead: (id: string) => void;
  togglePinNotification: (id: string) => void;
  clearAllNotifications: () => void;
  toasts: ToastMessage[];
  addToast: (title: string, message?: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  removeToast: (id: string) => void;
  inspectionModalListing: Listing | null;
  setInspectionModalListing: (listing: Listing | null) => void;
  reportModalListing: Listing | null;
  setReportModalListing: (listing: Listing | null) => void;
  agentActiveTab: 'listings' | 'add_wizard' | 'special_requests' | 'phone_requests' | 'crm_inspections' | 'analytics' | 'verification';
  setAgentActiveTab: (tab: 'listings' | 'add_wizard' | 'special_requests' | 'phone_requests' | 'crm_inspections' | 'analytics' | 'verification') => void;
  isChatModalOpen: boolean;
  setChatModalOpen: (open: boolean) => void;
  chatTargetListing: { id: string; title: string; agentId: string; agentName: string } | null;
  chatTargetThreadId: string | null;
  openChatWithListing: (listing: { id: string; title: string; agentId: string; agentName: string }) => void;
  openChatThread: (threadId: string) => void;
  requestNotificationPermission: () => Promise<void>;
  isFirebaseConnected: boolean;
  isAdminModalOpen: boolean;
  setIsAdminModalOpen: (open: boolean) => void;
  adminToken: string | null;
  adminLogin: (token: string, adminUser: User) => void;
  adminLogout: () => void;
  verificationModalOpen: boolean;
  setVerificationModalOpen: (open: boolean) => void;
  verificationEmail: string;
  openVerificationModal: (email?: string) => void;
  closeVerificationModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const INITIAL_ACCOUNTS_PRESET: User[] = [];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<UserRole>('guest');
  const [user, setUser] = useState<User | null>(null);
  const [isProfileModalOpen, setProfileModalOpen] = useState(false);

  const [savedAccounts, setSavedAccounts] = useState<User[]>([]);

  // Clear legacy local storage mock account caches on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dormiqa_saved_accounts');
      localStorage.removeItem('campora_saved_accounts');
    }
  }, []);

  const [savedListingIds, setSavedListingIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dormiqa_saved_listings') || localStorage.getItem('campora_saved_listings');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(INITIAL_UNIVERSITIES[0]);
  const [activeView, setActiveView] = useState<string>('home');
  const [selectedInfoDocId, setSelectedInfoDocId] = useState<string>('terms-and-conditions');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'student_signup' | 'agent_signup' | 'admin_login' | 'forgot_password' | 'email_verification_sent' | 'google_onboarding'>('login');
  
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const [inspectionModalListing, setInspectionModalListing] = useState<Listing | null>(null);
  const [reportModalListing, setReportModalListing] = useState<Listing | null>(null);
  const [agentActiveTab, setAgentActiveTab] = useState<'listings' | 'add_wizard' | 'special_requests' | 'phone_requests' | 'crm_inspections' | 'analytics' | 'verification'>('listings');

  const [isChatModalOpen, setChatModalOpen] = useState(false);
  const [chatTargetListing, setChatTargetListing] = useState<{ id: string; title: string; agentId: string; agentName: string } | null>(null);
  const [chatTargetThreadId, setChatTargetThreadId] = useState<string | null>(null);

  // Admin Access & Session State
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dormiqa_admin_token') || localStorage.getItem('campora_admin_token');
    }
    return null;
  });

  // Verification Code Modal State
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');

  const openVerificationModal = (targetEmail?: string) => {
    const emailToUse = targetEmail || user?.email || '';
    if (emailToUse) {
      setVerificationEmail(emailToUse);
      setVerificationModalOpen(true);
    }
  };

  const closeVerificationModal = () => {
    setVerificationModalOpen(false);
  };

  const adminLogin = (token: string, adminUser: User) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dormiqa_admin_token', token);
    }
    setAdminToken(token);
    setUser(adminUser);
    setRoleState('admin');
    setActiveView('admin_dashboard');
  };

  const adminLogout = () => {
    if (adminToken) {
      fetch('/api/admin/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: adminToken })
      }).catch(() => {});
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dormiqa_admin_token');
      localStorage.removeItem('campora_admin_token');
    }
    setAdminToken(null);
    setUser(null);
    setRoleState('guest');
    setActiveView('home');
    addToast('Admin Signed Out', 'Secure admin session ended', 'info');
  };

  const openChatWithListing = (listing: { id: string; title: string; agentId: string; agentName: string }) => {
    setChatTargetListing(listing);
    setChatTargetThreadId(null);
    setChatModalOpen(true);
  };

  const openChatThread = (threadId: string) => {
    setChatTargetThreadId(threadId);
    setChatTargetListing(null);
    setChatModalOpen(true);
  };

  useEffect(() => {
    localStorage.setItem('dormiqa_saved_listings', JSON.stringify(savedListingIds));
  }, [savedListingIds]);

  useEffect(() => {
    localStorage.setItem('dormiqa_saved_accounts', JSON.stringify(savedAccounts));
  }, [savedAccounts]);

  const addToast = (title: string, message?: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const switchAccount = (userId: string) => {
    // To switch accounts securely, sign out and prompt for Firebase authentication
    logout();
    setAuthModalTab('login');
    setAuthModalOpen(true);
  };

  const deleteAccount = (userId: string) => {
    if (user?.id === userId) {
      logout();
      addToast('Account Signed Out', 'You have been signed out. To delete your account permanently, contact support.', 'info');
    }
  };

  const [isFirebaseConnected, setIsFirebaseConnected] = useState(true);

  // 1. Firebase Auth listener & Firestore User Profile fetch
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fUser) => {
      if (fUser) {
        await fUser.reload().catch(() => {});
        const isEmailVerified = auth.currentUser ? auth.currentUser.emailVerified : (fUser.emailVerified || false);
        let profile = await fetchFirestoreUserProfile(fUser.uid);
        if (!profile) {
          profile = {
            id: fUser.uid,
            email: fUser.email || '',
            name: fUser.displayName || 'Dormiqa User',
            role: 'student',
            avatar: fUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
            createdAt: new Date().toISOString(),
            emailVerified: isEmailVerified,
          };
        } else {
          profile = {
            ...profile,
            emailVerified: isEmailVerified,
          };
        }
        setUser(profile);
        setRoleState(profile.role);
      } else {
        setUser(null);
        setRoleState('guest');
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Firebase Cloud Messaging foreground push notification listener
  useEffect(() => {
    const unsubscribeFCM = subscribeToFCMIncomingMessages((payload) => {
      if (payload?.notification) {
        addToast(
          payload.notification.title || 'Push Notification (Firebase FCM)', 
          payload.notification.body, 
          'info'
        );
      }
    });
    return () => unsubscribeFCM();
  }, []);

  // 3. Real-time Notifications subscription from Firestore
  useEffect(() => {
    if (!user) return;
    const unsubscribeNotifs = subscribeFirestoreNotifications(user.id, (notifs) => {
      if (notifs.length > 0) {
        setNotifications(notifs);
      }
    });
    return () => unsubscribeNotifs();
  }, [user]);

  const requestNotificationPermission = async () => {
    const token = await requestFCMNotificationPermission(user?.id);
    if (token) {
      addToast('Cloud Messaging Enabled', 'Firebase Push Notifications activated for this browser!', 'success');
    } else {
      addToast('Notification Permission', 'Browser notifications set or permission denied', 'info');
    }
  };

  const loginGoogleOAuth = async (preferredRole?: UserRole) => {
    try {
      const fUser = await loginWithGoogle(preferredRole || 'student');
      const profile = await fetchFirestoreUserProfile(fUser.uid);
      const userRole = profile?.role || preferredRole || 'student';
      
      const userObj: User = profile || {
        id: fUser.uid,
        email: fUser.email || '',
        name: fUser.displayName || 'Dormiqa User',
        role: userRole,
        avatar: fUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
        createdAt: new Date().toISOString(),
        isVerifiedAgent: userRole === 'agent',
        emailVerified: true
      };

      setUser(userObj);
      setRoleState(userRole);

      addToast('Google Authenticated! 🔒', 'Google account verified. Please complete your profile details below.', 'info');
      
      // Do NOT take them to their page immediately. Give them the onboarding form in AuthModal to fill out details
      setAuthModalTab('google_onboarding');
      setAuthModalOpen(true);
    } catch (err: any) {
      console.error('Google OAuth error:', err);
      const readableErr = formatFirebaseAuthError(err);
      addToast('Google Auth Error', readableErr, 'error');
      throw new Error(readableErr);
    }
  };

  const signUpEmailFirebase = async (email: string, pass: string, name: string, userRole: UserRole, extra: Partial<User> = {}) => {
    try {
      const newUser = await registerWithEmail(email, pass, name, userRole, extra);
      if (auth.currentUser) {
        await auth.currentUser.reload().catch(() => {});
      }
      const isVerified = auth.currentUser ? auth.currentUser.emailVerified : false;
      const userObj = { ...newUser, emailVerified: isVerified };

      setUser(userObj);
      setRoleState(userObj.role);

      addToast('Verification Email Sent ✉️', `We have sent a verification link to ${email}.`, 'info');
      setAuthModalTab('email_verification_sent');
      setAuthModalOpen(true);
    } catch (err: any) {
      console.error('Firebase Email Registration Error:', err);
      const readableErr = formatFirebaseAuthError(err);
      addToast('Registration Failed', readableErr, 'error');
      throw new Error(readableErr);
    }
  };

  const resendVerificationEmail = async () => {
    try {
      await resendFirebaseEmailVerification();
      addToast('Verification Email Sent ✉️', 'A new verification link was sent to your email address.', 'info');
    } catch (err: any) {
      const readableErr = formatFirebaseAuthError(err);
      addToast('Resend Failed', readableErr, 'error');
      throw new Error(readableErr);
    }
  };

  const checkVerificationStatus = async (): Promise<boolean> => {
    const isVerified = await checkFirebaseEmailVerified();
    if (isVerified) {
      if (user) {
        setUser({ ...user, emailVerified: true });
      }
      addToast('Email Verified! ✅', 'Your account email is verified.', 'success');
      setAuthModalOpen(false);
      return true;
    } else {
      addToast('Verification Pending', "Your email hasn't been verified yet. Please click the verification link sent to your email.", 'warning');
      return false;
    }
  };

  const signInEmailFirebase = async (email: string, pass: string) => {
    try {
      const fUser = await loginWithEmail(email, pass);
      if (auth.currentUser) {
        await auth.currentUser.reload().catch(() => {});
      }
      const isVerified = auth.currentUser ? auth.currentUser.emailVerified : (fUser.emailVerified || false);

      const profile = await fetchFirestoreUserProfile(fUser.uid);
      const targetRole = profile?.role || 'student';
      
      const userObj: User = {
        ...(profile || {
          id: fUser.uid,
          email: fUser.email || email,
          name: fUser.displayName || 'Dormiqa User',
          role: targetRole,
          avatar: fUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
          createdAt: new Date().toISOString()
        }),
        emailVerified: isVerified
      };

      setUser(userObj);
      setRoleState(targetRole);

      if (!isVerified) {
        addToast('Verification Required ✉️', 'Please verify your email to access your account.', 'warning');
        setAuthModalTab('email_verification_sent');
        setAuthModalOpen(true);
      } else {
        addToast('Signed In (Firebase Auth)', `Welcome back, ${userObj.name}!`, 'success');
        setAuthModalOpen(false);

        if (targetRole === 'student') setActiveView('search');
        else if (targetRole === 'agent') setActiveView('agent_dashboard');
        else if (targetRole === 'admin') setActiveView('admin_dashboard');
      }
    } catch (err: any) {
      console.error('Firebase Sign In Error:', err);
      const readableErr = formatFirebaseAuthError(err);
      addToast('Sign In Failed', readableErr, 'error');
      throw new Error(readableErr);
    }
  };

  const resetPasswordFirebase = async (email: string) => {
    try {
      await resetFirebasePassword(email);
      addToast('Reset Email Sent', `Firebase password reset link sent to ${email}`, 'info');
    } catch (err: any) {
      const readableErr = formatFirebaseAuthError(err);
      addToast('Reset Failed', readableErr, 'error');
    }
  };

  const updateProfile = (updatedData: Partial<User>) => {
    if (!user) return;

    // Synchronize agent photo with profile pic (avatar)
    if (updatedData.agentPhotoUrl) {
      updatedData.avatar = updatedData.agentPhotoUrl;
    } else if ((user.isVerifiedAgent || user.agentPhotoUrl) && updatedData.avatar && updatedData.avatar !== user.agentPhotoUrl) {
      // Prevent overriding verified identity avatar
      updatedData.avatar = user.agentPhotoUrl || user.avatar;
    }

    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
    setSavedAccounts(prev => prev.map(u => u.id === user.id ? updatedUser : u));
    
    // Also update in Firestore if user is logged in
    updateFirestoreUserProfile(user.id, updatedData).catch(() => {});
    addToast('Profile Updated', 'Your profile details have been saved successfully.');
  };

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    if (newRole === 'guest') {
      logout();
    } else if (user) {
      const updatedUser = { ...user, role: newRole };
      setUser(updatedUser);
      updateFirestoreUserProfile(user.id, { role: newRole }).catch(() => {});
      addToast('Role Updated', `Switched role view to ${newRole}`, 'info');
    } else {
      setAuthModalTab(newRole === 'agent' ? 'agent_signup' : 'login');
      setAuthModalOpen(true);
    }
  };

  const login = (email: string, targetRole: UserRole) => {
    setRoleState(targetRole);
    setAuthModalTab('login');
    setAuthModalOpen(true);
  };

  const logout = () => {
    logoutFirebase().catch(() => {});
    setRoleState('guest');
    setUser(null);
    setActiveView('home');
    addToast('Signed Out', 'You have signed out of Firebase and are now browsing as a guest.', 'info');
  };

  const toggleSaveListing = (id: string) => {
    setSavedListingIds(prev => {
      const exists = prev.includes(id);
      if (exists) {
        addToast('Removed from Saved', 'Listing removed from your bookmarks', 'info');
        return prev.filter(item => item !== id);
      } else {
        addToast('Saved Listing!', 'Added to your bookmarked listings', 'success');
        return [...prev, id];
      }
    });
  };

  const isSaved = (id: string) => savedListingIds.includes(id);

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    markNotificationReadInFirestore(id).catch(() => {});
  };

  const togglePinNotification = (id: string) => {
    setNotifications(prev => prev.map(n => {
      if (n.id === id) {
        const isPinned = !n.pinned;
        addToast(isPinned ? 'Notification Pinned 📌' : 'Notification Unpinned', undefined, 'info');
        return { ...n, pinned: isPinned };
      }
      return n;
    }));
  };

  const clearAllNotifications = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    addToast('Notifications marked as read', undefined, 'info');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        setRole,
        login,
        loginGoogleOAuth,
        signUpEmailFirebase,
        signInEmailFirebase,
        resetPasswordFirebase,
        resendVerificationEmail,
        checkVerificationStatus,
        logout,
        savedAccounts,
        switchAccount,
        deleteAccount,
        updateProfile,
        isProfileModalOpen,
        setProfileModalOpen,
        savedListingIds,
        toggleSaveListing,
        isSaved,
        selectedUniversity,
        setSelectedUniversity,
        activeView,
        setActiveView,
        selectedInfoDocId,
        setSelectedInfoDocId,
        selectedListing,
        setSelectedListing,
        isAuthModalOpen,
        setAuthModalOpen,
        authModalTab,
        setAuthModalTab,
        notifications,
        unreadCount,
        markNotificationRead,
        togglePinNotification,
        clearAllNotifications,
        toasts,
        addToast,
        removeToast,
        inspectionModalListing,
        setInspectionModalListing,
        reportModalListing,
        setReportModalListing,
        agentActiveTab,
        setAgentActiveTab,
        isChatModalOpen,
        setChatModalOpen,
        chatTargetListing,
        chatTargetThreadId,
        openChatWithListing,
        openChatThread,
        requestNotificationPermission,
        isFirebaseConnected,
        isAdminModalOpen,
        setIsAdminModalOpen,
        adminToken,
        adminLogin,
        adminLogout,
        verificationModalOpen,
        setVerificationModalOpen,
        verificationEmail,
        openVerificationModal,
        closeVerificationModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
