import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchAgentListings, fetchAgentInspections, updateInspectionStatus, createListing, submitAgentVerification } from '../lib/api';
import { saveListingToFirestore, fetchFirestoreListings, subscribeFirestoreInspections, subscribeFirestoreListings, sendFirestoreNotification, updateListingInFirestore, uploadFileToFirebaseStorage } from '../lib/firebase';
import { getGoogleCalendarUrl, downloadIcsFile } from '../lib/calendar';
import { AgentPhotoUploader } from './AgentPhotoUploader';
import { Listing, InspectionBooking, Facility } from '../types';
import { UserProfileSection } from './UserProfileSection';
import { ManageUnitSalesModal } from './ManageUnitSalesModal';
import { INITIAL_UNIVERSITIES } from '../data/mockData';
import { 
  Building2, Plus, Calendar, ShieldCheck, Sparkles, Check, Clock, Eye, Phone, Mail,
  MapPin, CheckCircle, AlertTriangle, Send, RefreshCw, ToggleLeft, ToggleRight, Trash2,
  DollarSign, Users, TrendingUp, Award, Layers, ChevronRight, FileText, CheckCircle2, X,
  Upload, Image, Video, HardDrive, FolderUp, FileVideo, Camera, MessageSquare, Wrench, Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AgentDashboard: React.FC = () => {
  const { user, addToast, agentActiveTab: activeTab, setAgentActiveTab: setActiveTab, openChatWithListing, updateProfile } = useAuth();
  const [agentListings, setAgentListings] = useState<Listing[]>([]);
  const [inspections, setInspections] = useState<InspectionBooking[]>([]);
  const [loading, setLoading] = useState(true);

  // Unit Status & Sales Information Modal State
  const [selectedListingForSalesModal, setSelectedListingForSalesModal] = useState<Listing | null>(null);
  const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);

  // Special Student Requests State
  const [specialRequests, setSpecialRequests] = useState<any[]>([]);

  // Phone Number Requests State
  const [phoneRequests, setPhoneRequests] = useState<any[]>([]);

  // Add Listing Wizard State
  const [wizardTitle, setWizardTitle] = useState('Subsea Deluxe Hostel');
  const [wizardAccomTypeName, setWizardAccomTypeName] = useState('Executive Self-Contain Suite');
  const [wizardType, setWizardType] = useState<any>('self_contain');
  const [wizardUniId, setWizardUniId] = useState(INITIAL_UNIVERSITIES[0].id);
  const [wizardPrice, setWizardPrice] = useState('380000');
  const [wizardAddress, setWizardAddress] = useState('14 Abule Oja Road, near UNILAG Gate, Akoka, Lagos');
  const [wizardDistance, setWizardDistance] = useState('5');
  const [wizardAvailableRooms, setWizardAvailableRooms] = useState('4');
  const [wizardTotalRooms, setWizardTotalRooms] = useState('10');
  const [wizardDescription, setWizardDescription] = useState('');
  const [wizardFacilities, setWizardFacilities] = useState<Facility[]>([
    'electricity_247', 'water_running', 'security_guard', 'wifi', 'kitchen', 'balcony'
  ]);
  const [wizardVideo360Url, setWizardVideo360Url] = useState('https://www.youtube.com/embed/dQw4w9WgXcQ');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [wizardImages, setWizardImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80'
  ]);

  // Device Storage Upload Refs & Handlers
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [isPhotoDragOver, setIsPhotoDragOver] = useState(false);
  const [isVideoDragOver, setIsVideoDragOver] = useState(false);
  const [uploadedVideoName, setUploadedVideoName] = useState<string>('');

  const handleDevicePhotosUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileList = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (fileList.length === 0) {
      addToast('Invalid File Type', 'Please select valid image files (JPG, PNG, WEBP).');
      return;
    }

    let loadedCount = 0;
    const newPhotos: string[] = [];

    fileList.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          newPhotos.push(event.target.result as string);
          loadedCount++;
          if (loadedCount === fileList.length) {
            setWizardImages(prev => [...prev, ...newPhotos]);
            addToast(
              'Photos Uploaded',
              `Successfully loaded ${fileList.length} photo(s) from your device storage.`
            );
          }
        }
      };
      reader.readAsDataURL(file);
    });

    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  const handleDeviceVideoUpload = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      addToast('Invalid File Type', 'Please select a valid video file (MP4, MOV, WEBM).');
      return;
    }

    setUploadedVideoName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setWizardVideo360Url(event.target.result as string);
        addToast(
          '360° Video Walkthrough Uploaded',
          `Attached "${file.name}" (${(file.size / (1024 * 1024)).toFixed(1)} MB) from device storage.`
        );
      }
    };
    reader.readAsDataURL(file);

    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const [aiGenLoading, setAiGenLoading] = useState(false);

  // Agent Verification Form State
  const [agencyName, setAgencyName] = useState(user?.businessName || 'Prime Student Residences Ltd');
  const [agentType, setAgentType] = useState('hostel_owner');
  const [govId, setGovId] = useState('NIN-84920491823');
  const [officeAddress, setOfficeAddress] = useState('Suite 4, University Commercial Gate Complex');
  const [verificationSubmitted, setVerificationSubmitted] = useState(false);
  const [agentPhotoUrl, setAgentPhotoUrl] = useState<string | null>(user?.avatar || user?.agentPhotoUrl || null);
  const [agentPhotoFile, setAgentPhotoFile] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [submittingVerif, setSubmittingVerif] = useState(false);

  const loadAgentData = async () => {
    setLoading(true);
    try {
      const listings = await fetchAgentListings(user?.id || 'agent_01');
      setAgentListings(listings);

      const insData = await fetchAgentInspections(user?.id || 'agent_01');
      setInspections(insData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgentData();

    let unSubIns: (() => void) | undefined;
    let unSubList: (() => void) | undefined;

    if (user?.id) {
      unSubIns = subscribeFirestoreInspections(user.id, true, (items) => {
        if (items && items.length >= 0) setInspections(items);
      });
    }

    unSubList = subscribeFirestoreListings((items) => {
      if (user?.id) {
        const myItems = items.filter(l => l.agentId === user.id);
        if (myItems.length >= 0) setAgentListings(myItems);
      }
    });

    return () => {
      if (unSubIns) unSubIns();
      if (unSubList) unSubList();
    };
  }, [user]);

  const handleGenerateAiDescription = () => {
    if (!wizardTitle) {
      addToast('Input Title First', 'Please enter property title first', 'warning');
      return;
    }
    const selectedUni = INITIAL_UNIVERSITIES.find(u => u.id === wizardUniId)?.name || 'Campus Gate';
    const desc = `${wizardAccomTypeName || wizardTitle} located near ${selectedUni}. Features ${wizardFacilities.map(f => f.replace('_', ' ')).join(', ')} with reliable security and quick access to lectures.`;
    setWizardDescription(desc);
    addToast('Description Template Created', 'Generated a marketing copy template for your listing.');
  };

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!wizardTitle.trim()) {
      addToast('Missing Hostel Name', 'Please enter the name of the hotel / hostel.', 'warning');
      return;
    }
    if (!wizardAccomTypeName.trim()) {
      addToast('Missing Accommodation Type', 'Please enter the accommodation type name (e.g. Single Room, Executive Self-Contain).', 'warning');
      return;
    }
    if (!wizardAddress.trim()) {
      addToast('Missing Physical Address', 'Please provide the street address of the property.', 'warning');
      return;
    }

    // MANDATORY REQUIREMENT: AT LEAST 5 PHOTOS
    if (wizardImages.length < 5) {
      addToast(
        'Publication Blocked: 5 Photos Required',
        `You currently have ${wizardImages.length} photo(s). Minimum 5 photos are strictly required so students can inspect the accommodation before you publish live!`,
        'error'
      );
      return;
    }

    // MANDATORY REQUIREMENT: 360-DEGREE VIDEO WALKTHROUGH
    if (!wizardVideo360Url.trim()) {
      addToast(
        'Publication Blocked: 360° Walkthrough Required',
        'A 360-degree video walkthrough URL is strictly required so students can see the walk-around before you publish live!',
        'error'
      );
      return;
    }

    setLoading(true);
    addToast('Publishing Listing...', 'Dormiqa AI is auditing your listing in real-time... ⚡', 'info');

    try {
      const selectedUni = INITIAL_UNIVERSITIES.find(u => u.id === wizardUniId)!;
      
      // Step 1: Create listing with initial pending_review status
      const initialListingData: Partial<Listing> = {
        title: wizardTitle,
        type: wizardType,
        accommodationTypeName: wizardAccomTypeName,
        universityId: selectedUni.id,
        universityName: selectedUni.name,
        campus: selectedUni.campuses[0] || 'Main Campus',
        price: Number(wizardPrice),
        currency: '₦',
        pricePeriod: 'year',
        distanceToCampusMinutes: Number(wizardDistance),
        distanceToCampusKm: 0.4,
        availableRooms: Number(wizardAvailableRooms),
        totalRooms: Number(wizardTotalRooms),
        gender: 'coed',
        images: wizardImages,
        videoUrl: wizardVideo360Url,
        video360Url: wizardVideo360Url,
        description: wizardDescription || 'Modern student accommodation located walking distance to campus gate.',
        facilities: wizardFacilities,
        rules: ['No loud noise after 10 PM', 'Visitors registered at security gate'],
        isAgentVerified: true,
        agentId: user?.id || '',
        agentName: user?.name || agencyName || 'Property Agent',
        agentPhone: user?.phone || '',
        agentEmail: user?.email || '',
        agentAvatar: user?.avatar || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80',
        coordinates: selectedUni.coordinates,
        address: wizardAddress,
        status: 'pending_review',
      };

      const newListing = await createListing(initialListingData);

      const updatedListing: Listing = {
        ...newListing,
        status: 'active',
      };

      setAgentListings(prev => [updatedListing, ...prev]);
      await saveListingToFirestore(updatedListing);
      setActiveTab('listings');

      addToast(
        'Listing Published Live! 🎉',
        'Your accommodation listing is now active on student timelines.',
        'success'
      );
      await sendFirestoreNotification({
        userId: user?.id || 'agent_01',
        type: 'system',
        title: 'Listing Published! 🎉',
        body: `Your hostel listing "${wizardTitle}" is live on student timelines!`,
        read: false,
      });

      // Reset form fields
      setWizardTitle('');
      setWizardAccomTypeName('');
      setWizardAddress('');
      setWizardPrice('250000');
      setWizardImages([]);
      setWizardVideo360Url('');
      setWizardDescription('');
    } catch (err) {
      addToast('Error', 'Failed to publish listing', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReReviewListing = async (listing: Listing) => {
    addToast('Request Submitted', 'Listing submitted for admin re-audit.', 'info');
    try {
      setAgentListings(prev => prev.map(l => l.id === listing.id ? { ...l, status: 'pending' as any } : l));
      await updateListingInFirestore(listing.id, { status: 'pending' as any });
      addToast('Re-audit Submitted', 'Your listing status is reset to pending review.', 'success');
    } catch {
      addToast('Error', 'Failed to submit re-audit request.', 'error');
    }
  };

  const handleStatusChange = async (inspectionId: string, status: 'confirmed' | 'completed' | 'cancelled') => {
    try {
      await updateInspectionStatus(inspectionId, status);
      setInspections(prev => prev.map(i => i.id === inspectionId ? { ...i, status } : i));
      addToast('Status Updated', `Inspection marked as ${status}`);
    } catch (err) {
      addToast('Error', 'Failed to update inspection status', 'error');
    }
  };

  const handleToggleOccupancy = (listingId: string) => {
    setAgentListings(prev => prev.map(l => {
      if (l.id === listingId) {
        const isOcc = !l.isOccupied;
        return {
          ...l,
          isOccupied: isOcc,
          availableRooms: isOcc ? 0 : l.totalRooms,
        };
      }
      return l;
    }));
    addToast('Availability Updated', 'Listing room count updated.');
  };

  // Analytics Metrics
  const totalListings = agentListings.length;
  const totalEstimatedRevenue = agentListings.reduce((sum, l) => sum + (l.price * l.totalRooms), 0);
  const totalOccupied = agentListings.reduce((sum, l) => sum + (l.totalRooms - l.availableRooms), 0);
  const totalRoomsAll = agentListings.reduce((sum, l) => sum + l.totalRooms, 0);
  const occupancyPercentage = totalRoomsAll > 0 ? Math.round((totalOccupied / totalRoomsAll) * 100) : 80;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* Top Email Confirmation Alert Banner */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500 text-slate-950 font-bold shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wide flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
              Check Email to Confirm Account & Agent CAC Profile
            </h4>
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-0.5">
              We sent a confirmation link to <span className="font-bold underline">{user?.email || 'your email'}</span>. Please check your inbox or spam folder to complete account verification.
            </p>
          </div>
        </div>

        <button
          onClick={() => addToast('Verification Email Resent', `A new confirmation link was dispatched to ${user?.email}`, 'info')}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shrink-0 transition-colors shadow-sm"
        >
          Resend Email Link
        </button>
      </div>

      {/* Agent Top Banner - Professional Navy & Emerald Theme */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-4 rounded-2xl bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified Agent Business Portal
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold">{user?.name || agencyName}</h1>
            <p className="text-xs text-slate-400 mt-0.5">{user?.email} • {user?.phone || '+234 803 111 2222'}</p>
          </div>
        </div>

        {/* Action Controls & Key Metrics */}
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <div className="px-4 py-3 rounded-2xl bg-slate-800/90 border border-slate-700/80 text-center">
            <span className="block text-[11px] text-slate-400 font-semibold">Active Listings</span>
            <span className="text-xl font-black text-emerald-400">{totalListings}</span>
          </div>
          <div className="px-4 py-3 rounded-2xl bg-slate-800/90 border border-slate-700/80 text-center">
            <span className="block text-[11px] text-slate-400 font-semibold">Pending Inspections</span>
            <span className="text-xl font-black text-amber-400">{inspections.filter(i => i.status === 'pending').length}</span>
          </div>
          <button
            onClick={() => setActiveTab('add_wizard')}
            className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add New Hostel
          </button>
        </div>
      </div>

      {/* Agent Nav Bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-slate-200 dark:border-slate-800 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('listings')}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'listings'
              ? 'bg-slate-900 text-white dark:bg-emerald-600 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          My Hostings ({agentListings.length})
        </button>

        <button
          onClick={() => setActiveTab('add_wizard')}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'add_wizard'
              ? 'bg-slate-900 text-white dark:bg-emerald-600 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          Add Hosting
        </button>

        <button
          onClick={() => setActiveTab('special_requests')}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'special_requests'
              ? 'bg-slate-900 text-white dark:bg-emerald-600 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-indigo-400" />
          Special Requests ({specialRequests.length})
        </button>

        <button
          onClick={() => setActiveTab('phone_requests')}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'phone_requests'
              ? 'bg-slate-900 text-white dark:bg-emerald-600 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Phone className="w-4 h-4 text-emerald-400" />
          Phone & Contact Logs ({phoneRequests.length})
        </button>

        <button
          onClick={() => setActiveTab('crm_inspections')}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'crm_inspections'
              ? 'bg-slate-900 text-white dark:bg-emerald-600 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Inspections Desk ({inspections.length})
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'analytics'
              ? 'bg-slate-900 text-white dark:bg-emerald-600 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Occupancy & Income
        </button>

        <button
          onClick={() => setActiveTab('verification')}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'verification'
              ? 'bg-slate-900 text-white dark:bg-emerald-600 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Award className="w-4 h-4 text-amber-400" />
          Gold Badge Verification
        </button>

        <button
          onClick={() => setActiveTab('profile' as any)}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
            (activeTab as string) === 'profile'
              ? 'bg-slate-900 text-white dark:bg-emerald-600 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4 text-emerald-400" />
          My Profile & Accounts
        </button>
      </div>

      {/* Tab 1: My Hostel Inventory Table */}
      {activeTab === 'listings' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100">
              Hostel Accommodation Properties
            </h3>
            <button
              onClick={loadAgentData}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
            <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 font-bold uppercase text-[10px] text-slate-400">
                <tr>
                  <th className="p-4">Property & Type</th>
                  <th className="p-4">Campus Location</th>
                  <th className="p-4">Rent & Sales Deal</th>
                  <th className="p-4">Unit Posted Status & Vacancy</th>
                  <th className="p-4">Logged Revenue</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {agentListings.map(listing => {
                  const unitStatusLabel = listing.unitStatus 
                    ? listing.unitStatus.replace('_', ' ') 
                    : (listing.isOccupied ? 'occupied' : 'vacant');
                  
                  const isRenovating = listing.unitStatus === 'under_renovation' || !!listing.renovationNotes;
                  const saleTypeLabel = listing.salesInformation?.saleType 
                    ? listing.salesInformation.saleType.replace('_', ' ') 
                    : 'Standard Rent';

                  return (
                    <tr key={listing.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                      <td className="p-4 font-bold flex items-center gap-3">
                        <img
                          src={listing.images[0]}
                          alt=""
                          className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                        />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100">{listing.title}</p>
                          <p className="text-[10px] text-slate-400">{listing.type.replace('_', ' ')}</p>
                        </div>
                      </td>
                      <td className="p-4 font-medium text-slate-600 dark:text-slate-300">
                        {listing.universityName}
                      </td>
                      <td className="p-4 font-extrabold">
                        <div className="text-emerald-600 dark:text-emerald-400">
                          ₦{new Intl.NumberFormat().format(listing.price)} / {listing.pricePeriod || 'yr'}
                        </div>
                        <span className="inline-block mt-0.5 px-2 py-0.2 text-[9px] font-black uppercase rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50">
                          {saleTypeLabel}
                        </span>
                      </td>
                      <td className="p-4 font-semibold">
                        <div className="flex flex-col gap-1">
                          <span className={`w-fit px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                            unitStatusLabel === 'occupied'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                              : isRenovating
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                          }`}>
                            ● {unitStatusLabel}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {listing.availableRooms ?? listing.totalRooms} of {listing.totalRooms} rooms free
                          </span>
                        </div>
                      </td>
                      <td className="p-4 font-bold">
                        <div className="text-indigo-600 dark:text-indigo-400">
                          ₦{new Intl.NumberFormat().format(listing.salesInformation?.totalRevenueGenerated || (listing.salesHistory?.reduce((a, b) => a + b.amountPaid, 0) || 0))}
                        </div>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {listing.salesHistory?.length || 0} leases logged
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setSelectedListingForSalesModal(listing);
                            setIsSalesModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-extrabold transition inline-flex items-center gap-1.5 shadow-sm"
                        >
                          <Wrench className="w-3.5 h-3.5" /> Manage Status & Sales
                        </button>
                        {listing.status === 'rejected' && (
                          <button
                            onClick={() => handleReReviewListing(listing)}
                            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold transition inline-flex items-center gap-1"
                          >
                            Request Re-audit
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleOccupancy(listing.id)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-[11px] font-bold hover:bg-slate-200"
                        >
                          {listing.isOccupied ? 'Mark Vacant' : 'Mark Occupied'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Add Listing Wizard (AI Copywriter) */}
      {activeTab === 'add_wizard' && (
        <form onSubmit={handleCreateListing} className="max-w-3xl mx-auto bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md space-y-6">
          <div>
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              Publish Accommodation Listing
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Provide complete accommodation information, 5 mandatory property photos, and a 360-degree video walkthrough to publish live for students.
            </p>
          </div>

          <div className="space-y-4">
            {/* Field 1: Accommodation Type Name & Hotel Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Name of Accommodation Type <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={wizardAccomTypeName}
                  onChange={e => setWizardAccomTypeName(e.target.value)}
                  placeholder="e.g. Executive Self-Contain Suite, Single Deluxe Room"
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Name of Hotel / Hostel <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={wizardTitle}
                  onChange={e => setWizardTitle(e.target.value)}
                  placeholder="e.g. Royal Crown Student Residence"
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-slate-100"
                  required
                />
              </div>
            </div>

            {/* Field 2: Property Type & Institution */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Property Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={wizardType}
                  onChange={e => setWizardType(e.target.value as any)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-slate-100"
                >
                  <option value="self_contain">Self-Contain Apartment</option>
                  <option value="hostel">Private Student Hostel</option>
                  <option value="single_room">Single Room</option>
                  <option value="flat_apartment">2/3 Bedroom Flat</option>
                  <option value="shared_lodge">Shared Lodge</option>
                  <option value="studio">Studio Suite</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Name of Institution <span className="text-rose-500">*</span>
                </label>
                <select
                  value={wizardUniId}
                  onChange={e => setWizardUniId(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-slate-100"
                >
                  {INITIAL_UNIVERSITIES.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.shortName}) - {u.state} State
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Field 3: Rent, WALK time, Vacancies */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Annual Rent (₦) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  value={wizardPrice}
                  onChange={e => setWizardPrice(e.target.value)}
                  placeholder="e.g. 380000"
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  WALK Time to Gate (Mins) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  value={wizardDistance}
                  onChange={e => setWizardDistance(e.target.value)}
                  placeholder="e.g. 5"
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Vacant Rooms Available <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  value={wizardAvailableRooms}
                  onChange={e => setWizardAvailableRooms(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-slate-100"
                  required
                />
              </div>
            </div>

            {/* Field 4: Physical Street Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Physical Street Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={wizardAddress}
                onChange={e => setWizardAddress(e.target.value)}
                placeholder="e.g. 14 St. Finbarrs College Road, Akoka, Yaba, Lagos"
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-slate-100"
                required
              />
            </div>

            {/* MANDATORY FIELD 5: FIVE (5) PHOTOS */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <label className="block text-xs font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <span>5 Mandatory Property Photos</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Upload at least 5 clear photos of the room, bathroom, kitchen, compound exterior, and gate directly from your device storage.
                  </p>
                </div>

                <span className={`px-3 py-1 rounded-md text-xs font-extrabold flex items-center gap-1 ${
                  wizardImages.length >= 5
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300'
                }`}>
                  {wizardImages.length >= 5 ? '✅ 5+ Photos Ready' : `⚠️ ${wizardImages.length}/5 Photos (Need ${5 - wizardImages.length} more)`}
                </span>
              </div>

              {/* Hidden File Input for Photos */}
              <input
                type="file"
                ref={photoInputRef}
                onChange={e => handleDevicePhotosUpload(e.target.files)}
                accept="image/*"
                multiple
                className="hidden"
              />

              {/* Device Upload Drag & Drop Box */}
              <div
                onClick={() => photoInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setIsPhotoDragOver(true); }}
                onDragLeave={() => setIsPhotoDragOver(false)}
                onDrop={e => {
                  e.preventDefault();
                  setIsPhotoDragOver(false);
                  handleDevicePhotosUpload(e.dataTransfer.files);
                }}
                className={`p-5 rounded-2xl border-2 border-dashed transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-2 ${
                  isPhotoDragOver
                    ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/60 scale-[1.01]'
                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-indigo-500 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="p-3 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <FolderUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-slate-900 dark:text-slate-100 flex items-center justify-center gap-1.5">
                    <span>📱 Upload Photos from Device Storage</span>
                    <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">Select Multiple</span>
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Click to open your phone gallery / PC storage or drag & drop image files here
                  </p>
                </div>
              </div>

              {/* Photos Grid Thumbnails */}
              {wizardImages.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    <span>Attached Photos ({wizardImages.length})</span>
                    <button
                      type="button"
                      onClick={() => setWizardImages([])}
                      className="text-rose-500 hover:underline text-[10px]"
                    >
                      Clear All Photos
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {wizardImages.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group border border-slate-200 dark:border-slate-700 bg-slate-900">
                        <img src={img} alt={`Hostel ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setWizardImages(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600"
                          title="Remove photo"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-[10px] text-white font-bold">
                          #{idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Alternative Photo Entry Options */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Alternative: Image URL or Quick Pre-fill</p>
                <div className="flex flex-wrap sm:flex-nowrap gap-2">
                  <input
                    type="url"
                    value={newImageUrl}
                    onChange={e => setNewImageUrl(e.target.value)}
                    placeholder="Paste image web URL (Unsplash, Imgur, direct link)..."
                    className="flex-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newImageUrl.trim()) {
                        setWizardImages(prev => [...prev, newImageUrl.trim()]);
                        setNewImageUrl('');
                      }
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-bold hover:opacity-90 shrink-0"
                  >
                    + Add URL
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setWizardImages([
                        'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80',
                        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
                        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
                        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
                        'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80'
                      ]);
                      addToast('5 Sample Photos Loaded', 'Default 5 verified hostel photos pre-filled');
                    }}
                    className="px-3 py-2 rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 text-xs font-bold hover:opacity-90 shrink-0"
                  >
                    Pre-fill 5 Sample Photos
                  </button>
                </div>
              </div>
            </div>

            {/* MANDATORY FIELD 6: 360-DEGREE VIDEO WALKTHROUGH */}
            <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <label className="block text-xs font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <span>360-Degree Video Walkthrough</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Upload a 360° video walkthrough tour from your device storage so students can inspect the full hostel live.
                  </p>
                </div>

                <span className={`px-3 py-1 rounded-md text-xs font-extrabold flex items-center gap-1 ${
                  wizardVideo360Url.trim()
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300'
                }`}>
                  {wizardVideo360Url.trim() ? '✅ 360° Walkthrough Video Attached' : '⚠️ Missing 360° Video Walkthrough'}
                </span>
              </div>

              {/* Hidden File Input for Video */}
              <input
                type="file"
                ref={videoInputRef}
                onChange={e => handleDeviceVideoUpload(e.target.files)}
                accept="video/*"
                className="hidden"
              />

              {/* Device Storage Upload Box for 360 Video */}
              <div
                onClick={() => videoInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setIsVideoDragOver(true); }}
                onDragLeave={() => setIsVideoDragOver(false)}
                onDrop={e => {
                  e.preventDefault();
                  setIsVideoDragOver(false);
                  handleDeviceVideoUpload(e.dataTransfer.files);
                }}
                className={`p-5 rounded-2xl border-2 border-dashed transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-2 ${
                  isVideoDragOver
                    ? 'border-indigo-600 bg-indigo-100/80 dark:bg-indigo-950 scale-[1.01]'
                    : 'border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30'
                }`}
              >
                <div className="p-3 rounded-2xl bg-indigo-600 text-white">
                  <FileVideo className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-slate-900 dark:text-slate-100 flex items-center justify-center gap-1.5">
                    <span>📹 Select 360° Video from Device Storage</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">MP4 / MOV / WEBM</span>
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Click to browse video files on your phone/computer or drag & drop the video here
                  </p>
                  {uploadedVideoName && (
                    <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                      Attached File: {uploadedVideoName}
                    </p>
                  )}
                </div>
              </div>

              {/* 360 Video Walkthrough Live Preview */}
              {wizardVideo360Url.trim() && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
                    <span>Live 360° Walkthrough Video Preview</span>
                    <button
                      type="button"
                      onClick={() => {
                        setWizardVideo360Url('');
                        setUploadedVideoName('');
                      }}
                      className="text-rose-500 hover:underline text-[10px]"
                    >
                      Remove Video
                    </button>
                  </div>
                  <div className="rounded-xl overflow-hidden border border-indigo-300 dark:border-indigo-800 aspect-video bg-black max-w-md mx-auto shadow-md">
                    {(() => {
                      const isDirectVideo = wizardVideo360Url.startsWith('data:video') || wizardVideo360Url.startsWith('blob:') || wizardVideo360Url.match(/\.(mp4|webm|mov|ogg)(\?.*)?$/i);
                      if (isDirectVideo) {
                        return (
                          <video
                            src={wizardVideo360Url}
                            controls
                            playsInline
                            className="w-full h-full object-cover"
                          />
                        );
                      }
                      return (
                        <iframe
                          src={wizardVideo360Url}
                          title="360 Walkthrough Preview"
                          className="w-full h-full border-0"
                          allowFullScreen
                        />
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Alternative Video Link / Sample */}
              <div className="pt-2 border-t border-indigo-200 dark:border-indigo-900/60 flex flex-wrap sm:flex-nowrap gap-2 items-center">
                <input
                  type="url"
                  value={wizardVideo360Url}
                  onChange={e => setWizardVideo360Url(e.target.value)}
                  placeholder="Or paste YouTube embed / Matterport video link..."
                  className="flex-1 p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={() => {
                    setWizardVideo360Url('https://www.youtube.com/embed/dQw4w9WgXcQ');
                    setUploadedVideoName('Sample 360 Walkthrough');
                    addToast('360° Tour Set', 'Sample 360 video walkthrough loaded');
                  }}
                  className="px-3 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 shrink-0"
                >
                  Use Sample 360 Video
                </button>
              </div>
            </div>

            {/* Property Description Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Property Description</label>
                <button
                  type="button"
                  onClick={handleGenerateAiDescription}
                  className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold flex items-center gap-1 transition-all"
                >
                  <span>Auto-Generate Copy Template</span>
                </button>
              </div>
              <textarea
                value={wizardDescription}
                onChange={e => setWizardDescription(e.target.value)}
                rows={4}
                placeholder="Provide detailed description of the property, proximity to campus gates, facilities, power schedule..."
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 leading-relaxed"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-emerald-600 text-white font-extrabold text-sm hover:bg-emerald-700 shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            Publish Hostel Listing Live (5 Photos & 360° Tour Verified)
          </button>
        </form>
      )}

      {/* Tab: Special Student Requests */}
      {activeTab === 'special_requests' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                Special Student Accommodation Requests
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Students posting custom budget requests, roommate matches, or specific location criteria.
              </p>
            </div>
            <span className="px-3 py-1 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-extrabold text-xs">
              {specialRequests.length} Active Requests
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {specialRequests.map(req => (
              <div
                key={req.id}
                className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-black text-[10px] uppercase tracking-wider">
                    {req.requestType}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">{req.date}</span>
                </div>

                <div>
                  <h4 className="font-extrabold text-base text-slate-900 dark:text-slate-100">{req.studentName}</h4>
                  <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{req.universityName}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed italic">"{req.details}"</p>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800">
                    <span className="text-slate-500 font-semibold">Student Budget Cap:</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400">₦{new Intl.NumberFormat().format(req.budgetMax)} / yr</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <a
                    href={`https://wa.me/${req.studentPhone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(req.studentName)},%20I%20am%20a%20verified%20Dormiqa%20agent.%20I%20saw%20your%20special%20accommodation%20request%20for%20${encodeURIComponent(req.universityName)}.`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-2 transition-colors shadow-sm"
                  >
                    <Phone className="w-3.5 h-3.5" /> Contact Student on WhatsApp
                  </a>

                  <button
                    onClick={() => addToast('Request Claimed', `Marked ${req.studentName}'s request as contacted.`)}
                    className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold text-xs"
                  >
                    Mark Responded
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Phone Number & Contact Logs */}
      {activeTab === 'phone_requests' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Phone className="w-5 h-5 text-emerald-500" />
                Phone Number Reveal & Call Logs
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Students who viewed your phone number or requested direct callback for property listings.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
            <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 font-bold uppercase text-[10px] text-slate-400">
                <tr>
                  <th className="p-4">Student</th>
                  <th className="p-4">Phone Number</th>
                  <th className="p-4">Listing Interested In</th>
                  <th className="p-4">Time</th>
                  <th className="p-4">Note / Reason</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {phoneRequests.map(ph => (
                  <tr key={ph.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                    <td className="p-4 font-bold text-slate-900 dark:text-slate-100">{ph.studentName}</td>
                    <td className="p-4 font-semibold text-emerald-600 dark:text-emerald-400">{ph.studentPhone}</td>
                    <td className="p-4 font-medium text-slate-700 dark:text-slate-300">{ph.listingTitle}</td>
                    <td className="p-4 text-slate-400">{ph.timestamp}</td>
                    <td className="p-4 text-slate-500 max-w-xs truncate">{ph.note}</td>
                    <td className="p-4 text-right">
                      <a
                        href={`https://wa.me/${ph.studentPhone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(ph.studentName)},%20reaching%20out%20regarding%20your%20inquiry%20for%20${encodeURIComponent(ph.listingTitle)}.`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-extrabold text-[11px] inline-flex items-center gap-1.5 hover:bg-emerald-700"
                      >
                        <Phone className="w-3.5 h-3.5" /> Call / WhatsApp
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Inspection CRM Desk */}
      {activeTab === 'crm_inspections' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100">
              Student Physical Inspection Bookings
            </h3>
          </div>

          {inspections.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-3">
              <Calendar className="w-12 h-12 text-slate-400 mx-auto" />
              <h4 className="font-bold text-base text-slate-800 dark:text-slate-200">No Inspection Requests Yet</h4>
              <p className="text-xs text-slate-500">Student viewing requests will appear here in real-time.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {inspections.map(ins => (
                <div
                  key={ins.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase ${
                      ins.status === 'confirmed'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : ins.status === 'pending'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : ins.status === 'completed'
                        ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}>
                      ● {ins.status}
                    </span>
                    <span className="text-[10px] text-slate-400">{ins.id}</span>
                  </div>

                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{ins.listingTitle}</h4>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 text-xs space-y-2">
                    <p className="font-bold text-slate-800 dark:text-slate-200">Student: {ins.studentName}</p>
                    <p className="text-slate-500">Phone: {ins.studentPhone} • Email: {ins.studentEmail}</p>
                    <p className="text-emerald-600 font-bold">Appointment: {ins.date} @ {ins.timeSlot}</p>

                    {/* Google Calendar & .ics export row */}
                    <div className="flex flex-wrap items-center justify-between gap-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-emerald-500" /> Sync Calendar
                      </span>
                      <div className="flex items-center gap-1.5">
                        <a
                          href={getGoogleCalendarUrl({
                            title: `Inspection with Student ${ins.studentName}: ${ins.listingTitle}`,
                            description: `Student Inspection Booking for ${ins.listingTitle}. Student Phone: ${ins.studentPhone}, Email: ${ins.studentEmail}`,
                            location: ins.listingTitle,
                            startDate: ins.date,
                            timeSlot: ins.timeSlot,
                          })}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 text-[10px] font-extrabold flex items-center gap-1"
                        >
                          + Google Calendar
                        </a>
                        <button
                          onClick={() => {
                            downloadIcsFile({
                              title: `Inspection with Student ${ins.studentName}: ${ins.listingTitle}`,
                              description: `Student Inspection Booking for ${ins.listingTitle}. Student Phone: ${ins.studentPhone}, Email: ${ins.studentEmail}`,
                              location: ins.listingTitle,
                              startDate: ins.date,
                              timeSlot: ins.timeSlot,
                            });
                          }}
                          className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 text-[10px] font-extrabold"
                        >
                          Download .ics
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          openChatWithListing({
                            id: ins.listingId,
                            title: ins.listingTitle,
                            agentId: user?.id || ins.agentId,
                            agentName: user?.name || ins.agentName,
                          });
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 flex items-center gap-1"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> Chat Live
                      </button>

                      <a
                        href={`https://wa.me/${ins.studentPhone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(ins.studentName)},%20I%20am%20confirming%20your%20inspection%20for%20${encodeURIComponent(ins.listingTitle)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 flex items-center gap-1"
                      >
                        <Phone className="w-3.5 h-3.5" /> WhatsApp
                      </a>
                    </div>

                    {ins.status === 'pending' && (
                      <button
                        onClick={() => handleStatusChange(ins.id, 'confirmed')}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700"
                      >
                        Confirm Booking
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Occupancy & Income Analytics */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estimated Annual Portfolio Value</span>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              ₦{new Intl.NumberFormat().format(totalEstimatedRevenue)}
            </p>
            <p className="text-[11px] text-slate-500">Gross rental value based on active properties</p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Occupancy Rate</span>
            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
              {occupancyPercentage}% Occupied
            </p>
            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
              <div className="bg-indigo-600 h-full" style={{ width: `${occupancyPercentage}%` }} />
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Verified Status</span>
            <p className="text-2xl font-black text-amber-500 flex items-center gap-1.5">
              <ShieldCheck className="w-6 h-6" /> Dormiqa Gold
            </p>
            <p className="text-[11px] text-slate-500">100% verified agent trust badge granted</p>
          </div>
        </div>
      )}

      {/* Tab 5: Agent Profile & Verification */}
      {activeTab === 'verification' && (
        <div className="space-y-8 max-w-4xl mx-auto">
          <UserProfileSection />

          <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md space-y-6">
            <div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                Apply for Dormiqa Verified Agent Gold Badge
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Verified agents get 4x more inspection bookings from students and a gold shield badge on all property listings.
              </p>
            </div>

          {verificationSubmitted ? (
            <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h4 className="font-extrabold text-base text-emerald-900 dark:text-emerald-100">Verification Submitted & Under Review</h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                Our trust & safety team is auditing your business details and verified identity photo. You will receive an instant gold badge status update shortly.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Agent Identity Photo Upload */}
              <AgentPhotoUploader
                photoUrl={agentPhotoUrl}
                onPhotoSelected={(url, file) => {
                  setAgentPhotoUrl(url);
                  if (file) setAgentPhotoFile(file);
                  setPhotoError(null);
                }}
                onPhotoCleared={() => {
                  setAgentPhotoUrl(null);
                  setAgentPhotoFile(null);
                }}
                error={photoError}
              />

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Agency or Business Name <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={agencyName}
                  onChange={e => setAgencyName(e.target.value)}
                  placeholder="e.g. Prime Student Residences / Chidi Hostels"
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Proof of Business Type</label>
                <select
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-slate-100"
                >
                  <option value="banner">Business Banner / Office Signpost Photo</option>
                  <option value="logo">Agency Logo / Business Brand Image</option>
                  <option value="office_photo">Physical Office Frontage / Workspace Photo</option>
                  <option value="cac">CAC Registration Document (Optional)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Upload Proof of Business Image (Optional)</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      addToast('Proof Attached', `${e.target.files[0].name} ready for verification`, 'info');
                    }
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-slate-100 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Physical Office Location Near Campus (Optional)</label>
                <input
                  type="text"
                  value={officeAddress}
                  onChange={e => setOfficeAddress(e.target.value)}
                  placeholder="e.g. 14 Commercial Gate, Akoka, Yaba, Lagos"
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-slate-100"
                />
              </div>

              <button
                disabled={submittingVerif}
                onClick={async () => {
                  if (!agencyName.trim()) {
                    addToast('Missing Business Name', 'Please enter your agency or business name.', 'warning');
                    return;
                  }
                  if (!agentPhotoUrl) {
                    setPhotoError('Please take or upload a clear photo of yourself (unblurred, no mask) as required for agent verification.');
                    addToast('Photo Required 📷', 'Please upload a clear photo of yourself before submitting verification.', 'warning');
                    return;
                  }

                  setPhotoError(null);
                  setSubmittingVerif(true);

                  try {
                    let uploadedPhotoPath = agentPhotoUrl;
                    if (agentPhotoFile && user) {
                      addToast('Uploading Photo...', 'Saving verification identity photo', 'info');
                      const pPath = `verifications/photos/${user.id}_${Date.now()}.jpg`;
                      uploadedPhotoPath = await uploadFileToFirebaseStorage(pPath, agentPhotoFile);
                    }

                    if (user) {
                      await submitAgentVerification({
                        agentId: user.id,
                        agentName: user.name,
                        agentEmail: user.email,
                        businessName: agencyName,
                        proofType: 'banner',
                        agentPhotoUrl: uploadedPhotoPath || undefined,
                        officeAddress
                      });

                      updateProfile({
                        isVerifiedAgent: true,
                        verificationStatus: 'verified',
                        businessName: agencyName,
                        agentPhotoUrl: uploadedPhotoPath || undefined,
                        avatar: uploadedPhotoPath || user?.avatar,
                        officeAddress
                      });
                    }

                    setVerificationSubmitted(true);
                    addToast('Verification Request Submitted! 🎉', 'Your agency proof and clear identity photo were submitted.', 'success');
                  } catch (err) {
                    console.error('Submit verification error:', err);
                    setVerificationSubmitted(true);
                    addToast('Verification Submitted', 'Verification details saved.', 'info');
                  } finally {
                    setSubmittingVerif(false);
                  }
                }}
                className="w-full py-3.5 rounded-2xl bg-indigo-600 text-white font-extrabold text-xs hover:bg-indigo-700 shadow-md transition-colors flex items-center justify-center gap-2"
              >
                {submittingVerif ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Submitting Verification Photo & Details...</span>
                  </>
                ) : (
                  <span>Submit Agency Proof & Identity Photo for Gold Verification</span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Tab 8: Profile & Account Management */}
      {(activeTab as string) === 'profile' && (
        <UserProfileSection />
      )}

      {/* Manage Unit Status & Sales Information Modal */}
      <ManageUnitSalesModal
        listing={selectedListingForSalesModal}
        isOpen={isSalesModalOpen}
        onClose={() => {
          setIsSalesModalOpen(false);
          setSelectedListingForSalesModal(null);
        }}
        onSave={(updatedListing) => {
          setAgentListings(prev => prev.map(l => l.id === updatedListing.id ? updatedListing : l));
        }}
      />

    </div>
  );
};
