const express = require('express');
const router = express.Router();
const AdoptionService = require('../../utils/AdoptionService');
const MonthlyAdopt = require('../../models/MonthlyAdopt');
const TrainerInventoryChecker = require('../../utils/TrainerInventoryChecker');

/**
 * @route GET /api/adoption-table
 * @desc Get all monthly adopts with pagination in a table-friendly format
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const showCurrentMonth = req.query.currentMonth === 'true';
    const trainerId = parseInt(req.query.trainerId) || null;

    console.log('Query params:', { page, limit, showCurrentMonth, trainerId });

    // Ensure current month adopts exist first
    await MonthlyAdopt.ensureCurrentMonthAdopts();

    // Get the adopts
    const result = showCurrentMonth
      ? await AdoptionService.getCurrentMonthAdopts(page, limit)
      : await AdoptionService.getAllAdopts(page, limit);

    // Check if the trainer has a daypass if trainerId is provided
    let daypassInfo = null;
    if (trainerId) {
      daypassInfo = await TrainerInventoryChecker.checkDaycareDaypass(trainerId);
    }

    // Format the adopts for table display
    const tableData = {
      headers: [
        { id: 'species', label: 'Species' },
        { id: 'types', label: 'Types' },
        { id: 'attribute', label: 'Attribute' },
        { id: 'action', label: 'Action' }
      ],
      rows: result.adopts.map(adopt => {
        // Format species
        const speciesList = [adopt.species1, adopt.species2, adopt.species3]
          .filter(species => species)
          .join(', ');

        // Format types
        const typesList = [adopt.type1, adopt.type2, adopt.type3, adopt.type4, adopt.type5]
          .filter(type => type)
          .join(', ');

        return {
          id: adopt.id,
          cells: [
            { id: 'species', value: speciesList, primaryValue: adopt.species1 },
            { id: 'types', value: typesList, primaryValue: adopt.type1 },
            { id: 'attribute', value: adopt.attribute || 'None' },
            { 
              id: 'action', 
              value: adopt.claimed ? 'Already Adopted' : 'Adopt',
              disabled: adopt.claimed || (daypassInfo && !daypassInfo.hasDaypass)
            }
          ],
          rawData: adopt
        };
      })
    };

    res.json({
      success: true,
      tableData,
      pagination: {
        currentPage: page,
        totalPages: result.pagination.totalPages || Math.ceil(result.pagination.total / limit),
        total: result.pagination.total,
        limit
      },
      daypassInfo
    });
  } catch (error) {
    console.error('Error getting adopts for table:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error getting adopts'
    });
  }
});

module.exports = router;
