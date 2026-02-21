import {
  ActionRowBuilder,
  EmbedBuilder,
  type MessageActionRowComponentBuilder,
} from 'discord.js';
import { EmbedColor } from '../constants/colors.js';
import { monsterFallbackImage, safeImageUrl } from '../constants/images.js';
import type { Monster } from '../services/monster.service.js';
import {
  createEmbed,
  formatDate,
  formatSpecies,
  formatTypes,
  monsterPageUrl,
  specialIndicators,
  specialIndicatorsCompact,
  truncateText,
} from './base.presenter.js';
import { createActionRow, createLinkButton } from './components/buttons.js';
import { getPaginationInfo, paginationButtons } from './components/pagination.js';

// ============================================================================
// Pagination prefixes
// ============================================================================

export const MONSTER_SUMMARY_PAGE = 'monster_summary_page';
export const MONSTER_DETAIL_PAGE = 'monster_detail_page';

// ============================================================================
// Summary embed (compact card)
// ============================================================================

/**
 * Build a compact summary embed for a single monster.
 *
 * Shows: name, level, species, types (1-5), attribute, image, special indicators.
 */
export function monsterSummaryEmbed(monster: Monster): EmbedBuilder {
  const indicators = specialIndicatorsCompact(monster);
  const titleSuffix = indicators ? ` ${indicators}` : '';

  const species = formatSpecies(monster.species1, monster.species2, monster.species3);
  const types = formatTypes(
    monster.type1,
    monster.type2,
    monster.type3,
    monster.type4,
    monster.type5,
  );

  const embed = createEmbed(EmbedColor.MONSTER)
    .setTitle(`👾 ${monster.name}${titleSuffix}`)
    .setDescription(
      [
        `**Level:** ${monster.level}`,
        `**Species:** ${species}`,
        `**Types:** ${types}`,
        monster.attribute ? `**Attribute:** ${monster.attribute}` : null,
        `**Nature:** ${monster.nature}`,
        `**Gender:** ${monster.gender}`,
      ]
        .filter(Boolean)
        .join('\n'),
    )
    .setFooter({ text: `Monster ID: ${monster.id}` });

  const imageUrl = safeImageUrl(monster.imgLink, monsterFallbackImage());
  if (imageUrl) {
    embed.setImage(imageUrl);
  }

  return embed;
}

// ============================================================================
// Summary view (paginated)
// ============================================================================

export interface MonsterViewResult {
  embed: EmbedBuilder;
  components: ActionRowBuilder<MessageActionRowComponentBuilder>[];
}

/**
 * Build a paginated summary view — one monster per page.
 *
 * @param monsters - Full list of monsters to page through.
 * @param page     - 1-based page number (each page = one monster).
 * @param prefix   - Button ID prefix for pagination (default `monster_summary_page`).
 */
export function monsterSummaryView(
  monsters: Monster[],
  page = 1,
  prefix = MONSTER_SUMMARY_PAGE,
): MonsterViewResult {
  const info = getPaginationInfo(page, monsters.length, 1);
  const monster = monsters[info.startIndex];

  if (!monster) {
    return {
      embed: createEmbed(EmbedColor.MONSTER)
        .setTitle('👾 No Monsters Found')
        .setDescription('There are no monsters to display.'),
      components: [],
    };
  }

  const embed = monsterSummaryEmbed(monster);

  if (info.totalPages > 1) {
    embed.setFooter({
      text: `Monster ${info.currentPage} of ${info.totalPages} | ID: ${monster.id}`,
    });
  }

  const components: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [];

  if (info.totalPages > 1) {
    components.push(paginationButtons(info, prefix));
  }

  return { embed, components };
}

// ============================================================================
// Detail embed (full monster details)
// ============================================================================

/**
 * Build a full-detail embed for a single monster.
 *
 * Shows all available fields: stats, traits, moves, origin, abilities,
 * and a link to the monster's page on the website.
 */
export function monsterDetailEmbed(monster: Monster): EmbedBuilder {
  const indicatorsStr = specialIndicators(monster);
  const compactIndicators = specialIndicatorsCompact(monster);
  const titleSuffix = compactIndicators ? ` ${compactIndicators}` : '';

  const species = formatSpecies(monster.species1, monster.species2, monster.species3);
  const types = formatTypes(
    monster.type1,
    monster.type2,
    monster.type3,
    monster.type4,
    monster.type5,
  );

  const embed = createEmbed(EmbedColor.MONSTER)
    .setTitle(`👾 ${monster.name}${titleSuffix}`)
    .setURL(monsterPageUrl(monster.id));

  // Description: core identity
  const descLines: string[] = [
    `**Species:** ${species}`,
    `**Level:** ${monster.level}`,
    `**Types:** ${types}`,
  ];
  if (monster.attribute) {
    descLines.push(`**Attribute:** ${monster.attribute}`);
  }
  if (indicatorsStr) {
    descLines.push(`**Traits:** ${indicatorsStr}`);
  }
  embed.setDescription(descLines.join('\n'));

  // Image (with fallback)
  const imageUrl = safeImageUrl(monster.imgLink, monsterFallbackImage());
  if (imageUrl) {
    embed.setImage(imageUrl);
  }

  // Stats field
  embed.addFields({
    name: '📊 Stats',
    value: [
      `❤️ HP: **${monster.hpTotal}**`,
      `⚔️ Atk: **${monster.atkTotal}**`,
      `🛡️ Def: **${monster.defTotal}**`,
      `✨ SpA: **${monster.spaTotal}**`,
      `🔮 SpD: **${monster.spdTotal}**`,
      `💨 Spe: **${monster.speTotal}**`,
    ].join('\n'),
    inline: true,
  });

  // Traits field
  const traitsLines: string[] = [
    `**Nature:** ${monster.nature}`,
    `**Characteristic:** ${monster.characteristic}`,
    `**Gender:** ${monster.gender}`,
    `**Friendship:** ${monster.friendship}/255`,
  ];
  if (monster.ability) {
    traitsLines.push(`**Ability:** ${monster.ability}`);
  }

  embed.addFields({
    name: '🧬 Traits',
    value: traitsLines.join('\n'),
    inline: true,
  });

  // Moves field (if any)
  if (monster.moveset.length > 0) {
    embed.addFields({
      name: '⚡ Moves',
      value: monster.moveset
        .map((move, i) => `${i + 1}. ${move}`)
        .join('\n'),
      inline: false,
    });
  }

  // Origin field
  const originLines: string[] = [];
  if (monster.dateMet) {
    originLines.push(`**Date Met:** ${formatDate(monster.dateMet)}`);
  }
  if (monster.whereMet) {
    originLines.push(
      `**Where Met:** ${truncateText(monster.whereMet, 100, 'Unknown')}`,
    );
  }
  originLines.push(`**Box:** ${monster.boxNumber} | **Position:** ${monster.trainerIndex}`);

  embed.addFields({
    name: '📍 Origin',
    value: originLines.join('\n'),
    inline: false,
  });

  embed.setFooter({
    text: `Monster ID: ${monster.id} | Box ${monster.boxNumber}`,
  });

  return embed;
}

// ============================================================================
// Detail view (paginated)
// ============================================================================

/**
 * Build a paginated detail view — one monster per page, full details.
 *
 * @param monsters - Full list of monsters to page through.
 * @param page     - 1-based page number.
 * @param prefix   - Button ID prefix for pagination (default `monster_detail_page`).
 */
export function monsterDetailView(
  monsters: Monster[],
  page = 1,
  prefix = MONSTER_DETAIL_PAGE,
): MonsterViewResult {
  const info = getPaginationInfo(page, monsters.length, 1);
  const monster = monsters[info.startIndex];

  if (!monster) {
    return {
      embed: createEmbed(EmbedColor.MONSTER)
        .setTitle('👾 No Monsters Found')
        .setDescription('There are no monsters to display.'),
      components: [],
    };
  }

  const embed = monsterDetailEmbed(monster);

  if (info.totalPages > 1) {
    embed.setFooter({
      text: `Monster ${info.currentPage} of ${info.totalPages} | ID: ${monster.id} | Box ${monster.boxNumber}`,
    });
  }

  const components: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [];

  // Link button row
  components.push(
    createActionRow(
      createLinkButton(
        monsterPageUrl(monster.id),
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
// Rename success embed
// ============================================================================

/**
 * Build a confirmation embed after successfully renaming a monster.
 */
export function monsterRenameSuccessEmbed(
  oldName: string,
  newName: string,
  monster: Monster,
): EmbedBuilder {
  const embed = createEmbed(EmbedColor.SUCCESS)
    .setTitle('✏️ Monster Renamed')
    .setDescription(`**${oldName}** has been renamed to **${newName}**!`)
    .setFooter({ text: `Monster ID: ${monster.id}` });

  const imgUrl = safeImageUrl(monster.imgLink, monsterFallbackImage());
  if (imgUrl) {
    embed.setImage(imgUrl);
  }

  return embed;
}
