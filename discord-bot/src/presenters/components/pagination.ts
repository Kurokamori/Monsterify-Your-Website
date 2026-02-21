import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type MessageActionRowComponentBuilder,
} from 'discord.js';

// ============================================================================
// Constants
// ============================================================================

/** Discord limits select menus to 25 options. */
export const MAX_SELECT_OPTIONS = 25;

/** Discord limits embeds to ~4096 chars in the description. */
export const MAX_EMBED_DESCRIPTION = 4096;

// ============================================================================
// Pagination state
// ============================================================================

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ============================================================================
// Generic page helpers
// ============================================================================

/** Split an array into pages of a given size. */
export function chunkItems<T>(items: T[], perPage: number): T[][] {
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += perPage) {
    pages.push(items.slice(i, i + perPage));
  }
  return pages.length > 0 ? pages : [[]];
}

/** Get items for a specific 1-based page number. */
export function getPage<T>(items: T[], page: number, perPage: number): T[] {
  const clamped = clampPage(page, items.length, perPage);
  const start = (clamped - 1) * perPage;
  return items.slice(start, start + perPage);
}

/** Clamp a page number to valid bounds (1-based). */
export function clampPage(
  page: number,
  totalItems: number,
  perPage: number,
): number {
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  return Math.max(1, Math.min(page, totalPages));
}

/** Build a PaginationInfo object from a 1-based page number. */
export function getPaginationInfo(
  page: number,
  totalItems: number,
  perPage: number,
): PaginationInfo {
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const clamped = Math.max(1, Math.min(page, totalPages));
  const startIndex = (clamped - 1) * perPage;
  const endIndex = Math.min(startIndex + perPage, totalItems);

  return {
    currentPage: clamped,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
    hasNext: clamped < totalPages,
    hasPrev: clamped > 1,
  };
}

// ============================================================================
// Pagination button row
// ============================================================================

/**
 * Build an action row of pagination buttons.
 *
 * @param info    - Current pagination state.
 * @param prefix  - Custom ID prefix used to namespace the buttons.
 *                  Generated IDs: `{prefix}_first`, `{prefix}_prev`,
 *                  `{prefix}_indicator`, `{prefix}_next`, `{prefix}_last`.
 *
 * When there are 2 or fewer total pages the first/last buttons are omitted
 * to reduce clutter.
 */
export function paginationButtons(
  info: PaginationInfo,
  prefix: string,
): ActionRowBuilder<MessageActionRowComponentBuilder> {
  const buttons: ButtonBuilder[] = [];

  // First page (only shown when >2 pages)
  if (info.totalPages > 2) {
    buttons.push(
      new ButtonBuilder()
        .setCustomId(`${prefix}_first`)
        .setEmoji('⏮️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!info.hasPrev),
    );
  }

  // Previous
  buttons.push(
    new ButtonBuilder()
      .setCustomId(`${prefix}_prev`)
      .setEmoji('⬅️')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(!info.hasPrev),
  );

  // Page indicator (always disabled — just a label)
  buttons.push(
    new ButtonBuilder()
      .setCustomId(`${prefix}_indicator`)
      .setLabel(`${info.currentPage} / ${info.totalPages}`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
  );

  // Next
  buttons.push(
    new ButtonBuilder()
      .setCustomId(`${prefix}_next`)
      .setEmoji('➡️')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(!info.hasNext),
  );

  // Last page (only shown when >2 pages)
  if (info.totalPages > 2) {
    buttons.push(
      new ButtonBuilder()
        .setCustomId(`${prefix}_last`)
        .setEmoji('⏭️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!info.hasNext),
    );
  }

  return new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
    ...buttons,
  );
}

// ============================================================================
// Page-from-button helper
// ============================================================================

/**
 * Resolve the target page number from a pagination button's custom ID.
 *
 * @param customId    - The full custom ID string (e.g. `"monster_page_next"`).
 * @param prefix      - The prefix used when creating the buttons.
 * @param currentPage - The current page before the button was pressed.
 * @param totalPages  - Total number of pages.
 * @returns The new page number, or `null` if the ID doesn't match.
 */
export function resolvePageFromButton(
  customId: string,
  prefix: string,
  currentPage: number,
  totalPages: number,
): number | null {
  if (!customId.startsWith(prefix + '_')) {
    return null;
  }

  const action = customId.slice(prefix.length + 1);
  switch (action) {
    case 'first':
      return 1;
    case 'prev':
      return Math.max(1, currentPage - 1);
    case 'next':
      return Math.min(totalPages, currentPage + 1);
    case 'last':
      return totalPages;
    default:
      return null;
  }
}
