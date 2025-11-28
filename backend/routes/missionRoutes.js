const express = require('express');
const router = express.Router();
const {
  getAllMissions,
  getMissionById,
  getAvailableMissions,
  getActiveMissions,
  getEligibleMonsters,
  startMission,
  claimRewards,
  createMission
} = require('../controllers/missionController');
const { protect } = require('../middleware/authMiddleware');

// Routes for /api/missions

// Public routes
// Get all missions
router.get('/', getAllMissions);

// Get mission by ID
router.get('/:id', getMissionById);

// Protected routes (require authentication)
// Get available missions for user
router.get('/user/available', protect, getAvailableMissions);

// Get active missions for user
router.get('/user/active', protect, getActiveMissions);

// Get eligible monsters for a mission
router.get('/:missionId/eligible-monsters', protect, getEligibleMonsters);

// Start a mission
router.post('/:missionId/start', protect, startMission);

// Claim mission rewards
router.post('/:missionId/claim', protect, claimRewards);

// Admin routes (TODO: Add admin middleware)
// Create a new mission
router.post('/', protect, createMission);

module.exports = router;
