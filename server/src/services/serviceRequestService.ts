import { prisma } from '../lib/prisma.js';
import { getIO } from '../socket.js';
import { config } from '../config/index.js';
import { dispatchService } from './dispatch.service.js';
import {
  Booking,
  BookingStatus,
  PaymentMethod,
  ServiceRequest,
  UrgencyLevel,
} from '../types/index.js';

export interface CreateServiceRequestDto {
  customerId?: string;
  customerName: string;
  customerPhone: string;
  categoryId?: string;
  serviceId?: string;
  serviceName: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  urgency?: UrgencyLevel;
  preferredDate?: string;
  preferredTime?: string;
  paymentPreference?: PaymentMethod;
  basePrice?: number;
}

export interface UpdateServiceRequestDto {
  description?: string;
  address?: string;
  urgency?: UrgencyLevel;
  preferredDate?: string;
  preferredTime?: string;
  paymentPreference?: PaymentMethod;
  status?: BookingStatus;
}

export class ServiceRequestService {
  /**
   * Creates a new service request and initiates the real-time dispatch process.
   */
  async createRequest(dto: CreateServiceRequestDto): Promise<ServiceRequest> {
    const urgency = dto.urgency || 'NORMAL';
    const paymentPref = dto.paymentPreference || 'UPI';
    const reqId = 'GS-' + Math.floor(10000 + Math.random() * 90000);

    // 1. Create in-memory dispatch entity
    const requestEntity = dispatchService.createRequest({
      customerId: dto.customerId || 'cust_' + dto.customerPhone.replace(/\D/g, ''),
      customerName: dto.customerName,
      customerPhone: dto.customerPhone,
      categoryId: dto.categoryId || 'ac_services',
      serviceId: dto.serviceId || 'srv_ac_repair',
      serviceName: dto.serviceName,
      description: dto.description || `${dto.serviceName} requested by ${dto.customerName}`,
      address: dto.address,
      latitude: dto.latitude,
      longitude: dto.longitude,
      urgency,
      preferredDate: dto.preferredDate || new Date().toISOString().split('T')[0],
      preferredTime: dto.preferredTime || 'Immediate / ASAP',
      paymentPreference: paymentPref,
    });

    // 2. Persist to PostgreSQL via Prisma (with graceful fallback if DB is connecting)
    try {
      if (prisma && prisma.serviceRequest) {
        await prisma.serviceRequest.create({
          data: {
            id: requestEntity.id,
            customerId: requestEntity.customerId,
            serviceId: requestEntity.serviceId,
            description: requestEntity.description,
            addressText: requestEntity.address,
            latitude: requestEntity.latitude,
            longitude: requestEntity.longitude,
            urgency: requestEntity.urgency as any,
            preferredDate: requestEntity.preferredDate,
            preferredTime: requestEntity.preferredTime,
            paymentPreference: requestEntity.paymentPreference as any,
            status: requestEntity.status as any,
            searchRadiusKm: requestEntity.searchRadiusKm,
            offeredToProviderId: requestEntity.offeredToProviderId || undefined,
            offerExpiresAt: requestEntity.offerExpiresAtMillis
              ? new Date(requestEntity.offerExpiresAtMillis)
              : undefined,
          },
        });
        console.log(`[ServiceRequestService] Persisted request ${requestEntity.id} to Prisma database.`);
      }
    } catch (dbErr: any) {
      console.warn(`[ServiceRequestService] DB persistence warning (using real-time memory): ${dbErr.message}`);
    }

    // 3. Notify Connected Sockets
    try {
      const io = getIO();
      if (io) {
        io.emit('notification:new', {
          title: 'New Service Request Dispatched',
          message: `${dto.customerName} requested ${dto.serviceName} in Sector 62, Noida`,
          targetRole: 'ADMIN',
        });
      }
    } catch (_) {}

    return requestEntity;
  }

  /**
   * Fetches request by ID from database or active dispatch state.
   */
  async getRequestById(id: string): Promise<ServiceRequest | null> {
    const memoryReq = dispatchService.getRequests().find((r) => r.id === id);
    if (memoryReq) return memoryReq;

    try {
      if (prisma && prisma.serviceRequest) {
        const dbReq = await prisma.serviceRequest.findUnique({
          where: { id },
          include: { customer: true, service: true, booking: true },
        });
        if (dbReq) {
          return {
            id: dbReq.id,
            customerId: dbReq.customerId,
            customerName: dbReq.customer?.fullName || 'Customer',
            customerPhone: '',
            categoryId: dbReq.service?.categoryId || '',
            serviceId: dbReq.serviceId,
            serviceName: dbReq.service?.name || 'Service',
            description: dbReq.description,
            address: dbReq.addressText,
            latitude: dbReq.latitude,
            longitude: dbReq.longitude,
            urgency: dbReq.urgency as UrgencyLevel,
            preferredDate: dbReq.preferredDate,
            preferredTime: dbReq.preferredTime,
            paymentPreference: dbReq.paymentPreference as PaymentMethod,
            status: dbReq.status as BookingStatus,
            createdAt: dbReq.createdAt.getTime(),
            searchRadiusKm: dbReq.searchRadiusKm,
            offeredToProviderId: dbReq.offeredToProviderId,
            offerExpiresAtMillis: dbReq.offerExpiresAt?.getTime(),
            assignedProviderId: dbReq.booking?.providerId,
          };
        }
      }
    } catch (err: any) {
      console.warn(`[ServiceRequestService] Error retrieving request ${id}:`, err.message);
    }

    return null;
  }

  /**
   * Returns all active or historical requests for a customer.
   */
  async getCustomerRequests(customerId: string): Promise<ServiceRequest[]> {
    const inMemory = dispatchService
      .getRequests()
      .filter((r) => r.customerId === customerId);

    if (inMemory.length > 0) return inMemory;

    try {
      if (prisma && prisma.serviceRequest) {
        const list = await prisma.serviceRequest.findMany({
          where: { customerId },
          orderBy: { createdAt: 'desc' },
          include: { customer: true, service: true },
        });

        return list.map((r) => ({
          id: r.id,
          customerId: r.customerId,
          customerName: r.customer?.fullName || 'Customer',
          customerPhone: '',
          categoryId: r.service?.categoryId || '',
          serviceId: r.serviceId,
          serviceName: r.service?.name || '',
          description: r.description,
          address: r.addressText,
          latitude: r.latitude,
          longitude: r.longitude,
          urgency: r.urgency as UrgencyLevel,
          preferredDate: r.preferredDate,
          preferredTime: r.preferredTime,
          paymentPreference: r.paymentPreference as PaymentMethod,
          status: r.status as BookingStatus,
          createdAt: r.createdAt.getTime(),
          searchRadiusKm: r.searchRadiusKm,
          offeredToProviderId: r.offeredToProviderId,
        }));
      }
    } catch (_) {}

    return [];
  }

  /**
   * Updates an existing service request.
   */
  async updateRequest(id: string, dto: UpdateServiceRequestDto): Promise<ServiceRequest | null> {
    const memoryReq = dispatchService.getRequests().find((r) => r.id === id);
    if (memoryReq) {
      if (dto.description) memoryReq.description = dto.description;
      if (dto.address) memoryReq.address = dto.address;
      if (dto.urgency) memoryReq.urgency = dto.urgency;
      if (dto.status) memoryReq.status = dto.status;
      if (dto.paymentPreference) memoryReq.paymentPreference = dto.paymentPreference;
    }

    try {
      if (prisma && prisma.serviceRequest) {
        await prisma.serviceRequest.update({
          where: { id },
          data: {
            description: dto.description,
            addressText: dto.address,
            urgency: dto.urgency as any,
            status: dto.status as any,
            paymentPreference: dto.paymentPreference as any,
          },
        });
      }
    } catch (_) {}

    return memoryReq || this.getRequestById(id);
  }

  /**
   * Cancels an active request.
   */
  async cancelRequest(id: string, reason = 'Customer cancelled'): Promise<boolean> {
    const memoryReq = dispatchService.getRequests().find((r) => r.id === id);
    if (memoryReq) {
      memoryReq.status = 'CANCELLED';
    }

    try {
      if (prisma && prisma.serviceRequest) {
        await prisma.serviceRequest.update({
          where: { id },
          data: { status: 'CANCELLED' },
        });
      }

      const io = getIO();
      if (io) {
        io.emit('booking:status_update', { bookingId: id, status: 'CANCELLED' });
      }
      return true;
    } catch (_) {
      return !!memoryReq;
    }
  }

  /**
   * Handles provider request acceptance with concurrency protection.
   */
  async acceptRequest(requestId: string, providerId: string): Promise<{ success: boolean; booking?: Booking; error?: string }> {
    const result = dispatchService.acceptRequest(requestId, providerId);
    if (!result.success) {
      return result;
    }

    // Persist booking to Prisma
    try {
      if (prisma && prisma.booking && result.booking) {
        await prisma.booking.create({
          data: {
            id: result.booking.id,
            requestId: result.booking.requestId,
            customerId: result.booking.customerId,
            providerId: result.booking.providerId,
            serviceId: result.booking.serviceId,
            addressText: result.booking.address,
            customerLat: result.booking.customerLat,
            customerLng: result.booking.customerLng,
            providerLat: result.booking.providerLat,
            providerLng: result.booking.providerLng,
            urgency: result.booking.urgency as any,
            status: result.booking.status as any,
            otp: result.booking.otp,
            basePrice: result.booking.basePrice,
            extraCharges: result.booking.extraCharges,
            totalAmount: result.booking.totalAmount,
            platformCommission: result.booking.platformCommission,
            providerEarnings: result.booking.providerEarnings,
            paymentMethod: result.booking.paymentMethod as any,
            paymentStatus: result.booking.paymentStatus as any,
          },
        });
        console.log(`[ServiceRequestService] Persisted confirmed booking ${result.booking.id} to Prisma.`);
      }
    } catch (err: any) {
      console.warn(`[ServiceRequestService] Booking DB persist warning: ${err.message}`);
    }

    return result;
  }

  /**
   * Handles provider request rejection and advances dispatch to the next partner.
   */
  async rejectRequest(requestId: string, providerId: string): Promise<void> {
    dispatchService.rejectRequest(requestId, providerId);
  }
}

export const serviceRequestService = new ServiceRequestService();
export default serviceRequestService;
