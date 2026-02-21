/**
 * Battle System Constants
 * Defines battle mechanics, damage calculation constants, and move categories
 */

/**
 * Core battle mechanics constants
 */
export const BattleConstants = {
  // Damage calculation
  LEVEL_FACTOR: 2,
  BASE_DAMAGE: 50,
  RANDOM_FACTOR_MIN: 0.85,
  RANDOM_FACTOR_MAX: 1.0,

  // Critical hits
  CRITICAL_CHANCE: 0.0625, // 1/16 or 6.25%
  CRITICAL_MULTIPLIER: 1.5,

  // Same Type Attack Bonus (STAB)
  STAB_MULTIPLIER: 1.5,

  // IV/EV limits
  MAX_IV: 31,
  MIN_IV: 0,
  MAX_EV_PER_STAT: 252,
  MAX_TOTAL_EVS: 510,
  MIN_EV: 0,

  // Level limits
  MIN_LEVEL: 1,
  MAX_LEVEL: 100,

  // Monster storage
  BOX_SIZE: 30,
  MAX_BOXES: 100,

  // Party limits
  MAX_PARTY_SIZE: 6,

  // Friendship
  MIN_FRIENDSHIP: 0,
  MAX_FRIENDSHIP: 255,
  BASE_FRIENDSHIP: 70,

  // Move limits
  MAX_MOVES: 4,
  MIN_PP: 0,

  // Accuracy
  MAX_ACCURACY: 100,
  MIN_ACCURACY: 0,

  // Priority
  MIN_PRIORITY: -7,
  MAX_PRIORITY: 7,
  DEFAULT_PRIORITY: 0,
} as const;

/**
 * Move categories for damage calculation
 */
export const MoveCategory = {
  PHYSICAL: 'Physical',
  SPECIAL: 'Special',
  STATUS: 'Status',
} as const;

export type MoveCategoryKey = keyof typeof MoveCategory;
export type MoveCategoryValue = (typeof MoveCategory)[MoveCategoryKey];

export const MOVE_CATEGORIES: MoveCategoryValue[] = Object.values(MoveCategory);

/**
 * Move target types
 */
export const MoveTarget = {
  SINGLE_TARGET: 'single',
  ALL_OPPONENTS: 'all-opponents',
  ALL_ALLIES: 'all-allies',
  ALL_ADJACENT: 'all-adjacent',
  SELF: 'self',
  FIELD: 'field',
  ALLY_SIDE: 'ally-side',
  OPPONENT_SIDE: 'opponent-side',
  RANDOM_OPPONENT: 'random-opponent',
} as const;

export type MoveTargetValue = (typeof MoveTarget)[keyof typeof MoveTarget];

export const MOVE_TARGETS: MoveTargetValue[] = Object.values(MoveTarget);

/**
 * Battle status
 */
export const BattleStatus = {
  PENDING: 'pending',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type BattleStatusValue = (typeof BattleStatus)[keyof typeof BattleStatus];

export const BATTLE_STATUSES: BattleStatusValue[] = Object.values(BattleStatus);

/**
 * Battle action types
 */
export const BattleActionType = {
  ATTACK: 'attack',
  SWITCH: 'switch',
  ITEM: 'item',
  CAPTURE: 'capture',
  FLEE: 'flee',
  SKIP: 'skip',
} as const;

export type BattleActionTypeValue = (typeof BattleActionType)[keyof typeof BattleActionType];

export const BATTLE_ACTION_TYPES: BattleActionTypeValue[] = Object.values(BattleActionType);

/**
 * Battle type (format)
 */
export const BattleType = {
  SINGLES: 'singles',
  DOUBLES: 'doubles',
  TRIPLES: 'triples',
  ROTATION: 'rotation',
  WILD: 'wild',
  TRAINER: 'trainer',
} as const;

export type BattleTypeValue = (typeof BattleType)[keyof typeof BattleType];

export const BATTLE_TYPES: BattleTypeValue[] = Object.values(BattleType);

/**
 * Stat stage modifiers (for stat boosts/drops during battle)
 * Stage ranges from -6 to +6
 */
export const STAT_STAGE_MULTIPLIERS: Record<number, number> = {
  '-6': 2 / 8, // 0.25
  '-5': 2 / 7, // ~0.286
  '-4': 2 / 6, // ~0.333
  '-3': 2 / 5, // 0.4
  '-2': 2 / 4, // 0.5
  '-1': 2 / 3, // ~0.667
  0: 1, // 1.0
  1: 3 / 2, // 1.5
  2: 4 / 2, // 2.0
  3: 5 / 2, // 2.5
  4: 6 / 2, // 3.0
  5: 7 / 2, // 3.5
  6: 8 / 2, // 4.0
};

/**
 * Accuracy/Evasion stage multipliers (different formula than other stats)
 */
export const ACCURACY_STAGE_MULTIPLIERS: Record<number, number> = {
  '-6': 3 / 9, // ~0.333
  '-5': 3 / 8, // 0.375
  '-4': 3 / 7, // ~0.429
  '-3': 3 / 6, // 0.5
  '-2': 3 / 5, // 0.6
  '-1': 3 / 4, // 0.75
  0: 1, // 1.0
  1: 4 / 3, // ~1.333
  2: 5 / 3, // ~1.667
  3: 6 / 3, // 2.0
  4: 7 / 3, // ~2.333
  5: 8 / 3, // ~2.667
  6: 9 / 3, // 3.0
};

/**
 * Get the stat modifier for a given stage
 * @param stage - The stat stage (-6 to +6)
 * @returns The multiplier for that stage
 */
export function getStatStageMultiplier(stage: number): number {
  const clampedStage = Math.max(-6, Math.min(6, stage));
  return STAT_STAGE_MULTIPLIERS[clampedStage] ?? 1;
}

/**
 * Get the accuracy modifier for a given stage
 * @param stage - The accuracy/evasion stage (-6 to +6)
 * @returns The multiplier for that stage
 */
export function getAccuracyStageMultiplier(stage: number): number {
  const clampedStage = Math.max(-6, Math.min(6, stage));
  return ACCURACY_STAGE_MULTIPLIERS[clampedStage] ?? 1;
}

/**
 * Calculate the random damage factor
 * @returns A random value between RANDOM_FACTOR_MIN and RANDOM_FACTOR_MAX
 */
export function getRandomDamageFactor(): number {
  const range = BattleConstants.RANDOM_FACTOR_MAX - BattleConstants.RANDOM_FACTOR_MIN;
  return BattleConstants.RANDOM_FACTOR_MIN + Math.random() * range;
}

/**
 * Check if a critical hit occurs
 * @param critStage - Additional critical hit stage (0-4)
 * @returns True if critical hit
 */
export function checkCriticalHit(critStage: number = 0): boolean {
  // Critical hit rates by stage:
  // Stage 0: 1/24 (~4.17%)
  // Stage 1: 1/8 (12.5%)
  // Stage 2: 1/2 (50%)
  // Stage 3+: 1/1 (100%)
  const critRates = [1 / 24, 1 / 8, 1 / 2, 1, 1];
  const effectiveStage = Math.max(0, Math.min(critStage, 4));
  return Math.random() < (critRates[effectiveStage] ?? 1 / 24);
}

/**
 * Check if a move is a valid category
 * @param category - The category to check
 * @returns True if valid
 */
export function isValidMoveCategory(category: string): category is MoveCategoryValue {
  return MOVE_CATEGORIES.includes(category as MoveCategoryValue);
}

/**
 * Check if an action type is valid
 * @param actionType - The action type to check
 * @returns True if valid
 */
export function isValidBattleActionType(actionType: string): actionType is BattleActionTypeValue {
  return BATTLE_ACTION_TYPES.includes(actionType as BattleActionTypeValue);
}
