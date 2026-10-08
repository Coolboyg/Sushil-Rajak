import { Request, Response } from 'express';
import { dispatchService } from '../services/dispatch.service.js';
import { serviceRequestService } from '../services/serviceRequestService.js';
import { config } from '../config/index.js';
export { authController } from './authController.js';
export { paymentController } from './paymentController.js';


// --- Services Controller ---

export const servicesController = {
  getCategories: async (_req: Request, res: Response) => {
    return res.json([
      { id: 'ac_services', name: 'AC Services', hindiName: 'एसी सर्विस और रिपेयर' },
      { id: 'home_repairs', name: 'Home Repairs', hindiName: 'घर की मरम्मत' },
      { id: 'cleaning', name: 'Cleaning', hindiName: 'सफाई सेवाएँ' },
      { id: 'furniture_carpentry', name: 'Furniture & Carpentry', hindiName: 'कारपेंटर और फर्नीचर' },
      { id: 'beauty_wellness', name: 'Beauty & Wellness', hindiName: 'ब्यूटी और ग्रूमिंग' },
      { id: 'massage_spa', name: 'Massage & Spa', hindiName: 'मसाज और स्पा' },
      { id: 'home_improvement', name: 'Home Improvement', hindiName: 'पेंटिंग और रेनोवेशन' },
    ]);
  },

  getServices: async (req: Request, res: Response) => {
    const { categoryId } = req.query;
    const allServices = [
      {
        id: 'ac_repair',
        categoryId: 'ac_services',
        name: 'AC Repair & Troubleshooting',
        basePrice: 299,
        warrantyDays: 30,
        estimatedDuration: '45-60 min',
      },
      {
        id: 'ac_servicing',
        categoryId: 'ac_services',
        name: 'AC Foam Jet Servicing',
        basePrice: 499,
        warrantyDays: 30,
        estimatedDuration: '40 min',
      },
      {
        id: 'electrician',
        categoryId: 'home_repairs',
        name: 'Electrician General Visit',
        basePrice: 149,
        warrantyDays: 30,
        estimatedDuration: '30 min',
      },
      {
        id: 'plumber',
        categoryId: 'home_repairs',
        name: 'Plumber General Visit',
        basePrice: 149,
        warrantyDays: 30,
        estimatedDuration: '45 min',
      },
    ];

    if (categoryId) {
      return res.json(allServices.filter((s) => s.categoryId === categoryId));
    }
    return res.json(allServices);
  },
};

// --- Request Controller ---
export const requestController = {
  create: async (req: Request, res: Response) => {
    try {
      const {
        customerId = 'cust_rahul',
        customerName = 'Rahul Sharma',
        customerPhone = '+91 98765 43210',
        categoryId = 'ac_services',
        serviceId = 'ac_repair',
        serviceName = 'AC Repair & Troubleshooting',
        description = 'Cooling problem',
        address = 'Sector 62, Noida',
        latitude = 28.535,
        longitude = 77.391,
        urgency = 'NORMAL',
        preferredDate = 'Today',
        preferredTime = 'Immediate',
        paymentPreference = 'UPI',
        basePrice = 299,
      } = req.body;

      const request = await serviceRequestService.createRequest({
        customerId,
        customerName,
        customerPhone,
        categoryId,
        serviceId,
        serviceName,
        description,
        address,
        latitude,
        longitude,
        urgency,
        preferredDate,
        preferredTime,
        paymentPreference,
        basePrice,
      });

      return res.status(201).json({ success: true, request });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },

  getById: async (req: Request, res: Response) => {
    const { id } = req.params;
    const reqItem = await serviceRequestService.getRequestById(id);
    if (!reqItem) {
      return res.status(404).json({ error: 'Request not found' });
    }
    return res.json(reqItem);
  },
};


// --- Provider Controller ---
export const providerController = {
  acceptRequest: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { providerId } = req.body;
    if (!providerId) {
      return res.status(400).json({ error: 'providerId is required' });
    }

    const result = dispatchService.acceptRequest(id, providerId);
    if (!result.success) {
      return res.status(409).json({ error: result.error });
    }
    return res.json({ success: true, booking: result.booking });
  },

  rejectRequest: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { providerId } = req.body;
    dispatchService.rejectRequest(id, providerId);
    return res.json({ success: true, message: 'Request rejected, dispatched to next partner.' });
  },

  updateLocation: async (req: Request, res: Response) => {
    const { providerId, latitude, longitude } = req.body;
    dispatchService.updateProviderLocation(providerId, latitude, longitude);
    return res.json({ success: true });
  },
};

// --- Booking Controller ---
export const bookingController = {
  verifyOtpAndStart: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { otp } = req.body;
    const booking = dispatchService.getBookingById(id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.otp !== otp?.trim()) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    dispatchService.updateBookingStatus(id, 'SERVICE_STARTED');
    return res.json({ success: true, status: 'SERVICE_STARTED' });
  },

  complete: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { extraCharges = 0, reason = '', notes = '' } = req.body;
    const booking = dispatchService.getBookingById(id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    booking.extraCharges = Number(extraCharges);
    booking.extraChargeReason = reason;
    booking.completionNotes = notes;
    booking.totalAmount = booking.basePrice + booking.extraCharges;
    booking.platformCommission = (booking.totalAmount * config.platformCommissionPercent) / 100;
    booking.providerEarnings = booking.totalAmount - booking.platformCommission;

    dispatchService.updateBookingStatus(id, 'SERVICE_COMPLETED');
    return res.json({ success: true, booking });
  },
};

// --- Admin Controller ---
export const adminController = {
  getDashboard: async (_req: Request, res: Response) => {
    const requests = dispatchService.getRequests();
    const bookings = dispatchService.getBookings();
    const providers = dispatchService.getProviders();

    const grossRevenue = bookings.filter((b) => b.paymentStatus === 'PAID').sumOf
      ? 0
      : bookings.reduce((acc, b) => acc + (b.paymentStatus === 'PAID' ? b.totalAmount : 0), 0);
    const commission = (grossRevenue * config.platformCommissionPercent) / 100;

    return res.json({
      liveRequests: requests.filter((r) => r.status === 'SEARCHING').length,
      activeBookings: bookings.filter((b) => b.status !== 'COMPLETED' && b.status !== 'CANCELLED').length,
      onlineProviders: providers.filter((p) => p.availability === 'ONLINE').length,
      grossRevenue,
      platformCommission: commission,
      businessSupportNumber: config.businessSupportPhone,
    });
  },

  getLiveRequests: async (_req: Request, res: Response) => {
    return res.json(dispatchService.getRequests());
  },

  getProviders: async (_req: Request, res: Response) => {
    return res.json(dispatchService.getProviders());
  },
};
