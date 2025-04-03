const pool = require('../db');

class Area {
  /**
   * Create the areas table if it doesn't exist
   * @returns {Promise<void>}
   */
  static async createTableIfNotExists() {
    try {
      const query = `
        CREATE TABLE IF NOT EXISTS areas (
          area_id SERIAL PRIMARY KEY,
          region_id INTEGER REFERENCES regions(region_id),
          name VARCHAR(100) NOT NULL,
          description TEXT,
          image_url TEXT,
          difficulty VARCHAR(50) DEFAULT 'normal',
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;

      await pool.query(query);
      console.log('Areas table created or already exists');
    } catch (error) {
      console.error('Error creating areas table:', error);
      throw error;
    }
  }

  /**
   * Get all areas
   * @param {boolean} activeOnly - Whether to return only active areas
   * @returns {Promise<Array>} - Array of area objects
   */
  static async getAll(activeOnly = true) {
    try {
      let query = 'SELECT * FROM areas';

      if (activeOnly) {
        query += ' WHERE is_active = TRUE';
      }

      query += ' ORDER BY name';

      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error getting areas:', error);
      throw error;
    }
  }

  /**
   * Get areas by region ID
   * @param {number} regionId - Region ID
   * @param {boolean} activeOnly - Whether to return only active areas
   * @returns {Promise<Array>} - Array of area objects
   */
  static async getByRegionId(regionId, activeOnly = true) {
    try {
      let query = 'SELECT * FROM areas WHERE region_id = $1';

      if (activeOnly) {
        query += ' AND is_active = TRUE';
      }

      query += ' ORDER BY name';

      const result = await pool.query(query, [regionId]);
      return result.rows;
    } catch (error) {
      console.error(`Error getting areas for region ${regionId}:`, error);
      throw error;
    }
  }

  /**
   * Get an area by ID
   * @param {number} areaId - Area ID
   * @returns {Promise<Object|null>} - Area object or null if not found
   */
  static async getById(areaId) {
    try {
      const query = 'SELECT * FROM areas WHERE area_id = $1';
      const result = await pool.query(query, [areaId]);

      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error(`Error getting area ${areaId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new area
   * @param {Object} areaData - Area data
   * @returns {Promise<Object>} - Created area
   */
  static async create(areaData) {
    try {
      const { region_id, name, description, image_url, difficulty = 'normal' } = areaData;

      const query = `
        INSERT INTO areas (region_id, name, description, image_url, difficulty)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;

      const result = await pool.query(query, [region_id, name, description, image_url, difficulty]);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating area:', error);
      throw error;
    }
  }

  /**
   * Update an area
   * @param {number} areaId - Area ID
   * @param {Object} areaData - Area data to update
   * @returns {Promise<Object|null>} - Updated area or null if not found
   */
  static async update(areaId, areaData) {
    try {
      const { region_id, name, description, image_url, difficulty = 'normal', is_active } = areaData;

      const query = `
        UPDATE areas
        SET region_id = $1, name = $2, description = $3, image_url = $4, difficulty = $5, is_active = $6
        WHERE area_id = $7
        RETURNING *
      `;

      const result = await pool.query(query, [region_id, name, description, image_url, difficulty, is_active, areaId]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error(`Error updating area ${areaId}:`, error);
      throw error;
    }
  }

  /**
   * Delete an area
   * @param {number} areaId - Area ID
   * @returns {Promise<boolean>} - Success status
   */
  static async delete(areaId) {
    try {
      // First check if there are any adventures associated with this area
      const checkQuery = 'SELECT COUNT(*) FROM adventures WHERE area_id = $1';
      const checkResult = await pool.query(checkQuery, [areaId]);

      if (parseInt(checkResult.rows[0].count) > 0) {
        throw new Error('Cannot delete area with associated adventures');
      }

      const query = 'DELETE FROM areas WHERE area_id = $1 RETURNING *';
      const result = await pool.query(query, [areaId]);

      return result.rows.length > 0;
    } catch (error) {
      console.error(`Error deleting area ${areaId}:`, error);
      throw error;
    }
  }
}

module.exports = Area;
