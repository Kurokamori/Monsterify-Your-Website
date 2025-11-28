const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getAllAdventures,
  getAdventureById,
  createAdventure,
  updateAdventure,
  deleteAdventure,
  getTrainerAdventures,
  completeAdventure,
  getAvailableRegions
} = require('../controllers/adventureController');

// Import Discord-related routes
const adventureDiscordRoutes = require('./adventureDiscordRoutes');

// Routes for /api/adventures

/**
 * @route GET /api/adventures
 * @desc Get all adventures with optional filtering
 * @access Public
 */
router.get('/', getAllAdventures);

/**
 * @route GET /api/adventures/regions
 * @desc Get available regions for prebuilt adventures
 * @access Public
 */
router.get('/regions', getAvailableRegions);

/**
 * @route GET /api/adventures/trainer/:trainerId
 * @desc Get adventures by trainer/creator ID
 * @access Public
 */
router.get('/trainer/:trainerId', getTrainerAdventures);

/**
 * @route GET /api/adventures/:id
 * @desc Get adventure by ID
 * @access Public
 */
router.get('/:id', getAdventureById);

/**
 * @route POST /api/adventures
 * @desc Create a new adventure
 * @access Private
 */
router.post('/', protect, createAdventure);

/**
 * @route PUT /api/adventures/:id
 * @desc Update adventure
 * @access Private (creator or admin only)
 */
router.put('/:id', protect, updateAdventure);

/**
 * @route DELETE /api/adventures/:id
 * @desc Delete adventure
 * @access Private (creator or admin only)
 */
router.delete('/:id', protect, deleteAdventure);

/**
 * @route POST /api/adventures/:id/complete
 * @desc Complete adventure
 * @access Private (creator or admin only)
 */
router.post('/:id/complete', protect, completeAdventure);

/**
 * @route POST /api/adventures/rewards/claim
 * @desc Claim adventure rewards
 * @access Private
 */
router.post('/rewards/claim', protect, require('../controllers/adventureController').claimRewards);

// Use Discord-related routes
router.use('/discord', adventureDiscordRoutes);

module.exports = router;
