/**
 * Battle result handler — resolve/end the battle and calculate rewards.
 */

import type { ChatInputCommandInteraction } from 'discord.js';
import { EmbedColor } from '../../constants/colors.js';
import { createEmbed } from '../../presenters/base.presenter.js';
import * as battleService from '../../services/battle.service.js';
import { requireAdventureThread } from '../adventure/thread-guard.js';

export async function handleResult(interaction: ChatInputCommandInteraction): Promise<void> {
  const adventure = await requireAdventureThread(interaction);
  if (!adventure) { return; }

  await interaction.deferReply();

  const result = await battleService.resolveBattle(adventure.id, interaction.user.id);

  const embed = createEmbed(EmbedColor.SUCCESS)
    .setTitle('Battle Resolved!')
    .setDescription(result.message ?? 'Battle has been resolved.');

  await interaction.editReply({ embeds: [embed] });
}
