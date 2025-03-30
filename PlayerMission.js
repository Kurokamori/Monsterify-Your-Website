const pool = require('../db');
const Mission = require('./Mission');

class PlayerMission {
  /**
   * Create the player_missions table if it doesn't exist
   * @returns {Promise<void>}
   */
  static async createTableIfNotExists() {
    try {
      const query = `
        CREATE TABLE IF NOT EXISTS player_missions (
          id SERIAL PRIMARY KEY,
          player_id INTEGER NOT NULL,
          template_id INTEGER NOT NULL REFERENCES mission_templates(id),
          current_progress INTEGER DEFAULT 0,
          target_progress INTEGER NOT NULL,
          status VARCHAR(20) DEFAULT 'active', -- active, completed, abandoned
          started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          completed_at TIMESTAMP,
          FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
        );
      `;

      await pool.query(query);
      console.log('Player missions table created or already exists');
    } catch (error) {
      console.error('Error creating player_missions table:', error);
      throw error;
    }
  }

  /**
   * Get all missions for a player
   * @param {number} playerId - Player ID
   * @param {string} status - Filter by status (optional)
   * @returns {Promise<Array>} - Array of player missions with template details
   */
  static async getPlayerMissions(playerId, status = null) {
    try {
      let query = `
        SELECT pm.*, mt.name, mt.description, 
          mt.progress_flavor_1, mt.progress_flavor_2, mt.progress_flavor_3, 
          mt.progress_flavor_4, mt.progress_flavor_5, mt.completion_message,
          mt.completion_image_url, mt.progress_image_url, 
          mt.level_rewards, mt.coin_rewards, mt.item_rewards
        FROM player_missions pm
        JOIN mission_templates mt ON pm.template_id = mt.id
        WHERE pm.player_id = $1
      `;

      const values = [playerId];

      if (status) {
        query += ` AND pm.status = $2`;
        values.push(status);
      }

      query += ` ORDER BY pm.started_at DESC`;

      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      console.error(`Error getting missions for player ${playerId}:`, error);
      return [];
    }
  }

  /**
   * Assign a new mission to a player
   * @param {number} playerId - Player ID
   * @param {number} templateId - Mission template ID
   * @returns {Promise<Object|null>} - Created player mission or null if failed
   */
  static async assignMission(playerId, templateId) {
    try {
      // Get the mission template
      const template = await Mission.getById(templateId);
      if (!template) {
        throw new Error(`Mission template ${templateId} not found`);
      }

      // Determine target progress - random between min and max if max is provided
      const minProgress = template.min_progress_needed;
      const maxProgress = template.max_progress_needed;
      const targetProgress = maxProgress 
        ? Math.floor(Math.random() * (maxProgress - minProgress + 1)) + minProgress
        : minProgress;
      
      // Check if player meets level requirements
      const playerQuery = `SELECT level FROM players WHERE id = $1`;
      const playerResult = await pool.query(playerQuery, [playerId]);
      
      if (playerResult.rows.length === 0) {
        throw new Error(`Player ${playerId} not found`);
      }
      
      const playerLevel = playerResult.rows[0].level;
      if (template.level_requirement && playerLevel < template.level_requirement) {
        throw new Error(`Player level ${playerLevel} is below requirement ${template.level_requirement}`);
      }

      // Create the player mission
      const query = `
        INSERT INTO player_missions (player_id, template_id, target_progress)
        VALUES ($1, $2, $3)
        RETURNING *
      `;

      const values = [playerId, templateId, targetProgress];
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error(`Error assigning mission to player ${playerId}:`, error);
      return null;
    }
  }

  /**
   * Update mission progress
   * @param {number} missionId - Player mission ID
   * @param {number} progressToAdd - Progress to add
   * @returns {Promise<Object|null>} - Updated mission or null if failed
   */
  static async updateProgress(missionId, progressToAdd) {
    try {
      const query = `
        UPDATE player_missions
        SET current_progress = LEAST(current_progress + $1, target_progress)
        WHERE id = $2 AND status = 'active'
        RETURNING *
      `;

      const result = await pool.query(query, [progressToAdd, missionId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const mission = result.rows[0];
      
      // Check if mission is completed
      if (mission.current_progress >= mission.target_progress) {
        return await this.completeMission(missionId);
      }
      
      return mission;
    } catch (error) {
      console.error(`Error updating progress for mission ${missionId}:`, error);
      return null;
    }
  }

  /**
   * Complete a mission and distribute rewards
   * @param {number} missionId - Player mission ID
   * @returns {Promise<Object|null>} - Completed mission or null if failed
   */
  static async completeMission(missionId) {
    try {
      // Begin transaction
      await pool.query('BEGIN');
      
      // Get mission and template details
      const missionQuery = `
        SELECT pm.*, mt.level_rewards, mt.coin_rewards, mt.item_rewards, mt.item_reward_amount
        FROM player_missions pm
        JOIN mission_templates mt ON pm.template_id = mt.id
        WHERE pm.id = $1 AND pm.status = 'active'
      `;
      
      const missionResult = await pool.query(missionQuery, [missionId]);
      
      if (missionResult.rows.length === 0) {
        await pool.query('ROLLBACK');
        return null;
      }
      
      const mission = missionResult.rows[0];
      const playerId = mission.player_id;
      
      // Update mission status
      const updateQuery = `
        UPDATE player_missions
        SET status = 'completed', completed_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
      
      const updateResult = await pool.query(updateQuery, [missionId]);
      
      // Distribute rewards
      // 1. Add XP/Level rewards
      if (mission.level_rewards > 0) {
        await pool.query(
          `UPDATE players SET experience = experience + $1 WHERE id = $2`,
          [mission.level_rewards, playerId]
        );
      }
      
      // 2. Add coin rewards
      if (mission.coin_rewards > 0) {
        await pool.query(
          `UPDATE players SET coins = coins + $1 WHERE id = $2`,
          [mission.coin_rewards, playerId]
        );
      }
      
      // 3. Add item rewards
      if (mission.item_rewards && mission.item_rewards.length > 0) {
        let itemsToGive = [];
        
        if (mission.item_reward_amount === 0) {
          // Give all items
          itemsToGive = mission.item_rewards;
        } else {
          // Give random selection
          const count = Math.min(mission.item_reward_amount, mission.item_rewards.length);
          const shuffled = [...mission.item_rewards].sort(() => 0.5 - Math.random());
          itemsToGive = shuffled.slice(0, count);
        }
        
        for (const itemName of itemsToGive) {
          // Check if item exists
          const itemQuery = `SELECT id FROM items WHERE name = $1`;
          const itemResult = await pool.query(itemQuery, [itemName]);
          
          if (itemResult.rows.length > 0) {
            const itemId = itemResult.rows[0].id;
            
            // Add to player inventory
            await pool.query(
              `INSERT INTO player_inventory (player_id, item_id, quantity) 
               VALUES ($1, $2, 1)
               ON CONFLICT (player_id, item_id) 
               DO UPDATE SET quantity = player_inventory.quantity + 1`,
              [playerId, itemId]
            );
          }
        }
      }
      
      // Commit transaction
      await pool.query('COMMIT');
      
      return updateResult.rows[0];
    } catch (error) {
      await pool.query('ROLLBACK');
      console.error(`Error completing mission ${missionId}:`, error);
      return null;
    }
  }

  /**
   * Abandon a mission
   * @param {number} missionId - Player mission ID
   * @param {number} playerId - Player ID for verification
   * @returns {Promise<boolean>} - Whether the abandonment was successful
   */
  static async abandonMission(missionId, playerId) {
    try {
      const query = `
        UPDATE player_missions
        SET status = 'abandoned'
        WHERE id = $1 AND player_id = $2 AND status = 'active'
        RETURNING id
      `;
      
      const result = await pool.query(query, [missionId, playerId]);
      return result.rows.length > 0;
    } catch (error) {
      console.error(`Error abandoning mission ${missionId}:`, error);
      return false;
    }
  }

  /**
   * Check if a monster meets the requirements for a mission
   * @param {number} missionId - Player mission ID
   * @param {number} monsterId - Monster ID
   * @returns {Promise<boolean>} - Whether the monster is eligible
   */
  static async checkMonsterEligibility(missionId, monsterId) {
    try {
      // Get mission requirements from template
      const query = `
        SELECT mt.type_requirements, mt.attribute_requirements, mt.requirements_type
        FROM player_missions pm
        JOIN mission_templates mt ON pm.template_id = mt.id
        WHERE pm.id = $1
      `;
      
      const result = await pool.query(query, [missionId]);
      
      if (result.rows.length === 0) {
        return false;
      }
      
      const requirements = result.rows[0];
      
      // If no requirements, all monsters are eligible
      if ((!requirements.type_requirements || requirements.type_requirements.length === 0) && 
          (!requirements.attribute_requirements || requirements.attribute_requirements.length === 0)) {
        return true;
      }
      
      // Get monster details
      const monsterQuery = `
        SELECT type1, type2, type3, type4, type5, attribute
        FROM mons
        WHERE id = $1
        UNION ALL
        SELECT "Type1" as type1, "Type2" as type2, NULL as type3, NULL as type4, NULL as type5, NULL as attribute
        FROM pokemon
        WHERE id = $1
      `;
      
      const monsterResult = await pool.query(monsterQuery, [monsterId]);
      
      if (monsterResult.rows.length === 0) {
        return false;
      }
      
      const monster = monsterResult.rows[0];
      const monsterTypes = [monster.type1, monster.type2, monster.type3, monster.type4, monster.type5].filter(Boolean);
      
      // Check type requirements
      let typeMatch = false;
      if (requirements.type_requirements && requirements.type_requirements.length > 0) {
        typeMatch = monsterTypes.some(type => requirements.type_requirements.includes(type));
      } else {
        typeMatch = true; // No type requirements
      }
      
      // Check attribute requirements
      let attributeMatch = false;
      if (requirements.attribute_requirements && requirements.attribute_requirements.length > 0) {
        attributeMatch = monster.attribute && requirements.attribute_requirements.includes(monster.attribute);
      } else {
        attributeMatch = true; // No attribute requirements
      }
      
      // Determine if monster meets requirements based on requirements_type
      if (requirements.requirements_type === 'AND') {
        return typeMatch && attributeMatch;
      } else {
        return typeMatch || attributeMatch;
      }
    } catch (error) {
      console.error(`Error checking monster eligibility for mission ${missionId}:`, error);
      return false;
    }
  }

  /**
   * Get a detailed view of a player mission
   * @param {number} missionId - Player mission ID
   * @returns {Promise<Object|null>} - Mission with template details or null if not found
   */
  static async getMissionWithDetails(missionId) {
    try {
      const query = `
        SELECT pm.*, 
          mt.name, mt.description, 
          mt.progress_flavor_1, mt.progress_flavor_2, mt.progress_flavor_3, 
          mt.progress_flavor_4, mt.progress_flavor_5, mt.completion_message,
          mt.completion_image_url, mt.progress_image_url,
          mt.level_rewards, mt.coin_rewards, mt.item_rewards, mt.item_reward_amount,
          mt.type_requirements, mt.attribute_requirements, mt.requirements_type
        FROM player_missions pm
        JOIN mission_templates mt ON pm.template_id = mt.id
        WHERE pm.id = $1
      `;
      
      const result = await pool.query(query, [missionId]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error(`Error getting mission details ${missionId}:`, error);
      return null;
    }
  }

  /**
   * Get progress flavor text based on mission progress percentage
   * @param {Object} mission - Mission object with details
   * @returns {string} - Appropriate flavor text for current progress
   */
  static getProgressText(mission) {
    if (!mission) return '';
    
    const progressPercent = Math.floor((mission.current_progress / mission.target_progress) * 100);
    
    if (progressPercent >= 100) {
      return mission.completion_message || 'Mission complete!';
    } else if (progressPercent >= 80 && mission.progress_flavor_5) {
      return mission.progress_flavor_5;
    } else if (progressPercent >= 60 && mission.progress_flavor_4) {
      return mission.progress_flavor_4;
    } else if (progressPercent >= 40 && mission.progress_flavor_3) {
      return mission.progress_flavor_3;
    } else if (progressPercent >= 20 && mission.progress_flavor_2) {
      return mission.progress_flavor_2;
    } else if (mission.progress_flavor_1) {
      return mission.progress_flavor_1;
    }
    
    return `Progress: ${progressPercent}%`;
  }
}

module.exports = PlayerMission;