/**
 * Battle start handler — initiate or join a battle in an adventure thread.
 */

import type { ChatInputCommandInteraction } from 'discord.js';
import { EmbedColor } from '../../constants/colors.js';
import { createEmbed } from '../../presenters/base.presenter.js';
import * as battleService from '../../services/battle.service.js';
import { requireAdventureThread } from '../adventure/thread-guard.js';

export async function handleStart(interaction: ChatInputCommandInteraction): Promise<void> {
  const adventure = await requireAdventureThread(interaction);
  if (!adventure) { return; }

  const trainerName = interaction.options.getString('trainer', true);
  const opponent1 = interaction.options.getString('opponent1');
  const opponent2 = interaction.options.getString('opponent2');
  const opponent3 = interaction.options.getString('opponent3');

  const opponents = [opponent1, opponent2, opponent3].filter(Boolean) as string[];

  await interaction.deferReply();

  if (opponents.length > 0) {
    const result = await battleService.initiatePvPBattle({
      adventureId: adventure.id,
      discordUserId: interaction.user.id,
      trainerName,
      opponentTrainers: opponents,
      opponentIds: [],
    });

    const embed = createEmbed(EmbedColor.BATTLE)
      .setTitle('PvP Battle Initiated!')
      .setDescription(result.message ?? 'PvP battle started!');

    await interaction.editReply({ embeds: [embed] });
  } else {
    const result = await battleService.initiateBattle({
      adventureId: adventure.id,
      discordUserId: interaction.user.id,
      trainerName,
    });

    const embed = createEmbed(EmbedColor.BATTLE)
      .setTitle('Battle!')
      .setDescription(result.message ?? 'Battle initiated!');

    await interaction.editReply({ embeds: [embed] });
  }
}
