const pool = require('../../db');
const { helpers } = require('../../../database');

/**
 * Service for handling schedule-related operations
 */
class ScheduleService {
  /**
   * Get user's schedule
   * @param {string} discordId - Discord user ID
   * @returns {Promise<Object>} - Schedule data
   */
  static async getUserSchedule(discordId) {
    try {
      // Get trainers for this Discord user
      const trainers = await helpers.getTrainersByDiscordId(discordId);

      if (!trainers || trainers.length === 0) {
        return {
          success: false,
          error: 'No trainers found for this Discord user. Please create a trainer first.'
        };
      }

      // Get tasks and habits for all trainers
      let allTasks = [];
      let allHabits = [];

      for (const trainer of trainers) {
        const trainerTasks = await helpers.getTrainerTasks(trainer.id);
        const trainerHabits = await helpers.getTrainerHabits(trainer.id);

        allTasks = [...allTasks, ...trainerTasks];
        allHabits = [...allHabits, ...trainerHabits];
      }

      return {
        success: true,
        trainers,
        tasks: allTasks,
        habits: allHabits
      };
    } catch (error) {
      console.error('Error getting user schedule:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Add a task
   * @param {Object} task - Task data
   * @param {string} task.title - Task title
   * @param {string} task.description - Task description
   * @param {string} task.dueDate - Due date (ISO string)
   * @param {string} task.priority - Priority (low, medium, high)
   * @param {string} task.discordId - Discord user ID
   * @param {number} [task.trainerId] - Trainer ID (optional)
   * @returns {Promise<Object>} - Result
   */
  static async addTask(task) {
    try {
      // Validate task
      if (!task.title || !task.discordId) {
        return { success: false, error: 'Missing required fields' };
      }

      // If no trainer ID is provided, get the first trainer for this Discord user
      let trainerId = task.trainerId;
      if (!trainerId) {
        const trainers = await helpers.getTrainersByDiscordId(task.discordId);
        if (!trainers || trainers.length === 0) {
          return { success: false, error: 'No trainers found for this Discord user. Please create a trainer first.' };
        }
        trainerId = trainers[0].id;
      }

      // Prepare task data
      const taskData = {
        trainer_id: trainerId,
        title: task.title,
        description: task.description || '',
        difficulty: task.priority || 'medium',
        due_date: task.dueDate ? new Date(task.dueDate) : null,
        level_reward: 1, // Default level reward
        coin_reward: 100, // Default coin reward
        bound_to_trainer: true, // By default, bind to trainer
        reminder_enabled: task.reminderEnabled || false
      };

      // Add reminder time if enabled
      if (taskData.reminder_enabled && task.dueDate) {
        const reminderTime = new Date(task.dueDate);
        reminderTime.setMinutes(reminderTime.getMinutes() - 15); // 15 minutes before due date
        taskData.reminder_time = reminderTime;
      }

      // Create the task
      const createdTask = await helpers.createTask(taskData);

      return {
        success: true,
        task: createdTask
      };
    } catch (error) {
      console.error('Error adding task:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Add a habit
   * @param {Object} habit - Habit data
   * @param {string} habit.name - Habit name
   * @param {string} habit.description - Habit description
   * @param {string} habit.frequency - Frequency (daily, weekly, monthly)
   * @param {string} habit.discordId - Discord user ID
   * @param {number} [habit.trainerId] - Trainer ID (optional)
   * @returns {Promise<Object>} - Result
   */
  static async addHabit(habit) {
    try {
      // Validate habit
      if (!habit.name || !habit.frequency || !habit.discordId) {
        return { success: false, error: 'Missing required fields' };
      }

      // If no trainer ID is provided, get the first trainer for this Discord user
      let trainerId = habit.trainerId;
      if (!trainerId) {
        const trainers = await helpers.getTrainersByDiscordId(habit.discordId);
        if (!trainers || trainers.length === 0) {
          return { success: false, error: 'No trainers found for this Discord user. Please create a trainer first.' };
        }
        trainerId = trainers[0].id;
      }

      // Prepare habit data
      const habitData = {
        trainer_id: trainerId,
        title: habit.name,
        description: habit.description || '',
        difficulty: habit.difficulty || 'medium',
        frequency: habit.frequency,
        level_reward: 1, // Default level reward
        coin_reward: 50, // Default coin reward
        bound_to_trainer: true // By default, bind to trainer
      };

      // Create the habit
      const createdHabit = await helpers.createHabit(habitData);

      return {
        success: true,
        habit: createdHabit
      };
    } catch (error) {
      console.error('Error adding habit:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create a schedule
   * @param {Object} schedule - Schedule data
   * @param {string} schedule.name - Schedule name
   * @param {string} schedule.description - Schedule description
   * @param {string} schedule.discordId - Discord user ID
   * @returns {Promise<Object>} - Result
   */
  static async createSchedule(schedule) {
    try {
      // Validate schedule
      if (!schedule.name || !schedule.discordId) {
        return { success: false, error: 'Missing required fields' };
      }

      // Get or create user ID from Discord ID
      const userId = await this._getOrCreateUser(schedule.discordId);

      // Return success since schedules table doesn't exist yet
      return {
        success: true,
        scheduleId: 1 // Placeholder ID
      };
    } catch (error) {
      console.error('Error creating schedule:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user's tasks
   * @param {string} discordId - Discord user ID
   * @param {Object} [options] - Options
   * @param {boolean} [options.includeCompleted=false] - Whether to include completed tasks
   * @param {Date} [options.startDate] - Start date for filtering tasks
   * @param {Date} [options.endDate] - End date for filtering tasks
   * @returns {Promise<Object>} - Tasks data
   */
  static async getUserTasks(discordId, options = {}) {
    try {
      // Get trainers for this Discord user
      const trainers = await helpers.getTrainersByDiscordId(discordId);

      if (!trainers || trainers.length === 0) {
        return {
          success: false,
          error: 'No trainers found for this Discord user. Please create a trainer first.'
        };
      }

      // Get tasks for all trainers
      let allTasks = [];

      for (const trainer of trainers) {
        const trainerTasks = await helpers.getTrainerTasks(trainer.id);
        allTasks = [...allTasks, ...trainerTasks];
      }

      // Filter tasks based on options
      if (!options.includeCompleted) {
        allTasks = allTasks.filter(task => !task.completed);
      }

      if (options.startDate) {
        const startDate = new Date(options.startDate);
        allTasks = allTasks.filter(task => new Date(task.due_date) >= startDate);
      }

      if (options.endDate) {
        const endDate = new Date(options.endDate);
        allTasks = allTasks.filter(task => new Date(task.due_date) <= endDate);
      }

      // Sort tasks by due date
      allTasks.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

      return {
        success: true,
        tasks: allTasks,
        trainers
      };
    } catch (error) {
      console.error('Error getting user tasks:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user's habits
   * @param {string} discordId - Discord user ID
   * @param {Object} [options] - Options
   * @param {boolean} [options.includeDueOnly=false] - Whether to include only due habits
   * @returns {Promise<Object>} - Habits data
   */
  static async getUserHabits(discordId, options = {}) {
    try {
      // Get trainers for this Discord user
      const trainers = await helpers.getTrainersByDiscordId(discordId);

      if (!trainers || trainers.length === 0) {
        return {
          success: false,
          error: 'No trainers found for this Discord user. Please create a trainer first.'
        };
      }

      // Get habits for all trainers
      let allHabits = [];

      for (const trainer of trainers) {
        const trainerHabits = await helpers.getTrainerHabits(trainer.id);
        allHabits = [...allHabits, ...trainerHabits];
      }

      // Filter habits based on options
      if (options.includeDueOnly) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        allHabits = allHabits.filter(habit => {
          if (!habit.last_completed) return true;

          const lastCompleted = new Date(habit.last_completed);
          lastCompleted.setHours(0, 0, 0, 0);

          // For daily habits, check if completed today
          if (habit.frequency === 'daily') {
            return lastCompleted.getTime() !== today.getTime();
          }

          // For weekly habits, check if completed in the last 7 days
          if (habit.frequency === 'weekly') {
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return lastCompleted < weekAgo;
          }

          // For monthly habits, check if completed in the current month
          if (habit.frequency === 'monthly') {
            return lastCompleted.getMonth() !== today.getMonth() ||
                   lastCompleted.getFullYear() !== today.getFullYear();
          }

          return true;
        });
      }

      return {
        success: true,
        habits: allHabits,
        trainers
      };
    } catch (error) {
      console.error('Error getting user habits:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get or create a user by Discord ID
   * @param {string} discordId - Discord user ID
   * @returns {Promise<number>} - User ID
   * @private
   */
  static async _getOrCreateUser(discordId) {
    try {
      // Try to get existing user
      const userResult = await pool.query(`
        SELECT id FROM users WHERE discord_id = $1
      `, [discordId]);

      // If user exists, return the ID
      if (userResult.rows.length > 0) {
        return userResult.rows[0].id;
      }

      // Create a new user with the Discord ID
      const username = `discord_${discordId}`;
      // Generate a random password (this is just for the database constraint, not for actual login)
      const password = require('crypto').randomBytes(16).toString('hex');
      const newUserResult = await pool.query(`
        INSERT INTO users (username, password, discord_id, created_at)
        VALUES ($1, $2, $3, NOW())
        RETURNING id
      `, [username, password, discordId]);

      return newUserResult.rows[0].id;
    } catch (error) {
      console.error('Error getting or creating user:', error);
      throw error;
    }
  }

  /**
   * Complete a task
   * @param {number} taskId - Task ID
   * @returns {Promise<Object>} - Result
   */
  static async completeTask(taskId) {
    try {
      // Complete the task
      const completedTask = await helpers.completeTask(taskId);

      return {
        success: true,
        task: completedTask
      };
    } catch (error) {
      console.error('Error completing task:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Complete a habit
   * @param {number} habitId - Habit ID
   * @returns {Promise<Object>} - Result
   */
  static async completeHabit(habitId) {
    try {
      // Complete the habit
      const completedHabit = await helpers.completeHabit(habitId);

      return {
        success: true,
        habit: completedHabit
      };
    } catch (error) {
      console.error('Error completing habit:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Skip a habit for today
   * @param {number} habitId - Habit ID
   * @returns {Promise<Object>} - Result
   */
  static async skipHabit(habitId) {
    try {
      // Skip the habit
      const skippedHabit = await helpers.skipHabit(habitId);

      return {
        success: true,
        habit: skippedHabit
      };
    } catch (error) {
      console.error('Error skipping habit:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a task
   * @param {number} taskId - Task ID
   * @returns {Promise<Object>} - Result
   */
  static async deleteTask(taskId) {
    try {
      // Delete the task
      await helpers.deleteTask(taskId);

      return {
        success: true
      };
    } catch (error) {
      console.error('Error deleting task:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a habit
   * @param {number} habitId - Habit ID
   * @returns {Promise<Object>} - Result
   */
  static async deleteHabit(habitId) {
    try {
      // Delete the habit
      await helpers.deleteHabit(habitId);

      return {
        success: true
      };
    } catch (error) {
      console.error('Error deleting habit:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update task reminder
   * @param {number} taskId - Task ID
   * @param {Date} reminderTime - New reminder time
   * @returns {Promise<Object>} - Result
   */
  static async updateTaskReminder(taskId, reminderTime) {
    try {
      // Update the task reminder
      await helpers.updateTaskReminder(taskId, reminderTime);

      return {
        success: true
      };
    } catch (error) {
      console.error('Error updating task reminder:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get due reminders
   * @returns {Promise<Object>} - Result with due reminders
   */
  static async getDueReminders() {
    try {
      // Get due reminders
      const dueReminders = await helpers.getDueReminders();

      return {
        success: true,
        reminders: dueReminders
      };
    } catch (error) {
      console.error('Error getting due reminders:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark reminder as sent
   * @param {number} reminderId - Reminder ID
   * @param {string} response - Response status
   * @returns {Promise<Object>} - Result
   */
  static async markReminderSent(reminderId, response = 'sent') {
    try {
      // Mark reminder as sent
      await helpers.markReminderSent(reminderId, response);

      return {
        success: true
      };
    } catch (error) {
      console.error('Error marking reminder as sent:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = ScheduleService;
