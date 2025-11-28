const db = require('../config/db');
const MonsterRoller = require('../models/MonsterRoller');

class ImmediateRewardService {
  /**
   * Calculate and immediately apply rewards for approved submission
   * @param {Object} prompt - Prompt object
   * @param {Object} submission - Submission object
   * @param {number} qualityScore - Quality score (1-10)
   * @param {boolean} bonusApplied - Whether bonus was applied
   * @returns {Object} Applied rewards with details
   */
  static async calculateAndApplyRewards(prompt, submission, qualityScore = 5, bonusApplied = false) {
    try {
      const rewards = typeof prompt.rewards === 'string' ? JSON.parse(prompt.rewards) : prompt.rewards;
      const appliedRewards = {
        levels: 0,
        coins: 0,
        items: [],
        monsters: [],
        trainer_id: submission.trainer_id
      };

      // Start transaction
      await db.asyncRun('BEGIN TRANSACTION');

      try {
        // Base rewards
        if (rewards.levels) {
          appliedRewards.levels += rewards.levels;
        }

        if (rewards.coins) {
          appliedRewards.coins += rewards.coins;
        }

        if (rewards.items) {
          appliedRewards.items = [...rewards.items];
        }

        // Special items are now just regular items

        // Quality-based bonuses
        if (qualityScore >= 8 && rewards.bonus_conditions) {
          const bonus = rewards.bonus_conditions;
          if (qualityScore >= bonus.quality_threshold) {
            if (bonus.bonus_levels) {
              appliedRewards.levels += bonus.bonus_levels;
            }
            if (bonus.bonus_coins) {
              appliedRewards.coins += bonus.bonus_coins;
            }
            if (bonus.bonus_items) {
              appliedRewards.items.push(...bonus.bonus_items);
            }
          }
        }

        // Bonus rewards removed - simplified system

        // Apply levels to trainer
        if (appliedRewards.levels > 0) {
          await db.asyncRun(
            'UPDATE trainers SET level = level + $1 WHERE id = $2',
            [appliedRewards.levels, submission.trainer_id]
          );
        }

        // Apply coins to trainer
        if (appliedRewards.coins > 0) {
          await db.asyncRun(
            'UPDATE trainers SET coins = coins + $1 WHERE id = $2',
            [appliedRewards.coins, submission.trainer_id]
          );
        }

        // Apply items to trainer inventory
        for (const item of appliedRewards.items) {
          await this.addItemToTrainerInventory(submission.trainer_id, item);
        }

        // Special items are now handled as regular items

        // Handle monster rolls - roll immediately and add to trainer
        if (rewards.monster_roll && rewards.monster_roll.enabled) {
          const rolledMonster = await this.rollAndAddMonster(
            submission.trainer_id, 
            rewards.monster_roll.parameters || {}
          );
          appliedRewards.monsters.push(rolledMonster);
        }

        // Commit transaction
        await db.asyncRun('COMMIT');

        return appliedRewards;
      } catch (error) {
        // Rollback on error
        await db.asyncRun('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Error calculating and applying rewards:', error);
      throw error;
    }
  }

  /**
   * Roll and add monster to trainer immediately
   * @param {number} trainerId - Trainer ID
   * @param {Object} rollParams - Roll parameters
   * @returns {Object} Generated monster
   */
  static async rollAndAddMonster(trainerId, rollParams = {}) {
    try {
      const monsterRoller = new MonsterRoller();
      
      // Set default parameters if not provided
      const defaultParams = {
        legendary_allowed: false,
        mythical_allowed: false,
        max_stage: 2,
        baby_allowed: true,
        ...rollParams
      };

      // Roll the monster
      const rolledMonster = await monsterRoller.rollMonster({
        trainerId,
        ...defaultParams
      });

      console.log(`Rolled monster ${rolledMonster.id} for trainer ${trainerId} from prompt reward`);
      return rolledMonster;
    } catch (error) {
      console.error('Error rolling monster:', error);
      throw error;
    }
  }

  /**
   * Reroll a monster using Forget-Me-Not berry
   * @param {number} trainerId - Trainer ID
   * @param {number} monsterId - Monster ID to reroll
   * @param {Object} originalParams - Original roll parameters
   * @returns {Object} New monster and old monster info
   */
  static async rerollMonsterWithForgetMeNot(trainerId, monsterId, originalParams = {}) {
    try {
      // Check if trainer has Forget-Me-Not berry
      const trainer = await db.asyncGet('SELECT berries FROM trainers WHERE id = $1', [trainerId]);
      if (!trainer) {
        throw new Error('Trainer not found');
      }

      const berries = trainer.berries ? JSON.parse(trainer.berries) : {};
      const forgetMeNotCount = parseInt(berries['Forget Me Not'] || 0);

      if (forgetMeNotCount < 1) {
        throw new Error('No Forget-Me-Not berries available');
      }

      // Get the old monster info
      const oldMonster = await db.asyncGet('SELECT * FROM monsters WHERE id = $1 AND trainer_id = $2', [monsterId, trainerId]);
      if (!oldMonster) {
        throw new Error('Monster not found or not owned by trainer');
      }

      await db.asyncRun('BEGIN TRANSACTION');

      try {
        // Consume the Forget-Me-Not berry
        const newForgetMeNotCount = forgetMeNotCount - 1;
        await db.asyncRun(`
          UPDATE trainers SET berries = jsonb_set(
            COALESCE(berries, '{}'),
            '{Forget Me Not}',
            $2::text::jsonb
          ) WHERE id = $1
        `, [trainerId, newForgetMeNotCount.toString()]);

        // Delete the old monster
        await db.asyncRun('DELETE FROM monsters WHERE id = $1', [monsterId]);

        // Roll a new monster with the same parameters
        const newMonster = await this.rollAndAddMonster(trainerId, originalParams);

        await db.asyncRun('COMMIT');

        return {
          success: true,
          oldMonster: {
            id: oldMonster.id,
            species_name: oldMonster.species_name,
            nickname: oldMonster.nickname
          },
          newMonster,
          berries_remaining: newForgetMeNotCount
        };
      } catch (error) {
        await db.asyncRun('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Error rerolling monster:', error);
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
      let itemId = item.item_id;
      
      // If item_name is provided instead of item_id, look up the ID
      if (!itemId && item.item_name) {
        const itemRecord = await db.asyncGet('SELECT id FROM items WHERE name = $1', [item.item_name]);
        if (itemRecord) {
          itemId = itemRecord.id;
        } else {
          console.warn(`Item not found: ${item.item_name}`);
          return;
        }
      }

      if (!itemId) {
        console.warn('No valid item ID found for item:', item);
        return;
      }

      const quantity = item.quantity || 1;
      const chance = item.chance || 100;

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

      console.log(`Added ${quantity}x item ${itemId} to trainer ${trainerId}`);
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
   * Get formatted reward summary for display
   * @param {Object} rewards - Applied rewards object
   * @returns {Object} Formatted reward summary
   */
  static formatRewardSummary(rewards) {
    const summary = {
      levels: rewards.levels,
      coins: rewards.coins,
      items: [],
      monsters: rewards.monsters || [],
      special_items: rewards.special_items || []
    };

    // Format items for display
    for (const item of rewards.items || []) {
      summary.items.push({
        name: item.item_name || `Item ${item.item_id}`,
        quantity: item.quantity || 1
      });
    }

    return summary;
  }
}

module.exports = ImmediateRewardService;
