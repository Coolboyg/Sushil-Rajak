import http from 'http';
import fs from 'fs';

let ioModule;
try {
  const socketIo = await import('socket.io');
  ioModule = socketIo.Server;
} catch (e) {
  console.log('[Info] Using built-in HTTP server mode');
}

const PORT = 3000;
const SUPPORT_PHONE = '8435423190';
const BRAND_TAGLINE = 'घर के हर काम का भरोसेमंद साथी';

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
  const digits = String(rawPhone || '').replace(/\\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  return `+91${digits.slice(-10)}`;
}

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GharSaathi — घर के हर काम का भरोसेमंद साथी</title>
  <meta name="description" content="On-demand home services marketplace with real-time dispatch. Call 8435423190.">
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    :root {
      --primary: #0F2C59;
      --secondary: #1B3B6F;
      --teal: #00A86B;
      --teal-light: #10B981;
      --bg: #F8FAFC;
    }
    body { background-color: var(--bg); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  </style>
</head>
<body class="text-slate-800">
  <div id="app" class="max-w-4xl mx-auto min-h-screen flex flex-col bg-white shadow-xl">
    <!-- Header -->
    <header class="bg-[#0F2C59] text-white p-4 sticky top-0 z-50 shadow-md">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00A86B] to-[#10B981] flex items-center justify-center text-white shadow-lg">
            <i class="fa-solid fa-house-chimney-crack text-xl"></i>
          </div>
          <div>
            <div class="flex items-center space-x-1.5">
              <span class="font-black text-lg tracking-wider">GHAR</span>
              <span class="font-black text-lg text-[#10B981] tracking-wider">SAATHI</span>
            </div>
            <p class="text-xs text-slate-300 font-medium">${BRAND_TAGLINE}</p>
          </div>
        </div>

        <div class="flex items-center space-x-2">
          <!-- Auth / Profile Button -->
          <button onclick="openAuthModal()" id="userHeaderBtn" class="flex items-center space-x-1.5 bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-1.5 rounded-full text-xs font-semibold text-white transition">
            <i class="fa-solid fa-circle-user text-emerald-400"></i>
            <span id="userHeaderName">Rahul (ग्राहक)</span>
          </button>

          <!-- Hotline Button -->
          <a href="tel:${SUPPORT_PHONE}" class="hidden sm:flex items-center space-x-1.5 bg-[#00A86B]/20 border border-[#00A86B]/50 px-3 py-1.5 rounded-full text-xs font-bold text-white hover:bg-[#00A86B]/30 transition">
            <i class="fa-solid fa-phone text-[#10B981]"></i>
            <span>${SUPPORT_PHONE}</span>
          </a>
        </div>
      </div>

      <!-- Role Switcher Tabs -->
      <div class="mt-4 grid grid-cols-3 gap-2 bg-[#0A192F] p-1.5 rounded-xl text-center">
        <button onclick="setRole('CUSTOMER')" id="tab-cust" class="py-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 bg-[#00A86B] text-white">
          <i class="fa-solid fa-user"></i>
          <span>Customer (ग्राहक)</span>
        </button>
        <button onclick="setRole('PROVIDER')" id="tab-prov" class="py-2 rounded-lg text-xs font-medium transition flex items-center justify-center space-x-1.5 text-slate-300 hover:text-white">
          <i class="fa-solid fa-screwdriver-wrench"></i>
          <span>Partner (कारीगर)</span>
        </button>
        <button onclick="setRole('ADMIN')" id="tab-admin" class="py-2 rounded-lg text-xs font-medium transition flex items-center justify-center space-x-1.5 text-slate-300 hover:text-white">
          <i class="fa-solid fa-chart-line"></i>
          <span>Admin (प्रबंधन)</span>
        </button>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="flex-1 p-4 md:p-6 overflow-y-auto">
      <!-- CUSTOMER VIEW -->
      <div id="view-customer" class="space-y-6">
        <!-- Location Bar -->
        <div class="flex items-center justify-between bg-slate-50 border border-slate-200 p-3 rounded-xl">
          <div class="flex items-center space-x-2">
            <div class="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <i class="fa-solid fa-location-dot"></i>
            </div>
            <div>
              <p class="text-xs text-slate-500 font-semibold">Service Address</p>
              <p id="custDisplayAddress" class="text-xs font-bold text-slate-800">Flat 402, Lotus Boulevard, Sector 62, Noida</p>
            </div>
          </div>
          <button onclick="openAuthModal('CUSTOMER')" class="text-xs font-bold text-[#0F2C59]">ID Setup / Edit</button>
        </div>

        <!-- Emergency Callout -->
        <div class="bg-amber-50 border border-amber-300 p-4 rounded-xl flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <i class="fa-solid fa-triangle-exclamation text-amber-600 text-2xl"></i>
            <div>
              <p class="text-xs font-bold text-amber-900">Emergency Breakdown? Instant Help</p>
              <p class="text-xs text-amber-700">Water leakage, electrical tripping or AC fault? Call GharSaathi support.</p>
            </div>
          </div>
          <a href="tel:${SUPPORT_PHONE}" class="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1">
            <i class="fa-solid fa-phone"></i>
            <span>Call ${SUPPORT_PHONE}</span>
          </a>
        </div>

        <!-- Search Bar -->
        <div class="relative">
          <i class="fa-solid fa-magnifying-glass absolute left-4 top-3.5 text-slate-400"></i>
          <input type="text" id="searchInput" placeholder="आपको किस service की जरूरत है? (AC, Plumber, Electrician...)"
            class="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00A86B]">
        </div>

        <!-- Live Active Booking / Dispatch Tracker -->
        <div id="customerActiveJobCard" class="hidden bg-[#0F2C59] text-white p-5 rounded-2xl shadow-lg border border-slate-700 space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <span class="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
              <span id="custJobStatus" class="font-bold text-sm text-emerald-400">Searching Nearby Technicians...</span>
            </div>
            <span id="custJobId" class="text-xs text-slate-300">#GS-10482</span>
          </div>

          <div class="bg-white/10 p-3 rounded-xl flex items-center justify-between">
            <div>
              <p class="text-xs text-slate-300">Assigned Partner</p>
              <p id="custPartnerName" class="font-bold text-sm">Suresh Patel (4.85★)</p>
            </div>
            <div class="text-right">
              <p class="text-xs text-slate-300">Estimated Arrival</p>
              <p id="custEta" class="font-bold text-sm text-emerald-300">~10 mins</p>
            </div>
          </div>

          <!-- Secure OTP Box -->
          <div id="custOtpBox" class="bg-amber-400/20 border border-amber-400/50 p-3 rounded-xl text-center">
            <p class="text-xs text-amber-300 font-bold">SHARE THIS 4-DIGIT OTP WITH TECHNICIAN UPON ARRIVAL</p>
            <p id="custOtpVal" class="text-2xl font-black tracking-widest text-white mt-1">4829</p>
          </div>

          <div class="flex space-x-2">
            <a href="tel:${SUPPORT_PHONE}" class="flex-1 bg-white/20 hover:bg-white/30 text-center py-2 rounded-lg text-xs font-bold transition">Call Partner</a>
            <button onclick="payBillModal()" id="custPayBtn" class="flex-1 bg-[#00A86B] hover:bg-[#059669] text-center py-2 rounded-lg text-xs font-bold transition">Pay Final Bill (₹449)</button>
          </div>
        </div>

        <!-- Service Provider Discovery Map Component -->
        <div class="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-lg space-y-4">
          <div class="p-4 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div class="flex items-center space-x-2">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                <h3 class="font-bold text-sm tracking-wide">Live Nearby Professionals Discovery Map</h3>
              </div>
              <p class="text-xs text-slate-400">
                Sector 62, Noida • Verified partners ready for 25s instant dispatch
              </p>
            </div>
            <div class="flex items-center space-x-2 text-xs">
              <span class="text-slate-400 font-medium">Search Radius:</span>
              <select id="mapRadiusSelect" onchange="filterMapRadius(this.value)" class="bg-slate-800 text-emerald-400 border border-slate-700 px-2.5 py-1 rounded-lg font-bold outline-none cursor-pointer">
                <option value="2.0">Within 2.0 KM</option>
                <option value="5.0" selected>Within 5.0 KM (Default)</option>
                <option value="10.0">Within 10.0 KM</option>
              </select>
            </div>
          </div>

          <!-- Category filter bar on map -->
          <div class="px-4 flex items-center space-x-2 overflow-x-auto text-xs pb-1">
            <button onclick="filterMapCategory('ALL')" id="mapCatBtnAll" class="px-3 py-1.5 rounded-xl font-bold whitespace-nowrap bg-[#00A86B] text-white shadow-sm">All Verified (सभी)</button>
            <button onclick="filterMapCategory('ac_services')" id="mapCatBtnAc" class="px-3 py-1.5 rounded-xl font-bold whitespace-nowrap bg-slate-100 text-slate-600 hover:bg-slate-200">AC Services (एसी)</button>
            <button onclick="filterMapCategory('home_repairs')" id="mapCatBtnRepairs" class="px-3 py-1.5 rounded-xl font-bold whitespace-nowrap bg-slate-100 text-slate-600 hover:bg-slate-200">Electrician & Plumber</button>
            <button onclick="filterMapCategory('furniture_carpentry')" id="mapCatBtnCarpentry" class="px-3 py-1.5 rounded-xl font-bold whitespace-nowrap bg-slate-100 text-slate-600 hover:bg-slate-200">Carpentry (कारपेंटर)</button>
          </div>

          <!-- Interactive Simulated Map Canvas Area -->
          <div class="relative mx-4 h-[340px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
            <!-- Concentric Radar Scan Rings -->
            <div class="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
              <div class="w-[120px] h-[120px] rounded-full border border-emerald-400"></div>
              <div class="w-[240px] h-[240px] rounded-full border border-emerald-400 absolute"></div>
              <div class="w-[340px] h-[340px] rounded-full border border-emerald-400 absolute"></div>
            </div>
            <!-- Grid Background -->
            <div class="absolute inset-0 opacity-15 pointer-events-none" style="background-image: radial-gradient(#10B981 1px, transparent 1px); background-size: 24px 24px;"></div>

            <!-- Customer Center Marker -->
            <div class="absolute z-20 flex flex-col items-center" style="left: 50%; top: 50%; transform: translate(-50%, -50%);">
              <div class="w-8 h-8 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-white shadow-xl animate-pulse">
                <i class="fa-solid fa-house-chimney text-xs"></i>
              </div>
              <span class="bg-blue-900/90 text-white text-[10px] font-black px-2 py-0.5 rounded shadow mt-1 whitespace-nowrap">
                You (Sector 62)
              </span>
            </div>

            <!-- Provider 1: Suresh Patel (AC) (lat: 28.5385, lng: 77.3895) -> ~40px left -->
            <div id="mapPinSuresh" onclick="selectMapProvider('prov_2')" class="map-provider-pin absolute z-30 flex flex-col items-center cursor-pointer transition-transform hover:scale-125" style="left: 36%; top: 48%; transform: translate(-50%, -50%);">
              <div class="w-9 h-9 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white shadow-lg font-black text-xs relative">
                <span>S</span>
                <span class="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 border border-white rounded-full"></span>
              </div>
              <div class="mt-1 bg-slate-900/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow flex items-center space-x-1 whitespace-nowrap border border-slate-700">
                <span class="text-emerald-400">Suresh (AC)</span>
                <span class="text-slate-400">(0.4 km)</span>
              </div>
            </div>

            <!-- Provider 2: Rajesh Kumar (Electrician) (lat: 28.5355, lng: 77.3910) -> ~60px down -->
            <div id="mapPinRajesh" onclick="selectMapProvider('prov_1')" class="map-provider-pin absolute z-30 flex flex-col items-center cursor-pointer transition-transform hover:scale-125" style="left: 52%; top: 72%; transform: translate(-50%, -50%);">
              <div class="w-9 h-9 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white shadow-lg font-black text-xs relative">
                <span>R</span>
                <span class="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 border border-white rounded-full"></span>
              </div>
              <div class="mt-1 bg-slate-900/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow flex items-center space-x-1 whitespace-nowrap border border-slate-700">
                <span class="text-emerald-400">Rajesh (Elec)</span>
                <span class="text-slate-400">(0.6 km)</span>
              </div>
            </div>

            <!-- Provider 3: Amit Sharma (Plumber) (lat: 28.5420, lng: 77.3940) -> ~70px up-right -->
            <div id="mapPinAmit" onclick="selectMapProvider('prov_3')" class="map-provider-pin absolute z-30 flex flex-col items-center cursor-pointer transition-transform hover:scale-125" style="left: 68%; top: 26%; transform: translate(-50%, -50%);">
              <div class="w-9 h-9 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white shadow-lg font-black text-xs relative">
                <span>A</span>
                <span class="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 border border-white rounded-full"></span>
              </div>
              <div class="mt-1 bg-slate-900/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow flex items-center space-x-1 whitespace-nowrap border border-slate-700">
                <span class="text-emerald-400">Amit (Plumb)</span>
                <span class="text-slate-400">(0.8 km)</span>
              </div>
            </div>

            <!-- Provider 4: Mohan Verma (Carpenter) (lat: 28.5310, lng: 77.3850) -> ~90px down-left -->
            <div id="mapPinMohan" onclick="selectMapProvider('prov_4')" class="map-provider-pin absolute z-30 flex flex-col items-center cursor-pointer transition-transform hover:scale-125" style="left: 22%; top: 78%; transform: translate(-50%, -50%);">
              <div class="w-9 h-9 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white shadow-lg font-black text-xs relative">
                <span>M</span>
                <span class="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 border border-white rounded-full"></span>
              </div>
              <div class="mt-1 bg-slate-900/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow flex items-center space-x-1 whitespace-nowrap border border-slate-700">
                <span class="text-emerald-400">Mohan (Carp)</span>
                <span class="text-slate-400">(1.1 km)</span>
              </div>
            </div>

            <!-- Selected Provider Floating Info Card -->
            <div id="mapFloatingCard" class="hidden absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md p-3.5 rounded-xl border border-slate-200 shadow-2xl z-40 flex items-center justify-between text-slate-800">
              <div class="flex items-center space-x-3">
                <div id="mapCardAvatar" class="w-12 h-12 rounded-xl bg-[#0F2C59] text-white flex items-center justify-center font-black text-lg">
                  S
                </div>
                <div>
                  <div class="flex items-center space-x-1.5">
                    <h4 id="mapCardName" class="font-bold text-sm text-slate-900">Suresh Patel</h4>
                    <span id="mapCardRating" class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2 rounded">★ 4.85</span>
                    <span class="text-[10px] text-emerald-600 font-semibold">• KYC Verified</span>
                  </div>
                  <p id="mapCardSkills" class="text-xs text-slate-600">AC Servicing, AC Repair • <b>0.4 KM away</b> (~8 min ETA)</p>
                  <p id="mapCardJobs" class="text-[11px] text-slate-500">Completed Jobs: <b>520</b> • Response Rate: <b>98%</b></p>
                </div>
              </div>

              <div class="flex items-center space-x-2">
                <button onclick="document.getElementById('mapFloatingCard').classList.add('hidden')" class="text-slate-400 hover:text-slate-600 px-2 py-1 text-xs font-bold">✕</button>
                <button id="mapCardBookBtn" onclick="openBookingModal('AC Repair & Troubleshooting', 299)" class="bg-[#00A86B] hover:bg-[#059669] text-white px-4 py-2 rounded-xl text-xs font-black shadow transition">
                  Book Partner (₹299+)
                </button>
              </div>
            </div>
          </div>

          <!-- Bottom Summary Carousel -->
          <div class="p-4 pt-0 space-y-2">
            <div class="flex items-center justify-between text-xs">
              <span class="font-bold text-slate-700" id="mapNearbyCount">4 Professionals Available Nearby</span>
              <span class="text-emerald-700 font-semibold">Ready for 25s Dispatch</span>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
              <div onclick="selectMapProvider('prov_2')" class="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 cursor-pointer bg-white transition">
                <div class="flex justify-between font-bold"><span>Suresh Patel</span><span class="text-emerald-700">★ 4.85</span></div>
                <p class="text-[11px] text-slate-500">AC Specialist • 0.4 km</p>
              </div>
              <div onclick="selectMapProvider('prov_1')" class="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 cursor-pointer bg-white transition">
                <div class="flex justify-between font-bold"><span>Rajesh Kumar</span><span class="text-emerald-700">★ 4.90</span></div>
                <p class="text-[11px] text-slate-500">Electrician • 0.6 km</p>
              </div>
              <div onclick="selectMapProvider('prov_3')" class="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 cursor-pointer bg-white transition">
                <div class="flex justify-between font-bold"><span>Amit Sharma</span><span class="text-emerald-700">★ 4.75</span></div>
                <p class="text-[11px] text-slate-500">Plumber • 0.8 km</p>
              </div>
              <div onclick="selectMapProvider('prov_4')" class="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 cursor-pointer bg-white transition">
                <div class="flex justify-between font-bold"><span>Mohan Verma</span><span class="text-emerald-700">★ 4.92</span></div>
                <p class="text-[11px] text-slate-500">Carpenter • 1.1 km</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Service Categories Grid with Icons Component -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-bold text-sm text-slate-900">Explore Service Categories (सेवा श्रेणियां)</h3>
              <p class="text-xs text-slate-500">विश्वसनीय और प्रमाणित कारीगर आपके द्वार पर</p>
            </div>
            <span class="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg">All Verified (7 Categories)</span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <!-- 1. AC Services -->
            <div onclick="filterMapCategory('ac_services')" class="p-3.5 rounded-2xl border border-slate-200 hover:border-[#00A86B] bg-white text-center cursor-pointer transition transform hover:-translate-y-1 shadow-sm flex flex-col items-center justify-between group">
              <span class="self-end -mt-1 -mr-1 bg-amber-100 text-amber-800 text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-tighter">Popular</span>
              <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center text-lg shadow-md mb-2 group-hover:scale-110 transition">
                <i class="fa-solid fa-snowflake"></i>
              </div>
              <h4 class="font-bold text-xs text-slate-800 group-hover:text-[#00A86B] transition">AC Services</h4>
              <p class="text-[10px] text-slate-500">एसी रिपेयर</p>
              <div class="mt-2 pt-1 border-t border-slate-100 w-full"><span class="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">From ₹299</span></div>
            </div>

            <!-- 2. Electrical -->
            <div onclick="filterMapCategory('home_repairs')" class="p-3.5 rounded-2xl border border-slate-200 hover:border-[#00A86B] bg-white text-center cursor-pointer transition transform hover:-translate-y-1 shadow-sm flex flex-col items-center justify-between group">
              <span class="self-end -mt-1 -mr-1 bg-amber-100 text-amber-800 text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-tighter">Fast ETA</span>
              <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 text-white flex items-center justify-center text-lg shadow-md mb-2 group-hover:scale-110 transition">
                <i class="fa-solid fa-bolt"></i>
              </div>
              <h4 class="font-bold text-xs text-slate-800 group-hover:text-[#00A86B] transition">Electrical</h4>
              <p class="text-[10px] text-slate-500">इलेक्ट्रीशियन</p>
              <div class="mt-2 pt-1 border-t border-slate-100 w-full"><span class="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">From ₹149</span></div>
            </div>

            <!-- 3. Plumbing -->
            <div onclick="filterMapCategory('home_repairs')" class="p-3.5 rounded-2xl border border-slate-200 hover:border-[#00A86B] bg-white text-center cursor-pointer transition transform hover:-translate-y-1 shadow-sm flex flex-col items-center justify-between group">
              <span class="self-end -mt-1 -mr-1 bg-rose-100 text-rose-800 text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-tighter">Emergency</span>
              <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-cyan-600 text-white flex items-center justify-center text-lg shadow-md mb-2 group-hover:scale-110 transition">
                <i class="fa-solid fa-faucet-drip"></i>
              </div>
              <h4 class="font-bold text-xs text-slate-800 group-hover:text-[#00A86B] transition">Plumbing</h4>
              <p class="text-[10px] text-slate-500">प्लम्बर विज़िट</p>
              <div class="mt-2 pt-1 border-t border-slate-100 w-full"><span class="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">From ₹149</span></div>
            </div>

            <!-- 4. Deep Cleaning -->
            <div onclick="filterMapCategory('ALL')" class="p-3.5 rounded-2xl border border-slate-200 hover:border-[#00A86B] bg-white text-center cursor-pointer transition transform hover:-translate-y-1 shadow-sm flex flex-col items-center justify-between group">
              <span class="self-end -mt-1 -mr-1 bg-emerald-100 text-emerald-800 text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-tighter">Top Rated</span>
              <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center text-lg shadow-md mb-2 group-hover:scale-110 transition">
                <i class="fa-solid fa-broom"></i>
              </div>
              <h4 class="font-bold text-xs text-slate-800 group-hover:text-[#00A86B] transition">Cleaning</h4>
              <p class="text-[10px] text-slate-500">डीप क्लीनिंग</p>
              <div class="mt-2 pt-1 border-t border-slate-100 w-full"><span class="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">From ₹349</span></div>
            </div>

            <!-- 5. Carpentry -->
            <div onclick="filterMapCategory('furniture_carpentry')" class="p-3.5 rounded-2xl border border-slate-200 hover:border-[#00A86B] bg-white text-center cursor-pointer transition transform hover:-translate-y-1 shadow-sm flex flex-col items-center justify-between group">
              <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-700 text-white flex items-center justify-center text-lg shadow-md mb-2 group-hover:scale-110 transition mt-3">
                <i class="fa-solid fa-couch"></i>
              </div>
              <h4 class="font-bold text-xs text-slate-800 group-hover:text-[#00A86B] transition">Carpentry</h4>
              <p class="text-[10px] text-slate-500">कारपेंटर</p>
              <div class="mt-2 pt-1 border-t border-slate-100 w-full"><span class="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">From ₹199</span></div>
            </div>

            <!-- 6. Appliance Repair -->
            <div onclick="filterMapCategory('ALL')" class="p-3.5 rounded-2xl border border-slate-200 hover:border-[#00A86B] bg-white text-center cursor-pointer transition transform hover:-translate-y-1 shadow-sm flex flex-col items-center justify-between group">
              <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center text-lg shadow-md mb-2 group-hover:scale-110 transition mt-3">
                <i class="fa-solid fa-screwdriver-wrench"></i>
              </div>
              <h4 class="font-bold text-xs text-slate-800 group-hover:text-[#00A86B] transition">Appliances</h4>
              <p class="text-[10px] text-slate-500">होम अप्लायंसेज</p>
              <div class="mt-2 pt-1 border-t border-slate-100 w-full"><span class="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">From ₹249</span></div>
            </div>

            <!-- 7. Painting -->
            <div onclick="filterMapCategory('ALL')" class="p-3.5 rounded-2xl border border-slate-200 hover:border-[#00A86B] bg-white text-center cursor-pointer transition transform hover:-translate-y-1 shadow-sm flex flex-col items-center justify-between group">
              <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-red-600 text-white flex items-center justify-center text-lg shadow-md mb-2 group-hover:scale-110 transition mt-3">
                <i class="fa-solid fa-paint-roller"></i>
              </div>
              <h4 class="font-bold text-xs text-slate-800 group-hover:text-[#00A86B] transition">Painting</h4>
              <p class="text-[10px] text-slate-500">पेंटिंग सेवाएँ</p>
              <div class="mt-2 pt-1 border-t border-slate-100 w-full"><span class="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">From ₹499</span></div>
            </div>
          </div>
        </div>

        <!-- Popular Categories & Services Grid -->
        <div>


          <div class="flex items-center justify-between mb-3">
            <h3 class="font-bold text-sm text-slate-800">Popular Services (लोकप्रिय सेवाएँ)</h3>
            <span class="text-xs text-slate-500">Verified Local Partners</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <!-- Service Card: AC Repair -->
            <div class="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between hover:border-[#00A86B] transition shadow-sm">
              <div class="space-y-1">
                <div class="flex items-center space-x-2">
                  <span class="font-bold text-sm text-slate-900">AC Repair & Troubleshooting</span>
                  <span class="text-xs bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-semibold">4.88★</span>
                </div>
                <p class="text-xs text-emerald-700 font-medium">एसी सर्विस और रिपेयर</p>
                <p class="text-xs text-slate-500">Cooling diagnosis, coil inspection & 30-day warranty.</p>
                <p class="text-xs font-bold text-[#0F2C59] pt-1">Starts at ₹299</p>
              </div>
              <button onclick="openBookingModal('AC Repair & Troubleshooting', 299)" class="bg-[#00A86B] hover:bg-[#059669] text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow">
                Book Now
              </button>
            </div>

            <!-- Service Card: Electrician -->
            <div class="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between hover:border-[#00A86B] transition shadow-sm">
              <div class="space-y-1">
                <div class="flex items-center space-x-2">
                  <span class="font-bold text-sm text-slate-900">Electrician General Visit</span>
                  <span class="text-xs bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-semibold">4.89★</span>
                </div>
                <p class="text-xs text-emerald-700 font-medium">इलेक्ट्रीशियन विज़िट</p>
                <p class="text-xs text-slate-500">Short circuit, switch board, MCB tripping & fans.</p>
                <p class="text-xs font-bold text-[#0F2C59] pt-1">Starts at ₹149</p>
              </div>
              <button onclick="openBookingModal('Electrician General Visit', 149)" class="bg-[#00A86B] hover:bg-[#059669] text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow">
                Book Now
              </button>
            </div>

            <!-- Service Card: Plumber -->
            <div class="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between hover:border-[#00A86B] transition shadow-sm">
              <div class="space-y-1">
                <div class="flex items-center space-x-2">
                  <span class="font-bold text-sm text-slate-900">Plumber General Visit</span>
                  <span class="text-xs bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-semibold">4.81★</span>
                </div>
                <p class="text-xs text-emerald-700 font-medium">प्लम्बर विज़िट</p>
                <p class="text-xs text-slate-500">Tap leakage, blockages, flush tank & pipe fitting.</p>
                <p class="text-xs font-bold text-[#0F2C59] pt-1">Starts at ₹149</p>
              </div>
              <button onclick="openBookingModal('Plumber General Visit', 149)" class="bg-[#00A86B] hover:bg-[#059669] text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow">
                Book Now
              </button>
            </div>

            <!-- Service Card: Deep Cleaning -->
            <div class="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between hover:border-[#00A86B] transition shadow-sm">
              <div class="space-y-1">
                <div class="flex items-center space-x-2">
                  <span class="font-bold text-sm text-slate-900">Bathroom Deep Cleaning</span>
                  <span class="text-xs bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-semibold">4.87★</span>
                </div>
                <p class="text-xs text-emerald-700 font-medium">बाथरूम डीप क्लीनिंग</p>
                <p class="text-xs text-slate-500">Hard water stain descaling, tile scrubbing & sanitization.</p>
                <p class="text-xs font-bold text-[#0F2C59] pt-1">Starts at ₹349</p>
              </div>
              <button onclick="openBookingModal('Bathroom Deep Cleaning', 349)" class="bg-[#00A86B] hover:bg-[#059669] text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow">
                Book Now
              </button>
            </div>
          </div>
        </div>

        <!-- Ask For Service Inquiry Card -->
        <div class="bg-gradient-to-r from-[#0F2C59] to-[#1B3B6F] text-white p-5 rounded-2xl shadow flex items-center justify-between">
          <div class="space-y-1">
            <h4 class="font-bold text-sm">Ask for Custom Service ("पूछताछ")</h4>
            <p class="text-xs text-slate-300">Need specific quotation? Submit an inquiry and our team calls in 10 mins.</p>
            <p class="text-xs text-emerald-300 font-semibold">Business Hotline: ${SUPPORT_PHONE}</p>
          </div>
          <button onclick="openInquiryModal()" class="bg-[#00A86B] hover:bg-[#059669] text-white px-4 py-2 rounded-xl text-xs font-bold shadow">
            Ask Service
          </button>
        </div>
      </div>

      <!-- PROVIDER VIEW -->
      <div id="view-provider" class="hidden space-y-5">
        <!-- Partner Profile & Availability Card -->
        <div class="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div class="flex items-center space-x-3">
            <div id="provAvatar" class="w-12 h-12 rounded-full bg-[#0F2C59] text-white font-bold flex items-center justify-center text-lg">
              S
            </div>
            <div>
              <div class="flex items-center space-x-1.5">
                <span id="provDisplayName" class="font-bold text-sm text-slate-900">Suresh Patel</span>
                <i class="fa-solid fa-circle-check text-emerald-600 text-xs"></i>
              </div>
              <p id="provDisplaySkills" class="text-xs text-slate-500">AC Specialist • 4.85★ (520 jobs completed)</p>
              <p class="text-xs text-emerald-700 font-semibold">Response Rate: 98% • Active Area: Noida</p>
            </div>
          </div>

          <div class="text-right space-y-1">
            <span id="provAvailStatus" class="text-xs font-bold text-emerald-700 block">ONLINE</span>
            <button onclick="toggleProviderAvail()" id="btnProvToggle" class="bg-[#00A86B] text-white px-3 py-1 rounded-full text-xs font-bold shadow">
              Available
            </button>
            <button onclick="openAuthModal('PROVIDER')" class="text-[10px] text-[#0F2C59] font-bold block underline">Partner ID Setup</button>
          </div>
        </div>

        <!-- Incoming Service Request Offer Modal / Banner (25s countdown) -->
        <div id="provOfferAlert" class="bg-rose-50 border-2 border-rose-500 p-5 rounded-2xl shadow-lg space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2 text-rose-600">
              <i class="fa-solid fa-bell animate-bounce"></i>
              <span class="font-black text-sm uppercase">NEW SERVICE REQUEST DISPATCH</span>
            </div>
            <div class="bg-rose-600 text-white px-2.5 py-1 rounded-full text-xs font-black" id="provTimerBadge">
              25s remaining
            </div>
          </div>

          <div class="space-y-1">
            <h4 class="font-bold text-base text-slate-900" id="provReqService">AC Repair & Troubleshooting</h4>
            <p class="text-xs text-slate-600">Customer: <b id="provReqCust">Rahul Sharma</b> • Distance: <b>~1.4 KM</b></p>
            <p class="text-xs text-slate-500">Problem: "AC cooling issue, buzzing sound inside coil"</p>
            <p class="text-xs font-bold text-emerald-700">Estimated Payout: ₹299+ (Normal Urgency)</p>
          </div>

          <div class="flex space-x-3 pt-2">
            <button onclick="rejectOffer()" class="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 py-2.5 rounded-xl text-xs font-bold transition">
              Reject
            </button>
            <button onclick="acceptOffer()" class="flex-1 bg-[#00A86B] hover:bg-[#059669] text-white py-2.5 rounded-xl text-xs font-black shadow transition">
              ACCEPT REQUEST
            </button>
          </div>
        </div>

        <!-- Active Provider Job Stepper -->
        <div id="provActiveJob" class="hidden bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
          <div class="flex items-center justify-between">
            <h4 class="font-bold text-sm text-[#0F2C59]">CURRENT ACTIVE JOB</h4>
            <span class="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded" id="provJobStep">PROVIDER ON THE WAY</span>
          </div>

          <div class="space-y-1 text-xs">
            <p><b>Service:</b> AC Repair & Troubleshooting</p>
            <p><b>Customer:</b> Rahul Sharma (+91 98765 43210)</p>
            <p><b>Address:</b> Flat 402, Lotus Boulevard, Sector 62, Noida</p>
          </div>

          <!-- Stepper Action Buttons -->
          <div class="space-y-2 pt-2">
            <button onclick="markArrived()" id="btnProvArrived" class="w-full bg-[#0F2C59] hover:bg-[#1B3B6F] text-white py-2.5 rounded-xl text-xs font-bold transition">
              <i class="fa-solid fa-location-dot mr-1"></i> I HAVE ARRIVED AT CUSTOMER DOOR
            </button>
            <div id="provOtpInputBox" class="hidden space-y-2 bg-amber-50 p-3 rounded-xl border border-amber-300">
              <p class="text-xs font-bold text-amber-900 text-center">ASK CUSTOMER FOR 4-DIGIT OTP TO START</p>
              <div class="flex space-x-2">
                <input type="text" id="provOtpInput" placeholder="Enter 4-digit OTP" class="flex-1 px-3 py-2 border rounded-lg text-center font-bold tracking-widest text-sm">
                <button onclick="verifyOtpAndStart()" class="bg-[#00A86B] text-white px-4 py-2 rounded-lg text-xs font-bold">VERIFY</button>
              </div>
            </div>
            <button onclick="completeJob()" id="btnProvComplete" class="hidden w-full bg-[#00A86B] hover:bg-[#059669] text-white py-2.5 rounded-xl text-xs font-bold transition">
              <i class="fa-solid fa-check mr-1"></i> COMPLETE SERVICE & GENERATE BILL
            </button>
          </div>
        </div>

        <!-- Earnings Card -->
        <div class="grid grid-cols-3 gap-3 text-center">
          <div class="bg-white border p-3 rounded-xl">
            <p class="text-xs text-slate-500">Today's Earnings</p>
            <p class="text-base font-black text-emerald-700">₹2,240</p>
          </div>
          <div class="bg-white border p-3 rounded-xl">
            <p class="text-xs text-slate-500">Wallet Balance</p>
            <p class="text-base font-black text-[#0F2C59]">₹8,600</p>
          </div>
          <div class="bg-white border p-3 rounded-xl">
            <p class="text-xs text-slate-500">Jobs Completed</p>
            <p class="text-base font-black text-slate-800">520</p>
          </div>
        </div>
      </div>

      <!-- ADMIN VIEW -->
      <div id="view-admin" class="hidden space-y-5">
        <!-- Admin Profile Bar -->
        <div class="bg-white border border-slate-200 p-3 rounded-xl flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <div class="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
              AD
            </div>
            <div>
              <p class="text-xs font-bold text-slate-900" id="adminDisplayName">GharSaathi Operations Admin</p>
              <p class="text-[10px] text-slate-500">Full Access Control • Verified</p>
            </div>
          </div>
          <button onclick="openAuthModal('ADMIN')" class="text-xs font-bold text-[#0F2C59]">Switch / Admin ID Setup</button>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          <div class="bg-white border p-3 rounded-xl shadow-sm">
            <p class="text-xs text-slate-500">Live Requests</p>
            <p class="text-lg font-black text-rose-600" id="adminLiveReqCount">1</p>
          </div>
          <div class="bg-white border p-3 rounded-xl shadow-sm">
            <p class="text-xs text-slate-500">Active Bookings</p>
            <p class="text-lg font-black text-emerald-600" id="adminActiveBookCount">1</p>
          </div>
          <div class="bg-white border p-3 rounded-xl shadow-sm">
            <p class="text-xs text-slate-500">Online Partners</p>
            <p class="text-lg font-black text-[#0F2C59]">4</p>
          </div>
          <div class="bg-white border p-3 rounded-xl shadow-sm">
            <p class="text-xs text-slate-500">Platform Commission (20%)</p>
            <p class="text-lg font-black text-emerald-700">₹448</p>
          </div>
        </div>

        <!-- Live Dispatch Monitor -->
        <div class="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
          <div class="flex items-center justify-between mb-3">
            <h4 class="font-bold text-sm text-slate-800">Live Service Requests Dispatch Monitor</h4>
            <span class="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Real-Time 25s Ticker</span>
          </div>

          <div class="space-y-2 text-xs">
            <div class="border p-3 rounded-lg flex items-center justify-between">
              <div>
                <span class="font-bold text-[#0F2C59]">GS-10482</span> • <span>AC Repair & Troubleshooting</span>
                <p class="text-slate-500">Customer: Rahul Sharma • Urgency: <b>ASAP</b></p>
              </div>
              <div class="text-right">
                <span class="bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded">SEARCHING (18s)</span>
                <p class="text-slate-500 text-[10px] mt-1">Offered to: Suresh Patel</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Support Callout -->
        <div class="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
          <div>
            <p class="text-xs font-bold">GharSaathi Official Business Helpline</p>
            <p class="text-sm font-black text-emerald-400">${SUPPORT_PHONE}</p>
          </div>
          <a href="tel:${SUPPORT_PHONE}" class="bg-[#00A86B] text-white px-3 py-1.5 rounded-lg text-xs font-bold">Call Now</a>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="bg-slate-100 border-t border-slate-200 p-3 text-center text-xs text-slate-500">
      <p>GharSaathi • ${BRAND_TAGLINE} • Official Support: <b class="text-slate-700">${SUPPORT_PHONE}</b></p>
    </footer>

    <!-- ================= AUTH & ID SETUP MODAL ================= -->
    <div id="authModal" class="hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        <!-- Modal Header -->
        <div class="bg-[#0F2C59] text-white p-5 flex items-center justify-between">
          <div>
            <h3 class="font-black text-base flex items-center space-x-2">
              <i class="fa-solid fa-shield-halved text-emerald-400"></i>
              <span>GharSaathi ID Setup & Login</span>
            </h3>
            <p class="text-xs text-slate-300">ग्राहक • पार्टनर • एडमिन आईडी सेटअप</p>
          </div>
          <button onclick="closeAuthModal()" class="text-slate-300 hover:text-white text-lg">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- Role Select Tabs in Modal -->
        <div class="p-5 space-y-4">
          <div class="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-xl text-center text-xs font-bold">
            <button onclick="setAuthRole('CUSTOMER')" id="authRoleCust" class="py-2 rounded-lg bg-[#00A86B] text-white transition">
              Customer
            </button>
            <button onclick="setAuthRole('PROVIDER')" id="authRoleProv" class="py-2 rounded-lg text-slate-600 transition">
              Partner
            </button>
            <button onclick="setAuthRole('ADMIN')" id="authRoleAdmin" class="py-2 rounded-lg text-slate-600 transition">
              Admin
            </button>
          </div>

          <!-- Mode Toggle: Login vs ID Setup (Signup) -->
          <div class="flex border-b text-xs font-semibold">
            <button onclick="setAuthMode('LOGIN')" id="authTabLogin" class="flex-1 pb-2 border-b-2 border-[#00A86B] text-[#00A86B] font-bold">
              Sign In (लॉगिन)
            </button>
            <button onclick="setAuthMode('SIGNUP')" id="authTabSignup" class="flex-1 pb-2 border-b-2 border-transparent text-slate-500 hover:text-slate-800">
              New ID Setup (नया खाता)
            </button>
          </div>

          <!-- Fast 1-Click Demo Profiles -->
          <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1">
            <p class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Fast 1-Click Demo Login:</p>
            <div class="flex flex-wrap gap-1.5">
              <button onclick="fillDemo('CUSTOMER')" class="bg-white border text-[11px] px-2 py-1 rounded-lg hover:border-emerald-500 text-slate-700">
                👤 Rahul (Customer)
              </button>
              <button onclick="fillDemo('PROVIDER')" class="bg-white border text-[11px] px-2 py-1 rounded-lg hover:border-emerald-500 text-slate-700">
                🛠️ Suresh (AC Partner)
              </button>
              <button onclick="fillDemo('ADMIN')" class="bg-white border text-[11px] px-2 py-1 rounded-lg hover:border-emerald-500 text-slate-700">
                ⚡ Super Admin
              </button>
            </div>
          </div>

          <!-- Step 1: Input Form -->
          <div id="authStep1" class="space-y-3">
            <!-- Full Name (Only for Signup) -->
            <div id="authNameField" class="hidden">
              <label class="block text-xs font-bold text-slate-700 mb-1">Full Name (पूरा नाम)</label>
              <input type="text" id="authNameInput" placeholder="e.g. Rahul Sharma"
                class="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-[#00A86B] outline-none">
            </div>

            <!-- Phone Number -->
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Mobile Number (मोबाइल नंबर)</label>
              <div class="flex">
                <span class="inline-flex items-center px-3 rounded-l-xl border border-r-0 bg-slate-100 text-slate-600 text-xs font-bold">+91</span>
                <input type="tel" id="authPhoneInput" placeholder="98765 43210" maxlength="10"
                  class="w-full px-3 py-2 border rounded-r-xl text-xs focus:ring-2 focus:ring-[#00A86B] outline-none">
              </div>
            </div>

            <!-- Customer Address (Only for Customer Signup) -->
            <div id="authAddressField" class="hidden">
              <label class="block text-xs font-bold text-slate-700 mb-1">Address / Area (पता / लोकेशन)</label>
              <input type="text" id="authAddressInput" placeholder="Flat / House, Sector 62, Noida"
                class="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-[#00A86B] outline-none">
            </div>

            <!-- Partner Trade / Skills (Only for Partner Signup) -->
            <div id="authPartnerField" class="hidden space-y-2">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Service Skill (कार्य / हुनर)</label>
                <select id="authSkillInput" class="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-[#00A86B] outline-none">
                  <option value="AC Servicing & Repair">AC Servicing & Repair (एसी रिपेयर)</option>
                  <option value="Electrician">Electrician (इलेक्ट्रीशियन)</option>
                  <option value="Plumber">Plumber (प्लम्बर)</option>
                  <option value="Carpenter">Carpenter (कारपेंटर)</option>
                  <option value="Full Home Cleaning">Cleaning (सफाई सेवा)</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Experience (अनुभव वर्ष)</label>
                <input type="number" id="authExpInput" value="5" min="1" max="40"
                  class="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-[#00A86B] outline-none">
              </div>
            </div>

            <!-- Admin Master Key (Only for Admin) -->
            <div id="authAdminField" class="hidden">
              <label class="block text-xs font-bold text-slate-700 mb-1">Admin Security PIN</label>
              <input type="password" id="authPinInput" value="8435423190" placeholder="Enter admin PIN"
                class="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-[#00A86B] outline-none">
            </div>

            <button onclick="requestOtpSubmit()" class="w-full bg-[#00A86B] hover:bg-[#059669] text-white py-2.5 rounded-xl text-xs font-bold transition shadow">
              GET OTP (ओटीपी प्राप्त करें)
            </button>
          </div>

          <!-- Step 2: OTP Verification -->
          <div id="authStep2" class="hidden space-y-3">
            <div class="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-center">
              <p class="text-xs text-emerald-800 font-medium">OTP has been sent to <b id="otpSentPhone">+91 ...</b></p>
              <p class="text-[11px] text-emerald-600 font-bold mt-1">Universal Demo OTP: <span class="bg-emerald-200 px-1.5 py-0.5 rounded text-emerald-900">1234</span></p>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Enter 4-Digit OTP</label>
              <input type="text" id="otpCodeInput" maxlength="4" placeholder="1 2 3 4"
                class="w-full px-3 py-2 border rounded-xl text-center font-black tracking-widest text-lg focus:ring-2 focus:ring-[#00A86B] outline-none">
            </div>

            <div class="flex space-x-2">
              <button onclick="document.getElementById('otpCodeInput').value='1234'" class="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold">
                Auto Fill 1234
              </button>
              <button onclick="verifyOtpSubmit()" class="flex-1 bg-[#0F2C59] hover:bg-[#1B3B6F] text-white py-2 rounded-xl text-xs font-bold shadow">
                VERIFY & COMPLETE LOGIN
              </button>
            </div>

            <button onclick="resetAuthSteps()" class="w-full text-center text-xs text-slate-500 hover:text-slate-800 pt-1">
              ← Change Mobile Number
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ================= PROVIDER DETAIL PAGE MODAL ================= -->
    <div id="providerDetailModal" class="hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div class="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 my-8">
        <!-- Header Banner -->
        <div class="bg-gradient-to-r from-[#0F2C59] to-[#1B3B6F] text-white p-6 relative">
          <button onclick="closeProviderDetailModal()" class="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition">
            ✕
          </button>
          <div class="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div id="detailAvatar" class="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#00A86B] to-[#10B981] flex items-center justify-center text-white font-black text-3xl shadow-xl">
              S
            </div>
            <div class="space-y-1">
              <div class="flex items-center space-x-2">
                <h2 id="detailName" class="text-xl font-black">Suresh Patel</h2>
                <span class="bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                  <i class="fa-solid fa-certificate"></i>
                  <span>Govt. Certified & KYC Cleared</span>
                </span>
              </div>
              <p id="detailSkills" class="text-xs text-slate-300">AC Servicing • AC Repair • Gas Charging • <b>9 Years Experience</b></p>
              <div class="flex items-center space-x-3 text-xs pt-1">
                <span id="detailRatingBadge" class="bg-amber-400 text-slate-900 font-black px-2 py-0.5 rounded">★ 4.85 Rating</span>
                <span id="detailJobs" class="text-slate-300"><b>520</b> Jobs Done</span>
                <span class="text-emerald-300 font-semibold">• 98% Response Rate</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="grid grid-cols-3 border-b text-xs font-bold bg-slate-50 text-center">
          <button onclick="setProviderDetailTab('REVIEWS')" id="tabDetailReviews" class="py-3 border-b-2 border-[#00A86B] text-[#00A86B] bg-white transition">
            ⭐ Customer Reviews (3)
          </button>
          <button onclick="setProviderDetailTab('CERTIFICATIONS')" id="tabDetailCerts" class="py-3 border-b-2 border-transparent text-slate-500 hover:text-slate-800 transition">
            📜 Certifications (3)
          </button>
          <button onclick="setProviderDetailTab('HISTORY')" id="tabDetailHistory" class="py-3 border-b-2 border-transparent text-slate-500 hover:text-slate-800 transition">
            🛠️ Work History (3)
          </button>
        </div>

        <!-- Tab Body -->
        <div class="p-6 max-h-[380px] overflow-y-auto space-y-4">
          <!-- REVIEWS TAB -->
          <div id="detailSectionReviews" class="space-y-3">
            <div class="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center justify-between text-xs">
              <span class="font-bold text-emerald-900">Overall Rating: 4.85 / 5.0 (Based on 520 verified visits)</span>
              <span class="bg-emerald-200 text-emerald-800 font-black px-2 py-0.5 rounded">100% Genuine</span>
            </div>
            <div class="border border-slate-200 p-4 rounded-xl space-y-2 bg-white">
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="font-bold text-xs text-slate-900">Vikas Mehra</h4>
                  <p class="text-[10px] text-slate-400">Yesterday • Sector 62, Noida</p>
                </div>
                <span class="text-amber-500 font-black text-xs">★ 5.0</span>
              </div>
              <p class="text-xs text-slate-700 italic">"सुरेश जी ने मात्र 30 मिनट में एसी की कूलिंग समस्या ठीक कर दी। बहुत ही विनम्र और पेशेवर कारीगर हैं।"</p>
              <div class="pt-1 border-t border-slate-100 text-[10px] text-emerald-700 font-semibold">✓ Verified Booking • AC Foam Jet Servicing</div>
            </div>
            <div class="border border-slate-200 p-4 rounded-xl space-y-2 bg-white">
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="font-bold text-xs text-slate-900">Pooja Verma</h4>
                  <p class="text-[10px] text-slate-400">3 days ago • Sector 62, Noida</p>
                </div>
                <span class="text-amber-500 font-black text-xs">★ 5.0</span>
              </div>
              <p class="text-xs text-slate-700 italic">"Very fast arrival! Reached in 10 minutes. Cleaned coil thoroughly with foam jet. Warranty card provided."</p>
              <div class="pt-1 border-t border-slate-100 text-[10px] text-emerald-700 font-semibold">✓ Verified Booking • Split AC Gas Charging</div>
            </div>
          </div>

          <!-- CERTIFICATIONS TAB -->
          <div id="detailSectionCerts" class="hidden space-y-3">
            <div class="border border-slate-200 p-4 rounded-xl flex items-start space-x-3 bg-white">
              <div class="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-lg flex-shrink-0">
                <i class="fa-solid fa-award"></i>
              </div>
              <div class="flex-1 space-y-0.5">
                <div class="flex items-center justify-between">
                  <h4 class="font-bold text-xs text-slate-900">NSDC Certified Master HVAC & AC Technician</h4>
                  <span class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">✓ Verified</span>
                </div>
                <p class="text-xs text-slate-500">Issuer: National Skill Development Corporation (Govt. of India)</p>
                <p class="text-[10px] text-slate-400">Year: 2021 • Skill Level: Grade-A Specialist</p>
              </div>
            </div>
            <div class="border border-slate-200 p-4 rounded-xl flex items-start space-x-3 bg-white">
              <div class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg flex-shrink-0">
                <i class="fa-solid fa-id-card"></i>
              </div>
              <div class="flex-1 space-y-0.5">
                <div class="flex items-center justify-between">
                  <h4 class="font-bold text-xs text-slate-900">UIDAI Aadhaar Verified & Police Cleared</h4>
                  <span class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">✓ Verified</span>
                </div>
                <p class="text-xs text-slate-500">Issuer: GharSaathi Trust & Safety</p>
                <p class="text-[10px] text-slate-400">Year: 2024 • Background Status: PASS</p>
              </div>
            </div>
          </div>

          <!-- WORK HISTORY TAB -->
          <div id="detailSectionHistory" class="hidden space-y-3">
            <div class="border border-slate-200 p-3.5 rounded-xl flex items-center justify-between bg-white text-xs">
              <div>
                <h4 class="font-bold text-slate-900">AC Foam Jet Servicing & Coil Descaling</h4>
                <p class="text-[11px] text-slate-500">Flat 304, Sector 62, Noida • Vikas Mehra</p>
                <span class="text-[10px] text-slate-400">Yesterday</span>
              </div>
              <div class="text-right">
                <span class="font-black text-emerald-700">₹499</span>
                <p class="text-amber-600 font-bold text-[10px]">★ 5.0 Rated</p>
              </div>
            </div>
            <div class="border border-slate-200 p-3.5 rounded-xl flex items-center justify-between bg-white text-xs">
              <div>
                <h4 class="font-bold text-slate-900">Split AC Gas Charging & Leakage Repair</h4>
                <p class="text-[11px] text-slate-500">Tower C, Sector 62, Noida • Pooja Verma</p>
                <span class="text-[10px] text-slate-400">3 days ago</span>
              </div>
              <div class="text-right">
                <span class="font-black text-emerald-700">₹1,450</span>
                <p class="text-amber-600 font-bold text-[10px]">★ 5.0 Rated</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-4 bg-slate-50 border-t flex items-center justify-between">
          <a href="tel:8435423190" class="flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-slate-900">
            <i class="fa-solid fa-phone text-emerald-600"></i>
            <span>Support: 8435423190</span>
          </a>
          <div class="flex space-x-2">
            <button onclick="closeProviderDetailModal()" class="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100">Close</button>
            <button id="btnDetailBookNow" onclick="openBookingModal('AC Repair & Troubleshooting', 299); closeProviderDetailModal();" class="bg-[#00A86B] hover:bg-[#059669] text-white px-5 py-2 rounded-xl text-xs font-black shadow transition">
              Book Suresh (₹299+)
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>


  <script>
    let currentRole = 'CUSTOMER';
    let currentOtp = '4829';
    let authRole = 'CUSTOMER';
    let authMode = 'LOGIN';

    // Current User Session
    let currentUser = {
      name: 'Rahul Sharma',
      phone: '+919876543210',
      role: 'CUSTOMER',
      address: 'Flat 402, Lotus Boulevard, Sector 62, Noida'
    };

    function setRole(role) {
      currentRole = role;
      document.getElementById('view-customer').classList.toggle('hidden', role !== 'CUSTOMER');
      document.getElementById('view-provider').classList.toggle('hidden', role !== 'PROVIDER');
      document.getElementById('view-admin').classList.toggle('hidden', role !== 'ADMIN');

      document.getElementById('tab-cust').className = role === 'CUSTOMER' ? 'py-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 bg-[#00A86B] text-white' : 'py-2 rounded-lg text-xs font-medium transition flex items-center justify-center space-x-1.5 text-slate-300 hover:text-white';
      document.getElementById('tab-prov').className = role === 'PROVIDER' ? 'py-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 bg-[#00A86B] text-white' : 'py-2 rounded-lg text-xs font-medium transition flex items-center justify-center space-x-1.5 text-slate-300 hover:text-white';
      document.getElementById('tab-admin').className = role === 'ADMIN' ? 'py-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 bg-[#00A86B] text-white' : 'py-2 rounded-lg text-xs font-medium transition flex items-center justify-center space-x-1.5 text-slate-300 hover:text-white';
    }

    // Modal Controls
    function openAuthModal(prefRole) {
      if (prefRole) setAuthRole(prefRole);
      document.getElementById('authModal').classList.remove('hidden');
    }

    function closeAuthModal() {
      document.getElementById('authModal').classList.add('hidden');
      resetAuthSteps();
    }

    function setAuthRole(r) {
      authRole = r;
      document.getElementById('authRoleCust').className = r === 'CUSTOMER' ? 'py-2 rounded-lg bg-[#00A86B] text-white transition' : 'py-2 rounded-lg text-slate-600 transition';
      document.getElementById('authRoleProv').className = r === 'PROVIDER' ? 'py-2 rounded-lg bg-[#00A86B] text-white transition' : 'py-2 rounded-lg text-slate-600 transition';
      document.getElementById('authRoleAdmin').className = r === 'ADMIN' ? 'py-2 rounded-lg bg-[#00A86B] text-white transition' : 'py-2 rounded-lg text-slate-600 transition';

      updateFormFields();
    }

    function setAuthMode(m) {
      authMode = m;
      document.getElementById('authTabLogin').className = m === 'LOGIN' ? 'flex-1 pb-2 border-b-2 border-[#00A86B] text-[#00A86B] font-bold' : 'flex-1 pb-2 border-b-2 border-transparent text-slate-500 hover:text-slate-800';
      document.getElementById('authTabSignup').className = m === 'SIGNUP' ? 'flex-1 pb-2 border-b-2 border-[#00A86B] text-[#00A86B] font-bold' : 'flex-1 pb-2 border-b-2 border-transparent text-slate-500 hover:text-slate-800';

      updateFormFields();
    }

    function updateFormFields() {
      const isSignup = authMode === 'SIGNUP';
      document.getElementById('authNameField').classList.toggle('hidden', !isSignup);
      document.getElementById('authAddressField').classList.toggle('hidden', !(isSignup && authRole === 'CUSTOMER'));
      document.getElementById('authPartnerField').classList.toggle('hidden', !(isSignup && authRole === 'PROVIDER'));
      document.getElementById('authAdminField').classList.toggle('hidden', authRole !== 'ADMIN');
    }

    function fillDemo(r) {
      setAuthRole(r);
      setAuthMode('LOGIN');
      if (r === 'CUSTOMER') {
        document.getElementById('authPhoneInput').value = '9876543210';
      } else if (r === 'PROVIDER') {
        document.getElementById('authPhoneInput').value = '9822345678';
      } else if (r === 'ADMIN') {
        document.getElementById('authPhoneInput').value = '8435423190';
      }
    }

    function resetAuthSteps() {
      document.getElementById('authStep1').classList.remove('hidden');
      document.getElementById('authStep2').classList.add('hidden');
      document.getElementById('otpCodeInput').value = '';
    }

    function requestOtpSubmit() {
      const phone = document.getElementById('authPhoneInput').value.trim();
      if (!phone || phone.length < 10) {
        alert('कृपया 10 अंकों का मान्य मोबाइल नंबर दर्ज करें (Please enter a valid 10-digit phone number)');
        return;
      }

      fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, role: authRole })
      }).then(r => r.json()).then(res => {
        document.getElementById('otpSentPhone').innerText = '+91 ' + phone;
        document.getElementById('authStep1').classList.add('hidden');
        document.getElementById('authStep2').classList.remove('hidden');
      });
    }

    function verifyOtpSubmit() {
      const phone = document.getElementById('authPhoneInput').value.trim();
      const otp = document.getElementById('otpCodeInput').value.trim();
      const name = document.getElementById('authNameInput').value.trim();
      const address = document.getElementById('authAddressInput').value.trim();

      if (!otp) {
        alert('कृपया 4-अंकीय ओटीपी दर्ज करें');
        return;
      }

      fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp, fullName: name, address, role: authRole })
      }).then(r => r.json()).then(res => {
        if (res.success) {
          currentUser = res.user;
          applyUserSession(currentUser);
          closeAuthModal();
          setRole(currentUser.role);
          alert('लॉगिन सफल (Login Successful)! स्वागत है, ' + currentUser.name);
        } else {
          alert(res.error || 'अमान्य OTP');
        }
      });
    }

    function applyUserSession(user) {
      document.getElementById('userHeaderName').innerText = user.name + ' (' + (user.role === 'CUSTOMER' ? 'ग्राहक' : (user.role === 'PROVIDER' ? 'पार्टनर' : 'एडमिन')) + ')';
      if (user.role === 'CUSTOMER') {
        if (user.address) document.getElementById('custDisplayAddress').innerText = user.address;
      } else if (user.role === 'PROVIDER') {
        document.getElementById('provDisplayName').innerText = user.name;
        document.getElementById('provAvatar').innerText = user.name.charAt(0);
      } else if (user.role === 'ADMIN') {
        document.getElementById('adminDisplayName').innerText = user.name;
      }
    }

    function openBookingModal(name, price) {
      fetch('/api/service-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceName: name, basePrice: price, urgency: 'NORMAL', customerName: currentUser.name })
      }).then(r => r.json()).then(data => {
        document.getElementById('customerActiveJobCard').classList.remove('hidden');
        document.getElementById('custJobStatus').innerText = 'Provider Assigned (Suresh Patel)';
        alert('Service Request Created! Dispatched to Suresh Patel. Switch to "Partner" tab to accept.');
      });
    }

    function acceptOffer() {
      document.getElementById('provOfferAlert').classList.add('hidden');
      document.getElementById('provActiveJob').classList.remove('hidden');
      document.getElementById('provJobStep').innerText = 'PROVIDER ON THE WAY';
      alert('Request Accepted! Navigating to customer.');
    }

    let isProviderOnline = true;
    function toggleProviderAvail() {
      isProviderOnline = !isProviderOnline;
      const statusBadge = document.getElementById('provAvailStatus');
      const toggleBtn = document.getElementById('btnProvToggle');
      if (isProviderOnline) {
        if (statusBadge) {
          statusBadge.innerText = 'ONLINE';
          statusBadge.className = 'text-xs font-bold text-emerald-700 block';
        }
        if (toggleBtn) {
          toggleBtn.innerText = 'Available';
          toggleBtn.className = 'bg-[#00A86B] text-white px-3 py-1 rounded-full text-xs font-bold shadow';
        }
        alert('आप अब ऑनलाइन हैं (You are now ONLINE). आपको नई सर्विस रिक्वेस्ट्स 25-सेकंड टाइमर के साथ मिलेंगी।');
      } else {
        if (statusBadge) {
          statusBadge.innerText = 'OFFLINE';
          statusBadge.className = 'text-xs font-bold text-slate-500 block';
        }
        if (toggleBtn) {
          toggleBtn.innerText = 'Go Online';
          toggleBtn.className = 'bg-slate-400 text-white px-3 py-1 rounded-full text-xs font-bold shadow';
        }
        alert('आप अब ऑफलाइन हैं (You are now OFFLINE).');
      }
    }


    function rejectOffer() {
      document.getElementById('provOfferAlert').classList.add('hidden');
      alert('Offer rejected. Dispatched to next candidate.');
    }

    function markArrived() {
      document.getElementById('btnProvArrived').classList.add('hidden');
      document.getElementById('provOtpInputBox').classList.remove('hidden');
      document.getElementById('provJobStep').innerText = 'ARRIVED (OTP PENDING)';
    }

    function verifyOtpAndStart() {
      const val = document.getElementById('provOtpInput').value.trim();
      if (val === currentOtp || val === '4829') {
        document.getElementById('provOtpInputBox').classList.add('hidden');
        document.getElementById('btnProvComplete').classList.remove('hidden');
        document.getElementById('provJobStep').innerText = 'SERVICE STARTED (IN PROGRESS)';
        alert('OTP Verified! Work started.');
      } else {
        alert('Invalid OTP. Please check customer screen (4829).');
      }
    }

    function completeJob() {
      document.getElementById('provJobStep').innerText = 'COMPLETED (PAID)';
      document.getElementById('btnProvComplete').classList.add('hidden');
      alert('Job Completed! Bill of ₹449 generated. Platform Commission: ₹90, Partner Earnings: ₹359.');
    }

    function openInquiryModal() {
      const q = prompt('What service do you need? (e.g. AC gas charging cost):');
      if (q) {
        alert('Inquiry received! GharSaathi support (8435423190) will contact you shortly.');
      }
    }

    function payBillModal() {
      alert('Payment of ₹449 successful via UPI! Thank you for trusting GharSaathi.');
      document.getElementById('customerActiveJobCard').classList.add('hidden');
    }

    // Map Discovery Handlers
    const mapProviderData = {
      prov_2: { name: 'Suresh Patel', rating: '★ 4.85', skills: 'AC Servicing, AC Repair, Gas Charging', dist: '0.4 KM', jobs: 520, rate: '98%', price: 299, srv: 'AC Repair & Troubleshooting' },
      prov_1: { name: 'Rajesh Kumar', rating: '★ 4.90', skills: 'Electrician, Wiring, Geyser Repair', dist: '0.6 KM', jobs: 342, rate: '97%', price: 149, srv: 'Electrician General Visit' },
      prov_3: { name: 'Amit Sharma', rating: '★ 4.75', skills: 'Plumber, RO Service, Pipe Fitting', dist: '0.8 KM', jobs: 280, rate: '95%', price: 149, srv: 'Plumber General Visit' },
      prov_4: { name: 'Mohan Verma', rating: '★ 4.92', skills: 'Carpenter, Furniture Repair, Drilling', dist: '1.1 KM', jobs: 410, rate: '99%', price: 199, srv: 'Carpenter Visit' }
    };

    function selectMapProvider(id) {
      const p = mapProviderData[id];
      if (!p) return;
      document.getElementById('mapCardName').innerText = p.name;
      document.getElementById('mapCardAvatar').innerText = p.name.charAt(0);
      document.getElementById('mapCardRating').innerText = p.rating;
      document.getElementById('mapCardSkills').innerHTML = p.skills + ' • <b>' + p.dist + ' away</b> (~8 min ETA)';
      document.getElementById('mapCardJobs').innerHTML = 'Completed Jobs: <b>' + p.jobs + '</b> • Response Rate: <b>' + p.rate + '</b>';
      document.getElementById('mapCardBookBtn').innerText = 'Book ' + p.name.split(' ')[0] + ' (₹' + p.price + '+)';
      document.getElementById('mapCardBookBtn').onclick = function() { openBookingModal(p.srv, p.price); };
      document.getElementById('mapFloatingCard').classList.remove('hidden');
    }

    function filterMapCategory(cat) {
      document.getElementById('mapCatBtnAll').className = cat === 'ALL' ? 'px-3 py-1.5 rounded-xl font-bold whitespace-nowrap bg-[#00A86B] text-white shadow-sm' : 'px-3 py-1.5 rounded-xl font-bold whitespace-nowrap bg-slate-100 text-slate-600 hover:bg-slate-200';
      document.getElementById('mapCatBtnAc').className = cat === 'ac_services' ? 'px-3 py-1.5 rounded-xl font-bold whitespace-nowrap bg-[#00A86B] text-white shadow-sm' : 'px-3 py-1.5 rounded-xl font-bold whitespace-nowrap bg-slate-100 text-slate-600 hover:bg-slate-200';
      document.getElementById('mapCatBtnRepairs').className = cat === 'home_repairs' ? 'px-3 py-1.5 rounded-xl font-bold whitespace-nowrap bg-[#00A86B] text-white shadow-sm' : 'px-3 py-1.5 rounded-xl font-bold whitespace-nowrap bg-slate-100 text-slate-600 hover:bg-slate-200';
      document.getElementById('mapCatBtnCarpentry').className = cat === 'furniture_carpentry' ? 'px-3 py-1.5 rounded-xl font-bold whitespace-nowrap bg-[#00A86B] text-white shadow-sm' : 'px-3 py-1.5 rounded-xl font-bold whitespace-nowrap bg-slate-100 text-slate-600 hover:bg-slate-200';

      document.getElementById('mapPinSuresh').classList.toggle('hidden', !(cat === 'ALL' || cat === 'ac_services'));
      document.getElementById('mapPinRajesh').classList.toggle('hidden', !(cat === 'ALL' || cat === 'home_repairs'));
      document.getElementById('mapPinAmit').classList.toggle('hidden', !(cat === 'ALL' || cat === 'home_repairs'));
      document.getElementById('mapPinMohan').classList.toggle('hidden', !(cat === 'ALL' || cat === 'furniture_carpentry'));
    }

    function filterMapRadius(val) {
      alert('Map search radius updated to: ' + val + ' KM (Sector 62, Noida area)');
    }


    // 25s Countdown Ticker simulation
    let seconds = 25;
    setInterval(() => {
      if (seconds > 1) {
        seconds--;
        const badge = document.getElementById('provTimerBadge');
        if (badge) badge.innerText = seconds + 's remaining';
      } else {
        seconds = 25;
      }
    }, 1000);
  </script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      brand: 'GharSaathi',
      tagline: BRAND_TAGLINE,
      supportPhone: SUPPORT_PHONE,
      time: new Date().toISOString()
    }));
    return;
  }

  // --- Auth API Endpoints ---
  if (url.pathname === '/api/auth/request-otp' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      let data = {};
      try { data = JSON.parse(body); } catch (_) {}
      const phone = normalizePhone(data.phone || '9876543210');
      const role = data.role || 'CUSTOMER';
      otpRequests.set(phone, { otp: '1234', role, expiresAt: Date.now() + 300000 });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        message: 'OTP sent successfully',
        demoOtp: '1234',
        phone,
        role
      }));
    });
    return;
  }

  if (url.pathname === '/api/auth/verify-otp' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      let data = {};
      try { data = JSON.parse(body); } catch (_) {}
      const phone = normalizePhone(data.phone || '9876543210');
      const otp = data.otp;
      if (otp !== '1234') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid OTP. Please use 1234.' }));
        return;
      }

      let existing = users.find(u => u.phone === phone);
      if (!existing) {
        existing = {
          id: 'usr_' + Date.now(),
          phone,
          role: data.role || 'CUSTOMER',
          name: data.fullName || (data.role === 'PROVIDER' ? 'New Service Partner' : 'New Customer'),
          address: data.address || 'Sector 62, Noida',
          skills: data.skills || ['General Repairs'],
          createdAt: Date.now()
        };
        users.push(existing);
      } else if (data.fullName) {
        existing.name = data.fullName;
        if (data.address) existing.address = data.address;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        token: 'jwt_gharsaathi_' + Date.now(),
        user: existing
      }));
    });
    return;
  }

  if (url.pathname.startsWith('/api/providers/') && url.pathname !== '/api/providers') {
    const pId = url.pathname.replace('/api/providers/', '').replace('/details', '');
    const pDetails = {
      id: pId,
      name: pId === 'prov_1' ? 'Rajesh Kumar' : (pId === 'prov_3' ? 'Amit Sharma' : (pId === 'prov_4' ? 'Mohan Verma' : 'Suresh Patel')),
      rating: pId === 'prov_1' ? 4.90 : (pId === 'prov_3' ? 4.75 : (pId === 'prov_4' ? 4.92 : 4.85)),
      reviewCount: 520,
      completedJobs: pId === 'prov_1' ? 342 : (pId === 'prov_3' ? 280 : (pId === 'prov_4' ? 410 : 520)),
      experienceYears: 9,
      skills: pId === 'prov_1' ? ['Electrician', 'Wiring', 'Geyser Repair'] : ['AC Servicing', 'AC Repair', 'Gas Charging'],
      certifications: [
        { id: '1', title: 'NSDC Certified HVAC & AC Master Technician', issuer: 'National Skill Development Corp (Govt. of India)', year: '2021', verified: true },
        { id: '2', title: 'Aadhaar Verified & Police Cleared', issuer: 'GharSaathi Trust & Safety', year: '2024', verified: true },
        { id: '3', title: 'Gas Charging & Pressure Testing License', issuer: 'Govt. Skill Council', year: '2022', verified: true }
      ],
      workHistory: [
        { id: '1', serviceName: 'AC Foam Jet Servicing', locality: 'Flat 402, Lotus Boulevard, Sector 62', date: 'Yesterday', rating: 5.0, amount: 499 },
        { id: '2', serviceName: 'Split AC Gas Charging & Leakage Repair', locality: 'Tower C, Sector 62, Noida', date: '3 days ago', rating: 5.0, amount: 1450 },
        { id: '3', serviceName: 'Inverter AC PCB Diagnosis', locality: 'Sector 63, Noida', date: '5 days ago', rating: 4.8, amount: 650 }
      ],
      reviews: [
        { id: '1', customerName: 'Vikas Mehra', rating: 5.0, date: 'Yesterday', comment: 'सुरेश जी ने मात्र 30 मिनट में एसी की कूलिंग समस्या ठीक कर दी। बहुत ही पेशेवर और विनम्र कारीगर हैं।', serviceName: 'AC Foam Jet Servicing' },
        { id: '2', customerName: 'Pooja Verma', rating: 5.0, date: '3 days ago', comment: 'Quick response time! Arrived within 10 minutes. Cleaned coil thoroughly with foam jet. Warranty provided.', serviceName: 'Split AC Gas Charging' },
        { id: '3', customerName: 'Amitabh Sen', rating: 4.8, date: '5 days ago', comment: 'Excellent technical diagnosis. Solved PCB tripping without replacing costly parts.', serviceName: 'PCB Diagnosis' }
      ]
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, provider: pDetails }));
    return;
  }

  if (url.pathname === '/api/providers') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(providers));
    return;
  }


  if (url.pathname === '/api/requests') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(requests));
    return;
  }

  if (url.pathname === '/api/service-requests' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      let data = {};
      try { data = JSON.parse(body); } catch (_) {}
      const reqId = 'GS-' + Math.floor(10000 + Math.random() * 90000);
      const newReq = {
        id: reqId,
        customerName: data.customerName || 'Rahul Sharma',
        serviceName: data.serviceName || 'AC Repair',
        urgency: data.urgency || 'NORMAL',
        status: 'SEARCHING',
        secondsRemaining: 25,
        address: 'Sector 62, Noida',
        createdAt: Date.now()
      };
      requests.unshift(newReq);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, request: newReq }));
    });
    return;
  }

  if (url.pathname === '/api/payments/create-order' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      let data = {};
      try { data = JSON.parse(body); } catch (_) {}
      const bookingId = data.bookingId || 'BK-' + Math.floor(10000 + Math.random() * 90000);
      const amount = Number(data.amount || 299);
      const amountInPaise = Math.round(amount * 100);
      const orderId = 'order_' + Math.random().toString(36).substring(2, 14);

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        order: {
          id: orderId,
          entity: 'order',
          amount: amountInPaise,
          amount_paid: 0,
          amount_due: amountInPaise,
          currency: 'INR',
          receipt: 'rcpt_' + bookingId,
          status: 'created',
          attempts: 0,
          notes: { bookingId, brand: 'GharSaathi' },
          created_at: Math.floor(Date.now() / 1000)
        },
        keyId: 'rzp_test_gharsaathi2026',
        bookingId,
        amount,
        currency: 'INR'
      }));
    });
    return;
  }

  if (url.pathname === '/api/payments/verify' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      let data = {};
      try { data = JSON.parse(body); } catch (_) {}
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        message: 'Payment verified and captured successfully.',
        bookingId: data.bookingId || 'BK-1001',
        paymentId: data.razorpay_payment_id || 'pay_test_' + Date.now(),
        orderId: data.razorpay_order_id,
        status: 'PAID'
      }));
    });
    return;
  }

  if (url.pathname === '/api/payments/webhook' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      let data = {};
      try { data = JSON.parse(body); } catch (_) {}
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'ok',
        event: data.event || 'payment.captured',
        received: true
      }));
    });
    return;
  }

  // Default Web App HTML
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(htmlContent);
});

if (ioModule) {
  const io = new ioModule(server, { cors: { origin: '*' } });
  io.on('connection', (socket) => {
    socket.on('disconnect', () => {});
  });
}

server.listen(PORT, '0.0.0.0', () => {
  console.log('GharSaathi Dev Server Running on http://0.0.0.0:' + PORT);
});
