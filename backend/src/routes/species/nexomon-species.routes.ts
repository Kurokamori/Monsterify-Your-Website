import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware';
import {
  getAllNexomon,
  getNexomonByNr,
  createNexomon,
  updateNexomon,
  deleteNexomon,
} from '../../controllers/species/nexomon-species.controller';

const router = Router();

// Public endpoints
router.get('/', getAllNexomon);
router.get('/:nr', getNexomonByNr);

// Admin endpoints
router.post('/', authenticate, requireAdmin, createNexomon);
router.put('/:nr', authenticate, requireAdmin, updateNexomon);
router.delete('/:nr', authenticate, requireAdmin, deleteNexomon);

export default router;
