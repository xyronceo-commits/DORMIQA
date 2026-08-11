import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchListings } from '../lib/api';
import { subscribeFirestoreListings } from '../lib/firebase';
import { searchAccommodationWithAi } from '../lib/gemini';
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

  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [showAiSearch, setShowAiSearch] = useState(false);

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const loadData = async (aiMatchedIds?: string[]) => {
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

      if (aiMatchedIds && aiMatchedIds.length > 0) {
        results = results.filter(l => aiMatchedIds.includes(l.id));
      }

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

  const handleAiSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiExplanation(null);
    try {
      const result = await searchAccommodationWithAi(aiPrompt);
      setAiExplanation(result.explanation);
      addToast('AI Search Complete', `Matched listings for "${aiPrompt}"`, 'success');
      loadData(result.matchedListingIds);
    } catch (err) {
      addToast('Error', 'AI search failed, fallback filters applied', 'warning');
    } finally {
      setAiLoading(false);
    }
  };

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
    setAiExplanation(null);
    setAiPrompt('');
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
      {/* Search Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Find Student Housing
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {selectedUniversity ? `Showing accommodations near ${selectedUniversity.name}` : 'Explore verified accommodations across all Nigerian universities'}
          </p>
        </div>

        {/* Primary Search Controls Bar */}
        <div className="p-2 sm:p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by hostel name, area, or street..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
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

            {/* Filter Drawer Toggle Button */}
            <button
              onClick={() => setIsFilterDrawerOpen(true)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium text-sm flex items-center justify-center gap-2 transition-colors shrink-0"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* AI Assistant Search Toggle */}
            <button
              onClick={() => setShowAiSearch(!showAiSearch)}
              className={`px-4 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors shrink-0 ${
                showAiSearch
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>AI Search</span>
            </button>
          </div>

          {/* Quick Room Type Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
            {[
              { id: 'all', label: 'All Types' },
              { id: 'self_contain', label: 'Self-Contain' },
              { id: 'single_room', label: 'Single Room' },
              { id: 'hostel', label: 'Private Hostel' },
              { id: 'flat_apartment', label: 'Flat Apartment' },
              { id: 'shared_lodge', label: 'Shared Lodge' },
            ].map((pill) => (
              <button
                key={pill.id}
                onClick={() => setSelectedType(pill.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                  selectedType === pill.id
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Optional Natural Language AI Search Box */}
          <AnimatePresence>
            {showAiSearch && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleAiSearch}
                className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2"
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Describe what you need e.g. Self-contain under ₦300k with solar inverter..."
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={aiLoading}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold text-xs transition-colors shrink-0 flex items-center gap-1.5"
                  >
                    {aiLoading ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Search</span>
                      </>
                    )}
                  </button>
                </div>
                {aiExplanation && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    {aiExplanation}
                  </p>
                )}
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Results Controls Bar */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Accommodations
          </h2>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold">
            {listings.length}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {activeFilterCount > 0 && (
            <button
              onClick={resetFilters}
              className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 underline"
            >
              Reset filters
            </button>
          )}

          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="distance">Nearest to Campus</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>
      </div>

      {/* Accommodations Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-80 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Search className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-base">No Accommodations Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try loosening your price filters or searching for a different room type.
          </p>
          <button
            onClick={resetFilters}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
