const express = require('express');
const router = express.Router();
const {
  getEventCategories,
  getEventContent,
  getCurrentEvents,
  getPastEvents,
  getUpcomingEvents
} = require('../controllers/eventsController');

// Routes for /api/events

/**
 * @route GET /api/events/categories
 * @desc Get all event categories
 * @access Public
 */
router.get('/categories', getEventCategories);

/**
 * @route GET /api/events/current
 * @desc Get current events list
 * @access Public
 */
router.get('/current', getCurrentEvents);

/**
 * @route GET /api/events/past
 * @desc Get past events list
 * @access Public
 */
router.get('/past', getPastEvents);

/**
 * @route GET /api/events/upcoming
 * @desc Get upcoming events list
 * @access Public
 */
router.get('/upcoming', getUpcomingEvents);

/**
 * @route GET /api/events/event/:eventId
 * @desc Get specific event content by ID
 * @access Public
 */
router.get('/event/:eventId', getEventContent);

module.exports = router;
