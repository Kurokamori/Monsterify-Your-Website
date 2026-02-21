import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware';
import {
  getAllDigimon,
  getDigimonById,
  createDigimon,
  updateDigimon,
  deleteDigimon,
  getRanks,
  getAttributes,
} from '../../controllers/species/digimon-species.controller';

const router = Router();

// Public endpoints
router.get('/', getAllDigimon);
router.get('/ranks', getRanks);
router.get('/attributes', getAttributes);
router.get('/:id', getDigimonById);

// Admin endpoints
router.post('/', authenticate, requireAdmin, createDigimon);
router.put('/:id', authenticate, requireAdmin, updateDigimon);
router.delete('/:id', authenticate, requireAdmin, deleteDigimon);

export default router;
