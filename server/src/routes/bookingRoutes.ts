import { Router } from 'express';
import { bookingController } from '../controllers/bookingController.js';

export const bookingRouter = Router();

// Booking Creation & Query
bookingRouter.post('/', bookingController.createBooking);
bookingRouter.get('/:id', bookingController.getBookingById);

// Status Updates & Service Lifecycle
bookingRouter.patch('/:id/status', bookingController.updateStatus);
bookingRouter.post('/:id/otp', bookingController.verifyOtpAndStart);
bookingRouter.post('/:id/verify-otp', bookingController.verifyOtpAndStart);
bookingRouter.post('/:id/complete', bookingController.completeBooking);

// History & Filter Endpoints
bookingRouter.get('/customer/:customerId', bookingController.getCustomerHistory);
bookingRouter.get('/provider/:providerId', bookingController.getProviderHistory);

export default bookingRouter;
