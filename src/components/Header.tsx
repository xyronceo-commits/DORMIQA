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
    setIsAdminModalOpen
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

  // If user is on landing page or onboarding page (or not signed in), show header consisting ONLY of logo and discreet secure access button
  if (!user || activeView === 'home' || activeView === 'role_select' || activeView === 'onboarding') {
    return (
      <header className="sticky top-0 z-50 w-full bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => setActiveView('home')}
            className="focus:outline-none group text-left"
          >
            <DormiqaLogo size="md" />
          </button>
          <button
            onClick={() => setIsAdminModalOpen(true)}
            title="Secure access"
            aria-label="Secure access"
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
          >
            <ShieldCheck className="w-4 h-4 opacity-70 hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        
        {/* Left Brand Logo & Uni Selector */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveView('home')}
            className="focus:outline-none group text-left"
          >
            <DormiqaLogo size="md" />
          </button>

          {/* University Picker Dropdown */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setIsUniDropdownOpen(!isUniDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-xs font-medium text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-800 transition-colors"
            >
              <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="max-w-[140px] truncate">
                {selectedUniversity ? selectedUniversity.shortName : 'All Universities'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
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
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">{INITIAL_UNIVERSITIES.length} Campus Hubs</span>
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

        {/* Right Actions: Vertical Nav, Notifications, Dark Mode, Profile */}
        <div className="flex items-center gap-2">

          {/* Vertical Navigation Menu Button (Top Right) */}
          <div className="relative">
            <button
              onClick={() => setIsVerticalNavOpen(!isVerticalNavOpen)}
              className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-center"
              title="Navigation Menu"
              aria-label="Navigation Menu"
            >
              {isVerticalNavOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Vertical Navigation Panel (Anchored Right) */}
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
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[9px] font-bold">
                      Dormiqa
                    </span>
                  </div>

                  {/* Vertical Stacked Navigation Items */}
                  <div className="flex flex-col gap-1 py-1 text-xs font-bold">
                    <button
                      onClick={() => {
                        setActiveView('home');
                        setIsVerticalNavOpen(false);
                      }}
                      className={`w-full px-3 py-2.5 rounded-xl transition-all flex items-center justify-between text-left ${
                        activeView === 'home'
                          ? 'bg-emerald-600 text-white font-black'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Home className="w-4 h-4" />
                        <span>Home Page</span>
                      </div>
                      {activeView === 'home' && <Check className="w-4 h-4 text-white" />}
                    </button>

                    <button
                      onClick={() => {
                        setActiveView('search');
                        setIsVerticalNavOpen(false);
                      }}
                      className={`w-full px-3 py-2.5 rounded-xl transition-all flex items-center justify-between text-left ${
                        activeView === 'search'
                          ? 'bg-emerald-600 text-white font-black'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Search className="w-4 h-4" />
                        <span>Explore Hostels</span>
                      </div>
                      {activeView === 'search' && <Check className="w-4 h-4 text-white" />}
                    </button>

                    <button
                      onClick={() => {
                        setActiveView('saved');
                        setIsVerticalNavOpen(false);
                      }}
                      className={`w-full px-3 py-2.5 rounded-xl transition-all flex items-center justify-between text-left ${
                        activeView === 'saved'
                          ? 'bg-emerald-600 text-white font-black'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Bookmark className="w-4 h-4" />
                        <span>Saved / Bookmarks</span>
                      </div>
                      {savedListingIds.length > 0 && (
                        <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] rounded-full font-bold">
                          {savedListingIds.length}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setActiveView('profile');
                        setIsVerticalNavOpen(false);
                      }}
                      className={`w-full px-3 py-2.5 rounded-xl transition-all flex items-center justify-between text-left ${
                        activeView === 'profile'
                          ? 'bg-emerald-600 text-white font-black'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <UserIcon className="w-4 h-4" />
                        <span>My Profile</span>
                      </div>
                      {activeView === 'profile' && <Check className="w-4 h-4 text-white" />}
                    </button>

                    <button
                      onClick={() => {
                        setActiveView('info_hub');
                        setIsVerticalNavOpen(false);
                      }}
                      className={`w-full px-3 py-2.5 rounded-xl transition-all flex items-center justify-between text-left ${
                        activeView === 'info_hub'
                          ? 'bg-emerald-600 text-white font-black'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-emerald-500" />
                        <span>Legal & Knowledge Base</span>
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

                    {/* Theme Mode Control inside Vertical Nav */}
                    <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                    <div className="px-3 py-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                          {effectiveTheme === 'dark' ? <Moon className="w-3.5 h-3.5 text-emerald-400" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
                          Theme Mode
                        </span>
                        <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400">
                          {theme === 'system' ? `Device (${effectiveTheme})` : `${theme} mode`}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
                        <button
                          onClick={() => setTheme('light')}
                          className={`py-1.5 px-2 rounded-lg text-[10px] font-extrabold transition-all flex items-center justify-center gap-1 ${
                            theme === 'light'
                              ? 'bg-white text-slate-900 shadow-sm'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          <Sun className="w-3 h-3 text-amber-500" /> Light
                        </button>
                        <button
                          onClick={() => setTheme('dark')}
                          className={`py-1.5 px-2 rounded-lg text-[10px] font-extrabold transition-all flex items-center justify-center gap-1 ${
                            theme === 'dark'
                              ? 'bg-slate-950 text-white shadow-sm'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          <Moon className="w-3 h-3 text-emerald-400" /> Dark
                        </button>
                        <button
                          onClick={() => setTheme('system')}
                          className={`py-1.5 px-2 rounded-lg text-[10px] font-extrabold transition-all flex items-center justify-center gap-1 ${
                            theme === 'system'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          <Laptop className="w-3 h-3" /> Device
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick Theme Toggle Button in Header Bar */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors flex items-center justify-center relative group"
            title={theme === 'system' ? `Device Settings Active (${effectiveTheme})` : `Current Theme: ${theme}. Click to toggle.`}
            aria-label="Toggle Light and Dark Mode"
          >
            {effectiveTheme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-400 group-hover:rotate-45 transition-transform" />
            ) : (
              <Moon className="w-5 h-5 text-slate-700 dark:text-slate-200 group-hover:-rotate-12 transition-transform" />
            )}
            {theme === 'system' && (
              <span className="absolute bottom-1 right-1 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900" title="Synced with Device Settings" />
            )}
          </button>

          {/* Notifications Popover */}
          <div className="relative">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-emerald-600 text-white text-[10px] font-black rounded-full flex items-center justify-center">
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



          {/* Discreet Secure Access Icon */}
          <button
            onClick={() => setIsAdminModalOpen(true)}
            title="Secure access"
            aria-label="Secure access"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          >
            <ShieldCheck className="w-4 h-4 opacity-70 hover:opacity-100 transition-opacity text-slate-500 dark:text-slate-400" />
          </button>

          {/* User Profile / Login Button */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <img
                  src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover border-2 border-emerald-500"
                />
                <span className="hidden sm:inline font-bold text-xs text-slate-800 dark:text-slate-200 max-w-[120px] truncate">
                  {user.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
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
                        <span className="px-1.5 py-0.2 bg-emerald-600 text-white text-[10px] rounded-full font-bold">
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
                      <LogOut className="w-4 h-4 text-emerald-600" /> Sign Out / Log Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setAuthModalTab('login');
                  setAuthModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-colors shadow-sm"
              >
                Sign In
              </button>
            </div>
          )}

        </div>
      </div>
    </header>
  );
};

