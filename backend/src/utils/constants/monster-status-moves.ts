/**
 * Monster Status Moves Constants
 * Defines all status move effects and behaviors for the battle system
 */

import { StatusEffectValue, PrimaryStatus, VolatileStatus } from './status-effects';
import { WeatherValue } from './weather-terrain';

/**
 * Target types for status moves
 */
export const StatusMoveTarget = {
  SELF: 'self',
  OPPONENT: 'opponent',
  ALLY: 'ally',
  ALLIES: 'allies',
  TEAM: 'team',
  FIELD: 'field',
  ALL: 'all',
  VARIABLE: 'variable',
  ADJACENT_OPPONENTS: 'adjacent_opponents',
} as const;

export type StatusMoveTargetValue = (typeof StatusMoveTarget)[keyof typeof StatusMoveTarget];

/**
 * Stat keys for status moves (using full names for clarity)
 */
export type StatusMoveStatKey =
  | 'attack'
  | 'defense'
  | 'special_attack'
  | 'special_defense'
  | 'speed'
  | 'accuracy'
  | 'evasion';

/**
 * Stat changes for status moves (stages from -6 to +6)
 */
export type StatChanges = Partial<Record<StatusMoveStatKey, number>>;

/**
 * Monster reference for message generation and calculations
 */
export interface StatusMoveMonsterRef {
  name: string;
  max_hp: number;
  current_hp: number;
}

/**
 * Message generator function type
 */
export type StatusMoveMessageFn = (
  user: string,
  target?: string,
  extra?: string | boolean
) => string;

/**
 * Healing amount calculator function type
 */
export type HealAmountFn = (
  monster: StatusMoveMonsterRef,
  weatherOrTerrainOrStacks?: WeatherValue | string | number
) => number;

/**
 * Base status move definition
 */
export interface BaseStatusMove {
  type: string;
  target: StatusMoveTargetValue | string;
  message: StatusMoveMessageFn;
}

/**
 * Stat buff/debuff move
 */
export interface StatBuffDebuffMove extends BaseStatusMove {
  type:
    | 'stat_buff'
    | 'stat_debuff'
    | 'stat_buff_confuse'
    | 'stat_debuff_switch'
    | 'stat_buff_hp_cost'
    | 'stat_mixed_self'
    | 'stat_mixed_opponent'
    | 'stat_buff_all'
    | 'stat_buff_max_hp_cost'
    | 'conditional_stat_debuff'
    | 'stat_debuff_gender'
    | 'stat_buff_random'
    | 'stat_buff_consume_berry'
    | 'stat_copy'
    | 'stat_swap'
    | 'stat_swap_all'
    | 'stat_swap_specific'
    | 'stat_swap_self'
    | 'stat_average'
    | 'stat_reset'
    | 'stat_buff_clear_debuffs'
    | 'stat_debuff_priority'
    | 'stat_buff_trap_self'
    | 'stat_buff_stockpile'
    | 'trap_debuff'
    | 'type_specific_buff'
    | 'ally_stat_buff'
    | 'charge_stat_buff'
    | 'curse_conditional'
    | 'stat_debuff_status'
    | 'critical_buff';
  stats?: StatChanges;
  statusEffect?: StatusEffectValue;
  duration?: number;
  switchOut?: boolean;
  hpCost?: number;
  condition?: string;
  requiresOppositeGender?: boolean;
  randomStatBoost?: number;
  possibleStats?: StatusMoveStatKey[];
  requiresBerry?: boolean;
  consumeBerry?: boolean;
  copyAllStatChanges?: boolean;
  swapStats?: StatusMoveStatKey[];
  swapAllStatChanges?: boolean;
  averageStats?: StatusMoveStatKey[];
  resetAllStats?: boolean;
  clearNegativeStats?: boolean;
  priority?: number;
  trapSelf?: boolean;
  trapTarget?: boolean;
  maxStacks?: number;
  typeRestriction?: string[];
  chargeTurn?: boolean;
  zMoveOnly?: boolean;
  rolloutBoost?: boolean;
  vulnerableToStomp?: boolean;
  // Curse-specific
  ghostEffect?: {
    type: string;
    hpCost: number;
    statusEffect: StatusEffectValue;
    duration: number;
  };
  nonGhostEffect?: {
    type: string;
    stats: StatChanges;
  };
  // Focus energy
  effect?: string;
}

/**
 * Status affliction move
 */
export interface StatusAfflictionMove extends BaseStatusMove {
  type:
    | 'status_affliction'
    | 'status_affliction_gender'
    | 'status_affliction_all'
    | 'status_affliction_adjacent'
    | 'conditional_status'
    | 'delayed_status'
    | 'status_transfer';
  statusEffect: StatusEffectValue;
  duration?: number;
  accuracy?: number;
  requiresOppositeGender?: boolean;
  includesSelf?: boolean;
  affectsAdjacent?: boolean;
  condition?: string;
  delay?: number;
  transferOwnStatus?: boolean;
  curesSelf?: boolean;
}

/**
 * Healing move
 */
export interface HealingMove extends BaseStatusMove {
  type:
    | 'healing'
    | 'healing_weather'
    | 'healing_terrain'
    | 'healing_type_change'
    | 'team_healing_status_cure'
    | 'delayed_healing'
    | 'status_cure'
    | 'team_status_cure'
    | 'healing_stockpile'
    | 'healing_cure_status'
    | 'healing_target'
    | 'sacrifice_heal'
    | 'healing_sleep'
    | 'healing_user_and_ally';
  healAmount: HealAmountFn;
  cureStatus?: boolean;
  cureAllTeamStatus?: boolean;
  loseFlying?: boolean;
  delay?: number;
  consumeStockpile?: boolean;
  healSelf?: boolean;
  sacrifice?: boolean;
  statusEffect?: StatusEffectValue;
  healAlly?: boolean;
}

/**
 * Other special move types
 */
export interface OtherStatusMove extends BaseStatusMove {
  type: string;
  effect: string;
  duration?: number;
  stats?: StatChanges;
  protection?: boolean;
  priority?: number;
  // Various effect-specific properties
  speedDebuff?: number;
  defenseDebuff?: number;
  layers?: number;
  maxLayers?: number;
  damagePercent?: number;
  hazardType?: string;
  side?: string;
  damageReduction?: number;
  requiresSnow?: boolean;
  speedMultiplier?: number;
  copyLastMove?: boolean;
  removeHazards?: boolean | string[];
  ppReduction?: number;
  targetLastMove?: boolean;
  zeroLastMovePP?: boolean;
  addType?: string;
  faintTogether?: boolean;
  contactDamage?: (attacker: StatusMoveMonsterRef) => number;
  cureAllStatus?: boolean;
  healPerTurn?: (monster: StatusMoveMonsterRef) => number;
  changeAbility?: string;
  weakenElectricMoves?: number;
  preventCriticals?: boolean;
  forceSwitch?: boolean;
  consumeAllBerries?: boolean;
  changeTypeBasedOnTerrain?: boolean;
  copyAbilityToTarget?: boolean;
  useRandomTeamMove?: boolean;
  swapAllFieldEffects?: boolean;
  copyType?: boolean;
  boostNextMove?: number;
  useRandomMove?: boolean;
  excludedMoves?: string[];
  onlyWhileAsleep?: boolean;
  useRandomKnownMove?: boolean;
  restoreLastUsedItem?: boolean;
  copyOpponentMove?: boolean;
  powerBoost?: number;
  protectFromAllMoves?: boolean;
  guaranteeCritical?: boolean;
  permanentLearn?: boolean;
  preventSwitch?: boolean;
  surviveWith1HP?: boolean;
  createSubstitute?: boolean;
  hpCost?: number;
  changeToFirstMoveType?: boolean;
  giveHeldItem?: boolean;
  copyAppearance?: boolean;
  copyMoves?: boolean;
  copyStats?: boolean;
  forceAllAttacks?: boolean;
  passStatChanges?: boolean;
  passStatusEffects?: boolean;
  switchUser?: boolean;
  temporaryLearn?: boolean;
  forceRepeatLastMove?: boolean;
  copyAbility?: boolean;
  applyToTeam?: boolean;
  removeEvasion?: boolean;
  allowNormalVsGhost?: boolean;
  allowPsychicVsDark?: boolean;
  makeTargetMoveNext?: boolean;
  becomesMove?: Record<string, string>;
  perishCountdown?: number;
  affectsAll?: boolean;
  disableLastMove?: boolean;
  protectFrom?: string;
  changeTypeToResist?: boolean;
  swapAbilities?: boolean;
  averageHP?: boolean;
  forceSwitch_?: boolean;
  redirectAttacks?: boolean;
  guaranteeHit?: boolean;
  contactEffect?: {
    statusEffect: StatusEffectValue;
    duration: number;
  };
  destroyHeldItems?: boolean;
  suppressAbility?: boolean;
  reflectStatusMoves?: boolean;
  disableSharedMoves?: boolean;
  barrierType?: string;
  switchPlaces?: boolean;
  suppressItems?: boolean;
  reverseSpeed?: boolean;
  preventHealing?: boolean;
  forceRepeatLast?: boolean;
  copyTargetAbility?: boolean;
  swapHeldItems?: boolean;
  escapeBattle?: boolean;
  levitateTarget?: boolean;
  swapDefenses?: boolean;
  specialDefenseMultiplier?: number;
  changeType?: string;
  groundsFlying?: boolean;
  increaseAccuracy?: boolean;
  accuracyMultiplier?: number;
  weather?: WeatherValue;
  fireWeakness?: boolean;
  protectFromMaxMoves?: boolean;
  reviveHpPercent?: number;
}

/**
 * Union type for all status move definitions
 */
export type StatusMoveDefinition = StatBuffDebuffMove | StatusAfflictionMove | HealingMove | OtherStatusMove;

/**
 * Status move dictionary type
 */
export type StatusMoveDictionary = Record<string, StatusMoveDefinition>;

/**
 * Stat buff/debuff moves
 * Moves that modify stat stages
 */
export const STAT_BUFF_DEBUFF_MOVES: StatusMoveDictionary = {
  'Growl': {
    type: 'stat_debuff',
    target: StatusMoveTarget.OPPONENT,
    stats: { attack: -1 },
    message: (user, target) => `${user}'s Growl lowered ${target}'s Attack!`,
  },
  'Double Team': {
    type: 'stat_buff',
    target: StatusMoveTarget.SELF,
    stats: { evasion: 1 },
    message: (user) => `${user} used Double Team! ${user}'s evasiveness rose!`,
  },
  'Screech': {
    type: 'stat_debuff',
    target: StatusMoveTarget.OPPONENT,
    stats: { defense: -2 },
    message: (user, target) => `${user}'s Screech harshly lowered ${target}'s Defense!`,
  },
  'Sand Attack': {
    type: 'stat_debuff',
    target: StatusMoveTarget.OPPONENT,
    stats: { accuracy: -1 },
    message: (user, target) => `${user} kicked up sand! ${target}'s accuracy fell!`,
  },
  'Tail Glow': {
    type: 'stat_buff',
    target: StatusMoveTarget.SELF,
    stats: { special_attack: 3 },
    message: (user) => `${user} used Tail Glow! ${user}'s Special Attack rose drastically!`,
  },
  'String Shot': {
    type: 'stat_debuff',
    target: StatusMoveTarget.OPPONENT,
    stats: { speed: -2 },
    message: (user, target) => `${user} used String Shot! ${target}'s Speed harshly fell!`,
  },
  'Quiver Dance': {
    type: 'stat_buff',
    target: StatusMoveTarget.SELF,
    stats: { special_attack: 1, special_defense: 1, speed: 1 },
    message: (user) => `${user} used Quiver Dance! ${user}'s Special Attack, Special Defense, and Speed rose!`,
  },
  'Defend Order': {
    type: 'stat_buff',
    target: StatusMoveTarget.SELF,
    stats: { defense: 1, special_defense: 1 },
    message: (user) => `${user} used Defend Order! ${user}'s Defense and Special Defense rose!`,
  },
  'Nasty Plot': {
    type: 'stat_buff',
    target: StatusMoveTarget.SELF,
    stats: { special_attack: 2 },
    message: (user) => `${user} used Nasty Plot! ${user}'s Special Attack rose sharply!`,
  },
  'Hone Claws': {
    type: 'stat_buff',
    target: StatusMoveTarget.SELF,
    stats: { attack: 1, accuracy: 1 },
    message: (user) => `${user} used Hone Claws! ${user}'s Attack and accuracy rose!`,
  },
  'Fake Tears': {
    type: 'stat_debuff',
    target: StatusMoveTarget.OPPONENT,
    stats: { special_defense: -2 },
    message: (user, target) => `${user} used Fake Tears! ${target}'s Special Defense harshly fell!`,
  },
  'Flatter': {
    type: 'stat_buff_confuse',
    target: StatusMoveTarget.OPPONENT,
    stats: { special_attack: 1 },
    statusEffect: VolatileStatus.CONFUSION,
    duration: 3,
    message: (user, target) => `${user} used Flatter! ${target}'s Special Attack rose, but ${target} became confused!`,
  },
  'Parting Shot': {
    type: 'stat_debuff_switch',
    target: StatusMoveTarget.OPPONENT,
    stats: { attack: -1, special_attack: -1 },
    switchOut: true,
    message: (user, target) => `${user} used Parting Shot! ${target}'s Attack and Special Attack fell! ${user} switched out!`,
  },
  'Dragon Dance': {
    type: 'stat_buff',
    target: StatusMoveTarget.SELF,
    stats: { attack: 1, speed: 1 },
    message: (user) => `${user} used Dragon Dance! ${user}'s Attack and Speed rose!`,
  },
  'Clangorous Soul': {
    type: 'stat_buff_hp_cost',
    target: StatusMoveTarget.SELF,
    stats: { attack: 1, defense: 1, special_attack: 1, special_defense: 1, speed: 1 },
    hpCost: 0.33,
    message: (user) => `${user} used Clangorous Soul! ${user} lost some HP and all stats rose!`,
  },
  'Eerie Impulse': {
    type: 'stat_debuff',
    target: StatusMoveTarget.OPPONENT,
    stats: { special_attack: -2 },
    message: (user, target) => `${user} used Eerie Impulse! ${target}'s Special Attack harshly fell!`,
  },
  'Charm': {
    type: 'stat_debuff',
    target: StatusMoveTarget.OPPONENT,
    stats: { attack: -2 },
    message: (user, target) => `${user} used Charm! ${target}'s Attack harshly fell!`,
  },
  'Baby-Doll Eyes': {
    type: 'stat_debuff_priority',
    target: StatusMoveTarget.OPPONENT,
    stats: { attack: -1 },
    priority: 1,
    message: (user, target) => `${user} used Baby-Doll Eyes! ${target}'s Attack fell!`,
  },
  'Decorate': {
    type: 'ally_stat_buff',
    target: StatusMoveTarget.ALLY,
    stats: { attack: 2, special_attack: 2 },
    message: (user, target) => `${user} used Decorate! ${target}'s Attack and Special Attack rose sharply!`,
  },
  'Aromatic Mist': {
    type: 'ally_stat_buff',
    target: StatusMoveTarget.ALLY,
    stats: { special_defense: 1 },
    message: (user, target) => `${user} used Aromatic Mist! ${target}'s Special Defense rose!`,
  },
  'Flower Shield': {
    type: 'type_specific_buff',
    target: StatusMoveTarget.ALLIES,
    stats: { defense: 1 },
    typeRestriction: ['Grass'],
    message: (user) => `${user} used Flower Shield! Grass-type monsters' Defense rose!`,
  },
  'Geomancy': {
    type: 'charge_stat_buff',
    target: StatusMoveTarget.SELF,
    stats: { special_attack: 2, special_defense: 2, speed: 2 },
    chargeTurn: true,
    message: (user) => `${user} is absorbing power from the earth! ${user}'s Special Attack, Special Defense, and Speed rose sharply!`,
  },
  'Bulk Up': {
    type: 'stat_buff',
    target: StatusMoveTarget.SELF,
    stats: { attack: 1, defense: 1 },
    message: (user) => `${user} used Bulk Up! ${user}'s Attack and Defense rose!`,
  },
  'Victory Dance': {
    type: 'stat_buff',
    target: StatusMoveTarget.SELF,
    stats: { attack: 1, defense: 1, special_attack: 1, special_defense: 1, speed: 1 },
    message: (user) => `${user} used Victory Dance! All of ${user}'s stats rose!`,
  },
  'No Retreat': {
    type: 'stat_buff_trap_self',
    target: StatusMoveTarget.SELF,
    stats: { attack: 1, defense: 1, special_attack: 1, special_defense: 1, speed: 1 },
    trapSelf: true,
    message: (user) => `${user} used No Retreat! All of ${user}'s stats rose, but ${user} can no longer escape!`,
  },
  'Coaching': {
    type: 'ally_stat_buff',
    target: StatusMoveTarget.ALLY,
    stats: { attack: 1, defense: 1 },
    message: (user, target) => `${user} used Coaching! ${target}'s Attack and Defense rose!`,
  },
  'Octolock': {
    type: 'trap_debuff',
    target: StatusMoveTarget.OPPONENT,
    trapTarget: true,
    stats: { defense: -1, special_defense: -1 },
    duration: 5,
    message: (user, target) => `${user} used Octolock! ${target} is trapped and its Defense and Special Defense fell!`,
  },
  'Feather Dance': {
    type: 'stat_debuff',
    target: StatusMoveTarget.OPPONENT,
    stats: { attack: -2 },
    message: (user, target) => `${user} used Feather Dance! ${target}'s Attack harshly fell!`,
  },
  'Curse': {
    type: 'curse_conditional',
    target: StatusMoveTarget.VARIABLE,
    ghostEffect: {
      type: 'curse_ghost',
      hpCost: 0.5,
      statusEffect: VolatileStatus.CURSE,
      duration: -1,
    },
    nonGhostEffect: {
      type: 'stat_mixed',
      stats: { attack: 1, defense: 1, speed: -1 },
    },
    message: (user, target, isGhost) =>
      isGhost
        ? `${user} used Curse! ${user} cut its own HP and laid a curse on ${target}!`
        : `${user} used Curse! ${user}'s Attack and Defense rose, but Speed fell!`,
  },
  'Cotton Guard': {
    type: 'stat_buff',
    target: StatusMoveTarget.SELF,
    stats: { defense: 3 },
    message: (user) => `${user} used Cotton Guard! ${user}'s Defense rose drastically!`,
  },
  'Spicy Extract': {
    type: 'stat_mixed_opponent',
    target: StatusMoveTarget.OPPONENT,
    stats: { attack: -2, special_attack: 2 },
    message: (user, target) => `${user} used Spicy Extract! ${target}'s Attack harshly fell, but Special Attack rose sharply!`,
  },
  'Cotton Spore': {
    type: 'stat_debuff',
    target: StatusMoveTarget.OPPONENT,
    stats: { speed: -2 },
    message: (user, target) => `${user} used Cotton Spore! ${target}'s Speed harshly fell!`,
  },
  'Strength Sap': {
    type: 'stat_debuff',
    target: StatusMoveTarget.OPPONENT,
    stats: { attack: -1 },
    message: (user, target) => `${user} used Strength Sap! ${target}'s Attack fell and ${user} recovered HP!`,
  },
  'Rototiller': {
    type: 'type_specific_buff',
    target: StatusMoveTarget.FIELD,
    stats: { attack: 1, special_attack: 1 },
    typeRestriction: ['Grass'],
    message: (user) => `${user} used Rototiller! Grass-type monsters' Attack and Special Attack rose!`,
  },
  'Haze': {
    type: 'stat_reset',
    target: StatusMoveTarget.FIELD,
    resetAllStats: true,
    message: (user) => `${user} used Haze! All stat changes were eliminated!`,
  },
  'Tail Whip': {
    type: 'stat_debuff',
    target: StatusMoveTarget.OPPONENT,
    stats: { defense: -1 },
    message: (user, target) => `${user} used Tail Whip! ${target}'s Defense fell!`,
  },
  'Shell Smash': {
    type: 'stat_mixed_self',
    target: StatusMoveTarget.SELF,
    stats: { defense: -1, special_defense: -1, attack: 2, special_attack: 2, speed: 2 },
    message: (user) => `${user} used Shell Smash! ${user}'s Defense and Special Defense fell, but Attack, Special Attack, and Speed rose sharply!`,
  },
  'Fillet Away': {
    type: 'stat_buff_hp_cost',
    target: StatusMoveTarget.SELF,
    stats: { attack: 2, special_attack: 2, speed: 2 },
    hpCost: 0.5,
    message: (user) => `${user} used Fillet Away! ${user} lost half its HP, but Attack, Special Attack, and Speed rose sharply!`,
  },
  'Power Shift': {
    type: 'stat_swap',
    target: StatusMoveTarget.SELF,
    swapStats: ['attack', 'defense'],
    message: (user) => `${user} used Power Shift! ${user} swapped its Attack and Defense stats!`,
  },
  'Howl': {
    type: 'stat_buff',
    target: StatusMoveTarget.SELF,
    stats: { attack: 1 },
    message: (user) => `${user} used Howl! ${user}'s Attack rose!`,
  },
  'Sharpen': {
    type: 'stat_buff',
    target: StatusMoveTarget.SELF,
    stats: { attack: 1 },
    message: (user) => `${user} used Sharpen! ${user}'s Attack rose!`,
  },
  'Stockpile': {
    type: 'stat_buff_stockpile',
    target: StatusMoveTarget.SELF,
    stats: { defense: 1, special_defense: 1 },
    maxStacks: 3,
    message: (user) => `${user} used Stockpile! ${user} stockpiled power and raised its defenses!`,
  },
  'Sweet Scent': {
    type: 'stat_debuff',
    target: StatusMoveTarget.OPPONENT,
    stats: { evasion: -2 },
    message: (user, target) => `${user} used Sweet Scent! ${target}'s evasion harshly fell!`,
  },
  'Smokescreen': {
    type: 'stat_debuff',
    target: StatusMoveTarget.OPPONENT,
    stats: { accuracy: -1 },
    message: (user, target) => `${user} used Smokescreen! ${target}'s accuracy fell!`,
  },
  'Swords Dance': {
    type: 'stat_buff',
    target: StatusMoveTarget.SELF,
    stats: { attack: 2 },
    message: (user) => `${user} used Swords Dance! ${user}'s Attack rose sharply!`,
  },
  'Captivate': {
    type: 'stat_debuff_gender',
    target: StatusMoveTarget.OPPONENT,
    stats: { special_attack: -2 },
    requiresOppositeGender: true,
    message: (user, target) => `${user} used Captivate! ${target}'s Special Attack harshly fell!`,
  },
  'Defense Curl': {
    type: 'stat_buff',
    target: StatusMoveTarget.SELF,
    stats: { defense: 1 },
    rolloutBoost: true,
    message: (user) => `${user} used Defense Curl! ${user}'s Defense rose!`,
  },
  'Work Up': {
    type: 'stat_buff',
    target: StatusMoveTarget.SELF,
    stats: { attack: 1, special_attack: 1 },
    message: (user) => `${user} used Work Up! ${user}'s Attack and Special Attack rose!`,
  },
  'Acupressure': {
    type: 'stat_buff_random',
    target: StatusMoveTarget.SELF,
    randomStatBoost: 2,
    possibleStats: ['attack', 'defense', 'special_attack', 'special_defense', 'speed', 'accuracy', 'evasion'],
    message: (user, _target, stat) => `${user} used Acupressure! ${user}'s ${stat} rose sharply!`,
  },
  'Stuff Cheeks': {
    type: 'stat_buff_consume_berry',
    target: StatusMoveTarget.SELF,
    stats: { defense: 2 },
    requiresBerry: true,
    consumeBerry: true,
    message: (user) => `${user} used Stuff Cheeks! ${user} ate its berry and its Defense rose sharply!`,
  },
  'Swagger': {
    type: 'stat_buff_confuse',
    target: StatusMoveTarget.OPPONENT,
    stats: { attack: 2 },
    statusEffect: VolatileStatus.CONFUSION,
    duration: 3,
    message: (user, target) => `${user} used Swagger! ${target}'s Attack rose sharply, but it became confused!`,
  },
  'Leer': {
    type: 'stat_debuff',
    target: StatusMoveTarget.OPPONENT,
    stats: { defense: -1 },
    message: (user, target) => `${user} used Leer! ${target}'s Defense fell!`,
  },
  'Psych Up': {
    type: 'stat_copy',
    target: StatusMoveTarget.OPPONENT,
    copyAllStatChanges: true,
    message: (user, target) => `${user} used Psych Up and copied ${target}'s stat changes!`,
  },
  'Confide': {
    type: 'stat_debuff',
    target: StatusMoveTarget.OPPONENT,
    stats: { special_attack: -1 },
    message: (user, target) => `${user} used Confide! ${target}'s Special Attack fell!`,
  },
  'Harden': {
    type: 'stat_buff',
    target: StatusMoveTarget.SELF,
    stats: { defense: 1 },
    message: (user) => `${user} used Harden! ${user}'s Defense rose!`,
  },
  'Minimize': {
    type: 'stat_buff',
    target: StatusMoveTarget.SELF,
    stats: { evasion: 2 },
    vulnerableToStomp: true,
    message: (user) => `${user} used Minimize! ${user}'s evasion rose sharply!`,
  },
  'Tickle': {
    type: 'stat_debuff',
    target: StatusMoveTarget.OPPONENT,
    stats: { attack: -1, defense: -1 },
    message: (user, target) => `${user} used Tickle! ${target}'s Attack and Defense fell!`,
  },
  'Extreme Evoboost': {
    type: 'stat_buff_all',
    target: StatusMoveTarget.SELF,
    stats: { attack: 2, defense: 2, special_attack: 2, special_defense: 2, speed: 2 },
    zMoveOnly: true,
    message: (user) => `${user} used Extreme Evoboost! All of ${user}'s stats rose drastically!`,
  },
  'Tearful Look': {
    type: 'stat_debuff',
    target: StatusMoveTarget.OPPONENT,
    stats: { attack: -1, special_attack: -1 },
    message: (user, target) => `${user} used Tearful Look! ${target}'s Attack and Special Attack fell!`,
  },
  'Play Nice': {
    type: 'stat_debuff',
    target: StatusMoveTarget.OPPONENT,
    stats: { attack: -1 },
    message: (user, target) => `${user} used Play Nice! ${target}'s Attack fell!`,
  },
  'Scary Face': {
    type: 'stat_debuff',
    target: StatusMoveTarget.OPPONENT,
    stats: { speed: -2 },
    message: (user, target) => `${user} used Scary Face! ${target}'s Speed harshly fell!`,
  },
  'Growth': {
    type: 'stat_buff',
    target: StatusMoveTarget.SELF,
    stats: { attack: 1, special_attack: 1 },
    message: (user) => `${user} used Growth! ${user}'s Attack and Special Attack rose!`,
  },
  'Focus Energy': {
    type: 'critical_buff',
    target: StatusMoveTarget.SELF,
    effect: 'focus_energy',
    duration: 5,
    message: (user) => `${user} used Focus Energy! ${user} is getting pumped!`,
  },
  'Flash': {
    type: 'stat_debuff',
    target: StatusMoveTarget.OPPONENT,
    stats: { accuracy: -1 },
    message: (user, target) => `${user} used Flash! ${target}'s accuracy fell!`,
  },
  'Noble Roar': {
    type: 'stat_debuff',
    target: StatusMoveTarget.OPPONENT,
    stats: { attack: -1, special_attack: -1 },
    message: (user, target) => `${user} used Noble Roar! ${target}'s Attack and Special Attack fell!`,
  },
  'Belly Drum': {
    type: 'stat_buff_max_hp_cost',
    target: StatusMoveTarget.SELF,
    stats: { attack: 6 },
    hpCost: 0.5,
    message: (user) => `${user} used Belly Drum! ${user} cut its HP in half and maximized its Attack!`,
  },
  'Venom Drench': {
    type: 'conditional_stat_debuff',
    target: StatusMoveTarget.OPPONENT,
    stats: { attack: -1, special_attack: -1, speed: -1 },
    condition: 'poison',
    message: (user, target) => `${user} used Venom Drench! ${target}'s Attack, Special Attack, and Speed fell!`,
  },
  'Coil': {
    type: 'stat_buff',
    target: StatusMoveTarget.SELF,
    stats: { attack: 1, defense: 1, accuracy: 1 },
    message: (user) => `${user} used Coil! ${user}'s Attack, Defense, and accuracy rose!`,
  },
  'Acid Armor': {
    type: 'stat_buff',
    target: StatusMoveTarget.SELF,
    stats: { defense: 2 },
    message: (user) => `${user} used Acid Armor! ${user}'s Defense rose sharply!`,
  },
  'Amnesia': {
    type: 'stat_buff',
    target: StatusMoveTarget.SELF,
    stats: { special_defense: 2 },
    message: (user) => `${user} used Amnesia! ${user}'s Special Defense rose sharply!`,
  },
  'Toxic Thread': {
    type: 'stat_debuff_status',
    target: StatusMoveTarget.OPPONENT,
    stats: { speed: -1 },
    statusEffect: PrimaryStatus.POISON,
    duration: 4,
    message: (user, target) => `${user} used Toxic Thread! ${target}'s Speed fell and ${target} was poisoned!`,
  },
  'Heart Swap': {
    type: 'stat_swap_all',
    target: StatusMoveTarget.OPPONENT,
    swapAllStatChanges: true,
    message: (user, target) => `${user} used Heart Swap! ${user} and ${target} switched all stat changes!`,
  },
  'Kinesis': {
    type: 'stat_debuff',
    target: StatusMoveTarget.OPPONENT,
    stats: { accuracy: -1 },
    message: (user, target) => `${user} used Kinesis! ${target}'s accuracy fell!`,
  },
  'Calm Mind': {
    type: 'stat_buff',
    target: StatusMoveTarget.SELF,
    stats: { special_attack: 1, special_defense: 1 },
    message: (user) => `${user} used Calm Mind! ${user}'s Special Attack and Special Defense rose!`,
  },
  'Barrier': {
    type: 'stat_buff',
    target: StatusMoveTarget.SELF,
    stats: { defense: 2 },
    message: (user) => `${user} used Barrier! ${user}'s Defense rose sharply!`,
  },
  'Meditate': {
    type: 'stat_buff',
    target: StatusMoveTarget.SELF,
    stats: { attack: 1 },
    message: (user) => `${user} used Meditate! ${user}'s Attack rose!`,
  },
  'Speed Swap': {
    type: 'stat_swap_specific',
    target: StatusMoveTarget.OPPONENT,
    swapStats: ['speed'],
    message: (user, target) => `${user} used Speed Swap! ${user} and ${target} switched Speed stats!`,
  },
  'Power Swap': {
    type: 'stat_swap_specific',
    target: StatusMoveTarget.OPPONENT,
    swapStats: ['attack', 'special_attack'],
    message: (user, target) => `${user} used Power Swap! ${user} and ${target} switched Attack and Special Attack stats!`,
  },
  'Agility': {
    type: 'stat_buff',
    target: StatusMoveTarget.SELF,
    stats: { speed: 2 },
    message: (user) => `${user} used Agility! ${user}'s Speed rose sharply!`,
  },
  'Power Trick': {
    type: 'stat_swap_self',
    target: StatusMoveTarget.SELF,
    swapStats: ['attack', 'defense'],
    message: (user) => `${user} used Power Trick! ${user} swapped its Attack and Defense stats!`,
  },
  'Guard Split': {
    type: 'stat_average',
    target: StatusMoveTarget.OPPONENT,
    averageStats: ['defense', 'special_defense'],
    message: (user, target) => `${user} used Guard Split! ${user} and ${target} shared their Defense and Special Defense!`,
  },
  'Take Heart': {
    type: 'stat_buff_clear_debuffs',
    target: StatusMoveTarget.SELF,
    stats: { special_attack: 1, special_defense: 1 },
    clearNegativeStats: true,
    message: (user) => `${user} used Take Heart! Negative stat changes were removed and Special Attack and Special Defense rose!`,
  },
  'Guard Swap': {
    type: 'stat_swap_specific',
    target: StatusMoveTarget.OPPONENT,
    swapStats: ['defense', 'special_defense'],
    message: (user, target) => `${user} used Guard Swap! ${user} and ${target} swapped their Defense and Special Defense stats!`,
  },
  'Power Split': {
    type: 'stat_average',
    target: StatusMoveTarget.OPPONENT,
    averageStats: ['attack', 'special_attack'],
    message: (user, target) => `${user} used Power Split! ${user} and ${target} shared their Attack and Special Attack!`,
  },
  'Cosmic Power': {
    type: 'stat_buff',
    target: StatusMoveTarget.SELF,
    stats: { defense: 1, special_defense: 1 },
    message: (user) => `${user} used Cosmic Power! ${user}'s Defense and Special Defense rose!`,
  },
  'Rock Polish': {
    type: 'stat_buff',
    target: StatusMoveTarget.SELF,
    stats: { speed: 2 },
    message: (user) => `${user} used Rock Polish! ${user}'s Speed rose sharply!`,
  },
};

/**
 * Status affliction moves
 * Moves that inflict status conditions
 */
export const STATUS_AFFLICTION_MOVES: StatusMoveDictionary = {
  'Toxic': {
    type: 'status_affliction',
    target: StatusMoveTarget.OPPONENT,
    statusEffect: PrimaryStatus.TOXIC,
    duration: 5,
    message: (user, target) => `${user} used Toxic! ${target} was badly poisoned!`,
  },
  'Dark Void': {
    type: 'status_affliction',
    target: StatusMoveTarget.OPPONENT,
    statusEffect: PrimaryStatus.SLEEP,
    duration: 3,
    message: (user, target) => `${user} used Dark Void! ${target} fell into a deep sleep!`,
  },
  'Thunder Wave': {
    type: 'status_affliction',
    target: StatusMoveTarget.OPPONENT,
    statusEffect: PrimaryStatus.PARALYSIS,
    duration: 4,
    message: (user, target) => `${user} used Thunder Wave! ${target} is paralyzed and may not be able to attack!`,
  },
  'Sweet Kiss': {
    type: 'status_affliction',
    target: StatusMoveTarget.OPPONENT,
    statusEffect: VolatileStatus.CONFUSION,
    duration: 3,
    message: (user, target) => `${user} used Sweet Kiss! ${target} became confused!`,
  },
  'Will-O-Wisp': {
    type: 'status_affliction',
    target: StatusMoveTarget.OPPONENT,
    statusEffect: PrimaryStatus.BURN,
    duration: 4,
    message: (user, target) => `${user} used Will-O-Wisp! ${target} was burned!`,
  },
  'Confuse Ray': {
    type: 'status_affliction',
    target: StatusMoveTarget.OPPONENT,
    statusEffect: VolatileStatus.CONFUSION,
    duration: 3,
    message: (user, target) => `${user} used Confuse Ray! ${target} became confused!`,
  },
  'Nightmare': {
    type: 'conditional_status',
    target: StatusMoveTarget.OPPONENT,
    statusEffect: VolatileStatus.NIGHTMARE,
    duration: -1,
    condition: 'sleeping',
    message: (user, target) => `${user} used Nightmare! ${target} fell into a nightmare!`,
  },
  'Sleep Powder': {
    type: 'status_affliction',
    target: StatusMoveTarget.OPPONENT,
    statusEffect: PrimaryStatus.SLEEP,
    duration: 3,
    message: (user, target) => `${user} used Sleep Powder! ${target} fell asleep!`,
  },
  'Spore': {
    type: 'status_affliction',
    target: StatusMoveTarget.OPPONENT,
    statusEffect: PrimaryStatus.SLEEP,
    duration: 3,
    accuracy: 100,
    message: (user, target) => `${user} used Spore! ${target} fell asleep!`,
  },
  'Grass Whistle': {
    type: 'status_affliction',
    target: StatusMoveTarget.OPPONENT,
    statusEffect: PrimaryStatus.SLEEP,
    duration: 3,
    message: (user, target) => `${user} used Grass Whistle! ${target} fell asleep!`,
  },
  'Stun Spore': {
    type: 'status_affliction',
    target: StatusMoveTarget.OPPONENT,
    statusEffect: PrimaryStatus.PARALYSIS,
    duration: 4,
    message: (user, target) => `${user} used Stun Spore! ${target} is paralyzed and may not be able to attack!`,
  },
  'Sing': {
    type: 'status_affliction',
    target: StatusMoveTarget.OPPONENT,
    statusEffect: PrimaryStatus.SLEEP,
    duration: 3,
    message: (user, target) => `${user} used Sing! ${target} fell asleep to the soothing melody!`,
  },
  'Yawn': {
    type: 'delayed_status',
    target: StatusMoveTarget.OPPONENT,
    statusEffect: PrimaryStatus.SLEEP,
    delay: 1,
    duration: 3,
    message: (user, target) => `${user} used Yawn! ${target} grew drowsy and will fall asleep next turn!`,
  },
  'Supersonic': {
    type: 'status_affliction',
    target: StatusMoveTarget.OPPONENT,
    statusEffect: VolatileStatus.CONFUSION,
    duration: 3,
    message: (user, target) => `${user} used Supersonic! ${target} became confused!`,
  },
  'Lovely Kiss': {
    type: 'status_affliction',
    target: StatusMoveTarget.OPPONENT,
    statusEffect: PrimaryStatus.SLEEP,
    duration: 3,
    message: (user, target) => `${user} used Lovely Kiss! ${target} fell asleep!`,
  },
  'Attract': {
    type: 'status_affliction_gender',
    target: StatusMoveTarget.OPPONENT,
    statusEffect: VolatileStatus.INFATUATION,
    duration: -1,
    requiresOppositeGender: true,
    message: (user, target) => `${user} used Attract! ${target} fell in love!`,
  },
  'Teeter Dance': {
    type: 'status_affliction_all',
    target: StatusMoveTarget.ALL,
    statusEffect: VolatileStatus.CONFUSION,
    duration: 3,
    includesSelf: true,
    message: (user) => `${user} used Teeter Dance! All monsters became confused!`,
  },
  'Glare': {
    type: 'status_affliction',
    target: StatusMoveTarget.OPPONENT,
    statusEffect: PrimaryStatus.PARALYSIS,
    duration: 4,
    message: (user, target) => `${user} used Glare! ${target} is paralyzed and may not be able to attack!`,
  },
  'Poison Powder': {
    type: 'status_affliction',
    target: StatusMoveTarget.OPPONENT,
    statusEffect: PrimaryStatus.POISON,
    duration: 4,
    message: (user, target) => `${user} used Poison Powder! ${target} was poisoned!`,
  },
  'Poison Gas': {
    type: 'status_affliction_adjacent',
    target: StatusMoveTarget.ADJACENT_OPPONENTS,
    statusEffect: PrimaryStatus.POISON,
    duration: 4,
    affectsAdjacent: true,
    message: (user) => `${user} used Poison Gas! Adjacent opponents were poisoned!`,
  },
  'Hypnosis': {
    type: 'status_affliction',
    target: StatusMoveTarget.OPPONENT,
    statusEffect: PrimaryStatus.SLEEP,
    duration: 3,
    accuracy: 60,
    message: (user, target) => `${user} used Hypnosis! ${target} fell into a deep sleep!`,
  },
  'Psycho Shift': {
    type: 'status_transfer',
    target: StatusMoveTarget.OPPONENT,
    statusEffect: PrimaryStatus.POISON, // Placeholder - transfers user's status
    transferOwnStatus: true,
    curesSelf: true,
    message: (user, target) => `${user} used Psycho Shift! ${user} transferred its status condition to ${target}!`,
  },
};

/**
 * Healing moves
 * Moves that restore HP or cure status
 */
export const HEALING_MOVES: StatusMoveDictionary = {
  'Synthesis': {
    type: 'healing',
    target: StatusMoveTarget.SELF,
    healAmount: (monster) => Math.floor(monster.max_hp * 0.5),
    message: (user) => `${user} used Synthesis and restored its health!`,
  },
  'Milk Drink': {
    type: 'healing',
    target: StatusMoveTarget.SELF,
    healAmount: (monster) => Math.floor(monster.max_hp * 0.5),
    message: (user) => `${user} used Milk Drink and restored its health!`,
  },
  'Heal Order': {
    type: 'healing',
    target: StatusMoveTarget.SELF,
    healAmount: (monster) => Math.floor(monster.max_hp * 0.5),
    message: (user) => `${user} used Heal Order and restored its health!`,
  },
  'Moonlight': {
    type: 'healing_weather',
    target: StatusMoveTarget.SELF,
    healAmount: (monster, weather) => {
      let healPercent = 0.5;
      if (weather === 'sunny') {
        healPercent = 0.66;
      } else if (['rain', 'sandstorm', 'hail'].includes(weather as string)) {
        healPercent = 0.25;
      }
      return Math.floor(monster.max_hp * healPercent);
    },
    message: (user) => `${user} used Moonlight and restored its health!`,
  },
  'Floral Healing': {
    type: 'healing_terrain',
    target: StatusMoveTarget.ALLY,
    healAmount: (monster, terrain) => {
      const healPercent = terrain === 'grassy' ? 0.66 : 0.5;
      return Math.floor(monster.max_hp * healPercent);
    },
    message: (user, target) => `${user} used Floral Healing! ${target} restored its health!`,
  },
  'Roost': {
    type: 'healing_type_change',
    target: StatusMoveTarget.SELF,
    healAmount: (monster) => Math.floor(monster.max_hp * 0.5),
    loseFlying: true,
    message: (user) => `${user} used Roost and restored its health! ${user} lost its Flying type temporarily!`,
  },
  'Jungle Healing': {
    type: 'team_healing_status_cure',
    target: StatusMoveTarget.TEAM,
    healAmount: (monster) => Math.floor(monster.max_hp * 0.25),
    cureStatus: true,
    message: (user) => `${user} used Jungle Healing! The team recovered HP and was cured of status conditions!`,
  },
  'Shore Up': {
    type: 'healing_weather',
    target: StatusMoveTarget.SELF,
    healAmount: (monster, weather) => {
      let healPercent = 0.5;
      if (weather === 'sandstorm') {
        healPercent = 0.66;
      } else if (['rain', 'hail', 'snow'].includes(weather as string)) {
        healPercent = 0.25;
      }
      return Math.floor(monster.max_hp * healPercent);
    },
    message: (user) => `${user} used Shore Up and restored its health!`,
  },
  'Wish': {
    type: 'delayed_healing',
    target: StatusMoveTarget.SELF,
    healAmount: (monster) => Math.floor(monster.max_hp * 0.5),
    delay: 2,
    message: (user) => `${user} used Wish! A wish will come true in 2 turns!`,
  },
  'Refresh': {
    type: 'status_cure',
    target: StatusMoveTarget.SELF,
    healAmount: () => 0,
    cureStatus: true,
    message: (user) => `${user} used Refresh and cured all status conditions!`,
  },
  'Swallow': {
    type: 'healing_stockpile',
    target: StatusMoveTarget.SELF,
    healAmount: (monster, stacks) => {
      const stackCount = typeof stacks === 'number' ? stacks : 1;
      const healPercent = stackCount === 1 ? 0.25 : stackCount === 2 ? 0.5 : 1.0;
      return Math.floor(monster.max_hp * healPercent);
    },
    consumeStockpile: true,
    message: (user, _target, stacks) => `${user} used Swallow and consumed ${stacks} Stockpile${Number(stacks) > 1 ? 's' : ''}!`,
  },
  'Recover': {
    type: 'healing',
    target: StatusMoveTarget.SELF,
    healAmount: (monster) => Math.floor(monster.max_hp * 0.5),
    message: (user) => `${user} used Recover and restored its health!`,
  },
  'Heal Bell': {
    type: 'team_status_cure',
    target: StatusMoveTarget.TEAM,
    healAmount: () => 0,
    cureAllTeamStatus: true,
    message: (user) => `${user} used Heal Bell! The team was cured of all status conditions!`,
  },
  'Soft-Boiled': {
    type: 'healing',
    target: StatusMoveTarget.SELF,
    healAmount: (monster) => Math.floor(monster.max_hp * 0.5),
    message: (user) => `${user} used Soft-Boiled and restored its health!`,
  },
  'Morning Sun': {
    type: 'healing_weather',
    target: StatusMoveTarget.SELF,
    healAmount: (monster, weather) => {
      let healPercent = 0.5;
      if (weather === 'sunny') {
        healPercent = 0.66;
      } else if (['rain', 'hail', 'sandstorm', 'snow'].includes(weather as string)) {
        healPercent = 0.25;
      }
      return Math.floor(monster.max_hp * healPercent);
    },
    message: (user) => `${user} used Morning Sun and restored its health with the power of sunlight!`,
  },
  'Slack Off': {
    type: 'healing',
    target: StatusMoveTarget.SELF,
    healAmount: (monster) => Math.floor(monster.max_hp * 0.5),
    message: (user) => `${user} used Slack Off and restored its health!`,
  },
  'Purify': {
    type: 'healing_cure_status',
    target: StatusMoveTarget.OPPONENT,
    healAmount: (monster) => Math.floor(monster.max_hp * 0.5),
    cureStatus: true,
    healSelf: true,
    message: (user, target) => `${user} used Purify! ${target} was cured and restored health!`,
  },
  'Heal Pulse': {
    type: 'healing_target',
    target: StatusMoveTarget.ALLY,
    healAmount: (monster) => Math.floor(monster.max_hp * 0.5),
    message: (user, target) => `${user} used Heal Pulse! ${target} recovered health!`,
  },
  'Lunar Dance': {
    type: 'sacrifice_heal',
    target: StatusMoveTarget.SELF,
    healAmount: (monster) => monster.max_hp,
    sacrifice: true,
    message: (user) => `${user} used Lunar Dance! ${user} fainted to restore the next monster to full health!`,
  },
  'Healing Wish': {
    type: 'sacrifice_heal',
    target: StatusMoveTarget.SELF,
    healAmount: (monster) => monster.max_hp,
    sacrifice: true,
    cureStatus: true,
    message: (user) => `${user} used Healing Wish! ${user} fainted to restore the next monster to full health and cure its status!`,
  },
  'Rest': {
    type: 'healing_sleep',
    target: StatusMoveTarget.SELF,
    healAmount: (monster) => monster.max_hp,
    statusEffect: PrimaryStatus.SLEEP,
    message: (user) => `${user} used Rest! ${user} restored its health and fell asleep!`,
  },
  'Lunar Blessing': {
    type: 'healing_user_and_ally',
    target: StatusMoveTarget.SELF,
    healAmount: (monster) => Math.floor(monster.max_hp * 0.25),
    healAlly: true,
    cureStatus: true,
    message: (user) => `${user} used Lunar Blessing! ${user} and its ally were healed and cured of status conditions!`,
  },
};

/**
 * Other status moves
 * Terrain, weather, protection, hazards, and miscellaneous effects
 */
export const OTHER_STATUS_MOVES: StatusMoveDictionary = {
  'Psychic Terrain': {
    type: 'terrain',
    target: StatusMoveTarget.FIELD,
    effect: 'psychic_terrain',
    duration: 5,
    message: (user) => `${user} used Psychic Terrain! The battlefield became weird!`,
  },
  'Splash': {
    type: 'no_effect',
    target: StatusMoveTarget.SELF,
    effect: 'nothing',
    message: (user) => `${user} used Splash! But nothing happened!`,
  },
  'Spider Web': {
    type: 'trap',
    target: StatusMoveTarget.OPPONENT,
    effect: 'trapped',
    duration: 5,
    message: (user) => `${user} used Spider Web! The opponent is trapped and cannot escape!`,
  },
  'Powder': {
    type: 'powder',
    target: StatusMoveTarget.OPPONENT,
    effect: 'powder_protection',
    duration: 1,
    message: (user) => `${user} used Powder! If hit by a Fire-type move, the attacker will take damage!`,
  },
  'Rage Powder': {
    type: 'redirect',
    target: StatusMoveTarget.SELF,
    effect: 'attention_focus',
    duration: 1,
    message: (user) => `${user} used Rage Powder! ${user} became the center of attention!`,
  },
  'Silk Trap': {
    type: 'protection_debuff',
    target: StatusMoveTarget.SELF,
    effect: 'silk_protection',
    duration: 1,
    speedDebuff: -1,
    message: (user) => `${user} used Silk Trap! ${user} is protected and will lower the attacker's Speed!`,
  },
  'Sticky Web': {
    type: 'entry_hazard',
    target: StatusMoveTarget.FIELD,
    effect: 'sticky_web',
    duration: -1,
    message: (user) => `${user} used Sticky Web! A sticky web was laid around the opposing team!`,
  },
  'Embargo': {
    type: 'disable_items',
    target: StatusMoveTarget.OPPONENT,
    effect: 'embargo',
    duration: 5,
    message: (user) => `${user} used Embargo! The opponent cannot use items!`,
  },
  'Torment': {
    type: 'disable_repeat',
    target: StatusMoveTarget.OPPONENT,
    effect: 'torment',
    duration: 5,
    message: (user) => `${user} used Torment! The opponent cannot use the same move twice!`,
  },
  'Memento': {
    type: 'sacrifice_debuff',
    target: StatusMoveTarget.OPPONENT,
    effect: 'memento',
    stats: { attack: -2, special_attack: -2 },
    message: (user) => `${user} used Memento! ${user} fainted! The opponent's Attack and Special Attack harshly fell!`,
  },
  'Obstruct': {
    type: 'protection_debuff',
    target: StatusMoveTarget.SELF,
    effect: 'obstruct_protection',
    duration: 1,
    defenseDebuff: -2,
    message: (user) => `${user} used Obstruct! ${user} is protected and will harshly lower the attacker's Defense!`,
  },
  'Switcheroo': {
    type: 'swap_items',
    target: StatusMoveTarget.OPPONENT,
    effect: 'item_swap',
    message: (user) => `${user} used Switcheroo! ${user} swapped items with the opponent!`,
  },
  'Snatch': {
    type: 'steal_move',
    target: StatusMoveTarget.SELF,
    effect: 'snatch',
    duration: 1,
    message: (user) => `${user} used Snatch! ${user} will steal the next status move!`,
  },
  'Quash': {
    type: 'priority_control',
    target: StatusMoveTarget.OPPONENT,
    effect: 'quash',
    duration: 1,
    message: (user) => `${user} used Quash! The opponent will move last this turn!`,
  },
  'Topsy Turvy': {
    type: 'reverse_stats',
    target: StatusMoveTarget.OPPONENT,
    effect: 'stat_reversal',
    message: (user) => `${user} used Topsy Turvy! All stat changes on the opponent were reversed!`,
  },
  'Taunt': {
    type: 'disable_status',
    target: StatusMoveTarget.OPPONENT,
    effect: 'taunt',
    duration: 3,
    message: (user) => `${user} used Taunt! The opponent cannot use status moves!`,
  },
  'Dragon Cheer': {
    type: 'critical_boost',
    target: StatusMoveTarget.ALLY,
    effect: 'critical_boost',
    duration: 5,
    message: (user) => `${user} used Dragon Cheer! Allies' critical hit ratio increased!`,
  },
  'Electric Terrain': {
    type: 'terrain',
    target: StatusMoveTarget.FIELD,
    effect: 'electric_terrain',
    duration: 5,
    message: (user) => `${user} used Electric Terrain! The battlefield became electrified!`,
  },
  'Charge': {
    type: 'charge_up',
    target: StatusMoveTarget.SELF,
    effect: 'charge',
    duration: 1,
    message: (user) => `${user} used Charge! ${user} began charging power and raised Special Defense!`,
  },
  'Electrify': {
    type: 'type_change',
    target: StatusMoveTarget.OPPONENT,
    effect: 'electrify',
    duration: 1,
    message: (user) => `${user} used Electrify! The opponent's next move will become Electric-type!`,
  },
  'Magnetic Flux': {
    type: 'ally_boost',
    target: StatusMoveTarget.ALLIES,
    effect: 'magnetic_flux',
    stats: { defense: 1, special_defense: 1 },
    message: (user) => `${user} used Magnetic Flux! Steel and Electric allies' Defense and Special Defense rose!`,
  },
  'Ion Deluge': {
    type: 'move_type_change',
    target: StatusMoveTarget.FIELD,
    effect: 'ion_deluge',
    duration: 1,
    message: (user) => `${user} used Ion Deluge! Normal-type moves will become Electric-type this turn!`,
  },
  'Magnet Rise': {
    type: 'levitate',
    target: StatusMoveTarget.SELF,
    effect: 'magnet_rise',
    duration: 5,
    message: (user) => `${user} used Magnet Rise! ${user} levitated with electromagnetism!`,
  },
  'Misty Terrain': {
    type: 'terrain',
    target: StatusMoveTarget.FIELD,
    effect: 'misty_terrain',
    duration: 5,
    message: (user) => `${user} used Misty Terrain! The battlefield became misty!`,
  },
  'Crafty Shield': {
    type: 'team_protection',
    target: StatusMoveTarget.TEAM,
    effect: 'crafty_shield',
    duration: 1,
    protectFrom: 'status_moves',
    message: (user) => `${user} used Crafty Shield! The team is protected from status moves!`,
  },
  'Fairy Lock': {
    type: 'field_lock',
    target: StatusMoveTarget.FIELD,
    effect: 'fairy_lock',
    duration: 1,
    message: (user) => `${user} used Fairy Lock! No one can escape now!`,
  },
  'Quick Guard': {
    type: 'team_protection',
    target: StatusMoveTarget.TEAM,
    effect: 'quick_guard',
    duration: 1,
    protectFrom: 'priority_moves',
    message: (user) => `${user} used Quick Guard! The team is protected from priority moves!`,
  },
  'Detect': {
    type: 'protection',
    target: StatusMoveTarget.SELF,
    effect: 'detect',
    duration: 1,
    protection: true,
    message: (user) => `${user} used Detect! ${user} is protected from attacks!`,
  },
  'Mat Block': {
    type: 'team_protection_first_turn',
    target: StatusMoveTarget.TEAM,
    effect: 'mat_block',
    duration: 1,
    protectFrom: 'damaging_moves',
    message: (user) => `${user} used Mat Block! The team is protected from damaging moves!`,
  },
  'Burning Bulwark': {
    type: 'protection_burn',
    target: StatusMoveTarget.SELF,
    effect: 'burning_bulwark',
    duration: 1,
    protection: true,
    contactEffect: { statusEffect: PrimaryStatus.BURN, duration: 4 },
    message: (user) => `${user} used Burning Bulwark! ${user} is protected and will burn attackers on contact!`,
  },
  'Sunny Day': {
    type: 'weather',
    target: StatusMoveTarget.FIELD,
    effect: 'sunny_day',
    duration: 5,
    weather: 'sunny',
    message: (user) => `${user} used Sunny Day! The sunlight turned harsh!`,
  },
  'Tailwind': {
    type: 'team_speed_boost',
    target: StatusMoveTarget.TEAM,
    effect: 'tailwind',
    duration: 4,
    speedMultiplier: 2,
    message: (user) => `${user} used Tailwind! The team's Speed doubled!`,
  },
  'Mirror Move': {
    type: 'copy_move',
    target: StatusMoveTarget.OPPONENT,
    effect: 'mirror_move',
    copyLastMove: true,
    message: (user, _target, lastMove) => `${user} used Mirror Move and copied ${lastMove}!`,
  },
  'Defog': {
    type: 'hazard_removal',
    target: StatusMoveTarget.FIELD,
    effect: 'defog',
    removeHazards: true,
    stats: { evasion: -1 },
    message: (user) => `${user} used Defog! Hazards were cleared and the opponent's evasiveness fell!`,
  },
  'Spite': {
    type: 'pp_reduction',
    target: StatusMoveTarget.OPPONENT,
    effect: 'spite',
    ppReduction: 4,
    targetLastMove: true,
    message: (user, _target, lastMove) => `${user} used Spite! ${lastMove} lost 4 PP!`,
  },
  'Grudge': {
    type: 'pp_zero_on_ko',
    target: StatusMoveTarget.SELF,
    effect: 'grudge',
    duration: 1,
    zeroLastMovePP: true,
    message: (user) => `${user} used Grudge! If ${user} faints, the attacker's last move will lose all PP!`,
  },
  'Trick-or-Treat': {
    type: 'add_type',
    target: StatusMoveTarget.OPPONENT,
    effect: 'trick_or_treat',
    addType: 'Ghost',
    message: (user, target) => `${user} used Trick-or-Treat! ${target} became part Ghost-type!`,
  },
  'Destiny Bond': {
    type: 'destiny_bond',
    target: StatusMoveTarget.SELF,
    effect: 'destiny_bond',
    duration: 1,
    faintTogether: true,
    message: (user) => `${user} used Destiny Bond! If ${user} faints, the attacker will too!`,
  },
  'Spiky Shield': {
    type: 'protection_damage',
    target: StatusMoveTarget.SELF,
    effect: 'spiky_shield',
    duration: 1,
    protection: true,
    contactDamage: (attacker) => Math.floor(attacker.max_hp / 8),
    message: (user) => `${user} used Spiky Shield! ${user} is protected and will damage attackers on contact!`,
  },
  'Aromatherapy': {
    type: 'team_status_cure',
    target: StatusMoveTarget.TEAM,
    effect: 'aromatherapy',
    cureAllStatus: true,
    message: (user) => `${user} used Aromatherapy! The team was cured of all status conditions!`,
  },
  "Forest's Curse": {
    type: 'add_type',
    target: StatusMoveTarget.OPPONENT,
    effect: 'forests_curse',
    addType: 'Grass',
    message: (user, target) => `${user} used Forest's Curse! ${target} became part Grass-type!`,
  },
  'Ingrain': {
    type: 'ingrain',
    target: StatusMoveTarget.SELF,
    effect: 'ingrain',
    duration: -1,
    healPerTurn: (monster) => Math.floor(monster.max_hp / 16),
    message: (user) => `${user} used Ingrain! ${user} planted roots and is now trapped, but will recover HP each turn!`,
  },
  'Grassy Terrain': {
    type: 'terrain',
    target: StatusMoveTarget.FIELD,
    effect: 'grassy_terrain',
    duration: 5,
    message: (user) => `${user} used Grassy Terrain! The battlefield became grassy!`,
  },
  'Worry Seed': {
    type: 'ability_change',
    target: StatusMoveTarget.OPPONENT,
    effect: 'worry_seed',
    changeAbility: 'Insomnia',
    message: (user, target) => `${user} used Worry Seed! ${target}'s ability became Insomnia!`,
  },
  'Mud Sport': {
    type: 'field_effect',
    target: StatusMoveTarget.FIELD,
    effect: 'mud_sport',
    duration: 5,
    weakenElectricMoves: 0.33,
    message: (user) => `${user} used Mud Sport! Electric-type moves are weakened!`,
  },
  'Spikes': {
    type: 'entry_hazard',
    target: StatusMoveTarget.FIELD,
    effect: 'spikes',
    duration: -1,
    layers: 1,
    damagePercent: 0.125,
    message: (user) => `${user} used Spikes! Spikes were scattered around the opposing team!`,
  },
  'Hail': {
    type: 'weather',
    target: StatusMoveTarget.FIELD,
    effect: 'hail',
    duration: 5,
    weather: 'hail',
    message: (user) => `${user} used Hail! It started to hail!`,
  },
  'Snowscape': {
    type: 'weather',
    target: StatusMoveTarget.FIELD,
    effect: 'snow',
    duration: 5,
    weather: 'snow',
    message: (user) => `${user} used Snowscape! It started to snow!`,
  },
  'Chilly Reception': {
    type: 'weather_switch',
    target: StatusMoveTarget.FIELD,
    effect: 'chilly_reception',
    duration: 5,
    weather: 'snow',
    message: (user) => `${user} used Chilly Reception! It started to snow and ${user} switched out!`,
  },
  'Mist': {
    type: 'team_protection',
    target: StatusMoveTarget.TEAM,
    effect: 'mist',
    duration: 5,
    protectFrom: 'stat_reduction',
    message: (user) => `${user} used Mist! The team is protected from stat reduction!`,
  },
  'Aurora Veil': {
    type: 'team_damage_reduction',
    target: StatusMoveTarget.TEAM,
    effect: 'aurora_veil',
    duration: 5,
    damageReduction: 0.5,
    requiresSnow: true,
    message: (user) => `${user} used Aurora Veil! The team is protected by a mystical veil!`,
  },
  'Lucky Chant': {
    type: 'critical_prevention',
    target: StatusMoveTarget.TEAM,
    effect: 'lucky_chant',
    duration: 5,
    preventCriticals: true,
    message: (user) => `${user} used Lucky Chant! The team is protected from critical hits!`,
  },
  'Whirlwind': {
    type: 'force_switch',
    target: StatusMoveTarget.OPPONENT,
    effect: 'whirlwind',
    forceSwitch: true,
    priority: -6,
    message: (user, target) => `${user} used Whirlwind! ${target} was blown away!`,
  },
  'Teatime': {
    type: 'consume_berries',
    target: StatusMoveTarget.FIELD,
    effect: 'teatime',
    consumeAllBerries: true,
    message: (user) => `${user} used Teatime! Everyone consumed their berries!`,
  },
  'Camouflage': {
    type: 'type_change_terrain',
    target: StatusMoveTarget.SELF,
    effect: 'camouflage',
    changeTypeBasedOnTerrain: true,
    message: (user, _target, newType) => `${user} used Camouflage! ${user} became ${newType}-type!`,
  },
  'Entrainment': {
    type: 'ability_copy',
    target: StatusMoveTarget.OPPONENT,
    effect: 'entrainment',
    copyAbilityToTarget: true,
    message: (user, target, ability) => `${user} used Entrainment! ${target}'s ability became ${ability}!`,
  },
  'Assist': {
    type: 'random_team_move',
    target: StatusMoveTarget.VARIABLE,
    effect: 'assist',
    useRandomTeamMove: true,
    message: (user, _target, move) => `${user} used Assist and performed ${move}!`,
  },
  'Court Change': {
    type: 'swap_field_effects',
    target: StatusMoveTarget.FIELD,
    effect: 'court_change',
    swapAllFieldEffects: true,
    message: (user) => `${user} used Court Change! All field effects were swapped!`,
  },
  'Reflect Type': {
    type: 'type_copy',
    target: StatusMoveTarget.OPPONENT,
    effect: 'reflect_type',
    copyType: true,
    message: (user, target) => `${user} used Reflect Type and copied ${target}'s type!`,
  },
  'Helping Hand': {
    type: 'ally_boost',
    target: StatusMoveTarget.ALLY,
    effect: 'helping_hand',
    boostNextMove: 1.5,
    duration: 1,
    message: (user) => `${user} used Helping Hand! An ally's next move will be boosted!`,
  },
  'Copycat': {
    type: 'copy_last_move',
    target: StatusMoveTarget.VARIABLE,
    effect: 'copycat',
    copyLastMove: true,
    message: (user, _target, move) => `${user} used Copycat and copied ${move}!`,
  },
  'Tidy Up': {
    type: 'hazard_removal_stat_boost',
    target: StatusMoveTarget.FIELD,
    effect: 'tidy_up',
    removeHazards: ['spikes', 'toxic_spikes', 'stealth_rock', 'sticky_web'],
    stats: { attack: 1, speed: 1 },
    message: (user) => `${user} used Tidy Up! Hazards were removed and stats rose!`,
  },
  'Foresight': {
    type: 'identify_ghost',
    target: StatusMoveTarget.OPPONENT,
    effect: 'foresight',
    removeEvasion: true,
    allowNormalVsGhost: true,
    duration: -1,
    message: (user, target) => `${user} used Foresight! ${target} was identified!`,
  },
  'Happy Hour': {
    type: 'double_prize_money',
    target: StatusMoveTarget.FIELD,
    effect: 'happy_hour',
    duration: -1,
    message: (user) => `${user} used Happy Hour! Prize money will be doubled!`,
  },
  'Max Guard': {
    type: 'max_protection',
    target: StatusMoveTarget.SELF,
    effect: 'max_guard',
    protectFromMaxMoves: true,
    duration: 1,
    message: (user) => `${user} used Max Guard! It will be protected from Max Moves!`,
  },
  'Revival Blessing': {
    type: 'revive_ally',
    target: StatusMoveTarget.ALLY,
    effect: 'revival_blessing',
    reviveHpPercent: 0.5,
    message: (user) => `${user} used Revival Blessing! A fainted ally was revived!`,
  },
  'Metronome': {
    type: 'random_move',
    target: StatusMoveTarget.VARIABLE,
    effect: 'metronome',
    useRandomMove: true,
    excludedMoves: ['Metronome', 'Struggle', 'Sketch', 'Mirror Move', 'Copycat'],
    message: (user, _target, move) => `${user} used Metronome and performed ${move}!`,
  },
  'Sleep Talk': {
    type: 'sleep_move',
    target: StatusMoveTarget.VARIABLE,
    effect: 'sleep_talk',
    onlyWhileAsleep: true,
    useRandomKnownMove: true,
    message: (user, _target, move) => `${user} used Sleep Talk and performed ${move} while sleeping!`,
  },
  'Hold Hands': {
    type: 'no_battle_effect',
    target: StatusMoveTarget.ALLY,
    effect: 'hold_hands',
    message: (user) => `${user} used Hold Hands! Everyone feels happy!`,
  },
  'Recycle': {
    type: 'restore_item',
    target: StatusMoveTarget.SELF,
    effect: 'recycle',
    restoreLastUsedItem: true,
    message: (user) => `${user} used Recycle and restored its item!`,
  },
  'Me First': {
    type: 'priority_copy',
    target: StatusMoveTarget.OPPONENT,
    effect: 'me_first',
    copyOpponentMove: true,
    powerBoost: 1.5,
    priority: 1,
    message: (user, _target, move) => `${user} used Me First and copied ${move} with increased power!`,
  },
  'Celebrate': {
    type: 'no_battle_effect',
    target: StatusMoveTarget.SELF,
    effect: 'celebrate',
    message: (user) => `${user} used Celebrate! Congratulations!`,
  },
  'Protect': {
    type: 'protection',
    target: StatusMoveTarget.SELF,
    effect: 'protect',
    protectFromAllMoves: true,
    priority: 4,
    duration: 1,
    message: (user) => `${user} used Protect! It protected itself!`,
  },
  'Laser Focus': {
    type: 'critical_guarantee',
    target: StatusMoveTarget.SELF,
    effect: 'laser_focus',
    guaranteeCritical: true,
    duration: 1,
    message: (user) => `${user} used Laser Focus! Its next move will be a critical hit!`,
  },
  'Sketch': {
    type: 'permanent_copy',
    target: StatusMoveTarget.OPPONENT,
    effect: 'sketch',
    copyLastMove: true,
    permanentLearn: true,
    message: (user, _target, move) => `${user} used Sketch and permanently learned ${move}!`,
  },
  'Block': {
    type: 'trap_prevent_switch',
    target: StatusMoveTarget.OPPONENT,
    effect: 'block',
    preventSwitch: true,
    duration: -1,
    message: (user, target) => `${user} used Block! ${target} can no longer escape!`,
  },
  'Endure': {
    type: 'survive_lethal',
    target: StatusMoveTarget.SELF,
    effect: 'endure',
    surviveWith1HP: true,
    priority: 4,
    duration: 1,
    message: (user) => `${user} used Endure! It will survive any attack with at least 1 HP!`,
  },
  'Substitute': {
    type: 'create_substitute',
    target: StatusMoveTarget.SELF,
    effect: 'substitute',
    hpCost: 0.25,
    createSubstitute: true,
    message: (user) => `${user} used Substitute! It created a substitute!`,
  },
  'Conversion': {
    type: 'type_change_move',
    target: StatusMoveTarget.SELF,
    effect: 'conversion',
    changeToFirstMoveType: true,
    message: (user, _target, newType) => `${user} used Conversion and changed its type to ${newType}!`,
  },
  'Bestow': {
    type: 'give_item',
    target: StatusMoveTarget.OPPONENT,
    effect: 'bestow',
    giveHeldItem: true,
    message: (user, target) => `${user} used Bestow and gave its item to ${target}!`,
  },
  'Transform': {
    type: 'copy_appearance',
    target: StatusMoveTarget.OPPONENT,
    effect: 'transform',
    copyAppearance: true,
    copyMoves: true,
    copyStats: true,
    copyType: true,
    message: (user, target) => `${user} used Transform and transformed into ${target}!`,
  },
  'Mean Look': {
    type: 'trap_prevent_switch',
    target: StatusMoveTarget.OPPONENT,
    effect: 'mean_look',
    preventSwitch: true,
    duration: -1,
    message: (user, target) => `${user} used Mean Look! ${target} can no longer escape!`,
  },
  'Spotlight': {
    type: 'force_target',
    target: StatusMoveTarget.OPPONENT,
    effect: 'spotlight',
    forceAllAttacks: true,
    priority: 3,
    duration: 1,
    message: (user, target) => `${user} used Spotlight! ${target} became the center of attention!`,
  },
  'Roar': {
    type: 'force_switch_negative_priority',
    target: StatusMoveTarget.OPPONENT,
    effect: 'roar',
    forceSwitch: true,
    priority: -6,
    message: (user, target) => `${user} used Roar! ${target} was blown away!`,
  },
  'Baton Pass': {
    type: 'switch_pass_effects',
    target: StatusMoveTarget.SELF,
    effect: 'baton_pass',
    passStatChanges: true,
    passStatusEffects: true,
    switchUser: true,
    message: (user) => `${user} used Baton Pass and switched out while passing its effects!`,
  },
  'Mimic': {
    type: 'temporary_copy_move',
    target: StatusMoveTarget.OPPONENT,
    effect: 'mimic',
    copyLastMove: true,
    temporaryLearn: true,
    duration: -1,
    message: (user, _target, move) => `${user} used Mimic and learned ${move}!`,
  },
  'Encore': {
    type: 'force_repeat_move',
    target: StatusMoveTarget.OPPONENT,
    effect: 'encore',
    forceRepeatLastMove: true,
    duration: 3,
    message: (user, target) => `${user} used Encore! ${target} must repeat its last move!`,
  },
  'Doodle': {
    type: 'copy_ability',
    target: StatusMoveTarget.OPPONENT,
    effect: 'doodle',
    copyAbility: true,
    applyToTeam: true,
    message: (user, target, ability) => `${user} used Doodle and copied ${target}'s ${ability} for the whole team!`,
  },
  'Odor Sleuth': {
    type: 'identify_ghost',
    target: StatusMoveTarget.OPPONENT,
    effect: 'odor_sleuth',
    removeEvasion: true,
    allowNormalVsGhost: true,
    duration: -1,
    message: (user, target) => `${user} used Odor Sleuth! ${target} was identified!`,
  },
  'After You': {
    type: 'priority_boost_target',
    target: StatusMoveTarget.ALLY,
    effect: 'after_you',
    makeTargetMoveNext: true,
    priority: 0,
    message: (user, target) => `${user} used After You! ${target} will move next!`,
  },
  'Nature Power': {
    type: 'terrain_dependent_move',
    target: StatusMoveTarget.VARIABLE,
    effect: 'nature_power',
    becomesMove: {
      normal: 'Tri Attack',
      electric: 'Thunderbolt',
      grassy: 'Energy Ball',
      psychic: 'Psychic',
      misty: 'Moonblast',
    },
    message: (user, _target, move) => `${user} used Nature Power and turned it into ${move}!`,
  },
  'Perish Song': {
    type: 'perish_countdown',
    target: StatusMoveTarget.ALL,
    effect: 'perish_song',
    perishCountdown: 3,
    affectsAll: true,
    message: (user) => `${user} used Perish Song! All monsters that hear it will faint in 3 turns!`,
  },
  'Disable': {
    type: 'disable_move',
    target: StatusMoveTarget.OPPONENT,
    effect: 'disable',
    disableLastMove: true,
    duration: 4,
    message: (user, target, move) => `${user} used Disable! ${target}'s ${move} was disabled!`,
  },
  'Safeguard': {
    type: 'team_protection',
    target: StatusMoveTarget.TEAM,
    effect: 'safeguard',
    duration: 5,
    protectFrom: 'status_conditions',
    message: (user) => `${user} used Safeguard! The team is protected from status conditions!`,
  },
  'Conversion 2': {
    type: 'type_change_resist',
    target: StatusMoveTarget.SELF,
    effect: 'conversion_2',
    changeTypeToResist: true,
    message: (user, _target, newType) => `${user} used Conversion 2! ${user} changed its type to ${newType}!`,
  },
  'Simple Beam': {
    type: 'ability_change',
    target: StatusMoveTarget.OPPONENT,
    effect: 'simple_beam',
    changeAbility: 'Simple',
    message: (user, target) => `${user} used Simple Beam! ${target}'s ability became Simple!`,
  },
  'Pain Split': {
    type: 'hp_average',
    target: StatusMoveTarget.OPPONENT,
    effect: 'pain_split',
    averageHP: true,
    message: (user, target) => `${user} used Pain Split! ${user} and ${target} shared their pain!`,
  },
  'Shed Tail': {
    type: 'substitute_switch',
    target: StatusMoveTarget.SELF,
    effect: 'shed_tail',
    hpCost: 0.25,
    forceSwitch: true,
    message: (user) => `${user} used Shed Tail! ${user} created a substitute and switched out!`,
  },
  'Follow Me': {
    type: 'redirect_all',
    target: StatusMoveTarget.SELF,
    effect: 'follow_me',
    redirectAttacks: true,
    priority: 2,
    duration: 1,
    message: (user) => `${user} used Follow Me! ${user} became the center of attention!`,
  },
  'Lock On': {
    type: 'guarantee_next_hit',
    target: StatusMoveTarget.OPPONENT,
    effect: 'lock_on',
    guaranteeHit: true,
    duration: 1,
    message: (user, target) => `${user} used Lock On! ${user} took aim at ${target}!`,
  },
  'Mind Reader': {
    type: 'guarantee_next_hit',
    target: StatusMoveTarget.OPPONENT,
    effect: 'mind_reader',
    guaranteeHit: true,
    duration: 1,
    message: (user, target) => `${user} used Mind Reader! ${user} sensed ${target}'s movements!`,
  },
  'Baneful Bunker': {
    type: 'protection_poison',
    target: StatusMoveTarget.SELF,
    effect: 'baneful_bunker',
    protection: true,
    contactEffect: { statusEffect: PrimaryStatus.POISON, duration: 4 },
    priority: 4,
    duration: 1,
    message: (user) => `${user} used Baneful Bunker! ${user} is protected and will poison attackers on contact!`,
  },
  'Corrosive Gas': {
    type: 'destroy_items',
    target: StatusMoveTarget.ALL,
    effect: 'corrosive_gas',
    destroyHeldItems: true,
    affectsAll: true,
    message: (user) => `${user} used Corrosive Gas! All held items were destroyed!`,
  },
  'Toxic Spikes': {
    type: 'entry_hazard_poison',
    target: StatusMoveTarget.FIELD,
    effect: 'toxic_spikes',
    hazardType: 'poison',
    layers: 1,
    maxLayers: 2,
    duration: -1,
    message: (user) => `${user} used Toxic Spikes! Toxic spikes were scattered around the opposing team!`,
  },
  'Gastro Acid': {
    type: 'suppress_ability',
    target: StatusMoveTarget.OPPONENT,
    effect: 'gastro_acid',
    suppressAbility: true,
    duration: -1,
    message: (user, target) => `${user} used Gastro Acid! ${target}'s ability was suppressed!`,
  },
  'Magic Coat': {
    type: 'reflect_status',
    target: StatusMoveTarget.SELF,
    effect: 'magic_coat',
    reflectStatusMoves: true,
    priority: 4,
    duration: 1,
    message: (user) => `${user} used Magic Coat! ${user} is ready to reflect status moves!`,
  },
  'Imprison': {
    type: 'disable_moves',
    target: StatusMoveTarget.OPPONENT,
    effect: 'imprison',
    duration: -1,
    disableSharedMoves: true,
    message: (user, target) => `${user} used Imprison! ${target} can no longer use moves that ${user} knows!`,
  },
  'Reflect': {
    type: 'team_barrier',
    target: StatusMoveTarget.TEAM,
    effect: 'reflect',
    duration: 5,
    damageReduction: 0.5,
    barrierType: 'physical',
    message: (user) => `${user} used Reflect! Physical damage to the team will be reduced!`,
  },
  'Ally Switch': {
    type: 'switch_positions',
    target: StatusMoveTarget.ALLY,
    effect: 'ally_switch',
    priority: 2,
    switchPlaces: true,
    message: (user, target) => `${user} used Ally Switch! ${user} and ${target} switched places!`,
  },
  'Magic Room': {
    type: 'field_effect',
    target: StatusMoveTarget.FIELD,
    effect: 'magic_room',
    duration: 5,
    suppressItems: true,
    message: (user) => `${user} used Magic Room! All held item effects are suppressed!`,
  },
  'Trick Room': {
    type: 'field_effect',
    target: StatusMoveTarget.FIELD,
    effect: 'trick_room',
    duration: 5,
    reverseSpeed: true,
    message: (user) => `${user} used Trick Room! Speed order has been reversed!`,
  },
  'Heal Block': {
    type: 'disable_healing',
    target: StatusMoveTarget.OPPONENT,
    effect: 'heal_block',
    duration: 5,
    preventHealing: true,
    message: (user, target) => `${user} used Heal Block! ${target} was prevented from healing!`,
  },
  'Instruct': {
    type: 'force_repeat_last_move',
    target: StatusMoveTarget.OPPONENT,
    effect: 'instruct',
    forceRepeatLast: true,
    message: (user, target) => `${user} used Instruct! ${target} used its last move again!`,
  },
  'Miracle Eye': {
    type: 'identify_dark',
    target: StatusMoveTarget.OPPONENT,
    effect: 'miracle_eye',
    removeEvasion: true,
    allowPsychicVsDark: true,
    duration: -1,
    message: (user, target) => `${user} used Miracle Eye! ${target} was identified and can now be hit by Psychic moves!`,
  },
  'Role Play': {
    type: 'copy_ability',
    target: StatusMoveTarget.OPPONENT,
    effect: 'role_play',
    copyTargetAbility: true,
    message: (user, target) => `${user} used Role Play and copied ${target}'s ability!`,
  },
  'Trick': {
    type: 'swap_items',
    target: StatusMoveTarget.OPPONENT,
    effect: 'trick',
    swapHeldItems: true,
    message: (user, target) => `${user} used Trick! ${user} and ${target} swapped held items!`,
  },
  'Teleport': {
    type: 'escape_battle',
    target: StatusMoveTarget.SELF,
    effect: 'teleport',
    escapeBattle: true,
    priority: -6,
    message: (user) => `${user} used Teleport and fled from battle!`,
  },
  'Telekinesis': {
    type: 'levitate_target',
    target: StatusMoveTarget.OPPONENT,
    effect: 'telekinesis',
    duration: 3,
    levitateTarget: true,
    guaranteeHit: true,
    message: (user, target) => `${user} used Telekinesis! ${target} was lifted into the air and cannot avoid attacks!`,
  },
  'Wonder Room': {
    type: 'field_effect',
    target: StatusMoveTarget.FIELD,
    effect: 'wonder_room',
    duration: 5,
    swapDefenses: true,
    message: (user) => `${user} used Wonder Room! Defense and Special Defense stats were swapped for all monsters!`,
  },
  'Light Screen': {
    type: 'team_special_defense_boost',
    target: StatusMoveTarget.TEAM,
    effect: 'light_screen',
    duration: 5,
    specialDefenseMultiplier: 2,
    message: (user) => `${user} used Light Screen! A wondrous wall of light was raised to reduce the damage of special moves!`,
  },
  'Magic Powder': {
    type: 'type_change_target',
    target: StatusMoveTarget.OPPONENT,
    effect: 'magic_powder',
    changeType: 'Psychic',
    duration: -1,
    message: (user, target) => `${user} used Magic Powder! ${target}'s type changed to Psychic!`,
  },
  'Skill Swap': {
    type: 'ability_swap',
    target: StatusMoveTarget.OPPONENT,
    effect: 'skill_swap',
    swapAbilities: true,
    duration: -1,
    message: (user, target) => `${user} used Skill Swap! ${user} and ${target} swapped abilities!`,
  },
  'Gravity': {
    type: 'field_effect_gravity',
    target: StatusMoveTarget.FIELD,
    effect: 'gravity',
    duration: 5,
    groundsFlying: true,
    increaseAccuracy: true,
    accuracyMultiplier: 1.67,
    message: (user) => `${user} used Gravity! Gravity was intensified! Flying monsters and those with Levitate can be hit by Ground moves!`,
  },
  'Sandstorm': {
    type: 'weather',
    target: StatusMoveTarget.FIELD,
    effect: 'sandstorm',
    weather: 'sandstorm',
    duration: 5,
    message: (user) => `${user} used Sandstorm! A sandstorm kicked up!`,
  },
  'Stealth Rock': {
    type: 'entry_hazard',
    target: StatusMoveTarget.FIELD,
    effect: 'stealth_rock',
    duration: -1,
    side: 'opponent',
    hazardType: 'stealth_rock',
    message: (user) => `${user} used Stealth Rock! Pointed stones float in the air around the foe!`,
  },
  'Wide Guard': {
    type: 'team_protection_wide',
    target: StatusMoveTarget.TEAM,
    effect: 'wide_guard',
    duration: 1,
    protectFrom: 'wide_moves',
    priority: 3,
    message: (user) => `${user} used Wide Guard! Wide Guard protected the team!`,
  },
  'Tar Shot': {
    type: 'speed_debuff_fire_weakness',
    target: StatusMoveTarget.OPPONENT,
    effect: 'tar_shot',
    duration: -1,
    stats: { speed: -1 },
    fireWeakness: true,
    message: (user, target) => `${user} used Tar Shot! ${target} was covered in sticky tar! ${target}'s Speed fell and it became weak to Fire moves!`,
  },
  'Rain Dance': {
    type: 'weather',
    target: StatusMoveTarget.FIELD,
    effect: 'rain_dance',
    duration: 5,
    weather: 'rain',
    message: (user) => `${user} used Rain Dance! It started to rain!`,
  },
  'Leech Seed': {
    type: 'leech_seed',
    target: StatusMoveTarget.OPPONENT,
    effect: 'leech_seed',
    duration: -1,
    message: (user, target) => `${user} used Leech Seed! ${target} was seeded!`,
  },
};

/**
 * All status moves combined
 */
export const ALL_STATUS_MOVES: StatusMoveDictionary = {
  ...STAT_BUFF_DEBUFF_MOVES,
  ...STATUS_AFFLICTION_MOVES,
  ...HEALING_MOVES,
  ...OTHER_STATUS_MOVES,
};

/**
 * Get a status move definition by name
 * @param moveName - The name of the move
 * @returns The move definition or undefined
 */
export function getStatusMoveDefinition(moveName: string): StatusMoveDefinition | undefined {
  return ALL_STATUS_MOVES[moveName];
}

/**
 * Check if a move is a status move
 * @param moveName - The name of the move
 * @returns True if the move is a status move
 */
export function isStatusMove(moveName: string): boolean {
  return moveName in ALL_STATUS_MOVES;
}

/**
 * Get all status move names
 * @returns Array of all status move names
 */
export function getAllStatusMoveNames(): string[] {
  return Object.keys(ALL_STATUS_MOVES);
}

/**
 * Get status moves by type
 * @param type - The move type to filter by
 * @returns Object containing matching moves
 */
export function getStatusMovesByType(type: string): StatusMoveDictionary {
  return Object.fromEntries(
    Object.entries(ALL_STATUS_MOVES).filter(([, move]) => move.type === type)
  );
}

/**
 * Get status moves by target
 * @param target - The target type to filter by
 * @returns Object containing matching moves
 */
export function getStatusMovesByTarget(target: StatusMoveTargetValue): StatusMoveDictionary {
  return Object.fromEntries(
    Object.entries(ALL_STATUS_MOVES).filter(([, move]) => move.target === target)
  );
}
