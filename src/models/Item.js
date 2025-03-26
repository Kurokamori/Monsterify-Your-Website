const db = require('../db');

class Item {
  /**
   * Get all items
   * @returns {Promise<Array>} Array of items
   */
  static async getAll() {
    try {
      const query = 'SELECT * FROM items ORDER BY name';
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error getting all items:', error);
      throw error;
    }
  }

  /**
   * Get an item by ID
   * @param {string} itemId - The item ID
   * @returns {Promise<Object>} Item object
   */
  static async getById(itemId) {
    try {
      const query = 'SELECT * FROM items WHERE name = $1';
      const result = await db.query(query, [itemId]);
      return result.rows[0];
    } catch (error) {
      console.error(`Error getting item ${itemId}:`, error);
      throw error;
    }
  }

  /**
   * Get items by category
   * @param {string} category - The category
   * @returns {Promise<Array>} Array of items
   */
  static async getByCategory(category) {
    try {
      const query = 'SELECT * FROM items WHERE category = $1 ORDER BY name';
      console.log(`Executing query for category ${category}:`, query);
      const result = await db.query(query, [category]);
      console.log(`Found ${result.rows.length} items for category ${category}:`, result.rows);
      return result.rows;
    } catch (error) {
      console.error(`Error getting items by category ${category}:`, error);
      throw error;
    }
  }

  /**
   * Create a new item
   * @param {Object} itemData - The item data
   * @returns {Promise<Object>} Created item
   */
  static async create(itemData) {
    try {
      const {
        name,
        description,
        image_url,
        category,
        type,
        rarity,
        effect,
        base_price
      } = itemData;

      const query = `
        INSERT INTO items (
          name, description, image_url, category, type, rarity,
          effect, base_price
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const values = [
        name,
        description,
        image_url,
        category,
        type,
        rarity,
        effect,
        base_price
      ];

      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating item:', error);
      throw error;
    }
  }

  /**
   * Update an item
   * @param {string} itemId - The item ID
   * @param {Object} itemData - The item data to update
   * @returns {Promise<Object>} Updated item
   */
  static async update(itemId, itemData) {
    try {
      const columns = [];
      const values = [];
      let paramIndex = 1;

      // Build the SET clause dynamically based on provided data
      for (const [key, value] of Object.entries(itemData)) {
        if (value !== undefined && key !== 'name') {
          columns.push(`${key} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      }

      // Add the item_id as the last parameter
      values.push(itemId);

      const query = `
        UPDATE items
        SET ${columns.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE name = $${paramIndex}
        RETURNING *
      `;

      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error(`Error updating item ${itemId}:`, error);
      throw error;
    }
  }

  /**
   * Delete an item
   * @param {string} itemId - The item ID
   * @returns {Promise<boolean>} True if deleted
   */
  static async delete(itemId) {
    try {
      const query = 'DELETE FROM items WHERE name = $1 RETURNING *';
      const result = await db.query(query, [itemId]);
      return result.rows.length > 0;
    } catch (error) {
      console.error(`Error deleting item ${itemId}:`, error);
      throw error;
    }
  }
}

module.exports = Item;