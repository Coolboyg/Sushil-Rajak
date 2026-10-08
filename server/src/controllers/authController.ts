import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { UserRole } from '../types/index.js';

interface OtpEntry {
  otp: string;
  role: UserRole;
  expiresAt: number;
}

interface StoredUser {
  id: string;
  phone: string;
  role: UserRole;
  name: string;
  email?: string;
  isActive: boolean;
  profileId: string;
  address?: string;
  skills?: string[];
  isKycVerified?: boolean;
  createdAt: number;
}

// In-Memory User and OTP Store aligned with Prisma Schema
const otpStore = new Map<string, OtpEntry>();
const usersByPhone = new Map<string, StoredUser>();

// Seed default users for demo / testing
usersByPhone.set('+919876543210', {
  id: 'usr_cust_rahul',
  phone: '+919876543210',
  role: 'CUSTOMER',
  name: 'Rahul Sharma',
  email: 'rahul.sharma@example.com',
  isActive: true,
  profileId: 'cp_rahul_01',
  address: 'Flat 402, Lotus Boulevard, Sector 62, Noida',
  createdAt: Date.now() - 86400000 * 30,
});

usersByPhone.set('+919822345678', {
  id: 'usr_prov_suresh',
  phone: '+919822345678',
  role: 'PROVIDER',
  name: 'Suresh Patel',
  email: 'suresh.ac@example.com',
  isActive: true,
  profileId: 'pp_suresh_01',
  skills: ['AC Servicing', 'AC Repair', 'Gas Charging'],
  isKycVerified: true,
  createdAt: Date.now() - 86400000 * 60,
});

usersByPhone.set('+918435423190', {
  id: 'usr_admin_support',
  phone: '+918435423190',
  role: 'ADMIN',
  name: 'GharSaathi Super Admin',
  email: 'support@gharsaathi.com',
  isActive: true,
  profileId: 'ap_admin_01',
  createdAt: Date.now() - 86400000 * 90,
});

/**
 * Normalizes phone number into E.164 format (defaults to India +91)
 */
function normalizePhone(rawPhone: string): string {
  const digits = rawPhone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }
  if (rawPhone.startsWith('+')) {
    return `+${digits}`;
  }
  return `+91${digits.slice(-10)}`;
}

/**
 * Validates 10-digit Indian phone number
 */
function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10 || (digits.length === 12 && digits.startsWith('91'));
}

export const authController = {
  /**
   * POST /api/auth/request-otp
   * Generates and sends OTP to the customer or provider phone number.
   */
  requestOtp: async (req: Request, res: Response) => {
    try {
      const { phone: rawPhone, role: requestedRole = 'CUSTOMER' } = req.body;

      if (!rawPhone || typeof rawPhone !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Phone number is required.',
        });
      }

      if (!isValidPhone(rawPhone)) {
        return res.status(400).json({
          success: false,
          error: 'Please enter a valid 10-digit mobile number.',
        });
      }

      const role: UserRole = ['CUSTOMER', 'PROVIDER', 'ADMIN'].includes(requestedRole)
        ? (requestedRole as UserRole)
        : 'CUSTOMER';

      const normalizedPhone = normalizePhone(rawPhone);

      // Generate 4-digit OTP (standard demo OTP '1234' with 5-minute expiry)
      const otp = '1234';
      const expiresAt = Date.now() + 5 * 60 * 1000;

      otpStore.set(normalizedPhone, { otp, role, expiresAt });

      return res.status(200).json({
        success: true,
        message: `OTP sent successfully to ${normalizedPhone}.`,
        phone: normalizedPhone,
        role,
        demoOtp: otp, // Returned for instant development & evaluation convenience
        expiresInSeconds: 300,
        supportHotline: config.businessSupportPhone,
      });
    } catch (error: any) {
      console.error('[AuthController.requestOtp] Error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to process OTP request. Please try again.',
      });
    }
  },

  /**
   * POST /api/auth/verify-otp
   * Validates OTP and returns JWT credentials along with user/role profile.
   */
  verifyOtp: async (req: Request, res: Response) => {
    try {
      const { phone: rawPhone, otp, fullName, address } = req.body;

      if (!rawPhone || !otp) {
        return res.status(400).json({
          success: false,
          error: 'Both phone number and OTP are required.',
        });
      }

      const normalizedPhone = normalizePhone(rawPhone);
      const stored = otpStore.get(normalizedPhone);

      // Verification logic: match stored OTP or universal test OTP '1234'
      const isOtpValid = otp === '1234' || (stored && stored.otp === otp && Date.now() < stored.expiresAt);

      if (!isOtpValid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or expired OTP. Please use OTP 1234 or request a new code.',
        });
      }

      // Clear used OTP
      otpStore.delete(normalizedPhone);

      const role: UserRole = stored?.role || 'CUSTOMER';

      // Find or create user profile matching proposed schema
      let user = usersByPhone.get(normalizedPhone);
      let isNewUser = false;

      if (!user) {
        isNewUser = true;
        const userId = `usr_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const profileId = role === 'PROVIDER' ? `pp_${Date.now()}` : `cp_${Date.now()}`;

        user = {
          id: userId,
          phone: normalizedPhone,
          role,
          name: fullName || (role === 'PROVIDER' ? 'New Service Partner' : 'Customer'),
          isActive: true,
          profileId,
          address: address || (role === 'CUSTOMER' ? 'Sector 62, Noida, Uttar Pradesh' : undefined),
          skills: role === 'PROVIDER' ? ['General Repairs'] : undefined,
          isKycVerified: role === 'ADMIN',
          createdAt: Date.now(),
        };

        usersByPhone.set(normalizedPhone, user);
      } else if (fullName && user.name !== fullName) {
        user.name = fullName;
        if (address) user.address = address;
        usersByPhone.set(normalizedPhone, user);
      }

      // Generate JWT Token
      const token = jwt.sign(
        {
          id: user.id,
          phone: user.phone,
          role: user.role,
          profileId: user.profileId,
        },
        config.jwtSecret,
        { expiresIn: '7d' }
      );

      return res.status(200).json({
        success: true,
        message: 'Authentication successful.',
        token,
        isNewUser,
        user: {
          id: user.id,
          phone: user.phone,
          role: user.role,
          name: user.name,
          email: user.email,
          profileId: user.profileId,
          address: user.address,
          skills: user.skills,
          isKycVerified: user.isKycVerified,
        },
      });
    } catch (error: any) {
      console.error('[AuthController.verifyOtp] Error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to verify OTP. Please try again.',
      });
    }
  },

  /**
   * GET /api/auth/me
   * Fetches currently authenticated user's profile.
   */
  getMe: async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: 'Authorization token required.',
        });
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, config.jwtSecret) as { id: string; phone: string; role: UserRole };

      const user = usersByPhone.get(decoded.phone);
      if (!user || !user.isActive) {
        return res.status(404).json({
          success: false,
          error: 'User not found or account deactivated.',
        });
      }

      return res.status(200).json({
        success: true,
        user: {
          id: user.id,
          phone: user.phone,
          role: user.role,
          name: user.name,
          email: user.email,
          profileId: user.profileId,
          address: user.address,
          skills: user.skills,
          isKycVerified: user.isKycVerified,
        },
      });
    } catch (error: any) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired authorization token.',
      });
    }
  },

  /**
   * PUT /api/auth/profile
   * Updates customer address or partner skills.
   */
  updateProfile: async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'Unauthorized.' });
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, config.jwtSecret) as { phone: string };
      const user = usersByPhone.get(decoded.phone);

      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found.' });
      }

      const { name, email, address, skills } = req.body;
      if (name) user.name = name;
      if (email) user.email = email;
      if (address) user.address = address;
      if (skills && Array.isArray(skills)) user.skills = skills;

      usersByPhone.set(decoded.phone, user);

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully.',
        user,
      });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: 'Failed to update profile.' });
    }
  },

  /**
   * POST /api/auth/logout
   */
  logout: async (_req: Request, res: Response) => {
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  },
};
