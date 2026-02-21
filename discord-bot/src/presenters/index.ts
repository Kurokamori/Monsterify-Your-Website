// ============================================================================
// Presenters — barrel export
// ============================================================================

// -- Base presenter helpers --------------------------------------------------
export {
  createEmbed,
  errorEmbed,
  successEmbed,
  infoEmbed,
  warningEmbed,
  siteUrl,
  trainerPageUrl,
  monsterPageUrl,
  formatSpecies,
  formatTypes,
  specialIndicators,
  specialIndicatorsCompact,
  truncateText,
  formatDate,
} from './base.presenter.js';

// -- Trainer presenter -------------------------------------------------------
export {
  TRAINER_SUMMARY_PAGE,
  TRAINER_DETAIL_PAGE,
  trainerSummaryEmbed,
  trainerSummaryView,
  trainerDetailEmbed,
  trainerDetailView,
  type TrainerViewResult,
} from './trainer.presenter.js';

// -- Monster presenter -------------------------------------------------------
export {
  MONSTER_SUMMARY_PAGE,
  MONSTER_DETAIL_PAGE,
  monsterSummaryEmbed,
  monsterSummaryView,
  monsterDetailEmbed,
  monsterDetailView,
  type MonsterViewResult,
} from './monster.presenter.js';

// -- Adventure presenter -----------------------------------------------------
export {
  ADVENTURE_PAGE,
  adventureSummaryEmbed,
  adventureDetailEmbed,
  adventureView,
  adventureWelcomeEmbed,
  encounterEmbed,
  wildEncounterEmbed,
  battleEncounterEmbed,
  itemEncounterEmbed,
  specialEncounterEmbed,
  encounterInstructions,
  captureResultEmbed,
  adventureEndEmbed,
  formatWeatherName,
  formatTerrainName,
  type AdventureViewResult,
} from './adventure.presenter.js';

// -- Battle presenter --------------------------------------------------------
export {
  battleStatusEmbed,
  battleActionEmbed,
  battleResolutionEmbed,
  weatherChangeEmbed,
  terrainChangeEmbed,
  battleInstructionsEmbed,
} from './battle.presenter.js';

// -- Town presenter ----------------------------------------------------------
export {
  mainMenuEmbed,
  townMenuEmbed,
  townLocationEmbed,
  townLocationById,
  type EmbedResult,
  type LocationViewOptions,
} from './town.presenter.js';

// -- Shop / Market presenter -------------------------------------------------
export {
  ITEMS_PER_PAGE,
  marketMenuEmbed,
  shopViewEmbed,
  shopTrainerPickerEmbed,
  shopStockEmbed,
  purchaseModal,
  purchaseSuccessEmbed,
  purchaseFailureEmbed,
  dealsEmbed,
  type ShopEmbedResult,
  type ShopViewOptions,
} from './shop.presenter.js';

// -- Reusable components (buttons, pagination, selects) ----------------------
export * from './components/index.js';
