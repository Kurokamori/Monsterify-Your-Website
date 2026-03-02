/**
 * Schedule reminder button handlers.
 *
 * These handlers process button interactions from DM reminder messages.
 * Buttons use custom IDs like `schedule_complete_task_123` where 123 is the item ID.
 */

import { EmbedBuilder, type ButtonInteraction } from 'discord.js';
import { AxiosError } from 'axios';
import type { ButtonHandler } from '../../types/command.types.js';
import { EmbedColor } from '../../constants/colors.js';
import { SCHEDULE } from '../../constants/button-ids.js';
import {
  completeTask,
  trackHabit,
  completeRoutineItem,
  deleteTask,
  deleteHabit,
  deleteRoutineItem,
} from '../../services/schedule.service.js';

// ============================================================================
// Helpers
// ============================================================================

function extractId(customId: string, prefix: string): number | null {
  const match = customId.match(new RegExp(`^${prefix}_(\\d+)$`));
  return match?.[1] ? parseInt(match[1], 10) : null;
}

/** Extract a human-readable error message from an axios error or generic error. */
function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof AxiosError && err.response?.data) {
    const data = err.response.data as { message?: string };
    if (data.message) { return data.message; }
  }
  if (err instanceof Error) { return err.message; }
  return fallback;
}

function extractSnoozeInfo(customId: string): { minutes: number; type: string; id: number } | null {
  const match = customId.match(/^schedule_snooze_(\d+[mh])_(\w+)_(\d+)$/);
  if (!match) { return null; }

  const duration = match[1];
  const type = match[2];
  const idStr = match[3];
  if (!duration || !type || !idStr) { return null; }

  const minutes = duration.endsWith('h')
    ? parseInt(duration, 10) * 60
    : parseInt(duration, 10);

  return { minutes, type, id: parseInt(idStr, 10) };
}

async function replySuccess(interaction: ButtonInteraction, embed: EmbedBuilder): Promise<void> {
  await interaction.update({ embeds: [embed], components: [] });
}

async function replyError(interaction: ButtonInteraction, message: string): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(EmbedColor.ERROR)
    .setTitle('Error')
    .setDescription(message);

  if (interaction.replied || interaction.deferred) {
    await interaction.editReply({ embeds: [embed], components: [] });
  } else {
    await interaction.update({ embeds: [embed], components: [] });
  }
}

// ============================================================================
// Complete Task
// ============================================================================

const completeTaskHandler: ButtonHandler = {
  customId: new RegExp(`^${SCHEDULE.COMPLETE_TASK}_(\\d+)$`),

  async execute(interaction: ButtonInteraction): Promise<void> {
    const taskId = extractId(interaction.customId, SCHEDULE.COMPLETE_TASK);
    if (!taskId) {
      await replyError(interaction, 'Invalid task ID.');
      return;
    }

    try {
      const result = await completeTask(interaction.user.id, taskId);

      if (!result.success) {
        await replyError(interaction, result.message ?? 'Failed to complete task.');
        return;
      }

      const embed = new EmbedBuilder()
        .setColor(EmbedColor.SUCCESS)
        .setTitle('Task Completed!')
        .setDescription(`Great job completing your task!`)
        .setTimestamp();

      if (result.data?.rewards) {
        const r = result.data.rewards;
        embed.addFields({
          name: 'Rewards',
          value: `**${r.trainerName}** received **${r.levels} levels** and **${r.coins} coins**!`,
        });
      }

      await replySuccess(interaction, embed);
    } catch (err) {
      console.error('Error completing task from DM:', err);
      await replyError(interaction, getErrorMessage(err, 'Something went wrong while completing the task.'));
    }
  },
};

// ============================================================================
// Complete Habit (Track)
// ============================================================================

const completeHabitHandler: ButtonHandler = {
  customId: new RegExp(`^${SCHEDULE.COMPLETE_HABIT}_(\\d+)$`),

  async execute(interaction: ButtonInteraction): Promise<void> {
    const habitId = extractId(interaction.customId, SCHEDULE.COMPLETE_HABIT);
    if (!habitId) {
      await replyError(interaction, 'Invalid habit ID.');
      return;
    }

    try {
      const result = await trackHabit(interaction.user.id, habitId);

      if (!result.success) {
        await replyError(interaction, result.message ?? 'Failed to track habit.');
        return;
      }

      const habit = result.data?.habit;
      const embed = new EmbedBuilder()
        .setColor(EmbedColor.SUCCESS)
        .setTitle('Habit Tracked!')
        .setDescription(`Great job keeping up your habit!`)
        .setTimestamp();

      if (habit) {
        embed.addFields(
          { name: 'Current Streak', value: `${habit.streak} day${habit.streak !== 1 ? 's' : ''} 🔥`, inline: true },
          { name: 'Best Streak', value: `${habit.bestStreak} day${habit.bestStreak !== 1 ? 's' : ''}`, inline: true },
        );
      }

      if (result.data?.rewards) {
        const r = result.data.rewards;
        embed.addFields({
          name: 'Rewards',
          value: `**${r.trainerName}** received **${r.levels} levels** and **${r.coins} coins**!`,
        });
      }

      await replySuccess(interaction, embed);
    } catch (err) {
      console.error('Error tracking habit from DM:', err);
      await replyError(interaction, getErrorMessage(err, 'Something went wrong while tracking the habit.'));
    }
  },
};

// ============================================================================
// Complete Routine Item
// ============================================================================

const completeRoutineItemHandler: ButtonHandler = {
  customId: new RegExp(`^${SCHEDULE.COMPLETE_ROUTINE_ITEM}_(\\d+)$`),

  async execute(interaction: ButtonInteraction): Promise<void> {
    const itemId = extractId(interaction.customId, SCHEDULE.COMPLETE_ROUTINE_ITEM);
    if (!itemId) {
      await replyError(interaction, 'Invalid routine item ID.');
      return;
    }

    try {
      const result = await completeRoutineItem(interaction.user.id, itemId);

      if (!result.success) {
        await replyError(interaction, result.message ?? 'Failed to complete routine item.');
        return;
      }

      const embed = new EmbedBuilder()
        .setColor(EmbedColor.SUCCESS)
        .setTitle('Routine Item Completed!')
        .setDescription(`Nice work completing your routine item!`)
        .setTimestamp();

      if (result.data?.rewards) {
        const r = result.data.rewards;
        embed.addFields({
          name: 'Rewards',
          value: `**${r.trainerName}** received **${r.levels} levels** and **${r.coins} coins**!`,
        });
      }

      await replySuccess(interaction, embed);
    } catch (err) {
      console.error('Error completing routine item from DM:', err);
      await replyError(interaction, getErrorMessage(err, 'Something went wrong while completing the routine item.'));
    }
  },
};

// ============================================================================
// Snooze (15 minutes or 1 hour)
// ============================================================================

async function handleSnooze(interaction: ButtonInteraction, delayMs: number, delayLabel: string): Promise<void> {
  const info = extractSnoozeInfo(interaction.customId);
  if (!info) {
    await replyError(interaction, 'Invalid snooze data.');
    return;
  }

  // Store the original message data for re-sending
  const originalEmbed = interaction.message.embeds[0];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const originalComponentsRaw = (interaction.message as any).components;

  const embed = new EmbedBuilder()
    .setColor(EmbedColor.WARNING)
    .setTitle('Reminder Snoozed')
    .setDescription(`I'll remind you again in **${delayLabel}**!`)
    .setTimestamp();

  await replySuccess(interaction, embed);

  // Re-send the reminder after the snooze delay
  setTimeout(async () => {
    try {
      const user = await interaction.client.users.fetch(interaction.user.id);
      if (originalEmbed) {
        const resendEmbed = EmbedBuilder.from(originalEmbed);
        resendEmbed.setFooter({ text: 'Snoozed reminder' });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const messagePayload: any = { embeds: [resendEmbed] };

        // Re-attach the original action row buttons if available
        if (originalComponentsRaw && Array.isArray(originalComponentsRaw)) {
          messagePayload.components = originalComponentsRaw.map(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (row: any) => row.toJSON?.() ?? row,
          );
        }

        await user.send(messagePayload);
      }
    } catch (err) {
      console.error('Error re-sending snoozed reminder:', err);
    }
  }, delayMs);
}

const snooze15mHandler: ButtonHandler = {
  customId: new RegExp(`^${SCHEDULE.SNOOZE_15M}_(\\w+)_(\\d+)$`),
  async execute(interaction: ButtonInteraction): Promise<void> {
    await handleSnooze(interaction, 15 * 60 * 1000, '15 minutes');
  },
};

const snooze1hrHandler: ButtonHandler = {
  customId: new RegExp(`^${SCHEDULE.SNOOZE_1HR}_(\\w+)_(\\d+)$`),
  async execute(interaction: ButtonInteraction): Promise<void> {
    await handleSnooze(interaction, 60 * 60 * 1000, '1 hour');
  },
};

// ============================================================================
// Delete Task
// ============================================================================

const deleteTaskHandler: ButtonHandler = {
  customId: new RegExp(`^${SCHEDULE.DELETE_TASK}_(\\d+)$`),

  async execute(interaction: ButtonInteraction): Promise<void> {
    const taskId = extractId(interaction.customId, SCHEDULE.DELETE_TASK);
    if (!taskId) {
      await replyError(interaction, 'Invalid task ID.');
      return;
    }

    try {
      const result = await deleteTask(interaction.user.id, taskId);

      if (!result.success) {
        await replyError(interaction, result.message ?? 'Failed to delete task.');
        return;
      }

      const embed = new EmbedBuilder()
        .setColor(EmbedColor.INFO)
        .setTitle('Task Deleted')
        .setDescription('The task has been deleted.')
        .setTimestamp();

      await replySuccess(interaction, embed);
    } catch (err) {
      console.error('Error deleting task from DM:', err);
      await replyError(interaction, getErrorMessage(err, 'Something went wrong while deleting the task.'));
    }
  },
};

// ============================================================================
// Delete Habit
// ============================================================================

const deleteHabitHandler: ButtonHandler = {
  customId: new RegExp(`^${SCHEDULE.DELETE_HABIT}_(\\d+)$`),

  async execute(interaction: ButtonInteraction): Promise<void> {
    const habitId = extractId(interaction.customId, SCHEDULE.DELETE_HABIT);
    if (!habitId) {
      await replyError(interaction, 'Invalid habit ID.');
      return;
    }

    try {
      const result = await deleteHabit(interaction.user.id, habitId);

      if (!result.success) {
        await replyError(interaction, result.message ?? 'Failed to delete habit.');
        return;
      }

      const embed = new EmbedBuilder()
        .setColor(EmbedColor.INFO)
        .setTitle('Habit Deleted')
        .setDescription('The habit has been deleted.')
        .setTimestamp();

      await replySuccess(interaction, embed);
    } catch (err) {
      console.error('Error deleting habit from DM:', err);
      await replyError(interaction, getErrorMessage(err, 'Something went wrong while deleting the habit.'));
    }
  },
};

// ============================================================================
// Delete Routine Item
// ============================================================================

const deleteRoutineItemHandler: ButtonHandler = {
  customId: new RegExp(`^${SCHEDULE.DELETE_ROUTINE_ITEM}_(\\d+)$`),

  async execute(interaction: ButtonInteraction): Promise<void> {
    const itemId = extractId(interaction.customId, SCHEDULE.DELETE_ROUTINE_ITEM);
    if (!itemId) {
      await replyError(interaction, 'Invalid routine item ID.');
      return;
    }

    try {
      const result = await deleteRoutineItem(interaction.user.id, itemId);

      if (!result.success) {
        await replyError(interaction, result.message ?? 'Failed to delete routine item.');
        return;
      }

      const embed = new EmbedBuilder()
        .setColor(EmbedColor.INFO)
        .setTitle('Routine Item Deleted')
        .setDescription('The routine item has been deleted.')
        .setTimestamp();

      await replySuccess(interaction, embed);
    } catch (err) {
      console.error('Error deleting routine item from DM:', err);
      await replyError(interaction, getErrorMessage(err, 'Something went wrong while deleting the routine item.'));
    }
  },
};

// ============================================================================
// Exports
// ============================================================================

export const buttons: ButtonHandler[] = [
  completeTaskHandler,
  completeHabitHandler,
  completeRoutineItemHandler,
  snooze15mHandler,
  snooze1hrHandler,
  deleteTaskHandler,
  deleteHabitHandler,
  deleteRoutineItemHandler,
];
