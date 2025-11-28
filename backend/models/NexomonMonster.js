const db = require('../config/db');
const { buildLimitOffset } = require('../utils/dbUtils');

/**
 * Nexomon Monster model
 */
class NexomonMonster {
  /**
   * Get all Nexomon monsters with pagination and filtering
   * @param {Object} options - Query options
   * @param {number} options.page - Page number
   * @param {number} options.limit - Items per page
   * @param {string} options.search - Search term
   * @param {string} options.sortBy - Sort field
   * @param {string} options.sortOrder - Sort order (asc/desc)
   * @param {string} options.type - Filter by type
   * @param {boolean} options.legendary - Filter by legendary status
   * @param {string} options.stage - Filter by evolution stage
   * @returns {Promise<{data: Array, total: number, page: number, limit: number, totalPages: number}>}
   */
  static async getAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        sortBy = 'nr',
        sortOrder = 'asc',
        type = '',
        legendary = null,
        stage = ''
      } = options;

      // Build the query
      let query = 'SELECT * FROM nexomon_monsters WHERE 1=1';
      const params = [];

      // Add search condition
      if (search) {
        query += ' AND name LIKE $' + (params.length + 1);
        params.push(`%${search}%`);
      }

      // Add type filter
      if (type) {
        query += ' AND (type_primary = $' + (params.length + 1) + ' OR type_secondary = $' + (params.length + 2) + ')';
        params.push(type, type);
      }

      // Add legendary filter
      if (legendary !== null) {
        query += ' AND is_legendary = $' + (params.length + 1);
        params.push(legendary ? 1 : 0);
      }

      // Add stage filter
      if (stage) {
        query += ' AND stage = $' + (params.length + 1);
        params.push(stage);
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
      console.error('Error getting all Nexomon monsters:', error);
      throw error;
    }
  }

  /**
   * Get a Nexomon monster by number
   * @param {number} nr - Nexomon monster number
   * @returns {Promise<Object>} Nexomon monster
   */
  static async getByNr(nr) {
    try {
      const query = 'SELECT * FROM nexomon_monsters WHERE nr = $1';
      return await db.asyncGet(query, [nr]);
    } catch (error) {
      console.error(`Error getting Nexomon monster with number ${nr}:`, error);
      throw error;
    }
  }

  /**
   * Create a new Nexomon monster
   * @param {Object} nexomon - Nexomon monster data
   * @returns {Promise<Object>} Created Nexomon monster
   */
  static async create(nexomon) {
    try {
      const query = `
        INSERT INTO nexomon_monsters (
          nr, name, is_legendary, type_primary, type_secondary,
          evolves_from, evolves_to, breeding_results, stage, image_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `;

      const params = [
        nexomon.nr,
        nexomon.name,
        nexomon.is_legendary ? 1 : 0,
        nexomon.type_primary,
        nexomon.type_secondary,
        nexomon.evolves_from,
        nexomon.evolves_to,
        nexomon.breeding_results,
        nexomon.stage,
        nexomon.image_url
      ];

      await db.asyncRun(query, params);
      return nexomon;
    } catch (error) {
      console.error('Error creating Nexomon monster:', error);
      throw error;
    }
  }

  /**
   * Update a Nexomon monster
   * @param {number} nr - Nexomon monster number
   * @param {Object} nexomon - Nexomon monster data
   * @returns {Promise<Object>} Updated Nexomon monster
   */
  static async update(nr, nexomon) {
    try {
      const query = `
        UPDATE nexomon_monsters SET
          name = ?, is_legendary = ?, type_primary = ?, type_secondary = ?,
          evolves_from = ?, evolves_to = ?, breeding_results = ?,
          stage = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP
        WHERE nr = $11
      `;

      const params = [
        nexomon.name,
        nexomon.is_legendary ? 1 : 0,
        nexomon.type_primary,
        nexomon.type_secondary,
        nexomon.evolves_from,
        nexomon.evolves_to,
        nexomon.breeding_results,
        nexomon.stage,
        nexomon.image_url,
        nr
      ];

      await db.asyncRun(query, params);
      return { nr, ...nexomon };
    } catch (error) {
      console.error(`Error updating Nexomon monster with number ${nr}:`, error);
      throw error;
    }
  }

  /**
   * Delete a Nexomon monster
   * @param {number} nr - Nexomon monster number
   * @returns {Promise<boolean>} Success status
   */
  static async delete(nr) {
    try {
      const query = 'DELETE FROM nexomon_monsters WHERE nr = $1';
      await db.asyncRun(query, [nr]);
      return true;
    } catch (error) {
      console.error(`Error deleting Nexomon monster with number ${nr}:`, error);
      throw error;
    }
  }
}

module.exports = NexomonMonster;
