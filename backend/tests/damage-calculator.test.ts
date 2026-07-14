import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  DamageCalculatorService,
  type MonsterData,
  type MoveData,
} from '../src/services/adventure/damage-calculator.service';
import { makeMove, makeMoveRepository, withRandom } from './helpers';

/**
 * Build a calculator that never touches the database by injecting an in-memory
 * move repository.
 */
function makeCalculator(moves: Parameters<typeof makeMoveRepository>[0] = []): DamageCalculatorService {
  return new DamageCalculatorService(makeMoveRepository(moves));
}

/** A level-50 attacker with 100 in every relevant stat unless overridden. */
function makeAttacker(overrides: MonsterData = {}): MonsterData {
  return {
    name: 'Attacker',
    level: 50,
    attack: 100,
    defense: 100,
    sp_attack: 100,
    sp_defense: 100,
    speed: 100,
    max_hp: 200,
    current_hp: 200,
    ...overrides,
  };
}

function makeDefender(overrides: MonsterData = {}): MonsterData {
  return {
    name: 'Defender',
    level: 50,
    attack: 100,
    defense: 100,
    sp_attack: 100,
    sp_defense: 100,
    speed: 100,
    max_hp: 200,
    current_hp: 200,
    ...overrides,
  };
}

const physical = (type: string, power = 100): MoveData => ({
  move_name: `${type} Strike`,
  power,
  accuracy: 100,
  move_type: type,
  type,
  MoveType: 'Physical',
  move_category: 'Physical',
});

describe('core damage formula', () => {
  test('neutral, non-crit physical hit matches the Pokemon formula', async () => {
    const calc = makeCalculator();
    // Level 50, power 100, atk 100, def 100 -> base 46; randomFactor 0.85 -> 39.
    const result = await withRandom(0, () =>
      calc.calculateDamage(
        makeAttacker({ type1: 'Water' }),
        makeDefender({ type1: 'Water' }),
        physical('Normal'),
        { isCritical: false }
      )
    );
    assert.equal(result.hits, true);
    assert.equal(result.effectiveness, 1);
    assert.equal(result.stabMultiplier, 1);
    assert.equal(result.damage, 39);
  });

  test('critical hits multiply base damage by 1.5', async () => {
    const calc = makeCalculator();
    const result = await withRandom(0, () =>
      calc.calculateDamage(
        makeAttacker({ type1: 'Water' }),
        makeDefender({ type1: 'Water' }),
        physical('Normal'),
        { isCritical: true }
      )
    );
    assert.equal(result.isCritical, true);
    assert.equal(result.damage, 58);
  });

  test('STAB adds a 1.5x multiplier when move type matches attacker type', async () => {
    const calc = makeCalculator();
    const result = await withRandom(0, () =>
      calc.calculateDamage(
        makeAttacker({ type1: 'Normal' }),
        makeDefender({ type1: 'Water' }),
        physical('Normal'),
        { isCritical: false }
      )
    );
    assert.equal(result.stabMultiplier, 1.5);
    assert.equal(result.damage, 58);
  });

  test('super effective doubles damage', async () => {
    const calc = makeCalculator();
    const result = await withRandom(0, () =>
      calc.calculateDamage(
        makeAttacker({ type1: 'Water' }),
        makeDefender({ type1: 'Grass' }),
        physical('Fire'),
        { isCritical: false }
      )
    );
    assert.equal(result.effectiveness, 2);
    assert.equal(result.damage, 78);
  });

  test('special moves use special attack and special defense', async () => {
    const calc = makeCalculator();
    const special: MoveData = {
      move_name: 'Special Beam',
      power: 100,
      accuracy: 100,
      move_type: 'Normal',
      type: 'Normal',
      MoveType: 'Special',
      move_category: 'Special',
    };
    // sp_atk 120 vs sp_def 60 -> base 90; randomFactor 0.85 -> 76.
    const result = await withRandom(0, () =>
      calc.calculateDamage(
        makeAttacker({ type1: 'Water', attack: 5, sp_attack: 120 }),
        makeDefender({ type1: 'Water', defense: 5, sp_defense: 60 }),
        special,
        { isCritical: false }
      )
    );
    assert.equal(result.damage, 76);
  });

  test('a hit always deals at least 1 damage', async () => {
    const calc = makeCalculator();
    const result = await withRandom(0, () =>
      calc.calculateDamage(
        makeAttacker({ type1: 'Water', attack: 1 }),
        makeDefender({ type1: 'Water', defense: 999 }),
        physical('Normal', 10),
        { isCritical: false }
      )
    );
    assert.equal(result.hits, true);
    assert.equal(result.damage, 1);
  });
});

describe('type immunity in the full pipeline', () => {
  test('an immune matchup deals zero damage, not the 1-damage floor', async () => {
    const calc = makeCalculator();
    const result = await withRandom(0, () =>
      calc.calculateDamage(
        makeAttacker({ type1: 'Normal' }),
        makeDefender({ type1: 'Ghost' }),
        physical('Normal'),
        { isCritical: false }
      )
    );
    assert.equal(result.effectiveness, 0);
    assert.equal(result.damage, 0);
    assert.match(result.message, /no effect/i);
  });

  test('immunity via one of several defender type slots still zeroes damage', async () => {
    const calc = makeCalculator();
    const result = await withRandom(0, () =>
      calc.calculateDamage(
        makeAttacker({ type1: 'Electric' }),
        makeDefender({ type1: 'Water', type2: 'Ground' }),
        physical('Electric'),
        { isCritical: false }
      )
    );
    assert.equal(result.effectiveness, 0);
    assert.equal(result.damage, 0);
  });
});

describe('accuracy and misses', () => {
  test('a zero-accuracy move misses and deals no damage', async () => {
    const calc = makeCalculator();
    const move: MoveData = { ...physical('Normal'), accuracy: 0 };
    const result = await withRandom(0.5, () =>
      calc.calculateDamage(
        makeAttacker({ type1: 'Water' }),
        makeDefender({ type1: 'Water' }),
        move,
        { isCritical: false }
      )
    );
    assert.equal(result.hits, false);
    assert.equal(result.damage, 0);
    assert.match(result.message, /missed/i);
  });

  test('a 100-accuracy move always hits', async () => {
    const calc = makeCalculator();
    const result = await withRandom(0.999999, () =>
      calc.calculateDamage(
        makeAttacker({ type1: 'Water' }),
        makeDefender({ type1: 'Water' }),
        physical('Normal'),
        { isCritical: false }
      )
    );
    assert.equal(result.hits, true);
  });
});

describe('resolving moves by name from the repository', () => {
  test('looks up a move string, applies STAB and effectiveness', async () => {
    const calc = makeCalculator([
      makeMove({
        moveName: 'Flamethrower',
        moveType: 'Fire',
        moveCategory: 'Special',
        power: 90,
        accuracy: 100,
      }),
    ]);
    // sp 100 vs 100, power 90 -> base 41; x2 effective x1.5 STAB x0.85 -> 104.
    const result = await withRandom(0, () =>
      calc.calculateDamage(
        makeAttacker({ type1: 'Fire' }),
        makeDefender({ type1: 'Grass' }),
        'Flamethrower',
        { isCritical: false }
      )
    );
    assert.equal(result.effectiveness, 2);
    assert.equal(result.stabMultiplier, 1.5);
    assert.equal(result.damage, 104);
  });

  test('an unknown move name throws', async () => {
    const calc = makeCalculator();
    await assert.rejects(
      () => calc.calculateDamage(makeAttacker(), makeDefender(), 'Nonexistent Move'),
      /not found/i
    );
  });
});

describe('effective stat calculation with stat stages', () => {
  const calc = makeCalculator();

  test('reads the base stat when there are no modifications', () => {
    assert.equal(calc.getEffectiveStat({ attack: 100 }, 'attack'), 100);
  });

  test('positive stages raise the stat', () => {
    assert.equal(calc.getEffectiveStat({ attack: 100, stat_modifications: { attack: 2 } }, 'attack'), 200);
    assert.equal(calc.getEffectiveStat({ attack: 100, stat_modifications: { attack: 1 } }, 'attack'), 150);
  });

  test('negative stages lower the stat', () => {
    assert.equal(calc.getEffectiveStat({ attack: 100, stat_modifications: { attack: -2 } }, 'attack'), 50);
    assert.equal(calc.getEffectiveStat({ attack: 100, stat_modifications: { attack: -1 } }, 'attack'), 66);
  });

  test('stats never drop below 1', () => {
    assert.equal(calc.getEffectiveStat({ attack: 1, stat_modifications: { attack: -6 } }, 'attack'), 1);
  });

  test('falls back to a default of 50 when the stat is absent', () => {
    assert.equal(calc.getEffectiveStat({}, 'attack'), 50);
  });

  test('honors alternate stat field names', () => {
    assert.equal(calc.getEffectiveStat({ atk_total: 123 }, 'attack'), 123);
    assert.equal(calc.getEffectiveStat({ spa_total: 77 }, 'special_attack'), 77);
  });
});

describe('STAB helper', () => {
  const calc = makeCalculator();

  test('grants STAB on a type match', () => {
    assert.equal(calc.calculateSTAB({ type1: 'Fire' }, { move_type: 'Fire' }), 1.5);
  });

  test('is case insensitive', () => {
    assert.equal(calc.calculateSTAB({ type1: 'fire' }, { move_type: 'FIRE' }), 1.5);
  });

  test('no STAB without a match', () => {
    assert.equal(calc.calculateSTAB({ type1: 'Water' }, { move_type: 'Fire' }), 1);
  });

  test('matches any of several attacker type slots', () => {
    assert.equal(calc.calculateSTAB({ type1: 'Water', type2: 'Fire' }, { move_type: 'Fire' }), 1.5);
  });
});

describe('type effectiveness helper reads up to five slots', () => {
  const calc = makeCalculator();

  test('multiplies across direct type fields', () => {
    assert.equal(calc.calculateTypeEffectiveness({ move_type: 'Fire' }, { type1: 'Grass', type2: 'Bug' }), 4);
  });

  test('reads nested monster_data types too', () => {
    const defender: MonsterData = { type1: 'Grass', monster_data: { type1: 'Water' } };
    assert.equal(calc.calculateTypeEffectiveness({ move_type: 'Fire' }, defender), 1);
  });

  test('unknown move type is treated as neutral', () => {
    assert.equal(calc.calculateTypeEffectiveness({ move_type: 'Shadow' }, { type1: 'Grass' }), 1);
  });
});

describe('healing', () => {
  const calc = makeCalculator();

  test('applies a flat heal amount without overhealing', () => {
    const result = calc.calculateHealing({ max_hp: 100, current_hp: 50 }, { heal_amount: 30 });
    assert.equal(result.healAmount, 30);
    assert.equal(result.newHp, 80);
  });

  test('caps healing at max HP', () => {
    const result = calc.calculateHealing({ max_hp: 100, current_hp: 50 }, { heal_amount: 100 });
    assert.equal(result.healAmount, 50);
    assert.equal(result.newHp, 100);
  });

  test('applies percentage healing', () => {
    const result = calc.calculateHealing({ max_hp: 200, current_hp: 0 }, { heal_percentage: 25 });
    assert.equal(result.healAmount, 50);
  });

  test('defaults to a 20% heal', () => {
    const result = calc.calculateHealing({ max_hp: 100, current_hp: 0 }, {});
    assert.equal(result.healAmount, 20);
  });
});

describe('status damage over time', () => {
  const calc = makeCalculator();

  test('burn deals 1/16 of max HP', () => {
    assert.equal(calc.calculateStatusDamage({ max_hp: 160 }, { type: 'burn', duration: 3 }).damage, 10);
  });

  test('poison deals 1/8 of max HP', () => {
    assert.equal(calc.calculateStatusDamage({ max_hp: 160 }, { type: 'poison', duration: 3 }).damage, 20);
  });

  test('burn on a low-HP monster still deals at least 1', () => {
    assert.equal(calc.calculateStatusDamage({ max_hp: 10 }, { type: 'burn', duration: 3 }).damage, 1);
  });

  test('non-damaging statuses deal no residual damage', () => {
    for (const type of ['paralysis', 'sleep', 'freeze', 'confusion', 'flinch', 'unknown'] as const) {
      const result = calc.calculateStatusDamage({ max_hp: 160 }, { type, duration: 3 });
      assert.equal(result.damage, 0, `${type} should not deal residual damage`);
    }
  });

  test('flags removal when the effect is about to expire', () => {
    assert.equal(calc.calculateStatusDamage({ max_hp: 160 }, { type: 'burn', duration: 1 }).shouldRemove, true);
    assert.equal(calc.calculateStatusDamage({ max_hp: 160 }, { type: 'burn', duration: 3 }).shouldRemove, false);
  });
});

describe('weather modifiers', () => {
  const calc = makeCalculator();

  test('rain boosts Water and weakens Fire', () => {
    assert.equal(calc.calculateWeatherModifier({ move_type: 'Water' }, 'rain'), 1.5);
    assert.equal(calc.calculateWeatherModifier({ move_type: 'Fire' }, 'rain'), 0.5);
  });

  test('sun boosts Fire and weakens Water', () => {
    assert.equal(calc.calculateWeatherModifier({ move_type: 'Fire' }, 'sunny'), 1.5);
    assert.equal(calc.calculateWeatherModifier({ move_type: 'Water' }, 'sunny'), 0.5);
  });

  test('clear and null weather are neutral', () => {
    assert.equal(calc.calculateWeatherModifier({ move_type: 'Fire' }, 'clear'), 1);
    assert.equal(calc.calculateWeatherModifier({ move_type: 'Fire' }, null), 1);
  });
});

describe('terrain and field modifiers', () => {
  const calc = makeCalculator();

  test('terrain boosts its matching type by 1.3x', () => {
    assert.equal(calc.calculateTerrainModifier({ move_type: 'Electric' }, 'electric'), 1.3);
    assert.equal(calc.calculateTerrainModifier({ move_type: 'Grass' }, 'grassy'), 1.3);
    assert.equal(calc.calculateTerrainModifier({ move_type: 'Psychic' }, 'psychic'), 1.3);
    assert.equal(calc.calculateTerrainModifier({ move_type: 'Fire' }, 'grassy'), 1);
  });

  test('water sport and mud sport halve their target types', () => {
    assert.equal(calc.calculateFieldModifier({ move_type: 'Fire' }, ['water_sport']), 0.5);
    assert.equal(calc.calculateFieldModifier({ move_type: 'Electric' }, ['mud_sport']), 0.5);
    assert.equal(calc.calculateFieldModifier({ move_type: 'Water' }, ['water_sport']), 1);
    assert.equal(calc.calculateFieldModifier({ move_type: 'Fire' }, []), 1);
  });
});

describe('weather chip damage', () => {
  const calc = makeCalculator();

  test('sandstorm damages non Rock/Ground/Steel monsters', () => {
    assert.equal(calc.calculateWeatherDamage({ max_hp: 160, type1: 'Fire' }, 'sandstorm').damage, 10);
    assert.equal(calc.calculateWeatherDamage({ max_hp: 160, type1: 'Rock' }, 'sandstorm').damage, 0);
  });

  test('hail damages non Ice monsters', () => {
    assert.equal(calc.calculateWeatherDamage({ max_hp: 160, type1: 'Fire' }, 'hail').damage, 10);
    assert.equal(calc.calculateWeatherDamage({ max_hp: 160, type1: 'Ice' }, 'hail').damage, 0);
  });
});

describe('parsing status effects from move text', () => {
  const calc = makeCalculator();

  test('recognizes known conditions', () => {
    assert.equal(calc.parseStatusEffect('has a chance to burn the target').type, 'burn');
    assert.equal(calc.parseStatusEffect('may paralyze the foe').type, 'paralysis');
    assert.equal(calc.parseStatusEffect('puts the target to sleep').type, 'sleep');
    assert.equal(calc.parseStatusEffect('can cause confusion').type, 'confusion');
  });

  test('unknown or missing text yields the unknown effect', () => {
    assert.equal(calc.parseStatusEffect('deals extra damage').type, 'unknown');
    assert.equal(calc.parseStatusEffect(undefined).type, 'unknown');
  });
});
