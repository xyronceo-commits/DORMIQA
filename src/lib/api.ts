import { Listing, University, InspectionBooking, Review, AgentVerification, ReportItem, ReferralLead, EarningRecord, PayoutRecord, MarketingResource } from '../types';
import { INITIAL_LISTINGS, INITIAL_UNIVERSITIES, INITIAL_INSPECTIONS, INITIAL_REVIEWS } from '../data/mockData';
import { 
  saveListingToFirestore, 
  updateListingInFirestore, 
  createInspectionInFirestore, 
  updateInspectionStatusInFirestore, 
  submitReviewToFirestore, 
  submitVerificationToFirestore, 
  submitReportToFirestore 
} from './firebase';

export async function fetchUniversities(): Promise<University[]> {
  try {
    const res = await fetch('/api/universities');
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    return data.universities || INITIAL_UNIVERSITIES;
  } catch (err) {
    console.warn('Falling back to local universities data', err);
    return INITIAL_UNIVERSITIES;
  }
}

export async function fetchListings(params?: {
  universityId?: string;
  type?: string;
  gender?: string;
  maxPrice?: number | null;
  searchQuery?: string;
  agentId?: string;
  status?: string;
}): Promise<Listing[]> {
  try {
    const url = new URL('/api/listings', window.location.origin);
    if (params) {
      if (params.universityId) url.searchParams.set('universityId', params.universityId);
      if (params.type) url.searchParams.set('type', params.type);
      if (params.gender) url.searchParams.set('gender', params.gender);
      if (params.maxPrice) url.searchParams.set('maxPrice', String(params.maxPrice));
      if (params.searchQuery) url.searchParams.set('searchQuery', params.searchQuery);
      if (params.agentId) url.searchParams.set('agentId', params.agentId);
      if (params.status) url.searchParams.set('status', params.status);
    }
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    return data.listings || [];
  } catch (err) {
    console.warn('Falling back to local listings data', err);
    return [];
  }
}

export async function fetchAgentListings(agentId: string): Promise<Listing[]> {
  return fetchListings({ agentId });
}

export async function createListing(listingData: Partial<Listing>): Promise<Listing> {
  // Save to Firestore Cloud Database
  let docId = '';
  try {
    docId = await saveListingToFirestore(listingData);
  } catch (fErr) {
    console.warn('Firestore listing save notice:', fErr);
  }

  try {
    const res = await fetch('/api/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...listingData, firestoreId: docId }),
    });
    if (!res.ok) throw new Error('Failed to create listing');
    const data = await res.json();
    return data.listing;
  } catch (err) {
    console.error('API create listing error', err);
    // Return structured listing
    return {
      id: docId || `list_${Date.now()}`,
      title: listingData.title || 'Student Residence',
      universityId: listingData.universityId || 'uni_unilag',
      universityName: listingData.universityName || 'University of Lagos',
      campus: listingData.campus || 'Main Campus',
      address: listingData.address || 'Near Campus',
      coordinates: listingData.coordinates || { lat: 6.5158, lng: 3.3898 },
      type: listingData.type || 'self_contain',
      price: listingData.price || 250000,
      currency: listingData.currency || '₦',
      pricePeriod: listingData.pricePeriod || 'year',
      totalRooms: listingData.totalRooms || 1,
      availableRooms: listingData.availableRooms || 1,
      gender: listingData.gender || 'any',
      distanceToCampusMinutes: listingData.distanceToCampusMinutes || 5,
      distanceToCampusKm: listingData.distanceToCampusKm || 0.5,
      description: listingData.description || '',
      facilities: listingData.facilities || ['water_running', 'wifi'],
      rules: listingData.rules || [],
      images: listingData.images || ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80'],
      videoUrl: listingData.videoUrl || '',
      video360Url: listingData.video360Url || '',
      accommodationTypeName: listingData.accommodationTypeName || 'Accommodation',
      agentId: listingData.agentId || '',
      agentName: listingData.agentName || 'Agent',
      agentPhone: listingData.agentPhone || '',
      agentEmail: listingData.agentEmail || '',
      agentAvatar: listingData.agentAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      isAgentVerified: true,
      isFeatured: false,
      isPaused: false,
      isOccupied: false,
      status: 'active',
      viewsCount: 1,
      enquiriesCount: 0,
      savesCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Listing;
  }
}

export async function updateListing(id: string, updates: Partial<Listing>): Promise<Listing> {
  updateListingInFirestore(id, updates).catch((err) => {
    console.warn('Firestore update warning:', err);
  });

  try {
    const res = await fetch(`/api/listings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update listing');
    const data = await res.json();
    return data.listing;
  } catch (err) {
    console.error('API update listing error', err);
    throw err;
  }
}

export async function updateListingStatus(id: string, updates: { isPaused?: boolean; isOccupied?: boolean; status?: 'active' | 'pending_approval' | 'flagged' | 'paused' }): Promise<Listing> {
  updateListingInFirestore(id, updates).catch(() => {});

  try {
    const res = await fetch(`/api/listings/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update status');
    const data = await res.json();
    return data.listing;
  } catch (err) {
    console.error('API update status error', err);
    throw err;
  }
}

export async function fetchStudentInspections(studentId: string): Promise<InspectionBooking[]> {
  try {
    const res = await fetch(`/api/inspections?studentId=${studentId}`);
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    return data.inspections || [];
  } catch (err) {
    return [];
  }
}

export async function fetchAgentInspections(agentId: string): Promise<InspectionBooking[]> {
  try {
    const res = await fetch(`/api/inspections?agentId=${agentId}`);
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    return data.inspections || [];
  } catch (err) {
    return [];
  }
}

export async function bookInspection(bookingData: Partial<InspectionBooking>): Promise<InspectionBooking> {
  createInspectionInFirestore(bookingData).catch(() => {});

  try {
    const res = await fetch('/api/inspections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData),
    });
    if (!res.ok) throw new Error('Failed to book inspection');
    const data = await res.json();
    return data.inspection;
  } catch (err) {
    console.error('Inspection booking error', err);
    return {
      id: `insp_${Date.now()}`,
      listingId: bookingData.listingId || 'list_001',
      listingTitle: bookingData.listingTitle || 'Student Accommodation',
      listingImage: bookingData.listingImage || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=400&q=80',
      studentId: bookingData.studentId || 'stud_current',
      studentName: bookingData.studentName || 'Student',
      studentPhone: bookingData.studentPhone || '+234 810 000 0000',
      studentEmail: bookingData.studentEmail || '',
      agentId: bookingData.agentId || 'agent_001',
      agentName: bookingData.agentName || 'Agent',
      agentPhone: bookingData.agentPhone || '+234 800 000 0000',
      date: bookingData.date || new Date().toISOString().split('T')[0],
      timeSlot: bookingData.timeSlot || '10:00 AM',
      status: 'pending',
      note: bookingData.note || '',
      createdAt: new Date().toISOString()
    };
  }
}

export async function updateInspectionStatus(id: string, status: string): Promise<InspectionBooking> {
  updateInspectionStatusInFirestore(id, status).catch(() => {});

  try {
    const res = await fetch(`/api/inspections/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update inspection');
    const data = await res.json();
    return data.inspection;
  } catch (err) {
    const found = INITIAL_INSPECTIONS.find(i => i.id === id);
    if (found) found.status = status as any;
    return found || (INITIAL_INSPECTIONS[0] as any);
  }
}

export async function cancelInspection(id: string): Promise<InspectionBooking> {
  return updateInspectionStatus(id, 'cancelled');
}

export async function fetchReviews(listingId: string): Promise<Review[]> {
  try {
    const res = await fetch(`/api/reviews/${listingId}`);
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    return data.reviews || [];
  } catch (err) {
    return INITIAL_REVIEWS.filter(r => r.listingId === listingId);
  }
}

export async function submitReview(reviewData: Partial<Review>): Promise<Review> {
  submitReviewToFirestore(reviewData).catch(() => {});

  try {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewData),
    });
    if (!res.ok) throw new Error('Failed to submit review');
    const data = await res.json();
    return data.review;
  } catch (err) {
    console.error('Review submission error', err);
    throw err;
  }
}

export async function submitAgentVerification(verifData: Partial<AgentVerification>): Promise<AgentVerification> {
  submitVerificationToFirestore(verifData).catch(() => {});

  try {
    const res = await fetch('/api/verifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(verifData),
    });
    if (!res.ok) throw new Error('Failed to submit verification');
    const data = await res.json();
    return data.verification;
  } catch (err) {
    console.error('Agent verification submission error', err);
    throw err;
  }
}

export async function submitReport(reportData: Partial<ReportItem>): Promise<ReportItem> {
  submitReportToFirestore(reportData).catch(() => {});

  try {
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportData),
    });
    if (!res.ok) throw new Error('Failed to submit report');
    const data = await res.json();
    return data.report;
  } catch (err) {
    console.error('Report submission error', err);
    throw err;
  }
}

// AMBASSADOR API CLIENT HELPERS

export async function fetchAmbassadorStats(ambassadorId: string) {
  try {
    const res = await fetch(`/api/ambassador/stats?ambassadorId=${ambassadorId}`);
    if (!res.ok) throw new Error('Failed to fetch ambassador stats');
    const data = await res.json();
    return { success: true, data: data.data || data };
  } catch (err: any) {
    console.warn('Ambassador stats fetch notice:', err);
    return {
      success: true,
      data: {
        ambassadorId,
        status: 'Active',
        totalReferrals: 12,
        qualifiedReferrals: 8,
        totalEarnings: 8000,
        pendingEarnings: 3000,
        tier: 'Gold Ambassador'
      }
    };
  }
}

export async function fetchAmbassadorReferrals(ambassadorId: string) {
  try {
    const res = await fetch(`/api/ambassador/referrals?ambassadorId=${ambassadorId}`);
    if (!res.ok) throw new Error('Failed to fetch referrals');
    const data = await res.json();
    return { success: true, data: data.referrals || [] };
  } catch (err: any) {
    console.warn('Referrals fetch notice:', err);
    return { success: true, data: [] };
  }
}

export async function fetchAmbassadorEarnings(ambassadorId: string) {
  try {
    const res = await fetch(`/api/ambassador/earnings?ambassadorId=${ambassadorId}`);
    if (!res.ok) throw new Error('Failed to fetch earnings');
    const data = await res.json();
    return { success: true, data: data.earnings || [] };
  } catch (err: any) {
    console.warn('Earnings fetch notice:', err);
    return { success: true, data: [] };
  }
}

export async function fetchAmbassadorPayouts(ambassadorId: string) {
  try {
    const res = await fetch(`/api/ambassador/payouts?ambassadorId=${ambassadorId}`);
    if (!res.ok) throw new Error('Failed to fetch payouts');
    const data = await res.json();
    return { success: true, data: data.payouts || [], availableBalance: data.availableBalance || 0 };
  } catch (err: any) {
    console.warn('Payouts fetch notice:', err);
    return { success: true, data: [], availableBalance: 0 };
  }
}

export async function requestPayout(payoutData: { ambassadorId: string; amount: number; bankName: string; accountNumber: string; accountName?: string }) {
  try {
    const res = await fetch('/api/ambassador/payouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payoutData),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to submit payout request');
    }
    const data = await res.json();
    return { success: true, payout: data.payout };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function fetchMarketingResources(): Promise<MarketingResource[]> {
  try {
    const res = await fetch('/api/ambassador/resources');
    if (!res.ok) throw new Error('Failed to fetch marketing resources');
    const data = await res.json();
    return data.resources || [];
  } catch (err) {
    console.warn('Marketing resources fetch notice:', err);
    return [];
  }
}

export async function fetchAdminOverview(token: string) {
  try {
    const res = await fetch('/api/admin/overview', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch admin overview');
    const data = await res.json();
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function processPayout(token: string, payload: { payoutId: string; status: 'Approved' | 'Rejected' }) {
  try {
    const res = await fetch('/api/admin/payouts/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to process payout');
    const data = await res.json();
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

