import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Users, Search, Filter, Copy, Check, CheckCircle2, Clock, XCircle, 
  AlertCircle, RefreshCw, ChevronRight, Share2, Sparkles 
} from 'lucide-react';
import { fetchAmbassadorReferrals } from '../lib/api';
import { ReferralLead } from '../types';

export const ReferralTracker: React.FC = () => {
  const { user, addNotification } = useAuth();
  const [leads, setLeads] = useState<ReferralLead[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [copied, setCopied] = useState<boolean>(false);

  const ambassadorCode = user?.referralCode || user?.ambassadorId || 'DORMIQA-001';
  const shareableUrl = `https://dormiqa-ambassador.vercel.app/r/${ambassadorCode}`;

  const loadLeads = async () => {
    setLoading(true);
    try {
      const res = await fetchAmbassadorReferrals(ambassadorCode);
      if (res.success && res.data) {
        setLeads(res.data);
      }
    } catch (err) {
      console.error('Error fetching referral leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, [ambassadorCode]);

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.studentMaskedId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.universityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.stage.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === 'ALL') return matchesSearch;
    if (statusFilter === 'QUALIFIED') return matchesSearch && lead.conversionStatus === 'Qualified';
    if (statusFilter === 'PENDING') return matchesSearch && lead.conversionStatus === 'Pending';
    if (statusFilter === 'REJECTED') return matchesSearch && lead.conversionStatus === 'Rejected';
    return matchesSearch;
  });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopied(true);
    addNotification({
      title: 'Link Copied',
      message: 'Share your link with students to track incoming leads!',
      type: 'info'
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const qualifiedCount = leads.filter(l => l.conversionStatus === 'Qualified').length;
  const pendingCount = leads.filter(l => l.conversionStatus === 'Pending').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
      
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
              LEAD ACQUISITION ENGINE
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
            Student Referral Tracker
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Monitor student signup stages, verify qualified leads, and audit commission allocations.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={handleCopyLink}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied Link' : 'Copy Referral Link'}</span>
          </button>
          <button
            onClick={loadLeads}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary Pipeline Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase">Total Referral Clicks</div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{leads.length}</div>
          </div>
          <Users className="w-8 h-8 text-blue-500 opacity-80" />
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase">Qualified Leads</div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{qualifiedCount}</div>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-500 opacity-80" />
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase">Pending Verification</div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{pendingCount}</div>
          </div>
          <Clock className="w-8 h-8 text-amber-500 opacity-80" />
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student ID or campus..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto no-scrollbar">
          {[
            { id: 'ALL', label: 'All Leads' },
            { id: 'QUALIFIED', label: 'Qualified' },
            { id: 'PENDING', label: 'In Progress' },
            { id: 'REJECTED', label: 'Flagged' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                statusFilter === f.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Leads Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading lead records...</div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">No student leads found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery ? 'Try adjusting your search query or filter settings.' : 'Share your ambassador referral link with campus student groups to generate leads.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Student Masked ID</th>
                  <th className="py-3 px-4">Campus / University</th>
                  <th className="py-3 px-4">Current Stage</th>
                  <th className="py-3 px-4">Qualification</th>
                  <th className="py-3 px-4">Commission</th>
                  <th className="py-3 px-4 text-right">Referral Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                      {lead.studentMaskedId}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                      {lead.universityName}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                        {lead.stage}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {lead.conversionStatus === 'Qualified' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                          <CheckCircle2 className="w-3 h-3" /> Qualified
                        </span>
                      ) : lead.conversionStatus === 'Rejected' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300">
                          <XCircle className="w-3 h-3" /> Flagged
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                      ₦{(lead.earningsAmount || 1000).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-400 text-[11px]">
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
  );
};
