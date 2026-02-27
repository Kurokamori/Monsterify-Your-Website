import { Router } from 'express';
import { authenticate, requireAdmin } from '@middleware/auth.middleware';
import {
  getCurrentBoss,
  getBossById,
  getBossLeaderboard,
  getCurrentBossWithLeaderboard,
  getDefeatedBosses,
  getDefeatedBossById,
  addBossDamage,
  getCurrentBossWithRewards,
  getUnclaimedRewards,
  claimBossReward,
  getAllBosses,
  createBoss,
  updateBoss,
  deleteBoss,
  deleteUserDamage,
  setUserDamage,
  generateRewardClaims,
} from '@controllers/adventure/boss.controller';

const router: Router = Router();

// ============================================================================
// Public Routes
// ============================================================================

router.get('/current', getCurrentBoss);
router.get('/current/full', getCurrentBossWithLeaderboard);
router.get('/defeated', getDefeatedBosses);
router.get('/defeated/:id', getDefeatedBossById);
router.get('/:id', getBossById);
router.get('/:id/leaderboard', getBossLeaderboard);

// ============================================================================
// Protected Routes
// ============================================================================

router.post('/:id/damage', authenticate, addBossDamage);

// Reward routes
router.get('/current/rewards', getCurrentBossWithRewards);
router.get('/rewards/unclaimed', getUnclaimedRewards);
router.post('/rewards/:bossId/claim', claimBossReward);

// ============================================================================
// Admin Routes
// ============================================================================

router.get('/admin/all', authenticate, requireAdmin, getAllBosses);
router.post('/admin/create', authenticate, requireAdmin, createBoss);
router.put('/admin/:id', authenticate, requireAdmin, updateBoss);
router.delete('/admin/:id', authenticate, requireAdmin, deleteBoss);
router.delete('/admin/:id/damage/:userId', authenticate, requireAdmin, deleteUserDamage);
router.put('/admin/:id/damage/:userId', authenticate, requireAdmin, setUserDamage);
router.post('/admin/:id/generate-rewards', authenticate, requireAdmin, generateRewardClaims);

export default router;
