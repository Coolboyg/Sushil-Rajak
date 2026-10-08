import { Router } from 'express';
import { categoryController } from '../controllers/categoryController.js';

export const categoryRouter = Router();

// Category Endpoints
categoryRouter.get('/', categoryController.getAllCategories);
categoryRouter.get('/:slug', categoryController.getCategoryBySlug);

export default categoryRouter;
