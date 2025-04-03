const pool = require('../db');

/**
 * Service for monster-related operations
 */
class MonsterService {
  /**
   * Get monsters by trainer ID
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Array>} - Array of monsters
   */
  static async getMonstersByTrainerId(trainerId) {
    try {
      const result = await pool.query(`
        SELECT 
          id, 
          nickname, 
          species, 
          types, 
          attribute, 
          level
        FROM 
          monsters
        WHERE 
          trainer_id = $1
        ORDER BY 
          level DESC, 
          nickname ASC
      `, [trainerId]);
      
      return result.rows;
    } catch (error) {
      console.error('Error getting monsters by trainer ID:', error);
      throw error;
    }
  }
  
  /**
   * Get monster by ID
   * @param {number} monsterId - Monster ID
   * @returns {Promise<Object>} - Monster object
   */
  static async getMonsterById(monsterId) {
    try {
      const result = await pool.query(`
        SELECT 
          id, 
          nickname, 
          species, 
          types, 
          attribute, 
          level, 
          trainer_id
        FROM 
          monsters
        WHERE 
          id = $1
      `, [monsterId]);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error getting monster by ID:', error);
      throw error;
    }
  }
  
  /**
   * Get monsters by filter
   * @param {Object} filter - Filter options
   * @param {Array<string>} [filter.species] - Array of species to filter by
   * @param {Array<string>} [filter.types] - Array of types to filter by
   * @param {string} [filter.attribute] - Attribute to filter by
   * @param {number} [filter.minLevel] - Minimum level
   * @param {number} [filter.maxLevel] - Maximum level
   * @returns {Promise<Array>} - Array of monsters
   */
  static async getMonstersByFilter(filter) {
    try {
      let query = `
        SELECT 
          id, 
          nickname, 
          species, 
          types, 
          attribute, 
          level, 
          trainer_id
        FROM 
          monsters
        WHERE 1=1
      `;
      
      const params = [];
      let paramIndex = 1;
      
      // Add species filter
      if (filter.species && filter.species.length > 0) {
        query += ` AND species && $${paramIndex}::text[]`;
        params.push(filter.species);
        paramIndex++;
      }
      
      // Add types filter
      if (filter.types && filter.types.length > 0) {
        query += ` AND types && $${paramIndex}::text[]`;
        params.push(filter.types);
        paramIndex++;
      }
      
      // Add attribute filter
      if (filter.attribute) {
        query += ` AND attribute = $${paramIndex}`;
        params.push(filter.attribute);
        paramIndex++;
      }
      
      // Add level filters
      if (filter.minLevel) {
        query += ` AND level >= $${paramIndex}`;
        params.push(filter.minLevel);
        paramIndex++;
      }
      
      if (filter.maxLevel) {
        query += ` AND level <= $${paramIndex}`;
        params.push(filter.maxLevel);
        paramIndex++;
      }
      
      // Add order by
      query += ` ORDER BY level DESC, nickname ASC`;
      
      const result = await pool.query(query, params);
      
      return result.rows;
    } catch (error) {
      console.error('Error getting monsters by filter:', error);
      throw error;
    }
  }
}

module.exports = MonsterService;
