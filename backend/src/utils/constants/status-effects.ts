/**
 * Status Effect Constants
 * Defines all battle status effects and their properties
 */

// Primary status conditions (only one can be active at a time)
export const PrimaryStatus = {
  POISON: 'poison',
  BURN: 'burn',
  FREEZE: 'freeze',
  PARALYSIS: 'paralysis',
  SLEEP: 'sleep',
  TOXIC: 'toxic', // Badly poisoned
} as const;

export type PrimaryStatusValue = (typeof PrimaryStatus)[keyof typeof PrimaryStatus];

export const PRIMARY_STATUSES: PrimaryStatusValue[] = Object.values(PrimaryStatus);

// Volatile status conditions (multiple can be active)
export const VolatileStatus = {
  CONFUSION: 'confusion',
  FLINCH: 'flinch',
  LEECH_SEED: 'leech_seed',
  TAUNT: 'taunt',
  EMBARGO: 'embargo',
  TORMENT: 'torment',
  TRAPPED: 'trapped',
  INFATUATION: 'infatuation',
  ENCORE: 'encore',
  DISABLE: 'disable',
  CURSE: 'curse',
  NIGHTMARE: 'nightmare',
  PERISH_SONG: 'perish_song',
  DROWSY: 'drowsy',
  // Protection effects
  PROTECT: 'protect',
  DETECT: 'detect',
  ENDURE: 'endure',
  SILK_TRAP: 'silk_trap',
  OBSTRUCT: 'obstruct',
  BURNING_BULWARK: 'burning_bulwark',
  SPIKY_SHIELD: 'spiky_shield',
  BANEFUL_BUNKER: 'baneful_bunker',
  MAX_GUARD: 'max_guard',
  CRAFTY_SHIELD: 'crafty_shield',
  QUICK_GUARD: 'quick_guard',
  WIDE_GUARD: 'wide_guard',
  MAT_BLOCK: 'mat_block',
  // Trapping effects
  SNATCH: 'snatch',
  QUASH: 'quash',
  RAGE_POWDER: 'rage_powder',
  POWDER: 'powder',
  OCTOLOCK: 'octolock',
  BLOCK: 'block',
  MEAN_LOOK: 'mean_look',
  FAIRY_LOCK: 'fairy_lock',
  INGRAIN: 'ingrain',
  // Stat/ability modifiers
  DRAGON_CHEER: 'dragon_cheer',
  CHARGE: 'charge',
  ELECTRIFY: 'electrify',
  MAGNET_RISE: 'magnet_rise',
  FOCUS_ENERGY: 'focus_energy',
  LASER_FOCUS: 'laser_focus',
  LUCKY_CHANT: 'lucky_chant',
  MIST: 'mist',
  SAFEGUARD: 'safeguard',
  TAILWIND: 'tailwind',
  ROOST: 'roost',
  // Type-changing effects
  TRICK_OR_TREAT: 'trick_or_treat',
  FORESTS_CURSE: 'forests_curse',
  CAMOUFLAGE: 'camouflage',
  CONVERSION: 'conversion',
  REFLECT_TYPE: 'reflect_type',
  // Special mechanics
  GRUDGE: 'grudge',
  DESTINY_BOND: 'destiny_bond',
  SUBSTITUTE: 'substitute',
  TRANSFORM: 'transform',
  SPOTLIGHT: 'spotlight',
  FOLLOW_ME: 'follow_me',
  WHIRLWIND: 'whirlwind',
  ROAR: 'roar',
  AFTER_YOU: 'after_you',
  LOCK_ON: 'lock_on',
  MIND_READER: 'mind_reader',
  FORESIGHT: 'foresight',
  MIRACLE_EYE: 'miracle_eye',
  HELPING_HAND: 'helping_hand',
  WISH: 'wish',
  STOCKPILE: 'stockpile',
  HEAL_BLOCK: 'heal_block',
  INSTRUCT: 'instruct',
  TELEKINESIS: 'telekinesis',
  GASTRO_ACID: 'gastro_acid',
  WORRY_SEED: 'worry_seed',
  SIMPLE_BEAM: 'simple_beam',
  ROLE_PLAY: 'role_play',
  IMPRISON: 'imprison',
  MAGIC_COAT: 'magic_coat',
  SHED_TAIL: 'shed_tail',
  ALLY_SWITCH: 'ally_switch',
  // Team barriers
  REFLECT: 'reflect',
  LIGHT_SCREEN: 'light_screen',
  AURORA_VEIL: 'aurora_veil',
  // Field effects (on individual monsters)
  HAPPY_HOUR: 'happy_hour',
  ION_DELUGE: 'ion_deluge',
  MUD_SPORT: 'mud_sport',
  CORROSIVE_GAS: 'corrosive_gas',
  GRAVITY: 'gravity',
  FIRE_WEAKNESS: 'fire_weakness',
  // Entry hazards tracked on monster (affected by)
  SPIKES: 'spikes',
  STEALTH_ROCK: 'stealth_rock',
  TOXIC_SPIKES: 'toxic_spikes',
  // Weather (as monster status)
  SUNNY_DAY: 'sunny_day',
  HAIL: 'hail',
  SNOW: 'snow',
  SANDSTORM: 'sandstorm',
  CHILLY_RECEPTION: 'chilly_reception',
  // Terrain (as monster status)
  ELECTRIC_TERRAIN: 'electric_terrain',
  GRASSY_TERRAIN: 'grassy_terrain',
  MISTY_TERRAIN: 'misty_terrain',
  PSYCHIC_TERRAIN: 'psychic_terrain',
  // Room effects
  MAGIC_ROOM: 'magic_room',
  TRICK_ROOM: 'trick_room',
  WONDER_ROOM: 'wonder_room',
  // Sacrifice effects
  SACRIFICE_HEAL: 'sacrifice_heal',
} as const;

export type VolatileStatusValue = (typeof VolatileStatus)[keyof typeof VolatileStatus];

export const VOLATILE_STATUSES: VolatileStatusValue[] = Object.values(VolatileStatus);

// Combined status type
export type StatusEffectValue = PrimaryStatusValue | VolatileStatusValue;

export const ALL_STATUS_EFFECTS: StatusEffectValue[] = [...PRIMARY_STATUSES, ...VOLATILE_STATUSES];

/**
 * Status effect definition with mechanics
 */
export interface StatusEffectDefinition {
  name: string;
  isPrimary: boolean;
  damagePerTurn: number | null; // Fraction of max HP (e.g., 1/16 = 0.0625)
  minDuration: number | null; // Null = until cured
  maxDuration: number | null;
  preventsAction: boolean;
  actionChance: number; // Chance to act if preventsAction is true (0-1)
  canBeCured: boolean;
  selfInflicted: boolean;
  description: string;
}

/**
 * Basic status effect definitions (primary and commonly used volatile)
 * For complete runtime metadata, see StatusEffectService.STATUS_EFFECT_METADATA
 */
export const STATUS_EFFECT_DEFINITIONS: Partial<Record<StatusEffectValue, StatusEffectDefinition>> = {
  // Primary statuses
  [PrimaryStatus.POISON]: {
    name: 'Poison',
    isPrimary: true,
    damagePerTurn: 1 / 8, // 12.5% per turn
    minDuration: null,
    maxDuration: null,
    preventsAction: false,
    actionChance: 1,
    canBeCured: true,
    selfInflicted: false,
    description: 'Takes damage at the end of each turn',
  },
  [PrimaryStatus.TOXIC]: {
    name: 'Badly Poisoned',
    isPrimary: true,
    damagePerTurn: 1 / 16, // Increases each turn: 1/16, 2/16, 3/16...
    minDuration: null,
    maxDuration: null,
    preventsAction: false,
    actionChance: 1,
    canBeCured: true,
    selfInflicted: false,
    description: 'Takes increasing damage at the end of each turn',
  },
  [PrimaryStatus.BURN]: {
    name: 'Burn',
    isPrimary: true,
    damagePerTurn: 1 / 16, // 6.25% per turn
    minDuration: null,
    maxDuration: null,
    preventsAction: false,
    actionChance: 1,
    canBeCured: true,
    selfInflicted: false,
    description: 'Takes damage each turn and physical attack is halved',
  },
  [PrimaryStatus.FREEZE]: {
    name: 'Freeze',
    isPrimary: true,
    damagePerTurn: null,
    minDuration: 1,
    maxDuration: 5,
    preventsAction: true,
    actionChance: 0.2, // 20% chance to thaw each turn
    canBeCured: true,
    selfInflicted: false,
    description: 'Cannot move until thawed',
  },
  [PrimaryStatus.PARALYSIS]: {
    name: 'Paralysis',
    isPrimary: true,
    damagePerTurn: null,
    minDuration: null,
    maxDuration: null,
    preventsAction: true,
    actionChance: 0.75, // 25% chance to be fully paralyzed
    canBeCured: true,
    selfInflicted: false,
    description: 'May be unable to move, speed is reduced',
  },
  [PrimaryStatus.SLEEP]: {
    name: 'Sleep',
    isPrimary: true,
    damagePerTurn: null,
    minDuration: 1,
    maxDuration: 3,
    preventsAction: true,
    actionChance: 0,
    canBeCured: true,
    selfInflicted: false,
    description: 'Cannot move while asleep',
  },

  // Volatile statuses
  [VolatileStatus.CONFUSION]: {
    name: 'Confusion',
    isPrimary: false,
    damagePerTurn: null,
    minDuration: 1,
    maxDuration: 4,
    preventsAction: true,
    actionChance: 0.67, // 33% chance to hit self
    canBeCured: true,
    selfInflicted: false,
    description: 'May hurt itself in confusion',
  },
  [VolatileStatus.FLINCH]: {
    name: 'Flinch',
    isPrimary: false,
    damagePerTurn: null,
    minDuration: 1,
    maxDuration: 1,
    preventsAction: true,
    actionChance: 0,
    canBeCured: false,
    selfInflicted: false,
    description: 'Cannot move this turn',
  },
  [VolatileStatus.LEECH_SEED]: {
    name: 'Leech Seed',
    isPrimary: false,
    damagePerTurn: 1 / 8,
    minDuration: null,
    maxDuration: null,
    preventsAction: false,
    actionChance: 1,
    canBeCured: true,
    selfInflicted: false,
    description: 'HP is drained and given to the opponent',
  },
  [VolatileStatus.TAUNT]: {
    name: 'Taunt',
    isPrimary: false,
    damagePerTurn: null,
    minDuration: 3,
    maxDuration: 3,
    preventsAction: false,
    actionChance: 1,
    canBeCured: false,
    selfInflicted: false,
    description: 'Cannot use status moves',
  },
  [VolatileStatus.EMBARGO]: {
    name: 'Embargo',
    isPrimary: false,
    damagePerTurn: null,
    minDuration: 5,
    maxDuration: 5,
    preventsAction: false,
    actionChance: 1,
    canBeCured: false,
    selfInflicted: false,
    description: 'Cannot use items',
  },
  [VolatileStatus.TORMENT]: {
    name: 'Torment',
    isPrimary: false,
    damagePerTurn: null,
    minDuration: null,
    maxDuration: null,
    preventsAction: false,
    actionChance: 1,
    canBeCured: false,
    selfInflicted: false,
    description: 'Cannot use the same move twice in a row',
  },
  [VolatileStatus.TRAPPED]: {
    name: 'Trapped',
    isPrimary: false,
    damagePerTurn: 1 / 8,
    minDuration: 4,
    maxDuration: 5,
    preventsAction: false,
    actionChance: 1,
    canBeCured: false,
    selfInflicted: false,
    description: 'Cannot switch out and takes damage each turn',
  },
  [VolatileStatus.INFATUATION]: {
    name: 'Infatuation',
    isPrimary: false,
    damagePerTurn: null,
    minDuration: null,
    maxDuration: null,
    preventsAction: true,
    actionChance: 0.5,
    canBeCured: true,
    selfInflicted: false,
    description: 'May be too infatuated to move',
  },
  [VolatileStatus.ENCORE]: {
    name: 'Encore',
    isPrimary: false,
    damagePerTurn: null,
    minDuration: 3,
    maxDuration: 3,
    preventsAction: false,
    actionChance: 1,
    canBeCured: false,
    selfInflicted: false,
    description: 'Forced to repeat the last used move',
  },
  [VolatileStatus.DISABLE]: {
    name: 'Disable',
    isPrimary: false,
    damagePerTurn: null,
    minDuration: 4,
    maxDuration: 4,
    preventsAction: false,
    actionChance: 1,
    canBeCured: false,
    selfInflicted: false,
    description: 'One move is disabled',
  },
  [VolatileStatus.CURSE]: {
    name: 'Curse',
    isPrimary: false,
    damagePerTurn: 1 / 4,
    minDuration: null,
    maxDuration: null,
    preventsAction: false,
    actionChance: 1,
    canBeCured: false,
    selfInflicted: false,
    description: 'Loses HP at the end of each turn',
  },
  [VolatileStatus.NIGHTMARE]: {
    name: 'Nightmare',
    isPrimary: false,
    damagePerTurn: 1 / 4,
    minDuration: null,
    maxDuration: null,
    preventsAction: false,
    actionChance: 1,
    canBeCured: true,
    selfInflicted: false,
    description: 'Loses HP while asleep',
  },
  [VolatileStatus.PERISH_SONG]: {
    name: 'Perish Song',
    isPrimary: false,
    damagePerTurn: null,
    minDuration: 3,
    maxDuration: 3,
    preventsAction: false,
    actionChance: 1,
    canBeCured: false,
    selfInflicted: false,
    description: 'Will faint in 3 turns unless switched',
  },
  [VolatileStatus.DROWSY]: {
    name: 'Drowsy',
    isPrimary: false,
    damagePerTurn: null,
    minDuration: 1,
    maxDuration: 1,
    preventsAction: false,
    actionChance: 1,
    canBeCured: false,
    selfInflicted: false,
    description: 'Will fall asleep at the end of next turn',
  },
};

/**
 * Get the status effect definition
 * @param status - The status effect value
 * @returns The status effect definition or null
 */
export function getStatusEffectDefinition(
  status: StatusEffectValue
): StatusEffectDefinition | null {
  return STATUS_EFFECT_DEFINITIONS[status] ?? null;
}

/**
 * Check if a status is a primary status
 * @param status - The status to check
 * @returns True if it's a primary status
 */
export function isPrimaryStatus(status: StatusEffectValue): status is PrimaryStatusValue {
  return PRIMARY_STATUSES.includes(status as PrimaryStatusValue);
}

/**
 * Check if a status is a volatile status
 * @param status - The status to check
 * @returns True if it's a volatile status
 */
export function isVolatileStatus(status: StatusEffectValue): status is VolatileStatusValue {
  return VOLATILE_STATUSES.includes(status as VolatileStatusValue);
}

/**
 * Check if a status value is valid
 * @param status - The status to check
 * @returns True if valid
 */
export function isValidStatusEffect(status: string): status is StatusEffectValue {
  return ALL_STATUS_EFFECTS.includes(status as StatusEffectValue);
}

/**
 * Calculate status duration
 * @param status - The status effect
 * @returns Random duration within the status's range, or null if permanent
 */
export function calculateStatusDuration(status: StatusEffectValue): number | null {
  const definition = STATUS_EFFECT_DEFINITIONS[status];
  const minDuration = definition?.minDuration;
  const maxDuration = definition?.maxDuration;

  if (minDuration === null || minDuration === undefined || maxDuration === null || maxDuration === undefined) {
    return null;
  }

  const range = maxDuration - minDuration;
  return minDuration + Math.floor(Math.random() * (range + 1));
}
