import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware';
import {
  getAllPals,
  getPalsById,
  createPals,
  updatePals,
  deletePals,
} from '../../controllers/species/pals-species.controller';

const router = Router();

// Public endpoints
router.get('/', getAllPals);
router.get('/:id', getPalsById);

// Admin endpoints
router.post('/', authenticate, requireAdmin, createPals);
router.put('/:id', authenticate, requireAdmin, updatePals);
router.delete('/:id', authenticate, requireAdmin, deletePals);

export default router;
