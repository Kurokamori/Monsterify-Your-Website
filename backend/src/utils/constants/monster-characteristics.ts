/**
 * Monster Characteristics Constants
 * Defines all personality characteristics grouped by highest IV stat
 */

import { StatKeyValue } from './monster-natures';

/**
 * Characteristics are determined by a monster's highest IV
 * Each stat has 5 associated characteristics
 * The specific characteristic is determined by: highestIV mod 5
 */

// HP-related characteristics (highest IV is HP)
export const HP_CHARACTERISTICS = [
  'Loves to eat',
  'Takes plenty of siestas',
  'Nods off a lot',
  'Scatters things often',
  'Likes to relax',
] as const;

// Attack-related characteristics (highest IV is Attack)
export const ATTACK_CHARACTERISTICS = [
  'Proud of its power',
  'Likes to thrash about',
  'A little quick tempered',
  'Likes to fight',
  'Quick tempered',
] as const;

// Defense-related characteristics (highest IV is Defense)
export const DEFENSE_CHARACTERISTICS = [
  'Sturdy body',
  'Capable of taking hits',
  'Highly persistent',
  'Good endurance',
  'Good perseverance',
] as const;

// Special Attack-related characteristics (highest IV is Sp. Attack)
export const SP_ATTACK_CHARACTERISTICS = [
  'Highly curious',
  'Mischievous',
  'Thoroughly cunning',
  'Often lost in thought',
  'Very finicky',
] as const;

// Special Defense-related characteristics (highest IV is Sp. Defense)
export const SP_DEFENSE_CHARACTERISTICS = [
  'Strong willed',
  'Somewhat vain',
  'Strongly defiant',
  'Hates to lose',
  'Somewhat stubborn',
] as const;

// Speed-related characteristics (highest IV is Speed)
export const SPEED_CHARACTERISTICS = [
  'Likes to run',
  'Alert to sounds',
  'Impetuous and silly',
  'Somewhat of a clown',
  'Quick to flee',
] as const;

/**
 * Map of stat keys to their associated characteristics
 */
export const CHARACTERISTICS_BY_STAT: Record<StatKeyValue, readonly string[]> = {
  hp: HP_CHARACTERISTICS,
  atk: ATTACK_CHARACTERISTICS,
  def: DEFENSE_CHARACTERISTICS,
  spa: SP_ATTACK_CHARACTERISTICS,
  spd: SP_DEFENSE_CHARACTERISTICS,
  spe: SPEED_CHARACTERISTICS,
};

/**
 * All characteristics combined into a single array
 */
export const ALL_CHARACTERISTICS: string[] = [
  ...HP_CHARACTERISTICS,
  ...ATTACK_CHARACTERISTICS,
  ...DEFENSE_CHARACTERISTICS,
  ...SP_ATTACK_CHARACTERISTICS,
  ...SP_DEFENSE_CHARACTERISTICS,
  ...SPEED_CHARACTERISTICS,
];

/**
 * Reverse lookup: find which stat a characteristic indicates
 */
export const CHARACTERISTIC_TO_STAT: Record<string, StatKeyValue> = (() => {
  const map: Record<string, StatKeyValue> = {};

  HP_CHARACTERISTICS.forEach((char) => (map[char] = 'hp'));
  ATTACK_CHARACTERISTICS.forEach((char) => (map[char] = 'atk'));
  DEFENSE_CHARACTERISTICS.forEach((char) => (map[char] = 'def'));
  SP_ATTACK_CHARACTERISTICS.forEach((char) => (map[char] = 'spa'));
  SP_DEFENSE_CHARACTERISTICS.forEach((char) => (map[char] = 'spd'));
  SPEED_CHARACTERISTICS.forEach((char) => (map[char] = 'spe'));

  return map;
})();

/**
 * Get a random characteristic from any category
 * @returns A random characteristic string
 */
export function getRandomCharacteristic(): string {
  return ALL_CHARACTERISTICS[Math.floor(Math.random() * ALL_CHARACTERISTICS.length)] ?? 'Capable of taking hits';
}

/**
 * Determine characteristic based on IVs
 * The characteristic is determined by:
 * 1. Finding the highest IV stat
 * 2. Using (highestIV mod 5) to select from that stat's characteristics
 *
 * @param ivs - Object containing IV values for each stat
 * @returns The determined characteristic
 */
export function determineCharacteristic(ivs: Record<StatKeyValue, number>): string {
  // Find the stat with the highest IV
  let highestStat: StatKeyValue = 'hp';
  let highestValue = ivs.hp || 0;

  const statOrder: StatKeyValue[] = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];

  for (const stat of statOrder) {
    const value = ivs[stat] || 0;
    if (value > highestValue) {
      highestValue = value;
      highestStat = stat;
    }
  }

  // Get the characteristic index based on the IV value
  const characteristicIndex = highestValue % 5;
  const characteristics = CHARACTERISTICS_BY_STAT[highestStat];

  return characteristics[characteristicIndex] ?? 'Capable of taking hits';
}

/**
 * Check if a characteristic is valid
 * @param characteristic - The characteristic to check
 * @returns True if the characteristic is valid
 */
export function isValidCharacteristic(characteristic: string): boolean {
  return ALL_CHARACTERISTICS.includes(characteristic);
}

/**
 * Get the stat that a characteristic indicates
 * @param characteristic - The characteristic to look up
 * @returns The stat key or null if not found
 */
export function getStatFromCharacteristic(characteristic: string): StatKeyValue | null {
  return CHARACTERISTIC_TO_STAT[characteristic] ?? null;
}

/**
 * Get all characteristics for a specific stat
 * @param stat - The stat key
 * @returns Array of characteristics for that stat
 */
export function getCharacteristicsForStat(stat: StatKeyValue): readonly string[] {
  return CHARACTERISTICS_BY_STAT[stat] || [];
}
