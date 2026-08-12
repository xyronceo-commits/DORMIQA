import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Home, Search, Bookmark, User as UserIcon, LayoutDashboard, PlusCircle } from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const { user, activeView, setActiveView, setAuthModalOpen, savedListingIds } = useAuth();

  const getDashboardView = () => {
    if (!user) return 'home';
    if (user.role === 'agent') return 'agent_dashboard';
    if (user.role === 'admin') return 'admin_dashboard';
    return 'student_dashboard';
  };

  const dashboardView = getDashboardView();

  if (!user || activeView === 'home' || activeView === 'role_select' || activeView === 'onboarding') {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-black/95 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800 md:hidden px-2 py-1.5 shadow-lg">
      <div className="flex items-center justify-around text-center max-w-md mx-auto">
        {/* Home */}
        <button
          onClick={() => setActiveView('home')}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 transition-colors ${
            activeView === 'home'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Home</span>
        </button>

        {/* Search */}
        <button
          onClick={() => setActiveView('search')}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 transition-colors ${
            activeView === 'search'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
          }`}
        >
          <Search className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Search</span>
        </button>

        {/* Saved */}
        <button
          onClick={() => setActiveView('saved')}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 transition-colors relative ${
            activeView === 'saved'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
          }`}
        >
          <div className="relative inline-block">
            <Bookmark className="w-5 h-5 mb-0.5" />
            {savedListingIds.length > 0 && (
              <span className="absolute -top-1 -right-2 bg-emerald-600 text-white text-[9px] font-extrabold w-3.5 h-3.5 rounded-md flex items-center justify-center">
                {savedListingIds.length}
              </span>
            )}
          </div>
          <span className="text-[10px]">Saved</span>
        </button>

        {/* Dashboard or Action */}
        {user ? (
          <button
            onClick={() => setActiveView(dashboardView)}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 transition-colors ${
              activeView === 'student_dashboard' || activeView === 'agent_dashboard' || activeView === 'admin_dashboard'
                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Dashboard</span>
          </button>
        ) : null}

        {/* Profile or Login */}
        <button
          onClick={() => {
            if (user) {
              setActiveView('profile');
            } else {
              setAuthModalOpen(true);
            }
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 transition-colors ${
            activeView === 'profile'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
          }`}
        >
          <UserIcon className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">{user ? 'Profile' : 'Sign In'}</span>
        </button>
      </div>
    </nav>
  );
};
