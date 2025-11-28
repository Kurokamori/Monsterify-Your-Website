const express = require('express');
const router = express.Router();
const { 
  addLevelsToTrainer, 
  addLevelsToMonster, 
  addLevelsToBulkTrainers, 
  addLevelsToBulkMonsters 
} = require('../../controllers/levelManagementController');
const { protect, admin } = require('../../middleware/authMiddleware');

// Apply middleware to all routes
router.use(protect);
router.use(admin);

/**
 * @route POST /api/admin/level-management/trainers/:trainerId
 * @desc Add levels and coins to a single trainer
 * @access Private/Admin
 */
router.post('/trainers/:trainerId', addLevelsToTrainer);

/**
 * @route POST /api/admin/level-management/trainers
 * @desc Add levels and coins to multiple trainers
 * @access Private/Admin
 */
router.post('/trainers', addLevelsToBulkTrainers);

/**
 * @route POST /api/admin/level-management/monsters/:monsterId
 * @desc Add levels to a single monster
 * @access Private/Admin
 */
router.post('/monsters/:monsterId', addLevelsToMonster);

/**
 * @route POST /api/admin/level-management/monsters
 * @desc Add levels to multiple monsters
 * @access Private/Admin
 */
router.post('/monsters', addLevelsToBulkMonsters);

module.exports = router;
