import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { dispatchService } from '../services/dispatch.service.js';

export interface ProviderDetailResponse {
  id: string;
  name: string;
  phone: string;
  rating: number;
  reviewCount: number;
  completedJobs: number;
  experienceYears: number;
  skills: string[];
  categories: string[];
  availability: string;
  isKycVerified: boolean;
  latitude: number;
  longitude: number;
  responseRate: number;
  certifications: Array<{
    id: string;
    title: string;
    issuer: string;
    year: string;
    verified: boolean;
  }>;
  workHistory: Array<{
    id: string;
    serviceName: string;
    customerName: string;
    locality: string;
    date: string;
    rating: number;
    amount: number;
  }>;
  reviews: Array<{
    id: string;
    customerName: string;
    rating: number;
    date: string;
    comment: string;
    serviceName: string;
    verifiedBooking: boolean;
  }>;
}

const PROVIDER_DATA: Record<string, Partial<ProviderDetailResponse>> = {
  prov_2: {
    id: 'prov_2',
    name: 'Suresh Patel',
    phone: '+91 98223 45678',
    rating: 4.85,
    reviewCount: 520,
    completedJobs: 520,
    experienceYears: 9,
    skills: ['AC Servicing', 'AC Repair', 'Gas Charging', 'Compressor Diagnosis'],
    categories: ['ac_services'],
    availability: 'ONLINE',
    isKycVerified: true,
    latitude: 28.5385,
    longitude: 77.3895,
    responseRate: 98,
    certifications: [
      {
        id: 'cert_1',
        title: 'NSDC Certified Master HVAC & Refrigeration Technician',
        issuer: 'National Skill Development Corporation (Govt. of India)',
        year: '2021',
        verified: true,
      },
      {
        id: 'cert_2',
        title: 'UIDAI Aadhaar Verified & Police Cleared',
        issuer: 'GharSaathi Trust & Safety Team',
        year: '2024',
        verified: true,
      },
      {
        id: 'cert_3',
        title: 'High Pressure R-32 / R-410A Eco Gas Handling Certification',
        issuer: 'Indian Refrigeration Safety Council',
        year: '2022',
        verified: true,
      },
    ],
    workHistory: [
      {
        id: 'wh_1',
        serviceName: 'AC Foam Jet Servicing & Coil Descaling',
        customerName: 'Vikas Mehra',
        locality: 'Flat 304, Lotus Boulevard, Sector 62, Noida',
        date: 'Yesterday',
        rating: 5.0,
        amount: 499,
      },
      {
        id: 'wh_2',
        serviceName: 'Split AC Gas Charging & Leakage Repair',
        customerName: 'Pooja Verma',
        locality: 'Tower C, Sector 62, Noida',
        date: '3 days ago',
        rating: 5.0,
        amount: 1450,
      },
      {
        id: 'wh_3',
        serviceName: 'Inverter AC PCB Diagnosis & Sensor Replacement',
        customerName: 'Amitabh Sen',
        locality: 'Sector 63, Noida',
        date: '5 days ago',
        rating: 4.8,
        amount: 650,
      },
    ],
    reviews: [
      {
        id: 'rev_1',
        customerName: 'Vikas Mehra',
        rating: 5.0,
        date: 'Yesterday',
        comment: 'सुरेश जी ने मात्र 30 मिनट में एसी की कूलिंग समस्या ठीक कर दी। बहुत ही विनम्र, पेशेवर और ईमानदार कारीगर हैं।',
        serviceName: 'AC Foam Jet Servicing',
        verifiedBooking: true,
      },
      {
        id: 'rev_2',
        customerName: 'Pooja Verma',
        rating: 5.0,
        date: '3 days ago',
        comment: 'Very fast arrival! Reached our flat in 10 minutes. Cleaned the coil thoroughly with genuine foam jet. 30-day warranty card provided.',
        serviceName: 'Split AC Gas Charging',
        verifiedBooking: true,
      },
      {
        id: 'rev_3',
        customerName: 'Amitabh Sen',
        rating: 4.8,
        date: '5 days ago',
        comment: 'Great diagnosis. Saved me from buying an expensive new PCB. Highly recommended for any AC issues in Noida.',
        serviceName: 'Inverter AC PCB Diagnosis',
        verifiedBooking: true,
      },
    ],
  },
  prov_1: {
    id: 'prov_1',
    name: 'Rajesh Kumar',
    phone: '+91 98112 34567',
    rating: 4.90,
    reviewCount: 342,
    completedJobs: 342,
    experienceYears: 8,
    skills: ['Electrician', 'Wiring', 'Geyser Repair', 'MCB Tripping'],
    categories: ['home_repairs'],
    availability: 'ONLINE',
    isKycVerified: true,
    latitude: 28.5355,
    longitude: 77.3910,
    responseRate: 97,
    certifications: [
      {
        id: 'cert_e1',
        title: 'Licensed Industrial & Residential Electrical Wireman',
        issuer: 'State Electrical Licensing Board (UP)',
        year: '2020',
        verified: true,
      },
      {
        id: 'cert_e2',
        title: 'Aadhaar Verified & GharSaathi Background Checked',
        issuer: 'GharSaathi Trust & Safety',
        year: '2024',
        verified: true,
      },
    ],
    workHistory: [
      {
        id: 'wh_e1',
        serviceName: 'Short Circuit Tripping & Switchboard Replacement',
        customerName: 'Sunita Sharma',
        locality: 'Sector 62, Noida',
        date: '2 days ago',
        rating: 5.0,
        amount: 299,
      },
    ],
    reviews: [
      {
        id: 'rev_e1',
        customerName: 'Sunita Sharma',
        rating: 5.0,
        date: '2 days ago',
        comment: 'लाइट ट्रिपिंग की समस्या तुरंत पहचान कर ठीक कर दी। बहुत सुरक्षित और बढ़िया काम।',
        serviceName: 'Short Circuit Tripping',
        verifiedBooking: true,
      },
    ],
  },
};

export const providerController = {
  /**
   * GET /api/providers/:id
   * Fetches rich provider detail page data including certifications, work history, and reviews.
   */
  getProviderDetails: async (req: Request, res: Response) => {
    const { id } = req.params;

    // Check pre-populated mock dataset
    if (PROVIDER_DATA[id]) {
      return res.json({ success: true, provider: PROVIDER_DATA[id] });
    }

    // Try finding in active dispatch memory
    const memoryProv = dispatchService.getProviders().find((p) => p.id === id);
    if (memoryProv) {
      return res.json({
        success: true,
        provider: {
          ...memoryProv,
          certifications: [
            {
              id: 'c_gen',
              title: 'GharSaathi Verified Trade Partner & KYC Cleared',
              issuer: 'GharSaathi Trust & Safety',
              year: '2024',
              verified: true,
            },
          ],
          workHistory: [
            {
              id: 'wh_gen',
              serviceName: `${memoryProv.skills[0] || 'General Maintenance'} Visit`,
              customerName: 'Rahul Sharma',
              locality: 'Sector 62, Noida',
              date: 'Recently',
              rating: memoryProv.rating,
              amount: 299,
            },
          ],
          reviews: [
            {
              id: 'rev_gen',
              customerName: 'Rahul Sharma',
              rating: memoryProv.rating,
              date: 'Recently',
              comment: 'Great service and quick arrival. Very professional technician.',
              serviceName: memoryProv.skills[0] || 'Home Repair',
              verifiedBooking: true,
            },
          ],
        },
      });
    }

    // Query Prisma DB
    try {
      if (prisma && prisma.providerProfile) {
        const dbProv = await prisma.providerProfile.findUnique({
          where: { id },
          include: { user: true, skills: true, documents: true, bookings: true },
        });

        if (dbProv) {
          return res.json({
            success: true,
            provider: {
              id: dbProv.id,
              name: dbProv.fullName,
              phone: dbProv.user?.phone || '+91 8435423190',
              rating: dbProv.rating,
              reviewCount: dbProv.reviewCount,
              completedJobs: dbProv.completedJobs,
              experienceYears: dbProv.experienceYears,
              skills: dbProv.skills.map((s) => s.skillName),
              categories: [],
              availability: dbProv.availability,
              isKycVerified: dbProv.isKycVerified,
              latitude: dbProv.latitude || 28.5385,
              longitude: dbProv.longitude || 77.3895,
              responseRate: dbProv.responseRate,
              certifications: dbProv.documents.map((d) => ({
                id: d.id,
                title: d.docType,
                issuer: 'Verified Authority',
                year: '2024',
                verified: d.isVerified,
              })),
              workHistory: [],
              reviews: [],
            },
          });
        }
      }
    } catch (_) {}

    return res.status(404).json({ success: false, error: 'Provider not found' });
  },

  acceptRequest: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { providerId } = req.body;
    if (!providerId) {
      return res.status(400).json({ error: 'providerId is required' });
    }

    const result = dispatchService.acceptRequest(id, providerId);
    if (!result.success) {
      return res.status(409).json({ error: result.error });
    }
    return res.json({ success: true, booking: result.booking });
  },

  rejectRequest: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { providerId } = req.body;
    dispatchService.rejectRequest(id, providerId);
    return res.json({ success: true, message: 'Request rejected, dispatched to next partner.' });
  },

  updateLocation: async (req: Request, res: Response) => {
    const { providerId, latitude, longitude } = req.body;
    dispatchService.updateProviderLocation(providerId, latitude, longitude);
    return res.json({ success: true });
  },
};

export default providerController;
