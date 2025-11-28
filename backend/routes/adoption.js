const express = require('express');
const router = express.Router();
const adoptionController = require('../controllers/adoptionController');
const MonthlyAdopt = require('../models/MonthlyAdopt');
const TrainerInventory = require('../models/TrainerInventory');
const db = require('../config/db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

/**
 * @route GET /api/adoption
 * @desc Get all monthly adopts with pagination
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    const showCurrentMonth = req.query.currentMonth === 'true';
    console.log('Query params:', { showCurrentMonth });

    // Ensure current month adopts exist first
    await MonthlyAdopt.ensureCurrentMonthAdopts();

    if (showCurrentMonth) {
      return adoptionController.getCurrentMonthAdopts(req, res);
    } else {
      return adoptionController.getAllAdopts(req, res);
    }
  } catch (error) {
    console.error('Error getting adopts:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting adopts'
    });
  }
});

/**
 * @route GET /api/adoption/current
 * @desc Get monthly adopts for the current month
 * @access Public
 */
router.get('/current', adoptionController.getCurrentMonthAdopts);

/**
 * @route GET /api/adoption/check-daypass/:trainerId
 * @desc Check if a trainer has a daycare daypass
 * @access Public (for testing)
 */
router.get('/check-daypass/:trainerId', (req, res) => {
  // Log the request for debugging
  console.log('Checking daycare daypass for trainer:', req.params.trainerId);
  console.log('Request headers:', req.headers);

  // Call the controller function
  return adoptionController.checkDaycareDaypass(req, res);
});

/**
 * @route POST /api/adoption/add-daypass/:trainerId
 * @desc Add a daycare daypass to a trainer (for testing)
 * @access Public (for testing)
 */
router.post('/add-daypass/:trainerId', adoptionController.addDaycareDaypass);

/**
 * @route GET /api/adoption/months
 * @desc Get list of months with adoption data
 * @access Public
 */
router.get('/months', adoptionController.getMonthsWithData);

/**
 * @route GET /api/adoption/:year/:month
 * @desc Get monthly adopts for a specific year and month
 * @access Public
 */
router.get('/:year/:month', adoptionController.getAdoptsByYearAndMonth);

/**
 * @route POST /api/adoption/claim
 * @desc Claim a monthly adopt
 * @access Private
 */
router.post('/claim', authenticateToken, adoptionController.claimAdopt);

/**
 * @route GET /api/adoption/berries/:trainerId
 * @desc Get berries for a trainer that can be used for adoption
 * @access Private
 */
router.get('/berries/:trainerId', authenticateToken, async (req, res) => {
  try {
    const trainerId = parseInt(req.params.trainerId);

    if (isNaN(trainerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid trainer ID'
      });
    }

    // Get trainer inventory
    const inventory = await TrainerInventory.getByTrainerId(trainerId);
    console.log('Trainer inventory for berries:', inventory);

    // Get berries from inventory
    const berries = inventory.berries || {};

    // Filter berries that can be used for adoption
    const adoptionBerries = [
      'Patama Berry', 'Azzuk Berry', 'Mangus Berry',
      'Miraca Berry', 'Addish Berry', 'Sky Carrot Berry',
      'Datei Berry'
    ];

    const availableBerries = {};
    for (const berry of adoptionBerries) {
      if (berries[berry] && berries[berry] > 0) {
        availableBerries[berry] = berries[berry];
      }
      res.json({
        success: true,
        berries: availableBerries
      });
    }
  } catch (error) {
    console.error('Error getting berries for adoption:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting berries for adoption',
      error: error.message
    });
  }
});

/**
 * @route GET /api/adoption/pastries/:trainerId
 * @desc Get pastries for a trainer that can be used for adoption
 * @access Private
 */
router.get('/pastries/:trainerId', authenticateToken, async (req, res) => {
  try {
    const trainerId = parseInt(req.params.trainerId);

    if (isNaN(trainerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid trainer ID'
      });
    }

    // Get trainer inventory
    const inventory = await TrainerInventory.getByTrainerId(trainerId);
    console.log('Trainer inventory for pastries:', inventory);

    // Get pastries from inventory
    const pastries = inventory.pastries || {};

    // Filter pastries that can be used for adoption
    const adoptionPastries = [
      'Patama Pastry', 'Azzuk Pastry', 'Mangus Pastry',
      'Miraca Pastry', 'Addish Pastry', 'Sky Carrot Pastry',
      'Datei Pastry'
    ];

    const availablePastries = {};
    for (const pastry of adoptionPastries) {
      if (pastries[pastry] && pastries[pastry] > 0) {
        availablePastries[pastry] = pastries[pastry];
      }
      res.json({
        success: true,
        pastries: availablePastries
      });
    }
  } catch (error) {
    console.error('Error getting pastries for adoption:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting pastries for adoption',
      error: error.message
    });
  }
});

/**
 * @route POST /api/adoption/generate
 * @desc Generate monthly adopts for the current month
 * @access Admin
 */
router.post('/generate', authenticateToken, isAdmin, adoptionController.generateMonthlyAdopts);

/**
 * @route POST /api/adoption/generate-test-data
 * @desc Generate test data for past months
 * @access Admin
 */
router.post('/generate-test-data', authenticateToken, isAdmin, adoptionController.generateTestData);

module.exports = router;
