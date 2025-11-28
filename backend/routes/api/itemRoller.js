const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const {
  rollItems,
  rollItemsForTrainer
} = require('../../controllers/itemRollerController');

// Roll items
router.post('/roll', protect, rollItems);

// Roll items and add to trainer inventory
router.post('/roll/trainer', protect, rollItemsForTrainer);

module.exports = router;
