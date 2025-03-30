const express = require('express');
const router = express.Router();
const Trainer = require('../../models/Trainer');
const Monster = require('../../models/Monster');

/**
 * @route GET /api/trainers/user
 * @desc Get all trainers for the logged-in user
 * @access Private
 */
router.get('/user', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }
    
    // Get user's trainers
    const trainers = await Trainer.getByUserId(req.session.user.discord_id);
    
    return res.json({
      success: true,
      trainers: trainers || []
    });
  } catch (error) {
    console.error('Error getting user trainers:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting trainers'
    });
  }
});

/**
 * @route GET /api/trainers/all
 * @desc Get all trainers
 * @access Private
 */
router.get('/all', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }
    
    // Get all trainers
    const trainers = await Trainer.getAll();
    
    return res.json({
      success: true,
      trainers: trainers || []
    });
  } catch (error) {
    console.error('Error getting all trainers:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting trainers'
    });
  }
});

/**
 * @route GET /api/trainers/:trainerId/monsters
 * @desc Get all monsters for a trainer
 * @access Private
 */
router.get('/:trainerId/monsters', async (req, res) => {
  try {
    const { trainerId } = req.params;
    
    // Check if user is logged in
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }
    
    // Get trainer's monsters
    const monsters = await Monster.getByTrainerId(trainerId);
    
    return res.json({
      success: true,
      monsters: monsters || []
    });
  } catch (error) {
    console.error('Error getting trainer monsters:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting monsters'
    });
  }
});

/**
 * @route GET /api/trainers/:trainerId/inventory/check
 * @desc Check if a trainer has a specific item
 * @access Private
 */
router.get('/:trainerId/inventory/check', async (req, res) => {
  try {
    const { trainerId } = req.params;
    const { item, category } = req.query;
    
    // Check if user is logged in
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }
    
    // Validate input
    if (!item || !category) {
      return res.status(400).json({
        success: false,
        message: 'Missing item or category parameter'
      });
    }
    
    // Get trainer's inventory
    const inventory = await Trainer.getInventory(trainerId);
    
    // Check if trainer has the item
    const hasItem = inventory && 
                    inventory[category] && 
                    inventory[category][item] && 
                    inventory[category][item] > 0;
    
    return res.json({
      success: true,
      hasItem,
      quantity: hasItem ? inventory[category][item] : 0
    });
  } catch (error) {
    console.error('Error checking trainer inventory:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking inventory'
    });
  }
});

/**
 * Get trainer's egg information
 * GET /api/trainers/:id/eggs
 */
router.get('/:id/eggs', async (req, res) => {
  try {
    const trainerId = parseInt(req.params.id);
    
    // Verify trainer exists
    const trainer = await Trainer.getById(trainerId);
    if (!trainer) {
      return res.status(404).json({ error: 'Trainer not found' });
    }

    // Get trainer's inventory
    const inventory = await Trainer.getInventory(trainerId);
    
    // Check for standard eggs and incubators
    const standardEggCount = inventory.inv_eggs?.['Standard Egg'] || 0;
    const hasIncubator = (inventory.inv_items?.['Incubator'] || 0) > 0;

    return res.json({
      standardEggCount,
      hasIncubator,
      inventory
    });
  } catch (error) {
    console.error('Error fetching trainer eggs:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

