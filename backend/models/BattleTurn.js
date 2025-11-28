const db = require('../config/db');

/**
 * BattleTurn model for managing battle turns and actions
 */
class BattleTurn {
  /**
   * Create a new battle turn
   * @param {Object} turnData - Turn data
   * @returns {Promise<Object>} Created battle turn
   */
  static async create(turnData) {
    try {
      const {
        battle_id,
        turn_number,
        participant_id,
        monster_id,
        action_type,
        action_data,
        result_data = {},
        damage_dealt = 0,
        message_content = '',
        word_count = 0
      } = turnData;

      const query = `
        INSERT INTO battle_turns (
          battle_id, turn_number, participant_id, monster_id,
          action_type, action_data, result_data, damage_dealt,
          message_content, word_count
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `;

      // Ensure JSON fields are properly serialized
      let actionDataJson;
      try {
        actionDataJson = typeof action_data === 'string' ? action_data : JSON.stringify(action_data);
      } catch (e) {
        console.error('Error stringifying action_data:', e);
        console.error('action_data value:', action_data);
        actionDataJson = '{}';
      }

      let resultDataJson;
      try {
        resultDataJson = typeof result_data === 'string' ? result_data : JSON.stringify(result_data);
      } catch (e) {
        console.error('Error stringifying result_data:', e);
        console.error('result_data value:', result_data);
        resultDataJson = '{}';
      }

      const params = [
        battle_id,
        turn_number,
        participant_id,
        monster_id,
        action_type,
        actionDataJson,
        resultDataJson,
        damage_dealt,
        message_content,
        word_count
      ];

      const result = await db.asyncRun(query, params);
      const turnId = result.rows ? result.rows[0].id : result.lastID;

      return this.getById(turnId);
    } catch (error) {
      console.error('Error creating battle turn:', error);
      throw error;
    }
  }

  /**
   * Get battle turn by ID
   * @param {number} id - Turn ID
   * @returns {Promise<Object|null>} Battle turn or null
   */
  static async getById(id) {
    try {
      const query = `
        SELECT 
          bt.*,
          bp.trainer_name,
          bp.team_side,
          bm.monster_data
        FROM battle_turns bt
        LEFT JOIN battle_participants bp ON bt.participant_id = bp.id
        LEFT JOIN battle_monsters bm ON bt.monster_id = bm.id
        WHERE bt.id = $1
      `;

      const turn = await db.asyncGet(query, [id]);
      
      if (turn) {
        // Parse JSON fields
        if (turn.action_data) {
          try {
            if (typeof turn.action_data === 'object') {
              turn.action_data = turn.action_data;
            } else if (typeof turn.action_data === 'string') {
              if (turn.action_data === '[object Object]' || turn.action_data.includes('[object Object]')) {
                console.warn('Corrupted action_data detected, setting to empty object');
                turn.action_data = {};
              } else {
                turn.action_data = JSON.parse(turn.action_data);
              }
            } else {
              turn.action_data = {};
            }
          } catch (e) {
            console.error('Error parsing action_data:', e);
            console.error('action_data value:', turn.action_data);
            turn.action_data = {};
          }
        }

        if (turn.result_data) {
          try {
            if (typeof turn.result_data === 'object') {
              turn.result_data = turn.result_data;
            } else if (typeof turn.result_data === 'string') {
              if (turn.result_data === '[object Object]' || turn.result_data.includes('[object Object]')) {
                console.warn('Corrupted result_data detected, setting to empty object');
                turn.result_data = {};
              } else {
                turn.result_data = JSON.parse(turn.result_data);
              }
            } else {
              turn.result_data = {};
            }
          } catch (e) {
            console.error('Error parsing result_data:', e);
            console.error('result_data value:', turn.result_data);
            turn.result_data = {};
          }
        }

        if (turn.monster_data) {
          try {
            if (typeof turn.monster_data === 'object') {
              turn.monster_data = turn.monster_data;
            } else if (typeof turn.monster_data === 'string') {
              if (turn.monster_data === '[object Object]' || turn.monster_data.includes('[object Object]')) {
                console.warn('Corrupted monster_data detected, setting to empty object');
                turn.monster_data = {};
              } else {
                turn.monster_data = JSON.parse(turn.monster_data);
              }
            } else {
              turn.monster_data = {};
            }
          } catch (e) {
            console.error('Error parsing monster_data:', e);
            console.error('monster_data value:', turn.monster_data);
            turn.monster_data = {};
          }
        }
      }

      return turn;
    } catch (error) {
      console.error(`Error getting battle turn ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get battle turns by battle ID
   * @param {number} battleId - Battle ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of battle turns
   */
  static async getByBattle(battleId, options = {}) {
    try {
      const { 
        turnNumber = null, 
        participantId = null, 
        actionType = null,
        limit = null,
        offset = 0
      } = options;

      let query = `
        SELECT 
          bt.*,
          bp.trainer_name,
          bp.team_side,
          bm.monster_data
        FROM battle_turns bt
        LEFT JOIN battle_participants bp ON bt.participant_id = bp.id
        LEFT JOIN battle_monsters bm ON bt.monster_id = bm.id
        WHERE bt.battle_id = $1
      `;
      const params = [battleId];

      if (turnNumber !== null) {
        query += ` AND bt.turn_number = $${params.length + 1}`;
        params.push(turnNumber);
      }

      if (participantId) {
        query += ` AND bt.participant_id = $${params.length + 1}`;
        params.push(participantId);
      }

      if (actionType) {
        query += ` AND bt.action_type = $${params.length + 1}`;
        params.push(actionType);
      }

      query += ' ORDER BY bt.turn_number, bt.created_at';

      if (limit) {
        query += ` LIMIT $${params.length + 1}`;
        params.push(limit);
        
        if (offset > 0) {
          query += ` OFFSET $${params.length + 1}`;
          params.push(offset);
        }
      }

      const turns = await db.asyncAll(query, params);
      
      // Parse JSON fields for each turn
      turns.forEach(turn => {
        this.parseJsonFields(turn);
      });

      return turns;
    } catch (error) {
      console.error(`Error getting battle turns for battle ${battleId}:`, error);
      throw error;
    }
  }

  /**
   * Get latest turn for battle
   * @param {number} battleId - Battle ID
   * @returns {Promise<Object|null>} Latest battle turn or null
   */
  static async getLatestByBattle(battleId) {
    try {
      const query = `
        SELECT 
          bt.*,
          bp.trainer_name,
          bp.team_side,
          bm.monster_data
        FROM battle_turns bt
        LEFT JOIN battle_participants bp ON bt.participant_id = bp.id
        LEFT JOIN battle_monsters bm ON bt.monster_id = bm.id
        WHERE bt.battle_id = $1
        ORDER BY bt.turn_number DESC, bt.created_at DESC
        LIMIT 1
      `;

      const turn = await db.asyncGet(query, [battleId]);
      
      if (turn) {
        // Parse JSON fields
        this.parseJsonFields(turn);
      }

      return turn;
    } catch (error) {
      console.error(`Error getting latest battle turn for battle ${battleId}:`, error);
      throw error;
    }
  }

  /**
   * Get turns by participant
   * @param {number} participantId - Participant ID
   * @returns {Promise<Array>} Array of battle turns
   */
  static async getByParticipant(participantId) {
    try {
      const query = `
        SELECT 
          bt.*,
          bp.trainer_name,
          bp.team_side,
          bm.monster_data
        FROM battle_turns bt
        LEFT JOIN battle_participants bp ON bt.participant_id = bp.id
        LEFT JOIN battle_monsters bm ON bt.monster_id = bm.id
        WHERE bt.participant_id = $1
        ORDER BY bt.turn_number, bt.created_at
      `;

      const turns = await db.asyncAll(query, [participantId]);
      
      // Parse JSON fields for each turn
      turns.forEach(turn => {
        this.parseJsonFields(turn);
      });

      return turns;
    } catch (error) {
      console.error(`Error getting battle turns for participant ${participantId}:`, error);
      throw error;
    }
  }

  /**
   * Update battle turn
   * @param {number} id - Turn ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|null>} Updated battle turn
   */
  static async update(id, updateData) {
    try {
      const allowedFields = [
        'result_data', 'damage_dealt', 'message_content', 'word_count'
      ];
      
      const updates = [];
      const params = [];

      Object.keys(updateData).forEach((key, index) => {
        if (allowedFields.includes(key)) {
          updates.push(`${key} = $${index + 1}`);
          
          // Handle JSON fields
          if (key === 'result_data' && typeof updateData[key] === 'object') {
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
        UPDATE battle_turns 
        SET ${updates.join(', ')}
        WHERE id = $${params.length}
      `;

      await db.asyncRun(query, params);
      return this.getById(id);
    } catch (error) {
      console.error(`Error updating battle turn ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get battle statistics
   * @param {number} battleId - Battle ID
   * @returns {Promise<Object>} Battle statistics
   */
  static async getBattleStatistics(battleId) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_turns,
          COUNT(CASE WHEN action_type = 'attack' THEN 1 END) as attack_turns,
          COUNT(CASE WHEN action_type = 'item' THEN 1 END) as item_turns,
          COUNT(CASE WHEN action_type = 'switch' THEN 1 END) as switch_turns,
          SUM(damage_dealt) as total_damage,
          SUM(word_count) as total_words,
          AVG(word_count) as avg_words_per_turn
        FROM battle_turns
        WHERE battle_id = $1
      `;

      const stats = await db.asyncGet(query, [battleId]);
      return stats || {};
    } catch (error) {
      console.error(`Error getting battle statistics for battle ${battleId}:`, error);
      throw error;
    }
  }

  /**
   * Delete battle turn
   * @param {number} id - Turn ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    try {
      const query = 'DELETE FROM battle_turns WHERE id = $1';
      await db.asyncRun(query, [id]);
      return true;
    } catch (error) {
      console.error(`Error deleting battle turn ${id}:`, error);
      throw error;
    }
  }

  /**
   * Parse JSON fields for a turn object
   * @param {Object} turn - Turn object to parse
   */
  static parseJsonFields(turn) {
    // Parse action_data
    if (turn.action_data) {
      try {
        if (typeof turn.action_data === 'object') {
          turn.action_data = turn.action_data;
        } else if (typeof turn.action_data === 'string') {
          if (turn.action_data === '[object Object]' || turn.action_data.includes('[object Object]')) {
            console.warn('Corrupted action_data detected, setting to empty object');
            turn.action_data = {};
          } else {
            turn.action_data = JSON.parse(turn.action_data);
          }
        } else {
          turn.action_data = {};
        }
      } catch (e) {
        console.error('Error parsing action_data:', e);
        turn.action_data = {};
      }
    }

    // Parse result_data
    if (turn.result_data) {
      try {
        if (typeof turn.result_data === 'object') {
          turn.result_data = turn.result_data;
        } else if (typeof turn.result_data === 'string') {
          if (turn.result_data === '[object Object]' || turn.result_data.includes('[object Object]')) {
            console.warn('Corrupted result_data detected, setting to empty object');
            turn.result_data = {};
          } else {
            turn.result_data = JSON.parse(turn.result_data);
          }
        } else {
          turn.result_data = {};
        }
      } catch (e) {
        console.error('Error parsing result_data:', e);
        turn.result_data = {};
      }
    }

    // Parse monster_data
    if (turn.monster_data) {
      try {
        if (typeof turn.monster_data === 'object') {
          turn.monster_data = turn.monster_data;
        } else if (typeof turn.monster_data === 'string') {
          if (turn.monster_data === '[object Object]' || turn.monster_data.includes('[object Object]')) {
            console.warn('Corrupted monster_data detected, setting to empty object');
            turn.monster_data = {};
          } else {
            turn.monster_data = JSON.parse(turn.monster_data);
          }
        } else {
          turn.monster_data = {};
        }
      } catch (e) {
        console.error('Error parsing monster_data:', e);
        turn.monster_data = {};
      }
    }
  }
}

module.exports = BattleTurn;
