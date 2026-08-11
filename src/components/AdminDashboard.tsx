import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchListings } from '../lib/api';
import { Listing } from '../types';
import { UserProfileSection } from './UserProfileSection';
import { 
  ShieldCheck, ShieldAlert, Users, Building2, GraduationCap, CheckCircle2, 
  XCircle, Eye, RefreshCw, FileText, Lock, LogOut, BarChart3, TrendingUp,
  ChevronRight, Check, AlertCircle, Sparkles, Filter, Search, Phone, Mail, MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AdminDashboard: React.FC = () => {
  const { adminLogout, adminToken, addToast } = useAuth();

  const [activeTab, setActiveTab] = useState<'agents' | 'properties' | 'students' | 'analytics' | 'profile'>('agents');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [serverStats, setServerStats] = useState<any>(null);

  // Agent Verification Requests Queue
  const [agents, setAgents] = useState<any[]>([]);

  // Selected agent modal for detailed verification review
  const [reviewAgent, setReviewAgent] = useState<any | null>(null);
  const [reviewProperty, setReviewProperty] = useState<Listing | null>(null);

  useEffect(() => {
    // Fetch listings
    fetchListings({})
      .then(data => setListings(data))
      .catch(() => {})
      .finally(() => setLoading(false));

    // Fetch server admin stats if token present
    if (adminToken) {
      fetch(`/api/admin/stats?token=${adminToken}`)
        .then(res => res.json())
        .then(data => {
          if (data && !data.error) {
            setServerStats(data);
          }
        })
        .catch(() => {});
    }

    // Fetch real verifications submitted via API
    fetch('/api/verifications')
      .then(res => res.json())
      .then(data => {
        if (data && data.verifications && data.verifications.length > 0) {
          const liveAgents = data.verifications.map((v: any) => ({
            id: v.id,
            name: v.businessName || 'Independent Campus Agent',
            agentName: v.agentName || 'Agent',
            email: v.agentEmail || 'agent@dormiqa.ng',
            phone: v.phone || '+234 800 000 0000',
            uni: v.officeAddress || 'Campus Property Agent',
            docType: v.proofType?.toUpperCase() || 'OFFICE & IDENTITY DOC',
            docRef: v.id,
            officeAddress: v.officeAddress || 'Campus Area',
            submittedDate: 'Recently',
            propertiesCount: 1,
            photoUrl: v.agentPhotoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
            status: v.status || 'pending'
          }));
          setAgents(liveAgents);
        }
      })
      .catch(() => {});
  }, [adminToken]);

  const handleVerifyAgent = (id: string) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, status: 'verified' } : a));
    addToast('Agent Verified', 'Badge and verified listing rights granted to agent', 'success');
  };

  const handleRejectAgent = (id: string) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, status: 'rejected' } : a));
    addToast('Verification Declined', 'Agent application status updated to rejected', 'info');
  };

  const handleApproveProperty = (id: string) => {
    setListings(prev => prev.map(l => l.id === id ? { ...l, status: 'active', isAgentVerified: true } : l));
    addToast('Property Approved', 'Listing is now live on Dormiqa marketplace', 'success');
  };

  const handleRejectProperty = (id: string) => {
    setListings(prev => prev.map(l => l.id === id ? { ...l, status: 'closed' } : l));
    addToast('Property Rejected', 'Property status updated', 'info');
  };

  const pendingAgentsCount = agents.filter(a => a.status === 'pending').length;
  const pendingPropertiesCount = listings.filter(l => l.status === 'pending_review' || !l.isAgentVerified).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Admin Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-black">
            <ShieldCheck className="w-6 h-6 text-emerald-400 dark:text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Dormiqa Admin
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-semibold text-[10px] uppercase tracking-wider">
                Authorized Session
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Secure internal operational dashboard & verification desk
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('profile')}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors"
          >
            Settings
          </button>
          <button
            onClick={adminLogout}
            className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold text-xs transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Metric Quick Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Students</p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {serverStats?.students?.total?.toLocaleString() ?? 0}
            </p>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3 text-slate-400" />
              +{serverStats?.students?.newThisWeek ?? 0} this week
            </span>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pending Agents</p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {pendingAgentsCount}
            </p>
            <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 mt-1 block">
              Awaiting verification
            </span>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Listings</p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {listings.length}
            </p>
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mt-1 block">
              Active marketplace
            </span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Verification Rate</p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {serverStats?.verificationRate || '0%'}
            </p>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 block">
              Verified agents ratio
            </span>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab('agents')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'agents'
              ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Agent Verification</span>
          {pendingAgentsCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white font-black text-[10px]">
              {pendingAgentsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('properties')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'properties'
              ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Property Verification</span>
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'students'
              ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Student Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'analytics'
              ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Analytics</span>
        </button>
      </div>

      {/* TAB 1: AGENT VERIFICATION QUEUE */}
      {activeTab === 'agents' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Agent & Business Verification Desk
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Review submitted NIN, CAC, and office credentials before granting agent badges.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {agents.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <ShieldCheck className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">No verification requests</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  When property agents submit their business or identity verification, applications will appear here for administrative approval.
                </p>
              </div>
            ) : (
              agents.map((ag) => (
              <div
                key={ag.id}
                className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <img
                    src={ag.photoUrl}
                    alt={ag.name}
                    className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-800 shrink-0"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {ag.name}
                      </h3>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        ({ag.agentName})
                      </span>
                      {ag.status === 'verified' && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Verified
                        </span>
                      )}
                      {ag.status === 'rejected' && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 font-bold text-[10px]">
                          Rejected
                        </span>
                      )}
                      {ag.status === 'pending' && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 font-bold text-[10px]">
                          Pending Review
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{ag.uni}</span>
                    </p>

                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 flex-wrap pt-1">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        {ag.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {ag.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3 text-slate-400" />
                        {ag.docType} ({ag.docRef})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => setReviewAgent(ag)}
                    className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Review</span>
                  </button>

                  {ag.status !== 'verified' && (
                    <button
                      onClick={() => handleVerifyAgent(ag.id)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center gap-1 shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Verify</span>
                    </button>
                  )}

                  {ag.status !== 'rejected' && (
                    <button
                      onClick={() => handleRejectAgent(ag.id)}
                      className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-semibold text-xs transition-colors"
                    >
                      Reject
                    </button>
                  )}
                </div>
              </div>
            )))}
          </div>
        </div>
      )}

      {/* TAB 2: PROPERTY VERIFICATION QUEUE */}
      {activeTab === 'properties' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Accommodation Property Review
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Audit submitted student properties and ensure pricing, photos, and location details meet quality standards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {listings.length === 0 ? (
              <div className="col-span-full p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">No properties to review</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  When new accommodation listings are submitted by agents, they will appear here for verification.
                </p>
              </div>
            ) : (
              listings.slice(0, 8).map((prop) => (
              <div
                key={prop.id}
                className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={prop.images?.[0] || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=600&q=80'}
                    alt={prop.title}
                    className="w-20 h-20 rounded-xl object-cover border border-slate-200 dark:border-slate-800 shrink-0"
                  />
                  <div className="space-y-1 min-w-0 flex-1">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[10px]">
                      {prop.roomType || 'Self-Contain'}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                      {prop.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                      {prop.locationName || prop.universityName}
                    </p>
                    <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                      ₦{prop.price?.toLocaleString()} / year
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    Agent: {prop.agentName || 'Verified Campus Agent'}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Facilities: {prop.facilities?.slice(0, 4).join(', ') || 'Water, Security, Electricity'}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className={`px-2.5 py-1 rounded-lg font-bold text-[10px] ${
                    prop.status === 'active' || prop.isAgentVerified
                      ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                      : 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300'
                  }`}>
                    {prop.status === 'active' || prop.isAgentVerified ? 'Approved & Live' : 'Under Review'}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApproveProperty(prop.id)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectProperty(prop.id)}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-semibold text-xs transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            )))}
          </div>
        </div>
      )}

      {/* TAB 3: STUDENT OVERVIEW */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Student Community Overview
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Aggregated statistics of registered student accounts across Nigerian universities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* University Distribution */}
            <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-emerald-600" />
                <span>Students by University</span>
              </h3>

              <div className="space-y-3">
                {(!serverStats?.students?.byUniversity || serverStats.students.byUniversity.length === 0) ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 py-6 text-center">
                    No registered student accounts recorded yet across universities.
                  </p>
                ) : (
                  serverStats.students.byUniversity.map((uni: any, idx: number) => {
                    const max = 450;
                    const pct = Math.min(100, Math.round((uni.count / max) * 100));
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-700 dark:text-slate-300">{uni.name}</span>
                          <span className="text-slate-900 dark:text-slate-100 font-bold">{uni.count} students</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Registration Activity Breakdown */}
            <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span>Onboarding Metrics</span>
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80">
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">New Today</p>
                  <p className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
                    +{serverStats?.students?.newToday ?? 0}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80">
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">New This Week</p>
                  <p className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
                    +{serverStats?.students?.newThisWeek ?? 0}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80">
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">New This Month</p>
                  <p className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
                    +{serverStats?.students?.newThisMonth ?? 0}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80">
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total Onboarded</p>
                  <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                    {serverStats?.students?.total ?? 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Campus Marketplace Analytics
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Insights into student housing demand patterns and platform adoption across Nigeria.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Growth Monthly Signups Chart */}
            <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                <span>Student Signups (Monthly)</span>
              </h3>

              <div className="h-44 flex items-end justify-between gap-2 pt-4 px-2">
                {(!serverStats?.analytics?.monthlySignups || serverStats.analytics.monthlySignups.length === 0) ? (
                  <div className="w-full h-full flex items-center justify-center text-xs text-slate-500 dark:text-slate-400">
                    No signup analytics recorded yet.
                  </div>
                ) : (
                  serverStats.analytics.monthlySignups.map((item: any, idx: number) => {
                    const max = 900;
                    const heightPct = Math.min(100, Math.round((item.students / max) * 100));
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                          {item.students}
                        </span>
                        <div
                          className="w-full bg-emerald-500 hover:bg-emerald-600 rounded-t-md transition-all duration-300"
                          style={{ height: `${heightPct}%` }}
                        />
                        <span className="text-[10px] font-semibold text-slate-400">
                          {item.month}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Demand by Room Type */}
            <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>Demand by Room Type</span>
              </h3>

              <div className="space-y-3">
                {(!serverStats?.analytics?.demandByRoomType || serverStats.analytics.demandByRoomType.length === 0) ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 py-6 text-center">
                    No room type request analytics recorded yet.
                  </p>
                ) : (
                  serverStats.analytics.demandByRoomType.map((room: any, idx: number) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-700 dark:text-slate-300">{room.type}</span>
                        <span className="text-slate-900 dark:text-slate-100 font-bold">{room.percentage}% ({room.count} requests)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${room.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PROFILE */}
      {activeTab === 'profile' && (
        <UserProfileSection />
      )}

      {/* Agent Review Details Modal */}
      {reviewAgent && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Verification Details
              </h3>
              <button
                onClick={() => setReviewAgent(null)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <img src={reviewAgent.photoUrl} alt="" className="w-16 h-16 rounded-xl object-cover" />
                <div>
                  <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{reviewAgent.name}</p>
                  <p className="text-slate-500 dark:text-slate-400">{reviewAgent.agentName}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 space-y-1 text-slate-700 dark:text-slate-300">
                <p><span className="font-semibold text-slate-900 dark:text-slate-100">University:</span> {reviewAgent.uni}</p>
                <p><span className="font-semibold text-slate-900 dark:text-slate-100">Document Type:</span> {reviewAgent.docType}</p>
                <p><span className="font-semibold text-slate-900 dark:text-slate-100">Reference:</span> {reviewAgent.docRef}</p>
                <p><span className="font-semibold text-slate-900 dark:text-slate-100">Office Address:</span> {reviewAgent.officeAddress}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  handleVerifyAgent(reviewAgent.id);
                  setReviewAgent(null);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
              >
                Confirm Verification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
