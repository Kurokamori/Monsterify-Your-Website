const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  executeAutomatedTrade,
  getTradeHistory,
  getAvailableTrainers,
  getTrainerMonsters,
  getTrainerInventory
} = require('../controllers/automatedTradeController');

// Routes for /api/town/automated-trade

// Execute an automated trade
router.post('/execute', protect, executeAutomatedTrade);

// Get trade history for a trainer
router.get('/history/:trainerId', protect, getTradeHistory);

// Get all trainers available for trading
router.get('/trainers', protect, getAvailableTrainers);

// Get trainer's monsters available for trading
router.get('/trainers/:trainerId/monsters', protect, getTrainerMonsters);

// Get trainer's inventory available for trading
router.get('/trainers/:trainerId/inventory', protect, getTrainerInventory);

module.exports = router;
