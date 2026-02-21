import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware';
import {
  getAllYokai,
  getYokaiById,
  createYokai,
  updateYokai,
  deleteYokai,
  getTribes,
  getRanks,
} from '../../controllers/species/yokai-species.controller';

const router = Router();

// Public endpoints
router.get('/', getAllYokai);
router.get('/tribes', getTribes);
router.get('/ranks', getRanks);
router.get('/:id', getYokaiById);

// Admin endpoints
router.post('/', authenticate, requireAdmin, createYokai);
router.put('/:id', authenticate, requireAdmin, updateYokai);
router.delete('/:id', authenticate, requireAdmin, deleteYokai);

export default router;
