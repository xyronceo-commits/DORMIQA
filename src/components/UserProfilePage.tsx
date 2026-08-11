import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, UserRole } from '../types';
import { uploadFileToFirebaseStorage } from '../lib/firebase';
import { INITIAL_UNIVERSITIES } from '../data/mockData';
import { 
  User as UserIcon, UserCheck, LogOut, Trash2, Plus, ShieldCheck, UserPlus, 
  Mail, Phone, Building2, AlertTriangle, CheckCircle2, RefreshCw, KeyRound, 
  ArrowRightLeft, Upload, Camera, LogIn, Settings, Sparkles, GraduationCap, Building,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const UserProfilePage: React.FC = () => {
  const { 
    user, 
    role, 
    logout, 
    savedAccounts, 
    switchAccount, 
    deleteAccount, 
    updateProfile,
    login,
    addToast,
    setActiveView,
    loginGoogleOAuth,
    signUpEmailFirebase,
    signInEmailFirebase,
    resetPasswordFirebase
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'accounts' | 'auth'>('profile');

  // Edit Profile State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [editUni, setEditUni] = useState(user?.universityName || '');
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Delete Account Confirmation Modal State
  const [accountToDelete, setAccountToDelete] = useState<User | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Add Account Inline Form State
  const [addAccountRole, setAddAccountRole] = useState<UserRole>('student');
  const [addAccountEmail, setAddAccountEmail] = useState('');
  const [addAccountName, setAddAccountName] = useState('');

  // Inline Auth State
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authRole, setAuthRole] = useState<UserRole>('student');
  const [authLoading, setAuthLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;
    if (user.isVerifiedAgent || user.agentPhotoUrl) {
      addToast('Profile Photo Locked 🔒', 'Verified Agent profile pictures are set from your identity photo and cannot be edited.', 'warning');
      return;
    }
    const file = e.target.files[0];
    setAvatarUploading(true);
    addToast('Uploading Avatar...', 'Saving avatar picture to Firebase Storage', 'info');
    try {
      const path = `avatars/${user.id}_${Date.now()}_${file.name}`;
      const downloadUrl = await uploadFileToFirebaseStorage(path, file);
      updateProfile({ avatar: downloadUrl });
      addToast('Avatar Updated! 📸', 'New profile picture saved in Firebase Storage.');
    } catch (err) {
      addToast('Upload Failed', 'Could not upload avatar photo.', 'error');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleUpdateProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editEmail.trim()) {
      addToast('Missing Info', 'Name and Email are required.', 'warning');
      return;
    }
    updateProfile({
      name: editName.trim(),
      email: editEmail.trim(),
      phone: editPhone.trim(),
      universityName: editUni
    });
    setIsEditing(false);
    addToast('Profile Updated', 'Your profile details have been saved to Firestore.');
  };

  const handleConfirmDeleteAccount = () => {
    if (!accountToDelete) return;
    
    const isCurrent = user?.id === accountToDelete.id;
    deleteAccount(accountToDelete.id);
    setAccountToDelete(null);
    setDeleteConfirmText('');

    if (isCurrent) {
      setActiveView('home');
    }
  };

  const handleAddAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addAccountEmail.trim()) {
      addToast('Email Required', 'Please provide an email address for the new account.', 'warning');
      return;
    }

    login(addAccountEmail.trim(), addAccountRole, addAccountName.trim() || undefined);
    setAddAccountEmail('');
    setAddAccountName('');
    setActiveTab('accounts');
    addToast('Account Added', `Successfully created and switched to ${addAccountRole} account.`);
  };

  const handleGoogleSignIn = async (targetRole: UserRole) => {
    setGoogleLoading(true);
    try {
      await loginGoogleOAuth(targetRole);
    } catch (err) {
      console.error('Google Auth Error:', err);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      await signInEmailFirebase(authEmail, authPassword);
      addToast('Signed In', 'Welcome back!');
    } catch (err: any) {
      addToast('Sign In Error', err.message || 'Failed to sign in', 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      await signUpEmailFirebase(authEmail, authPassword, authName || 'Dormiqa User', authRole, {
        isVerifiedAgent: authRole === 'agent'
      });
      addToast('Account Registered', 'Your new account was created successfully.');
    } catch (err: any) {
      addToast('Sign Up Error', err.message || 'Failed to create account', 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Navigation Breadcrumb & Back */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setActiveView('home')}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Accommodations
          </button>
          
          <span className="text-xs font-black uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800">
            User Profile & Account Center
          </span>
        </div>

        {/* Hero Header Card */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-20 top-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar Photo Container */}
            <div className="relative group shrink-0">
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'}
                alt={user?.name || 'User Profile'}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-emerald-400 shadow-2xl"
              />
              {user && (
                (user.isVerifiedAgent || user.agentPhotoUrl) ? (
                  <div 
                    className="absolute -bottom-2.5 left-1/2 transform -translate-x-1/2 px-2.5 py-1 rounded-xl bg-amber-500 text-slate-950 font-black text-[10px] shadow-xl flex items-center gap-1 border-2 border-slate-900 shrink-0 whitespace-nowrap cursor-default"
                    title="Verified Identity Photo (Non-editable for Trust & Security)"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-950" />
                    <span>VERIFIED & LOCKED</span>
                  </div>
                ) : (
                  <label 
                    htmlFor="user-page-avatar-upload"
                    className="absolute bottom-0 right-0 p-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold shadow-lg cursor-pointer transition-all hover:scale-105"
                    title="Upload new profile avatar to Firebase"
                  >
                    {avatarUploading ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-900" />
                    ) : (
                      <Camera className="w-4 h-4 text-slate-900" />
                    )}
                    <input
                      id="user-page-avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={avatarUploading}
                      className="hidden"
                    />
                  </label>
                )
              )}
            </div>

            {/* Profile Summary Details */}
            <div className="flex-1 text-center sm:text-left space-y-2 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white truncate">
                  {user?.name || 'Guest User'}
                </h1>
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs">
                  {user?.role || role}
                </span>
                {user?.isVerifiedAgent && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    Gold Verified Agent
                  </span>
                )}
              </div>

              <p className="text-sm text-slate-300 truncate font-medium flex items-center justify-center sm:justify-start gap-2">
                <Mail className="w-4 h-4 text-indigo-400 shrink-0" />
                {user?.email || 'Not logged in (Browsing as Guest)'}
              </p>

              {user?.phone && (
                <p className="text-xs text-slate-400 font-medium flex items-center justify-center sm:justify-start gap-2">
                  <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  {user.phone}
                </p>
              )}

              {user?.universityName && (
                <p className="text-xs text-indigo-300 font-semibold flex items-center justify-center sm:justify-start gap-2 pt-1">
                  <GraduationCap className="w-4 h-4 text-indigo-400 shrink-0" />
                  {user.universityName}
                </p>
              )}
            </div>

            {/* Quick Action Buttons */}
            {user && (
              <div className="shrink-0 flex sm:flex-col gap-2.5 w-full sm:w-auto">
                <button
                  onClick={logout}
                  className="flex-1 sm:flex-initial py-2.5 px-4 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>

          {/* Main Navigation Tabs */}
          <div className="flex gap-2 mt-8 border-b border-white/10 text-xs font-bold overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'profile'
                  ? 'border-emerald-400 text-emerald-300 font-black'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Settings className="w-4 h-4" />
              Profile Details & Settings
            </button>

            {role !== 'student' && (
              <button
                onClick={() => setActiveTab('accounts')}
                className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'accounts'
                    ? 'border-emerald-400 text-emerald-300 font-black'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <ArrowRightLeft className="w-4 h-4" />
                Add or Switch Accounts ({savedAccounts.length})
              </button>
            )}

            <button
              onClick={() => setActiveTab('auth')}
              className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'auth'
                  ? 'border-emerald-400 text-emerald-300 font-black'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="w-4 h-4" />
              Sign In & Sign Up Options
            </button>
          </div>
        </div>

        {/* Tab Content Section */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800">
          
          {/* TAB 1: MANAGE PROFILE & ACCOUNT */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                    Personal Information & Account Details
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Update your display profile, contact info, and security parameters stored in Firebase.
                  </p>
                </div>
                {user && (
                  <button
                    onClick={() => {
                      if (!isEditing) {
                        setEditName(user.name);
                        setEditEmail(user.email);
                        setEditPhone(user.phone || '');
                        setEditUni(user.universityName || '');
                      }
                      setIsEditing(!isEditing);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
                  >
                    {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                  </button>
                )}
              </div>

              {!user ? (
                <div className="p-8 text-center space-y-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                  <UserIcon className="w-12 h-12 text-slate-400 mx-auto" />
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">You are currently browsing as Guest</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Sign in or create a student or agent account to manage your profile, save bookmarks, and publish accommodations.
                  </p>
                  <button
                    onClick={() => setActiveTab('auth')}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-sm inline-flex items-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign In to Account
                  </button>
                </div>
              ) : isEditing ? (
                <form onSubmit={handleUpdateProfileSubmit} className="space-y-4 max-w-xl">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Full Display Name
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="+234 800 000 0000"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Primary Campus / University Choice
                    </label>
                    <select
                      value={editUni}
                      onChange={(e) => setEditUni(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">-- Select Your Preferred University --</option>
                      {INITIAL_UNIVERSITIES.map(u => (
                        <option key={u.id} value={u.name}>
                          {u.name} ({u.shortName}) - {u.state} State
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-sm"
                    >
                      Save Profile Updates
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Account ID</span>
                    <p className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">{user.id}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</span>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{user.name}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</span>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{user.email}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone</span>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{user.phone || 'Not specified'}</p>
                  </div>

                  {user.role === 'agent' && (
                    <div className="md:col-span-2 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                            Agent Verification Status: {user.verificationStatus || 'Gold Verified'}
                          </p>
                          <p className="text-[11px] text-emerald-800 dark:text-emerald-400">
                            CAC & ID verified for listing hosts near campus.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setActiveView('agent_dashboard');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors"
                      >
                        Agent Portal
                      </button>
                    </div>
                  )}

                  {/* Password Reset Section */}
                  <div className="md:col-span-2 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Firebase Security & Password</p>
                      <p className="text-[11px] text-slate-500">Send password reset link to your registered email.</p>
                    </div>
                    <button
                      onClick={() => resetPasswordFirebase(user.email)}
                      className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-200 dark:border-indigo-800 transition-colors"
                    >
                      Reset Password
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ADD OR SWITCH ACCOUNTS */}
          {activeTab === 'accounts' && role !== 'student' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                    Multi-Account Switcher
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Instantly toggle between Agent and Administrator profiles.
                  </p>
                </div>
              </div>

              {/* Saved Account Cards */}
              <div className="space-y-3">
                {savedAccounts.map((acct) => {
                  const isCurrent = user?.id === acct.id;
                  return (
                    <div
                      key={acct.id}
                      className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                        isCurrent
                          ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-500 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <img
                          src={acct.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'}
                          alt={acct.name}
                          className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">{acct.name}</p>
                            {isCurrent && (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[9px] font-black uppercase">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{acct.email}</p>
                          <span className="inline-block mt-0.5 text-[10px] font-bold text-slate-400 uppercase">
                            Role: {acct.role}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {!isCurrent && (
                          <button
                            onClick={() => {
                              switchAccount(acct.id);
                              addToast('Account Switched', `Logged in as ${acct.name}`);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs"
                          >
                            Switch To
                          </button>
                        )}
                        <button
                          onClick={() => setAccountToDelete(acct)}
                          className="p-2 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-950 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Remove account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add New Account Box */}
              <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-emerald-500" />
                  Quick Add Local Profile
                </h4>
                <form onSubmit={handleAddAccountSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={addAccountName}
                    onChange={(e) => setAddAccountName(e.target.value)}
                    className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 font-medium"
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={addAccountEmail}
                    onChange={(e) => setAddAccountEmail(e.target.value)}
                    required
                    className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 font-medium"
                  />
                  <div className="flex gap-2">
                    <select
                      value={addAccountRole}
                      onChange={(e) => setAddAccountRole(e.target.value as UserRole)}
                      className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 font-bold"
                    >
                      <option value="student">Student</option>
                      <option value="agent">Agent</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button
                      type="submit"
                      className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shrink-0"
                    >
                      Add & Switch
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 3: SIGN IN & SIGN UP OPTIONS */}
          {activeTab === 'auth' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  Firebase Authentication Services
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Authenticate using Google OAuth or Firebase Email Credentials.
                </p>
              </div>

              {/* Google OAuth Block */}
              <div className="p-6 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-sm text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                      Sign In / Sign Up with Google
                    </h4>
                    <p className="text-xs text-indigo-800/80 dark:text-indigo-300">
                      Single-click OAuth login for instant student or agent verification.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleGoogleSignIn('student')}
                    disabled={googleLoading}
                    className="py-3 px-4 rounded-xl bg-white dark:bg-slate-900 border-2 border-indigo-200 dark:border-indigo-800 hover:border-indigo-500 text-slate-900 dark:text-slate-100 font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all"
                  >
                    <GraduationCap className="w-4 h-4 text-indigo-600" />
                    <span>Google Sign In (Student)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleGoogleSignIn('agent')}
                    disabled={googleLoading}
                    className="py-3 px-4 rounded-xl bg-white dark:bg-slate-900 border-2 border-emerald-200 dark:border-emerald-800 hover:border-emerald-500 text-slate-900 dark:text-slate-100 font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all"
                  >
                    <Building className="w-4 h-4 text-emerald-600" />
                    <span>Google Sign In (Agent)</span>
                  </button>
                </div>
              </div>

              {/* Email Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Sign In Form */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Sign In with Email
                  </h4>
                  <form onSubmit={handleEmailSignIn} className="space-y-3">
                    <input
                      type="email"
                      placeholder="Email address"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      required
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100"
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      required
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100"
                    />
                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs hover:bg-slate-800 transition-colors"
                    >
                      {authLoading ? 'Signing in...' : 'Sign In'}
                    </button>
                  </form>
                </div>

                {/* Register Form */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Register New Account
                  </h4>
                  <form onSubmit={handleEmailSignUp} className="space-y-3">
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      required
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100"
                    />
                    <input
                      type="email"
                      placeholder="Email address"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      required
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100"
                    />
                    <input
                      type="password"
                      placeholder="Create Password"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      required
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100"
                    />
                    <select
                      value={authRole}
                      onChange={(e) => setAuthRole(e.target.value as UserRole)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                    >
                      <option value="student">Student Account</option>
                      <option value="agent">Property Agent / Host</option>
                    </select>
                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors"
                    >
                      {authLoading ? 'Creating...' : 'Register Account'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {accountToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
            >
              <div className="flex items-center gap-3 text-rose-600">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">Delete Account Profile?</h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                This will remove <strong className="text-slate-900 dark:text-slate-100">{accountToDelete.name}</strong> ({accountToDelete.email}) from saved accounts.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleConfirmDeleteAccount}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors"
                >
                  Yes, Remove Account
                </button>
                <button
                  onClick={() => setAccountToDelete(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
