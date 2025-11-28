const db = require('../config/db');

/**
 * BattleLog model for managing battle logs and messages
 */
class BattleLog {
  /**
   * Create a new battle log entry
   * @param {Object} logData - Log data
   * @returns {Promise<Object>} Created battle log
   */
  static async create(logData) {
    try {
      const {
        battle_id,
        log_type,
        message,
        participant_id = null,
        turn_number = null,
        log_data = {}
      } = logData;

      const query = `
        INSERT INTO battle_logs (
          battle_id, log_type, message, participant_id, 
          turn_number, log_data
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `;

      // Ensure log_data is properly serialized
      let logDataJson;
      try {
        logDataJson = typeof log_data === 'string' ? log_data : JSON.stringify(log_data);
      } catch (e) {
        console.error('Error stringifying log_data:', e);
        console.error('log_data value:', log_data);
        logDataJson = '{}';
      }

      const params = [
        battle_id,
        log_type,
        message,
        participant_id,
        turn_number,
        logDataJson
      ];

      const result = await db.asyncRun(query, params);
      const logId = result.rows ? result.rows[0].id : result.lastID;

      return this.getById(logId);
    } catch (error) {
      console.error('Error creating battle log:', error);
      throw error;
    }
  }

  /**
   * Get battle log by ID
   * @param {number} id - Log ID
   * @returns {Promise<Object|null>} Battle log or null
   */
  static async getById(id) {
    try {
      const query = `
        SELECT 
          bl.*,
          bp.trainer_name,
          bp.team_side
        FROM battle_logs bl
        LEFT JOIN battle_participants bp ON bl.participant_id = bp.id
        WHERE bl.id = $1
      `;

      const log = await db.asyncGet(query, [id]);
      
      if (log && log.log_data) {
        try {
          if (typeof log.log_data === 'string') {
            log.log_data = JSON.parse(log.log_data);
          }
        } catch (e) {
          console.error('Error parsing log_data:', e);
          console.error('log_data value:', log.log_data);
          log.log_data = {};
        }
      }

      return log;
    } catch (error) {
      console.error(`Error getting battle log ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get battle logs by battle ID
   * @param {number} battleId - Battle ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of battle logs
   */
  static async getByBattle(battleId, options = {}) {
    try {
      const { 
        logType = null, 
        participantId = null,
        turnNumber = null,
        limit = 100,
        offset = 0,
        orderBy = 'created_at'
      } = options;

      let query = `
        SELECT 
          bl.*,
          bp.trainer_name,
          bp.team_side
        FROM battle_logs bl
        LEFT JOIN battle_participants bp ON bl.participant_id = bp.id
        WHERE bl.battle_id = $1
      `;
      const params = [battleId];

      if (logType) {
        query += ` AND bl.log_type = $${params.length + 1}`;
        params.push(logType);
      }

      if (participantId) {
        query += ` AND bl.participant_id = $${params.length + 1}`;
        params.push(participantId);
      }

      if (turnNumber !== null) {
        query += ` AND bl.turn_number = $${params.length + 1}`;
        params.push(turnNumber);
      }

      query += ` ORDER BY bl.${orderBy}`;

      if (limit) {
        query += ` LIMIT $${params.length + 1}`;
        params.push(limit);
        
        if (offset > 0) {
          query += ` OFFSET $${params.length + 1}`;
          params.push(offset);
        }
      }

      const logs = await db.asyncAll(query, params);
      
      // Parse JSON fields for each log
      logs.forEach(log => {
        if (log.log_data) {
          try {
            // Check if it's already an object
            if (typeof log.log_data === 'object') {
              log.log_data = log.log_data;
            } else if (typeof log.log_data === 'string') {
              // Check for corrupted "[object Object]" strings
              if (log.log_data === '[object Object]' || log.log_data.includes('[object Object]')) {
                console.warn('Corrupted log_data detected, setting to empty object');
                log.log_data = {};
              } else {
                log.log_data = JSON.parse(log.log_data);
              }
            } else {
              log.log_data = {};
            }
          } catch (e) {
            console.error('Error parsing log_data:', e);
            console.error('log_data value:', log.log_data);
            log.log_data = {};
          }
        }
      });

      return logs;
    } catch (error) {
      console.error(`Error getting battle logs for battle ${battleId}:`, error);
      throw error;
    }
  }

  /**
   * Log action
   * @param {number} battleId - Battle ID
   * @param {string} message - Log message
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Created log
   */
  static async logAction(battleId, message, options = {}) {
    try {
      const logData = {
        battle_id: battleId,
        log_type: 'action',
        message,
        ...options
      };

      return this.create(logData);
    } catch (error) {
      console.error('Error logging action:', error);
      throw error;
    }
  }

  /**
   * Log damage
   * @param {number} battleId - Battle ID
   * @param {string} message - Log message
   * @param {Object} damageData - Damage data
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Created log
   */
  static async logDamage(battleId, message, damageData, options = {}) {
    try {
      const logData = {
        battle_id: battleId,
        log_type: 'damage',
        message,
        log_data: damageData,
        ...options
      };

      return this.create(logData);
    } catch (error) {
      console.error('Error logging damage:', error);
      throw error;
    }
  }

  /**
   * Log status effect
   * @param {number} battleId - Battle ID
   * @param {string} message - Log message
   * @param {Object} statusData - Status effect data
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Created log
   */
  static async logStatus(battleId, message, statusData, options = {}) {
    try {
      const logData = {
        battle_id: battleId,
        log_type: 'status',
        message,
        log_data: statusData,
        ...options
      };

      return this.create(logData);
    } catch (error) {
      console.error('Error logging status:', error);
      throw error;
    }
  }

  /**
   * Log system message
   * @param {number} battleId - Battle ID
   * @param {string} message - Log message
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Created log
   */
  static async logSystem(battleId, message, options = {}) {
    try {
      const logData = {
        battle_id: battleId,
        log_type: 'system',
        message,
        ...options
      };

      return this.create(logData);
    } catch (error) {
      console.error('Error logging system message:', error);
      throw error;
    }
  }

  /**
   * Log user message
   * @param {number} battleId - Battle ID
   * @param {string} message - Log message
   * @param {number} participantId - Participant ID
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Created log
   */
  static async logMessage(battleId, message, participantId, options = {}) {
    try {
      const logData = {
        battle_id: battleId,
        log_type: 'message',
        message,
        participant_id: participantId,
        ...options
      };

      return this.create(logData);
    } catch (error) {
      console.error('Error logging user message:', error);
      throw error;
    }
  }

  /**
   * Get recent logs for battle
   * @param {number} battleId - Battle ID
   * @param {number} limit - Number of logs to retrieve
   * @returns {Promise<Array>} Array of recent battle logs
   */
  static async getRecent(battleId, limit = 20) {
    try {
      return this.getByBattle(battleId, { 
        limit, 
        orderBy: 'created_at DESC' 
      });
    } catch (error) {
      console.error(`Error getting recent battle logs for battle ${battleId}:`, error);
      throw error;
    }
  }

  /**
   * Get logs by turn
   * @param {number} battleId - Battle ID
   * @param {number} turnNumber - Turn number
   * @returns {Promise<Array>} Array of logs for the turn
   */
  static async getByTurn(battleId, turnNumber) {
    try {
      return this.getByBattle(battleId, { 
        turnNumber,
        orderBy: 'created_at'
      });
    } catch (error) {
      console.error(`Error getting battle logs for turn ${turnNumber} in battle ${battleId}:`, error);
      throw error;
    }
  }

  /**
   * Get logs by participant
   * @param {number} battleId - Battle ID
   * @param {number} participantId - Participant ID
   * @returns {Promise<Array>} Array of logs for the participant
   */
  static async getByParticipant(battleId, participantId) {
    try {
      return this.getByBattle(battleId, { 
        participantId,
        orderBy: 'created_at'
      });
    } catch (error) {
      console.error(`Error getting battle logs for participant ${participantId} in battle ${battleId}:`, error);
      throw error;
    }
  }

  /**
   * Clear old logs for battle
   * @param {number} battleId - Battle ID
   * @param {number} keepCount - Number of recent logs to keep
   * @returns {Promise<number>} Number of deleted logs
   */
  static async clearOldLogs(battleId, keepCount = 100) {
    try {
      const query = `
        DELETE FROM battle_logs 
        WHERE battle_id = $1 
        AND id NOT IN (
          SELECT id FROM battle_logs 
          WHERE battle_id = $1 
          ORDER BY created_at DESC 
          LIMIT $2
        )
      `;

      const result = await db.asyncRun(query, [battleId, keepCount]);
      return result.changes || 0;
    } catch (error) {
      console.error(`Error clearing old battle logs for battle ${battleId}:`, error);
      throw error;
    }
  }

  /**
   * Delete battle log
   * @param {number} id - Log ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    try {
      const query = 'DELETE FROM battle_logs WHERE id = $1';
      await db.asyncRun(query, [id]);
      return true;
    } catch (error) {
      console.error(`Error deleting battle log ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete all logs for battle
   * @param {number} battleId - Battle ID
   * @returns {Promise<number>} Number of deleted logs
   */
  static async deleteByBattle(battleId) {
    try {
      const query = 'DELETE FROM battle_logs WHERE battle_id = $1';
      const result = await db.asyncRun(query, [battleId]);
      return result.changes || 0;
    } catch (error) {
      console.error(`Error deleting battle logs for battle ${battleId}:`, error);
      throw error;
    }
  }
}

module.exports = BattleLog;
