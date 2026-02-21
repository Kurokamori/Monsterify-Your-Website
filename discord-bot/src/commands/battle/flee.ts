/**
 * Battle flee handler — flee from the current battle.
 */

import type { ChatInputCommandInteraction } from 'discord.js';
import { EmbedColor } from '../../constants/colors.js';
import { createEmbed } from '../../presenters/base.presenter.js';
import * as battleService from '../../services/battle.service.js';
import { requireAdventureThread } from '../adventure/thread-guard.js';

export async function handleFlee(interaction: ChatInputCommandInteraction): Promise<void> {
  const adventure = await requireAdventureThread(interaction);
  if (!adventure) { return; }

  await interaction.deferReply();

  const result = await battleService.fleeBattle({
    adventureId: adventure.id,
    discordUserId: interaction.user.id,
    message: '',
  });

  const embed = createEmbed(EmbedColor.SUCCESS)
    .setTitle('Fled from Battle!')
    .setDescription(result.message ?? 'Successfully fled from battle!');

  await interaction.editReply({ embeds: [embed] });
}
