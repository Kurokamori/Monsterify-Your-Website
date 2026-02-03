const db = require('../config/db');
const { buildRandomLimit, buildLimitOffset } = require('../utils/dbUtils');

/**
 * Ability model
 * Fields: name, effect, description, common_types (text[]), signature_monsters (text[])
 */
class Ability {
  /**
   * Get all abilities with advanced filtering
   * @param {Object} options - Query options
   * @param {number} options.page - Page number (1-based)
   * @param {number} options.limit - Number of items per page
   * @param {string} options.search - Search term for name/effect/description
   * @param {string} options.monsterSearch - Search term for signature monsters
   * @param {string[]} options.types - Array of types to filter by
   * @param {string} options.typeLogic - 'AND' or 'OR' for type filtering
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
        monsterSearch = '',
        types = [],
        typeLogic = 'OR',
        sortBy = 'name',
        sortOrder = 'asc'
      } = options;

      // Build query
      let query = 'SELECT * FROM abilities';
      const params = [];
      const conditions = [];
      let paramIndex = 1;

      // Add search condition for name/effect/description
      if (search) {
        conditions.push(`(name LIKE $${paramIndex} OR effect LIKE $${paramIndex + 1} OR description LIKE $${paramIndex + 2})`);
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        paramIndex += 3;
      }

      // Add search condition for signature monsters (cast array to text for ILIKE search)
      if (monsterSearch) {
        conditions.push(`signature_monsters::text ILIKE $${paramIndex}`);
        params.push(`%${monsterSearch}%`);
        paramIndex += 1;
      }

      // Add type filtering with AND/OR logic using PostgreSQL array ANY operator
      if (types && types.length > 0) {
        const typeConditions = types.map(type => {
          params.push(type);
          return `$${paramIndex++} = ANY(common_types)`;
        });

        if (typeLogic === 'AND') {
          conditions.push(`(${typeConditions.join(' AND ')})`);
        } else {
          conditions.push(`(${typeConditions.join(' OR ')})`);
        }
      }

      // Add WHERE clause if conditions exist
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      // Count total records for pagination
      const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
      const countResult = await db.asyncGet(countQuery, params);
      const total = countResult ? countResult.total : 0;

      // Add sorting and pagination
      const validSortFields = ['name', 'effect', 'description', 'common_types'];
      const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'name';
      query += ` ORDER BY ${safeSortBy} ${sortOrder === 'desc' ? 'DESC' : 'ASC'}`;
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
   * Get all unique types from abilities
   * @returns {Promise<string[]>} - Array of unique type names
   */
  static async getAllTypes() {
    try {
      // PostgreSQL: unnest the array to get distinct values
      const query = 'SELECT DISTINCT unnest(common_types) as type FROM abilities WHERE common_types IS NOT NULL ORDER BY type';
      const results = await db.asyncAll(query, []);

      return results.map(row => row.type).filter(t => t && t.trim());
    } catch (error) {
      console.error('Error getting all types:', error);
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
      const query = 'SELECT * FROM abilities WHERE name = $1';
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
      const query = 'INSERT INTO abilities (name, effect) VALUES ($1, $2)';
      const params = [ability.name, ability.effect];
      await db.asyncRun(query, params);
      return { name: ability.name, effect: ability.effect };
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
      const query = 'UPDATE abilities SET effect = $1 WHERE name = $2';
      const params = [ability.effect, name];
      await db.asyncRun(query, params);
      return { name: name, effect: ability.effect };
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
      const query = 'DELETE FROM abilities WHERE name = $1';
      await db.asyncRun(query, [name]);
      return true;
    } catch (error) {
      console.error(`Error deleting ability with name ${name}:`, error);
      throw error;
    }
  }
}

module.exports = Ability;
