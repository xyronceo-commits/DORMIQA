import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, Wallet, ArrowDownToLine, FolderOpen } from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const { activeView, setActiveView } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 lg:hidden px-2 py-1.5 shadow-lg">
      <div className="flex items-center justify-around text-center max-w-md mx-auto">
        {/* Dashboard */}
        <button
          onClick={() => setActiveView('ambassador_dashboard')}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 transition-colors ${
            activeView === 'home' || activeView === 'ambassador_dashboard'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Dashboard</span>
        </button>

        {/* Referrals */}
        <button
          onClick={() => setActiveView('referrals')}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 transition-colors ${
            activeView === 'referrals'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Leads</span>
        </button>

        {/* Earnings */}
        <button
          onClick={() => setActiveView('earnings')}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 transition-colors ${
            activeView === 'earnings'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Wallet className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Earnings</span>
        </button>

        {/* Payouts */}
        <button
          onClick={() => setActiveView('payouts')}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 transition-colors ${
            activeView === 'payouts'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <ArrowDownToLine className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Payouts</span>
        </button>

        {/* Resources */}
        <button
          onClick={() => setActiveView('resources')}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 transition-colors ${
            activeView === 'resources'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <FolderOpen className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Resources</span>
        </button>
      </div>
    </nav>
  );
};
