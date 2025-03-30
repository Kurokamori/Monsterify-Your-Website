const express = require('express');
const router = express.Router();
const AdoptionService = require('../../utils/AdoptionService');
const MonthlyAdopt = require('../../models/MonthlyAdopt');

/**
 * @route GET /api/adoption
 * @desc Get all monthly adopts with pagination
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Ensure current month adopts exist first
    await MonthlyAdopt.ensureCurrentMonthAdopts();
    
    const result = await AdoptionService.getAllAdopts(page, limit);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error getting adopts:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error getting adopts'
    });
  }
});

/**
 * @route GET /api/adoption/current
 * @desc Get current month adopts with pagination
 * @access Public
 */
router.get('/current', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Ensure current month adopts exist first
    await MonthlyAdopt.ensureCurrentMonthAdopts();
    
    const result = await AdoptionService.getCurrentMonthAdopts(page, limit);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error getting current month adopts:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error getting current month adopts'
    });
  }
});

/**
 * @route GET /api/adoption/trainer/:trainerId
 * @desc Get adoption claims for a specific trainer
 * @access Private
 */
router.get('/trainer/:trainerId', async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const trainerId = parseInt(req.params.trainerId);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Validate trainerId
    if (isNaN(trainerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid trainer ID'
      });
    }

    const claims = await AdoptionService.getTrainerAdoptionClaims(trainerId, page, limit);

    res.json({
      success: true,
      data: claims
    });
  } catch (error) {
    console.error('Error getting trainer adoption claims:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting trainer adoption claims'
    });
  }
});

/**
 * @route GET /api/adoption/:year/:month
 * @desc Get adopts for a specific year and month with pagination
 * @access Public
 */
router.get('/:year/:month', async (req, res) => {
  try {
    const year = parseInt(req.params.year);
    const month = parseInt(req.params.month);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Validate year and month
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return res.status(400).json({
        success: false,
        message: 'Invalid year or month'
      });
    }

    // First check if adopts exist for the requested month
    const existingAdopts = await MonthlyAdopt.getByYearAndMonth(year, month, page, limit);
    
    if (existingAdopts.adopts.length === 0) {
      // If no adopts exist, generate them
      await MonthlyAdopt.generateMonthlyAdopts(year, month, 10);
      // Then fetch the newly generated adopts
      const result = await MonthlyAdopt.getByYearAndMonth(year, month, page, limit);
      return res.json({
        success: true,
        data: result
      });
    }

    // If adopts exist, return them
    res.json({
      success: true,
      data: existingAdopts
    });
  } catch (error) {
    console.error('Error getting adopts for specific month:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting adopts for specific month'
    });
  }
});

/**
 * @route POST /api/adoption/claim
 * @desc Claim a monthly adopt
 * @access Private
 */
router.post('/claim', async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const { adoptId, trainerId, monsterName } = req.body;

    // Validate input
    if (!adoptId || !trainerId || !monsterName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters'
      });
    }

    // Claim the adopt
    const result = await AdoptionService.claimAdopt(adoptId, trainerId, monsterName);

    res.json(result);
  } catch (error) {
    console.error('Error claiming adopt:', error);
    res.status(500).json({
      success: false,
      message: 'Error claiming adopt'
    });
  }
});

/**
 * @route POST /api/adoption/generate
 * @desc Generate monthly adopts for the current month
 * @access Admin
 */
router.post('/generate', async (req, res) => {
  try {
    // Ensure user is authenticated and is an admin
    if (!req.session.user || !req.session.user.is_admin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // JavaScript months are 0-based

    const adopts = await MonthlyAdopt.generateMonthlyAdopts(year, month, 10);

    res.json({
      success: true,
      message: `Generated ${adopts.length} monthly adopts for ${year}-${month}`,
      data: adopts
    });
  } catch (error) {
    console.error('Error generating monthly adopts:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating monthly adopts'
    });
  }
});

/**
 * @route POST /api/adoption/init
 * @desc Initialize the adoption system
 * @access Admin
 */
router.post('/init', async (req, res) => {
  try {
    // Ensure user is authenticated and is an admin
    if (!req.session.user || !req.session.user.is_admin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const result = await AdoptionService.initialize();

    res.json({
      success: result,
      message: result ? 'Adoption system initialized successfully' : 'Failed to initialize adoption system'
    });
  } catch (error) {
    console.error('Error initializing adoption system:', error);
    res.status(500).json({
      success: false,
      message: 'Error initializing adoption system'
    });
  }
});

module.exports = router;


