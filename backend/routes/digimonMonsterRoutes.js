const express = require('express');
const router = express.Router();
const {
  getAllDigimonMonsters,
  getDigimonMonsterById,
  createDigimonMonster,
  updateDigimonMonster,
  deleteDigimonMonster
} = require('../controllers/digimonMonsterController');
const { protect, admin } = require('../middleware/authMiddleware');

// Routes for /api/digimon-monsters

// Public routes
router.get('/', getAllDigimonMonsters);
router.get('/:id', getDigimonMonsterById);

// Admin routes - protected by authentication and admin middleware
router.post('/', protect, admin, createDigimonMonster);
router.put('/:id', protect, admin, updateDigimonMonster);
router.delete('/:id', protect, admin, deleteDigimonMonster);

module.exports = router;
