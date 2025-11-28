const db = require('../config/db');
const Monster = require('./Monster');
const Trainer = require('./Trainer');
const TrainerInventory = require('./TrainerInventory');
const { buildLimitOffset } = require('../utils/dbUtils');

/**
 * Trade model
 */
class Trade {
  /**
   * Get all trades
   * @param {Object} options - Query options
   * @param {number} options.page - Page number (1-based)
   * @param {number} options.limit - Number of items per page
   * @param {string} options.status - Trade status filter
   * @returns {Promise<Object>} - Object containing trades and pagination info
   */
  static async getAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        status = 'pending'
      } = options;

      // Build query
      let query = `
        SELECT t.*, 
               it.name as initiator_trainer_name,
               rt.name as recipient_trainer_name
        FROM trades t
        JOIN trainers it ON t.initiator_trainer_id = it.id
        LEFT JOIN trainers rt ON t.recipient_trainer_id = rt.id
      `;
      const params = [];

      // Add status condition
      if (status && status !== 'all') {
        query += ' WHERE t.status = $1';
        params.push(status);
      }

      // Count total records for pagination
      const countQuery = query.replace('SELECT t.*, it.name as initiator_trainer_name, rt.name as recipient_trainer_name', 'SELECT COUNT(*) as total');
      const countResult = await db.asyncGet(countQuery, params);
      const total = countResult ? countResult.total : 0;

      // Add sorting and pagination
      query += ' ORDER BY t.created_at DESC';
      query += buildLimitOffset(limit, (page - 1) * limit, params);

      // Execute the query
      const trades = await db.asyncAll(query, params);

      // Process trades to include monster and item details
      const processedTrades = await Promise.all(trades.map(async (trade) => {
        const processedTrade = { ...trade };

        // Parse JSON fields
        try {
          processedTrade.initiator_monsters = JSON.parse(trade.initiator_monsters || '[]');
          processedTrade.recipient_monsters = JSON.parse(trade.recipient_monsters || '[]');
          processedTrade.initiator_items = JSON.parse(trade.initiator_items || '{}');
          processedTrade.recipient_items = JSON.parse(trade.recipient_items || '{}');
        } catch (e) {
          console.error('Error parsing trade JSON fields:', e);
          processedTrade.initiator_monsters = [];
          processedTrade.recipient_monsters = [];
          processedTrade.initiator_items = {};
          processedTrade.recipient_items = {};
        }

        // Get monster details
        if (processedTrade.initiator_monsters.length > 0) {
          const monsterIds = processedTrade.initiator_monsters;
          const monsters = await Promise.all(monsterIds.map(id => Monster.getById(id)));
          processedTrade.initiator_monster_details = monsters.filter(m => m);
        } else {
          processedTrade.initiator_monster_details = [];
        }

        if (processedTrade.recipient_monsters.length > 0) {
          const monsterIds = processedTrade.recipient_monsters;
          const monsters = await Promise.all(monsterIds.map(id => Monster.getById(id)));
          processedTrade.recipient_monster_details = monsters.filter(m => m);
        } else {
          processedTrade.recipient_monster_details = [];
        }

        return processedTrade;
      }));

      // Calculate total pages
      const totalPages = Math.ceil(total / limit);

      return {
        data: processedTrades,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages
      };
    } catch (error) {
      console.error('Error getting all trades:', error);
      throw error;
    }
  }

  /**
   * Get trade by ID
   * @param {number} id - Trade ID
   * @returns {Promise<Object>} - Trade object
   */
  static async getById(id) {
    try {
      const query = `
        SELECT t.*, 
               it.name as initiator_trainer_name,
               rt.name as recipient_trainer_name
        FROM trades t
        JOIN trainers it ON t.initiator_trainer_id = it.id
        LEFT JOIN trainers rt ON t.recipient_trainer_id = rt.id
        WHERE t.id = $1
      `;
      const trade = await db.asyncGet(query, [id]);

      if (!trade) {
        return null;
      }

      // Parse JSON fields
      try {
        trade.initiator_monsters = JSON.parse(trade.initiator_monsters || '[]');
        trade.recipient_monsters = JSON.parse(trade.recipient_monsters || '[]');
        trade.initiator_items = JSON.parse(trade.initiator_items || '{}');
        trade.recipient_items = JSON.parse(trade.recipient_items || '{}');
      } catch (e) {
        console.error('Error parsing trade JSON fields:', e);
        trade.initiator_monsters = [];
        trade.recipient_monsters = [];
        trade.initiator_items = {};
        trade.recipient_items = {};
      }

      // Get monster details
      if (trade.initiator_monsters.length > 0) {
        const monsterIds = trade.initiator_monsters;
        const monsters = await Promise.all(monsterIds.map(id => Monster.getById(id)));
        trade.initiator_monster_details = monsters.filter(m => m);
      } else {
        trade.initiator_monster_details = [];
      }

      if (trade.recipient_monsters.length > 0) {
        const monsterIds = trade.recipient_monsters;
        const monsters = await Promise.all(monsterIds.map(id => Monster.getById(id)));
        trade.recipient_monster_details = monsters.filter(m => m);
      } else {
        trade.recipient_monster_details = [];
      }

      return trade;
    } catch (error) {
      console.error(`Error getting trade with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new trade
   * @param {Object} trade - Trade data
   * @returns {Promise<Object>} - Created trade
   */
  static async create(trade) {
    try {
      const query = `
        INSERT INTO trades (
          title, initiator_trainer_id, recipient_trainer_id,
          initiator_monsters, recipient_monsters,
          initiator_items, recipient_items,
          notes, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `;

      const params = [
        trade.title,
        trade.initiator_trainer_id,
        trade.recipient_trainer_id || null,
        JSON.stringify(trade.initiator_monsters || []),
        JSON.stringify(trade.recipient_monsters || []),
        JSON.stringify(trade.initiator_items || {}),
        JSON.stringify(trade.recipient_items || {}),
        trade.notes || '',
        trade.status || 'pending'
      ];

      const result = await db.asyncRun(query, params);
      return { id: result.lastID, ...trade };
    } catch (error) {
      console.error('Error creating trade:', error);
      throw error;
    }
  }

  /**
   * Update a trade
   * @param {number} id - Trade ID
   * @param {Object} trade - Trade data
   * @returns {Promise<Object>} - Updated trade
   */
  static async update(id, trade) {
    try {
      // Get current trade
      const currentTrade = await this.getById(id);
      if (!currentTrade) {
        throw new Error(`Trade with ID ${id} not found`);
      }

      // Build query dynamically based on provided fields
      const fields = Object.keys(trade);
      if (fields.length === 0) {
        return currentTrade; // Nothing to update
      }

      const setClause = fields.map(field => {
        // Handle JSON fields
        if (['initiator_monsters', 'recipient_monsters', 'initiator_items', 'recipient_items'].includes(field)) {
          return `${field} = ?`;
        }
        return `${field} = ?`;
      }).join(', ');

      const values = fields.map(field => {
        // Stringify JSON fields
        if (['initiator_monsters', 'recipient_monsters', 'initiator_items', 'recipient_items'].includes(field)) {
          return JSON.stringify(trade[field]);
        }
        return trade[field];
      });
      values.push(id);

      const query = `
        UPDATE trades
        SET ${setClause}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `;

      await db.asyncRun(query, values);

      // Return the updated trade
      return await this.getById(id);
    } catch (error) {
      console.error(`Error updating trade with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Process a trade (transfer monsters and items)
   * @param {number} id - Trade ID
   * @returns {Promise<Object>} - Processed trade
   */
  static async processTrade(id) {
    try {
      // Start a transaction
      await db.asyncRun('BEGIN TRANSACTION');

      // Get trade
      const trade = await this.getById(id);
      if (!trade) {
        throw new Error(`Trade with ID ${id} not found`);
      }

      // Check if trade is in offered status
      if (trade.status !== 'offered') {
        throw new Error(`Trade with ID ${id} is not in offered status`);
      }

      // Get trainer data to get player_user_id for proper ownership transfer
      const initiatorTrainer = await Trainer.getById(trade.initiator_trainer_id);
      const recipientTrainer = await Trainer.getById(trade.recipient_trainer_id);

      if (!initiatorTrainer || !recipientTrainer) {
        throw new Error('One or both trainers not found');
      }

      // Transfer monsters
      if (trade.initiator_monsters.length > 0) {
        for (const monsterId of trade.initiator_monsters) {
          // Update both trainer_id and player_user_id for proper ownership transfer
          const query = `
            UPDATE monsters
            SET trainer_id = $1, player_user_id = $2, updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
          `;
          await db.asyncRun(query, [trade.recipient_trainer_id, recipientTrainer.player_user_id, monsterId]);
        }
      }

      if (trade.recipient_monsters.length > 0) {
        for (const monsterId of trade.recipient_monsters) {
          // Update both trainer_id and player_user_id for proper ownership transfer
          const query = `
            UPDATE monsters
            SET trainer_id = $1, player_user_id = $2, updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
          `;
          await db.asyncRun(query, [trade.initiator_trainer_id, initiatorTrainer.player_user_id, monsterId]);
        }
      }

      // Transfer items
      if (Object.keys(trade.initiator_items).length > 0) {
        const initiatorInventory = await TrainerInventory.getByTrainerId(trade.initiator_trainer_id);
        const recipientInventory = await TrainerInventory.getByTrainerId(trade.recipient_trainer_id);

        for (const [itemName, quantity] of Object.entries(trade.initiator_items)) {
          // Remove from initiator
          await TrainerInventory.updateItemQuantity(
            initiatorInventory.id,
            'items',
            itemName,
            (initiatorInventory.items[itemName] || 0) - quantity
          );

          // Add to recipient
          await TrainerInventory.updateItemQuantity(
            recipientInventory.id,
            'items',
            itemName,
            (recipientInventory.items[itemName] || 0) + quantity
          );
        }
      }

      if (Object.keys(trade.recipient_items).length > 0) {
        const initiatorInventory = await TrainerInventory.getByTrainerId(trade.initiator_trainer_id);
        const recipientInventory = await TrainerInventory.getByTrainerId(trade.recipient_trainer_id);

        for (const [itemName, quantity] of Object.entries(trade.recipient_items)) {
          // Remove from recipient
          await TrainerInventory.updateItemQuantity(
            recipientInventory.id,
            'items',
            itemName,
            (recipientInventory.items[itemName] || 0) - quantity
          );

          // Add to initiator
          await TrainerInventory.updateItemQuantity(
            initiatorInventory.id,
            'items',
            itemName,
            (initiatorInventory.items[itemName] || 0) + quantity
          );
        }
      }

      // Update trade status
      await this.update(id, {
        status: 'completed'
      });

      // Commit transaction
      await db.asyncRun('COMMIT');

      // Return the updated trade
      return await this.getById(id);
    } catch (error) {
      // Rollback transaction
      await db.asyncRun('ROLLBACK');
      console.error(`Error processing trade with ID ${id}:`, error);
      throw error;
    }
  }
}

module.exports = Trade;
