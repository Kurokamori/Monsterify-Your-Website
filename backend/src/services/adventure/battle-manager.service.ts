import {
  BattleRepository,
  BattleInstance,
  BattleWinnerType,
} from '../../repositories/battle.repository';
import {
  BattleParticipantRepository,
  BattleParticipantWithDetails,
  TeamSide,
} from '../../repositories/battle-participant.repository';
import {
  BattleMonsterRepository,
  BattleMonster,
  BattleMonsterWithDetails,
} from '../../repositories/battle-monster.repository';
import { BattleTurnRepository, BattleStatistics } from '../../repositories/battle-turn.repository';
import { BattleLogRepository } from '../../repositories/battle-log.repository';
import { TrainerRepository } from '../../repositories/trainer.repository';
import { MonsterRepository } from '../../repositories/monster.repository';
import { AdventureRepository } from '../../repositories/adventure.repository';
import { AdventureDiscordService } from './adventure-discord.service';
import {
  StatusEffectService,
  createStatusEffectService,
  StatusEffectMonster,
  StatusEffectProcessingResult,
  ActiveStatusEffect,
  IStatusEffectBattleMonsterRepository,
  IStatusEffectBattleLog,
} from './status-effect.service';
import {
  DamageCalculatorService,
  createDamageCalculatorService,
  MonsterData as DamageCalcMonsterData,
  MoveData,
} from './damage-calculator.service';
import { MonsterRollerService, RollParams, type UserSettings } from '../monster-roller.service';

// ============================================================================
// Types
// ============================================================================

export type BattleType = 'wild' | 'trainer' | 'pvp';

export type EncounterInput = {
  id: number;
  adventureId: number;
  encounterType: string;
  encounterData: EncounterDataInput;
};

export type EncounterDataInput = {
  groups?: WildMonsterGroupInput[];
  monsters?: EncounterMonsterInput[];
  trainers?: EncounterTrainerInput[];
  pvp?: boolean;
  challenger?: string;
  opponentTrainers?: string[];
  winCondition?: { knockoutCount: number };
};

export type WildMonsterGroupInput = {
  species1: string | null;
  species2: string | null;
  species3: string | null;
  type1: string | null;
  type2: string | null;
  type3: string | null;
  type4: string | null;
  type5: string | null;
  attribute: string | null;
  level: number;
};

export type EncounterMonsterInput = {
  name: string;
  species1?: string | null;
  species2?: string | null;
  species3?: string | null;
  type1?: string | null;
  type2?: string | null;
  type3?: string | null;
  type4?: string | null;
  type5?: string | null;
  attribute?: string | null;
  level: number;
  health?: number;
  maxHealth?: number;
  hpTotal?: number;
  isWild: boolean;
};

export type EncounterTrainerInput = {
  name: string;
  level?: number;
};

export type BattleManagerState = {
  battle: BattleInstance;
  participants: BattleParticipantWithDetails[];
  monsters: BattleMonsterWithDetails[];
  recentLogs: unknown[];
  currentTurn: number;
  currentParticipant: BattleParticipantWithDetails | null;
  isActive: boolean;
};

export type BattleConditionResult = {
  result: 'victory' | 'loss' | 'draw';
  message: string;
  winnerType: TeamSide;
  winnerNames?: string;
  knockouts?: number;
  limit?: number;
};

export type LevelAward = {
  monsterId: number;
  monsterName: string;
  levelsAwarded: number;
  previousLevel: number;
  newLevel: number;
  participantName: string;
};

export type KnockoutResult = {
  knockedOutMonster: BattleMonsterWithDetails;
  levelAwards: LevelAward[];
  levelsAwarded: number;
};

export type ParticipantRewardResult = {
  participantId: number;
  discordUserId: string | null;
  trainerId: number | null;
  trainerName: string;
  experience: number;
  coins: number;
  wordCount: number;
  messageCount: number;
  isWinner: boolean;
};

export type BattleRewardResult = {
  participants: ParticipantRewardResult[];
  totalExperience: number;
  totalCoins: number;
};

export type BattleEndResult = {
  battleId: number;
  winner: string;
  winnerNames: string | null;
  displayWinner: string;
  reason: string;
  rewards: BattleRewardResult;
};

export type ForceEndResult = BattleEndResult & {
  success: boolean;
};

type MonsterDataRecord = Record<string, unknown> & {
  name?: string;
  species1?: string;
  species2?: string;
  species3?: string;
  type1?: string;
  type2?: string;
  type3?: string;
  type4?: string;
  type5?: string;
  attribute?: string;
  level?: number;
  hp_total?: number;
  hp?: number;
  img_link?: string;
  isWild?: boolean;
};

// ============================================================================
// Service
// ============================================================================

/**
 * BattleManagerService orchestrates the full battle lifecycle.
 *
 * Responsibilities:
 * - Battle initialization from encounters
 * - Participant management (players, NPCs, wild monsters)
 * - Monster generation from encounter data
 * - Turn management and AI turn processing
 * - Knockout handling with level awards
 * - NPC monster switching
 * - Win/loss condition evaluation (faint-based + KO count)
 * - PvP battle support
 * - Battle rewards calculation
 * - Discord message integration
 *
 * Complements BattleActionService which handles individual player actions
 * (attack, item, release, withdraw).
 */
export class BattleManagerService {
  private battleRepo: BattleRepository;
  private participantRepo: BattleParticipantRepository;
  private monsterRepo: BattleMonsterRepository;
  private turnRepo: BattleTurnRepository;
  private logRepo: BattleLogRepository;
  private trainerRepo: TrainerRepository;
  private monsterDataRepo: MonsterRepository;
  private adventureRepo: AdventureRepository;
  private discordService: AdventureDiscordService;
  private statusEffectService: StatusEffectService;
  private monsterRollerService: MonsterRollerService;
  private damageCalculator: DamageCalculatorService;

  /** In-memory cache of active battle states */
  private activeBattles: Map<number, BattleManagerState> = new Map();

  constructor(
    battleRepo?: BattleRepository,
    participantRepo?: BattleParticipantRepository,
    monsterRepo?: BattleMonsterRepository,
    turnRepo?: BattleTurnRepository,
    logRepo?: BattleLogRepository,
    trainerRepo?: TrainerRepository,
    monsterDataRepo?: MonsterRepository,
    adventureRepo?: AdventureRepository,
    discordService?: AdventureDiscordService,
    statusEffectService?: StatusEffectService,
    monsterRollerService?: MonsterRollerService,
    damageCalculator?: DamageCalculatorService
  ) {
    this.battleRepo = battleRepo ?? new BattleRepository();
    this.participantRepo = participantRepo ?? new BattleParticipantRepository();
    this.monsterRepo = monsterRepo ?? new BattleMonsterRepository();
    this.turnRepo = turnRepo ?? new BattleTurnRepository();
    this.logRepo = logRepo ?? new BattleLogRepository();
    this.trainerRepo = trainerRepo ?? new TrainerRepository();
    this.monsterDataRepo = monsterDataRepo ?? new MonsterRepository();
    this.adventureRepo = adventureRepo ?? new AdventureRepository();
    this.discordService = discordService ?? new AdventureDiscordService();

    // StatusEffectService requires interface adapters
    if (statusEffectService) {
      this.statusEffectService = statusEffectService;
    } else {
      const monsterAdapter = this.createMonsterRepoAdapter();
      const logAdapter = this.createLogAdapter();
      this.statusEffectService = createStatusEffectService(monsterAdapter, logAdapter);
    }

    this.monsterRollerService = monsterRollerService ?? new MonsterRollerService();
    this.damageCalculator = damageCalculator ?? createDamageCalculatorService();
  }

  // ==========================================================================
  // Battle Initialization
  // ==========================================================================

  /**
   * Initialize a new battle from an encounter
   */
  async initializeBattle(encounter: EncounterInput, discordUserId: string, userSettings?: UserSettings): Promise<BattleInstance> {
    // Use a per-battle roller with user settings if provided
    const originalRoller = this.monsterRollerService;
    if (userSettings) {
      this.monsterRollerService = new MonsterRollerService({ userSettings });
    }

    try {
      const battleType = this.determineBattleType(encounter);

      const battle = await this.battleRepo.create({
        adventureId: encounter.adventureId,
        encounterId: encounter.id,
        battleType,
        createdByDiscordUserId: discordUserId,
        battleData: {
          encounter_data: encounter.encounterData,
          initialized_at: new Date().toISOString(),
        },
      });

      await this.initializeParticipants(battle, encounter, discordUserId);

      const startMessage = `🔥 **BATTLE STARTED!** 🔥\nType: ${battleType.toUpperCase()}`;
      await this.logRepo.logSystem(battle.id, startMessage);
      await this.sendBattleMessageToDiscord(battle.id, startMessage);

      // Cache the initial state
      const state = await this.refreshBattleState(battle.id);
      this.activeBattles.set(battle.id, state);

      console.log(`Battle ${battle.id} initialized (type: ${battleType}) - waiting for players`);
      return battle;
    } finally {
      this.monsterRollerService = originalRoller;
    }
  }

  /**
   * Determine battle type from encounter data
   */
  determineBattleType(encounter: EncounterInput): BattleType {
    if (encounter.encounterType === 'wild') {
      return 'wild';
    }

    if (encounter.encounterType === 'battle') {
      const data = encounter.encounterData;
      if (data.pvp) {
        return 'pvp';
      }
      if (data.trainers && data.trainers.length > 0) {
        return 'trainer';
      }
    }

    return 'wild';
  }

  /**
   * Initialize battle participants from encounter data.
   * Player participants are created when they join with /battle [trainer_name].
   */
  private async initializeParticipants(
    battle: BattleInstance,
    encounter: EncounterInput,
    _discordUserId: string
  ): Promise<void> {
    if (battle.battleType === 'wild') {
      await this.initializeWildOpponents(battle, encounter.encounterData);
    } else if (battle.battleType === 'trainer') {
      await this.initializeTrainerOpponents(battle, encounter.encounterData);
    }

    await this.initializeAllMonsters(battle.id);
  }

  /**
   * Create wild monster participants from encounter groups
   */
  private async initializeWildOpponents(
    battle: BattleInstance,
    encounterData: EncounterDataInput
  ): Promise<void> {
    if (encounterData.groups && encounterData.groups.length > 0) {
      for (let i = 0; i < encounterData.groups.length; i++) {
        await this.participantRepo.create({
          battleId: battle.id,
          participantType: 'wild',
          trainerName: `Wild Group ${i + 1}`,
          teamSide: 'opponents',
          turnOrder: i + 1,
        });
      }
    } else if (encounterData.monsters && encounterData.monsters.length > 0) {
      await this.participantRepo.create({
        battleId: battle.id,
        participantType: 'wild',
        trainerName: 'Wild Monsters',
        teamSide: 'opponents',
        turnOrder: 1,
      });
    } else {
      console.warn('No groups or monsters found in wild encounter data');
    }
  }

  /**
   * Create NPC trainer participants from encounter data
   */
  private async initializeTrainerOpponents(
    battle: BattleInstance,
    encounterData: EncounterDataInput
  ): Promise<void> {
    if (!encounterData.trainers) {
      return;
    }

    for (let i = 0; i < encounterData.trainers.length; i++) {
      const trainer = encounterData.trainers[i];
      if (!trainer) {
        continue;
      }

      await this.participantRepo.create({
        battleId: battle.id,
        participantType: 'npc',
        trainerName: trainer.name || `Enemy Trainer ${i + 1}`,
        teamSide: 'opponents',
        turnOrder: i + 1,
      });
    }
  }

  /**
   * Generate monsters for all non-player participants
   */
  private async initializeAllMonsters(battleId: number): Promise<void> {
    const participants = await this.participantRepo.findByBattleId(battleId);

    for (const participant of participants) {
      if (participant.participantType === 'player') {
        continue;
      }
      await this.generateOpponentMonsters(participant);
    }
  }

  // ==========================================================================
  // Monster Generation
  // ==========================================================================

  /**
   * Generate monsters for an opponent participant based on encounter data
   */
  private async generateOpponentMonsters(
    participant: BattleParticipantWithDetails
  ): Promise<void> {
    const battle = await this.battleRepo.findById(participant.battleId);
    if (!battle) {
      throw new Error(`Battle ${participant.battleId} not found`);
    }

    const battleData = battle.battleData as { encounter_data?: EncounterDataInput };
    const encounterData = battleData.encounter_data;
    if (!encounterData) {
      console.warn(`No encounter data for battle ${battle.id}`);
      return;
    }

    if (participant.participantType === 'wild') {
      await this.generateWildMonsters(participant, encounterData);
    } else if (participant.participantType === 'npc') {
      await this.generateNPCMonsters(participant, encounterData);
    }
  }

  /**
   * Generate wild monsters from encounter groups or direct monster arrays
   */
  private async generateWildMonsters(
    participant: BattleParticipantWithDetails,
    encounterData: EncounterDataInput
  ): Promise<void> {
    if (encounterData.monsters && encounterData.monsters.length > 0) {
      // Direct monsters array (from auto-battles or converted encounters)
      for (let i = 0; i < encounterData.monsters.length; i++) {
        const monster = encounterData.monsters[i];
        if (monster) {
          await this.createBattleMonster(participant, this.toMonsterDataRecord(monster), i);
        }
      }
    } else if (encounterData.groups && encounterData.groups.length > 0) {
      // Regular wild encounter groups - find the group for this participant
      const groupIndex = participant.turnOrder - 1;
      const group = encounterData.groups[groupIndex];
      if (!group) {
        console.warn(`No group at index ${groupIndex} for participant ${participant.id}`);
        return;
      }

      const speciesName = [group.species1, group.species2, group.species3]
        .filter(Boolean)
        .join('/');

      const monsterData: MonsterDataRecord = {
        name: `Wild ${speciesName}`,
        species1: group.species1 ?? undefined,
        species2: group.species2 ?? undefined,
        species3: group.species3 ?? undefined,
        type1: group.type1 ?? undefined,
        type2: group.type2 ?? undefined,
        type3: group.type3 ?? undefined,
        type4: group.type4 ?? undefined,
        type5: group.type5 ?? undefined,
        attribute: group.attribute ?? undefined,
        level: group.level || 10,
        isWild: true,
      };

      await this.createBattleMonster(participant, monsterData, 0);
    } else {
      console.warn('No monsters or groups found for wild participant');
    }
  }

  /**
   * Generate NPC trainer monsters from encounter data
   */
  private async generateNPCMonsters(
    participant: BattleParticipantWithDetails,
    encounterData: EncounterDataInput
  ): Promise<void> {
    if (encounterData.monsters && encounterData.monsters.length > 0) {
      const trainerCount = encounterData.trainers?.length ?? 1;
      const monstersPerTrainer = Math.ceil(encounterData.monsters.length / trainerCount);
      const startIndex = (participant.turnOrder - 1) * monstersPerTrainer;
      const endIndex = Math.min(startIndex + monstersPerTrainer, encounterData.monsters.length);

      for (let i = startIndex; i < endIndex; i++) {
        const monster = encounterData.monsters[i];
        if (monster) {
          await this.createBattleMonster(
            participant,
            this.toMonsterDataRecord(monster),
            i - startIndex
          );
        }
      }
    } else {
      console.warn(`No monsters for NPC trainer ${participant.trainerName}, generating fallback`);
      await this.generateFallbackTrainerMonsters(participant);
    }
  }

  /**
   * Generate fallback monsters for a trainer participant using MonsterRollerService
   */
  private async generateFallbackTrainerMonsters(
    participant: BattleParticipantWithDetails
  ): Promise<void> {
    const monsterCount = Math.floor(Math.random() * 2) + 2; // 2-3 monsters

    for (let i = 0; i < monsterCount; i++) {
      try {
        const rollParams: RollParams = {
          legendary: false,
          mythical: false,
          species_max: 1,
          types_max: 2,
        };

        const monsters = await this.monsterRollerService.rollMany(rollParams, 1);
        const rolled = monsters[0];
        if (!rolled) {
          continue;
        }

        const monsterData: MonsterDataRecord = {
          name: `${participant.trainerName}'s ${rolled.species1 ?? 'Unknown'}`,
          species1: rolled.species1 ?? undefined,
          species2: rolled.species2 ?? undefined,
          species3: rolled.species3 ?? undefined,
          type1: rolled.type1 ?? undefined,
          type2: rolled.type2 ?? undefined,
          type3: rolled.type3 ?? undefined,
          type4: rolled.type4 ?? undefined,
          type5: rolled.type5 ?? undefined,
          attribute: rolled.attribute ?? undefined,
          level: Math.floor(Math.random() * 20) + 10, // Level 10-30
          isWild: false,
        };

        await this.createBattleMonster(participant, monsterData, i);
      } catch (error) {
        console.error(`Error generating fallback monster ${i} for ${participant.trainerName}:`, error);

        // Hardcoded fallback as last resort
        if (i === 0) {
          const fallback: MonsterDataRecord = {
            name: `${participant.trainerName}'s Pikachu`,
            species1: 'Pikachu',
            type1: 'Electric',
            level: 15,
            isWild: false,
          };
          await this.createBattleMonster(participant, fallback, 0);
        }
      }
    }
  }

  /**
   * Create a battle monster record from monster data
   */
  private async createBattleMonster(
    participant: BattleParticipantWithDetails,
    monsterData: MonsterDataRecord,
    position: number
  ): Promise<BattleMonster> {
    const maxHp = this.calculateMonsterHP(monsterData);

    return this.monsterRepo.create({
      battleId: participant.battleId,
      participantId: participant.id,
      monsterId: 0, // No actual monster ID for generated opponents
      monsterData: monsterData as Record<string, unknown>,
      currentHp: maxHp,
      maxHp,
      positionIndex: position,
      isActive: position === 0, // First monster is active
    });
  }

  /**
   * Calculate monster HP based on stats and level
   */
  calculateMonsterHP(monsterData: MonsterDataRecord): number {
    const level = monsterData.level ?? 1;
    const baseHp = (monsterData.hp_total as number) ?? 50;
    return Math.max(1, Math.floor(baseHp + (level * 2)));
  }

  // ==========================================================================
  // Player Management
  // ==========================================================================

  /**
   * Add a player to an existing battle
   */
  async addPlayerToBattle(
    battleId: number,
    discordUserId: string,
    trainerId: number
  ): Promise<BattleParticipantWithDetails> {
    // Check for existing participant
    const existingParticipant = await this.participantRepo.findByBattleAndUser(
      battleId,
      discordUserId
    );

    if (existingParticipant) {
      return this.updateExistingParticipant(existingParticipant, trainerId);
    }

    const trainer = await this.trainerRepo.findById(trainerId);
    if (!trainer) {
      throw new Error('Trainer not found');
    }

    const battle = await this.battleRepo.findById(battleId);
    if (!battle) {
      throw new Error('Battle not found');
    }

    const { teamSide, turnOrder } = await this.determinePlayerPlacement(
      battle,
      battleId,
      discordUserId,
      trainer.name
    );

    const participant = await this.participantRepo.create({
      battleId,
      participantType: 'player',
      discordUserId,
      trainerId,
      trainerName: trainer.name,
      teamSide,
      turnOrder,
    });

    // Log and notify
    const joinMessage = battle.battleType === 'pvp'
      ? `⚔️ **${trainer.name}** enters the PvP battle on the ${teamSide} side!`
      : `🎯 **${trainer.name}** joined the battle!`;

    await this.logRepo.logSystem(battleId, joinMessage);
    await this.sendBattleMessageToDiscord(battleId, joinMessage);
    await this.sendTurnOrderMessage(battleId);

    // Start turn processing if this is the first player to join
    const allParticipants = await this.participantRepo.findByBattleId(battleId);
    const playerParticipants = allParticipants.filter(
      (p) => p.participantType === 'player'
    );

    if (playerParticipants.length === 1) {
      console.log('First player joined - starting battle turn processing');
      await this.processCurrentTurn(battleId);
    }

    const fullParticipant = await this.participantRepo.findById(participant.id);
    if (!fullParticipant) {
      throw new Error('Failed to retrieve created participant');
    }
    return fullParticipant;
  }

  /**
   * Update an existing participant with trainer details
   */
  private async updateExistingParticipant(
    existing: BattleParticipantWithDetails,
    trainerId: number
  ): Promise<BattleParticipantWithDetails> {
    const trainer = await this.trainerRepo.findById(trainerId);
    if (!trainer) {
      throw new Error('Trainer not found');
    }

    const needsUpdate =
      existing.trainerId !== trainerId || existing.trainerName !== trainer.name;

    if (needsUpdate) {
      await this.participantRepo.update(existing.id, {
        trainerId,
        trainerName: trainer.name,
      });
    }

    const updated = await this.participantRepo.findById(existing.id);
    if (!updated) {
      throw new Error('Failed to retrieve updated participant');
    }
    return updated;
  }

  /**
   * Determine team side and turn order for a new player
   */
  private async determinePlayerPlacement(
    battle: BattleInstance,
    battleId: number,
    discordUserId: string,
    trainerName: string
  ): Promise<{ teamSide: TeamSide; turnOrder: number }> {
    if (battle.battleType === 'pvp') {
      return this.determinePvPPlacement(battle, battleId, discordUserId, trainerName);
    }

    // Regular battle - all players on same team
    const playerParticipants = await this.participantRepo.findByBattleId(battleId, {
      teamSide: 'players',
    });
    return { teamSide: 'players', turnOrder: playerParticipants.length };
  }

  /**
   * Determine PvP placement based on challenger/opponent roles
   */
  private async determinePvPPlacement(
    battle: BattleInstance,
    battleId: number,
    discordUserId: string,
    trainerName: string
  ): Promise<{ teamSide: TeamSide; turnOrder: number }> {
    const battleData = battle.battleData as {
      pvp?: boolean;
      challenger?: string;
      opponent_trainers?: string[];
    };
    const participants = await this.participantRepo.findByBattleId(battleId);

    const isChallenger = battleData.challenger === discordUserId;
    const isInvitedOpponent = battleData.opponent_trainers?.includes(trainerName) ?? false;

    if (isChallenger) {
      return { teamSide: 'players', turnOrder: 0 };
    }

    if (isInvitedOpponent) {
      const opponentCount = participants.filter(
        (p) => p.teamSide === 'opponents'
      ).length;
      return { teamSide: 'opponents', turnOrder: opponentCount };
    }

    throw new Error(`Trainer "${trainerName}" was not invited to this PvP battle`);
  }

  /**
   * Add a single monster to battle when released by a player
   */
  async addMonsterToBattle(
    battleId: number,
    participantId: number,
    monster: { id: number; name?: string | null; hp_total?: number; hp?: number; [key: string]: unknown }
  ): Promise<BattleMonster> {
    // Check if already in battle
    const existing = await this.monsterRepo.findByBattleAndMonster(battleId, monster.id);
    if (existing) {
      return existing;
    }

    // Determine position
    const participantMonsters = await this.monsterRepo.findByBattleId(battleId, {
      participantId,
    });

    const hp = monster.hp_total ?? monster.hp ?? 100;

    return this.monsterRepo.create({
      battleId,
      participantId,
      monsterId: monster.id,
      monsterData: monster as Record<string, unknown>,
      currentHp: hp,
      maxHp: hp,
      positionIndex: participantMonsters.length,
      isActive: true,
    });
  }

  // ==========================================================================
  // Turn Management
  // ==========================================================================

  /**
   * Advance to the next turn
   */
  async advanceTurn(battleId: number): Promise<void> {
    const battle = await this.battleRepo.findById(battleId);
    if (!battle) {
      throw new Error('Battle not found');
    }

    const participants = await this.participantRepo.findActiveByBattleId(battleId);
    if (participants.length === 0) {
      throw new Error('No active participants in battle');
    }

    const nextIndex = (battle.currentParticipantIndex + 1) % participants.length;
    await this.battleRepo.startNextTurn(battleId, nextIndex);
  }

  /**
   * Process the current turn: handle status effects, notifications, and AI actions.
   * Recursively processes AI turns until a player turn is reached.
   */
  async processCurrentTurn(battleId: number): Promise<void> {
    const battleState = await this.getBattleState(battleId);
    const currentParticipant = battleState.currentParticipant;

    if (!currentParticipant) {
      return;
    }

    // Process status effects for the current participant's monsters
    await this.processParticipantStatusEffects(battleId, currentParticipant);

    // Send turn notification
    await this.sendTurnNotification(battleId, currentParticipant);

    // If AI participant, execute their action and recurse
    if (
      currentParticipant.participantType === 'npc' ||
      currentParticipant.participantType === 'wild'
    ) {
      await this.executeAITurn(battleId, currentParticipant, battleState);

      // After AI action, advance and recurse
      const battleCheck = await this.checkBattleConditions(battleId);
      if (battleCheck) {
        await this.endBattle(battleId, battleCheck.winnerType, battleCheck.message);
        return;
      }

      await this.advanceTurn(battleId);
      await this.processCurrentTurn(battleId);
    }
    // If player, just wait for their action via BattleActionService
  }

  /**
   * Check if it's a specific participant's turn
   */
  async isParticipantTurn(
    battleId: number,
    discordUserId: string,
    actionType: string | null = null
  ): Promise<boolean> {
    const battleState = await this.getBattleState(battleId);

    if (!battleState.isActive) {
      return false;
    }

    const participant = await this.participantRepo.findByBattleAndUser(battleId, discordUserId);
    if (!participant) {
      return false;
    }

    // During setup phase, allow certain actions for all participants
    const isSetup = await this.isBattleInSetupPhase(battleId);
    if (isSetup && (actionType === 'release' || actionType === 'switch')) {
      return true;
    }

    // Allow release if participant has no active monsters
    if (actionType === 'release') {
      const activeMonsters = await this.monsterRepo.findActiveByParticipant(participant.id);
      if (activeMonsters.length === 0) {
        return true;
      }

      // Allow release when battle is waiting for this participant to switch
      const battle = await this.battleRepo.findById(battleId);
      const waitingForSwitch = (battle?.battleData as { waiting_for_switch?: { participant_id: number } })
        ?.waiting_for_switch;
      if (waitingForSwitch?.participant_id === participant.id) {
        return true;
      }
    }

    // Normal turn check
    return battleState.currentParticipant?.id === participant.id;
  }

  /**
   * Check if battle is in setup phase (before any attack/item turns)
   */
  async isBattleInSetupPhase(battleId: number): Promise<boolean> {
    const turns = await this.turnRepo.findByBattleId(battleId);
    return !turns.some(
      (turn) => turn.actionType === 'attack' || turn.actionType === 'item'
    );
  }

  // ==========================================================================
  // AI Turn Processing
  // ==========================================================================

  /**
   * Execute an AI participant's turn
   */
  private async executeAITurn(
    battleId: number,
    aiParticipant: BattleParticipantWithDetails,
    battleState: BattleManagerState
  ): Promise<void> {
    const activeMonsters = battleState.monsters.filter(
      (m) => m.participantId === aiParticipant.id && m.isActive && !m.isFainted
    );

    const opponentMonsters = battleState.monsters.filter((m) => {
      const p = battleState.participants.find((pp) => pp.id === m.participantId);
      return p && p.teamSide !== aiParticipant.teamSide && m.isActive && !m.isFainted;
    });

    if (activeMonsters.length === 0) {
      const skipMsg = `😵 **${aiParticipant.trainerName}** has no active monsters and skips their turn.`;
      await this.sendBattleMessageToDiscord(battleId, skipMsg);
      return;
    }

    if (opponentMonsters.length === 0) {
      const skipMsg = `⏭️ **${aiParticipant.trainerName}** has no valid targets and skips their turn.`;
      await this.sendBattleMessageToDiscord(battleId, skipMsg);
      return;
    }

    // Check which monsters can act (not prevented by status effects)
    const canActMonsters: BattleMonsterWithDetails[] = [];
    for (const monster of activeMonsters) {
      const statusResult = await this.processMonsterStatusEffects(battleId, monster);
      if (statusResult.canAct) {
        canActMonsters.push(monster);
      }
    }

    if (canActMonsters.length === 0) {
      const skipMsg = `😵‍💫 **${aiParticipant.trainerName}**'s monsters cannot act due to status conditions!`;
      await this.sendBattleMessageToDiscord(battleId, skipMsg);
      return;
    }

    // Pick a random monster that can act and execute attack
    const attacker = canActMonsters[Math.floor(Math.random() * canActMonsters.length)];
    if (attacker) {
      await this.executeEnemyAttack(battleId, attacker, opponentMonsters);
    }
  }

  /**
   * Execute an enemy monster attack against a random opposing target
   */
  private async executeEnemyAttack(
    battleId: number,
    attacker: BattleMonsterWithDetails,
    targets: BattleMonsterWithDetails[]
  ): Promise<{ battleEnded?: boolean }> {
    if (targets.length === 0) {
      return {};
    }

    const target = targets[Math.floor(Math.random() * targets.length)];
    if (!target) {
      return {};
    }

    const attackerData = attacker.monsterData as DamageCalcMonsterData;
    const targetData = target.monsterData as DamageCalcMonsterData;

    // Use a basic attack move
    const basicMove: MoveData = {
      move_name: 'Tackle',
      power: 40,
      accuracy: 100,
      move_type: 'Normal',
      MoveType: 'Physical',
    };

    const damageResult = await this.damageCalculator.calculateDamage(
      attackerData,
      targetData,
      basicMove
    );

    let fullMessage = '';
    let damageDealt = 0;

    if (damageResult.hits) {
      const damageApplied = await this.monsterRepo.dealDamage(target.id, damageResult.damage);
      damageDealt = damageApplied.damageDealt;

      const targetName = (targetData.name as string) || 'Player Monster';
      fullMessage = `🤖 ${damageResult.message}`;
      fullMessage += `\n💔 **${targetName}** takes ${damageDealt} damage! (${damageApplied.hpAfter}/${target.maxHp} HP)`;

      if (damageApplied.fainted) {
        fullMessage += `\n💀 **${targetName}** fainted!`;
      }
    } else {
      fullMessage = `🤖 ${damageResult.message}`;
    }

    await this.logRepo.logSystem(battleId, fullMessage);
    await this.sendBattleMessageToDiscord(battleId, fullMessage);

    // Handle knockout if target fainted
    if (damageDealt > 0) {
      const updatedTarget = await this.monsterRepo.findById(target.id);
      if (updatedTarget && (updatedTarget.isFainted || updatedTarget.currentHp <= 0)) {
        await this.handleMonsterKnockout(battleId, updatedTarget);

        const endResult = await this.checkBattleConditions(battleId);
        if (endResult) {
          await this.endBattle(battleId, endResult.winnerType, endResult.message);
          return { battleEnded: true };
        }
      }
    }

    return {};
  }

  // ==========================================================================
  // Status Effect Processing
  // ==========================================================================

  /**
   * Process status effects for all active monsters of a participant
   */
  private async processParticipantStatusEffects(
    battleId: number,
    participant: BattleParticipantWithDetails
  ): Promise<void> {
    const monsters = await this.monsterRepo.findByBattleId(battleId, {
      participantId: participant.id,
    });

    const aliveActive = monsters.filter(
      (m) => m.isActive && !m.isFainted && m.currentHp > 0
    );

    if (aliveActive.length === 0) {
      return;
    }

    const allMessages: string[] = [];

    for (const monster of aliveActive) {
      const statusResult = await this.processMonsterStatusEffects(battleId, monster);

      if (statusResult.messages.length > 0) {
        allMessages.push(...statusResult.messages);
      }

      // Check if monster fainted from status damage
      if (statusResult.damageDealt > 0) {
        const updated = await this.monsterRepo.findById(monster.id);
        if (updated && (updated.isFainted || updated.currentHp <= 0)) {
          await this.handleMonsterKnockout(battleId, updated);
        }
      }
    }

    if (allMessages.length > 0) {
      const combined = allMessages.join('\n');
      await this.sendBattleMessageToDiscord(battleId, combined);
    }
  }

  /**
   * Process status effects for a single monster
   */
  private async processMonsterStatusEffects(
    battleId: number,
    monster: BattleMonsterWithDetails
  ): Promise<StatusEffectProcessingResult> {
    const monsterData = monster.monsterData as MonsterDataRecord;

    const statusMonster: StatusEffectMonster = {
      id: monster.id,
      name: (monsterData.name as string) ?? 'Monster',
      current_hp: monster.currentHp,
      max_hp: monster.maxHp,
      monster_data: {
        type1: monsterData.type1 as string | undefined,
        type2: monsterData.type2 as string | undefined,
      },
      status_effects: monster.statusEffects as ActiveStatusEffect[],
    };

    return this.statusEffectService.processStatusEffects(battleId, statusMonster);
  }

  // ==========================================================================
  // Battle State
  // ==========================================================================

  /**
   * Get the current battle state (uses cache when available)
   */
  async getBattleState(battleId: number): Promise<BattleManagerState> {
    return this.refreshBattleState(battleId);
  }

  /**
   * Refresh battle state from the database
   */
  private async refreshBattleState(battleId: number): Promise<BattleManagerState> {
    const battle = await this.battleRepo.findById(battleId);
    if (!battle) {
      throw new Error('Battle not found');
    }

    const participants = await this.participantRepo.findByBattleId(battleId);
    const monsters = await this.monsterRepo.findByBattleId(battleId);
    const recentLogs = await this.logRepo.findRecentByBattleId(battleId, 10);

    const currentParticipant = participants[battle.currentParticipantIndex] ?? null;

    const state: BattleManagerState = {
      battle,
      participants,
      monsters,
      recentLogs,
      currentTurn: battle.currentTurn,
      currentParticipant,
      isActive: battle.status === 'active',
    };

    this.activeBattles.set(battleId, state);
    return state;
  }

  // ==========================================================================
  // Battle Conditions & End
  // ==========================================================================

  /**
   * Check win/loss conditions based on fainted monsters and knockout counts
   */
  async checkBattleConditions(battleId: number): Promise<BattleConditionResult | null> {
    const battleState = await this.getBattleState(battleId);

    const playerMonsters = battleState.monsters.filter((m) => {
      const p = battleState.participants.find((pp) => pp.id === m.participantId);
      return p && p.teamSide === 'players';
    });

    const enemyMonsters = battleState.monsters.filter((m) => {
      const p = battleState.participants.find((pp) => pp.id === m.participantId);
      return p && p.teamSide === 'opponents';
    });

    const activePlayerCount = playerMonsters.filter(
      (m) => !m.isFainted && m.currentHp > 0
    ).length;
    const activeEnemyCount = enemyMonsters.filter(
      (m) => !m.isFainted && m.currentHp > 0
    ).length;
    const faintedPlayerCount = playerMonsters.filter(
      (m) => m.isFainted || m.currentHp <= 0
    ).length;
    const faintedEnemyCount = enemyMonsters.filter(
      (m) => m.isFainted || m.currentHp <= 0
    ).length;

    // All enemies defeated
    if (activeEnemyCount === 0 && enemyMonsters.length > 0) {
      return {
        result: 'victory',
        message: '🏆 **VICTORY!** 🏆\n\nAll enemy monsters have been defeated!',
        winnerType: 'players',
      };
    }

    // All player monsters defeated
    if (activePlayerCount === 0 && playerMonsters.length > 0) {
      return {
        result: 'loss',
        message: '💀 **DEFEAT!** 💀\n\nAll your monsters have fainted. The battle is lost!',
        winnerType: 'opponents',
      };
    }

    // Knockout count thresholds (6 KOs)
    if (faintedPlayerCount >= 6) {
      return {
        result: 'loss',
        message: '💀 **DEFEAT!** 💀\n\nSix of your monsters have fainted. The battle is lost!',
        winnerType: 'opponents',
        knockouts: faintedPlayerCount,
        limit: 6,
      };
    }

    if (faintedEnemyCount >= 6) {
      return {
        result: 'victory',
        message: '🏆 **VICTORY!** 🏆\n\nSix enemy monsters have been defeated!',
        winnerType: 'players',
        knockouts: faintedEnemyCount,
        limit: 6,
      };
    }

    return null;
  }

  /**
   * Check knockout-based win condition using trainer's total monster count
   */
  async checkKnockoutWinCondition(battleId: number): Promise<BattleConditionResult | null> {
    const battle = await this.battleRepo.findById(battleId);
    if (!battle) {
      return null;
    }

    const participants = await this.participantRepo.findByBattleId(battleId);

    // Calculate required knockouts per team
    const teamRequiredKOs: Record<string, number> = {};

    for (const participant of participants) {
      if (participant.participantType === 'player' && participant.trainerId) {
        const teamSide = participant.teamSide;
        teamRequiredKOs[teamSide] ??= 0;

        const trainerMonsters = await this.monsterDataRepo.findByTrainerId(participant.trainerId);
        const requiredKOs = Math.min(6, trainerMonsters.length);
        teamRequiredKOs[teamSide] = Math.max(teamRequiredKOs[teamSide] ?? 0, requiredKOs);
      }
    }

    // Count current knockouts per team
    const teamKOs: Record<string, number> = {};
    for (const participant of participants) {
      const teamSide = participant.teamSide;
      teamKOs[teamSide] ??= 0;

      const participantMonsters = await this.monsterRepo.findByBattleId(battleId, {
        participantId: participant.id,
      });

      const knockedOut = participantMonsters.filter(
        (m) => m.currentHp <= 0 || m.isFainted
      ).length;
      teamKOs[teamSide] = (teamKOs[teamSide] ?? 0) + knockedOut;
    }

    // Check if any team reached their knockout limit
    for (const [teamSide, knockouts] of Object.entries(teamKOs)) {
      const requiredKOs = teamRequiredKOs[teamSide] ?? 6;

      if (knockouts >= requiredKOs) {
        const winnerTeam: TeamSide = teamSide === 'players' ? 'opponents' : 'players';

        let winnerNames: string | undefined;
        if (battle.battleType === 'pvp') {
          const winners = participants.filter((p) => p.teamSide === winnerTeam);
          winnerNames = winners.map((p) => p.trainerName).join(', ');
        }

        return {
          result: winnerTeam === 'players' ? 'victory' : 'loss',
          message: `Knockout limit reached: ${knockouts}/${requiredKOs} monsters defeated`,
          winnerType: winnerTeam,
          winnerNames,
          knockouts,
          limit: requiredKOs,
        };
      }
    }

    return null;
  }

  /**
   * Check the battle-data-defined win condition (knockout_count threshold)
   */
  async checkWinCondition(battleId: number): Promise<boolean> {
    const battle = await this.battleRepo.findById(battleId);
    if (!battle) {
      return false;
    }

    const winCondition = (
      battle.battleData as { win_condition?: { knockout_count?: number } }
    )?.win_condition?.knockout_count ?? 6;

    const participants = await this.participantRepo.findByBattleId(battleId);
    const teamKOs: Record<string, number> = {};

    for (const participant of participants) {
      const teamSide = participant.teamSide;
      teamKOs[teamSide] ??= 0;

      const participantMonsters = await this.monsterRepo.findByBattleId(battleId, {
        participantId: participant.id,
      });

      const knockedOut = participantMonsters.filter((m) => m.currentHp <= 0).length;
      teamKOs[teamSide] = (teamKOs[teamSide] ?? 0) + knockedOut;
    }

    for (const [teamSide, knockouts] of Object.entries(teamKOs)) {
      if (knockouts >= winCondition) {
        const winnerTeam: TeamSide = teamSide === 'players' ? 'opponents' : 'players';

        let winnerNames: string | undefined;
        if (battle.battleType === 'pvp') {
          const winners = participants.filter((p) => p.teamSide === winnerTeam);
          winnerNames = winners.map((p) => p.trainerName).join(', ');
        }

        await this.endBattle(battleId, winnerTeam, winnerNames
          ? `Knockout limit reached: ${knockouts}/${winCondition}`
          : `Knockout limit reached: ${knockouts}/${winCondition}`
        );
        return true;
      }
    }

    return false;
  }

  /**
   * End battle with a winner
   */
  async endBattle(
    battleId: number,
    winnerType: TeamSide | string,
    reason: string
  ): Promise<BattleEndResult> {
    await this.battleRepo.complete(battleId, winnerType as BattleWinnerType);

    const displayWinner = winnerType.toUpperCase();

    await this.logRepo.logSystem(
      battleId,
      `🏁 **BATTLE ENDED!** 🏁\nWinner: ${displayWinner}\nReason: ${reason}`
    );

    // Remove from cache
    this.activeBattles.delete(battleId);

    // Calculate rewards
    const rewards = await this.calculateBattleRewards(battleId, winnerType);

    // Send end message to Discord
    await this.sendBattleMessageToDiscord(
      battleId,
      `🏁 **BATTLE ENDED!** 🏁\nWinner: ${displayWinner}\nReason: ${reason}`
    );

    return {
      battleId,
      winner: winnerType,
      winnerNames: null,
      displayWinner,
      reason,
      rewards,
    };
  }

  /**
   * Force end a battle with a specific winner
   */
  async forceEndBattle(
    battleId: number,
    winnerType: TeamSide,
    message = ''
  ): Promise<ForceEndResult> {
    const battle = await this.battleRepo.findById(battleId);
    if (!battle) {
      throw new Error('Battle not found');
    }

    const reason = message || `Battle was force ended with ${winnerType} as winners`;
    const endResult = await this.endBattle(battleId, winnerType, reason);

    await this.logRepo.logSystem(
      battleId,
      `🔨 **BATTLE FORCE ENDED** - ${winnerType.toUpperCase()} WIN!\n${message}`
    );

    return { success: true, ...endResult };
  }

  // ==========================================================================
  // Knockout Handling
  // ==========================================================================

  /**
   * Handle monster knockout: award levels to opposing monsters and switch NPC monsters
   */
  async handleMonsterKnockout(
    battleId: number,
    knockedOutMonster: BattleMonsterWithDetails
  ): Promise<KnockoutResult> {
    const participants = await this.participantRepo.findByBattleId(battleId);
    const knockedOutParticipant = participants.find(
      (p) => p.id === knockedOutMonster.participantId
    );

    if (!knockedOutParticipant) {
      throw new Error('Knocked out monster participant not found');
    }

    const monsterData = knockedOutMonster.monsterData as MonsterDataRecord;
    const monsterLevel = (monsterData.level as number) || 1;

    // Calculate levels to award: 1 + 1 per 10 levels
    const levelsToAward = 1 + Math.floor(monsterLevel / 10);

    // Find opposing player participants
    const opposingPlayers = participants.filter(
      (p) =>
        p.teamSide !== knockedOutParticipant.teamSide &&
        p.participantType === 'player'
    );

    const levelAwards: LevelAward[] = [];

    // Award levels to all alive opposing player monsters
    for (const opponent of opposingPlayers) {
      const opponentMonsters = await this.monsterRepo.findByBattleId(battleId, {
        participantId: opponent.id,
      });

      for (const bm of opponentMonsters) {
        if (bm.currentHp > 0 && bm.monsterId > 0) {
          const previousLevel = (bm.monsterData as MonsterDataRecord).level ?? 1;
          const updatedMonster = await this.monsterDataRepo.addLevels(
            bm.monsterId,
            levelsToAward
          );

          levelAwards.push({
            monsterId: bm.monsterId,
            monsterName: (bm.monsterData as MonsterDataRecord).name ?? 'Unknown',
            levelsAwarded: levelsToAward,
            previousLevel,
            newLevel: updatedMonster.level,
            participantName: opponent.trainerName,
          });
        }
      }
    }

    // Build knockout message
    const monsterName = monsterData.name ?? 'Monster';
    let knockoutMessage = `💀 **${monsterName}** (Level ${monsterLevel}) was knocked out!\n`;
    knockoutMessage += `   Trainer: **${knockedOutParticipant.trainerName}**`;

    if (monsterData.img_link) {
      knockoutMessage += `\n   ${monsterData.img_link}`;
    }

    let levelMessage = '';
    if (levelAwards.length > 0) {
      levelMessage = '\n\n🎉 **LEVEL UP REWARDS!** 🎉';
      for (const award of levelAwards) {
        levelMessage += `\n⭐ **${award.monsterName}** leveled up!`;
        levelMessage += `\n   ${award.previousLevel} → ${award.newLevel} (+${award.levelsAwarded} levels)`;
        levelMessage += `\n   Trainer: ${award.participantName}`;
      }
    }

    await this.logRepo.logSystem(battleId, knockoutMessage + levelMessage);
    await this.sendBattleMessageToDiscord(battleId, knockoutMessage + levelMessage);

    // Handle NPC/wild monster switching
    if (
      knockedOutParticipant.participantType === 'npc' ||
      knockedOutParticipant.participantType === 'wild'
    ) {
      await this.handleNPCMonsterSwitch(battleId, knockedOutParticipant);
    }

    // Check win condition
    await this.checkWinCondition(battleId);

    return {
      knockedOutMonster,
      levelAwards,
      levelsAwarded: levelsToAward,
    };
  }

  /**
   * Handle NPC monster switching when their active monster is knocked out
   */
  private async handleNPCMonsterSwitch(
    battleId: number,
    npcParticipant: BattleParticipantWithDetails
  ): Promise<void> {
    const npcMonsters = await this.monsterRepo.findByBattleId(battleId, {
      participantId: npcParticipant.id,
    });

    // Find available monsters (alive, not currently active)
    const available = npcMonsters.filter(
      (m) => !m.isFainted && m.currentHp > 0 && !m.isActive
    );

    if (available.length > 0) {
      const nextMonster = available[0];
      if (!nextMonster) {
        return;
      }

      // Deactivate all current active monsters
      for (const monster of npcMonsters) {
        if (monster.isActive) {
          await this.monsterRepo.update(monster.id, { isActive: false });
        }
      }

      // Activate next monster
      await this.monsterRepo.update(nextMonster.id, { isActive: true });

      const nextMonsterData = nextMonster.monsterData as MonsterDataRecord;
      const monsterName = nextMonsterData.name ?? 'Unknown Monster';
      const trainerName = npcParticipant.trainerName || 'Enemy Trainer';

      const switchMessage = `🔄 **${trainerName}** sends out **${monsterName}**!`;
      await this.logRepo.logSystem(battleId, switchMessage);
      await this.sendBattleMessageToDiscord(battleId, switchMessage);
    } else {
      const outMessage = `😵 **${npcParticipant.trainerName}** has no more monsters left!`;
      await this.logRepo.logSystem(battleId, outMessage);
      await this.sendBattleMessageToDiscord(battleId, outMessage);
    }
  }

  // ==========================================================================
  // Rewards
  // ==========================================================================

  /**
   * Calculate battle rewards for all player participants
   */
  async calculateBattleRewards(
    battleId: number,
    winnerType: string
  ): Promise<BattleRewardResult> {
    const participants = await this.participantRepo.findByBattleId(battleId);
    const battleStats = await this.turnRepo.getBattleStatistics(battleId);

    const rewards: BattleRewardResult = {
      participants: [],
      totalExperience: 0,
      totalCoins: 0,
    };

    for (const participant of participants) {
      if (participant.participantType === 'player') {
        const participantReward = this.calculateParticipantRewards(
          participant,
          winnerType,
          battleStats
        );
        rewards.participants.push(participantReward);
        rewards.totalExperience += participantReward.experience;
        rewards.totalCoins += participantReward.coins;
      }
    }

    return rewards;
  }

  /**
   * Calculate rewards for a single participant
   */
  private calculateParticipantRewards(
    participant: BattleParticipantWithDetails,
    winnerType: string,
    _battleStats: BattleStatistics
  ): ParticipantRewardResult {
    const isWinner = participant.teamSide === winnerType;
    const baseExperience = 100;
    const baseCoins = 50;

    // Experience with winner bonus and word count bonus (up to 50%)
    let experience = baseExperience;
    if (isWinner) {
      experience *= 1.5;
    }
    const wordBonus = Math.min(0.5, (participant.wordCount || 0) / 1000);
    experience = Math.floor(experience * (1 + wordBonus));

    // Coins with winner bonus and word count bonus
    let coins = baseCoins;
    if (isWinner) {
      coins *= 1.2;
    }
    coins = Math.floor(coins * (1 + wordBonus));

    return {
      participantId: participant.id,
      discordUserId: participant.discordUserId,
      trainerId: participant.trainerId,
      trainerName: participant.trainerName,
      experience,
      coins,
      wordCount: participant.wordCount || 0,
      messageCount: participant.messageCount || 0,
      isWinner,
    };
  }

  // ==========================================================================
  // Discord Messaging
  // ==========================================================================

  /**
   * Send a battle message to the Discord adventure thread
   */
  private async sendBattleMessageToDiscord(
    battleId: number,
    message: string
  ): Promise<void> {
    try {
      const battle = await this.battleRepo.findById(battleId);
      if (!battle?.adventureId) {
        return;
      }

      const adventure = await this.adventureRepo.findById(battle.adventureId);
      if (!adventure?.discordThreadId) {
        return;
      }

      const result = await this.discordService.sendMessageToThread(
        adventure.discordThreadId,
        message
      );

      if (!result.success) {
        console.error(`Failed to send battle message to Discord: ${result.message ?? 'unknown error'}`);
      }
    } catch (error) {
      console.error('Error sending battle message to Discord:', error);
      // Don't throw - battle should continue even if Discord message fails
    }
  }

  /**
   * Send turn notification message
   */
  private async sendTurnNotification(
    battleId: number,
    participant: BattleParticipantWithDetails
  ): Promise<void> {
    let turnMessage = '';

    if (participant.participantType === 'player') {
      const name = participant.trainerName || `Player ${participant.discordUserId ?? ''}`;
      turnMessage = `🎯 **It's now ${name}'s turn!**`;
    } else if (participant.participantType === 'npc') {
      const name = participant.trainerName || 'Enemy Trainer';
      turnMessage = `⚔️ **${name}'s turn!**`;
    } else if (participant.participantType === 'wild') {
      turnMessage = `🐾 **Wild Monsters' turn!**`;
    }

    if (turnMessage) {
      await this.sendBattleMessageToDiscord(battleId, turnMessage);
    }
  }

  /**
   * Send turn order message listing all participants
   */
  async sendTurnOrderMessage(battleId: number): Promise<void> {
    const participants = await this.participantRepo.findByBattleId(battleId);

    if (participants.length === 0) {
      return;
    }

    let message = `📋 **BATTLE TURN ORDER** 📋\n\n`;

    for (let i = 0; i < participants.length; i++) {
      const p = participants[i];
      if (!p) {
        continue;
      }
      const name = this.getParticipantDisplayName(p);
      message += `${i + 1}. ${name}\n`;
    }

    const first = participants[0];
    if (first) {
      const firstName = this.getParticipantDisplayName(first);
      message += `\n🎯 **${firstName}** goes first!`;
    }

    await this.sendBattleMessageToDiscord(battleId, message);
  }

  // ==========================================================================
  // Helpers
  // ==========================================================================

  /**
   * Get display name for a participant
   */
  private getParticipantDisplayName(participant: BattleParticipantWithDetails): string {
    if (participant.participantType === 'player') {
      return participant.trainerName || `Player ${participant.discordUserId ?? ''}`;
    }
    if (participant.participantType === 'npc') {
      return participant.trainerName || 'Enemy Trainer';
    }
    return 'Wild Monsters';
  }

  /**
   * Convert encounter monster input to internal MonsterDataRecord
   */
  private toMonsterDataRecord(input: EncounterMonsterInput): MonsterDataRecord {
    return {
      name: input.name,
      species1: input.species1 ?? undefined,
      species2: input.species2 ?? undefined,
      species3: input.species3 ?? undefined,
      type1: input.type1 ?? undefined,
      type2: input.type2 ?? undefined,
      type3: input.type3 ?? undefined,
      type4: input.type4 ?? undefined,
      type5: input.type5 ?? undefined,
      attribute: input.attribute ?? undefined,
      level: input.level,
      hp_total: input.hpTotal ?? input.health ?? input.maxHealth,
      isWild: input.isWild,
    };
  }

  /**
   * Create an adapter that bridges BattleMonsterRepository to the
   * IStatusEffectBattleMonsterRepository interface
   */
  private createMonsterRepoAdapter(): IStatusEffectBattleMonsterRepository {
    const repo = this.monsterRepo;
    return {
      async update(id: number, data: {
        status_effects?: ActiveStatusEffect[];
        monster_data?: Record<string, unknown>;
        current_hp?: number;
      }): Promise<void> {
        const updateInput: Record<string, unknown> = {};
        if (data.status_effects !== undefined) {
          updateInput.statusEffects = data.status_effects;
        }
        if (data.monster_data !== undefined) {
          updateInput.monsterData = data.monster_data;
        }
        if (data.current_hp !== undefined) {
          updateInput.currentHp = data.current_hp;
        }
        await repo.update(id, updateInput as Parameters<typeof repo.update>[1]);
      },
      async dealDamage(id: number, damage: number): Promise<{ damageDealt: number }> {
        const result = await repo.dealDamage(id, damage);
        return { damageDealt: result.damageDealt };
      },
      async heal(id: number, amount: number): Promise<{ healAmount: number }> {
        const result = await repo.heal(id, amount);
        return { healAmount: result.healAmount };
      },
    };
  }

  /**
   * Create an adapter that bridges BattleLogRepository to the
   * IStatusEffectBattleLog interface
   */
  private createLogAdapter(): IStatusEffectBattleLog {
    const logRepo = this.logRepo;
    return {
      async logSystem(battleId: number, message: string): Promise<void> {
        await logRepo.logSystem(battleId, message);
      },
    };
  }
}
