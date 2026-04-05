import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware';
import {
  getPublishedChangelog,
  getLatestChangelog,
  getAllChangelog,
  getChangelogById,
  createChangelog,
  updateChangelog,
  deleteChangelog,
} from '../../controllers/misc/changelog.controller';

const router = Router();

// Public — any authenticated user can view published changelog
router.get('/published', authenticate, getPublishedChangelog);
router.get('/latest', authenticate, getLatestChangelog);

// Admin — full CRUD
router.get('/', authenticate, requireAdmin, getAllChangelog);
router.get('/:id', authenticate, requireAdmin, getChangelogById);
router.post('/', authenticate, requireAdmin, createChangelog);
router.put('/:id', authenticate, requireAdmin, updateChangelog);
router.delete('/:id', authenticate, requireAdmin, deleteChangelog);

export default router;
