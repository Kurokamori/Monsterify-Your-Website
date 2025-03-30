const express = require('express');
const router = express.Router();
const AntiqueAppraisalService = require('../../utils/AntiqueAppraisalService');
const Trainer = require('../../models/Trainer');
const MonsterService = require('../../utils/MonsterService');

/**
 * @route GET /api/antiques
 * @desc Get all antiques
 * @access Public
 */
router.get('/', (req, res) => {
  try {
    const antiques = AntiqueAppraisalService.getAllAntiques();
    
    res.json({
      success: true,
      data: antiques
    });
  } catch (error) {
    console.error('Error getting antiques:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting antiques'
    });
  }
});

/**
 * @route GET /api/antiques/categories
 * @desc Get all antique categories
 * @access Public
 */
router.get('/categories', (req, res) => {
  try {
    const antiques = AntiqueAppraisalService.getAllAntiques();
    const categories = [...new Set(antiques.map(antique => antique.category))];
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error getting antique categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting antique categories'
    });
  }
});

/**
 * @route GET /api/antiques/category/:category
 * @desc Get antiques by category
 * @access Public
 */
router.get('/category/:category', (req, res) => {
  try {
    const { category } = req.params;
    const antiques = AntiqueAppraisalService.getAntiquesByCategory(category);
    
    res.json({
      success: true,
      data: antiques
    });
  } catch (error) {
    console.error('Error getting antiques by category:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting antiques by category'
    });
  }
});

/**
 * @route GET /api/antiques/trainer/:trainerId
 * @desc Get antiques for a specific trainer
 * @access Private
 */
router.get('/trainer/:trainerId', async (req, res) => {
  try {
    console.log('Getting antiques for trainer:', req.params.trainerId);
    
    const trainerId = parseInt(req.params.trainerId);
    if (isNaN(trainerId)) {
      console.error('Invalid trainer ID:', req.params.trainerId);
      return res.status(400).json({
        success: false,
        message: 'Invalid trainer ID'
      });
    }

    // Get trainer's inventory
    const inventory = await Trainer.getInventory(trainerId);
    console.log('Trainer inventory:', inventory);

    let antiquesInventory = {};
    if (inventory && inventory.inv_antiques) {
      try {
        antiquesInventory = typeof inventory.inv_antiques === 'string' 
          ? JSON.parse(inventory.inv_antiques) 
          : inventory.inv_antiques;
        console.log('Parsed antiques inventory:', antiquesInventory);
      } catch (e) {
        console.error('Error parsing antiques inventory:', e);
      }
    }

    // Get all antiques and add quantities
    const allAntiques = AntiqueAppraisalService.getAllAntiques();
    console.log('All antiques:', allAntiques);

    const trainerAntiques = allAntiques.map(antique => {
      const quantity = antiquesInventory[antique.id] || antiquesInventory[antique.name] || 0;
      return {
        ...antique,
        quantity
      };
    });

    console.log('Trainer antiques with quantities:', trainerAntiques);

    res.json({
      success: true,
      data: trainerAntiques
    });
  } catch (error) {
    console.error('Error in /api/antiques/trainer/:trainerId:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route POST /api/antiques/appraise
 * @desc Appraise an antique for a trainer
 * @access Private
 */
router.post('/appraise', async (req, res) => {
  try {
    const { trainerId, antiqueName } = req.body;
    console.log('Appraisal request:', { trainerId, antiqueName }); // Debug log

    // Validate input
    if (!trainerId || !antiqueName) {
      return res.status(400).json({
        success: false,
        message: 'Trainer ID and antique name are required'
      });
    }

    // Call the AntiqueAppraisalService directly
    const result = await AntiqueAppraisalService.appraiseAntique(trainerId, antiqueName);
    console.log('Appraisal result:', result); // Debug log

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    res.json({
      success: true,
      message: result.message,
      monsters: result.monsters
    });

  } catch (error) {
    console.error('Detailed error in appraisal:', error); // Detailed error log
    res.status(500).json({
      success: false,
      message: 'Error processing antique appraisal: ' + error.message
    });
  }
});

/**
 * @route POST /api/antiques/claim
 * @desc Claim a monster from an antique appraisal
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

    const { trainerId, monsterData, monsterName } = req.body;

    // Validate input
    if (!trainerId || !monsterData || !monsterName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters'
      });
    }

    // Create the monster
    const monster = await MonsterService.claimMonster(monsterData, trainerId, monsterName);

    if (!monster) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create monster'
      });
    }

    // Initialize the monster with proper stats and moves
    const MonsterInitializer = require('../../utils/MonsterInitializer');
    const initializedMonster = await MonsterInitializer.initializeMonster({
      ...monster,
      level: 1
    });

    // Update the monster with initialized data
    if (initializedMonster) {
      await require('../../models/Monster').update(monster.mon_id, initializedMonster);
    }

    res.json({
      success: true,
      message: 'Monster claimed successfully',
      monster
    });
  } catch (error) {
    console.error('Error claiming monster:', error);
    res.status(500).json({
      success: false,
      message: 'Error claiming monster'
    });
  }
});

module.exports = router;




