/**
 * Battle win-condition handler — set the KO count needed to win.
 */

import type { ChatInputCommandInteraction } from 'discord.js';
import { EmbedColor } from '../../constants/colors.js';
import { createEmbed } from '../../presenters/base.presenter.js';
import * as battleService from '../../services/battle.service.js';
import { requireAdventureThread } from '../adventure/thread-guard.js';

export async function handleWinCondition(interaction: ChatInputCommandInteraction): Promise<void> {
  const adventure = await requireAdventureThread(interaction);
  if (!adventure) { return; }

  const count = interaction.options.getInteger('count', true);

  await interaction.deferReply();

  const result = await battleService.setWinCondition({
    adventureId: adventure.id,
    discordUserId: interaction.user.id,
    count,
  });

  const embed = createEmbed(EmbedColor.BATTLE)
    .setTitle('Win Condition Set')
    .setDescription(result.message ?? `Win condition set to ${count} knockouts.`);

  await interaction.editReply({ embeds: [embed] });
}
