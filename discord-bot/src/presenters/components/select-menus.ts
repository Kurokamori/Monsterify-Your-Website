import {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  type APISelectMenuOption,
  type MessageActionRowComponentBuilder,
} from 'discord.js';
import {
  MAX_SELECT_OPTIONS,
  getPage,
  getPaginationInfo,
  paginationButtons,
  type PaginationInfo,
} from './pagination.js';

// ============================================================================
// Types
// ============================================================================

/** A single select menu option before it's handed to Discord.js. */
export interface SelectOption {
  label: string;
  value: string;
  description?: string;
  emoji?: string;
}

/**
 * Function that converts a domain item into a SelectOption.
 * The index is the item's position in the full (unpaginated) list.
 */
export type SelectOptionFormatter<T> = (item: T, index: number) => SelectOption;

/** The complete output of building a paginated select menu. */
export interface PaginatedSelectResult {
  /** The action row containing the StringSelectMenu. */
  menuRow: ActionRowBuilder<MessageActionRowComponentBuilder>;
  /** The action row with pagination buttons, or `null` if everything fits on one page. */
  paginationRow: ActionRowBuilder<MessageActionRowComponentBuilder> | null;
  /** Metadata about the current page. */
  pagination: PaginationInfo;
}

// ============================================================================
// Discord string-length limits
// ============================================================================

const MAX_LABEL_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 100;
const MAX_VALUE_LENGTH = 100;

function truncate(str: string, max: number): string {
  return str.length <= max ? str : str.slice(0, max - 3) + '...';
}

// ============================================================================
// Generic select menu builder
// ============================================================================

/**
 * Build a paginated StringSelectMenu from an arbitrary list of items.
 *
 * @param items       - Full list of items (not yet paginated).
 * @param formatter   - Converts each item to a {@link SelectOption}.
 * @param options     - Configuration for the select menu.
 * @returns Rows ready to be attached to a message reply.
 */
export function buildPaginatedSelect<T>(
  items: T[],
  formatter: SelectOptionFormatter<T>,
  options: {
    /** Custom ID for the select menu. Pages are encoded in the pagination buttons, not here. */
    customId: string;
    /** Placeholder text shown when nothing is selected. */
    placeholder?: string;
    /** 1-based page number (default 1). */
    page?: number;
    /** Max options per page (default & max is 25). */
    perPage?: number;
    /** Custom ID prefix for pagination buttons (defaults to `{customId}_page`). */
    paginationPrefix?: string;
    /** Minimum number of values that must be selected (default 1). */
    minValues?: number;
    /** Maximum number of values that can be selected (default 1). */
    maxValues?: number;
  },
): PaginatedSelectResult {
  const perPage = Math.min(options.perPage ?? MAX_SELECT_OPTIONS, MAX_SELECT_OPTIONS);
  const page = options.page ?? 1;
  const paginationPrefix = options.paginationPrefix ?? `${options.customId}_page`;

  const pageItems = getPage(items, page, perPage);
  const pagination = getPaginationInfo(page, items.length, perPage);

  // Build options
  const selectOptions: APISelectMenuOption[] = pageItems.map(
    (item, localIndex) => {
      const globalIndex = pagination.startIndex + localIndex;
      const opt = formatter(item, globalIndex);

      const option: APISelectMenuOption = {
        label: truncate(opt.label, MAX_LABEL_LENGTH),
        value: truncate(opt.value, MAX_VALUE_LENGTH),
      };

      if (opt.description) {
        option.description = truncate(opt.description, MAX_DESCRIPTION_LENGTH);
      }

      if (opt.emoji) {
        option.emoji = { name: opt.emoji };
      }

      return option;
    },
  );

  // Build the select menu
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(options.customId)
    .setPlaceholder(
      options.placeholder ??
        (pagination.totalPages > 1
          ? `Select an option (page ${pagination.currentPage}/${pagination.totalPages})`
          : 'Select an option...'),
    )
    .setMinValues(options.minValues ?? 1)
    .setMaxValues(options.maxValues ?? 1);

  if (selectOptions.length > 0) {
    selectMenu.addOptions(selectOptions);
  } else {
    // Discord requires at least one option; add a disabled-style placeholder
    selectMenu.addOptions({
      label: 'No options available',
      value: '_empty',
      description: 'There are no items to display.',
    });
    selectMenu.setDisabled(true);
  }

  const menuRow =
    new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      selectMenu,
    );

  // Pagination row (only if multiple pages)
  const paginationRow =
    pagination.totalPages > 1
      ? paginationButtons(pagination, paginationPrefix)
      : null;

  return { menuRow, paginationRow, pagination };
}

// ============================================================================
// Convenience: collect action rows into an array
// ============================================================================

/**
 * Flatten a PaginatedSelectResult into an array of action rows suitable for
 * passing to `interaction.reply({ components })`.
 */
export function selectResultToRows(
  result: PaginatedSelectResult,
): ActionRowBuilder<MessageActionRowComponentBuilder>[] {
  const rows: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [
    result.menuRow,
  ];
  if (result.paginationRow) {
    rows.push(result.paginationRow);
  }
  return rows;
}
