import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  StatusMoveService,
  SPECIAL_DAMAGE_MOVES,
  type StatusMoveResult,
  type SpecialDamageMoveResult,
} from '../src/services/adventure/status-move.service';
import {
  ALL_STATUS_MOVES,
  STAT_BUFF_DEBUFF_MOVES,
  STATUS_AFFLICTION_MOVES,
  HEALING_MOVES,
  getAllStatusMoveNames,
} from '../src/utils/constants/monster-status-moves';
import { makeStatusMoveMocks, makeStatusMonster, withRandom } from './helpers';

const BATTLE_STATE = { weather: 'sunny' as const, terrain: 'grassy', turn: 1 };

function makeService(opts: { hasStatus?: boolean } = {}): { service: StatusMoveService; mocks: ReturnType<typeof makeStatusMoveMocks> } {
  const mocks = makeStatusMoveMocks(opts);
  return { service: new StatusMoveService(mocks.manager, mocks.repo, mocks.log), mocks };
}

function attackerFixture() {
  return makeStatusMonster({
    id: 1,
    name: 'Attacker',
    current_hp: 100,
    max_hp: 200,
    status_effects: [{ type: 'poison', duration: 3 }],
    monster_data: { type1: 'Normal', type2: 'Flying', gender: 'male' },
  });
}

function targetFixture() {
  return makeStatusMonster({
    id: 2,
    name: 'Target',
    current_hp: 150,
    max_hp: 200,
    monster_data: { type1: 'Water', gender: 'female' },
  });
}

function asStatusResult(result: StatusMoveResult | SpecialDamageMoveResult | null): StatusMoveResult {
  assert.notEqual(result, null);
  assert.ok(result);
  assert.ok(!('isSpecialDamageMove' in result), 'expected a StatusMoveResult, got a special damage result');
  return result as StatusMoveResult;
}

describe('every status move executes and produces a result', () => {
  for (const name of getAllStatusMoveNames()) {
    test(name, async () => {
      const { service } = makeService();
      const result = await withRandom(0, () =>
        service.processStatusMove({ move_name: name }, attackerFixture(), targetFixture(), 1, BATTLE_STATE)
      );
      assert.notEqual(result, null, `${name} resolved to no handler (returned null)`);
      assert.ok(result);
      const r = result as StatusMoveResult;
      assert.equal(r.isStatusMove, true, `${name} did not report isStatusMove`);
      assert.equal(typeof r.message, 'string');
      assert.ok(r.message.length > 0, `${name} produced an empty message`);
      assert.equal(r.damage, 0, `${name} unexpectedly reported direct damage`);
    });
  }
});

describe('stat moves apply and report the right stat changes', () => {
  test('Growl lowers the opponent Attack and persists it', async () => {
    const { service, mocks } = makeService();
    const target = targetFixture();
    const result = asStatusResult(
      await withRandom(0, () => service.processStatusMove({ move_name: 'Growl' }, attackerFixture(), target, 1))
    );
    assert.deepEqual(result.statChanges, STAT_BUFF_DEBUFF_MOVES['Growl']!.stats);
    const update = mocks.calls.update.at(-1);
    assert.ok(update);
    assert.equal(update.id, target.id);
    const mods = (update.data.monster_data as { stat_modifications: Record<string, number> }).stat_modifications;
    assert.equal(mods.attack, -1);
  });

  test('Swords Dance sharply raises the user Attack', async () => {
    const { service, mocks } = makeService();
    const attacker = attackerFixture();
    const result = asStatusResult(
      await withRandom(0, () => service.processStatusMove({ move_name: 'Swords Dance' }, attacker, targetFixture(), 1))
    );
    assert.deepEqual(result.statChanges, { attack: 2 });
    const update = mocks.calls.update.at(-1);
    assert.ok(update);
    assert.equal(update.id, attacker.id);
    const mods = (update.data.monster_data as { stat_modifications: Record<string, number> }).stat_modifications;
    assert.equal(mods.attack, 2);
  });

  test('stat stages accumulate on top of existing modifications and clamp at +6', async () => {
    const { service } = makeService();
    const attacker = attackerFixture();
    attacker.stat_modifications = { attack: 5 };
    const result = asStatusResult(
      await withRandom(0, () => service.processStatusMove({ move_name: 'Swords Dance' }, attacker, targetFixture(), 1))
    );
    // +5 existing plus +2 from Swords Dance clamps to +6.
    assert.equal(attacker.stat_modifications.attack, 6);
    assert.deepEqual(result.statChanges, { attack: 2 });
  });
});

describe('status affliction moves apply the declared condition', () => {
  test('Toxic badly poisons the opponent', async () => {
    const { service, mocks } = makeService();
    const target = targetFixture();
    const expected = STATUS_AFFLICTION_MOVES['Toxic']!;
    const result = asStatusResult(
      await withRandom(0, () => service.processStatusMove({ move_name: 'Toxic' }, attackerFixture(), target, 1))
    );
    assert.equal(result.statusEffect, expected.statusEffect);
    const applied = mocks.calls.applyStatusEffect.at(-1);
    assert.ok(applied);
    assert.equal(applied.effect, expected.statusEffect);
    assert.equal(applied.duration, expected.duration);
    assert.equal(applied.target?.id, target.id);
  });

  test('low-accuracy Hypnosis still lands on a guaranteed roll', async () => {
    const { service, mocks } = makeService();
    const result = asStatusResult(
      await withRandom(0, () => service.processStatusMove({ move_name: 'Hypnosis' }, attackerFixture(), targetFixture(), 1))
    );
    assert.equal(result.hits, true);
    assert.equal(result.statusEffect, STATUS_AFFLICTION_MOVES['Hypnosis']!.statusEffect);
    assert.equal(mocks.calls.applyStatusEffect.length, 1);
  });

  test('Hypnosis misses on an unlucky roll', async () => {
    const { service, mocks } = makeService();
    // accuracy 60 -> a roll of 90 misses.
    const result = asStatusResult(
      await withRandom(0.9, () => service.processStatusMove({ move_name: 'Hypnosis' }, attackerFixture(), targetFixture(), 1))
    );
    assert.equal(result.hits, false);
    assert.equal(mocks.calls.applyStatusEffect.length, 0);
    assert.match(result.message, /missed/i);
  });

  test('Yawn queues a delayed sleep rather than an immediate one', async () => {
    const { service, mocks } = makeService();
    const result = asStatusResult(
      await withRandom(0, () => service.processStatusMove({ move_name: 'Yawn' }, attackerFixture(), targetFixture(), 1))
    );
    assert.equal((result.additionalEffects as { delayedStatus: string }).delayedStatus, STATUS_AFFLICTION_MOVES['Yawn']!.statusEffect);
    const applied = mocks.calls.applyStatusEffect.at(-1);
    assert.ok(applied);
    assert.equal(applied.effect, 'drowsy');
  });
});

describe('healing moves restore HP', () => {
  test('Recover heals half of max HP', async () => {
    const { service, mocks } = makeService();
    const attacker = attackerFixture();
    const result = asStatusResult(
      await withRandom(0, () => service.processStatusMove({ move_name: 'Recover' }, attacker, targetFixture(), 1))
    );
    // Recover: floor(max_hp * 0.5) = 100.
    assert.equal(result.healing, 100);
    const heal = mocks.calls.heal.at(-1);
    assert.ok(heal);
    assert.equal(heal.id, attacker.id);
    assert.equal(heal.amount, 100);
  });

  test('Rest fully heals and puts the user to sleep', async () => {
    const { service, mocks } = makeService();
    const attacker = attackerFixture();
    const result = asStatusResult(
      await withRandom(0, () => service.processStatusMove({ move_name: 'Rest' }, attacker, targetFixture(), 1))
    );
    assert.equal(result.healing, attacker.max_hp);
    const applied = mocks.calls.applyStatusEffect.at(-1);
    assert.ok(applied);
    assert.equal(applied.effect, HEALING_MOVES['Rest']!.statusEffect);
    assert.equal(applied.duration, 2);
  });
});

describe('other moves log a system message', () => {
  test('Splash does nothing but is still logged', async () => {
    const { service, mocks } = makeService();
    const result = asStatusResult(
      await withRandom(0, () => service.processStatusMove({ move_name: 'Splash' }, attackerFixture(), targetFixture(), 1))
    );
    assert.match(result.message, /nothing happened/i);
    assert.equal(mocks.calls.logSystem.length, 1);
  });
});

describe('special damage moves', () => {
  for (const name of Object.keys(SPECIAL_DAMAGE_MOVES)) {
    test(`${name} defers to the damage pipeline`, async () => {
      const { service } = makeService();
      const result = await withRandom(0, () =>
        service.processStatusMove({ move_name: name }, attackerFixture(), targetFixture(), 1)
      );
      assert.ok(result);
      assert.ok('isSpecialDamageMove' in result, `${name} did not route to special damage handling`);
      const special = result as SpecialDamageMoveResult;
      assert.equal(special.isSpecialDamageMove, true);
      assert.equal(special.proceedWithDamage, true);
      assert.ok(special.baseMessage.length > 0);
    });
  }

  test('Leech Life drains a percentage of the damage dealt', async () => {
    const { service, mocks } = makeService();
    const attacker = attackerFixture();
    const { effectMessage, healing } = await service.applySpecialDamageEffects(
      SPECIAL_DAMAGE_MOVES['Leech Life']!,
      attacker,
      targetFixture(),
      40,
      1
    );
    assert.equal(healing, 20); // floor(40 * 50%)
    assert.equal(mocks.calls.heal.at(-1)?.amount, 20);
    assert.match(effectMessage, /recovered 20 HP/);
  });

  test('Bite flinches on a lucky roll and does not on an unlucky one', async () => {
    const flinch = await (async () => {
      const { service, mocks } = makeService();
      // flinchChance 30 -> roll of 0 flinches.
      const out = await withRandom(0, () =>
        service.applySpecialDamageEffects(SPECIAL_DAMAGE_MOVES['Bite']!, attackerFixture(), targetFixture(), 30, 1)
      );
      return { out, mocks };
    })();
    assert.match(flinch.out.effectMessage, /flinched/i);
    assert.equal(flinch.mocks.calls.applyStatusEffect.at(-1)?.effect, 'flinch');

    const noFlinch = await (async () => {
      const { service, mocks } = makeService();
      const out = await withRandom(0.99, () =>
        service.applySpecialDamageEffects(SPECIAL_DAMAGE_MOVES['Bite']!, attackerFixture(), targetFixture(), 30, 1)
      );
      return { out, mocks };
    })();
    assert.equal(noFlinch.out.effectMessage, '');
    assert.equal(noFlinch.mocks.calls.applyStatusEffect.length, 0);
  });

  test('Bullet Seed reports between min and max hits', async () => {
    const { service } = makeService();
    const min = await withRandom(0, () =>
      service.applySpecialDamageEffects(SPECIAL_DAMAGE_MOVES['Bullet Seed']!, attackerFixture(), targetFixture(), 10, 1)
    );
    assert.match(min.effectMessage, /Hit 2 time/);
    const max = await withRandom(0.999999, () =>
      service.applySpecialDamageEffects(SPECIAL_DAMAGE_MOVES['Bullet Seed']!, attackerFixture(), targetFixture(), 10, 1)
    );
    assert.match(max.effectMessage, /Hit 5 time/);
  });

  test('Dig announces its second-turn strike', async () => {
    const { service } = makeService();
    const out = await service.applySpecialDamageEffects(
      SPECIAL_DAMAGE_MOVES['Dig']!,
      attackerFixture(),
      targetFixture(),
      50,
      1
    );
    assert.match(out.effectMessage, /emerged from underground/i);
  });
});
