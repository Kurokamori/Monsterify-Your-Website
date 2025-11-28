const db = require('../config/db');
const { buildLimitOffset, isPostgreSQL } = require('../utils/dbUtils');

/**
 * Item model
 */
class Item {
  /**
   * Get all items with pagination and filtering
   * @param {Object} options - Query options
   * @param {number} options.page - Page number
   * @param {number} options.limit - Items per page
   * @param {string} options.search - Search term
   * @param {string} options.sortBy - Sort field
   * @param {string} options.sortOrder - Sort order (asc/desc)
   * @param {string} options.category - Filter by category
   * @param {string} options.type - Filter by type
   * @param {string} options.rarity - Filter by rarity
   * @returns {Promise<{data: Array, total: number, page: number, limit: number, totalPages: number}>}
   */
  static async getAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        sortBy = 'name',
        sortOrder = 'asc',
        category = '',
        type = '',
        rarity = ''
      } = options;

      // Build the query
      let query = 'SELECT * FROM items WHERE 1=1';
      const params = [];

      // Add search condition
      if (search) {
        query += ' AND (name LIKE $1 OR description LIKE $2)';
        params.push(`%${search}%`, `%${search}%`);
      }

      // Add category filter
      if (category) {
        query += ' AND category =$1';
        params.push(category);
      }

      // Add type filter
      if (type) {
        query += ' AND type =$1';
        params.push(type);
      }

      // Add rarity filter
      if (rarity) {
        query += ' AND rarity =$1';
        params.push(rarity);
      }

      // Count total records for pagination
      const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
      const countResult = await db.asyncGet(countQuery, params);
      const total = countResult ? countResult.total : 0;

      // Add sorting and pagination
      query += ` ORDER BY ${sortBy} ${sortOrder === 'desc' ? 'DESC' : 'ASC'}`;
      query += buildLimitOffset(limit, (page - 1) * limit, params);

      // Execute the query
      const data = await db.asyncAll(query, params);

      // Calculate total pages
      const totalPages = Math.ceil(total / limit);

      return {
        data,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages
      };
    } catch (error) {
      console.error('Error getting all items:', error);
      throw error;
    }
  }

  /**
   * Get all categories
   * @returns {Promise<Array>} Categories
   */
  static async getAllCategories() {
    try {
      const query = 'SELECT DISTINCT category FROM items ORDER BY category ASC';
      return await db.asyncAll(query);
    } catch (error) {
      console.error('Error getting all categories:', error);
      throw error;
    }
  }

  /**
   * Get all types
   * @returns {Promise<Array>} Types
   */
  static async getAllTypes() {
    try {
      const query = 'SELECT DISTINCT type FROM items WHERE type IS NOT NULL ORDER BY type ASC';
      return await db.asyncAll(query);
    } catch (error) {
      console.error('Error getting all types:', error);
      throw error;
    }
  }

  /**
   * Get all rarities
   * @returns {Promise<Array>} Rarities
   */
  static async getAllRarities() {
    try {
      const query = 'SELECT DISTINCT rarity FROM items WHERE rarity IS NOT NULL ORDER BY rarity ASC';
      return await db.asyncAll(query);
    } catch (error) {
      console.error('Error getting all rarities:', error);
      throw error;
    }
  }

  /**
   * Get an item by ID
   * @param {number} id - Item ID
   * @returns {Promise<Object>} Item
   */
  static async getById(id) {
    try {
      const query = 'SELECT * FROM items WHERE id =$1';
      return await db.asyncGet(query, [id]);
    } catch (error) {
      console.error(`Error getting item with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get items by category
   * @param {string} category - Item category
   * @returns {Promise<Array>} Array of items
   */
  static async getByCategory(category) {
    try {
      const query = 'SELECT * FROM items WHERE category =$1 ORDER BY name ASC';
      const items = await db.asyncAll(query, [category]);
      return items;
    } catch (error) {
      console.error(`Error getting items with category ${category}:`, error);
      throw error;
    }
  }

  /**
   * Get an item by name
   * @param {string} name - Item name
   * @returns {Promise<Object|null>} Item or null if not found
   */
  static async getByName(name) {
    try {
      const query = 'SELECT * FROM items WHERE name =$1';
      return await db.asyncGet(query, [name]);
    } catch (error) {
      console.error(`Error getting item with name ${name}:`, error);
      throw error;
    }
  }

  /**
   * Get items by multiple names
   * @param {Array<string>} names - Array of item names
   * @returns {Promise<Array>} Array of items
   */
  static async getByNames(names) {
    try {
      if (!names || names.length === 0) {
        return [];
      }
      
      const placeholders = names.map((_, index) => `$${index + 1}`).join(', ');
      const query = `SELECT * FROM items WHERE name IN (${placeholders}) ORDER BY name ASC`;
      return await db.asyncAll(query, names);
    } catch (error) {
      console.error(`Error getting items with names ${names.join(', ')}:`, error);
      throw error;
    }
  }

  /**
   * Create a new item
   * @param {Object} item - Item data
   * @returns {Promise<Object>} Created item
   */
  static async create(item) {
    try {
      const params = [
        item.name,
        item.description,
        item.image_url,
        item.category,
        item.type,
        item.rarity,
        item.effect,
        item.base_price || 0
      ];

      let query, result, itemId;

      if (isPostgreSQL) {
        // PostgreSQL: Use RETURNING clause to get the inserted ID
        query = `
          INSERT INTO items (
            name, description, image_url, category, type, rarity, effect, base_price
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id
        `;

        result = await db.asyncRun(query, params);
        itemId = result.rows[0].id;
      } else {
        // SQLite: Use lastID from result
        query = `
          INSERT INTO items (
            name, description, image_url, category, type, rarity, effect, base_price
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `;

        result = await db.asyncRun(query, params);
        itemId = result.lastID;
      }

      return { id: itemId, ...item };
    } catch (error) {
      console.error('Error creating item:', error);
      throw error;
    }
  }

  /**
   * Create multiple items
   * @param {Array<Object>} items - Array of item data
   * @returns {Promise<Array<Object>>} Created items
   */
  static async createBulk(items) {
    try {
      // Start a transaction
      await db.asyncRun('BEGIN TRANSACTION');

      const createdItems = [];
      for (const item of items) {
        const query = `
          INSERT INTO items (
            name, description, image_url, category, type, rarity, effect, base_price
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `;

        const params = [
          item.name,
          item.description,
          item.image_url,
          item.category,
          item.type,
          item.rarity,
          item.effect,
          item.base_price || 0
        ];

        const result = await db.asyncRun(query, params);
        createdItems.push({ id: result.lastID, ...item });
      }

      // Commit the transaction
      await db.asyncRun('COMMIT');

      return createdItems;
    } catch (error) {
      // Rollback the transaction on error
      await db.asyncRun('ROLLBACK');
      console.error('Error creating items in bulk:', error);
      throw error;
    }
  }

  /**
   * Update an item
   * @param {number} id - Item ID
   * @param {Object} item - Item data
   * @returns {Promise<Object>} Updated item
   */
  static async update(id, item) {
    try {
      const query = `
        UPDATE items SET
          name = $1, description = $2, image_url = $3, category = $4,
          type = $5, rarity = $6, effect = $7, base_price = $8
        WHERE id = $9
      `;

      const params = [
        item.name,
        item.description,
        item.image_url,
        item.category,
        item.type,
        item.rarity,
        item.effect,
        item.base_price || 0,
        id
      ];

      await db.asyncRun(query, params);
      return { id, ...item };
    } catch (error) {
      console.error(`Error updating item with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete an item
   * @param {number} id - Item ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    try {
      const query = 'DELETE FROM items WHERE id =$1';
      await db.asyncRun(query, [id]);
      return true;
    } catch (error) {
      console.error(`Error deleting item with ID ${id}:`, error);
      throw error;
    }
  }
}

module.exports = Item;
