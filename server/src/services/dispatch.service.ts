import { Server } from 'socket.io';
import { config } from '../config/index.js';
import {
  Booking,
  BookingStatus,
  ClientToServerEvents,
  PaymentStatus,
  Provider,
  ServerToClientEvents,
  ServiceRequest,
} from '../types/index.js';

export class DispatchService {
  private io: Server<ClientToServerEvents, ServerToClientEvents> | null = null;
  private activeRequests: Map<string, ServiceRequest> = new Map();
  private activeBookings: Map<string, Booking> = new Map();
  private providers: Map<string, Provider> = new Map();
  private countdowns: Map<string, NodeJS.Timeout> = new Map();
  private rejectedBy: Map<string, Set<string>> = new Map();
  private atomicLocks: Set<string> = new Set();

  constructor() {
    this.seedDemoProviders();
  }

  public setSocketServer(io: Server<ClientToServerEvents, ServerToClientEvents>) {
    this.io = io;
  }

  public getProviders(): Provider[] {
    return Array.from(this.providers.values());
  }

  public getRequests(): ServiceRequest[] {
    return Array.from(this.activeRequests.values());
  }

  public getBookings(): Booking[] {
    return Array.from(this.activeBookings.values());
  }

  public getBookingById(id: string): Booking | undefined {
    return this.activeBookings.get(id);
  }

  private seedDemoProviders() {
    const list: Provider[] = [
      {
        id: 'prov_1',
        userId: 'u_p1',
        name: 'Rajesh Kumar',
        phone: '+91 98112 34567',
        rating: 4.9,
        reviewCount: 342,
        completedJobs: 342,
        skills: ['Electrician', 'Geyser Repair', 'Wiring'],
        categories: ['home_repairs'],
        experienceYears: 8,
        isKycVerified: true,
        availability: 'ONLINE',
        latitude: 28.5355,
        longitude: 77.391,
        responseRate: 98,
        todayEarnings: 1420,
        walletBalance: 4850,
      },
      {
        id: 'prov_2',
        userId: 'u_p2',
        name: 'Suresh Patel',
        phone: '+91 98223 45678',
        rating: 4.85,
        reviewCount: 520,
        completedJobs: 520,
        skills: ['AC Servicing', 'AC Repair', 'Gas Charging', 'AC Installation'],
        categories: ['ac_services'],
        experienceYears: 9,
        isKycVerified: true,
        availability: 'ONLINE',
        latitude: 28.5385,
        longitude: 77.3895,
        responseRate: 95,
        todayEarnings: 2240,
        walletBalance: 8600,
      },
      {
        id: 'prov_3',
        userId: 'u_p3',
        name: 'Amit Sharma',
        phone: '+91 98334 56789',
        rating: 4.75,
        reviewCount: 280,
        completedJobs: 280,
        skills: ['Plumber', 'RO Service', 'Water Tank Cleaning'],
        categories: ['home_repairs', 'cleaning'],
        experienceYears: 6,
        isKycVerified: true,
        availability: 'ONLINE',
        latitude: 28.542,
        longitude: 77.394,
        responseRate: 92,
        todayEarnings: 890,
        walletBalance: 3200,
      },
    ];

    for (const p of list) {
      this.providers.set(p.id, p);
    }
  }

  /**
   * Main Dispatch: Customer creates a ServiceRequest
   */
  public createRequest(data: Omit<ServiceRequest, 'id' | 'createdAt' | 'status' | 'searchRadiusKm'>): ServiceRequest {
    const requestId = `GS-${Math.floor(10000 + Math.random() * 90000)}`;
    const request: ServiceRequest = {
      ...data,
      id: requestId,
      status: 'SEARCHING',
      createdAt: Date.now(),
      searchRadiusKm: config.initialSearchRadiusKm,
    };

    this.activeRequests.set(requestId, request);
    this.rejectedBy.set(requestId, new Set());

    // Broadcast live notification to Admin
    this.io?.emit('notification:new', {
      title: `New Live Request: ${requestId}`,
      message: `${request.serviceName} requested by ${request.customerName} (${request.urgency})`,
      targetRole: 'ADMIN',
    });

    this.dispatchToNextBestCandidate(request);
    return request;
  }

  /**
   * Dynamic Ranking & Dispatch Algorithm
   * Formula: Distance 30% + Skill 30% + Rating 15% + Availability 15% + Response Rate 10%
   */
  private dispatchToNextBestCandidate(request: ServiceRequest) {
    const rejected = this.rejectedBy.get(request.id) || new Set();

    const candidates = Array.from(this.providers.values()).filter(
      (p) =>
        p.availability === 'ONLINE' &&
        !p.activeBookingId &&
        !rejected.has(p.id) &&
        (p.categories.includes(request.categoryId) ||
          p.skills.some(
            (s) =>
              request.serviceName.toLowerCase().includes(s.toLowerCase()) ||
              s.toLowerCase().includes(request.serviceName.toLowerCase())
          ))
    );

    if (candidates.length === 0) {
      // Radius expansion check
      if (request.searchRadiusKm + config.searchRadiusStepKm <= config.maxSearchRadiusKm) {
        request.searchRadiusKm += config.searchRadiusStepKm;
        this.activeRequests.set(request.id, request);
        return this.dispatchToNextBestCandidate(request);
      }

      // Escalation to Support & Admin
      request.status = 'CANCELLED';
      this.activeRequests.set(request.id, request);

      this.io?.to(`customer:${request.customerId}`).emit('request:expired', {
        requestId: request.id,
        reason: `All technicians are currently busy. Please call priority support at ${config.businessSupportPhone}.`,
      });

      this.io?.emit('notification:new', {
        title: `UNASSIGNED ALERT: ${request.id}`,
        message: `No available partner found for ${request.serviceName}. Manual dispatch required.`,
        targetRole: 'ADMIN',
      });
      return;
    }

    // Calculate ranking scores
    const scored = candidates
      .map((p) => {
        const distKm = this.calculateDistanceKm(request.latitude, request.longitude, p.latitude, p.longitude);
        const distScore = Math.max(0, (10 - distKm) / 10) * 30;
        const skillScore = 30;
        const ratingScore = (p.rating / 5) * 15;
        const availScore = 15;
        const respScore = (p.responseRate / 100) * 10;
        const totalScore = distScore + skillScore + ratingScore + availScore + respScore;
        return { provider: p, score: totalScore };
      })
      .sort((a, b) => b.score - a.score);

    const chosen = scored[0].provider;

    request.offeredToProviderId = chosen.id;
    request.offerExpiresAtMillis = Date.now() + config.dispatchTimerSeconds * 1000;
    this.activeRequests.set(request.id, request);

    // Send Real-Time Socket Event to targeted provider room
    this.io?.to(`provider:${chosen.id}`).emit('provider:service_offer', {
      request,
      secondsRemaining: config.dispatchTimerSeconds,
    });

    // Start 25-second countdown timer
    const timer = setTimeout(() => {
      this.handleOfferTimeout(request.id, chosen.id);
    }, config.dispatchTimerSeconds * 1000);

    this.countdowns.set(request.id, timer);
  }

  private handleOfferTimeout(requestId: string, providerId: string) {
    this.clearCountdown(requestId);
    const req = this.activeRequests.get(requestId);
    if (!req || req.status !== 'SEARCHING') return;

    this.rejectedBy.get(requestId)?.add(providerId);
    req.offeredToProviderId = null;
    req.offerExpiresAtMillis = 0;
    this.activeRequests.set(requestId, req);

    // Dispatch immediately to next available provider
    this.dispatchToNextBestCandidate(req);
  }

  public rejectRequest(requestId: string, providerId: string) {
    this.clearCountdown(requestId);
    const req = this.activeRequests.get(requestId);
    if (!req || req.status !== 'SEARCHING') return;

    if (req.offeredToProviderId === providerId) {
      this.rejectedBy.get(requestId)?.add(providerId);
      req.offeredToProviderId = null;
      req.offerExpiresAtMillis = 0;
      this.activeRequests.set(requestId, req);

      this.dispatchToNextBestCandidate(req);
    }
  }

  /**
   * CRITICAL CONCURRENCY RULE: Atomic Accept
   * Only ONE provider wins. Uses memory mutex / compare-and-swap logic.
   */
  public acceptRequest(requestId: string, providerId: string): { success: boolean; booking?: Booking; error?: string } {
    if (this.atomicLocks.has(requestId)) {
      return { success: false, error: 'Request is currently being processed by another partner.' };
    }

    this.atomicLocks.add(requestId);
    try {
      const req = this.activeRequests.get(requestId);
      if (!req || req.status !== 'SEARCHING') {
        return { success: false, error: 'Request is no longer available.' };
      }

      const prov = this.providers.get(providerId);
      if (!prov) {
        return { success: false, error: 'Provider not found.' };
      }

      this.clearCountdown(requestId);

      // Generate 4-digit Secure OTP
      const otp = Math.floor(1000 + Math.random() * 9000).toString();

      const basePrice = 299;
      const commission = (basePrice * config.platformCommissionPercent) / 100;
      const earnings = basePrice - commission;

      const bookingId = `BK-${Math.floor(20000 + Math.random() * 80000)}`;
      const booking: Booking = {
        id: bookingId,
        requestId: req.id,
        customerId: req.customerId,
        customerName: req.customerName,
        customerPhone: req.customerPhone,
        providerId: prov.id,
        providerName: prov.name,
        providerPhone: prov.phone,
        providerRating: prov.rating,
        categoryId: req.categoryId,
        serviceId: req.serviceId,
        serviceName: req.serviceName,
        address: req.address,
        customerLat: req.latitude,
        customerLng: req.longitude,
        providerLat: prov.latitude,
        providerLng: prov.longitude,
        urgency: req.urgency,
        status: 'PROVIDER_ASSIGNED',
        otp,
        basePrice,
        extraCharges: 0,
        totalAmount: basePrice,
        platformCommission: commission,
        providerEarnings: earnings,
        paymentMethod: req.paymentPreference,
        paymentStatus: 'PENDING',
        createdAt: Date.now(),
        etaMinutes: 12,
      };

      // Atomic state change
      req.status = 'PROVIDER_ASSIGNED';
      req.assignedProviderId = prov.id;
      req.offeredToProviderId = null;
      this.activeRequests.set(requestId, req);

      prov.availability = 'BUSY';
      prov.activeBookingId = bookingId;
      this.providers.set(prov.id, prov);

      this.activeBookings.set(bookingId, booking);

      // Emit real-time assignment to customer & provider
      this.io?.emit('request:assigned', { requestId, booking });
      this.io?.to(`customer:${req.customerId}`).emit('booking:status_update', {
        bookingId,
        status: 'PROVIDER_ASSIGNED',
      });
      this.io?.to(`customer:${req.customerId}`).emit('booking:otp_generated', {
        bookingId,
        otp,
      });

      return { success: true, booking };
    } finally {
      this.atomicLocks.delete(requestId);
    }
  }

  public updateProviderLocation(providerId: string, lat: number, lng: number) {
    const prov = this.providers.get(providerId);
    if (!prov) return;

    prov.latitude = lat;
    prov.longitude = lng;
    this.providers.set(providerId, prov);

    if (prov.activeBookingId) {
      const b = this.activeBookings.get(prov.activeBookingId);
      if (b && b.status === 'PROVIDER_ON_THE_WAY') {
        b.providerLat = lat;
        b.providerLng = lng;
        this.activeBookings.set(b.id, b);

        this.io?.to(`customer:${b.customerId}`).emit('provider:location_update', {
          bookingId: b.id,
          lat,
          lng,
          etaMinutes: b.etaMinutes,
        });
      }
    }
  }

  public updateBookingStatus(bookingId: string, status: BookingStatus) {
    const b = this.activeBookings.get(bookingId);
    if (!b) return;

    b.status = status;
    this.activeBookings.set(bookingId, b);

    this.io?.emit('booking:status_update', { bookingId, status });
  }

  public updateBookingPayment(bookingId: string, paymentStatus: PaymentStatus, paymentMethod: any = 'RAZORPAY') {
    const b = this.activeBookings.get(bookingId);
    if (b) {
      b.paymentStatus = paymentStatus;
      b.paymentMethod = paymentMethod;
      if (paymentStatus === 'PAID') {
        b.status = 'PAID';
      }
      this.activeBookings.set(bookingId, b);
      this.io?.emit('payment:updated', { bookingId, status: paymentStatus });
      this.io?.emit('booking:status_update', { bookingId, status: b.status });
    }
  }

  private clearCountdown(requestId: string) {
    const timer = this.countdowns.get(requestId);
    if (timer) {
      clearTimeout(timer);
      this.countdowns.delete(requestId);
    }
  }

  private calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }
}

export const dispatchService = new DispatchService();
