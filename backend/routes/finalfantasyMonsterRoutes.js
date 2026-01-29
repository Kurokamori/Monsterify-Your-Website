const express = require('express');
const router = express.Router();
const {
  getAllFinalFantasyMonsters,
  getFinalFantasyMonsterById,
  createFinalFantasyMonster,
  updateFinalFantasyMonster,
  deleteFinalFantasyMonster,
  getStages
} = require('../controllers/finalfantasyMonsterController');
const { protect, admin } = require('../middleware/authMiddleware');

// Routes for /api/finalfantasy-monsters

// Public routes
router.get('/', getAllFinalFantasyMonsters);
router.get('/stages', getStages);
router.get('/:id', getFinalFantasyMonsterById);

// Admin routes - protected by authentication and admin middleware
router.post('/', protect, admin, createFinalFantasyMonster);
router.put('/:id', protect, admin, updateFinalFantasyMonster);
router.delete('/:id', protect, admin, deleteFinalFantasyMonster);

module.exports = router;
