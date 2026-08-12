import React, { useState, useEffect } from 'react';
import { Listing, UnitStatus, SalesInformation, SaleRecord } from '../types';
import { updateListing } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { 
  X, Building2, DollarSign, Wrench, CheckCircle2, AlertCircle, Calendar, 
  Clock, FileText, Users, TrendingUp, Sparkles, Plus, Phone, MessageSquare, 
  Check, Tag, ShieldCheck, Layers, Lock, RefreshCw, ChevronRight, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ManageUnitSalesModalProps {
  listing: Listing | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: Listing) => void;
}

export const ManageUnitSalesModal: React.FC<ManageUnitSalesModalProps> = ({
  listing,
  isOpen,
  onClose,
  onSave,
}) => {
  const { addToast } = useAuth();
  const [activeTab, setActiveTab] = useState<'unit_status' | 'sales_info' | 'sales_ledger'>('unit_status');
  const [saving, setSaving] = useState(false);

  // Unit Status Form State
  const [unitStatus, setUnitStatus] = useState<UnitStatus>('vacant');
  const [isPaused, setIsPaused] = useState(false);
  const [totalRooms, setTotalRooms] = useState<number>(1);
  const [occupiedRooms, setOccupiedRooms] = useState<number>(0);
  const [availableRooms, setAvailableRooms] = useState<number>(1);
  const [isUnderRenovation, setIsUnderRenovation] = useState(false);
  const [renovationNotes, setRenovationNotes] = useState('');
  const [renovationExpectedCompletion, setRenovationExpectedCompletion] = useState('');

  // Sales Info Form State
  const [price, setPrice] = useState<number>(0);
  const [pricePeriod, setPricePeriod] = useState<'year' | 'semester' | 'month'>('year');
  const [saleType, setSaleType] = useState<'for_rent' | 'for_lease' | 'sold_out' | 'discounted' | 'installment_available'>('for_rent');
  const [originalPrice, setOriginalPrice] = useState<number>(0);
  const [discountedPrice, setDiscountedPrice] = useState<number>(0);
  const [cautionDeposit, setCautionDeposit] = useState<number>(0);
  const [agencyFee, setAgencyFee] = useState<number>(0);
  const [legalFee, setLegalFee] = useState<number>(0);
  const [serviceCharge, setServiceCharge] = useState<number>(0);
  const [paymentTerms, setPaymentTerms] = useState('');
  const [salesContactPhone, setSalesContactPhone] = useState('');
  const [salesContactWhatsapp, setSalesContactWhatsapp] = useState('');
  const [salesNotes, setSalesNotes] = useState('');

  // Sales Ledger Form State
  const [salesHistory, setSalesHistory] = useState<SaleRecord[]>([]);
  const [tenantName, setTenantName] = useState('');
  const [tenantPhone, setTenantPhone] = useState('');
  const [unitNumber, setUnitNumber] = useState('');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [saleDate, setSaleDate] = useState('');
  const [saleNotes, setSaleNotes] = useState('');

  useEffect(() => {
    if (listing) {
      // Calculate unit status fallback
      const derivedStatus: UnitStatus = listing.unitStatus || (
        listing.isOccupied ? 'occupied' : (listing.availableRooms < listing.totalRooms ? 'partially_occupied' : 'vacant')
      );

      setUnitStatus(derivedStatus);
      setIsPaused(!!listing.isPaused);
      setTotalRooms(listing.totalRooms || 1);
      setOccupiedRooms(listing.occupiedRooms ?? Math.max(0, (listing.totalRooms || 1) - (listing.availableRooms || 0)));
      setAvailableRooms(listing.availableRooms ?? listing.totalRooms);
      setIsUnderRenovation(derivedStatus === 'under_renovation' || !!listing.renovationNotes);
      setRenovationNotes(listing.renovationNotes || '');
      setRenovationExpectedCompletion(listing.renovationExpectedCompletion || '');

      // Sales Info
      const sales = listing.salesInformation || {};
      setPrice(listing.price || 0);
      setPricePeriod(listing.pricePeriod || 'year');
      setSaleType(sales.saleType || 'for_rent');
      setOriginalPrice(sales.originalPrice || listing.price || 0);
      setDiscountedPrice(sales.discountedPrice || 0);
      setCautionDeposit(sales.cautionDeposit || 0);
      setAgencyFee(sales.agencyFee || 0);
      setLegalFee(sales.legalFee || 0);
      setServiceCharge(sales.serviceCharge || 0);
      setPaymentTerms(sales.paymentTerms || 'Full annual payment required upfront prior to key handover.');
      setSalesContactPhone(sales.salesContactPhone || listing.agentPhone || '');
      setSalesContactWhatsapp(sales.salesContactWhatsapp || listing.agentPhone || '');
      setSalesNotes(sales.salesNotes || '');

      // Sales History
      setSalesHistory(listing.salesHistory || []);
      setSaleDate(new Date().toISOString().split('T')[0]);
    }
  }, [listing]);

  if (!isOpen || !listing) return null;

  // Recalculate vacant rooms when total or occupied changes
  const handleOccupiedChange = (val: number) => {
    const occ = Math.max(0, Math.min(totalRooms, val));
    setOccupiedRooms(occ);
    const avail = Math.max(0, totalRooms - occ);
    setAvailableRooms(avail);

    if (occ === totalRooms) {
      setUnitStatus('occupied');
    } else if (occ > 0) {
      setUnitStatus('partially_occupied');
    } else if (!isUnderRenovation) {
      setUnitStatus('vacant');
    }
  };

  const handleTotalRoomsChange = (val: number) => {
    const tot = Math.max(1, val);
    setTotalRooms(tot);
    const occ = Math.min(tot, occupiedRooms);
    setOccupiedRooms(occ);
    setAvailableRooms(Math.max(0, tot - occ));
  };

  const handleUnitStatusSelect = (status: UnitStatus) => {
    setUnitStatus(status);
    if (status === 'occupied') {
      setOccupiedRooms(totalRooms);
      setAvailableRooms(0);
      setIsUnderRenovation(false);
    } else if (status === 'vacant') {
      setOccupiedRooms(0);
      setAvailableRooms(totalRooms);
      setIsUnderRenovation(false);
    } else if (status === 'under_renovation') {
      setIsUnderRenovation(true);
    } else if (status === 'partially_occupied') {
      setIsUnderRenovation(false);
      if (occupiedRooms === 0 || occupiedRooms === totalRooms) {
        const half = Math.max(1, Math.floor(totalRooms / 2));
        setOccupiedRooms(half);
        setAvailableRooms(totalRooms - half);
      }
    }
  };

  const handleSaveStatusAndSales = async () => {
    setSaving(true);
    try {
      const isOcc = unitStatus === 'occupied' || availableRooms === 0;
      const finalStatus = unitStatus === 'under_renovation' ? 'under_renovation' : unitStatus;

      const salesInfoPayload: SalesInformation = {
        saleType,
        originalPrice: Number(originalPrice) || Number(price),
        discountedPrice: Number(discountedPrice) || 0,
        cautionDeposit: Number(cautionDeposit) || 0,
        agencyFee: Number(agencyFee) || 0,
        legalFee: Number(legalFee) || 0,
        serviceCharge: Number(serviceCharge) || 0,
        paymentTerms,
        salesContactPhone,
        salesContactWhatsapp,
        salesNotes,
        totalUnitsSoldRented: salesHistory.length || occupiedRooms,
        totalRevenueGenerated: salesHistory.reduce((sum, s) => sum + s.amountPaid, 0) || (price * occupiedRooms),
      };

      const updates: Partial<Listing> = {
        price: Number(price),
        pricePeriod,
        totalRooms: Number(totalRooms),
        occupiedRooms: Number(occupiedRooms),
        availableRooms: Number(availableRooms),
        isOccupied: isOcc,
        isPaused,
        unitStatus: finalStatus,
        renovationNotes: isUnderRenovation ? renovationNotes : '',
        renovationExpectedCompletion: isUnderRenovation ? renovationExpectedCompletion : '',
        salesInformation: salesInfoPayload,
        salesHistory,
        updatedAt: new Date().toISOString(),
      };

      const updatedListing = await updateListing(listing.id, updates);
      onSave(updatedListing);
      addToast(
        'Unit & Sales Information Updated! 🎉',
        `Property "${listing.title}" is now set to "${unitStatus.replace('_', ' ').toUpperCase()}".`,
        'success'
      );
      onClose();
    } catch (err) {
      addToast('Update Failed', 'Could not update unit status and sales details.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLogNewSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantName.trim()) {
      addToast('Missing Tenant Name', 'Please enter tenant full name.', 'warning');
      return;
    }
    if (amountPaid <= 0) {
      addToast('Invalid Amount', 'Please enter a positive sale / rent amount.', 'warning');
      return;
    }

    const newRecord: SaleRecord = {
      id: `sale_${Date.now()}`,
      listingId: listing.id,
      tenantName,
      tenantPhone,
      unitNumber: unitNumber || `Unit #${occupiedRooms + 1}`,
      amountPaid: Number(amountPaid),
      date: saleDate || new Date().toISOString().split('T')[0],
      notes: saleNotes,
    };

    const updatedHistory = [newRecord, ...salesHistory];
    setSalesHistory(updatedHistory);

    // Auto update room count
    const newOccupied = Math.min(totalRooms, occupiedRooms + 1);
    handleOccupiedChange(newOccupied);

    // Reset Form
    setTenantName('');
    setTenantPhone('');
    setUnitNumber('');
    setAmountPaid(price);
    setSaleNotes('');

    addToast(
      'Sale Recorded! 💰',
      `Logged ₦${new Intl.NumberFormat().format(newRecord.amountPaid)} lease for ${newRecord.tenantName}.`,
      'success'
    );
  };

  const totalSalesRevenue = salesHistory.reduce((acc, s) => acc + s.amountPaid, 0);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 my-auto overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header Bar */}
          <div className="p-5 sm:p-6 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-500 text-slate-950 font-black shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase border border-emerald-500/30">
                    Agent Operations Desk
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                    unitStatus === 'occupied' 
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : unitStatus === 'under_renovation'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {unitStatus.replace('_', ' ')}
                  </span>
                </div>
                <h2 className="text-lg font-extrabold line-clamp-1">{listing.title}</h2>
                <p className="text-xs text-slate-400 line-clamp-1">{listing.address} • {listing.universityName}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-4 sm:px-6 gap-2 text-xs font-bold overflow-x-auto no-scrollbar shrink-0">
            <button
              onClick={() => setActiveTab('unit_status')}
              className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-all shrink-0 ${
                activeTab === 'unit_status'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900 font-extrabold shadow-sm'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Wrench className="w-4 h-4 text-emerald-500" />
              1. Unit & Posted Status
            </button>

            <button
              onClick={() => setActiveTab('sales_info')}
              className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-all shrink-0 ${
                activeTab === 'sales_info'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900 font-extrabold shadow-sm'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <DollarSign className="w-4 h-4 text-emerald-500" />
              2. Sales & Pricing Information
            </button>

            <button
              onClick={() => setActiveTab('sales_ledger')}
              className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-all shrink-0 ${
                activeTab === 'sales_ledger'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900 font-extrabold shadow-sm'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-indigo-500" />
              3. Sales Ledger & Log Lease ({salesHistory.length})
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
            {/* TAB 1: UNIT POSTED STATUS & ROOM VACANCY */}
            {activeTab === 'unit_status' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    Unit Posted Status & Availability Mode
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                    Select the current operational status of rooms in this property unit. Students will see live status badges on listing cards.
                  </p>
                </div>

                {/* Status Selection Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    {
                      id: 'vacant',
                      label: 'Vacant / Available',
                      desc: 'Rooms ready for immediate student move-in.',
                      icon: CheckCircle2,
                      color: 'emerald'
                    },
                    {
                      id: 'partially_occupied',
                      label: 'Rooms Remaining',
                      desc: 'Some rooms booked, few units still available.',
                      icon: Clock,
                      color: 'blue'
                    },
                    {
                      id: 'under_renovation',
                      label: 'Under Renovation',
                      desc: 'Maintenance/painting in progress.',
                      icon: Wrench,
                      color: 'amber'
                    },
                    {
                      id: 'occupied',
                      label: 'Fully Occupied',
                      desc: '100% booked out. No vacant rooms.',
                      icon: AlertCircle,
                      color: 'rose'
                    }
                  ].map((item) => {
                    const Icon = item.icon;
                    const isSelected = unitStatus === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleUnitStatusSelect(item.id as UnitStatus)}
                        className={`p-4 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-md scale-[1.02]'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className={`p-2 rounded-xl w-fit mb-2 ${
                            isSelected ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <h4 className="font-black text-slate-900 dark:text-slate-100 text-xs">{item.label}</h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">{item.desc}</p>
                        </div>
                        {isSelected && (
                          <span className="mt-3 text-[10px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Selected Status
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Feed Visibility Toggle */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">
                      Public Feed Visibility (Pause Listing)
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Temporarily hide this accommodation from student timelines without deleting it.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPaused(!isPaused)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                      isPaused
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'bg-emerald-500 text-slate-950 shadow-md'
                    }`}
                  >
                    {isPaused ? '⏸️ Listing Paused (Hidden)' : '▶️ Live on Student Feed'}
                  </button>
                </div>

                {/* Detailed Room Counters */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-4">
                  <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-600" />
                    Room Occupancy Breakdown
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Total Rooms in Unit
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={totalRooms}
                        onChange={(e) => handleTotalRoomsChange(Number(e.target.value))}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-bold text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Occupied Rooms
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={totalRooms}
                        value={occupiedRooms}
                        onChange={(e) => handleOccupiedChange(Number(e.target.value))}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-bold text-rose-600 dark:text-rose-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Vacant / Free Rooms
                      </label>
                      <div className="w-full p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 font-extrabold text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
                        <span>{availableRooms} Rooms Free</span>
                        <span className="text-[10px] text-emerald-600 font-semibold">
                          {Math.round(((totalRooms - occupiedRooms) / totalRooms) * 100)}% Free
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Renovation Details Box */}
                <div className={`p-5 rounded-2xl border transition-all ${
                  isUnderRenovation
                    ? 'border-amber-500 bg-amber-500/5 dark:bg-amber-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <label className="flex items-center gap-2 cursor-pointer font-extrabold text-slate-900 dark:text-slate-100 text-xs">
                      <input
                        type="checkbox"
                        checked={isUnderRenovation}
                        onChange={(e) => {
                          setIsUnderRenovation(e.target.checked);
                          if (e.target.checked) setUnitStatus('under_renovation');
                        }}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <Wrench className="w-4 h-4 text-amber-500" />
                      Mark Unit / Property as Under Renovation
                    </label>
                    {isUnderRenovation && (
                      <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold uppercase border border-amber-500/30">
                        Renovation Mode Active
                      </span>
                    )}
                  </div>

                  {isUnderRenovation && (
                    <div className="space-y-4 pt-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Renovation Scope & Upgrade Notes
                        </label>
                        <textarea
                          rows={2}
                          value={renovationNotes}
                          onChange={(e) => setRenovationNotes(e.target.value)}
                          placeholder="e.g. Installing solar power inverter, painting room interiors, fitting modern bathroom showers."
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Expected Renovation Completion Date
                        </label>
                        <input
                          type="date"
                          value={renovationExpectedCompletion}
                          onChange={(e) => setRenovationExpectedCompletion(e.target.value)}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: SALES INFORMATION & PRICING */}
            {activeTab === 'sales_info' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    Sales & Financial Pricing Structure
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                    Update sales deals, caution deposits, agency fees, installment packages, and direct sales lines.
                  </p>
                </div>

                {/* Base Rent & Period */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Base Rent / Sales Price (₦) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      placeholder="380000"
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-black text-emerald-600 dark:text-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Billing Period
                    </label>
                    <select
                      value={pricePeriod}
                      onChange={(e) => setPricePeriod(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-bold text-slate-900 dark:text-slate-100"
                    >
                      <option value="year">Per Year (Annual)</option>
                      <option value="semester">Per Semester</option>
                      <option value="month">Per Month</option>
                    </select>
                  </div>
                </div>

                {/* Sale Deal Type & Discounts */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-4">
                  <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-amber-500" />
                    Sales Deal Category & Discount Offers
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Sale / Listing Type
                      </label>
                      <select
                        value={saleType}
                        onChange={(e) => setSaleType(e.target.value as any)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-bold text-slate-900 dark:text-slate-100"
                      >
                        <option value="for_rent">Standard Rental Accommodation</option>
                        <option value="for_lease">Multi-Year Campus Lease</option>
                        <option value="discounted">🔥 Promotional Discounted Offer</option>
                        <option value="installment_available">💳 Installment Payment Allowed</option>
                        <option value="sold_out">⛔ Fully Rented / Sold Out</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Discounted Offer Price (₦) <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="number"
                        value={discountedPrice}
                        onChange={(e) => setDiscountedPrice(Number(e.target.value))}
                        placeholder="e.g. 350000"
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-bold text-indigo-600 dark:text-indigo-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Mandatory Fee Breakdown (Nigerian Rental Standard) */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-4">
                  <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Additional Charges & Fee Breakdown
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Caution Deposit (₦)
                      </label>
                      <input
                        type="number"
                        value={cautionDeposit}
                        onChange={(e) => setCautionDeposit(Number(e.target.value))}
                        placeholder="30000"
                        className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Agency Commission (₦)
                      </label>
                      <input
                        type="number"
                        value={agencyFee}
                        onChange={(e) => setAgencyFee(Number(e.target.value))}
                        placeholder="35000"
                        className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Legal / Agreement (₦)
                      </label>
                      <input
                        type="number"
                        value={legalFee}
                        onChange={(e) => setLegalFee(Number(e.target.value))}
                        placeholder="20000"
                        className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Service Charge (₦)
                      </label>
                      <input
                        type="number"
                        value={serviceCharge}
                        onChange={(e) => setServiceCharge(Number(e.target.value))}
                        placeholder="15000"
                        className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Terms & Direct Sales Lines */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Payment & Installment Terms
                    </label>
                    <textarea
                      rows={2}
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(e.target.value)}
                      placeholder="e.g. 60% upfront payment, balance payable in 2 monthly installments."
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Promotional Sales Highlight / Slogan
                    </label>
                    <textarea
                      rows={2}
                      value={salesNotes}
                      onChange={(e) => setSalesNotes(e.target.value)}
                      placeholder="e.g. Special 10% discount for UNILAG freshmen! Free water supply included."
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Direct Sales Phone Line
                    </label>
                    <input
                      type="text"
                      value={salesContactPhone}
                      onChange={(e) => setSalesContactPhone(e.target.value)}
                      placeholder="+234 803 123 4567"
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-bold text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Direct WhatsApp Sales Number
                    </label>
                    <input
                      type="text"
                      value={salesContactWhatsapp}
                      onChange={(e) => setSalesContactWhatsapp(e.target.value)}
                      placeholder="+234 803 123 4567"
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-bold text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: SALES LEDGER & LOG NEW TRANSACTION */}
            {activeTab === 'sales_ledger' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    Sales History & Log Student Lease Agreement
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                    Record closed deals for room units. Logging a lease automatically increments occupied room counters and calculates total revenue.
                  </p>
                </div>

                {/* Log New Sale Form */}
                <form onSubmit={handleLogNewSale} className="p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-500/30 space-y-4">
                  <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                    <Plus className="w-4 h-4" /> Record New Tenant Lease / Room Sale
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Student / Tenant Name *
                      </label>
                      <input
                        type="text"
                        value={tenantName}
                        onChange={(e) => setTenantName(e.target.value)}
                        placeholder="e.g. Babatunde Lawal"
                        className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold text-slate-900 dark:text-slate-100"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Tenant Phone Number
                      </label>
                      <input
                        type="text"
                        value={tenantPhone}
                        onChange={(e) => setTenantPhone(e.target.value)}
                        placeholder="+234 812 345 6789"
                        className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Assigned Unit / Room #
                      </label>
                      <input
                        type="text"
                        value={unitNumber}
                        onChange={(e) => setUnitNumber(e.target.value)}
                        placeholder="e.g. Room A3"
                        className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Amount Paid (₦) *
                      </label>
                      <input
                        type="number"
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(Number(e.target.value))}
                        placeholder="380000"
                        className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-extrabold text-emerald-600 dark:text-emerald-400"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Transaction Date
                      </label>
                      <input
                        type="date"
                        value={saleDate}
                        onChange={(e) => setSaleDate(e.target.value)}
                        className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Notes / Receipt Ref
                      </label>
                      <input
                        type="text"
                        value={saleNotes}
                        onChange={(e) => setSaleNotes(e.target.value)}
                        placeholder="Receipt #8492"
                        className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Log Lease Agreement & Increment Occupancy
                  </button>
                </form>

                {/* Recorded Ledger Table */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">
                      Logged Lease History & Revenue ({salesHistory.length} Recorded)
                    </h4>
                    <span className="font-extrabold text-xs text-emerald-600 dark:text-emerald-400">
                      Total Collected: ₦{new Intl.NumberFormat().format(totalSalesRevenue)}
                    </span>
                  </div>

                  {salesHistory.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="font-bold text-xs">No lease transactions logged yet.</p>
                      <p className="text-[11px] mt-1">Use the form above to log student room payments.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                      <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
                        <thead className="bg-slate-50 dark:bg-slate-800/80 uppercase text-[10px] font-bold text-slate-400 border-b border-slate-200 dark:border-slate-800">
                          <tr>
                            <th className="p-3">Tenant Name</th>
                            <th className="p-3">Unit #</th>
                            <th className="p-3">Amount Paid</th>
                            <th className="p-3">Date</th>
                            <th className="p-3">Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {salesHistory.map((rec) => (
                            <tr key={rec.id}>
                              <td className="p-3 font-bold text-slate-900 dark:text-slate-100">
                                {rec.tenantName}
                                {rec.tenantPhone && <span className="block text-[10px] text-slate-400 font-normal">{rec.tenantPhone}</span>}
                              </td>
                              <td className="p-3 font-semibold text-indigo-600 dark:text-indigo-400">
                                {rec.unitNumber || 'Unit'}
                              </td>
                              <td className="p-3 font-extrabold text-emerald-600 dark:text-emerald-400">
                                ₦{new Intl.NumberFormat().format(rec.amountPaid)}
                              </td>
                              <td className="p-3 text-slate-500 font-medium">
                                {rec.date}
                              </td>
                              <td className="p-3 text-slate-400 text-[11px]">
                                {rec.notes || '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-extrabold text-xs text-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>

            <button
              onClick={handleSaveStatusAndSales}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Saving Changes...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Save Unit Status & Sales Info
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
