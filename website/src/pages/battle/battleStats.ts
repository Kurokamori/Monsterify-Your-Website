import { BATTLE_STAT_STAGE_KEYS, type BattleStatStageKey, type BattleStatStages } from '@services/battleService';

/**
 * Presentation metadata for the seven battle stat stages.
 *
 * The backend keys them by their long names (`special_attack`), which are far too wide
 * for a chip on an info card, so each carries both a short label for the chips/popups
 * and the full one for the hover panel.
 */
export interface BattleStatMeta {
  key: BattleStatStageKey;
  /** Chip / popup label. */
  short: string;
  /** Hover-panel label. */
  long: string;
}

export const BATTLE_STAT_META: Record<BattleStatStageKey, BattleStatMeta> = {
  attack: { key: 'attack', short: 'Atk', long: 'Attack' },
  defense: { key: 'defense', short: 'Def', long: 'Defense' },
  special_attack: { key: 'special_attack', short: 'Sp. Atk', long: 'Special Attack' },
  special_defense: { key: 'special_defense', short: 'Sp. Def', long: 'Special Defense' },
  speed: { key: 'speed', short: 'Spe', long: 'Speed' },
  accuracy: { key: 'accuracy', short: 'Acc', long: 'Accuracy' },
  evasion: { key: 'evasion', short: 'Eva', long: 'Evasion' },
};

/** A stat stage a monster is actually carrying, ready to render. */
export interface ActiveStatStage extends BattleStatMeta {
  /** -6..+6, never 0 (an unmodified stat is not listed). */
  stage: number;
}

/**
 * The non-zero stages a monster carries, in the canonical stat order.
 *
 * The backend already drops the zeroes, but this re-checks rather than trusting the
 * payload: a battle that started before stat stages were sent has no `statStages` at
 * all, and a stale one could still carry a zeroed entry.
 */
export function activeStatStages(stages: BattleStatStages | undefined): ActiveStatStage[] {
  if (!stages) return [];
  return BATTLE_STAT_STAGE_KEYS
    .filter((key) => Boolean(stages[key]))
    .map((key) => ({ ...BATTLE_STAT_META[key], stage: stages[key] as number }));
}

/**
 * The colour band an HP bar falls into. Drives `.battle-hp__fill--{high,mid,low}`, so
 * the field cards, the bench and anything else showing HP stay in step.
 */
export function hpBarTier(pct: number): 'high' | 'mid' | 'low' {
  if (pct > 50) return 'high';
  if (pct > 20) return 'mid';
  return 'low';
}

/** `+2` / `-1` — the sign is always shown, so a buff never reads as a plain number. */
export function formatStage(stage: number): string {
  return stage > 0 ? `+${stage}` : `${stage}`;
}

/**
 * How a stage change is described in the games: one step is a plain change, two is
 * "sharply", three or more is "drastically". Used by the floating popups.
 */
export function stageChangeWord(delta: number): string {
  const size = Math.abs(delta);
  if (size >= 3) return 'drastically';
  if (size === 2) return 'sharply';
  return '';
}
