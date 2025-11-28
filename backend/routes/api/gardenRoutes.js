const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const gardenController = require('../../controllers/gardenController');

/**
 * @route   GET /api/garden/points
 * @desc    Get garden points for the current user
 * @access  Private
 */
router.get('/points', protect, gardenController.getGardenPoints);

/**
 * @route   POST /api/garden/harvest
 * @desc    Harvest garden points
 * @access  Private
 */
router.post('/harvest', protect, gardenController.harvestGarden);

/**
 * @route   GET /api/garden/session/:sessionId
 * @desc    Get garden harvest session
 * @access  Private
 */
router.get('/session/:sessionId', protect, gardenController.getHarvestSession);

/**
 * @route   POST /api/garden/claim
 * @desc    Claim a reward from a garden harvest session
 * @access  Private
 */
router.post('/claim', protect, gardenController.claimReward);

/**
 * @route   POST /api/garden/forfeit
 * @desc    Forfeit a monster reward from a garden harvest session to the bazar
 * @access  Private
 */
router.post('/forfeit', protect, gardenController.forfeitMonster);

module.exports = router;
