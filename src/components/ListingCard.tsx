import React, { useState } from 'react';
import { Listing } from '../types';
import { useAuth } from '../context/AuthContext';
import { Bookmark, ShieldCheck, MapPin, Navigation, Calendar, ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface ListingCardProps {
  listing: Listing;
  onSelect?: (listing: Listing) => void;
}

export const ListingCard: React.FC<ListingCardProps> = ({ listing, onSelect }) => {
  const { user, isSaved, toggleSaveListing, setSelectedListing, setInspectionModalListing, setAuthModalOpen, setAuthModalTab } = useAuth();
  const [currentImageIdx, setCurrentImageIdx] = useState(0);

  const saved = isSaved(listing.id);
  const formattedPrice = new Intl.NumberFormat().format(listing.price);

  const typeLabels: Record<string, string> = {
    hostel: 'Hostel',
    self_contain: 'Self-Contain',
    single_room: 'Single Room',
    flat_apartment: 'Flat Apartment',
    shared_lodge: 'Shared Lodge',
    studio: 'Studio',
  };

  const handleClickCard = () => {
    if (!user) {
      setAuthModalTab('student_signup');
      setAuthModalOpen(true);
      return;
    }
    setSelectedListing(listing);
    if (onSelect) onSelect(listing);
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (listing.images.length > 1) {
      setCurrentImageIdx(prev => (prev + 1) % listing.images.length);
    }
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (listing.images.length > 1) {
      setCurrentImageIdx(prev => (prev - 1 + listing.images.length) % listing.images.length);
    }
  };

  return (
    <div
      onClick={handleClickCard}
      className="group flex flex-col bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer"
    >
      {/* Property Photo */}
      <div className="relative w-full aspect-[4/3] bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <img
          src={listing.images[currentImageIdx] || listing.images[0]}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
          <div className="flex items-center gap-1.5 pointer-events-auto">
            {listing.isAgentVerified && (
              <span className="px-2.5 py-1 rounded-md bg-emerald-600 text-white font-medium text-[11px] flex items-center gap-1 shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                Verified
              </span>
            )}
            <span className="px-2.5 py-1 rounded-md bg-slate-900/80 text-white font-medium text-[11px]">
              {typeLabels[listing.type] || listing.type}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!user) {
                setAuthModalTab('student_signup');
                setAuthModalOpen(true);
                return;
              }
              toggleSaveListing(listing.id);
            }}
            className={`p-2 rounded-xl transition-colors pointer-events-auto ${
              saved
                ? 'bg-rose-500 text-white'
                : 'bg-black/50 hover:bg-black/70 text-white'
            }`}
            title={saved ? 'Unsave listing' : 'Save listing'}
          >
            <Bookmark className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Carousel Prev/Next Controls */}
        {listing.images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-xl bg-black/40 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-xl bg-black/40 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div className="space-y-1.5">
          {/* Price & Period */}
          <div className="flex items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {listing.currency}{formattedPrice}
              </span>
              <span className="text-xs text-slate-500 font-normal">
                /{listing.pricePeriod}
              </span>
            </div>
            {listing.ratings?.overall > 0 && (
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                ★ {listing.ratings.overall}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-base line-clamp-1 group-hover:text-emerald-600 transition-colors">
            {listing.title}
          </h3>

          {/* Distance & Campus Location */}
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pt-0.5">
            <Navigation className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{listing.distanceToCampusMinutes} min walk to {listing.universityName}</span>
          </p>

          {/* Facilities Summary */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-slate-600 dark:text-slate-400">
            {listing.facilities.slice(0, 3).map((fac, idx) => (
              <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-medium capitalize">
                {fac.replace('_', ' ')}
              </span>
            ))}
            {listing.facilities.length > 3 && (
              <span className="text-slate-400 text-[11px]">+ {listing.facilities.length - 3} more</span>
            )}
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            {listing.unitStatus === 'occupied' || listing.isOccupied ? (
              <span className="text-slate-400">Occupied</span>
            ) : (
              `${listing.availableRooms ?? listing.totalRooms} available`
            )}
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!user) {
                setAuthModalTab('student_signup');
                setAuthModalOpen(true);
                return;
              }
              setInspectionModalListing(listing);
            }}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors flex items-center gap-1"
          >
            <Calendar className="w-3.5 h-3.5" />
            Book Inspection
          </button>
        </div>
      </div>
    </div>
  );
};
