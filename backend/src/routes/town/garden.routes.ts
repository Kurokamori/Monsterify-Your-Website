import { Router } from 'express';
import { authenticate, requireAdmin } from '@middleware/auth.middleware';
import {
  getGardenPoints,
  harvestGarden,
  getHarvestSession,
  getActiveSession,
  claimReward,
  forfeitMonster,
  claimBulk,
  forfeitBulk,
  adminGetAllGardenPoints,
  adminUpdateGardenPoints,
  adminAdjustGardenPoints,
} from '@controllers/town/garden.controller';

const router = Router();

// =============================================================================
// Protected Routes (all require authentication)
// =============================================================================

// Get garden points for current user
router.get('/points', authenticate, getGardenPoints);

// Harvest garden points
router.post('/harvest', authenticate, harvestGarden);

// Get active harvest session for current user (for resuming)
router.get('/active-session', authenticate, getActiveSession);

// Get harvest session by ID
router.get('/session/:sessionId', authenticate, getHarvestSession);

// Claim a reward from a harvest session
router.post('/claim', authenticate, claimReward);

// Forfeit a monster reward to the bazar
router.post('/forfeit', authenticate, forfeitMonster);

// Bulk claim rewards
router.post('/claim-bulk', authenticate, claimBulk);

// Bulk forfeit monsters to the bazar
router.post('/forfeit-bulk', authenticate, forfeitBulk);

// =============================================================================
// Admin Routes
// =============================================================================

// Get all garden points (paginated, searchable)
router.get('/admin/all', authenticate, requireAdmin, adminGetAllGardenPoints);

// Set garden points for a user
router.put('/admin/:userId/points', authenticate, requireAdmin, adminUpdateGardenPoints);

// Adjust (add/subtract) garden points for a user
router.post('/admin/:userId/adjust', authenticate, requireAdmin, adminAdjustGardenPoints);

export default router;
