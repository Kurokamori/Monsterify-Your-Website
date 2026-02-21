import { Router } from 'express';
import { authenticate, authenticateAny, requireAdmin } from '../../middleware/auth.middleware';
import {
  getAllAdventures,
  getAdventureById,
  getTrainerAdventures,
  getAvailableRegions,
  createAdventure,
  updateAdventure,
  deleteAdventure,
  completeAdventure,
  claimRewards,
  adminGetAllAdventures,
  adminGetParticipants,
  adminSendMessage,
} from '../../controllers/adventure/adventure.controller';

const router = Router();

// Public endpoints
router.get('/', getAllAdventures);
router.get('/regions', getAvailableRegions);

// Admin endpoints (must be before /:id wildcard)
router.get('/admin/all', authenticate, requireAdmin, adminGetAllAdventures);
router.get('/admin/:id/participants', authenticate, requireAdmin, adminGetParticipants);
router.post('/admin/:id/message', authenticate, requireAdmin, adminSendMessage);

router.get('/trainer/:trainerId', getTrainerAdventures);
router.get('/:id', getAdventureById);

// Authenticated endpoints
router.post('/', authenticateAny, createAdventure);
router.put('/:id', authenticate, updateAdventure);
router.delete('/:id', authenticate, deleteAdventure);
router.post('/:id/complete', authenticate, completeAdventure);
router.post('/rewards/claim', authenticate, claimRewards);

export default router;
