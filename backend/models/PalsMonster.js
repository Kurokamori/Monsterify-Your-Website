const db = require('../config/db');
const { buildLimitOffset } = require('../utils/dbUtils');

/**
 * Pals Monster model
 */
class PalsMonster {
  /**
   * Get all Pals monsters with pagination and filtering
   * @param {Object} options - Query options
   * @param {number} options.page - Page number
   * @param {number} options.limit - Items per page
   * @param {string} options.search - Search term
   * @param {string} options.sortBy - Sort field
   * @param {string} options.sortOrder - Sort order (asc/desc)
   * @returns {Promise<{data: Array, total: number, page: number, limit: number, totalPages: number}>}
   */
  static async getAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        sortBy = 'name',
        sortOrder = 'asc'
      } = options;

      // Build the query
      let query = 'SELECT * FROM pals_monsters WHERE 1=1';
      const params = [];

      // Add search condition
      if (search) {
        query += ' AND name LIKE $' + (params.length + 1);
        params.push(`%${search}%`);
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
      console.error('Error getting all Pals monsters:', error);
      throw error;
    }
  }

  /**
   * Get a Pals monster by ID
   * @param {number} id - Pals monster ID
   * @returns {Promise<Object>} Pals monster
   */
  static async getById(id) {
    try {
      const query = 'SELECT * FROM pals_monsters WHERE id = $1';
      return await db.asyncGet(query, [id]);
    } catch (error) {
      console.error(`Error getting Pals monster with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new Pals monster
   * @param {Object} pals - Pals monster data
   * @returns {Promise<Object>} Created Pals monster
   */
  static async create(pals) {
    try {
      const query = `
        INSERT INTO pals_monsters (
          name, image_url
        ) VALUES ($1, $2)
      `;

      const params = [
        pals.name,
        pals.image_url
      ];

      const result = await db.asyncRun(query, params);
      return { id: result.lastID, ...pals };
    } catch (error) {
      console.error('Error creating Pals monster:', error);
      throw error;
    }
  }

  /**
   * Update a Pals monster
   * @param {number} id - Pals monster ID
   * @param {Object} pals - Pals monster data
   * @returns {Promise<Object>} Updated Pals monster
   */
  static async update(id, pals) {
    try {
      const query = `
        UPDATE pals_monsters SET
          name = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `;

      const params = [
        pals.name,
        pals.image_url,
        id
      ];

      await db.asyncRun(query, params);
      return { id, ...pals };
    } catch (error) {
      console.error(`Error updating Pals monster with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a Pals monster
   * @param {number} id - Pals monster ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    try {
      const query = 'DELETE FROM pals_monsters WHERE id = $1';
      await db.asyncRun(query, [id]);
      return true;
    } catch (error) {
      console.error(`Error deleting Pals monster with ID ${id}:`, error);
      throw error;
    }
  }
}

module.exports = PalsMonster;
