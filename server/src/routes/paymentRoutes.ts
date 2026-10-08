import { Router } from 'express';
import { paymentController } from '../controllers/paymentController.js';

export const paymentRouter = Router();

// 1. Create a Razorpay Order for a service booking
paymentRouter.post('/create-order', paymentController.createOrder);

// 2. Verify client-side Razorpay payment signature
paymentRouter.post('/verify', paymentController.verifyPayment);

// 3. Webhook listener for Razorpay gateway callbacks
paymentRouter.post('/webhook', paymentController.handleWebhook);

// 4. Retrieve payment status for a specific booking
paymentRouter.get('/:bookingId', paymentController.getPaymentStatus);

// 5. Initiate a refund for cancelled or disputed service
paymentRouter.post('/refund', paymentController.refundPayment);
