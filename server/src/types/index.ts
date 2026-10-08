export type UserRole = 'CUSTOMER' | 'PROVIDER' | 'ADMIN';

export type ProviderAvailability = 'ONLINE' | 'OFFLINE' | 'BUSY';

export type UrgencyLevel = 'NORMAL' | 'URGENT' | 'ASAP';

export type BookingStatus =
  | 'REQUESTED'
  | 'SEARCHING'
  | 'PROVIDER_ASSIGNED'
  | 'PROVIDER_ON_THE_WAY'
  | 'ARRIVED'
  | 'OTP_PENDING'
  | 'SERVICE_STARTED'
  | 'SERVICE_COMPLETED'
  | 'PAYMENT_PENDING'
  | 'PAID'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTED';

export type PaymentMethod =
  | 'UPI'
  | 'RAZORPAY'
  | 'CASH_ON_SERVICE'
  | 'PAY_AFTER_SERVICE'
  | 'CARD'
  | 'NET_BANKING';

export type PaymentStatus =
  | 'PENDING'
  | 'AUTHORIZED'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED';

export interface Provider {
  id: string;
  userId: string;
  name: string;
  phone: string;
  rating: number;
  reviewCount: number;
  completedJobs: number;
  skills: string[];
  categories: string[];
  experienceYears: number;
  isKycVerified: boolean;
  availability: ProviderAvailability;
  latitude: number;
  longitude: number;
  responseRate: number;
  todayEarnings: number;
  walletBalance: number;
  activeBookingId?: string | null;
}

export interface Customer {
  id: string;
  userId: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface ServiceRequest {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  categoryId: string;
  serviceId: string;
  serviceName: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  urgency: UrgencyLevel;
  preferredDate: string;
  preferredTime: string;
  paymentPreference: PaymentMethod;
  status: BookingStatus;
  createdAt: number;
  searchRadiusKm: number;
  offeredToProviderId?: string | null;
  offerExpiresAtMillis?: number;
  assignedProviderId?: string | null;
}

export interface Booking {
  id: string;
  requestId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  providerId: string;
  providerName: string;
  providerPhone: string;
  providerRating: number;
  categoryId: string;
  serviceId: string;
  serviceName: string;
  address: string;
  customerLat: number;
  customerLng: number;
  providerLat: number;
  providerLng: number;
  urgency: UrgencyLevel;
  status: BookingStatus;
  otp: string;
  basePrice: number;
  extraCharges: number;
  extraChargeReason?: string;
  totalAmount: number;
  platformCommission: number;
  providerEarnings: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  completionNotes?: string;
  customerRating?: number;
  customerReview?: string;
  createdAt: number;
  etaMinutes: number;
}

// Socket Event Signatures
export interface ServerToClientEvents {
  'provider:service_offer': (data: { request: ServiceRequest; secondsRemaining: number }) => void;
  'request:assigned': (data: { requestId: string; booking: Booking }) => void;
  'request:expired': (data: { requestId: string; reason: string }) => void;
  'provider:location_update': (data: { bookingId: string; lat: number; lng: number; etaMinutes: number }) => void;
  'booking:status_update': (data: { bookingId: string; status: BookingStatus }) => void;
  'booking:otp_generated': (data: { bookingId: string; otp: string }) => void;
  'booking:started': (data: { bookingId: string }) => void;
  'booking:completed': (data: { bookingId: string; bill: { totalAmount: number; extraCharges: number } }) => void;
  'payment:updated': (data: { bookingId: string; status: PaymentStatus }) => void;
  'notification:new': (data: { title: string; message: string; targetRole: UserRole }) => void;
}

export interface ClientToServerEvents {
  'customer:service_request': (data: Omit<ServiceRequest, 'id' | 'createdAt' | 'status' | 'searchRadiusKm'>) => void;
  'provider:accept_request': (data: { requestId: string; providerId: string }) => void;
  'provider:reject_request': (data: { requestId: string; providerId: string }) => void;
  'provider:update_location': (data: { providerId: string; lat: number; lng: number }) => void;
  'provider:verify_otp': (data: { bookingId: string; otp: string }) => void;
  'join_room': (room: string) => void;
}
