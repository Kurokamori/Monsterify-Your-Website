const express = require('express');
const router = express.Router();
const scheduledTasksController = require('../controllers/scheduledTasksController');
const cronService = require('../services/cronService');
const { protect, admin } = require('../middleware/authMiddleware');

/**
 * @route POST /api/scheduled-tasks/monthly
 * @desc Run monthly tasks
 * @access Private/Admin
 */
router.post('/monthly', protect, admin, async (req, res) => {
  try {
    // Check if it's the first day of the month or if force flag is set
    const force = req.body.force === true;
    
    if (!scheduledTasksController.isFirstDayOfMonth() && !force) {
      return res.status(400).json({
        success: false,
        message: 'This endpoint can only be called on the first day of the month, or with force=true'
      });
    }
    
    const result = await scheduledTasksController.runMonthlyTasks();
    res.json(result);
  } catch (error) {
    console.error('Error running monthly tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Error running monthly tasks',
      error: error.message
    });
  }
});

/**
 * @route POST /api/scheduled-tasks/monthly/items
 * @desc Add monthly items to all trainers
 * @access Private/Admin
 */
router.post('/monthly/items', protect, admin, async (req, res) => {
  try {
    // Check if it's the first day of the month or if force flag is set
    const force = req.body.force === true;
    
    if (!scheduledTasksController.isFirstDayOfMonth() && !force) {
      return res.status(400).json({
        success: false,
        message: 'This endpoint can only be called on the first day of the month, or with force=true'
      });
    }
    
    const result = await scheduledTasksController.addMonthlyItems();
    res.json(result);
  } catch (error) {
    console.error('Error adding monthly items:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding monthly items',
      error: error.message
    });
  }
});

/**
 * @route POST /api/scheduled-tasks/manual/monthly-distribution
 * @desc Manually trigger monthly distribution
 * @access Private/Admin
 */
router.post('/manual/monthly-distribution', protect, admin, async (req, res) => {
  try {
    const result = await cronService.triggerMonthlyDistribution();
    res.json({
      success: true,
      message: 'Manual monthly distribution completed',
      data: result
    });
  } catch (error) {
    console.error('Error in manual monthly distribution:', error);
    res.status(500).json({
      success: false,
      message: 'Error in manual monthly distribution',
      error: error.message
    });
  }
});

/**
 * @route GET /api/scheduled-tasks/status
 * @desc Get status of all cron jobs
 * @access Private/Admin
 */
router.get('/status', protect, admin, async (req, res) => {
  try {
    const status = cronService.getStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting cron job status:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting cron job status',
      error: error.message
    });
  }
});

module.exports = router;
