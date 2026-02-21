/**
 * Adventure capture handler — attempts to capture a monster from an active encounter.
 */

import type { ChatInputCommandInteraction } from 'discord.js';
import { captureResultEmbed } from '../../presenters/adventure.presenter.js';
import * as adventureService from '../../services/adventure.service.js';
import { requireAdventureThread } from './thread-guard.js';

export async function handleCapture(interaction: ChatInputCommandInteraction): Promise<void> {
  const adventure = await requireAdventureThread(interaction);
  if (!adventure) { return; }

  const trainerName = interaction.options.getString('trainer', true);
  const pokeballType = interaction.options.getString('pokeball', true);
  const monsterIndex = interaction.options.getInteger('index') ?? 1;
  const pokepuffCount = interaction.options.getInteger('pokepuffs') ?? 0;

  await interaction.deferReply();

  const result = await adventureService.attemptCapture({
    adventureId: adventure.id,
    discordUserId: interaction.user.id,
    trainerName,
    pokeballType,
    pokepuffCount,
    monsterIndex,
    isBattleCapture: false,
  });

  const embed = captureResultEmbed(result);
  await interaction.editReply({ embeds: [embed] });
}
