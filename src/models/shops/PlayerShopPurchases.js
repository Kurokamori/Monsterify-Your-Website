const pool = require('../../db');

class PlayerShopPurchases {
  /**
   * Check if a column exists in a table
   * @param {string} tableName - The table name
   * @param {string} columnName - The column name
   * @returns {Promise<boolean>} True if the column exists, false otherwise
   */
  static async columnExists(tableName, columnName) {
    try {
      const query = `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = $1 AND column_name = $2
      `;
      const result = await pool.query(query, [tableName, columnName]);
      return result.rows.length > 0;
    } catch (error) {
      console.error(`Error checking if column ${columnName} exists in table ${tableName}:`, error);
      return false;
    }
  }

  /**
   * Record a player purchase from a shop
   * @param {string} playerId - The player ID
   * @param {string} shopId - The shop ID
   * @param {string} itemId - The item ID
   * @param {number} quantity - The quantity purchased
   * @param {string} date - The date in YYYY-MM-DD format
   * @returns {Promise<Object>} The purchase record
   */
  static async recordPurchase(playerId, shopId, itemId, quantity, date = null) {
    try {
      // If no date is provided, use today
      const targetDate = date || new Date().toISOString().split('T')[0];
      console.log(`Recording purchase: player=${playerId}, shop=${shopId}, item=${itemId}, quantity=${quantity}, date=${targetDate}`);

      // Check if there is an existing purchase record for today
      const checkQuery = `
        SELECT id, quantity
        FROM player_shop_purchases
        WHERE player_id = $1 AND shop_id = $2 AND item_id = $3 AND date = $4
      `;

      console.log(`Checking for existing purchase with params: [${playerId}, ${shopId}, ${itemId}, ${targetDate}]`);

      const checkResult = await pool.query(checkQuery, [playerId, shopId, itemId, targetDate]);

      if (checkResult.rows.length > 0) {
        // Update existing record
        const existingRecord = checkResult.rows[0];
        const newQuantity = parseInt(existingRecord.quantity) + parseInt(quantity);
        console.log(`Updating existing purchase record: id=${existingRecord.id}, current quantity=${existingRecord.quantity}, new quantity=${newQuantity}`);

        // Check if updated_at column exists in the table
        const hasUpdatedAtColumn = await this.columnExists('player_shop_purchases', 'updated_at');

        // Use different update query based on whether updated_at column exists
        const updateQuery = hasUpdatedAtColumn ?
          `
            UPDATE player_shop_purchases
            SET quantity = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *
          ` :
          `
            UPDATE player_shop_purchases
            SET quantity = $1
            WHERE id = $2
            RETURNING *
          `;

        const updateResult = await pool.query(updateQuery, [newQuantity, existingRecord.id]);
        return updateResult.rows[0];
      } else {
        // Create new record
        console.log(`Creating new purchase record for player ${playerId}, shop ${shopId}, item ${itemId}, quantity ${quantity}`);

        // Check if timestamp columns exist in the table
        const hasUpdatedAtColumn = await this.columnExists('player_shop_purchases', 'updated_at');
        const hasCreatedAtColumn = await this.columnExists('player_shop_purchases', 'created_at');

        // Use different insert query based on whether updated_at column exists
        const insertQuery = hasUpdatedAtColumn ?
          `
            INSERT INTO player_shop_purchases (player_id, shop_id, item_id, quantity, date, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING *
          ` :
          `
            INSERT INTO player_shop_purchases (player_id, shop_id, item_id, quantity, date)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
          `;

        const insertResult = await pool.query(insertQuery, [playerId, shopId, itemId, quantity, targetDate]);
        return insertResult.rows[0];
      }
    } catch (error) {
      console.error(`Error recording purchase for player ${playerId}, shop ${shopId}, item ${itemId}:`, error);
      throw error;
    }
  }

  /**
   * Get purchase history for a player
   * @param {string} playerId - The player ID
   * @param {string} date - The date in YYYY-MM-DD format
   * @returns {Promise<Array>} Array of purchase records
   */
  static async getPlayerPurchases(playerId, date = null) {
    try {
      // If no date is provided, use today
      const targetDate = date || new Date().toISOString().split('T')[0];

      const query = `
        SELECT psp.*, i.name as item_name, i.effect as item_description,
        i.icon as item_image, i.rarity as item_rarity, i.category as item_type,
        sc.name as shop_name
        FROM player_shop_purchases psp
        JOIN items i ON psp.item_id = i.name
        JOIN shop_config sc ON psp.shop_id = sc.shop_id
        WHERE psp.player_id = $1 AND psp.date = $2
        ORDER BY psp.created_at DESC
      `;

      const result = await pool.query(query, [playerId, targetDate]);
      return result.rows;
    } catch (error) {
      console.error(`Error getting purchase history for player ${playerId}:`, error);
      throw error;
    }
  }

  /**
   * Get total purchases for a player on a specific date
   * @param {string} playerId - The player ID
   * @param {string} date - The date in YYYY-MM-DD format
   * @returns {Promise<Object>} Total purchases by shop
   */
  static async getTotalPurchases(playerId, date = null) {
    try {
      // If no date is provided, use today
      const targetDate = date || new Date().toISOString().split('T')[0];

      const query = `
        SELECT shop_id, SUM(quantity) as total_quantity, COUNT(DISTINCT item_id) as unique_items
        FROM player_shop_purchases
        WHERE player_id = $1 AND date = $2
        GROUP BY shop_id
      `;

      const result = await pool.query(query, [playerId, targetDate]);

      // Convert to object with shop_id as key
      const totals = {};
      result.rows.forEach(row => {
        totals[row.shop_id] = {
          total_quantity: parseInt(row.total_quantity),
          unique_items: parseInt(row.unique_items)
        };
      });

      return totals;
    } catch (error) {
      console.error(`Error getting total purchases for player ${playerId}:`, error);
      throw error;
    }
  }

  /**
   * Get purchase history for a trainer
   * @param {number} trainerId - Trainer ID
   * @param {string} date - The date in YYYY-MM-DD format
   * @returns {Promise<Array>} Array of purchase records
   */
  static async getByTrainerId(trainerId, date = null) {
    try {
      // If no date is provided, use today
      const targetDate = date || new Date().toISOString().split('T')[0];

      // Get trainer to get player ID
      const trainerQuery = `
        SELECT player_user_id FROM trainers WHERE id = $1
      `;

      const trainerResult = await pool.query(trainerQuery, [trainerId]);

      if (trainerResult.rows.length === 0) {
        return [];
      }

      const playerId = trainerResult.rows[0].player_user_id;

      // If no player ID, return empty array
      if (!playerId) {
        return [];
      }

      // Get purchase history
      const purchaseQuery = `
        SELECT psp.item_id, psp.quantity, psp.date
        FROM player_shop_purchases psp
        WHERE psp.player_id = $1 AND psp.date = $2
      `;

      const result = await pool.query(purchaseQuery, [playerId, targetDate]);
      return result.rows;
    } catch (error) {
      console.error('Error getting purchase history:', error);
      return [];
    }
  }

  /**
   * Get purchase history for a player
   * @param {string} playerId - The player ID
   * @param {string} date - The date in YYYY-MM-DD format
   * @returns {Promise<Array>} Array of purchase records
   */
  static async getByPlayerId(playerId, date = null) {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];

      const query = `
        SELECT item_id, quantity, date
        FROM player_shop_purchases
        WHERE player_id = $1 AND date = $2
      `;

      const result = await pool.query(query, [playerId, targetDate]);
      return result.rows;
    } catch (error) {
      console.error('Error getting player shop purchases:', error);
      return [];
    }
  }
}

module.exports = PlayerShopPurchases;


