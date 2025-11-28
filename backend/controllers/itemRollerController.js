const asyncHandler = require('express-async-handler');
const ItemRoller = require('../models/ItemRoller');
const Trainer = require('../models/Trainer');

/**
 * @desc    Roll items
 * @route   POST /api/items/roll
 * @access  Private
 */
const rollItems = asyncHandler(async (req, res) => {
  const { category, rarity, quantity } = req.body;
  
  // Validate quantity
  const itemQuantity = quantity ? parseInt(quantity) : 1;
  if (itemQuantity < 1 || itemQuantity > 20) {
    res.status(400);
    throw new Error('Quantity must be between 1 and 20');
  }
  
  // Roll items
  const items = await ItemRoller.rollMany({
    category,
    rarity,
    quantity: itemQuantity
  });
  
  res.status(200).json({
    success: true,
    data: items
  });
});

/**
 * @desc    Roll items and add to trainer inventory
 * @route   POST /api/items/roll/trainer
 * @access  Private
 */
const rollItemsForTrainer = asyncHandler(async (req, res) => {
  const { trainer_id, category, rarity, quantity } = req.body;
  
  // Validate required fields
  if (!trainer_id) {
    res.status(400);
    throw new Error('Please provide trainer_id');
  }
  
  // Validate quantity
  const itemQuantity = quantity ? parseInt(quantity) : 1;
  if (itemQuantity < 1 || itemQuantity > 20) {
    res.status(400);
    throw new Error('Quantity must be between 1 and 20');
  }
  
  // Check if trainer exists
  const trainer = await Trainer.getById(trainer_id);
  if (!trainer) {
    res.status(404);
    throw new Error('Trainer not found');
  }
  
  // Roll items and add to trainer inventory
  const result = await ItemRoller.rollAndAddToInventory(trainer_id, {
    category,
    rarity,
    quantity: itemQuantity
  });
  
  res.status(200).json({
    success: true,
    data: result.items,
    message: 'Items rolled and added to trainer inventory successfully'
  });
});

module.exports = {
  rollItems,
  rollItemsForTrainer
};
