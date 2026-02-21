import {
  BattleRepository,
  BattleInstance,
} from '../../repositories/battle.repository';
import {
  BattleParticipantRepository,
  BattleParticipant,
  BattleParticipantWithDetails,
  TeamSide,
} from '../../repositories/battle-participant.repository';
import {
  BattleMonsterRepository,
  BattleMonster,
  BattleMonsterWithDetails,
} from '../../repositories/battle-monster.repository';
import {
  BattleTurnRepository,
  ActionType,
} from '../../repositories/battle-turn.repository';
import { BattleLogRepository } from '../../repositories/battle-log.repository';
import { MoveRepository, Move } from '../../repositories/move.repository';
import { TrainerRepository } from '../../repositories/trainer.repository';
import { TrainerInventoryRepository } from '../../repositories/trainer-inventory.repository';
import { MonsterRepository } from '../../repositories/monster.repository';
import {
  StatusMoveService,
  StatusMoveBattleMonster,
  StatusMoveData,
  StatusMoveResult,
  SpecialDamageMoveResult,
  IStatusEffectManager,
  IBattleMonsterRepository,
  IBattleLog,
  BattleState as StatusMoveBattleState,
} from './status-move.service';
import {
  DamageCalculatorService,
  MoveData,
} from './damage-calculator.service';
import { isStatusMove } from '../../utils/constants/monster-status-moves';

// ============================================================================
// Types
// ============================================================================

export type MonsterData = Record<string, unknown> & {
  name?: string;
  moves?: string[];
  moveset?: string[];
  img_link?: string;
  image_link?: string;
  type1?: string;
  type2?: string;
  type3?: string;
  type4?: string;
  type5?: string;
  level?: number;
  attack?: number;
  defense?: number;
  sp_attack?: number;
  sp_defense?: number;
  speed?: number;
  hp?: number;
  max_hp?: number;
  current_hp?: number;
  stat_modifications?: Record<string, number>;
};

export type DamageResult = {
  damage: number;
  hits: boolean;
  isCritical: boolean;
  effectiveness: number;
  stabMultiplier?: number;
  accuracy?: number;
  message: string;
  moveData?: Move;
  isSpecialDamageMove?: boolean;
  specialMoveConfig?: unknown;
  requiresSwitchOut?: boolean;
  proceedWithDamage?: boolean;
};

export type StatusEffectResult = {
  applied: boolean;
  effect?: {
    type: string;
    duration: number;
  };
  message?: string;
};

export type StatusProcessingResult = {
  canAct: boolean;
  messages: string[];
};

export type HealingResult = {
  healAmount: number;
  newHp: number;
  message: string;
};

export type ItemEffectResult = {
  message: string;
  healAmount?: number;
};

export type AttackResult = {
  success: boolean;
  message: string;
  damageDealt?: number;
  wordCount?: number;
  battleEnded?: boolean;
  result?: unknown;
  winner_type?: string;
  statusPrevented?: boolean;
};

export type ItemUseResult = {
  message: string;
  wordCount: number;
  itemResult: ItemEffectResult;
};

export type ReleaseResult = {
  message: string;
  wordCount: number;
  switchCompleted?: boolean;
};

export type WithdrawResult = {
  message: string;
  wordCount: number;
};

export type SwitchOutResult = {
  success: boolean;
  message: string;
  requiresPlayerAction?: boolean;
  waitingForSwitch?: boolean;
};

export type AIAction = {
  action_type: ActionType;
  action_data: {
    move_name?: string;
    target_id?: number;
    item_name?: string;
  };
  ai_message?: string;
  word_count?: number;
};

export type BattleState = {
  isActive: boolean;
  currentParticipant: BattleParticipantWithDetails | null;
  battle: BattleInstance | null;
};

export type BattleEndResult = {
  winner_type: string;
  message: string;
  result?: unknown;
};

// ============================================================================
// Healing Items Configuration
// ============================================================================

const HEALING_ITEMS: Record<string, { heal_amount?: number; heal_percentage?: number; removes_status?: boolean }> = {
  'Potion': { heal_amount: 20 },
  'Super Potion': { heal_amount: 50 },
  'Hyper Potion': { heal_amount: 200 },
  'Max Potion': { heal_percentage: 100 },
  'Full Restore': { heal_percentage: 100, removes_status: true },
};

const HEALING_ITEM_NAMES = Object.keys(HEALING_ITEMS);

// ============================================================================
// Service
// ============================================================================

/**
 * BattleActionService for handling real-time battle actions
 *
 * Uses DamageCalculatorService for damage calculations with full type effectiveness,
 * STAB, weather/terrain modifiers, and critical hit mechanics.
 *
 * NOTE: BattleManager and StatusEffectManager are not yet fully translated.
 */
export class BattleActionService {
  private battleRepository: BattleRepository;
  private battleParticipantRepository: BattleParticipantRepository;
  private battleMonsterRepository: BattleMonsterRepository;
  private battleTurnRepository: BattleTurnRepository;
  private battleLogRepository: BattleLogRepository;
  private moveRepository: MoveRepository;
  private trainerRepository: TrainerRepository;
  private trainerInventoryRepository: TrainerInventoryRepository;
  private monsterRepository: MonsterRepository;
  private statusMoveService: StatusMoveService;
  private damageCalculator: DamageCalculatorService;

  constructor(
    battleRepository?: BattleRepository,
    battleParticipantRepository?: BattleParticipantRepository,
    battleMonsterRepository?: BattleMonsterRepository,
    battleTurnRepository?: BattleTurnRepository,
    battleLogRepository?: BattleLogRepository,
    moveRepository?: MoveRepository,
    trainerRepository?: TrainerRepository,
    trainerInventoryRepository?: TrainerInventoryRepository,
    monsterRepository?: MonsterRepository,
    statusMoveService?: StatusMoveService,
    damageCalculator?: DamageCalculatorService
  ) {
    this.battleRepository = battleRepository ?? new BattleRepository();
    this.battleParticipantRepository =
      battleParticipantRepository ?? new BattleParticipantRepository();
    this.battleMonsterRepository = battleMonsterRepository ?? new BattleMonsterRepository();
    this.battleTurnRepository = battleTurnRepository ?? new BattleTurnRepository();
    this.battleLogRepository = battleLogRepository ?? new BattleLogRepository();
    this.moveRepository = moveRepository ?? new MoveRepository();
    this.trainerRepository = trainerRepository ?? new TrainerRepository();
    this.trainerInventoryRepository =
      trainerInventoryRepository ?? new TrainerInventoryRepository();
    this.monsterRepository = monsterRepository ?? new MonsterRepository();

    // Initialize StatusMoveService with adapters
    this.statusMoveService =
      statusMoveService ?? this.createStatusMoveService();

    // Initialize DamageCalculatorService
    this.damageCalculator =
      damageCalculator ?? new DamageCalculatorService(this.moveRepository, this.statusMoveService);
  }

  /**
   * Create StatusMoveService with adapter implementations
   */
  private createStatusMoveService(): StatusMoveService {
    const statusEffectManager: IStatusEffectManager = {
      applyStatusEffect: async (
        _battleId: number,
        target: StatusMoveBattleMonster | null,
        effect: string,
        duration: number,
        _data?: Record<string, unknown>
      ) => {
        if (!target) {
          return { success: false, message: 'No target for status effect' };
        }
        await this.battleMonsterRepository.addStatusEffect(target.id, {
          type: effect,
          duration,
        });
        return {
          success: true,
          message: `${target.name} was affected by ${effect}!`,
        };
      },
      hasStatusEffect: (monster: StatusMoveBattleMonster, effect: string) => {
        const effects = monster.status_effects ?? [];
        return effects.some((e) => e.type === effect);
      },
      removeStatusEffect: async (
        _battleId: number,
        monster: StatusMoveBattleMonster,
        effect: string
      ) => {
        await this.battleMonsterRepository.removeStatusEffect(monster.id, effect);
      },
      removeAllStatusEffects: async (
        _battleId: number,
        monster: StatusMoveBattleMonster
      ) => {
        await this.battleMonsterRepository.update(monster.id, { statusEffects: [] });
      },
      cureAllStatusEffects: async (
        _battleId: number,
        monster: StatusMoveBattleMonster
      ) => {
        await this.battleMonsterRepository.update(monster.id, { statusEffects: [] });
      },
    };

    const battleMonsterRepo: IBattleMonsterRepository = {
      update: async (
        id: number,
        data: { monster_data?: Record<string, unknown>; current_hp?: number; is_fainted?: boolean }
      ) => {
        await this.battleMonsterRepository.update(id, {
          monsterData: data.monster_data,
          currentHp: data.current_hp,
          isFainted: data.is_fainted,
        });
      },
      dealDamage: async (id: number, damage: number) => {
        await this.battleMonsterRepository.dealDamage(id, damage);
      },
      heal: async (id: number, amount: number) => {
        const result = await this.battleMonsterRepository.heal(id, amount);
        return { heal_amount: result.healAmount };
      },
    };

    const battleLog: IBattleLog = {
      logSystem: async (battleId: number, message: string) => {
        await this.battleLogRepository.create({
          battleId,
          logType: 'system',
          message,
        });
      },
    };

    return new StatusMoveService(statusEffectManager, battleMonsterRepo, battleLog);
  }

  /**
   * Execute an attack action
   */
  async executeAttack(
    battleId: number,
    discordUserId: string,
    moveName: string,
    targetName: string | null,
    message: string,
    attackerName: string | null = null
  ): Promise<AttackResult> {
    // Get participant
    const participant = await this.battleParticipantRepository.findByBattleAndUser(
      battleId,
      discordUserId
    );
    if (!participant) {
      throw new Error('You are not participating in this battle');
    }

    // Get attacker monster
    const attackerMonsters = await this.battleMonsterRepository.findActiveByParticipant(
      participant.id
    );
    if (attackerMonsters.length === 0) {
      throw new Error('No active monster to attack with');
    }

    let attacker: BattleMonsterWithDetails;
    if (attackerName && attackerMonsters.length > 1) {
      // Find specific monster by name
      const found = attackerMonsters.find((m) => {
        const monsterData = m.monsterData as MonsterData;
        return monsterData.name?.toLowerCase() === attackerName.toLowerCase();
      });

      if (!found) {
        const availableMonsters = attackerMonsters
          .map((m) => {
            const monsterData = m.monsterData as MonsterData;
            return monsterData.name ?? 'Unknown';
          })
          .join(', ');
        throw new Error(
          `Monster "${attackerName}" not found among your active monsters. Available: ${availableMonsters}`
        );
      }
      attacker = found;
    } else {
      // Use first active monster if no specific attacker specified
      const firstMonster = attackerMonsters[0];
      if (!firstMonster) {
        throw new Error('No active monster to attack with');
      }
      attacker = firstMonster;
    }

    const attackerData = attacker.monsterData as MonsterData;

    // Process status effects for the attacking monster before action
    const statusResult = await this.processStatusEffects(battleId, attacker);

    // Check if monster can act after status effects
    if (!statusResult.canAct) {
      const monsterName = attackerData.name ?? 'Monster';
      const preventMessage = statusResult.messages.join('\n');

      // Log the prevention
      await this.battleLogRepository.logSystem(battleId, preventMessage);

      // Send message to Discord
      await this.sendBattleMessageToDiscord(battleId, preventMessage);

      return {
        success: false,
        message: `${monsterName} cannot act due to status conditions!`,
        statusPrevented: true,
      };
    }

    // If there were status effect messages, send them
    if (statusResult.messages.length > 0) {
      const statusMessage = statusResult.messages.join('\n');
      await this.battleLogRepository.logSystem(battleId, statusMessage);
      await this.sendBattleMessageToDiscord(battleId, statusMessage);
    }

    // Validate move against battle monster's moveset
    const monsterMoves = attackerData.moves ?? attackerData.moveset ?? [];
    let movesArray: string[] = [];

    if (Array.isArray(monsterMoves)) {
      movesArray = monsterMoves as string[];
    } else if (typeof monsterMoves === 'string') {
      try {
        movesArray = JSON.parse(monsterMoves);
      } catch {
        console.error('Error parsing moves string');
        movesArray = [];
      }
    }

    const hasMove = movesArray.some((move) => move.toLowerCase() === moveName.toLowerCase());

    if (!hasMove) {
      throw new Error(
        `${attackerData.name ?? 'Your monster'} doesn't know the move "${moveName}"`
      );
    }

    // Get target monster
    const target = await this.getTargetMonster(battleId, participant.teamSide, targetName);
    if (!target) {
      throw new Error('Invalid target');
    }

    const targetData = target.monsterData as MonsterData;

    // Get move data
    const move = await this.moveRepository.findByName(moveName);
    if (!move) {
      throw new Error(`Move "${moveName}" not found`);
    }

    // Check if this is a status move and process it separately
    if (isStatusMove(moveName) || move.moveCategory?.toLowerCase() === 'status') {
      return this.processStatusMoveAttack(
        battleId,
        participant,
        attacker,
        target,
        move,
        moveName,
        message
      );
    }

    // Calculate damage for non-status moves
    const damageResult = await this.calculateDamage(attackerData, targetData, move);

    // Apply damage if hit
    let damageDealt = 0;
    let healthInfo = '';
    let statusEffectMessage = '';

    if (damageResult.hits) {
      const damageApplied = await this.battleMonsterRepository.dealDamage(
        target.id,
        damageResult.damage
      );
      damageDealt = damageApplied.damageDealt;

      // Get updated target for health display
      const updatedTarget = await this.battleMonsterRepository.findById(target.id);
      if (updatedTarget) {
        const hpPercent = Math.round((updatedTarget.currentHp / updatedTarget.maxHp) * 100);

        // Create health bar visualization
        const healthBar = this.generateHealthBar(updatedTarget.currentHp, updatedTarget.maxHp);

        healthInfo =
          `\n💢 **${damageDealt} damage dealt!**\n` +
          `${targetData.name ?? 'Target'}: ${updatedTarget.currentHp}/${updatedTarget.maxHp} HP (${hpPercent}%)\n` +
          `${healthBar}`;

        if (updatedTarget.isFainted) {
          healthInfo += `\n💀 **${targetData.name ?? 'Target'} fainted!**`;
        }

        // Check for status effect application
        const statusEffect = this.calculateStatusEffect(attackerData, targetData, move);

        if (statusEffect.applied && statusEffect.effect && statusEffect.effect.type !== 'unknown') {
          const applyResult = await this.applyStatusEffect(
            battleId,
            updatedTarget,
            statusEffect.effect.type,
            statusEffect.effect.duration
          );

          if (applyResult.success) {
            statusEffectMessage = `\n${applyResult.message}`;
          }
        }
      }
    }

    // Calculate word count bonus
    const wordCount = message.split(' ').filter((word) => word.length > 0).length;

    // Get current turn number
    const currentTurn = await this.getCurrentTurnNumber(battleId);

    // Create battle turn
    const turn = await this.battleTurnRepository.create({
      battleId,
      turnNumber: currentTurn,
      participantId: participant.id,
      monsterId: attacker.id,
      actionType: 'attack',
      actionData: {
        move_name: moveName,
        target_id: target.id,
        target_name: targetName ?? targetData.name,
      },
      resultData: damageResult as Record<string, unknown>,
      damageDealt,
      messageContent: message,
      wordCount,
    });

    // Update participant message count
    await this.battleParticipantRepository.addMessage(participant.id, wordCount);

    // Get attacker image for display
    const attackerImage = attackerData.img_link ?? attackerData.image_link ?? '';
    let imageDisplay = '';
    if (attackerImage) {
      imageDisplay = `\n🖼️ ${attackerImage}`;
    }

    // Log the action with enhanced information
    const enhancedMessage = `${imageDisplay}\n${damageResult.message}${healthInfo}${statusEffectMessage}`;
    await this.logAndSendBattleAction(battleId, enhancedMessage, {
      participantId: participant.id,
      turnNumber: turn.turnNumber,
    });

    // Handle switch out requirement (after logging the move)
    if (damageResult.requiresSwitchOut) {
      return await this.handleSwitchOut(battleId, participant, attacker, enhancedMessage);
    }

    // Check if target fainted
    if (damageResult.hits && damageDealt > 0) {
      const updatedTarget = await this.battleMonsterRepository.findById(target.id);

      if (updatedTarget && (updatedTarget.isFainted || updatedTarget.currentHp <= 0)) {
        // Handle knockout and award levels
        await this.handleMonsterKnockout(battleId, updatedTarget);
      }
    }

    // Check if battle should end
    const battleEndResult = await this.checkBattleConditions(battleId);
    if (battleEndResult) {
      await this.endBattle(battleId, battleEndResult.winner_type, battleEndResult.message);
      return {
        success: true,
        message: `${damageResult.message}\n\n${battleEndResult.message}`,
        battleEnded: true,
        result: battleEndResult.result,
        winner_type: battleEndResult.winner_type,
      };
    }

    return {
      success: true,
      message: damageResult.message,
      damageDealt,
      wordCount,
      battleEnded: false,
    };
  }

  /**
   * Process a status move attack
   */
  private async processStatusMoveAttack(
    battleId: number,
    participant: BattleParticipantWithDetails,
    attacker: BattleMonsterWithDetails,
    target: BattleMonsterWithDetails,
    move: Move,
    moveName: string,
    message: string
  ): Promise<AttackResult> {
    const attackerData = attacker.monsterData as MonsterData;
    const targetData = target.monsterData as MonsterData;

    // Convert to StatusMoveBattleMonster format
    const statusAttacker: StatusMoveBattleMonster = {
      id: attacker.id,
      name: attackerData.name ?? 'Attacker',
      current_hp: attacker.currentHp,
      max_hp: attacker.maxHp,
      monster_data: {
        type1: attackerData.type1,
        type2: attackerData.type2,
        gender: attackerData.gender as string | undefined,
        ability: attackerData.ability as string | undefined,
        stat_modifications: attackerData.stat_modifications,
        held_item: attackerData.held_item as string | undefined,
      },
      stat_modifications: attackerData.stat_modifications,
      status_effects: attacker.statusEffects?.map((e) => ({
        type: e.type,
        duration: e.duration ?? 0,
      })),
      held_item: attackerData.held_item as string | undefined,
    };

    const statusTarget: StatusMoveBattleMonster = {
      id: target.id,
      name: targetData.name ?? 'Target',
      current_hp: target.currentHp,
      max_hp: target.maxHp,
      monster_data: {
        type1: targetData.type1,
        type2: targetData.type2,
        gender: targetData.gender as string | undefined,
        ability: targetData.ability as string | undefined,
        stat_modifications: targetData.stat_modifications,
        held_item: targetData.held_item as string | undefined,
      },
      stat_modifications: targetData.stat_modifications,
      status_effects: target.statusEffects?.map((e) => ({
        type: e.type,
        duration: e.duration ?? 0,
      })),
      held_item: targetData.held_item as string | undefined,
    };

    const moveData: StatusMoveData = {
      move_name: moveName,
      accuracy: move.accuracy ?? undefined,
      power: move.power ?? undefined,
      type: move.moveType,
    };

    // Get battle state for weather/terrain effects
    const battle = await this.battleRepository.findById(battleId);
    const battleData = battle?.battleData as Record<string, unknown> | undefined;
    const battleState: StatusMoveBattleState = {
      weather: battleData?.weather as StatusMoveBattleState['weather'],
      terrain: battleData?.terrain as string | undefined,
      turn: battle?.currentTurn,
    };

    // Process the status move
    const result = await this.statusMoveService.processStatusMove(
      moveData,
      statusAttacker,
      statusTarget,
      battleId,
      battleState
    );

    // Calculate word count bonus
    const wordCount = message.split(' ').filter((word) => word.length > 0).length;

    // Get current turn number
    const currentTurn = await this.getCurrentTurnNumber(battleId);

    let resultMessage: string;
    let damageDealt = 0;

    if (!result) {
      // Fallback if status move service returns null (move not recognized)
      resultMessage = `${attackerData.name ?? 'Attacker'} used **${moveName}**! But nothing happened...`;
    } else if (this.isSpecialDamageMoveResult(result)) {
      // Special damage move - proceed with damage calculation
      const damageResult = await this.calculateDamage(attackerData, targetData, move);
      if (damageResult.hits) {
        const damageApplied = await this.battleMonsterRepository.dealDamage(
          target.id,
          damageResult.damage
        );
        damageDealt = damageApplied.damageDealt;
      }
      resultMessage = result.baseMessage + (damageResult.hits ? ` Dealt ${damageDealt} damage!` : ' But it missed!');
    } else {
      // Normal status move result
      resultMessage = result.message;
      if (result.healing && result.healing > 0) {
        resultMessage += `\n💚 Recovered ${result.healing} HP!`;
      }
      if (result.statChanges) {
        const changes = Object.entries(result.statChanges)
          .map(([stat, change]) => `${stat} ${change > 0 ? '+' : ''}${change}`)
          .join(', ');
        if (changes) {
          resultMessage += `\n📊 Stat changes: ${changes}`;
        }
      }
      if (result.requiresSwitchOut) {
        resultMessage += `\n🔄 ${attackerData.name ?? 'Attacker'} must switch out!`;
      }
    }

    // Create battle turn
    const turn = await this.battleTurnRepository.create({
      battleId,
      turnNumber: currentTurn,
      participantId: participant.id,
      monsterId: attacker.id,
      actionType: 'attack',
      actionData: {
        move_name: moveName,
        target_id: target.id,
        target_name: targetData.name,
        is_status_move: true,
      },
      resultData: (result as unknown as Record<string, unknown>) ?? { message: resultMessage },
      damageDealt,
      messageContent: message,
      wordCount,
    });

    // Update participant message count
    await this.battleParticipantRepository.addMessage(participant.id, wordCount);

    // Get attacker image for display
    const attackerImage = attackerData.img_link ?? attackerData.image_link ?? '';
    let imageDisplay = '';
    if (attackerImage) {
      imageDisplay = `\n🖼️ ${attackerImage}`;
    }

    // Log the action
    const enhancedMessage = `${imageDisplay}\n${resultMessage}`;
    await this.logAndSendBattleAction(battleId, enhancedMessage, {
      participantId: participant.id,
      turnNumber: turn.turnNumber,
    });

    // Handle switch out requirement
    if (result && !this.isSpecialDamageMoveResult(result) && result.requiresSwitchOut) {
      return this.handleSwitchOut(battleId, participant, attacker, enhancedMessage);
    }

    // Check if target fainted (for moves that deal damage)
    if (damageDealt > 0) {
      const updatedTarget = await this.battleMonsterRepository.findById(target.id);
      if (updatedTarget && (updatedTarget.isFainted || updatedTarget.currentHp <= 0)) {
        // Handle knockout and award levels
        await this.handleMonsterKnockout(battleId, updatedTarget);

        // Check if battle ended
        const battleEndResult = await this.checkBattleConditions(battleId);
        if (battleEndResult) {
          await this.endBattle(battleId, battleEndResult.winner_type, battleEndResult.message);
          return {
            success: true,
            message: `${resultMessage}\n\n${battleEndResult.message}`,
            battleEnded: true,
            result: battleEndResult.result,
            winner_type: battleEndResult.winner_type,
          };
        }
      }
    }

    return {
      success: true,
      message: resultMessage,
      damageDealt,
      wordCount,
      battleEnded: false,
    };
  }

  /**
   * Type guard for SpecialDamageMoveResult
   */
  private isSpecialDamageMoveResult(
    result: StatusMoveResult | SpecialDamageMoveResult
  ): result is SpecialDamageMoveResult {
    return 'isSpecialDamageMove' in result && result.isSpecialDamageMove === true;
  }

  /**
   * Use an item in battle
   */
  async useItem(
    battleId: number,
    discordUserId: string,
    itemName: string,
    targetName: string | null,
    message: string
  ): Promise<ItemUseResult> {
    // Get participant
    const participant = await this.battleParticipantRepository.findByBattleAndUser(
      battleId,
      discordUserId
    );
    if (!participant) {
      throw new Error('You are not participating in this battle');
    }

    // Check if trainer has the item
    if (!participant.trainerId) {
      throw new Error('Trainer not found');
    }

    const trainer = await this.trainerRepository.findById(participant.trainerId);
    if (!trainer) {
      throw new Error('Trainer not found');
    }

    // Validate item in inventory and get its category
    const itemInfo = await this.trainerInventoryRepository.getItemByName(trainer.id, itemName);
    if (!itemInfo || itemInfo.quantity < 1) {
      throw new Error(`You don't have any "${itemName}" in your inventory`);
    }

    // Get target (could be own monster or opponent for pokeballs)
    const target = await this.getItemTarget(battleId, participant, itemName, targetName);
    if (!target) {
      throw new Error('Invalid target for item');
    }

    // Use the item
    const itemResult = await this.applyItemEffect(target, itemName, participant);

    // Calculate word count bonus
    const wordCount = message.split(' ').filter((word) => word.length > 0).length;

    // Get current turn number
    const currentTurn = await this.getCurrentTurnNumber(battleId);

    const targetData = target.monsterData as MonsterData;

    // Create battle turn
    await this.battleTurnRepository.create({
      battleId,
      turnNumber: currentTurn,
      participantId: participant.id,
      monsterId: target.id,
      actionType: 'item',
      actionData: {
        item_name: itemName,
        target_id: target.id,
        target_name: targetName ?? targetData.name,
      },
      resultData: itemResult as unknown as Record<string, unknown>,
      messageContent: message,
      wordCount,
    });

    // Update participant message count
    await this.battleParticipantRepository.addMessage(participant.id, wordCount);

    // Consume item from inventory
    await this.trainerInventoryRepository.removeItem(trainer.id, itemInfo.category, itemName, 1);

    // Log the action
    await this.logAndSendBattleAction(battleId, itemResult.message, {
      participantId: participant.id,
      turnNumber: currentTurn,
    });

    // Process AI turns if needed (after player action)
    await this.processAITurns(battleId);

    return {
      message: itemResult.message,
      wordCount,
      itemResult,
    };
  }

  /**
   * Get target monster for attack
   */
  async getTargetMonster(
    battleId: number,
    attackerTeam: TeamSide,
    targetName: string | null
  ): Promise<BattleMonsterWithDetails | null> {
    const opponentTeam: TeamSide = attackerTeam === 'players' ? 'opponents' : 'players';
    const opponentMonsters = await this.battleMonsterRepository.findByBattleId(battleId, {
      teamSide: opponentTeam,
      isActive: true,
    });

    const validTargets = opponentMonsters.filter((m) => !m.isFainted);

    if (validTargets.length === 0) {
      return null;
    }

    // If target name is specified, find by name or index
    if (targetName) {
      // Check if targetName is a number (index-based targeting)
      const targetIndex = parseInt(targetName);
      if (!isNaN(targetIndex) && targetIndex >= 1 && targetIndex <= validTargets.length) {
        return validTargets[targetIndex - 1] ?? null;
      }

      // Check for name-based targeting
      const namedTarget = validTargets.find((m) => {
        const monsterData = m.monsterData as MonsterData;
        return monsterData.name?.toLowerCase() === targetName.toLowerCase();
      });
      if (namedTarget) {
        return namedTarget;
      }

      // Check for partial name matches
      const partialTarget = validTargets.find((m) => {
        const monsterData = m.monsterData as MonsterData;
        return monsterData.name?.toLowerCase().includes(targetName.toLowerCase());
      });
      if (partialTarget) {
        return partialTarget;
      }

      throw new Error(
        `Target "${targetName}" not found. Use a number (1-${validTargets.length}) or monster name.`
      );
    }

    // Default to first available target
    return validTargets[0] ?? null;
  }

  /**
   * Get target for item use
   */
  async getItemTarget(
    battleId: number,
    participant: BattleParticipant,
    itemName: string,
    targetName: string | null
  ): Promise<BattleMonsterWithDetails | null> {
    // For healing items, target own monsters
    if (this.isHealingItem(itemName)) {
      const ownMonsters = await this.battleMonsterRepository.findByBattleId(battleId, {
        participantId: participant.id,
      });
      const validTargets = ownMonsters.filter((m) => !m.isFainted);

      if (validTargets.length === 0) {
        return null;
      }

      // If target name is specified, find by name or index
      if (targetName) {
        const targetIndex = parseInt(targetName);
        if (!isNaN(targetIndex) && targetIndex >= 1 && targetIndex <= validTargets.length) {
          return validTargets[targetIndex - 1] ?? null;
        }

        const namedTarget = validTargets.find((m) => {
          const monsterData = m.monsterData as MonsterData;
          return monsterData.name?.toLowerCase() === targetName.toLowerCase();
        });
        if (namedTarget) {
          return namedTarget;
        }

        const partialTarget = validTargets.find((m) => {
          const monsterData = m.monsterData as MonsterData;
          return monsterData.name?.toLowerCase().includes(targetName.toLowerCase());
        });
        if (partialTarget) {
          return partialTarget;
        }
      }

      // Default to first active monster
      return validTargets.find((m) => m.isActive) ?? validTargets[0] ?? null;
    }

    // For pokeballs, target opponent monsters
    if (this.isPokeball(itemName)) {
      return this.getTargetMonster(battleId, participant.teamSide, targetName);
    }

    return null;
  }

  /**
   * Apply item effect
   */
  async applyItemEffect(
    target: BattleMonster,
    itemName: string,
    participant: BattleParticipant
  ): Promise<ItemEffectResult> {
    if (this.isHealingItem(itemName)) {
      return this.applyHealingItem(target, itemName, participant);
    } else if (this.isPokeball(itemName)) {
      return this.attemptCapture(target, itemName, participant);
    }

    throw new Error(`Unknown item type: ${itemName}`);
  }

  /**
   * Apply healing item effect
   */
  async applyHealingItem(
    target: BattleMonster,
    itemName: string,
    participant: BattleParticipant
  ): Promise<ItemEffectResult> {
    const itemData = HEALING_ITEMS[itemName];
    if (!itemData) {
      throw new Error(`Unknown healing item: ${itemName}`);
    }

    const targetData = target.monsterData as MonsterData;
    const healResult = this.calculateHealing(targetData, itemData);
    await this.battleMonsterRepository.heal(target.id, healResult.healAmount);

    return {
      message: `${participant.trainerName} used ${itemName}! ${healResult.message}`,
      healAmount: healResult.healAmount,
    };
  }

  /**
   * Attempt to capture a monster (placeholder)
   */
  async attemptCapture(
    _target: BattleMonster,
    itemName: string,
    participant: BattleParticipant
  ): Promise<ItemEffectResult> {
    // TODO: Implement capture mechanics
    return {
      message: `${participant.trainerName} threw a ${itemName}!`,
    };
  }

  /**
   * Check if item is a healing item
   */
  isHealingItem(itemName: string): boolean {
    return HEALING_ITEM_NAMES.includes(itemName);
  }

  /**
   * Check if item is a pokeball
   */
  isPokeball(itemName: string): boolean {
    return itemName.toLowerCase().includes('ball');
  }

  /**
   * Validate trainer has item
   */
  async validateTrainerItem(trainerId: number, itemName: string): Promise<boolean> {
    return this.trainerInventoryRepository.hasItem(trainerId, itemName, 1);
  }

  /**
   * Get current turn number
   */
  async getCurrentTurnNumber(battleId: number): Promise<number> {
    const battle = await this.battleRepository.findById(battleId);
    return battle?.currentTurn ?? 1;
  }

  /**
   * Process AI turns
   */
  async processAITurns(battleId: number): Promise<void> {
    console.log('=== PROCESSING AI TURNS ===');
    const battleState = await this.getBattleState(battleId);

    console.log('Battle state:', {
      isActive: battleState.isActive,
      currentParticipant: battleState.currentParticipant
        ? {
            id: battleState.currentParticipant.id,
            name: battleState.currentParticipant.trainerName,
            type: battleState.currentParticipant.participantType,
          }
        : null,
    });

    // Process AI turns until it's a player's turn or battle ends
    let iterations = 0;
    const maxIterations = 10;

    let currentBattleState = battleState;

    while (
      currentBattleState.isActive &&
      currentBattleState.currentParticipant &&
      iterations < maxIterations
    ) {
      iterations++;
      const currentParticipant = currentBattleState.currentParticipant;

      console.log(`=== AI TURN ITERATION ${iterations} ===`);

      // If current participant is a player, stop
      if (currentParticipant.participantType === 'player') {
        console.log('Current participant is player, stopping AI processing');
        break;
      }

      console.log('Processing AI turn...');
      // Process AI turn
      const aiAction = await this.processAITurn(currentParticipant, currentBattleState);
      console.log('AI action:', aiAction);

      // Execute AI action based on type
      if (aiAction.action_type === 'attack') {
        console.log('Executing AI attack...');
        await this.executeAIAttack(battleId, currentParticipant, aiAction);
      } else if (aiAction.action_type === 'item') {
        console.log('Executing AI item use...');
        await this.executeAIItem(battleId, currentParticipant, aiAction);
      }

      // Check if battle ended
      const battleEndResult = await this.checkBattleConditions(battleId);
      if (battleEndResult) {
        console.log('Battle ended, stopping AI processing');
        await this.endBattle(battleId, battleEndResult.winner_type, battleEndResult.message);
        break;
      }

      // Move to next turn
      console.log('Advancing to next turn...');
      await this.advanceTurn(battleId);

      // Refresh battle state
      const newBattleState = await this.getBattleState(battleId);
      if (!newBattleState.isActive) {
        console.log('Battle no longer active, stopping AI processing');
        break;
      }

      currentBattleState = newBattleState;
    }

    if (iterations >= maxIterations) {
      console.warn('AI turn processing stopped due to max iterations reached');
    }

    console.log('=== AI TURNS PROCESSING COMPLETE ===');
  }

  /**
   * Execute AI attack
   */
  async executeAIAttack(
    battleId: number,
    participant: BattleParticipantWithDetails,
    aiAction: AIAction
  ): Promise<{ battleEnded?: boolean; result?: BattleEndResult } | void> {
    const { move_name, target_id } = aiAction.action_data;

    if (!move_name || !target_id) {
      return;
    }

    // Get AI monster
    const aiMonsters = await this.battleMonsterRepository.findActiveByParticipant(participant.id);
    if (aiMonsters.length === 0) {
      return;
    }

    const attacker = aiMonsters[0];
    if (!attacker) {
      return;
    }

    const target = await this.battleMonsterRepository.findById(target_id);
    if (!target) {
      return;
    }

    // Get move data
    const move = await this.moveRepository.findByName(move_name);
    if (!move) {
      return;
    }

    const attackerData = attacker.monsterData as MonsterData;
    const targetData = target.monsterData as MonsterData;

    // Calculate and apply damage
    const damageResult = await this.calculateDamage(attackerData, targetData, move);

    let damageDealt = 0;
    if (damageResult.hits) {
      const damageApplied = await this.battleMonsterRepository.dealDamage(
        target.id,
        damageResult.damage
      );
      damageDealt = damageApplied.damageDealt;
    }

    // Get current turn number
    const currentTurn = await this.getCurrentTurnNumber(battleId);

    // Create turn record
    await this.battleTurnRepository.create({
      battleId,
      turnNumber: currentTurn,
      participantId: participant.id,
      monsterId: attacker.id,
      actionType: 'attack',
      actionData: aiAction.action_data as Record<string, unknown>,
      resultData: damageResult as Record<string, unknown>,
      damageDealt,
      messageContent: aiAction.ai_message ?? '',
      wordCount: aiAction.word_count ?? 0,
    });

    // Log the action
    await this.logAndSendBattleAction(
      battleId,
      `${aiAction.ai_message}\n${damageResult.message}`,
      { participantId: participant.id }
    );

    // Check if target fainted after AI attack
    if (damageResult.hits && damageDealt > 0) {
      const updatedTarget = await this.battleMonsterRepository.findById(target.id);

      if (updatedTarget && (updatedTarget.isFainted || updatedTarget.currentHp <= 0)) {
        console.log('=== AI ATTACK CAUSED KNOCKOUT ===');
        await this.handleMonsterKnockout(battleId, updatedTarget);

        // Check if battle should end
        const battleEndResult = await this.checkBattleConditions(battleId);
        if (battleEndResult) {
          await this.endBattle(battleId, battleEndResult.winner_type, battleEndResult.message);
          return { battleEnded: true, result: battleEndResult };
        }
      }
    }
  }

  /**
   * Execute AI item use
   */
  async executeAIItem(
    battleId: number,
    participant: BattleParticipantWithDetails,
    aiAction: AIAction
  ): Promise<void> {
    const { item_name, target_id } = aiAction.action_data;

    if (!item_name || !target_id) {
      return;
    }

    const target = await this.battleMonsterRepository.findById(target_id);

    if (target && this.isHealingItem(item_name)) {
      const healResult = await this.applyHealingItem(target, item_name, participant);

      const currentTurn = await this.getCurrentTurnNumber(battleId);

      await this.battleTurnRepository.create({
        battleId,
        turnNumber: currentTurn,
        participantId: participant.id,
        monsterId: target.id,
        actionType: 'item',
        actionData: aiAction.action_data as Record<string, unknown>,
        resultData: healResult as unknown as Record<string, unknown>,
        messageContent: aiAction.ai_message ?? '',
        wordCount: aiAction.word_count ?? 0,
      });

      await this.logAndSendBattleAction(
        battleId,
        `${aiAction.ai_message}\n${healResult.message}`,
        { participantId: participant.id }
      );
    }
  }

  /**
   * Release a monster to the battlefield
   */
  async releaseMonster(
    battleId: number,
    discordUserId: string,
    monsterName: string,
    message: string
  ): Promise<ReleaseResult> {
    // Get participant
    const participant = await this.battleParticipantRepository.findByBattleAndUser(
      battleId,
      discordUserId
    );
    if (!participant) {
      throw new Error('You are not participating in this battle');
    }

    // Check if battle is waiting for a switch out
    const battle = await this.battleRepository.findById(battleId);
    const battleData = battle?.battleData as { waiting_for_switch?: { participant_id: number } };
    const waitingForSwitch = battleData?.waiting_for_switch;
    let isSwitchCompletion = false;

    if (waitingForSwitch?.participant_id === participant.id) {
      // Clear the switch state
      await this.completeSwitchOut(battleId, participant, monsterName, message, waitingForSwitch);
      isSwitchCompletion = true;
    }

    // Find the monster by name in trainer's collection
    if (!participant.trainerId) {
      throw new Error('No trainer associated with participant');
    }

    const monsters = await this.monsterRepository.findByTrainerId(participant.trainerId);
    const targetMonster = monsters.find(
      (m) => m.name?.toLowerCase() === monsterName.toLowerCase()
    );

    if (!targetMonster) {
      throw new Error(`Monster "${monsterName}" not found in your collection`);
    }

    // Check if monster is already in battle
    const alreadyInBattle = await this.battleMonsterRepository.findByBattleAndMonster(
      battleId,
      targetMonster.id
    );

    if (alreadyInBattle) {
      if (alreadyInBattle.isActive) {
        throw new Error(`${monsterName} is already active in battle`);
      } else if (alreadyInBattle.isFainted || alreadyInBattle.currentHp <= 0) {
        throw new Error(`${monsterName} is fainted and cannot be released`);
      } else {
        // Reactivate the monster
        await this.battleMonsterRepository.setActive(alreadyInBattle.id);

        const wordCount = message.split(' ').filter((word) => word.length > 0).length;
        const currentTurn = await this.getCurrentTurnNumber(battleId);

        await this.battleTurnRepository.create({
          battleId,
          turnNumber: currentTurn,
          participantId: participant.id,
          monsterId: alreadyInBattle.id,
          actionType: 'switch',
          actionData: { monster_name: monsterName, action: 'release' },
          messageContent: message,
          wordCount,
        });

        await this.battleParticipantRepository.addMessage(participant.id, wordCount);

        const healthBar = this.generateHealthBar(
          alreadyInBattle.currentHp,
          alreadyInBattle.maxHp
        );
        const healthPercent = Math.round(
          (alreadyInBattle.currentHp / alreadyInBattle.maxHp) * 100
        );
        const healthInfo = `\n❤️ **${monsterName}**: ${alreadyInBattle.currentHp}/${alreadyInBattle.maxHp} HP (${healthPercent}%)\n${healthBar}`;

        await this.logAndSendBattleAction(
          battleId,
          `🔄 **${participant.trainerName}** sent out **${monsterName}**!${healthInfo}`,
          { participantId: participant.id }
        );

        if (isSwitchCompletion) {
          await this.advanceTurn(battleId);
          await this.processCurrentTurn(battleId);
        }

        return {
          message: `${monsterName} is back in the battle!`,
          wordCount,
          switchCompleted: isSwitchCompletion,
        };
      }
    }

    // Add new monster to battle
    const battleMonster = await this.addMonsterToBattle(battleId, participant.id, targetMonster);

    const wordCount = message.split(' ').filter((word) => word.length > 0).length;
    const currentTurn = await this.getCurrentTurnNumber(battleId);

    await this.battleTurnRepository.create({
      battleId,
      turnNumber: currentTurn,
      participantId: participant.id,
      monsterId: battleMonster.id,
      actionType: 'switch',
      actionData: { monster_name: monsterName, action: 'release' },
      messageContent: message,
      wordCount,
    });

    await this.battleParticipantRepository.addMessage(participant.id, wordCount);

    const healthBar = this.generateHealthBar(battleMonster.currentHp, battleMonster.maxHp);
    const healthInfo = `\n❤️ **${monsterName}**: ${battleMonster.currentHp}/${battleMonster.maxHp} HP (100%)\n${healthBar}`;

    await this.logAndSendBattleAction(
      battleId,
      `🔄 **${participant.trainerName}** sent out **${monsterName}**!${healthInfo}`,
      { participantId: participant.id }
    );

    if (isSwitchCompletion) {
      await this.advanceTurn(battleId);
      await this.processCurrentTurn(battleId);
    }

    return {
      message: `${monsterName} enters the battle!`,
      wordCount,
      switchCompleted: isSwitchCompletion,
    };
  }

  /**
   * Withdraw a monster from the battlefield
   */
  async withdrawMonster(
    battleId: number,
    discordUserId: string,
    monsterName: string,
    message: string
  ): Promise<WithdrawResult> {
    // Get participant
    const participant = await this.battleParticipantRepository.findByBattleAndUser(
      battleId,
      discordUserId
    );
    if (!participant) {
      throw new Error('You are not participating in this battle');
    }

    // Find the monster in battle
    const battleMonsters = await this.battleMonsterRepository.findByBattleId(battleId, {
      participantId: participant.id,
    });

    const targetBattleMonster = battleMonsters.find((bm) => {
      const monsterData = bm.monsterData as MonsterData;
      return (
        monsterData.name?.toLowerCase() === monsterName.toLowerCase() && bm.isActive
      );
    });

    if (!targetBattleMonster) {
      throw new Error(`${monsterName} is not currently active in battle`);
    }

    // Check if this is the last active monster
    const activeMonsters = battleMonsters.filter((bm) => bm.isActive && !bm.isFainted);
    if (activeMonsters.length <= 1) {
      throw new Error('You cannot withdraw your last active monster');
    }

    // Withdraw the monster
    await this.battleMonsterRepository.setInactive(targetBattleMonster.id);

    const wordCount = message.split(' ').filter((word) => word.length > 0).length;
    const currentTurn = await this.getCurrentTurnNumber(battleId);

    await this.battleTurnRepository.create({
      battleId,
      turnNumber: currentTurn,
      participantId: participant.id,
      monsterId: targetBattleMonster.id,
      actionType: 'switch',
      actionData: { monster_name: monsterName, action: 'withdraw' },
      messageContent: message,
      wordCount,
    });

    await this.battleParticipantRepository.addMessage(participant.id, wordCount);

    await this.logAndSendBattleAction(
      battleId,
      `↩️ **${participant.trainerName}** withdrew **${monsterName}**!`,
      { participantId: participant.id }
    );

    return {
      message: `${monsterName} has been withdrawn from battle!`,
      wordCount,
    };
  }

  /**
   * Log battle action and send to Discord
   */
  async logAndSendBattleAction(
    battleId: number,
    message: string,
    options: { participantId?: number; turnNumber?: number } = {}
  ): Promise<void> {
    // Log to database
    await this.battleLogRepository.logAction(battleId, message, {
      participantId: options.participantId,
      turnNumber: options.turnNumber,
    });

    // Send to Discord thread
    await this.sendBattleMessageToDiscord(battleId, message);
  }

  /**
   * Generate a visual health bar
   */
  generateHealthBar(currentHp: number, maxHp: number): string {
    const barLength = 20;
    const hpPercent = currentHp / maxHp;
    const filledBars = Math.floor(hpPercent * barLength);
    const emptyBars = barLength - filledBars;

    let healthColor = '🟢'; // Green
    if (hpPercent < 0.25) {
      healthColor = '🔴'; // Red
    } else if (hpPercent < 0.5) {
      healthColor = '🟡'; // Yellow
    }

    const bar = healthColor.repeat(filledBars) + '⬜'.repeat(emptyBars);
    return `[${bar}]`;
  }

  /**
   * Handle switch out requirement after using moves like Parting Shot
   */
  async handleSwitchOut(
    battleId: number,
    participant: BattleParticipantWithDetails,
    currentMonster: BattleMonster,
    moveMessage: string
  ): Promise<AttackResult> {
    console.log('=== HANDLING SWITCH OUT ===');

    // Withdraw the current monster from battle
    await this.battleMonsterRepository.update(currentMonster.id, { isActive: false });

    // Create switch prompt message
    const switchPromptMessage =
      `${moveMessage}\n\n🔄 **${participant.trainerName}** must choose a monster to switch in!\n\n` +
      `**Use:** \`/release [monster name]\` to send in a monster from your collection.`;

    await this.logAndSendBattleAction(battleId, switchPromptMessage, {
      participantId: participant.id,
    });

    // Set battle state to waiting for switch
    const battle = await this.battleRepository.findById(battleId);
    if (battle) {
      await this.battleRepository.update(battleId, {
        battleData: {
          ...battle.battleData,
          waiting_for_switch: {
            participant_id: participant.id,
            discord_user_id: participant.discordUserId,
            switched_out_monster_id: currentMonster.id,
          },
        },
      });
    }

    return {
      success: true,
      message: 'Switch out initiated',
    };
  }

  /**
   * Complete switch out by activating the selected monster
   */
  async completeSwitchOut(
    battleId: number,
    _participant: BattleParticipant,
    _monsterIdentifier: string,
    _message: string,
    _waitingForSwitch: unknown
  ): Promise<{ isSwitchCompletion: boolean; shouldAdvanceTurn: boolean }> {
    console.log('=== COMPLETING SWITCH OUT ===');

    // Clear the waiting for switch state
    const battle = await this.battleRepository.findById(battleId);
    if (battle) {
      const updatedBattleData = { ...battle.battleData } as Record<string, unknown>;
      delete updatedBattleData.waiting_for_switch;

      await this.battleRepository.update(battleId, {
        battleData: updatedBattleData,
      });
    }

    return {
      isSwitchCompletion: true,
      shouldAdvanceTurn: true,
    };
  }

  // ============================================================================
  // Placeholder Methods (require additional services to be translated)
  // ============================================================================

  /**
   * Process status effects for a monster
   * NOTE: Requires StatusEffectManager to be fully implemented
   */
  private async processStatusEffects(
    _battleId: number,
    monster: BattleMonster
  ): Promise<StatusProcessingResult> {
    // Placeholder implementation
    const statusEffects = monster.statusEffects;
    const messages: string[] = [];
    let canAct = true;

    for (const effect of statusEffects) {
      if (effect.type === 'paralysis' && Math.random() < 0.25) {
        canAct = false;
        const monsterData = monster.monsterData as MonsterData;
        messages.push(`${monsterData.name ?? 'Monster'} is paralyzed and cannot move!`);
      } else if (effect.type === 'sleep') {
        canAct = false;
        const monsterData = monster.monsterData as MonsterData;
        messages.push(`${monsterData.name ?? 'Monster'} is fast asleep!`);
      } else if (effect.type === 'freeze') {
        if (Math.random() < 0.2) {
          messages.push(`${(monster.monsterData as MonsterData).name ?? 'Monster'} thawed out!`);
        } else {
          canAct = false;
          messages.push(`${(monster.monsterData as MonsterData).name ?? 'Monster'} is frozen solid!`);
        }
      }
    }

    return { canAct, messages };
  }

  /**
   * Calculate damage for an attack using DamageCalculatorService
   */
  private async calculateDamage(
    attacker: MonsterData,
    defender: MonsterData,
    move: Move
  ): Promise<DamageResult> {
    // Convert Move to MoveData format for DamageCalculatorService
    const moveData: MoveData = {
      move_name: move.moveName,
      moveName: move.moveName,
      power: move.power,
      accuracy: move.accuracy,
      move_type: move.moveType,
      type: move.moveType,
      MoveType: move.moveCategory ?? undefined,
      move_category: move.moveCategory ?? undefined,
      effect_chance: move.effectChance ?? undefined,
      description: move.description ?? undefined,
    };

    // Use DamageCalculatorService for damage calculation
    const result = await this.damageCalculator.calculateDamage(attacker, defender, moveData);

    // Convert DamageCalcResult to DamageResult (add moveData as Move type)
    return {
      ...result,
      moveData: move,
    };
  }

  /**
   * Calculate status effect from move
   */
  private calculateStatusEffect(
    _attacker: MonsterData,
    _defender: MonsterData,
    move: Move
  ): StatusEffectResult {
    // Simplified status effect calculation
    const effectChance = move.effectChance ?? 0;

    if (effectChance === 0 || Math.random() * 100 > effectChance) {
      return { applied: false };
    }

    // Parse effect from description (simplified)
    const description = move.description?.toLowerCase() ?? '';
    let effectType = 'unknown';
    let duration = 3;

    if (description.includes('burn')) {
      effectType = 'burn';
    } else if (description.includes('poison')) {
      effectType = 'poison';
    } else if (description.includes('paralyze') || description.includes('paralysis')) {
      effectType = 'paralysis';
    } else if (description.includes('sleep')) {
      effectType = 'sleep';
      duration = 2;
    } else if (description.includes('freeze')) {
      effectType = 'freeze';
      duration = 2;
    }

    return {
      applied: effectType !== 'unknown',
      effect: { type: effectType, duration },
    };
  }

  /**
   * Apply status effect to monster
   */
  private async applyStatusEffect(
    _battleId: number,
    monster: BattleMonster,
    effectType: string,
    duration: number
  ): Promise<{ success: boolean; message: string }> {
    await this.battleMonsterRepository.addStatusEffect(monster.id, {
      type: effectType,
      duration,
    });

    const monsterData = monster.monsterData as MonsterData;
    return {
      success: true,
      message: `${monsterData.name ?? 'Monster'} was affected by ${effectType}!`,
    };
  }

  /**
   * Calculate healing amount
   */
  private calculateHealing(
    target: MonsterData,
    item: { heal_amount?: number; heal_percentage?: number }
  ): HealingResult {
    let healAmount = 0;
    const maxHp = target.max_hp ?? 100;
    const currentHp = target.current_hp ?? maxHp;

    if (item.heal_amount) {
      healAmount = item.heal_amount;
    } else if (item.heal_percentage) {
      healAmount = Math.floor(maxHp * (item.heal_percentage / 100));
    } else {
      healAmount = Math.floor(maxHp * 0.2);
    }

    const actualHeal = Math.min(healAmount, maxHp - currentHp);

    return {
      healAmount: actualHeal,
      newHp: currentHp + actualHeal,
      message: `${target.name ?? 'Target'} recovered ${actualHeal} HP!`,
    };
  }

  /**
   * Get battle state
   */
  private async getBattleState(battleId: number): Promise<BattleState> {
    const battle = await this.battleRepository.findById(battleId);

    if (!battle || battle?.status !== 'active') {
      return { isActive: false, currentParticipant: null, battle: null };
    }

    const participants = await this.battleParticipantRepository.findActiveByBattleId(battleId);
    const currentParticipant = participants[battle.currentParticipantIndex] ?? null;

    return {
      isActive: true,
      currentParticipant,
      battle,
    };
  }

  /**
   * Process AI turn
   * NOTE: Uses BattleAIService
   */
  private async processAITurn(
    participant: BattleParticipantWithDetails,
    battleState: BattleState
  ): Promise<AIAction> {
    // Simplified AI - just attack with random move
    const monsters = await this.battleMonsterRepository.findActiveByParticipant(participant.id);
    const activeMonster = monsters[0];

    if (!activeMonster) {
      return { action_type: 'skip', action_data: {}, ai_message: 'AI has no active monsters' };
    }

    const monsterData = activeMonster.monsterData as MonsterData;
    const moves = monsterData.moves ?? monsterData.moveset ?? [];

    if (moves.length === 0) {
      return { action_type: 'skip', action_data: {}, ai_message: 'AI monster has no moves' };
    }

    const randomMove = moves[Math.floor(Math.random() * moves.length)] as string;

    // Get opponent targets
    const opponentTeam: TeamSide = participant.teamSide === 'players' ? 'opponents' : 'players';
    const opponents = await this.battleMonsterRepository.findByBattleId(
      battleState.battle?.id ?? 0,
      {
        teamSide: opponentTeam,
        isActive: true,
      }
    );
    const validTargets = opponents.filter((m) => !m.isFainted);
    const target = validTargets[Math.floor(Math.random() * validTargets.length)];

    if (!target) {
      return { action_type: 'skip', action_data: {}, ai_message: 'AI has no valid targets' };
    }

    const targetData = target.monsterData as MonsterData;

    return {
      action_type: 'attack',
      action_data: {
        move_name: randomMove,
        target_id: target.id,
      },
      ai_message: `${monsterData.name ?? 'Enemy'} prepares to attack ${targetData.name ?? 'target'}!`,
      word_count: 0,
    };
  }

  /**
   * Check battle end conditions
   */
  private async checkBattleConditions(battleId: number): Promise<BattleEndResult | null> {
    const participants = await this.battleParticipantRepository.findByBattleId(battleId);

    // Group by team
    const playerParticipants = participants.filter((p) => p.teamSide === 'players');
    const opponentParticipants = participants.filter((p) => p.teamSide === 'opponents');

    // Check if all monsters on a team are fainted
    let playersHaveActive = false;
    let opponentsHaveActive = false;

    for (const p of playerParticipants) {
      const monsters = await this.battleMonsterRepository.findByBattleId(battleId, {
        participantId: p.id,
      });
      if (monsters.some((m) => !m.isFainted && m.currentHp > 0)) {
        playersHaveActive = true;
        break;
      }
    }

    for (const p of opponentParticipants) {
      const monsters = await this.battleMonsterRepository.findByBattleId(battleId, {
        participantId: p.id,
      });
      if (monsters.some((m) => !m.isFainted && m.currentHp > 0)) {
        opponentsHaveActive = true;
        break;
      }
    }

    if (!playersHaveActive) {
      return {
        winner_type: 'opponents',
        message: '🏆 **Battle Over!** The opponents win!',
      };
    }

    if (!opponentsHaveActive) {
      return {
        winner_type: 'players',
        message: '🏆 **Battle Over!** The players win!',
      };
    }

    return null;
  }

  /**
   * End the battle
   */
  private async endBattle(
    battleId: number,
    winnerType: string,
    message: string
  ): Promise<void> {
    await this.battleRepository.complete(
      battleId,
      winnerType as 'players' | 'opponents' | 'draw'
    );
    await this.logAndSendBattleAction(battleId, message, {});
  }

  /**
   * Handle monster knockout
   */
  private async handleMonsterKnockout(
    _battleId: number,
    monster: BattleMonster
  ): Promise<void> {
    const monsterData = monster.monsterData as MonsterData;
    console.log(`Monster ${monsterData.name ?? 'Unknown'} was knocked out!`);

    // Mark as fainted
    await this.battleMonsterRepository.update(monster.id, {
      isFainted: true,
      isActive: false,
    });

    // TODO: Award experience/levels to the attacker's monster
  }

  /**
   * Advance to next turn
   */
  private async advanceTurn(battleId: number): Promise<void> {
    const battle = await this.battleRepository.findById(battleId);
    if (!battle) {
      return;
    }

    const participants = await this.battleParticipantRepository.findActiveByBattleId(battleId);
    const nextIndex = (battle.currentParticipantIndex + 1) % participants.length;

    await this.battleRepository.startNextTurn(battleId, nextIndex);
  }

  /**
   * Process current turn
   */
  private async processCurrentTurn(battleId: number): Promise<void> {
    // Process AI turns if needed
    await this.processAITurns(battleId);
  }

  /**
   * Add monster to battle
   */
  private async addMonsterToBattle(
    battleId: number,
    participantId: number,
    monster: { id: number; name: string | null; [key: string]: unknown }
  ): Promise<BattleMonster> {
    const hp = (monster.hp as number) ?? 100;

    return this.battleMonsterRepository.create({
      battleId,
      participantId,
      monsterId: monster.id,
      monsterData: monster as Record<string, unknown>,
      currentHp: hp,
      maxHp: hp,
      isActive: true,
    });
  }

  /**
   * Send message to Discord
   * NOTE: Requires Discord integration
   */
  private async sendBattleMessageToDiscord(battleId: number, message: string): Promise<void> {
    // Placeholder - would integrate with AdventureDiscordService
    console.log(`[Battle ${battleId}] Discord message: ${message}`);
  }
}
