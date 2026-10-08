import { Router } from 'express';
import { authController } from '../controllers/authController.js';

export const authRouter = Router();

// Phone & OTP Authentication Handlers
authRouter.post('/request-otp', authController.requestOtp);
authRouter.post('/login', authController.requestOtp); // Backward-compatible alias
authRouter.post('/verify-otp', authController.verifyOtp);

// Authenticated User Profile Endpoints
authRouter.get('/me', authController.getMe);
authRouter.put('/profile', authController.updateProfile);
authRouter.post('/logout', authController.logout);

export default authRouter;
