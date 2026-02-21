/**
 * /monster command module — monster management and lookup.
 *
 * Subcommands:
 *   view   — View a monster's details (paginated if multiple matches)
 *   rename — Rename one of your monsters
 */

import { SlashCommandBuilder } from 'discord.js';
import type { Command, ButtonHandler } from '../../types/command.types.js';
import { errorHandler, requireAuth, cooldowns } from '../../middleware/index.js';
import { requireContext } from '../../middleware/auth.middleware.js';
import { searchMonstersByName, getMonstersByUserId } from '../../services/monster.service.js';
import { monsterDetailView, MONSTER_DETAIL_PAGE } from '../../presenters/monster.presenter.js';
import { resolvePageFromButton } from '../../presenters/components/pagination.js';
import { getUserByDiscordId } from '../../services/account.service.js';
import { handleMonsterView } from './view.js';
import { handleMonsterRename } from './rename.js';

// ============================================================================
// Slash command definition
// ============================================================================

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('monster')
    .setDescription('View and manage your monsters')
    .addSubcommand((sub) =>
      sub
        .setName('view')
        .setDescription('View a monster\'s details')
        .addStringOption((opt) =>
          opt.setName('name').setDescription('Monster name').setRequired(true).setAutocomplete(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('rename')
        .setDescription('Rename one of your monsters')
        .addStringOption((opt) =>
          opt.setName('name').setDescription('Current monster name').setRequired(true).setAutocomplete(true),
        )
        .addStringOption((opt) =>
          opt.setName('new_name').setDescription('New name for the monster').setRequired(true),
        ),
    ) as SlashCommandBuilder,

  middleware: [errorHandler, requireAuth, cooldowns.info()],

  meta: {
    name: 'monster',
    description: 'View monster details and rename your monsters.',
    category: 'Monster',
    usage: '/monster view <name> | /monster rename <name> <new_name>',
    examples: [
      '/monster view name:Sparky',
      '/monster rename name:Sparky new_name:Thunder',
    ],
  },

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'view':
        await handleMonsterView(interaction);
        break;
      case 'rename':
        await handleMonsterRename(interaction);
        break;
      default:
        await interaction.reply({ content: `Unknown subcommand: ${subcommand}`, ephemeral: true });
    }
  },

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused(true);
    if (focused.name !== 'name') {
      return;
    }

    const ctx = requireContext(interaction as never);
    if (!ctx) {
      await interaction.respond([]);
      return;
    }

    const monsters = await searchMonstersByName(ctx.discordId, focused.value, 25);
    await interaction.respond(
      monsters.map((m) => ({
        name: `${m.name} (Lv. ${m.level} ${m.species1})`,
        value: m.name,
      })),
    );
  },
};

// ============================================================================
// Button handlers — monster detail pagination
// ============================================================================

/**
 * Monster detail view pagination.
 * Re-fetches the user's monsters matching the name from the embed title.
 */
const monsterDetailPaginationHandler: ButtonHandler = {
  customId: new RegExp(`^${MONSTER_DETAIL_PAGE}_(first|prev|next|last)$`),

  async execute(interaction) {
    const discordId = interaction.user.id;
    const ctx = await getUserByDiscordId(discordId);
    if (!ctx) {
      await interaction.reply({ content: 'Account not linked.', ephemeral: true });
      return;
    }

    // Parse current page from footer
    const footer = interaction.message.embeds[0]?.footer?.text ?? '';
    const pageMatch = footer.match(/Monster (\d+) of (\d+)/);
    const currentPage = pageMatch ? parseInt(pageMatch[1] ?? '1', 10) : 1;
    const totalPages = pageMatch ? parseInt(pageMatch[2] ?? '1', 10) : 1;

    const newPage = resolvePageFromButton(interaction.customId, MONSTER_DETAIL_PAGE, currentPage, totalPages);
    if (newPage === null) {
      return;
    }

    // Extract monster name from title "👾 <name> [indicators]"
    const title = interaction.message.embeds[0]?.title ?? '';
    // Remove emoji prefix and trailing trait indicator emojis
    const namePart = title
      .replace(/^👾\s*/u, '')
      .replace(/\s*(?:✨|🔺|🌑|⚡|🦠)+$/u, '')
      .trim();

    const allMonsters = await getMonstersByUserId(ctx.discordId);
    const lower = namePart.toLowerCase();
    const matches = allMonsters.filter((m) => m.name.toLowerCase() === lower);

    if (matches.length === 0) {
      await interaction.reply({ content: 'Monsters not found.', ephemeral: true });
      return;
    }

    const result = monsterDetailView(matches, newPage);
    await interaction.update({ embeds: [result.embed], components: result.components });
  },
};

export const buttons: ButtonHandler[] = [
  monsterDetailPaginationHandler,
];
