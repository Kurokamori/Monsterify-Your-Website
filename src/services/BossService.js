const Boss = require('../models/Boss');
const Trainer = require('../models/Trainer');

class BossService {
  /**
   * Get the current boss with additional information
   * @param {number} trainerId - Trainer ID to get damage for
   * @returns {Promise<Object>} - Boss data with additional information
   */
  static async getCurrentBossWithInfo(trainerId) {
    try {
      // Get the current boss
      const boss = await Boss.getCurrentBoss();

      if (!boss) {
        return {
          success: true,
          boss: null,
          message: 'No active boss found'
        };
      }

      // Get the trainer's damage
      const damage = await Boss.getTrainerDamage(boss.boss_id, trainerId);

      // Get top damagers
      const topDamagers = await Boss.getTopDamagers(boss.boss_id, 10);

      // Check if the boss is defeated and if there are rewards
      let rewards = null;
      if (boss.is_defeated) {
        rewards = await Boss.getTrainerRewards(boss.boss_id, trainerId);
      }

      return {
        success: true,
        boss,
        damage,
        topDamagers,
        rewards
      };
    } catch (error) {
      console.error('Error getting current boss with info:', error);
      return {
        success: false,
        message: 'Error getting current boss information'
      };
    }
  }

  /**
   * Calculate damage amount based on source and parameters
   * @param {string} source - Source of damage (task, habit, art, writing)
   * @param {Object} params - Parameters for damage calculation
   * @returns {number} - Amount of damage to deal
   */
  static calculateDamage(source, params = {}) {
    // Base damage values
    const baseDamage = {
      task: 10,
      habit: 5,
      art: 50,
      writing: 25,
      antique: 30,
      garden: 15,
      farm: 20,
      game_corner: 15
    };

    // Get base damage for the source
    let damage = baseDamage[source] || 1;

    // Apply source-specific modifiers
    switch (source) {
      case 'task':
        // Tasks get bonus damage based on difficulty
        const difficultyMultiplier = {
          easy: 0.5,
          medium: 1,
          hard: 2,
          very_hard: 3
        };
        damage *= difficultyMultiplier[params.difficulty] || 1;
        break;

      case 'habit':
        // Habits get bonus damage based on streak
        const streak = params.streak || 0;
        damage += Math.min(streak, 20); // Cap streak bonus at 20
        break;

      case 'art':
        // Art gets bonus damage based on complexity and effort
        const complexity = params.complexity || 1;
        damage *= complexity;
        break;

      case 'writing':
        // Writing gets bonus damage based on word count
        const wordCount = params.wordCount || 0;
        damage += Math.floor(wordCount / 100); // 1 extra damage per 100 words
        break;

      case 'antique':
        // Antiques get bonus damage based on rarity
        const rarityMultiplier = {
          common: 0.8,
          uncommon: 1,
          rare: 1.5,
          very_rare: 2,
          legendary: 3
        };
        damage *= rarityMultiplier[params.rarity] || 1;
        break;

      case 'garden':
        // Garden gets bonus damage based on points
        damage += params.points || 0;
        break;

      case 'farm':
        // Farm gets bonus damage based on points
        damage += params.points || 0;
        break;

      case 'game_corner':
        // Game Corner gets bonus damage based on productivity and sessions
        const productivity = params.productivity || 0;
        const sessions = params.sessions || 0;
        damage += (productivity / 10) + (sessions * 2);
        break;

      default:
        // Default case, no additional modifiers
        break;
    }

    // Round to nearest integer
    return Math.max(1, Math.round(damage));
  }

  /**
   * Deal damage to the current boss from a specific source
   * @param {number} trainerId - Trainer ID dealing the damage
   * @param {string} source - Source of damage (task, habit, art, writing)
   * @param {Object} params - Parameters for damage calculation
   * @returns {Promise<Object>} - Result of the damage operation
   */
  static async dealDamage(trainerId, source, params = {}) {
    try {
      // Get the current boss
      const boss = await Boss.getCurrentBoss();

      if (!boss) {
        return {
          success: false,
          message: 'No active boss found'
        };
      }

      // Check if the boss is already defeated
      if (boss.is_defeated) {
        return {
          success: false,
          message: 'This boss has already been defeated'
        };
      }

      // Calculate damage amount - use the provided damageAmount or calculate a random amount between 1-3
      const damageAmount = params.damageAmount || (Math.floor(Math.random() * 3) + 1);

      // Deal damage to the boss
      const updatedBoss = await Boss.damageBoss(boss.boss_id, trainerId, damageAmount, source);

      // Get updated information
      const damage = await Boss.getTrainerDamage(boss.boss_id, trainerId);
      const topDamagers = await Boss.getTopDamagers(boss.boss_id, 10);

      // Check if the boss was defeated and if there are rewards
      let rewards = null;
      if (updatedBoss.is_defeated) {
        rewards = await Boss.getTrainerRewards(boss.boss_id, trainerId);
      }

      return {
        success: true,
        boss: updatedBoss,
        damage,
        topDamagers,
        rewards,
        damageAmount,
        message: `Successfully dealt ${damageAmount} damage to ${boss.name}`
      };
    } catch (error) {
      console.error('Error dealing damage to boss:', error);
      return {
        success: false,
        message: error.message || 'Error dealing damage to boss'
      };
    }
  }

  /**
   * Create a new boss for the current month
   * @param {Object} bossData - Boss data (name, flavor_text, image_url, max_health)
   * @returns {Promise<Object>} - Created boss
   */
  static async createMonthlyBoss(bossData) {
    try {
      // Create the boss
      const boss = await Boss.create(bossData);

      if (!boss) {
        return {
          success: false,
          message: 'Error creating boss'
        };
      }

      return {
        success: true,
        boss,
        message: `Successfully created new boss: ${boss.name}`
      };
    } catch (error) {
      console.error('Error creating monthly boss:', error);
      return {
        success: false,
        message: error.message || 'Error creating monthly boss'
      };
    }
  }

  /**
   * Claim rewards for a defeated boss
   * @param {number} bossId - Boss ID
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Object>} - Result of the claim operation
   */
  static async claimRewards(bossId, trainerId) {
    try {
      // Get the boss
      const boss = await Boss.getById(bossId);

      if (!boss) {
        return {
          success: false,
          message: 'Boss not found'
        };
      }

      // Check if the boss is defeated
      if (!boss.is_defeated) {
        return {
          success: false,
          message: 'Cannot claim rewards for a boss that is not defeated'
        };
      }

      // Get the rewards
      const rewards = await Boss.getTrainerRewards(bossId, trainerId);

      if (!rewards) {
        return {
          success: false,
          message: 'No rewards found for this trainer'
        };
      }

      // Check if already claimed
      if (rewards.is_claimed) {
        return {
          success: false,
          message: 'Rewards already claimed'
        };
      }

      // Claim the rewards
      const claimedRewards = await Boss.claimRewards(bossId, trainerId);

      return {
        success: true,
        rewards: claimedRewards,
        message: 'Successfully claimed rewards'
      };
    } catch (error) {
      console.error('Error claiming rewards:', error);
      return {
        success: false,
        message: error.message || 'Error claiming rewards'
      };
    }
  }
}

module.exports = BossService;
