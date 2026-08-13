import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Building2, ShieldCheck, Check, Save, User as UserIcon, Mail, Phone, GraduationCap } from 'lucide-react';

export const AmbassadorProfile: React.FC = () => {
  const { user, updateUserProfile, addNotification } = useAuth();

  const [name, setName] = useState<string>(user?.name || '');
  const [phone, setPhone] = useState<string>(user?.phone || '');
  const [bankName, setBankName] = useState<string>(user?.bankName || 'GTBank');
  const [accountNumber, setAccountNumber] = useState<string>(user?.accountNumber || '');
  const [accountName, setAccountName] = useState<string>(user?.accountName || user?.name || '');
  const [universityName, setUniversityName] = useState<string>(user?.universityName || 'University of Lagos (UNILAG)');
  const [saving, setSaving] = useState<boolean>(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateUserProfile({
        name,
        phone,
        bankName,
        accountNumber,
        accountName,
        universityName
      });
      addNotification({
        title: 'Profile Updated',
        message: 'Your ambassador profile and bank details have been saved.',
        type: 'info'
      });
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
      
      {/* Header */}
      <div className="pb-6 border-b border-slate-200 dark:border-slate-800 space-y-2">
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
          AMBASSADOR ACCOUNT & SETTINGS
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
          Profile & Bank Payout Details
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Configure your payment account information to receive direct local bank transfers.
        </p>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-8">
        
        {/* Personal Details */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-emerald-500" />
            <span>Ambassador Personal Information</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-semibold focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Email Address (Read-only)
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-slate-400 cursor-not-allowed font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+234 800 000 0000"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-semibold focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Primary Campus / University
              </label>
              <input
                type="text"
                value={universityName}
                onChange={(e) => setUniversityName(e.target.value)}
                placeholder="e.g. UNILAG, OAU, YABATECH"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-semibold focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Bank Account Details */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-500" />
              <span>Nigerian Bank Payout Setup</span>
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300">
              Direct Local Transfer
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Bank Name
              </label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-semibold focus:outline-none focus:border-emerald-500"
              >
                <option value="GTBank">Guaranty Trust Bank (GTBank)</option>
                <option value="Access Bank">Access Bank</option>
                <option value="Zenith Bank">Zenith Bank</option>
                <option value="First Bank">First Bank of Nigeria</option>
                <option value="UBA">United Bank for Africa (UBA)</option>
                <option value="Kuda Bank">Kuda Microfinance Bank</option>
                <option value="OPay">OPay Digital Services</option>
                <option value="Palmpay">PalmPay</option>
                <option value="Moniepoint">Moniepoint Microfinance Bank</option>
                <option value="Stanbic IBTC">Stanbic IBTC Bank</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Account Number (NUBAN)
              </label>
              <input
                type="text"
                maxLength={10}
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="0123456789"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Account Name
              </label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Matches bank account name"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-semibold focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center gap-2 shadow-lg disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Ambassador Settings'}</span>
          </button>
        </div>

      </form>

    </div>
  );
};
