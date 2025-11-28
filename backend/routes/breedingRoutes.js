const express = require('express');
const router = express.Router();
const {
  breedMonsters,
  claimBreedingResult,
  checkBreedingEligibility,
  rerollBreedingResults,
  getBreedingSession
} = require('../controllers/breedingController');
const { protect } = require('../middleware/authMiddleware');

// Routes for /api/town/farm/breed

// Breed monsters
router.post('/', protect, breedMonsters);

// Check breeding eligibility
router.post('/check-eligibility', protect, checkBreedingEligibility);

// Claim breeding result
router.post('/claim', protect, claimBreedingResult);

// Reroll breeding results with forget-me-not berry
router.post('/reroll', protect, rerollBreedingResults);

// Get breeding session details
router.get('/session/:sessionId', protect, getBreedingSession);

module.exports = router;
