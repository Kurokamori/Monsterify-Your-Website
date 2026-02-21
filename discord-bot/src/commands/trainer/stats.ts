/**
 * /trainer stats <name> — show trainer statistics.
 */

import type { ChatInputCommandInteraction } from 'discord.js';
import { requireContext } from '../../middleware/index.js';
import { NotFoundError } from '../../middleware/error.middleware.js';
import { findTrainerByName } from '../../services/trainer.service.js';
import { trainerStatsEmbed } from '../../presenters/trainer.presenter.js';
import { trainerPageUrl } from '../../presenters/base.presenter.js';
import { createActionRow, createLinkButton } from '../../presenters/components/buttons.js';

export async function handleStats(interaction: ChatInputCommandInteraction): Promise<void> {
  const ctx = requireContext(interaction);
  const name = interaction.options.getString('name', true);

  const trainer = await findTrainerByName(ctx.discordId, name);
  if (!trainer) {
    throw new NotFoundError(`Trainer "${name}" not found. Check the name and try again`);
  }

  const embed = trainerStatsEmbed(trainer);

  const components = [
    createActionRow(
      createLinkButton(trainerPageUrl(trainer.id), 'Full Profile', '🌐'),
    ),
  ];

  await interaction.reply({ embeds: [embed], components });
}
