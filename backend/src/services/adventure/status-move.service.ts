/**
 * Status Move Service
 * Handles all status move execution logic for the battle system
 */

import {
  ALL_STATUS_MOVES,
  STAT_BUFF_DEBUFF_MOVES,
  STATUS_AFFLICTION_MOVES,
  HEALING_MOVES,
  OTHER_STATUS_MOVES,
  StatusMoveDefinition,
  StatBuffDebuffMove,
  StatusAfflictionMove,
  HealingMove,
  OtherStatusMove,
  StatusMoveTarget,
  StatChanges,
} from '../../utils/constants/monster-status-moves';
import { StatusEffectValue } from '../../utils/constants/status-effects';
import { WeatherValue } from '../../utils/constants/weather-terrain';

// ============================================================================
// Types
// ============================================================================

/**
 * Battle monster for status move processing
 */
export interface StatusMoveBattleMonster {
  id: number;
  name: string;
  current_hp: number;
  max_hp: number;
  monster_data?: {
    type1?: string | null;
    type2?: string | null;
    gender?: string | null;
    ability?: string | null;
    stat_modifications?: Record<string, number>;
    held_item?: string | null;
    [key: string]: unknown;
  };
  stat_modifications?: Record<string, number>;
  status_effects?: StatusEffect[];
  held_item?: string | null;
  moves?: MoveInfo[];
  lastMoveUsed?: string | null;
}

/**
 * Status effect on a monster
 */
export interface StatusEffect {
  type: string;
  duration: number;
  stacks?: number;
  data?: Record<string, unknown>;
}

/**
 * Move information
 */
export interface MoveInfo {
  move_name: string;
  type?: string;
  accuracy?: number;
  power?: number;
  pp?: number;
}

/**
 * Move data for processing
 */
export interface StatusMoveData {
  move_name: string;
  accuracy?: number;
  power?: number;
  type?: string;
}

/**
 * Battle state for context
 */
export interface BattleState {
  weather?: WeatherValue;
  terrain?: string;
  turn?: number;
}

/**
 * Status move result
 */
export interface StatusMoveResult {
  hits: boolean;
  damage: number;
  healing?: number;
  message: string;
  isStatusMove: boolean;
  statChanges?: StatChanges;
  statusEffect?: StatusEffectValue;
  additionalEffects?: Record<string, unknown>;
  requiresSwitchOut?: boolean;
  userFaints?: boolean;
}

/**
 * Special damage move result
 */
export interface SpecialDamageMoveResult {
  isSpecialDamageMove: boolean;
  moveConfig: Record<string, unknown>;
  specialEffects: Record<string, unknown>;
  proceedWithDamage: boolean;
  baseMessage: string;
}

/**
 * Status effect manager interface (to be implemented separately)
 */
export interface IStatusEffectManager {
  applyStatusEffect(
    battleId: number,
    target: StatusMoveBattleMonster | null,
    effect: string,
    duration: number,
    data?: Record<string, unknown>
  ): Promise<{ success: boolean; message: string }>;
  hasStatusEffect(monster: StatusMoveBattleMonster, effect: string): boolean;
  removeStatusEffect(
    battleId: number,
    monster: StatusMoveBattleMonster,
    effect: string
  ): Promise<void>;
  removeAllStatusEffects(battleId: number, monster: StatusMoveBattleMonster): Promise<void>;
  cureAllStatusEffects(battleId: number, monster: StatusMoveBattleMonster): Promise<void>;
}

/**
 * Battle monster repository interface
 */
export interface IBattleMonsterRepository {
  update(
    id: number,
    data: { monster_data?: Record<string, unknown>; current_hp?: number; is_fainted?: boolean }
  ): Promise<void>;
  dealDamage(id: number, damage: number): Promise<void>;
  heal(id: number, amount: number): Promise<{ heal_amount: number }>;
}

/**
 * Battle log interface
 */
export interface IBattleLog {
  logSystem(battleId: number, message: string): Promise<void>;
}

// ============================================================================
// Special Damage Moves (with secondary effects)
// ============================================================================

export interface SpecialDamageMove {
  type: string;
  target: string;
  healPercent?: number;
  minHits?: number;
  maxHits?: number;
  statusEffect?: string;
  duration?: number;
  flinchChance?: number;
  firstTurnMessage?: (user: string) => string;
  secondTurnMessage?: (user: string, target: string) => string;
  message: (user: string, target: string, ...args: unknown[]) => string;
}

const SPECIAL_DAMAGE_MOVES: Record<string, SpecialDamageMove> = {
  'Leech Life': {
    type: 'damage_heal',
    target: 'opponent',
    healPercent: 50,
    message: (user, target, damage, healing) =>
      `${user} used Leech Life! ${target} lost ${damage} HP! ${user} recovered ${healing} HP!`,
  },
  'Bullet Seed': {
    type: 'multi_hit',
    target: 'opponent',
    minHits: 2,
    maxHits: 5,
    message: (user, _target, hits) => `${user} used Bullet Seed! Hit ${hits} time(s)!`,
  },
  Dig: {
    type: 'two_turn',
    target: 'opponent',
    firstTurnMessage: (user) => `${user} burrowed underground!`,
    secondTurnMessage: (user, target) => `${user} emerged from underground and attacked ${target}!`,
    message: (user, target) => `${user} attacked ${target}!`,
  },
  Bounce: {
    type: 'two_turn',
    target: 'opponent',
    firstTurnMessage: (user) => `${user} bounced high into the air!`,
    secondTurnMessage: (user, target) => `${user} came down and attacked ${target}!`,
    message: (user, target) => `${user} attacked ${target}!`,
  },
  Fly: {
    type: 'two_turn',
    target: 'opponent',
    firstTurnMessage: (user) => `${user} flew high into the sky!`,
    secondTurnMessage: (user, target) => `${user} dove down and attacked ${target}!`,
    message: (user, target) => `${user} attacked ${target}!`,
  },
  Bite: {
    type: 'damage_flinch',
    target: 'opponent',
    flinchChance: 30,
    message: (user, target, flinched) =>
      flinched
        ? `${user} used Bite! ${target} flinched and couldn't move!`
        : `${user} used Bite!`,
  },
  Crunch: {
    type: 'damage_flinch',
    target: 'opponent',
    flinchChance: 20,
    message: (user, target, flinched) =>
      flinched
        ? `${user} used Crunch! ${target} flinched and couldn't move!`
        : `${user} used Crunch!`,
  },
};

// ============================================================================
// Service Class
// ============================================================================

export class StatusMoveService {
  private statusEffectManager: IStatusEffectManager;
  private battleMonsterRepo: IBattleMonsterRepository;
  private battleLog: IBattleLog;

  constructor(
    statusEffectManager: IStatusEffectManager,
    battleMonsterRepo: IBattleMonsterRepository,
    battleLog: IBattleLog
  ) {
    this.statusEffectManager = statusEffectManager;
    this.battleMonsterRepo = battleMonsterRepo;
    this.battleLog = battleLog;
  }

  // ==========================================================================
  // Main Entry Point
  // ==========================================================================

  /**
   * Process a status move and execute its effects
   * @param move - Move data
   * @param attacker - Attacking monster
   * @param target - Target monster
   * @param battleId - Battle ID
   * @param battleState - Current battle state
   * @returns Status move result or null if not a status move
   */
  async processStatusMove(
    move: StatusMoveData,
    attacker: StatusMoveBattleMonster,
    target: StatusMoveBattleMonster,
    battleId: number,
    battleState?: BattleState
  ): Promise<StatusMoveResult | SpecialDamageMoveResult | null> {
    const moveName = move.move_name;

    // Check stat buff/debuff moves
    if (STAT_BUFF_DEBUFF_MOVES[moveName]) {
      return this.executeStatMove(
        STAT_BUFF_DEBUFF_MOVES[moveName] as StatBuffDebuffMove,
        move,
        attacker,
        target,
        battleId
      );
    }

    // Check status affliction moves
    if (STATUS_AFFLICTION_MOVES[moveName]) {
      return this.executeStatusAfflictionMove(
        STATUS_AFFLICTION_MOVES[moveName] as StatusAfflictionMove,
        move,
        attacker,
        target,
        battleId
      );
    }

    // Check healing moves
    if (HEALING_MOVES[moveName]) {
      return this.executeHealingMove(
        HEALING_MOVES[moveName] as HealingMove,
        move,
        attacker,
        target,
        battleId,
        battleState
      );
    }

    // Check other moves
    if (OTHER_STATUS_MOVES[moveName]) {
      return this.executeOtherMove(
        OTHER_STATUS_MOVES[moveName] as OtherStatusMove,
        move,
        attacker,
        target,
        battleId,
        battleState
      );
    }

    // Check special damage moves
    if (SPECIAL_DAMAGE_MOVES[moveName]) {
      return this.executeSpecialDamageMove(SPECIAL_DAMAGE_MOVES[moveName], move, attacker, target);
    }

    // Not a status move
    return null;
  }

  /**
   * Check if a move is a status move
   */
  isStatusMove(moveName: string): boolean {
    return moveName in ALL_STATUS_MOVES || moveName in SPECIAL_DAMAGE_MOVES;
  }

  // ==========================================================================
  // Stat Buff/Debuff Moves
  // ==========================================================================

  /**
   * Execute a stat buff/debuff move
   */
  private async executeStatMove(
    moveConfig: StatBuffDebuffMove,
    move: StatusMoveData,
    attacker: StatusMoveBattleMonster,
    target: StatusMoveBattleMonster,
    battleId: number
  ): Promise<StatusMoveResult | null> {
    // Validate moveConfig
    if (!moveConfig || typeof moveConfig !== 'object') {
      console.error(`Invalid moveConfig for move "${move.move_name}":`, moveConfig);
      return null;
    }

    // Check if move hits
    const accuracy = move.accuracy ?? 100;
    const hits = Math.random() * 100 <= accuracy;

    if (!hits) {
      return {
        hits: false,
        damage: 0,
        message: `${attacker.name}'s ${move.move_name} missed!`,
        isStatusMove: true,
      };
    }

    // Determine actual target
    const actualTarget = moveConfig.target === StatusMoveTarget.SELF ? attacker : target;
    const targetName = actualTarget.name;
    const userName = attacker.name;

    // Apply stat changes
    const statModifications = this.getStatModifications(actualTarget);

    // Check if moveConfig.stats exists
    if (moveConfig.stats && typeof moveConfig.stats === 'object') {
      for (const [stat, change] of Object.entries(moveConfig.stats)) {
        statModifications[stat] ??= 0;
        statModifications[stat] = Math.max(-6, Math.min(6, statModifications[stat] + change));
      }
    } else if (!this.handleSpecialStatMoveType(moveConfig.type)) {
      // No stats and not a special type - fallback to normal attack
      return null;
    }

    // Update monster with stat modifications
    await this.battleMonsterRepo.update(actualTarget.id, {
      monster_data: {
        ...actualTarget.monster_data,
        stat_modifications: statModifications,
      },
    });

    // Generate message
    const message = this.generateMoveMessage(moveConfig, userName, targetName);
    const additionalEffects: Record<string, unknown> = {};

    // Handle special move types
    await this.handleSpecialStatMoveEffects(
      moveConfig,
      move,
      attacker,
      target,
      actualTarget,
      battleId,
      statModifications,
      additionalEffects,
      message
    );

    return {
      hits: true,
      damage: 0,
      message,
      isStatusMove: true,
      statChanges: moveConfig.stats,
      additionalEffects,
      requiresSwitchOut: additionalEffects.switchOut === true,
    };
  }

  /**
   * Check if a stat move type has special handling
   */
  private handleSpecialStatMoveType(type: string): boolean {
    const specialTypes = [
      'stat_buff_confuse',
      'critical_buff',
      'stat_buff_max_hp_cost',
      'conditional_stat_debuff',
      'stat_debuff_status',
      'stat_swap_all',
      'stat_debuff_switch',
      'stat_buff_hp_cost',
      'stat_debuff_priority',
      'ally_stat_buff',
      'stat_mixed_self',
      'stat_swap',
      'stat_swap_specific',
      'stat_swap_self',
      'stat_average',
      'stat_buff_clear_debuffs',
      'stat_buff_stockpile',
      'stat_debuff_gender',
      'stat_buff_random',
      'stat_buff_consume_berry',
      'stat_copy',
      'type_specific_buff',
      'charge_stat_buff',
      'stat_buff_trap_self',
      'trap_debuff',
      'curse_conditional',
      'stat_mixed_opponent',
      'stat_reset',
    ];
    return specialTypes.includes(type);
  }

  /**
   * Handle special stat move effects
   */
  private async handleSpecialStatMoveEffects(
    moveConfig: StatBuffDebuffMove,
    _move: StatusMoveData,
    attacker: StatusMoveBattleMonster,
    target: StatusMoveBattleMonster,
    actualTarget: StatusMoveBattleMonster,
    battleId: number,
    statModifications: Record<string, number>,
    additionalEffects: Record<string, unknown>,
    _message: string
  ): Promise<void> {

    switch (moveConfig.type) {
      case 'stat_buff_confuse':
        // Flatter/Swagger - apply confusion after stat boost
        if (moveConfig.statusEffect) {
          await this.statusEffectManager.applyStatusEffect(
            battleId,
            actualTarget,
            moveConfig.statusEffect,
            moveConfig.duration ?? 3
          );
          additionalEffects.confusion = true;
        }
        break;

      case 'critical_buff':
        // Focus Energy - apply critical boost effect
        if (moveConfig.effect) {
          await this.statusEffectManager.applyStatusEffect(
            battleId,
            actualTarget,
            moveConfig.effect,
            moveConfig.duration ?? 5
          );
          additionalEffects.criticalBuff = true;
        }
        break;

      case 'stat_buff_max_hp_cost':
        // Belly Drum - maximize Attack at cost of half HP
        if (moveConfig.hpCost) {
          const hpCost = Math.floor(actualTarget.max_hp * moveConfig.hpCost);
          if (actualTarget.current_hp <= hpCost) {
            return; // Move fails - handled in caller
          }
          await this.battleMonsterRepo.dealDamage(actualTarget.id, hpCost);
          statModifications.attack = 6;
          additionalEffects.hpCost = hpCost;
          additionalEffects.maximizedAttack = true;
        }
        break;

      case 'conditional_stat_debuff':
        // Venom Drench - only works on poisoned targets
        if (moveConfig.condition === 'poison') {
          const isPoisoned = this.statusEffectManager.hasStatusEffect(actualTarget, 'poison');
          if (!isPoisoned) {
            additionalEffects.failed = true;
          } else {
            additionalEffects.conditionalDebuff = moveConfig.condition;
          }
        }
        break;

      case 'stat_debuff_status':
        // Toxic Thread - apply stat debuff and poison
        if (moveConfig.statusEffect) {
          await this.statusEffectManager.applyStatusEffect(
            battleId,
            actualTarget,
            moveConfig.statusEffect,
            moveConfig.duration ?? 4
          );
          additionalEffects.statusAffliction = moveConfig.statusEffect;
        }
        break;

      case 'stat_swap_all':
        // Heart Swap - swap all stat modifications
        await this.handleHeartSwap(attacker, actualTarget, additionalEffects);
        break;

      case 'stat_debuff_switch':
        // Parting Shot - switch out after debuff
        additionalEffects.switchOut = true;
        break;

      case 'stat_buff_hp_cost':
        // Clangorous Soul - pay HP cost for stat boosts
        if (moveConfig.hpCost) {
          const hpCost = Math.floor(actualTarget.max_hp * moveConfig.hpCost);
          if (actualTarget.current_hp <= hpCost) {
            additionalEffects.failed = true;
          } else {
            await this.battleMonsterRepo.dealDamage(actualTarget.id, hpCost);
            additionalEffects.hpCost = hpCost;
          }
        }
        break;

      case 'stat_buff_trap_self':
        // No Retreat - trap self after stat boost
        await this.statusEffectManager.applyStatusEffect(battleId, actualTarget, 'trapped', -1);
        additionalEffects.trapSelf = true;
        break;

      case 'trap_debuff':
        // Octolock - trap target and apply ongoing debuffs
        await this.statusEffectManager.applyStatusEffect(
          battleId,
          actualTarget,
          'octolock',
          moveConfig.duration ?? 5
        );
        additionalEffects.trapDebuff = true;
        break;

      case 'curse_conditional':
        // Curse - different effects for Ghost vs non-Ghost types
        await this.handleCurse(moveConfig, attacker, target, battleId, additionalEffects);
        break;

      case 'stat_reset':
        // Haze - reset all stat changes
        if (moveConfig.resetAllStats) {
          await this.handleHaze(attacker, target, additionalEffects);
        }
        break;

      case 'stat_debuff_gender': {
        // Captivate - only affects opposite gender
        const result = this.checkGenderRequirement(attacker, target);
        if (!result) {
          additionalEffects.failed = true;
        } else {
          additionalEffects.genderBased = true;
        }
        break;
      }

      case 'stat_buff_random': {
        // Acupressure - boost random stat sharply
        if (moveConfig.possibleStats && moveConfig.possibleStats.length > 0) {
          const randomStat =
            moveConfig.possibleStats[Math.floor(Math.random() * moveConfig.possibleStats.length)];
          if (randomStat) {
            for (const stat of Object.keys(statModifications)) {
              delete statModifications[stat];
            }
            statModifications[randomStat] =
              (statModifications[randomStat] ?? 0) + (moveConfig.randomStatBoost ?? 2);
            additionalEffects.randomStatBoosted = randomStat;
          }
        }
        break;
      }

      case 'stat_buff_consume_berry': {
        // Stuff Cheeks - requires berry to work
        const hasBerry = actualTarget.held_item?.toLowerCase().includes('berry');
        if (!hasBerry) {
          additionalEffects.failed = true;
        } else {
          if (moveConfig.consumeBerry) {
            await this.battleMonsterRepo.update(actualTarget.id, {
              monster_data: {
                ...actualTarget.monster_data,
                held_item: null,
              },
            });
          }
          additionalEffects.berryConsumed = actualTarget.held_item;
        }
        break;
      }

      case 'stat_copy': {
        // Psych Up - copy opponent's stat changes
        const targetStatMods = this.getStatModifications(target);
        for (const [stat, value] of Object.entries(targetStatMods)) {
          statModifications[stat] = value;
        }
        additionalEffects.statsCopied = targetStatMods;
        break;
      }

      default:
        break;
    }
  }

  /**
   * Handle Heart Swap move
   */
  private async handleHeartSwap(
    attacker: StatusMoveBattleMonster,
    target: StatusMoveBattleMonster,
    additionalEffects: Record<string, unknown>
  ): Promise<void> {
    const userStatMods = this.getStatModifications(attacker);
    const targetStatMods = this.getStatModifications(target);

    await this.battleMonsterRepo.update(attacker.id, {
      monster_data: {
        ...attacker.monster_data,
        stat_modifications: targetStatMods,
      },
    });

    await this.battleMonsterRepo.update(target.id, {
      monster_data: {
        ...target.monster_data,
        stat_modifications: userStatMods,
      },
    });

    additionalEffects.heartSwap = {
      userPrevious: userStatMods,
      targetPrevious: targetStatMods,
    };
  }

  /**
   * Handle Curse move (Ghost vs non-Ghost)
   */
  private async handleCurse(
    moveConfig: StatBuffDebuffMove,
    attacker: StatusMoveBattleMonster,
    target: StatusMoveBattleMonster,
    battleId: number,
    additionalEffects: Record<string, unknown>
  ): Promise<void> {
    const isGhost =
      attacker.monster_data?.type1 === 'Ghost' || attacker.monster_data?.type2 === 'Ghost';

    if (isGhost && moveConfig.ghostEffect) {
      // Ghost-type Curse: Cut HP in half and curse the target
      const hpCost = Math.floor(attacker.max_hp * moveConfig.ghostEffect.hpCost);
      if (attacker.current_hp > hpCost) {
        await this.battleMonsterRepo.dealDamage(attacker.id, hpCost);
        await this.statusEffectManager.applyStatusEffect(
          battleId,
          target,
          moveConfig.ghostEffect.statusEffect,
          moveConfig.ghostEffect.duration
        );
        additionalEffects.curseDamage = true;
      } else {
        additionalEffects.failed = true;
      }
    } else if (moveConfig.nonGhostEffect) {
      // Non-Ghost Curse: Raise Attack/Defense, lower Speed
      const statMods = this.getStatModifications(attacker);
      for (const [stat, change] of Object.entries(moveConfig.nonGhostEffect.stats)) {
        statMods[stat] ??= 0;
        statMods[stat] = Math.max(-6, Math.min(6, statMods[stat] + change));
      }
      await this.battleMonsterRepo.update(attacker.id, {
        monster_data: {
          ...attacker.monster_data,
          stat_modifications: statMods,
        },
      });
      additionalEffects.curseStats = true;
    }
  }

  /**
   * Handle Haze move
   */
  private async handleHaze(
    attacker: StatusMoveBattleMonster,
    target: StatusMoveBattleMonster,
    additionalEffects: Record<string, unknown>
  ): Promise<void> {
    await this.battleMonsterRepo.update(attacker.id, {
      monster_data: {
        ...attacker.monster_data,
        stat_modifications: {},
      },
    });
    await this.battleMonsterRepo.update(target.id, {
      monster_data: {
        ...target.monster_data,
        stat_modifications: {},
      },
    });
    additionalEffects.statReset = true;
  }

  // ==========================================================================
  // Status Affliction Moves
  // ==========================================================================

  /**
   * Execute a status affliction move
   */
  private async executeStatusAfflictionMove(
    moveConfig: StatusAfflictionMove,
    move: StatusMoveData,
    attacker: StatusMoveBattleMonster,
    target: StatusMoveBattleMonster,
    battleId: number
  ): Promise<StatusMoveResult | null> {
    if (!moveConfig || typeof moveConfig !== 'object') {
      console.error(`Invalid moveConfig for status affliction move "${move.move_name}"`);
      return null;
    }

    // Check if move hits
    const accuracy = move.accuracy ?? moveConfig.accuracy ?? 100;
    const hits = Math.random() * 100 <= accuracy;

    if (!hits) {
      return {
        hits: false,
        damage: 0,
        message: `${attacker.name}'s ${move.move_name} missed!`,
        isStatusMove: true,
      };
    }

    const actualTarget = moveConfig.target === StatusMoveTarget.SELF ? attacker : target;
    const targetName = actualTarget.name;
    const userName = attacker.name;

    // Handle conditional status moves
    if (moveConfig.type === 'conditional_status' && moveConfig.condition === 'sleeping') {
      const isSleeping = this.statusEffectManager.hasStatusEffect(actualTarget, 'sleep');
      if (!isSleeping) {
        return {
          hits: false,
          damage: 0,
          message: `${userName} used ${move.move_name}, but it failed! ${targetName} is not asleep!`,
          isStatusMove: true,
        };
      }
    }

    // Handle gender-based status effects
    if (moveConfig.type === 'status_affliction_gender') {
      if (!this.checkGenderRequirement(attacker, actualTarget)) {
        return {
          hits: false,
          damage: 0,
          message: `${userName} used ${move.move_name}, but it had no effect!`,
          isStatusMove: true,
        };
      }
    }

    // Handle delayed status effects (Yawn)
    if (moveConfig.type === 'delayed_status') {
      await this.statusEffectManager.applyStatusEffect(
        battleId,
        actualTarget,
        'drowsy',
        moveConfig.delay ?? 1,
        {
          delayedEffect: moveConfig.statusEffect,
          delayedDuration: moveConfig.duration,
        }
      );
      return {
        hits: true,
        damage: 0,
        message: this.generateMoveMessage(moveConfig, userName, targetName),
        isStatusMove: true,
        additionalEffects: { delayedStatus: moveConfig.statusEffect },
      };
    }

    // Handle status transfer (Psycho Shift)
    if (moveConfig.type === 'status_transfer') {
      const userStatusEffects = attacker.status_effects ?? [];
      if (userStatusEffects.length === 0) {
        return {
          hits: false,
          damage: 0,
          message: `${userName} used ${move.move_name}, but it failed! ${userName} has no status condition to transfer!`,
          isStatusMove: true,
        };
      }

      for (const statusEffect of userStatusEffects) {
        await this.statusEffectManager.applyStatusEffect(
          battleId,
          actualTarget,
          statusEffect.type,
          statusEffect.duration
        );
      }

      if (moveConfig.curesSelf) {
        await this.statusEffectManager.removeAllStatusEffects(battleId, attacker);
      }

      return {
        hits: true,
        damage: 0,
        message: this.generateMoveMessage(moveConfig, userName, targetName),
        isStatusMove: true,
        additionalEffects: {
          statusTransfer: true,
          transferredEffects: userStatusEffects.map((e) => e.type),
          curedSelf: moveConfig.curesSelf,
        },
      };
    }

    // Apply standard status effect
    await this.statusEffectManager.applyStatusEffect(
      battleId,
      actualTarget,
      moveConfig.statusEffect,
      moveConfig.duration ?? 3
    );

    return {
      hits: true,
      damage: 0,
      message: this.generateMoveMessage(moveConfig, userName, targetName),
      isStatusMove: true,
      statusEffect: moveConfig.statusEffect,
    };
  }

  // ==========================================================================
  // Healing Moves
  // ==========================================================================

  /**
   * Execute a healing move
   */
  private async executeHealingMove(
    moveConfig: HealingMove,
    move: StatusMoveData,
    attacker: StatusMoveBattleMonster,
    target: StatusMoveBattleMonster,
    battleId: number,
    battleState?: BattleState
  ): Promise<StatusMoveResult | null> {
    if (!moveConfig || typeof moveConfig !== 'object') {
      console.error(`Invalid moveConfig for healing move "${move.move_name}"`);
      return null;
    }

    // Check if move hits
    const accuracy = move.accuracy ?? 100;
    const hits = Math.random() * 100 <= accuracy;

    if (!hits) {
      return {
        hits: false,
        damage: 0,
        message: `${attacker.name}'s ${move.move_name} missed!`,
        isStatusMove: true,
      };
    }

    const actualTarget = moveConfig.target === StatusMoveTarget.SELF ? attacker : target;
    const targetName = actualTarget.name;
    const userName = attacker.name;

    // Calculate heal amount based on move type
    let healAmount = 0;
    const monsterRef = { name: actualTarget.name, max_hp: actualTarget.max_hp, current_hp: actualTarget.current_hp };

    if (moveConfig.type === 'healing_weather' && battleState?.weather) {
      healAmount = moveConfig.healAmount(monsterRef, battleState.weather);
    } else if (moveConfig.type === 'healing_terrain' && battleState?.terrain) {
      healAmount = moveConfig.healAmount(monsterRef, battleState.terrain);
    } else if (moveConfig.type === 'healing_stockpile') {
      const stockpileEffect = actualTarget.status_effects?.find((e) => e.type === 'stockpile');
      const stacks = stockpileEffect?.stacks ?? 0;
      if (stacks === 0) {
        return {
          hits: false,
          damage: 0,
          message: `${userName} used ${move.move_name}, but it failed! No power was stockpiled!`,
          isStatusMove: true,
        };
      }
      healAmount = moveConfig.healAmount(monsterRef, stacks);
      if (moveConfig.consumeStockpile) {
        await this.statusEffectManager.removeStatusEffect(battleId, actualTarget, 'stockpile');
      }
    } else {
      healAmount = moveConfig.healAmount(monsterRef);
    }

    const additionalEffects: Record<string, unknown> = {};

    // Handle special healing types
    switch (moveConfig.type) {
      case 'healing_type_change':
        // Roost - temporarily lose Flying type
        if (moveConfig.loseFlying) {
          await this.statusEffectManager.applyStatusEffect(battleId, actualTarget, 'roost', 1);
          additionalEffects.loseFlying = true;
        }
        break;

      case 'team_healing_status_cure':
        // Jungle Healing - heal team and cure status
        if (moveConfig.cureStatus) {
          await this.statusEffectManager.cureAllStatusEffects(battleId, actualTarget);
          additionalEffects.teamHealAndCure = true;
        }
        break;

      case 'delayed_healing':
        // Wish - apply delayed healing effect
        await this.statusEffectManager.applyStatusEffect(battleId, actualTarget, 'wish', moveConfig.delay ?? 2, {
          healAmount,
          wishUser: userName,
        });
        return {
          hits: true,
          damage: 0,
          healing: 0,
          message: this.generateMoveMessage(moveConfig, userName, targetName),
          isStatusMove: true,
          additionalEffects: { delayedHealing: true },
        };

      case 'status_cure':
        // Refresh - cure status without healing HP
        await this.statusEffectManager.cureAllStatusEffects(battleId, actualTarget);
        return {
          hits: true,
          damage: 0,
          healing: 0,
          message: `${this.generateMoveMessage(moveConfig, userName, targetName)}\n✨ ${targetName} was cured of all status conditions!`,
          isStatusMove: true,
          additionalEffects: { statusCure: true },
        };

      case 'team_status_cure':
        // Heal Bell - cure all team status
        await this.statusEffectManager.cureAllStatusEffects(battleId, actualTarget);
        return {
          hits: true,
          damage: 0,
          healing: 0,
          message: `${this.generateMoveMessage(moveConfig, userName, targetName)}\n🔔 The team was cured of all status conditions!`,
          isStatusMove: true,
          additionalEffects: { teamStatusCure: true },
        };

      case 'sacrifice_heal':
        // Lunar Dance/Healing Wish - user faints to heal next monster
        await this.statusEffectManager.applyStatusEffect(battleId, attacker, 'sacrifice_heal', 1, {
          healAmount,
          cureStatus: moveConfig.cureStatus ?? false,
        });
        await this.battleMonsterRepo.update(attacker.id, {
          current_hp: 0,
          is_fainted: true,
        });
        return {
          hits: true,
          damage: 0,
          healing: 0,
          message: this.generateMoveMessage(moveConfig, userName, targetName),
          isStatusMove: true,
          additionalEffects: { sacrifice: { healAmount, cureStatus: moveConfig.cureStatus } },
          userFaints: true,
        };

      case 'healing_sleep':
        // Rest - full heal but fall asleep
        if (moveConfig.statusEffect) {
          await this.statusEffectManager.applyStatusEffect(
            battleId,
            actualTarget,
            moveConfig.statusEffect,
            2 // Rest always sleeps for 2 turns
          );
        }
        break;
    }

    // Apply healing
    const healResult = await this.battleMonsterRepo.heal(actualTarget.id, healAmount);

    return {
      hits: true,
      damage: 0,
      healing: healResult.heal_amount,
      message: `${this.generateMoveMessage(moveConfig, userName, targetName)}\n💚 ${targetName} recovered ${healResult.heal_amount} HP!`,
      isStatusMove: true,
      additionalEffects,
    };
  }

  // ==========================================================================
  // Other Status Moves
  // ==========================================================================

  /**
   * Execute other status moves (terrain, weather, protection, etc.)
   */
  private async executeOtherMove(
    moveConfig: OtherStatusMove,
    move: StatusMoveData,
    attacker: StatusMoveBattleMonster,
    target: StatusMoveBattleMonster,
    battleId: number,
    battleState?: BattleState
  ): Promise<StatusMoveResult | null> {
    if (!moveConfig || typeof moveConfig !== 'object') {
      console.error(`Invalid moveConfig for other move "${move.move_name}"`);
      return null;
    }

    // Check if move hits
    const accuracy = move.accuracy ?? 100;
    const hits = Math.random() * 100 <= accuracy;

    if (!hits) {
      return {
        hits: false,
        damage: 0,
        message: `${attacker.name}'s ${move.move_name} missed!`,
        isStatusMove: true,
      };
    }

    const userName = attacker.name;
    const targetName = target.name;
    const message = this.generateMoveMessage(moveConfig, userName, targetName);
    const additionalEffects: Record<string, unknown> = {};

    // Handle specific move types using the effect property
    await this.handleOtherMoveEffect(
      moveConfig,
      move,
      attacker,
      target,
      battleId,
      battleState,
      additionalEffects
    );

    // Log to battle log
    await this.battleLog.logSystem(battleId, `🌟 ${message}`);

    return {
      hits: true,
      damage: 0,
      message,
      isStatusMove: true,
      additionalEffects,
    };
  }

  /**
   * Handle specific other move effects
   */
  private async handleOtherMoveEffect(
    moveConfig: OtherStatusMove,
    _move: StatusMoveData,
    attacker: StatusMoveBattleMonster,
    target: StatusMoveBattleMonster,
    battleId: number,
    _battleState: BattleState | undefined,
    additionalEffects: Record<string, unknown>
  ): Promise<void> {
    const moveType = moveConfig.type;

    switch (moveType) {
      case 'terrain':
        await this.statusEffectManager.applyStatusEffect(
          battleId,
          null,
          moveConfig.effect,
          moveConfig.duration ?? 5,
          { field: true }
        );
        additionalEffects.terrain = moveConfig.effect;
        break;

      case 'weather':
        await this.statusEffectManager.applyStatusEffect(
          battleId,
          null,
          moveConfig.effect,
          moveConfig.duration ?? 5,
          { field: true, weather: moveConfig.weather }
        );
        additionalEffects.weather = moveConfig.weather;
        break;

      case 'protection':
        await this.statusEffectManager.applyStatusEffect(
          battleId,
          attacker,
          moveConfig.effect,
          moveConfig.duration ?? 1
        );
        additionalEffects.protection = true;
        break;

      case 'trap':
        await this.statusEffectManager.applyStatusEffect(
          battleId,
          target,
          'trapped',
          moveConfig.duration ?? 5
        );
        additionalEffects.trapped = true;
        break;

      case 'entry_hazard':
        await this.statusEffectManager.applyStatusEffect(
          battleId,
          null,
          moveConfig.effect,
          -1,
          { field: true, side: 'opponent', layers: moveConfig.layers }
        );
        additionalEffects.hazard = moveConfig.effect;
        break;

      case 'disable_status':
        await this.statusEffectManager.applyStatusEffect(
          battleId,
          target,
          'taunt',
          moveConfig.duration ?? 3
        );
        additionalEffects.taunt = true;
        break;

      case 'sacrifice_debuff':
        // Memento - sacrifice self to debuff opponent
        if (moveConfig.stats) {
          const statMods = this.getStatModifications(target);
          for (const [stat, change] of Object.entries(moveConfig.stats)) {
            statMods[stat] ??= 0;
            statMods[stat] = Math.max(-6, Math.min(6, statMods[stat] + change));
          }
          await this.battleMonsterRepo.update(target.id, {
            monster_data: { ...target.monster_data, stat_modifications: statMods },
          });
        }
        await this.battleMonsterRepo.update(attacker.id, { current_hp: 0, is_fainted: true });
        additionalEffects.sacrifice = true;
        break;

      case 'force_switch':
        additionalEffects.forceSwitch = true;
        break;

      case 'create_substitute':
        if (moveConfig.hpCost) {
          const subHpCost = Math.floor(attacker.max_hp * moveConfig.hpCost);
          if (attacker.current_hp > subHpCost) {
            await this.battleMonsterRepo.dealDamage(attacker.id, subHpCost);
            await this.statusEffectManager.applyStatusEffect(battleId, attacker, 'substitute', -1, {
              hp: subHpCost,
            });
            additionalEffects.substitute = { hpCost: subHpCost, hp: subHpCost };
          } else {
            additionalEffects.failed = true;
          }
        }
        break;

      case 'team_barrier':
        await this.statusEffectManager.applyStatusEffect(
          battleId,
          null,
          moveConfig.effect,
          moveConfig.duration ?? 5,
          { team: true, barrierType: moveConfig.barrierType, damageReduction: moveConfig.damageReduction }
        );
        additionalEffects.teamBarrier = { barrierType: moveConfig.barrierType };
        break;

      case 'hp_average': {
        // Pain Split
        const avgHP = Math.floor((attacker.current_hp + target.current_hp) / 2);
        await this.battleMonsterRepo.update(attacker.id, {
          current_hp: Math.min(avgHP, attacker.max_hp),
        });
        await this.battleMonsterRepo.update(target.id, {
          current_hp: Math.min(avgHP, target.max_hp),
        });
        additionalEffects.painSplit = { newHP: avgHP };
        break;
      }

      case 'perish_countdown':
        await this.statusEffectManager.applyStatusEffect(
          battleId,
          attacker,
          'perish_song',
          moveConfig.perishCountdown ?? 3
        );
        await this.statusEffectManager.applyStatusEffect(
          battleId,
          target,
          'perish_song',
          moveConfig.perishCountdown ?? 3
        );
        additionalEffects.perishSong = { countdown: moveConfig.perishCountdown };
        break;

      case 'no_effect':
        // Splash - does nothing
        additionalEffects.noEffect = true;
        break;

      case 'no_battle_effect':
        // Hold Hands, Celebrate
        additionalEffects.noBattleEffect = true;
        break;

      default:
        // Apply generic status effect
        if (moveConfig.effect) {
          await this.statusEffectManager.applyStatusEffect(
            battleId,
            moveConfig.target === StatusMoveTarget.SELF ? attacker : target,
            moveConfig.effect,
            moveConfig.duration ?? 5
          );
          additionalEffects.effect = moveConfig.effect;
        }
        break;
    }
  }

  // ==========================================================================
  // Special Damage Moves
  // ==========================================================================

  /**
   * Execute special damage moves (moves that do damage with additional effects)
   */
  private executeSpecialDamageMove(
    moveConfig: SpecialDamageMove,
    move: StatusMoveData,
    attacker: StatusMoveBattleMonster,
    _target: StatusMoveBattleMonster
  ): SpecialDamageMoveResult {
    const userName = attacker.name;

    return {
      isSpecialDamageMove: true,
      moveConfig: moveConfig as unknown as Record<string, unknown>,
      specialEffects: {
        ...moveConfig,
        type: moveConfig.type,
      },
      proceedWithDamage: true,
      baseMessage: `${userName} used ${move.move_name}!`,
    };
  }

  /**
   * Apply special effects after damage calculation
   */
  async applySpecialDamageEffects(
    moveConfig: SpecialDamageMove,
    attacker: StatusMoveBattleMonster,
    target: StatusMoveBattleMonster,
    damageDealt: number,
    battleId: number
  ): Promise<{ effectMessage: string; healing: number }> {
    const userName = attacker.name;
    const targetName = target.name;
    let effectMessage = '';
    let healing = 0;

    switch (moveConfig.type) {
      case 'damage_heal':
        // Leech Life - heal based on damage dealt
        if (damageDealt > 0 && moveConfig.healPercent) {
          healing = Math.floor(damageDealt * (moveConfig.healPercent / 100));
          await this.battleMonsterRepo.heal(attacker.id, healing);
          effectMessage = `\n💚 ${userName} recovered ${healing} HP!`;
        }
        break;

      case 'damage_status':
        // Apply status effect
        if (moveConfig.statusEffect) {
          await this.statusEffectManager.applyStatusEffect(
            battleId,
            target,
            moveConfig.statusEffect,
            moveConfig.duration ?? 5
          );
          effectMessage = `\n🌱 ${targetName} was seeded!`;
        }
        break;

      case 'damage_flinch':
        // Chance to flinch
        if (moveConfig.flinchChance && Math.random() * 100 < moveConfig.flinchChance) {
          await this.statusEffectManager.applyStatusEffect(battleId, target, 'flinch', 1);
          effectMessage = `\n😵 ${targetName} flinched!`;
        }
        break;

      case 'multi_hit':
        // Multiple hits
        if (moveConfig.minHits && moveConfig.maxHits) {
          const hits =
            Math.floor(Math.random() * (moveConfig.maxHits - moveConfig.minHits + 1)) +
            moveConfig.minHits;
          effectMessage = `\n🎯 Hit ${hits} time(s)!`;
        }
        break;

      case 'two_turn':
        // Two turn moves
        if (moveConfig.secondTurnMessage) {
          effectMessage = `\n⏳ ${moveConfig.secondTurnMessage(userName, targetName)}`;
        }
        break;
    }

    return { effectMessage, healing };
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  /**
   * Get stat modifications for a monster
   */
  private getStatModifications(monster: StatusMoveBattleMonster): Record<string, number> {
    return monster.stat_modifications ?? monster.monster_data?.stat_modifications ?? {};
  }

  /**
   * Check if gender requirement is met for moves like Attract and Captivate
   */
  private checkGenderRequirement(
    attacker: StatusMoveBattleMonster,
    target: StatusMoveBattleMonster
  ): boolean {
    const userGender = attacker.monster_data?.gender ?? 'genderless';
    const targetGender = target.monster_data?.gender ?? 'genderless';

    if (userGender === 'genderless' || targetGender === 'genderless') {
      return false;
    }

    return userGender !== targetGender;
  }

  /**
   * Generate move message from config
   */
  private generateMoveMessage(
    moveConfig: StatusMoveDefinition,
    userName: string,
    targetName?: string,
    extra?: string | boolean
  ): string {
    if (moveConfig.message && typeof moveConfig.message === 'function') {
      try {
        return moveConfig.message(userName, targetName, extra);
      } catch {
        return `${userName} used the move!`;
      }
    }
    return `${userName} used the move!`;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a new StatusMoveService instance
 */
export function createStatusMoveService(
  statusEffectManager: IStatusEffectManager,
  battleMonsterRepo: IBattleMonsterRepository,
  battleLog: IBattleLog
): StatusMoveService {
  return new StatusMoveService(statusEffectManager, battleMonsterRepo, battleLog);
}
