/**
 * Battle use-item handler — use an item during battle.
 */

import type { ChatInputCommandInteraction } from 'discord.js';
import { EmbedColor } from '../../constants/colors.js';
import { createEmbed } from '../../presenters/base.presenter.js';
import * as battleService from '../../services/battle.service.js';
import { requireAdventureThread } from '../adventure/thread-guard.js';

export async function handleUseItem(interaction: ChatInputCommandInteraction): Promise<void> {
  const adventure = await requireAdventureThread(interaction);
  if (!adventure) { return; }

  const monster = interaction.options.getString('monster', true);
  const item = interaction.options.getString('item', true);

  await interaction.deferReply();

  const result = await battleService.useItem({
    adventureId: adventure.id,
    discordUserId: interaction.user.id,
    itemName: item,
    targetName: monster,
    message: '',
  });

  const embed = createEmbed(EmbedColor.BATTLE)
    .setTitle('Item Used!')
    .setDescription(result.message ?? 'Item used successfully!');

  await interaction.editReply({ embeds: [embed] });
}
