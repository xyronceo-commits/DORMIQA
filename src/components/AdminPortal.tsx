import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, Lock, Users, Wallet, ArrowDownToLine, Check, X, 
  RefreshCw, Search, AlertCircle, CheckCircle2, XCircle, Clock 
} from 'lucide-react';
import { fetchAdminOverview, processPayout } from '../lib/api';

export const AdminPortal: React.FC = () => {
  const { user, addNotification } = useAuth();
  const [adminToken, setAdminToken] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [password, setPassword] = useState<string>('');
  const [authenticating, setAuthenticating] = useState<boolean>(false);

  // Overview Data
  const [overview, setOverview] = useState<any>(null);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [ambassadors, setAmbassadors] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'payouts' | 'ambassadors' | 'fraud'>('payouts');

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthenticating(true);
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await response.json();
      if (data.success && data.token) {
        setAdminToken(data.token);
        setIsAuthenticated(true);
        addNotification({
          title: 'Admin Access Granted',
          message: 'Authenticated as DORMIQA Platform Admin.',
          type: 'info'
        });
      } else {
        addNotification({
          title: 'Access Denied',
          message: data.error || 'Invalid Admin Password',
          type: 'error'
        });
      }
    } catch (err) {
      console.error('Admin login error:', err);
    } finally {
      setAuthenticating(false);
    }
  };

  const loadAdminData = async () => {
    if (!adminToken) return;
    setLoading(true);
    try {
      const res = await fetchAdminOverview(adminToken);
      if (res.success && res.data) {
        setOverview(res.data);
        setPayouts(res.data.payouts || []);
        setAmbassadors(res.data.ambassadors || []);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAdminData();
    }
  }, [isAuthenticated, adminToken]);

  const handlePayoutAction = async (payoutId: string, status: 'Approved' | 'Rejected') => {
    try {
      const res = await processPayout(adminToken, { payoutId, status });
      if (res.success) {
        addNotification({
          title: `Payout ${status}`,
          message: `Payout request ${payoutId} updated to ${status}.`,
          type: 'info'
        });
        loadAdminData();
      } else {
        addNotification({
          title: 'Action Failed',
          message: res.error || 'Could not process payout',
          type: 'error'
        });
      }
    } catch (err) {
      console.error('Payout processing error:', err);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit mx-auto text-emerald-600">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            DORMIQA Admin Control Center
          </h2>
          <p className="text-xs text-slate-500">
            Enter the admin password to access referral oversight, audit logs, and bank payout authorization.
          </p>
        </div>

        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Admin Secret Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={authenticating}
            className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
          >
            {authenticating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            <span>{authenticating ? 'Verifying Credentials...' : 'Authenticate Admin Session'}</span>
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
      
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-900 text-white dark:bg-slate-800">
            ADMINISTRATIVE OVERWATCH
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
            DORMIQA Ambassador Operations Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Manage campus ambassadors, authorize bank payouts, and audit referral conversion security.
          </p>
        </div>

        <button
          onClick={loadAdminData}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-2 text-xs font-bold"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Admin Metrics</span>
        </button>
      </div>

      {/* Admin Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase">Active Ambassadors</span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
            {overview?.totalAmbassadors || ambassadors.length || 0}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase">Total Referral Leads</span>
          <div className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
            {overview?.totalLeads || 0}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase">Pending Payout Requests</span>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
            {payouts.filter(p => p.status === 'Pending').length}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase">Total Paid Out (₦)</span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
            ₦{(overview?.totalPaidOut || 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('payouts')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'payouts'
              ? 'bg-emerald-600 text-white'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Payout Authorizations ({payouts.filter(p => p.status === 'Pending').length} Pending)
        </button>

        <button
          onClick={() => setActiveTab('ambassadors')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'ambassadors'
              ? 'bg-emerald-600 text-white'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Ambassadors Directory ({ambassadors.length})
        </button>
      </div>

      {/* Tab 1: Payout Requests */}
      {activeTab === 'payouts' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Bank Payout Requests Management
          </h3>

          {payouts.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">No payout requests currently logged.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-3 px-3">Payout ID</th>
                    <th className="py-3 px-3">Ambassador ID</th>
                    <th className="py-3 px-3">Amount</th>
                    <th className="py-3 px-3">Bank Details</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {payouts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-slate-100">{p.id}</td>
                      <td className="py-3 px-3 font-mono text-emerald-600">{p.ambassadorId}</td>
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100">₦{p.amount.toLocaleString()}</td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                        {p.bankName} - {p.accountNumber} ({p.accountName})
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          p.status === 'Approved' || p.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : p.status === 'Rejected'
                            ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right space-x-2">
                        {p.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => handlePayoutAction(p.id, 'Approved')}
                              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px]"
                            >
                              Approve & Pay
                            </button>
                            <button
                              onClick={() => handlePayoutAction(p.id, 'Rejected')}
                              className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[11px]"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Ambassadors Directory */}
      {activeTab === 'ambassadors' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Registered Ambassadors</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-3">Ambassador ID</th>
                  <th className="py-3 px-3">Name</th>
                  <th className="py-3 px-3">Campus</th>
                  <th className="py-3 px-3">Total Leads</th>
                  <th className="py-3 px-3">Qualified Leads</th>
                  <th className="py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {ambassadors.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-mono font-bold text-emerald-600">{a.ambassadorId}</td>
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100">{a.name}</td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">{a.universityName || 'UNILAG'}</td>
                    <td className="py-3 px-3 font-bold">{a.totalReferrals || 0}</td>
                    <td className="py-3 px-3 font-bold text-emerald-600">{a.qualifiedReferrals || 0}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {a.ambassadorStatus || 'Active'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
