import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  getStatStageMultiplier,
  getAccuracyStageMultiplier,
  getRandomDamageFactor,
  checkCriticalHit,
  isValidMoveCategory,
  isValidBattleActionType,
  computeBattleLevelReward,
  LevelRewardConstants,
  BattleConstants,
} from '../src/utils/constants/battle-constants';
import { withRandom } from './helpers';

describe('stat stage multipliers', () => {
  test('neutral stage is 1x', () => {
    assert.equal(getStatStageMultiplier(0), 1);
  });

  test('positive and negative stages follow the (2+n)/2 and 2/(2+n) curves', () => {
    assert.equal(getStatStageMultiplier(1), 1.5);
    assert.equal(getStatStageMultiplier(2), 2);
    assert.equal(getStatStageMultiplier(6), 4);
    assert.equal(getStatStageMultiplier(-1), 2 / 3);
    assert.equal(getStatStageMultiplier(-2), 0.5);
    assert.equal(getStatStageMultiplier(-6), 0.25);
  });

  test('stages clamp to the -6..+6 range', () => {
    assert.equal(getStatStageMultiplier(99), getStatStageMultiplier(6));
    assert.equal(getStatStageMultiplier(-99), getStatStageMultiplier(-6));
  });

  test('accuracy stages use the 3/(3+n) curve', () => {
    assert.equal(getAccuracyStageMultiplier(0), 1);
    assert.equal(getAccuracyStageMultiplier(3), 2);
    assert.equal(getAccuracyStageMultiplier(-3), 0.5);
  });
});

describe('random damage factor', () => {
  test('always falls within the configured range', async () => {
    for (const r of [0, 0.5, 0.999999]) {
      const factor = await withRandom(r, () => getRandomDamageFactor());
      assert.ok(factor >= BattleConstants.RANDOM_FACTOR_MIN);
      assert.ok(factor <= BattleConstants.RANDOM_FACTOR_MAX);
    }
  });

  test('scales linearly with the random roll', async () => {
    assert.equal(await withRandom(0, () => getRandomDamageFactor()), 0.85);
  });
});

describe('critical hit staging', () => {
  test('a roll under the stage rate is a crit', async () => {
    assert.equal(await withRandom(0.01, () => checkCriticalHit(0)), true);
    assert.equal(await withRandom(0.9, () => checkCriticalHit(0)), false);
  });

  test('higher crit stages raise the hit rate', async () => {
    // Stage 1 rate is 1/8 = 0.125.
    assert.equal(await withRandom(0.1, () => checkCriticalHit(1)), true);
    assert.equal(await withRandom(0.2, () => checkCriticalHit(1)), false);
  });

  test('max stage always crits', async () => {
    assert.equal(await withRandom(0.999999, () => checkCriticalHit(4)), true);
  });
});

describe('battle level rewards', () => {
  test('a heavily under-levelled winner earns a large reward', () => {
    // Level 2 beating level 14: BASE(2) + (14-2)*0.4 = 6.8 -> 7.
    assert.equal(computeBattleLevelReward(2, 14), 7);
  });

  test('an over-levelled winner earns the minimum', () => {
    // Level 90 beating level 14 (the reported bug) should award exactly 1.
    assert.equal(computeBattleLevelReward(90, 14), LevelRewardConstants.MIN);
    // Level 24 beating level 14 is still above -> clamps to the minimum.
    assert.equal(computeBattleLevelReward(24, 14), LevelRewardConstants.MIN);
  });

  test('an even matchup awards the base amount', () => {
    assert.equal(computeBattleLevelReward(14, 14), LevelRewardConstants.BASE);
  });

  test('the reward never exceeds the maximum', () => {
    assert.equal(computeBattleLevelReward(1, 100), LevelRewardConstants.MAX);
  });

  test('the reward is trimmed so the winner cannot pass the level cap', () => {
    assert.equal(computeBattleLevelReward(99, 14, 100), 1);
    assert.equal(computeBattleLevelReward(100, 14, 100), 0);
  });

  test('non-finite or non-positive levels fall back to level 1', () => {
    assert.equal(computeBattleLevelReward(NaN, 14), computeBattleLevelReward(1, 14));
    assert.equal(computeBattleLevelReward(2, 0), computeBattleLevelReward(2, 1));
  });
});

describe('validators', () => {
  test('move categories', () => {
    assert.equal(isValidMoveCategory('Physical'), true);
    assert.equal(isValidMoveCategory('Special'), true);
    assert.equal(isValidMoveCategory('Status'), true);
    assert.equal(isValidMoveCategory('Magical'), false);
  });

  test('battle action types', () => {
    assert.equal(isValidBattleActionType('attack'), true);
    assert.equal(isValidBattleActionType('switch'), true);
    assert.equal(isValidBattleActionType('teleport'), false);
  });
});
