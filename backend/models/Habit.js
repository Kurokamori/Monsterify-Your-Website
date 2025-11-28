const db = require('../config/db');

/**
 * Habit model for managing user habits
 */
class Habit {
  /**
   * Get all habits for a user
   * @param {number} userId - User ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of habits
   */
  static async getByUserId(userId, filters = {}) {
    try {
      let query = `
        SELECT h.*, tr.name as trainer_name
        FROM habits h
        LEFT JOIN trainers tr ON h.reward_trainer_id = tr.id
        WHERE h.user_id = $1
      `;
      const params = [userId];
      let index = 2; // Start at $2 since $1 is userId

      // Apply filters
      if (filters.status) {
        query += ` AND h.status = $${index++}`;
        params.push(filters.status);
      }

      if (filters.frequency) {
        query += ` AND h.frequency = $${index++}`;
        params.push(filters.frequency);
      }

      query += ' ORDER BY h.created_at DESC';

      const habits = await db.asyncAll(query, params);

      // Parse JSON fields and calculate streak status
      return habits.map(habit => ({
        ...habit,
        reminder_days: JSON.parse(habit.reminder_days || '[]'),
        streak_status: this._calculateStreakStatus(habit)
      }));
    } catch (error) {
      console.error('Error getting habits by user ID:', error);
      throw error;
    }
  }

  /**
   * Get habit by ID
   * @param {number} id - Habit ID
   * @returns {Promise<Object|null>} Habit object or null
   */
  static async getById(id) {
    try {
      const query = `
        SELECT h.*, tr.name as trainer_name
        FROM habits h
        LEFT JOIN trainers tr ON h.reward_trainer_id = tr.id
        WHERE h.id = $1
      `;
      const habit = await db.asyncGet(query, [id]);

      if (!habit) return null;

      // Parse JSON fields and calculate streak status
      return {
        ...habit,
        reminder_days: JSON.parse(habit.reminder_days || '[]'),
        streak_status: this._calculateStreakStatus(habit)
      };
    } catch (error) {
      console.error('Error getting habit by ID:', error);
      throw error;
    }
  }

  /**
   * Create a new habit
   * @param {Object} habitData - Habit data
   * @returns {Promise<Object>} Created habit
   */
  static async create(habitData) {
    try {
      const {
        user_id,
        title,
        description,
        frequency = 'daily',
        reward_levels = 0,
        reward_coins = 0,
        reward_trainer_id,
        reminder_enabled = 0,
        reminder_time,
        reminder_days = []
      } = habitData;

      // Calculate next reset time
      const nextResetAt = this._calculateNextReset(frequency);

      const query = `
        INSERT INTO habits (
          user_id, title, description, frequency, reward_levels, reward_coins,
          reward_trainer_id, reminder_enabled, reminder_time, reminder_days,
          next_reset_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `;

      const params = [
        user_id,
        title,
        description,
        frequency,
        reward_levels,
        reward_coins,
        reward_trainer_id,
        reminder_enabled,
        reminder_time,
        JSON.stringify(reminder_days),
        nextResetAt
      ];

      const result = await db.asyncRun(query, params);
      return await this.getById(result.lastID);
    } catch (error) {
      console.error('Error creating habit:', error);
      throw error;
    }
  }

  /**
   * Update a habit
   * @param {number} id - Habit ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated habit
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

      const query = `UPDATE habits SET ${fields.join(', ')} WHERE id = $${params.length}`;
      await db.asyncRun(query, params);

      return await this.getById(id);
    } catch (error) {
      console.error('Error updating habit:', error);
      throw error;
    }
  }

  /**
   * Track a habit completion
   * @param {number} id - Habit ID
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Tracking result
   */
  static async track(id, userId) {
    try {
      const habit = await this.getById(id);
      if (!habit) {
        throw new Error('Habit not found');
      }

      if (habit.user_id !== userId) {
        throw new Error('Not authorized to track this habit');
      }

      if (habit.status !== 'active') {
        throw new Error('Habit is not active');
      }

      const now = new Date();
      const today = now.toISOString().split('T')[0];

      // Check if already tracked today
      if (habit.last_completed_at) {
        const lastCompleted = new Date(habit.last_completed_at);
        const lastCompletedDate = lastCompleted.toISOString().split('T')[0];

        if (lastCompletedDate === today) {
          throw new Error('Habit already tracked today');
        }
      }

      // Calculate new streak
      const streakData = this._calculateNewStreak(habit, now);

      // Update habit
      await this.update(id, {
        streak: streakData.newStreak,
        best_streak: Math.max(habit.best_streak, streakData.newStreak),
        last_completed_at: now.toISOString(),
        next_reset_at: this._calculateNextReset(habit.frequency, now)
      });

      // Award rewards if trainer is specified
      let rewardResult = null;
      if (habit.reward_trainer_id && (habit.reward_levels > 0 || habit.reward_coins > 0)) {
        const Trainer = require('./Trainer');
        rewardResult = await Trainer.addLevelsAndCoins(
          habit.reward_trainer_id,
          habit.reward_levels,
          habit.reward_coins
        );
      }

      return {
        success: true,
        habit: await this.getById(id),
        streakChange: streakData.streakChange,
        rewards: rewardResult
      };
    } catch (error) {
      console.error('Error tracking habit:', error);
      throw error;
    }
  }

  /**
   * Delete a habit
   * @param {number} id - Habit ID
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id, userId) {
    try {
      const habit = await this.getById(id);
      if (!habit) {
        throw new Error('Habit not found');
      }

      if (habit.user_id !== userId) {
        throw new Error('Not authorized to delete this habit');
      }

      const query = 'DELETE FROM habits WHERE id = $1';
      await db.asyncRun(query, [id]);

      return true;
    } catch (error) {
      console.error('Error deleting habit:', error);
      throw error;
    }
  }

  /**
   * Get habits that need streak reset
   * @returns {Promise<Array>} Array of habits to reset
   */
  static async getHabitsToReset() {
    try {
      const now = new Date().toISOString();
      const query = `
        SELECT h.*, u.discord_id, tr.name as trainer_name
        FROM habits h
        LEFT JOIN users u ON (h.user_id = u.id OR h.user_id::text = u.discord_id)
        LEFT JOIN trainers tr ON h.reward_trainer_id = tr.id
        WHERE h.next_reset_at <= $1 AND h.status = 'active' AND h.streak > 0
      `;

      const habits = await db.asyncAll(query, [now]);

      return habits.map(habit => ({
        ...habit,
        reminder_days: JSON.parse(habit.reminder_days || '[]')
      }));
    } catch (error) {
      console.error('Error getting habits to reset:', error);
      throw error;
    }
  }

  /**
   * Reset habit streaks
   * @param {Array} habitIds - Array of habit IDs to reset
   * @returns {Promise<void>}
   */
  static async resetStreaks(habitIds) {
    try {
      if (habitIds.length === 0) return;

      const placeholders = habitIds.map(() => '?').join(',');
      const query = `
        UPDATE habits
        SET streak = 0, next_reset_at = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE id IN (${placeholders})
      `;

      await db.asyncRun(query, habitIds);
    } catch (error) {
      console.error('Error resetting habit streaks:', error);
      throw error;
    }
  }

  /**
   * Calculate streak status
   * @param {Object} habit - Habit object
   * @returns {string} Streak status
   * @private
   */
  static _calculateStreakStatus(habit) {
    if (!habit.last_completed_at) return 'not_started';

    const now = new Date();
    const lastCompleted = new Date(habit.last_completed_at);
    const hoursDiff = (now - lastCompleted) / (1000 * 60 * 60);

    if (habit.frequency === 'daily') {
      if (hoursDiff > 48) return 'broken';
      if (hoursDiff > 24) return 'at_risk';
      return 'active';
    } else if (habit.frequency === 'weekly') {
      if (hoursDiff > 168) return 'broken'; // 7 days
      if (hoursDiff > 144) return 'at_risk'; // 6 days
      return 'active';
    }

    return 'active';
  }

  /**
   * Calculate new streak after completion
   * @param {Object} habit - Habit object
   * @param {Date} now - Current date
   * @returns {Object} Streak calculation result
   * @private
   */
  static _calculateNewStreak(habit, now) {
    if (!habit.last_completed_at) {
      return { newStreak: 1, streakChange: 1 };
    }

    const lastCompleted = new Date(habit.last_completed_at);
    const hoursDiff = (now - lastCompleted) / (1000 * 60 * 60);

    let streakBroken = false;
    if (habit.frequency === 'daily' && hoursDiff > 48) {
      streakBroken = true;
    } else if (habit.frequency === 'weekly' && hoursDiff > 168) {
      streakBroken = true;
    }

    if (streakBroken) {
      return { newStreak: 1, streakChange: 1 - habit.streak };
    } else {
      return { newStreak: habit.streak + 1, streakChange: 1 };
    }
  }

  /**
   * Calculate next reset time
   * @param {string} frequency - Habit frequency
   * @param {Date} from - Start date (default: now)
   * @returns {string} Next reset time
   * @private
   */
  static _calculateNextReset(frequency, from = new Date()) {
    const resetTime = new Date(from);

    if (frequency === 'daily') {
      resetTime.setDate(resetTime.getDate() + 2); // 48 hours
    } else if (frequency === 'weekly') {
      resetTime.setDate(resetTime.getDate() + 7); // 7 days
    }

    return resetTime.toISOString();
  }
}

module.exports = Habit;
