import { Router } from 'express';
import { authenticate, requireAdmin } from '@middleware/auth.middleware';
import {
  getCategories,
  getContent,
  saveContent,
  deleteContent,
  createDirectory,
  getSortOrder,
  updateSortOrder,
} from '@controllers/misc/content.controller';

const router: Router = Router();

// All routes require admin privileges
router.use(authenticate);
router.use(requireAdmin);

// ============================================================================
// Admin Routes
// ============================================================================

router.get('/categories', getCategories);

// Sort order management
router.get('/:category/sort-order', getSortOrder);
router.get('/:category/sort-order/*contentPath', getSortOrder);
router.put('/sort-order', updateSortOrder);

// Directory creation must be before generic wildcard POST
router.post('/:category/directory/*contentPath', createDirectory);

router.get('/:category', getContent);
router.get('/:category/*contentPath', getContent);
router.post('/:category/*contentPath', saveContent);
router.delete('/:category/*contentPath', deleteContent);

export default router;
