import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

export interface ServiceCategoryItem {
  id: string;
  slug: string;
  name: string;
  hindiName: string;
  iconName: string;
  color: string;
  description: string;
  startingPrice: number;
  serviceCount: number;
  badge?: string;
  isActive: boolean;
}

const DEFAULT_CATEGORIES: ServiceCategoryItem[] = [
  {
    id: 'cat_ac',
    slug: 'ac_services',
    name: 'AC Services & Repair',
    hindiName: 'एसी सर्विस और रिपेयर',
    iconName: 'fa-snowflake',
    color: 'from-cyan-500 to-blue-600',
    description: 'Cooling diagnosis, jet servicing, gas charging & installation with 30-day warranty.',
    startingPrice: 299,
    serviceCount: 6,
    badge: 'Popular (लोकप्रिय)',
    isActive: true,
  },
  {
    id: 'cat_electrical',
    slug: 'electrical',
    name: 'Electrical Repairs',
    hindiName: 'इलेक्ट्रीशियन विज़िट',
    iconName: 'fa-bolt',
    color: 'from-amber-400 to-yellow-500',
    description: 'Short circuit fault finding, MCB tripping, switchboard, fans & wiring.',
    startingPrice: 149,
    serviceCount: 8,
    badge: 'Fast 15m ETA',
    isActive: true,
  },
  {
    id: 'cat_plumbing',
    slug: 'plumbing',
    name: 'Plumbing Services',
    hindiName: 'प्लम्बर विज़िट',
    iconName: 'fa-faucet-drip',
    color: 'from-sky-500 to-cyan-600',
    description: 'Tap leakage, flush tank repair, pipeline blockage & motor repair.',
    startingPrice: 149,
    serviceCount: 7,
    badge: 'Emergency Help',
    isActive: true,
  },
  {
    id: 'cat_cleaning',
    slug: 'cleaning',
    name: 'Deep Cleaning',
    hindiName: 'डीप क्लीनिंग सेवाएँ',
    iconName: 'fa-broom',
    color: 'from-emerald-500 to-teal-600',
    description: 'Bathroom scrubbing, kitchen de-greasing, sofa shampooing & full home sanitization.',
    startingPrice: 349,
    serviceCount: 5,
    badge: '30-Day Guarantee',
    isActive: true,
  },
  {
    id: 'cat_carpentry',
    slug: 'carpentry',
    name: 'Carpentry & Furniture',
    hindiName: 'कारपेंटर और फर्नीचर',
    iconName: 'fa-couch',
    color: 'from-orange-500 to-amber-700',
    description: 'Lock replacement, door fixing, hinge repair, drilling & custom furniture.',
    startingPrice: 199,
    serviceCount: 6,
    isActive: true,
  },
  {
    id: 'cat_appliances',
    slug: 'appliances',
    name: 'Appliance Repair',
    hindiName: 'होम अप्लायंसेज रिपेयर',
    iconName: 'fa-screwdriver-wrench',
    color: 'from-indigo-500 to-purple-600',
    description: 'Washing machine, refrigerator, microwave & water purifier (RO) repair.',
    startingPrice: 249,
    serviceCount: 9,
    isActive: true,
  },
  {
    id: 'cat_painting',
    slug: 'painting',
    name: 'Painting & Waterproofing',
    hindiName: 'पेंटिंग और वाटरप्रूफिंग',
    iconName: 'fa-paint-roller',
    color: 'from-rose-500 to-red-600',
    description: 'Wall touch-ups, dampness diagnosis, exterior coating & full house repaint.',
    startingPrice: 499,
    serviceCount: 4,
    isActive: true,
  },
];

export const categoryController = {
  /**
   * GET /api/categories
   * Returns list of all active service categories with bilingual titles and icons.
   */
  getAllCategories: async (_req: Request, res: Response) => {
    try {
      if (prisma && prisma.serviceCategory) {
        const dbCategories = await prisma.serviceCategory.findMany({
          where: { isActive: true },
          include: { services: true },
        });

        if (dbCategories.length > 0) {
          const formatted = dbCategories.map((c) => ({
            id: c.id,
            slug: c.slug,
            name: c.name,
            hindiName: c.hindiName,
            iconName: c.iconName,
            color: 'from-emerald-500 to-teal-600',
            description: c.description,
            startingPrice: c.services.length > 0 ? Math.min(...c.services.map((s) => s.basePrice)) : 199,
            serviceCount: c.services.length,
            isActive: c.isActive,
          }));
          return res.json({ success: true, categories: formatted });
        }
      }
    } catch (_) {}

    return res.json({ success: true, categories: DEFAULT_CATEGORIES });
  },

  /**
   * GET /api/categories/:slug
   * Returns specific category by slug with associated services.
   */
  getCategoryBySlug: async (req: Request, res: Response) => {
    const { slug } = req.params;
    const item = DEFAULT_CATEGORIES.find((c) => c.slug === slug || c.id === slug);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }
    return res.json({ success: true, category: item });
  },
};

export default categoryController;
