import { Router } from 'express';
import { authRouter } from './authRoutes.js';
import { bookingRouter } from './bookingRoutes.js';
import { categoryRouter } from './categoryRoutes.js';
import { paymentRouter } from './paymentRoutes.js';
import { providerRouter } from './providerRoutes.js';
import {
  adminController,
  authController,
  bookingController,
  paymentController,
  providerController,
  requestController,
  servicesController,
} from '../controllers/index.js';

export const apiRouter = Router();

// Authentication Routes
apiRouter.use('/auth', authRouter);
apiRouter.post('/auth/login', authController.login);
apiRouter.post('/auth/verify-otp', authController.verifyOtp);

// Booking Routes
apiRouter.use('/bookings', bookingRouter);

// Payment Routes (Razorpay integration)
apiRouter.use('/payments', paymentRouter);

// Service Categories Routes
apiRouter.use('/categories', categoryRouter);

// Provider Routes (Profiles, Details, Certifications, Reviews)
apiRouter.use('/providers', providerRouter);





// Service Catalog
apiRouter.get('/categories', servicesController.getCategories);
apiRouter.get('/services', servicesController.getServices);

// Service Requests (Customer dispatch)
apiRouter.post('/service-requests', requestController.create);
apiRouter.get('/service-requests/:id', requestController.getById);

// Provider Actions
apiRouter.post('/providers/requests/:id/accept', providerController.acceptRequest);
apiRouter.post('/providers/requests/:id/reject', providerController.rejectRequest);
apiRouter.post('/providers/location', providerController.updateLocation);

// Booking Lifecycle
apiRouter.post('/bookings/:id/otp', bookingController.verifyOtpAndStart);
apiRouter.post('/bookings/:id/complete', bookingController.complete);

// Admin Dashboard & Monitoring
apiRouter.get('/admin/dashboard', adminController.getDashboard);
apiRouter.get('/admin/live-requests', adminController.getLiveRequests);
apiRouter.get('/admin/providers', adminController.getProviders);
