import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware';
import {
  getAllDragonQuest,
  getDragonQuestById,
  createDragonQuest,
  updateDragonQuest,
  deleteDragonQuest,
  getFamilies,
  getSubfamilies,
} from '../../controllers/species/dragonquest-species.controller';

const router = Router();

// Public endpoints
router.get('/', getAllDragonQuest);
router.get('/families', getFamilies);
router.get('/subfamilies', getSubfamilies);
router.get('/:id', getDragonQuestById);

// Admin endpoints
router.post('/', authenticate, requireAdmin, createDragonQuest);
router.put('/:id', authenticate, requireAdmin, updateDragonQuest);
router.delete('/:id', authenticate, requireAdmin, deleteDragonQuest);

export default router;
