import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { INITIAL_UNIVERSITIES } from '../data/mockData';
import { UserRole } from '../types';
import { NotificationCenter } from './NotificationCenter';
import { DormiqaLogo } from './DormiqaLogo';
import { 
  Building2, GraduationCap, Search, Bookmark, Bell, Sun, Moon, Laptop, User as UserIcon, 
  ChevronDown, ShieldCheck, FileText, LogOut, Sparkles, Menu, X, Check,
  Home, PlusCircle, CheckCircle2, MessageSquare, Phone, Compass, ListFilter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Header: React.FC = () => {
  const { 
    user, 
    role, 
    setRole, 
    logout, 
    savedListingIds, 
    selectedUniversity, 
    setSelectedUniversity, 
    activeView, 
    setActiveView,
    setAuthModalOpen,
    setAuthModalTab,
    notifications,
    unreadCount,
    markNotificationRead,
    clearAllNotifications,
    agentActiveTab,
    setAgentActiveTab,
    setProfileModalOpen,
    requestNotificationPermission,
    setIsAdminModalOpen,
    setChatModalOpen
  } = useAuth();

  const { theme, effectiveTheme, toggleTheme, setTheme } = useTheme();

  const [isUniDropdownOpen, setIsUniDropdownOpen] = useState(false);
  const [headerUniSearch, setHeaderUniSearch] = useState('');
  const [selectedOwnershipFilter, setSelectedOwnershipFilter] = useState<'all' | 'Federal' | 'State' | 'Private' | 'Polytechnic'>('all');
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const filteredHeaderUniversities = INITIAL_UNIVERSITIES.filter(uni => {
    const matchesSearch = 
      uni.name.toLowerCase().includes(headerUniSearch.toLowerCase()) ||
      uni.shortName.toLowerCase().includes(headerUniSearch.toLowerCase()) ||
      uni.state.toLowerCase().includes(headerUniSearch.toLowerCase()) ||
      uni.city.toLowerCase().includes(headerUniSearch.toLowerCase());

    if (selectedOwnershipFilter === 'all') return matchesSearch;
    if (selectedOwnershipFilter === 'Polytechnic') return matchesSearch && uni.institutionType === 'Polytechnic';
    return matchesSearch && uni.ownership === selectedOwnershipFilter;
  });

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isVerticalNavOpen, setIsVerticalNavOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3 sm:gap-6">
        
        {/* Left Brand Logo & Location/University Selector */}
        <div className="flex items-center gap-3 lg:gap-6 shrink-0">
          <button
            onClick={() => setActiveView('ambassador_dashboard')}
            className="focus:outline-none group text-left flex items-center gap-2.5"
          >
            <DormiqaLogo size="md" />
            <div className="hidden sm:flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-200/50 dark:border-emerald-800/50">
                AMBASSADOR PORTAL
              </span>
            </div>
          </button>

          {/* Institution Selector */}
          <div className="relative">
            <button
              onClick={() => setIsUniDropdownOpen(!isUniDropdownOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
            >
              <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="max-w-[110px] sm:max-w-[150px] truncate">
                {selectedUniversity ? selectedUniversity.shortName : 'All Campuses'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            <AnimatePresence>
              {isUniDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  className="absolute left-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-3 z-50 overflow-hidden flex flex-col max-h-[450px]"
                >
                  <div className="px-3 pb-2 border-b border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <span>Nigeria Tertiary System</span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">{INITIAL_UNIVERSITIES.length} Campuses</span>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={headerUniSearch}
                        onChange={(e) => setHeaderUniSearch(e.target.value)}
                        placeholder="Filter UNILAG, OAU, YABATECH, LASU..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    {/* Category Filter Pills */}
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-1 text-[10px] font-bold">
                      {[
                        { id: 'all', label: 'All' },
                        { id: 'Federal', label: 'Federal' },
                        { id: 'State', label: 'State' },
                        { id: 'Private', label: 'Private' },
                        { id: 'Polytechnic', label: 'Polytechnics' },
                      ].map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedOwnershipFilter(cat.id as any)}
                          className={`px-2 py-0.5 rounded-lg shrink-0 transition-colors ${
                            selectedOwnershipFilter === cat.id
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Institution List Scrollable */}
                  <div className="overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800/60">
                    <button
                      onClick={() => {
                        setSelectedUniversity(null);
                        setIsUniDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors"
                    >
                      <span>🇳🇬 All Higher Institutions in Nigeria</span>
                      {!selectedUniversity && (
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      )}
                    </button>

                    {filteredHeaderUniversities.map(uni => (
                      <button
                        key={uni.id}
                        onClick={() => {
                          setSelectedUniversity(uni);
                          setIsUniDropdownOpen(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors group"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 dark:text-slate-100 truncate">{uni.name}</span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 shrink-0">
                              {uni.shortName}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {uni.state} State • {uni.category || uni.ownership + ' ' + uni.institutionType}
                          </p>
                        </div>
                        {selectedUniversity?.id === uni.id && (
                          <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        )}
                      </button>
                    ))}

                    {filteredHeaderUniversities.length === 0 && (
                      <div className="p-4 text-center text-xs text-slate-400">
                        No institution found matching "{headerUniSearch}"
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Center Primary Navigation Links (Desktop) */}
        <nav className="hidden lg:flex items-center gap-6">
          <button
            onClick={() => setActiveView('ambassador_dashboard')}
            className={`text-sm font-semibold transition-colors flex items-center gap-1.5 ${
              activeView === 'home' || activeView === 'ambassador_dashboard'
                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveView('referrals')}
            className={`text-sm font-semibold transition-colors flex items-center gap-1.5 ${
              activeView === 'referrals'
                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Referrals</span>
          </button>

          <button
            onClick={() => setActiveView('earnings')}
            className={`text-sm font-semibold transition-colors flex items-center gap-1.5 ${
              activeView === 'earnings'
                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Earnings</span>
          </button>

          <button
            onClick={() => setActiveView('payouts')}
            className={`text-sm font-semibold transition-colors flex items-center gap-1.5 ${
              activeView === 'payouts'
                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Payouts</span>
          </button>

          <button
            onClick={() => setActiveView('resources')}
            className={`text-sm font-semibold transition-colors flex items-center gap-1.5 ${
              activeView === 'resources'
                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Resources</span>
          </button>
        </nav>

        {/* Right Actions: Notifications, Account, Menu, Shield */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-300 transition-colors relative"
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {effectiveTheme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700 dark:text-slate-200" />
            )}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-300 transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-emerald-600 text-white text-[9px] font-black rounded-md flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {isNotifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-80 sm:w-[420px] z-50 overflow-hidden"
                >
                  <NotificationCenter onClose={() => setIsNotifOpen(false)} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Profile / Student Account */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
              >
                <img
                  src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'}
                  alt={user.name}
                  className="w-7 h-7 rounded-full object-cover border border-emerald-500"
                />
                <span className="hidden xl:inline font-semibold text-xs text-slate-800 dark:text-slate-200 max-w-[100px] truncate">
                  {user.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
              </button>

              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-2 z-50"
                  >
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                      <p className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">{user.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                      <span className="inline-block px-2 py-0.5 mt-1 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold capitalize">
                        {user.role} Account
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setActiveView('profile');
                      }}
                      className="w-full px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2"
                    >
                      <UserIcon className="w-4 h-4 text-emerald-600" /> Profile
                    </button>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setActiveView('saved');
                      }}
                      className="w-full px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Bookmark className="w-4 h-4 text-emerald-600" /> Saved Hostels
                      </div>
                      {savedListingIds.length > 0 && (
                        <span className="px-1.5 py-0.2 bg-emerald-600 text-white text-[10px] rounded-md font-bold">
                          {savedListingIds.length}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full px-4 py-2.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 mt-1"
                    >
                      <LogOut className="w-4 h-4 text-emerald-600" /> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button
              onClick={() => {
                setAuthModalTab('login');
                setAuthModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs"
            >
              Sign In
            </button>
          )}

          {/* Discreet Secure Access Shield Icon */}
          <button
            onClick={() => setIsAdminModalOpen(true)}
            title="Secure access"
            aria-label="Secure access"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
          >
            <ShieldCheck className="w-4 h-4 opacity-70 hover:opacity-100 transition-opacity text-slate-400 dark:text-slate-500" />
          </button>

          {/* Menu Button (Mobile / Vertical Nav) */}
          <div className="relative lg:hidden">
            <button
              onClick={() => setIsVerticalNavOpen(!isVerticalNavOpen)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-center"
              title="Menu"
              aria-label="Menu"
            >
              {isVerticalNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Vertical Navigation Panel */}
            <AnimatePresence>
              {isVerticalNavOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-50 overflow-hidden"
                >
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Navigation</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[9px] font-bold">
                      Dormiqa
                    </span>
                  </div>

                  <div className="flex flex-col gap-1 py-1 text-xs font-semibold">
                    <button
                      onClick={() => {
                        setActiveView('search');
                        setIsVerticalNavOpen(false);
                      }}
                      className={`w-full px-3 py-2.5 rounded-xl transition-all flex items-center justify-between text-left ${
                        activeView === 'home' || activeView === 'search'
                          ? 'bg-emerald-600 text-white font-bold'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Search className="w-4 h-4" />
                        <span>Discover Hostels</span>
                      </div>
                      {(activeView === 'home' || activeView === 'search') && <Check className="w-4 h-4 text-white" />}
                    </button>

                    <button
                      onClick={() => {
                        if (!user) {
                          setAuthModalTab('student_signup');
                          setAuthModalOpen(true);
                        } else {
                          setActiveView('saved');
                        }
                        setIsVerticalNavOpen(false);
                      }}
                      className={`w-full px-3 py-2.5 rounded-xl transition-all flex items-center justify-between text-left ${
                        activeView === 'saved'
                          ? 'bg-emerald-600 text-white font-bold'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Bookmark className="w-4 h-4" />
                        <span>Saved Hostels</span>
                      </div>
                      {savedListingIds.length > 0 && (
                        <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] rounded-md font-bold">
                          {savedListingIds.length}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        if (!user) {
                          setAuthModalTab('student_signup');
                          setAuthModalOpen(true);
                        } else {
                          setChatModalOpen(true);
                        }
                        setIsVerticalNavOpen(false);
                      }}
                      className="w-full px-3 py-2.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-2.5 text-left"
                    >
                      <MessageSquare className="w-4 h-4 text-emerald-600" />
                      <span>Messages</span>
                    </button>

                    <button
                      onClick={() => {
                        if (!user) {
                          setAuthModalTab('login');
                          setAuthModalOpen(true);
                        } else {
                          setActiveView(role === 'agent' ? 'agent_dashboard' : 'student_dashboard');
                        }
                        setIsVerticalNavOpen(false);
                      }}
                      className="w-full px-3 py-2.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-2.5 text-left"
                    >
                      <Home className="w-4 h-4" />
                      <span>Dashboard</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveView('info_hub');
                        setIsVerticalNavOpen(false);
                      }}
                      className={`w-full px-3 py-2.5 rounded-xl transition-all flex items-center justify-between text-left ${
                        activeView === 'info_hub'
                          ? 'bg-emerald-600 text-white font-bold'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-emerald-500" />
                        <span>Knowledge Base & Legal</span>
                      </div>
                      {activeView === 'info_hub' && <Check className="w-4 h-4 text-white" />}
                    </button>

                    {role === 'agent' && (
                      <>
                        <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                        <span className="px-3 pt-1 text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400">
                          Agent Tools
                        </span>
                        <button
                          onClick={() => {
                            setActiveView('agent_dashboard');
                            setAgentActiveTab('add_wizard');
                            setIsVerticalNavOpen(false);
                          }}
                          className="w-full px-3 py-2.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-2.5 text-left"
                        >
                          <PlusCircle className="w-4 h-4 text-emerald-600" />
                          <span>Add New Hostels</span>
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </header>
  );
};

