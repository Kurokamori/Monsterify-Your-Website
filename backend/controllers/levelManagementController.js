const db = require('../config/db');
const Trainer = require('../models/Trainer');
const Monster = require('../models/Monster');

/**
 * Add levels and coins to a single trainer
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const addLevelsToTrainer = async (req, res) => {
  try {
    const { trainerId } = req.params;
    const { levels, coins, reason } = req.body;

    // Validate inputs
    if (!trainerId || !levels) {
      return res.status(400).json({
        success: false,
        message: 'Trainer ID and levels are required'
      });
    }

    // Parse levels and coins as integers
    const parsedLevels = parseInt(levels);
    const parsedCoins = parseInt(coins) || parsedLevels * 50; // Default to 50 coins per level

    if (isNaN(parsedLevels) || parsedLevels <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Levels must be a positive number'
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

    // Update trainer levels and coins
    const updatedTrainer = {
      ...trainer,
      level: trainer.level + parsedLevels,
      currency_amount: trainer.currency_amount + parsedCoins,
      total_earned_currency: trainer.total_earned_currency + parsedCoins
    };

    // Save the updated trainer
    await Trainer.update(trainerId, updatedTrainer);

    // Log the action
    console.log(`Admin added ${parsedLevels} levels and ${parsedCoins} coins to trainer ${trainer.name} (ID: ${trainerId})`);
    if (reason) {
      console.log(`Reason: ${reason}`);
    }

    return res.status(200).json({
      success: true,
      message: `Successfully added ${parsedLevels} levels and ${parsedCoins} coins to trainer ${trainer.name}`,
      data: {
        trainer: {
          id: trainer.id,
          name: trainer.name,
          newLevel: trainer.level + parsedLevels,
          newCurrency: trainer.currency_amount + parsedCoins
        }
      }
    });
  } catch (error) {
    console.error('Error adding levels to trainer:', error);
    return res.status(500).json({
      success: false,
      message: 'Error adding levels to trainer: ' + error.message
    });
  }
};

/**
 * Add levels to a single monster
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const addLevelsToMonster = async (req, res) => {
  try {
    const { monsterId } = req.params;
    const { levels, reason } = req.body;

    // Validate inputs
    if (!monsterId || !levels) {
      return res.status(400).json({
        success: false,
        message: 'Monster ID and levels are required'
      });
    }

    // Parse levels as integer
    const parsedLevels = parseInt(levels);

    if (isNaN(parsedLevels) || parsedLevels <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Levels must be a positive number'
      });
    }

    // Get the monster
    const monster = await Monster.getById(monsterId);
    if (!monster) {
      return res.status(404).json({
        success: false,
        message: 'Monster not found'
      });
    }

    // Add levels to the monster
    const success = await Monster.addLevels(monsterId, parsedLevels);

    if (!success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to add levels to monster'
      });
    }

    // Get the updated monster
    const updatedMonster = await Monster.getById(monsterId);

    // Log the action
    console.log(`Admin added ${parsedLevels} levels to monster ${monster.name} (ID: ${monsterId})`);
    if (reason) {
      console.log(`Reason: ${reason}`);
    }

    return res.status(200).json({
      success: true,
      message: `Successfully added ${parsedLevels} levels to monster ${monster.name}`,
      data: {
        monster: {
          id: monster.id,
          name: monster.name,
          newLevel: updatedMonster.level,
          trainerId: monster.trainer_id
        }
      }
    });
  } catch (error) {
    console.error('Error adding levels to monster:', error);
    return res.status(500).json({
      success: false,
      message: 'Error adding levels to monster: ' + error.message
    });
  }
};

/**
 * Add levels and coins to multiple trainers
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const addLevelsToBulkTrainers = async (req, res) => {
  try {
    const { trainerIds, levels, coins, reason } = req.body;

    // Validate inputs
    if (!trainerIds || !Array.isArray(trainerIds) || trainerIds.length === 0 || !levels) {
      return res.status(400).json({
        success: false,
        message: 'Trainer IDs array and levels are required'
      });
    }

    // Parse levels and coins as integers
    const parsedLevels = parseInt(levels);
    const parsedCoins = parseInt(coins) || parsedLevels * 50; // Default to 50 coins per level

    if (isNaN(parsedLevels) || parsedLevels <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Levels must be a positive number'
      });
    }

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

        // Update trainer levels and coins
        const updatedTrainer = {
          ...trainer,
          level: trainer.level + parsedLevels,
          currency_amount: trainer.currency_amount + parsedCoins,
          total_earned_currency: trainer.total_earned_currency + parsedCoins
        };

        // Save the updated trainer
        await Trainer.update(trainerId, updatedTrainer);

        results.success.push({
          id: trainerId,
          name: trainer.name,
          newLevel: trainer.level + parsedLevels,
          newCurrency: trainer.currency_amount + parsedCoins
        });
      } catch (error) {
        console.error(`Error updating trainer ${trainerId}:`, error);
        results.failed.push({
          id: trainerId,
          reason: error.message
        });
      }
    }

    // Log the action
    console.log(`Admin added ${parsedLevels} levels and ${parsedCoins} coins to ${results.success.length} trainers`);
    if (reason) {
      console.log(`Reason: ${reason}`);
    }

    return res.status(200).json({
      success: true,
      message: `Successfully processed ${results.success.length} trainers, failed: ${results.failed.length}`,
      data: results
    });
  } catch (error) {
    console.error('Error adding levels to bulk trainers:', error);
    return res.status(500).json({
      success: false,
      message: 'Error adding levels to bulk trainers: ' + error.message
    });
  }
};

/**
 * Add levels to multiple monsters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const addLevelsToBulkMonsters = async (req, res) => {
  try {
    const { monsterIds, levels, reason } = req.body;

    // Validate inputs
    if (!monsterIds || !Array.isArray(monsterIds) || monsterIds.length === 0 || !levels) {
      return res.status(400).json({
        success: false,
        message: 'Monster IDs array and levels are required'
      });
    }

    // Parse levels as integer
    const parsedLevels = parseInt(levels);

    if (isNaN(parsedLevels) || parsedLevels <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Levels must be a positive number'
      });
    }

    const results = {
      success: [],
      failed: []
    };

    // Process each monster
    for (const monsterId of monsterIds) {
      try {
        // Get the monster
        const monster = await Monster.getById(monsterId);
        if (!monster) {
          results.failed.push({
            id: monsterId,
            reason: 'Monster not found'
          });
          continue;
        }

        // Add levels to the monster
        const success = await Monster.addLevels(monsterId, parsedLevels);

        if (!success) {
          results.failed.push({
            id: monsterId,
            reason: 'Failed to add levels'
          });
          continue;
        }

        // Get the updated monster
        const updatedMonster = await Monster.getById(monsterId);

        results.success.push({
          id: monsterId,
          name: monster.name,
          newLevel: updatedMonster.level,
          trainerId: monster.trainer_id
        });
      } catch (error) {
        console.error(`Error updating monster ${monsterId}:`, error);
        results.failed.push({
          id: monsterId,
          reason: error.message
        });
      }
    }

    // Log the action
    console.log(`Admin added ${parsedLevels} levels to ${results.success.length} monsters`);
    if (reason) {
      console.log(`Reason: ${reason}`);
    }

    return res.status(200).json({
      success: true,
      message: `Successfully processed ${results.success.length} monsters, failed: ${results.failed.length}`,
      data: results
    });
  } catch (error) {
    console.error('Error adding levels to bulk monsters:', error);
    return res.status(500).json({
      success: false,
      message: 'Error adding levels to bulk monsters: ' + error.message
    });
  }
};

module.exports = {
  addLevelsToTrainer,
  addLevelsToMonster,
  addLevelsToBulkTrainers,
  addLevelsToBulkMonsters
};
