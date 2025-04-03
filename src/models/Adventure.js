const pool = require('../db');

class Adventure {
  /**
   * Create the adventures table if it doesn't exist
   * @returns {Promise<void>}
   */
  static async createTableIfNotExists() {
    try {
      const query = `
        CREATE TABLE IF NOT EXISTS adventures (
          adventure_id SERIAL PRIMARY KEY,
          area_id INTEGER REFERENCES areas(area_id),
          starter_user_id VARCHAR(20) NOT NULL,
          thread_id VARCHAR(100) NOT NULL,
          channel_id VARCHAR(100) NOT NULL,
          status VARCHAR(20) DEFAULT 'active',
          started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          ended_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;

      await pool.query(query);
      console.log('Adventures table created or already exists');
    } catch (error) {
      console.error('Error creating adventures table:', error);
      throw error;
    }
  }

  /**
   * Get all adventures
   * @param {string} status - Filter by status (optional)
   * @returns {Promise<Array>} - Array of adventure objects
   */
  static async getAll(status = null) {
    try {
      let query = `
        SELECT a.*, ar.name as area_name, ar.image_url as area_image,
               r.name as region_name, r.image_url as region_image
        FROM adventures a
        LEFT JOIN areas ar ON a.area_id = ar.area_id
        LEFT JOIN regions r ON ar.region_id = r.region_id
      `;

      const params = [];

      if (status) {
        query += ' WHERE a.status = $1';
        params.push(status);
      }

      query += ' ORDER BY a.started_at DESC';

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error getting adventures:', error);
      throw error;
    }
  }

  /**
   * Get adventures by user ID
   * @param {string} userId - User ID
   * @param {string} status - Filter by status (optional)
   * @returns {Promise<Array>} - Array of adventure objects
   */
  static async getByUserId(userId, status = null) {
    try {
      let query = `
        SELECT a.*, ar.name as area_name, ar.image_url as area_image,
               r.name as region_name, r.image_url as region_image
        FROM adventures a
        LEFT JOIN areas ar ON a.area_id = ar.area_id
        LEFT JOIN regions r ON ar.region_id = r.region_id
        WHERE a.starter_user_id = $1
      `;

      const params = [userId];

      if (status) {
        query += ' AND a.status = $2';
        params.push(status);
      }

      query += ' ORDER BY a.started_at DESC';

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error(`Error getting adventures for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get an adventure by ID
   * @param {number} adventureId - Adventure ID
   * @returns {Promise<Object|null>} - Adventure object or null if not found
   */
  static async getById(adventureId) {
    try {
      const query = `
        SELECT a.*, ar.name as area_name, ar.image_url as area_image,
               r.name as region_name, r.image_url as region_image
        FROM adventures a
        LEFT JOIN areas ar ON a.area_id = ar.area_id
        LEFT JOIN regions r ON ar.region_id = r.region_id
        WHERE a.adventure_id = $1
      `;

      const result = await pool.query(query, [adventureId]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error(`Error getting adventure ${adventureId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new adventure
   * @param {Object} adventureData - Adventure data
   * @returns {Promise<Object>} - Created adventure
   */
  static async create(adventureData) {
    try {
      const { area_id, starter_user_id, thread_id, channel_id } = adventureData;

      const query = `
        INSERT INTO adventures (area_id, starter_user_id, thread_id, channel_id)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;

      const result = await pool.query(query, [area_id, starter_user_id, thread_id, channel_id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating adventure:', error);
      throw error;
    }
  }

  /**
   * Create a custom adventure (without area)
   * @param {Object} adventureData - Adventure data
   * @returns {Promise<Object>} - Created adventure
   */
  static async createCustom(adventureData) {
    try {
      const { starter_user_id, thread_id, channel_id } = adventureData;

      const query = `
        INSERT INTO adventures (area_id, starter_user_id, thread_id, channel_id)
        VALUES (NULL, $1, $2, $3)
        RETURNING *
      `;

      const result = await pool.query(query, [starter_user_id, thread_id, channel_id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating custom adventure:', error);
      throw error;
    }
  }

  /**
   * End an adventure
   * @param {number} adventureId - Adventure ID
   * @returns {Promise<Object|null>} - Updated adventure or null if not found
   */
  static async end(adventureId) {
    try {
      const query = `
        UPDATE adventures
        SET status = 'completed', ended_at = CURRENT_TIMESTAMP
        WHERE adventure_id = $1
        RETURNING *
      `;

      const result = await pool.query(query, [adventureId]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error(`Error ending adventure ${adventureId}:`, error);
      throw error;
    }
  }

  /**
   * Get active adventures for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of active adventure objects
   */
  static async getActiveAdventures(userId) {
    try {
      const query = `
        SELECT a.*, ar.name as area_name, ar.image_url as area_image,
               r.name as region_name, r.image_url as region_image
        FROM adventures a
        LEFT JOIN areas ar ON a.area_id = ar.area_id
        LEFT JOIN regions r ON ar.region_id = r.region_id
        WHERE a.starter_user_id = $1 AND a.status = 'active'
        ORDER BY a.started_at DESC
      `;

      const result = await pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      console.error(`Error getting active adventures for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Check if a user has an active adventure
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} - Whether the user has an active adventure
   */
  static async hasActiveAdventure(userId) {
    try {
      const query = `
        SELECT COUNT(*) FROM adventures
        WHERE starter_user_id = $1 AND status = 'active'
      `;

      const result = await pool.query(query, [userId]);
      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      console.error(`Error checking active adventures for user ${userId}:`, error);
      throw error;
    }
  }
}

module.exports = Adventure;
