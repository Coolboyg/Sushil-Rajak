import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  jwtSecret: process.env.JWT_SECRET || 'gharsaathi_super_secret_jwt_key_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  businessSupportPhone: process.env.BUSINESS_SUPPORT_PHONE || '8435423190',
  brandTagline: 'घर के हर काम का भरोसेमंद साथी',
  platformCommissionPercent: parseInt(process.env.PLATFORM_COMMISSION_PERCENT || '20', 10),
  dispatchTimerSeconds: 25,
  initialSearchRadiusKm: 5.0,
  maxSearchRadiusKm: 15.0,
  searchRadiusStepKm: 5.0,
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_gharsaathi2026',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_gharsaathi2026',
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_webhook_secret_gharsaathi2026',
};
