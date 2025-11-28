const db = require('../config/db');
const Monster = require('./Monster');
const Trainer = require('./Trainer');
const TrainerInventory = require('./TrainerInventory');
const { buildLimitOffset } = require('../utils/dbUtils');

/**
 * AutomatedTrade model for handling instant trades
 */
class AutomatedTrade {
  /**
   * Execute a complete trade transaction between two trainers
   * @param {Object} tradeData - Trade data
   * @param {number} tradeData.fromTrainerId - Source trainer ID
   * @param {number} tradeData.toTrainerId - Target trainer ID
   * @param {Object} tradeData.fromItems - Items from source trainer {category: {itemName: quantity}}
   * @param {Object} tradeData.toItems - Items from target trainer {category: {itemName: quantity}}
   * @param {Array} tradeData.fromMonsters - Monster IDs from source trainer
   * @param {Array} tradeData.toMonsters - Monster IDs from target trainer
   * @returns {Promise<Object>} - Trade result
   */
  static async executeTradeTransaction(tradeData) {
    const {
      fromTrainerId,
      toTrainerId,
      fromItems = {},
      toItems = {},
      fromMonsters = [],
      toMonsters = []
    } = tradeData;

    try {
      // Start transaction
      await db.asyncRun('BEGIN TRANSACTION');

      // Validate trainers exist
      const fromTrainer = await Trainer.getById(fromTrainerId);
      const toTrainer = await Trainer.getById(toTrainerId);

      if (!fromTrainer) {
        throw new Error(`Source trainer with ID ${fromTrainerId} not found`);
      }
      if (!toTrainer) {
        throw new Error(`Target trainer with ID ${toTrainerId} not found`);
      }

      // Validate and transfer monsters
      await this.validateAndTransferMonsters(fromMonsters, fromTrainerId, toTrainerId);
      await this.validateAndTransferMonsters(toMonsters, toTrainerId, fromTrainerId);

      // Validate and transfer items
      await this.validateAndTransferItems(fromItems, fromTrainerId, toTrainerId);
      await this.validateAndTransferItems(toItems, toTrainerId, fromTrainerId);

      // Log the trade
      const tradeRecord = await this.logTrade({
        fromTrainerId,
        toTrainerId,
        fromItems,
        toItems,
        fromMonsters,
        toMonsters
      });

      // Commit transaction
      await db.asyncRun('COMMIT');

      return {
        id: tradeRecord.id,
        fromTrainer: fromTrainer.name,
        toTrainer: toTrainer.name,
        fromItems,
        toItems,
        fromMonsters,
        toMonsters,
        executedAt: new Date().toISOString()
      };
    } catch (error) {
      // Rollback transaction
      await db.asyncRun('ROLLBACK');
      console.error('Error executing automated trade:', error);
      throw error;
    }
  }

  /**
   * Validate monsters belong to trainer and transfer them
   * @param {Array} monsterIds - Array of monster IDs
   * @param {number} fromTrainerId - Source trainer ID
   * @param {number} toTrainerId - Target trainer ID
   */
  static async validateAndTransferMonsters(monsterIds, fromTrainerId, toTrainerId) {
    if (!monsterIds || monsterIds.length === 0) {
      return;
    }

    for (const monsterId of monsterIds) {
      // Validate monster exists and belongs to source trainer
      const monster = await Monster.getById(monsterId);
      if (!monster) {
        throw new Error(`Monster with ID ${monsterId} not found`);
      }

      if (monster.trainer_id !== parseInt(fromTrainerId)) {
        throw new Error(`Monster ${monster.name} does not belong to the source trainer`);
      }

      // Transfer monster to target trainer
      await Monster.transferToTrainer(monsterId, toTrainerId);
    }
  }

  /**
   * Validate trainer has items and transfer them
   * @param {Object} items - Items to transfer {category: {itemName: quantity}}
   * @param {number} fromTrainerId - Source trainer ID
   * @param {number} toTrainerId - Target trainer ID
   */
  static async validateAndTransferItems(items, fromTrainerId, toTrainerId) {
    if (!items || Object.keys(items).length === 0) {
      return;
    }

    // Get inventories
    const fromInventory = await TrainerInventory.getByTrainerId(fromTrainerId);
    const toInventory = await TrainerInventory.getByTrainerId(toTrainerId);

    if (!fromInventory) {
      throw new Error(`Source trainer inventory not found`);
    }
    if (!toInventory) {
      throw new Error(`Target trainer inventory not found`);
    }

    // Process each category
    for (const [category, categoryItems] of Object.entries(items)) {
      if (!categoryItems || Object.keys(categoryItems).length === 0) {
        continue;
      }

      // Get current inventory for this category (already parsed by TrainerInventory.getByTrainerId)
      const fromCategoryItems = { ...(fromInventory[category] || {}) };
      const toCategoryItems = { ...(toInventory[category] || {}) };

      // Validate and transfer each item
      for (const [itemName, quantity] of Object.entries(categoryItems)) {
        const currentQuantity = fromCategoryItems[itemName] || 0;

        if (currentQuantity < quantity) {
          throw new Error(`Source trainer does not have enough ${itemName} (has ${currentQuantity}, needs ${quantity})`);
        }

        // Remove from source
        fromCategoryItems[itemName] = currentQuantity - quantity;
        if (fromCategoryItems[itemName] <= 0) {
          delete fromCategoryItems[itemName];
        }

        // Add to target
        toCategoryItems[itemName] = (toCategoryItems[itemName] || 0) + quantity;
      }

      // Update inventories
      await TrainerInventory.updateCategory(fromInventory.id, category, fromCategoryItems);
      await TrainerInventory.updateCategory(toInventory.id, category, toCategoryItems);
    }
  }

  /**
   * Log the trade in the database
   * @param {Object} tradeData - Trade data to log
   * @returns {Promise<Object>} - Created trade record
   */
  static async logTrade(tradeData) {
    const {
      fromTrainerId,
      toTrainerId,
      fromItems,
      toItems,
      fromMonsters,
      toMonsters
    } = tradeData;

    const query = `
      INSERT INTO automated_trades (
        from_trainer_id, to_trainer_id,
        from_items, to_items,
        from_monsters, to_monsters,
        executed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
    `;

    const params = [
      fromTrainerId,
      toTrainerId,
      JSON.stringify(fromItems),
      JSON.stringify(toItems),
      JSON.stringify(fromMonsters),
      JSON.stringify(toMonsters)
    ];

    const result = await db.asyncRun(query, params);
    return { id: result.lastID, ...tradeData };
  }

  /**
   * Get trade history for a trainer
   * @param {number} trainerId - Trainer ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Trade history with pagination
   */
  static async getTradeHistory(trainerId, options = {}) {
    const { page = 1, limit = 10 } = options;

    try {
      // Count total trades
      const countQuery = `
        SELECT COUNT(*) as total
        FROM automated_trades
        WHERE from_trainer_id = $1 OR to_trainer_id = $2
      `;
      const countResult = await db.asyncGet(countQuery, [trainerId, trainerId]);
      const total = countResult ? countResult.total : 0;

      // Get trades with trainer names
      let query = `
        SELECT at.*,
               ft.name as from_trainer_name,
               tt.name as to_trainer_name
        FROM automated_trades at
        JOIN trainers ft ON at.from_trainer_id = ft.id
        JOIN trainers tt ON at.to_trainer_id = tt.id
        WHERE at.from_trainer_id = $1 OR at.to_trainer_id = $2
        ORDER BY at.executed_at DESC`;
      
      const params = [trainerId, trainerId];
      query += buildLimitOffset(limit, (page - 1) * limit, params);

      const trades = await db.asyncAll(query, params);

      // Parse JSON fields
      const processedTrades = trades.map(trade => ({
        ...trade,
        from_items: JSON.parse(trade.from_items || '{}'),
        to_items: JSON.parse(trade.to_items || '{}'),
        from_monsters: JSON.parse(trade.from_monsters || '[]'),
        to_monsters: JSON.parse(trade.to_monsters || '[]')
      }));

      return {
        data: processedTrades,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error getting trade history:', error);
      throw error;
    }
  }
}

module.exports = AutomatedTrade;
