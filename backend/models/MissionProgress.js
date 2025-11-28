const db = require('../config/db');

/**
 * Mission Progress model
 */
class MissionProgress {
  /**
   * Get active missions for a user
   * @param {string} userId User ID (Discord ID)
   * @returns {Promise<Array>} Active missions
   */
  static async getActiveByUserId(userId) {
    try {
      const query = `
        SELECT um.*, m.title, m.description, m.difficulty, m.duration, m.required_progress
        FROM user_missions um
        JOIN missions m ON um.mission_id = m.id
        WHERE um.user_id = $1 AND um.status = 'active'
      `;
      return await db.asyncAll(query, [userId]);
    } catch (error) {
      console.error(`Error getting active missions for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get active missions for a trainer (legacy method for backward compatibility)
   * @param {number} trainerId Trainer ID
   * @returns {Promise<Array>} Active missions
   */
  static async getActiveByTrainerId(trainerId) {
    try {
      // Get the user ID for this trainer
      const trainer = await db.asyncGet('SELECT player_user_id FROM trainers WHERE id = $1', [trainerId]);
      if (!trainer || !trainer.player_user_id) {
        return [];
      }

      return await this.getActiveByUserId(trainer.player_user_id);
    } catch (error) {
      console.error(`Error getting active missions for trainer ${trainerId}:`, error);
      throw error;
    }
  }

  /**
   * Add progress to active missions for a user
   * @param {string} userId User ID (Discord ID)
   * @param {number} progress Progress to add
   * @returns {Promise<Object>} Updated missions
   */
  static async addProgressByUserId(userId, progress) {
    try {
      // Get active missions
      const activeMissions = await this.getActiveByUserId(userId);

      if (!activeMissions || activeMissions.length === 0) {
        return { success: false, message: 'No active missions found' };
      }

      const updatedMissions = [];
      const completedMissions = [];

      // Update progress for each mission
      for (const mission of activeMissions) {
        const newProgress = mission.current_progress + progress;
        const isCompleted = newProgress >= mission.required_progress;

        // Update mission progress
        const updateQuery = `
          UPDATE user_missions
          SET current_progress = $1, status = $2
          WHERE id = $3
        `;
        await db.asyncRun(updateQuery, [
          newProgress,
          isCompleted ? 'completed' : 'active',
          mission.id
        ]);

        if (isCompleted) {
          completedMissions.push({
            id: mission.id,
            title: mission.title,
            difficulty: mission.difficulty,
            reward_type: mission.reward_type,
            reward_amount: mission.reward_amount
          });
        } else {
          updatedMissions.push({
            id: mission.id,
            title: mission.title,
            difficulty: mission.difficulty,
            current_progress: newProgress,
            required_progress: mission.required_progress,
            progress_percentage: Math.floor((newProgress / mission.required_progress) * 100)
          });
        }
      }

      return {
        success: true,
        updatedMissions,
        completedMissions
      };
    } catch (error) {
      console.error(`Error adding progress for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Add progress to active missions for a trainer (legacy method for backward compatibility)
   * @param {number} trainerId Trainer ID
   * @param {number} progress Progress to add
   * @returns {Promise<Object>} Updated missions
   */
  static async addProgress(trainerId, progress) {
    try {
      // Get the user ID for this trainer
      const trainer = await db.asyncGet('SELECT player_user_id FROM trainers WHERE id = $1', [trainerId]);
      if (!trainer || !trainer.player_user_id) {
        return { success: false, message: 'Trainer not found or no associated user' };
      }

      return await this.addProgressByUserId(trainer.player_user_id, progress);
    } catch (error) {
      console.error(`Error adding progress for trainer ${trainerId}:`, error);
      throw error;
    }
  }

  /**
   * Claim rewards for completed missions by user ID
   * @param {number} missionId Mission ID
   * @param {string} userId User ID (Discord ID)
   * @returns {Promise<Object>} Claimed rewards
   */
  static async claimRewardsByUserId(missionId, userId) {
    try {
      // Get mission
      const query = `
        SELECT um.*, m.title, m.description, m.difficulty, m.reward_type, m.reward_amount, m.reward_item_id
        FROM user_missions um
        JOIN missions m ON um.mission_id = m.id
        WHERE um.id = $1 AND um.user_id = $2 AND um.status = 'completed' AND um.reward_claimed = 0
      `;
      const mission = await db.asyncGet(query, [missionId, userId]);

      if (!mission) {
        return { success: false, message: 'Mission not found or rewards already claimed' };
      }

      // Mark rewards as claimed
      const updateQuery = `
        UPDATE user_missions
        SET reward_claimed = 1
        WHERE id = $1
      `;
      await db.asyncRun(updateQuery, [missionId]);

      return {
        success: true,
        mission: {
          id: mission.id,
          title: mission.title,
          difficulty: mission.difficulty,
          reward_type: mission.reward_type,
          reward_amount: mission.reward_amount,
          reward_item_id: mission.reward_item_id
        }
      };
    } catch (error) {
      console.error(`Error claiming rewards for mission ${missionId} and user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Claim rewards for completed missions (legacy method for backward compatibility)
   * @param {number} missionId Mission ID
   * @param {number} trainerId Trainer ID
   * @returns {Promise<Object>} Claimed rewards
   */
  static async claimRewards(missionId, trainerId) {
    try {
      // Get the user ID for this trainer
      const trainer = await db.asyncGet('SELECT player_user_id FROM trainers WHERE id = $1', [trainerId]);
      if (!trainer || !trainer.player_user_id) {
        return { success: false, message: 'Trainer not found or no associated user' };
      }

      return await this.claimRewardsByUserId(missionId, trainer.player_user_id);
    } catch (error) {
      console.error(`Error claiming rewards for mission ${missionId} and trainer ${trainerId}:`, error);
      throw error;
    }
  }
}

module.exports = MissionProgress;
