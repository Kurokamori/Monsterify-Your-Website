/**
 * /monster view <name> — show monster details in a paginated embed.
 *
 * If the user has multiple monsters with the same name, all are shown
 * with pagination. Includes a link to the full website profile.
 */

import type { ChatInputCommandInteraction } from 'discord.js';
import { requireContext } from '../../middleware/index.js';
import { NotFoundError } from '../../middleware/error.middleware.js';
import { getMonstersByUserId } from '../../services/monster.service.js';
import { monsterDetailView } from '../../presenters/monster.presenter.js';

export async function handleMonsterView(interaction: ChatInputCommandInteraction): Promise<void> {
  const ctx = requireContext(interaction);
  const name = interaction.options.getString('name', true);

  const allMonsters = await getMonstersByUserId(ctx.discordId);
  const lower = name.toLowerCase();
  const matches = allMonsters.filter((m) => m.name.toLowerCase() === lower);

  if (matches.length === 0) {
    throw new NotFoundError(`Monster "${name}" not found. Check the name and try again`);
  }

  const { embed, components } = monsterDetailView(matches, 1);

  await interaction.reply({ embeds: [embed], components });
}
