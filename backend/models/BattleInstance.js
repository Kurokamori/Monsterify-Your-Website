const db = require('../config/db');

/**
 * BattleInstance model for managing battle instances
 */
class BattleInstance {
  /**
   * Create a new battle instance
   * @param {Object} battleData - Battle data
   * @returns {Promise<Object>} Created battle instance
   */
  static async create(battleData) {
    try {
      const {
        adventure_id,
        encounter_id,
        battle_type,
        created_by_discord_user_id,
        battle_data = {}
      } = battleData;

      const query = `
        INSERT INTO battle_instances (
          adventure_id, encounter_id, battle_type, 
          created_by_discord_user_id, battle_data
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `;

      // Ensure battle_data is properly serialized
      let battleDataJson;
      try {
        battleDataJson = typeof battle_data === 'string' ? battle_data : JSON.stringify(battle_data);
      } catch (e) {
        console.error('Error stringifying battle_data:', e);
        console.error('battle_data value:', battle_data);
        battleDataJson = '{}';
      }

      const params = [
        adventure_id,
        encounter_id,
        battle_type,
        created_by_discord_user_id,
        battleDataJson
      ];

      const result = await db.asyncRun(query, params);
      const battleId = result.rows ? result.rows[0].id : result.lastID;

      return this.getById(battleId);
    } catch (error) {
      console.error('Error creating battle instance:', error);
      throw error;
    }
  }

  /**
   * Get battle instance by ID
   * @param {number} id - Battle ID
   * @returns {Promise<Object|null>} Battle instance or null
   */
  static async getById(id) {
    try {
      const query = `
        SELECT 
          bi.*,
          a.title as adventure_title,
          ae.encounter_type
        FROM battle_instances bi
        LEFT JOIN adventures a ON bi.adventure_id = a.id
        LEFT JOIN adventure_encounters ae ON bi.encounter_id = ae.id
        WHERE bi.id = $1
      `;

      const battle = await db.asyncGet(query, [id]);
      
      if (battle && battle.battle_data) {
        try {
          // Check if battle_data is already an object
          if (typeof battle.battle_data === 'string') {
            battle.battle_data = JSON.parse(battle.battle_data);
          }
        } catch (e) {
          console.error('Error parsing battle_data:', e);
          console.error('battle_data value:', battle.battle_data);
          battle.battle_data = {};
        }
      }

      return battle;
    } catch (error) {
      console.error(`Error getting battle instance ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get active battle by adventure ID
   * @param {number} adventureId - Adventure ID
   * @returns {Promise<Object|null>} Active battle or null
   */
  static async getActiveByAdventure(adventureId) {
    try {
      const query = `
        SELECT 
          bi.*,
          a.title as adventure_title,
          ae.encounter_type
        FROM battle_instances bi
        LEFT JOIN adventures a ON bi.adventure_id = a.id
        LEFT JOIN adventure_encounters ae ON bi.encounter_id = ae.id
        WHERE bi.adventure_id = $1 AND bi.status = 'active'
        ORDER BY bi.created_at DESC
        LIMIT 1
      `;

      const battle = await db.asyncGet(query, [adventureId]);
      
      if (battle && battle.battle_data) {
        try {
          // Check if battle_data is already an object
          if (typeof battle.battle_data === 'string') {
            battle.battle_data = JSON.parse(battle.battle_data);
          }
          // If it's already an object, keep it as is
        } catch (e) {
          console.error('Error parsing battle_data:', e);
          console.error('battle_data value:', battle.battle_data);
          console.error('battle_data type:', typeof battle.battle_data);
          battle.battle_data = {};
        }
      }

      return battle;
    } catch (error) {
      console.error(`Error getting active battle for adventure ${adventureId}:`, error);
      throw error;
    }
  }

  /**
   * Get active battle by encounter ID
   * @param {number} encounterId - Encounter ID
   * @returns {Promise<Object|null>} Active battle or null
   */
  static async getActiveByEncounter(encounterId) {
    try {
      const query = `
        SELECT 
          bi.*,
          a.title as adventure_title,
          ae.encounter_type
        FROM battle_instances bi
        LEFT JOIN adventures a ON bi.adventure_id = a.id
        LEFT JOIN adventure_encounters ae ON bi.encounter_id = ae.id
        WHERE bi.encounter_id = $1 AND bi.status = 'active'
        ORDER BY bi.created_at DESC
        LIMIT 1
      `;

      const battle = await db.asyncGet(query, [encounterId]);
      
      if (battle && battle.battle_data) {
        try {
          // Check if battle_data is already an object
          if (typeof battle.battle_data === 'string') {
            battle.battle_data = JSON.parse(battle.battle_data);
          }
        } catch (e) {
          console.error('Error parsing battle_data:', e);
          console.error('battle_data value:', battle.battle_data);
          battle.battle_data = {};
        }
      }

      return battle;
    } catch (error) {
      console.error(`Error getting active battle for encounter ${encounterId}:`, error);
      throw error;
    }
  }

  /**
   * Update battle instance
   * @param {number} id - Battle ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|null>} Updated battle instance
   */
  static async update(id, updateData) {
    try {
      const allowedFields = [
        'status', 'current_turn', 'current_participant_index', 
        'turn_time_limit', 'turn_started_at', 'winner_type', 
        'battle_data', 'completed_at'
      ];
      
      const updates = [];
      const params = [];

      Object.keys(updateData).forEach((key, index) => {
        if (allowedFields.includes(key)) {
          updates.push(`${key} = $${index + 1}`);
          
          // Handle JSON fields
          if (key === 'battle_data' && typeof updateData[key] === 'object') {
            params.push(JSON.stringify(updateData[key]));
          } else {
            params.push(updateData[key]);
          }
        }
      });

      if (updates.length === 0) {
        throw new Error('No valid fields to update');
      }

      params.push(id);

      const query = `
        UPDATE battle_instances
        SET ${updates.join(', ')}
        WHERE id = $${params.length}
      `;

      await db.asyncRun(query, params);
      return this.getById(id);
    } catch (error) {
      console.error(`Error updating battle instance ${id}:`, error);
      throw error;
    }
  }

  /**
   * Complete battle
   * @param {number} id - Battle ID
   * @param {string} winnerType - Winner type ('players', 'opponents', 'draw')
   * @returns {Promise<Object|null>} Updated battle instance
   */
  static async complete(id, winnerType) {
    try {
      const updateData = {
        status: 'completed',
        winner_type: winnerType,
        completed_at: new Date().toISOString()
      };

      return this.update(id, updateData);
    } catch (error) {
      console.error(`Error completing battle ${id}:`, error);
      throw error;
    }
  }

  /**
   * Cancel battle
   * @param {number} id - Battle ID
   * @returns {Promise<Object|null>} Updated battle instance
   */
  static async cancel(id) {
    try {
      const updateData = {
        status: 'cancelled',
        completed_at: new Date().toISOString()
      };

      return this.update(id, updateData);
    } catch (error) {
      console.error(`Error cancelling battle ${id}:`, error);
      throw error;
    }
  }

  /**
   * Start next turn
   * @param {number} id - Battle ID
   * @param {number} participantIndex - Next participant index
   * @returns {Promise<Object|null>} Updated battle instance
   */
  static async startNextTurn(id, participantIndex) {
    try {
      const battle = await this.getById(id);
      if (!battle) {
        throw new Error(`Battle ${id} not found`);
      }

      const updateData = {
        current_turn: battle.current_turn + 1,
        current_participant_index: participantIndex,
        turn_started_at: new Date().toISOString()
      };

      return this.update(id, updateData);
    } catch (error) {
      console.error(`Error starting next turn for battle ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get battles by status
   * @param {string} status - Battle status
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of battles
   */
  static async getByStatus(status, options = {}) {
    try {
      const { limit = 50, offset = 0 } = options;

      const query = `
        SELECT 
          bi.*,
          a.title as adventure_title,
          ae.encounter_type
        FROM battle_instances bi
        LEFT JOIN adventures a ON bi.adventure_id = a.id
        LEFT JOIN adventure_encounters ae ON bi.encounter_id = ae.id
        WHERE bi.status = $1
        ORDER BY bi.created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const battles = await db.asyncAll(query, [status, limit, offset]);
      
      // Parse battle_data for each battle
      battles.forEach(battle => {
        if (battle.battle_data) {
          try {
            // Check if battle_data is already an object
            if (typeof battle.battle_data === 'string') {
              battle.battle_data = JSON.parse(battle.battle_data);
            }
          } catch (e) {
            console.error('Error parsing battle_data:', e);
            console.error('battle_data value:', battle.battle_data);
            battle.battle_data = {};
          }
        }
      });

      return battles;
    } catch (error) {
      console.error(`Error getting battles by status ${status}:`, error);
      throw error;
    }
  }

  /**
   * Delete battle instance
   * @param {number} id - Battle ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    try {
      const query = 'DELETE FROM battle_instances WHERE id = $1';
      await db.asyncRun(query, [id]);
      return true;
    } catch (error) {
      console.error(`Error deleting battle instance ${id}:`, error);
      throw error;
    }
  }
}

module.exports = BattleInstance;
