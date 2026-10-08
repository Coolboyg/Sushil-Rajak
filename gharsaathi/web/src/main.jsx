import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { ProviderDiscoveryMap } from './components/ProviderDiscoveryMap';
import { CategoryGrid } from './components/CategoryGrid';
import { ProviderDetailPage } from './components/ProviderDetailPage';
import './style.css';




const SUPPORT_PHONE = '8435423190';
const BRAND_TAGLINE = 'घर के हर काम का भरोसेमंद साथी';

function App() {
  const [currentRole, setCurrentRole] = useState('CUSTOMER');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authRole, setAuthRole] = useState('CUSTOMER');
  const [authMode, setAuthMode] = useState('LOGIN'); // 'LOGIN' or 'SIGNUP'
  const [authStep, setAuthStep] = useState(1); // 1: Form, 2: OTP
  const [phone, setPhone] = useState('9876543210');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('Sector 62, Noida');
  const [skill, setSkill] = useState('AC Servicing & Repair');
  const [otp, setOtp] = useState('');
  const [user, setUser] = useState({
    name: 'Rahul Sharma',
    phone: '+919876543210',
    role: 'CUSTOMER',
    address: 'Flat 402, Lotus Boulevard, Sector 62, Noida',
  });

  // Partner State
  const [isProviderOnline, setIsProviderOnline] = useState(true);
  const [partnerStep, setPartnerStep] = useState('IDLE'); // 'IDLE', 'OFFER', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED'
  const [partnerTimer, setPartnerTimer] = useState(25);
  const [enteredOtp, setEnteredOtp] = useState('');

  // Customer Active Booking
  const [activeBooking, setActiveBooking] = useState(null);
  const [detailProviderId, setDetailProviderId] = useState(null);


  // 25s Countdown simulation for offer
  useEffect(() => {
    let interval;
    if (partnerStep === 'OFFER') {
      interval = setInterval(() => {
        setPartnerTimer((t) => {
          if (t <= 1) {
            setPartnerStep('IDLE');
            return 25;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [partnerStep]);

  const fillDemo = (role) => {
    setAuthRole(role);
    setAuthMode('LOGIN');
    if (role === 'CUSTOMER') setPhone('9876543210');
    if (role === 'PROVIDER') setPhone('9822345678');
    if (role === 'ADMIN') setPhone('8435423190');
  };

  const handleRequestOtp = () => {
    if (!phone || phone.length < 10) {
      alert('कृपया 10 अंकों का मान्य मोबाइल नंबर दर्ज करें');
      return;
    }
    setAuthStep(2);
  };

  const handleVerifyOtp = () => {
    if (otp !== '1234') {
      alert('अमान्य OTP! कृपया डेमो OTP 1234 का उपयोग करें।');
      return;
    }
    const loggedUser = {
      name: name || (authRole === 'CUSTOMER' ? 'Rahul Sharma' : authRole === 'PROVIDER' ? 'Suresh Patel' : 'Super Admin'),
      phone: '+91' + phone,
      role: authRole,
      address: address,
      skill: skill,
    };
    setUser(loggedUser);
    setCurrentRole(authRole);
    setIsAuthModalOpen(false);
    setAuthStep(1);
    setOtp('');
    alert(`लॉगिन सफल (Login Successful)! स्वागत है, ${loggedUser.name}`);
  };

  const createCustomerRequest = (serviceName, price) => {
    const newReq = {
      id: 'GS-' + Math.floor(10000 + Math.random() * 90000),
      serviceName,
      basePrice: price,
      status: 'SEARCHING',
      otp: '4829',
      eta: '~10 mins',
      partnerName: 'Suresh Patel (4.85★)',
    };
    setActiveBooking(newReq);
    setPartnerStep('OFFER');
    setPartnerTimer(25);
    alert(`सर्विस रिक्वेस्ट बनाई गई! पास के पार्टनर (Suresh Patel) को 25s अलर्ट भेजा गया है।`);
  };

  const toggleProviderAvail = () => {
    setIsProviderOnline(!isProviderOnline);
    alert(!isProviderOnline ? 'आप अब ONLINE हैं।' : 'आप अब OFFLINE हैं।');
  };

  return (
    <div className="max-w-4xl mx-auto min-h-screen flex flex-col bg-white shadow-xl text-slate-800">
      {/* Header */}
      <header className="bg-[#0F2C59] text-white p-4 sticky top-0 z-40 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00A86B] to-[#10B981] flex items-center justify-center text-white shadow-lg">
              <i className="fa-solid fa-house-chimney-crack text-xl"></i>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-black text-lg tracking-wider">GHAR</span>
                <span className="font-black text-lg text-[#10B981] tracking-wider">SAATHI</span>
              </div>
              <p className="text-xs text-slate-300 font-medium">{BRAND_TAGLINE}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setAuthRole(currentRole);
                setIsAuthModalOpen(true);
              }}
              className="flex items-center space-x-1.5 bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-1.5 rounded-full text-xs font-semibold text-white transition"
            >
              <i className="fa-solid fa-circle-user text-emerald-400"></i>
              <span>{user.name} ({user.role === 'CUSTOMER' ? 'ग्राहक' : user.role === 'PROVIDER' ? 'पार्टनर' : 'एडमिन'})</span>
            </button>

            <a
              href={`tel:${SUPPORT_PHONE}`}
              className="hidden sm:flex items-center space-x-1.5 bg-[#00A86B]/20 border border-[#00A86B]/50 px-3 py-1.5 rounded-full text-xs font-bold text-white hover:bg-[#00A86B]/30 transition"
            >
              <i className="fa-solid fa-phone text-[#10B981]"></i>
              <span>{SUPPORT_PHONE}</span>
            </a>
          </div>
        </div>

        {/* Role Tabs */}
        <div className="mt-4 grid grid-cols-3 gap-2 bg-[#0A192F] p-1.5 rounded-xl text-center">
          <button
            onClick={() => setCurrentRole('CUSTOMER')}
            className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
              currentRole === 'CUSTOMER' ? 'bg-[#00A86B] text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-user"></i>
            <span>Customer (ग्राहक)</span>
          </button>
          <button
            onClick={() => setCurrentRole('PROVIDER')}
            className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
              currentRole === 'PROVIDER' ? 'bg-[#00A86B] text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-screwdriver-wrench"></i>
            <span>Partner (कारीगर)</span>
          </button>
          <button
            onClick={() => setCurrentRole('ADMIN')}
            className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
              currentRole === 'ADMIN' ? 'bg-[#00A86B] text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-chart-line"></i>
            <span>Admin (प्रबंधन)</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 overflow-y-auto space-y-6">
        {/* CUSTOMER PORTAL */}
        {currentRole === 'CUSTOMER' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 p-3 rounded-xl">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <i className="fa-solid fa-location-dot"></i>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold">Service Address</p>
                  <p className="text-xs font-bold text-slate-800">{user.address || 'Sector 62, Noida'}</p>
                </div>
              </div>
              <button onClick={() => setIsAuthModalOpen(true)} className="text-xs font-bold text-[#0F2C59]">
                ID Setup / Edit
              </button>
            </div>

            {/* Emergency Hotline */}
            <div className="bg-amber-50 border border-amber-300 p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <i className="fa-solid fa-triangle-exclamation text-amber-600 text-2xl"></i>
                <div>
                  <p className="text-xs font-bold text-amber-900">Emergency Breakdown? Instant Help</p>
                  <p className="text-xs text-amber-700">Water leakage, short circuit or AC tripping? Call support.</p>
                </div>
              </div>
              <a href={`tel:${SUPPORT_PHONE}`} className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1">
                <i className="fa-solid fa-phone"></i>
                <span>Call {SUPPORT_PHONE}</span>
              </a>
            </div>

            {/* Active Booking Card */}
            {activeBooking && (
              <div className="bg-[#0F2C59] text-white p-5 rounded-2xl shadow-lg border border-slate-700 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
                    <span className="font-bold text-sm text-emerald-400">Partner En Route</span>
                  </div>
                  <span className="text-xs text-slate-300">{activeBooking.id}</span>
                </div>

                <div className="bg-white/10 p-3 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-300">Assigned Partner</p>
                    <p className="font-bold text-sm">{activeBooking.partnerName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-300">Estimated Arrival</p>
                    <p className="font-bold text-sm text-emerald-300">{activeBooking.eta}</p>
                  </div>
                </div>

                <div className="bg-amber-400/20 border border-amber-400/50 p-3 rounded-xl text-center">
                  <p className="text-xs text-amber-300 font-bold">SHARE THIS 4-DIGIT OTP WITH TECHNICIAN UPON ARRIVAL</p>
                  <p className="text-2xl font-black tracking-widest text-white mt-1">{activeBooking.otp}</p>
                </div>

                <button
                  onClick={() => {
                    alert('भुगतान सफल! ₹449 Paid via UPI. रेटिंग देने के लिए धन्यवाद।');
                    setActiveBooking(null);
                  }}
                  className="w-full bg-[#00A86B] hover:bg-[#059669] text-center py-2.5 rounded-lg text-xs font-bold transition"
                >
                  Pay Final Bill (₹449 via UPI)
                </button>
              </div>
            )}

            {/* Provider Discovery Map Component */}
            <ProviderDiscoveryMap
              providers={[
                {
                  id: 'prov_2',
                  name: 'Suresh Patel',
                  skills: ['AC Servicing', 'AC Repair', 'Gas Charging'],
                  categories: ['ac_services'],
                  rating: 4.85,
                  completedJobs: 520,
                  lat: 28.5385,
                  lng: 77.3895,
                },
                {
                  id: 'prov_1',
                  name: 'Rajesh Kumar',
                  skills: ['Electrician', 'Wiring', 'Geyser Repair'],
                  categories: ['home_repairs'],
                  rating: 4.90,
                  completedJobs: 342,
                  lat: 28.5355,
                  lng: 77.3910,
                },
                {
                  id: 'prov_3',
                  name: 'Amit Sharma',
                  skills: ['Plumber', 'RO Service', 'Pipe Fitting'],
                  categories: ['home_repairs', 'cleaning'],
                  rating: 4.75,
                  completedJobs: 280,
                  lat: 28.5420,
                  lng: 77.3940,
                },
                {
                  id: 'prov_4',
                  name: 'Mohan Verma',
                  skills: ['Carpenter', 'Furniture Repair', 'Drilling'],
                  categories: ['furniture_carpentry'],
                  rating: 4.92,
                  completedJobs: 410,
                  lat: 28.5310,
                  lng: 77.3850,
                },
              ]}
              onBookService={(p) => createCustomerRequest(p.skills[0] || 'Service Visit', 299)}
            />

            {/* Service Categories Component */}
            <CategoryGrid onSelectCategory={(cat) => console.log('Selected category:', cat)} />

            {/* Services Grid */}
            <div className="space-y-3">


              <h3 className="font-bold text-sm text-slate-800">Popular Services (लोकप्रिय सेवाएँ)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-white border p-4 rounded-xl flex items-center justify-between shadow-sm">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">AC Repair & Troubleshooting</h4>
                    <p className="text-xs text-emerald-700 font-medium">एसी सर्विस और रिपेयर (₹299)</p>
                  </div>
                  <button onClick={() => createCustomerRequest('AC Repair', 299)} className="bg-[#00A86B] text-white px-4 py-2 rounded-xl text-xs font-bold">
                    Book Now
                  </button>
                </div>

                <div className="bg-white border p-4 rounded-xl flex items-center justify-between shadow-sm">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Electrician General Visit</h4>
                    <p className="text-xs text-emerald-700 font-medium">इलेक्ट्रीशियन विज़िट (₹149)</p>
                  </div>
                  <button onClick={() => createCustomerRequest('Electrician Visit', 149)} className="bg-[#00A86B] text-white px-4 py-2 rounded-xl text-xs font-bold">
                    Book Now
                  </button>
                </div>

                <div className="bg-white border p-4 rounded-xl flex items-center justify-between shadow-sm">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Plumber General Visit</h4>
                    <p className="text-xs text-emerald-700 font-medium">प्लम्बर विज़िट (₹149)</p>
                  </div>
                  <button onClick={() => createCustomerRequest('Plumber Visit', 149)} className="bg-[#00A86B] text-white px-4 py-2 rounded-xl text-xs font-bold">
                    Book Now
                  </button>
                </div>

                <div className="bg-white border p-4 rounded-xl flex items-center justify-between shadow-sm">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Bathroom Deep Cleaning</h4>
                    <p className="text-xs text-emerald-700 font-medium">बाथरूम डीप क्लीनिंग (₹349)</p>
                  </div>
                  <button onClick={() => createCustomerRequest('Deep Cleaning', 349)} className="bg-[#00A86B] text-white px-4 py-2 rounded-xl text-xs font-bold">
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PARTNER PORTAL */}
        {currentRole === 'PROVIDER' && (
          <div className="space-y-5">
            {/* Partner Header */}
            <div className="bg-white border p-4 rounded-xl flex items-center justify-between shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-[#0F2C59] text-white font-bold flex items-center justify-center text-lg">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{user.name}</h4>
                  <p className="text-xs text-slate-500">{user.skill || 'AC Specialist'} • 4.85★ (520 jobs)</p>
                </div>
              </div>

              <div className="text-right space-y-1">
                <span className={`text-xs font-bold block ${isProviderOnline ? 'text-emerald-700' : 'text-slate-500'}`}>
                  {isProviderOnline ? 'ONLINE' : 'OFFLINE'}
                </span>
                <button
                  onClick={toggleProviderAvail}
                  className={`px-3 py-1 rounded-full text-xs font-bold text-white shadow ${
                    isProviderOnline ? 'bg-[#00A86B]' : 'bg-slate-400'
                  }`}
                >
                  {isProviderOnline ? 'Available' : 'Go Online'}
                </button>
                <button onClick={() => setIsAuthModalOpen(true)} className="text-[10px] text-[#0F2C59] font-bold block underline">
                  Partner ID Setup
                </button>
              </div>
            </div>

            {/* 25-Second Offer Modal */}
            {partnerStep === 'OFFER' && (
              <div className="bg-rose-50 border-2 border-rose-500 p-5 rounded-2xl shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm text-rose-600 uppercase">
                    <i className="fa-solid fa-bell mr-1 animate-bounce"></i> NEW SERVICE REQUEST DISPATCH
                  </span>
                  <span className="bg-rose-600 text-white px-2.5 py-1 rounded-full text-xs font-black">
                    {partnerTimer}s remaining
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-900">AC Repair & Troubleshooting • ₹299+</p>
                <p className="text-xs text-slate-600">Customer: Rahul Sharma • Sector 62, Noida (~1.4 KM)</p>
                <div className="flex space-x-3 pt-2">
                  <button onClick={() => setPartnerStep('IDLE')} className="flex-1 bg-slate-200 py-2.5 rounded-xl text-xs font-bold">
                    Reject
                  </button>
                  <button onClick={() => setPartnerStep('ON_THE_WAY')} className="flex-1 bg-[#00A86B] text-white py-2.5 rounded-xl text-xs font-black shadow">
                    ACCEPT REQUEST
                  </button>
                </div>
              </div>
            )}

            {/* Stepper Job */}
            {partnerStep !== 'IDLE' && partnerStep !== 'OFFER' && (
              <div className="bg-white border p-5 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-[#0F2C59]">CURRENT ACTIVE JOB</h4>
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                    {partnerStep}
                  </span>
                </div>

                {partnerStep === 'ON_THE_WAY' && (
                  <button onClick={() => setPartnerStep('ARRIVED')} className="w-full bg-[#0F2C59] text-white py-2.5 rounded-xl text-xs font-bold">
                    I HAVE ARRIVED AT CUSTOMER DOOR
                  </button>
                )}

                {partnerStep === 'ARRIVED' && (
                  <div className="space-y-2 bg-amber-50 p-3 rounded-xl border border-amber-300">
                    <p className="text-xs font-bold text-amber-900 text-center">ASK CUSTOMER FOR 4-DIGIT OTP</p>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={enteredOtp}
                        onChange={(e) => setEnteredOtp(e.target.value)}
                        placeholder="Enter OTP (4829)"
                        className="flex-1 px-3 py-2 border rounded-lg text-center font-bold text-sm"
                      />
                      <button
                        onClick={() => {
                          if (enteredOtp === '4829' || enteredOtp === '1234') {
                            setPartnerStep('IN_PROGRESS');
                            alert('OTP Verified! Service started.');
                          } else {
                            alert('Invalid OTP! Customer screen displays: 4829');
                          }
                        }}
                        className="bg-[#00A86B] text-white px-4 py-2 rounded-lg text-xs font-bold"
                      >
                        VERIFY
                      </button>
                    </div>
                  </div>
                )}

                {partnerStep === 'IN_PROGRESS' && (
                  <button
                    onClick={() => {
                      setPartnerStep('IDLE');
                      alert('Job Completed! Bill of ₹449 generated. Platform Commission: ₹90, Partner Earnings: ₹359.');
                    }}
                    className="w-full bg-[#00A86B] text-white py-2.5 rounded-xl text-xs font-bold"
                  >
                    COMPLETE SERVICE & GENERATE BILL
                  </button>
                )}
              </div>
            )}

            {/* Earnings Stats */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-white border p-3 rounded-xl">
                <p className="text-xs text-slate-500">Today's Earnings</p>
                <p className="text-base font-black text-emerald-700">₹2,240</p>
              </div>
              <div className="bg-white border p-3 rounded-xl">
                <p className="text-xs text-slate-500">Wallet Balance</p>
                <p className="text-base font-black text-[#0F2C59]">₹8,600</p>
              </div>
              <div className="bg-white border p-3 rounded-xl">
                <p className="text-xs text-slate-500">Jobs Completed</p>
                <p className="text-base font-black text-slate-800">520</p>
              </div>
            </div>
          </div>
        )}

        {/* ADMIN PORTAL */}
        {currentRole === 'ADMIN' && (
          <div className="space-y-5">
            <div className="bg-white border p-3 rounded-xl flex items-center justify-between">
              <p className="text-xs font-bold text-slate-900">GharSaathi Super Admin Dashboard</p>
              <button onClick={() => setIsAuthModalOpen(true)} className="text-xs font-bold text-[#0F2C59]">
                Admin ID Setup
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
              <div className="bg-white border p-3 rounded-xl">
                <p className="text-xs text-slate-500">Live Requests</p>
                <p className="text-lg font-black text-rose-600">1</p>
              </div>
              <div className="bg-white border p-3 rounded-xl">
                <p className="text-xs text-slate-500">Active Bookings</p>
                <p className="text-lg font-black text-emerald-600">1</p>
              </div>
              <div className="bg-white border p-3 rounded-xl">
                <p className="text-xs text-slate-500">Online Partners</p>
                <p className="text-lg font-black text-[#0F2C59]">4</p>
              </div>
              <div className="bg-white border p-3 rounded-xl">
                <p className="text-xs text-slate-500">Platform Comm. (20%)</p>
                <p className="text-lg font-black text-emerald-700">₹448</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-100 border-t p-3 text-center text-xs text-slate-500">
        <p>GharSaathi • {BRAND_TAGLINE} • Official Support: <b>{SUPPORT_PHONE}</b></p>
      </footer>

      {/* ================= AUTH MODAL ================= */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border">
            <div className="bg-[#0F2C59] text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-black text-base flex items-center space-x-2">
                  <i className="fa-solid fa-shield-halved text-emerald-400"></i>
                  <span>GharSaathi ID Setup & Login</span>
                </h3>
                <p className="text-xs text-slate-300">ग्राहक • पार्टनर • एडमिन</p>
              </div>
              <button onClick={() => setIsAuthModalOpen(false)} className="text-slate-300 hover:text-white">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Role Select */}
              <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-xl text-center text-xs font-bold">
                <button
                  onClick={() => setAuthRole('CUSTOMER')}
                  className={`py-2 rounded-lg transition ${authRole === 'CUSTOMER' ? 'bg-[#00A86B] text-white' : 'text-slate-600'}`}
                >
                  Customer
                </button>
                <button
                  onClick={() => setAuthRole('PROVIDER')}
                  className={`py-2 rounded-lg transition ${authRole === 'PROVIDER' ? 'bg-[#00A86B] text-white' : 'text-slate-600'}`}
                >
                  Partner
                </button>
                <button
                  onClick={() => setAuthRole('ADMIN')}
                  className={`py-2 rounded-lg transition ${authRole === 'ADMIN' ? 'bg-[#00A86B] text-white' : 'text-slate-600'}`}
                >
                  Admin
                </button>
              </div>

              {/* Mode Toggle */}
              <div className="flex border-b text-xs font-semibold">
                <button
                  onClick={() => setAuthMode('LOGIN')}
                  className={`flex-1 pb-2 border-b-2 ${authMode === 'LOGIN' ? 'border-[#00A86B] text-[#00A86B] font-bold' : 'border-transparent text-slate-500'}`}
                >
                  Sign In (लॉगिन)
                </button>
                <button
                  onClick={() => setAuthMode('SIGNUP')}
                  className={`flex-1 pb-2 border-b-2 ${authMode === 'SIGNUP' ? 'border-[#00A86B] text-[#00A86B] font-bold' : 'border-transparent text-slate-500'}`}
                >
                  New ID Setup (नया खाता)
                </button>
              </div>

              {/* Fast 1-Click Demo */}
              <div className="bg-slate-50 p-2.5 rounded-xl border space-y-1">
                <p className="text-[11px] font-bold text-slate-500 uppercase">Fast 1-Click Demo Profiles:</p>
                <div className="flex flex-wrap gap-1.5">
                  <button onClick={() => fillDemo('CUSTOMER')} className="bg-white border text-[11px] px-2 py-1 rounded-lg">
                    👤 Rahul (Customer)
                  </button>
                  <button onClick={() => fillDemo('PROVIDER')} className="bg-white border text-[11px] px-2 py-1 rounded-lg">
                    🛠️ Suresh (Partner)
                  </button>
                  <button onClick={() => fillDemo('ADMIN')} className="bg-white border text-[11px] px-2 py-1 rounded-lg">
                    ⚡ Super Admin
                  </button>
                </div>
              </div>

              {authStep === 1 ? (
                <div className="space-y-3">
                  {authMode === 'SIGNUP' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Full Name (पूरा नाम)</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#00A86B]"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number</label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 bg-slate-100 text-xs font-bold">+91</span>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="9876543210"
                        className="w-full px-3 py-2 border rounded-r-xl text-xs outline-none focus:ring-2 focus:ring-[#00A86B]"
                      />
                    </div>
                  </div>

                  {authMode === 'SIGNUP' && authRole === 'CUSTOMER' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Address / Area</label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Sector 62, Noida"
                        className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#00A86B]"
                      />
                    </div>
                  )}

                  {authMode === 'SIGNUP' && authRole === 'PROVIDER' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Skill (हुनर)</label>
                      <input
                        type="text"
                        value={skill}
                        onChange={(e) => setSkill(e.target.value)}
                        placeholder="e.g. AC Repair"
                        className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#00A86B]"
                      />
                    </div>
                  )}

                  <button
                    onClick={handleRequestOtp}
                    className="w-full bg-[#00A86B] hover:bg-[#059669] text-white py-2.5 rounded-xl text-xs font-bold transition shadow"
                  >
                    GET OTP (ओटीपी प्राप्त करें)
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-center">
                    <p className="text-xs text-emerald-800">OTP sent to +91 {phone}</p>
                    <p className="text-[11px] text-emerald-600 font-bold mt-1">Universal Demo OTP: <b>1234</b></p>
                  </div>

                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter OTP (1234)"
                    className="w-full px-3 py-2 border rounded-xl text-center font-black tracking-widest text-lg outline-none"
                  />

                  <div className="flex space-x-2">
                    <button onClick={() => setOtp('1234')} className="bg-slate-100 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold">
                      Auto Fill 1234
                    </button>
                    <button onClick={handleVerifyOtp} className="flex-1 bg-[#0F2C59] text-white py-2 rounded-xl text-xs font-bold shadow">
                      VERIFY & COMPLETE
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* ================= PROVIDER DETAIL PAGE MODAL ================= */}
      {detailProviderId && (
        <ProviderDetailPage
          providerId={detailProviderId}
          onClose={() => setDetailProviderId(null)}
          onBookProvider={(p) => createCustomerRequest(p.skills[0] || 'Service Visit', 299)}
        />
      )}
    </div>
  );
}


const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
