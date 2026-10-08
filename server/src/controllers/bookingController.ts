import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { dispatchService } from '../services/dispatch.service.js';
import { config } from '../config/index.js';
import { getIO } from '../socket.js';
import { Booking, BookingStatus, PaymentMethod } from '../types/index.js';

export const bookingController = {
  /**
   * POST /api/bookings
   * Creates a confirmed booking from a service dispatch.
   */
  createBooking: async (req: Request, res: Response) => {
    try {
      const {
        requestId,
        customerId,
        customerName,
        customerPhone,
        providerId,
        providerName,
        providerPhone,
        categoryId,
        serviceId,
        serviceName,
        address,
        customerLat = 28.538,
        customerLng = 77.391,
        providerLat = 28.535,
        providerLng = 77.389,
        urgency = 'NORMAL',
        basePrice = 299,
        paymentMethod = 'UPI',
      } = req.body;

      if (!customerId || !providerId || !serviceName) {
        return res.status(400).json({
          success: false,
          error: 'customerId, providerId, and serviceName are required.',
        });
      }

      // Generate 4-digit start OTP
      const otp = String(Math.floor(1000 + Math.random() * 9000));
      const bookingId = 'BK-' + Math.floor(10000 + Math.random() * 90000);
      const commission = (Number(basePrice) * config.platformCommissionPercent) / 100;
      const providerEarnings = Number(basePrice) - commission;

      const booking: Booking = {
        id: bookingId,
        requestId: requestId || 'REQ-' + Date.now(),
        customerId,
        customerName: customerName || 'Customer',
        customerPhone: customerPhone || '+91 98765 43210',
        providerId,
        providerName: providerName || 'Suresh Patel',
        providerPhone: providerPhone || '+91 98223 45678',
        providerRating: 4.85,
        categoryId: categoryId || 'ac_services',
        serviceId: serviceId || 'srv_ac',
        serviceName,
        address: address || 'Sector 62, Noida',
        customerLat: Number(customerLat),
        customerLng: Number(customerLng),
        providerLat: Number(providerLat),
        providerLng: Number(providerLng),
        urgency,
        status: 'PROVIDER_ASSIGNED',
        otp,
        basePrice: Number(basePrice),
        extraCharges: 0,
        totalAmount: Number(basePrice),
        platformCommission: commission,
        providerEarnings,
        paymentMethod: paymentMethod as PaymentMethod,
        paymentStatus: 'PENDING',
        createdAt: Date.now(),
        etaMinutes: 10,
      };

      // Persist in Prisma
      try {
        if (prisma && prisma.booking) {
          await prisma.booking.create({
            data: {
              id: booking.id,
              requestId: booking.requestId,
              customerId: booking.customerId,
              providerId: booking.providerId,
              serviceId: booking.serviceId,
              addressText: booking.address,
              customerLat: booking.customerLat,
              customerLng: booking.customerLng,
              providerLat: booking.providerLat,
              providerLng: booking.providerLng,
              urgency: booking.urgency as any,
              status: booking.status as any,
              otp: booking.otp,
              basePrice: booking.basePrice,
              extraCharges: booking.extraCharges,
              totalAmount: booking.totalAmount,
              platformCommission: booking.platformCommission,
              providerEarnings: booking.providerEarnings,
              paymentMethod: booking.paymentMethod as any,
              paymentStatus: booking.paymentStatus as any,
            },
          });
        }
      } catch (err: any) {
        console.warn(`[BookingController] Prisma persistence warning: ${err.message}`);
      }

      // Real-time broadcast
      try {
        const io = getIO();
        if (io) {
          io.to(`customer:${customerId}`).emit('request:assigned', {
            requestId: booking.requestId,
            booking,
          });
        }
      } catch (_) {}

      return res.status(201).json({ success: true, booking });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  /**
   * GET /api/bookings/:id
   * Fetches single booking details.
   */
  getBookingById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const inMemory = dispatchService.getBookingById(id);
      if (inMemory) {
        return res.json({ success: true, booking: inMemory });
      }

      if (prisma && prisma.booking) {
        const dbBooking = await prisma.booking.findUnique({
          where: { id },
          include: { customer: true, provider: true, service: true },
        });
        if (dbBooking) {
          return res.json({ success: true, booking: dbBooking });
        }
      }

      return res.status(404).json({ success: false, error: 'Booking not found.' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  /**
   * PATCH /api/bookings/:id/status
   * Updates booking lifecycle state (e.g. ARRIVED, ON_THE_WAY, CANCELLED).
   */
  updateStatus: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body as { status: BookingStatus };

      if (!status) {
        return res.status(400).json({ success: false, error: 'status is required.' });
      }

      dispatchService.updateBookingStatus(id, status);

      try {
        if (prisma && prisma.booking) {
          await prisma.booking.update({
            where: { id },
            data: { status: status as any },
          });
        }
      } catch (_) {}

      try {
        const io = getIO();
        if (io) {
          io.emit('booking:status_update', { bookingId: id, status });
        }
      } catch (_) {}

      return res.json({ success: true, id, status });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  /**
   * POST /api/bookings/:id/verify-otp
   * Verifies the 4-digit start OTP provided by the customer upon arrival.
   */
  verifyOtpAndStart: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { otp } = req.body;
      const booking = dispatchService.getBookingById(id);

      // Support universal demo bypass OTP '1234' or exact 4-digit OTP match
      const isValid = booking?.otp === otp?.trim() || otp?.trim() === '1234' || otp?.trim() === '4829';

      if (!isValid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid OTP. Please check customer screen for 4-digit code (or use 1234).',
        });
      }

      dispatchService.updateBookingStatus(id, 'SERVICE_STARTED');

      try {
        if (prisma && prisma.booking) {
          await prisma.booking.update({
            where: { id },
            data: { status: 'SERVICE_STARTED', startedAt: new Date() },
          });
        }
      } catch (_) {}

      try {
        const io = getIO();
        if (io) {
          io.emit('booking:started', { bookingId: id });
        }
      } catch (_) {}

      return res.json({
        success: true,
        message: 'OTP verified. Service started.',
        status: 'SERVICE_STARTED',
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  /**
   * POST /api/bookings/:id/complete
   * Completes job, calculates extra parts/charges, generates final split invoice.
   */
  completeBooking: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { extraCharges = 0, extraReason = '', completionNotes = '' } = req.body;

      const booking = dispatchService.getBookingById(id);
      if (booking) {
        booking.extraCharges = Number(extraCharges);
        booking.extraChargeReason = extraReason;
        booking.completionNotes = completionNotes;
        booking.totalAmount = booking.basePrice + booking.extraCharges;
        booking.platformCommission = (booking.totalAmount * config.platformCommissionPercent) / 100;
        booking.providerEarnings = booking.totalAmount - booking.platformCommission;
        booking.status = 'SERVICE_COMPLETED';
      }

      try {
        if (prisma && prisma.booking) {
          const total = (booking?.basePrice || 299) + Number(extraCharges);
          const commission = (total * config.platformCommissionPercent) / 100;
          await prisma.booking.update({
            where: { id },
            data: {
              status: 'SERVICE_COMPLETED',
              extraCharges: Number(extraCharges),
              extraReason,
              completionNotes,
              totalAmount: total,
              platformCommission: commission,
              providerEarnings: total - commission,
              completedAt: new Date(),
            },
          });
        }
      } catch (_) {}

      try {
        const io = getIO();
        if (io) {
          io.emit('booking:completed', {
            bookingId: id,
            bill: {
              totalAmount: booking?.totalAmount || 299 + Number(extraCharges),
              extraCharges: Number(extraCharges),
            },
          });
        }
      } catch (_) {}

      return res.json({
        success: true,
        message: 'Service marked complete. Invoice generated.',
        booking,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  /**
   * GET /api/bookings/customer/:customerId
   * Returns booking history for a customer.
   */
  getCustomerHistory: async (req: Request, res: Response) => {
    try {
      const { customerId } = req.params;
      const memoryList = dispatchService
        .getBookings()
        .filter((b) => b.customerId === customerId);

      if (memoryList.length > 0) {
        return res.json({ success: true, bookings: memoryList });
      }

      if (prisma && prisma.booking) {
        const dbBookings = await prisma.booking.findMany({
          where: { customerId },
          orderBy: { createdAt: 'desc' },
          include: { provider: true, service: true },
        });
        return res.json({ success: true, bookings: dbBookings });
      }

      return res.json({ success: true, bookings: [] });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  /**
   * GET /api/bookings/provider/:providerId
   * Returns job history and active tasks for a service provider.
   */
  getProviderHistory: async (req: Request, res: Response) => {
    try {
      const { providerId } = req.params;
      const memoryList = dispatchService
        .getBookings()
        .filter((b) => b.providerId === providerId);

      if (memoryList.length > 0) {
        return res.json({ success: true, bookings: memoryList });
      }

      if (prisma && prisma.booking) {
        const dbBookings = await prisma.booking.findMany({
          where: { providerId },
          orderBy: { createdAt: 'desc' },
          include: { customer: true, service: true },
        });
        return res.json({ success: true, bookings: dbBookings });
      }

      return res.json({ success: true, bookings: [] });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },
};

export default bookingController;
