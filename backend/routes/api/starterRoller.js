const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const {
  rollStarterSets,
  selectStarters
} = require('../../controllers/starterRollerController');

// All routes are protected
router.use(protect);

// POST /api/starter-roller/roll
router.post('/roll', rollStarterSets);

// POST /api/starter-roller/select
router.post('/select', selectStarters);

module.exports = router;
