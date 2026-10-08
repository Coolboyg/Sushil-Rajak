import React, { useState, useEffect } from 'react';

const FALLBACK_CATEGORIES = [
  {
    id: 'cat_ac',
    slug: 'ac_services',
    name: 'AC Services',
    hindiName: 'एसी सर्विस और रिपेयर',
    icon: 'fa-snowflake',
    gradient: 'from-cyan-500 to-blue-600',
    startingPrice: 299,
    badge: 'Popular',
  },
  {
    id: 'cat_electrical',
    slug: 'electrical',
    name: 'Electrical',
    hindiName: 'इलेक्ट्रीशियन विज़िट',
    icon: 'fa-bolt',
    gradient: 'from-amber-400 to-yellow-500',
    startingPrice: 149,
    badge: 'Fast ETA',
  },
  {
    id: 'cat_plumbing',
    slug: 'plumbing',
    name: 'Plumbing',
    hindiName: 'प्लम्बर विज़िट',
    icon: 'fa-faucet-drip',
    gradient: 'from-sky-500 to-cyan-600',
    startingPrice: 149,
    badge: 'Emergency',
  },
  {
    id: 'cat_cleaning',
    slug: 'cleaning',
    name: 'Deep Cleaning',
    hindiName: 'डीप क्लीनिंग सेवाएँ',
    icon: 'fa-broom',
    gradient: 'from-emerald-500 to-teal-600',
    startingPrice: 349,
    badge: 'Top Rated',
  },
  {
    id: 'cat_carpentry',
    slug: 'carpentry',
    name: 'Carpentry',
    hindiName: 'कारपेंटर और फर्नीचर',
    icon: 'fa-couch',
    gradient: 'from-orange-500 to-amber-700',
    startingPrice: 199,
  },
  {
    id: 'cat_appliances',
    slug: 'appliances',
    name: 'Appliances',
    hindiName: 'होम अप्लायंसेज',
    icon: 'fa-screwdriver-wrench',
    gradient: 'from-indigo-500 to-purple-600',
    startingPrice: 249,
  },
  {
    id: 'cat_painting',
    slug: 'painting',
    name: 'Painting',
    hindiName: 'पेंटिंग सेवाएँ',
    icon: 'fa-paint-roller',
    gradient: 'from-rose-500 to-red-600',
    startingPrice: 499,
  },
];

export function CategoryGrid({ onSelectCategory, selectedSlug = 'ALL' }) {
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [activeCategory, setActiveCategory] = useState(selectedSlug);

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.categories && data.categories.length > 0) {
          const mapped = data.categories.map((c) => ({
            id: c.id,
            slug: c.slug,
            name: c.name,
            hindiName: c.hindiName,
            icon: c.iconName || 'fa-screwdriver-wrench',
            gradient: c.color || 'from-emerald-500 to-teal-600',
            startingPrice: c.startingPrice || 149,
            badge: c.badge,
          }));
          setCategories(mapped);
        }
      })
      .catch(() => {
        // Fallback gracefully to default items
      });
  }, []);

  const handleClick = (slug) => {
    setActiveCategory(slug);
    if (onSelectCategory) {
      onSelectCategory(slug);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm text-slate-900">Explore Service Categories</h3>
          <p className="text-xs text-slate-500">विश्वसनीय और प्रमाणित कारीगर आपके द्वार पर</p>
        </div>
        <button
          onClick={() => handleClick('ALL')}
          className={`text-xs font-bold px-2.5 py-1 rounded-lg transition ${
            activeCategory === 'ALL'
              ? 'bg-[#00A86B] text-white'
              : 'text-[#0F2C59] hover:bg-slate-100'
          }`}
        >
          View All (सभी)
        </button>
      </div>

      {/* Grid View */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {categories.map((cat) => {
          const isSelected = activeCategory === cat.slug;
          return (
            <div
              key={cat.id || cat.slug}
              onClick={() => handleClick(cat.slug)}
              className={`p-3.5 rounded-2xl border text-center cursor-pointer transition transform hover:-translate-y-1 shadow-sm flex flex-col items-center justify-between group ${
                isSelected
                  ? 'border-[#00A86B] bg-emerald-50/60 ring-2 ring-[#00A86B]/30'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              {/* Badge if available */}
              {cat.badge && (
                <span className="self-end -mt-1 -mr-1 bg-amber-100 text-amber-800 text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-tighter">
                  {cat.badge}
                </span>
              )}

              {/* Colorful Gradient Icon Circle */}
              <div
                className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${cat.gradient} text-white flex items-center justify-center text-lg shadow-md mb-2 group-hover:scale-110 transition`}
              >
                <i className={`fa-solid ${cat.icon}`}></i>
              </div>

              {/* Title & Hindi Translation */}
              <div className="space-y-0.5">
                <h4 className="font-bold text-xs text-slate-800 group-hover:text-[#00A86B] transition line-clamp-1">
                  {cat.name}
                </h4>
                <p className="text-[10px] text-slate-500 line-clamp-1">{cat.hindiName}</p>
              </div>

              {/* Price Pill */}
              <div className="mt-2 pt-1 border-t border-slate-100 w-full">
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
                  From ₹{cat.startingPrice}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CategoryGrid;
