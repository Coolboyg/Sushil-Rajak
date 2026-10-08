import http from 'http';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';

const app = express();
const PORT = process.env.PORT || 3000;
const SUPPORT_PHONE = '8435423190';
const BRAND_TAGLINE = 'घर के हर काम का भरोसेमंद साथी';

app.use(cors({ origin: '*' }));
app.use(express.json());

// In-Memory Database Stores
let users = [
  {
    id: 'usr_cust_rahul',
    phone: '+919876543210',
    role: 'CUSTOMER',
    name: 'Rahul Sharma',
    address: 'Flat 402, Lotus Boulevard, Sector 62, Noida',
    createdAt: Date.now()
  },
  {
    id: 'usr_prov_suresh',
    phone: '+919822345678',
    role: 'PROVIDER',
    name: 'Suresh Patel',
    skills: ['AC Servicing', 'AC Repair', 'Gas Charging'],
    experienceYears: 9,
    isKycVerified: true,
    createdAt: Date.now()
  },
  {
    id: 'usr_admin_01',
    phone: '+918435423190',
    role: 'ADMIN',
    name: 'GharSaathi Super Admin',
    createdAt: Date.now()
  }
];

let otpRequests = new Map();
let requests = [];
let bookings = [];

let providers = [
  {
    id: 'prov_2',
    name: 'Suresh Patel',
    phone: '+91 98223 45678',
    rating: 4.85,
    completedJobs: 520,
    skills: ['AC Servicing', 'AC Repair', 'Gas Charging'],
    categories: ['ac_services'],
    availability: 'ONLINE',
    lat: 28.5385,
    lng: 77.3895,
    todayEarnings: 2240,
    walletBalance: 8600,
    isKycVerified: true,
  },
  {
    id: 'prov_1',
    name: 'Rajesh Kumar',
    phone: '+91 98112 34567',
    rating: 4.90,
    completedJobs: 342,
    skills: ['Electrician', 'Geyser Repair', 'Wiring'],
    categories: ['home_repairs'],
    availability: 'ONLINE',
    lat: 28.5355,
    lng: 77.3910,
    todayEarnings: 1420,
    walletBalance: 4850,
    isKycVerified: true,
  },
  {
    id: 'prov_3',
    name: 'Amit Sharma',
    phone: '+91 98334 56789',
    rating: 4.75,
    completedJobs: 280,
    skills: ['Plumber', 'RO Service', 'Water Tank Cleaning'],
    categories: ['home_repairs', 'cleaning'],
    availability: 'ONLINE',
    lat: 28.5420,
    lng: 77.3940,
    todayEarnings: 890,
    walletBalance: 3200,
    isKycVerified: true,
  },
  {
    id: 'prov_4',
    name: 'Mohan Verma',
    phone: '+91 98445 67890',
    rating: 4.92,
    completedJobs: 410,
    skills: ['Carpenter', 'Furniture Repair', 'Drilling'],
    categories: ['furniture_carpentry'],
    availability: 'ONLINE',
    lat: 28.5310,
    lng: 77.3850,
    todayEarnings: 1680,
    walletBalance: 5900,
    isKycVerified: true,
  }
];

let inquiries = [
  { id: 'INQ-101', name: 'Pooja Verma', phone: '+91 99112 88442', query: 'AC gas charging kitne ki hogi split AC ke liye?', status: 'NEW' }
];

let complaints = [
  { id: 'CMP-501', customer: 'Vikas Mehra', partner: 'Amit Sharma', subject: 'Minor delay in arrival', status: 'RESOLVED' }
];

function normalizePhone(rawPhone) {
  const digits = String(rawPhone || '').replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  return `+91${digits.slice(-10)}`;
}

// 1. Health & Status
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'GharSaathi Backend Service',
    tagline: BRAND_TAGLINE,
    supportPhone: SUPPORT_PHONE,
    time: new Date().toISOString()
  });
});

// 2. Auth APIs
app.post('/api/auth/request-otp', (req, res) => {
  const { phone: rawPhone, role = 'CUSTOMER' } = req.body;
  const phone = normalizePhone(rawPhone || '9876543210');
  const otp = '1234'; // Universal demo OTP
  otpRequests.set(phone, { otp, role, expiresAt: Date.now() + 300000 });
  res.json({
    success: true,
    message: `OTP sent to ${phone}`,
    demoOtp: otp,
    phone,
    role,
    supportPhone: SUPPORT_PHONE
  });
});

app.post('/api/auth/verify-otp', (req, res) => {
  const { phone: rawPhone, otp, fullName, address, role = 'CUSTOMER' } = req.body;
  const phone = normalizePhone(rawPhone);

  if (otp !== '1234') {
    return res.status(400).json({ success: false, error: 'Invalid OTP. Please enter 1234.' });
  }

  let user = users.find(u => u.phone === phone);
  let isNew = false;
  if (!user) {
    isNew = true;
    user = {
      id: 'usr_' + Date.now(),
      phone,
      role,
      name: fullName || (role === 'PROVIDER' ? 'New Service Partner' : 'New Customer'),
      address: address || 'Sector 62, Noida',
      skills: role === 'PROVIDER' ? ['General Maintenance'] : undefined,
      createdAt: Date.now()
    };
    users.push(user);
  } else if (fullName) {
    user.name = fullName;
    if (address) user.address = address;
  }

  res.json({
    success: true,
    token: 'jwt_token_gs_' + Date.now(),
    isNew,
    user
  });
});

// 3. Service Catalog & Categories
app.get('/api/categories', (req, res) => {
  res.json([
    { id: 'ac_services', name: 'AC Services', hindiName: 'एसी सर्विस और रिपेयर' },
    { id: 'home_repairs', name: 'Home Repairs', hindiName: 'घर की मरम्मत' },
    { id: 'cleaning', name: 'Cleaning', hindiName: 'सफाई सेवाएँ' },
    { id: 'furniture_carpentry', name: 'Furniture & Carpentry', hindiName: 'कारपेंटर और फर्नीचर' },
    { id: 'beauty_wellness', name: 'Beauty & Wellness', hindiName: 'ब्यूटी और ग्रूमिंग' },
  ]);
});

app.get('/api/providers', (req, res) => res.json(providers));
app.get('/api/requests', (req, res) => res.json(requests));
app.get('/api/bookings', (req, res) => res.json(bookings));
app.get('/api/inquiries', (req, res) => res.json(inquiries));
app.get('/api/complaints', (req, res) => res.json(complaints));

// 4. Create Service Request
app.post('/api/service-requests', (req, res) => {
  const { serviceName = 'AC Repair', basePrice = 299, urgency = 'NORMAL', customerName = 'Rahul Sharma' } = req.body;
  const reqId = 'GS-' + Math.floor(10000 + Math.random() * 90000);
  const newReq = {
    id: reqId,
    customerName,
    serviceName,
    basePrice,
    urgency,
    status: 'SEARCHING',
    secondsRemaining: 25,
    offeredToProviderId: 'prov_2',
    address: 'Flat 402, Lotus Boulevard, Sector 62, Noida',
    createdAt: Date.now()
  };
  requests.unshift(newReq);
  io.emit('new_service_request', newReq);
  res.status(201).json({ success: true, request: newReq });
});

// 5. Admin Dashboard Metrics
app.get('/api/admin/dashboard', (req, res) => {
  res.json({
    liveRequests: requests.filter(r => r.status === 'SEARCHING').length || 1,
    activeBookings: bookings.filter(b => b.status !== 'COMPLETED').length || 1,
    onlinePartners: providers.filter(p => p.availability === 'ONLINE').length,
    grossRevenue: 2240,
    platformCommission: 448, // 20%
    partnerPayouts: 1792,
    supportPhone: SUPPORT_PHONE
  });
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Real-Time Socket Pipeline
io.on('connection', (socket) => {
  console.log(`[Socket.IO] Connected client: ${socket.id}`);

  socket.on('join_room', (room) => {
    socket.join(room);
  });

  socket.on('provider:accept_request', ({ requestId, providerId }) => {
    io.emit('request:assigned', { requestId, providerId, partnerName: 'Suresh Patel' });
  });

  socket.on('provider:update_location', (data) => {
    io.emit('provider:location_update', data);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Disconnected client: ${socket.id}`);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`  GharSaathi Real-Time Server Running on Port ${PORT}`);
  console.log(`  Tagline: ${BRAND_TAGLINE}`);
  console.log(`  Support Hotline: ${SUPPORT_PHONE}`);
  console.log(`=======================================================`);
});

export { app, server, io };
