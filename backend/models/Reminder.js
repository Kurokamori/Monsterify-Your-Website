const db = require('../config/db');

/**
 * Reminder model for managing Discord reminders
 */
class Reminder {
  /**
   * Get all reminders for a user
   * @param {number} userId - User ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of reminders
   */
  static async getByUserId(userId, filters = {}) {
    try {
      let query = `
        SELECT r.*
        FROM reminders r
        WHERE r.user_id = $1
      `;
      const params = [userId];

      // Apply filters
      if (filters.item_type) {
        query += ' AND r.item_type = $' + (params.length + 1);
        params.push(filters.item_type);
      }

      if (filters.is_active !== undefined) {
        query += ' AND r.is_active = $' + (params.length + 1);
        params.push(filters.is_active);
      }

      query += ' ORDER BY r.created_at DESC';

      const reminders = await db.asyncAll(query, params);
      
      // Parse JSON fields
      return reminders.map(reminder => ({
        ...reminder,
        reminder_days: JSON.parse(reminder.reminder_days || '[]')
      }));
    } catch (error) {
      console.error('Error getting reminders by user ID:', error);
      throw error;
    }
  }

  /**
   * Get reminder by ID
   * @param {number} id - Reminder ID
   * @returns {Promise<Object|null>} Reminder object or null
   */
  static async getById(id) {
    try {
      const query = 'SELECT * FROM reminders WHERE id = $1';
      const reminder = await db.asyncGet(query, [id]);
      
      if (!reminder) return null;

      // Parse JSON fields
      return {
        ...reminder,
        reminder_days: JSON.parse(reminder.reminder_days || '[]')
      };
    } catch (error) {
      console.error('Error getting reminder by ID:', error);
      throw error;
    }
  }

  /**
   * Create a new reminder
   * @param {Object} reminderData - Reminder data
   * @returns {Promise<Object>} Created reminder
   */
  static async create(reminderData) {
    try {
      const {
        user_id,
        discord_id,
        item_type,
        item_id,
        title,
        reminder_time,
        reminder_days = [],
        is_active = 1
      } = reminderData;

      const query = `
        INSERT INTO reminders (
          user_id, discord_id, item_type, item_id, title,
          reminder_time, reminder_days, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;

      const params = [
        user_id,
        discord_id,
        item_type,
        item_id,
        title,
        reminder_time,
        JSON.stringify(reminder_days),
        is_active
      ];

      const result = await db.asyncRun(query, params);
      return await this.getById(result.lastID);
    } catch (error) {
      console.error('Error creating reminder:', error);
      throw error;
    }
  }

  /**
   * Update a reminder
   * @param {number} id - Reminder ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated reminder
   */
  static async update(id, updateData) {
    try {
      const fields = [];
      const params = [];

      // Build dynamic update query
      Object.keys(updateData).forEach(key => {
        if (key === 'reminder_days') {
          fields.push(`${key} = $${params.length + 1}`);
          params.push(JSON.stringify(updateData[key]));
        } else {
          fields.push(`${key} = $${params.length + 1}`);
          params.push(updateData[key]);
        }
      });

      fields.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);

      const query = `UPDATE reminders SET ${fields.join(', ')} WHERE id = $${params.length}`;
      await db.asyncRun(query, params);

      return await this.getById(id);
    } catch (error) {
      console.error('Error updating reminder:', error);
      throw error;
    }
  }

  /**
   * Delete a reminder
   * @param {number} id - Reminder ID
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id, userId) {
    try {
      const reminder = await this.getById(id);
      if (!reminder) {
        throw new Error('Reminder not found');
      }

      if (reminder.user_id !== userId) {
        throw new Error('Not authorized to delete this reminder');
      }

      const query = 'DELETE FROM reminders WHERE id = $1';
      await db.asyncRun(query, [id]);

      return true;
    } catch (error) {
      console.error('Error deleting reminder:', error);
      throw error;
    }
  }

  /**
   * Create or update reminder for an item
   * @param {Object} reminderData - Reminder data
   * @returns {Promise<Object>} Created or updated reminder
   */
  static async createOrUpdate(reminderData) {
    try {
      const { user_id, item_type, item_id } = reminderData;

      // Check if reminder already exists
      const existingQuery = `
        SELECT id FROM reminders 
        WHERE user_id = $1 AND item_type = $2 AND item_id = $3
      `;
      
      const existing = await db.asyncGet(existingQuery, [user_id, item_type, item_id]);

      if (existing) {
        return await this.update(existing.id, reminderData);
      } else {
        return await this.create(reminderData);
      }
    } catch (error) {
      console.error('Error creating or updating reminder:', error);
      throw error;
    }
  }

  /**
   * Get active reminders for sending
   * @returns {Promise<Array>} Array of active reminders
   */
  static async getActiveReminders() {
    try {
      const query = `
        SELECT r.*, u.discord_id as user_discord_id
        FROM reminders r
        JOIN users u ON r.user_id = u.id
        WHERE r.is_active = 1 AND u.discord_id IS NOT NULL
        ORDER BY r.reminder_time ASC
      `;
      
      const reminders = await db.asyncAll(query);
      
      return reminders.map(reminder => ({
        ...reminder,
        reminder_days: JSON.parse(reminder.reminder_days || '[]')
      }));
    } catch (error) {
      console.error('Error getting active reminders:', error);
      throw error;
    }
  }

  /**
   * Get reminders due now
   * @returns {Promise<Array>} Array of due reminders
   */
  static async getDueReminders() {
    try {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
      const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const todayName = dayNames[currentDay];

      const query = `
        SELECT r.*, u.discord_id as user_discord_id
        FROM reminders r
        JOIN users u ON r.user_id = u.id
        WHERE r.is_active = 1 
        AND u.discord_id IS NOT NULL
        AND r.reminder_time = $1
        AND (
          r.reminder_days = '[]' OR
          r.reminder_days LIKE $2
        )
      `;
      
      const params = [currentTime, `%"${todayName}"%`];
      const reminders = await db.asyncAll(query, params);
      
      return reminders.map(reminder => ({
        ...reminder,
        reminder_days: JSON.parse(reminder.reminder_days || '[]')
      }));
    } catch (error) {
      console.error('Error getting due reminders:', error);
      throw error;
    }
  }

  /**
   * Delete reminders for an item
   * @param {string} itemType - Item type (task, habit, routine_item)
   * @param {number} itemId - Item ID
   * @returns {Promise<boolean>} Success status
   */
  static async deleteByItem(itemType, itemId) {
    try {
      const query = 'DELETE FROM reminders WHERE item_type = $1 AND item_id = $2';
      await db.asyncRun(query, [itemType, itemId]);
      return true;
    } catch (error) {
      console.error('Error deleting reminders by item:', error);
      throw error;
    }
  }

  /**
   * Sync reminder from task/habit/routine item
   * @param {Object} item - Item object (task, habit, or routine item)
   * @param {string} itemType - Item type
   * @param {number} userId - User ID
   * @param {string} discordId - Discord ID
   * @returns {Promise<Object|null>} Created/updated reminder or null
   */
  static async syncFromItem(item, itemType, userId, discordId) {
    try {
      if (!item.reminder_enabled || !item.reminder_time) {
        // Delete existing reminder if reminders are disabled
        await this.deleteByItem(itemType, item.id);
        return null;
      }

      const reminderData = {
        user_id: userId,
        discord_id: discordId,
        item_type: itemType,
        item_id: item.id,
        title: item.title,
        reminder_time: item.reminder_time,
        reminder_days: item.reminder_days || [],
        is_active: 1
      };

      return await this.createOrUpdate(reminderData);
    } catch (error) {
      console.error('Error syncing reminder from item:', error);
      throw error;
    }
  }

  /**
   * Get reminder statistics for a user
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Reminder statistics
   */
  static async getStatistics(userId) {
    try {
      const query = `
        SELECT 
          item_type,
          COUNT(*) as count,
          SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_count
        FROM reminders
        WHERE user_id = $1
        GROUP BY item_type
      `;
      
      const stats = await db.asyncAll(query, [userId]);
      
      const result = {
        total: 0,
        active: 0,
        by_type: {}
      };

      stats.forEach(stat => {
        result.total += stat.count;
        result.active += stat.active_count;
        result.by_type[stat.item_type] = {
          total: stat.count,
          active: stat.active_count
        };
      });

      return result;
    } catch (error) {
      console.error('Error getting reminder statistics:', error);
      throw error;
    }
  }
}

module.exports = Reminder;
