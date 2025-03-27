const pool = require('../db');

class Task {
  /**
   * Create a new task
   * @param {Object} taskData - Task data
   * @param {number} taskData.trainer_id - Trainer ID
   * @param {string} taskData.title - Task title
   * @param {string} taskData.description - Task description (optional)
   * @param {string} taskData.difficulty - Task difficulty (easy, medium, hard)
   * @param {Date} taskData.due_date - Due date (optional)
   * @param {number} taskData.level_reward - Level reward amount
   * @param {number} taskData.coin_reward - Coin reward amount
   * @param {number} taskData.bound_to_mon_id - Monster ID to bind to (optional)
   * @param {boolean} taskData.bound_to_trainer - Whether to bind to trainer
   * @param {boolean} taskData.reminder_enabled - Whether to enable reminder
   * @param {Date} taskData.reminder_time - Reminder time (optional)
   * @returns {Promise<Object>} - Created task
   */
  static async create({
    trainer_id,
    title,
    description = '',
    difficulty = 'medium',
    due_date = null,
    level_reward = 1,
    coin_reward = 100,
    bound_to_mon_id = null,
    bound_to_trainer = false,
    reminder_enabled = false,
    reminder_time = null
  }) {
    try {
      // Handle empty string values for timestamps
      if (due_date === '') due_date = null;
      if (reminder_time === '') reminder_time = null;

      // Convert reminder_enabled to boolean if it's a string
      if (typeof reminder_enabled === 'string') {
        reminder_enabled = reminder_enabled === 'true' || reminder_enabled === 'on';
      }

      // Convert bound_to_trainer to boolean if it's a string
      if (typeof bound_to_trainer === 'string') {
        bound_to_trainer = bound_to_trainer === 'true' || bound_to_trainer === 'on';
      }

      const query = `
        INSERT INTO tasks (
          trainer_id, title, description, difficulty, due_date,
          level_reward, coin_reward, bound_to_mon_id, bound_to_trainer,
          reminder_enabled, reminder_time
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;

      const values = [
        trainer_id, title, description, difficulty, due_date,
        level_reward, coin_reward, bound_to_mon_id, bound_to_trainer,
        reminder_enabled, reminder_time
      ];

      console.log('Task creation values:', values);

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  /**
   * Get all tasks for a trainer
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Array>} - Array of tasks
   */
  static async getByTrainerId(trainerId) {
    try {
      const query = `
        SELECT t.*, m.name as monster_name, m.img_link as monster_img
        FROM tasks t
        LEFT JOIN mons m ON t.bound_to_mon_id = m.mon_id
        WHERE t.trainer_id = $1
        ORDER BY t.due_date ASC, t.created_at DESC
      `;

      const result = await pool.query(query, [trainerId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting tasks by trainer ID:', error);
      throw error;
    }
  }

  /**
   * Get tasks for a trainer due on a specific date
   * @param {number} trainerId - Trainer ID
   * @param {Date} date - Date to check
   * @returns {Promise<Array>} - Array of tasks
   */
  static async getByTrainerIdAndDate(trainerId, date) {
    try {
      // Convert date to YYYY-MM-DD format
      const formattedDate = date.toISOString().split('T')[0];

      const query = `
        SELECT t.*, m.name as monster_name, m.img_link as monster_img
        FROM tasks t
        LEFT JOIN mons m ON t.bound_to_mon_id = m.mon_id
        WHERE t.trainer_id = $1
        AND DATE(t.due_date) = $2
        ORDER BY t.created_at DESC
      `;

      const result = await pool.query(query, [trainerId, formattedDate]);
      return result.rows;
    } catch (error) {
      console.error('Error getting tasks by trainer ID and date:', error);
      throw error;
    }
  }

  /**
   * Get a task by ID
   * @param {number} taskId - Task ID
   * @returns {Promise<Object>} - Task object
   */
  static async getById(taskId) {
    try {
      const query = `
        SELECT t.*, m.name as monster_name, m.img_link as monster_img
        FROM tasks t
        LEFT JOIN mons m ON t.bound_to_mon_id = m.mon_id
        WHERE t.task_id = $1
      `;

      const result = await pool.query(query, [taskId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error getting task by ID:', error);
      throw error;
    }
  }

  /**
   * Update a task
   * @param {number} taskId - Task ID
   * @param {Object} taskData - Task data to update
   * @returns {Promise<Object>} - Updated task
   */
  static async update(taskId, taskData) {
    try {
      // Build the query dynamically based on the fields to update
      const fields = Object.keys(taskData)
        .filter(key => taskData[key] !== undefined)
        .map((key, index) => `${key} = $${index + 2}`);

      if (fields.length === 0) {
        return await this.getById(taskId);
      }

      const query = `
        UPDATE tasks
        SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE task_id = $1
        RETURNING *
      `;

      const values = [
        taskId,
        ...Object.keys(taskData)
          .filter(key => taskData[key] !== undefined)
          .map(key => taskData[key])
      ];

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  /**
   * Complete a task
   * @param {number} taskId - Task ID
   * @param {number} awardedToMonId - Monster ID to award to (optional)
   * @param {number} awardedToTrainerId - Trainer ID to award to (optional)
   * @returns {Promise<Object>} - Completed task
   */
  static async complete(taskId, awardedToMonId = null, awardedToTrainerId = null) {
    try {
      // Start a transaction
      await pool.query('BEGIN');

      // Get the task
      const task = await this.getById(taskId);

      if (!task) {
        throw new Error('Task not found');
      }

      // If the task is already completed, return it
      if (task.completed) {
        await pool.query('ROLLBACK');
        return task;
      }

      // Update the task to mark it as completed
      const updateQuery = `
        UPDATE tasks
        SET completed = true, completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE task_id = $1
        RETURNING *
      `;

      const updateResult = await pool.query(updateQuery, [taskId]);
      const updatedTask = updateResult.rows[0];

      // Determine where to award the rewards
      let monId = awardedToMonId;
      let trainerId = awardedToTrainerId;

      if (!monId && !trainerId) {
        if (task.bound_to_mon_id) {
          monId = task.bound_to_mon_id;
        } else if (task.bound_to_trainer) {
          trainerId = task.trainer_id;
        } else {
          // If not bound, default to the trainer
          trainerId = task.trainer_id;
        }
      }

      // Award the rewards
      if (monId) {
        // Award to monster
        const monUpdateQuery = `
          UPDATE mons
          SET level = level + $1, updated_at = CURRENT_TIMESTAMP
          WHERE mon_id = $2
          RETURNING *
        `;

        await pool.query(monUpdateQuery, [task.level_reward, monId]);
      }

      if (trainerId) {
        // Award to trainer
        const trainerUpdateQuery = `
          UPDATE trainers
          SET level = level + $1, currency_amount = currency_amount + $2,
              total_earned_currency = total_earned_currency + $2, updated_at = CURRENT_TIMESTAMP
          WHERE id = $3
          RETURNING *
        `;

        await pool.query(trainerUpdateQuery, [
          task.level_reward,
          task.coin_reward,
          trainerId
        ]);
      }

      // Commit the transaction
      await pool.query('COMMIT');

      return updatedTask;
    } catch (error) {
      // Rollback the transaction on error
      await pool.query('ROLLBACK');
      console.error('Error completing task:', error);
      throw error;
    }
  }

  /**
   * Delete a task
   * @param {number} taskId - Task ID
   * @returns {Promise<boolean>} - Whether the task was deleted
   */
  static async delete(taskId) {
    try {
      const query = 'DELETE FROM tasks WHERE task_id = $1 RETURNING *';
      const result = await pool.query(query, [taskId]);
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }
}

module.exports = Task;
