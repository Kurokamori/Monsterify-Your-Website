import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware';
import {
  getAllFakemon,
  getFakemonByNumber,
  getEvolutionChain,
  getAllTypes,
  getAllCategories,
  getNumbersByCategory,
  getRandomFakemon,
  searchFakemon,
  getNextFakemonNumber,
  createFakemon,
  updateFakemon,
  deleteFakemon,
  bulkCreateFakemon,
} from '../../controllers/species/fakemon-species.controller';

const router = Router();

// Public endpoints
router.get('/', getAllFakemon);
router.get('/types', getAllTypes);
router.get('/categories', getAllCategories);
router.get('/random', getRandomFakemon);
router.get('/search', searchFakemon);
router.get('/:number', getFakemonByNumber);
router.get('/:number/evolution', getEvolutionChain);

// Admin endpoints
router.get('/admin/next-number', authenticate, requireAdmin, getNextFakemonNumber);
router.get('/admin/numbers-by-category', authenticate, requireAdmin, getNumbersByCategory);
router.post('/admin/bulk', authenticate, requireAdmin, bulkCreateFakemon);
router.post('/admin', authenticate, requireAdmin, createFakemon);
router.put('/admin/:number', authenticate, requireAdmin, updateFakemon);
router.delete('/admin/:number', authenticate, requireAdmin, deleteFakemon);

export default router;
