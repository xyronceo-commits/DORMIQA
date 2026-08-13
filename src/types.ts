export type UserRole = 'ambassador' | 'admin' | 'student' | 'agent' | 'guest';

export type AmbassadorStatus = 'Pending' | 'Active' | 'Suspended' | 'Inactive';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  universityId?: string;
  universityName?: string;
  ambassadorId?: string; // e.g. "DORMIQA-001"
  referralCode?: string;  // e.g. "DORMIQA-001"
  ambassadorStatus?: AmbassadorStatus;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  isVerifiedAgent?: boolean;
  agentPhotoUrl?: string;
  verificationStatus?: string;
  businessName?: string;
  emailVerified?: boolean;
  createdAt: string;
}

export interface AmbassadorStats {
  totalReferrals: number;
  qualifiedReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  tier?: string;
}

export type ReferralStatus = 
  | 'CLICKED' 
  | 'REGISTERED' 
  | 'EMAIL_VERIFIED' 
  | 'ONBOARDING' 
  | 'QUALIFIED' 
  | 'VALID' 
  | 'REJECTED' 
  | 'FRAUD_REVIEW';

export interface ReferralLead {
  id: string;
  referralCode: string; // e.g. DORMIQA-001
  ambassadorId: string; // Ambassador User ID
  studentMaskedId: string; // e.g. STU-***4920 for privacy
  universityName: string;
  status: ReferralStatus;
  stage: string; // e.g. "Onboarding Completed", "Email Verified"
  conversionStatus: 'Pending' | 'Qualified' | 'Converted' | 'Rejected';
  earningsAmount: number; // in NGN ₦
  date: string;
  lastActivity: string;
  ipHash?: string;
}

export type EarningStatus = 'Pending' | 'Qualified' | 'Approved' | 'Paid' | 'Rejected';

export interface EarningRecord {
  id: string;
  ambassadorId: string;
  referralId: string;
  studentMaskedId: string;
  amount: number;
  status: EarningStatus;
  description: string;
  createdAt: string;
  approvedAt?: string;
  paidAt?: string;
}

export type PayoutStatus = 'Pending' | 'Processing' | 'Approved' | 'Paid' | 'Rejected';

export interface PayoutRecord {
  id: string;
  ambassadorId: string;
  amount: number;
  status: PayoutStatus;
  bankName: string;
  accountNumber: string;
  accountName: string;
  requestedAt: string;
  processedAt?: string;
  referenceNumber?: string;
  adminNotes?: string;
}

export interface MarketingResource {
  id: string;
  title: string;
  category: 'Guide' | 'Social Copy' | 'Banner Graphic' | 'Campus Flyer' | 'Video Script' | 'FAQ';
  description: string;
  fileUrl?: string;
  content?: string;
  downloadCount: number;
  format: string; // e.g., "PNG 1080x1080", "PDF", "Text Template"
  createdAt: string;
}

export interface AgentVerification {
  id: string;
  agentId: string;
  agentName: string;
  agentEmail: string;
  businessName: string;
  proofType: 'banner' | 'logo' | 'office_photo' | 'cac' | 'other';
  proofUrl?: string;
  agentPhotoUrl?: string;
  officeAddress?: string;
  status: 'pending' | 'verified' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export type AccommodationType = 
  | 'hostel'
  | 'self_contain'
  | 'single_room'
  | 'flat_apartment'
  | 'shared_lodge'
  | 'studio';

export type GenderPreference = 'any' | 'male_only' | 'female_only' | 'coed';

export type Facility = 
  | 'wifi'
  | 'electricity_247'
  | 'solar_power'
  | 'water_running'
  | 'security_guard'
  | 'cctv'
  | 'kitchen'
  | 'ac'
  | 'gym'
  | 'laundry'
  | 'parking'
  | 'furnished'
  | 'balcony';

export type InstitutionType = 'University' | 'Polytechnic' | 'College of Education';
export type InstitutionOwnership = 'Federal' | 'State' | 'Private';

export interface University {
  id: string;
  name: string;
  shortName: string;
  country: string;
  state: string;
  city: string;
  institutionType?: InstitutionType;
  ownership?: InstitutionOwnership;
  category?: string; // e.g. 'Federal University', 'State University', 'Private University', 'Federal Polytechnic', etc.
  zone?: 'South West' | 'South East' | 'South South' | 'North West' | 'North East' | 'North Central';
  campuses: string[];
  coordinates: { lat: number; lng: number };
  studentCount: string;
  totalListings: number;
  image: string;
}

export interface ListingRatings {
  security: number;
  water: number;
  electricity: number;
  internet: number;
  cleanliness: number;
  noise: number;
  value: number;
  overall: number;
  count: number;
}

export type UnitStatus = 'vacant' | 'partially_occupied' | 'occupied' | 'under_renovation';

export interface SalesInformation {
  saleType?: 'for_rent' | 'for_lease' | 'sold_out' | 'discounted' | 'installment_available';
  originalPrice?: number;
  discountedPrice?: number;
  cautionDeposit?: number;
  agencyFee?: number;
  legalFee?: number;
  serviceCharge?: number;
  paymentTerms?: string;
  salesContactPhone?: string;
  salesContactWhatsapp?: string;
  salesNotes?: string;
  totalUnitsSoldRented?: number;
  totalRevenueGenerated?: number;
}

export interface SaleRecord {
  id: string;
  listingId: string;
  tenantName: string;
  tenantPhone?: string;
  unitNumber?: string;
  amountPaid: number;
  date: string;
  notes?: string;
}

export interface Listing {
  id: string;
  title: string;
  universityId: string;
  universityName: string;
  campus: string;
  address: string;
  coordinates: { lat: number; lng: number };
  type: AccommodationType;
  price: number;
  currency: string;
  pricePeriod: 'year' | 'semester' | 'month';
  totalRooms: number;
  availableRooms: number;
  gender: GenderPreference;
  distanceToCampusMinutes: number;
  distanceToCampusKm: number;
  description: string;
  facilities: Facility[];
  rules: string[];
  images: string[];
  videoUrl?: string;
  video360Url?: string;
  accommodationTypeName?: string;
  agentId: string;
  agentName: string;
  agentPhone: string;
  agentEmail: string;
  agentAvatar: string;
  isAgentVerified: boolean;
  isFeatured: boolean;
  isPaused: boolean;
  isOccupied: boolean;
  unitStatus?: UnitStatus;
  occupiedRooms?: number;
  renovationNotes?: string;
  renovationExpectedCompletion?: string;
  salesInformation?: SalesInformation;
  salesHistory?: SaleRecord[];
  status: 'active' | 'approved' | 'pending_review' | 'pending_approval' | 'rejected' | 'flagged' | 'paused';
  viewsCount: number;
  enquiriesCount: number;
  savesCount: number;
  ratings: ListingRatings;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  listingId: string;
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  security: number;
  water: number;
  electricity: number;
  internet: number;
  cleanliness: number;
  noise: number;
  value: number;
  overall: number;
  comment: string;
  createdAt: string;
}

export interface InspectionBooking {
  id: string;
  listingId: string;
  listingTitle: string;
  listingImage: string;
  studentId: string;
  studentName: string;
  studentPhone: string;
  studentEmail: string;
  agentId: string;
  agentName: string;
  agentPhone: string;
  date: string;
  timeSlot: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  note?: string;
  createdAt: string;
}

export interface MessageThread {
  id: string;
  listingId: string;
  listingTitle: string;
  studentId: string;
  studentName: string;
  agentId: string;
  agentName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export interface Message {
  id: string;
  threadId: string;
  senderId: string;
  senderRole: 'student' | 'agent';
  text: string;
  timestamp: string;
  read: boolean;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: 'inspection_update' | 'new_listing' | 'price_change' | 'message' | 'announcement' | 'agent_verification' | 'system';
  title: string;
  body: string;
  read: boolean;
  timestamp: string;
  actionUrl?: string;
}

export interface ReportItem {
  id: string;
  listingId: string;
  listingTitle: string;
  reporterId: string;
  reporterName: string;
  reason: 'fake_listing' | 'inaccurate_pricing' | 'unresponsive_agent' | 'misleading_photos' | 'fraud_attempt' | 'other';
  details: string;
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
  createdAt: string;
}

export interface RoommatePost {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatar: string;
  universityName: string;
  department: string;
  level: string; // e.g. "300 Level"
  gender: 'Male' | 'Female';
  budgetPerHead: number;
  location: string; // e.g. "Onike / Akoka, UNILAG"
  roomType: string; // e.g. "2 Bedroom Flat"
  description: string;
  preferredQualities: string[];
  contactPhone: string;
  createdAt: string;
}

export interface FilterState {
  searchQuery: string;
  universityId: string;
  campus: string;
  institutionType: string; // 'all' | 'University' | 'Polytechnic' | 'College of Education'
  ownership: string; // 'all' | 'Federal' | 'State' | 'Private'
  state: string; // 'all' or specific Nigerian state name
  type: string;
  minPrice: number | null;
  maxPrice: number | null;
  gender: string;
  maxDistanceMinutes: number | null;
  facilities: Facility[];
  onlyVerifiedAgents: boolean;
  sortBy: 'price_asc' | 'price_desc' | 'distance' | 'rating' | 'newest';
}

export interface AiSearchResult {
  interpretedQuery: string;
  universityName?: string;
  maxPrice?: number;
  preferredType?: string;
  requiredFacilities?: Facility[];
  genderPreference?: GenderPreference;
  matchedListingIds: string[];
  explanation: string;
}
