const { Trade, Mon } = require('../models');
const { Op } = require('sequelize');

/**
 * Create a new trade
 * @param {Object} tradeData - Trade data
 * @returns {Promise<Object>} - Created trade object
 */
async function createTrade(tradeData) {
  try {
    return await Trade.create(tradeData);
  } catch (error) {
    console.error('Error creating trade:', error);
    throw error;
  }
}

/**
 * Get a trade by ID
 * @param {number} tradeId - Trade ID
 * @returns {Promise<Object>} - Trade object
 */
async function getTradeById(tradeId) {
  try {
    return await Trade.findByPk(tradeId);
  } catch (error) {
    console.error('Error getting trade by ID:', error);
    throw error;
  }
}

/**
 * Get trades for a trainer (either as initiator or recipient)
 * @param {number} trainerId - Trainer ID
 * @returns {Promise<Array>} - Array of trade objects
 */
async function getTradesForTrainer(trainerId) {
  try {
    return await Trade.findAll({
      where: {
        [Op.or]: [
          { initiator_id: trainerId },
          { recipient_id: trainerId }
        ]
      }
    });
  } catch (error) {
    console.error('Error getting trades for trainer:', error);
    throw error;
  }
}

/**
 * Accept a trade
 * @param {number} tradeId - Trade ID
 * @returns {Promise<Object>} - Updated trade object
 */
async function acceptTrade(tradeId) {
  try {
    const trade = await Trade.findByPk(tradeId);
    if (!trade) {
      throw new Error('Trade not found');
    }

    if (trade.status !== 'pending') {
      throw new Error(`Trade is already ${trade.status}`);
    }

    // Update trade status
    await Trade.update({
      status: 'accepted'
    }, {
      where: { trade_id: tradeId }
    });

    // Transfer mons
    if (trade.offered_mons && trade.offered_mons.length > 0) {
      await Mon.update({
        trainer_id: trade.recipient_id
      }, {
        where: {
          mon_id: { [Op.in]: trade.offered_mons }
        }
      });
    }

    if (trade.requested_mons && trade.requested_mons.length > 0) {
      await Mon.update({
        trainer_id: trade.initiator_id
      }, {
        where: {
          mon_id: { [Op.in]: trade.requested_mons }
        }
      });
    }

    // TODO: Handle item transfers (would need inventory management)

    return await Trade.findByPk(tradeId);
  } catch (error) {
    console.error('Error accepting trade:', error);
    throw error;
  }
}

/**
 * Reject a trade
 * @param {number} tradeId - Trade ID
 * @returns {Promise<Object>} - Updated trade object
 */
async function rejectTrade(tradeId) {
  try {
    const trade = await Trade.findByPk(tradeId);
    if (!trade) {
      throw new Error('Trade not found');
    }

    if (trade.status !== 'pending') {
      throw new Error(`Trade is already ${trade.status}`);
    }

    await Trade.update({
      status: 'rejected'
    }, {
      where: { trade_id: tradeId }
    });

    return await Trade.findByPk(tradeId);
  } catch (error) {
    console.error('Error rejecting trade:', error);
    throw error;
  }
}

/**
 * Cancel a trade
 * @param {number} tradeId - Trade ID
 * @param {number} trainerId - Trainer ID (must be the initiator)
 * @returns {Promise<Object>} - Updated trade object
 */
async function cancelTrade(tradeId, trainerId) {
  try {
    const trade = await Trade.findByPk(tradeId);
    if (!trade) {
      throw new Error('Trade not found');
    }

    if (trade.initiator_id !== trainerId) {
      throw new Error('Only the trade initiator can cancel the trade');
    }

    if (trade.status !== 'pending') {
      throw new Error(`Trade is already ${trade.status}`);
    }

    await Trade.update({
      status: 'cancelled'
    }, {
      where: { trade_id: tradeId }
    });

    return await Trade.findByPk(tradeId);
  } catch (error) {
    console.error('Error cancelling trade:', error);
    throw error;
  }
}

module.exports = {
  createTrade,
  getTradeById,
  getTradesForTrainer,
  acceptTrade,
  rejectTrade,
  cancelTrade
};
