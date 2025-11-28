const asyncHandler = require('express-async-handler');
const AutomatedTrade = require('../models/AutomatedTrade');
const Monster = require('../models/Monster');
const Trainer = require('../models/Trainer');
const TrainerInventory = require('../models/TrainerInventory');
const Item = require('../models/Item');

/**
 * @desc    Execute an automated trade between trainers
 * @route   POST /api/town/automated-trade/execute
 * @access  Private
 */
const executeAutomatedTrade = asyncHandler(async (req, res) => {
  const {
    fromTrainerId,
    toTrainerId,
    fromItems = {},
    toItems = {},
    fromMonsters = [],
    toMonsters = []
  } = req.body;

  // Validate input
  if (!fromTrainerId || !toTrainerId) {
    res.status(400);
    throw new Error('Both from and to trainer IDs are required');
  }

  if (fromTrainerId === toTrainerId) {
    res.status(400);
    throw new Error('Cannot trade with the same trainer');
  }

  // Check if at least something is being traded
  const hasFromItems = Object.keys(fromItems).length > 0;
  const hasToItems = Object.keys(toItems).length > 0;
  const hasFromMonsters = fromMonsters.length > 0;
  const hasToMonsters = toMonsters.length > 0;

  if (!hasFromItems && !hasToItems && !hasFromMonsters && !hasToMonsters) {
    res.status(400);
    throw new Error('At least one item or monster must be traded');
  }

  try {
    // Execute the automated trade
    const result = await AutomatedTrade.executeTradeTransaction({
      fromTrainerId,
      toTrainerId,
      fromItems,
      toItems,
      fromMonsters,
      toMonsters
    });

    res.json({
      success: true,
      message: 'Trade executed successfully',
      trade: result
    });
  } catch (error) {
    console.error('Error executing automated trade:', error);
    res.status(400);
    throw new Error(error.message || 'Failed to execute trade');
  }
});

/**
 * @desc    Get trade history for a trainer
 * @route   GET /api/town/automated-trade/history/:trainerId
 * @access  Private
 */
const getTradeHistory = asyncHandler(async (req, res) => {
  const { trainerId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  try {
    const history = await AutomatedTrade.getTradeHistory(trainerId, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      history: history.data,
      pagination: {
        page: history.page,
        limit: history.limit,
        total: history.total,
        totalPages: history.totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching trade history:', error);
    res.status(500);
    throw new Error('Failed to fetch trade history');
  }
});

/**
 * @desc    Get all trainers available for trading
 * @route   GET /api/town/automated-trade/trainers
 * @access  Private
 */
const getAvailableTrainers = asyncHandler(async (req, res) => {
  try {
    const trainers = await Trainer.getAll();

    // Filter out any sensitive information and format for trading
    const availableTrainers = trainers.map(trainer => ({
      id: trainer.id,
      name: trainer.name,
      level: trainer.level,
      player_user_id: trainer.player_user_id
    }));

    res.json({
      success: true,
      trainers: availableTrainers
    });
  } catch (error) {
    console.error('Error fetching available trainers:', error);
    res.status(500);
    throw new Error('Failed to fetch available trainers');
  }
});

/**
 * @desc    Get trainer's monsters available for trading
 * @route   GET /api/town/automated-trade/trainers/:trainerId/monsters
 * @access  Private
 */
const getTrainerMonsters = asyncHandler(async (req, res) => {
  const { trainerId } = req.params;

  try {
    const monsters = await Monster.getByTrainerId(trainerId);

    res.json({
      success: true,
      monsters: monsters || []
    });
  } catch (error) {
    console.error('Error fetching trainer monsters:', error);
    res.status(500);
    throw new Error('Failed to fetch trainer monsters');
  }
});

/**
 * @desc    Get trainer's inventory available for trading
 * @route   GET /api/town/automated-trade/trainers/:trainerId/inventory
 * @access  Private
 */
const getTrainerInventory = asyncHandler(async (req, res) => {
  const { trainerId } = req.params;

  try {
    const inventory = await TrainerInventory.getByTrainerId(trainerId);

    if (!inventory) {
      res.json({
        success: true,
        inventory: {
          items: {},
          balls: {},
          berries: {},
          pastries: {},
          evolution: {},
          eggs: {},
          antiques: {},
          helditems: {},
          seals: {},
          keyitems: {}
        }
      });
      return;
    }

    // Get all unique item names from inventory to fetch item metadata
    const allItemNames = new Set();
    const categories = ['items', 'balls', 'berries', 'pastries', 'evolution', 'eggs', 'antiques', 'helditems', 'seals', 'keyitems'];
    
    categories.forEach(category => {
      const categoryItems = inventory[category] || {};
      Object.keys(categoryItems).forEach(itemName => {
        if (categoryItems[itemName] > 0) {
          allItemNames.add(itemName);
        }
      });
    });

    // Fetch item metadata from database
    const itemsMetadata = await Item.getByNames(Array.from(allItemNames));
    const itemsMap = new Map();
    itemsMetadata.forEach(item => {
      itemsMap.set(item.name, item);
    });

    // Enrich inventory data with item metadata
    const enrichedInventory = {};
    categories.forEach(category => {
      const categoryItems = inventory[category] || {};
      enrichedInventory[category] = {};
      
      Object.entries(categoryItems).forEach(([itemName, quantity]) => {
        if (quantity > 0) {
          const itemMetadata = itemsMap.get(itemName);
          enrichedInventory[category][itemName] = {
            name: itemName,
            quantity: quantity,
            category: category,
            image_url: itemMetadata?.image_url || null,
            description: itemMetadata?.description || null,
            rarity: itemMetadata?.rarity || null,
            type: itemMetadata?.type || null,
            effect: itemMetadata?.effect || null,
            base_price: itemMetadata?.base_price || 0
          };
        }
      });
    });

    res.json({
      success: true,
      inventory: enrichedInventory
    });
  } catch (error) {
    console.error('Error fetching trainer inventory:', error);
    res.status(500);
    throw new Error('Failed to fetch trainer inventory');
  }
});

module.exports = {
  executeAutomatedTrade,
  getTradeHistory,
  getAvailableTrainers,
  getTrainerMonsters,
  getTrainerInventory
};
