/**
 * Monster activity lists based on agro levels
 */

export type AgroCategory = 'peaceful' | 'semiAggressive' | 'attack';

export type MonsterActivities = {
  peaceful: string[];
  semiAggressive: string[];
  attack: string[];
};

export const monsterActivities: MonsterActivities = {
  // Peaceful activities (agro 0-50)
  peaceful: [
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
  ],

  // Semi-aggressive activities (agro 51-75)
  semiAggressive: [
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
  ],

  // Attack flavor text (agro 76+)
  attack: [
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
  ],
};

/**
 * Get activity category based on agro level
 */
export function getAgroCategoryFromLevel(agro: number): AgroCategory {
  if (agro >= 76) {
    return 'attack';
  } else if (agro >= 51) {
    return 'semiAggressive';
  }
  return 'peaceful';
}

/**
 * Get a random activity from a specific category
 */
export function getRandomActivity(category: AgroCategory): string {
  const activities = monsterActivities[category];
  const randomIndex = Math.floor(Math.random() * activities.length);
  return activities[randomIndex] ?? 'are watching cautiously';
}

/**
 * Get a random activity based on agro level
 */
export function getActivityByAgro(agro: number): string {
  const category = getAgroCategoryFromLevel(agro);
  return getRandomActivity(category);
}
