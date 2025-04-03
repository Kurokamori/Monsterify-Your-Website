const pool = require('../db');

class AdventureParticipant {
  /**
   * Create the adventure_participants table if it doesn't exist
   * @returns {Promise<void>}
   */
  static async createTableIfNotExists() {
    try {
      const query = `
        CREATE TABLE IF NOT EXISTS adventure_participants (
          participant_id SERIAL PRIMARY KEY,
          adventure_id INTEGER REFERENCES adventures(adventure_id),
          user_id VARCHAR(20) NOT NULL,
          message_count INTEGER DEFAULT 0,
          word_count INTEGER DEFAULT 0,
          levels_earned INTEGER DEFAULT 0,
          coins_earned INTEGER DEFAULT 0,
          claimed BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE (adventure_id, user_id)
        );
      `;

      await pool.query(query);
      console.log('Adventure participants table created or already exists');
    } catch (error) {
      console.error('Error creating adventure participants table:', error);
      throw error;
    }
  }

  /**
   * Get all participants for an adventure
   * @param {number} adventureId - Adventure ID
   * @returns {Promise<Array>} - Array of participant objects
   */
  static async getByAdventureId(adventureId) {
    try {
      const query = 'SELECT * FROM adventure_participants WHERE adventure_id = $1 ORDER BY word_count DESC';
      const result = await pool.query(query, [adventureId]);
      return result.rows;
    } catch (error) {
      console.error(`Error getting participants for adventure ${adventureId}:`, error);
      throw error;
    }
  }

  /**
   * Get a participant by adventure ID and user ID
   * @param {number} adventureId - Adventure ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} - Participant object or null if not found
   */
  static async getByAdventureAndUserId(adventureId, userId) {
    try {
      const query = 'SELECT * FROM adventure_participants WHERE adventure_id = $1 AND user_id = $2';
      const result = await pool.query(query, [adventureId, userId]);

      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error(`Error getting participant for adventure ${adventureId} and user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Create or update a participant
   * @param {number} adventureId - Adventure ID
   * @param {string} userId - User ID
   * @param {number} messageCount - Number of messages to add
   * @param {number} wordCount - Number of words to add
   * @returns {Promise<Object>} - Updated participant
   */
  static async addParticipation(adventureId, userId, messageCount = 1, wordCount = 0) {
    try {
      // Check if participant already exists
      const existingParticipant = await this.getByAdventureAndUserId(adventureId, userId);

      if (existingParticipant) {
        // Update existing participant
        const query = `
          UPDATE adventure_participants
          SET message_count = message_count + $1, word_count = word_count + $2
          WHERE adventure_id = $3 AND user_id = $4
          RETURNING *
        `;

        const result = await pool.query(query, [messageCount, wordCount, adventureId, userId]);
        return result.rows[0];
      } else {
        // Create new participant
        const query = `
          INSERT INTO adventure_participants (adventure_id, user_id, message_count, word_count)
          VALUES ($1, $2, $3, $4)
          RETURNING *
        `;

        const result = await pool.query(query, [adventureId, userId, messageCount, wordCount]);
        return result.rows[0];
      }
    } catch (error) {
      console.error(`Error adding participation for adventure ${adventureId} and user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Calculate and update rewards for all participants in an adventure
   * @param {number} adventureId - Adventure ID
   * @returns {Promise<Array>} - Array of updated participant objects
   */
  static async calculateRewards(adventureId) {
    try {
      // Get all participants
      const participants = await this.getByAdventureId(adventureId);

      // Calculate rewards for each participant
      const updatedParticipants = [];

      for (const participant of participants) {
        // Calculate levels (1 level per 50 words, rounded up)
        const levelsEarned = Math.ceil(participant.word_count / 50);

        // Calculate coins (1 coin per word)
        const coinsEarned = participant.word_count;

        // Update participant with rewards
        const query = `
          UPDATE adventure_participants
          SET levels_earned = $1, coins_earned = $2
          WHERE participant_id = $3
          RETURNING *
        `;

        const result = await pool.query(query, [levelsEarned, coinsEarned, participant.participant_id]);
        updatedParticipants.push(result.rows[0]);
      }

      return updatedParticipants;
    } catch (error) {
      console.error(`Error calculating rewards for adventure ${adventureId}:`, error);
      throw error;
    }
  }

  /**
   * Get a participant by ID
   * @param {number} participantId - Participant ID
   * @returns {Promise<Object|null>} - Participant object or null if not found
   */
  static async getById(participantId) {
    try {
      const query = 'SELECT * FROM adventure_participants WHERE participant_id = $1';
      const result = await pool.query(query, [participantId]);

      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error(`Error getting participant ${participantId}:`, error);
      throw error;
    }
  }

  /**
   * Mark a participant as claimed
   * @param {number} participantId - Participant ID
   * @returns {Promise<Object|null>} - Updated participant or null if not found
   */
  static async markAsClaimed(participantId) {
    try {
      const query = 'UPDATE adventure_participants SET claimed = TRUE WHERE participant_id = $1 RETURNING *';
      const result = await pool.query(query, [participantId]);

      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error(`Error marking participant ${participantId} as claimed:`, error);
      throw error;
    }
  }

  /**
   * Delete all participants for an adventure
   * @param {number} adventureId - Adventure ID
   * @returns {Promise<boolean>} - Success status
   */
  static async deleteByAdventureId(adventureId) {
    try {
      const query = 'DELETE FROM adventure_participants WHERE adventure_id = $1 RETURNING *';
      const result = await pool.query(query, [adventureId]);

      return result.rows.length > 0;
    } catch (error) {
      console.error(`Error deleting participants for adventure ${adventureId}:`, error);
      throw error;
    }
  }
}

module.exports = AdventureParticipant;
