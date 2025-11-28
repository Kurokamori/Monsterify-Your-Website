const express = require('express');
const router = express.Router();
const {
  getAllPokemonMonsters,
  getPokemonMonsterById,
  createPokemonMonster,
  updatePokemonMonster,
  deletePokemonMonster
} = require('../controllers/pokemonMonsterController');
const { protect, admin } = require('../middleware/authMiddleware');

// Routes for /api/pokemon-monsters

// Public routes
router.get('/', getAllPokemonMonsters);
router.get('/:id', getPokemonMonsterById);

// Admin routes - protected by authentication and admin middleware
router.post('/', protect, admin, createPokemonMonster);
router.put('/:id', protect, admin, updatePokemonMonster);
router.delete('/:id', protect, admin, deletePokemonMonster);

module.exports = router;
