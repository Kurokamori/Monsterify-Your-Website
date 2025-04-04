const pool = require('../db');
const BattleOpponent = require('./BattleOpponent');
const Trainer = require('./Trainer');
const Monster = require('./Monster');

/**
 * Battle model
 */
class Battle {
  /**
   * Get a battle by ID
   * @param {number} battleId - Battle ID
   * @returns {Promise<Object|null>} - Battle or null if not found
   */
  static async getById(battleId) {
    try {
      const query = 'SELECT * FROM battles WHERE battle_id = $1';
      const result = await pool.query(query, [battleId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      console.error(`Error getting battle ${battleId}:`, error);
      return null;
    }
  }

  /**
   * Get battles for a trainer
   * @param {number} trainerId - Trainer ID
   * @param {number} limit - Maximum number of battles to return
   * @returns {Promise<Array>} - Array of battles
   */
  static async getByTrainer(trainerId, limit = 10) {
    try {
      const query = `
        SELECT b.*, bo.name as opponent_name, bo.image_url as opponent_image
        FROM battles b
        JOIN battle_opponents bo ON b.opponent_id = bo.opponent_id
        WHERE b.trainer_id = $1
        ORDER BY b.started_at DESC
        LIMIT $2
      `;
      
      const result = await pool.query(query, [trainerId, limit]);
      return result.rows;
    } catch (error) {
      console.error(`Error getting battles for trainer ${trainerId}:`, error);
      return [];
    }
  }

  /**
   * Create a new battle
   * @param {number} trainerId - Trainer ID
   * @param {number} opponentId - Opponent ID
   * @returns {Promise<Object|null>} - Created battle or null if error
   */
  static async create(trainerId, opponentId) {
    try {
      // Check if trainer exists
      const trainer = await Trainer.getById(trainerId);
      if (!trainer) {
        throw new Error(`Trainer ${trainerId} not found`);
      }
      
      // Check if opponent exists
      const opponent = await BattleOpponent.getById(opponentId);
      if (!opponent) {
        throw new Error(`Opponent ${opponentId} not found`);
      }
      
      // Create the battle
      const query = `
        INSERT INTO battles (trainer_id, opponent_id, status)
        VALUES ($1, $2, 'in_progress')
        RETURNING *
      `;
      
      const result = await pool.query(query, [trainerId, opponentId]);
      return result.rows[0];
    } catch (error) {
      console.error(`Error creating battle for trainer ${trainerId} against opponent ${opponentId}:`, error);
      return null;
    }
  }

  /**
   * Update a battle's status
   * @param {number} battleId - Battle ID
   * @param {string} status - New status (in_progress, won, lost, abandoned)
   * @param {Object} stats - Battle statistics (wpm, accuracy)
   * @returns {Promise<Object|null>} - Updated battle or null if error
   */
  static async updateStatus(battleId, status, stats = {}) {
    try {
      const query = `
        UPDATE battles
        SET status = $1,
            ended_at = CASE WHEN $1 IN ('won', 'lost', 'abandoned') THEN CURRENT_TIMESTAMP ELSE ended_at END,
            wpm = $2,
            accuracy = $3,
            updated_at = CURRENT_TIMESTAMP
        WHERE battle_id = $4
        RETURNING *
      `;
      
      const result = await pool.query(query, [
        status,
        stats.wpm || null,
        stats.accuracy || null,
        battleId
      ]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      console.error(`Error updating battle ${battleId} status to ${status}:`, error);
      return null;
    }
  }

  /**
   * Create rewards for a battle
   * @param {number} battleId - Battle ID
   * @param {number} trainerId - Trainer ID
   * @param {Object} rewardData - Reward data
   * @returns {Promise<Object|null>} - Created reward or null if error
   */
  static async createRewards(battleId, trainerId, rewardData) {
    try {
      const query = `
        INSERT INTO battle_rewards (
          battle_id, trainer_id, coins, levels, items, monsters
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      
      const result = await pool.query(query, [
        battleId,
        trainerId,
        rewardData.coins || 0,
        rewardData.levels || 0,
        JSON.stringify(rewardData.items || { items: [] }),
        JSON.stringify(rewardData.monsters || { monsters: [] })
      ]);
      
      return result.rows[0];
    } catch (error) {
      console.error(`Error creating rewards for battle ${battleId}:`, error);
      return null;
    }
  }

  /**
   * Get rewards for a battle
   * @param {number} battleId - Battle ID
   * @returns {Promise<Object|null>} - Battle rewards or null if not found
   */
  static async getRewards(battleId) {
    try {
      const query = 'SELECT * FROM battle_rewards WHERE battle_id = $1';
      const result = await pool.query(query, [battleId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      console.error(`Error getting rewards for battle ${battleId}:`, error);
      return null;
    }
  }

  /**
   * Claim rewards for a battle
   * @param {number} battleId - Battle ID
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Object>} - Result of the claim operation
   */
  static async claimRewards(battleId, trainerId) {
    try {
      // Get the battle
      const battle = await this.getById(battleId);
      if (!battle) {
        return {
          success: false,
          message: 'Battle not found'
        };
      }
      
      // Check if the battle is won
      if (battle.status !== 'won') {
        return {
          success: false,
          message: 'Cannot claim rewards for a battle that was not won'
        };
      }
      
      // Get the rewards
      const rewards = await this.getRewards(battleId);
      if (!rewards) {
        return {
          success: false,
          message: 'No rewards found for this battle'
        };
      }
      
      // Check if rewards are already claimed
      if (rewards.is_claimed) {
        return {
          success: false,
          message: 'Rewards have already been claimed'
        };
      }
      
      // Process rewards
      
      // Add coins to trainer
      if (rewards.coins > 0) {
        await Trainer.addCoins(trainerId, rewards.coins);
      }
      
      // Add levels to trainer
      if (rewards.levels > 0) {
        await Trainer.addLevels(trainerId, rewards.levels);
      }
      
      // Add items to trainer's inventory
      const items = JSON.parse(rewards.items);
      if (items.items && items.items.length > 0) {
        for (const item of items.items) {
          await Trainer.addItem(trainerId, item.name, item.quantity, item.category);
        }
      }
      
      // Add monsters to trainer's collection
      const monsters = JSON.parse(rewards.monsters);
      if (monsters.monsters && monsters.monsters.length > 0) {
        for (const monster of monsters.monsters) {
          if (monster.is_static) {
            // Create a static monster with predefined attributes
            await Monster.create({
              trainer_id: trainerId,
              name: monster.name,
              level: monster.level || 5,
              species1: monster.species1,
              species2: monster.species2,
              species3: monster.species3,
              type1: monster.type1,
              type2: monster.type2,
              type3: monster.type3,
              type4: monster.type4,
              type5: monster.type5,
              attribute: monster.attribute
            });
          } else {
            // Roll a random monster
            // This would call your existing monster rolling system
            // For now, we'll just create a basic monster
            await Monster.create({
              trainer_id: trainerId,
              name: monster.name || 'Battle Reward Monster',
              level: monster.level || 5,
              species1: 'Pokemon',
              type1: 'Normal'
            });
          }
        }
      }
      
      // Mark rewards as claimed
      const updateQuery = `
        UPDATE battle_rewards
        SET is_claimed = true,
            updated_at = CURRENT_TIMESTAMP
        WHERE battle_id = $1
        RETURNING *
      `;
      
      await pool.query(updateQuery, [battleId]);
      
      return {
        success: true,
        message: 'Rewards claimed successfully',
        rewards: {
          coins: rewards.coins,
          levels: rewards.levels,
          items: items.items,
          monsters: monsters.monsters
        }
      };
    } catch (error) {
      console.error(`Error claiming rewards for battle ${battleId}:`, error);
      return {
        success: false,
        message: `Error claiming rewards: ${error.message}`
      };
    }
  }

  /**
   * Get battle statistics for a trainer
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Object>} - Battle statistics
   */
  static async getTrainerStats(trainerId) {
    try {
      const query = `
        SELECT
          COUNT(*) AS total_battles,
          SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END) AS wins,
          SUM(CASE WHEN status = 'lost' THEN 1 ELSE 0 END) AS losses,
          SUM(CASE WHEN status = 'abandoned' THEN 1 ELSE 0 END) AS abandoned,
          AVG(wpm) AS avg_wpm,
          AVG(accuracy) AS avg_accuracy
        FROM battles
        WHERE trainer_id = $1 AND status != 'in_progress'
      `;
      
      const result = await pool.query(query, [trainerId]);
      
      if (result.rows.length === 0) {
        return {
          total_battles: 0,
          wins: 0,
          losses: 0,
          abandoned: 0,
          avg_wpm: 0,
          avg_accuracy: 0
        };
      }
      
      const stats = result.rows[0];
      
      // Convert null values to 0
      Object.keys(stats).forEach(key => {
        if (stats[key] === null) {
          stats[key] = 0;
        }
      });
      
      return stats;
    } catch (error) {
      console.error(`Error getting battle statistics for trainer ${trainerId}:`, error);
      return {
        total_battles: 0,
        wins: 0,
        losses: 0,
        abandoned: 0,
        avg_wpm: 0,
        avg_accuracy: 0
      };
    }
  }
}

module.exports = Battle;
