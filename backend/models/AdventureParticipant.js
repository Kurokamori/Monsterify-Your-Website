const db = require('../config/db');

/**
 * AdventureParticipant model for managing adventure participation data
 */
class AdventureParticipant {
  /**
   * Add or update participant in an adventure
   * @param {Object} participantData - Participant data
   * @returns {Promise<Object>} Participant record
   */
  static async addOrUpdate(participantData) {
    try {
      const {
        adventure_id,
        discord_user_id,
        word_count = 0,
        message_count = 0
      } = participantData;

      // Get user_id from discord_user_id
      const user_id = await this.getUserIdFromDiscordId(discord_user_id);

      // Check if participant already exists
      const existing = await this.getByAdventureAndDiscordUser(adventure_id, discord_user_id);

      if (existing) {
        // Update existing participant
        return this.updateWordCount(existing.id, word_count, message_count);
      } else {
        // Create new participant
        const params = [adventure_id, discord_user_id, user_id, word_count, message_count];

        const query = `
          INSERT INTO adventure_participants (adventure_id, discord_user_id, user_id, word_count, message_count)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id
        `;
        const result = await db.asyncRun(query, params);
        const participantId = result.rows[0].id;

        return this.getById(participantId);
      }

    } catch (error) {
      console.error('Error adding/updating adventure participant:', error);
      throw error;
    }
  }

  /**
   * Update word count for a participant
   * @param {number} participantId - Participant ID
   * @param {number} additionalWords - Additional words to add
   * @param {number} additionalMessages - Additional messages to add
   * @returns {Promise<Object>} Updated participant
   */
  static async updateWordCount(participantId, additionalWords, additionalMessages = 1) {
    try {
      const query = `
        UPDATE adventure_participants 
        SET word_count = word_count + $1, 
            message_count = message_count + $2,
            last_message_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `;

      await db.asyncRun(query, [additionalWords, additionalMessages, participantId]);
      return this.getById(participantId);

    } catch (error) {
      console.error('Error updating participant word count:', error);
      throw error;
    }
  }

  /**
   * Get participant by ID
   * @param {number} id - Participant ID
   * @returns {Promise<Object|null>} Participant record or null
   */
  static async getById(id) {
    try {
      const query = `
        SELECT ap.*, u.username, a.title as adventure_title
        FROM adventure_participants ap
        LEFT JOIN users u ON ap.user_id = u.id
        LEFT JOIN adventures a ON ap.adventure_id = a.id
        WHERE ap.id = $1
      `;
      
      const participant = await db.asyncGet(query, [id]);
      return participant || null;

    } catch (error) {
      console.error('Error getting adventure participant by ID:', error);
      throw error;
    }
  }

  /**
   * Get participant by adventure and Discord user
   * @param {number} adventureId - Adventure ID
   * @param {string} discordUserId - Discord user ID
   * @returns {Promise<Object|null>} Participant record or null
   */
  static async getByAdventureAndDiscordUser(adventureId, discordUserId) {
    try {
      const query = `
        SELECT ap.*, u.username, a.title as adventure_title
        FROM adventure_participants ap
        LEFT JOIN users u ON ap.user_id = u.id
        LEFT JOIN adventures a ON ap.adventure_id = a.id
        WHERE ap.adventure_id = $1 AND ap.discord_user_id = $2
      `;
      
      const participant = await db.asyncGet(query, [adventureId, discordUserId]);
      return participant || null;

    } catch (error) {
      console.error('Error getting adventure participant by adventure and Discord user:', error);
      throw error;
    }
  }

  /**
   * Get all participants for an adventure
   * @param {number} adventureId - Adventure ID
   * @returns {Promise<Array>} Array of participants
   */
  static async getByAdventure(adventureId) {
    try {
      const query = `
        SELECT ap.*, u.username, a.title as adventure_title
        FROM adventure_participants ap
        LEFT JOIN users u ON ap.user_id = u.id
        LEFT JOIN adventures a ON ap.adventure_id = a.id
        WHERE ap.adventure_id = $1
        ORDER BY ap.word_count DESC
      `;
      
      const participants = await db.asyncAll(query, [adventureId]);
      return participants;

    } catch (error) {
      console.error('Error getting adventure participants by adventure:', error);
      throw error;
    }
  }

  /**
   * Get all adventures for a Discord user
   * @param {string} discordUserId - Discord user ID
   * @returns {Promise<Array>} Array of participant records
   */
  static async getByDiscordUser(discordUserId) {
    try {
      const query = `
        SELECT ap.*, u.username, a.title as adventure_title, a.status as adventure_status
        FROM adventure_participants ap
        LEFT JOIN users u ON ap.user_id = u.id
        LEFT JOIN adventures a ON ap.adventure_id = a.id
        WHERE ap.discord_user_id = $1
        ORDER BY ap.joined_at DESC
      `;
      
      const participants = await db.asyncAll(query, [discordUserId]);
      return participants;

    } catch (error) {
      console.error('Error getting adventure participants by Discord user:', error);
      throw error;
    }
  }

  /**
   * Update participant's linked user ID
   * @param {number} participantId - Participant ID
   * @param {number} userId - User ID to link
   * @returns {Promise<Object>} Updated participant
   */
  static async linkUser(participantId, userId) {
    try {
      const query = `
        UPDATE adventure_participants 
        SET user_id = $1
        WHERE id = $2
      `;

      await db.asyncRun(query, [userId, participantId]);
      return this.getById(participantId);

    } catch (error) {
      console.error('Error linking user to adventure participant:', error);
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
      const query = 'DELETE FROM adventure_participants WHERE id = $1';
      await db.asyncRun(query, [id]);
      return true;

    } catch (error) {
      console.error('Error deleting adventure participant:', error);
      throw error;
    }
  }

  /**
   * Get user ID from Discord user ID
   * @param {string} discordUserId - Discord user ID
   * @returns {Promise<number|null>} User ID or null
   */
  static async getUserIdFromDiscordId(discordUserId) {
    try {
      const query = `
        SELECT id FROM users WHERE discord_id = $1
      `;

      const user = await db.asyncGet(query, [discordUserId]);
      return user ? user.id : null;

    } catch (error) {
      console.error('Error getting user ID from Discord ID:', error);
      return null;
    }
  }

  /**
   * Track message for Discord user in adventure thread
   * @param {string} discordThreadId - Discord thread ID
   * @param {string} discordUserId - Discord user ID
   * @param {number} wordCount - Word count of message
   * @param {number} messageCount - Number of messages (usually 1)
   * @returns {Promise<Object>} Updated participant data
   */
  static async trackMessage(discordThreadId, discordUserId, wordCount, messageCount = 1) {
    try {
      // First get the adventure ID from the thread
      const AdventureThread = require('./AdventureThread');
      const thread = await AdventureThread.getByDiscordThreadId(discordThreadId);

      if (!thread) {
        throw new Error('Adventure thread not found');
      }

      // Add or update participant
      const participantData = {
        adventure_id: thread.adventure_id,
        discord_user_id: discordUserId,
        word_count: wordCount,
        message_count: messageCount
      };

      return this.addOrUpdate(participantData);

    } catch (error) {
      console.error('Error tracking message for adventure participant:', error);
      throw error;
    }
  }
}

module.exports = AdventureParticipant;
