import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { submitReport } from '../lib/api';
import { X, AlertTriangle, ShieldAlert, Send, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ReportModal: React.FC = () => {
  const { reportModalListing, setReportModalListing, user, addToast } = useAuth();

  const [reason, setReason] = useState<'fake_listing' | 'inaccurate_pricing' | 'unresponsive_agent' | 'misleading_photos' | 'fraud_attempt' | 'other'>('fake_listing');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!reportModalListing) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await submitReport({
        listingId: reportModalListing.id,
        listingTitle: reportModalListing.title,
        reporterId: user?.id || 'stud_anon',
        reporterName: user?.name || 'Student User',
        reason,
        details,
      });

      setIsSuccess(true);
      addToast('Report Submitted', 'Our trust & safety team will review this listing within 24 hours.', 'info');
      setTimeout(() => {
        setIsSuccess(false);
        setReportModalListing(null);
      }, 2000);
    } catch (err) {
      addToast('Error', 'Failed to submit report. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700 bg-rose-50/50 dark:bg-rose-950/20">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-5 h-5" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Report Accommodation
              </h3>
            </div>
            <button
              onClick={() => setReportModalListing(null)}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          {isSuccess ? (
            <div className="p-8 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100">Report Received</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Thank you for helping keep Dormiqa safe for African students.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Reporting <span className="font-semibold text-slate-900 dark:text-slate-100">{reportModalListing.title}</span> by agent <span className="font-semibold text-slate-900 dark:text-slate-100">{reportModalListing.agentName}</span>.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Reporting
                </label>
                <select
                  value={reason}
                  onChange={(e: any) => setReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-rose-500"
                >
                  <option value="fake_listing">Fake or Non-existent Property</option>
                  <option value="inaccurate_pricing">Inaccurate or Hidden Rent Costs</option>
                  <option value="misleading_photos">Photos don't match actual room</option>
                  <option value="unresponsive_agent">Agent Asking for Money Before Inspection</option>
                  <option value="fraud_attempt">Suspected Scam / Fraud Attempt</option>
                  <option value="other">Other Issue</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Additional Details
                </label>
                <textarea
                  rows={3}
                  required
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Please describe what happened or why this listing should be reviewed..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 mt-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Security Report
                  </>
                )}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
