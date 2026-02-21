import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware';
import {
  getAllMonsterHunter,
  getMonsterHunterById,
  createMonsterHunter,
  updateMonsterHunter,
  deleteMonsterHunter,
  getElements,
  getRanks,
} from '../../controllers/species/monsterhunter-species.controller';

const router = Router();

// Public endpoints
router.get('/', getAllMonsterHunter);
router.get('/elements', getElements);
router.get('/ranks', getRanks);
router.get('/:id', getMonsterHunterById);

// Admin endpoints
router.post('/', authenticate, requireAdmin, createMonsterHunter);
router.put('/:id', authenticate, requireAdmin, updateMonsterHunter);
router.delete('/:id', authenticate, requireAdmin, deleteMonsterHunter);

export default router;
