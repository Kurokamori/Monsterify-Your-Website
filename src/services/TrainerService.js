const pool = require('../db');

/**
 * Service for trainer-related operations
 */
class TrainerService {
  /**
   * Get all trainers
   * @returns {Promise<Array>} - Array of trainers
   */
  static async getAllTrainers() {
    try {
      const result = await pool.query(`
        SELECT
          t.id,
          t.name,
          t.level,
          t.faction,
          t.user_id,
          u.discord_id
        FROM
          trainers t
        LEFT JOIN
          users u ON t.user_id = u.id
        ORDER BY
          t.name ASC
      `);

      return result.rows;
    } catch (error) {
      console.error('Error getting all trainers:', error);
      throw error;
    }
  }

  /**
   * Get trainers by Discord ID
   * @param {string} discordId - Discord user ID
   * @returns {Promise<Array>} - Array of trainers
   */
  static async getTrainersByDiscordId(discordId) {
    try {
      const result = await pool.query(`
        SELECT
          t.id,
          t.name,
          t.level,
          t.faction,
          t.player_user_id
        FROM
          trainers t
        WHERE
          t.player_user_id = $1
        ORDER BY
          t.name ASC
      `, [discordId]);

      return result.rows;
    } catch (error) {
      console.error('Error getting trainers by Discord ID:', error);
      throw error;
    }
  }

  /**
   * Get trainer by ID
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Object>} - Trainer object
   */
  static async getTrainerById(trainerId) {
    try {
      const result = await pool.query(`
        SELECT
          t.id,
          t.name,
          t.level,
          t.faction,
          t.player_user_id
        FROM
          trainers t
        WHERE
          t.id = $1
      `, [trainerId]);

      return result.rows[0];
    } catch (error) {
      console.error('Error getting trainer by ID:', error);
      throw error;
    }
  }
}

module.exports = TrainerService;
