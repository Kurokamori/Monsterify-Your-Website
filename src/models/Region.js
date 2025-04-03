const pool = require('../db');

class Region {
  /**
   * Create the regions table if it doesn't exist
   * @returns {Promise<void>}
   */
  static async createTableIfNotExists() {
    try {
      const query = `
        CREATE TABLE IF NOT EXISTS regions (
          region_id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          image_url TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;

      await pool.query(query);
      console.log('Regions table created or already exists');
    } catch (error) {
      console.error('Error creating regions table:', error);
      throw error;
    }
  }

  /**
   * Get all regions
   * @param {boolean} activeOnly - Whether to return only active regions
   * @returns {Promise<Array>} - Array of region objects
   */
  static async getAll(activeOnly = true) {
    try {
      let query = 'SELECT * FROM regions';
      
      if (activeOnly) {
        query += ' WHERE is_active = TRUE';
      }
      
      query += ' ORDER BY name';
      
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error getting regions:', error);
      throw error;
    }
  }

  /**
   * Get a region by ID
   * @param {number} regionId - Region ID
   * @returns {Promise<Object|null>} - Region object or null if not found
   */
  static async getById(regionId) {
    try {
      const query = 'SELECT * FROM regions WHERE region_id = $1';
      const result = await pool.query(query, [regionId]);
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error(`Error getting region ${regionId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new region
   * @param {Object} regionData - Region data
   * @returns {Promise<Object>} - Created region
   */
  static async create(regionData) {
    try {
      const { name, description, image_url } = regionData;
      
      const query = `
        INSERT INTO regions (name, description, image_url)
        VALUES ($1, $2, $3)
        RETURNING *
      `;
      
      const result = await pool.query(query, [name, description, image_url]);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating region:', error);
      throw error;
    }
  }

  /**
   * Update a region
   * @param {number} regionId - Region ID
   * @param {Object} regionData - Region data to update
   * @returns {Promise<Object|null>} - Updated region or null if not found
   */
  static async update(regionId, regionData) {
    try {
      const { name, description, image_url, is_active } = regionData;
      
      const query = `
        UPDATE regions
        SET name = $1, description = $2, image_url = $3, is_active = $4
        WHERE region_id = $5
        RETURNING *
      `;
      
      const result = await pool.query(query, [name, description, image_url, is_active, regionId]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error(`Error updating region ${regionId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a region
   * @param {number} regionId - Region ID
   * @returns {Promise<boolean>} - Success status
   */
  static async delete(regionId) {
    try {
      // First check if there are any areas associated with this region
      const checkQuery = 'SELECT COUNT(*) FROM areas WHERE region_id = $1';
      const checkResult = await pool.query(checkQuery, [regionId]);
      
      if (parseInt(checkResult.rows[0].count) > 0) {
        throw new Error('Cannot delete region with associated areas');
      }
      
      const query = 'DELETE FROM regions WHERE region_id = $1 RETURNING *';
      const result = await pool.query(query, [regionId]);
      
      return result.rows.length > 0;
    } catch (error) {
      console.error(`Error deleting region ${regionId}:`, error);
      throw error;
    }
  }
}

module.exports = Region;
