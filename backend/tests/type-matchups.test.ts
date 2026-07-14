import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  MONSTER_TYPES,
  TYPE_EFFECTIVENESS,
  calculateTypeEffectiveness,
  getEffectivenessDescription,
  isValidMonsterType,
  normalizeMonsterType,
  type MonsterTypeValue,
} from '../src/utils/constants/monster-types';

describe('type chart integrity', () => {
  test('exposes exactly the 18 canonical types', () => {
    assert.equal(MONSTER_TYPES.length, 18);
    assert.ok(MONSTER_TYPES.includes('Normal'));
    assert.ok(MONSTER_TYPES.includes('Fairy'));
    assert.ok(MONSTER_TYPES.includes('Steel'));
  });

  test('every attacking type has an effectiveness entry', () => {
    for (const type of MONSTER_TYPES) {
      assert.ok(TYPE_EFFECTIVENESS[type] !== undefined, `missing chart for ${type}`);
    }
  });

  test('chart only references valid types and legal multipliers', () => {
    const legalMultipliers = new Set([0, 0.5, 2]);
    for (const attacking of MONSTER_TYPES) {
      const row = TYPE_EFFECTIVENESS[attacking];
      for (const [defending, multiplier] of Object.entries(row)) {
        assert.ok(
          isValidMonsterType(defending),
          `${attacking} references invalid defender type "${defending}"`
        );
        assert.ok(
          legalMultipliers.has(multiplier as number),
          `${attacking}->${defending} has illegal multiplier ${multiplier}`
        );
      }
    }
  });
});

describe('calculateTypeEffectiveness - single defender type', () => {
  test('super effective returns 2x', () => {
    assert.equal(calculateTypeEffectiveness('Fire', ['Grass']), 2);
    assert.equal(calculateTypeEffectiveness('Water', ['Fire']), 2);
    assert.equal(calculateTypeEffectiveness('Electric', ['Water']), 2);
    assert.equal(calculateTypeEffectiveness('Fairy', ['Dragon']), 2);
  });

  test('not very effective returns 0.5x', () => {
    assert.equal(calculateTypeEffectiveness('Fire', ['Water']), 0.5);
    assert.equal(calculateTypeEffectiveness('Grass', ['Fire']), 0.5);
    assert.equal(calculateTypeEffectiveness('Normal', ['Rock']), 0.5);
  });

  test('immunities return 0x', () => {
    assert.equal(calculateTypeEffectiveness('Normal', ['Ghost']), 0);
    assert.equal(calculateTypeEffectiveness('Electric', ['Ground']), 0);
    assert.equal(calculateTypeEffectiveness('Ground', ['Flying']), 0);
    assert.equal(calculateTypeEffectiveness('Psychic', ['Dark']), 0);
    assert.equal(calculateTypeEffectiveness('Dragon', ['Fairy']), 0);
    assert.equal(calculateTypeEffectiveness('Fighting', ['Ghost']), 0);
    assert.equal(calculateTypeEffectiveness('Poison', ['Steel']), 0);
  });

  test('neutral matchups return 1x', () => {
    assert.equal(calculateTypeEffectiveness('Normal', ['Fire']), 1);
    assert.equal(calculateTypeEffectiveness('Fire', ['Electric']), 1);
  });
});

describe('calculateTypeEffectiveness - multi-type defenders (up to 5 slots)', () => {
  test('two weaknesses stack to 4x', () => {
    assert.equal(calculateTypeEffectiveness('Fire', ['Grass', 'Bug']), 4);
    assert.equal(calculateTypeEffectiveness('Rock', ['Fire', 'Flying']), 4);
  });

  test('weakness and resistance cancel to 1x', () => {
    assert.equal(calculateTypeEffectiveness('Fire', ['Grass', 'Water']), 1);
  });

  test('two resistances stack to 0.25x', () => {
    assert.equal(calculateTypeEffectiveness('Grass', ['Fire', 'Poison']), 0.25);
  });

  test('any immune slot forces the whole matchup to 0x', () => {
    assert.equal(calculateTypeEffectiveness('Ground', ['Fire', 'Flying']), 0);
    assert.equal(calculateTypeEffectiveness('Normal', ['Rock', 'Ghost']), 0);
  });

  test('effectiveness multiplies across all five type slots', () => {
    const fiveWeaknesses: MonsterTypeValue[] = ['Grass', 'Ice', 'Bug', 'Steel', 'Grass'];
    assert.equal(calculateTypeEffectiveness('Fire', fiveWeaknesses), 32);

    // Fire vs Grass(2) Water(0.5) Bug(2) Rock(0.5) Dragon(0.5) = 0.5.
    const mixed: MonsterTypeValue[] = ['Grass', 'Water', 'Bug', 'Rock', 'Dragon'];
    assert.equal(calculateTypeEffectiveness('Fire', mixed), 0.5);
  });

  test('empty defender type list is neutral', () => {
    assert.equal(calculateTypeEffectiveness('Fire', []), 1);
  });
});

describe('effectiveness descriptions', () => {
  test('maps multipliers to human-readable labels', () => {
    assert.equal(getEffectivenessDescription(0), 'No effect');
    assert.equal(getEffectivenessDescription(0.25), 'Barely effective');
    assert.equal(getEffectivenessDescription(0.5), 'Not very effective');
    assert.equal(getEffectivenessDescription(1), 'Normal effectiveness');
    assert.equal(getEffectivenessDescription(2), 'Super effective');
    assert.equal(getEffectivenessDescription(4), 'Extremely effective');
  });
});

describe('type validation and normalization', () => {
  test('validates real types and rejects fakes', () => {
    assert.equal(isValidMonsterType('Fire'), true);
    assert.equal(isValidMonsterType('Shadow'), false);
    assert.equal(isValidMonsterType(''), false);
  });

  test('normalizes casing and rejects unknown types', () => {
    assert.equal(normalizeMonsterType('fire'), 'Fire');
    assert.equal(normalizeMonsterType('FIRE'), 'Fire');
    assert.equal(normalizeMonsterType('fIrE'), 'Fire');
    assert.equal(normalizeMonsterType('Shadow'), null);
    assert.equal(normalizeMonsterType(''), null);
  });
});
