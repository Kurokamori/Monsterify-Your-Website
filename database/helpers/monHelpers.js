const { Mon, Pokemon } = require('../models');

/**
 * Get a mon by ID
 * @param {number} monId - Mon ID
 * @returns {Promise<Object>} - Mon object
 */
async function getMonById(monId) {
  try {
    return await Mon.findByPk(monId);
  } catch (error) {
    console.error('Error getting mon by ID:', error);
    throw error;
  }
}

/**
 * Create a new mon
 * @param {Object} monData - Mon data
 * @returns {Promise<Object>} - Created mon object
 */
async function createMon(monData) {
  try {
    return await Mon.create(monData);
  } catch (error) {
    console.error('Error creating mon:', error);
    throw error;
  }
}

/**
 * Get all mons for a trainer
 * @param {number} trainerId - Trainer ID
 * @returns {Promise<Array>} - Array of mon objects
 */
async function getMonsByTrainerId(trainerId) {
  try {
    return await Mon.findAll({
      where: { trainer_id: trainerId }
    });
  } catch (error) {
    console.error('Error getting mons by trainer ID:', error);
    throw error;
  }
}

/**
 * Update a mon
 * @param {number} monId - Mon ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} - Updated mon object
 */
async function updateMon(monId, updateData) {
  try {
    await Mon.update(updateData, {
      where: { mon_id: monId }
    });
    return await Mon.findByPk(monId);
  } catch (error) {
    console.error('Error updating mon:', error);
    throw error;
  }
}

/**
 * Delete a mon
 * @param {number} monId - Mon ID
 * @returns {Promise<boolean>} - Success status
 */
async function deleteMon(monId) {
  try {
    const result = await Mon.destroy({
      where: { mon_id: monId }
    });
    return result > 0;
  } catch (error) {
    console.error('Error deleting mon:', error);
    throw error;
  }
}

/**
 * Get all mons for a trainer
 * @param {number} trainerId - Trainer ID
 * @returns {Promise<Array>} - Array of mon objects
 */
async function getMonsByTrainerId(trainerId) {
  try {
    return await Mon.findAll({
      where: { trainer_id: trainerId }
    });
  } catch (error) {
    console.error('Error getting mons by trainer ID:', error);
    throw error;
  }
}

/**
 * Get Pokemon species data
 * @param {string} speciesName - Pokemon species name
 * @returns {Promise<Object>} - Pokemon species data
 */
async function getPokemonSpecies(speciesName) {
  try {
    return await Pokemon.findOne({
      where: { SpeciesName: speciesName }
    });
  } catch (error) {
    console.error('Error getting Pokemon species:', error);
    throw error;
  }
}

/**
 * Add level to a mon
 * @param {number} monId - Mon ID
 * @param {number} levels - Levels to add
 * @returns {Promise<Object>} - Updated mon object
 */
async function addLevel(monId, levels) {
  try {
    const mon = await Mon.findByPk(monId);
    if (!mon) {
      throw new Error('Mon not found');
    }

    const newLevel = mon.level + levels;

    await Mon.update({
      level: newLevel
    }, {
      where: { mon_id: monId }
    });

    return await Mon.findByPk(monId);
  } catch (error) {
    console.error('Error adding level to mon:', error);
    throw error;
  }
}

/**
 * Add friendship to a mon
 * @param {number} monId - Mon ID
 * @param {number} amount - Amount to add
 * @returns {Promise<Object>} - Updated mon object
 */
async function addFriendship(monId, amount) {
  try {
    const mon = await Mon.findByPk(monId);
    if (!mon) {
      throw new Error('Mon not found');
    }

    // Calculate new friendship, capped at 255 (max friendship in Pokemon games)
    const newFriendship = Math.min(255, (mon.friendship || 0) + amount);

    await Mon.update({
      friendship: newFriendship
    }, {
      where: { mon_id: monId }
    });

    return await Mon.findByPk(monId);
  } catch (error) {
    console.error('Error adding friendship to mon:', error);
    throw error;
  }
}

module.exports = {
  getMonById,
  createMon,
  updateMon,
  deleteMon,
  getMonsByTrainerId,
  getPokemonSpecies,
  addLevel,
  addFriendship
};
