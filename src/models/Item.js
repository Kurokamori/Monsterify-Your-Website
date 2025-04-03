const pool = require('../db');

class Item {
  /**
   * Get all items
   * @returns {Promise<Array>} Array of items
   */
  static async getAll() {
    try {
      // First, check the table structure
      console.log('Checking items table structure...');
      const tableQuery = `
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'items'
      `;
      const tableResult = await pool.query(tableQuery);
      console.log('Items table structure:', tableResult.rows);

      // Now get all items
      const query = 'SELECT * FROM items ORDER BY name';
      const result = await pool.query(query);

      if (result.rows.length > 0) {
        console.log(`Found ${result.rows.length} items. First item:`, result.rows[0]);
        console.log('First item base_price:', result.rows[0].base_price);
        console.log('First item base_price type:', typeof result.rows[0].base_price);
      } else {
        console.log('No items found in the database');
      }

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
      console.log(`Getting item by ID: ${itemId}`);
      const query = 'SELECT * FROM items WHERE name = $1';
      console.log(`Executing query: ${query} with param: ${itemId}`);
      const result = await pool.query(query, [itemId]);

      if (result.rows.length > 0) {
        console.log(`Found item ${itemId}:`, result.rows[0]);
        console.log(`Item ${itemId} base_price:`, result.rows[0].base_price);
        console.log(`Item ${itemId} base_price type:`, typeof result.rows[0].base_price);
      } else {
        console.log(`No item found with ID: ${itemId}`);
      }

      return result.rows[0];
    } catch (error) {
      console.error(`Error getting item ${itemId}:`, error);
      throw error;
    }
  }

  /**
   * Get items by category
   * @param {string} category - The item category
   * @returns {Promise<Array>} Array of items in the category
   */
  static async getByCategory(category) {
    try {
      console.log(`Getting items by category: ${category}`);

      // Handle null or undefined category
      if (!category) {
        console.error('Category parameter is null or undefined');
        return [];
      }

      // Convert category to uppercase for standardization
      const normalizedCategory = category.toUpperCase().trim();
      console.log(`Normalized category: ${normalizedCategory}`);

      // Try exact match first
      let query = 'SELECT * FROM items WHERE UPPER(category) = $1 ORDER BY name';
      console.log(`Executing exact match query for category ${normalizedCategory}:`, query);
      let result = await pool.query(query, [normalizedCategory]);

      // If no results, try a LIKE query
      if (result.rows.length === 0) {
        query = 'SELECT * FROM items WHERE UPPER(category) LIKE $1 ORDER BY name';
        console.log(`Executing LIKE query for category ${normalizedCategory}:`, query);
        result = await pool.query(query, [`%${normalizedCategory}%`]);
      }

      console.log(`Found ${result.rows.length} items for category ${normalizedCategory}:`, result.rows);

      if (result.rows.length > 0) {
        console.log('Sample item:', JSON.stringify(result.rows[0]));
      } else {
        console.log('No items found for category:', normalizedCategory);
      }

      // Ensure all items have a category property that matches the requested category
      return result.rows.map(item => ({
        ...item,
        category: normalizedCategory // Ensure consistent category format
      }));
    } catch (error) {
      console.error(`Error getting items by category ${category}:`, error);
      return [];
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