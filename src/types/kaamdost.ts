export type TradeCategory =
  | 'Plumber'
  | 'Electrician'
  | 'Carpenter'
  | 'Painter'
  | 'Cleaner'
  | 'Mason'
  | 'Welder'
  | 'Roofer';

export interface RateCardItem {
  id: string;
  title: string;
  price: number;
  unit: string;
  timeEstimate: string;
  warrantyDays: number;
}

export interface WorkerReview {
  id: string;
  customerName: string;
  rating: number;
  date: string;
  comment: string;
  serviceBooked: string;
}

export interface WorkerProfile {
  id: string;
  name: string;
  businessName: string;
  trade: TradeCategory;
  filterKey: string;
  rate: number;
  rateUnit: string;
  rating: number;
  reviewCount: number;
  experienceYears: number;
  verified: boolean;
  location: string;
  distanceKm: number;
  etaMinutes: number;
  avatarUrl: string;
  popularAvatarUrl: string;
  heroPortraitUrl: string;
  about: string;
  galleryUrls: string[];
  rateCard: RateCardItem[];
  reviews: WorkerReview[];
  skills: string[];
  languages: string[];
  completedJobs: number;
  isBookmarked?: boolean;
  completionSuccessRate?: number; // e.g. 98.6 (98.6%)
  acceptanceRate?: number; // e.g. 96 (%)
  onTimeArrivalRate?: number; // e.g. 97.8 (%)
}

export type RankSortMode =
  | 'RECOMMENDED'
  | 'DISTANCE'
  | 'PAYOUT'
  | 'URGENCY';

export interface JobRankScore {
  bookingId: string;
  totalScore: number; // 0 - 100
  matchPercentage: number; // 0 - 100
  tier: 'TOP_RECOMMENDED' | 'HIGH_MATCH' | 'GOOD_MATCH' | 'STANDARD';
  tierLabel: string;
  tierBadgeClass: string;
  distanceScore: number; // 0 - 100
  ratingScore: number; // 0 - 100
  completionScore: number; // 0 - 100
  distanceKm: number;
  weights: {
    distance: number; // e.g. 0.40
    tradeRating: number; // e.g. 0.35
    completionRate: number; // e.g. 0.25
  };
  insights: string[];
}

export interface ServiceCategoryInfo {
  id: string;
  name: TradeCategory | 'More';
  filterKey: string;
  iconClass: string;
  iconColorClass: string;
  startingPrice: number;
  description: string;
  commonProblems: {
    title: string;
    price: number;
    duration: string;
  }[];
}

export type BookingStatus =
  | 'REQUESTED'
  | 'ACCEPTED'
  | 'EN_ROUTE'
  | 'ARRIVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'PAID'
  | 'CANCELLED';

export interface ExtraWorkItem {
  id: string;
  title: string;
  description?: string;
  price: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'CUSTOMER' | 'WORKER';
  text: string;
  timestamp: string;
}

export interface Booking {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  workerId: string;
  workerName: string;
  workerBusiness: string;
  workerTrade: TradeCategory;
  workerAvatar: string;
  serviceTitle: string;
  problemDescription: string;
  address: string;
  area: string;
  lat: number;
  lng: number;
  scheduledDate: string;
  scheduledTime: string;
  status: BookingStatus;
  startOtp: string;
  baseAmount: number;
  discountAmount: number;
  extraWorkItems: ExtraWorkItem[];
  tipAmount: number;
  paymentMethod?: 'UPI_GPAY' | 'UPI_PHONEPE' | 'UPI_PAYTM' | 'CASH';
  paymentStatus: 'PENDING' | 'PAID';
  invoiceNumber: string;
  rating?: number;
  reviewText?: string;
  messages: ChatMessage[];
  createdAt: string;
  distanceKm: number;
  etaMinutes: number;
}

export interface AppNotification {
  id: string;
  recipient: 'CUSTOMER' | 'WORKER';
  title: string;
  body: string;
  time: string;
  read: boolean;
  type: 'BOOKING' | 'PAYMENT' | 'APPROVAL' | 'PROMO';
  bookingId?: string;
}

export type ActionState = 'idle' | 'loading' | 'success' | 'error';

export interface ServerSyncState {
  workers: WorkerProfile[];
  bookings: Booking[];
  notifications: AppNotification[];
  workerOnline: boolean;
  activeWorkerId: string;
}
