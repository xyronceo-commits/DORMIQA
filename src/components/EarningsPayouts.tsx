import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Wallet, DollarSign, ArrowDownToLine, Clock, CheckCircle2, XCircle, 
  Building2, AlertCircle, RefreshCw, Send, ShieldCheck 
} from 'lucide-react';
import { fetchAmbassadorStats, fetchAmbassadorPayouts, requestPayout } from '../lib/api';
import { AmbassadorStats, PayoutRecord } from '../types';

export const EarningsPayouts: React.FC = () => {
  const { user, addNotification } = useAuth();
  const [stats, setStats] = useState<AmbassadorStats | null>(null);
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Payout Request Modal state
  const [isRequestModalOpen, setIsRequestModalOpen] = useState<boolean>(false);
  const [amount, setAmount] = useState<number>(5000);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [bankName, setBankName] = useState<string>(user?.bankName || 'GTBank');
  const [accountNumber, setAccountNumber] = useState<string>(user?.accountNumber || '0123456789');
  const [accountName, setAccountName] = useState<string>(user?.accountName || user?.name || 'Ambassador User');

  const ambassadorCode = user?.referralCode || user?.ambassadorId || 'DORMIQA-001';

  const loadData = async () => {
    setLoading(true);
    try {
      const statsRes = await fetchAmbassadorStats(ambassadorCode);
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }

      const payoutsRes = await fetchAmbassadorPayouts(ambassadorCode);
      if (payoutsRes.success && payoutsRes.data) {
        setPayouts(payoutsRes.data);
      }
    } catch (err) {
      console.error('Error loading payout data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [ambassadorCode]);

  const handleRequestPayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount < 5000) {
      addNotification({
        title: 'Threshold Error',
        message: 'Minimum withdrawal threshold is ₦5,000',
        type: 'error'
      });
      return;
    }

    if (amount > (stats?.pendingEarnings || 0)) {
      addNotification({
        title: 'Insufficient Balance',
        message: 'Request amount exceeds your available pending balance',
        type: 'error'
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await requestPayout({
        ambassadorId: ambassadorCode,
        amount,
        bankName,
        accountNumber,
        accountName
      });

      if (res.success) {
        addNotification({
          title: 'Payout Request Submitted',
          message: 'Your payout request is being processed by DORMIQA Finance.',
          type: 'info'
        });
        setIsRequestModalOpen(false);
        loadData();
      } else {
        addNotification({
          title: 'Request Failed',
          message: res.error || 'Failed to submit payout request',
          type: 'error'
        });
      }
    } catch (err) {
      console.error('Payout request error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300">
            FINANCIAL CENTER
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
            Earnings & Bank Payouts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Track commission earnings and manage bank withdrawal requests.
          </p>
        </div>

        <button
          onClick={() => setIsRequestModalOpen(true)}
          className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center gap-2 shadow-lg"
        >
          <ArrowDownToLine className="w-4 h-4" />
          <span>Request Bank Withdrawal</span>
        </button>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase">Total Earned</span>
          <div className="text-3xl font-black text-slate-900 dark:text-slate-100">
            ₦{(stats?.totalEarnings || 0).toLocaleString()}
          </div>
          <p className="text-xs text-slate-400">Cumulative total commissions earned</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase">Available for Payout</span>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
            ₦{(stats?.pendingEarnings || 0).toLocaleString()}
          </div>
          <p className="text-xs text-emerald-600/80 font-semibold">Ready for withdrawal request</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase">Bank Account</span>
          <div className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-500" />
            <span>{bankName}</span>
          </div>
          <p className="text-xs font-mono text-slate-400">{accountNumber} • {accountName}</p>
        </div>
      </div>

      {/* Payout History Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Payout Withdrawal History</h3>
          <button onClick={loadData} className="p-2 text-slate-400 hover:text-slate-600">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading payout records...</div>
        ) : payouts.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2">
            <Wallet className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-600 dark:text-slate-300">No payout requests submitted yet</p>
            <p>Click "Request Bank Withdrawal" above to request your first payout.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-3">Request ID</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Bank Details</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Date Requested</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {payouts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                      {p.id}
                    </td>
                    <td className="py-3 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                      ₦{p.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                      {p.bankName} - {p.accountNumber} ({p.accountName})
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        p.status === 'Completed' || p.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : p.status === 'Rejected'
                          ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400">
                      {p.requestedAt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payout Request Modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Request Bank Withdrawal
              </h3>
              <button 
                onClick={() => setIsRequestModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRequestPayoutSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Withdrawal Amount (₦)
                </label>
                <input
                  type="number"
                  min={5000}
                  max={stats?.pendingEarnings || 50000}
                  step={500}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold text-base text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Minimum withdrawal threshold: ₦5,000. Available: ₦{(stats?.pendingEarnings || 0).toLocaleString()}
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl space-y-2 border border-slate-200 dark:border-slate-800">
                <div className="text-xs font-bold text-slate-500 uppercase">Target Bank Account</div>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Bank Name (e.g. GTBank, Access Bank)"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-semibold"
                  />
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="10-Digit Account Number"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono"
                  />
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="Account Name"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-semibold"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
              >
                {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>{submitting ? 'Submitting...' : 'Confirm Withdrawal Request'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
