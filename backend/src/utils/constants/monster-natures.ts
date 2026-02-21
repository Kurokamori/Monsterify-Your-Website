/**
 * Monster Nature Constants
 * Defines all 25 natures and their stat modifiers
 */

// Stat keys used for nature modifiers
export const StatKey = {
  HP: 'hp',
  ATTACK: 'atk',
  DEFENSE: 'def',
  SP_ATTACK: 'spa',
  SP_DEFENSE: 'spd',
  SPEED: 'spe',
} as const;

export type StatKeyName = keyof typeof StatKey;
export type StatKeyValue = (typeof StatKey)[StatKeyName];

// Array of combat stat keys (excluding HP as natures don't affect HP)
export const COMBAT_STAT_KEYS: StatKeyValue[] = ['atk', 'def', 'spa', 'spd', 'spe'];

// All stat keys including HP
export const ALL_STAT_KEYS: StatKeyValue[] = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];

/**
 * Interface for stat modifiers applied by a nature
 */
export interface StatModifiers {
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
}

/**
 * Interface for nature definition with metadata
 */
export interface NatureDefinition {
  name: string;
  increased: StatKeyValue | null;
  decreased: StatKeyValue | null;
  modifiers: StatModifiers;
}

// Default neutral stat modifiers (1.0 for all stats)
const NEUTRAL_MODIFIERS: StatModifiers = {
  atk: 1.0,
  def: 1.0,
  spa: 1.0,
  spd: 1.0,
  spe: 1.0,
};

/**
 * All 25 monster natures with their stat modifications
 * - Neutral natures: Hardy, Docile, Serious, Bashful, Quirky (no stat changes)
 * - Other natures: +10% to one stat, -10% to another
 */
export const NATURES: Record<string, NatureDefinition> = {
  // Neutral natures (no stat changes)
  Hardy: {
    name: 'Hardy',
    increased: null,
    decreased: null,
    modifiers: { ...NEUTRAL_MODIFIERS },
  },
  Docile: {
    name: 'Docile',
    increased: null,
    decreased: null,
    modifiers: { ...NEUTRAL_MODIFIERS },
  },
  Serious: {
    name: 'Serious',
    increased: null,
    decreased: null,
    modifiers: { ...NEUTRAL_MODIFIERS },
  },
  Bashful: {
    name: 'Bashful',
    increased: null,
    decreased: null,
    modifiers: { ...NEUTRAL_MODIFIERS },
  },
  Quirky: {
    name: 'Quirky',
    increased: null,
    decreased: null,
    modifiers: { ...NEUTRAL_MODIFIERS },
  },

  // Attack-boosting natures (+ATK)
  Lonely: {
    name: 'Lonely',
    increased: 'atk',
    decreased: 'def',
    modifiers: { atk: 1.1, def: 0.9, spa: 1.0, spd: 1.0, spe: 1.0 },
  },
  Brave: {
    name: 'Brave',
    increased: 'atk',
    decreased: 'spe',
    modifiers: { atk: 1.1, def: 1.0, spa: 1.0, spd: 1.0, spe: 0.9 },
  },
  Adamant: {
    name: 'Adamant',
    increased: 'atk',
    decreased: 'spa',
    modifiers: { atk: 1.1, def: 1.0, spa: 0.9, spd: 1.0, spe: 1.0 },
  },
  Naughty: {
    name: 'Naughty',
    increased: 'atk',
    decreased: 'spd',
    modifiers: { atk: 1.1, def: 1.0, spa: 1.0, spd: 0.9, spe: 1.0 },
  },

  // Defense-boosting natures (+DEF)
  Bold: {
    name: 'Bold',
    increased: 'def',
    decreased: 'atk',
    modifiers: { atk: 0.9, def: 1.1, spa: 1.0, spd: 1.0, spe: 1.0 },
  },
  Relaxed: {
    name: 'Relaxed',
    increased: 'def',
    decreased: 'spe',
    modifiers: { atk: 1.0, def: 1.1, spa: 1.0, spd: 1.0, spe: 0.9 },
  },
  Impish: {
    name: 'Impish',
    increased: 'def',
    decreased: 'spa',
    modifiers: { atk: 1.0, def: 1.1, spa: 0.9, spd: 1.0, spe: 1.0 },
  },
  Lax: {
    name: 'Lax',
    increased: 'def',
    decreased: 'spd',
    modifiers: { atk: 1.0, def: 1.1, spa: 1.0, spd: 0.9, spe: 1.0 },
  },

  // Speed-boosting natures (+SPE)
  Timid: {
    name: 'Timid',
    increased: 'spe',
    decreased: 'atk',
    modifiers: { atk: 0.9, def: 1.0, spa: 1.0, spd: 1.0, spe: 1.1 },
  },
  Hasty: {
    name: 'Hasty',
    increased: 'spe',
    decreased: 'def',
    modifiers: { atk: 1.0, def: 0.9, spa: 1.0, spd: 1.0, spe: 1.1 },
  },
  Jolly: {
    name: 'Jolly',
    increased: 'spe',
    decreased: 'spa',
    modifiers: { atk: 1.0, def: 1.0, spa: 0.9, spd: 1.0, spe: 1.1 },
  },
  Naive: {
    name: 'Naive',
    increased: 'spe',
    decreased: 'spd',
    modifiers: { atk: 1.0, def: 1.0, spa: 1.0, spd: 0.9, spe: 1.1 },
  },

  // Special Attack-boosting natures (+SPA)
  Modest: {
    name: 'Modest',
    increased: 'spa',
    decreased: 'atk',
    modifiers: { atk: 0.9, def: 1.0, spa: 1.1, spd: 1.0, spe: 1.0 },
  },
  Mild: {
    name: 'Mild',
    increased: 'spa',
    decreased: 'def',
    modifiers: { atk: 1.0, def: 0.9, spa: 1.1, spd: 1.0, spe: 1.0 },
  },
  Quiet: {
    name: 'Quiet',
    increased: 'spa',
    decreased: 'spe',
    modifiers: { atk: 1.0, def: 1.0, spa: 1.1, spd: 1.0, spe: 0.9 },
  },
  Rash: {
    name: 'Rash',
    increased: 'spa',
    decreased: 'spd',
    modifiers: { atk: 1.0, def: 1.0, spa: 1.1, spd: 0.9, spe: 1.0 },
  },

  // Special Defense-boosting natures (+SPD)
  Calm: {
    name: 'Calm',
    increased: 'spd',
    decreased: 'atk',
    modifiers: { atk: 0.9, def: 1.0, spa: 1.0, spd: 1.1, spe: 1.0 },
  },
  Gentle: {
    name: 'Gentle',
    increased: 'spd',
    decreased: 'def',
    modifiers: { atk: 1.0, def: 0.9, spa: 1.0, spd: 1.1, spe: 1.0 },
  },
  Sassy: {
    name: 'Sassy',
    increased: 'spd',
    decreased: 'spe',
    modifiers: { atk: 1.0, def: 1.0, spa: 1.0, spd: 1.1, spe: 0.9 },
  },
  Careful: {
    name: 'Careful',
    increased: 'spd',
    decreased: 'spa',
    modifiers: { atk: 1.0, def: 1.0, spa: 0.9, spd: 1.1, spe: 1.0 },
  },
};

// Array of all nature names for iteration
export const NATURE_NAMES = Object.keys(NATURES);

// Array of neutral nature names
export const NEUTRAL_NATURES = ['Hardy', 'Docile', 'Serious', 'Bashful', 'Quirky'];

/**
 * Get nature modifiers by nature name
 * @param nature - The nature name
 * @returns The stat modifiers for the nature, or default if not found
 */
export function getNatureModifiers(nature: string): StatModifiers {
  const natureDef = NATURES[nature];
  return natureDef ? { ...natureDef.modifiers } : { ...NEUTRAL_MODIFIERS };
}

/**
 * Get the nature definition by name
 * @param nature - The nature name
 * @returns The nature definition or null if not found
 */
export function getNatureDefinition(nature: string): NatureDefinition | null {
  return NATURES[nature] ?? null;
}

/**
 * Check if a nature is neutral (no stat changes)
 * @param nature - The nature name
 * @returns True if the nature is neutral
 */
export function isNeutralNature(nature: string): boolean {
  return NEUTRAL_NATURES.includes(nature);
}

/**
 * Check if a nature name is valid
 * @param nature - The nature name to check
 * @returns True if the nature is valid
 */
export function isValidNature(nature: string): boolean {
  return nature in NATURES;
}

/**
 * Get a random nature
 * @returns A random nature name
 */
export function getRandomNature(): string {
  return NATURE_NAMES[Math.floor(Math.random() * NATURE_NAMES.length)] ?? 'Hardy';
}

/**
 * Get natures that boost a specific stat
 * @param stat - The stat key to filter by
 * @returns Array of nature names that boost the stat
 */
export function getNaturesByBoostedStat(stat: StatKeyValue): string[] {
  return NATURE_NAMES.filter((name) => NATURES[name]?.increased === stat);
}

/**
 * Get natures that lower a specific stat
 * @param stat - The stat key to filter by
 * @returns Array of nature names that lower the stat
 */
export function getNaturesByLoweredStat(stat: StatKeyValue): string[] {
  return NATURE_NAMES.filter((name) => NATURES[name]?.decreased === stat);
}
