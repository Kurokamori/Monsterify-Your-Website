import {
  ActionRowBuilder,
  EmbedBuilder,
  type MessageActionRowComponentBuilder,
} from 'discord.js';
import { EmbedColor } from '../constants/colors.js';
import { safeImageUrl, trainerFallbackImage } from '../constants/images.js';
import type { Trainer } from '../services/trainer.service.js';
import {
  createEmbed,
  formatDate,
  trainerPageUrl,
  truncateText,
} from './base.presenter.js';
import { createActionRow, createLinkButton } from './components/buttons.js';
import { getPage, getPaginationInfo, paginationButtons } from './components/pagination.js';

// ============================================================================
// Pagination prefixes
// ============================================================================

export const TRAINER_SUMMARY_PAGE = 'trainer_summary_page';
export const TRAINER_DETAIL_PAGE = 'trainer_detail_page';

// ============================================================================
// Summary embed (compact card)
// ============================================================================

/**
 * Build a compact summary embed for a single trainer.
 *
 * Shows: name, level, currency, bio excerpt, and image thumbnail.
 */
export function trainerSummaryEmbed(trainer: Trainer): EmbedBuilder {
  const embed = createEmbed(EmbedColor.TRAINER)
    .setTitle(`👤 ${trainer.name}`)
    .setDescription(
      [
        `**Level:** ${trainer.level}`,
        `**Coins:** ${trainer.currencyAmount.toLocaleString()}`,
        trainer.birthday ? `**Birthday:** ${formatDate(trainer.birthday)}` : null,
        trainer.bio
          ? `\n${truncateText(trainer.bio, 200, 'No bio available.')}`
          : null,
      ]
        .filter(Boolean)
        .join('\n'),
    )
    .setFooter({ text: `Trainer ID: ${trainer.id}` });

  const imageUrl = safeImageUrl(trainer.mainRef, trainerFallbackImage());
  if (imageUrl) {
    embed.setImage(imageUrl);
  }

  return embed;
}

// ============================================================================
// Summary view (paginated list of trainer summary embeds)
// ============================================================================

export interface TrainerViewResult {
  embed: EmbedBuilder;
  components: ActionRowBuilder<MessageActionRowComponentBuilder>[];
}

/**
 * Build a paginated summary view — one trainer per page.
 *
 * @param trainers - Full list of trainers to page through.
 * @param page     - 1-based page number (each page = one trainer).
 * @param prefix   - Button ID prefix for pagination (default `trainer_summary_page`).
 */
export function trainerSummaryView(
  trainers: Trainer[],
  page = 1,
  prefix = TRAINER_SUMMARY_PAGE,
): TrainerViewResult {
  const info = getPaginationInfo(page, trainers.length, 1);
  const trainer = trainers[info.startIndex];

  if (!trainer) {
    return {
      embed: createEmbed(EmbedColor.TRAINER)
        .setTitle('👤 No Trainers Found')
        .setDescription('There are no trainers to display.'),
      components: [],
    };
  }

  const embed = trainerSummaryEmbed(trainer);

  if (info.totalPages > 1) {
    embed.setFooter({
      text: `Trainer ${info.currentPage} of ${info.totalPages} | ID: ${trainer.id}`,
    });
  }

  const components: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [];

  if (info.totalPages > 1) {
    components.push(paginationButtons(info, prefix));
  }

  return { embed, components };
}

// ============================================================================
// Detail embed (full trainer details)
// ============================================================================

/**
 * Build a full-detail embed for a single trainer.
 *
 * Shows all available fields with inline stat fields and a link
 * to the trainer's page on the website.
 */
export function trainerDetailEmbed(trainer: Trainer): EmbedBuilder {
  const embed = createEmbed(EmbedColor.TRAINER)
    .setTitle(`👤 ${trainer.name}`)
    .setURL(trainerPageUrl(trainer.id));

  // Description with bio
  const descParts: string[] = [];
  if (trainer.bio) {
    descParts.push(truncateText(trainer.bio, 1024, 'No bio available.'));
  }
  if (descParts.length > 0) {
    embed.setDescription(descParts.join('\n'));
  }

  // Image (with fallback)
  const imageUrl = safeImageUrl(trainer.mainRef, trainerFallbackImage());
  if (imageUrl) {
    embed.setImage(imageUrl);
  }

  // Core info field
  embed.addFields({
    name: '📋 Info',
    value: [
      `**Level:** ${trainer.level}`,
      `**Coins:** ${trainer.currencyAmount.toLocaleString()}`,
      `**Total Earned:** ${trainer.totalEarnedCurrency.toLocaleString()}`,
      trainer.birthday ? `**Birthday:** ${formatDate(trainer.birthday)}` : null,
    ]
      .filter(Boolean)
      .join('\n'),
    inline: true,
  });

  // ID / metadata field
  embed.addFields({
    name: '🆔 Metadata',
    value: [`**Trainer ID:** ${trainer.id}`]
      .join('\n'),
    inline: true,
  });

  embed.setFooter({ text: `Trainer ID: ${trainer.id}` });

  return embed;
}

// ============================================================================
// Detail view (paginated detail embeds)
// ============================================================================

/**
 * Build a paginated detail view — one trainer per page, full details.
 *
 * @param trainers - Full list of trainers to page through.
 * @param page     - 1-based page number.
 * @param prefix   - Button ID prefix for pagination (default `trainer_detail_page`).
 */
export function trainerDetailView(
  trainers: Trainer[],
  page = 1,
  prefix = TRAINER_DETAIL_PAGE,
): TrainerViewResult {
  const info = getPaginationInfo(page, trainers.length, 1);
  const trainer = trainers[info.startIndex];

  if (!trainer) {
    return {
      embed: createEmbed(EmbedColor.TRAINER)
        .setTitle('👤 No Trainers Found')
        .setDescription('There are no trainers to display.'),
      components: [],
    };
  }

  const embed = trainerDetailEmbed(trainer);

  if (info.totalPages > 1) {
    embed.setFooter({
      text: `Trainer ${info.currentPage} of ${info.totalPages} | ID: ${trainer.id}`,
    });
  }

  const components: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [];

  // Link button row
  components.push(
    createActionRow(
      createLinkButton(
        trainerPageUrl(trainer.id),
        'View on Website',
        '🌐',
      ),
    ),
  );

  // Pagination row
  if (info.totalPages > 1) {
    components.push(paginationButtons(info, prefix));
  }

  return { embed, components };
}

// ============================================================================
// Trainer list embed (compact multi-trainer list)
// ============================================================================

export const TRAINER_LIST_PAGE = 'trainer_list_page';
const TRAINERS_PER_LIST_PAGE = 10;

/**
 * Build a compact list embed showing multiple trainers per page.
 * Each entry shows: name, level, currency.
 */
export function trainerListView(
  trainers: Trainer[],
  page = 1,
  ownerName?: string,
  prefix = TRAINER_LIST_PAGE,
): TrainerViewResult {
  if (trainers.length === 0) {
    return {
      embed: createEmbed(EmbedColor.TRAINER)
        .setTitle('👤 No Trainers Found')
        .setDescription(
          ownerName
            ? `${ownerName} doesn't have any trainers yet.`
            : 'You don\'t have any trainers yet.',
        ),
      components: [],
    };
  }

  const info = getPaginationInfo(page, trainers.length, TRAINERS_PER_LIST_PAGE);
  const pageTrainers = getPage(trainers, info.currentPage, TRAINERS_PER_LIST_PAGE);

  const title = ownerName
    ? `👤 ${ownerName}'s Trainers`
    : '👤 Your Trainers';

  const lines = pageTrainers.map((t, i) => {
    const idx = info.startIndex + i + 1;
    return `\`${idx}.\` **${t.name}** — Lv. ${t.level} | ${t.currencyAmount.toLocaleString()} coins`;
  });

  const embed = createEmbed(EmbedColor.TRAINER)
    .setTitle(title)
    .setDescription(lines.join('\n'))
    .setFooter({
      text: `${trainers.length} trainer${trainers.length === 1 ? '' : 's'} total`
        + (info.totalPages > 1 ? ` | Page ${info.currentPage}/${info.totalPages}` : ''),
    });

  const components: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [];
  if (info.totalPages > 1) {
    components.push(paginationButtons(info, prefix));
  }

  return { embed, components };
}

// ============================================================================
// Trainer inventory embed (paginated by category)
// ============================================================================

export const TRAINER_INVENTORY_PAGE = 'trainer_inv_page';

/** Category display names and emojis. */
const CATEGORY_DISPLAY: Record<string, { label: string; emoji: string }> = {
  items: { label: 'Items', emoji: '📦' },
  balls: { label: 'Balls', emoji: '🔴' },
  berries: { label: 'Berries', emoji: '🍇' },
  pastries: { label: 'Pastries', emoji: '🧁' },
  evolution: { label: 'Evolution', emoji: '🔄' },
  eggs: { label: 'Eggs', emoji: '🥚' },
  antiques: { label: 'Antiques', emoji: '🏺' },
  helditems: { label: 'Held Items', emoji: '💎' },
  seals: { label: 'Seals', emoji: '🔖' },
  keyitems: { label: 'Key Items', emoji: '🔑' },
};

export interface InventoryCategory {
  key: string;
  label: string;
  emoji: string;
  items: Array<{ name: string; quantity: number }>;
}

/**
 * Parse raw inventory into sorted categories, filtering out empty ones.
 */
export function parseInventory(
  raw: Record<string, Record<string, number>>,
): InventoryCategory[] {
  const categories: InventoryCategory[] = [];

  for (const [key, items] of Object.entries(raw)) {
    const entries = Object.entries(items).filter(([, qty]) => qty > 0);
    if (entries.length === 0) {
      continue;
    }

    const display = CATEGORY_DISPLAY[key] ?? { label: key, emoji: '📋' };
    categories.push({
      key,
      label: display.label,
      emoji: display.emoji,
      items: entries
        .map(([name, quantity]) => ({ name, quantity }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    });
  }

  return categories;
}

/**
 * Build a paginated inventory view — one category per page.
 */
export function trainerInventoryView(
  trainerName: string,
  categories: InventoryCategory[],
  page = 1,
  prefix = TRAINER_INVENTORY_PAGE,
): TrainerViewResult {
  if (categories.length === 0) {
    return {
      embed: createEmbed(EmbedColor.TRAINER)
        .setTitle(`🎒 ${trainerName}'s Inventory`)
        .setDescription('Inventory is empty.'),
      components: [],
    };
  }

  const info = getPaginationInfo(page, categories.length, 1);
  const category = categories[info.startIndex];
  if (!category) {
    return {
      embed: createEmbed(EmbedColor.TRAINER)
        .setTitle(`🎒 ${trainerName}'s Inventory`)
        .setDescription('Inventory is empty.'),
      components: [],
    };
  }

  const totalItems = category.items.reduce((sum, item) => sum + item.quantity, 0);
  const lines = category.items.map(
    (item) => `${item.name}${item.quantity > 1 ? ` x${item.quantity}` : ''}`,
  );

  const embed = createEmbed(EmbedColor.TRAINER)
    .setTitle(`🎒 ${trainerName}'s Inventory`)
    .addFields({
      name: `${category.emoji} ${category.label} (${totalItems})`,
      value: lines.join('\n') || 'Empty',
    })
    .setFooter({
      text: `Category ${info.currentPage} of ${info.totalPages}`
        + ` | ${categories.reduce((s, c) => s + c.items.length, 0)} unique items total`,
    });

  const components: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [];
  if (info.totalPages > 1) {
    components.push(paginationButtons(info, prefix));
  }

  return { embed, components };
}

// ============================================================================
// Trainer stats embed
// ============================================================================

/**
 * Build a trainer statistics embed.
 */
export function trainerStatsEmbed(trainer: Trainer): EmbedBuilder {
  const embed = createEmbed(EmbedColor.TRAINER)
    .setTitle(`📊 ${trainer.name} — Stats`)
    .setURL(trainerPageUrl(trainer.id));

  const imageUrl = safeImageUrl(trainer.mainRef, trainerFallbackImage());
  if (imageUrl) {
    embed.setImage(imageUrl);
  }

  embed.addFields(
    {
      name: '📋 General',
      value: [
        `**Level:** ${trainer.level}`,
        `**Coins:** ${trainer.currencyAmount.toLocaleString()}`,
        `**Total Earned:** ${trainer.totalEarnedCurrency.toLocaleString()}`,
        trainer.createdAt ? `**Trainer Since:** ${formatDate(trainer.createdAt)}` : null,
      ].filter(Boolean).join('\n'),
      inline: true,
    },
    {
      name: '👾 Monsters',
      value: [
        `**Collection:** ${trainer.monsterCount}`,
        `**With Art:** ${trainer.monsterRefCount}`,
        trainer.monsterCount > 0
          ? `**Art Coverage:** ${trainer.monsterRefPercent}%`
          : null,
      ].filter(Boolean).join('\n'),
      inline: true,
    },
  );

  if (trainer.zodiac || trainer.chineseZodiac) {
    embed.addFields({
      name: '🔮 Zodiac',
      value: [
        trainer.zodiac ? `**Western:** ${trainer.zodiac}` : null,
        trainer.chineseZodiac ? `**Chinese:** ${trainer.chineseZodiac}` : null,
      ].filter(Boolean).join('\n'),
      inline: true,
    });
  }

  embed.setFooter({ text: `Trainer ID: ${trainer.id}` });

  return embed;
}
