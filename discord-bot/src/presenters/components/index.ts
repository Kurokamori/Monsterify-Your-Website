// ============================================================================
// Presenter components — barrel export
// ============================================================================

// -- Buttons -----------------------------------------------------------------
export {
  createButton,
  createLinkButton,
  createActionRow,
  CommonButtons,
  confirmCancelRow,
} from './buttons.js';

// -- Pagination --------------------------------------------------------------
export {
  MAX_SELECT_OPTIONS,
  MAX_EMBED_DESCRIPTION,
  chunkItems,
  getPage,
  clampPage,
  getPaginationInfo,
  paginationButtons,
  resolvePageFromButton,
  type PaginationInfo,
} from './pagination.js';

// -- Select menus (generic) --------------------------------------------------
export {
  buildPaginatedSelect,
  selectResultToRows,
  type SelectOption,
  type SelectOptionFormatter,
  type PaginatedSelectResult,
} from './select-menus.js';

// -- Trainer select ----------------------------------------------------------
export { userTrainerSelect, allTrainerSelect } from './trainer-select.js';

// -- Monster select ----------------------------------------------------------
export {
  monsterSelect,
  filteredMonsterSelect,
  filterMonsters,
  type MonsterFilter,
} from './monster-select.js';

// -- Town location select ----------------------------------------------------
export { townLocationSelect } from './town-location-select.js';

// -- Shop select -------------------------------------------------------------
export { shopSelect, shopItemSelect } from './shop-select.js';
