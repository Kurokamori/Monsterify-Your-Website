const pool = require("../db");

class LocationActivitySession {
  /**
   * Create a new activity session
   * @param {Object} sessionData - Session data
   * @param {string} [sessionData.player_id] - Player ID (Discord user ID, required)
   * @param {string} sessionData.location - Location identifier
   * @param {string} sessionData.activity - Activity identifier
   * @param {number} sessionData.prompt_id - Prompt ID
   * @param {number} sessionData.duration_minutes - Duration in minutes
   * @returns {Promise<Object>} - Created session
   */
  static async create({
    player_id,
    location,
    activity,
    prompt_id,
    duration_minutes
  }) {
    try {
      const query = `
        INSERT INTO location_activity_sessions (
          player_id, location, activity, prompt_id, duration_minutes
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;

      const values = [
        player_id, location, activity, prompt_id, duration_minutes
      ];

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error("Error creating activity session:", error);
      throw error;
    }
  }

  /**
   * Get an activity session by ID
   * @param {number} sessionId - Session ID
   * @returns {Promise<Object>} - Activity session
   */
  static async getById(sessionId) {
    try {
      const query = `
        SELECT s.*, p.prompt_text, p.difficulty
        FROM location_activity_sessions s
        LEFT JOIN location_task_prompts p ON s.prompt_id = p.prompt_id
        WHERE s.session_id = $1
      `;

      const result = await pool.query(query, [sessionId]);

      // Parse rewards if they exist
      const session = result.rows[0] || null;

      if (session) {
        if (session.rewards) {
          try {
            // Parse rewards if they're a string
            if (typeof session.rewards === 'string') {
              session.rewards = JSON.parse(session.rewards);
            }

            // Ensure each reward has all required fields
            if (Array.isArray(session.rewards)) {
              session.rewards = session.rewards.map(reward => {
                // Ensure reward has both id and reward_id
                if (!reward.id && reward.reward_id) {
                  reward.id = reward.reward_id;
                } else if (!reward.reward_id && reward.id) {
                  reward.reward_id = reward.id;
                }

                // Ensure reward has both type and reward_type
                if (!reward.type && reward.reward_type) {
                  reward.type = reward.reward_type;
                } else if (!reward.reward_type && reward.type) {
                  reward.reward_type = reward.type;
                }

                // Ensure reward has both data and reward_data
                if (!reward.data && reward.reward_data) {
                  reward.data = reward.reward_data;
                } else if (!reward.reward_data && reward.data) {
                  reward.reward_data = reward.data;
                }

                // Add icon based on reward type
                switch (reward.type) {
                  case 'monster':
                    reward.icon = 'fas fa-dragon';
                    break;
                  case 'item':
                    reward.icon = 'fas fa-box';
                    break;
                  case 'coin':
                    reward.icon = 'fas fa-coins';
                    break;
                  case 'level':
                    reward.icon = 'fas fa-level-up-alt';
                    break;
                  default:
                    reward.icon = 'fas fa-gift';
                }

                // Set a default rarity if not present
                if (!reward.rarity) {
                  reward.rarity = 'common';
                }

                return reward;
              });
            }
          } catch (error) {
            console.error(`Error parsing rewards for session ${sessionId}:`, error);
            // Keep the original rewards if parsing fails
          }
        } else {
          // Initialize empty rewards array if none exists
          session.rewards = [];
        }
      }

      return session;
    } catch (error) {
      console.error(`Error getting activity session by ID ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Get active sessions for a trainer (using player_id)
   * @param {string} discordUserId - Discord User ID
   * @returns {Promise<Array>} - Array of active sessions
   */
  static async getActiveForTrainer(discordUserId) {
    try {
      const query = `
        SELECT s.*, p.prompt_text, p.difficulty
        FROM location_activity_sessions s
        LEFT JOIN location_task_prompts p ON s.prompt_id = p.prompt_id
        WHERE s.player_id = $1 AND s.completed = false
        ORDER BY s.start_time DESC
      `;

      const result = await pool.query(query, [discordUserId]);
      return result.rows;
    } catch (error) {
      console.error(`Error getting active sessions for player ${discordUserId}:`, error);
      throw error;
    }
  }

  /**
   * Get completed sessions for a trainer (using player_id)
   * @param {string} discordUserId - Discord User ID
   * @param {number} limit - Limit (default: 10)
   * @returns {Promise<Array>} - Array of completed sessions
   */
  static async getCompletedForTrainer(discordUserId, limit = 10) {
    try {
      const query = `
        SELECT s.*, p.prompt_text, p.difficulty
        FROM location_activity_sessions s
        LEFT JOIN location_task_prompts p ON s.prompt_id = p.prompt_id
        WHERE s.player_id = $1 AND s.completed = true
        ORDER BY s.end_time DESC
        LIMIT $2
      `;

      const result = await pool.query(query, [discordUserId, limit]);
      return result.rows;
    } catch (error) {
      console.error(`Error getting completed sessions for player ${discordUserId}:`, error);
      throw error;
    }
  }

  /**
   * Get active sessions for a player (user)
   * @param {string} discordUserId - Discord User ID
   * @returns {Promise<Array>} - Array of active sessions
   */
  static async getActiveForPlayer(discordUserId) {
    try {
      const query = `
        SELECT s.*, p.prompt_text, p.difficulty
        FROM location_activity_sessions s
        LEFT JOIN location_task_prompts p ON s.prompt_id = p.prompt_id
        WHERE s.player_id = $1 AND s.completed = false
        ORDER BY s.start_time DESC
      `;

      const result = await pool.query(query, [discordUserId]);
      return result.rows;
    } catch (error) {
      console.error(`Error getting active sessions for player ${discordUserId}:`, error);
      throw error;
    }
  }

  /**
   * Complete an activity session and assign rewards
   * @param {number} sessionId - Session ID
   * @param {Array} rewards - Array of rewards
   * @returns {Promise<Object>} - Updated session
   */
  static async complete(sessionId, rewards = []) {
    try {
      // Start a transaction
      await pool.query("BEGIN");

      // Update the session
      const query = `
        UPDATE location_activity_sessions
        SET
          completed = true,
          end_time = CURRENT_TIMESTAMP,
          rewards = $2,
          updated_at = CURRENT_TIMESTAMP
        WHERE session_id = $1
        RETURNING *
      `;

      // Format rewards for storage
      const formattedRewards = rewards.map(reward => {
        // Ensure reward has an ID
        if (!reward.reward_id && !reward.id) {
          reward.reward_id = Date.now() + Math.floor(Math.random() * 1000);
        }
        if (!reward.id) {
          reward.id = reward.reward_id;
        }

        // Ensure reward has a type
        if (!reward.type && reward.reward_type) {
          reward.type = reward.reward_type;
        } else if (!reward.reward_type && reward.type) {
          reward.reward_type = reward.type;
        } else if (!reward.type && !reward.reward_type) {
          reward.type = 'generic';
          reward.reward_type = 'generic';
        }

        // Ensure reward has data
        if (!reward.data && reward.reward_data) {
          reward.data = reward.reward_data;
        } else if (!reward.reward_data && reward.data) {
          reward.reward_data = reward.data;
        } else if (!reward.data && !reward.reward_data) {
          reward.data = {};
          reward.reward_data = {};
        }

        // Add icon based on reward type
        switch (reward.type) {
          case 'monster':
            reward.icon = 'fas fa-dragon';
            break;
          case 'item':
            reward.icon = 'fas fa-box';
            break;
          case 'coin':
            reward.icon = 'fas fa-coins';
            break;
          case 'level':
            reward.icon = 'fas fa-level-up-alt';
            break;
          default:
            reward.icon = 'fas fa-gift';
        }

        // Set a default rarity if not present
        if (!reward.rarity) {
          reward.rarity = 'common';
        }

        // For coin rewards, ensure amount is properly set
        if (reward.type === 'coin') {
          const coinData = reward.data || {};
          if (typeof coinData.amount === 'number') {
            // Make sure amount is accessible directly
            reward.amount = coinData.amount;
          } else if (coinData.amount && typeof coinData.amount === 'object') {
            // If amount is a range, pick a random value
            const min = coinData.amount.min || 50;
            const max = coinData.amount.max || 150;
            const randomAmount = Math.floor(Math.random() * (max - min + 1)) + min;
            reward.amount = randomAmount;
            reward.data.amount = randomAmount;
            reward.reward_data.amount = randomAmount;
          }
        }

        return reward;
      });

      console.log('Formatted rewards for storage:', JSON.stringify(formattedRewards, null, 2));

      const values = [
        sessionId,
        JSON.stringify(formattedRewards)
      ];

      const result = await pool.query(query, values);
      const updatedSession = result.rows[0];

      if (!updatedSession) {
        await pool.query("ROLLBACK");
        throw new Error(`Session with ID ${sessionId} not found`);
      }

      // Commit the transaction
      await pool.query("COMMIT");

      return updatedSession;
    } catch (error) {
      // Rollback the transaction on error
      await pool.query("ROLLBACK");
      console.error(`Error completing activity session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Delete an activity session
   * @param {number} sessionId - Session ID
   * @returns {Promise<boolean>} - True if deleted successfully
   */
  static async delete(sessionId) {
    try {
      const query = `
        DELETE FROM location_activity_sessions
        WHERE session_id = $1
        RETURNING session_id
      `;

      const result = await pool.query(query, [sessionId]);
      return result.rowCount > 0;
    } catch (error) {
      console.error(`Error deleting activity session ${sessionId}:`, error);
      throw error;
    }
  }
}

module.exports = LocationActivitySession;
