import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Users, Wallet, TrendingUp, Award, Copy, Check, Share2, ArrowRight, 
  ExternalLink, Sparkles, RefreshCw, AlertCircle, ShieldCheck, Download,
  CheckCircle2, Clock, ChevronRight, Zap, Target, DollarSign
} from 'lucide-react';
import { fetchAmbassadorStats, fetchAmbassadorReferrals } from '../lib/api';
import { AmbassadorStats, ReferralLead } from '../types';

export const AmbassadorDashboard: React.FC = () => {
  const { user, setActiveView, addNotification } = useAuth();
  const [stats, setStats] = useState<AmbassadorStats | null>(null);
  const [recentLeads, setRecentLeads] = useState<ReferralLead[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  const ambassadorCode = user?.referralCode || user?.ambassadorId || 'DORMIQA-001';
  const shareableUrl = `https://dormiqa-ambassador.vercel.app/r/${ambassadorCode}`;

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const statsRes = await fetchAmbassadorStats(ambassadorCode);
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }

      const referralsRes = await fetchAmbassadorReferrals(ambassadorCode);
      if (referralsRes.success && referralsRes.data) {
        setRecentLeads(referralsRes.data.slice(0, 5));
      }
    } catch (err) {
      console.error('Error loading ambassador dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [ambassadorCode]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopied(true);
    addNotification({
      title: 'Referral Link Copied',
      message: 'Share this link with students on your campus to earn commissions!',
      type: 'info'
    });
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
      
      {/* Welcome Banner & Referral Code Generator */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-6 sm:p-8 border border-slate-800 shadow-2xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Official Ambassador Portal
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                {user?.universityName || 'UNILAG Campus'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              Welcome back, <span className="text-emerald-400">{user?.name || 'Ambassador'}</span>
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Track student onboarding conversions, monitor real-time commission earnings, and request instant bank payouts from your dedicated acquisition center.
            </p>
          </div>

          {/* Quick Copy Link Box */}
          <div className="w-full lg:w-auto bg-slate-800/80 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-slate-700/80 space-y-3 shrink-0">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span>Your Unique Referral Link</span>
              <span className="text-emerald-400 font-mono font-bold">ID: {ambassadorCode}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-700 font-mono text-xs text-emerald-400 select-all truncate max-w-[240px] sm:max-w-[320px]">
                {shareableUrl}
              </div>
              <button
                onClick={handleCopyLink}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shrink-0 shadow-lg"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Primary KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Leads</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
            {loading ? '...' : (stats?.totalReferrals || 0)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Students referred via link
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Qualified</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {loading ? '...' : (stats?.qualifiedReferrals || 0)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Verified & qualified students
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Earnings</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
            ₦{loading ? '...' : (stats?.totalEarnings || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Cumulative commission earned
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pending Payout</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">
            ₦{loading ? '...' : (stats?.pendingEarnings || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Ready for withdrawal request
          </p>
        </div>

      </div>

      {/* Quick Action Hub & Conversion Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Action Grid & Recent Activity */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Action Bar */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Ambassador Quick Operations
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={() => setActiveView('referrals')}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800 transition-all text-left space-y-2 group"
              >
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 w-fit group-hover:scale-105 transition-transform">
                  <Users className="w-4 h-4" />
                </div>
                <div className="font-bold text-xs text-slate-900 dark:text-slate-100">View Leads</div>
                <div className="text-[10px] text-slate-500">Track student status</div>
              </button>

              <button
                onClick={() => setActiveView('payouts')}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800 transition-all text-left space-y-2 group"
              >
                <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 w-fit group-hover:scale-105 transition-transform">
                  <Wallet className="w-4 h-4" />
                </div>
                <div className="font-bold text-xs text-slate-900 dark:text-slate-100">Request Payout</div>
                <div className="text-[10px] text-slate-500">Bank withdrawal</div>
              </button>

              <button
                onClick={() => setActiveView('resources')}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800 transition-all text-left space-y-2 group"
              >
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 w-fit group-hover:scale-105 transition-transform">
                  <Download className="w-4 h-4" />
                </div>
                <div className="font-bold text-xs text-slate-900 dark:text-slate-100">Media Assets</div>
                <div className="text-[10px] text-slate-500">Flyers & graphics</div>
              </button>

              <button
                onClick={() => setActiveView('profile')}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800 transition-all text-left space-y-2 group"
              >
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 w-fit group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="font-bold text-xs text-slate-900 dark:text-slate-100">Bank Settings</div>
                <div className="text-[10px] text-slate-500">Update account info</div>
              </button>
            </div>
          </div>

          {/* Recent Referral Activity Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Recent Student Referral Leads</h3>
                <p className="text-xs text-slate-500">Live student acquisition pipeline</p>
              </div>
              <button
                onClick={() => setActiveView('referrals')}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>View All ({stats?.totalReferrals || 0})</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading student referral activity...</div>
            ) : recentLeads.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <p className="text-xs font-semibold text-slate-500">No referral leads tracked yet</p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  Share your link <code className="text-emerald-500 font-mono">{shareableUrl}</code> on WhatsApp groups and social media to start generating leads!
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-3">Student ID</th>
                      <th className="py-2.5 px-3">University</th>
                      <th className="py-2.5 px-3">Stage</th>
                      <th className="py-2.5 px-3">Commission</th>
                      <th className="py-2.5 px-3 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {recentLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                          {lead.studentMaskedId}
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                          {lead.universityName}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            lead.conversionStatus === 'Qualified'
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                              : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                          }`}>
                            {lead.stage}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100">
                          ₦{(lead.earningsAmount || 1000).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-400 text-[11px]">
                          {lead.date}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Right Col: Leaderboard & Program Guide */}
        <div className="space-y-8">
          
          {/* Commission Tier Card */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-3xl p-6 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2.5 py-1 rounded-full">
                Active Tier
              </span>
              <Award className="w-5 h-5 text-amber-300" />
            </div>

            <div>
              <div className="text-2xl font-black">{stats?.tier || 'Gold Ambassador'}</div>
              <p className="text-xs text-emerald-100 mt-1">
                Earn ₦1,000 per qualified student onboarded on DORMIQA.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/10 text-xs">
              <div className="flex justify-between font-semibold">
                <span>Monthly Target Progress</span>
                <span>{stats?.qualifiedReferrals || 0} / 50 Leads</span>
              </div>
              <div className="w-full h-2 bg-black/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-400 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, ((stats?.qualifiedReferrals || 0) / 50) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick FAQ / Guidelines */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Ambassador Program Rules
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Student leads must verify their campus email or phone to qualify.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Self-referrals and artificial bots will trigger automatic account fraud hold.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Minimum payout request threshold is ₦5,000 via local bank transfer.</span>
              </li>
            </ul>
          </div>

        </div>

      </div>

    </div>
  );
};
