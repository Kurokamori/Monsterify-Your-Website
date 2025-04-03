const pool = require('../db');

class Encounter {
  /**
   * Create the encounters table if it doesn't exist
   * @returns {Promise<void>}
   */
  static async createTableIfNotExists() {
    try {
      const query = `
        CREATE TABLE IF NOT EXISTS encounters (
          encounter_id SERIAL PRIMARY KEY,
          area_id INTEGER REFERENCES areas(area_id),
          type VARCHAR(50) NOT NULL,
          content TEXT NOT NULL,
          rarity VARCHAR(50) DEFAULT 'common',
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;

      await pool.query(query);
      console.log('Encounters table created or already exists');
    } catch (error) {
      console.error('Error creating encounters table:', error);
      throw error;
    }
  }

  /**
   * Get all encounters
   * @param {boolean} activeOnly - Whether to return only active encounters
   * @returns {Promise<Array>} - Array of encounter objects
   */
  static async getAll(activeOnly = true) {
    try {
      let query = 'SELECT * FROM encounters';
      
      if (activeOnly) {
        query += ' WHERE is_active = TRUE';
      }
      
      query += ' ORDER BY type, rarity';
      
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error getting encounters:', error);
      throw error;
    }
  }

  /**
   * Get encounters by area ID
   * @param {number} areaId - Area ID
   * @param {boolean} activeOnly - Whether to return only active encounters
   * @returns {Promise<Array>} - Array of encounter objects
   */
  static async getByAreaId(areaId, activeOnly = true) {
    try {
      let query = 'SELECT * FROM encounters WHERE area_id = $1';
      
      if (activeOnly) {
        query += ' AND is_active = TRUE';
      }
      
      query += ' ORDER BY type, rarity';
      
      const result = await pool.query(query, [areaId]);
      return result.rows;
    } catch (error) {
      console.error(`Error getting encounters for area ${areaId}:`, error);
      throw error;
    }
  }

  /**
   * Get a random encounter for an area
   * @param {number} areaId - Area ID
   * @param {string} rarity - Rarity filter (optional)
   * @returns {Promise<Object|null>} - Random encounter object or null if none found
   */
  static async getRandomForArea(areaId, rarity = null) {
    try {
      let query = 'SELECT * FROM encounters WHERE area_id = $1 AND is_active = TRUE';
      const params = [areaId];
      
      if (rarity) {
        query += ' AND rarity = $2';
        params.push(rarity);
      }
      
      query += ' ORDER BY RANDOM() LIMIT 1';
      
      const result = await pool.query(query, params);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error(`Error getting random encounter for area ${areaId}:`, error);
      throw error;
    }
  }

  /**
   * Get an encounter by ID
   * @param {number} encounterId - Encounter ID
   * @returns {Promise<Object|null>} - Encounter object or null if not found
   */
  static async getById(encounterId) {
    try {
      const query = 'SELECT * FROM encounters WHERE encounter_id = $1';
      const result = await pool.query(query, [encounterId]);
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error(`Error getting encounter ${encounterId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new encounter
   * @param {Object} encounterData - Encounter data
   * @returns {Promise<Object>} - Created encounter
   */
  static async create(encounterData) {
    try {
      const { area_id, type, content, rarity = 'common' } = encounterData;
      
      const query = `
        INSERT INTO encounters (area_id, type, content, rarity)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      
      const result = await pool.query(query, [area_id, type, content, rarity]);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating encounter:', error);
      throw error;
    }
  }

  /**
   * Update an encounter
   * @param {number} encounterId - Encounter ID
   * @param {Object} encounterData - Encounter data to update
   * @returns {Promise<Object|null>} - Updated encounter or null if not found
   */
  static async update(encounterId, encounterData) {
    try {
      const { area_id, type, content, rarity, is_active } = encounterData;
      
      const query = `
        UPDATE encounters
        SET area_id = $1, type = $2, content = $3, rarity = $4, is_active = $5
        WHERE encounter_id = $6
        RETURNING *
      `;
      
      const result = await pool.query(query, [area_id, type, content, rarity, is_active, encounterId]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error(`Error updating encounter ${encounterId}:`, error);
      throw error;
    }
  }

  /**
   * Delete an encounter
   * @param {number} encounterId - Encounter ID
   * @returns {Promise<boolean>} - Success status
   */
  static async delete(encounterId) {
    try {
      const query = 'DELETE FROM encounters WHERE encounter_id = $1 RETURNING *';
      const result = await pool.query(query, [encounterId]);
      
      return result.rows.length > 0;
    } catch (error) {
      console.error(`Error deleting encounter ${encounterId}:`, error);
      throw error;
    }
  }
}

module.exports = Encounter;
