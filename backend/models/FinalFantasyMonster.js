const db = require('../config/db');
const { buildLimitOffset } = require('../utils/dbUtils');

/**
 * Final Fantasy Monster model
 * Fields: id, name, image_url, evolves_from, evolves_to, stage, breeding_results
 * Stages: 'base stage', 'doesn\'t evolve', or other evolution stages
 */
class FinalFantasyMonster {
  /**
   * Get all Final Fantasy monsters with pagination and filtering
   * @param {Object} options - Query options
   * @param {number} options.page - Page number
   * @param {number} options.limit - Items per page
   * @param {string} options.search - Search term
   * @param {string} options.sortBy - Sort field
   * @param {string} options.sortOrder - Sort order (asc/desc)
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
        stage = ''
      } = options;

      // Build the query
      let query = 'SELECT * FROM finalfantasy_monsters WHERE 1=1';
      const params = [];

      // Add search condition
      if (search) {
        query += ' AND name LIKE $' + (params.length + 1);
        params.push(`%${search}%`);
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
      console.error('Error getting all Final Fantasy monsters:', error);
      throw error;
    }
  }

  /**
   * Get a Final Fantasy monster by ID
   * @param {number} id - Monster ID
   * @returns {Promise<Object>} Monster
   */
  static async getById(id) {
    try {
      const query = 'SELECT * FROM finalfantasy_monsters WHERE id = $1';
      return await db.asyncGet(query, [id]);
    } catch (error) {
      console.error(`Error getting Final Fantasy monster with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new Final Fantasy monster
   * @param {Object} monster - Monster data
   * @returns {Promise<Object>} Created monster
   */
  static async create(monster) {
    try {
      const query = `
        INSERT INTO finalfantasy_monsters (
          name, image_url, evolves_from, evolves_to, stage, breeding_results
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `;

      const params = [
        monster.name,
        monster.image_url,
        monster.evolves_from,
        monster.evolves_to,
        monster.stage,
        monster.breeding_results
      ];

      const result = await db.asyncRun(query, params);
      return { id: result.lastID, ...monster };
    } catch (error) {
      console.error('Error creating Final Fantasy monster:', error);
      throw error;
    }
  }

  /**
   * Update a Final Fantasy monster
   * @param {number} id - Monster ID
   * @param {Object} monster - Monster data
   * @returns {Promise<Object>} Updated monster
   */
  static async update(id, monster) {
    try {
      const query = `
        UPDATE finalfantasy_monsters SET
          name = $1, image_url = $2, evolves_from = $3, evolves_to = $4,
          stage = $5, breeding_results = $6, updated_at = CURRENT_TIMESTAMP
        WHERE id = $7
      `;

      const params = [
        monster.name,
        monster.image_url,
        monster.evolves_from,
        monster.evolves_to,
        monster.stage,
        monster.breeding_results,
        id
      ];

      await db.asyncRun(query, params);
      return { id, ...monster };
    } catch (error) {
      console.error(`Error updating Final Fantasy monster with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a Final Fantasy monster
   * @param {number} id - Monster ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    try {
      const query = 'DELETE FROM finalfantasy_monsters WHERE id = $1';
      await db.asyncRun(query, [id]);
      return true;
    } catch (error) {
      console.error(`Error deleting Final Fantasy monster with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get all unique stages
   * @returns {Promise<Array>} Array of stages
   */
  static async getStages() {
    try {
      const query = 'SELECT DISTINCT stage FROM finalfantasy_monsters WHERE stage IS NOT NULL ORDER BY stage';
      const results = await db.asyncAll(query);
      return results.map(r => r.stage);
    } catch (error) {
      console.error('Error getting Final Fantasy stages:', error);
      throw error;
    }
  }
}

module.exports = FinalFantasyMonster;
