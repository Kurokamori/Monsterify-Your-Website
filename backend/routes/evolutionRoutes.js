const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { 
  evolveMonster, 
  getEvolutionOptions, 
  getEvolutionOptionsBySpecies,
  getReverseEvolutionOptions 
} = require('../controllers/evolutionController');

// Routes for /api/evolution

// Get evolution options for a species by name
router.get('/options/:speciesName', getEvolutionOptionsBySpecies);

// Get reverse evolution options (what evolves into this species)
router.get('/reverse/:speciesName', getReverseEvolutionOptions);

module.exports = router;
