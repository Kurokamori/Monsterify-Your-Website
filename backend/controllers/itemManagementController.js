const Trainer = require('../models/Trainer');
const SpecialBerryService = require('../services/specialBerryService');
const db = require('../config/db');
const asyncHandler = require('express-async-handler');

/**
 * Add item to a single trainer
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const addItemToTrainer = asyncHandler(async (req, res) => {
  try {
    const { trainerId } = req.params;
    const { itemName, quantity, category } = req.body;

    // Validate inputs
    if (!trainerId || !itemName || !quantity || !category) {
      return res.status(400).json({
        success: false,
        message: 'Trainer ID, item name, quantity, and category are required'
      });
    }

    // Parse quantity as integer
    const parsedQuantity = parseInt(quantity);

    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive number'
      });
    }

    // Get the trainer
    const trainer = await Trainer.getById(trainerId);
    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }

    // Map category to inventory field
    const categoryMap = {
      'items': 'items',
      'berries': 'berries',
      'balls': 'balls',
      'medicine': 'medicine',
      'key_items': 'keyitems',
      'tms': 'tms',
      'antiques': 'antiques'
    };

    const inventoryField = categoryMap[category] || 'items';

    // Add item to trainer inventory
    const success = await Trainer.updateInventoryItem(trainerId, inventoryField, itemName, parsedQuantity);

    if (!success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to add item to trainer'
      });
    }

    // Log the action
    console.log(`Admin added ${parsedQuantity} ${itemName} to trainer ${trainer.name} (ID: ${trainerId})`);

    return res.status(200).json({
      success: true,
      message: `Successfully added ${parsedQuantity} ${itemName} to trainer ${trainer.name}`,
      data: {
        trainer: {
          id: trainer.id,
          name: trainer.name
        },
        item: {
          name: itemName,
          quantity: parsedQuantity,
          category: category
        }
      }
    });
  } catch (error) {
    console.error('Error adding item to trainer:', error);
    return res.status(500).json({
      success: false,
      message: 'Error adding item to trainer: ' + error.message
    });
  }
});

/**
 * Add item to multiple trainers
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const addItemToBulkTrainers = asyncHandler(async (req, res) => {
  try {
    const { trainerIds, itemName, quantity, category } = req.body;

    // Validate inputs
    if (!trainerIds || !Array.isArray(trainerIds) || trainerIds.length === 0 || !itemName || !quantity || !category) {
      return res.status(400).json({
        success: false,
        message: 'Trainer IDs array, item name, quantity, and category are required'
      });
    }

    // Parse quantity as integer
    const parsedQuantity = parseInt(quantity);

    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive number'
      });
    }

    // Map category to inventory field
    const categoryMap = {
      'items': 'items',
      'berries': 'berries',
      'balls': 'balls',
      'medicine': 'medicine',
      'key_items': 'keyitems',
      'tms': 'tms',
      'antiques': 'antiques'
    };

    const inventoryField = categoryMap[category] || 'items';

    const results = {
      success: [],
      failed: []
    };

    // Process each trainer
    for (const trainerId of trainerIds) {
      try {
        // Get the trainer
        const trainer = await Trainer.getById(trainerId);
        if (!trainer) {
          results.failed.push({
            id: trainerId,
            reason: 'Trainer not found'
          });
          continue;
        }

        // Add item to trainer inventory
        const success = await Trainer.updateInventoryItem(trainerId, inventoryField, itemName, parsedQuantity);

        if (!success) {
          results.failed.push({
            id: trainerId,
            name: trainer.name,
            reason: 'Failed to add item'
          });
          continue;
        }

        results.success.push({
          id: trainerId,
          name: trainer.name
        });

        // Log the action
        console.log(`Admin added ${parsedQuantity} ${itemName} to trainer ${trainer.name} (ID: ${trainerId})`);
      } catch (error) {
        console.error(`Error adding item to trainer ${trainerId}:`, error);
        results.failed.push({
          id: trainerId,
          reason: error.message
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Successfully added ${itemName} to ${results.success.length} trainers (${results.failed.length} failed)`,
      data: {
        results,
        item: {
          name: itemName,
          quantity: parsedQuantity,
          category: category
        }
      }
    });
  } catch (error) {
    console.error('Error adding item to trainers:', error);
    return res.status(500).json({
      success: false,
      message: 'Error adding item to trainers: ' + error.message
    });
  }
});

/**
 * Add special berries to trainer for testing
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const addSpecialBerriesToTrainer = asyncHandler(async (req, res) => {
  try {
    const { trainerId } = req.params;
    const { berryName, quantity = 5 } = req.body;

    if (!trainerId) {
      return res.status(400).json({
        success: false,
        message: 'Trainer ID is required'
      });
    }

    const validBerries = ['Forget-Me-Not', 'Edenwiess'];
    if (berryName && !validBerries.includes(berryName)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid berry name. Must be Forget-Me-Not or Edenwiess'
      });
    }

    // Add both berries if no specific berry is requested
    if (!berryName) {
      await SpecialBerryService.addSpecialBerry(trainerId, 'Forget-Me-Not', quantity);
      await SpecialBerryService.addSpecialBerry(trainerId, 'Edenwiess', quantity);
    } else {
      await SpecialBerryService.addSpecialBerry(trainerId, berryName, quantity);
    }

    const updatedBerries = await SpecialBerryService.getAvailableSpecialBerries(trainerId);

    return res.json({
      success: true,
      message: `Special berries added to trainer ${trainerId}`,
      berries: updatedBerries
    });
  } catch (error) {
    console.error('Error adding special berries:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add special berries'
    });
  }
});

/**
 * Add item to all trainers
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const addItemToAllTrainers = asyncHandler(async (req, res) => {
  try {
    const { itemName, quantity, category } = req.body;

    // Validate inputs
    if (!itemName || !quantity || !category) {
      return res.status(400).json({
        success: false,
        message: 'Item name, quantity, and category are required'
      });
    }

    // Parse quantity as integer
    const parsedQuantity = parseInt(quantity);

    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive number'
      });
    }

    // Map category to inventory field
    const categoryMap = {
      'items': 'items',
      'berries': 'berries',
      'balls': 'balls',
      'medicine': 'medicine',
      'key_items': 'keyitems',
      'keyitems': 'keyitems',
      'tms': 'tms',
      'antiques': 'antiques'
    };

    const inventoryField = categoryMap[category] || 'items';

    // Get all trainers
    const query = 'SELECT id, name FROM trainers';
    const trainers = await db.asyncAll(query);

    if (!trainers || trainers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No trainers found'
      });
    }

    const results = {
      success: [],
      failed: [],
      totalTrainers: trainers.length
    };

    // Process each trainer
    for (const trainer of trainers) {
      try {
        // Add item to trainer inventory
        const success = await Trainer.updateInventoryItem(trainer.id, inventoryField, itemName, parsedQuantity);

        if (!success) {
          results.failed.push({
            id: trainer.id,
            name: trainer.name,
            reason: 'Failed to add item'
          });
          continue;
        }

        results.success.push({
          id: trainer.id,
          name: trainer.name
        });

        // Log the action
        console.log(`Admin added ${parsedQuantity} ${itemName} to trainer ${trainer.name} (ID: ${trainer.id})`);
      } catch (error) {
        console.error(`Error adding item to trainer ${trainer.id}:`, error);
        results.failed.push({
          id: trainer.id,
          name: trainer.name,
          reason: error.message
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Successfully added ${itemName} to ${results.success.length} trainers (${results.failed.length} failed)`,
      data: {
        results,
        item: {
          name: itemName,
          quantity: parsedQuantity,
          category: category
        }
      }
    });
  } catch (error) {
    console.error('Error adding item to all trainers:', error);
    return res.status(500).json({
      success: false,
      message: 'Error adding item to all trainers: ' + error.message
    });
  }
});

module.exports = {
  addItemToTrainer,
  addItemToBulkTrainers,
  addSpecialBerriesToTrainer,
  addItemToAllTrainers
};
