/**
 * Location Activity Constants
 * Static definitions for all town locations, their activities, and reward configurations.
 */

// ============================================================================
// Location & Activity IDs
// ============================================================================

export const LOCATION_IDS = ['pirates_dock', 'garden', 'farm', 'game_corner'] as const;
export type LocationId = (typeof LOCATION_IDS)[number];

export const ACTIVITY_IDS = ['swab', 'fishing', 'tend', 'work', 'play'] as const;
export type ActivityId = (typeof ACTIVITY_IDS)[number];

// ============================================================================
// Reward Configuration
// ============================================================================

export type RewardConfig = {
  baseCoinAmount: number;
  coinVariance: number;
  itemChance: number;
  levelChance: number;
  monsterChance: number;
  itemCategory: string | null;
  allowedMonsterTypes: string[] | null;
  legendaryChance: number;
  guaranteedMonsterOnHard: boolean;
};

// ============================================================================
// Activity Configuration
// ============================================================================

export type ActivityConfig = {
  id: ActivityId;
  label: string;
  rewards: RewardConfig;
};

// ============================================================================
// Location Configuration
// ============================================================================

export type LocationConfig = {
  id: LocationId;
  label: string;
  activities: ActivityConfig[];
};

// ============================================================================
// Location Definitions
// ============================================================================

const PIRATES_DOCK_SWAB: ActivityConfig = {
  id: 'swab',
  label: 'Swab the Deck',
  rewards: {
    baseCoinAmount: 60,
    coinVariance: 50,
    itemChance: 0.80,
    levelChance: 0.50,
    monsterChance: 0.05,
    itemCategory: 'any',
    allowedMonsterTypes: null,
    legendaryChance: 0,
    guaranteedMonsterOnHard: false,
  },
};

const PIRATES_DOCK_FISHING: ActivityConfig = {
  id: 'fishing',
  label: 'Go Fishing',
  rewards: {
    baseCoinAmount: 70,
    coinVariance: 50,
    itemChance: 0.50,
    levelChance: 0.50,
    monsterChance: 0.15,
    itemCategory: 'items',
    allowedMonsterTypes: ['Water', 'Ice', 'Dark'],
    legendaryChance: 0,
    guaranteedMonsterOnHard: true,
  },
};

const GARDEN_TEND: ActivityConfig = {
  id: 'tend',
  label: 'Tend the Garden',
  rewards: {
    baseCoinAmount: 55,
    coinVariance: 50,
    itemChance: 0.75,
    levelChance: 0.60,
    monsterChance: 0.05,
    itemCategory: 'berries',
    allowedMonsterTypes: ['Grass', 'Bug', 'Ground', 'Normal'],
    legendaryChance: 0,
    guaranteedMonsterOnHard: false,
  },
};

const FARM_WORK: ActivityConfig = {
  id: 'work',
  label: 'Work the Farm',
  rewards: {
    baseCoinAmount: 65,
    coinVariance: 50,
    itemChance: 0.85,
    levelChance: 0.50,
    monsterChance: 0.10,
    itemCategory: 'eggs',
    allowedMonsterTypes: null,
    legendaryChance: 0,
    guaranteedMonsterOnHard: false,
  },
};

const GAME_CORNER_PLAY: ActivityConfig = {
  id: 'play',
  label: 'Play at the Game Corner',
  rewards: {
    baseCoinAmount: 100,
    coinVariance: 50,
    itemChance: 0.90,
    levelChance: 0.50,
    monsterChance: 0.20,
    itemCategory: 'any_except_key',
    allowedMonsterTypes: null,
    legendaryChance: 0.001,
    guaranteedMonsterOnHard: false,
  },
};

// ============================================================================
// Locations Map
// ============================================================================

export const LOCATIONS: Record<LocationId, LocationConfig> = {
  pirates_dock: {
    id: 'pirates_dock',
    label: "Pirate's Dock",
    activities: [PIRATES_DOCK_SWAB, PIRATES_DOCK_FISHING],
  },
  garden: {
    id: 'garden',
    label: 'Garden',
    activities: [GARDEN_TEND],
  },
  farm: {
    id: 'farm',
    label: 'Farm',
    activities: [FARM_WORK],
  },
  game_corner: {
    id: 'game_corner',
    label: 'Game Corner',
    activities: [GAME_CORNER_PLAY],
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

export function isValidLocation(location: string): location is LocationId {
  return LOCATION_IDS.includes(location as LocationId);
}

export function isValidActivity(location: LocationId, activity: string): activity is ActivityId {
  const config = LOCATIONS[location];
  return config.activities.some((a) => a.id === activity);
}

export function getActivityConfig(location: LocationId, activity: ActivityId): ActivityConfig | null {
  const config = LOCATIONS[location];
  return config.activities.find((a) => a.id === activity) ?? null;
}

export function getRewardConfig(location: LocationId, activity: ActivityId): RewardConfig | null {
  const activityConfig = getActivityConfig(location, activity);
  return activityConfig?.rewards ?? null;
}
