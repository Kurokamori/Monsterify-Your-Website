// Make sure the town routes are properly configured
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// Import controllers
const townController = require('../controllers/townController');

// Town activities routes
router.get('/activities/session/:sessionId', protect, townController.getActivitySession);
router.post('/activities/complete/:sessionId', protect, townController.completeActivity);
router.get('/activities/:location/:activity/start', protect, townController.startActivity);
router.get('/activities/:location/:activity/status', protect, townController.getActivityStatus);

module.exports = router;