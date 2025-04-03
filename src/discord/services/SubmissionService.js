const pool = require('../../db');
const TrainerService = require('../../services/TrainerService');
const MonsterService = require('../../services/MonsterService');
const RewardSystem = require('../../utils/RewardSystem');

/**
 * Service for handling submissions
 */
class SubmissionService {
  /**
   * Process an art submission
   * @param {Object} submission - Submission data
   * @param {string} submission.type - Art type (sketch, sketch_set, line_art, rendered, polished)
   * @param {string} submission.url - URL to the artwork
   * @param {string} submission.trainerId - Trainer ID to receive rewards
   * @param {string} submission.discordId - Discord user ID
   * @returns {Promise<Object>} - Submission result
   */
  static async processArtSubmission(submission) {
    try {
      // Validate submission
      if (!submission.type || !submission.url || !submission.trainerId) {
        throw new Error('Missing required fields');
      }

      // Calculate rewards based on art type
      const rewards = this._calculateArtRewards(submission.type);

      // Save submission to database
      const result = await pool.query(`
        INSERT INTO submissions (
          type,
          url,
          trainer_id,
          discord_id,
          levels_earned,
          coins_earned,
          status
        ) VALUES (
          $1, $2, $3, $4, $5, $6, 'approved'
        ) RETURNING id
      `, [
        'art',
        submission.url,
        submission.trainerId,
        submission.discordId,
        rewards.levels,
        rewards.coins
      ]);

      // Apply rewards to trainer
      await this._applyRewardsToTrainer(submission.trainerId, rewards.levels, rewards.coins);

      // Process additional rewards (mission progress, garden points, boss damage)
      let additionalRewards = null;
      try {
        // Get the user ID from the trainer ID
        const trainerQuery = `
          SELECT player_user_id FROM trainers
          WHERE id = $1
          LIMIT 1
        `;
        const trainerResult = await pool.query(trainerQuery, [submission.trainerId]);

        if (trainerResult.rows.length > 0) {
          const playerUserId = trainerResult.rows[0].player_user_id;

          // Process additional rewards
          additionalRewards = await RewardSystem.processAdditionalRewards(playerUserId, 'art', {
            type: submission.type,
            levels: rewards.levels,
            coins: rewards.coins
          });
        }
      } catch (error) {
        console.error('Error processing additional rewards:', error);
      }

      return {
        success: true,
        submissionId: result.rows[0].id,
        rewards,
        additionalRewards,
        flavorText: additionalRewards?.flavorText || ''
      };
    } catch (error) {
      console.error('Error processing art submission:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process a writing submission
   * @param {Object} submission - Submission data
   * @param {number} submission.wordCount - Word count
   * @param {string} submission.url - URL to the writing
   * @param {string} submission.trainerId - Trainer ID to receive rewards
   * @param {string} submission.discordId - Discord user ID
   * @returns {Promise<Object>} - Submission result
   */
  static async processWritingSubmission(submission) {
    try {
      // Validate submission
      if (!submission.wordCount || !submission.url || !submission.trainerId) {
        throw new Error('Missing required fields');
      }

      // Calculate rewards based on word count
      const rewards = this._calculateWritingRewards(submission.wordCount);

      // Save submission to database
      const result = await pool.query(`
        INSERT INTO submissions (
          type,
          url,
          trainer_id,
          discord_id,
          levels_earned,
          coins_earned,
          word_count,
          status
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, 'approved'
        ) RETURNING id
      `, [
        'writing',
        submission.url,
        submission.trainerId,
        submission.discordId,
        rewards.levels,
        rewards.coins,
        submission.wordCount
      ]);

      // Apply rewards to trainer
      await this._applyRewardsToTrainer(submission.trainerId, rewards.levels, rewards.coins);

      // Process additional rewards (mission progress, garden points, boss damage)
      let additionalRewards = null;
      try {
        // Get the user ID from the trainer ID
        const trainerQuery = `
          SELECT player_user_id FROM trainers
          WHERE id = $1
          LIMIT 1
        `;
        const trainerResult = await pool.query(trainerQuery, [submission.trainerId]);

        if (trainerResult.rows.length > 0) {
          const playerUserId = trainerResult.rows[0].player_user_id;

          // Process additional rewards
          additionalRewards = await RewardSystem.processAdditionalRewards(playerUserId, 'writing', {
            wordCount: submission.wordCount,
            levels: rewards.levels,
            coins: rewards.coins
          });
        }
      } catch (error) {
        console.error('Error processing additional rewards:', error);
      }

      return {
        success: true,
        submissionId: result.rows[0].id,
        rewards,
        additionalRewards,
        flavorText: additionalRewards?.flavorText || ''
      };
    } catch (error) {
      console.error('Error processing writing submission:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process a prompt submission
   * @param {Object} submission - Submission data
   * @param {string} submission.prompt - Prompt text
   * @param {string} submission.category - Prompt category
   * @param {string} submission.discordId - Discord user ID
   * @returns {Promise<Object>} - Submission result
   */
  static async processPromptSubmission(submission) {
    try {
      // Validate submission
      if (!submission.prompt || !submission.category) {
        throw new Error('Missing required fields');
      }

      // Save prompt to database
      const result = await pool.query(`
        INSERT INTO prompts (
          text,
          category,
          submitted_by
        ) VALUES (
          $1, $2, $3
        ) RETURNING id
      `, [
        submission.prompt,
        submission.category,
        submission.discordId
      ]);

      return {
        success: true,
        promptId: result.rows[0].id
      };
    } catch (error) {
      console.error('Error processing prompt submission:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process a reference submission
   * @param {Object} submission - Submission data
   * @param {string} submission.url - URL to the reference
   * @param {string} submission.trainerId - Trainer ID (if trainer reference)
   * @param {string} submission.monsterId - Monster ID (if monster reference)
   * @param {string} submission.discordId - Discord user ID
   * @returns {Promise<Object>} - Submission result
   */
  static async processReferenceSubmission(submission) {
    try {
      // Validate submission
      if (!submission.url || (!submission.trainerId && !submission.monsterId)) {
        throw new Error('Missing required fields');
      }

      // Calculate rewards for reference
      const rewards = {
        levels: 6,
        coins: 200
      };

      // Determine reference type and ID
      const referenceType = submission.trainerId ? 'trainer' : 'monster';
      const referenceId = submission.trainerId || submission.monsterId;

      // Save submission to database
      const result = await pool.query(`
        INSERT INTO submissions (
          type,
          url,
          trainer_id,
          discord_id,
          levels_earned,
          coins_earned,
          reference_type,
          reference_id,
          status
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, 'approved'
        ) RETURNING id
      `, [
        'reference',
        submission.url,
        submission.trainerId || null,
        submission.discordId,
        rewards.levels,
        rewards.coins,
        referenceType,
        referenceId
      ]);

      // Apply rewards to trainer
      if (submission.trainerId) {
        await this._applyRewardsToTrainer(submission.trainerId, rewards.levels, rewards.coins);

        // Process additional rewards (mission progress, garden points, boss damage)
        let additionalRewards = null;
        try {
          // Get the user ID from the trainer ID
          const trainerQuery = `
            SELECT player_user_id FROM trainers
            WHERE id = $1
            LIMIT 1
          `;
          const trainerResult = await pool.query(trainerQuery, [submission.trainerId]);

          if (trainerResult.rows.length > 0) {
            const playerUserId = trainerResult.rows[0].player_user_id;

            // Process additional rewards
            additionalRewards = await RewardSystem.processAdditionalRewards(playerUserId, 'reference', {
              referenceType: submission.referenceType,
              levels: rewards.levels,
              coins: rewards.coins
            });
          }
        } catch (error) {
          console.error('Error processing additional rewards:', error);
        }

        return {
          success: true,
          submissionId: result.rows[0].id,
          rewards,
          additionalRewards,
          flavorText: additionalRewards?.flavorText || ''
        };
      }

      return {
        success: true,
        submissionId: result.rows[0].id,
        rewards
      };
    } catch (error) {
      console.error('Error processing reference submission:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Calculate rewards for art submission
   * @param {string} artType - Art type
   * @returns {Object} - Rewards object with levels and coins
   * @private
   */
  static _calculateArtRewards(artType) {
    const rewardsMap = {
      'sketch': { levels: 1, coins: 50 },
      'sketch_set': { levels: 3, coins: 150 },
      'line_art': { levels: 3, coins: 150 },
      'rendered': { levels: 5, coins: 250 },
      'polished': { levels: 7, coins: 350 }
    };

    return rewardsMap[artType] || { levels: 1, coins: 50 };
  }

  /**
   * Calculate rewards for writing submission
   * @param {number} wordCount - Word count
   * @returns {Object} - Rewards object with levels and coins
   * @private
   */
  static _calculateWritingRewards(wordCount) {
    // 1 level per 50 words, 1 coin per word
    const levels = Math.ceil(wordCount / 50);
    const coins = wordCount;

    return { levels, coins };
  }

  /**
   * Apply rewards to trainer
   * @param {string} trainerId - Trainer ID
   * @param {number} levels - Levels to add
   * @param {number} coins - Coins to add
   * @returns {Promise<void>}
   * @private
   */
  static async _applyRewardsToTrainer(trainerId, levels, coins) {
    try {
      // Get current trainer data
      const trainer = await TrainerService.getTrainerById(trainerId);

      if (!trainer) {
        throw new Error('Trainer not found');
      }

      // Calculate new level and coins
      const currentLevel = trainer.level || 1;
      const newLevel = currentLevel + levels;

      // Update trainer
      await pool.query(`
        UPDATE trainers
        SET
          level = $1,
          coins = COALESCE(coins, 0) + $2
        WHERE
          id = $3
      `, [newLevel, coins, trainerId]);
    } catch (error) {
      console.error('Error applying rewards to trainer:', error);
      throw error;
    }
  }
}

module.exports = SubmissionService;
