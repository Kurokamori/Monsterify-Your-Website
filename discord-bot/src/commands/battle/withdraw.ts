/**
 * Battle withdraw handler — recall a monster from the battlefield.
 */

import type { ChatInputCommandInteraction } from 'discord.js';
import { EmbedColor } from '../../constants/colors.js';
import { createEmbed } from '../../presenters/base.presenter.js';
import * as battleService from '../../services/battle.service.js';
import { requireAdventureThread } from '../adventure/thread-guard.js';

export async function handleWithdraw(interaction: ChatInputCommandInteraction): Promise<void> {
  const adventure = await requireAdventureThread(interaction);
  if (!adventure) { return; }

  const monster = interaction.options.getString('monster', true);

  await interaction.deferReply();

  const result = await battleService.withdrawMonster({
    adventureId: adventure.id,
    discordUserId: interaction.user.id,
    monsterName: monster,
    monsterIndex: 0,
    message: '',
  });

  const embed = createEmbed(EmbedColor.BATTLE)
    .setTitle('Monster Withdrawn!')
    .setDescription(result.message ?? 'Monster recalled!');

  await interaction.editReply({ embeds: [embed] });
}
