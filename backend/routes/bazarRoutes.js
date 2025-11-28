const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getAvailableMonsters,
  getAvailableItems,
  forfeitMonster,
  forfeitMonsters,
  forfeitItem,
  adoptMonster,
  collectItem,
  getUserTrainers,
  getTrainerMonsters,
  getTrainerInventory
} = require('../controllers/bazarController');

// Routes for /api/town/bazar

// Get available monsters and items
router.get('/monsters', protect, getAvailableMonsters);
router.get('/items', protect, getAvailableItems);

// Forfeit monsters and items
router.post('/forfeit/monster', protect, forfeitMonster);
router.post('/forfeit/monsters', protect, forfeitMonsters);
router.post('/forfeit/item', protect, forfeitItem);

// Adopt monsters and collect items
router.post('/adopt/monster', protect, adoptMonster);
router.post('/collect/item', protect, collectItem);

// Helper routes for UI
router.get('/user/trainers', protect, getUserTrainers);
router.get('/trainer/:trainerId/monsters', protect, getTrainerMonsters);
router.get('/trainer/:trainerId/inventory', protect, getTrainerInventory);

module.exports = router;
