/**
 * Monster Type Constants
 * Defines all 18 monster types and the complete type effectiveness chart
 */

// Monster type definitions
export const MonsterType = {
  NORMAL: 'Normal',
  FIRE: 'Fire',
  WATER: 'Water',
  ELECTRIC: 'Electric',
  GRASS: 'Grass',
  ICE: 'Ice',
  FIGHTING: 'Fighting',
  POISON: 'Poison',
  GROUND: 'Ground',
  FLYING: 'Flying',
  PSYCHIC: 'Psychic',
  BUG: 'Bug',
  ROCK: 'Rock',
  GHOST: 'Ghost',
  DRAGON: 'Dragon',
  DARK: 'Dark',
  STEEL: 'Steel',
  FAIRY: 'Fairy',
} as const;

export type MonsterTypeKey = keyof typeof MonsterType;
export type MonsterTypeValue = (typeof MonsterType)[MonsterTypeKey];

// Array of all monster type values for iteration
export const MONSTER_TYPES: MonsterTypeValue[] = Object.values(MonsterType);

// Array of all monster type keys
export const MONSTER_TYPE_KEYS: MonsterTypeKey[] = Object.keys(MonsterType) as MonsterTypeKey[];

/**
 * Type effectiveness chart
 * Maps attacking type -> defending type -> damage multiplier
 *
 * Multipliers:
 * - 2.0 = Super effective
 * - 0.5 = Not very effective
 * - 0 = No effect (immune)
 * - 1.0 = Normal effectiveness (not listed, assumed default)
 */
export const TYPE_EFFECTIVENESS: Record<MonsterTypeValue, Partial<Record<MonsterTypeValue, number>>> = {
  [MonsterType.NORMAL]: {
    [MonsterType.ROCK]: 0.5,
    [MonsterType.GHOST]: 0,
    [MonsterType.STEEL]: 0.5,
  },
  [MonsterType.FIRE]: {
    [MonsterType.FIRE]: 0.5,
    [MonsterType.WATER]: 0.5,
    [MonsterType.GRASS]: 2,
    [MonsterType.ICE]: 2,
    [MonsterType.BUG]: 2,
    [MonsterType.ROCK]: 0.5,
    [MonsterType.DRAGON]: 0.5,
    [MonsterType.STEEL]: 2,
  },
  [MonsterType.WATER]: {
    [MonsterType.FIRE]: 2,
    [MonsterType.WATER]: 0.5,
    [MonsterType.GRASS]: 0.5,
    [MonsterType.GROUND]: 2,
    [MonsterType.ROCK]: 2,
    [MonsterType.DRAGON]: 0.5,
  },
  [MonsterType.ELECTRIC]: {
    [MonsterType.WATER]: 2,
    [MonsterType.ELECTRIC]: 0.5,
    [MonsterType.GRASS]: 0.5,
    [MonsterType.GROUND]: 0,
    [MonsterType.FLYING]: 2,
    [MonsterType.DRAGON]: 0.5,
  },
  [MonsterType.GRASS]: {
    [MonsterType.FIRE]: 0.5,
    [MonsterType.WATER]: 2,
    [MonsterType.GRASS]: 0.5,
    [MonsterType.POISON]: 0.5,
    [MonsterType.GROUND]: 2,
    [MonsterType.FLYING]: 0.5,
    [MonsterType.BUG]: 0.5,
    [MonsterType.ROCK]: 2,
    [MonsterType.DRAGON]: 0.5,
    [MonsterType.STEEL]: 0.5,
  },
  [MonsterType.ICE]: {
    [MonsterType.FIRE]: 0.5,
    [MonsterType.WATER]: 0.5,
    [MonsterType.GRASS]: 2,
    [MonsterType.ICE]: 0.5,
    [MonsterType.GROUND]: 2,
    [MonsterType.FLYING]: 2,
    [MonsterType.DRAGON]: 2,
    [MonsterType.STEEL]: 0.5,
  },
  [MonsterType.FIGHTING]: {
    [MonsterType.NORMAL]: 2,
    [MonsterType.ICE]: 2,
    [MonsterType.POISON]: 0.5,
    [MonsterType.FLYING]: 0.5,
    [MonsterType.PSYCHIC]: 0.5,
    [MonsterType.BUG]: 0.5,
    [MonsterType.ROCK]: 2,
    [MonsterType.GHOST]: 0,
    [MonsterType.DARK]: 2,
    [MonsterType.STEEL]: 2,
    [MonsterType.FAIRY]: 0.5,
  },
  [MonsterType.POISON]: {
    [MonsterType.GRASS]: 2,
    [MonsterType.POISON]: 0.5,
    [MonsterType.GROUND]: 0.5,
    [MonsterType.ROCK]: 0.5,
    [MonsterType.GHOST]: 0.5,
    [MonsterType.STEEL]: 0,
    [MonsterType.FAIRY]: 2,
  },
  [MonsterType.GROUND]: {
    [MonsterType.FIRE]: 2,
    [MonsterType.ELECTRIC]: 2,
    [MonsterType.GRASS]: 0.5,
    [MonsterType.POISON]: 2,
    [MonsterType.FLYING]: 0,
    [MonsterType.BUG]: 0.5,
    [MonsterType.ROCK]: 2,
    [MonsterType.STEEL]: 2,
  },
  [MonsterType.FLYING]: {
    [MonsterType.ELECTRIC]: 0.5,
    [MonsterType.GRASS]: 2,
    [MonsterType.FIGHTING]: 2,
    [MonsterType.BUG]: 2,
    [MonsterType.ROCK]: 0.5,
    [MonsterType.STEEL]: 0.5,
  },
  [MonsterType.PSYCHIC]: {
    [MonsterType.FIGHTING]: 2,
    [MonsterType.POISON]: 2,
    [MonsterType.PSYCHIC]: 0.5,
    [MonsterType.DARK]: 0,
    [MonsterType.STEEL]: 0.5,
  },
  [MonsterType.BUG]: {
    [MonsterType.FIRE]: 0.5,
    [MonsterType.GRASS]: 2,
    [MonsterType.FIGHTING]: 0.5,
    [MonsterType.POISON]: 0.5,
    [MonsterType.FLYING]: 0.5,
    [MonsterType.PSYCHIC]: 2,
    [MonsterType.GHOST]: 0.5,
    [MonsterType.DARK]: 2,
    [MonsterType.STEEL]: 0.5,
    [MonsterType.FAIRY]: 0.5,
  },
  [MonsterType.ROCK]: {
    [MonsterType.FIRE]: 2,
    [MonsterType.ICE]: 2,
    [MonsterType.FIGHTING]: 0.5,
    [MonsterType.GROUND]: 0.5,
    [MonsterType.FLYING]: 2,
    [MonsterType.BUG]: 2,
    [MonsterType.STEEL]: 0.5,
  },
  [MonsterType.GHOST]: {
    [MonsterType.NORMAL]: 0,
    [MonsterType.PSYCHIC]: 2,
    [MonsterType.GHOST]: 2,
    [MonsterType.DARK]: 0.5,
  },
  [MonsterType.DRAGON]: {
    [MonsterType.DRAGON]: 2,
    [MonsterType.STEEL]: 0.5,
    [MonsterType.FAIRY]: 0,
  },
  [MonsterType.DARK]: {
    [MonsterType.FIGHTING]: 0.5,
    [MonsterType.PSYCHIC]: 2,
    [MonsterType.GHOST]: 2,
    [MonsterType.DARK]: 0.5,
    [MonsterType.FAIRY]: 0.5,
  },
  [MonsterType.STEEL]: {
    [MonsterType.FIRE]: 0.5,
    [MonsterType.WATER]: 0.5,
    [MonsterType.ELECTRIC]: 0.5,
    [MonsterType.ICE]: 2,
    [MonsterType.ROCK]: 2,
    [MonsterType.STEEL]: 0.5,
    [MonsterType.FAIRY]: 2,
  },
  [MonsterType.FAIRY]: {
    [MonsterType.FIRE]: 0.5,
    [MonsterType.FIGHTING]: 2,
    [MonsterType.POISON]: 0.5,
    [MonsterType.DRAGON]: 2,
    [MonsterType.DARK]: 2,
    [MonsterType.STEEL]: 0.5,
  },
};

/**
 * Calculate type effectiveness multiplier for an attack
 * @param attackingType - The type of the attacking move
 * @param defendingTypes - Array of the defending monster's types
 * @returns The total effectiveness multiplier
 */
export function calculateTypeEffectiveness(
  attackingType: MonsterTypeValue,
  defendingTypes: MonsterTypeValue[]
): number {
  let effectiveness = 1.0;

  const typeChart = TYPE_EFFECTIVENESS[attackingType];
  if (typeChart) {
    for (const defendingType of defendingTypes) {
      if (defendingType && typeChart[defendingType] !== undefined) {
        effectiveness *= typeChart[defendingType] ?? 1;
      }
    }
  }

  return effectiveness;
}

/**
 * Get the effectiveness description for a multiplier
 * @param multiplier - The effectiveness multiplier
 * @returns A human-readable description
 */
export function getEffectivenessDescription(multiplier: number): string {
  if (multiplier === 0) {return 'No effect';}
  if (multiplier < 0.5) {return 'Barely effective';}
  if (multiplier < 1) {return 'Not very effective';}
  if (multiplier === 1) {return 'Normal effectiveness';}
  if (multiplier < 2) {return 'Effective';}
  if (multiplier === 2) {return 'Super effective';}
  return 'Extremely effective';
}

/**
 * Check if a type value is valid
 * @param type - The type value to check
 * @returns True if the type is a valid MonsterTypeValue
 */
export function isValidMonsterType(type: string): type is MonsterTypeValue {
  return MONSTER_TYPES.includes(type as MonsterTypeValue);
}

/**
 * Normalize a type string to proper case
 * @param type - The type string to normalize
 * @returns The normalized type value or null if invalid
 */
export function normalizeMonsterType(type: string): MonsterTypeValue | null {
  const normalized = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  return isValidMonsterType(normalized) ? normalized : null;
}
