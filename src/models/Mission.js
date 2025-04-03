const pool = require('../db');

class Mission {
  /**
   * Create the missions table if it doesn't exist
   * @returns {Promise<void>}
   */
  static async createTableIfNotExists() {
    try {
      const query = `
        CREATE TABLE IF NOT EXISTS missions (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          description TEXT NOT NULL,
          progress_flavor_1 TEXT,
          progress_flavor_2 TEXT,
          progress_flavor_3 TEXT,
          progress_flavor_4 TEXT,
          progress_flavor_5 TEXT,
          completion_message TEXT,
          completion_image_url TEXT,
          progress_image_url TEXT,
          level_requirement INTEGER,
          type_requirements TEXT[], -- Array of types
          attribute_requirements TEXT[], -- Array of attributes
          requirements_type VARCHAR(3) DEFAULT 'OR', -- 'OR' or 'AND'
          level_rewards INTEGER NOT NULL,
          coin_rewards INTEGER NOT NULL,
          item_rewards TEXT[], -- Array of item names
          item_reward_amount INTEGER DEFAULT 0, -- 0 means all items, otherwise random selection
          min_progress_needed INTEGER NOT NULL,
          max_progress_needed INTEGER, -- NULL means fixed at min_progress_needed
          available_dates TEXT[], -- Array of dates in MM/DD format
          available_days TEXT[], -- Array of days of the week
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;

      await pool.query(query);
      console.log('Missions table created or already exists');
    } catch (error) {
      console.error('Error creating missions table:', error);
      throw error;
    }
  }

  /**
   * Get all missions
   * @param {boolean} activeOnly - Whether to return only active missions
   * @returns {Promise<Array>} - Array of missions
   */
  static async getAll(activeOnly = false) {
    try {
      let query = 'SELECT * FROM missions';

      if (activeOnly) {
        query += ' WHERE is_active = TRUE';
      }

      query += ' ORDER BY name';

      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error getting all missions:', error);
      return [];
    }
  }

  /**
   * Get a mission by ID
   * @param {number} id - Mission ID
   * @returns {Promise<Object|null>} - Mission object or null if not found
   */
  static async getById(id) {
    try {
      const query = 'SELECT * FROM missions WHERE id = $1';
      const result = await pool.query(query, [id]);

      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error(`Error getting mission with ID ${id}:`, error);
      return null;
    }
  }

  /**
   * Create a new mission
   * @param {Object} missionData - Mission data
   * @returns {Promise<Object|null>} - Created mission or null if failed
   */
  static async create(missionData) {
    try {
      // Convert array fields from strings if needed
      const typeRequirements = this.parseArrayField(missionData.type_requirements);
      const attributeRequirements = this.parseArrayField(missionData.attribute_requirements);
      const itemRewards = this.parseArrayField(missionData.item_rewards);

      const query = `
        INSERT INTO missions (
          name, description,
          progress_flavor_1, progress_flavor_2, progress_flavor_3, progress_flavor_4, progress_flavor_5,
          completion_message, completion_image_url, progress_image_url,
          level_requirement, type_requirements, attribute_requirements, requirements_type,
          level_rewards, coin_rewards, item_rewards, item_reward_amount,
          min_progress_needed, max_progress_needed, is_active
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
        )
        RETURNING *
      `;

      const values = [
        missionData.name,
        missionData.description,
        missionData.progress_flavor_1,
        missionData.progress_flavor_2,
        missionData.progress_flavor_3,
        missionData.progress_flavor_4,
        missionData.progress_flavor_5,
        missionData.completion_message,
        missionData.completion_image_url,
        missionData.progress_image_url,
        missionData.level_requirement || null,
        typeRequirements,
        attributeRequirements,
        missionData.requirements_type || 'OR',
        missionData.level_rewards,
        missionData.coin_rewards,
        itemRewards,
        missionData.item_reward_amount || 0,
        missionData.min_progress_needed,
        missionData.max_progress_needed || null,
        missionData.is_active === undefined ? true : missionData.is_active
      ];

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating mission:', error);
      return null;
    }
  }

  /**
   * Update a mission
   * @param {number} id - Mission ID
   * @param {Object} missionData - Updated mission data
   * @returns {Promise<Object|null>} - Updated mission or null if failed
   */
  static async update(id, missionData) {
    try {
      // Convert array fields from strings if needed
      const typeRequirements = this.parseArrayField(missionData.type_requirements);
      const attributeRequirements = this.parseArrayField(missionData.attribute_requirements);
      const itemRewards = this.parseArrayField(missionData.item_rewards);

      const query = `
        UPDATE missions
        SET
          name = $1,
          description = $2,
          progress_flavor_1 = $3,
          progress_flavor_2 = $4,
          progress_flavor_3 = $5,
          progress_flavor_4 = $6,
          progress_flavor_5 = $7,
          completion_message = $8,
          completion_image_url = $9,
          progress_image_url = $10,
          level_requirement = $11,
          type_requirements = $12,
          attribute_requirements = $13,
          requirements_type = $14,
          level_rewards = $15,
          coin_rewards = $16,
          item_rewards = $17,
          item_reward_amount = $18,
          min_progress_needed = $19,
          max_progress_needed = $20,
          is_active = $21
        WHERE id = $22
        RETURNING *
      `;

      const values = [
        missionData.name,
        missionData.description,
        missionData.progress_flavor_1,
        missionData.progress_flavor_2,
        missionData.progress_flavor_3,
        missionData.progress_flavor_4,
        missionData.progress_flavor_5,
        missionData.completion_message,
        missionData.completion_image_url,
        missionData.progress_image_url,
        missionData.level_requirement || null,
        typeRequirements,
        attributeRequirements,
        missionData.requirements_type || 'OR',
        missionData.level_rewards,
        missionData.coin_rewards,
        itemRewards,
        missionData.item_reward_amount || 0,
        missionData.min_progress_needed,
        missionData.max_progress_needed || null,
        missionData.is_active === undefined ? true : missionData.is_active,
        id
      ];

      const result = await pool.query(query, values);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error(`Error updating mission with ID ${id}:`, error);
      return null;
    }
  }

  /**
   * Delete a mission
   * @param {number} id - Mission ID
   * @returns {Promise<boolean>} - Whether the deletion was successful
   */
  static async delete(id) {
    try {
      const query = 'DELETE FROM missions WHERE id = $1 RETURNING id';
      const result = await pool.query(query, [id]);

      return result.rows.length > 0;
    } catch (error) {
      console.error(`Error deleting mission with ID ${id}:`, error);
      return false;
    }
  }

  /**
   * Toggle the active status of a mission
   * @param {number} id - Mission ID
   * @param {boolean} isActive - New active status
   * @returns {Promise<boolean>} - Whether the update was successful
   */
  static async toggleActive(id, isActive) {
    try {
      const query = 'UPDATE missions SET is_active = $1 WHERE id = $2 RETURNING id';
      const result = await pool.query(query, [isActive, id]);

      return result.rows.length > 0;
    } catch (error) {
      console.error(`Error toggling active status for mission with ID ${id}:`, error);
      return false;
    }
  }

  /**
   * Helper method to parse array fields
   * @param {string|Array} field - Field to parse
   * @returns {Array} - Parsed array
   */
  static parseArrayField(field) {
    if (!field) return [];

    if (Array.isArray(field)) {
      return field.filter(item => item && item.trim() !== '');
    }

    if (typeof field === 'string') {
      // Check if it's already in array format (from form submission)
      if (field.includes(',')) {
        return field.split(',').map(item => item.trim()).filter(item => item !== '');
      }

      // Single value
      return field.trim() !== '' ? [field.trim()] : [];
    }

    return [];
  }

  /**
   * Get all available monster types
   * @returns {Promise<Array>} - Array of unique monster types
   */
  static async getAvailableTypes() {
    try {
      // Get unique types from Pokemon
      const pokemonQuery = `
        SELECT DISTINCT "Type1" as type FROM pokemon WHERE "Type1" IS NOT NULL AND "Type1" != ''
        UNION
        SELECT DISTINCT "Type2" as type FROM pokemon WHERE "Type2" IS NOT NULL AND "Type2" != ''
      `;

      const pokemonResult = await pool.query(pokemonQuery);
      const pokemonTypes = pokemonResult.rows.map(row => row.type);

      // Get unique types from monsters
      const monstersQuery = `
        SELECT DISTINCT type1 as type FROM mons WHERE type1 IS NOT NULL AND type1 != ''
        UNION
        SELECT DISTINCT type2 as type FROM mons WHERE type2 IS NOT NULL AND type2 != ''
        UNION
        SELECT DISTINCT type3 as type FROM mons WHERE type3 IS NOT NULL AND type3 != ''
        UNION
        SELECT DISTINCT type4 as type FROM mons WHERE type4 IS NOT NULL AND type4 != ''
        UNION
        SELECT DISTINCT type5 as type FROM mons WHERE type5 IS NOT NULL AND type5 != ''
      `;

      const monstersResult = await pool.query(monstersQuery);
      const monsterTypes = monstersResult.rows.map(row => row.type);

      // Combine and deduplicate
      const allTypes = [...new Set([...pokemonTypes, ...monsterTypes])].sort();
      return allTypes;
    } catch (error) {
      console.error('Error getting available types:', error);
      return [];
    }
  }

  /**
   * Get all available monster attributes
   * @returns {Promise<Array>} - Array of unique monster attributes
   */
  static async getAvailableAttributes() {
    try {
      // Get unique attributes from monsters
      const query = `
        SELECT DISTINCT attribute FROM mons
        WHERE attribute IS NOT NULL AND attribute != ''
        ORDER BY attribute
      `;

      const result = await pool.query(query);
      return result.rows.map(row => row.attribute);
    } catch (error) {
      console.error('Error getting available attributes:', error);
      return [];
    }
  }

  /**
   * Get all available items for rewards
   * @returns {Promise<Array>} - Array of items
   */
  static async getAvailableItems() {
    try {
      const query = 'SELECT name, effect, rarity, category FROM items ORDER BY name';
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error getting available items:', error);
      return [];
    }
  }
}

module.exports = Mission;
