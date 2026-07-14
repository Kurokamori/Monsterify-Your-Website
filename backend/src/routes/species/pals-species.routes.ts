import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware';
import {
  getAllPals,
  getPalsById,
  createPals,
  updatePals,
  deletePals,
  importPals,
  refreshPalImagesHandler,
} from '../../controllers/species/pals-species.controller';

const router = Router();

// Public endpoints
router.get('/', getAllPals);

// Admin endpoints
router.post('/import-from-wiki', authenticate, requireAdmin, importPals);
router.post('/refresh-images', authenticate, requireAdmin, refreshPalImagesHandler);
router.post('/', authenticate, requireAdmin, createPals);

router.get('/:id', getPalsById);
router.put('/:id', authenticate, requireAdmin, updatePals);
router.delete('/:id', authenticate, requireAdmin, deletePals);

export default router;
