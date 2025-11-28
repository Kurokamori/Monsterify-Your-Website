const db = require('../config/db');
const { buildRandomLimit, buildLimitOffset, isPostgreSQL } = require('../utils/dbUtils');

/**
 * Ability model
 */
class Ability {
  /**
   * Get all abilities
   * @param {Object} options - Query options
   * @param {number} options.page - Page number (1-based)
   * @param {number} options.limit - Number of items per page
   * @param {string} options.search - Search term
   * @param {string} options.sortBy - Field to sort by
   * @param {string} options.sortOrder - Sort order (asc or desc)
   * @returns {Promise<Object>} - Object containing abilities and pagination info
   */
  static async getAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        sortBy = 'abilityname',
        sortOrder = 'asc'
      } = options;

      // Build query
      let query = 'SELECT * FROM abilities';
      const params = [];

      // Add search condition
      if (search) {
        query += ' WHERE abilityname LIKE $1 OR effect LIKE $2';
        params.push(`%${search}%`, `%${search}%`);
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
      console.error('Error getting all abilities:', error);
      throw error;
    }
  }

  /**
   * Get ability by name
   * @param {string} name - Ability name
   * @returns {Promise<Object>} - Ability object
   */
  static async getByName(name) {
    try {
      const query = 'SELECT * FROM abilities WHERE abilityname = $1';
      return await db.asyncGet(query, [name]);
    } catch (error) {
      console.error(`Error getting ability with name ${name}:`, error);
      throw error;
    }
  }

  /**
   * Get random abilities
   * @param {number} count - Number of abilities to get
   * @returns {Promise<Array>} - Array of ability objects
   */
  static async getRandom(count = 2) {
    try {
      let query = `SELECT * FROM abilities`;
      const params = [];
      query += buildRandomLimit(count, params);
      return await db.asyncAll(query, params);
    } catch (error) {
      console.error(`Error getting ${count} random abilities:`, error);
      throw error;
    }
  }

  /**
   * Create a new ability
   * @param {Object} ability - Ability data
   * @returns {Promise<Object>} - Created ability
   */
  static async create(ability) {
    try {
      const query = 'INSERT INTO abilities (abilityname, effect) VALUES ($1, $2)';
      const params = [ability.name, ability.effect];
      await db.asyncRun(query, params);
      return { abilityname: ability.name, effect: ability.effect };
    } catch (error) {
      console.error('Error creating ability:', error);
      throw error;
    }
  }

  /**
   * Update an ability
   * @param {string} name - Ability name
   * @param {Object} ability - Ability data
   * @returns {Promise<Object>} - Updated ability
   */
  static async update(name, ability) {
    try {
      const query = 'UPDATE abilities SET effect = $1 WHERE abilityname = $2';
      const params = [ability.effect, name];
      await db.asyncRun(query, params);
      return { abilityname: name, effect: ability.effect };
    } catch (error) {
      console.error(`Error updating ability with name ${name}:`, error);
      throw error;
    }
  }

  /**
   * Delete an ability
   * @param {string} name - Ability name
   * @returns {Promise<boolean>} - Success status
   */
  static async delete(name) {
    try {
      const query = 'DELETE FROM abilities WHERE abilityname = $1';
      await db.asyncRun(query, [name]);
      return true;
    } catch (error) {
      console.error(`Error deleting ability with name ${name}:`, error);
      throw error;
    }
  }
}

module.exports = Ability;
