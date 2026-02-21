/**
 * Battle attack handler — execute an attack in the current battle.
 */

import type { ChatInputCommandInteraction } from 'discord.js';
import { EmbedColor } from '../../constants/colors.js';
import { createEmbed } from '../../presenters/base.presenter.js';
import * as battleService from '../../services/battle.service.js';
import { requireAdventureThread } from '../adventure/thread-guard.js';

export async function handleAttack(interaction: ChatInputCommandInteraction): Promise<void> {
  const adventure = await requireAdventureThread(interaction);
  if (!adventure) { return; }

  const monster = interaction.options.getString('monster', true);
  const attack = interaction.options.getString('attack', true);
  const target = interaction.options.getString('target');

  await interaction.deferReply();

  const result = await battleService.executeAttack({
    adventureId: adventure.id,
    discordUserId: interaction.user.id,
    moveName: attack,
    attackerName: monster,
    targetName: target ?? '',
    message: '',
  });

  const embed = createEmbed(EmbedColor.BATTLE)
    .setTitle('Attack!')
    .setDescription(result.message ?? 'Attack executed!');

  await interaction.editReply({ embeds: [embed] });
}
