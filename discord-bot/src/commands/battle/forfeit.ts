/**
 * Battle forfeit handler — forfeit the current battle.
 */

import type { ChatInputCommandInteraction } from 'discord.js';
import { EmbedColor } from '../../constants/colors.js';
import { createEmbed } from '../../presenters/base.presenter.js';
import * as battleService from '../../services/battle.service.js';
import { requireAdventureThread } from '../adventure/thread-guard.js';

export async function handleForfeit(interaction: ChatInputCommandInteraction): Promise<void> {
  const adventure = await requireAdventureThread(interaction);
  if (!adventure) { return; }

  await interaction.deferReply();

  const result = await battleService.forfeitBattle({
    adventureId: adventure.id,
    discordUserId: interaction.user.id,
    message: '',
  });

  const embed = createEmbed(EmbedColor.BATTLE)
    .setTitle('Battle Forfeited')
    .setDescription(result.message ?? 'Battle forfeited.');

  await interaction.editReply({ embeds: [embed] });
}
