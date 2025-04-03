const pool = require('../db');
const Mission = require('./Mission');

class MissionHistory {
  /**
   * Create the mission_history table if it doesn't exist
   * @returns {Promise<void>}
   */
  static async createTableIfNotExists() {
    try {
      const query = `
        CREATE TABLE IF NOT EXISTS mission_history (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(20) NOT NULL,
          mission_id INTEGER REFERENCES missions(id),
          mon_ids INTEGER[],
          completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          rewards_claimed BOOLEAN DEFAULT FALSE
        );
      `;

      await pool.query(query);
      console.log('Mission history table created or already exists');
    } catch (error) {
      console.error('Error creating mission_history table:', error);
      throw error;
    }
  }

  /**
   * Get mission history for a user
   * @param {string} userId - User ID
   * @param {number} limit - Maximum number of records to return
   * @param {number} offset - Offset for pagination
   * @returns {Promise<Array>} - Array of mission history records with details
   */
  static async getByUserId(userId, limit = 10, offset = 0) {
    try {
      const query = `
        SELECT mh.*, m.name, m.description, 
          m.completion_message, m.completion_image_url,
          m.level_rewards, m.coin_rewards, m.item_rewards
        FROM mission_history mh
        JOIN missions m ON mh.mission_id = m.id
        WHERE mh.user_id = $1
        ORDER BY mh.completed_at DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await pool.query(query, [userId, limit, offset]);
      
      // Get monster details for each history record
      const historyWithMonsters = [];
      
      for (const history of result.rows) {
        if (history.mon_ids && history.mon_ids.length > 0) {
          const monsterQuery = `
            SELECT mon_id, name, img_link, level, species1
            FROM mons
            WHERE mon_id = ANY($1)
          `;
          
          const monsterResult = await pool.query(monsterQuery, [history.mon_ids]);
          history.monsters = monsterResult.rows;
        } else {
          history.monsters = [];
        }
        
        historyWithMonsters.push(history);
      }
      
      return historyWithMonsters;
    } catch (error) {
      console.error(`Error getting mission history for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Count total mission history records for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} - Total count of mission history records
   */
  static async countByUserId(userId) {
    try {
      const query = 'SELECT COUNT(*) as total FROM mission_history WHERE user_id = $1';
      const result = await pool.query(query, [userId]);
      return parseInt(result.rows[0].total, 10);
    } catch (error) {
      console.error(`Error counting mission history for user ${userId}:`, error);
      return 0;
    }
  }

  /**
   * Get a specific mission history record by ID
   * @param {number} id - Mission history ID
   * @returns {Promise<Object|null>} - Mission history record or null if not found
   */
  static async getById(id) {
    try {
      const query = `
        SELECT mh.*, m.name, m.description, 
          m.completion_message, m.completion_image_url,
          m.level_rewards, m.coin_rewards, m.item_rewards
        FROM mission_history mh
        JOIN missions m ON mh.mission_id = m.id
        WHERE mh.id = $1
      `;

      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const history = result.rows[0];
      
      // Get monster details
      if (history.mon_ids && history.mon_ids.length > 0) {
        const monsterQuery = `
          SELECT mon_id, name, img_link, level, species1
          FROM mons
          WHERE mon_id = ANY($1)
        `;
        
        const monsterResult = await pool.query(monsterQuery, [history.mon_ids]);
        history.monsters = monsterResult.rows;
      } else {
        history.monsters = [];
      }
      
      return history;
    } catch (error) {
      console.error(`Error getting mission history record with ID ${id}:`, error);
      return null;
    }
  }

  /**
   * Mark rewards as claimed for a mission history record
   * @param {number} id - Mission history ID
   * @returns {Promise<boolean>} - Whether the update was successful
   */
  static async markRewardsClaimed(id) {
    try {
      const query = `
        UPDATE mission_history
        SET rewards_claimed = TRUE
        WHERE id = $1
        RETURNING id
      `;
      
      const result = await pool.query(query, [id]);
      return result.rows.length > 0;
    } catch (error) {
      console.error(`Error marking rewards claimed for mission history record ${id}:`, error);
      return false;
    }
  }
}

module.exports = MissionHistory;
