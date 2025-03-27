const pool = require('../db');
const Trainer = require('./Trainer');
const Monster = require('./Monster');

class Trade {
  /**
   * Create the trades table if it doesn't exist
   * @returns {Promise<void>}
   */
  static async createTableIfNotExists() {
    try {
      const query = `
        CREATE TABLE IF NOT EXISTS trades (
          trade_id SERIAL PRIMARY KEY,
          initiator_id INTEGER,
          recipient_id INTEGER,
          status VARCHAR(50) DEFAULT 'pending',
          offered_mons INTEGER[] DEFAULT '{}',
          offered_items JSONB DEFAULT '{}',
          requested_mons INTEGER[] DEFAULT '{}',
          requested_items JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_trades_initiator ON trades (initiator_id);
        CREATE INDEX IF NOT EXISTS idx_trades_recipient ON trades (recipient_id);
      `;

      await pool.query(query);
      console.log('Trades table created or already exists');
    } catch (error) {
      console.error('Error creating trades table:', error);
      throw error;
    }
  }

  /**
   * Get all trades
   * @returns {Promise<Array>} - Array of trades
   */
  static async getAll() {
    try {
      const query = 'SELECT * FROM trades ORDER BY created_at DESC';
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error getting all trades:', error);
      return [];
    }
  }

  /**
   * Get a trade by ID
   * @param {number} tradeId - Trade ID
   * @returns {Promise<Object|null>} - Trade object or null if not found
   */
  static async getById(tradeId) {
    try {
      const query = 'SELECT * FROM trades WHERE trade_id = $1';
      const result = await pool.query(query, [tradeId]);

      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error(`Error getting trade with ID ${tradeId}:`, error);
      return null;
    }
  }

  /**
   * Get trades for a trainer (either as initiator or recipient)
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Array>} - Array of trades
   */
  static async getByTrainerId(trainerId) {
    try {
      const query = `
        SELECT * FROM trades
        WHERE initiator_id = $1 OR recipient_id = $1
        ORDER BY created_at DESC
      `;
      const result = await pool.query(query, [trainerId]);
      return result.rows;
    } catch (error) {
      console.error(`Error getting trades for trainer ${trainerId}:`, error);
      return [];
    }
  }

  /**
   * Create a new trade
   * @param {Object} tradeData - Trade data
   * @returns {Promise<Object|null>} - Created trade or null if failed
   */
  static async create(tradeData) {
    try {
      // Validate required fields
      if (!tradeData.initiator_id || !tradeData.recipient_id) {
        throw new Error('Initiator and recipient IDs are required');
      }

      // Ensure at least one item is being traded
      const hasOfferedMons = tradeData.offered_mons && tradeData.offered_mons.length > 0;
      const hasOfferedItems = tradeData.offered_items && Object.keys(tradeData.offered_items).length > 0;
      const hasRequestedMons = tradeData.requested_mons && tradeData.requested_mons.length > 0;
      const hasRequestedItems = tradeData.requested_items && Object.keys(tradeData.requested_items).length > 0;

      if (!hasOfferedMons && !hasOfferedItems && !hasRequestedMons && !hasRequestedItems) {
        throw new Error('At least one monster or item must be included in the trade');
      }

      // Ensure arrays are properly formatted
      const offeredMons = Array.isArray(tradeData.offered_mons) ? tradeData.offered_mons : [];
      const requestedMons = Array.isArray(tradeData.requested_mons) ? tradeData.requested_mons : [];

      // Ensure JSON objects are properly formatted
      const offeredItems = typeof tradeData.offered_items === 'object' ? tradeData.offered_items : {};
      const requestedItems = typeof tradeData.requested_items === 'object' ? tradeData.requested_items : {};

      const query = `
        INSERT INTO trades (
          initiator_id, recipient_id, status,
          offered_mons, offered_items, requested_mons, requested_items
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const values = [
        tradeData.initiator_id,
        tradeData.recipient_id,
        tradeData.status || 'pending',
        offeredMons,
        JSON.stringify(offeredItems),
        requestedMons,
        JSON.stringify(requestedItems)
      ];

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating trade:', error);
      return null;
    }
  }

  /**
   * Update a trade's status
   * @param {number} tradeId - Trade ID
   * @param {string} status - New status ('pending', 'completed', 'cancelled')
   * @returns {Promise<Object|null>} - Updated trade or null if failed
   */
  static async updateStatus(tradeId, status) {
    try {
      const validStatuses = ['pending', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
      }

      const query = `
        UPDATE trades
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE trade_id = $2
        RETURNING *
      `;

      const result = await pool.query(query, [status, tradeId]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error(`Error updating status for trade ${tradeId}:`, error);
      return null;
    }
  }

  /**
   * Process a trade (transfer monsters and items between trainers)
   * @param {number} tradeId - Trade ID
   * @returns {Promise<Object>} - Result object with success status and message
   */
  static async processTrade(tradeId) {
    // Start a transaction
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get the trade
      const tradeQuery = 'SELECT * FROM trades WHERE trade_id = $1';
      const tradeResult = await client.query(tradeQuery, [tradeId]);
      const trade = tradeResult.rows[0];

      if (!trade) {
        throw new Error(`Trade with ID ${tradeId} not found`);
      }

      if (trade.status !== 'pending') {
        throw new Error(`Trade is already ${trade.status}`);
      }

      // Get the trainers
      const initiator = await Trainer.getById(trade.initiator_id);
      const recipient = await Trainer.getById(trade.recipient_id);

      if (!initiator || !recipient) {
        throw new Error('One or both trainers not found');
      }

      // Process monster transfers
      await this._processMonsterTransfers(client, trade, initiator, recipient);

      // Process item transfers
      await this._processItemTransfers(client, trade, initiator, recipient);

      // Update trade status to completed
      const updateQuery = `
        UPDATE trades
        SET status = 'completed', updated_at = CURRENT_TIMESTAMP
        WHERE trade_id = $1
        RETURNING *
      `;

      const updateResult = await client.query(updateQuery, [tradeId]);
      const updatedTrade = updateResult.rows[0];

      // Commit the transaction
      await client.query('COMMIT');

      return {
        success: true,
        message: 'Trade processed successfully',
        trade: updatedTrade
      };
    } catch (error) {
      // Rollback the transaction on error
      await client.query('ROLLBACK');
      console.error(`Error processing trade ${tradeId}:`, error);

      return {
        success: false,
        message: `Error processing trade: ${error.message}`,
        error
      };
    } finally {
      // Release the client back to the pool
      client.release();
    }
  }

  /**
   * Process monster transfers for a trade
   * @param {Object} client - Database client
   * @param {Object} trade - Trade object
   * @param {Object} initiator - Initiator trainer
   * @param {Object} recipient - Recipient trainer
   * @returns {Promise<void>}
   * @private
   */
  static async _processMonsterTransfers(client, trade, initiator, recipient) {
    // Transfer offered monsters from initiator to recipient
    if (trade.offered_mons && trade.offered_mons.length > 0) {
      for (const monId of trade.offered_mons) {
        // Verify monster belongs to initiator
        const monQuery = 'SELECT * FROM mons WHERE mon_id = $1';
        const monResult = await client.query(monQuery, [monId]);
        const monster = monResult.rows[0];

        if (!monster) {
          throw new Error(`Monster with ID ${monId} not found`);
        }

        if (monster.trainer_id !== initiator.id) {
          throw new Error(`Monster with ID ${monId} does not belong to initiator`);
        }

        // Update monster's trainer_id
        const updateQuery = `
          UPDATE mons
          SET trainer_id = $1, updated_at = CURRENT_TIMESTAMP
          WHERE mon_id = $2
        `;

        await client.query(updateQuery, [recipient.id, monId]);
      }
    }

    // Transfer requested monsters from recipient to initiator
    if (trade.requested_mons && trade.requested_mons.length > 0) {
      for (const monId of trade.requested_mons) {
        // Verify monster belongs to recipient
        const monQuery = 'SELECT * FROM mons WHERE mon_id = $1';
        const monResult = await client.query(monQuery, [monId]);
        const monster = monResult.rows[0];

        if (!monster) {
          throw new Error(`Monster with ID ${monId} not found`);
        }

        if (monster.trainer_id !== recipient.id) {
          throw new Error(`Monster with ID ${monId} does not belong to recipient`);
        }

        // Update monster's trainer_id
        const updateQuery = `
          UPDATE mons
          SET trainer_id = $1, updated_at = CURRENT_TIMESTAMP
          WHERE mon_id = $2
        `;

        await client.query(updateQuery, [initiator.id, monId]);
      }
    }
  }

  /**
   * Process item transfers for a trade
   * @param {Object} client - Database client
   * @param {Object} trade - Trade object
   * @param {Object} initiator - Initiator trainer
   * @param {Object} recipient - Recipient trainer
   * @returns {Promise<void>}
   * @private
   */
  static async _processItemTransfers(client, trade, initiator, recipient) {
    // Transfer offered items from initiator to recipient
    if (trade.offered_items && Object.keys(trade.offered_items).length > 0) {
      const offeredItems = typeof trade.offered_items === 'string'
        ? JSON.parse(trade.offered_items)
        : trade.offered_items;

      for (const [category, items] of Object.entries(offeredItems)) {
        for (const [itemName, quantity] of Object.entries(items)) {
          // Remove items from initiator
          await Trainer.updateInventoryItem(initiator.id, category, itemName, -quantity);

          // Add items to recipient
          await Trainer.updateInventoryItem(recipient.id, category, itemName, quantity);
        }
      }
    }

    // Transfer requested items from recipient to initiator
    if (trade.requested_items && Object.keys(trade.requested_items).length > 0) {
      const requestedItems = typeof trade.requested_items === 'string'
        ? JSON.parse(trade.requested_items)
        : trade.requested_items;

      for (const [category, items] of Object.entries(requestedItems)) {
        for (const [itemName, quantity] of Object.entries(items)) {
          // Remove items from recipient
          await Trainer.updateInventoryItem(recipient.id, category, itemName, -quantity);

          // Add items to initiator
          await Trainer.updateInventoryItem(initiator.id, category, itemName, quantity);
        }
      }
    }
  }

  /**
   * Cancel a trade
   * @param {number} tradeId - Trade ID
   * @returns {Promise<Object|null>} - Cancelled trade or null if failed
   */
  static async cancelTrade(tradeId) {
    try {
      return await this.updateStatus(tradeId, 'cancelled');
    } catch (error) {
      console.error(`Error cancelling trade ${tradeId}:`, error);
      return null;
    }
  }

  /**
   * Delete a trade
   * @param {number} tradeId - Trade ID
   * @returns {Promise<boolean>} - Success status
   */
  static async delete(tradeId) {
    try {
      const query = 'DELETE FROM trades WHERE trade_id = $1 RETURNING trade_id';
      const result = await pool.query(query, [tradeId]);

      return result.rows.length > 0;
    } catch (error) {
      console.error(`Error deleting trade ${tradeId}:`, error);
      return false;
    }
  }
}

module.exports = Trade;
