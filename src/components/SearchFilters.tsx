import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchListings } from '../lib/api';
import { subscribeFirestoreListings } from '../lib/firebase';
import { ListingCard } from './ListingCard';
import { Listing, Facility } from '../types';
import { INITIAL_UNIVERSITIES } from '../data/mockData';
import { Search, Sparkles, Filter, X, SlidersHorizontal, Navigation, ShieldCheck, RefreshCw, Check, GraduationCap, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const SearchFilters: React.FC = () => {
  const { selectedUniversity, setSelectedUniversity, addToast } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedOwnership, setSelectedOwnership] = useState('all');
  const [selectedInstType, setSelectedInstType] = useState('all');
  const [selectedState, setSelectedState] = useState('all');
  const [gender, setGender] = useState('all');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [selectedFacilities, setSelectedFacilities] = useState<Facility[]>([]);
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [maxDistanceMinutes, setMaxDistanceMinutes] = useState<number | ''>('');
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'distance' | 'rating' | 'newest'>('newest');

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchListings({
        universityId: selectedUniversity ? selectedUniversity.id : undefined,
        type: selectedType !== 'all' ? selectedType : undefined,
        gender: gender !== 'all' ? gender : undefined,
        maxPrice: maxPrice !== '' ? Number(maxPrice) : null,
        searchQuery: searchQuery || undefined,
      });

      let results = [...data];

      if (selectedOwnership !== 'all') {
        results = results.filter(l => {
          const u = INITIAL_UNIVERSITIES.find(uni => uni.id === l.universityId);
          return u?.ownership === selectedOwnership;
        });
      }

      if (selectedInstType !== 'all') {
        results = results.filter(l => {
          const u = INITIAL_UNIVERSITIES.find(uni => uni.id === l.universityId);
          return u?.institutionType === selectedInstType;
        });
      }

      if (selectedState !== 'all') {
        results = results.filter(l => {
          const u = INITIAL_UNIVERSITIES.find(uni => uni.id === l.universityId);
          return u?.state === selectedState;
        });
      }

      if (onlyVerified) {
        results = results.filter(l => l.isAgentVerified);
      }

      if (selectedFacilities.length > 0) {
        results = results.filter(l => 
          selectedFacilities.every(fac => l.facilities.includes(fac))
        );
      }

      if (maxDistanceMinutes !== '') {
        results = results.filter(l => l.distanceToCampusMinutes <= Number(maxDistanceMinutes));
      }

      if (sortBy === 'price_asc') {
        results.sort((a, b) => a.price - b.price);
      } else if (sortBy === 'price_desc') {
        results.sort((a, b) => b.price - a.price);
      } else if (sortBy === 'distance') {
        results.sort((a, b) => a.distanceToCampusMinutes - b.distanceToCampusMinutes);
      } else if (sortBy === 'rating') {
        results.sort((a, b) => b.ratings.overall - a.ratings.overall);
      } else {
        results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }

      setListings(results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeFirestoreListings(() => {
      loadData();
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [
    selectedUniversity, 
    selectedType, 
    selectedOwnership, 
    selectedInstType, 
    selectedState, 
    gender, 
    maxPrice, 
    searchQuery, 
    onlyVerified, 
    selectedFacilities, 
    maxDistanceMinutes, 
    sortBy
  ]);

  const toggleFacility = (fac: Facility) => {
    setSelectedFacilities(prev => 
      prev.includes(fac) ? prev.filter(f => f !== fac) : [...prev, fac]
    );
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedType('all');
    setSelectedOwnership('all');
    setSelectedInstType('all');
    setSelectedState('all');
    setGender('all');
    setMaxPrice('');
    setSelectedFacilities([]);
    setOnlyVerified(false);
    setMaxDistanceMinutes('');
  };

  const activeFilterCount = 
    (selectedType !== 'all' ? 1 : 0) +
    (selectedOwnership !== 'all' ? 1 : 0) +
    (selectedInstType !== 'all' ? 1 : 0) +
    (selectedState !== 'all' ? 1 : 0) +
    (gender !== 'all' ? 1 : 0) +
    (maxPrice !== '' ? 1 : 0) +
    (maxDistanceMinutes !== '' ? 1 : 0) +
    (onlyVerified ? 1 : 0) +
    selectedFacilities.length;

  const facilityList: { key: Facility; label: string }[] = [
    { key: 'electricity_247', label: '24/7 Power' },
    { key: 'solar_power', label: 'Solar Backup' },
    { key: 'wifi', label: 'Wi-Fi' },
    { key: 'water_running', label: 'Borehole Water' },
    { key: 'security_guard', label: 'Security Guard' },
    { key: 'cctv', label: 'CCTV' },
    { key: 'kitchen', label: 'Kitchenette' },
    { key: 'laundry', label: 'Laundry' },
    { key: 'gym', label: 'Gym' },
    { key: 'furnished', label: 'Furnished' },
  ];

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      
      {/* LEVEL 2: PROPERTY DISCOVERY & SEARCH AREA */}
      <div className="space-y-4">
        
        {/* Row 1: Institution Category Treatment */}
        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-3">
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar py-1 text-xs font-semibold">
            {[
              { id: 'all', label: 'All Institutions' },
              { id: 'Federal', label: 'Federal Uni' },
              { id: 'State', label: 'State Uni' },
              { id: 'Private', label: 'Private Uni' },
              { id: 'Polytechnic', label: 'Polytechnics' },
            ].map(cat => {
              const isActive = cat.id === 'all' 
                ? (selectedOwnership === 'all' && selectedInstType === 'all')
                : (cat.id === 'Polytechnic' ? selectedInstType === 'Polytechnic' : selectedOwnership === cat.id);
              
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    if (cat.id === 'all') {
                      setSelectedOwnership('all');
                      setSelectedInstType('all');
                    } else if (cat.id === 'Polytechnic') {
                      setSelectedOwnership('all');
                      setSelectedInstType('Polytechnic');
                    } else {
                      setSelectedOwnership(cat.id);
                      setSelectedInstType('all');
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg shrink-0 transition-all ${
                    isActive
                      ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {selectedUniversity && (
            <button
              onClick={() => setSelectedUniversity(null)}
              className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium shrink-0"
            >
              <span>{selectedUniversity.shortName}</span>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Row 2: Primary Property Search Bar & Grouped Secondary Controls */}
        <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            
            {/* Search Input */}
            <div className="relative md:col-span-5">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search hostel name, campus gate, or street..."
                className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Walking Distance Selector */}
            <div className="md:col-span-2">
              <select
                value={maxDistanceMinutes}
                onChange={(e) => setMaxDistanceMinutes(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 text-xs font-medium focus:outline-none"
              >
                <option value="">Walking Distance: Any</option>
                <option value="5">≤ 5 mins walk</option>
                <option value="10">≤ 10 mins walk</option>
                <option value="15">≤ 15 mins walk</option>
                <option value="20">≤ 20 mins walk</option>
              </select>
            </div>

            {/* Maximum Budget Selector */}
            <div className="md:col-span-2">
              <select
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 text-xs font-medium focus:outline-none"
              >
                <option value="">Budget: Any Price</option>
                <option value="200000">≤ ₦200,000 / yr</option>
                <option value="300000">≤ ₦300,000 / yr</option>
                <option value="500000">≤ ₦500,000 / yr</option>
                <option value="800000">≤ ₦800,000 / yr</option>
                <option value="1200000">≤ ₦1,200,000 / yr</option>
              </select>
            </div>

            {/* Filters Button */}
            <div className="md:col-span-3 flex items-center gap-2">
              <button
                onClick={() => setIsFilterDrawerOpen(true)}
                className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="w-4 h-4 rounded bg-emerald-600 text-white text-[9px] font-black flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

          </div>

          {/* Quick Room Type Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 text-xs">
            {[
              { id: 'all', label: 'All Room Types' },
              { id: 'self_contain', label: 'Self-Contain' },
              { id: 'single_room', label: 'Single Room' },
              { id: 'hostel', label: 'Private Hostel' },
              { id: 'flat_apartment', label: 'Flat Apartment' },
              { id: 'shared_lodge', label: 'Shared Lodge' },
            ].map((pill) => (
              <button
                key={pill.id}
                onClick={() => setSelectedType(pill.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                  selectedType === pill.id
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

        </div>

        {/* Row 3: Results Toolbar (Separated & Lighter) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
          
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {listings.length} {listings.length === 1 ? 'lodging' : 'lodgings'} {selectedUniversity ? `near ${selectedUniversity.shortName}` : 'available'}
            </span>
            {activeFilterCount > 0 && (
              <button
                onClick={resetFilters}
                className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-semibold underline ml-2"
              >
                Clear Filters ({activeFilterCount})
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-400 mr-1 hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="newest">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="distance">Nearest to Campus Gate</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </div>

        </div>

      </div>

      {/* LEVEL 3: PROPERTY RESULTS / HERO LISTINGS */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-80 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="py-16 px-4 text-center space-y-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 my-4">
          <Search className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">No stays match these filters</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Try widening your budget, selecting another university campus, or resetting your filter preferences.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={resetFilters}
              className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:opacity-90 transition-opacity"
            >
              Reset Filters
            </button>
            <button
              onClick={() => {
                setMaxPrice('');
                setMaxDistanceMinutes('');
              }}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Expand Search Range
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {listings.map(listing => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}

      {/* Filter Drawer Modal */}
      <AnimatePresence>
        {isFilterDrawerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Filter Accommodations</h3>
                <button
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 space-y-6 overflow-y-auto flex-1">
                {/* Max Price & Max Walk Distance */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Max Price (₦/yr)
                    </label>
                    <input
                      type="number"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : '')}
                      placeholder="e.g. 400000"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Max Walk Time (min)
                    </label>
                    <input
                      type="number"
                      value={maxDistanceMinutes}
                      onChange={(e) => setMaxDistanceMinutes(e.target.value ? Number(e.target.value) : '')}
                      placeholder="e.g. 10"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                {/* State Filter */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    State in Nigeria
                  </label>
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
                  >
                    <option value="all">All States</option>
                    <option value="Lagos">Lagos State</option>
                    <option value="Oyo">Oyo State (Ibadan/Ogbomoso)</option>
                    <option value="Ogun">Ogun State (Abeokuta/Ilaro)</option>
                    <option value="Osun">Osun State (Ile-Ife/Osogbo)</option>
                    <option value="Ondo">Ondo State (Akure)</option>
                    <option value="FCT Abuja">FCT Abuja</option>
                    <option value="Enugu">Enugu State</option>
                    <option value="Anambra">Anambra State (Awka)</option>
                    <option value="Imo">Imo State (Owerri)</option>
                    <option value="Rivers">Rivers State (Port Harcourt)</option>
                    <option value="Kwara">Kwara State (Ilorin)</option>
                  </select>
                </div>

                {/* Verified Only Checkbox */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="verifiedCheck"
                    checked={onlyVerified}
                    onChange={(e) => setOnlyVerified(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <label htmlFor="verifiedCheck" className="text-xs font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Only Show Verified Landlords & Agents
                  </label>
                </div>

                {/* Facilities Checklist */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Key Facilities
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {facilityList.map(fac => {
                      const checked = selectedFacilities.includes(fac.key);
                      return (
                        <button
                          key={fac.key}
                          type="button"
                          onClick={() => toggleFacility(fac.key)}
                          className={`p-2 rounded-xl text-left border font-medium flex items-center justify-between transition-colors ${
                            checked
                              ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                              : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <span className="truncate">{fac.label}</span>
                          {checked && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors"
                >
                  Apply Filters ({listings.length} Results)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
