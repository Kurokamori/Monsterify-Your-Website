/**
 * Thread guard — validates the current channel is an active adventure thread.
 *
 * Used by encounter, capture, and end handlers to ensure they only run
 * inside adventure threads.
 */

import type { ChatInputCommandInteraction } from 'discord.js';
import { errorEmbed } from '../../presenters/base.presenter.js';
import * as adventureService from '../../services/adventure.service.js';
import type { Adventure } from '../../services/adventure.service.js';

/**
 * Verify that the interaction is happening inside an active adventure thread.
 *
 * Returns the adventure if valid, or `null` after replying with an error.
 */
export async function requireAdventureThread(
  interaction: ChatInputCommandInteraction,
): Promise<Adventure | null> {
  const channel = interaction.channel;

  if (!channel?.isThread()) {
    await interaction.reply({
      embeds: [errorEmbed('This command can only be used inside an adventure thread.')],
      ephemeral: true,
    });
    return null;
  }

  const adventure = await adventureService.getAdventureByThreadId(channel.id);

  if (!adventure) {
    await interaction.reply({
      embeds: [errorEmbed('This thread is not linked to an adventure.')],
      ephemeral: true,
    });
    return null;
  }

  if (adventure.status !== 'active') {
    await interaction.reply({
      embeds: [errorEmbed(`This adventure is **${adventure.status}** and cannot accept commands.`)],
      ephemeral: true,
    });
    return null;
  }

  return adventure;
}
