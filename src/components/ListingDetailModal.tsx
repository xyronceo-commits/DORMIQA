import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { InteractiveMap } from './InteractiveMap';
import { submitReview, fetchReviews } from '../lib/api';
import { Review } from '../types';
import { 
  X, Star, ShieldCheck, MapPin, Navigation, Calendar, Phone, Mail, MessageSquare, 
  Share2, Bookmark, AlertTriangle, Check, Play, User, Zap, Droplets, Wifi, Shield,
  Volume2, Sparkles, DollarSign, Send, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ListingDetailModal: React.FC = () => {
  const { 
    selectedListing, 
    setSelectedListing, 
    isSaved, 
    toggleSaveListing, 
    setInspectionModalListing, 
    setReportModalListing,
    openChatWithListing,
    user,
    addToast
  } = useAuth();

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [reviewsList, setReviewsList] = useState<Review[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Review Form State
  const [comment, setComment] = useState('');
  const [ratings, setRatings] = useState({
    security: 5,
    water: 5,
    electricity: 5,
    internet: 5,
    cleanliness: 5,
    noise: 5,
    value: 5,
  });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (selectedListing) {
      setActiveImageIdx(0);
      setIsVideoOpen(false);
      // Fetch listing reviews
      fetch(`/api/reviews/${selectedListing.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.reviews) setReviewsList(data.reviews);
        })
        .catch(() => {});
    }
  }, [selectedListing]);

  if (!selectedListing) return null;

  const saved = isSaved(selectedListing.id);
  const formattedPrice = new Intl.NumberFormat().format(selectedListing.price);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      addToast('Link Copied!', 'Listing link copied to clipboard.');
    }
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmittingReview(true);
    try {
      const newRev = await submitReview({
        listingId: selectedListing.id,
        studentId: user?.id || 'stud_current',
        studentName: user?.name || 'Student Inspector',
        studentAvatar: user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
        comment,
        ...ratings
      });

      setReviewsList(prev => [newRev, ...prev]);
      setShowReviewForm(false);
      setComment('');
      addToast('Review Submitted', 'Thank you for sharing your experience!');
    } catch (err) {
      addToast('Error', 'Failed to submit review', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const renderStarInput = (category: keyof typeof ratings, label: string, icon: any) => {
    const Icon = icon;
    return (
      <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80 text-xs">
        <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          {label}
        </span>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              onClick={() => setRatings(prev => ({ ...prev, [category]: star }))}
              className="p-0.5 focus:outline-none"
            >
              <Star
                className={`w-4 h-4 ${
                  star <= ratings[category]
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-slate-300 dark:text-slate-600'
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="relative w-full max-w-5xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 my-auto max-h-[92vh] flex flex-col"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 backdrop-blur sticky top-0 z-20">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider">
                  {selectedListing.accommodationTypeName || selectedListing.type.replace('_', ' ')}
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold">
                  Property Type: {selectedListing.type.replace('_', ' ')}
                </span>
                {selectedListing.isAgentVerified && (
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Agent
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-1 line-clamp-1">
                {selectedListing.title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>{selectedListing.address}</span> • <span className="font-bold text-slate-700 dark:text-slate-300">{selectedListing.universityName}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
                title="Share link"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => toggleSaveListing(selectedListing.id)}
                className={`p-2 rounded-xl transition-colors ${
                  saved ? 'bg-rose-500 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400'
                }`}
                title={saved ? 'Unsave' : 'Save'}
              >
                <Bookmark className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={() => setSelectedListing(null)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Scrollable Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
            {/* 360 Video Walkthrough Tour Highlight Banner */}
            {(selectedListing.video360Url || selectedListing.videoUrl) && (
              <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-lg border border-indigo-800/50 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-600/80 text-white shrink-0">
                    <Play className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-2">
                      <span>360° Walkthrough Video Tour Available</span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-[10px] font-black uppercase text-white">Live Inspection</span>
                    </h4>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      Explore the room, facilities, walk-around and surroundings before booking.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsVideoOpen(!isVideoOpen)}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs transition-all shadow-md flex items-center gap-1.5"
                >
                  <Play className="w-4 h-4 fill-current" />
                  {isVideoOpen ? 'Hide 360° Walkthrough' : 'Watch 360° Walkthrough Video'}
                </button>
              </div>
            )}

            {/* Video Player Box if Open */}
            {isVideoOpen && (selectedListing.video360Url || selectedListing.videoUrl) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 rounded-2xl bg-slate-950 text-white space-y-3 border border-indigo-500/30 shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-sm font-extrabold flex items-center gap-2 text-emerald-400">
                    <Sparkles className="w-4 h-4 text-emerald-400" /> 360-Degree Video Walkthrough Tour
                  </h4>
                  <button onClick={() => setIsVideoOpen(false)} className="text-xs text-slate-400 hover:text-white font-bold">
                    ✕ Close Tour
                  </button>
                </div>
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-black shadow-inner">
                  {(() => {
                    const videoSrc = selectedListing.video360Url || selectedListing.videoUrl || '';
                    const isDirectVideo = videoSrc.startsWith('data:video') || videoSrc.startsWith('blob:') || videoSrc.match(/\.(mp4|webm|mov|ogg)(\?.*)?$/i);
                    if (isDirectVideo) {
                      return (
                        <video
                          src={videoSrc}
                          controls
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      );
                    }
                    return (
                      <iframe
                        src={videoSrc}
                        title="360° Video Walkthrough Tour"
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    );
                  })()}
                </div>
              </motion.div>
            )}

            {/* Gallery Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <span>Photo Gallery</span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold">
                    {selectedListing.images.length} Verified Photos
                  </span>
                </h3>
              </div>

              <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] rounded-2xl overflow-hidden bg-slate-900 shadow-md">
                <img
                  src={selectedListing.images[activeImageIdx] || selectedListing.images[0]}
                  alt={selectedListing.title}
                  className="w-full h-full object-cover"
                />

                <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur px-3 py-1 rounded-xl text-white text-[11px] font-bold">
                  Photo {activeImageIdx + 1} of {selectedListing.images.length}
                </div>
              </div>

              {/* Thumbnails row */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {selectedListing.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIdx(idx)}
                    className={`relative w-20 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                      idx === activeImageIdx
                        ? 'border-emerald-500 scale-105 shadow-md'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Key Grid Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column - Specs & Details */}
              <div className="md:col-span-2 space-y-6">
                {/* Price & Location Banner */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rent Price</span>
                      {selectedListing.salesInformation?.saleType && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase border border-emerald-500/30">
                          {selectedListing.salesInformation.saleType.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                        {selectedListing.currency}{formattedPrice}
                      </span>
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        / {selectedListing.pricePeriod}
                      </span>
                    </div>

                    <p className="text-xs font-semibold mt-1 flex items-center gap-1">
                      {selectedListing.unitStatus === 'under_renovation' ? (
                        <span className="text-amber-600 dark:text-amber-400 font-extrabold">
                          🛠️ Under Renovation Mode
                        </span>
                      ) : selectedListing.unitStatus === 'occupied' || selectedListing.isOccupied ? (
                        <span className="text-rose-600 dark:text-rose-400 font-extrabold">
                          🔴 Fully Occupied / Rented Out
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> {selectedListing.availableRooms ?? selectedListing.totalRooms} of {selectedListing.totalRooms} rooms available
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex flex-col items-end text-right">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Proximity to Gate</span>
                    <span className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mt-0.5">
                      <Navigation className="w-4 h-4 text-emerald-500" />
                      {selectedListing.distanceToCampusMinutes} min walk ({selectedListing.distanceToCampusKm} km)
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {selectedListing.universityName}
                    </span>
                  </div>
                </div>

                {/* Renovation Notice Box if under renovation */}
                {(selectedListing.unitStatus === 'under_renovation' || selectedListing.renovationNotes) && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs space-y-1.5">
                    <h4 className="font-extrabold text-amber-700 dark:text-amber-300 flex items-center gap-2 text-xs">
                      <span>🛠️ Renovation / Upgrade Notice</span>
                    </h4>
                    <p className="font-medium text-slate-700 dark:text-slate-300">
                      {selectedListing.renovationNotes || 'Property undergoing minor upgrades and interior touch-ups for upcoming term.'}
                    </p>
                    {selectedListing.renovationExpectedCompletion && (
                      <p className="font-extrabold text-amber-800 dark:text-amber-400 text-[11px]">
                        📅 Expected Completion: {selectedListing.renovationExpectedCompletion}
                      </p>
                    )}
                  </div>
                )}

                {/* Sales & Additional Fees Breakdown */}
                {selectedListing.salesInformation && (
                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
                    <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-xs flex items-center justify-between">
                      <span>Mandatory Rental Fees Breakdown</span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Transparent Pricing</span>
                    </h4>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {selectedListing.salesInformation.cautionDeposit ? (
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <span className="block text-[10px] text-slate-400 font-bold">Caution Deposit</span>
                          <span className="font-extrabold text-slate-900 dark:text-slate-100">
                            ₦{new Intl.NumberFormat().format(selectedListing.salesInformation.cautionDeposit)}
                          </span>
                        </div>
                      ) : null}

                      {selectedListing.salesInformation.agencyFee ? (
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <span className="block text-[10px] text-slate-400 font-bold">Agency Fee</span>
                          <span className="font-extrabold text-slate-900 dark:text-slate-100">
                            ₦{new Intl.NumberFormat().format(selectedListing.salesInformation.agencyFee)}
                          </span>
                        </div>
                      ) : null}

                      {selectedListing.salesInformation.legalFee ? (
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <span className="block text-[10px] text-slate-400 font-bold">Legal Fee</span>
                          <span className="font-extrabold text-slate-900 dark:text-slate-100">
                            ₦{new Intl.NumberFormat().format(selectedListing.salesInformation.legalFee)}
                          </span>
                        </div>
                      ) : null}

                      {selectedListing.salesInformation.serviceCharge ? (
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <span className="block text-[10px] text-slate-400 font-bold">Service Charge</span>
                          <span className="font-extrabold text-slate-900 dark:text-slate-100">
                            ₦{new Intl.NumberFormat().format(selectedListing.salesInformation.serviceCharge)}
                          </span>
                        </div>
                      ) : null}
                    </div>

                    {selectedListing.salesInformation.paymentTerms && (
                      <div className="pt-2 text-xs border-t border-slate-100 dark:border-slate-700">
                        <span className="font-bold text-slate-700 dark:text-slate-300">Payment Terms: </span>
                        <span className="text-slate-500 dark:text-slate-400">{selectedListing.salesInformation.paymentTerms}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Description */}
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">About Accommodation</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {selectedListing.description}
                  </p>
                </div>

                {/* Facilities Badges */}
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-3">Included Amenities & Infrastructure</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {selectedListing.facilities.map((fac, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-sm"
                      >
                        <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                        <span className="capitalize">{fac.replace('_', ' ')}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* House Rules */}
                {selectedListing.rules && selectedListing.rules.length > 0 && (
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">Hostel & Lodge Rules</h3>
                    <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                      {selectedListing.rules.map((rule, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                          <span>{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Interactive Location Map */}
                <InteractiveMap
                  lat={selectedListing.coordinates.lat}
                  lng={selectedListing.coordinates.lng}
                  title={selectedListing.title}
                  universityName={selectedListing.universityName}
                  address={selectedListing.address}
                  distanceMinutes={selectedListing.distanceToCampusMinutes}
                />

                {/* Reviews Breakdown Section */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                        Student Rating Breakdown
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Based on verified student resident reviews</p>
                    </div>

                    <button
                      onClick={() => setShowReviewForm(!showReviewForm)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold text-xs hover:opacity-90 transition-opacity"
                    >
                      {showReviewForm ? 'Cancel Review' : '+ Write Review'}
                    </button>
                  </div>

                  {/* Category Ratings Bar Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2 border-y border-slate-200 dark:border-slate-700 text-xs">
                    <div>
                      <p className="text-slate-500 dark:text-slate-400 font-medium">Security</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{selectedListing.ratings.security} / 5</p>
                    </div>
                    <div>
                      <p className="text-slate-500 dark:text-slate-400 font-medium">Water Supply</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{selectedListing.ratings.water} / 5</p>
                    </div>
                    <div>
                      <p className="text-slate-500 dark:text-slate-400 font-medium">Power / Light</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{selectedListing.ratings.electricity} / 5</p>
                    </div>
                    <div>
                      <p className="text-slate-500 dark:text-slate-400 font-medium">Internet / Wi-Fi</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{selectedListing.ratings.internet} / 5</p>
                    </div>
                    <div>
                      <p className="text-slate-500 dark:text-slate-400 font-medium">Cleanliness</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{selectedListing.ratings.cleanliness} / 5</p>
                    </div>
                    <div>
                      <p className="text-slate-500 dark:text-slate-400 font-medium">Quietness / Noise</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{selectedListing.ratings.noise} / 5</p>
                    </div>
                    <div>
                      <p className="text-slate-500 dark:text-slate-400 font-medium">Value for Money</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{selectedListing.ratings.value} / 5</p>
                    </div>
                    <div>
                      <p className="text-slate-500 dark:text-slate-400 font-medium">Overall Score</p>
                      <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{selectedListing.ratings.overall} / 5</p>
                    </div>
                  </div>

                  {/* Add Review Form if toggled */}
                  {showReviewForm && (
                    <form onSubmit={handleAddReview} className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Rate Your Student Experience</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {renderStarInput('security', 'Security & Safety', Shield)}
                        {renderStarInput('water', 'Water Supply', Droplets)}
                        {renderStarInput('electricity', 'Electricity / Inverter', Zap)}
                        {renderStarInput('internet', 'Internet & Wi-Fi', Wifi)}
                        {renderStarInput('cleanliness', 'Cleanliness', Sparkles)}
                        {renderStarInput('noise', 'Noise & Environment', Volume2)}
                        {renderStarInput('value', 'Value for Money', DollarSign)}
                      </div>
                      <div>
                        <textarea
                          rows={2}
                          required
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="Write your review for fellow students..."
                          className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={submittingReview}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" /> Submit Review
                      </button>
                    </form>
                  )}

                  {/* Review List */}
                  <div className="space-y-3 pt-2">
                    {reviewsList.map(rev => (
                      <div key={rev.id} className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <img src={rev.studentAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'} alt="" className="w-6 h-6 rounded-full object-cover" />
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{rev.studentName}</span>
                          </div>
                          <div className="flex items-center gap-1 text-amber-500 font-bold">
                            <Star className="w-3.5 h-3.5 fill-current" /> {rev.overall}
                          </div>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{rev.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column - Agent & Action Card */}
              <div className="space-y-4">
                {/* Agent Card */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md space-y-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedListing.agentAvatar}
                      alt={selectedListing.agentName}
                      className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500"
                    />
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm line-clamp-1">
                        {selectedListing.agentName}
                      </h4>
                      {selectedListing.isAgentVerified ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Verified Dormiqa Agent
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                          Pending Verification
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-700">
                    <a
                      href={`tel:${selectedListing.agentPhone}`}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 transition-colors font-medium"
                    >
                      <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{selectedListing.agentPhone}</span>
                    </a>
                    <a
                      href={`mailto:${selectedListing.agentEmail}`}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 transition-colors font-medium truncate"
                    >
                      <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="truncate">{selectedListing.agentEmail}</span>
                    </a>
                  </div>

                  {/* Primary CTA Buttons */}
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        openChatWithListing({
                          id: selectedListing.id,
                          title: selectedListing.title,
                          agentId: selectedListing.agentId,
                          agentName: selectedListing.agentName
                        });
                      }}
                      className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm transition-colors flex items-center justify-center gap-2 shadow-md"
                    >
                      <MessageSquare className="w-4 h-4 text-emerald-400" />
                      Message Agent Live
                    </button>

                    <button
                      onClick={() => setInspectionModalListing(selectedListing)}
                      className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                    >
                      <Calendar className="w-4 h-4" />
                      Book Physical Inspection
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center leading-normal">
                    <Lock className="w-3 h-3 inline mr-1 text-emerald-500" />
                    Dormiqa does NOT process rent payments. Inspect in person before making agreements!
                  </p>

                  {/* Report Button */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700 text-center">
                    <button
                      onClick={() => setReportModalListing(selectedListing)}
                      className="text-xs text-rose-500 hover:text-rose-700 font-semibold inline-flex items-center gap-1"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" /> Report suspicious listing
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
