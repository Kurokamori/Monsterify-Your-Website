/**
 * /trainer inventory <name> — show a trainer's inventory, paginated by category.
 */

import type { ChatInputCommandInteraction } from 'discord.js';
import { requireContext } from '../../middleware/index.js';
import { NotFoundError } from '../../middleware/error.middleware.js';
import { findTrainerByName, getInventory } from '../../services/trainer.service.js';
import {
  parseInventory,
  trainerInventoryView,
} from '../../presenters/trainer.presenter.js';

export async function handleInventory(interaction: ChatInputCommandInteraction): Promise<void> {
  const ctx = requireContext(interaction);
  const name = interaction.options.getString('name', true);

  const trainer = await findTrainerByName(ctx.discordId, name);
  if (!trainer) {
    throw new NotFoundError(`Trainer "${name}" not found. Check the name and try again`);
  }

  const rawInventory = await getInventory(trainer.id);
  const categories = parseInventory(rawInventory);
  const { embed, components } = trainerInventoryView(trainer.name, categories, 1);

  await interaction.reply({ embeds: [embed], components });
}
