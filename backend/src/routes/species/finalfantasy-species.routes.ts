import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware';
import {
  getAllFinalFantasy,
  getFinalFantasyById,
  createFinalFantasy,
  updateFinalFantasy,
  deleteFinalFantasy,
  getStages,
} from '../../controllers/species/finalfantasy-species.controller';

const router = Router();

// Public endpoints
router.get('/', getAllFinalFantasy);
router.get('/stages', getStages);
router.get('/:id', getFinalFantasyById);

// Admin endpoints
router.post('/', authenticate, requireAdmin, createFinalFantasy);
router.put('/:id', authenticate, requireAdmin, updateFinalFantasy);
router.delete('/:id', authenticate, requireAdmin, deleteFinalFantasy);

export default router;
