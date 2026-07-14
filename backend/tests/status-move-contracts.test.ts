import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  ALL_STATUS_MOVES,
  STAT_BUFF_DEBUFF_MOVES,
  STATUS_AFFLICTION_MOVES,
  HEALING_MOVES,
  OTHER_STATUS_MOVES,
  StatusMoveTarget,
  getAllStatusMoveNames,
  getStatusMoveDefinition,
  resolveStatusMoveName,
  normalizeMoveName,
  isStatusMove,
  type StatBuffDebuffMove,
  type StatusAfflictionMove,
  type HealingMove,
} from '../src/utils/constants/monster-status-moves';

const VALID_TARGETS = new Set<string>(Object.values(StatusMoveTarget));
const VALID_STAT_KEYS = new Set<string>([
  'attack',
  'defense',
  'special_attack',
  'special_defense',
  'speed',
  'accuracy',
  'evasion',
]);
const ALL_NAMES = getAllStatusMoveNames();

describe('status move dictionary assembly', () => {
  test('there is a substantial catalogue of status moves', () => {
    assert.ok(ALL_NAMES.length > 250, `expected >250 status moves, got ${ALL_NAMES.length}`);
  });

  test('the four dictionaries merge without name collisions', () => {
    const individual =
      Object.keys(STAT_BUFF_DEBUFF_MOVES).length +
      Object.keys(STATUS_AFFLICTION_MOVES).length +
      Object.keys(HEALING_MOVES).length +
      Object.keys(OTHER_STATUS_MOVES).length;
    assert.equal(
      Object.keys(ALL_STATUS_MOVES).length,
      individual,
      'a move name is defined in more than one dictionary and is being silently overwritten'
    );
  });

  test('every move name resolves back to itself and is recognised', () => {
    for (const name of ALL_NAMES) {
      assert.equal(resolveStatusMoveName(name), name, `${name} did not resolve to itself`);
      assert.equal(isStatusMove(name), true, `${name} not recognised as a status move`);
    }
  });

  test('normalized (punctuation-stripped) spellings still resolve', () => {
    for (const name of ALL_NAMES) {
      const stripped = normalizeMoveName(name);
      assert.equal(
        resolveStatusMoveName(stripped),
        name,
        `punctuation-stripped "${stripped}" did not resolve to ${name}`
      );
    }
  });
});

describe('every status move definition is well-formed', () => {
  for (const name of ALL_NAMES) {
    test(name, () => {
      const def = getStatusMoveDefinition(name);
      assert.ok(def, `${name} has no definition`);

      assert.equal(typeof def.type, 'string');
      assert.ok((def.type as string).length > 0, `${name} has an empty type`);

      assert.ok(VALID_TARGETS.has(def.target as string), `${name} has invalid target "${def.target}"`);

      assert.equal(typeof def.message, 'function', `${name} has no message function`);
      const message = def.message('Attacker', 'Defender', 'Attack');
      assert.equal(typeof message, 'string', `${name} message did not return a string`);
      assert.ok(message.length > 0, `${name} produced an empty message`);
    });
  }
});

describe('stat move definitions', () => {
  const statMoves = Object.entries(STAT_BUFF_DEBUFF_MOVES);

  test('every declared stat change targets a real stat with a legal stage', () => {
    for (const [name, def] of statMoves) {
      const stats = (def as StatBuffDebuffMove).stats;
      if (!stats) {
        continue;
      }
      for (const [stat, change] of Object.entries(stats)) {
        assert.ok(VALID_STAT_KEYS.has(stat), `${name} modifies unknown stat "${stat}"`);
        assert.equal(typeof change, 'number');
        assert.ok(Number.isInteger(change), `${name} ${stat} change ${change} is not an integer`);
        assert.ok(Math.abs(change as number) <= 6, `${name} ${stat} change ${change} exceeds ±6`);
      }
    }
  });
});

describe('status affliction definitions', () => {
  test('every affliction move names a status effect to apply', () => {
    for (const [name, def] of Object.entries(STATUS_AFFLICTION_MOVES)) {
      const affliction = def as StatusAfflictionMove;
      assert.ok(
        typeof affliction.statusEffect === 'string' && affliction.statusEffect.length > 0,
        `${name} does not declare a statusEffect`
      );
      if (affliction.duration !== undefined) {
        // -1 is the sentinel for an indefinite condition (lasts until removed).
        assert.ok(
          affliction.duration === -1 || affliction.duration > 0,
          `${name} has an invalid duration (${affliction.duration})`
        );
      }
    }
  });
});

describe('healing definitions', () => {
  test('every healing move computes a finite, non-negative amount', () => {
    const ref = { name: 'Patient', max_hp: 200, current_hp: 50 };
    for (const [name, def] of Object.entries(HEALING_MOVES)) {
      const healing = def as HealingMove;
      assert.equal(typeof healing.healAmount, 'function', `${name} has no healAmount function`);
      const amount = healing.healAmount(ref, 1);
      assert.ok(Number.isFinite(amount), `${name} produced a non-finite heal amount (${amount})`);
      assert.ok(amount >= 0, `${name} produced a negative heal amount (${amount})`);
    }
  });
});
