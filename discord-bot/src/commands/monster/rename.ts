/**
 * /monster rename <name> <new_name> — rename a monster.
 *
 * Validates the new name and updates it via the backend API.
 */

import type { ChatInputCommandInteraction } from 'discord.js';
import { requireContext } from '../../middleware/index.js';
import { NotFoundError, ValidationError } from '../../middleware/error.middleware.js';
import { findMonsterByName, updateMonster } from '../../services/monster.service.js';
import { monsterRenameSuccessEmbed } from '../../presenters/monster.presenter.js';
import { monsterPageUrl } from '../../presenters/base.presenter.js';
import { createActionRow, createLinkButton } from '../../presenters/components/buttons.js';

const MAX_NAME_LENGTH = 50;

export async function handleMonsterRename(interaction: ChatInputCommandInteraction): Promise<void> {
  const ctx = requireContext(interaction);
  const currentName = interaction.options.getString('name', true);
  const newName = interaction.options.getString('new_name', true).trim();

  // Validate new name
  if (newName.length === 0) {
    throw new ValidationError('The new name cannot be empty.');
  }
  if (newName.length > MAX_NAME_LENGTH) {
    throw new ValidationError(`Name must be ${MAX_NAME_LENGTH} characters or fewer (got ${newName.length}).`);
  }

  // Find the monster
  const monster = await findMonsterByName(ctx.discordId, currentName);
  if (!monster) {
    throw new NotFoundError(`Monster "${currentName}" not found. Check the name and try again`);
  }

  // Update the name
  const updated = await updateMonster(
    monster.id,
    { name: newName },
    ctx.discordId,
  );

  const embed = monsterRenameSuccessEmbed(currentName, newName, updated);

  const components = [
    createActionRow(
      createLinkButton(monsterPageUrl(updated.id), 'View on Website', '🌐'),
    ),
  ];

  await interaction.reply({ embeds: [embed], components });
}
