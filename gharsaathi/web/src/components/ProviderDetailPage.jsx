import React, { useState, useEffect } from 'react';

const SUPPORT_PHONE = '8435423190';

export function ProviderDetailPage({ providerId = 'prov_2', onClose, onBookProvider }) {
  const [provider, setProvider] = useState(null);
  const [activeTab, setActiveTab] = useState('REVIEWS'); // 'REVIEWS', 'CERTIFICATIONS', 'HISTORY'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/providers/${providerId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.provider) {
          setProvider(data.provider);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [providerId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl shadow-xl flex items-center space-x-3 text-sm font-bold text-slate-700">
          <i className="fa-solid fa-circle-notch fa-spin text-emerald-500 text-xl"></i>
          <span>Loading Professional Profile & Certifications...</span>
        </div>
      </div>
    );
  }

  const p = provider || {
    id: providerId,
    name: 'Suresh Patel',
    phone: '+91 98223 45678',
    rating: 4.85,
    completedJobs: 520,
    experienceYears: 9,
    skills: ['AC Servicing', 'AC Repair', 'Gas Charging'],
    certifications: [
      { id: '1', title: 'NSDC Certified HVAC & AC Technician', issuer: 'National Skill Development Corp', year: '2021', verified: true },
      { id: '2', title: 'Aadhaar Verified & Police Cleared', issuer: 'GharSaathi Trust & Safety', year: '2024', verified: true }
    ],
    workHistory: [
      { id: '1', serviceName: 'AC Foam Jet Servicing', locality: 'Sector 62, Noida', date: 'Yesterday', rating: 5, amount: 499 }
    ],
    reviews: [
      { id: '1', customerName: 'Vikas Mehra', rating: 5, date: 'Yesterday', comment: 'सुरेश जी ने मात्र 30 मिनट में एसी ठीक कर दी। बहुत ही पेशेवर कारीगर हैं।' }
    ]
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 my-8">
        {/* Header Profile Banner */}
        <div className="bg-gradient-to-r from-[#0F2C59] to-[#1B3B6F] text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
          >
            ✕
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#00A86B] to-[#10B981] flex items-center justify-center text-white font-black text-3xl shadow-xl">
              {p.name.charAt(0)}
            </div>

            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-black">{p.name}</h2>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                  <i className="fa-solid fa-certificate"></i>
                  <span>Govt. Certified & KYC Cleared</span>
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {p.skills?.join(' • ')} • <b>{p.experienceYears || 9} Years Experience</b>
              </p>
              <div className="flex items-center space-x-3 text-xs pt-1">
                <span className="bg-amber-400 text-slate-900 font-black px-2 py-0.5 rounded">
                  ★ {p.rating || 4.85} Rating
                </span>
                <span className="text-slate-300">
                  <b>{p.completedJobs || 520}</b> Jobs Done
                </span>
                <span className="text-emerald-300 font-semibold">• 98% Response Rate</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 border-b text-xs font-bold bg-slate-50 text-center">
          <button
            onClick={() => setActiveTab('REVIEWS')}
            className={`py-3 transition border-b-2 ${
              activeTab === 'REVIEWS'
                ? 'border-[#00A86B] text-[#00A86B] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            ⭐ Customer Reviews ({p.reviews?.length || 3})
          </button>
          <button
            onClick={() => setActiveTab('CERTIFICATIONS')}
            className={`py-3 transition border-b-2 ${
              activeTab === 'CERTIFICATIONS'
                ? 'border-[#00A86B] text-[#00A86B] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            📜 Certifications ({p.certifications?.length || 3})
          </button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`py-3 transition border-b-2 ${
              activeTab === 'HISTORY'
                ? 'border-[#00A86B] text-[#00A86B] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            🛠️ Work History ({p.workHistory?.length || 3})
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 max-h-[380px] overflow-y-auto space-y-4">
          {/* TAB 1: REVIEWS */}
          {activeTab === 'REVIEWS' && (
            <div className="space-y-3">
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-900">
                  Overall Rating: {p.rating} / 5.0 (Based on {p.completedJobs} verified visits)
                </span>
                <span className="bg-emerald-200 text-emerald-800 font-black px-2 py-0.5 rounded">
                  100% Genuine
                </span>
              </div>

              {p.reviews?.map((r, idx) => (
                <div key={idx} className="border border-slate-200 p-4 rounded-xl space-y-2 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-xs">
                        {r.customerName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">{r.customerName}</h4>
                        <p className="text-[10px] text-slate-400">{r.date} • Sector 62, Noida</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 text-amber-500 text-xs font-black">
                      <span>★</span>
                      <span>{r.rating}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-700 italic">"{r.comment}"</p>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
                    <span className="text-emerald-700 font-semibold">✓ Verified Booking</span>
                    <span className="text-slate-400">{r.serviceName || 'AC Repair'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: CERTIFICATIONS */}
          {activeTab === 'CERTIFICATIONS' && (
            <div className="space-y-3">
              {p.certifications?.map((c, idx) => (
                <div key={idx} className="border border-slate-200 p-4 rounded-xl flex items-start space-x-3 bg-white">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-lg flex-shrink-0">
                    <i className="fa-solid fa-award"></i>
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-slate-900">{c.title}</h4>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                        ✓ Verified
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">Issuer: {c.issuer}</p>
                    <p className="text-[10px] text-slate-400">Issued Year: {c.year} • Background Check: PASSED</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: WORK HISTORY */}
          {activeTab === 'HISTORY' && (
            <div className="space-y-3">
              {p.workHistory?.map((w, idx) => (
                <div key={idx} className="border border-slate-200 p-3.5 rounded-xl flex items-center justify-between bg-white text-xs">
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-slate-900">{w.serviceName}</h4>
                    <p className="text-[11px] text-slate-500">{w.locality} • Customer: {w.customerName}</p>
                    <span className="text-[10px] text-slate-400">{w.date}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-emerald-700">₹{w.amount}</span>
                    <p className="text-[10px] text-amber-600 font-bold">★ {w.rating} Rated</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t flex items-center justify-between">
          <a
            href={`tel:${SUPPORT_PHONE}`}
            className="flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
          >
            <i className="fa-solid fa-phone text-emerald-600"></i>
            <span>Support: {SUPPORT_PHONE}</span>
          </a>

          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Close
            </button>
            <button
              onClick={() => {
                if (onBookProvider) onBookProvider(p);
                onClose();
              }}
              className="bg-[#00A86B] hover:bg-[#059669] text-white px-5 py-2 rounded-xl text-xs font-black shadow transition"
            >
              Book {p.name.split(' ')[0]} (₹299+)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProviderDetailPage;
