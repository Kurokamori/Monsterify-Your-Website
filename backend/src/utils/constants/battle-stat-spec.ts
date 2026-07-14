/**
 * Battle Stat Spec
 *
 * Authored stat inputs (nature / IVs / EVs) for generated battle monsters — the
 * gym leader and gauntlet-trainer teams designed in the admin tool, which have no
 * real monster row behind them.
 *
 * These specs are deliberately the *inputs* to the shared monster stat curve
 * (MonsterInitializerService.calculateStats), never the final totals. Generated
 * opponents and player-owned monsters therefore derive their stats from one
 * formula, so a level-20 gym monster is directly comparable to a level-20
 * trainer monster.
 *
 * A spec may be authored by hand or rolled from a difficulty + role preset.
 */

import {
  StatKeyValue,
  ALL_STAT_KEYS,
  NEUTRAL_NATURES,
  getNaturesByBoostedStat,
  isValidNature,
} from './monster-natures';

// ============================================================================
// Types
// ============================================================================

/** A value for each of the six stats. Used for both IV and EV spreads. */
export type StatSpread = {
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
};

/**
 * The authored stat inputs for a generated battle monster. All fields are
 * optional at the edges (an older gym spec has none); resolveBattleStatSpec
 * fills the gaps with the default preset.
 */
export type BattleStatSpec = {
  nature: string;
  ivs: StatSpread;
  evs: StatSpread;
};

export type PartialBattleStatSpec = {
  nature?: string | null;
  ivs?: Partial<StatSpread> | null;
  evs?: Partial<StatSpread> | null;
};

// ============================================================================
// Bounds
// ============================================================================

export const MIN_IV = 0;
export const MAX_IV = 31;
export const MIN_EV = 0;
export const MAX_EV_PER_STAT = 252;
export const MAX_EV_TOTAL = 510;

// ============================================================================
// Difficulty
// ============================================================================

export const BattleDifficulty = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
  ELITE: 'elite',
  CHAMPION: 'champion',
} as const;

export type BattleDifficultyValue = (typeof BattleDifficulty)[keyof typeof BattleDifficulty];

export const BATTLE_DIFFICULTIES: BattleDifficultyValue[] = Object.values(BattleDifficulty);

/**
 * How good a monster's innate potential is. IVs are rolled in [ivFloor, ivCeiling]
 * and EVs are distributed from evBudget according to the role.
 */
export type DifficultyProfile = {
  label: string;
  ivFloor: number;
  ivCeiling: number;
  evBudget: number;
};

export const DIFFICULTY_PROFILES: Record<BattleDifficultyValue, DifficultyProfile> = {
  easy: { label: 'Easy', ivFloor: 0, ivCeiling: 12, evBudget: 0 },
  medium: { label: 'Medium', ivFloor: 8, ivCeiling: 20, evBudget: 128 },
  hard: { label: 'Hard', ivFloor: 16, ivCeiling: 27, evBudget: 296 },
  elite: { label: 'Elite', ivFloor: 24, ivCeiling: 31, evBudget: 428 },
  champion: { label: 'Champion', ivFloor: 31, ivCeiling: 31, evBudget: MAX_EV_TOTAL },
};

// ============================================================================
// Role
// ============================================================================

export const BattleRole = {
  BALANCED: 'balanced',
  PHYSICAL_ATTACKER: 'physical-attacker',
  SPECIAL_ATTACKER: 'special-attacker',
  PHYSICAL_TANK: 'physical-tank',
  SPECIAL_WALL: 'special-wall',
  SPEEDSTER: 'speedster',
} as const;

export type BattleRoleValue = (typeof BattleRole)[keyof typeof BattleRole];

export const BATTLE_ROLES: BattleRoleValue[] = Object.values(BattleRole);

/**
 * How a role spends its EV budget and which nature it favours.
 *
 * `evWeights` are relative, not absolute: the budget is split between stats in
 * proportion to their weight (capped per stat), so the same role produces a
 * coherent spread at any difficulty. `boostedStat` selects the candidate natures
 * via getNaturesByBoostedStat, so the nature always agrees with the EV spread;
 * a null boostedStat means a neutral nature.
 */
export type RoleProfile = {
  label: string;
  description: string;
  boostedStat: StatKeyValue | null;
  evWeights: StatSpread;
};

export const ROLE_PROFILES: Record<BattleRoleValue, RoleProfile> = {
  balanced: {
    label: 'Balanced',
    description: 'Even spread, neutral nature. No exploitable weakness, no spike.',
    boostedStat: null,
    evWeights: { hp: 1, atk: 1, def: 1, spa: 1, spd: 1, spe: 1 },
  },
  'physical-attacker': {
    label: 'Physical Attacker',
    description: 'Hits hard with physical moves and moves first. Frail.',
    boostedStat: 'atk',
    evWeights: { hp: 0, atk: 3, def: 0, spa: 0, spd: 0, spe: 2 },
  },
  'special-attacker': {
    label: 'Special Attacker',
    description: 'Hits hard with special moves and moves first. Frail.',
    boostedStat: 'spa',
    evWeights: { hp: 0, atk: 0, def: 0, spa: 3, spd: 0, spe: 2 },
  },
  'physical-tank': {
    label: 'Physical Tank',
    description: 'Absorbs physical hits. Slow, low offence.',
    boostedStat: 'def',
    evWeights: { hp: 3, atk: 1, def: 3, spa: 0, spd: 0, spe: 0 },
  },
  'special-wall': {
    label: 'Special Wall',
    description: 'Absorbs special hits. Slow, low offence.',
    boostedStat: 'spd',
    evWeights: { hp: 3, atk: 0, def: 0, spa: 1, spd: 3, spe: 0 },
  },
  speedster: {
    label: 'Speedster',
    description: 'Outruns almost anything and chips. Fragile and low damage.',
    boostedStat: 'spe',
    evWeights: { hp: 0, atk: 2, def: 0, spa: 2, spd: 0, spe: 3 },
  },
};

// ============================================================================
// Defaults
// ============================================================================

/**
 * The preset applied to a generated monster that has no authored stat spec.
 * Medium/balanced puts an unconfigured gym monster on par with an average
 * player-owned monster of the same level, which is what the old flat
 * `40 + level` stat block was trying (and failing) to approximate.
 */
export const DEFAULT_BATTLE_DIFFICULTY: BattleDifficultyValue = BattleDifficulty.MEDIUM;
export const DEFAULT_BATTLE_ROLE: BattleRoleValue = BattleRole.BALANCED;

const uniformSpread = (value: number): StatSpread => ({
  hp: value,
  atk: value,
  def: value,
  spa: value,
  spd: value,
  spe: value,
});

export const ZERO_SPREAD: StatSpread = uniformSpread(0);

// ============================================================================
// Validation / coercion
// ============================================================================

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, Math.floor(value)));

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

/** Coerce an arbitrary partial spread into a full spread of in-range integers. */
const coerceSpread = (
  spread: Partial<StatSpread> | null | undefined,
  fallback: StatSpread,
  min: number,
  max: number
): StatSpread => {
  const result: StatSpread = { ...fallback };
  for (const stat of ALL_STAT_KEYS) {
    const value = spread?.[stat];
    if (isFiniteNumber(value)) {
      result[stat] = clamp(value, min, max);
    }
  }
  return result;
};

/**
 * Scale an EV spread down proportionally until its total fits MAX_EV_TOTAL.
 * Authored spreads are trusted but bounded — a designer who types 252 into every
 * box gets a legal spread back rather than a silent rule-break.
 */
export const enforceEvTotal = (evs: StatSpread): StatSpread => {
  const total = ALL_STAT_KEYS.reduce((sum, stat) => sum + evs[stat], 0);
  if (total <= MAX_EV_TOTAL) {
    return evs;
  }

  const scale = MAX_EV_TOTAL / total;
  const scaled: StatSpread = { ...ZERO_SPREAD };
  for (const stat of ALL_STAT_KEYS) {
    scaled[stat] = clamp(evs[stat] * scale, MIN_EV, MAX_EV_PER_STAT);
  }
  return scaled;
};

/** Total EVs used by a spread. */
export const totalEvs = (evs: StatSpread): number =>
  ALL_STAT_KEYS.reduce((sum, stat) => sum + evs[stat], 0);

/**
 * Fill a partially-authored (or entirely absent) stat spec into a complete,
 * in-range one. This is the single entry point used by the battle builder, so an
 * un-migrated legacy gym spec and a fully authored one both resolve safely.
 */
export const resolveBattleStatSpec = (
  spec: PartialBattleStatSpec | null | undefined
): BattleStatSpec => {
  const defaults = rollBattleStatSpec(DEFAULT_BATTLE_DIFFICULTY, DEFAULT_BATTLE_ROLE, () => 0.5);

  const nature =
    spec?.nature && isValidNature(spec.nature) ? spec.nature : defaults.nature;

  return {
    nature,
    ivs: coerceSpread(spec?.ivs, defaults.ivs, MIN_IV, MAX_IV),
    evs: enforceEvTotal(coerceSpread(spec?.evs, defaults.evs, MIN_EV, MAX_EV_PER_STAT)),
  };
};

// ============================================================================
// Rolling
// ============================================================================

/** Injectable randomness so the roller stays deterministic under test. */
export type RandomFn = () => number;

/**
 * Split an EV budget across stats in proportion to the role's weights, honouring
 * the per-stat cap. Any remainder left by capping or flooring is redistributed to
 * the still-uncapped weighted stats, so the full budget is always spent when the
 * role has room for it.
 */
const distributeEvs = (evBudget: number, weights: StatSpread): StatSpread => {
  const evs: StatSpread = { ...ZERO_SPREAD };
  const budget = Math.min(evBudget, MAX_EV_TOTAL);
  if (budget <= 0) {
    return evs;
  }

  let remaining = budget;
  let weighted = ALL_STAT_KEYS.filter((stat) => weights[stat] > 0);

  while (remaining > 0 && weighted.length > 0) {
    const totalWeight = weighted.reduce((sum, stat) => sum + weights[stat], 0);
    const startingRemainder = remaining;

    for (const stat of weighted) {
      if (remaining <= 0) {
        break;
      }
      const share = Math.floor((startingRemainder * weights[stat]) / totalWeight);
      const room = MAX_EV_PER_STAT - evs[stat];
      const grant = Math.min(share, room, remaining);
      evs[stat] += grant;
      remaining -= grant;
    }

    weighted = weighted.filter((stat) => evs[stat] < MAX_EV_PER_STAT);

    // Flooring can leave a few EVs unassigned with every share rounding to 0.
    // Hand them out one at a time so the loop always terminates.
    if (remaining > 0 && remaining === startingRemainder) {
      for (const stat of weighted) {
        if (remaining <= 0) {
          break;
        }
        evs[stat] += 1;
        remaining -= 1;
      }
      if (remaining === startingRemainder) {
        break;
      }
    }
  }

  return evs;
};

/**
 * Roll a complete stat spec from a difficulty + role preset.
 *
 * Difficulty sets the IV band and the EV budget (how strong the monster is);
 * role sets the EV distribution and the nature (what shape that strength takes).
 */
export const rollBattleStatSpec = (
  difficulty: BattleDifficultyValue,
  role: BattleRoleValue,
  random: RandomFn = Math.random
): BattleStatSpec => {
  const difficultyProfile = DIFFICULTY_PROFILES[difficulty] ?? DIFFICULTY_PROFILES.medium;
  const roleProfile = ROLE_PROFILES[role] ?? ROLE_PROFILES.balanced;

  const ivSpan = difficultyProfile.ivCeiling - difficultyProfile.ivFloor;
  const ivs: StatSpread = { ...ZERO_SPREAD };
  for (const stat of ALL_STAT_KEYS) {
    const roll = ivSpan <= 0 ? 0 : Math.floor(random() * (ivSpan + 1));
    ivs[stat] = clamp(difficultyProfile.ivFloor + roll, MIN_IV, MAX_IV);
  }

  const candidateNatures = roleProfile.boostedStat
    ? getNaturesByBoostedStat(roleProfile.boostedStat)
    : NEUTRAL_NATURES;
  const natures = candidateNatures.length > 0 ? candidateNatures : NEUTRAL_NATURES;
  const nature = natures[Math.floor(random() * natures.length)] ?? 'Hardy';

  return {
    nature,
    ivs,
    evs: distributeEvs(difficultyProfile.evBudget, roleProfile.evWeights),
  };
};
