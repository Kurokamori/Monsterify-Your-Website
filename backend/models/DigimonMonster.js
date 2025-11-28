const db = require('../config/db');
const { buildLimitOffset } = require('../utils/dbUtils');

/**
 * Digimon Monster model
 */
class DigimonMonster {
  /**
   * Get all Digimon monsters with pagination and filtering
   * @param {Object} options - Query options
   * @param {number} options.page - Page number
   * @param {number} options.limit - Items per page
   * @param {string} options.search - Search term
   * @param {string} options.sortBy - Sort field
   * @param {string} options.sortOrder - Sort order (asc/desc)
   * @param {string} options.rank - Filter by rank
   * @param {string} options.attribute - Filter by attribute
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
        rank = '',
        attribute = ''
      } = options;

      // Build the query
      let query = 'SELECT * FROM digimon_monsters WHERE 1=1';
      const params = [];

      // Add search condition
      if (search) {
        query += ' AND name LIKE $1';
        params.push(`%${search}%`);
      }

      // Add rank filter
      if (rank) {
        query += ' AND rank = $2';
        params.push(rank);
      }

      // Add attribute filter
      if (attribute) {
        query += ' AND attribute = $3';
        params.push(attribute);
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
      console.error('Error getting all Digimon monsters:', error);
      throw error;
    }
  }

  /**
   * Get a Digimon monster by ID
   * @param {number} id - Digimon monster ID
   * @returns {Promise<Object>} Digimon monster
   */
  static async getById(id) {
    try {
      const query = 'SELECT * FROM digimon_monsters WHERE id = $1';
      return await db.asyncGet(query, [id]);
    } catch (error) {
      console.error(`Error getting Digimon monster with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new Digimon monster
   * @param {Object} digimon - Digimon monster data
   * @returns {Promise<Object>} Created Digimon monster
   */
  static async create(digimon) {
    try {
      const query = `
        INSERT INTO digimon_monsters (
          name, rank, level_required, attribute, families, digimon_type,
          natural_attributes, digivolves_from, digivolves_to, breeding_results, image_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `;

      const params = [
        digimon.name,
        digimon.rank,
        digimon.level_required,
        digimon.attribute,
        digimon.families,
        digimon.digimon_type,
        digimon.natural_attributes,
        digimon.digivolves_from,
        digimon.digivolves_to,
        digimon.breeding_results,
        digimon.image_url
      ];

      const result = await db.asyncRun(query, params);
      return { id: result.lastID, ...digimon };
    } catch (error) {
      console.error('Error creating Digimon monster:', error);
      throw error;
    }
  }

  /**
   * Update a Digimon monster
   * @param {number} id - Digimon monster ID
   * @param {Object} digimon - Digimon monster data
   * @returns {Promise<Object>} Updated Digimon monster
   */
  static async update(id, digimon) {
    try {
      const query = `
        UPDATE digimon_monsters SET
          name = $1, rank = $2, level_required = $3, attribute = $4,
          families = $5, digimon_type = $6, natural_attributes = $7,
          digivolves_from = $8, digivolves_to = $9, breeding_results = $10,
          image_url = $11, updated_at = CURRENT_TIMESTAMP
        WHERE id = $12
      `;

      const params = [
        digimon.name,
        digimon.rank,
        digimon.level_required,
        digimon.attribute,
        digimon.families,
        digimon.digimon_type,
        digimon.natural_attributes,
        digimon.digivolves_from,
        digimon.digivolves_to,
        digimon.breeding_results,
        digimon.image_url,
        id
      ];

      await db.asyncRun(query, params);
      return { id, ...digimon };
    } catch (error) {
      console.error(`Error updating Digimon monster with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a Digimon monster
   * @param {number} id - Digimon monster ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    try {
      const query = 'DELETE FROM digimon_monsters WHERE id = $1';
      await db.asyncRun(query, [id]);
      return true;
    } catch (error) {
      console.error(`Error deleting Digimon monster with ID ${id}:`, error);
      throw error;
    }
  }
}

module.exports = DigimonMonster;
