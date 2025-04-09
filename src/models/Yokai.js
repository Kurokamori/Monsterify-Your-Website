const pool = require('../db');

class Yokai {
  /**
   * Get all Yokai
   * @returns {Promise<Array>} - Array of Yokai
   */
  static async getAll() {
    try {
      const query = 'SELECT * FROM yokai ORDER BY "Name"';
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error getting all Yokai:', error);
      return [];
    }
  }

  /**
   * Create a new Yokai
   * @param {Object} yokai - Yokai data
   * @returns {Promise<Object>} - Created Yokai
   */
  static async create(yokai) {
    try {
      const query = `
        INSERT INTO yokai (
          id, "Name", "Rank", "Tribe", "Attribute"
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;

      const values = [
        yokai.id,
        yokai.Name,
        yokai.Rank,
        yokai.Tribe,
        yokai.Attribute
      ];

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating Yokai:', error);
      throw error;
    }
  }

  /**
   * Update an existing Yokai
   * @param {Object} yokai - Yokai data
   * @returns {Promise<Object>} - Updated Yokai
   */
  static async update(yokai) {
    try {
      const query = `
        UPDATE yokai SET
          id = $1,
          "Rank" = $3,
          "Tribe" = $4,
          "Attribute" = $5
        WHERE "Name" = $2
        RETURNING *
      `;

      const values = [
        yokai.id,
        yokai.Name,
        yokai.Rank,
        yokai.Tribe,
        yokai.Attribute
      ];

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating Yokai:', error);
      throw error;
    }
  }

  /**
   * Delete a Yokai
   * @param {string} name - Yokai name
   * @returns {Promise<boolean>} - Success status
   */
  static async delete(name) {
    try {
      const query = 'DELETE FROM yokai WHERE "Name" = $1';
      const result = await pool.query(query, [name]);
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting Yokai:', error);
      throw error;
    }
  }

  /**
   * Get Yokai by name
   * @param {string} name - Yokai name
   * @returns {Promise<Object>} - Yokai object
   */
  static async getByName(name) {
    try {
      const query = 'SELECT * FROM yokai WHERE "Name" = $1';
      const result = await pool.query(query, [name]);
      return result.rows[0];
    } catch (error) {
      console.error('Error getting Yokai by name:', error);
      return null;
    }
  }

  /**
   * Get Yokai filtered by various criteria
   * @param {Object} filters - Filter criteria
   * @param {string|Array} [filters.rank] - Rank filter
   * @param {string|Array} [filters.tribe] - Tribe filter
   * @param {string|Array} [filters.attribute] - Attribute filter
   * @returns {Promise<Array>} - Array of filtered Yokai
   */
  static async getFiltered(filters = {}) {
    try {
      let query = 'SELECT * FROM yokai WHERE 1=1';
      const values = [];
      let paramIndex = 1;

      // Process rank filter
      if (filters.rank) {
        if (Array.isArray(filters.rank)) {
          const placeholders = filters.rank.map((_, i) => `$${paramIndex + i}`).join(', ');
          query += ` AND "Rank" IN (${placeholders})`;
          values.push(...filters.rank);
          paramIndex += filters.rank.length;
        } else {
          query += ` AND "Rank" = $${paramIndex}`;
          values.push(filters.rank);
          paramIndex++;
        }
      }

      // Process tribe filter
      if (filters.tribe) {
        if (Array.isArray(filters.tribe)) {
          const placeholders = filters.tribe.map((_, i) => `$${paramIndex + i}`).join(', ');
          query += ` AND "Tribe" IN (${placeholders})`;
          values.push(...filters.tribe);
          paramIndex += filters.tribe.length;
        } else {
          query += ` AND "Tribe" = $${paramIndex}`;
          values.push(filters.tribe);
          paramIndex++;
        }
      }

      // Process attribute filter
      if (filters.attribute) {
        if (Array.isArray(filters.attribute)) {
          const placeholders = filters.attribute.map((_, i) => `$${paramIndex + i}`).join(', ');
          query += ` AND "Attribute" IN (${placeholders})`;
          values.push(...filters.attribute);
          paramIndex += filters.attribute.length;
        } else {
          query += ` AND "Attribute" = $${paramIndex}`;
          values.push(filters.attribute);
          paramIndex++;
        }
      }

      query += ' ORDER BY "Name"';
      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      console.error('Error getting filtered Yokai:', error);
      return [];
    }
  }

  /**
   * Get random Yokai based on filters
   * @param {Object} filters - Filter criteria
   * @param {number} [count=1] - Number of random Yokai to return
   * @returns {Promise<Array>} - Array of random Yokai
   */
  static async getRandom(filters = {}, count = 1) {
    try {
      const filteredYokai = await this.getFiltered(filters);

      if (filteredYokai.length === 0) {
        return [];
      }

      // Shuffle and take the requested number
      const shuffled = [...filteredYokai].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, Math.min(count, shuffled.length));
    } catch (error) {
      console.error('Error getting random Yokai:', error);
      return [];
    }
  }
}

module.exports = Yokai;
