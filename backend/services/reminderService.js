const Reminder = require('../models/Reminder');
const Habit = require('../models/Habit');

/**
 * Reminder service for managing Discord reminders and habit streak resets
 */
class ReminderService {
  /**
   * Process due reminders
   * @returns {Promise<Array>} Array of processed reminders
   */
  static async processDueReminders() {
    try {
      const dueReminders = await Reminder.getDueReminders();
      const processedReminders = [];

      for (const reminder of dueReminders) {
        try {
          // Send reminder via Discord bot (if available)
          await this.sendDiscordReminder(reminder);
          processedReminders.push(reminder);
        } catch (error) {
          console.error(`Error sending reminder ${reminder.id}:`, error);
        }
      }

      return processedReminders;
    } catch (error) {
      console.error('Error processing due reminders:', error);
      throw error;
    }
  }

  /**
   * Send Discord reminder
   * @param {Object} reminder - Reminder object
   * @returns {Promise<void>}
   */
  static async sendDiscordReminder(reminder) {
    try {
      // This would integrate with the Discord bot
      // For now, we'll just log the reminder
      console.log(`Reminder for ${reminder.user_discord_id}: ${reminder.title}`);
      
      // In a real implementation, this would send a DM via Discord bot
      // Example:
      // const discordBot = require('../discord/bot');
      // await discordBot.sendDM(reminder.user_discord_id, {
      //   title: `Reminder: ${reminder.title}`,
      //   description: `Don't forget to ${reminder.item_type === 'task' ? 'complete your task' : 'track your habit'}!`,
      //   command: `/${reminder.item_type} ${reminder.item_type === 'task' ? 'complete' : 'track'} ${reminder.item_id}`
      // });
    } catch (error) {
      console.error('Error sending Discord reminder:', error);
      throw error;
    }
  }

  /**
   * Process habit streak resets
   * @returns {Promise<Array>} Array of reset habits
   */
  static async processHabitStreakResets() {
    try {
      const habitsToReset = await Habit.getHabitsToReset();
      
      if (habitsToReset.length === 0) {
        return [];
      }

      // Reset streaks
      const habitIds = habitsToReset.map(habit => habit.id);
      await Habit.resetStreaks(habitIds);

      // Optionally send notifications about streak resets
      for (const habit of habitsToReset) {
        try {
          await this.sendStreakResetNotification(habit);
        } catch (error) {
          console.error(`Error sending streak reset notification for habit ${habit.id}:`, error);
        }
      }

      return habitsToReset;
    } catch (error) {
      console.error('Error processing habit streak resets:', error);
      throw error;
    }
  }

  /**
   * Send streak reset notification
   * @param {Object} habit - Habit object
   * @returns {Promise<void>}
   */
  static async sendStreakResetNotification(habit) {
    try {
      if (!habit.discord_id) return;

      console.log(`Streak reset for ${habit.discord_id}: ${habit.title} (was ${habit.streak} days)`);
      
      // In a real implementation, this would send a DM via Discord bot
      // Example:
      // const discordBot = require('../discord/bot');
      // await discordBot.sendDM(habit.discord_id, {
      //   title: `Streak Reset: ${habit.title}`,
      //   description: `Your ${habit.streak}-day streak for "${habit.title}" has been reset. Don't give up - start a new streak today!`,
      //   color: 'warning'
      // });
    } catch (error) {
      console.error('Error sending streak reset notification:', error);
      throw error;
    }
  }

  /**
   * Run all reminder processes
   * @returns {Promise<Object>} Processing results
   */
  static async runAllProcesses() {
    try {
      const results = {
        reminders: [],
        habitResets: [],
        errors: []
      };

      // Process due reminders
      try {
        results.reminders = await this.processDueReminders();
      } catch (error) {
        results.errors.push({ type: 'reminders', error: error.message });
      }

      // Process habit streak resets
      try {
        results.habitResets = await this.processHabitStreakResets();
      } catch (error) {
        results.errors.push({ type: 'habitResets', error: error.message });
      }

      return results;
    } catch (error) {
      console.error('Error running reminder processes:', error);
      throw error;
    }
  }

  /**
   * Schedule reminder processing (to be called by a cron job or scheduler)
   * @returns {Promise<void>}
   */
  static async scheduleProcessing() {
    try {
      console.log('Running scheduled reminder processing...');
      const results = await this.runAllProcesses();
      
      console.log(`Processed ${results.reminders.length} reminders`);
      console.log(`Reset ${results.habitResets.length} habit streaks`);
      
      if (results.errors.length > 0) {
        console.error('Errors during processing:', results.errors);
      }
    } catch (error) {
      console.error('Error in scheduled reminder processing:', error);
    }
  }

  /**
   * Get reminder statistics
   * @returns {Promise<Object>} Reminder statistics
   */
  static async getStatistics() {
    try {
      const activeReminders = await Reminder.getActiveReminders();
      const dueReminders = await Reminder.getDueReminders();
      const habitsToReset = await Habit.getHabitsToReset();

      return {
        total_active_reminders: activeReminders.length,
        due_reminders: dueReminders.length,
        habits_to_reset: habitsToReset.length,
        reminder_types: {
          task: activeReminders.filter(r => r.item_type === 'task').length,
          habit: activeReminders.filter(r => r.item_type === 'habit').length,
          routine_item: activeReminders.filter(r => r.item_type === 'routine_item').length
        }
      };
    } catch (error) {
      console.error('Error getting reminder statistics:', error);
      throw error;
    }
  }

  /**
   * Sync reminders for a user (useful when user updates Discord settings)
   * @param {number} userId - User ID
   * @param {string} discordId - Discord ID
   * @returns {Promise<Object>} Sync results
   */
  static async syncUserReminders(userId, discordId) {
    try {
      const Task = require('../models/Task');
      const DailyRoutine = require('../models/DailyRoutine');

      const results = {
        tasks: 0,
        habits: 0,
        routineItems: 0,
        errors: []
      };

      // Sync task reminders
      try {
        const tasks = await Task.getByUserId(userId);
        for (const task of tasks) {
          if (task.reminder_enabled) {
            await Reminder.syncFromItem(task, 'task', userId, discordId);
            results.tasks++;
          }
        }
      } catch (error) {
        results.errors.push({ type: 'tasks', error: error.message });
      }

      // Sync habit reminders
      try {
        const habits = await Habit.getByUserId(userId);
        for (const habit of habits) {
          if (habit.reminder_enabled) {
            await Reminder.syncFromItem(habit, 'habit', userId, discordId);
            results.habits++;
          }
        }
      } catch (error) {
        results.errors.push({ type: 'habits', error: error.message });
      }

      // Sync routine item reminders
      try {
        const routines = await DailyRoutine.getByUserId(userId);
        for (const routine of routines) {
          for (const item of routine.items || []) {
            if (item.reminder_enabled) {
              await Reminder.syncFromItem(item, 'routine_item', userId, discordId);
              results.routineItems++;
            }
          }
        }
      } catch (error) {
        results.errors.push({ type: 'routineItems', error: error.message });
      }

      return results;
    } catch (error) {
      console.error('Error syncing user reminders:', error);
      throw error;
    }
  }
}

module.exports = ReminderService;
