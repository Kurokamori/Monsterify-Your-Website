const pool = require('../db');

class Reminder {
  /**
   * Create a new reminder
   * @param {Object} reminderData - Reminder data
   * @param {number} reminderData.task_id - Task ID
   * @param {number} reminderData.trainer_id - Trainer ID
   * @param {Date} reminderData.scheduled_time - Scheduled time
   * @returns {Promise<Object>} - Created reminder
   */
  static async create({
    task_id,
    trainer_id,
    scheduled_time
  }) {
    try {
      const query = `
        INSERT INTO reminders (
          task_id, trainer_id, scheduled_time
        )
        VALUES ($1, $2, $3)
        RETURNING *
      `;
      
      const values = [
        task_id, trainer_id, scheduled_time
      ];
      
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating reminder:', error);
      throw error;
    }
  }

  /**
   * Get all reminders for a trainer
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Array>} - Array of reminders
   */
  static async getByTrainerId(trainerId) {
    try {
      const query = `
        SELECT r.*, t.title as task_title, t.description as task_description, t.due_date
        FROM reminders r
        JOIN tasks t ON r.task_id = t.task_id
        WHERE r.trainer_id = $1
        ORDER BY r.scheduled_time ASC
      `;
      
      const result = await pool.query(query, [trainerId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting reminders by trainer ID:', error);
      throw error;
    }
  }

  /**
   * Get a reminder by ID
   * @param {number} reminderId - Reminder ID
   * @returns {Promise<Object>} - Reminder object
   */
  static async getById(reminderId) {
    try {
      const query = `
        SELECT r.*, t.title as task_title, t.description as task_description, t.due_date
        FROM reminders r
        JOIN tasks t ON r.task_id = t.task_id
        WHERE r.reminder_id = $1
      `;
      
      const result = await pool.query(query, [reminderId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error getting reminder by ID:', error);
      throw error;
    }
  }

  /**
   * Get all pending reminders that need to be sent
   * @returns {Promise<Array>} - Array of reminders
   */
  static async getPendingReminders() {
    try {
      const query = `
        SELECT r.*, t.title as task_title, t.description as task_description, t.due_date,
               tr.discord_id, tr.name as trainer_name
        FROM reminders r
        JOIN tasks t ON r.task_id = t.task_id
        JOIN trainers tr ON r.trainer_id = tr.id
        WHERE r.sent = false
        AND r.scheduled_time <= CURRENT_TIMESTAMP
        ORDER BY r.scheduled_time ASC
      `;
      
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error getting pending reminders:', error);
      throw error;
    }
  }

  /**
   * Mark a reminder as sent
   * @param {number} reminderId - Reminder ID
   * @param {string} response - Response from the user (optional)
   * @returns {Promise<Object>} - Updated reminder
   */
  static async markAsSent(reminderId, response = null) {
    try {
      const query = `
        UPDATE reminders
        SET sent = true, response = $2, updated_at = CURRENT_TIMESTAMP
        WHERE reminder_id = $1
        RETURNING *
      `;
      
      const result = await pool.query(query, [reminderId, response]);
      return result.rows[0];
    } catch (error) {
      console.error('Error marking reminder as sent:', error);
      throw error;
    }
  }

  /**
   * Delete a reminder
   * @param {number} reminderId - Reminder ID
   * @returns {Promise<boolean>} - Whether the reminder was deleted
   */
  static async delete(reminderId) {
    try {
      const query = 'DELETE FROM reminders WHERE reminder_id = $1 RETURNING *';
      const result = await pool.query(query, [reminderId]);
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error deleting reminder:', error);
      throw error;
    }
  }
}

module.exports = Reminder;
