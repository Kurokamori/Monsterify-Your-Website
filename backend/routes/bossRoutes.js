const express = require('express');
const router = express.Router();
const {
  getCurrentBoss,
  getBossById,
  getBossLeaderboard,
  getCurrentBossWithLeaderboard,
  getDefeatedBosses,
  getDefeatedBossById,
  createBoss,
  updateBoss,
  deleteBoss,
  getAllBosses,
  addBossDamage,
  getCurrentBossWithRewards,
  getUnclaimedRewards,
  claimBossReward
} = require('../controllers/bossController');
const { protect, admin } = require('../middleware/authMiddleware');

// Routes for /api/bosses

// Public routes
// Get current active boss
router.get('/current', getCurrentBoss);

// Get current boss with leaderboard
router.get('/current/full', getCurrentBossWithLeaderboard);

// Get defeated bosses (must come before /:id to avoid conflict)
router.get('/defeated', getDefeatedBosses);

// Get defeated boss by ID
router.get('/defeated/:id', getDefeatedBossById);

// Get boss by ID
router.get('/:id', getBossById);

// Get boss leaderboard
router.get('/:id/leaderboard', getBossLeaderboard);

// Protected routes
// Add damage to boss (requires authentication)
router.post('/:id/damage', protect, addBossDamage);

// Reward routes
// Get current boss with unclaimed rewards
router.get('/current/rewards', getCurrentBossWithRewards);

// Get unclaimed rewards for user
router.get('/rewards/unclaimed', getUnclaimedRewards);

// Claim boss reward
router.post('/rewards/:bossId/claim', claimBossReward);

// Admin routes
router.get('/admin/all', protect, admin, getAllBosses);
router.post('/admin/create', protect, admin, createBoss);
router.put('/admin/:id', protect, admin, updateBoss);
router.delete('/admin/:id', protect, admin, deleteBoss);

module.exports = router;
