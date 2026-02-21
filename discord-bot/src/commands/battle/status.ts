/**
 * Battle status handler — view current battle status with health bars.
 */

import type { ChatInputCommandInteraction } from 'discord.js';
import { EmbedColor } from '../../constants/colors.js';
import { createEmbed } from '../../presenters/base.presenter.js';
import * as battleService from '../../services/battle.service.js';
import { requireAdventureThread } from '../adventure/thread-guard.js';

export async function handleStatus(interaction: ChatInputCommandInteraction): Promise<void> {
  const adventure = await requireAdventureThread(interaction);
  if (!adventure) { return; }

  await interaction.deferReply();

  const status = await battleService.getBattleStatus(adventure.id);

  const embed = createEmbed(EmbedColor.BATTLE)
    .setTitle('Battle Status')
    .setDescription(status.message ?? 'No active battle found.');

  await interaction.editReply({ embeds: [embed] });
}
