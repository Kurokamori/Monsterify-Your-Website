// Trainer Types
export type {
  Trainer,
  TrainerRace,
  MegaEvolutionInfo,
  AdditionalReference,
  TrainerSecret,
  TrainerRelation,
  TrainerInventory,
  InventoryItem,
  TrainerFormData,
  TrainerFormMode,
  TrainerListFilters,
  TrainerCardData,
  FormSecret,
  FormRelation,
  FormAdditionalRef,
  MegaFormData
} from './types/Trainer';

export {
  getTrainerTypes,
  parseTrainerTheme,
  combineTrainerTheme,
  parseVoiceClaim,
  combineVoiceClaim
} from './types/Trainer';

// Trainer Form Options
export {
  TYPES,
  ATTRIBUTES,
  FAKEMON_CATEGORIES,
  FACTIONS,
  NATURES,
  CHARACTERISTICS,
  BERRIES,
  RACES,
  TYPE_OPTIONS,
  FACTION_OPTIONS,
  NATURE_OPTIONS,
  CHARACTERISTIC_OPTIONS,
  BERRY_OPTIONS,
  ATTRIBUTE_OPTIONS,
  RACE_OPTIONS,
  RACE_SELECT_OPTIONS,
  FACTION_SELECT_OPTIONS,
  toAutocompleteOptions,
  getOptionsForField
} from './data/trainerFormOptions';

export type {
  MonsterType,
  MonsterAttribute,
  Faction,
  Nature,
  Characteristic,
  Berry,
  Race
} from './data/trainerFormOptions';

// Components
export { TrainerCard, TrainerCardSkeleton } from './TrainerCard';
export { TrainerGrid, TrainerGridSkeleton } from './TrainerGrid';
export { TrainerForm } from './TrainerForm';
export { useTrainerForm } from './useTrainerForm';

// Form Field Components
export {
  BasicInfoFields,
  PersonalInfoFields,
  SpeciesTypesFields,
  BiographyFields,
  FavoriteTypesFields,
  CharacterInfoFields,
  AllTrainerFields
} from './TrainerFormFields';

// Dynamic Form Sections
export {
  SecretsSection,
  RelationsSection,
  AdditionalRefsSection,
  MegaEvolutionSection
} from './TrainerDynamicSections';

// Page-level Form
export { TrainerPageForm } from './TrainerPageForm';
export type { SubmitResult } from './TrainerPageForm';

// Mass Edit Modal
export { MassEditModal } from './MassEditModal';
export type { MassEditMonster } from './MassEditModal';
