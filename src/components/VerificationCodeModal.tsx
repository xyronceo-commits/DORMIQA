import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { checkFirebaseEmailVerified } from '../lib/firebase';
import { X, CheckCircle2, AlertCircle, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface VerificationCodeModalProps {
  email: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const VerificationCodeModal: React.FC<VerificationCodeModalProps> = ({
  email,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { resendVerificationEmail, addToast, user, setUser } = useAuth();

  const [resending, setResending] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [resendCooldown, setResendCooldown] = useState<number>(0);

  // Resend cooldown timer (60s)
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Automatic periodic check for email verification while modal is open
  useEffect(() => {
    if (!isOpen || success) return;

    const interval = setInterval(async () => {
      try {
        const isVerified = await checkFirebaseEmailVerified();
        if (isVerified) {
          setSuccess(true);
          if (user) {
            setUser({ ...user, emailVerified: true });
          }
          addToast('Email Verified! ✅', 'Your account email is verified.', 'success');
          if (onSuccess) onSuccess();
          setTimeout(() => {
            onClose();
          }, 1200);
        }
      } catch (err) {
        // silent check during polling
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isOpen, success, user, onSuccess, onClose]);

  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;

    setResending(true);
    setErrorMessage(null);

    try {
      await resendVerificationEmail();
      setResendCooldown(60);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to resend verification email.');
    } finally {
      setResending(false);
    }
  };

  const handleCheckVerification = async () => {
    setChecking(true);
    setErrorMessage(null);

    try {
      const isVerified = await checkFirebaseEmailVerified();
      if (isVerified) {
        setSuccess(true);
        if (user) {
          setUser({ ...user, emailVerified: true });
        }
        addToast('Email Verified! ✅', 'Your account email is verified.', 'success');
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setErrorMessage("Your email hasn't been verified yet. Please check your inbox and click the link.");
      }
    } catch (err) {
      setErrorMessage('Unable to check verification status. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-hidden space-y-5"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Success Screen */}
          {success ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Email Verified!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Thank you for confirming <span className="font-semibold text-slate-800 dark:text-slate-200">{email}</span>.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="space-y-2 text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-1">
                  <Mail className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Verify your email
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                  We've sent a verification link to <span className="font-semibold text-slate-800 dark:text-slate-200">{email || 'your email'}</span>. Please check your inbox and click the link to verify your account.
                </p>
              </div>

              {/* Error Message Display */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleCheckVerification}
                  disabled={checking}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 disabled:opacity-50"
                >
                  {checking ? (
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
                  onClick={handleResend}
                  disabled={resending || resendCooldown > 0}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {resending ? (
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
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
