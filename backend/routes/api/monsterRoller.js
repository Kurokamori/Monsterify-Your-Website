const express = require('express');
const router = express.Router();
const { protect, admin } = require('../../middleware/authMiddleware');
const {
  rollMonster,
  rollMany,
  rollForTrainer,
  getOptions
} = require('../../controllers/monsterRollerController');

// All routes are protected and require admin access
router.use(protect);
router.use(admin);

// GET /api/monster-roller/options
router.get('/options', getOptions);

// POST /api/monster-roller/roll
router.post('/roll', rollMonster);

// POST /api/monster-roller/roll/many
router.post('/roll/many', rollMany);

// POST /api/monster-roller/roll/trainer
router.post('/roll/trainer', rollForTrainer);

module.exports = router;
