import type { Move } from '../src/repositories/move.repository';
import type { MoveRepository } from '../src/repositories/move.repository';
import type {
  IStatusEffectManager,
  IBattleMonsterRepository,
  IBattleLog,
  StatusMoveBattleMonster,
} from '../src/services/adventure/status-move.service';

/**
 * Run a callback with Math.random replaced by a deterministic sequence.
 * A single number is returned for every call; an array is consumed one value
 * per call and clamps to the final value once exhausted. The original
 * Math.random is always restored, even if the callback throws.
 */
export async function withRandom<T>(
  values: number | number[],
  fn: () => T | Promise<T>
): Promise<T> {
  const original = Math.random;
  const sequence = Array.isArray(values) ? values : [values];
  let index = 0;
  Math.random = (): number => sequence[Math.min(index++, sequence.length - 1)] ?? 0;
  try {
    return await fn();
  } finally {
    Math.random = original;
  }
}

/**
 * Build a fully-populated Move from a partial spec, filling sensible defaults
 * for every field the battle code may read.
 */
export function makeMove(partial: Partial<Move> & Pick<Move, 'moveName' | 'moveType'>): Move {
  return {
    moveName: partial.moveName,
    moveType: partial.moveType,
    attribute: partial.attribute ?? null,
    power: partial.power ?? 40,
    accuracy: partial.accuracy ?? 100,
    pp: partial.pp ?? 20,
    priority: partial.priority ?? 0,
    description: partial.description ?? null,
    effectChance: partial.effectChance ?? null,
    target: partial.target ?? 'single',
    moveCategory: partial.moveCategory ?? 'Physical',
    learnLevel: partial.learnLevel ?? 1,
  };
}

/**
 * An in-memory MoveRepository stand-in that resolves moves from a fixed table
 * without touching the database. Only the read methods used by the battle
 * engine are implemented.
 */
export function makeMoveRepository(moves: Move[]): MoveRepository {
  const byName = new Map<string, Move>();
  for (const move of moves) {
    byName.set(move.moveName.toLowerCase(), move);
  }

  const repo = {
    async findByName(moveName: string): Promise<Move | null> {
      return byName.get(moveName.toLowerCase()) ?? null;
    },
    async findByNames(moveNames: string[]): Promise<Move[]> {
      const found: Move[] = [];
      for (const name of moveNames) {
        const move = byName.get(name.toLowerCase());
        if (move) {
          found.push(move);
        }
      }
      return found;
    },
    async findByType(moveType: string): Promise<Move[]> {
      return moves.filter((move) => move.moveType === moveType);
    },
  };

  return repo as unknown as MoveRepository;
}

/** Records made against the three StatusMoveService dependencies during a test. */
export interface StatusMoveMockCalls {
  applyStatusEffect: Array<{
    battleId: number;
    target: StatusMoveBattleMonster | null;
    effect: string;
    duration: number;
    data?: Record<string, unknown>;
  }>;
  update: Array<{ id: number; data: { monster_data?: Record<string, unknown>; current_hp?: number; is_fainted?: boolean } }>;
  dealDamage: Array<{ id: number; damage: number }>;
  heal: Array<{ id: number; amount: number }>;
  logSystem: string[];
  removeStatusEffect: number;
  removeAllStatusEffects: number;
  cureAllStatusEffects: number;
}

export interface StatusMoveMocks {
  manager: IStatusEffectManager;
  repo: IBattleMonsterRepository;
  log: IBattleLog;
  calls: StatusMoveMockCalls;
}

/**
 * Build recording in-memory implementations of the three StatusMoveService
 * dependencies. `hasStatus` controls what `hasStatusEffect` returns (used by
 * conditional moves like Nightmare).
 */
export function makeStatusMoveMocks(opts: { hasStatus?: boolean } = {}): StatusMoveMocks {
  const calls: StatusMoveMockCalls = {
    applyStatusEffect: [],
    update: [],
    dealDamage: [],
    heal: [],
    logSystem: [],
    removeStatusEffect: 0,
    removeAllStatusEffects: 0,
    cureAllStatusEffects: 0,
  };

  const manager: IStatusEffectManager = {
    async applyStatusEffect(battleId, target, effect, duration, data) {
      calls.applyStatusEffect.push({ battleId, target, effect, duration, data });
      return { success: true, message: `${effect} applied` };
    },
    hasStatusEffect() {
      return opts.hasStatus ?? false;
    },
    async removeStatusEffect() {
      calls.removeStatusEffect++;
    },
    async removeAllStatusEffects() {
      calls.removeAllStatusEffects++;
    },
    async cureAllStatusEffects() {
      calls.cureAllStatusEffects++;
    },
  };

  const repo: IBattleMonsterRepository = {
    async update(id, data) {
      calls.update.push({ id, data });
    },
    async dealDamage(id, damage) {
      calls.dealDamage.push({ id, damage });
    },
    async heal(id, amount) {
      calls.heal.push({ id, amount });
      return { heal_amount: amount };
    },
  };

  const log: IBattleLog = {
    async logSystem(_battleId, message) {
      calls.logSystem.push(message);
    },
  };

  return { manager, repo, log, calls };
}

/** Build a StatusMoveBattleMonster fixture with complete, sensible defaults. */
export function makeStatusMonster(
  overrides: Partial<StatusMoveBattleMonster> & Pick<StatusMoveBattleMonster, 'id' | 'name'>
): StatusMoveBattleMonster {
  const { monster_data, ...rest } = overrides;
  return {
    current_hp: 100,
    max_hp: 200,
    stat_modifications: {},
    status_effects: [],
    held_item: null,
    moves: [],
    lastMoveUsed: null,
    ...rest,
    monster_data: {
      type1: 'Normal',
      type2: null,
      gender: 'male',
      ability: null,
      stat_modifications: {},
      held_item: null,
      ...monster_data,
    },
  };
}
