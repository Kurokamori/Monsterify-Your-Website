const db = require('../config/db');
const { buildLimitOffset } = require('../utils/dbUtils');

/**
 * Monster Hunter Monster model
 * Fields: id, name, image_url, rank (rarity 1-6), element
 * Monster Hunter monsters do not evolve
 */
class MonsterHunterMonster {
  /**
   * Get all Monster Hunter monsters with pagination and filtering
   * @param {Object} options - Query options
   * @param {number} options.page - Page number
   * @param {number} options.limit - Items per page
   * @param {string} options.search - Search term
   * @param {string} options.sortBy - Sort field
   * @param {string} options.sortOrder - Sort order (asc/desc)
   * @param {number} options.rank - Filter by rank (rarity)
   * @param {string} options.element - Filter by element
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
        rank = null,
        element = ''
      } = options;

      // Build the query
      let query = 'SELECT * FROM monsterhunter_monsters WHERE 1=1';
      const params = [];

      // Add search condition
      if (search) {
        query += ' AND name LIKE $' + (params.length + 1);
        params.push(`%${search}%`);
      }

      // Add rank filter
      if (rank !== null && rank !== '') {
        query += ' AND rank = $' + (params.length + 1);
        params.push(parseInt(rank));
      }

      // Add element filter
      if (element) {
        query += ' AND element = $' + (params.length + 1);
        params.push(element);
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
      console.error('Error getting all Monster Hunter monsters:', error);
      throw error;
    }
  }

  /**
   * Get a Monster Hunter monster by ID
   * @param {number} id - Monster ID
   * @returns {Promise<Object>} Monster
   */
  static async getById(id) {
    try {
      const query = 'SELECT * FROM monsterhunter_monsters WHERE id = $1';
      return await db.asyncGet(query, [id]);
    } catch (error) {
      console.error(`Error getting Monster Hunter monster with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new Monster Hunter monster
   * @param {Object} monster - Monster data
   * @returns {Promise<Object>} Created monster
   */
  static async create(monster) {
    try {
      const query = `
        INSERT INTO monsterhunter_monsters (
          name, image_url, rank, element
        ) VALUES ($1, $2, $3, $4)
      `;

      const params = [
        monster.name,
        monster.image_url,
        monster.rank ? parseInt(monster.rank) : null,
        monster.element
      ];

      const result = await db.asyncRun(query, params);
      return { id: result.lastID, ...monster };
    } catch (error) {
      console.error('Error creating Monster Hunter monster:', error);
      throw error;
    }
  }

  /**
   * Update a Monster Hunter monster
   * @param {number} id - Monster ID
   * @param {Object} monster - Monster data
   * @returns {Promise<Object>} Updated monster
   */
  static async update(id, monster) {
    try {
      const query = `
        UPDATE monsterhunter_monsters SET
          name = $1, image_url = $2, rank = $3, element = $4,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
      `;

      const params = [
        monster.name,
        monster.image_url,
        monster.rank ? parseInt(monster.rank) : null,
        monster.element,
        id
      ];

      await db.asyncRun(query, params);
      return { id, ...monster };
    } catch (error) {
      console.error(`Error updating Monster Hunter monster with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a Monster Hunter monster
   * @param {number} id - Monster ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    try {
      const query = 'DELETE FROM monsterhunter_monsters WHERE id = $1';
      await db.asyncRun(query, [id]);
      return true;
    } catch (error) {
      console.error(`Error deleting Monster Hunter monster with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get all unique elements
   * @returns {Promise<Array>} Array of elements
   */
  static async getElements() {
    try {
      const query = 'SELECT DISTINCT element FROM monsterhunter_monsters WHERE element IS NOT NULL ORDER BY element';
      const results = await db.asyncAll(query);
      return results.map(r => r.element);
    } catch (error) {
      console.error('Error getting Monster Hunter elements:', error);
      throw error;
    }
  }

  /**
   * Get all unique ranks
   * @returns {Promise<Array>} Array of ranks
   */
  static async getRanks() {
    try {
      const query = 'SELECT DISTINCT rank FROM monsterhunter_monsters WHERE rank IS NOT NULL ORDER BY rank';
      const results = await db.asyncAll(query);
      return results.map(r => r.rank);
    } catch (error) {
      console.error('Error getting Monster Hunter ranks:', error);
      throw error;
    }
  }
}

module.exports = MonsterHunterMonster;
