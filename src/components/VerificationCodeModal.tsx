import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, CheckCircle2, AlertCircle, RefreshCw, Mail, ShieldCheck, ArrowRight } from 'lucide-react';
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
  const { addToast, user, setUser } = useAuth();

  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState<number>(600); // 10 minutes (600s)
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [resending, setResending] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [resendCooldown, setResendCooldown] = useState<number>(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Automatically request code if opened and timer not started
  useEffect(() => {
    if (isOpen && email) {
      handleSendVerificationCode(true);
    }
  }, [isOpen, email]);

  // Focus first input box on mount
  useEffect(() => {
    if (isOpen && !success) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 150);
    }
  }, [isOpen, success]);

  // Live countdown timer (10:00 -> 00:00)
  useEffect(() => {
    if (!isOpen || isExpired || success) return;

    if (timeLeft <= 0) {
      setIsExpired(true);
      setErrorMessage("This code has expired. Request a new code.");
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, timeLeft, isExpired, success]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleSendVerificationCode = async (initial = false) => {
    if (!email) return;
    if (!initial && resendCooldown > 0) return;

    setResending(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Failed to dispatch verification code.');
        if (!initial) {
          addToast('Code Dispatch Failed', data.error || 'Could not send verification code', 'error');
        }
        return;
      }

      // Reset state on code sent
      setTimeLeft(600); // 10 minutes
      setIsExpired(false);
      setDigits(['', '', '', '', '', '']);
      setResendCooldown(60); // 60s resend cooldown

      if (!initial) {
        addToast('Verification Code Sent', `A new 6-digit code was sent to ${email}`, 'success');
      }

      // Focus first input box
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    } catch (err: any) {
      setErrorMessage('Server connection error. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const handleDigitChange = (index: number, value: string) => {
    // Only allow numeric input
    const cleanValue = value.replace(/[^0-9]/g, '');
    if (!cleanValue && value !== '') return;

    const newDigits = [...digits];
    newDigits[index] = cleanValue.slice(-1); // keep last typed char
    setDigits(newDigits);
    setErrorMessage(null);

    // Auto-advance focus to next input
    if (cleanValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (!pastedData) return;

    const newDigits = ['', '', '', '', '', ''];
    for (let i = 0; i < pastedData.length; i++) {
      newDigits[i] = pastedData[i];
    }
    setDigits(newDigits);
    setErrorMessage(null);

    // Focus last filled digit or final box
    const nextFocusIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextFocusIndex]?.focus();
  };

  const handleVerifySubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = digits.join('');

    if (code.length !== 6) {
      setErrorMessage('Please enter all 6 digits of the code.');
      return;
    }

    if (isExpired) {
      setErrorMessage('This code has expired. Request a new code.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Incorrect code. Please check and try again.');
        if (data.expired) {
          setIsExpired(true);
        }
        return;
      }

      // Success
      setSuccess(true);
      addToast('Email Verified!', 'Your email address is now verified.', 'success');

      // Update user state if logged in
      if (user) {
        setUser({ ...user, emailVerified: true });
      }

      if (onSuccess) {
        onSuccess();
      }

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMessage('Verification server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Format timer string 10:00
  const minutes = Math.floor(Math.max(0, timeLeft) / 60).toString().padStart(2, '0');
  const seconds = (Math.max(0, timeLeft) % 60).toString().padStart(2, '0');
  const isFullCodeEntered = digits.every(d => d !== '');

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
              <div className="space-y-1 text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-2">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Verify your email
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  We've sent a 6-digit verification code to <span className="font-semibold text-slate-800 dark:text-slate-200">{email}</span>.
                </p>
              </div>

              {/* Error Message Display */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleVerifySubmit} className="space-y-5">
                {/* 6 Digit Input Boxes */}
                <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                  {digits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={el => (inputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleDigitChange(idx, e.target.value)}
                      onKeyDown={e => handleKeyDown(idx, e)}
                      onPaste={handlePaste}
                      disabled={loading || isExpired}
                      className={`w-10 h-12 sm:w-11 sm:h-12 text-center text-lg font-bold rounded-xl border transition-all ${
                        digit
                          ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-slate-900 dark:text-slate-100 shadow-sm'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:outline-none'
                      } ${isExpired ? 'border-rose-300 dark:border-rose-800 bg-rose-50/30 dark:bg-rose-950/20' : ''}`}
                    />
                  ))}
                </div>

                {/* Countdown Timer */}
                <div className="text-center">
                  {isExpired ? (
                    <p className="text-xs font-bold text-rose-600 dark:text-rose-400">
                      This code has expired. Request a new code.
                    </p>
                  ) : (
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Code expires in <span className="font-bold text-slate-800 dark:text-slate-200">{minutes}:{seconds}</span>
                    </p>
                  )}
                </div>

                {/* Resend Link */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => handleSendVerificationCode(false)}
                    disabled={resending || resendCooldown > 0}
                    className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline disabled:opacity-50 inline-flex items-center gap-1 transition-opacity"
                  >
                    {resending ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : null}
                    <span>
                      {resendCooldown > 0
                        ? `Resend code in ${resendCooldown}s`
                        : "Didn't receive it? Resend code"}
                    </span>
                  </button>
                </div>

                {/* Primary Action Button */}
                <button
                  type="submit"
                  disabled={loading || !isFullCodeEntered || isExpired}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Verify</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
