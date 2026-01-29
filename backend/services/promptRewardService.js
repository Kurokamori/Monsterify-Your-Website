const db = require('../config/db');
const MonsterRoller = require('../models/MonsterRoller');

class PromptRewardService {
  /**
   * Calculate and distribute rewards for approved submission
   * @param {Object} prompt - Prompt object
   * @param {Object} submission - Submission object
   * @param {number} qualityScore - Quality score (1-10)
   * @param {boolean} bonusApplied - Whether bonus was applied
   * @returns {Object} Distributed rewards
   */
  static async calculateAndDistributeRewards(prompt, submission, qualityScore, bonusApplied) {
    try {
      const rewards = typeof prompt.rewards === 'string' ? JSON.parse(prompt.rewards) : prompt.rewards;
      const distributedRewards = {
        levels: 0,
        coins: 0,
        items: [],
        special_items: [],
        monster_rolls: 0,
        bonus_applied: bonusApplied
      };

      // Base rewards
      if (rewards.levels) {
        distributedRewards.levels += rewards.levels;
      }

      if (rewards.coins) {
        distributedRewards.coins += rewards.coins;
      }

      if (rewards.items) {
        distributedRewards.items = [...rewards.items];
      }

      if (rewards.special_items) {
        distributedRewards.special_items = [...rewards.special_items];
      }

      // Quality-based bonuses
      if (qualityScore >= 8 && rewards.bonus_conditions) {
        const bonus = rewards.bonus_conditions;
        if (qualityScore >= bonus.quality_threshold) {
          if (bonus.bonus_levels) {
            distributedRewards.levels += bonus.bonus_levels;
          }
          if (bonus.bonus_coins) {
            distributedRewards.coins += bonus.bonus_coins;
          }
          if (bonus.bonus_items) {
            distributedRewards.items.push(...bonus.bonus_items);
          }
        }
      }

      // Manual bonus application
      if (bonusApplied && prompt.bonus_rewards) {
        const bonusRewards = typeof prompt.bonus_rewards === 'string' 
          ? JSON.parse(prompt.bonus_rewards) 
          : prompt.bonus_rewards;
        
        if (bonusRewards.levels) {
          distributedRewards.levels += bonusRewards.levels;
        }
        if (bonusRewards.coins) {
          distributedRewards.coins += bonusRewards.coins;
        }
        if (bonusRewards.items) {
          distributedRewards.items.push(...bonusRewards.items);
        }
        if (bonusRewards.special_items) {
          distributedRewards.special_items.push(...bonusRewards.special_items);
        }
      }

      // Monster roll rewards
      if (rewards.monster_roll && rewards.monster_roll.enabled) {
        distributedRewards.monster_rolls = 1;
        distributedRewards.monster_roll_params = rewards.monster_roll.parameters;
      }

      // Actually distribute the rewards to the trainer
      await this.distributeRewardsToTrainer(submission.trainer_id, distributedRewards);

      // Log the reward distribution
      await this.logRewardDistribution(submission.id, distributedRewards);

      return distributedRewards;
    } catch (error) {
      console.error('Error calculating rewards:', error);
      throw error;
    }
  }

  /**
   * Distribute rewards to trainer's inventory and stats
   * @param {number} trainerId - Trainer ID
   * @param {Object} rewards - Rewards to distribute
   */
  static async distributeRewardsToTrainer(trainerId, rewards) {
    try {
      // Start transaction
      await db.asyncRun('BEGIN TRANSACTION');

      try {
        // Add levels to trainer
        if (rewards.levels > 0) {
          await db.asyncRun(
            'UPDATE trainers SET level = level + $1 WHERE id = $2',
            [rewards.levels, trainerId]
          );
        }

        // Add coins to trainer
        if (rewards.coins > 0) {
          await db.asyncRun(
            'UPDATE trainers SET coins = coins + $1 WHERE id = $2',
            [rewards.coins, trainerId]
          );
        }

        // Add items to trainer inventory
        for (const item of rewards.items) {
          await this.addItemToTrainerInventory(trainerId, item);
        }

        // Add special items (berries, etc.)
        for (const specialItem of rewards.special_items) {
          await this.addSpecialItemToTrainer(trainerId, specialItem);
        }

        // Handle monster rolls
        if (rewards.monster_rolls > 0) {
          await this.addMonsterRollToTrainer(trainerId, rewards.monster_roll_params);
        }

        // Commit transaction
        await db.asyncRun('COMMIT');
      } catch (error) {
        // Rollback on error
        await db.asyncRun('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Error distributing rewards:', error);
      throw error;
    }
  }

  /**
   * Add item to trainer inventory
   * @param {number} trainerId - Trainer ID
   * @param {Object} item - Item object
   */
  static async addItemToTrainerInventory(trainerId, item) {
    try {
      let itemToAdd = null;
      
      // Handle different item configuration types
      if (item.is_random_from_category && item.category) {
        // Random item from category
        const categoryItems = await db.asyncAll(
          'SELECT id, name, category FROM items WHERE category = $1', 
          [item.category]
        );
        if (categoryItems.length > 0) {
          const randomItem = categoryItems[Math.floor(Math.random() * categoryItems.length)];
          itemToAdd = {
            item_id: randomItem.id,
            item_name: randomItem.name,
            category: randomItem.category,
            quantity: item.quantity || 1,
            chance: item.chance || 100
          };
        }
      } else if (item.is_random_from_set && item.random_set_items?.length > 0) {
        // Random item from custom set
        const validSetItems = item.random_set_items.filter(id => id);
        if (validSetItems.length > 0) {
          const randomItemId = validSetItems[Math.floor(Math.random() * validSetItems.length)];
          const randomItem = await db.asyncGet(
            'SELECT id, name, category FROM items WHERE id = $1',
            [randomItemId]
          );
          if (randomItem) {
            itemToAdd = {
              item_id: randomItem.id,
              item_name: randomItem.name,
              category: randomItem.category,
              quantity: item.quantity || 1,
              chance: item.chance || 100
            };
          }
        }
      } else {
        // Specific item
        itemToAdd = item;
      }
      
      if (!itemToAdd) {
        console.warn('No item to add for configuration:', item);
        return;
      }
      
      let itemId = itemToAdd.item_id;
      
      // If item_name is provided instead of item_id, look up the ID
      if (!itemId && itemToAdd.item_name) {
        const itemRecord = await db.asyncGet('SELECT id FROM items WHERE name = $1', [itemToAdd.item_name]);
        if (itemRecord) {
          itemId = itemRecord.id;
        } else {
          console.warn(`Item not found: ${itemToAdd.item_name}`);
          return;
        }
      }

      if (!itemId) {
        console.warn('No valid item ID found for item:', itemToAdd);
        return;
      }

      const quantity = itemToAdd.quantity || 1;
      const chance = itemToAdd.chance || 100;

      // Check if item should be given based on chance
      if (Math.random() * 100 > chance) {
        console.log(`Item ${itemId} not given due to chance (${chance}%)`);
        return;
      }

      // Add to trainer inventory
      await db.asyncRun(`
        INSERT INTO trainer_inventory (trainer_id, item_id, quantity) 
        VALUES ($1, $2, $3)
        ON CONFLICT (trainer_id, item_id) 
        DO UPDATE SET quantity = trainer_inventory.quantity + $3
      `, [trainerId, itemId, quantity]);

      console.log(`Added ${quantity}x item ${itemId} (${itemToAdd.item_name || 'Unknown'}) to trainer ${trainerId}`);
    } catch (error) {
      console.error('Error adding item to inventory:', error);
      throw error;
    }
  }

  /**
   * Add special item to trainer (berries, etc.)
   * @param {number} trainerId - Trainer ID
   * @param {Object} specialItem - Special item object
   */
  static async addSpecialItemToTrainer(trainerId, specialItem) {
    try {
      if (specialItem.type === 'berry') {
        // Handle special berries (Forget Me Not, Edenwiess, etc.)
        await db.asyncRun(`
          UPDATE trainers SET berries = jsonb_set(
            COALESCE(berries, '{}'),
            '{${specialItem.name}}',
            (COALESCE(berries->>'${specialItem.name}', '0')::int + $2)::text::jsonb
          ) WHERE id = $1
        `, [trainerId, specialItem.quantity || 1]);

        console.log(`Added ${specialItem.quantity || 1}x ${specialItem.name} berry to trainer ${trainerId}`);
      } else if (specialItem.type === 'keyitem') {
        // Handle key items
        await db.asyncRun(`
          UPDATE trainers SET keyitems = jsonb_set(
            COALESCE(keyitems, '{}'),
            '{${specialItem.name}}',
            (COALESCE(keyitems->>'${specialItem.name}', '0')::int + $2)::text::jsonb
          ) WHERE id = $1
        `, [trainerId, specialItem.quantity || 1]);

        console.log(`Added ${specialItem.quantity || 1}x ${specialItem.name} keyitem to trainer ${trainerId}`);
      }
    } catch (error) {
      console.error('Error adding special item:', error);
      throw error;
    }
  }

  /**
   * Add monster roll to trainer
   * @param {number} trainerId - Trainer ID
   * @param {Object} rollParams - Roll parameters
   */
  static async addMonsterRollToTrainer(trainerId, rollParams) {
    try {
      // Create a monster roll entry that can be claimed later
      await db.asyncRun(`
        INSERT INTO trainer_monster_rolls (trainer_id, roll_parameters, source, created_at, is_claimed)
        VALUES ($1, $2, 'prompt_reward', CURRENT_TIMESTAMP, false)
      `, [trainerId, JSON.stringify(rollParams || {})]);

      console.log(`Added monster roll to trainer ${trainerId} with parameters:`, rollParams);
    } catch (error) {
      console.error('Error adding monster roll:', error);
      throw error;
    }
  }

  /**
   * Log reward distribution for tracking
   * @param {number} submissionId - Submission ID
   * @param {Object} rewards - Distributed rewards
   */
  static async logRewardDistribution(submissionId, rewards) {
    try {
      await db.asyncRun(`
        INSERT INTO reward_distribution_log (
          submission_id, rewards_given, distributed_at
        ) VALUES ($1, $2, CURRENT_TIMESTAMP)
      `, [submissionId, JSON.stringify(rewards)]);
    } catch (error) {
      // Don't throw error for logging failure, just log it
      console.error('Error logging reward distribution:', error);
    }
  }

  /**
   * Get trainer's unclaimed monster rolls
   * @param {number} trainerId - Trainer ID
   * @returns {Array} Unclaimed monster rolls
   */
  static async getUnclaimedMonsterRolls(trainerId) {
    try {
      const query = `
        SELECT * FROM trainer_monster_rolls 
        WHERE trainer_id = $1 AND is_claimed = false
        ORDER BY created_at ASC
      `;
      return await db.asyncAll(query, [trainerId]);
    } catch (error) {
      console.error('Error getting unclaimed monster rolls:', error);
      throw error;
    }
  }

  /**
   * Claim a monster roll and generate the monster
   * @param {number} rollId - Monster roll ID
   * @param {number} trainerId - Trainer ID
   * @returns {Object} Generated monster
   */
  static async claimMonsterRoll(rollId, trainerId) {
    try {
      // Get the roll details
      const roll = await db.asyncGet(`
        SELECT * FROM trainer_monster_rolls 
        WHERE id = $1 AND trainer_id = $2 AND is_claimed = false
      `, [rollId, trainerId]);

      if (!roll) {
        throw new Error('Monster roll not found or already claimed');
      }

      const rollParams = JSON.parse(roll.roll_parameters || '{}');

      // Get trainer's user settings for monster rolling
      const trainer = await db.asyncGet('SELECT * FROM trainers WHERE id = $1', [trainerId]);
      let userSettings = {
        pokemon_enabled: true,
        digimon_enabled: true,
        yokai_enabled: true,
        nexomon_enabled: true,
        pals_enabled: true,
        fakemon_enabled: true,
        finalfantasy_enabled: true,
        monsterhunter_enabled: true
      };
      
      if (trainer?.player_user_id) {
        const user = await db.asyncGet('SELECT monster_roller_settings FROM users WHERE discord_id = $1', [trainer.player_user_id]);
        if (user?.monster_roller_settings) {
          try {
            const settings = typeof user.monster_roller_settings === 'string' 
              ? JSON.parse(user.monster_roller_settings) 
              : user.monster_roller_settings;
            userSettings = { ...userSettings, ...settings };
          } catch (err) {
            console.error('Error parsing user monster roller settings:', err);
          }
        }
      }
      
      // Generate the monster using MonsterRoller with user settings
      const monsterRoller = new MonsterRoller({}, { userSettings });
      const generatedMonster = await monsterRoller.rollMonster({
        trainerId,
        ...rollParams
      });

      // Mark the roll as claimed
      await db.asyncRun(`
        UPDATE trainer_monster_rolls 
        SET is_claimed = true, claimed_at = CURRENT_TIMESTAMP, generated_monster_id = $1
        WHERE id = $2
      `, [generatedMonster.id, rollId]);

      console.log(`Trainer ${trainerId} claimed monster roll ${rollId}, generated monster ${generatedMonster.id}`);

      return generatedMonster;
    } catch (error) {
      console.error('Error claiming monster roll:', error);
      throw error;
    }
  }

  /**
   * Get reward distribution history for a trainer
   * @param {number} trainerId - Trainer ID
   * @param {Object} filters - Filtering options
   * @returns {Array} Reward history
   */
  static async getRewardHistory(trainerId, filters = {}) {
    try {
      let query = `
        SELECT 
          rdl.*,
          ps.prompt_id,
          p.title as prompt_title,
          p.type as prompt_type,
          ps.submitted_at
        FROM reward_distribution_log rdl
        JOIN prompt_submissions ps ON rdl.submission_id = ps.id
        JOIN prompts p ON ps.prompt_id = p.id
        WHERE ps.trainer_id = $1
      `;

      const params = [trainerId];

      if (filters.startDate) {
        params.push(filters.startDate);
        query += ` AND rdl.distributed_at >= $${params.length}`;
      }

      if (filters.endDate) {
        params.push(filters.endDate);
        query += ` AND rdl.distributed_at <= $${params.length}`;
      }

      query += ` ORDER BY rdl.distributed_at DESC`;

      if (filters.limit) {
        params.push(filters.limit);
        query += ` LIMIT $${params.length}`;
      }

      return await db.asyncAll(query, params);
    } catch (error) {
      console.error('Error getting reward history:', error);
      throw error;
    }
  }

  /**
   * Calculate total rewards given to a trainer
   * @param {number} trainerId - Trainer ID
   * @returns {Object} Total rewards summary
   */
  static async getTotalRewardsGiven(trainerId) {
    try {
      const history = await this.getRewardHistory(trainerId);
      
      const totals = {
        levels: 0,
        coins: 0,
        items: 0,
        monster_rolls: 0,
        submissions_rewarded: history.length
      };

      for (const record of history) {
        const rewards = JSON.parse(record.rewards_given);
        totals.levels += rewards.levels || 0;
        totals.coins += rewards.coins || 0;
        totals.items += (rewards.items?.length || 0) + (rewards.special_items?.length || 0);
        totals.monster_rolls += rewards.monster_rolls || 0;
      }

      return totals;
    } catch (error) {
      console.error('Error calculating total rewards:', error);
      throw error;
    }
  }
}

module.exports = PromptRewardService;
