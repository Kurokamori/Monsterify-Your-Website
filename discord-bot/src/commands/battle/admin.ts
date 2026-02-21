/**
 * Battle admin handlers — admin-only battle management commands.
 */

import type { ChatInputCommandInteraction } from 'discord.js';
import { EmbedColor } from '../../constants/colors.js';
import { createEmbed, errorEmbed } from '../../presenters/base.presenter.js';
import { formatWeatherName, formatTerrainName } from '../../presenters/adventure.presenter.js';
import { getContext } from '../../middleware/index.js';
import * as battleService from '../../services/battle.service.js';
import { requireAdventureThread } from '../adventure/thread-guard.js';

export async function handleAdmin(interaction: ChatInputCommandInteraction): Promise<void> {
  const ctx = getContext(interaction);
  if (!ctx?.isAdmin) {
    await interaction.reply({
      embeds: [errorEmbed('You do not have permission to use admin battle commands.')],
      ephemeral: true,
    });
    return;
  }

  const adventure = await requireAdventureThread(interaction);
  if (!adventure) { return; }

  const subcommand = interaction.options.getSubcommand();

  await interaction.deferReply();

  switch (subcommand) {
    case 'forcewin': {
      const message = interaction.options.getString('message') ?? '';
      const result = await battleService.forceWinBattle({
        adventureId: adventure.id,
        discordUserId: interaction.user.id,
        message,
      });
      const embed = createEmbed(EmbedColor.BATTLE)
        .setTitle('Battle Force Won')
        .setDescription(result.message ?? 'Battle force won!');
      await interaction.editReply({ embeds: [embed] });
      break;
    }

    case 'forcelose': {
      const message = interaction.options.getString('message') ?? '';
      const result = await battleService.forceLoseBattle({
        adventureId: adventure.id,
        discordUserId: interaction.user.id,
        message,
      });
      const embed = createEmbed(EmbedColor.BATTLE)
        .setTitle('Battle Force Lost')
        .setDescription(result.message ?? 'Battle force lost!');
      await interaction.editReply({ embeds: [embed] });
      break;
    }

    case 'set-weather': {
      const weather = interaction.options.getString('weather', true);
      const result = await battleService.setBattleWeather({
        adventureId: adventure.id,
        discordUserId: interaction.user.id,
        weather,
      });
      const embed = createEmbed(EmbedColor.BATTLE)
        .setTitle('Weather Changed')
        .setDescription(result.message ?? `Weather set to ${formatWeatherName(weather)}.`);
      await interaction.editReply({ embeds: [embed] });
      break;
    }

    case 'set-terrain': {
      const terrain = interaction.options.getString('terrain', true);
      const result = await battleService.setBattleTerrain({
        adventureId: adventure.id,
        discordUserId: interaction.user.id,
        terrain,
      });
      const embed = createEmbed(EmbedColor.BATTLE)
        .setTitle('Terrain Changed')
        .setDescription(result.message ?? `Terrain set to ${formatTerrainName(terrain)}.`);
      await interaction.editReply({ embeds: [embed] });
      break;
    }

    default:
      await interaction.editReply({
        embeds: [errorEmbed(`Unknown admin subcommand: ${subcommand}`)],
      });
  }
}
