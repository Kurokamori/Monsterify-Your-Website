const db = require('../config/db');
const { isPostgreSQL } = require('../utils/dbUtils');

/**
 * Task model for managing user tasks
 */
class Task {
  /**
   * Get all tasks for a user
   * @param {number} userId - User ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of tasks
   */
  static async getByUserId(userId, filters = {}) {
    try {
      let query = `
        SELECT t.*, tr.name as trainer_name
        FROM tasks t
        LEFT JOIN trainers tr ON t.reward_trainer_id = tr.id
        WHERE t.user_id = $1
      `;
      const params = [userId];
      let index = 2; // Start from $2 since $1 is userId

      // Apply filters
      if (filters.status) {
        query += ` AND t.status = $${index++}`;
        params.push(filters.status);
      }

      if (filters.priority) {
        query += ` AND t.priority = $${index++}`;
        params.push(filters.priority);
      }

      if (filters.difficulty) {
        query += ` AND t.difficulty = $${index++}`;
        params.push(filters.difficulty);
      }

      if (filters.category) {
        query += ` AND t.category = $${index++}`;
        params.push(filters.category);
      }

      query += ' ORDER BY t.created_at DESC';

      const tasks = await db.asyncAll(query, params);

      // Parse JSON fields
      return tasks.map(task => ({
        ...task,
        tags: JSON.parse(task.tags || '[]'),
        steps: JSON.parse(task.steps || '[]'),
        repeat_days: JSON.parse(task.repeat_days || '[]'),
        reminder_days: JSON.parse(task.reminder_days || '[]')
      }));
    } catch (error) {
      console.error('Error getting tasks by user ID:', error);
      throw error;
    }
  }

  /**
   * Get task by ID
   * @param {number} id - Task ID
   * @returns {Promise<Object|null>} Task object or null
   */
  static async getById(id) {
    try {
      const query = `
        SELECT t.*, tr.name as trainer_name
        FROM tasks t
        LEFT JOIN trainers tr ON t.reward_trainer_id = tr.id
        WHERE t.id = $1
      `;
      const task = await db.asyncGet(query, [id]);

      if (!task) return null;

      // Parse JSON fields
      return {
        ...task,
        tags: JSON.parse(task.tags || '[]'),
        steps: JSON.parse(task.steps || '[]'),
        repeat_days: JSON.parse(task.repeat_days || '[]'),
        reminder_days: JSON.parse(task.reminder_days || '[]')
      };
    } catch (error) {
      console.error('Error getting task by ID:', error);
      throw error;
    }
  }

  /**
   * Create a new task
   * @param {Object} taskData - Task data
   * @returns {Promise<Object>} Created task
   */
  static async create(taskData) {
    try {
      const {
        user_id,
        title,
        description,
        due_date,
        priority = 'medium',
        difficulty = 'easy',
        category,
        tags = [],
        steps = [],
        repeat_type,
        repeat_interval,
        repeat_days = [],
        reward_levels = 0,
        reward_coins = 0,
        reward_trainer_id,
        reminder_enabled = 0,
        reminder_time,
        reminder_days = []
      } = taskData;

      const query = `
        INSERT INTO tasks (
          user_id, title, description, due_date, priority, difficulty,
          category, tags, steps, repeat_type, repeat_interval, repeat_days,
          reward_levels, reward_coins, reward_trainer_id, reminder_enabled,
          reminder_time, reminder_days
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      `;

      const params = [
        user_id,
        title,
        description,
        due_date,
        priority,
        difficulty,
        category,
        JSON.stringify(tags),
        JSON.stringify(steps),
        repeat_type,
        repeat_interval,
        JSON.stringify(repeat_days),
        reward_levels,
        reward_coins,
        reward_trainer_id,
        reminder_enabled,
        reminder_time,
        JSON.stringify(reminder_days)
      ];

      let result, taskId;

      if (isPostgreSQL) {
        // PostgreSQL: Use RETURNING clause to get the inserted ID
        const pgQuery = query.replace('VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)', 'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) RETURNING id');
        result = await db.asyncRun(pgQuery, params);
        taskId = result.rows[0].id;
      } else {
        // SQLite: Use lastID from result
        result = await db.asyncRun(query, params);
        taskId = result.lastID;
      }

      return await this.getById(taskId);
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  /**
   * Update a task
   * @param {number} id - Task ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated task
   */
  static async update(id, updateData) {
    try {
      const fields = [];
      const params = [];

      // Build dynamic update query
      Object.keys(updateData).forEach(key => {
        if (key === 'tags' || key === 'steps' || key === 'repeat_days' || key === 'reminder_days') {
          fields.push(`${key} = $1`);
          params.push(JSON.stringify(updateData[key]));
        } else {
          fields.push(`${key} = $1`);
          params.push(updateData[key]);
        }
      });

      fields.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);

      const query = `UPDATE tasks SET ${fields.join(', ')} WHERE id = $1`;
      await db.asyncRun(query, params);

      return await this.getById(id);
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  /**
   * Complete a task
   * @param {number} id - Task ID
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Completion result
   */
  static async complete(id, userId) {
    try {
      const task = await this.getById(id);
      if (!task) {
        throw new Error('Task not found');
      }

      if (task.user_id !== userId) {
        throw new Error('Not authorized to complete this task');
      }

      if (task.status === 'completed') {
        throw new Error('Task already completed');
      }

      // Update task status
      await this.update(id, {
        status: 'completed',
        completed_at: new Date().toISOString()
      });

      // Award rewards if trainer is specified
      let rewardResult = null;
      if (task.reward_trainer_id && (task.reward_levels > 0 || task.reward_coins > 0)) {
        const Trainer = require('./Trainer');
        rewardResult = await Trainer.addLevelsAndCoins(
          task.reward_trainer_id,
          task.reward_levels,
          task.reward_coins
        );
      }

      // Handle repeat tasks
      if (task.repeat_type) {
        await this._createRepeatTask(task);
      }

      return {
        success: true,
        task: await this.getById(id),
        rewards: rewardResult
      };
    } catch (error) {
      console.error('Error completing task:', error);
      throw error;
    }
  }

  /**
   * Delete a task
   * @param {number} id - Task ID
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id, userId) {
    try {
      const task = await this.getById(id);
      if (!task) {
        throw new Error('Task not found');
      }

      if (task.user_id !== userId) {
        throw new Error('Not authorized to delete this task');
      }

      const query = 'DELETE FROM tasks WHERE id = $1';
      await db.asyncRun(query, [id]);

      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }

  /**
   * Get tasks due today
   * @returns {Promise<Array>} Array of due tasks
   */
  static async getDueToday() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const query = `
        SELECT t.*, u.discord_id, tr.name as trainer_name
        FROM tasks t
        LEFT JOIN users u ON (t.user_id = u.id OR t.user_id::text = u.discord_id)
        LEFT JOIN trainers tr ON t.reward_trainer_id = tr.id
        WHERE DATE(t.due_date) = $1 AND t.status = 'pending'
      `;

      const tasks = await db.asyncAll(query, [today]);

      return tasks.map(task => ({
        ...task,
        tags: JSON.parse(task.tags || '[]'),
        steps: JSON.parse(task.steps || '[]'),
        repeat_days: JSON.parse(task.repeat_days || '[]'),
        reminder_days: JSON.parse(task.reminder_days || '[]')
      }));
    } catch (error) {
      console.error('Error getting due tasks:', error);
      throw error;
    }
  }

  /**
   * Create a repeat task
   * @param {Object} originalTask - Original task data
   * @private
   */
  static async _createRepeatTask(originalTask) {
    try {
      if (!originalTask.repeat_type || !originalTask.repeat_interval) {
        return;
      }

      let nextDueDate = null;
      const currentDate = new Date();

      switch (originalTask.repeat_type) {
        case 'daily':
          nextDueDate = new Date(currentDate.getTime() + (originalTask.repeat_interval * 24 * 60 * 60 * 1000));
          break;
        case 'weekly':
          nextDueDate = new Date(currentDate.getTime() + (originalTask.repeat_interval * 7 * 24 * 60 * 60 * 1000));
          break;
        case 'monthly':
          nextDueDate = new Date(currentDate);
          nextDueDate.setMonth(nextDueDate.getMonth() + originalTask.repeat_interval);
          break;
        case 'yearly':
          nextDueDate = new Date(currentDate);
          nextDueDate.setFullYear(nextDueDate.getFullYear() + originalTask.repeat_interval);
          break;
      }

      if (nextDueDate) {
        await this.create({
          ...originalTask,
          due_date: nextDueDate.toISOString(),
          status: 'pending',
          completed_at: null,
          current_step: 0
        });
      }
    } catch (error) {
      console.error('Error creating repeat task:', error);
      throw error;
    }
  }
}

module.exports = Task;
