const express = require('express');
const router = express.Router();
const {
  getAllYokaiMonsters,
  getYokaiMonsterById,
  createYokaiMonster,
  updateYokaiMonster,
  deleteYokaiMonster
} = require('../controllers/yokaiMonsterController');
const { protect, admin } = require('../middleware/authMiddleware');

// Routes for /api/yokai-monsters

// Public routes
router.get('/', getAllYokaiMonsters);
router.get('/:id', getYokaiMonsterById);

// Admin routes - protected by authentication and admin middleware
router.post('/', protect, admin, createYokaiMonster);
router.put('/:id', protect, admin, updateYokaiMonster);
router.delete('/:id', protect, admin, deleteYokaiMonster);

module.exports = router;
