const db = require('../config/db');
const { buildLimitOffset, isPostgreSQL } = require('../utils/dbUtils');

/**
 * Yokai Monster model
 */
class YokaiMonster {
  /**
   * Get all Yokai monsters with pagination and filtering
   * @param {Object} options - Query options
   * @param {number} options.page - Page number
   * @param {number} options.limit - Items per page
   * @param {string} options.search - Search term
   * @param {string} options.sortBy - Sort field
   * @param {string} options.sortOrder - Sort order (asc/desc)
   * @param {string} options.tribe - Filter by tribe
   * @param {string} options.rank - Filter by rank
   * @param {string} options.stage - Filter by evolution stage
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
        tribe = '',
        rank = '',
        stage = ''
      } = options;

      // Build the query
      let query = 'SELECT * FROM yokai_monsters WHERE 1=1';
      const params = [];

      // Add search condition
      if (search) {
        query += ' AND name LIKE $' + (params.length + 1);
        params.push(`%${search}%`);
      }

      // Add tribe filter
      if (tribe) {
        query += ' AND tribe = $' + (params.length + 1);
        params.push(tribe);
      }

      // Add rank filter
      if (rank) {
        query += ' AND rank = $' + (params.length + 1);
        params.push(rank);
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
      console.error('Error getting all Yokai monsters:', error);
      throw error;
    }
  }

  /**
   * Get a Yokai monster by ID
   * @param {number} id - Yokai monster ID
   * @returns {Promise<Object>} Yokai monster
   */
  static async getById(id) {
    try {
      const query = 'SELECT * FROM yokai_monsters WHERE id = $1';
      return await db.asyncGet(query, [id]);
    } catch (error) {
      console.error(`Error getting Yokai monster with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new Yokai monster
   * @param {Object} yokai - Yokai monster data
   * @returns {Promise<Object>} Created Yokai monster
   */
  static async create(yokai) {
    try {
      const params = [
        yokai.name,
        yokai.tribe,
        yokai.rank,
        yokai.evolves_from,
        yokai.evolves_to,
        yokai.breeding_results,
        yokai.stage,
        yokai.image_url
      ];

      let query, result, yokaiId;

      if (isPostgreSQL) {
        // PostgreSQL: Use RETURNING clause to get the inserted ID
        query = `
          INSERT INTO yokai_monsters (
            name, tribe, rank, evolves_from, evolves_to,
            breeding_results, stage, image_url
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id
        `;

        result = await db.asyncRun(query, params);
        yokaiId = result.rows[0].id;
      } else {
        // SQLite: Use lastID from result
        query = `
          INSERT INTO yokai_monsters (
            name, tribe, rank, evolves_from, evolves_to,
            breeding_results, stage, image_url
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `;

        result = await db.asyncRun(query, params);
        yokaiId = result.lastID;
      }

      return { id: yokaiId, ...yokai };
    } catch (error) {
      console.error('Error creating Yokai monster:', error);
      throw error;
    }
  }

  /**
   * Update a Yokai monster
   * @param {number} id - Yokai monster ID
   * @param {Object} yokai - Yokai monster data
   * @returns {Promise<Object>} Updated Yokai monster
   */
  static async update(id, yokai) {
    try {
      const query = `
        UPDATE yokai_monsters SET
          name = ?, tribe = ?, rank = ?, evolves_from = ?,
          evolves_to = ?, breeding_results = ?, stage = ?,
          image_url = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = $9
      `;

      const params = [
        yokai.name,
        yokai.tribe,
        yokai.rank,
        yokai.evolves_from,
        yokai.evolves_to,
        yokai.breeding_results,
        yokai.stage,
        yokai.image_url,
        id
      ];

      await db.asyncRun(query, params);
      return { id, ...yokai };
    } catch (error) {
      console.error(`Error updating Yokai monster with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a Yokai monster
   * @param {number} id - Yokai monster ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    try {
      const query = 'DELETE FROM yokai_monsters WHERE id = $1';
      await db.asyncRun(query, [id]);
      return true;
    } catch (error) {
      console.error(`Error deleting Yokai monster with ID ${id}:`, error);
      throw error;
    }
  }
}

module.exports = YokaiMonster;
