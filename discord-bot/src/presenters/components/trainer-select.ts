import type { Trainer } from '../../services/trainer.service.js';
import {
  buildPaginatedSelect,
  type PaginatedSelectResult,
  type SelectOption,
} from './select-menus.js';

// ============================================================================
// Formatter
// ============================================================================

function formatTrainerOption(trainer: Trainer, _index: number): SelectOption {
  return {
    label: trainer.name,
    value: String(trainer.id),
    description: `Lv. ${trainer.level} | ${trainer.currencyAmount.toLocaleString()} coins`,
    emoji: '👤',
  };
}

// ============================================================================
// User trainer select (trainers belonging to the calling user)
// ============================================================================

/**
 * Build a paginated select menu of a user's own trainers.
 *
 * @param trainers  - Trainers fetched via `trainerService.getTrainersByUserId`.
 * @param page      - 1-based page number.
 * @param customId  - Custom ID for the select menu (default `trainer_select`).
 */
export function userTrainerSelect(
  trainers: Trainer[],
  page = 1,
  customId = 'trainer_select',
): PaginatedSelectResult {
  return buildPaginatedSelect(trainers, formatTrainerOption, {
    customId,
    placeholder: 'Select one of your trainers...',
    page,
    paginationPrefix: `${customId}_page`,
  });
}

// ============================================================================
// All-trainer select (admin/global view — all trainers in the system)
// ============================================================================

/**
 * Build a paginated select menu of all trainers.
 *
 * This is useful for admin commands where any trainer can be selected.
 * The data should already be fetched and optionally filtered/searched
 * before being passed in.
 *
 * @param trainers  - Full or filtered list of trainers.
 * @param page      - 1-based page number.
 * @param customId  - Custom ID for the select menu (default `all_trainer_select`).
 */
export function allTrainerSelect(
  trainers: Trainer[],
  page = 1,
  customId = 'all_trainer_select',
): PaginatedSelectResult {
  return buildPaginatedSelect(trainers, formatTrainerOption, {
    customId,
    placeholder: 'Search and select a trainer...',
    page,
    paginationPrefix: `${customId}_page`,
  });
}
