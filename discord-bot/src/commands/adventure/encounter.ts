/**
 * Adventure encounter handler — generates a random encounter in an adventure thread.
 */

import type { ChatInputCommandInteraction } from 'discord.js';
import { encounterEmbed, encounterInstructions } from '../../presenters/adventure.presenter.js';
import * as adventureService from '../../services/adventure.service.js';
import { requireAdventureThread } from './thread-guard.js';

export async function handleEncounter(interaction: ChatInputCommandInteraction): Promise<void> {
  const adventure = await requireAdventureThread(interaction);
  if (!adventure) { return; }

  await interaction.deferReply();

  const encounter = await adventureService.generateEncounter({
    adventureId: adventure.id,
    discordUserId: interaction.user.id,
  });

  const embed = encounterEmbed(encounter);
  const instructions = encounterInstructions(encounter.encounterType);

  await interaction.editReply({
    embeds: [embed],
    content: instructions,
  });
}
