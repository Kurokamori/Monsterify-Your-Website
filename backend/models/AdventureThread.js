const db = require('../config/db');

/**
 * AdventureThread model for managing Discord thread data
 */
class AdventureThread {
  /**
   * Create a new adventure thread record
   * @param {Object} threadData - Thread data
   * @returns {Promise<Object>} Created thread record
   */
  static async create(threadData) {
    try {
      const {
        adventure_id,
        discord_thread_id,
        discord_channel_id,
        thread_name
      } = threadData;

      const params = [adventure_id, discord_thread_id, discord_channel_id, thread_name];

      const query = `
        INSERT INTO adventure_threads (adventure_id, discord_thread_id, discord_channel_id, thread_name)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `;
      const result = await db.asyncRun(query, params);
      const threadId = result.rows[0].id;

      return this.getById(threadId);

    } catch (error) {
      console.error('Error creating adventure thread:', error);
      throw error;
    }
  }

  /**
   * Get thread by ID
   * @param {number} id - Thread ID
   * @returns {Promise<Object|null>} Thread record or null
   */
  static async getById(id) {
    try {
      const query = `
        SELECT at.*, a.title as adventure_title, a.status as adventure_status
        FROM adventure_threads at
        LEFT JOIN adventures a ON at.adventure_id = a.id
        WHERE at.id = $1
      `;
      
      const thread = await db.asyncGet(query, [id]);
      return thread || null;

    } catch (error) {
      console.error('Error getting adventure thread by ID:', error);
      throw error;
    }
  }

  /**
   * Get thread by Discord thread ID
   * @param {string} discordThreadId - Discord thread ID
   * @returns {Promise<Object|null>} Thread record or null
   */
  static async getByDiscordThreadId(discordThreadId) {
    try {
      const query = `
        SELECT at.*, a.title as adventure_title, a.status as adventure_status, a.encounter_count, a.max_encounters
        FROM adventure_threads at
        LEFT JOIN adventures a ON at.adventure_id = a.id
        WHERE at.discord_thread_id = $1
      `;
      
      const thread = await db.asyncGet(query, [discordThreadId]);
      return thread || null;

    } catch (error) {
      console.error('Error getting adventure thread by Discord ID:', error);
      throw error;
    }
  }

  /**
   * Get thread by adventure ID
   * @param {number} adventureId - Adventure ID
   * @returns {Promise<Object|null>} Thread record or null
   */
  static async getByAdventureId(adventureId) {
    try {
      const query = `
        SELECT * FROM adventure_threads
        WHERE adventure_id = $1
      `;
      
      const thread = await db.asyncGet(query, [adventureId]);
      return thread || null;

    } catch (error) {
      console.error('Error getting adventure thread by adventure ID:', error);
      throw error;
    }
  }

  /**
   * Update thread
   * @param {number} id - Thread ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|null>} Updated thread or null
   */
  static async update(id, updateData) {
    try {
      const allowedFields = ['thread_name', 'discord_channel_id'];
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
        UPDATE adventure_threads 
        SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${params.length}
      `;

      await db.asyncRun(query, params);
      return this.getById(id);

    } catch (error) {
      console.error('Error updating adventure thread:', error);
      throw error;
    }
  }

  /**
   * Delete thread
   * @param {number} id - Thread ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    try {
      const query = 'DELETE FROM adventure_threads WHERE id = $1';
      await db.asyncRun(query, [id]);
      return true;

    } catch (error) {
      console.error('Error deleting adventure thread:', error);
      throw error;
    }
  }

  /**
   * Delete thread by Discord thread ID
   * @param {string} discordThreadId - Discord thread ID
   * @returns {Promise<boolean>} Success status
   */
  static async deleteByDiscordThreadId(discordThreadId) {
    try {
      const query = 'DELETE FROM adventure_threads WHERE discord_thread_id = $1';
      await db.asyncRun(query, [discordThreadId]);
      return true;

    } catch (error) {
      console.error('Error deleting adventure thread by Discord ID:', error);
      throw error;
    }
  }
}

module.exports = AdventureThread;
