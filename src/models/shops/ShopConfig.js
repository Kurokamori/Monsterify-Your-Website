const pool = require('../../db');

class ShopConfig {
  /**
   * Get all active shops
   * @returns {Promise<Array>} Array of shop configurations
   */
  static async getAllActive() {
    try {
      const query = `SELECT * FROM shop_config WHERE is_active = true ORDER BY name`;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error getting active shops:', error);
      throw error;
    }
  }

  /**
   * Get a shop by ID
   * @param {string} shopId - The shop ID
   * @returns {Promise<Object>} Shop configuration
   */
  static async getById(shopId) {
    try {
      const query = `SELECT * FROM shop_config WHERE shop_id = $1`;
      const result = await pool.query(query, [shopId]);
      return result.rows[0];
    } catch (error) {
      console.error(`Error getting shop ${shopId}:`, error);
      return null; // Return null instead of throwing error for better error handling
    }
  }

  /**
   * Create a new shop
   * @param {Object} shopData - The shop data
   * @returns {Promise<Object>} Created shop
   */
  static async create(shopData) {
    try {
      const {
        shop_id,
        name,
        description,
        image_url,
        category,
        price_multiplier_min,
        price_multiplier_max,
        min_items,
        max_items,
        restock_hour,
        is_active
      } = shopData;

      const query = `
        INSERT INTO shop_config (
          shop_id, name, description, image_url, category,
          price_multiplier_min, price_multiplier_max, min_items, max_items,
          restock_hour, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;

      const values = [
        shop_id,
        name,
        description,
        image_url,
        category,
        price_multiplier_min,
        price_multiplier_max,
        min_items,
        max_items,
        restock_hour,
        is_active
      ];

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating shop:', error);
      throw error;
    }
  }

  /**
   * Update a shop
   * @param {string} shopId - The shop ID
   * @param {Object} shopData - The shop data to update
   * @returns {Promise<Object>} Updated shop
   */
  static async update(shopId, shopData) {
    try {
      const columns = [];
      const values = [];
      let paramIndex = 1;

      // Build the SET clause dynamically based on provided data
      for (const [key, value] of Object.entries(shopData)) {
        if (value !== undefined && key !== 'shop_id') {
          columns.push(`${key} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      }

      // Add the shop_id as the last parameter
      values.push(shopId);

      const query = `
        UPDATE shop_config
        SET ${columns.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE shop_id = $${paramIndex}
        RETURNING *
      `;

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error(`Error updating shop ${shopId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a shop
   * @param {string} shopId - The shop ID
   * @returns {Promise<boolean>} True if deleted
   */
  static async delete(shopId) {
    try {
      const query = `DELETE FROM shop_config WHERE shop_id = $1 RETURNING *`;
      const result = await pool.query(query, [shopId]);
      return result.rows.length > 0;
    } catch (error) {
      console.error(`Error deleting shop ${shopId}:`, error);
      throw error;
    }
  }
}

module.exports = ShopConfig;
