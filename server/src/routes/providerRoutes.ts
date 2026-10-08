import { Router } from 'express';
import { providerController } from '../controllers/providerController.js';

export const providerRouter = Router();

// Provider Detail Page Data (Certifications, Work History, Reviews)
providerRouter.get('/:id', providerController.getProviderDetails);
providerRouter.get('/:id/details', providerController.getProviderDetails);

// Actions & Location
providerRouter.post('/requests/:id/accept', providerController.acceptRequest);
providerRouter.post('/requests/:id/reject', providerController.rejectRequest);
providerRouter.post('/location', providerController.updateLocation);

export default providerRouter;
