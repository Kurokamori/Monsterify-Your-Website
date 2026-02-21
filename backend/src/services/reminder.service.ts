import {
  ReminderRepository,
  ReminderWithUserDetails,
  ReminderItemType,
  ReminderCreateInput,
  ReminderStatistics,
  HabitRepository,
  HabitWithDetails,
  TaskRepository,
  Task,
  DailyRoutineRepository,
  DailyRoutineWithItems,
} from '../repositories';

export type ReminderProcessingResults = {
  reminders: ReminderWithUserDetails[];
  habitResets: HabitWithDetails[];
  errors: Array<{ type: string; error: string }>;
};

export type ReminderSyncResults = {
  tasks: number;
  habits: number;
  routineItems: number;
  errors: Array<{ type: string; error: string }>;
};

/**
 * Service for managing Discord reminders and habit streak resets
 */
export class ReminderService {
  private reminderRepository: ReminderRepository;
  private habitRepository: HabitRepository;
  private taskRepository: TaskRepository;
  private dailyRoutineRepository: DailyRoutineRepository;

  constructor(
    reminderRepository?: ReminderRepository,
    habitRepository?: HabitRepository,
    taskRepository?: TaskRepository,
    dailyRoutineRepository?: DailyRoutineRepository
  ) {
    this.reminderRepository = reminderRepository ?? new ReminderRepository();
    this.habitRepository = habitRepository ?? new HabitRepository();
    this.taskRepository = taskRepository ?? new TaskRepository();
    this.dailyRoutineRepository = dailyRoutineRepository ?? new DailyRoutineRepository();
  }

  /**
   * Process due reminders
   * @returns Array of processed reminders
   */
  async processDueReminders(): Promise<ReminderWithUserDetails[]> {
    try {
      const dueReminders = await this.reminderRepository.getDueReminders();
      const processedReminders: ReminderWithUserDetails[] = [];

      for (const reminder of dueReminders) {
        try {
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
   * @param reminder - Reminder object
   */
  async sendDiscordReminder(reminder: ReminderWithUserDetails): Promise<void> {
    try {
      // This would integrate with the Discord bot
      // For now, we'll just log the reminder
      console.log(`Reminder for ${reminder.userDiscordId}: ${reminder.title}`);

      // In a real implementation, this would send a DM via Discord bot
      // Example:
      // const discordBot = require('../discord/bot');
      // await discordBot.sendDM(reminder.userDiscordId, {
      //   title: `Reminder: ${reminder.title}`,
      //   description: `Don't forget to ${reminder.itemType === 'task' ? 'complete your task' : 'track your habit'}!`,
      //   command: `/${reminder.itemType} ${reminder.itemType === 'task' ? 'complete' : 'track'} ${reminder.itemId}`
      // });
    } catch (error) {
      console.error('Error sending Discord reminder:', error);
      throw error;
    }
  }

  /**
   * Process habit streak resets
   * @returns Array of reset habits
   */
  async processHabitStreakResets(): Promise<HabitWithDetails[]> {
    try {
      const habitsToReset = await this.habitRepository.getHabitsToReset();

      if (habitsToReset.length === 0) {
        return [];
      }

      // Reset streaks
      const habitIds = habitsToReset.map((habit) => habit.id);
      await this.habitRepository.resetStreaks(habitIds);

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
   * @param habit - Habit object
   */
  async sendStreakResetNotification(habit: HabitWithDetails): Promise<void> {
    try {
      // In a real implementation, this would send a DM via Discord bot
      console.log(`Streak reset notification for habit ${habit.id}: ${habit.title} (was ${habit.streak} days)`);

      // Example:
      // const discordBot = require('../discord/bot');
      // await discordBot.sendDM(habit.userDiscordId, {
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
   * @returns Processing results
   */
  async runAllProcesses(): Promise<ReminderProcessingResults> {
    const results: ReminderProcessingResults = {
      reminders: [],
      habitResets: [],
      errors: [],
    };

    // Process due reminders
    try {
      results.reminders = await this.processDueReminders();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      results.errors.push({ type: 'reminders', error: errorMessage });
    }

    // Process habit streak resets
    try {
      results.habitResets = await this.processHabitStreakResets();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      results.errors.push({ type: 'habitResets', error: errorMessage });
    }

    return results;
  }

  /**
   * Schedule reminder processing (to be called by a cron job or scheduler)
   */
  async scheduleProcessing(): Promise<void> {
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
   * Get reminder statistics for a user
   * @param userId - User ID
   * @returns Reminder statistics
   */
  async getStatistics(userId: number): Promise<ReminderStatistics> {
    return this.reminderRepository.getStatistics(userId);
  }

  /**
   * Get active reminders
   * @returns Array of active reminders with user details
   */
  async getActiveReminders(): Promise<ReminderWithUserDetails[]> {
    return this.reminderRepository.getActiveReminders();
  }

  /**
   * Get due reminders
   * @returns Array of reminders that are currently due
   */
  async getDueReminders(): Promise<ReminderWithUserDetails[]> {
    return this.reminderRepository.getDueReminders();
  }

  /**
   * Create or update a reminder
   * @param input - Reminder input
   * @returns Created or updated reminder
   */
  async createOrUpdateReminder(input: ReminderCreateInput) {
    return this.reminderRepository.createOrUpdate(input);
  }

  /**
   * Delete a reminder
   * @param id - Reminder ID
   * @returns True if deleted
   */
  async deleteReminder(id: number): Promise<boolean> {
    return this.reminderRepository.delete(id);
  }

  /**
   * Delete reminders by item
   * @param itemType - Item type
   * @param itemId - Item ID
   * @returns Number of deleted reminders
   */
  async deleteRemindersByItem(itemType: ReminderItemType, itemId: number): Promise<number> {
    return this.reminderRepository.deleteByItem(itemType, itemId);
  }

  /**
   * Sync reminders for a user (useful when user updates Discord settings)
   * @param userId - User ID
   * @param discordId - Discord ID
   * @returns Sync results
   */
  async syncUserReminders(userId: number, discordId: string): Promise<ReminderSyncResults> {
    const results: ReminderSyncResults = {
      tasks: 0,
      habits: 0,
      routineItems: 0,
      errors: [],
    };

    // Sync task reminders
    try {
      const tasks = await this.taskRepository.findByUserId(userId);
      for (const task of tasks) {
        if (task.reminderEnabled && task.reminderTime) {
          await this.syncReminderFromTask(task, userId, discordId);
          results.tasks++;
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      results.errors.push({ type: 'tasks', error: errorMessage });
    }

    // Sync habit reminders
    try {
      const habits = await this.habitRepository.findByUserId(userId);
      for (const habit of habits) {
        if (habit.reminderEnabled && habit.reminderTime) {
          await this.syncReminderFromHabit(habit, userId, discordId);
          results.habits++;
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      results.errors.push({ type: 'habits', error: errorMessage });
    }

    // Sync routine item reminders
    try {
      const routines = await this.dailyRoutineRepository.findByUserId(userId);
      for (const routine of routines) {
        for (const item of routine.items || []) {
          if (item.reminderEnabled && item.scheduledTime) {
            await this.syncReminderFromRoutineItem(item, routine, userId, discordId);
            results.routineItems++;
          }
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      results.errors.push({ type: 'routineItems', error: errorMessage });
    }

    return results;
  }

  /**
   * Sync reminder from a task
   */
  private async syncReminderFromTask(
    task: Task,
    userId: number,
    discordId: string
  ): Promise<void> {
    await this.reminderRepository.createOrUpdate({
      userId,
      discordId,
      itemType: 'task',
      itemId: task.id,
      title: task.title,
      reminderTime: task.reminderTime ?? '09:00',
      reminderDays: task.reminderDays,
      isActive: task.status !== 'completed' && task.status !== 'cancelled',
    });
  }

  /**
   * Sync reminder from a habit
   */
  private async syncReminderFromHabit(
    habit: HabitWithDetails,
    userId: number,
    discordId: string
  ): Promise<void> {
    await this.reminderRepository.createOrUpdate({
      userId,
      discordId,
      itemType: 'habit',
      itemId: habit.id,
      title: habit.title,
      reminderTime: habit.reminderTime ?? '09:00',
      reminderDays: habit.reminderDays,
      isActive: habit.status === 'active',
    });
  }

  /**
   * Sync reminder from a routine item
   */
  private async syncReminderFromRoutineItem(
    item: { id: number; title: string; scheduledTime: string | null; reminderOffset: number },
    routine: DailyRoutineWithItems,
    userId: number,
    discordId: string
  ): Promise<void> {
    // Calculate reminder time based on scheduled time and offset
    let reminderTime = item.scheduledTime ?? '09:00';
    if (item.reminderOffset !== 0 && item.scheduledTime) {
      const timeParts = item.scheduledTime.split(':').map(Number);
      const hours = timeParts[0] ?? 0;
      const minutes = timeParts[1] ?? 0;
      const totalMinutes = hours * 60 + minutes - item.reminderOffset;
      const adjustedHours = Math.floor(totalMinutes / 60) % 24;
      const adjustedMinutes = totalMinutes % 60;
      reminderTime = `${String(adjustedHours).padStart(2, '0')}:${String(adjustedMinutes).padStart(2, '0')}`;
    }

    await this.reminderRepository.createOrUpdate({
      userId,
      discordId,
      itemType: 'routine_item',
      itemId: item.id,
      title: `${routine.name}: ${item.title}`,
      reminderTime,
      reminderDays: routine.patternDays,
      isActive: routine.isActive,
    });
  }

  /**
   * Get habits that need their streaks reset
   * @returns Array of habits to reset
   */
  async getHabitsToReset(): Promise<HabitWithDetails[]> {
    return this.habitRepository.getHabitsToReset();
  }

  /**
   * Reset streaks for specified habits
   * @param habitIds - Array of habit IDs
   */
  async resetHabitStreaks(habitIds: number[]): Promise<void> {
    if (habitIds.length === 0) {return;}
    await this.habitRepository.resetStreaks(habitIds);
  }
}
