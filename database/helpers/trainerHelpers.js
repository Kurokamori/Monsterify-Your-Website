const { Mon } = require('../models');
const Trainer = require('../../src/models/Trainer');

/**
 * Find a trainer by Discord user ID
 * @param {string} discordId - Discord user ID
 * @returns {Promise<Object>} - Trainer object
 */
async function getTrainerByDiscordId(discordId) {
  try {
    const trainers = await Trainer.getByDiscordId(discordId);
    return trainers && trainers.length > 0 ? trainers[0] : null;
  } catch (error) {
    console.error('Error getting trainer by Discord ID:', error);
    throw error;
  }
}

/**
 * Find all trainers for a Discord user ID
 * @param {string} discordId - Discord user ID
 * @returns {Promise<Array>} - Array of trainer objects
 */
async function getTrainersByDiscordId(discordId) {
  try {
    return await Trainer.getByDiscordId(discordId);
  } catch (error) {
    console.error('Error getting trainers by Discord ID:', error);
    throw error;
  }
}

/**
 * Find a trainer by ID
 * @param {number} trainerId - Trainer ID
 * @returns {Promise<Object>} - Trainer object
 */
async function getTrainerById(trainerId) {
  try {
    return await Trainer.getById(trainerId);
  } catch (error) {
    console.error('Error getting trainer by ID:', error);
    throw error;
  }
}

/**
 * Create a new trainer
 * @param {Object} trainerData - Trainer data
 * @returns {Promise<Object>} - Created trainer object
 */
async function createTrainer(trainerData) {
  try {
    return await Trainer.create(trainerData);
  } catch (error) {
    console.error('Error creating trainer:', error);
    throw error;
  }
}

/**
 * Update a trainer
 * @param {number} trainerId - Trainer ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} - Updated trainer object
 */
async function updateTrainer(trainerId, updateData) {
  try {
    await Trainer.update(trainerId, updateData);
    return await Trainer.getById(trainerId);
  } catch (error) {
    console.error('Error updating trainer:', error);
    throw error;
  }
}

/**
 * Get all mons for a trainer
 * @param {number} trainerId - Trainer ID
 * @returns {Promise<Array>} - Array of mon objects
 */
async function getTrainerMons(trainerId) {
  try {
    return await Mon.findAll({
      where: { trainer_id: trainerId }
    });
  } catch (error) {
    console.error('Error getting trainer mons:', error);
    throw error;
  }
}

/**
 * Add currency to a trainer
 * @param {number} trainerId - Trainer ID
 * @param {number} amount - Amount to add
 * @returns {Promise<Object>} - Updated trainer object
 */
async function addCurrency(trainerId, amount) {
  try {
    const success = await Trainer.addCoins(trainerId, amount);
    if (!success) {
      throw new Error(`Failed to add ${amount} coins to trainer ${trainerId}`);
    }
    return await Trainer.getById(trainerId);
  } catch (error) {
    console.error('Error adding currency:', error);
    throw error;
  }
}

/**
 * Add level to a trainer
 * @param {number} trainerId - Trainer ID
 * @param {number} levels - Levels to add
 * @returns {Promise<Object>} - Updated trainer object
 */
async function addLevel(trainerId, levels) {
  try {
    const success = await Trainer.addLevels(trainerId, levels);
    if (!success) {
      throw new Error(`Failed to add ${levels} levels to trainer ${trainerId}`);
    }
    return await Trainer.getById(trainerId);
  } catch (error) {
    console.error('Error adding level:', error);
    throw error;
  }
}

module.exports = {
  getTrainerByDiscordId,
  getTrainersByDiscordId,
  getTrainerById,
  createTrainer,
  updateTrainer,
  getTrainerMons,
  addCurrency,
  addLevel
};
