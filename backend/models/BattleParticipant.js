const db = require('../config/db');

/**
 * BattleParticipant model for managing battle participants
 */
class BattleParticipant {
  /**
   * Create a new battle participant
   * @param {Object} participantData - Participant data
   * @returns {Promise<Object>} Created participant
   */
  static async create(participantData) {
    try {
      const {
        battle_id,
        participant_type,
        discord_user_id,
        trainer_id,
        trainer_name,
        team_side,
        turn_order = 0
      } = participantData;

      const query = `
        INSERT INTO battle_participants (
          battle_id, participant_type, discord_user_id, 
          trainer_id, trainer_name, team_side, turn_order
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `;

      const params = [
        battle_id,
        participant_type,
        discord_user_id,
        trainer_id,
        trainer_name,
        team_side,
        turn_order
      ];

      const result = await db.asyncRun(query, params);
      const participantId = result.rows ? result.rows[0].id : result.lastID;

      return this.getById(participantId);
    } catch (error) {
      console.error('Error creating battle participant:', error);
      throw error;
    }
  }

  /**
   * Get participant by ID
   * @param {number} id - Participant ID
   * @returns {Promise<Object|null>} Participant or null
   */
  static async getById(id) {
    try {
      const query = `
        SELECT 
          bp.*,
          t.name as trainer_full_name,
          t.main_ref as trainer_image
        FROM battle_participants bp
        LEFT JOIN trainers t ON bp.trainer_id = t.id
        WHERE bp.id = $1
      `;

      const participant = await db.asyncGet(query, [id]);
      return participant;
    } catch (error) {
      console.error(`Error getting battle participant ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get participants by battle ID
   * @param {number} battleId - Battle ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of participants
   */
  static async getByBattle(battleId, options = {}) {
    try {
      const { teamSide = null, isActive = null } = options;

      let query = `
        SELECT 
          bp.*,
          t.name as trainer_full_name,
          t.main_ref as trainer_image
        FROM battle_participants bp
        LEFT JOIN trainers t ON bp.trainer_id = t.id
        WHERE bp.battle_id = $1
      `;
      const params = [battleId];

      if (teamSide) {
        query += ` AND bp.team_side = $${params.length + 1}`;
        params.push(teamSide);
      }

      if (isActive !== null) {
        query += ` AND bp.is_active = $${params.length + 1}`;
        params.push(isActive);
      }

      query += ' ORDER BY bp.turn_order, bp.created_at';

      const participants = await db.asyncAll(query, params);
      return participants;
    } catch (error) {
      console.error(`Error getting participants for battle ${battleId}:`, error);
      throw error;
    }
  }

  /**
   * Get participant by battle and discord user
   * @param {number} battleId - Battle ID
   * @param {string} discordUserId - Discord user ID
   * @returns {Promise<Object|null>} Participant or null
   */
  static async getByBattleAndUser(battleId, discordUserId) {
    try {
      const query = `
        SELECT 
          bp.*,
          t.name as trainer_full_name,
          t.main_ref as trainer_image
        FROM battle_participants bp
        LEFT JOIN trainers t ON bp.trainer_id = t.id
        WHERE bp.battle_id = $1 AND bp.discord_user_id = $2
      `;

      const participant = await db.asyncGet(query, [battleId, discordUserId]);
      return participant;
    } catch (error) {
      console.error(`Error getting participant for battle ${battleId} and user ${discordUserId}:`, error);
      throw error;
    }
  }

  /**
   * Update participant
   * @param {number} id - Participant ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|null>} Updated participant
   */
  static async update(id, updateData) {
    try {
      const allowedFields = [
        'is_active', 'turn_order', 'message_count', 'word_count', 'trainer_id', 'trainer_name'
      ];
      
      const updates = [];
      const params = [];

      Object.keys(updateData).forEach((key, index) => {
        if (allowedFields.includes(key)) {
          updates.push(`${key} = $${index + 1}`);
          params.push(updateData[key]);
        }
      });

      if (updates.length === 0) {
        throw new Error('No valid fields to update');
      }

      params.push(id);

      const query = `
        UPDATE battle_participants 
        SET ${updates.join(', ')}
        WHERE id = $${params.length}
      `;

      await db.asyncRun(query, params);
      return this.getById(id);
    } catch (error) {
      console.error(`Error updating battle participant ${id}:`, error);
      throw error;
    }
  }

  /**
   * Add message to participant's count
   * @param {number} id - Participant ID
   * @param {number} wordCount - Word count to add
   * @returns {Promise<Object|null>} Updated participant
   */
  static async addMessage(id, wordCount = 0) {
    try {
      const participant = await this.getById(id);
      if (!participant) {
        throw new Error(`Participant ${id} not found`);
      }

      const updateData = {
        message_count: (participant.message_count || 0) + 1,
        word_count: (participant.word_count || 0) + wordCount
      };

      return this.update(id, updateData);
    } catch (error) {
      console.error(`Error adding message to participant ${id}:`, error);
      throw error;
    }
  }

  /**
   * Set participant as inactive
   * @param {number} id - Participant ID
   * @returns {Promise<Object|null>} Updated participant
   */
  static async setInactive(id) {
    try {
      return this.update(id, { is_active: false });
    } catch (error) {
      console.error(`Error setting participant ${id} as inactive:`, error);
      throw error;
    }
  }

  /**
   * Get active participants by battle
   * @param {number} battleId - Battle ID
   * @returns {Promise<Array>} Array of active participants
   */
  static async getActiveByBattle(battleId) {
    try {
      return this.getByBattle(battleId, { isActive: true });
    } catch (error) {
      console.error(`Error getting active participants for battle ${battleId}:`, error);
      throw error;
    }
  }

  /**
   * Get participants by team side
   * @param {number} battleId - Battle ID
   * @param {string} teamSide - Team side ('players' or 'opponents')
   * @returns {Promise<Array>} Array of participants
   */
  static async getByTeamSide(battleId, teamSide) {
    try {
      return this.getByBattle(battleId, { teamSide });
    } catch (error) {
      console.error(`Error getting ${teamSide} participants for battle ${battleId}:`, error);
      throw error;
    }
  }

  /**
   * Get next participant in turn order
   * @param {number} battleId - Battle ID
   * @param {number} currentIndex - Current participant index
   * @returns {Promise<Object|null>} Next participant or null
   */
  static async getNextInTurnOrder(battleId, currentIndex) {
    try {
      const participants = await this.getActiveByBattle(battleId);
      
      if (participants.length === 0) {
        return null;
      }

      // Find next participant in turn order
      const nextIndex = (currentIndex + 1) % participants.length;
      return participants[nextIndex] || null;
    } catch (error) {
      console.error(`Error getting next participant for battle ${battleId}:`, error);
      throw error;
    }
  }

  /**
   * Delete participant
   * @param {number} id - Participant ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    try {
      const query = 'DELETE FROM battle_participants WHERE id = $1';
      await db.asyncRun(query, [id]);
      return true;
    } catch (error) {
      console.error(`Error deleting battle participant ${id}:`, error);
      throw error;
    }
  }
}

module.exports = BattleParticipant;
