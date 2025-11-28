const Bazar = require('../models/Bazar');
const Trainer = require('../models/Trainer');
const Monster = require('../models/Monster');

/**
 * Get all available monsters in the bazar
 */
const getAvailableMonsters = async (req, res) => {
  try {
    const monsters = await Bazar.getAvailableMonsters();
    res.json({ success: true, monsters });
  } catch (error) {
    console.error('Error getting available monsters:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get all available items in the bazar
 */
const getAvailableItems = async (req, res) => {
  try {
    const items = await Bazar.getAvailableItems();
    res.json({ success: true, items });
  } catch (error) {
    console.error('Error getting available items:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Forfeit a monster to the bazar
 */
const forfeitMonster = async (req, res) => {
  try {
    const { monsterId, trainerId } = req.body;
    const userId = req.user.discord_id;

    if (!monsterId || !trainerId) {
      return res.status(400).json({ success: false, message: 'Monster ID and Trainer ID are required' });
    }

    // Verify trainer belongs to user
    const trainer = await Trainer.getById(trainerId);
    if (!trainer || trainer.player_user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Trainer does not belong to this user' });
    }

    const result = await Bazar.forfeitMonster(monsterId, trainerId, userId);
    res.json(result);
  } catch (error) {
    console.error('Error forfeiting monster:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Forfeit multiple monsters to the bazar
 */
const forfeitMonsters = async (req, res) => {
  try {
    const { monsters } = req.body; // Array of { monsterId, trainerId }
    const userId = req.user.discord_id;

    if (!monsters || !Array.isArray(monsters) || monsters.length === 0) {
      return res.status(400).json({ success: false, message: 'Monsters array is required' });
    }

    const results = [];
    const errors = [];

    for (const { monsterId, trainerId } of monsters) {
      try {
        // Verify trainer belongs to user
        const trainer = await Trainer.getById(trainerId);
        if (!trainer || trainer.player_user_id !== userId) {
          errors.push({ monsterId, error: 'Trainer does not belong to this user' });
          continue;
        }

        const result = await Bazar.forfeitMonster(monsterId, trainerId, userId);
        results.push({ monsterId, ...result });
      } catch (error) {
        errors.push({ monsterId, error: error.message });
      }
    }

    res.json({ success: true, results, errors });
  } catch (error) {
    console.error('Error forfeiting monsters:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Forfeit an item to the bazar
 */
const forfeitItem = async (req, res) => {
  try {
    const { trainerId, category, itemName, quantity } = req.body;
    const userId = req.user.discord_id;

    if (!trainerId || !category || !itemName || !quantity) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Verify trainer belongs to user
    const trainer = await Trainer.getById(trainerId);
    if (!trainer || trainer.player_user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Trainer does not belong to this user' });
    }

    const result = await Bazar.forfeitItem(trainerId, userId, category, itemName, quantity);
    res.json(result);
  } catch (error) {
    console.error('Error forfeiting item:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Adopt a monster from the bazar
 */
const adoptMonster = async (req, res) => {
  try {
    const { bazarMonsterId, trainerId, newName } = req.body;
    const userId = req.user.discord_id;

    if (!bazarMonsterId || !trainerId) {
      return res.status(400).json({ success: false, message: 'Bazar Monster ID and Trainer ID are required' });
    }

    // Verify trainer belongs to user
    const trainer = await Trainer.getById(trainerId);
    if (!trainer || trainer.player_user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Trainer does not belong to this user' });
    }

    const result = await Bazar.adoptMonster(bazarMonsterId, trainerId, userId, newName);
    res.json(result);
  } catch (error) {
    console.error('Error adopting monster:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Collect an item from the bazar
 */
const collectItem = async (req, res) => {
  try {
    const { bazarItemId, trainerId, quantity } = req.body;
    const userId = req.user.discord_id;

    if (!bazarItemId || !trainerId || !quantity) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Verify trainer belongs to user
    const trainer = await Trainer.getById(trainerId);
    if (!trainer || trainer.player_user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Trainer does not belong to this user' });
    }

    const result = await Bazar.collectItem(bazarItemId, trainerId, userId, quantity);
    res.json(result);
  } catch (error) {
    console.error('Error collecting item:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get user's trainers for dropdown selection
 */
const getUserTrainers = async (req, res) => {
  try {
    const userId = req.user.discord_id;
    const trainers = await Trainer.getByUserId(userId);
    res.json({ success: true, trainers });
  } catch (error) {
    console.error('Error getting user trainers:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get trainer's monsters for selection
 */
const getTrainerMonsters = async (req, res) => {
  try {
    const { trainerId } = req.params;
    const userId = req.user.discord_id;

    // Verify trainer belongs to user
    const trainer = await Trainer.getById(trainerId);
    if (!trainer || trainer.player_user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Trainer does not belong to this user' });
    }

    const monsters = await Monster.getByTrainerId(trainerId);
    res.json({ success: true, monsters });
  } catch (error) {
    console.error('Error getting trainer monsters:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get trainer's inventory for item selection
 */
const getTrainerInventory = async (req, res) => {
  try {
    const { trainerId } = req.params;
    const userId = req.user.discord_id;

    // Verify trainer belongs to user
    const trainer = await Trainer.getById(trainerId);
    if (!trainer || trainer.player_user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Trainer does not belong to this user' });
    }

    const inventory = await Trainer.getInventory(trainerId);
    res.json({ success: true, inventory });
  } catch (error) {
    console.error('Error getting trainer inventory:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAvailableMonsters,
  getAvailableItems,
  forfeitMonster,
  forfeitMonsters,
  forfeitItem,
  adoptMonster,
  collectItem,
  getUserTrainers,
  getTrainerMonsters,
  getTrainerInventory
};
