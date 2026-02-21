/**
 * Monster Activity Constants
 * Defines activity descriptions based on aggression levels for adventure encounters
 */

/**
 * Aggression level thresholds
 */
export const AgroLevel = {
  PEACEFUL_MAX: 50,
  SEMI_AGGRESSIVE_MAX: 75,
  ATTACK_MIN: 76,
} as const;

/**
 * Peaceful activities (agro 0-50)
 * Describes calm, non-threatening monster behavior
 */
export const PEACEFUL_ACTIVITIES: readonly string[] = [
  'are basking in the warm sunlight',
  'are peacefully grazing in the meadow',
  'are playing with its companions',
  'are napping under a shady tree',
  'are drinking from a crystal clear stream',
  'are grooming itself contentedly',
  'are gathering berries and fruits',
  'are sunbathing on a warm rock',
  'are splashing playfully in a pond',
  'are chasing butterflies through the grass',
  'are building a cozy nest',
  'are humming a gentle melody',
  'are watching clouds drift by',
  'are collecting shiny pebbles',
  'are enjoying a peaceful meal',
  'are stretching lazily in the sunshine',
  'are rolling around in soft grass',
  'are admiring its reflection in water',
  'are sharing food with other creatures',
  'are taking a refreshing bath',
] as const;

/**
 * Semi-aggressive activities (agro 51-75)
 * Describes territorial or wary monster behavior
 */
export const SEMI_AGGRESSIVE_ACTIVITIES: readonly string[] = [
  'are prowling through the underbrush',
  'are marking its territory aggressively',
  'are growling at nearby movements',
  'are pacing back and forth restlessly',
  'are baring its teeth in warning',
  'are standing guard over its domain',
  'are eyeing you with suspicion',
  'are sniffing the air for threats',
  'are scratching the ground menacingly',
  'are letting out warning calls',
  'are flexing its muscles intimidatingly',
  'are circling its territory defensively',
  'are showing signs of agitation',
  'are bristling with defensive energy',
  'are emitting low, threatening sounds',
  'are positioning itself for confrontation',
  'are displaying aggressive postures',
  'are challenging other creatures nearby',
  'are preparing to defend its space',
  'are radiating hostile energy',
] as const;

/**
 * Attack activities (agro 76+)
 * Describes aggressive attack behavior
 */
export const ATTACK_ACTIVITIES: readonly string[] = [
  'roars with fury and charges directly at you!',
  'lets out a battle cry and launches into attack!',
  'snarls aggressively and prepares to strike!',
  'eyes blazing with rage, it attacks without warning!',
  'unleashes a fierce war cry and rushes forward!',
  'bares its fangs and lunges with deadly intent!',
  'emits a terrifying shriek and goes on the offensive!',
  'pounds the ground and charges with overwhelming force!',
  'bristles with fury and attacks with wild abandon!',
  'lets out a primal scream and enters combat mode!',
  'radiates pure aggression and strikes immediately!',
  'shows no mercy as it launches a vicious assault!',
  'enters a berserker rage and attacks relentlessly!',
  'channels its fury into a devastating charge!',
  'abandons all caution and goes for the kill!',
  'transforms into a whirlwind of claws and teeth!',
  'becomes a force of nature, attacking with primal fury!',
  'loses all restraint and unleashes its full power!',
  'enters a battle frenzy and strikes with lightning speed!',
  'becomes consumed by rage and attacks with everything it has!',
] as const;

/**
 * All monster activities organized by agro level
 */
export const MONSTER_ACTIVITIES = {
  peaceful: PEACEFUL_ACTIVITIES,
  semiAggressive: SEMI_AGGRESSIVE_ACTIVITIES,
  attack: ATTACK_ACTIVITIES,
} as const;

/**
 * Activity category type
 */
export type ActivityCategory = keyof typeof MONSTER_ACTIVITIES;

/**
 * Get a random activity for a given aggression level
 * @param agroLevel - The aggression level (0-100)
 * @returns A random activity description
 */
export function getRandomActivity(agroLevel: number): string {
  let activities: readonly string[];

  if (agroLevel <= AgroLevel.PEACEFUL_MAX) {
    activities = PEACEFUL_ACTIVITIES;
  } else if (agroLevel <= AgroLevel.SEMI_AGGRESSIVE_MAX) {
    activities = SEMI_AGGRESSIVE_ACTIVITIES;
  } else {
    activities = ATTACK_ACTIVITIES;
  }

  return activities[Math.floor(Math.random() * activities.length)] ?? 'resting';
}

/**
 * Get the activity category for a given aggression level
 * @param agroLevel - The aggression level (0-100)
 * @returns The activity category
 */
export function getActivityCategory(agroLevel: number): ActivityCategory {
  if (agroLevel <= AgroLevel.PEACEFUL_MAX) {
    return 'peaceful';
  } else if (agroLevel <= AgroLevel.SEMI_AGGRESSIVE_MAX) {
    return 'semiAggressive';
  }
  return 'attack';
}

/**
 * Get all activities for a category
 * @param category - The activity category
 * @returns Array of activity strings
 */
export function getActivitiesForCategory(category: ActivityCategory): readonly string[] {
  return MONSTER_ACTIVITIES[category];
}

/**
 * Check if an aggression level should trigger immediate combat
 * @param agroLevel - The aggression level
 * @returns True if the monster will attack immediately
 */
export function isImmediateAttack(agroLevel: number): boolean {
  return agroLevel >= AgroLevel.ATTACK_MIN;
}

/**
 * Generate a random aggression level within a range
 * @param min - Minimum aggression (0-100)
 * @param max - Maximum aggression (0-100)
 * @returns Random aggression level
 */
export function generateRandomAgro(min: number = 0, max: number = 100): number {
  const clampedMin = Math.max(0, Math.min(100, min));
  const clampedMax = Math.max(clampedMin, Math.min(100, max));
  return Math.floor(Math.random() * (clampedMax - clampedMin + 1)) + clampedMin;
}
