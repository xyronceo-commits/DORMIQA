import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateFirestoreUserProfile, checkFirebaseEmailVerified } from '../lib/firebase';
import { INITIAL_UNIVERSITIES } from '../data/mockData';
import { User as UserType } from '../types';
import { 
  X, Lock, Mail, User as UserIcon, Phone, Building2, GraduationCap, ArrowRight, ShieldCheck, 
  CheckCircle, FileText, Upload, CheckCircle2, Shield, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AuthModal: React.FC = () => {
  const { 
    isAuthModalOpen, 
    setAuthModalOpen, 
    authModalTab, 
    setAuthModalTab, 
    login, 
    loginGoogleOAuth,
    signUpEmailFirebase,
    signInEmailFirebase,
    resetPasswordFirebase,
    resendVerificationEmail,
    checkVerificationStatus,
    addToast,
    user,
    setUser,
    setSelectedUniversity,
    setActiveView
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [universityId, setUniversityId] = useState(INITIAL_UNIVERSITIES[0].id);
  
  // Agent Business & CAC / ID Verification Fields
  const [businessName, setBusinessName] = useState('');
  const [docType, setDocType] = useState<'cac' | 'nin' | 'voter' | 'driver' | 'passport'>('cac');
  const [docNumber, setDocNumber] = useState('');
  const [officeAddress, setOfficeAddress] = useState('');
  const [uploadedDocName, setUploadedDocName] = useState<string | null>(null);

  // Sign In Role Selector state
  const [loginRole, setLoginRole] = useState<'student' | 'agent'>('student');
  const [googleRole, setGoogleRole] = useState<'student' | 'agent'>('student');

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  // Populate user data into fields when Google Onboarding tab is active
  useEffect(() => {
    if (authModalTab === 'google_onboarding' && user) {
      if (user.name) setName(user.name);
      if (user.email) setEmail(user.email);
      if (user.phone) setPhone(user.phone);
      if (user.universityId) setUniversityId(user.universityId);
      if (user.businessName) setBusinessName(user.businessName);
      if (user.officeAddress) setOfficeAddress(user.officeAddress);
      if (user.role === 'agent') setGoogleRole('agent');
      else setGoogleRole('student');
    }
  }, [authModalTab, user]);

  // Firebase Email Link Verification State
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [resendingEmail, setResendingEmail] = useState<boolean>(false);
  const [checkingVerification, setCheckingVerification] = useState<boolean>(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verificationSuccess, setVerificationSuccess] = useState<boolean>(false);

  // Resend cooldown timer (60s)
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Automatic periodic reload and check for email verification while modal is open
  useEffect(() => {
    if (authModalTab !== 'email_verification_sent' || verificationSuccess) return;

    const interval = setInterval(async () => {
      try {
        const isVerified = await checkFirebaseEmailVerified();
        if (isVerified) {
          setVerificationSuccess(true);
          if (user) {
            setUser({ ...user, emailVerified: true });
            if (user.role === 'student') setActiveView('search');
            else if (user.role === 'agent') setActiveView('agent_dashboard');
            else if (user.role === 'admin') setActiveView('admin_dashboard');
          }
          addToast('Email Verified! ✅', 'Your account email is verified.', 'success');
          setTimeout(() => {
            setAuthModalOpen(false);
          }, 1200);
        }
      } catch (err) {
        // silent check during polling
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [authModalTab, verificationSuccess, user, setActiveView, setAuthModalOpen, addToast]);

  const handleResendVerificationEmail = async () => {
    if (resendCooldown > 0 || resendingEmail) return;
    setResendingEmail(true);
    setVerificationError(null);
    try {
      await resendVerificationEmail();
      setResendCooldown(60);
    } catch (err: any) {
      setVerificationError(err?.message || 'Unable to resend verification email.');
    } finally {
      setResendingEmail(false);
    }
  };

  const handleIVerifiedMyEmail = async () => {
    setCheckingVerification(true);
    setVerificationError(null);
    try {
      const isVerified = await checkFirebaseEmailVerified();
      if (isVerified) {
        setVerificationSuccess(true);
        if (user) {
          setUser({ ...user, emailVerified: true });
          if (user.role === 'student') setActiveView('search');
          else if (user.role === 'agent') setActiveView('agent_dashboard');
          else if (user.role === 'admin') setActiveView('admin_dashboard');
        }
        addToast('Email Verified! ✅', 'Your account email is verified.', 'success');
        setTimeout(() => {
          setAuthModalOpen(false);
        }, 1200);
      } else {
        setVerificationError("Your email hasn't been verified yet. Please click the verification link sent to your email.");
      }
    } catch (err: any) {
      setVerificationError("Unable to verify status. Please try again.");
    } finally {
      setCheckingVerification(false);
    }
  };

  if (!isAuthModalOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedDocName(file.name);
      addToast('Document Uploaded', `${file.name} ready for verification`, 'info');
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      let role: 'student' | 'agent' | 'admin' = 'student';
      if (authModalTab === 'agent_signup') role = 'agent';
      else if (authModalTab === 'admin_login') role = 'admin';
      else if (authModalTab === 'login') role = loginRole;
      else role = 'student';

      await loginGoogleOAuth(role);
    } catch (err) {
      console.error('Google Auth Error:', err);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (authModalTab === 'google_onboarding') {
        const chosenUni = INITIAL_UNIVERSITIES.find(u => u.id === universityId) || INITIAL_UNIVERSITIES[0];
        const updates: Partial<UserType> = {
          name: name.trim() || user?.name || 'Dormiqa User',
          role: googleRole,
          universityId: chosenUni.id,
          universityName: chosenUni.name,
          phone: phone.trim() || user?.phone || '',
          ...(googleRole === 'agent' ? {
            businessName: businessName.trim() || 'Dormiqa Housing Agent',
            officeAddress: officeAddress.trim() || 'Campus Gate Complex',
            isVerifiedAgent: user?.isVerifiedAgent ?? true,
            verificationStatus: user?.verificationStatus ?? 'verified',
          } : {})
        };

        if (user) {
          await updateFirestoreUserProfile(user.id, updates);
          const updatedUser: UserType = { ...user, ...updates };
          setUser(updatedUser);
          setSelectedUniversity(chosenUni);
          addToast('Profile Setup Complete! 🎉', `Welcome to Dormiqa, ${updatedUser.name}!`, 'success');
          setAuthModalOpen(false);

          if (googleRole === 'student') setActiveView('search');
          else if (googleRole === 'agent') {
            if (!updatedUser.isVerifiedAgent) setActiveView('agent_verification');
            else setActiveView('agent_dashboard');
          } else if (googleRole === 'admin') {
            setActiveView('admin_dashboard');
          }
        }
      } else if (authModalTab === 'forgot_password') {
        await resetPasswordFirebase(email);
        setForgotSent(true);
      } else if (authModalTab === 'agent_signup') {
        await signUpEmailFirebase(email, password, name || 'Property Agent', 'agent', {
          phone,
          isVerifiedAgent: false,
          verificationStatus: 'none'
        });
      } else if (authModalTab === 'admin_login') {
        await signInEmailFirebase(email, password);
      } else if (authModalTab === 'login') {
        await signInEmailFirebase(email, password);
      } else {
        await signUpEmailFirebase(email, password, name || 'Student User', 'student', {
          phone,
          universityId
        });
      }
    } catch (err: any) {
      console.error('Submit Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[95] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 my-auto max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-black text-white font-black flex items-center justify-center text-base shadow-sm">
                D
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  {authModalTab === 'login' && 'Sign In to Dormiqa'}
                  {authModalTab === 'student_signup' && 'Student Account Sign Up'}
                  {authModalTab === 'agent_signup' && 'Property Agent Sign Up'}
                  {authModalTab === 'admin_login' && 'Admin Console Sign In'}
                  {authModalTab === 'forgot_password' && 'Reset Account Password'}
                  {authModalTab === 'email_verification_sent' && 'Verify Your Email Address'}
                  {authModalTab === 'google_onboarding' && 'Complete Your Profile Information'}
                </h3>
                <p className="text-[11px] text-neutral-500">
                  {authModalTab === 'google_onboarding'
                    ? 'Fill in your name, school, and contact details after Google sign-in'
                    : authModalTab === 'agent_signup'
                      ? 'Create an agent account (Business Verification follows)'
                      : 'Verified Student Housing Portal'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setAuthModalOpen(false)}
              className="p-1.5 rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Role Tab Selector */}
          {authModalTab !== 'forgot_password' && authModalTab !== 'email_verification_sent' && authModalTab !== 'google_onboarding' && (
            <div className="flex border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-950 text-xs font-bold shrink-0">
              <button
                onClick={() => setAuthModalTab('student_signup')}
                className={`flex-1 py-3 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                  authModalTab === 'student_signup'
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-neutral-900'
                    : 'border-transparent text-neutral-500 hover:text-neutral-800'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" /> Student
              </button>
              <button
                onClick={() => setAuthModalTab('agent_signup')}
                className={`flex-1 py-3 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                  authModalTab === 'agent_signup'
                    ? 'border-black dark:border-white text-black dark:text-white bg-white dark:bg-neutral-900'
                    : 'border-transparent text-neutral-500 hover:text-neutral-800'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" /> Agent / CAC
              </button>
              <button
                onClick={() => setAuthModalTab('login')}
                className={`flex-1 py-3 text-center border-b-2 transition-colors ${
                  authModalTab === 'login'
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-neutral-900'
                    : 'border-transparent text-neutral-500 hover:text-neutral-800'
                }`}
              >
                Sign In
              </button>
            </div>
          )}

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
            {/* Google OAuth Button */}
            {authModalTab !== 'forgot_password' && authModalTab !== 'email_verification_sent' && authModalTab !== 'google_onboarding' && (
              <div className="space-y-3 pb-2 border-b border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                  className="w-full py-3 px-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 text-slate-800 dark:text-slate-100 font-bold text-xs flex items-center justify-center gap-2.5 transition-all shadow-xs"
                >
                  {googleLoading ? (
                    <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>
                        {authModalTab === 'student_signup' && 'Sign Up as Student with Google'}
                        {authModalTab === 'agent_signup' && 'Sign Up as Agent with Google'}
                        {authModalTab === 'admin_login' && 'Sign In as Admin with Google'}
                        {authModalTab === 'login' && `Sign In as ${loginRole === 'agent' ? 'Agent' : 'Student'} with Google`}
                      </span>
                    </>
                  )}
                </button>
                <div className="relative text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                  </div>
                  <span className="relative bg-white dark:bg-slate-800 px-3 text-[10px] uppercase font-black text-slate-400">
                    Or sign in with email
                  </span>
                </div>
              </div>
            )}

            {authModalTab === 'google_onboarding' ? (
              <div className="space-y-4 py-1">
                {/* Google Email Verified Badge */}
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-xs">
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Google OAuth Verified</p>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{user?.email || email}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                  </span>
                </div>

                {/* Account Type Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Account Type / Role
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setGoogleRole('student')}
                      className={`p-2.5 rounded-xl border-2 font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                        googleRole === 'student'
                          ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <GraduationCap className="w-4 h-4 text-emerald-600" />
                      <span>Student Scholar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setGoogleRole('agent')}
                      className={`p-2.5 rounded-xl border-2 font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                        googleRole === 'agent'
                          ? 'border-black dark:border-white bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Building2 className="w-4 h-4 text-indigo-600" />
                      <span>Property Agent</span>
                    </button>
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Full Legal Name
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Tunde Bakare"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Primary Campus / School / University Choice */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Primary Campus / School / University Choice
                  </label>
                  <div className="relative">
                    <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      value={universityId}
                      onChange={(e) => setUniversityId(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                    >
                      {INITIAL_UNIVERSITIES.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.shortName}) - {u.state} State</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    WhatsApp / Contact Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +234 803 123 4567"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Agent specific fields */}
                {googleRole === 'agent' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Agency / Business Name
                      </label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          placeholder="e.g. Prime Student Housing Properties Ltd"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Office Address / Campus Location
                      </label>
                      <div className="relative">
                        <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={officeAddress}
                          onChange={(e) => setOfficeAddress(e.target.value)}
                          placeholder="e.g. Suite 4, University Commercial Gate Complex"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Save & Continue Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 mt-3"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Save Profile & Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            ) : authModalTab === 'email_verification_sent' ? (
              <div className="space-y-5 py-2">
                {verificationSuccess ? (
                  <div className="text-center space-y-3 py-6">
                    <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        Email Verified!
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Thank you for confirming <span className="font-semibold text-slate-800 dark:text-slate-200">{email || user?.email}</span>.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-center space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                        <Mail className="w-6 h-6" />
                      </div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        Verify your email
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                        We've sent a verification link to <span className="font-semibold text-slate-800 dark:text-slate-200">{email || user?.email || 'your email'}</span>. Please check your inbox and click the link to verify your account.
                      </p>
                    </div>

                    {verificationError && (
                      <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                        <span>{verificationError}</span>
                      </div>
                    )}

                    <div className="space-y-2.5 pt-2">
                      <button
                        type="button"
                        onClick={handleIVerifiedMyEmail}
                        disabled={checkingVerification}
                        className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 disabled:opacity-50"
                      >
                        {checkingVerification ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>I've verified my email</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleResendVerificationEmail}
                        disabled={resendingEmail || resendCooldown > 0}
                        className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {resendingEmail ? (
                          <div className="w-3.5 h-3.5 border-2 border-slate-600 dark:border-slate-300 border-t-transparent rounded-full animate-spin" />
                        ) : null}
                        <span>
                          {resendCooldown > 0
                            ? `Resend verification email in ${resendCooldown}s`
                            : 'Resend verification email'}
                        </span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : authModalTab === 'forgot_password' && forgotSent ? (
              <div className="text-center space-y-3 py-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100">Check Your Email</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  We've sent password reset instructions to <span className="font-semibold text-slate-800 dark:text-slate-200">{email}</span>.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setForgotSent(false);
                    setAuthModalTab('login');
                  }}
                  className="text-xs font-bold text-indigo-600 hover:underline"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <>
                {/* Account Type Differentiation for Sign In */}
                {authModalTab === 'login' && (
                  <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                        Sign In Account Type:
                      </span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${loginRole === 'agent' ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'}`}>
                        {loginRole === 'agent' ? 'Agent / Landlord' : 'Student Account'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setLoginRole('student')}
                        className={`p-2.5 rounded-xl border-2 font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                          loginRole === 'student'
                            ? 'border-emerald-600 bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 shadow-xs'
                            : 'border-transparent bg-slate-200/60 dark:bg-slate-800/60 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        <GraduationCap className="w-4 h-4 text-emerald-600" />
                        <span>Student Sign In</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setLoginRole('agent')}
                        className={`p-2.5 rounded-xl border-2 font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                          loginRole === 'agent'
                            ? 'border-indigo-600 bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-xs'
                            : 'border-transparent bg-slate-200/60 dark:bg-slate-800/60 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        <Building2 className="w-4 h-4 text-indigo-600" />
                        <span>Agent Sign In</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Full Name for Student or Agent */}
                {(authModalTab === 'student_signup' || authModalTab === 'agent_signup') && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Full Legal Name
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Tunde Bakare"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                )}

                {/* University Select for Student and Agent Signup */}
                {(authModalTab === 'student_signup' || authModalTab === 'agent_signup') && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Primary Campus / University Choice
                    </label>
                    <div className="relative">
                      <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <select
                        value={universityId}
                        onChange={(e) => setUniversityId(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                      >
                        {INITIAL_UNIVERSITIES.map(u => (
                          <option key={u.id} value={u.id}>{u.name} ({u.shortName}) - {u.state} State</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}



                {/* Email Field */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={authModalTab === 'admin_login' ? 'admin@dormiqa.africa' : 'user@university.edu'}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Phone for signup */}
                {(authModalTab === 'student_signup' || authModalTab === 'agent_signup') && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      WhatsApp Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. +234 803 123 4567"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                )}

                {/* Password Field */}
                {authModalTab !== 'forgot_password' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Password
                      </label>
                      {authModalTab === 'login' && (
                        <button
                          type="button"
                          onClick={() => setAuthModalTab('forgot_password')}
                          className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                        >
                          Forgot?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 mt-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>
                        {authModalTab === 'login' && (loginRole === 'agent' ? 'Sign In as Agent / Landlord' : 'Sign In as Student')}
                        {authModalTab === 'student_signup' && 'Proceed to Student Dashboard'}
                        {authModalTab === 'agent_signup' && 'Proceed to Agent Dashboard'}
                        {authModalTab === 'forgot_password' && 'Send Password Reset Email'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </>
            )}
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
