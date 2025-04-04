const pool = require('../db');

class TrainerAchievement {
  /**
   * Get all trainer achievements
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Array>} - Array of trainer achievements
   */
  static async getByTrainerId(trainerId) {
    try {
      const query = `
        SELECT ta.*, a.name, a.description, a.category, a.requirement_type, a.requirement_value, a.requirement_subtype, a.icon, a.rewards
        FROM trainer_achievements ta
        JOIN achievements a ON ta.achievement_id = a.id
        WHERE ta.trainer_id = $1
        ORDER BY a.category, a."order", a.id
      `;

      const result = await pool.query(query, [trainerId]);
      return result.rows;
    } catch (error) {
      console.error(`Error getting trainer achievements for trainer ${trainerId}:`, error);
      return [];
    }
  }

  /**
   * Get a specific trainer achievement
   * @param {number} trainerId - Trainer ID
   * @param {number} achievementId - Achievement ID
   * @returns {Promise<Object|null>} - Trainer achievement or null if not found
   */
  static async getByTrainerAndAchievement(trainerId, achievementId) {
    try {
      const query = 'SELECT * FROM trainer_achievements WHERE trainer_id = $1 AND achievement_id = $2';
      const result = await pool.query(query, [trainerId, achievementId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error(`Error getting trainer achievement for trainer ${trainerId} and achievement ${achievementId}:`, error);
      return null;
    }
  }

  /**
   * Create a new trainer achievement
   * @param {Object} data - Trainer achievement data
   * @returns {Promise<Object|null>} - Created trainer achievement or null if failed
   */
  static async create(data) {
    try {
      const { trainer_id, achievement_id, progress = 0, is_complete = false, is_claimed = false } = data;

      const query = `
        INSERT INTO trainer_achievements (
          trainer_id, achievement_id, progress, is_complete, is_claimed
        )
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (trainer_id, achievement_id) DO NOTHING
        RETURNING *
      `;

      const values = [trainer_id, achievement_id, progress, is_complete, is_claimed];
      const result = await pool.query(query, values);

      return result.rows[0] || await this.getByTrainerAndAchievement(trainer_id, achievement_id);
    } catch (error) {
      console.error('Error creating trainer achievement:', error);
      return null;
    }
  }

  /**
   * Update a trainer achievement
   * @param {number} trainerId - Trainer ID
   * @param {number} achievementId - Achievement ID
   * @param {Object} data - Updated trainer achievement data
   * @returns {Promise<Object|null>} - Updated trainer achievement or null if failed
   */
  static async update(trainerId, achievementId, data) {
    try {
      // Build the SET clause dynamically based on provided data
      const updateFields = [];
      const values = [trainerId, achievementId];
      let paramIndex = 3;

      for (const [key, value] of Object.entries(data)) {
        if (key !== 'trainer_id' && key !== 'achievement_id' && key !== 'id') {
          updateFields.push(`${key} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      }

      // Add updated_at timestamp
      updateFields.push('updated_at = CURRENT_TIMESTAMP');

      if (updateFields.length === 0) {
        return await this.getByTrainerAndAchievement(trainerId, achievementId);
      }

      const query = `
        UPDATE trainer_achievements
        SET ${updateFields.join(', ')}
        WHERE trainer_id = $1 AND achievement_id = $2
        RETURNING *
      `;

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error(`Error updating trainer achievement for trainer ${trainerId} and achievement ${achievementId}:`, error);
      return null;
    }
  }

  /**
   * Mark an achievement as complete
   * @param {number} trainerId - Trainer ID
   * @param {number} achievementId - Achievement ID
   * @returns {Promise<Object|null>} - Updated trainer achievement or null if failed
   */
  static async markComplete(trainerId, achievementId) {
    try {
      const query = `
        UPDATE trainer_achievements
        SET is_complete = TRUE, completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE trainer_id = $1 AND achievement_id = $2
        RETURNING *
      `;

      const result = await pool.query(query, [trainerId, achievementId]);
      return result.rows[0];
    } catch (error) {
      console.error(`Error marking achievement ${achievementId} as complete for trainer ${trainerId}:`, error);
      return null;
    }
  }

  /**
   * Mark an achievement as claimed
   * @param {number} trainerId - Trainer ID
   * @param {number} achievementId - Achievement ID
   * @returns {Promise<Object|null>} - Updated trainer achievement or null if failed
   */
  static async markClaimed(trainerId, achievementId) {
    try {
      const query = `
        UPDATE trainer_achievements
        SET is_claimed = TRUE, claimed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE trainer_id = $1 AND achievement_id = $2
        RETURNING *
      `;

      const result = await pool.query(query, [trainerId, achievementId]);
      return result.rows[0];
    } catch (error) {
      console.error(`Error marking achievement ${achievementId} as claimed for trainer ${trainerId}:`, error);
      return null;
    }
  }

  /**
   * Update achievement progress
   * @param {number} trainerId - Trainer ID
   * @param {number} achievementId - Achievement ID
   * @param {number} progress - New progress value
   * @param {number} requirementValue - Achievement requirement value for auto-completion
   * @returns {Promise<Object|null>} - Updated trainer achievement or null if failed
   */
  static async updateProgress(trainerId, achievementId, progress, requirementValue) {
    try {
      // Check if the achievement is already complete
      const existingAchievement = await this.getByTrainerAndAchievement(trainerId, achievementId);

      if (existingAchievement && existingAchievement.is_complete) {
        return existingAchievement;
      }

      // Determine if the achievement should be marked as complete
      const isComplete = progress >= requirementValue;
      const completedAt = isComplete ? 'CURRENT_TIMESTAMP' : null;

      const query = `
        INSERT INTO trainer_achievements (
          trainer_id, achievement_id, progress, is_complete, completed_at
        )
        VALUES ($1, $2, $3, $4, ${completedAt})
        ON CONFLICT (trainer_id, achievement_id)
        DO UPDATE SET
          progress = $3,
          is_complete = $4,
          completed_at = ${completedAt},
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `;

      const result = await pool.query(query, [trainerId, achievementId, progress, isComplete]);
      return result.rows[0];
    } catch (error) {
      console.error(`Error updating progress for achievement ${achievementId} for trainer ${trainerId}:`, error);
      return null;
    }
  }

  /**
   * Create the trainer_achievements table if it doesn't exist
   * @returns {Promise<void>}
   */
  static async createTableIfNotExists() {
    try {
      const query = `
        CREATE TABLE IF NOT EXISTS trainer_achievements (
          id SERIAL PRIMARY KEY,
          trainer_id INTEGER NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
          achievement_id INTEGER NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
          progress INTEGER DEFAULT 0,
          is_complete BOOLEAN DEFAULT FALSE,
          is_claimed BOOLEAN DEFAULT FALSE,
          completed_at TIMESTAMP,
          claimed_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(trainer_id, achievement_id)
        );

        CREATE INDEX IF NOT EXISTS idx_trainer_achievements_trainer_id ON trainer_achievements(trainer_id);
        CREATE INDEX IF NOT EXISTS idx_trainer_achievements_achievement_id ON trainer_achievements(achievement_id);
      `;

      await pool.query(query);
      console.log('Trainer achievements table created or already exists');
    } catch (error) {
      console.error('Error creating trainer_achievements table:', error);
      throw error;
    }
  }
}

module.exports = TrainerAchievement;
