import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  BattleAIService,
  type BattleMonster,
  type BattleParticipant,
  type BattleState,
} from '../src/services/adventure/battle-ai.service';
import { makeMove, makeMoveRepository, withRandom } from './helpers';

const MOVES = [
  makeMove({ moveName: 'Tackle', moveType: 'Normal', moveCategory: 'Physical', power: 40 }),
  makeMove({ moveName: 'Scratch', moveType: 'Normal', moveCategory: 'Physical', power: 40 }),
  makeMove({ moveName: 'Pound', moveType: 'Normal', moveCategory: 'Physical', power: 40 }),
  makeMove({ moveName: 'Ember', moveType: 'Fire', moveCategory: 'Special', power: 40 }),
  makeMove({ moveName: 'Water Gun', moveType: 'Water', moveCategory: 'Special', power: 40 }),
];

function makeAI(moves = MOVES): BattleAIService {
  return new BattleAIService(makeMoveRepository(moves));
}

function makeMonster(overrides: Partial<BattleMonster> & Pick<BattleMonster, 'id' | 'participantId' | 'teamSide'>): BattleMonster {
  return {
    name: `Monster ${overrides.id}`,
    level: 50,
    currentHp: 100,
    maxHp: 100,
    isActive: true,
    isFainted: false,
    type1: 'Normal',
    ...overrides,
  };
}

const AI_PARTICIPANT: BattleParticipant = { id: 1, teamSide: 'opponents', isAI: true, trainerName: 'Rival' };

function stateOf(monsters: BattleMonster[]): BattleState {
  return {
    monsters,
    participants: [
      AI_PARTICIPANT,
      { id: 2, teamSide: 'players', isAI: false },
    ],
  };
}

describe('AI attack selection (gym battle brain)', () => {
  test('picks the super-effective STAB move over a neutral move', async () => {
    const ai = makeAI();
    const state = stateOf([
      makeMonster({ id: 10, participantId: 1, teamSide: 'opponents', type1: 'Fire',
        monster_data: { moveset: JSON.stringify(['Tackle', 'Ember']) } }),
      makeMonster({ id: 20, participantId: 2, teamSide: 'players', type1: 'Grass' }),
    ]);

    const action = await withRandom(0.99, () => ai.selectAction(AI_PARTICIPANT, state, 'medium'));

    assert.equal(action.actionType, 'attack');
    assert.equal(action.actionData.moveName, 'Ember');
    assert.equal(action.actionData.targetId, 20);
  });

  test('falls back to Struggle when no known moves resolve', async () => {
    const ai = makeAI();
    const state = stateOf([
      makeMonster({ id: 10, participantId: 1, teamSide: 'opponents',
        monster_data: { moveset: JSON.stringify(['Unknown Signature Move']) } }),
      makeMonster({ id: 20, participantId: 2, teamSide: 'players' }),
    ]);

    const action = await withRandom(0.99, () => ai.selectAction(AI_PARTICIPANT, state, 'medium'));

    assert.equal(action.actionType, 'attack');
    assert.equal(action.actionData.moveName, 'Struggle');
  });

  test('waits when it has no active monster', async () => {
    const ai = makeAI();
    const state = stateOf([
      makeMonster({ id: 10, participantId: 1, teamSide: 'opponents', isActive: false, isFainted: true }),
      makeMonster({ id: 20, participantId: 2, teamSide: 'players' }),
    ]);

    const action = await withRandom(0.99, () => ai.selectAction(AI_PARTICIPANT, state, 'medium'));
    assert.equal(action.actionType, 'wait');
  });

  test('waits when there is no opposing monster to target', async () => {
    const ai = makeAI();
    const state = stateOf([
      makeMonster({ id: 10, participantId: 1, teamSide: 'opponents',
        monster_data: { moveset: JSON.stringify(['Tackle']) } }),
    ]);

    const action = await withRandom(0.99, () => ai.selectAction(AI_PARTICIPANT, state, 'medium'));
    assert.equal(action.actionType, 'wait');
  });
});

describe('AI target selection', () => {
  test('strategically prefers the lower-HP opponent', async () => {
    const ai = makeAI();
    const state = stateOf([
      makeMonster({ id: 10, participantId: 1, teamSide: 'opponents',
        monster_data: { moveset: JSON.stringify(['Tackle']) } }),
      makeMonster({ id: 20, participantId: 2, teamSide: 'players', currentHp: 100, maxHp: 100 }),
      makeMonster({ id: 21, participantId: 2, teamSide: 'players', currentHp: 10, maxHp: 100 }),
    ]);

    const action = await withRandom(0.99, () => ai.selectAction(AI_PARTICIPANT, state, 'medium'));
    assert.equal(action.actionData.targetId, 21);
  });
});

describe('AI action-type decisions', () => {
  test('uses a healing item when badly hurt', async () => {
    const ai = makeAI();
    const state = stateOf([
      makeMonster({ id: 10, participantId: 1, teamSide: 'opponents', currentHp: 20, maxHp: 100,
        monster_data: { moveset: JSON.stringify(['Tackle']) } }),
      makeMonster({ id: 20, participantId: 2, teamSide: 'players' }),
    ]);

    // [selectTarget=strategic, heal-roll passes].
    const action = await withRandom([0.99, 0.1], () => ai.selectAction(AI_PARTICIPANT, state, 'medium'));

    assert.equal(action.actionType, 'item');
    assert.equal(action.actionData.itemName, 'Super Potion');
    assert.equal(action.actionData.targetId, 10);
  });

  test('switches to the healthiest benched monster when critically low', async () => {
    const ai = makeAI();
    const state = stateOf([
      makeMonster({ id: 10, participantId: 1, teamSide: 'opponents', currentHp: 15, maxHp: 100,
        monster_data: { moveset: JSON.stringify(['Tackle']) } }),
      makeMonster({ id: 11, participantId: 1, teamSide: 'opponents', isActive: false, currentHp: 40, maxHp: 100 }),
      makeMonster({ id: 12, participantId: 1, teamSide: 'opponents', isActive: false, currentHp: 90, maxHp: 100 }),
      makeMonster({ id: 20, participantId: 2, teamSide: 'players' }),
    ]);

    // [target=strategic, heal-roll fails, switch-roll passes].
    const action = await withRandom([0.99, 0.9, 0.1], () => ai.selectAction(AI_PARTICIPANT, state, 'medium'));

    assert.equal(action.actionType, 'switch');
    assert.equal(action.actionData.monsterId, 12);
  });
});

describe('difficulty configuration', () => {
  test('exposes the default difficulty tiers', () => {
    const ai = makeAI();
    assert.deepEqual(ai.getDifficultySettings('easy'), {
      randomChance: 0.4, healThreshold: 0.2, switchThreshold: 0.1, typeAdvantageWeight: 0.3,
    });
    assert.equal(ai.getDifficultySettings('hard').typeAdvantageWeight, 0.9);
  });

  test('accepts injected difficulty overrides', () => {
    const ai = new BattleAIService(makeMoveRepository(MOVES), {
      easy: { randomChance: 0, healThreshold: 0, switchThreshold: 0, typeAdvantageWeight: 1 },
    });
    assert.equal(ai.getDifficultySettings('easy').randomChance, 0);
    assert.equal(ai.getDifficultySettings('medium').randomChance, 0.2);
  });

  test('setDifficultySettings merges partial updates', () => {
    const ai = makeAI();
    ai.setDifficultySettings('medium', { randomChance: 0.5 });
    assert.equal(ai.getDifficultySettings('medium').randomChance, 0.5);
    assert.equal(ai.getDifficultySettings('medium').typeAdvantageWeight, 0.6);
  });
});

describe('AI flavor messaging', () => {
  test('substitutes the trainer name into a template', async () => {
    const ai = makeAI();
    const message = await withRandom(0, () =>
      ai.generateAIMessage({ id: 1, teamSide: 'opponents', isAI: true, trainerName: 'Brock' }, {
        actionType: 'attack',
        actionData: {},
      })
    );
    assert.ok(message.includes('Brock'));
    assert.ok(!message.includes('{trainer}'));
  });
});
