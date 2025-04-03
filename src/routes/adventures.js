const express = require('express');
const router = express.Router();
const Region = require('../models/Region');
const Area = require('../models/Area');
const Adventure = require('../models/Adventure');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
};

/**
 * @route GET /adventures
 * @desc Adventures index page
 * @access Private
 */
router.get('/', isAuthenticated, (req, res) => {
  res.render('adventures/index', {
    title: 'Adventures'
  });
});

/**
 * @route GET /adventures/regions
 * @desc Show regions for adventure selection
 * @access Private
 */
router.get('/regions', isAuthenticated, async (req, res) => {
  try {
    // Ensure regions table exists
    await Region.createTableIfNotExists();

    // Get all active regions
    const regions = await Region.getAll(true);

    res.render('adventures/regions', {
      title: 'Select a Region',
      regions,
      message: req.query.message,
      messageType: req.query.messageType
    });
  } catch (error) {
    console.error('Error getting regions:', error);
    res.status(500).send('Error getting regions');
  }
});

/**
 * @route GET /adventures/areas/:regionId
 * @desc Show areas for a region
 * @access Private
 */
router.get('/areas/:regionId', isAuthenticated, async (req, res) => {
  try {
    const regionId = req.params.regionId;

    // Get the region
    const region = await Region.getById(regionId);
    if (!region) {
      return res.redirect('/adventures/regions?message=Region not found&messageType=error');
    }

    // Ensure areas table exists
    await Area.createTableIfNotExists();

    // Get all active areas for the region
    const areas = await Area.getByRegionId(regionId, true);

    res.render('adventures/areas', {
      title: `Select an Area in ${region.name}`,
      region,
      areas,
      message: req.query.message,
      messageType: req.query.messageType
    });
  } catch (error) {
    console.error('Error getting areas:', error);
    res.status(500).send('Error getting areas');
  }
});

/**
 * @route GET /adventures/create/:areaId
 * @desc Show adventure creation form
 * @access Private
 */
router.get('/create/:areaId', isAuthenticated, async (req, res) => {
  try {
    const areaId = req.params.areaId;
    const userId = req.session.user.discord_id;

    // Get user's active adventures (for informational purposes)
    const activeAdventures = await Adventure.getActiveAdventures(userId);

    // Get the area
    const area = await Area.getById(areaId);
    if (!area) {
      return res.redirect('/adventures/regions?message=Area not found&messageType=error');
    }

    // Get the region
    const region = await Region.getById(area.region_id);

    res.render('adventures/create', {
      title: 'Start an Adventure',
      area,
      region,
      isAdmin: req.session.user.is_admin,
      defaultChannelId: process.env.DEFAULT_ADVENTURE_CHANNEL_ID || '123456789012345678'
    });
  } catch (error) {
    console.error('Error preparing adventure creation:', error);
    res.status(500).send('Error preparing adventure creation');
  }
});

/**
 * @route GET /adventures/create-custom
 * @desc Show custom adventure creation form
 * @access Private
 */
router.get('/create-custom', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.discord_id;

    // Get user's active adventures (for informational purposes)
    const activeAdventures = await Adventure.getActiveAdventures(userId);

    res.render('adventures/create-custom', {
      title: 'Start a Custom Adventure',
      isAdmin: req.session.user.is_admin,
      defaultChannelId: process.env.DEFAULT_ADVENTURE_CHANNEL_ID || '123456789012345678'
    });
  } catch (error) {
    console.error('Error preparing custom adventure creation:', error);
    res.status(500).send('Error preparing custom adventure creation');
  }
});

/**
 * @route GET /adventures/my
 * @desc Show user's adventures
 * @access Private
 */
router.get('/my', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.discord_id;

    // Ensure adventures table exists
    await Adventure.createTableIfNotExists();

    // Get user's adventures
    const adventures = await Adventure.getByUserId(userId);

    res.render('adventures/my', {
      title: 'My Adventures',
      adventures,
      message: req.query.message,
      messageType: req.query.messageType
    });
  } catch (error) {
    console.error('Error getting user adventures:', error);
    res.status(500).send('Error getting user adventures');
  }
});

/**
 * @route GET /adventures/view/:adventureId
 * @desc View an adventure
 * @access Private
 */
router.get('/view/:adventureId', isAuthenticated, async (req, res) => {
  try {
    const adventureId = req.params.adventureId;
    const userId = req.session.user.discord_id;

    // Get the adventure
    const adventure = await Adventure.getById(adventureId);
    if (!adventure) {
      return res.redirect('/adventures/my?message=Adventure not found&messageType=error');
    }

    // Check if user is the starter of the adventure
    const isStarter = adventure.starter_user_id === userId;

    res.render('adventures/view', {
      title: 'View Adventure',
      adventure,
      isStarter,
      message: req.query.message,
      messageType: req.query.messageType
    });
  } catch (error) {
    console.error('Error viewing adventure:', error);
    res.status(500).send('Error viewing adventure');
  }
});

module.exports = router;
