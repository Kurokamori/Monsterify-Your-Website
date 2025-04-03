/**
 * Location Activities Router
 * Handles all routes related to location activities
 */

const express = require('express');
const router = express.Router();
const LocationActivityController = require('./LocationActivityController');
const { ensureAuthenticated } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(ensureAuthenticated);

// Location selection page
router.get('/', LocationActivityController.showLocations);

// Start activity at a specific location
router.post('/start', LocationActivityController.startActivity);

// Activity session page
router.get('/session/:location/:activity', LocationActivityController.showSession);

// Complete activity and show rewards
router.post('/complete', LocationActivityController.completeActivity);

// Claim reward
router.post('/claim-reward', LocationActivityController.claimReward);

module.exports = router;
