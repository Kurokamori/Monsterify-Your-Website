/**
 * /trainer command module — trainer management and lookup.
 *
 * Subcommands:
 *   list      — List all trainers for a player
 *   view      — View a trainer's profile
 *   inventory — View a trainer's inventory (paginated by category)
 *   stats     — View a trainer's statistics
 */

import { SlashCommandBuilder } from 'discord.js';
import type { Command, ButtonHandler } from '../../types/command.types.js';
import { errorHandler, optionalAuth, cooldowns } from '../../middleware/index.js';
import { getContext } from '../../middleware/auth.middleware.js';
import { searchTrainersByName, getTrainersByUserId, getInventory } from '../../services/trainer.service.js';
import { getUserByDiscordId } from '../../services/account.service.js';
import {
  trainerListView,
  TRAINER_LIST_PAGE,
  trainerInventoryView,
  parseInventory,
  TRAINER_INVENTORY_PAGE,
} from '../../presenters/trainer.presenter.js';
import { resolvePageFromButton } from '../../presenters/components/pagination.js';
import { handleList } from './list.js';
import { handleView } from './view.js';
import { handleInventory } from './inventory.js';
import { handleStats } from './stats.js';

// ============================================================================
// Slash command definition
// ============================================================================

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('trainer')
    .setDescription('View and manage your trainers')
    .addSubcommand((sub) =>
      sub
        .setName('list')
        .setDescription('List all trainers for you or another player')
        .addUserOption((opt) =>
          opt.setName('player').setDescription('Player to view (defaults to you)').setRequired(false),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('view')
        .setDescription('View a trainer\'s profile')
        .addStringOption((opt) =>
          opt.setName('name').setDescription('Trainer name').setRequired(true).setAutocomplete(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('inventory')
        .setDescription('View a trainer\'s inventory')
        .addStringOption((opt) =>
          opt.setName('name').setDescription('Trainer name').setRequired(true).setAutocomplete(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('stats')
        .setDescription('View a trainer\'s statistics')
        .addStringOption((opt) =>
          opt.setName('name').setDescription('Trainer name').setRequired(true).setAutocomplete(true),
        ),
    ) as SlashCommandBuilder,

  middleware: [errorHandler, optionalAuth, cooldowns.info()],

  meta: {
    name: 'trainer',
    description: 'View and manage your trainers — list, view profiles, inventory, and stats.',
    category: 'Trainer',
    usage: '/trainer list | /trainer view <name> | /trainer inventory <name> | /trainer stats <name>',
    examples: [
      '/trainer list',
      '/trainer list player:@someone',
      '/trainer view name:Ash',
      '/trainer inventory name:Ash',
      '/trainer stats name:Ash',
    ],
  },

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'list':
        await handleList(interaction);
        break;
      case 'view':
        await handleView(interaction);
        break;
      case 'inventory':
        await handleInventory(interaction);
        break;
      case 'stats':
        await handleStats(interaction);
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

    const ctx = getContext(interaction as never);
    if (!ctx) {
      await interaction.respond([]);
      return;
    }

    const trainers = await searchTrainersByName(ctx.discordId, focused.value, 25);
    await interaction.respond(
      trainers.map((t) => ({
        name: `${t.name} (Lv. ${t.level})`,
        value: t.name,
      })),
    );
  },
};

// ============================================================================
// Button handlers — pagination
// ============================================================================

/**
 * Trainer list pagination.
 * Stores the target discord ID and owner name in the button customId isn't
 * feasible, so we re-fetch the calling user's trainers.
 */
const trainerListPaginationHandler: ButtonHandler = {
  customId: new RegExp(`^${TRAINER_LIST_PAGE}_(first|prev|next|last)$`),

  async execute(interaction) {
    const discordId = interaction.user.id;
    const ctx = await getUserByDiscordId(discordId);
    if (!ctx) {
      await interaction.reply({ content: 'Account not linked.', ephemeral: true });
      return;
    }

    // Parse current page from the existing footer
    const footer = interaction.message.embeds[0]?.footer?.text ?? '';
    const pageMatch = footer.match(/Page (\d+)\/(\d+)/);
    const currentPage = pageMatch ? parseInt(pageMatch[1] ?? '1', 10) : 1;
    const totalPages = pageMatch ? parseInt(pageMatch[2] ?? '1', 10) : 1;

    const newPage = resolvePageFromButton(interaction.customId, TRAINER_LIST_PAGE, currentPage, totalPages);
    if (newPage === null) {
      return;
    }

    const trainers = await getTrainersByUserId(ctx.discordId);
    const { embed, components } = trainerListView(trainers, newPage);

    await interaction.update({ embeds: [embed], components });
  },
};

/**
 * Trainer inventory pagination (by category).
 */
const trainerInventoryPaginationHandler: ButtonHandler = {
  customId: new RegExp(`^${TRAINER_INVENTORY_PAGE}_(first|prev|next|last)$`),

  async execute(interaction) {
    const discordId = interaction.user.id;
    const ctx = await getUserByDiscordId(discordId);
    if (!ctx) {
      await interaction.reply({ content: 'Account not linked.', ephemeral: true });
      return;
    }

    // Parse current page and trainer name from existing embed
    const embed = interaction.message.embeds[0];
    const footer = embed?.footer?.text ?? '';
    const pageMatch = footer.match(/Category (\d+) of (\d+)/);
    const currentPage = pageMatch ? parseInt(pageMatch[1] ?? '1', 10) : 1;
    const totalPages = pageMatch ? parseInt(pageMatch[2] ?? '1', 10) : 1;

    const newPage = resolvePageFromButton(interaction.customId, TRAINER_INVENTORY_PAGE, currentPage, totalPages);
    if (newPage === null) {
      return;
    }

    // Extract trainer name from title "🎒 <name>'s Inventory"
    const title = embed?.title ?? '';
    const nameMatch = title.match(/🎒 (.+)'s Inventory/);
    const trainerName = nameMatch?.[1] ?? 'Unknown';

    // We need the trainer ID to re-fetch inventory. Find the trainer by name.
    const trainers = await getTrainersByUserId(ctx.discordId);
    const lower = trainerName.toLowerCase();
    const trainer = trainers.find((t) => t.name.toLowerCase() === lower);
    if (!trainer) {
      await interaction.reply({ content: 'Trainer not found.', ephemeral: true });
      return;
    }

    const rawInventory = await getInventory(trainer.id);
    const categories = parseInventory(rawInventory);
    const result = trainerInventoryView(trainer.name, categories, newPage);

    await interaction.update({ embeds: [result.embed], components: result.components });
  },
};

export const buttons: ButtonHandler[] = [
  trainerListPaginationHandler,
  trainerInventoryPaginationHandler,
];
