import { db } from '../database';
import { MonsterCondition } from '../repositories/prompt.repository';
import { MonsterRepository, MonsterWithTrainer } from '../repositories/monster.repository';

// --- Result types ---

export type AutoConditionResult = {
  monsterId: number;
  monsterName: string;
  trainerId: number;
  trainerName: string;
  effectApplied: Record<string, unknown>;
};

export type EligibleMonster = {
  monsterId: number;
  monsterName: string;
  trainerId: number;
  trainerName: string;
  currentValue: unknown;
  imgLink: string | null;
  species1: string;
  species2: string | null;
  species3: string | null;
  type1: string | null;
  type2: string | null;
  type3: string | null;
  type4: string | null;
  type5: string | null;
  attribute: string | null;
};

export type ConditionResult = {
  conditionId: string;
  conditionType: string;
  applicationMode: 'auto' | 'opt-in';
  label: string;
  autoResults?: AutoConditionResult[];
  eligibleMonsters?: EligibleMonster[];
};

export type OptInSelection = {
  conditionId: string;
  monsterIds: number[];
};

export type ParticipatingMonster = {
  monsterId: number;
  trainerId: number;
};

// --- Service ---

export class MonsterConditionService {
  private monsterRepo: MonsterRepository;

  constructor() {
    this.monsterRepo = new MonsterRepository();
  }

  /**
   * Evaluate all conditions against participating monsters.
   * Auto-apply conditions are applied immediately.
   * Opt-in conditions return eligible monsters for user selection.
   */
  async evaluateAndApply(
    conditions: MonsterCondition[],
    participatingMonsters: ParticipatingMonster[]
  ): Promise<ConditionResult[]> {
    if (!conditions.length || !participatingMonsters.length) {return [];}

    // Load full monster data for all participants
    const monsterMap = await this.loadMonsters(participatingMonsters);
    const results: ConditionResult[] = [];

    for (const condition of conditions) {
      const monsters = participatingMonsters
        .map(pm => monsterMap.get(pm.monsterId))
        .filter((m): m is MonsterWithTrainer => !!m);

      const result = await this.evaluateCondition(condition, monsters);
      if (result) {
        // Auto-apply conditions get applied immediately
        if (condition.applicationMode === 'auto' && result.autoResults) {
          await this.applyAutoResults(condition, result.autoResults);
        }
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Apply user's opt-in selections for conditions.
   */
  async applyOptInSelections(
    conditions: MonsterCondition[],
    selections: OptInSelection[]
  ): Promise<ConditionResult[]> {
    const results: ConditionResult[] = [];

    for (const selection of selections) {
      const condition = conditions.find(c => c.id === selection.conditionId);
      if (condition?.applicationMode !== 'opt-in') {continue;}

      const result = await this.applyOptIn(condition, selection.monsterIds);
      if (result) {results.push(result);}
    }

    return results;
  }

  // --- Private: condition evaluation dispatch ---

  private async evaluateCondition(
    condition: MonsterCondition,
    monsters: MonsterWithTrainer[]
  ): Promise<ConditionResult | null> {
    switch (condition.conditionType) {
      case 'type_bonus':
        return this.evaluateTypeBonus(condition, monsters);
      case 'can_talk_progression':
        return this.evaluateCanTalkProgression(condition, monsters);
      default:
        return null;
    }
  }

  // --- Type Bonus (auto-apply) ---

  private evaluateTypeBonus(
    condition: MonsterCondition,
    monsters: MonsterWithTrainer[]
  ): ConditionResult {
    const targetTypes = (condition.criteria.monsterTypes as string[]) || [];
    const normalizedTargets = targetTypes.map(t => t.toLowerCase());
    const bonusLevels = (condition.effect.bonusLevels as number) || 0;
    const bonusCoins = (condition.effect.bonusCoins as number) || 0;

    const autoResults: AutoConditionResult[] = [];

    for (const monster of monsters) {
      const monsterTypes = [
        monster.type1, monster.type2, monster.type3, monster.type4, monster.type5
      ].filter((t): t is string => !!t).map(t => t.toLowerCase());

      const hasMatchingType = monsterTypes.some(t => normalizedTargets.includes(t));
      if (hasMatchingType) {
        const effectApplied: Record<string, unknown> = {};
        if (bonusLevels > 0) {effectApplied.bonusLevels = bonusLevels;}
        if (bonusCoins > 0) {effectApplied.bonusCoins = bonusCoins;}

        autoResults.push({
          monsterId: monster.id,
          monsterName: monster.name,
          trainerId: monster.trainer_id,
          trainerName: monster.trainer_name,
          effectApplied,
        });
      }
    }

    return {
      conditionId: condition.id,
      conditionType: condition.conditionType,
      applicationMode: 'auto',
      label: condition.label,
      autoResults,
    };
  }

  private async applyAutoResults(
    _condition: MonsterCondition,
    autoResults: AutoConditionResult[]
  ): Promise<void> {
    for (const result of autoResults) {
      const bonusLevels = (result.effectApplied.bonusLevels as number) || 0;
      const bonusCoins = (result.effectApplied.bonusCoins as number) || 0;

      if (bonusLevels > 0) {
        await this.monsterRepo.addLevels(result.monsterId, bonusLevels);
      }
      if (bonusCoins > 0) {
        await db.query(
          'UPDATE trainers SET currency_amount = currency_amount + $1, total_earned_currency = total_earned_currency + $1 WHERE id = $2',
          [bonusCoins, result.trainerId]
        );
      }
    }
  }

  // --- Can Talk Progression (opt-in) ---

  private evaluateCanTalkProgression(
    condition: MonsterCondition,
    monsters: MonsterWithTrainer[]
  ): ConditionResult {
    const requiredLevel = (condition.criteria.requiredCanTalkLevel as number) ?? 0;

    const eligibleMonsters: EligibleMonster[] = monsters
      .filter(m => (m.can_talk ?? 0) === requiredLevel)
      .map(m => ({
        monsterId: m.id,
        monsterName: m.name,
        trainerId: m.trainer_id,
        trainerName: m.trainer_name,
        currentValue: m.can_talk ?? 0,
        imgLink: m.img_link,
        species1: m.species1,
        species2: m.species2,
        species3: m.species3,
        type1: m.type1,
        type2: m.type2,
        type3: m.type3,
        type4: m.type4,
        type5: m.type5,
        attribute: m.attribute,
      }));

    return {
      conditionId: condition.id,
      conditionType: condition.conditionType,
      applicationMode: 'opt-in',
      label: condition.label,
      eligibleMonsters,
    };
  }

  private async applyOptIn(
    condition: MonsterCondition,
    monsterIds: number[]
  ): Promise<ConditionResult | null> {
    switch (condition.conditionType) {
      case 'can_talk_progression':
        return this.applyCanTalkProgression(condition, monsterIds);
      default:
        return null;
    }
  }

  private async applyCanTalkProgression(
    condition: MonsterCondition,
    monsterIds: number[]
  ): Promise<ConditionResult> {
    const requiredLevel = (condition.criteria.requiredCanTalkLevel as number) ?? 0;
    const newLevel = (condition.effect.newCanTalkLevel as number) ?? requiredLevel + 1;

    const autoResults: AutoConditionResult[] = [];

    for (const monsterId of monsterIds) {
      const monster = await this.monsterRepo.findById(monsterId);
      if (!monster) {continue;}

      // Verify monster still qualifies (hasn't been upgraded already)
      if ((monster.can_talk ?? 0) !== requiredLevel) {continue;}

      await this.monsterRepo.update(monsterId, { canTalk: newLevel });

      autoResults.push({
        monsterId: monster.id,
        monsterName: monster.name,
        trainerId: monster.trainer_id,
        trainerName: monster.trainer_name,
        effectApplied: { newCanTalkLevel: newLevel },
      });
    }

    return {
      conditionId: condition.id,
      conditionType: condition.conditionType,
      applicationMode: 'opt-in',
      label: condition.label,
      autoResults,
    };
  }

  // --- Helpers ---

  private async loadMonsters(
    participants: ParticipatingMonster[]
  ): Promise<Map<number, MonsterWithTrainer>> {
    const map = new Map<number, MonsterWithTrainer>();
    for (const p of participants) {
      const monster = await this.monsterRepo.findById(p.monsterId);
      if (monster) {map.set(p.monsterId, monster);}
    }
    return map;
  }
}
