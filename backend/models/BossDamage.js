const db = require('../config/db');
const { buildLimit } = require('../utils/dbUtils');

/**
 * Boss Damage model
 */
class BossDamage {
  /**
   * Get active boss
   * @returns {Promise<Object>} Active boss
   */
  static async getActiveBoss() {
    try {
      const query = `
        SELECT *
        FROM bosses
        WHERE status = 'active'
        ORDER BY start_date DESC
        LIMIT $1`;
      return await db.asyncGet(query, [1]);
    } catch (error) {
      console.error('Error getting active boss:', error);
      throw error;
    }
  }

  /**
   * Get boss by ID
   * @param {number} bossId Boss ID
   * @returns {Promise<Object>} Boss
   */
  static async getBossById(bossId) {
    try {
      const query = 'SELECT * FROM bosses WHERE id = $1';
      return await db.asyncGet(query, [bossId]);
    } catch (error) {
      console.error(`Error getting boss with ID ${bossId}:`, error);
      throw error;
    }
  }

  /**
   * Get damage for a boss
   * @param {number} bossId Boss ID
   * @returns {Promise<Array>} Boss damage
   */
  static async getDamageByBossId(bossId) {
    try {
      const query = `
        SELECT bd.*, u.username
        FROM boss_damage bd
        LEFT JOIN users u ON (bd.user_id = u.id OR bd.user_id::text = u.discord_id)
        WHERE bd.boss_id = $1
        ORDER BY bd.damage_amount DESC
      `;
      return await db.asyncAll(query, [bossId]);
    } catch (error) {
      console.error(`Error getting damage for boss ${bossId}:`, error);
      throw error;
    }
  }

  /**
   * Get damage leaderboard for a boss
   * @param {number} bossId Boss ID
   * @param {number} limit Limit number of results
   * @returns {Promise<Array>} Leaderboard data
   */
  static async getLeaderboard(bossId, limit = 10) {
    try {
      const query = `
        SELECT
          u.id as user_id,
          u.username,
          u.discord_id as discord_id,
          SUM(bd.damage_amount) as total_damage,
          COUNT(bd.id) as submission_count
        FROM boss_damage bd
        LEFT JOIN users u ON (bd.user_id = u.id OR bd.user_id::text = u.discord_id)
        WHERE bd.boss_id = $1
        GROUP BY u.id, u.username, u.discord_id
        ORDER BY total_damage DESC
        LIMIT $2`;
      return await db.asyncAll(query, [bossId, limit]);
    } catch (error) {
      console.error(`Error getting leaderboard for boss ${bossId}:`, error);
      throw error;
    }
  }

  /**
   * Get damage for a user
   * @param {number} userId User ID
   * @param {number} bossId Boss ID
   * @returns {Promise<number>} Total damage
   */
  static async getUserDamage(userId, bossId) {
    try {
      const query = `
        SELECT SUM(damage_amount) as total_damage
        FROM boss_damage
        WHERE user_id = $1 AND boss_id = $2
      `;
      const result = await db.asyncGet(query, [userId, bossId]);
      return result ? result.total_damage || 0 : 0;
    } catch (error) {
      console.error(`Error getting damage for user ${userId} on boss ${bossId}:`, error);
      throw error;
    }
  }

  /**
   * Add damage to a boss
   * @param {number} bossId Boss ID
   * @param {number} userId User ID
   * @param {number} damageAmount Damage amount
   * @param {number} submissionId Submission ID (optional)
   * @returns {Promise<Object>} Damage result
   */
  static async addDamage(bossId, userId, damageAmount, submissionId = null) {
    try {
      // Get boss
      const boss = await this.getBossById(bossId);

      if (!boss) {
        return { success: false, message: 'Boss not found' };
      }

      if (boss.status !== 'active') {
        return { success: false, message: 'Boss is not active' };
      }

      // Add damage
      const query = `
        INSERT INTO boss_damage (boss_id, user_id, damage_amount, submission_id)
        VALUES ($1, $2, $3, $4)
      `;
      await db.asyncRun(query, [bossId, userId, damageAmount, submissionId]);

      // Update boss health
      const newHealth = Math.max(0, boss.current_hp - damageAmount);
      const updateQuery = `
        UPDATE bosses
        SET current_hp = $1, status = $2
        WHERE id = $3
      `;
      await db.asyncRun(updateQuery, [
        newHealth,
        newHealth <= 0 ? 'defeated' : 'active',
        bossId
      ]);

      // Check if boss was defeated
      const wasDefeated = newHealth <= 0;

      if (wasDefeated) {
        // Process boss defeat
        await this.processBossDefeat(bossId);
      }

      return {
        success: true,
        message: `Dealt ${damageAmount} damage to ${boss.name}`,
        boss: {
          id: boss.id,
          name: boss.name,
          currentHealth: newHealth,
          totalHealth: boss.total_health,
          healthPercentage: Math.floor((newHealth / boss.total_health) * 100),
          wasDefeated
        }
      };
    } catch (error) {
      console.error(`Error adding damage to boss ${bossId}:`, error);
      throw error;
    }
  }

  /**
   * Get defeated bosses with rankings
   * @param {number} limit Limit number of results
   * @returns {Promise<Array>} Defeated bosses with rankings
   */
  static async getDefeatedBosses(limit = 10) {
    try {
      let query = `
        SELECT 
          b.id,
          b.name,
          b.description,
          b.image_url,
          b.total_hp,
          b.current_hp,
          b.month,
          b.year,
          b.status,
          b.reward_monster_data,
          b.grunt_monster_data,
          b.start_date,
          b.created_at,
          bd_top.top_users,
          bd_total.total_participants
        FROM bosses b
        LEFT JOIN (
          SELECT 
            boss_id,
            json_agg(
              json_build_object(
                'user_id', user_id,
                'username', username,
                'discord_id', discord_id,
                'total_damage', total_damage,
                'rank', rank_num
              )
            ) as top_users
          FROM (
            SELECT
              bd.boss_id,
              u.id as user_id,
              u.username,
              u.discord_id,
              SUM(bd.damage_amount) as total_damage,
              ROW_NUMBER() OVER (PARTITION BY bd.boss_id ORDER BY SUM(bd.damage_amount) DESC) as rank_num
            FROM boss_damage bd
            LEFT JOIN users u ON (bd.user_id = u.id OR bd.user_id::text = u.discord_id)
            GROUP BY bd.boss_id, u.id, u.username, u.discord_id
          ) ranked
          WHERE rank_num <= 10
          GROUP BY boss_id
        ) bd_top ON b.id = bd_top.boss_id
        LEFT JOIN (
          SELECT 
            boss_id,
            COUNT(DISTINCT user_id) as total_participants
          FROM boss_damage
          GROUP BY boss_id
        ) bd_total ON b.id = bd_total.boss_id
        WHERE b.status = 'defeated'
        ORDER BY b.start_date DESC`;
      query += ` LIMIT $1`;
      const params = [limit];
      
      const bosses = await db.asyncAll(query, params);
      
      // In PostgreSQL, json_agg returns objects directly, no need to parse
      return bosses.map(boss => ({
        ...boss,
        top_users: boss.top_users || [],
        total_participants: boss.total_participants || 0
      }));
    } catch (error) {
      console.error('Error getting defeated bosses:', error);
      throw error;
    }
  }

  /**
   * Get defeated boss by ID with full rankings and rewards
   * @param {number} bossId Boss ID
   * @param {number} userId Optional user ID to check reward claim status
   * @returns {Promise<Object>} Defeated boss with rankings and rewards
   */
  static async getDefeatedBossById(bossId, userId = null) {
    try {
      const boss = await this.getBossById(bossId);
      
      if (!boss || boss.status !== 'defeated') {
        return null;
      }

      // Get full leaderboard
      const leaderboard = await this.getLeaderboard(bossId, 100);
      
      // Get rewards info
      const rewardsQuery = `
        SELECT 
          brc.*,
          u.username,
          u.discord_id
        FROM boss_reward_claims brc
        LEFT JOIN users u ON (brc.user_id = u.id OR brc.user_id::text = u.discord_id)
        WHERE brc.boss_id = $1
        ORDER BY brc.rank_position ASC
      `;
      const rewards = await db.asyncAll(rewardsQuery, [bossId]);
      
      // Get total participants
      const participantsQuery = `
        SELECT COUNT(DISTINCT user_id) as total_participants
        FROM boss_damage
        WHERE boss_id = $1
      `;
      const participantsResult = await db.asyncGet(participantsQuery, [bossId]);
      
      // Check if current user has unclaimed reward for this boss
      let userReward = null;
      if (userId) {
        const userRewardQuery = `
          SELECT * FROM boss_reward_claims
          WHERE boss_id = $1 AND user_id = $2
        `;
        userReward = await db.asyncGet(userRewardQuery, [bossId, userId]);
      }
      
      return {
        boss,
        leaderboard: leaderboard.map((entry, index) => ({
          ...entry,
          rank: index + 1,
          reward_claim: rewards.find(r => r.user_id === entry.user_id)
        })),
        rewards,
        userReward,
        total_participants: participantsResult ? participantsResult.total_participants : 0
      };
    } catch (error) {
      console.error(`Error getting defeated boss ${bossId}:`, error);
      throw error;
    }
  }

  /**
   * Process boss defeat
   * @param {number} bossId Boss ID
   * @returns {Promise<void>}
   */
  static async processBossDefeat(bossId) {
    try {
      // Get boss
      const boss = await this.getBossById(bossId);

      if (!boss) {
        throw new Error('Boss not found');
      }

      // Get top damage dealers
      const damageQuery = `
        SELECT user_id, SUM(damage_amount) as total_damage
        FROM boss_damage
        WHERE boss_id = $1
        GROUP BY user_id
        ORDER BY total_damage DESC
      `;
      const damageDealers = await db.asyncAll(damageQuery, [bossId]);

      if (!damageDealers || damageDealers.length === 0) {
        return;
      }

      // Create reward claims for all participants
      for (let i = 0; i < damageDealers.length; i++) {
        const damageDealer = damageDealers[i];
        const isTopDamage = i === 0;
        const rewardType = isTopDamage ? 'boss_monster' : 'grunt_monster';
        
        // Only create rewards if appropriate monster data exists
        const hasReward = (isTopDamage && boss.reward_monster_data) || 
                         (!isTopDamage && boss.grunt_monster_data);
        
        if (hasReward) {
          const rewardQuery = `
            INSERT INTO boss_reward_claims (
              boss_id, user_id, reward_type, damage_dealt, rank_position
            ) VALUES ($1, $2, $3, $4, $5)
          `;
          await db.asyncRun(rewardQuery, [
            bossId,
            damageDealer.user_id,
            rewardType,
            damageDealer.total_damage,
            i + 1
          ]);
        }
      }
    } catch (error) {
      console.error(`Error processing boss defeat for boss ${bossId}:`, error);
      throw error;
    }
  }

  /**
   * Get unclaimed rewards for a user
   * @param {number} userId User ID (can be internal ID or Discord ID)
   * @returns {Promise<Array>} Unclaimed rewards
   */
  static async getUnclaimedRewards(userId) {
    try {
      // First, try to find the user in the users table to get both IDs
      const userQuery = `
        SELECT id, discord_id 
        FROM users 
        WHERE id = $1 OR discord_id = $1::text
      `;
      const user = await db.asyncGet(userQuery, [userId]);
      
      if (!user) {
        console.log(`No user found for ID: ${userId}`);
        return [];
      }

      // Query rewards using both possible user IDs
      const query = `
        SELECT 
          brc.*,
          b.name as boss_name,
          b.image_url as boss_image,
          b.reward_monster_data,
          b.grunt_monster_data
        FROM boss_reward_claims brc
        JOIN bosses b ON brc.boss_id = b.id
        WHERE (brc.user_id = $1 OR brc.user_id::text = $2) AND brc.is_claimed = FALSE
        ORDER BY b.start_date DESC
      `;
      return await db.asyncAll(query, [user.id, user.discord_id]);
    } catch (error) {
      console.error(`Error getting unclaimed rewards for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Claim a boss reward
   * @param {number} bossId Boss ID
   * @param {number} userId User ID (can be internal ID or Discord ID)
   * @param {string} monsterName Name for the monster
   * @param {number} trainerId Trainer to assign monster to
   * @returns {Promise<Object>} Claim result
   */
  static async claimReward(bossId, userId, monsterName, trainerId) {
    try {
      // First, try to find the user in the users table to get both IDs
      const userQuery = `
        SELECT id, discord_id 
        FROM users 
        WHERE id = $1 OR discord_id = $1::text
      `;
      const user = await db.asyncGet(userQuery, [userId]);
      
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      // Check if reward exists and is unclaimed
      const rewardQuery = `
        SELECT brc.*, b.reward_monster_data, b.grunt_monster_data
        FROM boss_reward_claims brc
        JOIN bosses b ON brc.boss_id = b.id
        WHERE brc.boss_id = $1 AND (brc.user_id = $2 OR brc.user_id::text = $3) AND brc.is_claimed = FALSE
      `;
      const reward = await db.asyncGet(rewardQuery, [bossId, user.id, user.discord_id]);

      if (!reward) {
        return {
          success: false,
          message: 'No unclaimed reward found for this boss'
        };
      }

      // Validate inputs
      if (!monsterName || !trainerId) {
        return {
          success: false,
          message: 'Monster name and trainer are required'
        };
      }

      // Update reward claim
      const updateQuery = `
        UPDATE boss_reward_claims
        SET is_claimed = TRUE, 
            claimed_at = CURRENT_TIMESTAMP,
            monster_name = $1,
            assigned_trainer_id = $2
        WHERE boss_id = $3 AND (user_id = $4 OR user_id::text = $5)
      `;
      await db.asyncRun(updateQuery, [monsterName, trainerId, bossId, user.id, user.discord_id]);

      // Get monster data based on reward type
      const monsterData = reward.reward_type === 'boss_monster' 
        ? JSON.parse(reward.reward_monster_data)
        : JSON.parse(reward.grunt_monster_data);

      // Create the actual monster for the trainer
      const Monster = require('./Monster');
      
      // Prepare monster creation data from the reward monster data
      const monsterCreateData = {
        name: monsterName,
        trainer_id: trainerId,
        player_user_id: user.discord_id || user.id,
        species1: monsterData.species && monsterData.species[0] ? monsterData.species[0] : 'Unknown',
        species2: monsterData.species && monsterData.species[1] ? monsterData.species[1] : null,
        species3: monsterData.species && monsterData.species[2] ? monsterData.species[2] : null,
        type1: monsterData.types && monsterData.types[0] ? monsterData.types[0] : 'Normal',
        type2: monsterData.types && monsterData.types[1] ? monsterData.types[1] : null,
        type3: monsterData.types && monsterData.types[2] ? monsterData.types[2] : null,
        type4: monsterData.types && monsterData.types[3] ? monsterData.types[3] : null,
        type5: monsterData.types && monsterData.types[4] ? monsterData.types[4] : null,
        attribute: monsterData.attribute || 'Data',
        level: reward.reward_type === 'boss_monster' ? 5 : 1, // Boss monsters start at level 5, grunts at level 1
        where_met: `Boss Battle Reward - ${reward.boss_name}`,
        date_met: new Date().toISOString()
      };

      console.log('Creating monster with data:', monsterCreateData);
      
      try {
        const createdMonster = await Monster.create(monsterCreateData);
        console.log('Successfully created monster:', createdMonster);
        
        return {
          success: true,
          message: `Reward claimed successfully! ${monsterName} has been added to your collection.`,
          reward: {
            ...reward,
            monster_name: monsterName,
            assigned_trainer_id: trainerId,
            monster_data: monsterData
          },
          created_monster: createdMonster
        };
      } catch (monsterError) {
        console.error('Error creating monster:', monsterError);
        // If monster creation fails, revert the reward claim
        const revertQuery = `
          UPDATE boss_reward_claims
          SET is_claimed = FALSE, 
              claimed_at = NULL,
              monster_name = NULL,
              assigned_trainer_id = NULL
          WHERE boss_id = $1 AND (user_id = $2 OR user_id::text = $3)
        `;
        await db.asyncRun(revertQuery, [bossId, user.id, user.discord_id]);
        
        throw new Error(`Failed to create monster: ${monsterError.message}`);
      }
    } catch (error) {
      console.error(`Error claiming reward for boss ${bossId}, user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get current boss with unclaimed rewards check
   * @param {number} userId User ID to check for unclaimed rewards
   * @returns {Promise<Object>} Current boss with unclaimed rewards info
   */
  static async getCurrentBossWithRewards(userId) {
    try {
      const boss = await this.getActiveBoss();
      let unclaimedRewards = [];

      if (userId) {
        unclaimedRewards = await this.getUnclaimedRewards(userId);
      }

      return {
        boss,
        unclaimedRewards
      };
    } catch (error) {
      console.error(`Error getting current boss with rewards for user ${userId}:`, error);
      throw error;
    }
  }
}

module.exports = BossDamage;
