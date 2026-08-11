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
  markNotificationReadInFirestore 
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
  authModalTab: 'login' | 'student_signup' | 'agent_signup' | 'admin_login' | 'forgot_password' | 'email_verification_sent';
  setAuthModalTab: (tab: 'login' | 'student_signup' | 'agent_signup' | 'admin_login' | 'forgot_password' | 'email_verification_sent') => void;
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

  const [savedAccounts, setSavedAccounts] = useState<User[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dormiqa_saved_accounts') || localStorage.getItem('campora_saved_accounts');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { /* fallback */ }
      }
    }
    return [];
  });

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
  const [authModalTab, setAuthModalTab] = useState<'login' | 'student_signup' | 'agent_signup' | 'admin_login' | 'forgot_password' | 'email_verification_sent'>('login');
  
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
    const targetUser = savedAccounts.find(u => u.id === userId);
    if (!targetUser) {
      addToast('Account not found', 'Unable to find specified account', 'error');
      return;
    }
    setUser(targetUser);
    setRoleState(targetUser.role);
    if (targetUser.role === 'student') setActiveView('student_dashboard');
    else if (targetUser.role === 'agent') setActiveView('agent_dashboard');
    else if (targetUser.role === 'admin') setActiveView('admin_dashboard');
    addToast('Account Switched', `Now logged in as ${targetUser.name} (${targetUser.role})`, 'success');
  };

  const deleteAccount = (userId: string) => {
    const target = savedAccounts.find(u => u.id === userId);
    const targetName = target ? target.name : 'Account';

    setSavedAccounts(prev => prev.filter(u => u.id !== userId));

    if (user?.id === userId) {
      setUser(null);
      setRoleState('guest');
      setActiveView('home');
      addToast('Account Deleted', `${targetName} was permanently deleted. You are now in guest mode.`, 'warning');
    } else {
      addToast('Account Deleted', `${targetName} has been removed from saved accounts.`, 'info');
    }
  };

  const [isFirebaseConnected, setIsFirebaseConnected] = useState(true);

  // 1. Firebase Auth listener & Firestore User Profile fetch
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fUser) => {
      if (fUser) {
        let profile = await fetchFirestoreUserProfile(fUser.uid);
        if (!profile) {
          profile = {
            id: fUser.uid,
            email: fUser.email || '',
            name: fUser.displayName || 'Dormiqa User',
            role: 'student',
            avatar: fUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
            createdAt: new Date().toISOString(),
            emailVerified: fUser.emailVerified || false,
          };
        } else {
          profile = {
            ...profile,
            emailVerified: fUser.emailVerified || profile.emailVerified || false,
          };
        }
        setUser(profile);
        setRoleState(profile.role);
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
      
      setUser(profile || {
        id: fUser.uid,
        email: fUser.email || '',
        name: fUser.displayName || 'Dormiqa User',
        role: userRole,
        avatar: fUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
        createdAt: new Date().toISOString(),
        isVerifiedAgent: userRole === 'agent',
      });
      setRoleState(userRole);

      addToast('Signed In with Google (Firebase OAuth)', `Welcome ${fUser.displayName || fUser.email}! (${userRole.toUpperCase()})`, 'success');
      setAuthModalOpen(false);

      if (userRole === 'student') setActiveView('search');
      else if (userRole === 'agent') {
        if (preferredRole === 'agent' && !profile?.isVerifiedAgent) {
          setActiveView('agent_verification');
        } else {
          setActiveView('agent_dashboard');
        }
      }
      else if (userRole === 'admin') setActiveView('admin_dashboard');
    } catch (err: any) {
      console.error('Google OAuth error:', err);
      addToast('Google Auth Error', err.message || 'Failed to authenticate with Google OAuth', 'error');
    }
  };

  const signUpEmailFirebase = async (email: string, pass: string, name: string, userRole: UserRole, extra: Partial<User> = {}) => {
    try {
      const newUser = await registerWithEmail(email, pass, name, userRole, extra);
      setUser(newUser);
      setRoleState(newUser.role);
      addToast('Verification Code Sent ✉️', `A 6-digit verification code has been dispatched to ${email}.`, 'info');
      setAuthModalTab('email_verification_sent');

      if (userRole === 'student') setActiveView('search');
      else if (userRole === 'agent') setActiveView('agent_verification');
      else if (userRole === 'admin') setActiveView('admin_dashboard');
    } catch (err: any) {
      console.error('Firebase Email Registration Error:', err);
      addToast('Registration Failed', err.message || 'Error creating Firebase user', 'error');
      throw err;
    }
  };

  const resendVerificationEmail = async (targetEmail?: string) => {
    const emailToUse = targetEmail || user?.email || verificationEmail;
    if (!emailToUse) {
      addToast('Verification Error', 'No active email address available for code dispatch.', 'error');
      return;
    }
    try {
      await resendFirebaseEmailVerification(emailToUse);
      addToast('Verification Code Dispatched ✉️', `A 6-digit code was sent to ${emailToUse}`, 'info');
    } catch (err: any) {
      addToast('Resend Failed', err.message || 'Unable to resend verification code.', 'error');
    }
  };

  const checkVerificationStatus = async (): Promise<boolean> => {
    if (user?.emailVerified) {
      addToast('Email Verified! ✅', 'Your account email is verified.', 'success');
      return true;
    } else {
      openVerificationModal(user?.email);
      addToast('Pending Verification ✉️', 'Please enter your 6-digit verification code.', 'info');
      return false;
    }
  };

  const signInEmailFirebase = async (email: string, pass: string) => {
    try {
      const fUser = await loginWithEmail(email, pass);
      const profile = await fetchFirestoreUserProfile(fUser.uid);
      const targetRole = profile?.role || 'student';
      
      setUser(profile || {
        id: fUser.uid,
        email: fUser.email || email,
        name: fUser.displayName || 'Dormiqa User',
        role: targetRole,
        avatar: fUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
        createdAt: new Date().toISOString()
      });
      setRoleState(targetRole);

      addToast('Signed In (Firebase Auth)', `Welcome back!`, 'success');
      setAuthModalOpen(false);

      if (targetRole === 'student') setActiveView('search');
      else if (targetRole === 'agent') setActiveView('agent_dashboard');
      else if (targetRole === 'admin') setActiveView('admin_dashboard');
    } catch (err: any) {
      console.error('Firebase Sign In Error:', err);
      addToast('Sign In Failed', err.message || 'Invalid credentials or account error', 'error');
      throw err;
    }
  };

  const resetPasswordFirebase = async (email: string) => {
    try {
      await resetFirebasePassword(email);
      addToast('Reset Email Sent', `Firebase password reset link sent to ${email}`, 'info');
    } catch (err: any) {
      addToast('Reset Failed', err.message || 'Failed to send reset email', 'error');
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
      setUser(null);
    } else if (newRole === 'student') {
      const studentAcc = savedAccounts.find(a => a.role === 'student') || INITIAL_ACCOUNTS_PRESET[0];
      setUser(studentAcc);
      addToast('Switched Role to Student', `Browsing as student user ${studentAcc.name}`, 'info');
    } else if (newRole === 'agent') {
      const agentAcc = savedAccounts.find(a => a.role === 'agent') || INITIAL_ACCOUNTS_PRESET[1];
      setUser(agentAcc);
      addToast('Switched Role to Agent', `Logged in as property agent ${agentAcc.name}`, 'info');
    } else if (newRole === 'admin') {
      const adminAcc = savedAccounts.find(a => a.role === 'admin') || INITIAL_ACCOUNTS_PRESET[2];
      setUser(adminAcc);
      addToast('Switched Role to Admin', 'Accessing platform management dashboard', 'warning');
    }
  };

  const login = (email: string, targetRole: UserRole, name?: string) => {
    setRoleState(targetRole);
    const existing = savedAccounts.find(a => a.email.toLowerCase() === email.toLowerCase());

    if (existing) {
      setUser(existing);
      setRoleState(existing.role);
      addToast('Logged In Successfully', `Welcome back, ${existing.name}!`, 'success');
    } else {
      const newUserId = `usr_${Date.now()}`;
      const displayName = name || (targetRole === 'agent' ? 'Property Agent' : 'Student Scholar');
      const newUserObj: User = {
        id: newUserId,
        email,
        name: displayName,
        role: targetRole,
        isVerifiedAgent: targetRole === 'agent',
        verificationStatus: targetRole === 'agent' ? 'verified' : 'none',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
        createdAt: new Date().toISOString(),
      };

      setUser(newUserObj);
      setSavedAccounts(prev => [newUserObj, ...prev]);
      addToast('Account Created & Added', `Welcome ${displayName}! Account added to profile accounts.`, 'success');
    }

    setAuthModalOpen(false);

    if (targetRole === 'student') {
      setActiveView('search');
    } else if (targetRole === 'agent') {
      setActiveView('agent_dashboard');
    } else if (targetRole === 'admin') {
      setActiveView('admin_dashboard');
    }

    const confirmNotif: NotificationItem = {
      id: `notif_confirm_${Date.now()}`,
      userId: email,
      type: 'announcement',
      title: 'Check Email to Confirm Account',
      body: `A confirmation email has been sent to ${email}. Please check your inbox or spam folder to complete registration.`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => [confirmNotif, ...prev]);
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
