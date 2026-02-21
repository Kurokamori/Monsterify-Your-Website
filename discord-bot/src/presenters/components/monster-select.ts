import type { Monster } from '../../services/monster.service.js';
import {
  buildPaginatedSelect,
  type PaginatedSelectResult,
  type SelectOption,
} from './select-menus.js';

// ============================================================================
// Helpers
// ============================================================================

function specialIndicators(monster: Monster): string {
  const tags: string[] = [];
  if (monster.shiny) {
    tags.push('✨');
  }
  if (monster.alpha) {
    tags.push('🔺');
  }
  return tags.length > 0 ? ` ${tags.join('')}` : '';
}

function speciesLabel(monster: Monster): string {
  const parts = [monster.species1];
  if (monster.species2) {
    parts.push(monster.species2);
  }
  if (monster.species3) {
    parts.push(monster.species3);
  }
  return parts.join('/');
}

// ============================================================================
// Formatter
// ============================================================================

function formatMonsterOption(monster: Monster, _index: number): SelectOption {
  const name =
    monster.name.length > 40
      ? monster.name.slice(0, 37) + '...'
      : monster.name;

  const indicators = specialIndicators(monster);

  const types = [monster.type1, monster.type2].filter(Boolean).join('/');

  return {
    label: `${name}${indicators}`,
    value: String(monster.id),
    description: `Lv. ${monster.level} ${speciesLabel(monster)} (${types})`,
    emoji: '👾',
  };
}

// ============================================================================
// Monster select (all monsters for a trainer)
// ============================================================================

/**
 * Build a paginated select menu of a trainer's monsters.
 *
 * @param monsters  - Monsters fetched via monster service.
 * @param page      - 1-based page number.
 * @param customId  - Custom ID for the select menu (default `monster_select`).
 */
export function monsterSelect(
  monsters: Monster[],
  page = 1,
  customId = 'monster_select',
): PaginatedSelectResult {
  return buildPaginatedSelect(monsters, formatMonsterOption, {
    customId,
    placeholder: 'Select a monster...',
    page,
    paginationPrefix: `${customId}_page`,
  });
}

// ============================================================================
// Filtered monster select
// ============================================================================

export interface MonsterFilter {
  species?: string;
  type?: string;
  minLevel?: number;
  maxLevel?: number;
  shinyOnly?: boolean;
  alphaOnly?: boolean;
  boxNumber?: number;
}

/** Apply filters to a monster list before building the select menu. */
export function filterMonsters(
  monsters: Monster[],
  filter: MonsterFilter,
): Monster[] {
  return monsters.filter((m) => {
    if (filter.species) {
      const q = filter.species.toLowerCase();
      const match =
        m.species1.toLowerCase().includes(q) ||
        (m.species2?.toLowerCase().includes(q) ?? false) ||
        (m.species3?.toLowerCase().includes(q) ?? false);
      if (!match) {
        return false;
      }
    }

    if (filter.type) {
      const q = filter.type.toLowerCase();
      const types = [m.type1, m.type2].filter((t): t is string => t !== null);
      if (!types.some((t) => t.toLowerCase() === q)) {
        return false;
      }
    }

    if (filter.minLevel !== undefined && m.level < filter.minLevel) {
      return false;
    }
    if (filter.maxLevel !== undefined && m.level > filter.maxLevel) {
      return false;
    }
    if (filter.shinyOnly && !m.shiny) {
      return false;
    }
    if (filter.alphaOnly && !m.alpha) {
      return false;
    }

    return true;
  });
}

/**
 * Build a paginated select menu of a trainer's monsters with optional filtering.
 *
 * @param monsters  - Full monster list for the trainer.
 * @param filter    - Filter criteria.
 * @param page      - 1-based page number.
 * @param customId  - Custom ID for the select menu (default `monster_select`).
 */
export function filteredMonsterSelect(
  monsters: Monster[],
  filter: MonsterFilter,
  page = 1,
  customId = 'monster_select',
): PaginatedSelectResult {
  const filtered = filterMonsters(monsters, filter);
  return monsterSelect(filtered, page, customId);
}
