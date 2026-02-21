/**
 * StatusEffectService
 * Handles all status effect application, processing, and removal in battle
 */

import {
  PrimaryStatus,
  VolatileStatus,
  PrimaryStatusValue,
  StatusEffectValue,
  PRIMARY_STATUSES,
  isPrimaryStatus,
} from '../../utils/constants/status-effects';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Monster data structure for status effect processing
 */
export interface StatusEffectMonster {
  id: number;
  name: string;
  current_hp: number;
  max_hp: number;
  monster_data?: {
    type1?: string;
    type2?: string;
    ability?: string;
    stat_modifications?: Record<string, number>;
    types?: string[];
  };
  status_effects?: ActiveStatusEffect[];
  stat_modifications?: Record<string, number>;
}

/**
 * Active status effect on a monster
 */
export interface ActiveStatusEffect {
  type: string;
  duration: number;
  applied_at?: string;
  data?: Record<string, unknown>;
}

/**
 * Status effect runtime metadata
 */
export interface StatusEffectMetadata {
  name: string;
  emoji: string;
  damagePerTurn: ((monster: StatusEffectMonster) => number) | null;
  healPerTurn: ((monster: StatusEffectMonster) => number) | null;
  preventAction: boolean;
  actionChance?: number;
  thawChance?: number;
  wakeChance?: number;
  selfHarmChance?: number;
  selfHarmDamage?: (monster: StatusEffectMonster) => number;
  duration: number;
  curable: boolean;
  // Special flags
  healOpponent?: boolean;
  preventStatusMoves?: boolean;
  preventItemUse?: boolean;
  preventRepeatMove?: boolean;
  stealStatusMoves?: boolean;
  moveLast?: boolean;
  redirectAttacks?: boolean;
  preventEscape?: boolean;
  fireTypePunishment?: boolean;
  protection?: boolean;
  contactEffect?: {
    stat?: string;
    change?: number;
    statusEffect?: string;
    duration?: number;
  };
  contactDamage?: (attacker: StatusEffectMonster) => number;
  criticalBoost?: boolean;
  chargeNext?: boolean;
  changeNextMoveType?: string;
  levitate?: boolean;
  immuneToGround?: boolean;
  fieldEffect?: boolean;
  teamEffect?: boolean;
  preventStatReduction?: boolean;
  damageReduction?: number;
  barrierType?: 'physical' | 'special' | 'both';
  forceSwitch?: boolean;
  typeChange?: boolean;
  delayedHealing?: boolean;
  delayedStatus?: boolean;
  stackable?: boolean;
  maxStacks?: number;
  guaranteeCritical?: boolean;
  surviveWith1HP?: boolean;
  hasSubstitute?: boolean;
  forceTarget?: boolean;
  forceRepeatMove?: boolean;
  perishCountdown?: boolean;
  disableMove?: boolean;
  guaranteeNextHit?: boolean;
  suppressAbility?: boolean;
  reflectStatusMoves?: boolean;
  disableSharedMoves?: boolean;
  reverseSpeed?: boolean;
  swapDefenses?: boolean;
  suppressItems?: boolean;
  statDebuffPerTurn?: Record<string, number>;
  trapped?: boolean;
  weather?: string;
  boostFireMoves?: number;
  weakenWaterMoves?: number;
  boostElectricMoves?: number;
  boostGrassMoves?: number;
  boostIceDefense?: number;
  weakenElectricMoves?: number;
  halveDragonMoves?: number;
  preventSleep?: boolean;
  preventStatusConditions?: boolean;
  groundsFlying?: boolean;
  accuracyMultiplier?: number;
  specialDefenseMultiplier?: number;
  priority?: number;
  onlySleeping?: boolean;
  addGhostType?: boolean;
  addGrassType?: boolean;
  faintTogether?: boolean;
  zeroLastMovePP?: boolean;
  changeAbility?: string;
  entryHazard?: boolean;
  damageOnEntry?: (monster: StatusEffectMonster, layers: number) => number;
  maxLayers?: number;
  poisonOnEntry?: boolean;
  hazardType?: string;
}

/**
 * Result of applying a status effect
 */
export interface StatusEffectApplicationResult {
  success: boolean;
  message: string;
  effectType: string;
  duration: number;
}

/**
 * Result of processing status effects at turn start
 */
export interface StatusEffectProcessingResult {
  canAct: boolean;
  damageDealt: number;
  healingDone: number;
  messages: string[];
  effectsRemoved: string[];
  // Special flags for battle logic
  preventStatusMoves?: boolean;
  preventItemUse?: boolean;
  preventRepeatMove?: boolean;
  snatchActive?: boolean;
  moveLast?: boolean;
  redirectTarget?: boolean;
  preventEscape?: boolean;
  firePunishment?: boolean;
  protection?: string;
  criticalBoost?: boolean;
  chargeActive?: boolean;
  electrifyActive?: boolean;
  ionDelugeActive?: boolean;
  levitating?: boolean;
  electricTerrain?: boolean;
  mistyTerrain?: boolean;
  grassyTerrain?: boolean;
  psychicTerrain?: boolean;
  craftyShield?: boolean;
  fairyLock?: boolean;
  quickGuard?: boolean;
  detectProtection?: boolean;
  matBlock?: boolean;
  octolockTrap?: boolean;
  burningBulwark?: boolean;
  sunnyWeather?: boolean;
  tailwindActive?: boolean;
  lostFlying?: boolean;
  grudgeActive?: boolean;
  addedGhostType?: boolean;
  destinyBondActive?: boolean;
  spikyShield?: boolean;
  ingrainTrapped?: boolean;
  addedGrassType?: boolean;
  changedAbility?: boolean;
  mudSport?: boolean;
  spikesActive?: boolean;
  hailWeather?: boolean;
  snowWeather?: boolean;
  mistProtection?: boolean;
  auroraVeil?: boolean;
  luckyChant?: boolean;
  forceSwitch?: boolean;
  typeChange?: { newType?: string; newType1?: string; newType2?: string | null };
  helpingHand?: { powerBoost: number };
  foresight?: { removeEvasion: boolean; allowNormalVsGhost: boolean };
  happyHour?: boolean;
  maxGuard?: boolean;
  protect?: { protectFromAll: boolean; priority: number };
  laserFocus?: boolean;
  preventSwitch?: boolean;
  endure?: { surviveWith1HP: boolean; priority?: number };
  substitute?: { hp: number; active: boolean };
  spotlight?: { forceTarget: boolean; priority?: number };
  roar?: { forceSwitch: boolean; priority?: number };
  encore?: { forceRepeatMove: boolean; duration: number };
  afterYou?: { moveNext: boolean };
  perishSong?: { countdown: number };
  disable?: { disabledMove: string; active: boolean };
  focusEnergy?: { criticalBoost: boolean };
  safeguard?: { preventStatusConditions: boolean; teamEffect: boolean };
  simpleBeam?: { changedAbility: string };
  followMe?: { redirectAttacks: boolean; priority?: number };
  guaranteeNextHit?: { active: boolean; moveType: string };
  banefulBunker?: { protection: boolean; contactEffect?: Record<string, unknown>; priority?: number };
  shedTail?: { hasSubstitute: boolean; hp: number };
  corrosiveGas?: { destroyItems: boolean; fieldEffect: boolean };
  toxicSpikes?: { layers: number; poisonOnEntry: boolean; hazardType: string };
  gastroAcid?: { suppressAbility: boolean };
  magicCoat?: { reflectStatusMoves: boolean; priority?: number };
  imprison?: { disableSharedMoves: boolean; imprisonedBy: string };
  reflect?: { teamEffect: boolean; damageReduction: number; barrierType?: string };
  allySwitch?: { switchPlaces: boolean; priority?: number };
  magicRoom?: { fieldEffect: boolean; suppressItems: boolean };
  trickRoom?: { fieldEffect: boolean; reverseSpeed: boolean };
  sacrificeHealing?: { healAmount: number; cureStatus: boolean; sacrificeUser: string };
  stockpile?: { stacks: number };
  conversion?: { newType: string };
  transform?: { targetData: unknown; active: boolean };
  healing?: number;
  preventAction?: boolean;
}

/**
 * Type-based status effect chance
 */
export interface TypeStatusChance {
  [statusType: string]: number;
}

/**
 * Repository interface for battle monster operations
 */
export interface IStatusEffectBattleMonsterRepository {
  update(id: number, data: {
    status_effects?: ActiveStatusEffect[];
    monster_data?: Record<string, unknown>;
    current_hp?: number;
  }): Promise<void>;
  dealDamage(id: number, damage: number): Promise<{ damageDealt: number }>;
  heal(id: number, amount: number): Promise<{ healAmount: number }>;
}

/**
 * Battle log interface
 */
export interface IStatusEffectBattleLog {
  logSystem(battleId: number, message: string): Promise<void>;
}

// ============================================================================
// Status Effect Metadata Definitions
// ============================================================================

/**
 * Complete status effect metadata with runtime logic
 */
export const STATUS_EFFECT_METADATA: Record<string, StatusEffectMetadata> = {
  // Primary status effects
  [PrimaryStatus.POISON]: {
    name: 'Poison',
    emoji: '☠️',
    damagePerTurn: (monster) => Math.max(1, Math.floor(monster.max_hp / 8)),
    healPerTurn: null,
    preventAction: false,
    duration: -1,
    curable: true,
  },
  [PrimaryStatus.TOXIC]: {
    name: 'Badly Poisoned',
    emoji: '☠️',
    damagePerTurn: (monster) => Math.max(1, Math.floor(monster.max_hp / 16)),
    healPerTurn: null,
    preventAction: false,
    duration: -1,
    curable: true,
  },
  [PrimaryStatus.BURN]: {
    name: 'Burn',
    emoji: '🔥',
    damagePerTurn: (monster) => Math.max(1, Math.floor(monster.max_hp / 16)),
    healPerTurn: null,
    preventAction: false,
    duration: -1,
    curable: true,
  },
  [PrimaryStatus.FREEZE]: {
    name: 'Freeze',
    emoji: '🧊',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: true,
    thawChance: 20,
    duration: 5,
    curable: true,
  },
  [PrimaryStatus.PARALYSIS]: {
    name: 'Paralysis',
    emoji: '⚡',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: true,
    actionChance: 25,
    duration: -1,
    curable: true,
  },
  [PrimaryStatus.SLEEP]: {
    name: 'Sleep',
    emoji: '😴',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: true,
    wakeChance: 33,
    duration: 3,
    curable: true,
  },

  // Volatile status effects
  [VolatileStatus.CONFUSION]: {
    name: 'Confusion',
    emoji: '😵',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    selfHarmChance: 33,
    selfHarmDamage: (monster) => Math.max(1, Math.floor(monster.max_hp / 16)),
    duration: 3,
    curable: true,
  },
  [VolatileStatus.FLINCH]: {
    name: 'Flinch',
    emoji: '😨',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: true,
    duration: 1,
    curable: false,
  },
  [VolatileStatus.LEECH_SEED]: {
    name: 'Leech Seed',
    emoji: '🌱',
    damagePerTurn: (monster) => Math.max(1, Math.floor(monster.max_hp / 8)),
    healPerTurn: null,
    preventAction: false,
    duration: 5,
    curable: true,
    healOpponent: true,
  },
  [VolatileStatus.TAUNT]: {
    name: 'Taunt',
    emoji: '🗣️',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    preventStatusMoves: true,
    duration: 3,
    curable: true,
  },
  [VolatileStatus.EMBARGO]: {
    name: 'Embargo',
    emoji: '🚫',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    preventItemUse: true,
    duration: 5,
    curable: true,
  },
  [VolatileStatus.TORMENT]: {
    name: 'Torment',
    emoji: '🔄',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    preventRepeatMove: true,
    duration: 5,
    curable: true,
  },
  [VolatileStatus.TRAPPED]: {
    name: 'Trapped',
    emoji: '🕷️',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    preventEscape: true,
    duration: 5,
    curable: true,
  },
  [VolatileStatus.INFATUATION]: {
    name: 'Infatuated',
    emoji: '💕',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: true,
    actionChance: 50,
    duration: -1,
    curable: true,
  },
  [VolatileStatus.ENCORE]: {
    name: 'Encored',
    emoji: '🎭',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    forceRepeatMove: true,
    duration: 3,
    curable: true,
  },
  [VolatileStatus.DISABLE]: {
    name: 'Disabled',
    emoji: '🚫',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    disableMove: true,
    duration: 4,
    curable: true,
  },
  [VolatileStatus.CURSE]: {
    name: 'Curse',
    emoji: '💀',
    damagePerTurn: (monster) => Math.max(1, Math.floor(monster.max_hp / 4)),
    healPerTurn: null,
    preventAction: false,
    duration: -1,
    curable: true,
  },
  [VolatileStatus.NIGHTMARE]: {
    name: 'Nightmare',
    emoji: '😱',
    damagePerTurn: (monster) => Math.max(1, Math.floor(monster.max_hp / 4)),
    healPerTurn: null,
    preventAction: false,
    onlySleeping: true,
    duration: -1,
    curable: true,
  },
  [VolatileStatus.PERISH_SONG]: {
    name: 'Perish Count',
    emoji: '☠️',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    perishCountdown: true,
    duration: 3,
    curable: false,
  },
  [VolatileStatus.DROWSY]: {
    name: 'Drowsy',
    emoji: '😪',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    delayedStatus: true,
    duration: 1,
    curable: true,
  },

  // Protection effects
  [VolatileStatus.PROTECT]: {
    name: 'Protected',
    emoji: '🛡️',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    protection: true,
    priority: 4,
    duration: 1,
    curable: false,
  },
  [VolatileStatus.DETECT]: {
    name: 'Detect',
    emoji: '👁️',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    protection: true,
    duration: 1,
    curable: false,
  },
  [VolatileStatus.ENDURE]: {
    name: 'Enduring',
    emoji: '💪',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    surviveWith1HP: true,
    priority: 4,
    duration: 1,
    curable: false,
  },
  [VolatileStatus.SILK_TRAP]: {
    name: 'Silk Trap',
    emoji: '🛡️',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    protection: true,
    contactEffect: { stat: 'speed', change: -1 },
    duration: 1,
    curable: false,
  },
  [VolatileStatus.OBSTRUCT]: {
    name: 'Obstruct',
    emoji: '🚧',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    protection: true,
    contactEffect: { stat: 'defense', change: -2 },
    duration: 1,
    curable: false,
  },
  [VolatileStatus.BURNING_BULWARK]: {
    name: 'Burning Bulwark',
    emoji: '🔥',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    protection: true,
    contactEffect: { statusEffect: 'burn', duration: 4 },
    duration: 1,
    curable: false,
  },
  [VolatileStatus.SPIKY_SHIELD]: {
    name: 'Spiky Shield',
    emoji: '🌿',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    protection: true,
    contactDamage: (attacker) => Math.floor(attacker.max_hp / 8),
    duration: 1,
    curable: false,
  },
  [VolatileStatus.BANEFUL_BUNKER]: {
    name: 'Baneful Bunker',
    emoji: '☠️',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    protection: true,
    contactEffect: { statusEffect: 'poison', duration: 4 },
    priority: 4,
    duration: 1,
    curable: false,
  },
  [VolatileStatus.MAX_GUARD]: {
    name: 'Max Guard',
    emoji: '🛡️',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    protection: true,
    duration: 1,
    curable: false,
  },
  [VolatileStatus.CRAFTY_SHIELD]: {
    name: 'Crafty Shield',
    emoji: '🛡️',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    teamEffect: true,
    duration: 1,
    curable: false,
  },
  [VolatileStatus.QUICK_GUARD]: {
    name: 'Quick Guard',
    emoji: '🛡️',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    teamEffect: true,
    duration: 1,
    curable: false,
  },
  [VolatileStatus.WIDE_GUARD]: {
    name: 'Wide Guard',
    emoji: '🛡️',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    teamEffect: true,
    duration: 1,
    curable: false,
  },
  [VolatileStatus.MAT_BLOCK]: {
    name: 'Mat Block',
    emoji: '🥋',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    teamEffect: true,
    duration: 1,
    curable: false,
  },

  // Trapping effects
  [VolatileStatus.SNATCH]: {
    name: 'Snatch',
    emoji: '👺',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    stealStatusMoves: true,
    duration: 1,
    curable: false,
  },
  [VolatileStatus.QUASH]: {
    name: 'Quash',
    emoji: '⏬',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    moveLast: true,
    duration: 1,
    curable: false,
  },
  [VolatileStatus.RAGE_POWDER]: {
    name: 'Rage Powder',
    emoji: '💥',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    redirectAttacks: true,
    duration: 1,
    curable: false,
  },
  [VolatileStatus.POWDER]: {
    name: 'Powder',
    emoji: '💨',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    fireTypePunishment: true,
    duration: 1,
    curable: false,
  },
  [VolatileStatus.OCTOLOCK]: {
    name: 'Octolock',
    emoji: '🐙',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    trapped: true,
    statDebuffPerTurn: { defense: -1, special_defense: -1 },
    duration: 5,
    curable: true,
  },
  [VolatileStatus.BLOCK]: {
    name: 'Blocked',
    emoji: '🚫',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    preventEscape: true,
    duration: -1,
    curable: false,
  },
  [VolatileStatus.MEAN_LOOK]: {
    name: 'Trapped',
    emoji: '👁️',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    preventEscape: true,
    duration: -1,
    curable: false,
  },
  [VolatileStatus.FAIRY_LOCK]: {
    name: 'Fairy Lock',
    emoji: '🔒',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    fieldEffect: true,
    duration: 1,
    curable: false,
  },
  [VolatileStatus.INGRAIN]: {
    name: 'Ingrain',
    emoji: '🌱',
    damagePerTurn: null,
    healPerTurn: (monster) => Math.floor(monster.max_hp / 16),
    preventAction: false,
    trapped: true,
    duration: -1,
    curable: true,
  },

  // Stat/ability modifiers
  [VolatileStatus.DRAGON_CHEER]: {
    name: 'Dragon Cheer',
    emoji: '🐉',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    criticalBoost: true,
    duration: 5,
    curable: true,
  },
  [VolatileStatus.CHARGE]: {
    name: 'Charge',
    emoji: '⚡',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    chargeNext: true,
    duration: 1,
    curable: false,
  },
  [VolatileStatus.ELECTRIFY]: {
    name: 'Electrify',
    emoji: '🔌',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    changeNextMoveType: 'Electric',
    duration: 1,
    curable: false,
  },
  [VolatileStatus.MAGNET_RISE]: {
    name: 'Magnet Rise',
    emoji: '🧲',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    levitate: true,
    immuneToGround: true,
    duration: 5,
    curable: true,
  },
  [VolatileStatus.FOCUS_ENERGY]: {
    name: 'Focused',
    emoji: '🎯',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    criticalBoost: true,
    duration: 5,
    curable: true,
  },
  [VolatileStatus.LASER_FOCUS]: {
    name: 'Laser Focus',
    emoji: '🎯',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    guaranteeCritical: true,
    duration: 1,
    curable: false,
  },
  [VolatileStatus.LUCKY_CHANT]: {
    name: 'Lucky Chant',
    emoji: '🍀',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    teamEffect: true,
    duration: 5,
    curable: false,
  },
  [VolatileStatus.MIST]: {
    name: 'Mist',
    emoji: '🌫️',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    teamEffect: true,
    preventStatReduction: true,
    duration: 5,
    curable: false,
  },
  [VolatileStatus.SAFEGUARD]: {
    name: 'Safeguard',
    emoji: '🛡️',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    teamEffect: true,
    preventStatusConditions: true,
    duration: 5,
    curable: false,
  },
  [VolatileStatus.TAILWIND]: {
    name: 'Tailwind',
    emoji: '💨',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    teamEffect: true,
    duration: 4,
    curable: false,
  },
  [VolatileStatus.ROOST]: {
    name: 'Roost',
    emoji: '🪶',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    duration: 1,
    curable: false,
  },

  // Type-changing effects
  [VolatileStatus.TRICK_OR_TREAT]: {
    name: 'Trick-or-Treat',
    emoji: '🎃',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    addGhostType: true,
    duration: -1,
    curable: false,
  },
  [VolatileStatus.FORESTS_CURSE]: {
    name: "Forest's Curse",
    emoji: '🌳',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    addGrassType: true,
    duration: -1,
    curable: false,
  },
  [VolatileStatus.CAMOUFLAGE]: {
    name: 'Camouflage',
    emoji: '🦎',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    typeChange: true,
    duration: -1,
    curable: false,
  },
  [VolatileStatus.CONVERSION]: {
    name: 'Converted',
    emoji: '🔄',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    typeChange: true,
    duration: -1,
    curable: false,
  },
  [VolatileStatus.REFLECT_TYPE]: {
    name: 'Reflect Type',
    emoji: '🪞',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    typeChange: true,
    duration: -1,
    curable: false,
  },

  // Special mechanics
  [VolatileStatus.GRUDGE]: {
    name: 'Grudge',
    emoji: '👻',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    zeroLastMovePP: true,
    duration: 1,
    curable: false,
  },
  [VolatileStatus.DESTINY_BOND]: {
    name: 'Destiny Bond',
    emoji: '⚰️',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    faintTogether: true,
    duration: 1,
    curable: false,
  },
  [VolatileStatus.SUBSTITUTE]: {
    name: 'Substitute',
    emoji: '🎭',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    hasSubstitute: true,
    duration: -1,
    curable: false,
  },
  [VolatileStatus.TRANSFORM]: {
    name: 'Transformed',
    emoji: '🪄',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    duration: -1,
    curable: false,
  },
  [VolatileStatus.SPOTLIGHT]: {
    name: 'Spotlighted',
    emoji: '🎯',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    forceTarget: true,
    priority: 3,
    duration: 1,
    curable: false,
  },
  [VolatileStatus.FOLLOW_ME]: {
    name: 'Follow Me',
    emoji: '🎯',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    redirectAttacks: true,
    priority: 2,
    duration: 1,
    curable: false,
  },
  [VolatileStatus.WHIRLWIND]: {
    name: 'Whirlwind',
    emoji: '🌪️',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    forceSwitch: true,
    duration: 1,
    curable: false,
  },
  [VolatileStatus.ROAR]: {
    name: 'Blown Away',
    emoji: '💨',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    forceSwitch: true,
    priority: -6,
    duration: 1,
    curable: false,
  },
  [VolatileStatus.AFTER_YOU]: {
    name: 'Boosted Priority',
    emoji: '⚡',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    duration: 1,
    curable: false,
  },
  [VolatileStatus.LOCK_ON]: {
    name: 'Lock-On',
    emoji: '🎯',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    guaranteeNextHit: true,
    duration: 1,
    curable: false,
  },
  [VolatileStatus.MIND_READER]: {
    name: 'Mind Reader',
    emoji: '👁️',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    guaranteeNextHit: true,
    duration: 1,
    curable: false,
  },
  [VolatileStatus.FORESIGHT]: {
    name: 'Identified',
    emoji: '👁️',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    duration: -1,
    curable: false,
  },
  [VolatileStatus.MIRACLE_EYE]: {
    name: 'Miracle Eye',
    emoji: '👁️',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    duration: -1,
    curable: false,
  },
  [VolatileStatus.HELPING_HAND]: {
    name: 'Helping Hand',
    emoji: '🤝',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    duration: 1,
    curable: false,
  },
  [VolatileStatus.WISH]: {
    name: 'Wish',
    emoji: '🌟',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    delayedHealing: true,
    duration: 2,
    curable: false,
  },
  [VolatileStatus.STOCKPILE]: {
    name: 'Stockpile',
    emoji: '📦',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    stackable: true,
    maxStacks: 3,
    duration: -1,
    curable: false,
  },
  [VolatileStatus.HEAL_BLOCK]: {
    name: 'Heal Block',
    emoji: '🚫',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    duration: 5,
    curable: true,
  },
  [VolatileStatus.INSTRUCT]: {
    name: 'Instructed',
    emoji: '📢',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    forceRepeatMove: true,
    duration: 1,
    curable: false,
  },
  [VolatileStatus.TELEKINESIS]: {
    name: 'Telekinesis',
    emoji: '🌀',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    levitate: true,
    duration: 3,
    curable: true,
  },
  [VolatileStatus.GASTRO_ACID]: {
    name: 'Gastro Acid',
    emoji: '🧪',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    suppressAbility: true,
    duration: -1,
    curable: false,
  },
  [VolatileStatus.WORRY_SEED]: {
    name: 'Worry Seed',
    emoji: '😟',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    changeAbility: 'Insomnia',
    duration: -1,
    curable: false,
  },
  [VolatileStatus.SIMPLE_BEAM]: {
    name: 'Simple Beam',
    emoji: '✨',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    changeAbility: 'Simple',
    duration: -1,
    curable: false,
  },
  [VolatileStatus.ROLE_PLAY]: {
    name: 'Role Play',
    emoji: '🎭',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    duration: -1,
    curable: false,
  },
  [VolatileStatus.IMPRISON]: {
    name: 'Imprisoned',
    emoji: '🚫',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    disableSharedMoves: true,
    duration: -1,
    curable: false,
  },
  [VolatileStatus.MAGIC_COAT]: {
    name: 'Magic Coat',
    emoji: '✨',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    reflectStatusMoves: true,
    priority: 4,
    duration: 1,
    curable: false,
  },
  [VolatileStatus.SHED_TAIL]: {
    name: 'Shed Tail',
    emoji: '🎭',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    hasSubstitute: true,
    forceSwitch: true,
    duration: -1,
    curable: false,
  },
  [VolatileStatus.ALLY_SWITCH]: {
    name: 'Ally Switch',
    emoji: '🔄',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    priority: 2,
    duration: 1,
    curable: false,
  },

  // Team barriers
  [VolatileStatus.REFLECT]: {
    name: 'Reflect',
    emoji: '🛡️',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    teamEffect: true,
    damageReduction: 0.5,
    barrierType: 'physical',
    duration: 5,
    curable: false,
  },
  [VolatileStatus.LIGHT_SCREEN]: {
    name: 'Light Screen',
    emoji: '🛡️',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    teamEffect: true,
    damageReduction: 0.5,
    barrierType: 'special',
    duration: 5,
    curable: false,
  },
  [VolatileStatus.AURORA_VEIL]: {
    name: 'Aurora Veil',
    emoji: '🌈',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    teamEffect: true,
    damageReduction: 0.5,
    barrierType: 'both',
    duration: 5,
    curable: false,
  },

  // Weather effects (as individual monster statuses)
  [VolatileStatus.SUNNY_DAY]: {
    name: 'Sunny Day',
    emoji: '☀️',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    fieldEffect: true,
    weather: 'sunny',
    boostFireMoves: 1.5,
    weakenWaterMoves: 0.5,
    duration: 5,
    curable: false,
  },
  [VolatileStatus.HAIL]: {
    name: 'Hail',
    emoji: '🧊',
    damagePerTurn: (monster) => {
      const isIce =
        monster.monster_data?.type1 === 'Ice' || monster.monster_data?.type2 === 'Ice';
      return isIce ? 0 : Math.max(1, Math.floor(monster.max_hp / 16));
    },
    healPerTurn: null,
    preventAction: false,
    fieldEffect: true,
    weather: 'hail',
    duration: 5,
    curable: false,
  },
  [VolatileStatus.SNOW]: {
    name: 'Snow',
    emoji: '❄️',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    fieldEffect: true,
    weather: 'snow',
    boostIceDefense: 1.5,
    duration: 5,
    curable: false,
  },
  [VolatileStatus.SANDSTORM]: {
    name: 'Sandstorm',
    emoji: '🌪️',
    damagePerTurn: (monster) => {
      const immuneTypes = ['Rock', 'Ground', 'Steel'];
      const type1 = monster.monster_data?.type1 ?? '';
      const type2 = monster.monster_data?.type2 ?? '';
      const isImmune = immuneTypes.includes(type1) || immuneTypes.includes(type2);
      return isImmune ? 0 : Math.max(1, Math.floor(monster.max_hp / 16));
    },
    healPerTurn: null,
    preventAction: false,
    fieldEffect: true,
    weather: 'sandstorm',
    duration: 5,
    curable: false,
  },
  [VolatileStatus.CHILLY_RECEPTION]: {
    name: 'Chilly Reception',
    emoji: '❄️',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    fieldEffect: true,
    weather: 'snow',
    duration: 5,
    curable: false,
  },

  // Terrain effects
  [VolatileStatus.ELECTRIC_TERRAIN]: {
    name: 'Electric Terrain',
    emoji: '⚡',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    fieldEffect: true,
    boostElectricMoves: 1.3,
    preventSleep: true,
    duration: 5,
    curable: false,
  },
  [VolatileStatus.GRASSY_TERRAIN]: {
    name: 'Grassy Terrain',
    emoji: '🌱',
    damagePerTurn: null,
    healPerTurn: (monster) => Math.floor(monster.max_hp / 16),
    preventAction: false,
    fieldEffect: true,
    boostGrassMoves: 1.3,
    duration: 5,
    curable: false,
  },
  [VolatileStatus.MISTY_TERRAIN]: {
    name: 'Misty Terrain',
    emoji: '🌫️',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    fieldEffect: true,
    halveDragonMoves: 0.5,
    preventStatusConditions: true,
    duration: 5,
    curable: false,
  },
  [VolatileStatus.PSYCHIC_TERRAIN]: {
    name: 'Psychic Terrain',
    emoji: '🔮',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    fieldEffect: true,
    duration: 5,
    curable: false,
  },

  // Room effects
  [VolatileStatus.MAGIC_ROOM]: {
    name: 'Magic Room',
    emoji: '✨',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    fieldEffect: true,
    suppressItems: true,
    duration: 5,
    curable: false,
  },
  [VolatileStatus.TRICK_ROOM]: {
    name: 'Trick Room',
    emoji: '🔄',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    fieldEffect: true,
    reverseSpeed: true,
    duration: 5,
    curable: false,
  },
  [VolatileStatus.WONDER_ROOM]: {
    name: 'Wonder Room',
    emoji: '🔮',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    fieldEffect: true,
    swapDefenses: true,
    duration: 5,
    curable: false,
  },

  // Field/hazard effects
  [VolatileStatus.HAPPY_HOUR]: {
    name: 'Happy Hour',
    emoji: '💰',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    fieldEffect: true,
    duration: -1,
    curable: false,
  },
  [VolatileStatus.ION_DELUGE]: {
    name: 'Ion Deluge',
    emoji: '⚡',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    fieldEffect: true,
    duration: 1,
    curable: false,
  },
  [VolatileStatus.MUD_SPORT]: {
    name: 'Mud Sport',
    emoji: '🟫',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    fieldEffect: true,
    weakenElectricMoves: 0.33,
    duration: 5,
    curable: false,
  },
  [VolatileStatus.CORROSIVE_GAS]: {
    name: 'Corrosive Gas',
    emoji: '🌪️',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    fieldEffect: true,
    duration: 1,
    curable: false,
  },
  [VolatileStatus.GRAVITY]: {
    name: 'Gravity',
    emoji: '🌍',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    fieldEffect: true,
    groundsFlying: true,
    accuracyMultiplier: 1.67,
    duration: 5,
    curable: false,
  },
  [VolatileStatus.FIRE_WEAKNESS]: {
    name: 'Fire Weakness',
    emoji: '🔥',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    duration: -1,
    curable: false,
  },

  // Entry hazards
  [VolatileStatus.SPIKES]: {
    name: 'Spikes',
    emoji: '📍',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    fieldEffect: true,
    entryHazard: true,
    damageOnEntry: (monster, layers) => Math.floor(monster.max_hp * 0.125 * layers),
    maxLayers: 3,
    duration: -1,
    curable: false,
  },
  [VolatileStatus.STEALTH_ROCK]: {
    name: 'Stealth Rock',
    emoji: '🪨',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    entryHazard: true,
    hazardType: 'stealth_rock',
    duration: -1,
    curable: false,
  },
  [VolatileStatus.TOXIC_SPIKES]: {
    name: 'Toxic Spikes',
    emoji: '☠️',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    fieldEffect: true,
    entryHazard: true,
    poisonOnEntry: true,
    stackable: true,
    maxLayers: 2,
    duration: -1,
    curable: false,
  },

  // Sacrifice effects
  [VolatileStatus.SACRIFICE_HEAL]: {
    name: 'Sacrifice Heal',
    emoji: '🌙',
    damagePerTurn: null,
    healPerTurn: null,
    preventAction: false,
    duration: 1,
    curable: false,
  },
};

// ============================================================================
// Type-based Status Effect Chances
// ============================================================================

export const TYPE_STATUS_CHANCES: Record<string, TypeStatusChance> = {
  Fire: { burn: 10 },
  Poison: { poison: 10 },
  Ice: { freeze: 10 },
  Electric: { paralysis: 10 },
  Psychic: { confusion: 10 },
  Ghost: { confusion: 10 },
};

// ============================================================================
// StatusEffectService Class
// ============================================================================

export class StatusEffectService {
  constructor(
    private battleMonsterRepository: IStatusEffectBattleMonsterRepository,
    private battleLog: IStatusEffectBattleLog
  ) {}

  /**
   * Get status effect metadata
   */
  getStatusEffectMetadata(effectType: string): StatusEffectMetadata | null {
    return STATUS_EFFECT_METADATA[effectType] ?? null;
  }

  /**
   * Apply a status effect to a monster
   */
  async applyStatusEffect(
    battleId: number,
    monster: StatusEffectMonster,
    effectType: string,
    duration?: number,
    effectData?: Record<string, unknown>
  ): Promise<StatusEffectApplicationResult> {
    const metadata = this.getStatusEffectMetadata(effectType);

    if (!metadata) {
      console.warn(`Unknown status effect: ${effectType}. Skipping application.`);
      return {
        success: false,
        message: `Unknown status effect: ${effectType}`,
        effectType,
        duration: 0,
      };
    }

    // Check if this is a primary status and monster already has one
    if (isPrimaryStatus(effectType as StatusEffectValue)) {
      const existingPrimary = monster.status_effects?.find((e) =>
        PRIMARY_STATUSES.includes(e.type as PrimaryStatusValue)
      );
      if (existingPrimary) {
        return {
          success: false,
          message: `${monster.name} already has a status condition!`,
          effectType,
          duration: 0,
        };
      }
    }

    const currentEffects = monster.status_effects ?? [];
    const existingEffect = currentEffects.find((effect) => effect.type === effectType);
    const effectDuration = duration ?? metadata.duration;

    if (existingEffect) {
      // Refresh duration if effect already exists
      existingEffect.duration = effectDuration;
      existingEffect.applied_at = new Date().toISOString();
      if (effectData) {
        existingEffect.data = { ...existingEffect.data, ...effectData };
      }
    } else {
      // Add new status effect
      const newEffect: ActiveStatusEffect = {
        type: effectType,
        duration: effectDuration,
        applied_at: new Date().toISOString(),
        data: effectData,
      };
      currentEffects.push(newEffect);
    }

    // Update monster with new status effects
    await this.battleMonsterRepository.update(monster.id, {
      status_effects: currentEffects,
    });

    // Create and log message
    const monsterName = monster.name ?? 'Monster';
    const message = `${metadata.emoji} **${monsterName}** was afflicted with **${metadata.name}**!`;
    await this.battleLog.logSystem(battleId, message);

    return {
      success: true,
      message,
      effectType,
      duration: effectDuration,
    };
  }

  /**
   * Process status effects at the start of a monster's turn
   */
  async processStatusEffects(
    battleId: number,
    monster: StatusEffectMonster
  ): Promise<StatusEffectProcessingResult> {
    const results: StatusEffectProcessingResult = {
      canAct: true,
      damageDealt: 0,
      healingDone: 0,
      messages: [],
      effectsRemoved: [],
    };

    if (!monster.status_effects || monster.status_effects.length === 0) {
      return results;
    }

    const monsterName = monster.name ?? 'Monster';
    const updatedEffects: ActiveStatusEffect[] = [];

    for (const effect of monster.status_effects) {
      const metadata = this.getStatusEffectMetadata(effect.type);
      if (!metadata) {
        continue;
      }

      let shouldRemove = false;
      const effectResult = await this.processIndividualEffect(
        battleId,
        monster,
        effect,
        metadata,
        monsterName,
        results
      );

      shouldRemove = effectResult.shouldRemove;

      // Decrease duration (skip if permanent: -1)
      if (effect.duration > 0) {
        effect.duration--;
      }

      if (effect.duration === 0 || shouldRemove) {
        results.effectsRemoved.push(effect.type);
        if (!shouldRemove && effect.duration === 0) {
          const fadeMessage = `✨ **${monsterName}**'s ${metadata.name.toLowerCase()} wore off!`;
          results.messages.push(fadeMessage);
        }
      } else {
        updatedEffects.push(effect);
      }
    }

    // Update monster with remaining effects
    await this.battleMonsterRepository.update(monster.id, {
      status_effects: updatedEffects,
    });

    // Log all messages
    if (results.messages.length > 0) {
      await this.battleLog.logSystem(battleId, results.messages.join('\n'));
    }

    return results;
  }

  /**
   * Process an individual status effect
   */
  private async processIndividualEffect(
    battleId: number,
    monster: StatusEffectMonster,
    effect: ActiveStatusEffect,
    metadata: StatusEffectMetadata,
    monsterName: string,
    results: StatusEffectProcessingResult
  ): Promise<{ shouldRemove: boolean }> {
    let shouldRemove = false;

    switch (effect.type) {
      case PrimaryStatus.POISON:
      case PrimaryStatus.TOXIC:
      case PrimaryStatus.BURN: {
        if (metadata.damagePerTurn) {
          const damage = metadata.damagePerTurn(monster);
          if (damage > 0) {
            await this.battleMonsterRepository.dealDamage(monster.id, damage);
            results.damageDealt += damage;
            const msg = `${metadata.emoji} **${monsterName}** is hurt by ${metadata.name.toLowerCase()}! (-${damage} HP)`;
            results.messages.push(msg);
          }
        }
        break;
      }

      case PrimaryStatus.FREEZE: {
        if (metadata.thawChance && Math.random() * 100 < metadata.thawChance) {
          shouldRemove = true;
          results.messages.push(`🌡️ **${monsterName}** thawed out!`);
        } else {
          results.canAct = false;
          results.messages.push(
            `${metadata.emoji} **${monsterName}** is frozen solid and cannot act!`
          );
        }
        break;
      }

      case PrimaryStatus.PARALYSIS: {
        if (metadata.actionChance && Math.random() * 100 < metadata.actionChance) {
          results.canAct = false;
          results.messages.push(
            `${metadata.emoji} **${monsterName}** is paralyzed and cannot act!`
          );
        }
        break;
      }

      case PrimaryStatus.SLEEP: {
        if (metadata.wakeChance && Math.random() * 100 < metadata.wakeChance) {
          shouldRemove = true;
          results.messages.push(`😊 **${monsterName}** woke up!`);
        } else {
          results.canAct = false;
          results.messages.push(
            `${metadata.emoji} **${monsterName}** is fast asleep and cannot act!`
          );
        }
        break;
      }

      case VolatileStatus.CONFUSION: {
        if (metadata.selfHarmChance && Math.random() * 100 < metadata.selfHarmChance) {
          const damage = metadata.selfHarmDamage?.(monster) ?? 0;
          if (damage > 0) {
            await this.battleMonsterRepository.dealDamage(monster.id, damage);
            results.damageDealt += damage;
            results.messages.push(
              `${metadata.emoji} **${monsterName}** hurt itself in confusion! (-${damage} HP)`
            );
          }
        }
        break;
      }

      case VolatileStatus.FLINCH: {
        results.canAct = false;
        results.messages.push(`${metadata.emoji} **${monsterName}** flinched!`);
        shouldRemove = true;
        break;
      }

      case VolatileStatus.LEECH_SEED: {
        if (metadata.damagePerTurn) {
          const damage = metadata.damagePerTurn(monster);
          if (damage > 0) {
            await this.battleMonsterRepository.dealDamage(monster.id, damage);
            results.damageDealt += damage;
            results.messages.push(
              `${metadata.emoji} **${monsterName}** is hurt by Leech Seed! (-${damage} HP)`
            );
          }
        }
        break;
      }

      case VolatileStatus.CURSE: {
        if (metadata.damagePerTurn) {
          const damage = metadata.damagePerTurn(monster);
          if (damage > 0) {
            await this.battleMonsterRepository.dealDamage(monster.id, damage);
            results.damageDealt += damage;
            results.messages.push(
              `${metadata.emoji} **${monsterName}** is hurt by the curse! (-${damage} HP)`
            );
          }
        }
        break;
      }

      case VolatileStatus.NIGHTMARE: {
        const isSleeping = this.hasStatusEffect(monster, PrimaryStatus.SLEEP);
        if (isSleeping && metadata.damagePerTurn) {
          const damage = metadata.damagePerTurn(monster);
          if (damage > 0) {
            await this.battleMonsterRepository.dealDamage(monster.id, damage);
            results.damageDealt += damage;
            results.messages.push(
              `${metadata.emoji} **${monsterName}** is tormented by nightmares! (-${damage} HP)`
            );
          }
        } else if (!isSleeping) {
          shouldRemove = true;
        }
        break;
      }

      case VolatileStatus.INFATUATION: {
        if (Math.random() < 0.5) {
          results.canAct = false;
          results.preventAction = true;
          results.messages.push(`💕 **${monsterName}** is immobilized by love!`);
        }
        break;
      }

      case VolatileStatus.INGRAIN: {
        if (metadata.healPerTurn) {
          const healAmount = metadata.healPerTurn(monster);
          if (healAmount > 0) {
            const healResult = await this.battleMonsterRepository.heal(monster.id, healAmount);
            results.healingDone += healResult.healAmount;
            results.messages.push(
              `${metadata.emoji} **${monsterName}** recovered ${healResult.healAmount} HP from its roots!`
            );
          }
        }
        results.ingrainTrapped = true;
        break;
      }

      case VolatileStatus.GRASSY_TERRAIN: {
        if (metadata.healPerTurn) {
          const healAmount = metadata.healPerTurn(monster);
          if (healAmount > 0) {
            const healResult = await this.battleMonsterRepository.heal(monster.id, healAmount);
            results.healingDone += healResult.healAmount;
            results.messages.push(
              `${metadata.emoji} **${monsterName}** recovered ${healResult.healAmount} HP from Grassy Terrain!`
            );
          }
        }
        results.grassyTerrain = true;
        break;
      }

      case VolatileStatus.OCTOLOCK: {
        if (metadata.statDebuffPerTurn) {
          const statMods = monster.stat_modifications ?? {};
          for (const [stat, change] of Object.entries(metadata.statDebuffPerTurn)) {
            statMods[stat] ??= 0;
            statMods[stat] = Math.max(-6, Math.min(6, statMods[stat] + change));
          }
          await this.battleMonsterRepository.update(monster.id, {
            monster_data: {
              ...monster.monster_data,
              stat_modifications: statMods,
            },
          });
          results.messages.push(
            `🐙 **${monsterName}** is squeezed by Octolock! Defense and Special Defense fell!`
          );
        }
        results.octolockTrap = true;
        break;
      }

      case VolatileStatus.PERISH_SONG: {
        if (effect.duration === 0) {
          await this.battleMonsterRepository.update(monster.id, { current_hp: 0 });
          results.messages.push(`☠️ **${monsterName}** fainted from Perish Song!`);
        } else {
          results.messages.push(
            `☠️ **${monsterName}** has ${effect.duration} turn${effect.duration !== 1 ? 's' : ''} left before fainting!`
          );
        }
        results.perishSong = { countdown: effect.duration };
        break;
      }

      case VolatileStatus.WISH: {
        if (effect.duration === 0) {
          const healAmount =
            (effect.data?.healAmount as number) ?? Math.floor(monster.max_hp * 0.5);
          const healResult = await this.battleMonsterRepository.heal(monster.id, healAmount);
          results.healingDone += healResult.healAmount;
          const wishUser = (effect.data?.wishUser as string) ?? 'Someone';
          results.messages.push(
            `💫 ${wishUser}'s wish came true! ${monsterName} recovered ${healResult.healAmount} HP!`
          );
        }
        break;
      }

      case VolatileStatus.DROWSY: {
        if (effect.duration === 0) {
          await this.applyStatusEffect(battleId, monster, PrimaryStatus.SLEEP, 3);
          results.messages.push(`😴 **${monsterName}** fell asleep from drowsiness!`);
        }
        break;
      }

      case VolatileStatus.HAIL:
      case VolatileStatus.SANDSTORM: {
        if (metadata.damagePerTurn) {
          const damage = metadata.damagePerTurn(monster);
          if (damage > 0) {
            await this.battleMonsterRepository.dealDamage(monster.id, damage);
            results.damageDealt += damage;
            const weatherName = effect.type === VolatileStatus.HAIL ? 'hail' : 'sandstorm';
            results.messages.push(
              `${metadata.emoji} **${monsterName}** is buffeted by the ${weatherName}! (-${damage} HP)`
            );
          }
        }
        break;
      }

      // Set flags for battle logic to handle
      case VolatileStatus.TAUNT:
        results.preventStatusMoves = true;
        break;
      case VolatileStatus.EMBARGO:
        results.preventItemUse = true;
        break;
      case VolatileStatus.TORMENT:
        results.preventRepeatMove = true;
        break;
      case VolatileStatus.SNATCH:
        results.snatchActive = true;
        break;
      case VolatileStatus.QUASH:
        results.moveLast = true;
        break;
      case VolatileStatus.RAGE_POWDER:
      case VolatileStatus.FOLLOW_ME:
        results.redirectTarget = true;
        break;
      case VolatileStatus.TRAPPED:
      case VolatileStatus.BLOCK:
      case VolatileStatus.MEAN_LOOK:
        results.preventEscape = true;
        break;
      case VolatileStatus.POWDER:
        results.firePunishment = true;
        break;
      case VolatileStatus.SILK_TRAP:
      case VolatileStatus.OBSTRUCT:
      case VolatileStatus.DETECT:
      case VolatileStatus.PROTECT:
      case VolatileStatus.BURNING_BULWARK:
      case VolatileStatus.SPIKY_SHIELD:
      case VolatileStatus.BANEFUL_BUNKER:
        results.protection = effect.type;
        break;
      case VolatileStatus.DRAGON_CHEER:
      case VolatileStatus.FOCUS_ENERGY:
        results.criticalBoost = true;
        break;
      case VolatileStatus.CHARGE:
        results.chargeActive = true;
        break;
      case VolatileStatus.ELECTRIFY:
        results.electrifyActive = true;
        break;
      case VolatileStatus.ION_DELUGE:
        results.ionDelugeActive = true;
        break;
      case VolatileStatus.MAGNET_RISE:
      case VolatileStatus.TELEKINESIS:
        results.levitating = true;
        break;
      case VolatileStatus.ELECTRIC_TERRAIN:
        results.electricTerrain = true;
        break;
      case VolatileStatus.MISTY_TERRAIN:
        results.mistyTerrain = true;
        break;
      case VolatileStatus.PSYCHIC_TERRAIN:
        results.psychicTerrain = true;
        break;
      case VolatileStatus.CRAFTY_SHIELD:
        results.craftyShield = true;
        break;
      case VolatileStatus.FAIRY_LOCK:
        results.fairyLock = true;
        break;
      case VolatileStatus.QUICK_GUARD:
        results.quickGuard = true;
        break;
      case VolatileStatus.MAT_BLOCK:
        results.matBlock = true;
        break;
      case VolatileStatus.SUNNY_DAY:
        results.sunnyWeather = true;
        break;
      case VolatileStatus.TAILWIND:
        results.tailwindActive = true;
        break;
      case VolatileStatus.ROOST:
        results.lostFlying = true;
        break;
      case VolatileStatus.GRUDGE:
        results.grudgeActive = true;
        break;
      case VolatileStatus.TRICK_OR_TREAT:
        results.addedGhostType = true;
        break;
      case VolatileStatus.FORESTS_CURSE:
        results.addedGrassType = true;
        break;
      case VolatileStatus.DESTINY_BOND:
        results.destinyBondActive = true;
        break;
      case VolatileStatus.MIST:
        results.mistProtection = true;
        break;
      case VolatileStatus.AURORA_VEIL:
        results.auroraVeil = true;
        break;
      case VolatileStatus.LUCKY_CHANT:
        results.luckyChant = true;
        break;
      case VolatileStatus.LASER_FOCUS:
        results.laserFocus = true;
        break;
      case VolatileStatus.HAPPY_HOUR:
        results.happyHour = true;
        break;
      case VolatileStatus.MAX_GUARD:
        results.maxGuard = true;
        break;
      case VolatileStatus.MUD_SPORT:
        results.mudSport = true;
        break;
      case VolatileStatus.SNOW:
      case VolatileStatus.CHILLY_RECEPTION:
        results.snowWeather = true;
        break;
      case VolatileStatus.TRICK_ROOM:
        results.trickRoom = { fieldEffect: true, reverseSpeed: true };
        break;
      case VolatileStatus.MAGIC_ROOM:
        results.magicRoom = { fieldEffect: true, suppressItems: true };
        break;
      case VolatileStatus.WONDER_ROOM:
        // Handled elsewhere
        break;
      case VolatileStatus.GRAVITY:
        // Handled elsewhere
        break;
    }

    return { shouldRemove };
  }

  /**
   * Cure a specific status effect
   */
  async cureStatusEffect(
    battleId: number,
    monster: StatusEffectMonster,
    effectType: string
  ): Promise<{ success: boolean; message: string }> {
    if (!monster.status_effects || monster.status_effects.length === 0) {
      return { success: false, message: 'No status effects to cure' };
    }

    const currentEffects = monster.status_effects.filter((effect) => effect.type !== effectType);
    const wasCured = currentEffects.length < monster.status_effects.length;

    if (wasCured) {
      await this.battleMonsterRepository.update(monster.id, {
        status_effects: currentEffects,
      });

      const metadata = this.getStatusEffectMetadata(effectType);
      const monsterName = monster.name ?? 'Monster';
      const message = `💊 **${monsterName}**'s ${metadata?.name ?? effectType} was cured!`;

      await this.battleLog.logSystem(battleId, message);

      return { success: true, message };
    }

    return { success: false, message: 'Status effect not found' };
  }

  /**
   * Cure all status effects
   */
  async cureAllStatusEffects(
    battleId: number,
    monster: StatusEffectMonster
  ): Promise<{ success: boolean; message: string }> {
    if (!monster.status_effects || monster.status_effects.length === 0) {
      return { success: false, message: 'No status effects to cure' };
    }

    await this.battleMonsterRepository.update(monster.id, { status_effects: [] });

    const monsterName = monster.name ?? 'Monster';
    const message = `✨ **${monsterName}** was cured of all status conditions!`;

    await this.battleLog.logSystem(battleId, message);

    return { success: true, message };
  }

  /**
   * Remove a specific status effect without logging (silent removal)
   */
  async removeStatusEffect(
    monster: StatusEffectMonster,
    effectType: string
  ): Promise<void> {
    if (!monster.status_effects) {
      return;
    }

    const currentEffects = monster.status_effects.filter((effect) => effect.type !== effectType);
    await this.battleMonsterRepository.update(monster.id, {
      status_effects: currentEffects,
    });
  }

  /**
   * Check if monster has a specific status effect
   */
  hasStatusEffect(monster: StatusEffectMonster, effectType: string): ActiveStatusEffect | null {
    if (!monster.status_effects || monster.status_effects.length === 0) {
      return null;
    }
    return monster.status_effects.find((effect) => effect.type === effectType) ?? null;
  }

  /**
   * Check if monster has any primary status
   */
  hasPrimaryStatus(monster: StatusEffectMonster): ActiveStatusEffect | null {
    if (!monster.status_effects || monster.status_effects.length === 0) {
      return null;
    }
    return (
      monster.status_effects.find((effect) =>
        PRIMARY_STATUSES.includes(effect.type as PrimaryStatusValue)
      ) ?? null
    );
  }

  /**
   * Check if monster can use status moves (not taunted)
   */
  canUseStatusMoves(monster: StatusEffectMonster): boolean {
    return !this.hasStatusEffect(monster, VolatileStatus.TAUNT);
  }

  /**
   * Check if monster can use items (not embargoed)
   */
  canUseItems(monster: StatusEffectMonster): boolean {
    return !this.hasStatusEffect(monster, VolatileStatus.EMBARGO);
  }

  /**
   * Check if monster can repeat last move (not tormented)
   */
  canRepeatMove(
    monster: StatusEffectMonster,
    lastMove: string,
    currentMove: string
  ): boolean {
    if (!this.hasStatusEffect(monster, VolatileStatus.TORMENT)) {
      return true;
    }
    return lastMove !== currentMove;
  }

  /**
   * Check if monster has any protection effect
   */
  hasProtection(monster: StatusEffectMonster): ActiveStatusEffect | null {
    const protectionEffects = [
      VolatileStatus.SILK_TRAP,
      VolatileStatus.OBSTRUCT,
      VolatileStatus.DETECT,
      VolatileStatus.PROTECT,
      VolatileStatus.BURNING_BULWARK,
      VolatileStatus.SPIKY_SHIELD,
      VolatileStatus.BANEFUL_BUNKER,
      VolatileStatus.MAX_GUARD,
      VolatileStatus.ENDURE,
    ];

    for (const effectType of protectionEffects) {
      const effect = this.hasStatusEffect(monster, effectType);
      if (effect) {
        return effect;
      }
    }

    return null;
  }

  /**
   * Handle contact with a protected monster
   */
  async handleProtectionContact(
    battleId: number,
    protectedMonster: StatusEffectMonster,
    attacker: StatusEffectMonster
  ): Promise<{
    success: boolean;
    message: string;
    contactDamage?: number;
    statusEffect?: string;
    statChange?: Record<string, number>;
  }> {
    const protection = this.hasProtection(protectedMonster);
    if (!protection) {
      return { success: false, message: 'No protection active' };
    }

    const metadata = this.getStatusEffectMetadata(protection.type);
    if (!metadata) {
      return { success: false, message: 'No protection metadata found' };
    }

    const attackerName = attacker.name ?? 'Attacker';
    let message = '';
    const result: {
      success: boolean;
      message: string;
      contactDamage?: number;
      statusEffect?: string;
      statChange?: Record<string, number>;
    } = { success: true, message: '' };

    if (metadata.contactDamage) {
      // Spiky Shield - deal damage on contact
      const contactDamage = metadata.contactDamage(attacker);
      if (contactDamage > 0) {
        await this.battleMonsterRepository.dealDamage(attacker.id, contactDamage);
        message = `${metadata.emoji} **${attackerName}** was hurt by ${metadata.name}! (-${contactDamage} HP)`;
        result.contactDamage = contactDamage;
      }
    } else if (metadata.contactEffect?.statusEffect) {
      // Burning Bulwark, Baneful Bunker - apply status effect
      const statusEffect = metadata.contactEffect.statusEffect;
      const duration = metadata.contactEffect.duration ?? 3;

      await this.applyStatusEffect(battleId, attacker, statusEffect, duration);
      message = `${metadata.emoji} **${attackerName}** was ${statusEffect}ed by contact with ${metadata.name}!`;
      result.statusEffect = statusEffect;
    } else if (metadata.contactEffect?.stat) {
      // Silk Trap, Obstruct - apply stat changes
      const statMods = attacker.stat_modifications ?? {};
      const stat = metadata.contactEffect.stat;
      const change = metadata.contactEffect.change ?? 0;

      statMods[stat] ??= 0;
      statMods[stat] = Math.max(-6, Math.min(6, statMods[stat] + change));

      await this.battleMonsterRepository.update(attacker.id, {
        monster_data: {
          ...attacker.monster_data,
          stat_modifications: statMods,
        },
      });

      const statName = stat.charAt(0).toUpperCase() + stat.slice(1).replace('_', ' ');
      const changeText = change < 0 ? 'fell' : 'rose';
      const severity = Math.abs(change) > 1 ? 'harshly ' : '';

      message = `${metadata.emoji} **${attackerName}**'s ${statName} ${severity}${changeText} from contact with ${metadata.name}!`;
      result.statChange = { [stat]: change };
    }

    if (message) {
      await this.battleLog.logSystem(battleId, message);
    }

    result.message = message;
    return result;
  }

  /**
   * Check if a move should apply a status effect based on its type
   */
  checkTypeBasedStatusEffect(
    moveType: string
  ): { type: string; chance: number } | null {
    const statusChances = TYPE_STATUS_CHANCES[moveType];
    if (!statusChances) {
      return null;
    }

    for (const [statusType, chance] of Object.entries(statusChances)) {
      if (Math.random() * 100 < chance) {
        return { type: statusType, chance };
      }
    }

    return null;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a StatusEffectService with dependencies
 */
export function createStatusEffectService(
  battleMonsterRepository: IStatusEffectBattleMonsterRepository,
  battleLog: IStatusEffectBattleLog
): StatusEffectService {
  return new StatusEffectService(battleMonsterRepository, battleLog);
}
