const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../../middleware/authMiddleware');
const {
  getSpeciesImages,
  getRandomSpecies,
  getSpeciesList,
  searchSpecies
} = require('../../controllers/speciesController');

// GET /api/species/images
router.get('/images', getSpeciesImages);

// GET /api/species/random - uses optional auth to get user settings if available
router.get('/random', optionalAuth, getRandomSpecies);

// GET /api/species/list
router.get('/list', getSpeciesList);

// GET /api/species/search
router.get('/search', searchSpecies);

module.exports = router;
