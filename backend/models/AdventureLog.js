const db = require('../config/db');

class AdventureLog {
  /**
   * Create a new adventure log
   * @param {Object} logData - Adventure log data
   * @returns {Promise<Object>} Created adventure log
   */
  static async create(logData) {
    try {
      const {
        adventure_id,
        discord_user_id,
        user_id,
        word_count,
        levels_earned,
        coins_earned,
        items_earned
      } = logData;

      const query = `
        INSERT INTO adventure_logs (
          adventure_id, discord_user_id, user_id, word_count,
          levels_earned, coins_earned, items_earned
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const values = [
        adventure_id,
        discord_user_id,
        user_id,
        word_count || 0,
        levels_earned || 0,
        coins_earned || 0,
        JSON.stringify(items_earned || [])
      ];

      const result = await db.asyncGet(query, values);
      
      // Parse items_earned back to array
      if (result.items_earned) {
        try {
          result.items_earned = typeof result.items_earned === 'string'
            ? JSON.parse(result.items_earned)
            : result.items_earned;
        } catch (e) {
          console.error('Error parsing items_earned:', e);
          result.items_earned = [];
        }
      } else {
        result.items_earned = [];
      }

      return result;

    } catch (error) {
      console.error('Error creating adventure log:', error);
      throw error;
    }
  }

  /**
   * Get adventure log by ID
   * @param {number} id - Adventure log ID
   * @returns {Promise<Object|null>} Adventure log or null
   */
  static async getById(id) {
    try {
      const query = `
        SELECT al.*, a.title as adventure_title, a.description as adventure_description
        FROM adventure_logs al
        LEFT JOIN adventures a ON al.adventure_id = a.id
        WHERE al.id = $1
      `;

      const log = await db.asyncGet(query, [id]);
      
      if (log && log.items_earned) {
        try {
          log.items_earned = typeof log.items_earned === 'string'
            ? JSON.parse(log.items_earned)
            : log.items_earned;
        } catch (e) {
          console.error('Error parsing items_earned:', e);
          log.items_earned = [];
        }
      } else if (log) {
        log.items_earned = [];
      }

      return log;

    } catch (error) {
      console.error('Error getting adventure log by ID:', error);
      throw error;
    }
  }

  /**
   * Get unclaimed adventure logs for a Discord user
   * @param {string} discordUserId - Discord user ID
   * @returns {Promise<Array>} Array of unclaimed adventure logs
   */
  static async getUnclaimedByDiscordUser(discordUserId) {
    try {
      const query = `
        SELECT al.*, a.title as adventure_title, a.description as adventure_description
        FROM adventure_logs al
        LEFT JOIN adventures a ON al.adventure_id = a.id
        WHERE al.discord_user_id = $1 AND al.is_claimed = false
        ORDER BY al.created_at DESC
      `;

      const logs = await db.asyncAll(query, [discordUserId]);
      
      // Parse items_earned for each log
      logs.forEach(log => {
        if (log.items_earned) {
          try {
            log.items_earned = JSON.parse(log.items_earned);
          } catch (e) {
            log.items_earned = [];
          }
        } else {
          log.items_earned = [];
        }
      });

      return logs;

    } catch (error) {
      console.error('Error getting unclaimed adventure logs:', error);
      throw error;
    }
  }

  /**
   * Get adventure logs by adventure ID
   * @param {number} adventureId - Adventure ID
   * @returns {Promise<Array>} Array of adventure logs
   */
  static async getByAdventure(adventureId) {
    try {
      const query = `
        SELECT al.*, u.username, u.display_name
        FROM adventure_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE al.adventure_id = $1
        ORDER BY al.created_at DESC
      `;

      const logs = await db.asyncAll(query, [adventureId]);
      
      // Parse items_earned for each log
      logs.forEach(log => {
        if (log.items_earned) {
          try {
            log.items_earned = JSON.parse(log.items_earned);
          } catch (e) {
            log.items_earned = [];
          }
        } else {
          log.items_earned = [];
        }
      });

      return logs;

    } catch (error) {
      console.error('Error getting adventure logs by adventure:', error);
      throw error;
    }
  }

  /**
   * Mark adventure log as claimed
   * @param {number} id - Adventure log ID
   * @returns {Promise<Object>} Updated adventure log
   */
  static async markAsClaimed(id) {
    try {
      const query = `
        UPDATE adventure_logs
        SET is_claimed = true, claimed_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;

      const result = await db.asyncGet(query, [id]);
      
      if (result && result.items_earned) {
        try {
          result.items_earned = typeof result.items_earned === 'string'
            ? JSON.parse(result.items_earned)
            : result.items_earned;
        } catch (e) {
          console.error('Error parsing items_earned:', e);
          result.items_earned = [];
        }
      } else if (result) {
        result.items_earned = [];
      }

      return result;

    } catch (error) {
      console.error('Error marking adventure log as claimed:', error);
      throw error;
    }
  }

  /**
   * Get adventure log by adventure and Discord user
   * @param {number} adventureId - Adventure ID
   * @param {string} discordUserId - Discord user ID
   * @returns {Promise<Object|null>} Adventure log or null
   */
  static async getByAdventureAndDiscordUser(adventureId, discordUserId) {
    try {
      const query = `
        SELECT al.*, a.title as adventure_title, a.description as adventure_description
        FROM adventure_logs al
        LEFT JOIN adventures a ON al.adventure_id = a.id
        WHERE al.adventure_id = $1 AND al.discord_user_id = $2
      `;

      const log = await db.asyncGet(query, [adventureId, discordUserId]);
      
      if (log && log.items_earned) {
        try {
          log.items_earned = typeof log.items_earned === 'string'
            ? JSON.parse(log.items_earned)
            : log.items_earned;
        } catch (e) {
          console.error('Error parsing items_earned:', e);
          log.items_earned = [];
        }
      } else if (log) {
        log.items_earned = [];
      }

      return log;

    } catch (error) {
      console.error('Error getting adventure log by adventure and Discord user:', error);
      throw error;
    }
  }

  /**
   * Update adventure log
   * @param {number} id - Adventure log ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated adventure log
   */
  static async update(id, updateData) {
    try {
      const allowedFields = ['word_count', 'levels_earned', 'coins_earned', 'items_earned', 'is_claimed', 'claimed_at'];
      const updates = [];
      const params = [];

      Object.keys(updateData).forEach((key, index) => {
        if (allowedFields.includes(key)) {
          let value = updateData[key];
          
          // Handle JSON fields
          if (key === 'items_earned' && typeof value !== 'string') {
            value = JSON.stringify(value);
          }
          
          updates.push(`${key} = $${index + 1}`);
          params.push(value);
        }
      });

      if (updates.length === 0) {
        throw new Error('No valid fields to update');
      }

      params.push(id);

      const query = `
        UPDATE adventure_logs 
        SET ${updates.join(', ')}
        WHERE id = $${params.length}
        RETURNING *
      `;

      const result = await db.asyncGet(query, params);
      
      if (result && result.items_earned) {
        try {
          result.items_earned = typeof result.items_earned === 'string'
            ? JSON.parse(result.items_earned)
            : result.items_earned;
        } catch (e) {
          console.error('Error parsing items_earned:', e);
          result.items_earned = [];
        }
      } else if (result) {
        result.items_earned = [];
      }

      return result;

    } catch (error) {
      console.error('Error updating adventure log:', error);
      throw error;
    }
  }
}

module.exports = AdventureLog;
