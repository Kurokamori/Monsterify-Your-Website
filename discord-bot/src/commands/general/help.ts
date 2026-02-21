import { SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../types/command.types.js';
import type { DuskClient } from '../../client.js';
import { createEmbed } from '../../presenters/base.presenter.js';
import { EmbedColor } from '../../constants/colors.js';

// ============================================================================
// /help — Dynamic command reference
// ============================================================================

/**
 * Default category for commands that don't specify one in their meta.
 */
const DEFAULT_CATEGORY = 'Other';

/**
 * Ordering priority for categories. Categories not listed here sort
 * alphabetically after the listed ones.
 */
const CATEGORY_ORDER: string[] = [
  'General',
  'Trainer',
  'Monster',
  'Town',
  'Shop',
  'Adventure',
  'Battle',
  'Admin',
];

function categoryIndex(cat: string): number {
  const idx = CATEGORY_ORDER.indexOf(cat);
  return idx >= 0 ? idx : CATEGORY_ORDER.length;
}

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('View all available commands')
    .addStringOption((opt) =>
      opt
        .setName('command')
        .setDescription('Get details about a specific command')
        .setRequired(false),
    ),

  meta: {
    name: 'help',
    description: 'View all available commands or get details about a specific one.',
    category: 'General',
  },

  async execute(interaction) {
    const client = interaction.client as DuskClient;
    const specificCommand = interaction.options.getString('command');

    if (specificCommand) {
      await showCommandDetail(interaction, client, specificCommand);
    } else {
      await showCommandList(interaction, client);
    }
  },
};

// ============================================================================
// Full command list (grouped by category)
// ============================================================================

async function showCommandList(
  interaction: Parameters<Command['execute']>[0],
  client: DuskClient,
): Promise<void> {
  // Group commands by category
  const groups = new Map<string, { name: string; description: string }[]>();

  for (const [, cmd] of client.commands) {
    const category = cmd.meta?.category ?? DEFAULT_CATEGORY;
    const entry = {
      name: cmd.data.name,
      description: cmd.meta?.description ?? cmd.data.description,
    };

    const list = groups.get(category);
    if (list) {
      list.push(entry);
    } else {
      groups.set(category, [entry]);
    }
  }

  // Sort categories by defined order, then alphabetically
  const sortedCategories = [...groups.keys()].sort((a, b) => {
    const diff = categoryIndex(a) - categoryIndex(b);
    if (diff !== 0) {
      return diff;
    }
    return a.localeCompare(b);
  });

  const embed = createEmbed(EmbedColor.INFO)
    .setTitle('📖 Help — Command Reference');

  for (const category of sortedCategories) {
    const commands = groups.get(category) ?? [];
    // Sort commands alphabetically within each category
    commands.sort((a, b) => a.name.localeCompare(b.name));

    const lines = commands.map(
      (cmd) => `\`/${cmd.name}\` — ${cmd.description}`,
    );

    embed.addFields({
      name: category,
      value: lines.join('\n'),
      inline: false,
    });
  }

  embed.setFooter({ text: 'Use /help command:<name> for details on a specific command.' });

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

// ============================================================================
// Single command detail
// ============================================================================

async function showCommandDetail(
  interaction: Parameters<Command['execute']>[0],
  client: DuskClient,
  commandName: string,
): Promise<void> {
  // Strip leading slash if the user typed one
  const name = commandName.replace(/^\//, '').toLowerCase();
  const cmd = client.commands.get(name);

  if (!cmd) {
    const embed = createEmbed(EmbedColor.ERROR)
      .setDescription(`Unknown command: \`/${name}\`. Use \`/help\` to see all commands.`);
    await interaction.reply({ embeds: [embed], ephemeral: true });
    return;
  }

  const meta = cmd.meta;
  const embed = createEmbed(EmbedColor.INFO)
    .setTitle(`📖 /${cmd.data.name}`)
    .setDescription(meta?.description ?? cmd.data.description);

  if (meta?.category) {
    embed.addFields({ name: 'Category', value: meta.category, inline: true });
  }

  if (meta?.usage) {
    embed.addFields({ name: 'Usage', value: `\`${meta.usage}\``, inline: false });
  }

  if (meta?.examples && meta.examples.length > 0) {
    embed.addFields({
      name: 'Examples',
      value: meta.examples.map((ex) => `\`${ex}\``).join('\n'),
      inline: false,
    });
  }

  if (meta?.cooldown) {
    embed.addFields({
      name: 'Cooldown',
      value: `${meta.cooldown}s`,
      inline: true,
    });
  }

  if (meta?.permissions && meta.permissions.length > 0) {
    embed.addFields({
      name: 'Permissions',
      value: meta.permissions.join(', '),
      inline: true,
    });
  }

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
