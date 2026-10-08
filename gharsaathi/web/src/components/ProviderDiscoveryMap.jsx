import React, { useState, useMemo } from 'react';

const SUPPORT_PHONE = '8435423190';

// Default Center: Sector 62, Noida
const CUSTOMER_LOCATION = {
  name: 'Your Location (Customer)',
  address: 'Flat 402, Lotus Boulevard, Sector 62, Noida',
  lat: 28.5385,
  lng: 77.3910,
};

export function ProviderDiscoveryMap({ providers = [], onSelectProvider, onBookService }) {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [radiusKm, setRadiusKm] = useState(5.0);
  const [hoveredProvider, setHoveredProvider] = useState(null);

  // Compute distance from customer location using Haversine formula
  const getDistanceKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(2));
  };

  // Filtered and enriched providers
  const enrichedProviders = useMemo(() => {
    return providers
      .map((p) => {
        const dist = getDistanceKm(
          CUSTOMER_LOCATION.lat,
          CUSTOMER_LOCATION.lng,
          p.lat || p.latitude || 28.5385,
          p.lng || p.longitude || 77.3910
        );
        return {
          ...p,
          lat: p.lat || p.latitude || 28.5385,
          lng: p.lng || p.longitude || 77.3910,
          distanceKm: dist,
        };
      })
      .filter((p) => {
        if (p.distanceKm > radiusKm) return false;
        if (selectedCategory === 'ALL') return true;
        if (selectedCategory === 'ac_services') return p.categories?.includes('ac_services') || p.skills?.some(s => s.toLowerCase().includes('ac'));
        if (selectedCategory === 'home_repairs') return p.categories?.includes('home_repairs') || p.skills?.some(s => s.toLowerCase().includes('electr') || s.toLowerCase().includes('plumb'));
        if (selectedCategory === 'furniture') return p.categories?.includes('furniture_carpentry') || p.skills?.some(s => s.toLowerCase().includes('carpenter'));
        return true;
      });
  }, [providers, selectedCategory, radiusKm]);

  // Coordinate normalizer for Canvas map projection (center at Sector 62)
  const mapWidth = 600;
  const mapHeight = 360;
  const latSpan = 0.03; // ~3.3 km north-south
  const lngSpan = 0.03; // ~3.3 km east-west

  const toMapX = (lng) => {
    const diff = lng - CUSTOMER_LOCATION.lng;
    return mapWidth / 2 + (diff / lngSpan) * (mapWidth / 2);
  };

  const toMapY = (lat) => {
    const diff = lat - CUSTOMER_LOCATION.lat;
    return mapHeight / 2 - (diff / latSpan) * (mapHeight / 2);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-lg space-y-4">
      {/* Header & Controls */}
      <div className="p-4 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <h3 className="font-bold text-sm tracking-wide">Live Nearby Professionals Discovery</h3>
          </div>
          <p className="text-xs text-slate-400">
            Sector 62, Noida • Verified partners ready for 25s instant dispatch
          </p>
        </div>

        {/* Radius filter */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-400 font-medium">Search Radius:</span>
          <select
            value={radiusKm}
            onChange={(e) => setRadiusKm(parseFloat(e.target.value))}
            className="bg-slate-800 text-emerald-400 border border-slate-700 px-2.5 py-1 rounded-lg font-bold outline-none cursor-pointer"
          >
            <option value="2.0">Within 2.0 KM</option>
            <option value="5.0">Within 5.0 KM (Default)</option>
            <option value="10.0">Within 10.0 KM</option>
          </select>
        </div>
      </div>

      {/* Category Pills */}
      <div className="px-4 flex items-center space-x-2 overflow-x-auto text-xs pb-1">
        {[
          { id: 'ALL', label: 'All Verified (सभी)' },
          { id: 'ac_services', label: 'AC Services (एसी)' },
          { id: 'home_repairs', label: 'Electrician & Plumber' },
          { id: 'furniture', label: 'Carpentry (कारपेंटर)' },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
              selectedCategory === cat.id
                ? 'bg-[#00A86B] text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Map Interactive Canvas View */}
      <div className="relative mx-4 h-[360px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
        {/* Radar concentric sweep circles */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
          <div className="w-[120px] h-[120px] rounded-full border border-emerald-400"></div>
          <div className="w-[240px] h-[240px] rounded-full border border-emerald-400 absolute"></div>
          <div className="w-[360px] h-[360px] rounded-full border border-emerald-400 absolute"></div>
        </div>

        {/* Street Grid Simulation Background */}
        <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#10B981 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

        {/* Customer Location Marker (Center) */}
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center group cursor-pointer"
          style={{
            left: `${toMapX(CUSTOMER_LOCATION.lng)}px`,
            top: `${toMapY(CUSTOMER_LOCATION.lat)}px`,
          }}
        >
          <div className="w-8 h-8 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-white shadow-xl animate-pulse">
            <i className="fa-solid fa-house-chimney text-xs"></i>
          </div>
          <span className="bg-blue-900/90 text-white text-[10px] font-black px-2 py-0.5 rounded shadow mt-1 whitespace-nowrap">
            You (Sector 62)
          </span>
        </div>

        {/* Provider Geographic Markers */}
        {enrichedProviders.map((provider) => {
          const x = toMapX(provider.lng);
          const y = toMapY(provider.lat);
          const isSelected = selectedProvider?.id === provider.id;

          return (
            <div
              key={provider.id}
              onClick={() => {
                setSelectedProvider(provider);
                if (onSelectProvider) onSelectProvider(provider);
              }}
              onMouseEnter={() => setHoveredProvider(provider)}
              onMouseLeave={() => setHoveredProvider(null)}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center cursor-pointer transition-transform duration-200 hover:scale-125"
              style={{ left: `${x}px`, top: `${y}px` }}
            >
              {/* Pulsing Aura if Online */}
              <div className="w-9 h-9 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white shadow-lg font-black text-xs relative">
                <span>{provider.name?.charAt(0) || 'P'}</span>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 border border-white rounded-full"></span>
              </div>

              {/* Mini Label */}
              <div className="mt-1 bg-slate-900/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow flex items-center space-x-1 whitespace-nowrap border border-slate-700">
                <span className="text-emerald-400">{provider.name?.split(' ')[0]}</span>
                <span className="text-slate-400">({provider.distanceKm} km)</span>
              </div>
            </div>
          );
        })}

        {/* Selected Provider Floating Quick Card */}
        {selectedProvider && (
          <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md p-3.5 rounded-xl border border-slate-200 shadow-2xl z-40 flex items-center justify-between text-slate-800">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-[#0F2C59] text-white flex items-center justify-center font-black text-lg">
                {selectedProvider.name?.charAt(0)}
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <h4 className="font-bold text-sm text-slate-900">{selectedProvider.name}</h4>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2 rounded">
                    ★ {selectedProvider.rating || 4.85}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold">• KYC Verified</span>
                </div>
                <p className="text-xs text-slate-600">
                  {selectedProvider.skills?.slice(0, 2).join(', ')} • <b>{selectedProvider.distanceKm} KM away</b> (~8 min ETA)
                </p>
                <p className="text-[11px] text-slate-500">
                  Completed Jobs: <b>{selectedProvider.completedJobs || 520}</b> • Response Rate: <b>98%</b>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSelectedProvider(null)}
                className="text-slate-400 hover:text-slate-600 px-2 py-1 text-xs font-bold"
              >
                ✕
              </button>
              <button
                onClick={() => {
                  if (onBookService) onBookService(selectedProvider);
                  else alert(`Direct booking request dispatched to ${selectedProvider.name}!`);
                }}
                className="bg-[#00A86B] hover:bg-[#059669] text-white px-4 py-2 rounded-xl text-xs font-black shadow transition"
              >
                Book Partner (₹299+)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Nearby Professionals Carousel List */}
      <div className="p-4 pt-0 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700">
            {enrichedProviders.length} Professionals Available Nearby
          </span>
          <span className="text-emerald-700 font-semibold">Ready for 25s Dispatch</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          {enrichedProviders.map((p) => (
            <div
              key={p.id}
              onClick={() => setSelectedProvider(p)}
              className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                selectedProvider?.id === p.id
                  ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-slate-900 truncate">{p.name}</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1 rounded">
                  ★ {p.rating || 4.85}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">{p.skills?.[0] || 'Technician'}</p>
              <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 text-[10px]">
                <span className="font-bold text-[#0F2C59]">{p.distanceKm} km away</span>
                <span className="text-emerald-600 font-semibold">ONLINE</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ProviderDiscoveryMap;
