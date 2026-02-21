/**
 * /trainer view <name> — show a simple trainer profile.
 *
 * Displays the trainer's info with a link to the full website profile.
 */

import type { ChatInputCommandInteraction } from 'discord.js';
import { requireContext } from '../../middleware/index.js';
import { NotFoundError } from '../../middleware/error.middleware.js';
import { findTrainerByName } from '../../services/trainer.service.js';
import { trainerDetailEmbed } from '../../presenters/trainer.presenter.js';
import { trainerPageUrl } from '../../presenters/base.presenter.js';
import { createActionRow, createLinkButton } from '../../presenters/components/buttons.js';

export async function handleView(interaction: ChatInputCommandInteraction): Promise<void> {
  const ctx = requireContext(interaction);
  const name = interaction.options.getString('name', true);

  const trainer = await findTrainerByName(ctx.discordId, name);
  if (!trainer) {
    throw new NotFoundError(`Trainer "${name}" not found. Check the name and try again`);
  }

  const embed = trainerDetailEmbed(trainer);

  const components = [
    createActionRow(
      createLinkButton(trainerPageUrl(trainer.id), 'Full Profile', '🌐'),
    ),
  ];

  await interaction.reply({ embeds: [embed], components });
}
