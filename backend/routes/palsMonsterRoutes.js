const express = require('express');
const router = express.Router();
const {
  getAllPalsMonsters,
  getPalsMonsterById,
  createPalsMonster,
  updatePalsMonster,
  deletePalsMonster
} = require('../controllers/palsMonsterController');
const { protect, admin } = require('../middleware/authMiddleware');

// Routes for /api/pals-monsters

// Public routes
router.get('/', getAllPalsMonsters);
router.get('/:id', getPalsMonsterById);

// Admin routes - protected by authentication and admin middleware
router.post('/', protect, admin, createPalsMonster);
router.put('/:id', protect, admin, updatePalsMonster);
router.delete('/:id', protect, admin, deletePalsMonster);

module.exports = router;
