const express = require('express');
const router = express.Router();
const AdoptionService = require('../../utils/AdoptionService');
const MonthlyAdopt = require('../../models/MonthlyAdopt');
const TrainerInventoryChecker = require('../../utils/TrainerInventoryChecker');

router.get('/list', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const showCurrentMonth = req.query.currentMonth === 'true';

    // Ensure current month adopts exist first
    await MonthlyAdopt.ensureCurrentMonthAdopts();

    const result = showCurrentMonth
      ? await AdoptionService.getCurrentMonthAdopts(page, limit)
      : await AdoptionService.getAllAdopts(page, limit);

    // Get total and calculate total pages
    const total = result.total || (result.pagination ? result.pagination.total : 0);
    const totalPages = result.pagination ? result.pagination.totalPages : Math.ceil(total / limit);

    // Log the pagination data for debugging
    console.log('Sending adoption data with pagination:', {
      totalPages,
      currentPage: page,
      total,
      limit,
      showCurrentMonth
    });

    res.json({
      success: true,
      adopts: result.adopts,
      totalPages: totalPages,
      currentPage: page,
      total: total,
      pagination: {
        totalPages: totalPages,
        currentPage: page,
        total: total,
        limit: limit
      }
    });
  } catch (error) {
    console.error('Error getting adopts list:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error getting adopts list'
    });
  }
});

router.get('/current', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Ensure current month adopts exist first
    await MonthlyAdopt.ensureCurrentMonthAdopts();

    const result = await AdoptionService.getCurrentMonthAdopts(page, limit);

    // Log the pagination data for debugging
    console.log('Sending current month adoption data:', result);

    res.json({
      success: true,
      data: result,
      adopts: result.adopts,
      totalPages: result.pagination ? result.pagination.totalPages : Math.ceil(result.total / limit),
      currentPage: page,
      pagination: result.pagination || {
        totalPages: Math.ceil(result.total / limit),
        currentPage: page,
        total: result.total,
        limit: limit
      }
    });
  } catch (error) {
    console.error('Error getting current month adopts:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error getting current month adopts'
    });
  }
});

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

// 2. Dynamic routes with parameters last
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

    // Check if adopts exist for this month
    const existingAdopts = await MonthlyAdopt.getByYearAndMonth(year, month, 1, 1);

    // If no adopts exist, generate them only for the current month
    if (!existingAdopts || !existingAdopts.adopts || existingAdopts.adopts.length === 0) {
      // Get current date
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1; // JavaScript months are 0-based

      // Only generate adopts for the current month
      if (year === currentYear && month === currentMonth) {
        console.log(`No adopts found for current month ${year}-${month}, generating...`);

        // Generate adopts for this month
        const generatedAdopts = await MonthlyAdopt.generateMonthlyAdopts(year, month, 10);
        console.log(`Generated ${generatedAdopts.length} adopts for ${year}-${month}`);

        // Now get the generated adopts with pagination using our service
        const result = await AdoptionService.getAdoptsByYearAndMonth(year, month, page, limit);

        // Log the pagination data for debugging
        console.log('Sending newly generated adopts data:', {
          adoptCount: result.adopts ? result.adopts.length : 0,
          total: result.total,
          pagination: result.pagination
        });

        return res.json({
          success: true,
          adopts: result.adopts,
          totalPages: result.pagination ? result.pagination.totalPages : Math.ceil(result.total / limit),
          currentPage: page,
          total: result.total,
          pagination: result.pagination
        });
      } else {
        // For past months with no data, return empty result
        console.log(`No adopts found for past month ${year}-${month}, returning empty result`);

        return res.json({
          success: true,
          adopts: [],
          totalPages: 0,
          currentPage: page,
          total: 0,
          pagination: {
            totalPages: 0,
            currentPage: page,
            total: 0,
            limit
          }
        });
      }
    }

    // If adopts exist, get them with pagination using our service
    const result = await AdoptionService.getAdoptsByYearAndMonth(year, month, page, limit);

    // Log the pagination data for debugging
    console.log('Sending existing adopts data:', {
      adoptCount: result.adopts ? result.adopts.length : 0,
      total: result.total,
      pagination: result.pagination
    });

    res.json({
      success: true,
      adopts: result.adopts,
      totalPages: result.pagination ? result.pagination.totalPages : Math.ceil(result.total / limit),
      currentPage: page,
      total: result.total,
      pagination: result.pagination
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

// Root route should be last
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const showCurrentMonth = req.query.currentMonth === 'true';

    console.log('Query params:', { page, limit, showCurrentMonth });

    // Ensure current month adopts exist first
    await MonthlyAdopt.ensureCurrentMonthAdopts();

    const result = showCurrentMonth
      ? await AdoptionService.getCurrentMonthAdopts(page, limit)
      : await AdoptionService.getAllAdopts(page, limit);

    console.log('Database result:', result);

    // Get total and calculate total pages
    const total = result.total || (result.pagination ? result.pagination.total : 0);
    const totalPages = result.pagination ? result.pagination.totalPages : Math.ceil(total / limit);

    // Log the pagination data for debugging
    console.log('Sending adoption data with pagination (root route):', {
      totalPages,
      currentPage: page,
      total,
      limit,
      showCurrentMonth
    });

    res.json({
      success: true,
      adopts: result.adopts,
      totalPages: totalPages,
      currentPage: page,
      total: total,
      pagination: {
        totalPages: totalPages,
        currentPage: page,
        total: total,
        limit: limit
      }
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
 * @route GET /api/adoption/months
 * @desc Get list of months with adoption data
 * @access Private
 */
router.get('/months', async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    // Get list of months with adoption data
    const months = await MonthlyAdopt.getMonthsWithData();

    console.log('Months with adoption data:', months);

    res.json({
      success: true,
      months: months
    });
  } catch (error) {
    console.error('Error getting months with adoption data:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting months with adoption data'
    });
  }
});

module.exports = router;


