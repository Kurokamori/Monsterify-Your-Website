import axios from 'axios';
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

// ============================================================================
// Bridge configuration
// ============================================================================

const BRIDGE_BASE_URL = process.env.DISCORD_BOT_BRIDGE_URL
  ?? `http://localhost:${process.env.DISCORD_BOT_HTTP_PORT ?? '3001'}`;

// Reminder embed colors
const REMINDER_COLORS = {
  task: 0x3498db,      // blue
  habit: 0x2ecc71,     // green
  routine_item: 0xe67e22, // orange
} as const;

// Button style types for the bridge
type BridgeButtonStyle = 'primary' | 'secondary' | 'success' | 'danger';

type BridgeButton = {
  customId: string;
  label: string;
  style: BridgeButtonStyle;
  emoji?: string;
};

type BridgeEmbed = {
  title: string;
  description: string;
  color: number;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
  footer?: { text: string };
};

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
   * Build the embed and buttons for a reminder DM
   */
  private buildReminderMessage(reminder: ReminderWithUserDetails, extraFields?: Array<{ name: string; value: string; inline?: boolean }>): {
    embed: BridgeEmbed;
    buttons: BridgeButton[];
  } {
    const typeLabel = reminder.itemType === 'routine_item' ? 'Routine Item' : reminder.itemType.charAt(0).toUpperCase() + reminder.itemType.slice(1);
    const actionVerb = reminder.itemType === 'task' ? 'complete your task' : reminder.itemType === 'habit' ? 'track your habit' : 'complete your routine item';

    const embed: BridgeEmbed = {
      title: `${typeLabel} Reminder: ${reminder.title}`,
      description: `Don't forget to ${actionVerb}!`,
      color: REMINDER_COLORS[reminder.itemType] ?? 0x5865f2,
      fields: extraFields,
      footer: { text: `Reminder for ${typeLabel} #${reminder.itemId}` },
    };

    const itemId = reminder.itemId ?? 0;
    const completeId = reminder.itemType === 'task'
      ? `schedule_complete_task_${itemId}`
      : reminder.itemType === 'habit'
        ? `schedule_complete_habit_${itemId}`
        : `schedule_complete_routine_item_${itemId}`;

    const deleteId = reminder.itemType === 'task'
      ? `schedule_delete_task_${itemId}`
      : reminder.itemType === 'habit'
        ? `schedule_delete_habit_${itemId}`
        : `schedule_delete_routine_item_${itemId}`;

    const itemTypeShort = reminder.itemType === 'routine_item' ? 'routine_item' : reminder.itemType;

    const buttons: BridgeButton[] = [
      { customId: completeId, label: 'Complete', style: 'success', emoji: '✅' },
      { customId: `schedule_snooze_15m_${itemTypeShort}_${itemId}`, label: '15 min', style: 'secondary', emoji: '⏰' },
      { customId: `schedule_snooze_1hr_${itemTypeShort}_${itemId}`, label: '1 hour', style: 'secondary', emoji: '🕐' },
      { customId: deleteId, label: 'Delete', style: 'danger', emoji: '🗑️' },
    ];

    return { embed, buttons };
  }

  /**
   * Send a Discord reminder DM via the bot bridge server
   */
  async sendDiscordReminder(reminder: ReminderWithUserDetails): Promise<void> {
    if (!reminder.userDiscordId) {
      console.warn(`Skipping reminder ${reminder.id}: no Discord ID`);
      return;
    }

    try {
      // Fetch extra context for habits (streak info)
      let extraFields: Array<{ name: string; value: string; inline?: boolean }> | undefined;

      if (reminder.itemType === 'habit' && reminder.itemId) {
        const habit = await this.habitRepository.findById(reminder.itemId);
        if (habit) {
          extraFields = [
            { name: 'Current Streak', value: `${habit.streak} day${habit.streak !== 1 ? 's' : ''} 🔥`, inline: true },
            { name: 'Best Streak', value: `${habit.bestStreak} day${habit.bestStreak !== 1 ? 's' : ''}`, inline: true },
          ];
        }
      }

      const { embed, buttons } = this.buildReminderMessage(reminder, extraFields);

      await axios.post(`${BRIDGE_BASE_URL}/send-dm`, {
        discordId: reminder.userDiscordId,
        embed,
        buttons,
      }, { timeout: 10000 });

      console.log(`Sent reminder DM to ${reminder.userDiscordId}: ${reminder.title}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`Error sending Discord reminder ${reminder.id}:`, msg);
      throw error;
    }
  }

  /**
   * Send a reminder DM for a specific item (used by admin "Remind Me Now")
   */
  async sendImmediateReminder(itemType: ReminderItemType, itemId: number, discordId: string): Promise<void> {
    let title = 'Unknown';
    let extraFields: Array<{ name: string; value: string; inline?: boolean }> | undefined;

    if (itemType === 'task') {
      const task = await this.taskRepository.findById(itemId);
      if (!task) { throw new Error('Task not found'); }
      title = task.title;
    } else if (itemType === 'habit') {
      const habit = await this.habitRepository.findById(itemId);
      if (!habit) { throw new Error('Habit not found'); }
      title = habit.title;
      extraFields = [
        { name: 'Current Streak', value: `${habit.streak} day${habit.streak !== 1 ? 's' : ''} 🔥`, inline: true },
        { name: 'Best Streak', value: `${habit.bestStreak} day${habit.bestStreak !== 1 ? 's' : ''}`, inline: true },
      ];
    } else if (itemType === 'routine_item') {
      // Find routine item title by checking all user routines
      const reminder = await this.reminderRepository.findByItemTypeAndId('routine_item', itemId);
      title = reminder[0]?.title ?? 'Routine Item';
    }

    const fakeReminder: ReminderWithUserDetails = {
      id: 0,
      userId: 0,
      discordId,
      itemType,
      itemId,
      title,
      reminderTime: '',
      reminderDays: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      userDiscordId: discordId,
    };

    const { embed, buttons } = this.buildReminderMessage(fakeReminder, extraFields);

    await axios.post(`${BRIDGE_BASE_URL}/send-dm`, {
      discordId,
      embed,
      buttons,
    }, { timeout: 10000 });

    console.log(`Sent immediate reminder DM to ${discordId}: ${title}`);
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
   * Send streak reset notification via Discord DM
   */
  async sendStreakResetNotification(habit: HabitWithDetails): Promise<void> {
    // Look up the user's Discord ID from the reminder
    const reminder = await this.reminderRepository.findByUserAndItem(habit.userId, 'habit', habit.id);
    const discordId = reminder?.discordId;

    if (!discordId) {
      console.log(`Streak reset notification for habit ${habit.id}: ${habit.title} (was ${habit.streak} days) - no Discord ID`);
      return;
    }

    try {
      const embed: BridgeEmbed = {
        title: `Streak Reset: ${habit.title}`,
        description: `Your **${habit.streak}-day** streak for "${habit.title}" has been reset. Don't give up - start a new streak today!`,
        color: 0xfee75c, // warning yellow
        fields: [
          { name: 'Best Streak', value: `${habit.bestStreak} day${habit.bestStreak !== 1 ? 's' : ''}`, inline: true },
          { name: 'Frequency', value: habit.frequency === 'daily' ? 'Daily' : 'Weekly', inline: true },
        ],
      };

      await axios.post(`${BRIDGE_BASE_URL}/send-dm`, {
        discordId,
        embed,
        buttons: [
          { customId: `schedule_complete_habit_${habit.id}`, label: 'Track Now', style: 'success', emoji: '✅' },
        ],
      }, { timeout: 10000 });

      console.log(`Sent streak reset notification to ${discordId}: ${habit.title}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`Error sending streak reset notification for habit ${habit.id}:`, msg);
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
      isActive: !!routine.isActive,
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
