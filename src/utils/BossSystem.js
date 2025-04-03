const pool = require('../db');
const RewardSystem = require('./RewardSystem');
const Trainer = require('../models/Trainer');

/**
 * Service for handling boss battles and related functionality
 */
class BossSystem {
  /**
   * Get the current active boss
   * @returns {Promise<Object|null>} - Boss data or null if no active boss
   */
  static async getCurrentBoss() {
    try {
      const query = `
        SELECT * FROM bosses
        WHERE active = true
      `;
      const result = await pool.query(query);

      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('Error getting current boss:', error);
      throw error;
    }
  }

  /**
   * Create a new boss
   * @param {Object} bossData - Boss data
   * @param {string} bossData.name - Boss name
   * @param {string} bossData.description - Boss description
   * @param {string} bossData.image_url - Boss image URL
   * @param {number} bossData.max_health - Boss maximum health
   * @param {string} bossData.type - Boss type (optional)
   * @returns {Promise<Object>} - Created boss
   */
  static async createBoss(bossData) {
    try {
      // Deactivate any current active boss
      await this.deactivateCurrentBoss();

      // Create new boss
      const query = `
        INSERT INTO bosses (
          name,
          description,
          image_url,
          max_health,
          current_health,
          type,
          active,
          created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, true, NOW()
        ) RETURNING *
      `;

      const result = await pool.query(query, [
        bossData.name,
        bossData.description,
        bossData.image_url,
        bossData.max_health,
        bossData.max_health, // Current health starts at max
        bossData.type || 'normal'
      ]);

      return result.rows[0];
    } catch (error) {
      console.error('Error creating boss:', error);
      throw error;
    }
  }

  /**
   * Deactivate the current active boss
   * @returns {Promise<boolean>} - True if a boss was deactivated, false otherwise
   */
  static async deactivateCurrentBoss() {
    try {
      const query = `
        UPDATE bosses
        SET
          active = false,
          defeated_at = NOW()
        WHERE active = true
        RETURNING id
      `;

      const result = await pool.query(query);

      return result.rows.length > 0;
    } catch (error) {
      console.error('Error deactivating current boss:', error);
      throw error;
    }
  }

  /**
   * Deal damage to the current boss
   * @param {number} trainerId - Trainer ID
   * @param {number} damage - Amount of damage to deal
   * @param {string} source - Source of the damage (e.g., 'writing', 'art', 'task')
   * @returns {Promise<Object>} - Result of the attack
   */
  static async dealDamage(trainerId, damage, source = 'activity') {
    try {
      // Get current boss
      const boss = await this.getCurrentBoss();

      if (!boss) {
        return {
          success: false,
          message: 'No active boss found'
        };
      }

      // Get trainer
      const trainer = await Trainer.getById(trainerId);
      if (!trainer) {
        return {
          success: false,
          message: 'Trainer not found'
        };
      }

      // Record damage
      const damageQuery = `
        INSERT INTO boss_damage (
          boss_id,
          trainer_id,
          damage,
          source,
          created_at
        ) VALUES (
          $1, $2, $3, $4, NOW()
        ) RETURNING *
      `;

      await pool.query(damageQuery, [
        boss.id,
        trainerId,
        damage,
        source
      ]);

      // Update boss health
      const newHealth = Math.max(0, boss.current_health - damage);
      const updateQuery = `
        UPDATE bosses
        SET current_health = $1
        WHERE id = $2
        RETURNING *
      `;

      const updateResult = await pool.query(updateQuery, [newHealth, boss.id]);
      const updatedBoss = updateResult.rows[0];

      // Check if boss was defeated
      let defeatedMessage = '';
      if (newHealth === 0 && boss.current_health > 0) {
        // Boss was just defeated
        await this.handleBossDefeat(boss.id);
        defeatedMessage = ' The boss has been defeated! Rewards will be distributed soon.';
      }

      return {
        success: true,
        message: `${trainer.name} dealt ${damage} damage to ${boss.name}!${defeatedMessage}`,
        damage,
        boss: updatedBoss,
        defeated: newHealth === 0
      };
    } catch (error) {
      console.error('Error dealing damage to boss:', error);
      return {
        success: false,
        message: `Error dealing damage: ${error.message}`
      };
    }
  }

  /**
   * Handle boss defeat
   * @param {number} bossId - Boss ID
   * @returns {Promise<void>}
   */
  static async handleBossDefeat(bossId) {
    try {
      // Mark boss as inactive
      const updateQuery = `
        UPDATE bosses
        SET
          active = false,
          defeated_at = NOW()
        WHERE id = $1
      `;

      await pool.query(updateQuery, [bossId]);

      // Get all damage records for this boss
      const damageQuery = `
        SELECT
          trainer_id,
          SUM(damage) as total_damage
        FROM boss_damage
        WHERE boss_id = $1
        GROUP BY trainer_id
        ORDER BY total_damage DESC
      `;

      const damageResult = await pool.query(damageQuery, [bossId]);

      // Get boss details
      const bossQuery = `
        SELECT * FROM bosses
        WHERE id = $1
      `;

      const bossResult = await pool.query(bossQuery, [bossId]);
      const boss = bossResult.rows[0];

      // Calculate total damage dealt
      const totalDamage = damageResult.rows.reduce((sum, row) => sum + parseInt(row.total_damage), 0);

      // Distribute rewards based on damage contribution
      for (const damageRecord of damageResult.rows) {
        const trainerId = damageRecord.trainer_id;
        const trainerDamage = parseInt(damageRecord.total_damage);

        // Calculate contribution percentage
        const contributionPercentage = totalDamage > 0 ? (trainerDamage / totalDamage) * 100 : 0;

        // Generate rewards based on contribution
        let rewardTier = 'common';
        if (contributionPercentage >= 30) {
          rewardTier = 'epic';
        } else if (contributionPercentage >= 15) {
          rewardTier = 'rare';
        } else if (contributionPercentage >= 5) {
          rewardTier = 'uncommon';
        }

        // Create rewards
        const rewards = [
          {
            id: `boss-coin-${bossId}-${trainerId}`,
            type: 'coin',
            reward_type: 'coin',
            rarity: rewardTier,
            reward_data: {
              amount: Math.floor(100 + (contributionPercentage * 10)),
              title: 'Boss Defeat Coins'
            }
          }
        ];

        // Add item reward for higher contributions
        if (contributionPercentage >= 5) {
          rewards.push({
            id: `boss-item-${bossId}-${trainerId}`,
            type: 'item',
            reward_type: 'item',
            rarity: rewardTier,
            reward_data: {
              name: this.getBossRewardItem(rewardTier, boss.type),
              quantity: Math.ceil(contributionPercentage / 10),
              category: 'ITEMS'
            }
          });
        }

        // Add monster reward for top contributors
        if (contributionPercentage >= 15) {
          rewards.push({
            id: `boss-monster-${bossId}-${trainerId}`,
            type: 'monster',
            reward_type: 'monster',
            rarity: rewardTier,
            reward_data: {
              species: ['Pokemon', 'Digimon'],
              types: this.getBossRewardTypes(boss.type),
              minLevel: 5,
              maxLevel: 15,
              filters: {
                pokemon: { rarity: RewardSystem.mapRarityToPokeRarity(rewardTier) },
                digimon: { stage: RewardSystem.mapRarityToDigiStage(rewardTier) }
              }
            }
          });
        }

        // Save rewards to database
        const rewardQuery = `
          INSERT INTO boss_rewards (
            boss_id,
            trainer_id,
            damage_dealt,
            contribution_percentage,
            rewards,
            created_at
          ) VALUES (
            $1, $2, $3, $4, $5, NOW()
          )
        `;

        await pool.query(rewardQuery, [
          bossId,
          trainerId,
          trainerDamage,
          contributionPercentage,
          JSON.stringify(rewards)
        ]);
      }
    } catch (error) {
      console.error('Error handling boss defeat:', error);
      throw error;
    }
  }

  /**
   * Get boss reward item based on tier and boss type
   * @param {string} tier - Reward tier
   * @param {string} bossType - Boss type
   * @returns {string} - Item name
   */
  static getBossRewardItem(tier, bossType = 'normal') {
    const itemsByType = {
      normal: {
        common: ['Potion', 'Poké Ball', 'Antidote'],
        uncommon: ['Super Potion', 'Great Ball', 'Full Heal'],
        rare: ['Hyper Potion', 'Ultra Ball', 'Revive'],
        epic: ['Max Potion', 'Timer Ball', 'Max Revive']
      },
      fire: {
        common: ['Fire Stone Shard', 'Charcoal', 'Heat Rock'],
        uncommon: ['Flame Orb', 'Magmarizer Piece', 'Firium Z Crystal'],
        rare: ['Fire Stone', 'Magmarizer', 'Red Orb'],
        epic: ['Sacred Fire Ember', 'Volcanion Dew', 'Primal Fire Orb']
      },
      water: {
        common: ['Water Stone Shard', 'Mystic Water', 'Damp Rock'],
        uncommon: ['Dive Ball', 'Water Gem', 'Waterium Z Crystal'],
        rare: ['Water Stone', 'King\'s Rock', 'Blue Orb'],
        epic: ['Oceanic Trident', 'Kyogre Scale', 'Primal Water Orb']
      },
      electric: {
        common: ['Thunder Stone Shard', 'Magnet', 'Cell Battery'],
        uncommon: ['Electric Seed', 'Electirizer Piece', 'Electrium Z Crystal'],
        rare: ['Thunder Stone', 'Electirizer', 'Light Ball'],
        epic: ['Zap Plate', 'Zeraora Whisker', 'Volt Tackle Capacitor']
      }
    };

    // Default to normal type if boss type not found
    const items = itemsByType[bossType] || itemsByType.normal;
    const tierItems = items[tier] || items.common;

    return tierItems[Math.floor(Math.random() * tierItems.length)];
  }

  /**
   * Get boss reward types based on boss type
   * @param {string} bossType - Boss type
   * @returns {Array<string>} - Array of types
   */
  static getBossRewardTypes(bossType = 'normal') {
    const typesByBossType = {
      normal: ['Normal', 'Fighting', 'Flying'],
      fire: ['Fire', 'Dragon', 'Rock'],
      water: ['Water', 'Ice', 'Ground'],
      electric: ['Electric', 'Steel', 'Flying'],
      grass: ['Grass', 'Bug', 'Poison'],
      psychic: ['Psychic', 'Fairy', 'Ghost'],
      dark: ['Dark', 'Ghost', 'Fighting']
    };

    return typesByBossType[bossType] || typesByBossType.normal;
  }

  /**
   * Get trainer's damage contribution to current boss
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Object>} - Damage contribution data
   */
  static async getTrainerContribution(trainerId) {
    try {
      // Get current boss
      const boss = await this.getCurrentBoss();

      if (!boss) {
        return {
          success: false,
          message: 'No active boss found'
        };
      }

      // Get trainer's damage
      const damageQuery = `
        SELECT
          SUM(damage) as total_damage,
          COUNT(*) as attack_count
        FROM boss_damage
        WHERE boss_id = $1 AND trainer_id = $2
      `;

      const damageResult = await pool.query(damageQuery, [boss.id, trainerId]);
      const trainerDamage = parseInt(damageResult.rows[0].total_damage) || 0;
      const attackCount = parseInt(damageResult.rows[0].attack_count) || 0;

      // Get total damage dealt to boss
      const totalDamageQuery = `
        SELECT SUM(damage) as total_damage
        FROM boss_damage
        WHERE boss_id = $1
      `;

      const totalDamageResult = await pool.query(totalDamageQuery, [boss.id]);
      const totalDamage = parseInt(totalDamageResult.rows[0].total_damage) || 0;

      // Calculate contribution percentage
      const contributionPercentage = totalDamage > 0 ? (trainerDamage / totalDamage) * 100 : 0;

      // Get trainer rank
      const rankQuery = `
        SELECT
          trainer_id,
          SUM(damage) as total_damage
        FROM boss_damage
        WHERE boss_id = $1
        GROUP BY trainer_id
        ORDER BY total_damage DESC
      `;

      const rankResult = await pool.query(rankQuery, [boss.id]);
      const trainerRank = rankResult.rows.findIndex(row => row.trainer_id === trainerId) + 1;

      return {
        success: true,
        boss,
        trainerDamage,
        totalDamage,
        contributionPercentage,
        attackCount,
        rank: trainerRank > 0 ? trainerRank : 'N/A',
        totalParticipants: rankResult.rows.length
      };
    } catch (error) {
      console.error('Error getting trainer contribution:', error);
      return {
        success: false,
        message: `Error getting contribution: ${error.message}`
      };
    }
  }

  /**
   * Get boss leaderboard
   * @param {number} bossId - Boss ID (optional, defaults to current boss)
   * @param {number} limit - Number of entries to return (optional, defaults to 10)
   * @returns {Promise<Object>} - Leaderboard data
   */
  static async getBossLeaderboard(bossId = null, limit = 10) {
    try {
      // If no boss ID provided, get current boss
      if (!bossId) {
        const boss = await this.getCurrentBoss();

        if (!boss) {
          return {
            success: false,
            message: 'No active boss found'
          };
        }

        bossId = boss.id;
      }

      // Get boss details
      const bossQuery = `
        SELECT * FROM bosses
        WHERE id = $1
      `;

      const bossResult = await pool.query(bossQuery, [bossId]);

      if (bossResult.rows.length === 0) {
        return {
          success: false,
          message: 'Boss not found'
        };
      }

      const boss = bossResult.rows[0];

      // Get leaderboard
      const leaderboardQuery = `
        SELECT
          bd.trainer_id,
          t.name as trainer_name,
          SUM(bd.damage) as total_damage,
          COUNT(*) as attack_count
        FROM boss_damage bd
        JOIN trainers t ON bd.trainer_id = t.id
        WHERE bd.boss_id = $1
        GROUP BY bd.trainer_id, t.name
        ORDER BY total_damage DESC
        LIMIT $2
      `;

      const leaderboardResult = await pool.query(leaderboardQuery, [bossId, limit]);

      // Get total damage dealt to boss
      const totalDamageQuery = `
        SELECT SUM(damage) as total_damage
        FROM boss_damage
        WHERE boss_id = $1
      `;

      const totalDamageResult = await pool.query(totalDamageQuery, [bossId]);
      const totalDamage = parseInt(totalDamageResult.rows[0].total_damage) || 0;

      // Calculate contribution percentages
      const leaderboard = leaderboardResult.rows.map(entry => ({
        ...entry,
        contribution_percentage: totalDamage > 0 ? (parseInt(entry.total_damage) / totalDamage) * 100 : 0
      }));

      return {
        success: true,
        boss,
        leaderboard,
        totalDamage,
        totalParticipants: leaderboardResult.rowCount
      };
    } catch (error) {
      console.error('Error getting boss leaderboard:', error);
      return {
        success: false,
        message: `Error getting leaderboard: ${error.message}`
      };
    }
  }

  /**
   * Claim boss rewards
   * @param {number} trainerId - Trainer ID
   * @param {number} bossId - Boss ID
   * @returns {Promise<Object>} - Claim result
   */
  static async claimBossRewards(trainerId, bossId) {
    try {
      // Check if boss exists and is defeated
      const bossQuery = `
        SELECT * FROM bosses
        WHERE id = $1 AND active = false
      `;

      const bossResult = await pool.query(bossQuery, [bossId]);

      if (bossResult.rows.length === 0) {
        return {
          success: false,
          message: 'Boss not found or not yet defeated'
        };
      }

      // Check if trainer has rewards to claim
      const rewardQuery = `
        SELECT * FROM boss_rewards
        WHERE boss_id = $1 AND trainer_id = $2 AND claimed = false
      `;

      const rewardResult = await pool.query(rewardQuery, [bossId, trainerId]);

      if (rewardResult.rows.length === 0) {
        return {
          success: false,
          message: 'No unclaimed rewards found for this boss'
        };
      }

      const rewardRecord = rewardResult.rows[0];
      const rewards = JSON.parse(rewardRecord.rewards);

      // Get trainer
      const trainer = await Trainer.getById(trainerId);
      if (!trainer) {
        return {
          success: false,
          message: 'Trainer not found'
        };
      }

      // Process rewards
      const processedRewards = [];
      for (const reward of rewards) {
        const result = await RewardSystem.processRewardClaim(
          reward,
          trainerId,
          [trainer],
          'boss_battle'
        );

        processedRewards.push({
          reward,
          result
        });
      }

      // Mark rewards as claimed
      const updateQuery = `
        UPDATE boss_rewards
        SET
          claimed = true,
          claimed_at = NOW()
        WHERE boss_id = $1 AND trainer_id = $2
      `;

      await pool.query(updateQuery, [bossId, trainerId]);

      return {
        success: true,
        message: 'Boss rewards claimed successfully!',
        rewards: processedRewards,
        boss: bossResult.rows[0],
        contribution: {
          damage_dealt: rewardRecord.damage_dealt,
          contribution_percentage: rewardRecord.contribution_percentage
        }
      };
    } catch (error) {
      console.error('Error claiming boss rewards:', error);
      return {
        success: false,
        message: `Error claiming rewards: ${error.message}`
      };
    }
  }
}

module.exports = BossSystem;
