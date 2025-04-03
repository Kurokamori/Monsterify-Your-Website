const pool = require('../db');
const BossRewardTemplate = require('./BossRewardTemplate');

class Boss {
  /**
   * Get the current active boss
   * @returns {Promise<Object|null>} - Current active boss or null if none exists
   */
  static async getCurrentBoss() {
    try {
      const query = `
        SELECT * FROM bosses
        WHERE is_active = true
        ORDER BY created_at DESC
        LIMIT 1
      `;
      const result = await pool.query(query);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting current boss:', error);
      return null;
    }
  }

  /**
   * Get a boss by ID
   * @param {number} bossId - Boss ID
   * @returns {Promise<Object|null>} - Boss or null if not found
   */
  static async getById(bossId) {
    try {
      const query = `
        SELECT * FROM bosses
        WHERE boss_id = $1
      `;
      const result = await pool.query(query, [bossId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error(`Error getting boss ${bossId}:`, error);
      return null;
    }
  }

  /**
   * Create a new boss
   * @param {Object} bossData - Boss data
   * @returns {Promise<Object|null>} - Created boss or null if error
   */
  static async create(bossData) {
    try {
      // Set the current month and year
      const now = new Date();
      const month = now.getMonth() + 1; // JavaScript months are 0-indexed
      const year = now.getFullYear();

      // Deactivate any currently active bosses
      await pool.query(`
        UPDATE bosses
        SET is_active = false
        WHERE is_active = true
      `);

      // Create the new boss
      const query = `
        INSERT INTO bosses (
          name, flavor_text, image_url, max_health, current_health,
          is_active, is_defeated, month, year
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      const values = [
        bossData.name,
        bossData.flavor_text,
        bossData.image_url,
        bossData.max_health,
        bossData.max_health, // Current health starts at max
        true, // Is active
        false, // Is not defeated
        month,
        year
      ];

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating boss:', error);
      return null;
    }
  }

  /**
   * Update a boss
   * @param {number} bossId - Boss ID
   * @param {Object} bossData - Updated boss data
   * @returns {Promise<Object|null>} - Updated boss or null if error
   */
  static async update(bossId, bossData) {
    try {
      // Build the SET clause dynamically based on provided data
      const fields = [];
      const values = [];
      let paramIndex = 1;

      for (const [key, value] of Object.entries(bossData)) {
        if (key !== 'boss_id') { // Skip the ID field
          fields.push(`${key} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      }

      // Add the boss ID as the last parameter
      values.push(bossId);

      const query = `
        UPDATE bosses
        SET ${fields.join(', ')}
        WHERE boss_id = $${paramIndex}
        RETURNING *
      `;

      const result = await pool.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error(`Error updating boss ${bossId}:`, error);
      return null;
    }
  }

  /**
   * Damage a boss
   * @param {number} bossId - Boss ID
   * @param {string} playerUserId - Player user ID (Discord ID)
   * @param {number} trainerId - Trainer ID (optional)
   * @param {number} damageAmount - Amount of damage to deal
   * @param {string} source - Source of the damage (e.g., 'task', 'habit', 'art')
   * @returns {Promise<Object|null>} - Updated boss or null if error
   */
  static async damageBoss(bossId, playerUserId, damageAmount, source, trainerId = null) {
    try {
      // Start a transaction
      await pool.query('BEGIN');

      // Get the current boss
      const boss = await this.getById(bossId);
      if (!boss) {
        await pool.query('ROLLBACK');
        throw new Error(`Boss with ID ${bossId} not found`);
      }

      // Check if the boss is already defeated
      if (boss.is_defeated) {
        await pool.query('ROLLBACK');
        throw new Error(`Boss ${bossId} is already defeated`);
      }

      // Calculate new health
      let newHealth = Math.max(0, boss.current_health - damageAmount);
      const isDefeated = newHealth === 0;

      // Update the boss health
      const updateQuery = `
        UPDATE bosses
        SET current_health = $1,
            is_defeated = $2,
            defeated_at = $3
        WHERE boss_id = $4
        RETURNING *
      `;

      const updateValues = [
        newHealth,
        isDefeated,
        isDefeated ? new Date() : null,
        bossId
      ];

      const updatedBoss = await pool.query(updateQuery, updateValues);

      // Get the player's current total damage for this boss
      const damageQuery = `
        SELECT SUM(damage_amount) as total_damage
        FROM boss_damage
        WHERE boss_id = $1 AND player_user_id = $2
      `;

      const damageResult = await pool.query(damageQuery, [bossId, playerUserId]);
      const currentTotalDamage = damageResult.rows[0]?.total_damage || 0;
      const newTotalDamage = parseInt(currentTotalDamage) + damageAmount;

      // Record the damage
      const recordQuery = `
        INSERT INTO boss_damage (
          boss_id, player_user_id, trainer_id, damage_amount, total_damage, source
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const recordValues = [
        bossId,
        playerUserId,
        trainerId,
        damageAmount,
        newTotalDamage,
        source
      ];

      await pool.query(recordQuery, recordValues);

      // If the boss is defeated, generate rewards for all participants
      if (isDefeated) {
        await this.generateRewards(bossId);
      }

      // Commit the transaction
      await pool.query('COMMIT');

      return updatedBoss.rows[0];
    } catch (error) {
      // Rollback the transaction on error
      await pool.query('ROLLBACK');
      console.error(`Error damaging boss ${bossId}:`, error);
      throw error;
    }
  }

  /**
   * Generate rewards for all participants when a boss is defeated
   * @param {number} bossId - Boss ID
   * @returns {Promise<boolean>} - Success status
   */
  static async generateRewards(bossId) {
    try {
      // Get all damage records for this boss
      const query = `
        SELECT
          player_user_id,
          SUM(damage_amount) as total_damage
        FROM boss_damage
        WHERE boss_id = $1
        GROUP BY player_user_id
        ORDER BY total_damage DESC
      `;

      const result = await pool.query(query, [bossId]);
      const participants = result.rows;

      if (participants.length === 0) {
        console.log(`No participants found for boss ${bossId}`);
        return true;
      }

      // Get the boss
      const boss = await this.getById(bossId);
      if (!boss) {
        throw new Error(`Boss with ID ${bossId} not found`);
      }

      // Get assigned reward templates for this boss
      const assignedTemplates = await BossRewardTemplate.getAssignedTemplates(bossId);

      // If no templates are assigned, use the default reward generation logic
      if (!assignedTemplates || assignedTemplates.length === 0) {
        console.log(`No reward templates assigned to boss ${bossId}, using default rewards`);
        return await this.generateDefaultRewards(bossId, participants, boss);
      }

      // Calculate total damage done to the boss
      const totalDamage = participants.reduce((sum, p) => sum + parseInt(p.total_damage), 0);

      // Separate top damager templates from regular templates
      const topDamagerTemplates = assignedTemplates.filter(t => t.is_top_damager);
      const regularTemplates = assignedTemplates.filter(t => !t.is_top_damager);

      // Generate rewards for each participant
      for (const participant of participants) {
        const playerUserId = participant.player_user_id;
        const playerDamage = parseInt(participant.total_damage);

        // Get the player's main trainer
        const trainerQuery = `
          SELECT id FROM trainers
          WHERE player_user_id = $1
          ORDER BY level DESC
          LIMIT 1
        `;
        const trainerResult = await pool.query(trainerQuery, [playerUserId]);
        const trainerId = trainerResult.rows[0]?.id;

        if (!trainerId) {
          console.log(`No trainer found for player ${playerUserId}, skipping rewards`);
          continue;
        }

        // Calculate the percentage of damage this player did
        const damagePercentage = totalDamage > 0 ? playerDamage / totalDamage : 0;

        // Determine which templates to use
        const isTopDamager = participants.indexOf(participant) === 0;
        const templatesForPlayer = isTopDamager && topDamagerTemplates.length > 0
          ? [...topDamagerTemplates, ...regularTemplates]
          : regularTemplates;

        // Initialize reward data
        let coins = 0;
        let levels = 0;
        const items = { items: [] };
        const monsters = { monsters: [] };

        // Apply all templates
        for (const template of templatesForPlayer) {
          // Add coins and levels
          coins += template.coins || 0;
          levels += template.levels || 0;

          // Add items
          if (template.items && template.items.items && Array.isArray(template.items.items)) {
            items.items.push(...template.items.items);
          }

          // Add monsters
          if (template.monsters && template.monsters.monsters && Array.isArray(template.monsters.monsters)) {
            monsters.monsters.push(...template.monsters.monsters);
          }
        }

        // Scale coins based on damage percentage (minimum 10% of base coins)
        const scaledCoins = Math.max(Math.round(coins * damagePercentage), Math.round(coins * 0.1));

        // Add a default trophy item if none exists
        if (items.items.length === 0 || !items.items.some(item => item.name.includes('Trophy'))) {
          items.items.push({
            name: 'Boss Trophy',
            quantity: 1,
            description: `Trophy for defeating ${boss.name}`,
            category: 'ITEMS'
          });
        }

        // Add a default monster if none exists
        if (monsters.monsters.length === 0) {
          if (isTopDamager) {
            monsters.monsters.push({
              name: `Baby ${boss.name}`,
              description: `A baby version of ${boss.name}`,
              is_special: true,
              is_static: false // This will be rolled when claimed
            });
          } else {
            monsters.monsters.push({
              name: `${boss.name} Grunt`,
              description: `A grunt that served ${boss.name}`,
              is_special: false,
              is_static: false // This will be rolled when claimed
            });
          }
        }

        // Create reward record
        const rewardQuery = `
          INSERT INTO boss_rewards (
            boss_id, trainer_id, coins, levels, items, monsters, is_claimed
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `;

        const rewardValues = [
          bossId,
          trainerId,
          scaledCoins,
          levels,
          JSON.stringify(items),
          JSON.stringify(monsters),
          false // Not claimed yet
        ];

        await pool.query(rewardQuery, rewardValues);
      }

      return true;
    } catch (error) {
      console.error(`Error generating rewards for boss ${bossId}:`, error);
      return false;
    }
  }

  /**
   * Generate default rewards when no templates are assigned
   * @param {number} bossId - Boss ID
   * @param {Array} participants - Array of participants
   * @param {Object} boss - Boss object
   * @returns {Promise<boolean>} - Success status
   * @private
   */
  static async generateDefaultRewards(bossId, participants, boss) {
    try {
      // Calculate total damage done to the boss
      const totalDamage = participants.reduce((sum, p) => sum + parseInt(p.total_damage), 0);

      // Generate rewards for each participant
      for (const participant of participants) {
        const playerUserId = participant.player_user_id;
        const playerDamage = parseInt(participant.total_damage);

        // Get the player's main trainer
        const trainerQuery = `
          SELECT id FROM trainers
          WHERE player_user_id = $1
          ORDER BY level DESC
          LIMIT 1
        `;
        const trainerResult = await pool.query(trainerQuery, [playerUserId]);
        const trainerId = trainerResult.rows[0]?.id;

        if (!trainerId) {
          console.log(`No trainer found for player ${playerUserId}, skipping rewards`);
          continue;
        }

        // Calculate the percentage of damage this player did
        const damagePercentage = totalDamage > 0 ? playerDamage / totalDamage : 0;

        // Base rewards
        const baseCoins = 1000;
        const coins = Math.round(baseCoins * damagePercentage);

        // Special reward for top damager
        const isTopDamager = participants.indexOf(participant) === 0;

        // Create reward record
        const rewardQuery = `
          INSERT INTO boss_rewards (
            boss_id, trainer_id, coins, levels, items, monsters, is_claimed
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `;

        const items = {
          items: []
        };

        // Add special items based on damage percentage
        if (damagePercentage >= 0.1) { // 10% or more damage
          items.items.push({
            name: 'Boss Trophy',
            quantity: 1,
            description: `Trophy for defeating ${boss.name}`,
            category: 'ITEMS'
          });
        }

        const monsters = {
          monsters: []
        };

        // Top damager gets a special monster
        if (isTopDamager) {
          monsters.monsters.push({
            name: `Baby ${boss.name}`,
            description: `A baby version of ${boss.name}`,
            is_special: true,
            is_static: false // This will be rolled when claimed
          });
        } else {
          // Everyone else gets a grunt monster
          monsters.monsters.push({
            name: `${boss.name} Grunt`,
            description: `A grunt that served ${boss.name}`,
            is_special: false,
            is_static: false // This will be rolled when claimed
          });
        }

        const rewardValues = [
          bossId,
          trainerId,
          coins,
          0, // No levels by default
          JSON.stringify(items),
          JSON.stringify(monsters),
          false // Not claimed yet
        ];

        await pool.query(rewardQuery, rewardValues);
      }

      return true;
    } catch (error) {
      console.error(`Error generating default rewards for boss ${bossId}:`, error);
      return false;
    }
  }

  /**
   * Get a player's damage for a boss
   * @param {number} bossId - Boss ID
   * @param {string} playerUserId - Player user ID
   * @returns {Promise<Object|null>} - Damage info or null if not found
   */
  static async getPlayerDamage(bossId, playerUserId) {
    try {
      const query = `
        SELECT
          SUM(damage_amount) as total_damage,
          MAX(created_at) as last_damage_at
        FROM boss_damage
        WHERE boss_id = $1 AND player_user_id = $2
        GROUP BY player_user_id
      `;

      const result = await pool.query(query, [bossId, playerUserId]);
      return result.rows[0] || { total_damage: 0, last_damage_at: null };
    } catch (error) {
      console.error(`Error getting player damage for boss ${bossId}:`, error);
      return { total_damage: 0, last_damage_at: null };
    }
  }

  /**
   * Get a trainer's damage for a boss (legacy method for backward compatibility)
   * @param {number} bossId - Boss ID
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Object|null>} - Damage info or null if not found
   */
  static async getTrainerDamage(bossId, trainerId) {
    try {
      // First try to get the player_user_id for this trainer
      const trainerQuery = `
        SELECT player_user_id FROM trainers
        WHERE id = $1
      `;
      const trainerResult = await pool.query(trainerQuery, [trainerId]);
      const playerUserId = trainerResult.rows[0]?.player_user_id;

      if (playerUserId) {
        // If we have a player_user_id, use that to get damage
        return await this.getPlayerDamage(bossId, playerUserId);
      } else {
        // Fallback to the old way
        const query = `
          SELECT
            SUM(damage_amount) as total_damage,
            MAX(created_at) as last_damage_at
          FROM boss_damage
          WHERE boss_id = $1 AND trainer_id = $2
          GROUP BY trainer_id
        `;

        const result = await pool.query(query, [bossId, trainerId]);
        return result.rows[0] || { total_damage: 0, last_damage_at: null };
      }
    } catch (error) {
      console.error(`Error getting trainer damage for boss ${bossId}:`, error);
      return { total_damage: 0, last_damage_at: null };
    }
  }

  /**
   * Get the top damagers for a boss
   * @param {number} bossId - Boss ID
   * @param {number} limit - Number of top damagers to return
   * @returns {Promise<Array>} - Array of top damagers
   */
  static async getTopDamagers(bossId, limit = 10) {
    try {
      const query = `
        SELECT
          bd.player_user_id,
          t.name as trainer_name,
          SUM(bd.damage_amount) as total_damage
        FROM boss_damage bd
        JOIN trainers t ON bd.player_user_id = t.player_user_id
        WHERE bd.boss_id = $1
        GROUP BY bd.player_user_id, t.name
        ORDER BY total_damage DESC
        LIMIT $2
      `;

      const result = await pool.query(query, [bossId, limit]);
      return result.rows;
    } catch (error) {
      console.error(`Error getting top damagers for boss ${bossId}:`, error);
      return [];
    }
  }

  /**
   * Get a player's rewards for a boss
   * @param {number} bossId - Boss ID
   * @param {string} playerUserId - Player user ID
   * @returns {Promise<Object|null>} - Rewards or null if not found
   */
  static async getPlayerRewards(bossId, playerUserId) {
    try {
      // First get the player's main trainer
      const trainerQuery = `
        SELECT id FROM trainers
        WHERE player_user_id = $1
        ORDER BY level DESC
        LIMIT 1
      `;
      const trainerResult = await pool.query(trainerQuery, [playerUserId]);
      const trainerId = trainerResult.rows[0]?.id;

      if (!trainerId) {
        return null;
      }

      // Then get the rewards for that trainer
      const query = `
        SELECT *
        FROM boss_rewards
        WHERE boss_id = $1 AND trainer_id = $2
      `;

      const result = await pool.query(query, [bossId, trainerId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error(`Error getting player rewards for boss ${bossId}:`, error);
      return null;
    }
  }

  /**
   * Get a trainer's rewards for a boss (legacy method for backward compatibility)
   * @param {number} bossId - Boss ID
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Object|null>} - Rewards or null if not found
   */
  static async getTrainerRewards(bossId, trainerId) {
    try {
      // First try to get the player_user_id for this trainer
      const trainerQuery = `
        SELECT player_user_id FROM trainers
        WHERE id = $1
      `;
      const trainerResult = await pool.query(trainerQuery, [trainerId]);
      const playerUserId = trainerResult.rows[0]?.player_user_id;

      if (playerUserId) {
        // If we have a player_user_id, use that to get rewards
        return await this.getPlayerRewards(bossId, playerUserId);
      } else {
        // Fallback to the old way
        const query = `
          SELECT *
          FROM boss_rewards
          WHERE boss_id = $1 AND trainer_id = $2
        `;

        const result = await pool.query(query, [bossId, trainerId]);
        return result.rows[0] || null;
      }
    } catch (error) {
      console.error(`Error getting trainer rewards for boss ${bossId}:`, error);
      return null;
    }
  }

  /**
   * Claim rewards for a player
   * @param {number} bossId - Boss ID
   * @param {string} playerUserId - Player user ID
   * @returns {Promise<Object|null>} - Claimed rewards or null if error
   */
  static async claimPlayerRewards(bossId, playerUserId) {
    try {
      // First get the player's main trainer
      const trainerQuery = `
        SELECT id FROM trainers
        WHERE player_user_id = $1
        ORDER BY level DESC
        LIMIT 1
      `;
      const trainerResult = await pool.query(trainerQuery, [playerUserId]);
      const trainerId = trainerResult.rows[0]?.id;

      if (!trainerId) {
        throw new Error(`No trainer found for player ${playerUserId}`);
      }

      // Then claim the rewards for that trainer
      return await this.claimTrainerRewards(bossId, trainerId);
    } catch (error) {
      console.error(`Error claiming player rewards for boss ${bossId}:`, error);
      return null;
    }
  }

  /**
   * Claim rewards for a trainer (legacy method for backward compatibility)
   * @param {number} bossId - Boss ID
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Object|null>} - Claimed rewards or null if error
   */
  static async claimRewards(bossId, trainerId) {
    return await this.claimTrainerRewards(bossId, trainerId);
  }

  /**
   * Claim rewards for a trainer
   * @param {number} bossId - Boss ID
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Object|null>} - Claimed rewards or null if error
   */
  static async claimTrainerRewards(bossId, trainerId) {
    try {
      // Start a transaction
      await pool.query('BEGIN');

      // Get the rewards
      const rewards = await this.getTrainerRewards(bossId, trainerId);
      if (!rewards) {
        await pool.query('ROLLBACK');
        throw new Error(`No rewards found for trainer ${trainerId} and boss ${bossId}`);
      }

      // Check if already claimed
      if (rewards.is_claimed) {
        await pool.query('ROLLBACK');
        throw new Error(`Rewards for trainer ${trainerId} and boss ${bossId} already claimed`);
      }

      // Mark as claimed
      const updateQuery = `
        UPDATE boss_rewards
        SET is_claimed = true, claimed_at = CURRENT_TIMESTAMP
        WHERE boss_id = $1 AND trainer_id = $2
        RETURNING *
      `;

      const result = await pool.query(updateQuery, [bossId, trainerId]);
      const claimedRewards = result.rows[0];

      // Add coins to the trainer
      if (claimedRewards.coins > 0) {
        const Trainer = require('./Trainer');
        await Trainer.addCoins(trainerId, claimedRewards.coins);
      }

      // Add levels to the trainer if applicable
      if (claimedRewards.levels > 0) {
        const Trainer = require('./Trainer');
        await Trainer.addLevels(trainerId, claimedRewards.levels);
      }

      // Process items
      if (claimedRewards.items && claimedRewards.items.items && claimedRewards.items.items.length > 0) {
        const Item = require('./Item');
        for (const item of claimedRewards.items.items) {
          await Item.addToTrainer(trainerId, item.name, item.quantity || 1, item.category || 'ITEMS');
        }
      }

      // Process monsters
      if (claimedRewards.monsters && claimedRewards.monsters.monsters && claimedRewards.monsters.monsters.length > 0) {
        const Monster = require('./Monster');
        const MonsterRoller = require('../utils/MonsterRoller');

        for (const monster of claimedRewards.monsters.monsters) {
          if (monster.is_static) {
            // Create a static monster with the given details
            const monsterData = {
              name: monster.name,
              description: monster.description || '',
              trainer_id: trainerId,
              level: 5, // Default level
              box_number: 1, // Default box
              is_special: monster.is_special || false,
              species1: monster.species1 || 'Unknown',
              species2: monster.species2 || null,
              species3: monster.species3 || null,
              type1: monster.type1 || 'Normal',
              type2: monster.type2 || null,
              type3: monster.type3 || null,
              type4: monster.type4 || null,
              type5: monster.type5 || null,
              attribute: monster.attribute || 'Data'
            };

            await Monster.create(monsterData);
          } else {
            // Roll a random monster
            try {
              // Set up roller options
              const rollerOptions = {
                minLevel: 5,
                maxLevel: 10,
                filters: {}
              };

              // If it's a special monster, increase the rarity
              if (monster.is_special) {
                rollerOptions.filters = {
                  pokemon: { rarity: 'rare' },
                  digimon: { stage: 'champion' }
                };
              }

              // Roll the monster
              const roller = new MonsterRoller(rollerOptions);
              const rolledMonster = await roller.rollOne();

              if (rolledMonster) {
                // Create the monster with the rolled data but use the template name
                const monsterData = {
                  name: monster.name || rolledMonster.name,
                  description: monster.description || '',
                  trainer_id: trainerId,
                  level: 5,
                  box_number: 1,
                  is_special: monster.is_special || false,
                  species1: rolledMonster.species1,
                  species2: rolledMonster.species2,
                  species3: rolledMonster.species3,
                  type1: rolledMonster.type1,
                  type2: rolledMonster.type2,
                  type3: rolledMonster.type3,
                  type4: rolledMonster.type4,
                  type5: rolledMonster.type5,
                  attribute: rolledMonster.attribute
                };

                await Monster.create(monsterData);
              } else {
                // Fallback if rolling fails
                const monsterData = {
                  name: monster.name,
                  description: monster.description || '',
                  trainer_id: trainerId,
                  level: 5,
                  box_number: 1,
                  is_special: monster.is_special || false,
                  species1: 'Unknown',
                  type1: 'Normal'
                };

                await Monster.create(monsterData);
              }
            } catch (error) {
              console.error('Error rolling monster:', error);
              // Create a basic monster as fallback
              const monsterData = {
                name: monster.name,
                description: monster.description || '',
                trainer_id: trainerId,
                level: 5,
                box_number: 1,
                is_special: monster.is_special || false,
                species1: 'Unknown',
                type1: 'Normal'
              };

              await Monster.create(monsterData);
            }
          }
        }
      }

      // Commit the transaction
      await pool.query('COMMIT');

      return claimedRewards;
    } catch (error) {
      // Rollback the transaction on error
      await pool.query('ROLLBACK');
      console.error(`Error claiming rewards for trainer ${trainerId} and boss ${bossId}:`, error);
      throw error;
    }
  }

  /**
   * Check if a player has rewards for a boss
   * @param {number} bossId - Boss ID
   * @param {string} playerUserId - Player user ID
   * @returns {Promise<Object>} - Reward status
   */
  static async checkPlayerRewardStatus(bossId, playerUserId) {
    try {
      // First get the player's main trainer
      const trainerQuery = `
        SELECT id FROM trainers
        WHERE player_user_id = $1
        ORDER BY level DESC
        LIMIT 1
      `;
      const trainerResult = await pool.query(trainerQuery, [playerUserId]);
      const trainerId = trainerResult.rows[0]?.id;

      if (!trainerId) {
        return { hasRewards: false, isClaimed: false, rewards: null };
      }

      // Check if the player has rewards
      const rewards = await this.getPlayerRewards(bossId, playerUserId);

      if (!rewards) {
        return { hasRewards: false, isClaimed: false, rewards: null };
      }

      return {
        hasRewards: true,
        isClaimed: rewards.is_claimed,
        rewards: rewards
      };
    } catch (error) {
      console.error(`Error checking reward status for player ${playerUserId} and boss ${bossId}:`, error);
      return { hasRewards: false, isClaimed: false, rewards: null };
    }
  }
}

module.exports = Boss;
