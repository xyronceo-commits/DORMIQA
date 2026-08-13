import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchListings } from '../lib/api';
import { subscribeFirestoreListings } from '../lib/firebase';
import { ListingCard } from './ListingCard';
import { Listing } from '../types';
import { INITIAL_UNIVERSITIES } from '../data/mockData';
import { 
  Search, Sparkles, ShieldCheck, Calendar, GraduationCap, MapPin, Navigation, 
  CheckCircle2, ArrowRight, Star, Building2, Zap, Droplets, Shield, Clock,
  Check, X
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user, setSelectedUniversity, setActiveView, setAuthModalOpen, setAuthModalTab } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([]);

  useEffect(() => {
    fetchListings({})
      .then(data => setFeaturedListings(data.slice(0, 6)))
      .catch(() => {});

    const unsubscribe = subscribeFirestoreListings((items) => {
      setFeaturedListings(items.slice(0, 6));
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setAuthModalTab('student_signup');
      setAuthModalOpen(true);
      return;
    }
    setActiveView('search');
  };

  return (
    <div className="space-y-12 sm:space-y-16 pb-16">
      
      {/* 1. HERO SECTION - Clean product focus */}
      <section className="bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 pt-6 pb-12 sm:pt-10 sm:pb-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-5xl font-black tracking-tight text-neutral-900 dark:text-white leading-[1.12]">
            Find Verified Student Housing Near <span className="text-emerald-600 dark:text-emerald-400">Your Campus Gate</span>
          </h1>

          {/* Subtext */}
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-2xl mx-auto">
            Dormiqa connects university, polytechnic, and college students with verified landlords and agents for hostels, self-contains, and lodges. Inspect physically before making any rent payment.
          </p>

          {/* Primary Search Bar */}
          <div className="p-2 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 shadow-sm focus-within:border-neutral-900 dark:focus-within:border-white transition-all space-y-2 text-left">
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. Self-contain near UNILAG gate, single room under ₦300k..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-transparent text-neutral-900 dark:text-white placeholder:text-neutral-400 text-xs sm:text-sm focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 shrink-0"
              >
                <Search className="w-3.5 h-3.5 text-emerald-500" />
                <span>Search Housing</span>
              </button>
            </form>

            {/* Quick Preset Filter Tags */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 px-1">
              <span className="text-[11px] font-semibold text-neutral-400 mr-1">Popular:</span>
              {[
                'Self-Contain', 
                'Single Room', 
                'Under ₦300k', 
                '24/7 Power', 
                '< 5 min Walk'
              ].map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    if (!user) {
                      setAuthModalTab('student_signup');
                      setAuthModalOpen(true);
                      return;
                    }
                    setSearchQuery(tag);
                    setActiveView('search');
                  }}
                  className="px-2.5 py-0.5 rounded-md bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-[11px] font-medium transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Key Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <button
              onClick={() => {
                if (!user) {
                  setAuthModalTab('student_signup');
                  setAuthModalOpen(true);
                } else {
                  setActiveView('search');
                }
              }}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition-colors shadow-sm flex items-center gap-2"
            >
              <span>Browse All Campus Listings</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </section>

      {/* 2. TOP CAMPUSES - Simple, clean pills */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Hostels Available Across Major Universities</span>
            </h2>
            <button
              onClick={() => {
                if (!user) {
                  setAuthModalTab('student_signup');
                  setAuthModalOpen(true);
                } else {
                  setActiveView('search');
                }
              }}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              All Campuses
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {INITIAL_UNIVERSITIES.slice(0, 12).map(uni => (
              <button
                key={uni.id}
                onClick={() => {
                  if (!user) {
                    setAuthModalTab('student_signup');
                    setAuthModalOpen(true);
                  } else {
                    setSelectedUniversity(uni);
                    setActiveView('search');
                  }
                }}
                className="p-3 rounded-xl bg-neutral-50 hover:bg-black hover:text-white dark:bg-neutral-800/60 dark:hover:bg-white dark:hover:text-black border border-neutral-200 dark:border-neutral-800 text-left transition-all group"
              >
                <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-inherit">
                  {uni.shortName}
                </div>
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400 group-hover:text-inherit/80 truncate">
                  {uni.state} • {uni.totalListings} listings
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. FEATURED ACCOMMODATIONS - Realistic student housing cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-5">
        <div className="flex items-end justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
              Verified Campus Hostels
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Inspected properties near campus gates with transparent ratings on power, water, and safety.
            </p>
          </div>

          <button
            onClick={() => {
              if (!user) {
                setAuthModalTab('student_signup');
                setAuthModalOpen(true);
              } else {
                setActiveView('search');
              }
            }}
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 shrink-0"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {featuredListings.length === 0 ? (
          <div className="p-10 text-center rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-3 col-span-full">
            <Building2 className="w-10 h-10 text-slate-400 mx-auto" />
            <h4 className="font-bold text-base text-slate-800 dark:text-slate-200">No Live Listings Uploaded Yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Real-time listings uploaded by verified agents will appear here instantly on the student feed.
            </p>
            <button
              onClick={() => {
                if (!user) {
                  setAuthModalTab('agent_signup');
                  setAuthModalOpen(true);
                } else {
                  setActiveView('agent_dashboard');
                }
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition"
            >
              Post a Property Listing
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featuredListings.map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </section>

      {/* 4. COMPARISON TABLE - Traditional vs Dormiqa (Clear, practical, no hype) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 space-y-6">
          <div className="max-w-xl space-y-1">
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Designed For Nigerian Tertiary Students
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
              Why Students Choose Dormiqa
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              We eliminated non-refundable registration fees, unverified agents, and fake location descriptions.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3">Feature</th>
                  <th className="py-3 px-3 text-neutral-500 dark:text-neutral-400">Traditional Agents</th>
                  <th className="py-3 px-3 text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50/50 dark:bg-emerald-950/20 rounded-t-xl">Dormiqa Standard</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
                <tr>
                  <td className="py-3.5 px-3 font-semibold text-neutral-900 dark:text-neutral-100">Inspection Process</td>
                  <td className="py-3.5 px-3 text-red-600 dark:text-red-400 flex items-center gap-1.5 font-medium">
                    <X className="w-4 h-4 shrink-0" />
                    <span>Unpredictable registration charges</span>
                  </td>
                  <td className="py-3.5 px-3 text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center gap-1.5">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>Standard Scheduled Physical Inspection</span>
                  </td>
                </tr>

                <tr>
                  <td className="py-3.5 px-3 font-semibold text-neutral-900 dark:text-neutral-100">Agent Verification</td>
                  <td className="py-3.5 px-3 text-neutral-500 dark:text-neutral-400 font-medium">
                    Unchecked social media claims
                  </td>
                  <td className="py-3.5 px-3 text-neutral-900 dark:text-neutral-100 font-bold bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>NIN / CAC Verified Agents</span>
                  </td>
                </tr>

                <tr>
                  <td className="py-3.5 px-3 font-semibold text-neutral-900 dark:text-neutral-100">Location Accuracy</td>
                  <td className="py-3.5 px-3 text-neutral-500 dark:text-neutral-400 font-medium">
                    Vague "close to campus"
                  </td>
                  <td className="py-3.5 px-3 text-neutral-900 dark:text-neutral-100 font-bold bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Exact walk time to gate (e.g. 5 mins)</span>
                  </td>
                </tr>

                <tr>
                  <td className="py-3.5 px-3 font-semibold text-neutral-900 dark:text-neutral-100">Water & Electricity Ratings</td>
                  <td className="py-3.5 px-3 text-neutral-500 dark:text-neutral-400 font-medium">
                    Discovered only after moving in
                  </td>
                  <td className="py-3.5 px-3 text-neutral-900 dark:text-neutral-100 font-bold bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center gap-1.5 rounded-b-xl">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Rated by current student tenants</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 5. 3-STEP PROCESS - Clean sequential timeline */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-black text-white rounded-2xl p-6 sm:p-10 border border-neutral-800 space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">3-Step Process</span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">How Students Secure Housing</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-3">
              <div className="w-7 h-7 rounded-md bg-emerald-500 text-black font-black flex items-center justify-center text-xs">
                01
              </div>
              <h3 className="text-base font-bold text-white">Search Near Your Gate</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Filter by university, budget, walking distance to faculty or gate, and required facilities like solar inverter or borehole.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-3">
              <div className="w-7 h-7 rounded-md bg-emerald-500 text-black font-black flex items-center justify-center text-xs">
                02
              </div>
              <h3 className="text-base font-bold text-white">Book Physical Inspection</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Pick a date and meet the verified agent physically at the hostel. Never make rent payments before viewing the property.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-3">
              <div className="w-7 h-7 rounded-md bg-emerald-500 text-black font-black flex items-center justify-center text-xs">
                03
              </div>
              <h3 className="text-base font-bold text-white">Finalize & Move In</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Receive official tenancy agreement directly from the verified agent or landlord and settle into your semester home.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. AGENT & LANDLORD CALLOUT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <span className="px-2.5 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-[10px] font-bold uppercase tracking-wider border border-neutral-200 dark:border-neutral-700">
              For Property Managers & Landlords
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
              List Your Campus Properties
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 max-w-xl">
              Connect directly with verified students searching for off-campus accommodation near UNILAG, OAU, UI, UNN, FUTA, and 50+ tertiary institutions.
            </p>
          </div>

          <button
            onClick={() => {
              if (!user) {
                setAuthModalTab('agent_signup');
                setAuthModalOpen(true);
              } else {
                setActiveView('role_select');
              }
            }}
            className="px-5 py-3 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold text-xs sm:text-sm hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors shadow-sm shrink-0 flex items-center gap-2"
          >
            <Building2 className="w-4 h-4 text-emerald-500" />
            <span>Agent Registration</span>
          </button>
        </div>
      </section>

    </div>
  );
};
