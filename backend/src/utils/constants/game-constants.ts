// ============================================================================
// Game Constants - One Source of Truth
// All static declarations for types, attributes, ranks, stages, etc.
// ============================================================================


// ============================================================================
// Monster Tables/Sources
// ============================================================================

export const MONSTER_TABLES = [
  'pokemon',
  'digimon',
  'yokai',
  'nexomon',
  'pals',
  'fakemon',
  'finalfantasy',
  'monsterhunter',
] as const;

export type MonsterTable = (typeof MONSTER_TABLES)[number];

// Table to database table name mapping
export const TABLE_NAME_MAP: Record<MonsterTable, string> = {
  pokemon: 'pokemon_monsters',
  digimon: 'digimon_monsters',
  yokai: 'yokai_monsters',
  nexomon: 'nexomon_monsters',
  pals: 'pals_monsters',
  fakemon: 'fakemon',
  finalfantasy: 'finalfantasy_monsters',
  monsterhunter: 'monsterhunter_monsters',
};

// ============================================================================
// Table Schemas - Field mappings for each monster table
// ============================================================================

export type TableSchema = {
  idField: string;
  nameField: string;
  typeFields: string[];
  attributeField: string | null;
  rarityFields: string[];
  evolutionFields: string[];
  stageField: string | null;
  imageField: string;
  additionalFields: string[];
};

export const TABLE_SCHEMAS: Record<MonsterTable, TableSchema> = {
  pokemon: {
    idField: 'id',
    nameField: 'name',
    typeFields: ['type_primary', 'type_secondary'],
    attributeField: null,
    rarityFields: ['is_legendary', 'is_mythical'],
    evolutionFields: ['evolves_from', 'evolves_to'],
    stageField: 'stage',
    imageField: 'image_url',
    additionalFields: ['ndex', 'breeding_results'],
  },
  digimon: {
    idField: 'id',
    nameField: 'name',
    typeFields: ['digimon_type'],
    attributeField: 'attribute',
    rarityFields: ['rank'],
    evolutionFields: ['digivolves_from', 'digivolves_to'],
    stageField: null,
    imageField: 'image_url',
    additionalFields: ['families', 'natural_attributes', 'level_required', 'breeding_results'],
  },
  yokai: {
    idField: 'id',
    nameField: 'name',
    typeFields: ['tribe'],
    attributeField: null,
    rarityFields: ['rank'],
    evolutionFields: ['evolves_from', 'evolves_to'],
    stageField: null,
    imageField: 'image_url',
    additionalFields: ['breeding_results'],
  },
  nexomon: {
    idField: 'nr',
    nameField: 'name',
    typeFields: ['type_primary', 'type_secondary'],
    attributeField: null,
    rarityFields: ['is_legendary'],
    evolutionFields: ['evolves_from', 'evolves_to'],
    stageField: 'stage',
    imageField: 'image_url',
    additionalFields: ['breeding_results'],
  },
  pals: {
    idField: 'id',
    nameField: 'name',
    typeFields: [],
    attributeField: null,
    rarityFields: [],
    evolutionFields: [],
    stageField: null,
    imageField: 'image_url',
    additionalFields: [],
  },
  fakemon: {
    idField: 'id',
    nameField: 'name',
    typeFields: ['type1', 'type2', 'type3', 'type4', 'type5'],
    attributeField: 'attribute',
    rarityFields: ['is_legendary', 'is_mythical'],
    evolutionFields: ['evolves_from', 'evolves_to'],
    stageField: 'stage',
    imageField: 'image_url',
    additionalFields: ['breeding_results'],
  },
  finalfantasy: {
    idField: 'id',
    nameField: 'name',
    typeFields: [],
    attributeField: null,
    rarityFields: [],
    evolutionFields: ['evolves_from', 'evolves_to'],
    stageField: 'stage',
    imageField: 'image_url',
    additionalFields: ['breeding_results'],
  },
  monsterhunter: {
    idField: 'id',
    nameField: 'name',
    typeFields: [],
    attributeField: 'element',
    rarityFields: ['rank'],
    evolutionFields: [],
    stageField: null,
    imageField: 'image_url',
    additionalFields: [],
  },
};

// ============================================================================
// Characteristics
// ============================================================================

export const CHARACTERISTICS = [
  'Loves to eat',
  'Takes plenty of siestas',
  'Nods off a lot',
  'Scatters things often',
  'Likes to relax',
  'Proud of its power',
  'Likes to thrash about',
  'A little quick tempered',
  'Likes to fight',
  'Quick tempered',
  'Sturdy body',
  'Capable of taking hits',
  'Highly persistent',
  'Good endurance',
  'Good perseverance',
  'Highly curious',
  'Mischievous',
  'Thoroughly cunning',
  'Often lost in thought',
  'Very finicky',
  'Strong willed',
  'Somewhat vain',
  'Strongly defiant',
  'Hates to lose',
  'Somewhat stubborn',
  'Likes to run',
  'Alert to sounds',
  'Impetuous and silly',
  'Somewhat of a clown',
  'Quick to flee',
  'Often dozes off',
] as const;

export type Characteristic = (typeof CHARACTERISTICS)[number];

// ============================================================================
// Pokeball Types and Capture Rates
// ============================================================================

export const POKEBALL_TYPES = [
  'Poke Ball',
  'Great Ball',
  'Ultra Ball',
  'Master Ball',
  'Premier Ball',
  'Luxury Ball',
  'Timer Ball',
  'Repeat Ball',
  'Net Ball',
  'Dive Ball',
] as const;

export type PokeballType = (typeof POKEBALL_TYPES)[number];

export const POKEBALL_CAPTURE_RATES: Record<PokeballType, number> = {
  'Poke Ball': 0.5,
  'Great Ball': 0.65,
  'Ultra Ball': 0.8,
  'Master Ball': 1.0,
  'Premier Ball': 0.5,
  'Luxury Ball': 0.5,
  'Timer Ball': 0.6,
  'Repeat Ball': 0.7,
  'Net Ball': 0.6,
  'Dive Ball': 0.6,
};

// ============================================================================
// Submission Types
// ============================================================================

export const SUBMISSION_TYPES = ['art', 'writing', 'prompt', 'adventure'] as const;

export type SubmissionType = (typeof SUBMISSION_TYPES)[number];

// ============================================================================
// Art Quality Levels
// ============================================================================

export const ART_QUALITY_LEVELS = [
  'sketch',
  'sketchSet',
  'lineArt',
  'flatColor',
  'rendered',
  'polished',
] as const;

export type ArtQualityLevel = (typeof ART_QUALITY_LEVELS)[number];

// Base levels per quality
export const ART_QUALITY_BASE_LEVELS: Record<ArtQualityLevel, number> = {
  sketch: 2,
  sketchSet: 3,
  lineArt: 4,
  flatColor: 5,
  rendered: 7,
  polished: 9,
};

// ============================================================================
// Background Types
// ============================================================================

export const BACKGROUND_TYPES = ['none', 'simple', 'complex'] as const;

export type BackgroundType = (typeof BACKGROUND_TYPES)[number];

// Background bonus levels
export const BACKGROUND_BONUS_LEVELS: Record<BackgroundType, number> = {
  none: 0,
  simple: 3,
  complex: 6,
};

// ============================================================================
// Appearance Types
// ============================================================================

export const APPEARANCE_TYPES = ['bust', 'halfBody', 'fullBody'] as const;

export type AppearanceType = (typeof APPEARANCE_TYPES)[number];

// Appearance bonus levels
export const APPEARANCE_BONUS_LEVELS: Record<AppearanceType, number> = {
  bust: 1,
  halfBody: 2,
  fullBody: 3,
};

// ============================================================================
// Reward Rates
// ============================================================================

export const DEFAULT_REWARD_RATES = {
  wordsPerLevel: 50,
  wordsPerCoin: 1,
  wordsPerItem: 1000,
  coinsPerLevel: 50,
} as const;

// ============================================================================
// External Submission Constants
// ============================================================================

export const EXTERNAL_REWARD_RATES = {
  wordsPerLevel: 100,
  coinsPerLevel: 50,
  artLevelDivisor: 2,
  bonusRewardDivisor: 2,
} as const;

export const EXTERNAL_CHARACTER_COMPLEXITY = {
  simple: 1,
  average: 3,
  complex: 5,
  extravagant: 7,
} as const;

export type ExternalCharacterComplexity = keyof typeof EXTERNAL_CHARACTER_COMPLEXITY;

// ============================================================================
// Egg Hatching Constants
// ============================================================================

export const EGG_HATCHING = {
  // Number of monster options per egg
  monstersPerEgg: 10,

  // Table-specific filters for egg hatching
  tableFilters: {
    pokemon: {
      includeStages: ['Base Stage', "Doesn't Evolve"],
      excludeStages: [
        'Stage 1',
        'Stage 2',
        'Stage 3',
        'Middle Stage',
        'Final Stage',
      ],
      legendary: false,
      mythical: false,
    },
    digimon: {
      includeRanks: ['Baby I', 'Baby II'],
      excludeRanks: ['Child', 'Adult', 'Perfect', 'Ultimate', 'Mega', 'Rookie', 'Champion'],
    },
    yokai: {
      includeRanks: ['E', 'D', 'C'],
      excludeRanks: ['S', 'A', 'B'],
      includeStages: ['Base Stage', "Doesn't Evolve"],
      excludeStages: ['Stage 1', 'Stage 2', 'Stage 3', 'Middle Stage', 'Final Stage'],
    },
    nexomon: {
      includeStages: ['Base Stage', "Doesn't Evolve"],
      excludeStages: ['Stage 1', 'Stage 2', 'Stage 3', 'Middle Stage', 'Final Stage'],
      legendary: false,
    },
    pals: {
      // Pals don't have evolution stages or ranks
    },
    fakemon: {
      includeStages: ['Base Stage', "Doesn't Evolve"],
      excludeStages: ['Stage 1', 'Stage 2', 'Stage 3', 'Middle Stage', 'Final Stage'],
      legendary: false,
      mythical: false,
    },
    finalfantasy: {
      // Final Fantasy monsters follow standard stage restrictions
    },
    monsterhunter: {
      // Monster Hunter monsters don't evolve
    },
  },
} as const;

// ============================================================================
// Ice Cream Items for Type Selection
// ============================================================================

export const ICE_CREAM_TYPE_SLOTS: Record<string, string> = {
  'Vanilla Ice Cream': 'type1',
  'Strawberry Ice Cream': 'type2',
  'Chocolate Ice Cream': 'type3',
  'Mint Ice Cream': 'type4',
  'Pecan Ice Cream': 'type5',
};

// ============================================================================
// Milk Items for Type Count
// ============================================================================

export const MILK_TYPE_MINIMUMS: Record<string, number> = {
  'Vanilla Milk': 2,
  'Chocolate Milk': 3,
  'Strawberry Milk': 4,
  'MooMoo Milk': 5,
};

// ============================================================================
// Special Berries
// ============================================================================

export const SPECIAL_BERRIES = ['Forget-Me-Not', 'Edenwiess'] as const;

export type SpecialBerryName = (typeof SPECIAL_BERRIES)[number];

// ============================================================================
// Level Constants
// ============================================================================

export const LEVEL_CONSTANTS = {
  maxLevel: 100,
  startingLevel: 1,
  defaultStartingHp: 100,
} as const;

// ============================================================================
// IV/EV Constants
// ============================================================================

export const IV_EV_CONSTANTS = {
  minIV: 0,
  maxIV: 31,
  minEV: 0,
  maxEV: 255,
  maxTotalEVs: 510,
  defaultEV: 0,
} as const;

// ============================================================================
// Stat Names
// ============================================================================

export const STAT_NAMES = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const;

export type StatName = (typeof STAT_NAMES)[number];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get a random element from an array
 */
export function getRandomElement<T>(array: readonly T[]): T {
  if (array.length === 0) {
    throw new Error('Cannot get random element from empty array');
  }
  const element = array[Math.floor(Math.random() * array.length)];
  if (element === undefined) {
    throw new Error('Failed to get random element');
  }
  return element;
}

/**
 * Get a weighted random element
 */
export function getWeightedRandom<T extends string>(weights: Record<T, number>): T {
  const entries = Object.entries(weights) as [T, number][];
  if (entries.length === 0) {
    throw new Error('Cannot get weighted random from empty weights');
  }
  const totalWeight = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let random = Math.random() * totalWeight;

  for (const [item, weight] of entries) {
    random -= weight;
    if (random <= 0) {
      return item;
    }
  }

  // Fallback to first entry
  const firstEntry = entries[0];
  if (!firstEntry) {
    throw new Error('No entries available for weighted random');
  }
  return firstEntry[0];
}


/**
 * Check if a value is a valid monster table
 */
export function isMonsterTable(value: string): value is MonsterTable {
  return MONSTER_TABLES.includes(value as MonsterTable);
}

/**
 * Get the database table name for a monster table
 */
export function getTableName(table: MonsterTable): string {
  return TABLE_NAME_MAP[table];
}

/**
 * Get the schema for a monster table
 */
export function getTableSchema(table: MonsterTable): TableSchema {
  return TABLE_SCHEMAS[table];
}
