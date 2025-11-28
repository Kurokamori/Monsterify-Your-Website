const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
  getTrainerEggs,
  startHatch,
  startNurture,
  getHatchSession,
  selectHatchedMonster,
  getEggItems,
  rerollHatchingResults
} = require('../controllers/nurseryController');

// Routes for /api/nursery

/**
 * @route   GET /api/nursery/eggs/:trainerId
 * @desc    Get trainer's eggs
 * @access  Private
 */
router.get('/eggs/:trainerId', protect, getTrainerEggs);

/**
 * @route   GET /api/nursery/egg-items/:trainerId
 * @desc    Get trainer's egg-related items
 * @access  Private
 */
router.get('/egg-items/:trainerId', protect, getEggItems);

/**
 * @route   POST /api/nursery/hatch
 * @desc    Start simple egg hatching
 * @access  Private
 */
router.post('/hatch', protect, upload.single('imageFile'), startHatch);

/**
 * @route   POST /api/nursery/nurture
 * @desc    Start complex egg hatching with items
 * @access  Private
 */
router.post('/nurture', protect, upload.single('imageFile'), startNurture);

/**
 * @route   GET /api/nursery/session/:sessionId
 * @desc    Get hatch session details
 * @access  Private
 */
router.get('/session/:sessionId', protect, getHatchSession);

/**
 * @route   POST /api/nursery/select
 * @desc    Select hatched monster from options
 * @access  Private
 */
router.post('/select', protect, selectHatchedMonster);

/**
 * @route   POST /api/nursery/reroll
 * @desc    Reroll hatching results with forget-me-not berry
 * @access  Private
 */
router.post('/reroll', protect, rerollHatchingResults);

module.exports = router;
