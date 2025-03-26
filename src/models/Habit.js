const pool = require('../db');

class Habit {
  /**
   * Create a new habit
   * @param {Object} habitData - Habit data
   * @param {number} habitData.trainer_id - Trainer ID
   * @param {string} habitData.title - Habit title
   * @param {string} habitData.description - Habit description (optional)
   * @param {string} habitData.difficulty - Habit difficulty (easy, medium, hard)
   * @param {string} habitData.frequency - Habit frequency (daily, weekly)
   * @param {number} habitData.level_reward - Level reward amount
   * @param {number} habitData.coin_reward - Coin reward amount
   * @param {number} habitData.bound_to_mon_id - Monster ID to bind to (optional)
   * @param {boolean} habitData.bound_to_trainer - Whether to bind to trainer
   * @returns {Promise<Object>} - Created habit
   */
  static async create({
    trainer_id,
    title,
    description = '',
    difficulty = 'medium',
    frequency = 'daily',
    level_reward = 1,
    coin_reward = 50,
    bound_to_mon_id = null,
    bound_to_trainer = false
  }) {
    try {
      const query = `
        INSERT INTO habits (
          trainer_id, title, description, difficulty, frequency,
          level_reward, coin_reward, bound_to_mon_id, bound_to_trainer
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      const values = [
        trainer_id, title, description, difficulty, frequency,
        level_reward, coin_reward, bound_to_mon_id, bound_to_trainer
      ];

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating habit:', error);
      throw error;
    }
  }

  /**
   * Get all habits for a trainer
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Array>} - Array of habits
   */
  static async getByTrainerId(trainerId) {
    try {
      const query = `
        SELECT h.*, m.name as monster_name, m.img_link as monster_img
        FROM habits h
        LEFT JOIN mons m ON h.bound_to_mon_id = m.mon_id
        WHERE h.trainer_id = $1
        ORDER BY h.frequency, h.created_at DESC
      `;

      const result = await pool.query(query, [trainerId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting habits by trainer ID:', error);
      throw error;
    }
  }

  /**
   * Get a habit by ID
   * @param {number} habitId - Habit ID
   * @returns {Promise<Object>} - Habit object
   */
  static async getById(habitId) {
    try {
      const query = `
        SELECT h.*, m.name as monster_name, m.img_link as monster_img
        FROM habits h
        LEFT JOIN mons m ON h.bound_to_mon_id = m.mon_id
        WHERE h.habit_id = $1
      `;

      const result = await pool.query(query, [habitId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error getting habit by ID:', error);
      throw error;
    }
  }

  /**
   * Update a habit
   * @param {number} habitId - Habit ID
   * @param {Object} habitData - Habit data to update
   * @returns {Promise<Object>} - Updated habit
   */
  static async update(habitId, habitData) {
    try {
      // Build the query dynamically based on the fields to update
      const fields = Object.keys(habitData)
        .filter(key => habitData[key] !== undefined)
        .map((key, index) => `${key} = $${index + 2}`);

      if (fields.length === 0) {
        return await this.getById(habitId);
      }

      const query = `
        UPDATE habits
        SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE habit_id = $1
        RETURNING *
      `;

      const values = [
        habitId,
        ...Object.keys(habitData)
          .filter(key => habitData[key] !== undefined)
          .map(key => habitData[key])
      ];

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating habit:', error);
      throw error;
    }
  }

  /**
   * Complete a habit
   * @param {number} habitId - Habit ID
   * @param {number} awardedToMonId - Monster ID to award to (optional)
   * @param {number} awardedToTrainerId - Trainer ID to award to (optional)
   * @returns {Promise<Object>} - Completed habit with completion record
   */
  static async complete(habitId, awardedToMonId = null, awardedToTrainerId = null) {
    try {
      // Start a transaction
      await pool.query('BEGIN');

      // Get the habit
      const habit = await this.getById(habitId);

      if (!habit) {
        throw new Error('Habit not found');
      }

      // Check if the habit was already completed today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const lastCompletedDate = habit.last_completed ? new Date(habit.last_completed) : null;
      if (lastCompletedDate) {
        lastCompletedDate.setHours(0, 0, 0, 0);
      }

      const isCompletedToday = lastCompletedDate && lastCompletedDate.getTime() === today.getTime();

      // If the habit is already completed today, return it
      if (isCompletedToday) {
        await pool.query('ROLLBACK');
        return { habit, alreadyCompletedToday: true };
      }

      // Determine if the streak should be incremented or reset
      let newStreak = habit.streak;
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const isCompletedYesterday = lastCompletedDate && lastCompletedDate.getTime() === yesterday.getTime();

      if (habit.frequency === 'daily') {
        if (isCompletedYesterday) {
          // Increment streak if completed yesterday
          newStreak += 1;
        } else if (!lastCompletedDate) {
          // First completion
          newStreak = 1;
        } else {
          // Reset streak if not completed yesterday
          newStreak = 1;
        }
      } else if (habit.frequency === 'weekly') {
        // For weekly habits, check if it's been completed in the last 7 days
        const oneWeekAgo = new Date(today);
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        if (lastCompletedDate && lastCompletedDate >= oneWeekAgo) {
          // Increment streak if completed within the last week
          newStreak += 1;
        } else if (!lastCompletedDate) {
          // First completion
          newStreak = 1;
        } else {
          // Reset streak if not completed within the last week
          newStreak = 1;
        }
      }

      // Update the longest streak if needed
      const newLongestStreak = Math.max(habit.longest_streak || 0, newStreak);

      // Update the habit
      const updateQuery = `
        UPDATE habits
        SET streak = $1, longest_streak = $2, last_completed = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE habit_id = $3
        RETURNING *
      `;

      const updateResult = await pool.query(updateQuery, [newStreak, newLongestStreak, habitId]);
      const updatedHabit = updateResult.rows[0];

      // Determine where to award the rewards
      let monId = awardedToMonId;
      let trainerId = awardedToTrainerId;

      if (!monId && !trainerId) {
        if (habit.bound_to_mon_id) {
          monId = habit.bound_to_mon_id;
        } else if (habit.bound_to_trainer) {
          trainerId = habit.trainer_id;
        } else {
          // If not bound, default to the trainer
          trainerId = habit.trainer_id;
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

        await pool.query(monUpdateQuery, [habit.level_reward, monId]);
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
          habit.level_reward,
          habit.coin_reward,
          trainerId
        ]);
      }

      // Record the completion
      const completionQuery = `
        INSERT INTO habit_completions (
          habit_id, levels_gained, coins_gained, awarded_to_mon_id, awarded_to_trainer_id
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;

      const completionResult = await pool.query(completionQuery, [
        habitId,
        habit.level_reward,
        habit.coin_reward,
        monId,
        trainerId
      ]);

      const completion = completionResult.rows[0];

      // Commit the transaction
      await pool.query('COMMIT');

      return { habit: updatedHabit, completion, alreadyCompletedToday: false };
    } catch (error) {
      // Rollback the transaction on error
      await pool.query('ROLLBACK');
      console.error('Error completing habit:', error);
      throw error;
    }
  }

  /**
   * Get habit completions for a habit
   * @param {number} habitId - Habit ID
   * @param {number} limit - Limit (optional)
   * @returns {Promise<Array>} - Array of habit completions
   */
  static async getCompletions(habitId, limit = 10) {
    try {
      const query = `
        SELECT hc.*, m.name as monster_name, m.img_link as monster_img, t.name as trainer_name
        FROM habit_completions hc
        LEFT JOIN mons m ON hc.awarded_to_mon_id = m.mon_id
        LEFT JOIN trainers t ON hc.awarded_to_trainer_id = t.id
        WHERE hc.habit_id = $1
        ORDER BY hc.completed_at DESC
        LIMIT $2
      `;

      const result = await pool.query(query, [habitId, limit]);
      return result.rows;
    } catch (error) {
      console.error('Error getting habit completions:', error);
      throw error;
    }
  }

  /**
   * Delete a habit
   * @param {number} habitId - Habit ID
   * @returns {Promise<boolean>} - Whether the habit was deleted
   */
  static async delete(habitId) {
    try {
      console.log(`Starting deletion of habit with ID ${habitId}`);

      // Simple direct deletion without transaction
      const query = 'DELETE FROM habits WHERE habit_id = $1 RETURNING *';
      console.log(`Executing query: ${query} with habitId: ${habitId}`);
      const result = await pool.query(query, [habitId]);

      console.log(`Deletion result:`, result.rows.length > 0 ? 'Success' : 'Failed');
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error deleting habit:', error);
      throw error;
    }
  }
}

module.exports = Habit;
