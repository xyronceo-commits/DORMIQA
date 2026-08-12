import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, UserRole } from '../types';
import { uploadFileToFirebaseStorage } from '../lib/firebase';
import { INITIAL_UNIVERSITIES } from '../data/mockData';
import { 
  X, UserCheck, LogOut, Trash2, Plus, ShieldCheck, UserPlus, 
  Mail, Phone, Building2, AlertTriangle, CheckCircle2, RefreshCw, KeyRound, User as UserIcon, ArrowRightLeft, Upload, Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const UserProfileModal: React.FC = () => {
  const { 
    user, 
    role, 
    logout, 
    isProfileModalOpen, 
    setProfileModalOpen, 
    savedAccounts, 
    switchAccount, 
    deleteAccount, 
    updateProfile,
    login,
    addToast,
    setAuthModalOpen,
    setAuthModalTab,
    setActiveView
  } = useAuth();

  React.useEffect(() => {
    if (isProfileModalOpen) {
      setActiveView('profile');
      setProfileModalOpen(false);
    }
  }, [isProfileModalOpen, setActiveView, setProfileModalOpen]);

  const [activeTab, setActiveTab] = useState<'profile' | 'accounts' | 'add_account'>('profile');

  // Edit Profile Form State
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

  if (!isProfileModalOpen) return null;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;
    if (user.isVerifiedAgent || user.agentPhotoUrl) {
      addToast('Profile Photo Locked 🔒', 'Verified Agent profile picture is set from your identity verification photo and cannot be edited.', 'warning');
      return;
    }
    const file = e.target.files[0];
    setAvatarUploading(true);
    addToast('Uploading Avatar...', 'Saving avatar to Firebase Storage', 'info');
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
    addToast('Profile Updated', 'Your profile details have been saved.');
  };

  const handleConfirmDeleteAccount = () => {
    if (!accountToDelete) return;
    
    const isCurrent = user?.id === accountToDelete.id;
    deleteAccount(accountToDelete.id);
    setAccountToDelete(null);
    setDeleteConfirmText('');

    if (isCurrent) {
      setProfileModalOpen(false);
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

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8"
        >
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white relative">
            <button
              onClick={() => setProfileModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <img
                  src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'}
                  alt={user?.name || 'User'}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-400 shadow-md"
                />
                {(user?.isVerifiedAgent || user?.agentPhotoUrl) && (
                  <div 
                    className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-amber-500 text-slate-950 rounded-md font-black text-[9px] shadow-md flex items-center gap-0.5 border border-slate-900 cursor-default"
                    title="Verified Agent Profile Picture (Non-editable for Trust & Safety)"
                  >
                    <ShieldCheck className="w-3 h-3" />
                    <span>LOCKED</span>
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-extrabold text-lg text-white truncate">{user?.name || 'Guest User'}</h2>
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {user?.role || role}
                  </span>
                </div>
                <p className="text-xs text-slate-300 truncate mt-0.5">{user?.email || 'Not logged in'}</p>
                {user?.phone && (
                  <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                    <Phone className="w-3 h-3 text-emerald-400" />
                    {user.phone}
                  </p>
                )}
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="flex gap-2 mt-6 border-b border-white/10 text-xs font-bold">
              <button
                onClick={() => setActiveTab('profile')}
                className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === 'profile'
                    ? 'border-emerald-400 text-emerald-300'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <UserIcon className="w-4 h-4" />
                Profile Settings
              </button>

              <button
                onClick={() => setActiveTab('accounts')}
                className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === 'accounts'
                    ? 'border-emerald-400 text-emerald-300'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <ArrowRightLeft className="w-4 h-4" />
                Saved Accounts ({savedAccounts.length})
              </button>

              <button
                onClick={() => setActiveTab('add_account')}
                className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === 'add_account'
                    ? 'border-emerald-400 text-emerald-300'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Plus className="w-4 h-4" />
                Add Account
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* TAB 1: Profile Settings */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                {!isEditing ? (
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        Account Details
                      </h3>
                      <button
                        onClick={() => {
                          setEditName(user?.name || '');
                          setEditEmail(user?.email || '');
                          setEditPhone(user?.phone || '');
                          setEditUni(user?.universityName || '');
                          setIsEditing(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                      >
                        Edit Profile
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400">Full Name</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{user?.name || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400">Email Address</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{user?.email || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400">Phone Contact</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{user?.phone || 'Not provided'}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400">Account Type</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 capitalize">{user?.role || role}</span>
                      </div>
                      <div className="sm:col-span-2 border-t border-slate-200/60 dark:border-slate-700/60 pt-2">
                        <span className="block text-[10px] uppercase font-bold text-slate-400">Primary Campus Choice</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{user?.universityName || 'Not specified'}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleUpdateProfileSubmit} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Update Profile Details</h3>
                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-semibold text-slate-900 dark:text-slate-100"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                        <input
                          type="email"
                          value={editEmail}
                          onChange={e => setEditEmail(e.target.value)}
                          className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-semibold text-slate-900 dark:text-slate-100"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                        <input
                          type="tel"
                          value={editPhone}
                          onChange={e => setEditPhone(e.target.value)}
                          className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-semibold text-slate-900 dark:text-slate-100"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">University of Choice</label>
                        <select
                          value={editUni}
                          onChange={e => setEditUni(e.target.value)}
                          className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-semibold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="">-- Select Your University Choice --</option>
                          {INITIAL_UNIVERSITIES.map(u => (
                            <option key={u.id} value={u.name}>
                              {u.name} ({u.shortName}) - {u.state} State
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                )}

                {/* Log Out & Delete Account Action Buttons */}
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">Account Actions</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        setProfileModalOpen(false);
                        logout();
                      }}
                      className="w-full py-3 px-4 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs hover:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center gap-2 transition-colors shadow-sm"
                    >
                      <LogOut className="w-4 h-4 text-emerald-400" />
                      Sign Out / Log Out
                    </button>

                    {user && (
                      <button
                        onClick={() => setAccountToDelete(user)}
                        className="w-full py-3 px-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 font-bold text-xs hover:bg-rose-100 dark:hover:bg-rose-900/60 flex items-center justify-center gap-2 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete This Account
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Saved Accounts / Account Switcher */}
            {activeTab === 'accounts' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
                      Saved Accounts on Device
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Switch between active accounts instantly or delete saved profiles.
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveTab('add_account')}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Account
                  </button>
                </div>

                <div className="space-y-2.5">
                  {savedAccounts.map(acc => {
                    const isCurrent = user?.id === acc.id;
                    return (
                      <div
                        key={acc.id}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          isCurrent
                            ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={acc.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'}
                            alt={acc.name}
                            className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-extrabold text-xs text-slate-900 dark:text-slate-100 truncate">{acc.name}</p>
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                {acc.role}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate">{acc.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isCurrent ? (
                            <span className="px-2.5 py-1 rounded-xl bg-emerald-500 text-white font-extrabold text-[10px] flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Active
                            </span>
                          ) : (
                            <button
                              onClick={() => switchAccount(acc.id)}
                              className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 font-bold text-xs"
                            >
                              Switch
                            </button>
                          )}

                          <button
                            onClick={() => setAccountToDelete(acc)}
                            className="p-2 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-950 text-rose-600 dark:text-rose-400 transition-colors"
                            title="Delete Account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: Add Account */}
            {activeTab === 'add_account' && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-emerald-600" />
                    Add Another Account
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Register or log into a new Student, Agent, or Admin account on Dormiqa.
                  </p>
                </div>

                <form onSubmit={handleAddAccountSubmit} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Account Role / Type
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setAddAccountRole('student')}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                          addAccountRole === 'student'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        Student
                      </button>

                      <button
                        type="button"
                        onClick={() => setAddAccountRole('agent')}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                          addAccountRole === 'agent'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        Property Agent
                      </button>

                      <button
                        type="button"
                        onClick={() => setAddAccountRole('admin')}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                          addAccountRole === 'admin'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        Admin
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={addAccountEmail}
                      onChange={e => setAddAccountEmail(e.target.value)}
                      placeholder="e.g. user@unilag.edu.ng or agent@dormiqa.africa"
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-semibold text-xs text-slate-900 dark:text-slate-100"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Full Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={addAccountName}
                      onChange={e => setAddAccountName(e.target.value)}
                      placeholder="e.g. Adebayo Ogunlesi"
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-semibold text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div className="pt-2 flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileModalOpen(false);
                        setAuthModalTab(addAccountRole === 'agent' ? 'agent_signup' : addAccountRole === 'admin' ? 'admin_login' : 'student_signup');
                        setAuthModalOpen(true);
                      }}
                      className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                    >
                      Open Full Registration Form
                    </button>

                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-extrabold text-xs hover:bg-emerald-700 shadow-md"
                    >
                      Create & Switch Account
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </motion.div>

        {/* Delete Confirmation Modal Overlay */}
        <AnimatePresence>
          {accountToDelete && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-rose-300 dark:border-rose-900 shadow-2xl space-y-4"
              >
                <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                  <div className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-950">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">Delete Account</h3>
                    <p className="text-xs text-slate-500">This action cannot be undone.</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                  <p className="font-bold text-rose-700 dark:text-rose-300">
                    Deleting account for {accountToDelete.name} ({accountToDelete.email})
                  </p>
                  <p className="text-[11px] text-slate-500">
                    All associated inspection appointments, saved hostels, and profile records on this device will be permanently removed.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    To confirm deletion, type <span className="text-rose-600 font-extrabold">DELETE</span> below:
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={e => setDeleteConfirmText(e.target.value)}
                    placeholder="Type DELETE"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs uppercase text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => {
                      setAccountToDelete(null);
                      setDeleteConfirmText('');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={deleteConfirmText.trim().toUpperCase() !== 'DELETE'}
                    onClick={handleConfirmDeleteAccount}
                    className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all ${
                      deleteConfirmText.trim().toUpperCase() === 'DELETE'
                        ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-md'
                        : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    Permanently Delete
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
};
