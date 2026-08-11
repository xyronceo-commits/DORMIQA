import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { INITIAL_UNIVERSITIES } from '../data/mockData';
import { 
  User as UserIcon, LogOut, Trash2, Plus, Check, ShieldCheck, Mail, Phone, 
  GraduationCap, Building2, Shield, AlertTriangle, Key, RefreshCw, X, UserPlus,
  CheckCircle2, Edit3, Save, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const UserProfileSection: React.FC = () => {
  const { 
    user, 
    logout, 
    savedAccounts, 
    switchAccount, 
    deleteAccount, 
    updateProfile,
    setAuthModalOpen,
    setAuthModalTab,
    resendVerificationEmail,
    checkVerificationStatus,
    openVerificationModal,
    addToast
  } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [editUni, setEditUni] = useState(user?.universityName || '');

  // Delete Account Confirmation Modal State
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: editName,
      phone: editPhone,
      email: editEmail,
      universityName: editUni
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      
      {/* 1. Active Profile Card Header */}
      {user ? (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'}
                  alt={user.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-emerald-500 shadow-md"
                />
                <span className="absolute -bottom-1 -right-1 p-1 rounded-lg bg-emerald-500 text-white shadow">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{user.name}</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 text-[10px] font-black uppercase tracking-wider">
                    {user.role}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> {user.email}
                  </p>
                  {user.emailVerified ? (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold flex items-center gap-1 border border-emerald-300 dark:border-emerald-800">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified Email
                    </span>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold flex items-center gap-1 border border-amber-300 dark:border-amber-800">
                        <AlertTriangle className="w-3 h-3 text-amber-600" /> Email Unverified
                      </span>
                      <button
                        type="button"
                        onClick={() => openVerificationModal(user.email)}
                        className="px-2 py-0.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold shadow-xs transition-colors cursor-pointer"
                      >
                        Verify Email Status
                      </button>
                    </div>
                  )}
                </div>
                {user.phone && (
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> {user.phone}
                  </p>
                )}
                {user.universityName && (
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold mt-1 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5" /> {user.universityName}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setEditName(user.name);
                  setEditPhone(user.phone || '');
                  setEditEmail(user.email);
                  setEditUni(user.universityName || '');
                  setIsEditing(!isEditing);
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" /> {isEditing ? 'Cancel Edit' : 'Edit Profile'}
              </button>

              <button
                onClick={logout}
                className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-700/60 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center gap-1.5 border border-slate-200 dark:border-slate-600 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>

              <button
                onClick={() => setIsDeletingAccount(true)}
                className="px-3.5 py-2 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors flex items-center gap-1.5 border border-rose-200 dark:border-rose-900/50 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Account
              </button>
            </div>
          </div>

          {/* Profile Edit Form */}
          <AnimatePresence>
            {isEditing && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleSaveProfile}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-4"
              >
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-500" /> Update Account Information
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={e => setEditEmail(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={e => setEditPhone(e.target.value)}
                      placeholder="+234 800 000 0000"
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">University / Primary Campus Choice</label>
                    <select
                      value={editUni}
                      onChange={e => setEditUni(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
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

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 flex items-center gap-1"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Changes
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
            <UserIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100">Guest Visitor Mode</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              You are currently browsing as guest. Sign in or add an account to save hostels, request physical inspections, or list properties.
            </p>
          </div>
          <button
            onClick={() => {
              setAuthModalTab('login');
              setAuthModalOpen(true);
            }}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-md"
          >
            Sign In / Add Account
          </button>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      <AnimatePresence>
        {isDeletingAccount && user && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 max-w-md w-full rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 relative"
            >
              <button
                onClick={() => setIsDeletingAccount(false)}
                className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 flex items-center justify-center">
                <Trash2 className="w-6 h-6" />
              </div>

              <div>
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100">
                  Delete Account permanently?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  You are about to permanently delete <strong className="text-slate-900 dark:text-slate-100">{user.name}</strong> ({user.email}).
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 space-y-1">
                <p className="font-bold">⚠️ Warning: This action cannot be undone.</p>
                <p className="text-[11px] text-rose-700 dark:text-rose-300/80">
                  All stored hostel bookmarks, inspection passes, and profile records associated with this account will be wiped.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDeletingAccount(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteAccount(user.id);
                    setIsDeletingAccount(false);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" /> Confirm & Delete Account
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
