const pool = require('../db');

class Achievement {
  /**
   * Get all achievements
   * @param {boolean} includeHidden - Whether to include hidden achievements
   * @returns {Promise<Array>} - Array of achievements
   */
  static async getAll(includeHidden = false) {
    try {
      let query = 'SELECT * FROM achievements';

      if (!includeHidden) {
        query += ' WHERE is_hidden = FALSE';
      }

      query += ' ORDER BY category, "order", id';

      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error getting all achievements:', error);
      return [];
    }
  }

  /**
   * Get achievement by ID
   * @param {number} id - Achievement ID
   * @returns {Promise<Object|null>} - Achievement object or null if not found
   */
  static async getById(id) {
    try {
      const query = 'SELECT * FROM achievements WHERE id = $1';
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error(`Error getting achievement by ID ${id}:`, error);
      return null;
    }
  }

  /**
   * Get achievements by category
   * @param {string} category - Achievement category
   * @param {boolean} includeHidden - Whether to include hidden achievements
   * @returns {Promise<Array>} - Array of achievements
   */
  static async getByCategory(category, includeHidden = false) {
    try {
      let query = 'SELECT * FROM achievements WHERE category = $1';

      if (!includeHidden) {
        query += ' AND is_hidden = FALSE';
      }

      query += ' ORDER BY "order", id';

      const result = await pool.query(query, [category]);
      return result.rows;
    } catch (error) {
      console.error(`Error getting achievements by category ${category}:`, error);
      return [];
    }
  }

  /**
   * Create a new achievement
   * @param {Object} achievementData - Achievement data
   * @returns {Promise<Object|null>} - Created achievement or null if failed
   */
  static async create(achievementData) {
    try {
      // Ensure rewards is a valid JSONB object
      if (typeof achievementData.rewards === 'string') {
        try {
          achievementData.rewards = JSON.parse(achievementData.rewards);
        } catch (e) {
          throw new Error('Invalid rewards JSON format');
        }
      }

      const {
        name,
        description,
        category,
        requirement_type,
        requirement_value,
        requirement_subtype,
        icon,
        rewards,
        is_hidden,
        is_secret,
        order
      } = achievementData;

      const query = `
        INSERT INTO achievements (
          name, description, category, requirement_type, requirement_value,
          requirement_subtype, icon, rewards, is_hidden, is_secret, "order"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;

      const values = [
        name,
        description,
        category,
        requirement_type,
        requirement_value,
        requirement_subtype || null,
        icon || 'fas fa-trophy',
        rewards,
        is_hidden || false,
        is_secret || false,
        order || 0
      ];

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating achievement:', error);
      return null;
    }
  }

  /**
   * Update an achievement
   * @param {number} id - Achievement ID
   * @param {Object} achievementData - Achievement data
   * @returns {Promise<Object|null>} - Updated achievement or null if failed
   */
  static async update(id, achievementData) {
    try {
      // Ensure rewards is a valid JSONB object
      if (typeof achievementData.rewards === 'string') {
        try {
          achievementData.rewards = JSON.parse(achievementData.rewards);
        } catch (e) {
          throw new Error('Invalid rewards JSON format');
        }
      }

      const {
        name,
        description,
        category,
        requirement_type,
        requirement_value,
        requirement_subtype,
        icon,
        rewards,
        is_hidden,
        is_secret,
        order
      } = achievementData;

      const query = `
        UPDATE achievements
        SET
          name = $1,
          description = $2,
          category = $3,
          requirement_type = $4,
          requirement_value = $5,
          requirement_subtype = $6,
          icon = $7,
          rewards = $8,
          is_hidden = $9,
          is_secret = $10,
          "order" = $11,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $12
        RETURNING *
      `;

      const values = [
        name,
        description,
        category,
        requirement_type,
        requirement_value,
        requirement_subtype || null,
        icon || 'fas fa-trophy',
        rewards,
        is_hidden || false,
        is_secret || false,
        order || 0,
        id
      ];

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error(`Error updating achievement ${id}:`, error);
      return null;
    }
  }

  /**
   * Delete an achievement
   * @param {number} id - Achievement ID
   * @returns {Promise<boolean>} - Success status
   */
  static async delete(id) {
    try {
      const query = 'DELETE FROM achievements WHERE id = $1 RETURNING id';
      const result = await pool.query(query, [id]);
      return result.rows.length > 0;
    } catch (error) {
      console.error(`Error deleting achievement ${id}:`, error);
      return false;
    }
  }

  /**
   * Create the achievements table if it doesn't exist
   * @returns {Promise<void>}
   */
  static async createTableIfNotExists() {
    try {
      const query = `
        CREATE TABLE IF NOT EXISTS achievements (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          category VARCHAR(50) NOT NULL CHECK (category IN ('level', 'type_collector', 'monster_collector', 'attribute_collector', 'currency_earned', 'currency_spent', 'custom')),
          requirement_type VARCHAR(50) NOT NULL CHECK (requirement_type IN ('level', 'type_count', 'monster_count', 'attribute_count', 'currency_earned', 'currency_spent', 'custom')),
          requirement_value INTEGER NOT NULL CHECK (requirement_value > 0),
          requirement_subtype VARCHAR(100),
          icon VARCHAR(100) DEFAULT 'fas fa-trophy',
          rewards JSONB NOT NULL,
          is_hidden BOOLEAN DEFAULT FALSE,
          is_secret BOOLEAN DEFAULT FALSE,
          "order" INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);
      `;

      await pool.query(query);
      console.log('Achievements table created or already exists');
    } catch (error) {
      console.error('Error creating achievements table:', error);
      throw error;
    }
  }
}

module.exports = Achievement;
