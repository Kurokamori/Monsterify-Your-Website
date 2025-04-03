const pool = require('../db');
const Mission = require('./Mission');
const Monster = require('./Monster');
const Trainer = require('./Trainer');

class ActiveMission {
  /**
   * Create the active_missions table if it doesn't exist
   * @returns {Promise<void>}
   */
  static async createTableIfNotExists() {
    try {
      const query = `
        CREATE TABLE IF NOT EXISTS active_missions (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(20) NOT NULL UNIQUE,
          mission_id INTEGER REFERENCES missions(id),
          mon_ids INTEGER[],
          current_progress INTEGER DEFAULT 0,
          total_progress INTEGER NOT NULL,
          start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;

      await pool.query(query);
      console.log('Active missions table created or already exists');
    } catch (error) {
      console.error('Error creating active_missions table:', error);
      throw error;
    }
  }

  /**
   * Get active mission for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} - Active mission with details or null if none
   */
  static async getByUserId(userId) {
    try {
      const query = `
        SELECT am.*, m.name, m.description, 
          m.progress_flavor_1, m.progress_flavor_2, m.progress_flavor_3, 
          m.progress_flavor_4, m.progress_flavor_5, m.completion_message,
          m.completion_image_url, m.progress_image_url, 
          m.level_rewards, m.coin_rewards, m.item_rewards
        FROM active_missions am
        JOIN missions m ON am.mission_id = m.id
        WHERE am.user_id = $1
      `;

      const result = await pool.query(query, [userId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const activeMission = result.rows[0];
      
      // Get monster details
      if (activeMission.mon_ids && activeMission.mon_ids.length > 0) {
        const monsterQuery = `
          SELECT mon_id, name, img_link, level, species1, type1, type2, attribute
          FROM mons
          WHERE mon_id = ANY($1)
        `;
        
        const monsterResult = await pool.query(monsterQuery, [activeMission.mon_ids]);
        activeMission.monsters = monsterResult.rows;
      } else {
        activeMission.monsters = [];
      }
      
      return activeMission;
    } catch (error) {
      console.error(`Error getting active mission for user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Start a new mission for a user
   * @param {string} userId - User ID
   * @param {number} missionId - Mission ID
   * @param {Array<number>} monIds - Array of monster IDs (up to 3)
   * @returns {Promise<Object|null>} - Created active mission or null if failed
   */
  static async start(userId, missionId, monIds) {
    try {
      // Check if user already has an active mission
      const existingMission = await this.getByUserId(userId);
      if (existingMission) {
        throw new Error('User already has an active mission');
      }
      
      // Get the mission template
      const mission = await Mission.getById(missionId);
      if (!mission) {
        throw new Error('Mission not found');
      }
      
      // Validate monsters
      if (!monIds || monIds.length === 0 || monIds.length > 3) {
        throw new Error('Must select between 1 and 3 monsters');
      }
      
      // Verify monsters exist and meet requirements
      for (const monId of monIds) {
        const monster = await Monster.getById(monId);
        if (!monster) {
          throw new Error(`Monster with ID ${monId} not found`);
        }
        
        // Check level requirement if specified
        if (mission.level_requirement && monster.level < mission.level_requirement) {
          throw new Error(`Monster ${monster.name} does not meet the level requirement`);
        }
        
        // Check type requirements if specified
        if (mission.type_requirements && mission.type_requirements.length > 0) {
          const monsterTypes = [
            monster.type1, monster.type2, monster.type3, 
            monster.type4, monster.type5
          ].filter(type => type);
          
          const hasRequiredType = mission.type_requirements.some(reqType => 
            monsterTypes.includes(reqType)
          );
          
          if (mission.requirements_type === 'AND') {
            // Must have ALL required types
            const hasAllTypes = mission.type_requirements.every(reqType => 
              monsterTypes.includes(reqType)
            );
            
            if (!hasAllTypes) {
              throw new Error(`Monster ${monster.name} does not have all required types`);
            }
          } else if (!hasRequiredType) {
            // Must have at least one required type (OR)
            throw new Error(`Monster ${monster.name} does not have any of the required types`);
          }
        }
        
        // Check attribute requirements if specified
        if (mission.attribute_requirements && mission.attribute_requirements.length > 0) {
          const hasRequiredAttribute = mission.attribute_requirements.includes(monster.attribute);
          
          if (!hasRequiredAttribute) {
            throw new Error(`Monster ${monster.name} does not have the required attribute`);
          }
        }
      }
      
      // Calculate total progress needed
      let totalProgress;
      if (mission.max_progress_needed) {
        // Random value between min and max
        totalProgress = Math.floor(
          Math.random() * (mission.max_progress_needed - mission.min_progress_needed + 1)
        ) + mission.min_progress_needed;
      } else {
        // Fixed value
        totalProgress = mission.min_progress_needed;
      }
      
      // Start the mission
      const query = `
        INSERT INTO active_missions (
          user_id, mission_id, mon_ids, total_progress
        )
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      
      const values = [userId, missionId, monIds, totalProgress];
      const result = await pool.query(query, values);
      
      return result.rows[0];
    } catch (error) {
      console.error(`Error starting mission for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Update mission progress
   * @param {string} userId - User ID
   * @param {number} progressAmount - Amount to increase progress by (default 1-2 random)
   * @returns {Promise<Object>} - Updated mission with progress message
   */
  static async updateProgress(userId, progressAmount = null) {
    try {
      // Get the active mission
      const activeMission = await this.getByUserId(userId);
      if (!activeMission) {
        throw new Error('No active mission found');
      }
      
      // If no progress amount specified, generate random 1-3
      if (progressAmount === null) {
        progressAmount = Math.floor(Math.random() * 3) + 1;
      }
      
      // Get a random progress message
      const progressMessages = [
        activeMission.progress_flavor_1,
        activeMission.progress_flavor_2,
        activeMission.progress_flavor_3,
        activeMission.progress_flavor_4,
        activeMission.progress_flavor_5
      ].filter(msg => msg); // Filter out null/empty messages
      
      let progressMessage = 'Your monsters continue on their mission...';
      if (progressMessages.length > 0) {
        const randomIndex = Math.floor(Math.random() * progressMessages.length);
        progressMessage = progressMessages[randomIndex];
      }
      
      // Replace {monster_names} placeholder with actual monster names
      if (progressMessage.includes('{monster_names}') && activeMission.monsters) {
        const monsterNames = activeMission.monsters.map(m => m.name).join(', ');
        progressMessage = progressMessage.replace('{monster_names}', monsterNames);
      }
      
      // Calculate new progress
      let newProgress = activeMission.current_progress + progressAmount;
      const isCompleted = newProgress >= activeMission.total_progress;
      
      // Cap progress at total
      if (isCompleted) {
        newProgress = activeMission.total_progress;
      }
      
      // Update the mission progress
      const updateQuery = `
        UPDATE active_missions
        SET current_progress = $1, last_updated = CURRENT_TIMESTAMP
        WHERE user_id = $2
        RETURNING *
      `;
      
      await pool.query(updateQuery, [newProgress, userId]);
      
      return {
        activeMission: {
          ...activeMission,
          current_progress: newProgress
        },
        progressMessage,
        progressAmount,
        isCompleted
      };
    } catch (error) {
      console.error(`Error updating mission progress for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Complete a mission and distribute rewards
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Completion result with rewards
   */
  static async complete(userId) {
    try {
      // Get the active mission
      const activeMission = await this.getByUserId(userId);
      if (!activeMission) {
        throw new Error('No active mission found');
      }
      
      // Check if mission is actually complete
      if (activeMission.current_progress < activeMission.total_progress) {
        throw new Error('Mission is not yet complete');
      }
      
      // Start a transaction
      await pool.query('BEGIN');
      
      try {
        // Move to mission history
        const historyQuery = `
          INSERT INTO mission_history (
            user_id, mission_id, mon_ids
          )
          VALUES ($1, $2, $3)
          RETURNING *
        `;
        
        await pool.query(historyQuery, [
          userId, 
          activeMission.mission_id, 
          activeMission.mon_ids
        ]);
        
        // Delete from active missions
        await pool.query(
          'DELETE FROM active_missions WHERE user_id = $1',
          [userId]
        );
        
        // Distribute rewards
        const rewards = {
          levels: activeMission.level_rewards,
          coins: activeMission.coin_rewards,
          items: []
        };
        
        // If there are monsters, distribute levels among them
        if (activeMission.monsters && activeMission.monsters.length > 0) {
          const levelPerMonster = Math.floor(rewards.levels / activeMission.monsters.length);
          const remainingLevels = rewards.levels % activeMission.monsters.length;
          
          for (let i = 0; i < activeMission.monsters.length; i++) {
            const monster = activeMission.monsters[i];
            const levelsToAdd = levelPerMonster + (i < remainingLevels ? 1 : 0);
            
            if (levelsToAdd > 0) {
              await Monster.addLevels(monster.mon_id, levelsToAdd);
            }
          }
          
          // Get trainer IDs from monsters to distribute coins
          const trainerIds = new Set();
          for (const monster of activeMission.monsters) {
            const monsterDetails = await Monster.getById(monster.mon_id);
            if (monsterDetails && monsterDetails.trainer_id) {
              trainerIds.add(monsterDetails.trainer_id);
            }
          }
          
          // Distribute coins evenly among trainers
          if (trainerIds.size > 0) {
            const coinsPerTrainer = Math.floor(rewards.coins / trainerIds.size);
            for (const trainerId of trainerIds) {
              await Trainer.addCoins(trainerId, coinsPerTrainer);
            }
          }
        }
        
        // Handle item rewards if any
        if (activeMission.item_rewards && activeMission.item_rewards.length > 0) {
          // Get the first trainer ID from the monsters
          let trainerId = null;
          if (activeMission.monsters && activeMission.monsters.length > 0) {
            const monsterDetails = await Monster.getById(activeMission.monsters[0].mon_id);
            if (monsterDetails) {
              trainerId = monsterDetails.trainer_id;
            }
          }
          
          if (trainerId) {
            // Determine which items to award
            let itemsToAward = [];
            if (activeMission.item_reward_amount === 0 || 
                activeMission.item_reward_amount >= activeMission.item_rewards.length) {
              // Award all items
              itemsToAward = [...activeMission.item_rewards];
            } else {
              // Award random selection
              const shuffled = [...activeMission.item_rewards].sort(() => 0.5 - Math.random());
              itemsToAward = shuffled.slice(0, activeMission.item_reward_amount);
            }
            
            // Add items to trainer's inventory
            for (const itemName of itemsToAward) {
              // Determine item category
              const itemQuery = 'SELECT category FROM items WHERE name = $1';
              const itemResult = await pool.query(itemQuery, [itemName]);
              
              if (itemResult.rows.length > 0) {
                const category = this.mapCategoryToInventoryField(itemResult.rows[0].category);
                if (category) {
                  await Trainer.updateInventoryItem(trainerId, category, itemName, 1);
                  rewards.items.push(itemName);
                }
              }
            }
          }
        }
        
        // Commit the transaction
        await pool.query('COMMIT');
        
        return {
          completionMessage: activeMission.completion_message,
          completionImageUrl: activeMission.completion_image_url,
          rewards
        };
      } catch (error) {
        // Rollback in case of error
        await pool.query('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error(`Error completing mission for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Map item category to inventory field name
   * @param {string} category - Item category
   * @returns {string|null} - Inventory field name or null if not mappable
   */
  static mapCategoryToInventoryField(category) {
    const mapping = {
      'item': 'inv_items',
      'ball': 'inv_balls',
      'berry': 'inv_berries',
      'pastry': 'inv_pastries',
      'evolution': 'inv_evolution',
      'egg': 'inv_eggs',
      'antique': 'inv_antiques',
      'held_item': 'inv_helditems',
      'seal': 'inv_seals'
    };
    
    return mapping[category.toLowerCase()] || null;
  }
}

module.exports = ActiveMission;
