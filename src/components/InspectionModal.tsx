import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { bookInspection } from '../lib/api';
import { saveInspectionToFirestore } from '../lib/firebase';
import { X, Calendar, Clock, MapPin, User, ShieldCheck, CheckCircle, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const InspectionModal: React.FC = () => {
  const { inspectionModalListing, setInspectionModalListing, user, addToast } = useAuth();

  const [date, setDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    return tomorrow.toISOString().split('T')[0];
  });
  const [timeSlot, setTimeSlot] = useState('11:00 AM');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!inspectionModalListing) return null;

  const timeSlots = ['09:00 AM', '11:00 AM', '01:30 PM', '03:30 PM', '05:00 PM'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const bookingData = {
        id: `insp_${Date.now()}`,
        listingId: inspectionModalListing.id,
        listingTitle: inspectionModalListing.title,
        listingImage: inspectionModalListing.images[0],
        studentId: user?.id || '',
        studentName: user?.name || '',
        studentPhone: user?.phone || '',
        studentEmail: user?.email || '',
        agentId: inspectionModalListing.agentId,
        agentName: inspectionModalListing.agentName,
        agentPhone: inspectionModalListing.agentPhone,
        date,
        timeSlot,
        note,
        status: 'pending' as const,
        createdAt: new Date().toISOString()
      };

      await bookInspection(bookingData);
      await saveInspectionToFirestore(bookingData);

      setIsSuccess(true);
      addToast('Inspection Scheduled! 📅', `Booked for ${date} at ${timeSlot}. Saved to Firebase database.`);
      setTimeout(() => {
        setIsSuccess(false);
        setInspectionModalListing(null);
      }, 2500);
    } catch (err) {
      addToast('Error', 'Failed to book inspection. Please try again.', 'error');
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
          className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Book Property Inspection
              </h3>
            </div>
            <button
              onClick={() => setInspectionModalListing(null)}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          {isSuccess ? (
            <div className="p-8 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100">Inspection Request Sent!</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md">
                Your request for <span className="font-semibold">{inspectionModalListing.title}</span> has been sent to verified agent <span className="font-semibold">{inspectionModalListing.agentName}</span>.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
              {/* Listing Card Summary */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80">
                <img
                  src={inspectionModalListing.images[0]}
                  alt={inspectionModalListing.title}
                  className="w-16 h-16 rounded-lg object-cover shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-sm line-clamp-1">
                    {inspectionModalListing.title}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 shrink-0" />
                    {inspectionModalListing.universityName} • {inspectionModalListing.campus}
                  </p>
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                    {inspectionModalListing.currency}{new Intl.NumberFormat().format(inspectionModalListing.price)} / {inspectionModalListing.pricePeriod}
                  </p>
                </div>
              </div>

              {/* Agent Note */}
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Physical inspection with verified agent {inspectionModalListing.agentName}. Standard agent inspection fee applies upon viewing.</span>
              </div>

              {/* Date & Time Select */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Inspection Date
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Preferred Time Slot
                  </label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500"
                  >
                    {timeSlots.map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Note input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Note to Agent (Optional)
                </label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g., I'm coming with a friend or I'd like to check room 3 specifically..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 mt-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Confirm Inspection Request
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
