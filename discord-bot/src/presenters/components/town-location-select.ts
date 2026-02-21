import { TOWN_LOCATIONS, type TownLocation } from '../../constants/town-locations.js';
import {
  buildPaginatedSelect,
  type PaginatedSelectResult,
  type SelectOption,
} from './select-menus.js';

// ============================================================================
// Formatter
// ============================================================================

function formatLocationOption(
  location: TownLocation,
  _index: number,
): SelectOption {
  return {
    label: location.name,
    value: location.id,
    description: location.description.slice(0, 100),
    emoji: location.emoji,
  };
}

// ============================================================================
// Town location select
// ============================================================================

/**
 * Build a select menu of town locations.
 *
 * Town locations are static and unlikely to exceed 25 items, but
 * pagination is supported for consistency and forward-compatibility.
 *
 * @param page      - 1-based page number.
 * @param customId  - Custom ID for the select menu (default `location_select`).
 * @param locations - Override the default location list (e.g. for filtering).
 */
export function townLocationSelect(
  page = 1,
  customId = 'location_select',
  locations: TownLocation[] = TOWN_LOCATIONS,
): PaginatedSelectResult {
  return buildPaginatedSelect(locations, formatLocationOption, {
    customId,
    placeholder: 'Choose a town location...',
    page,
    paginationPrefix: `${customId}_page`,
  });
}
