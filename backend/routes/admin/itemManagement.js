const express = require('express');
const router = express.Router();
const { addItemToTrainer, addItemToBulkTrainers, addItemToAllTrainers } = require('../../controllers/itemManagementController');
const { protect, admin } = require('../../middleware/authMiddleware');

// Apply middleware to all routes
router.use(protect);
router.use(admin);

/**
 * @route POST /api/admin/item-management/trainers/:trainerId
 * @desc Add item to a single trainer
 * @access Private/Admin
 */
router.post('/trainers/:trainerId', addItemToTrainer);

/**
 * @route POST /api/admin/item-management/trainers
 * @desc Add item to multiple trainers
 * @access Private/Admin
 */
router.post('/trainers', addItemToBulkTrainers);

/**
 * @route POST /api/admin/item-management/all-trainers
 * @desc Add item to all trainers
 * @access Private/Admin
 */
router.post('/all-trainers', addItemToAllTrainers);

module.exports = router;
