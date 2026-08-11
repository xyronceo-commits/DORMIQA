import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchStudentInspections, cancelInspection, fetchListings } from '../lib/api';
import { subscribeFirestoreInspections, subscribeFirestoreListings } from '../lib/firebase';
import { getGoogleCalendarUrl, downloadIcsFile } from '../lib/calendar';
import { InspectionBooking, Listing, RoommatePost } from '../types';
import { ListingCard } from './ListingCard';
import { UserProfileSection } from './UserProfileSection';
import { ReviewModal } from './ReviewModal';
import { 
  User, Bookmark, Calendar, Clock, MapPin, Phone, Mail, ShieldCheck, XCircle, 
  CheckCircle, ArrowRight, Zap, Droplets, Navigation, RefreshCw, Layers,
  Users, Calculator, QrCode, Plus, MessageSquare, GraduationCap, DollarSign,
  AlertCircle, Sparkles, Check, Share2, Filter, Building2, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const StudentDashboard: React.FC = () => {
  const { user, savedListingIds, setSelectedListing, openChatWithListing, addToast } = useAuth();

  const [activeTab, setActiveTab] = useState<'inspections' | 'saved_compare' | 'roommates' | 'calculator' | 'profile'>('inspections');
  const [inspections, setInspections] = useState<InspectionBooking[]>([]);
  const [savedListings, setSavedListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected Inspection for QR Inspection Pass Modal
  const [selectedPassInspection, setSelectedPassInspection] = useState<InspectionBooking | null>(null);

  // Review Modal State
  const [reviewModalListing, setReviewModalListing] = useState<Listing | null>(null);

  // Budget Calculator State
  const [calcRent, setCalcRent] = useState<number>(350000);
  const [calcAgentPercent, setCalcAgentPercent] = useState<number>(10);
  const [calcLegalPercent, setCalcLegalPercent] = useState<number>(10);
  const [calcCautionFee, setCalcCautionFee] = useState<number>(25000);
  const [calcMonthlyUtility, setCalcMonthlyUtility] = useState<number>(5000);

  // Roommate Posts State
  const [roommatePosts, setRoommatePosts] = useState<RoommatePost[]>([]);

  const [isPostingRoommate, setIsPostingRoommate] = useState(false);
  const [newRmDept, setNewRmDept] = useState('Accounting');
  const [newRmLevel, setNewRmLevel] = useState('200 Level');
  const [newRmGender, setNewRmGender] = useState<'Male' | 'Female'>('Female');
  const [newRmBudget, setNewRmBudget] = useState('200000');
  const [newRmLocation, setNewRmLocation] = useState('Keke Gate area');
  const [newRmType, setNewRmType] = useState('Self Contain Shared');
  const [newRmDesc, setNewRmDesc] = useState('');
  const [newRmPhone, setNewRmPhone] = useState(user?.phone || '+234 802 123 4567');

  const loadStudentData = async () => {
    setLoading(true);
    try {
      const insData = await fetchStudentInspections(user?.id || 'stud_current');
      setInspections(insData);

      if (savedListingIds.length > 0) {
        const allListings = await fetchListings({});
        setSavedListings(allListings.filter(l => savedListingIds.includes(l.id)));
      } else {
        setSavedListings([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudentData();

    let unSubIns: (() => void) | undefined;
    let unSubList: (() => void) | undefined;

    if (user?.id) {
      unSubIns = subscribeFirestoreInspections(user.id, false, (items) => {
        if (items && items.length > 0) setInspections(items);
      });
    }

    unSubList = subscribeFirestoreListings(() => {
      loadStudentData();
    });

    return () => {
      if (unSubIns) unSubIns();
      if (unSubList) unSubList();
    };
  }, [user, savedListingIds]);

  const handleCancelInspection = async (id: string) => {
    try {
      await cancelInspection(id);
      setInspections(prev => prev.map(i => i.id === id ? { ...i, status: 'cancelled' } : i));
      addToast('Inspection Cancelled', 'Your inspection request has been cancelled.');
    } catch (err) {
      addToast('Error', 'Failed to cancel inspection', 'error');
    }
  };

  const handleCreateRoommatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRmDesc) {
      addToast('Missing Info', 'Please describe what kind of roommate you are looking for', 'warning');
      return;
    }

    const post: RoommatePost = {
      id: `rm_${Date.now()}`,
      studentId: user?.id || 'stud_current',
      studentName: user?.name || 'Student Scholar',
      studentAvatar: user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      universityName: user?.universityName || 'University of Lagos (UNILAG)',
      department: newRmDept,
      level: newRmLevel,
      gender: newRmGender,
      budgetPerHead: Number(newRmBudget),
      location: newRmLocation,
      roomType: newRmType,
      description: newRmDesc,
      preferredQualities: ['Responsible', 'Clean', 'Peaceful'],
      contactPhone: newRmPhone,
      createdAt: 'Just now',
    };

    setRoommatePosts(prev => [post, ...prev]);
    setIsPostingRoommate(false);
    setNewRmDesc('');
    addToast('Roommate Post Published!', 'Your roommate request is now visible to other students.');
  };

  // Calculator Math
  const totalAgentFee = (calcRent * calcAgentPercent) / 100;
  const totalLegalFee = (calcRent * calcLegalPercent) / 100;
  const totalUpfrontCost = calcRent + totalAgentFee + totalLegalFee + calcCautionFee;
  const totalYearlyWithUtilities = totalUpfrontCost + (calcMonthlyUtility * 12);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* Top Email Confirmation Alert Banner */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500 text-slate-950 font-bold shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wide flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
              Check Email to Confirm Account
            </h4>
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-0.5">
              We sent a confirmation link to <span className="font-bold underline">{user?.email || 'your email'}</span>. Please check your inbox or spam folder to complete account verification.
            </p>
          </div>
        </div>

        <button
          onClick={() => addToast('Verification Email Resent', `A new confirmation link was dispatched to ${user?.email}`, 'info')}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shrink-0 transition-colors shadow-sm"
        >
          Resend Email Link
        </button>
      </div>

      {/* Student Top Hero Banner - Emerald & Dark Blue Accent */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white shadow-xl border border-slate-700/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'}
            alt=""
            className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-400 shadow-md"
          />
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-extrabold border border-emerald-500/30 mb-1.5">
              <GraduationCap className="w-3.5 h-3.5" /> Student Accommodation Portal
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold">{user?.name || 'Student Inspector'}</h1>
            <p className="text-xs text-slate-300 mt-0.5">{user?.email} • {user?.universityName || 'Higher Education Student'}</p>
          </div>
        </div>

        {/* Quick Stats Badges */}
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <div className="px-4 py-3 rounded-2xl bg-slate-800/90 border border-slate-700/80 text-center shadow-inner">
            <span className="block text-[11px] text-slate-400 font-semibold">Bookmarked Hostels</span>
            <span className="text-xl font-black text-emerald-400">{savedListingIds.length}</span>
          </div>
          <div className="px-4 py-3 rounded-2xl bg-slate-800/90 border border-slate-700/80 text-center shadow-inner">
            <span className="block text-[11px] text-slate-400 font-semibold">Active Inspections</span>
            <span className="text-xl font-black text-sky-400">{inspections.length}</span>
          </div>
          <div className="px-4 py-3 rounded-2xl bg-slate-800/90 border border-slate-700/80 text-center shadow-inner">
            <span className="block text-[11px] text-slate-400 font-semibold">Roommate Posts</span>
            <span className="text-xl font-black text-indigo-400">{roommatePosts.length}</span>
          </div>
        </div>
      </div>

      {/* Student Navigation Tab Bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-slate-200 dark:border-slate-800 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('inspections')}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'inspections'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Scheduled Inspections ({inspections.length})
        </button>

        <button
          onClick={() => setActiveTab('saved_compare')}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'saved_compare'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          Hostel Comparison Matrix ({savedListings.length})
        </button>

        <button
          onClick={() => setActiveTab('roommates')}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'roommates'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          Roommate Finder Hub
        </button>

        <button
          onClick={() => setActiveTab('calculator')}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'calculator'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Calculator className="w-4 h-4" />
          1st-Year Rent Calculator
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'profile'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <User className="w-4 h-4" />
          Profile & Accounts
        </button>
      </div>

      {/* Tab 1: Scheduled Inspections */}
      {activeTab === 'inspections' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                Your Hostel Inspection Appointments
              </h3>
              <p className="text-xs text-slate-500">
                Show your digital inspection pass to the agent upon physical viewing at the hostel site.
              </p>
            </div>
            <button
              onClick={loadStudentData}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh List
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading inspection bookings...</div>
          ) : inspections.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-3">
              <Calendar className="w-12 h-12 text-slate-400 mx-auto" />
              <h4 className="font-bold text-base text-slate-800 dark:text-slate-200">No Inspections Booked Yet</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Explore hostels around your campus, select a convenient date, and click "Book Physical Inspection" to arrange a viewing with verified agents.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {inspections.map(ins => (
                <div
                  key={ins.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4 relative overflow-hidden"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={ins.listingImage}
                      alt={ins.listingTitle}
                      className="w-20 h-20 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          ins.status === 'confirmed'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300'
                            : ins.status === 'pending'
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300'
                            : ins.status === 'completed'
                            ? 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300'
                            : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                        }`}>
                          ● {ins.status}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">{ins.id}</span>
                      </div>

                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">
                        {ins.listingTitle}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        {ins.date} @ {ins.timeSlot}
                      </p>
                    </div>
                  </div>

                  {/* Agent Contact & Calendar Sync Card */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Agent: {ins.agentName}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            openChatWithListing({
                              id: ins.listingId,
                              title: ins.listingTitle,
                              agentId: ins.agentId,
                              agentName: ins.agentName,
                            });
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors flex items-center gap-1 text-[11px]"
                        >
                          <MessageSquare className="w-3 h-3 text-emerald-400" /> Chat Live
                        </button>
                        <a
                          href={`https://wa.me/${ins.agentPhone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(ins.agentName)},%20I%20have%20an%20inspection%20booked%20for%20${encodeURIComponent(ins.listingTitle)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1 text-[11px]"
                        >
                          <Phone className="w-3 h-3" /> WhatsApp
                        </a>
                      </div>
                    </div>

                    {/* Google Calendar & .ics Sync Row */}
                    <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 border-t border-slate-200/50 dark:border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-emerald-500" /> Calendar Sync
                      </span>
                      <div className="flex items-center gap-1.5">
                        <a
                          href={getGoogleCalendarUrl({
                            title: ins.listingTitle,
                            description: `Hostel Inspection with Agent ${ins.agentName}. Phone: ${ins.agentPhone}`,
                            location: ins.listingTitle,
                            startDate: ins.date,
                            timeSlot: ins.timeSlot,
                          })}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 text-[10px] font-extrabold flex items-center gap-1"
                        >
                          + Google Calendar
                        </a>
                        <button
                          onClick={() => {
                            downloadIcsFile({
                              title: ins.listingTitle,
                              description: `Hostel Inspection with Agent ${ins.agentName}. Phone: ${ins.agentPhone}`,
                              location: ins.listingTitle,
                              startDate: ins.date,
                              timeSlot: ins.timeSlot,
                            });
                          }}
                          className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 text-[10px] font-extrabold"
                        >
                          Download .ics
                        </button>
                      </div>
                    </div>

                    {ins.note && <p className="text-slate-500 dark:text-slate-400 text-[11px] italic">"{ins.note}"</p>}
                  </div>

                  {/* Pass Button & Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedPassInspection(ins)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 text-xs font-bold flex items-center gap-1.5"
                      >
                        <QrCode className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        Digital Pass
                      </button>

                      <button
                        onClick={async () => {
                          const allListings = await fetchListings({});
                          const found = allListings.find(l => l.id === ins.listingId) || {
                            id: ins.listingId,
                            title: ins.listingTitle,
                            agentId: ins.agentId,
                            agentName: ins.agentName,
                            ratings: { security: 5, water: 5, electricity: 5, internet: 5, cleanliness: 5, noise: 5, value: 5, overall: 5, count: 1 }
                          } as Listing;
                          setReviewModalListing(found);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100 text-xs font-bold flex items-center gap-1.5 border border-amber-200 dark:border-amber-800"
                      >
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        Rate & Review
                      </button>
                    </div>

                    {ins.status !== 'cancelled' && ins.status !== 'completed' && (
                      <button
                        onClick={() => handleCancelInspection(ins.id)}
                        className="text-xs text-rose-500 hover:text-rose-700 font-semibold flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Cancel Request
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Compare Saved Hostels */}
      {activeTab === 'saved_compare' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600" />
                Side-by-Side Hostel Comparison
              </h3>
              <p className="text-xs text-slate-500">
                Compare power stability, water availability, price, and walk time before making your final deposit.
              </p>
            </div>
          </div>

          {savedListings.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-3">
              <Bookmark className="w-12 h-12 text-slate-400 mx-auto" />
              <h4 className="font-bold text-base text-slate-800 dark:text-slate-200">No Saved Hostels to Compare</h4>
              <p className="text-xs text-slate-500">
                Click the bookmark heart/star icon on any hostel card while searching to add properties to this comparative table.
              </p>
            </div>
          ) : (
            <>
              {/* Compare Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
                <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200 border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                      <th className="p-4 font-bold text-slate-400 uppercase tracking-wider text-[10px] w-48">Property Metric</th>
                      {savedListings.map(l => (
                        <th key={l.id} className="p-4 font-extrabold text-slate-900 dark:text-slate-100 min-w-[200px]">
                          {l.title}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                    <tr>
                      <td className="p-4 font-semibold text-slate-500">Annual Rent Price</td>
                      {savedListings.map(l => (
                        <td key={l.id} className="p-4 font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                          {l.currency}{new Intl.NumberFormat().format(l.price)} / yr
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold text-slate-500">Walk Time to Gate</td>
                      {savedListings.map(l => (
                        <td key={l.id} className="p-4 font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                          <Navigation className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          {l.distanceToCampusMinutes} mins ({l.distanceToCampusKm} km)
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold text-slate-500">Power / Electricity Rating</td>
                      {savedListings.map(l => (
                        <td key={l.id} className="p-4 font-bold text-amber-500 flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5" /> {l.ratings.electricity} / 5
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold text-slate-500">Water Supply Rating</td>
                      {savedListings.map(l => (
                        <td key={l.id} className="p-4 font-bold text-sky-500 flex items-center gap-1">
                          <Droplets className="w-3.5 h-3.5" /> {l.ratings.water} / 5
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold text-slate-500">Security Score</td>
                      {savedListings.map(l => (
                        <td key={l.id} className="p-4 font-bold text-indigo-500 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" /> {l.ratings.security} / 5
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold text-slate-500">Available Vacancies</td>
                      {savedListings.map(l => (
                        <td key={l.id} className="p-4 font-bold">
                          {l.availableRooms} of {l.totalRooms} rooms left
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Grid Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                {savedListings.map(l => (
                  <ListingCard key={l.id} listing={l} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab 3: Roommate Finder Hub */}
      {activeTab === 'roommates' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-indigo-50 dark:bg-indigo-950/40 p-5 rounded-2xl border border-indigo-200 dark:border-indigo-800">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Dormiqa Student Co-Living & Roommate Match
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Split rent expenses with fellow verified students at your campus.
              </p>
            </div>
            <button
              onClick={() => setIsPostingRoommate(!isPostingRoommate)}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" /> Post Roommate Request
            </button>
          </div>

          {/* New Post Form */}
          <AnimatePresence>
            {isPostingRoommate && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleCreateRoommatePost}
                className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md space-y-4"
              >
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                  Create Roommate Request Post
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Department</label>
                    <input
                      type="text"
                      value={newRmDept}
                      onChange={e => setNewRmDept(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Academic Level</label>
                    <select
                      value={newRmLevel}
                      onChange={e => setNewRmLevel(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-100"
                    >
                      <option value="100 Level">100 Level (Freshman)</option>
                      <option value="200 Level">200 Level</option>
                      <option value="300 Level">300 Level</option>
                      <option value="400 Level">400 Level</option>
                      <option value="500 Level">500 Level</option>
                      <option value="Postgraduate">Postgraduate</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Gender Preference</label>
                    <select
                      value={newRmGender}
                      onChange={e => setNewRmGender(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-100"
                    >
                      <option value="Female">Female Roommate</option>
                      <option value="Male">Male Roommate</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Target Budget Per Person (₦/yr)</label>
                    <input
                      type="number"
                      value={newRmBudget}
                      onChange={e => setNewRmBudget(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Preferred Location Near Campus</label>
                    <input
                      type="text"
                      value={newRmLocation}
                      onChange={e => setNewRmLocation(e.target.value)}
                      placeholder="e.g. Abule Oja, Asher, Keke Gate"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Description & Lifestyle Expectations</label>
                  <textarea
                    value={newRmDesc}
                    onChange={e => setNewRmDesc(e.target.value)}
                    rows={3}
                    placeholder="Describe your study habits, personality, power setup, and what you expect in a roommate..."
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPostingRoommate(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700"
                  >
                    Publish Post
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Roommate Posts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {roommatePosts.map(post => (
              <div
                key={post.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-3"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={post.studentAvatar}
                    alt=""
                    className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500"
                  />
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{post.studentName}</h4>
                    <p className="text-[11px] text-slate-500">
                      {post.department} • {post.level}
                    </p>
                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">{post.universityName}</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/60 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-slate-800 dark:text-slate-200 font-bold">
                    <span>Budget: ₦{new Intl.NumberFormat().format(post.budgetPerHead)} / head</span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] uppercase font-black bg-indigo-100 text-indigo-800">
                      {post.gender}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    <strong>Location:</strong> {post.location} ({post.roomType})
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 italic text-xs leading-relaxed mt-1">
                    "{post.description}"
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[10px] text-slate-400">{post.createdAt}</span>
                  <a
                    href={`https://wa.me/${post.contactPhone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(post.studentName)},%20I%20saw%20your%20roommate%20post%20on%20Dormiqa!`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors flex items-center gap-1"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Connect via WhatsApp
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: 1st-Year Rent Calculator */}
      {activeTab === 'calculator' && (
        <div className="max-w-3xl mx-auto bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md space-y-6">
          <div>
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-600" />
              First-Year Student Accommodation Cost Calculator
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              In Nigeria, first-time hostel rental often includes agreement fees, agency commission, caution deposit, and utility charges. Use this tool to estimate your true total upfront expenses.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-700 dark:text-slate-300">Base Annual Rent (₦)</span>
                <span className="text-emerald-600 font-extrabold">₦{new Intl.NumberFormat().format(calcRent)}</span>
              </div>
              <input
                type="range"
                min={100000}
                max={1500000}
                step={25000}
                value={calcRent}
                onChange={e => setCalcRent(Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Agent Fee (% of rent)</label>
                <select
                  value={calcAgentPercent}
                  onChange={e => setCalcAgentPercent(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100"
                >
                  <option value={0}>0% (Direct Owner / No Agent)</option>
                  <option value={10}>10% Standard Agent Commission</option>
                  <option value={15}>15% High Demand Area Agent Fee</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Legal & Agreement Fee (%)</label>
                <select
                  value={calcLegalPercent}
                  onChange={e => setCalcLegalPercent(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100"
                >
                  <option value={0}>0% Waiver</option>
                  <option value={10}>10% Standard Legal/Agreement</option>
                  <option value={15}>15% Solicitor Fee</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Refundable Caution Deposit (₦)</label>
                <input
                  type="number"
                  value={calcCautionFee}
                  onChange={e => setCalcCautionFee(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Est. Monthly Light/Water Bill (₦)</label>
                <input
                  type="number"
                  value={calcMonthlyUtility}
                  onChange={e => setCalcMonthlyUtility(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Breakdown Card */}
          <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Upfront Breakdown Summary</h4>
            <div className="space-y-2 text-xs divide-y divide-slate-800">
              <div className="flex justify-between pt-1">
                <span className="text-slate-400">Base Rent:</span>
                <span className="font-bold">₦{new Intl.NumberFormat().format(calcRent)}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-400">Agent Commission ({calcAgentPercent}%):</span>
                <span className="font-bold text-amber-400">+ ₦{new Intl.NumberFormat().format(totalAgentFee)}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-400">Legal Agreement ({calcLegalPercent}%):</span>
                <span className="font-bold text-amber-400">+ ₦{new Intl.NumberFormat().format(totalLegalFee)}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-400">Caution Deposit:</span>
                <span className="font-bold text-sky-400">+ ₦{new Intl.NumberFormat().format(calcCautionFee)}</span>
              </div>
              <div className="flex justify-between pt-2 text-sm font-black text-emerald-400 border-t border-slate-700">
                <span>Total Move-in Payment Required:</span>
                <span>₦{new Intl.NumberFormat().format(totalUpfrontCost)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Profile & Accounts Section */}
      {activeTab === 'profile' && (
        <UserProfileSection />
      )}

      {/* Inspection Digital Pass Modal */}
      <AnimatePresence>
        {selectedPassInspection && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 max-w-sm w-full rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-4 relative"
            >
              <button
                onClick={() => setSelectedPassInspection(null)}
                className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <XCircle className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
                <QrCode className="w-7 h-7" />
              </div>

              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-black uppercase">
                  Dormiqa Verified Pass
                </span>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 mt-2">
                  Physical Viewing Pass
                </h3>
                <p className="text-xs text-slate-500">Present this pass to the agent at the hostel location.</p>
              </div>

              {/* QR Mock graphic */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
                <div className="w-32 h-32 bg-slate-900 mx-auto rounded-xl flex items-center justify-center text-white font-mono text-xs p-2 text-center">
                  [ QR-CODE PASS ]
                  <br />
                  {selectedPassInspection.id}
                </div>
                <p className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">
                  {selectedPassInspection.listingTitle}
                </p>
                <p className="text-[11px] text-slate-500">
                  {selectedPassInspection.date} • {selectedPassInspection.timeSlot}
                </p>
              </div>

              <div className="text-[11px] text-slate-500 space-y-1 text-left bg-indigo-50 dark:bg-indigo-950/40 p-3 rounded-xl">
                <p><strong>Student:</strong> {selectedPassInspection.studentName}</p>
                <p><strong>Assigned Agent:</strong> {selectedPassInspection.agentName}</p>
                <p><strong>Agent Phone:</strong> {selectedPassInspection.agentPhone}</p>
              </div>

              <button
                onClick={() => {
                  addToast('Pass Saved', 'Inspection pass details copied to clipboard!');
                  setSelectedPassInspection(null);
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700"
              >
                Close Pass
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Review Modal */}
      {reviewModalListing && (
        <ReviewModal
          listing={reviewModalListing}
          isOpen={!!reviewModalListing}
          onClose={() => setReviewModalListing(null)}
          onReviewSubmitted={() => {
            loadStudentData();
          }}
        />
      )}

    </div>
  );
};
