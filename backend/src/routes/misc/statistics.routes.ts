import { Router } from 'express';
import { authenticate, requireAdmin } from '@middleware/auth.middleware';
import {
  getOverallStats,
  getMonsterStats,
  getTrainerStats,
  getTrainerComparisonStats,
  getLeaderboardStats,
  getPlayerLeaderboardStats,
  getAchievementStats,
  getAdminDashboardStats,
} from '@controllers/misc/statistics.controller';

const router = Router();

// =============================================================================
// Public Routes (no auth required)
// =============================================================================

router.get('/overall', getOverallStats);
router.get('/monster', getMonsterStats);
router.get('/trainer/:trainerId', getTrainerStats);
router.get('/trainer-comparison', getTrainerComparisonStats);
router.get('/leaderboards', getLeaderboardStats);
router.get('/player-leaderboards', getPlayerLeaderboardStats);
router.get('/achievement-stats', getAchievementStats);

// =============================================================================
// Admin Routes
// =============================================================================

router.get('/admin/dashboard', authenticate, requireAdmin, getAdminDashboardStats);

export default router;
