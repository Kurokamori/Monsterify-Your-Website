const express = require('express');
const router = express.Router();
const {
  getAllMonsterHunterMonsters,
  getMonsterHunterMonsterById,
  createMonsterHunterMonster,
  updateMonsterHunterMonster,
  deleteMonsterHunterMonster,
  getElements,
  getRanks
} = require('../controllers/monsterhunterMonsterController');
const { protect, admin } = require('../middleware/authMiddleware');

// Routes for /api/monsterhunter-monsters

// Public routes
router.get('/', getAllMonsterHunterMonsters);
router.get('/elements', getElements);
router.get('/ranks', getRanks);
router.get('/:id', getMonsterHunterMonsterById);

// Admin routes - protected by authentication and admin middleware
router.post('/', protect, admin, createMonsterHunterMonster);
router.put('/:id', protect, admin, updateMonsterHunterMonster);
router.delete('/:id', protect, admin, deleteMonsterHunterMonster);

module.exports = router;
