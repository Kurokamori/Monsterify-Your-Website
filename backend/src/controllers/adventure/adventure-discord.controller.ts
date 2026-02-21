import { Request, Response } from 'express';
import {
  AdventureRepository,
  AdventureThreadRepository,
  AdventureParticipantRepository,
  AdventureEncounterRow,
  BattleRepository,
  BattleParticipantRepository,
  BattleLogRepository,
  TrainerRepository,
  UserRepository,
} from '../../repositories';
import { EncounterService } from '../../services/adventure/encounter.service';
import type { AutoBattleData } from '../../services/adventure/encounter.service';
import { CaptureService } from '../../services/capture.service';
import { BattleService } from '../../services/adventure/battle.service';
import { BattleManagerService } from '../../services/adventure/battle-manager.service';
import type { EncounterInput } from '../../services/adventure/battle-manager.service';
import { BattleActionService } from '../../services/adventure/battle-action.service';
import { AdventureRewardService } from '../../services/adventure/adventure-reward.service';
import type { UserSettings } from '../../services/monster-roller.service';

// =============================================================================
// Service & Repository Instances
// =============================================================================

const adventureRepository = new AdventureRepository();
const threadRepository = new AdventureThreadRepository();
const participantRepository = new AdventureParticipantRepository();
const battleRepository = new BattleRepository();
const battleParticipantRepository = new BattleParticipantRepository();
const battleLogRepository = new BattleLogRepository();
const trainerRepository = new TrainerRepository();
const userRepository = new UserRepository();

const encounterService = new EncounterService();
const captureService = new CaptureService();
const battleService = new BattleService();
const battleManager = new BattleManagerService();
const battleActionService = new BattleActionService();
const adventureRewardService = new AdventureRewardService();

// =============================================================================
// Utility
// =============================================================================

function paramToString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
}

function parseEncounterData(raw: string | null): Record<string, unknown> {
  if (!raw) {return {};}
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function encounterRowToInput(row: AdventureEncounterRow): EncounterInput {
  return {
    id: row.id,
    adventureId: row.adventure_id,
    encounterType: row.encounter_type,
    encounterData: parseEncounterData(row.encounter_data as string | null),
  };
}

async function getUserSettingsFromDiscordId(discordUserId: string): Promise<UserSettings> {
  const defaultSettings: UserSettings = {
    pokemon: true,
    digimon: true,
    yokai: true,
    nexomon: true,
    pals: true,
    fakemon: true,
    finalfantasy: true,
    monsterhunter: true,
  };

  const user = await userRepository.findByDiscordId(discordUserId);
  if (!user?.monster_roller_settings) {
    return defaultSettings;
  }

  try {
    const settings =
      typeof user.monster_roller_settings === 'string'
        ? JSON.parse(user.monster_roller_settings)
        : user.monster_roller_settings;
    return { ...defaultSettings, ...settings };
  } catch {
    return defaultSettings;
  }
}

function generateHealthBar(currentHp: number, maxHp: number): string {
  const barLength = 10;
  const filledBars = Math.floor((currentHp / maxHp) * barLength);
  const emptyBars = barLength - filledBars;

  const hpPercent = (currentHp / maxHp) * 100;
  let healthColor = '\u{1F7E2}';
  if (hpPercent < 25) {
    healthColor = '\u{1F534}';
  } else if (hpPercent < 50) {
    healthColor = '\u{1F7E1}';
  }

  return `[${healthColor.repeat(filledBars)}\u{2B1C}${emptyBars > 0 ? '\u{2B1C}'.repeat(emptyBars) : ''}]`;
}

// =============================================================================
// Thread Management
// =============================================================================

export async function createAdventureThread(req: Request, res: Response): Promise<void> {
  try {
    const { adventureId, discordThreadId, discordChannelId, threadName } = req.body as {
      adventureId?: number;
      discordThreadId?: string;
      discordChannelId?: string;
      threadName?: string;
    };

    if (!adventureId || !discordThreadId || !discordChannelId || !threadName) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }

    const adventure = await adventureRepository.findById(adventureId);
    if (!adventure) {
      res.status(404).json({ success: false, message: 'Adventure not found' });
      return;
    }

    const thread = await threadRepository.create({
      adventureId,
      discordThreadId,
      discordChannelId,
      threadName,
    });

    await adventureRepository.update(adventureId, {
      discordThreadId,
      discordChannelId,
    });

    res.json({ success: true, thread });
  } catch (error) {
    console.error('Error creating adventure thread:', error);
    res.status(500).json({ success: false, message: 'Failed to create adventure thread' });
  }
}

export async function getAdventureByThreadId(req: Request, res: Response): Promise<void> {
  try {
    const discordThreadId = paramToString(req.params.discordThreadId);

    const thread = await threadRepository.findByDiscordThreadId(discordThreadId);
    if (!thread) {
      res.status(404).json({ success: false, message: 'Adventure thread not found' });
      return;
    }

    const adventure = await adventureRepository.findById(thread.adventureId);
    if (!adventure) {
      res.status(404).json({ success: false, message: 'Adventure not found' });
      return;
    }

    const encounters = await adventureRepository.getEncounters(adventure.id);
    const recentEncounters = encounters.slice(0, 10);

    res.json({
      success: true,
      adventure: {
        ...adventure,
        threadInfo: thread,
        encounters: recentEncounters,
      },
    });
  } catch (error) {
    console.error('Error getting adventure by thread ID:', error);
    res.status(500).json({ success: false, message: 'Failed to get adventure' });
  }
}

// =============================================================================
// Message Tracking
// =============================================================================

export async function trackMessage(req: Request, res: Response): Promise<void> {
  try {
    const { discordThreadId, discordUserId, wordCount, messageCount } = req.body as {
      discordThreadId?: string;
      discordUserId?: string;
      wordCount?: number;
      messageCount?: number;
    };

    if (!discordThreadId || !discordUserId || wordCount === undefined) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }

    const thread = await threadRepository.findByDiscordThreadId(discordThreadId);
    if (!thread) {
      res.status(404).json({ success: false, message: 'Adventure thread not found' });
      return;
    }

    const participant = await participantRepository.addOrUpdate({
      adventureId: thread.adventureId,
      discordUserId,
      wordCount,
      messageCount: messageCount ?? 1,
    });

    res.json({ success: true, participant });
  } catch (error) {
    console.error('Error tracking message:', error);
    res.status(500).json({ success: false, message: 'Failed to track message' });
  }
}

// =============================================================================
// Encounters
// =============================================================================

export async function generateEncounter(req: Request, res: Response): Promise<void> {
  try {
    const { adventureId, discordUserId } = req.body as {
      adventureId?: number;
      discordUserId?: string;
    };

    if (!adventureId || !discordUserId) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }

    const adventure = await adventureRepository.findById(adventureId);
    if (!adventure) {
      res.status(404).json({ success: false, message: 'Adventure not found' });
      return;
    }

    if (adventure.status !== 'active') {
      res.status(400).json({ success: false, message: 'Adventure is not active' });
      return;
    }

    const maxEncounters = adventure.maxEncounters ?? 3;
    if (adventure.encounterCount >= maxEncounters) {
      res.status(400).json({
        success: false,
        message: `Maximum encounters (${maxEncounters}) reached`,
      });
      return;
    }

    const encounterUserSettings = await getUserSettingsFromDiscordId(discordUserId);
    const encounterResult = await encounterService.generateRandomEncounter(adventure, null, encounterUserSettings);

    if (encounterResult.type === 'auto_battle') {
      const autoBattleData = encounterResult.data as AutoBattleData;

      const battleEncounter = await adventureRepository.addEncounter(adventureId, {
        encounterType: 'battle',
        createdByDiscordUserId: discordUserId,
        encounterData: {
          ...autoBattleData.battleData,
          createdByDiscordUserId: discordUserId,
          isAutoBattle: true,
        },
      });

      await adventureRepository.incrementEncounterCount(adventureId);

      res.json({
        success: true,
        encounter: {
          ...battleEncounter,
          encounter_data: autoBattleData.battleData,
        },
        message: 'Aggressive monsters attack! Battle initiated automatically!',
        isAutoBattle: true,
        originalGroups: autoBattleData.originalGroups,
      });
      return;
    }

    const encounter = await adventureRepository.addEncounter(adventureId, {
      encounterType: encounterResult.type,
      createdByDiscordUserId: discordUserId,
      encounterData: {
        ...encounterResult.data,
        createdByDiscordUserId: discordUserId,
      },
    });

    await adventureRepository.incrementEncounterCount(adventureId);

    res.json({
      success: true,
      encounter: {
        id: encounter.id,
        encounter_type: encounterResult.type,
        encounter_data: encounterResult.data,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate encounter';
    console.error('Error generating encounter:', message);
    res.status(400).json({ success: false, message });
  }
}

// =============================================================================
// Capture
// =============================================================================

export async function attemptCapture(req: Request, res: Response): Promise<void> {
  try {
    const {
      encounterId,
      adventureId,
      discordUserId,
      trainerName,
      pokeballType,
      pokepuffCount,
      monsterIndex,
      isBattleCapture,
    } = req.body as {
      encounterId?: number;
      adventureId?: number;
      discordUserId?: string;
      trainerName?: string;
      pokeballType?: string;
      pokepuffCount?: number;
      monsterIndex?: number;
      isBattleCapture?: boolean;
    };

    if (!discordUserId || !trainerName || !pokeballType) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }

    // Resolve encounter ID — accept either encounterId directly or adventureId
    let resolvedEncounterId = encounterId;

    if (!resolvedEncounterId && adventureId) {
      const encounters = await adventureRepository.getEncounters(adventureId);
      const activeEncounter = encounters.find(
        (e) => !e.is_resolved && (e.encounter_type === 'wild' || e.encounter_type === 'battle'),
      );
      if (!activeEncounter) {
        res.status(404).json({
          success: false,
          message: 'No active wild or battle encounter found for this adventure.',
        });
        return;
      }
      resolvedEncounterId = activeEncounter.id;
    }

    if (!resolvedEncounterId) {
      res.status(400).json({ success: false, message: 'Missing encounterId or adventureId' });
      return;
    }

    const encounter = await captureService.getEncounterById(resolvedEncounterId);
    if (!encounter) {
      res.status(404).json({ success: false, message: 'Encounter not found' });
      return;
    }

    const captureResult = await captureService.attemptCapture({
      encounterId: resolvedEncounterId,
      discordUserId,
      trainerName,
      pokeballType,
      pokepuffCount: pokepuffCount ?? 0,
      monsterIndex: monsterIndex ?? 1,
      isBattleCapture: isBattleCapture ?? false,
    });

    res.json({ success: true, captureResult });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to attempt capture';
    console.error('Error attempting capture:', message);
    res.status(400).json({ success: false, message });
  }
}

// =============================================================================
// Battle Resolution
// =============================================================================

export async function resolveBattle(req: Request, res: Response): Promise<void> {
  try {
    const { encounterId, adventureId, discordUserId } = req.body as {
      encounterId?: number;
      adventureId?: number;
      discordUserId?: string;
    };

    if (!discordUserId) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }

    // Resolve encounterId from adventureId if not provided directly
    let resolvedEncounterId = encounterId;

    if (!resolvedEncounterId && adventureId) {
      const encounters = await adventureRepository.getEncounters(adventureId);
      const battleEncounter = encounters.find(
        (e) => e.encounter_type === 'battle' && !e.is_resolved,
      );
      if (!battleEncounter) {
        res.status(404).json({
          success: false,
          message: 'No active battle encounter found for this adventure.',
        });
        return;
      }
      resolvedEncounterId = battleEncounter.id;
    }

    if (!resolvedEncounterId) {
      res.status(400).json({ success: false, message: 'Missing encounterId or adventureId' });
      return;
    }

    const battleResult = await battleService.resolveBattle({
      encounterId: resolvedEncounterId,
      discordUserId,
    });

    res.json({ success: true, ...battleResult });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to resolve battle';
    console.error('Error resolving battle:', message);
    res.status(400).json({ success: false, message });
  }
}

// =============================================================================
// Battle Initiation
// =============================================================================

export async function initiateBattle(req: Request, res: Response): Promise<void> {
  try {
    const { adventureId, discordUserId, trainerName } = req.body as {
      adventureId?: number;
      discordUserId?: string;
      trainerName?: string;
    };

    if (!adventureId || !discordUserId || !trainerName) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }

    const adventure = await adventureRepository.findById(adventureId);
    if (!adventure) {
      res.status(404).json({ success: false, message: 'Adventure not found' });
      return;
    }

    if (adventure.status !== 'active') {
      res.status(400).json({ success: false, message: 'Adventure is not active' });
      return;
    }

    const activeBattle = await battleRepository.findActiveByAdventure(adventureId);

    if (activeBattle) {
      const trainer = await trainerRepository.findByNameAndUser(trainerName, discordUserId);
      if (!trainer) {
        res.status(404).json({ success: false, message: `Trainer "${trainerName}" not found` });
        return;
      }

      const participant = await battleManager.addPlayerToBattle(
        activeBattle.id,
        discordUserId,
        trainer.id,
      );

      res.json({
        success: true,
        message: `${trainerName} joined the battle!`,
        battle: activeBattle,
        participant,
      });
      return;
    }

    // Find unresolved battle encounter
    const encounters = await adventureRepository.getEncounters(adventureId);
    const battleEncounter = encounters.find(
      (e) => e.encounter_type === 'battle' && !e.is_resolved,
    );

    if (!battleEncounter) {
      res.status(400).json({
        success: false,
        message: 'No battle encounters available. Use `/encounter` to generate one first.',
      });
      return;
    }

    const encounterInput = encounterRowToInput(battleEncounter);
    const battleUserSettings = await getUserSettingsFromDiscordId(discordUserId);
    const newBattle = await battleManager.initializeBattle(encounterInput, discordUserId, battleUserSettings);

    const trainer = await trainerRepository.findByNameAndUser(trainerName, discordUserId);
    if (!trainer) {
      res.status(404).json({ success: false, message: `Trainer "${trainerName}" not found` });
      return;
    }

    const participant = await battleManager.addPlayerToBattle(
      newBattle.id,
      discordUserId,
      trainer.id,
    );

    res.json({
      success: true,
      message: `Battle initiated! ${trainerName} enters the fray!`,
      battle: newBattle,
      participant,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to initiate battle';
    console.error('Error initiating battle:', message);
    res.status(400).json({ success: false, message });
  }
}

// =============================================================================
// Battle Actions
// =============================================================================

export async function executeAttack(req: Request, res: Response): Promise<void> {
  try {
    const {
      adventureId,
      discordUserId,
      moveName,
      targetName,
      message,
      attackerName,
    } = req.body as {
      adventureId?: number;
      discordUserId?: string;
      moveName?: string;
      targetName?: string | null;
      message?: string;
      attackerName?: string | null;
    };

    if (!adventureId || !discordUserId || !moveName) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }

    const activeBattle = await battleRepository.findActiveByAdventure(adventureId);
    if (!activeBattle) {
      res.status(400).json({
        success: false,
        message: 'No active battle found. Use `/battle` to start one.',
      });
      return;
    }

    const isPlayerTurn = await battleManager.isParticipantTurn(activeBattle.id, discordUserId);
    if (!isPlayerTurn) {
      res.status(400).json({ success: false, message: "It's not your turn!" });
      return;
    }

    const attackResult = await battleActionService.executeAttack(
      activeBattle.id,
      discordUserId,
      moveName,
      targetName ?? null,
      message ?? '',
      attackerName ?? null,
    );

    if (attackResult.success && !attackResult.battleEnded) {
      try {
        await battleManager.advanceTurn(activeBattle.id);
        await battleActionService.processAITurns(activeBattle.id);
      } catch (turnError) {
        console.error('Error advancing turn or processing AI:', turnError);
      }
    }

    res.json({
      success: true,
      message: attackResult.message,
      result: attackResult,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to execute attack';
    console.error('Error executing attack:', message);
    res.status(400).json({ success: false, message });
  }
}

export async function useItemInBattle(req: Request, res: Response): Promise<void> {
  try {
    const { adventureId, discordUserId, itemName, targetIndex, message } = req.body as {
      adventureId?: number;
      discordUserId?: string;
      itemName?: string;
      targetIndex?: string | null;
      message?: string;
    };

    if (!adventureId || !discordUserId || !itemName) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }

    const activeBattle = await battleRepository.findActiveByAdventure(adventureId);
    if (!activeBattle) {
      res.status(400).json({
        success: false,
        message: 'No active battle found. Use `/battle` to start one.',
      });
      return;
    }

    const isPlayerTurn = await battleManager.isParticipantTurn(activeBattle.id, discordUserId);
    if (!isPlayerTurn) {
      res.status(400).json({ success: false, message: "It's not your turn!" });
      return;
    }

    const itemResult = await battleActionService.useItem(
      activeBattle.id,
      discordUserId,
      itemName,
      targetIndex ?? null,
      message ?? '',
    );

    res.json({
      success: true,
      message: itemResult.message,
      result: itemResult,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to use item';
    console.error('Error using item in battle:', message);
    res.status(400).json({ success: false, message });
  }
}

export async function getBattleStatus(req: Request, res: Response): Promise<void> {
  try {
    const adventureId = paramToString(req.params.adventureId);
    const parsedId = parseInt(adventureId, 10);

    if (isNaN(parsedId)) {
      res.status(400).json({ success: false, message: 'Invalid adventure ID' });
      return;
    }

    const activeBattle = await battleRepository.findActiveByAdventure(parsedId);
    if (!activeBattle) {
      res.json({ success: true, message: 'No active battle found.', hasBattle: false });
      return;
    }

    const battleState = await battleManager.getBattleState(activeBattle.id);

    let statusMessage = `\u{1F525} **BATTLE IN PROGRESS** \u{1F525}\n\n`;
    statusMessage += `**Turn ${battleState.currentTurn}**\n`;

    if (battleState.currentParticipant) {
      statusMessage += `Current Turn: **${battleState.currentParticipant.trainerName}**\n\n`;
    }

    statusMessage += `**Participants:**\n`;
    for (const participant of battleState.participants) {
      const activeMonsters = battleState.monsters.filter(
        (m) => m.participantId === participant.id && !m.isFainted,
      );
      statusMessage += `\u{2022} ${participant.trainerName} (${activeMonsters.length} monsters)\n`;
    }

    const activeMonsters = battleState.monsters.filter((m) => m.isActive && !m.isFainted);

    const playerMonsters = activeMonsters.filter((m) => {
      const participant = battleState.participants.find((p) => p.id === m.participantId);
      return participant && participant.participantType === 'player';
    });

    const enemyMonsters = activeMonsters.filter((m) => {
      const participant = battleState.participants.find((p) => p.id === m.participantId);
      return participant && (participant.participantType === 'npc' || participant.participantType === 'wild');
    });

    statusMessage += `\n**Active Monsters:**\n`;

    if (playerMonsters.length > 0) {
      statusMessage += `**Your Team:**\n`;
      for (const monster of playerMonsters) {
        const hpPercent = Math.round((monster.currentHp / monster.maxHp) * 100);
        const healthBar = generateHealthBar(monster.currentHp, monster.maxHp);
        const name = (monster.monsterData.name as string) ?? 'Unknown';
        const level = (monster.monsterData.level as number) ?? 1;

        statusMessage += `\u{2022} **${name}** (Level ${level})\n`;
        statusMessage += `  ${monster.currentHp}/${monster.maxHp} HP (${hpPercent}%) ${healthBar}\n\n`;
      }
    }

    if (enemyMonsters.length > 0) {
      statusMessage += `**Enemy Team:**\n`;
      enemyMonsters.forEach((monster, index) => {
        const hpPercent = Math.round((monster.currentHp / monster.maxHp) * 100);
        const healthBar = generateHealthBar(monster.currentHp, monster.maxHp);
        const name = (monster.monsterData.name as string) ?? 'Unknown';
        const level = (monster.monsterData.level as number) ?? 1;
        const wildIndicator = monster.monsterData.isWild ? ' \u{1F33F}' : '';

        statusMessage += `**${index + 1}.** **${name}** (Level ${level})${wildIndicator}\n`;
        statusMessage += `  ${monster.currentHp}/${monster.maxHp} HP (${hpPercent}%) ${healthBar}\n\n`;
      });

      if (enemyMonsters.some((m) => m.monsterData.isWild)) {
        statusMessage += `\u{1F33F} = Wild monsters (can be captured)\n\n`;
      }
    }

    res.json({
      success: true,
      message: statusMessage,
      hasBattle: true,
      battleState,
    });
  } catch (error) {
    console.error('Error getting battle status:', error);
    res.status(500).json({ success: false, message: 'Failed to get battle status' });
  }
}

export async function releaseMonster(req: Request, res: Response): Promise<void> {
  try {
    const { adventureId, discordUserId, monsterName, monsterIndex, message } = req.body as {
      adventureId?: number;
      discordUserId?: string;
      monsterName?: string;
      monsterIndex?: string;
      message?: string;
    };

    const monster = monsterName ?? monsterIndex;

    if (!adventureId || !discordUserId || !monster) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }

    const activeBattle = await battleRepository.findActiveByAdventure(adventureId);
    if (!activeBattle) {
      res.status(400).json({
        success: false,
        message: 'No active battle found. Use `/battle` to start one.',
      });
      return;
    }

    const isPlayerTurn = await battleManager.isParticipantTurn(activeBattle.id, discordUserId, 'release');
    if (!isPlayerTurn) {
      res.status(400).json({ success: false, message: "It's not your turn!" });
      return;
    }

    const releaseResult = await battleActionService.releaseMonster(
      activeBattle.id,
      discordUserId,
      monster,
      message ?? '',
    );

    res.json({
      success: true,
      message: releaseResult.message,
      result: releaseResult,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to release monster';
    console.error('Error releasing monster:', message);
    res.status(400).json({ success: false, message });
  }
}

export async function withdrawMonster(req: Request, res: Response): Promise<void> {
  try {
    const { adventureId, discordUserId, monsterName, message } = req.body as {
      adventureId?: number;
      discordUserId?: string;
      monsterName?: string;
      message?: string;
    };

    if (!adventureId || !discordUserId || !monsterName) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }

    const activeBattle = await battleRepository.findActiveByAdventure(adventureId);
    if (!activeBattle) {
      res.status(400).json({
        success: false,
        message: 'No active battle found. Use `/battle` to start one.',
      });
      return;
    }

    const isPlayerTurn = await battleManager.isParticipantTurn(activeBattle.id, discordUserId, 'switch');
    if (!isPlayerTurn) {
      res.status(400).json({ success: false, message: "It's not your turn!" });
      return;
    }

    const withdrawResult = await battleActionService.withdrawMonster(
      activeBattle.id,
      discordUserId,
      monsterName,
      message ?? '',
    );

    res.json({
      success: true,
      message: withdrawResult.message,
      result: withdrawResult,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to withdraw monster';
    console.error('Error withdrawing monster:', message);
    res.status(400).json({ success: false, message });
  }
}

// =============================================================================
// PvP Battle
// =============================================================================

export async function initiatePvPBattle(req: Request, res: Response): Promise<void> {
  try {
    const { adventureId, discordUserId, trainerName, opponentTrainers, opponentIds } = req.body as {
      adventureId?: number;
      discordUserId?: string;
      trainerName?: string;
      opponentTrainers?: string[];
      opponentIds?: string[];
    };

    const opponents = opponentTrainers ?? opponentIds;

    if (!adventureId || !discordUserId || !trainerName || !Array.isArray(opponents)) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }

    const activeBattle = await battleRepository.findActiveByAdventure(adventureId);
    if (activeBattle) {
      res.status(400).json({
        success: false,
        message: 'There is already an active battle in this adventure.',
      });
      return;
    }

    const validOpponents: Array<{
      trainer_name: string;
      trainer_id: number;
      discord_user_id: string | null;
    }> = [];

    for (const opponentTrainerName of opponents) {
      const opponentTrainer = await trainerRepository.findByName(opponentTrainerName);
      if (opponentTrainer) {
        validOpponents.push({
          trainer_name: opponentTrainerName,
          trainer_id: opponentTrainer.id,
          discord_user_id: opponentTrainer.player_user_id,
        });
      }
    }

    if (validOpponents.length === 0) {
      res.status(404).json({
        success: false,
        message: 'None of the specified opponent trainers were found.',
      });
      return;
    }

    const pvpBattle = await battleRepository.create({
      adventureId,
      encounterId: null,
      battleType: 'pvp',
      createdByDiscordUserId: discordUserId,
      battleData: {
        pvp: true,
        challenger: discordUserId,
        challenger_trainer: trainerName,
        opponent_trainers: opponents,
        valid_opponents: validOpponents,
        initialized_at: new Date().toISOString(),
      },
    });

    const challengerTrainer = await trainerRepository.findByNameAndUser(trainerName, discordUserId);
    if (!challengerTrainer) {
      res.status(404).json({ success: false, message: `Trainer "${trainerName}" not found` });
      return;
    }

    await battleManager.addPlayerToBattle(pvpBattle.id, discordUserId, challengerTrainer.id);

    const opponentList = opponents.join(', ');
    await battleLogRepository.logSystem(
      pvpBattle.id,
      `\u{1F525} **PvP BATTLE INITIATED!** \u{1F525}\n**${trainerName}** challenges: **${opponentList}**\n\nOpponents can join with \`/battle [trainer_name]\``,
    );

    res.json({
      success: true,
      message: `PvP battle initiated! ${trainerName} challenges ${opponentList}. Waiting for opponents to join...`,
      battle: pvpBattle,
      validOpponents: validOpponents.length,
      totalChallenged: opponents.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to initiate PvP battle';
    console.error('Error initiating PvP battle:', message);
    res.status(400).json({ success: false, message });
  }
}

// =============================================================================
// Battle Environment
// =============================================================================

const WEATHER_EMOJIS: Record<string, string> = {
  clear: '\u{2600}\u{FE0F}',
  rain: '\u{1F327}\u{FE0F}',
  sunny: '\u{1F31E}',
  sandstorm: '\u{1F32A}\u{FE0F}',
  hail: '\u{1F9CA}',
  snow: '\u{2744}\u{FE0F}',
  fog: '\u{1F32B}\u{FE0F}',
};

const TERRAIN_EMOJIS: Record<string, string> = {
  normal: '\u{1F331}',
  electric: '\u{26A1}',
  grassy: '\u{1F33F}',
  misty: '\u{1F338}',
  psychic: '\u{1F52E}',
};

export async function setBattleWeather(req: Request, res: Response): Promise<void> {
  try {
    const { adventureId, discordUserId, weather } = req.body as {
      adventureId?: number;
      discordUserId?: string;
      weather?: string;
    };

    if (!adventureId || !discordUserId || !weather) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }

    const activeBattle = await battleRepository.findActiveByAdventure(adventureId);
    if (!activeBattle) {
      res.status(400).json({ success: false, message: 'No active battle found.' });
      return;
    }

    const battleData = { ...activeBattle.battleData } as Record<string, unknown>;
    battleData.weather = weather;
    battleData.weather_set_at = new Date().toISOString();
    battleData.weather_set_by = discordUserId;

    await battleRepository.update(activeBattle.id, { battleData });

    await battleLogRepository.logSystem(
      activeBattle.id,
      `${WEATHER_EMOJIS[weather] ?? '\u{1F324}\u{FE0F}'} **Weather changed to ${weather.toUpperCase()}!**`,
    );

    res.json({
      success: true,
      message: `Weather set to ${weather}! This may affect certain moves and abilities.`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to set weather';
    console.error('Error setting battle weather:', message);
    res.status(400).json({ success: false, message });
  }
}

export async function setBattleTerrain(req: Request, res: Response): Promise<void> {
  try {
    const { adventureId, discordUserId, terrain } = req.body as {
      adventureId?: number;
      discordUserId?: string;
      terrain?: string;
    };

    if (!adventureId || !discordUserId || !terrain) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }

    const activeBattle = await battleRepository.findActiveByAdventure(adventureId);
    if (!activeBattle) {
      res.status(400).json({ success: false, message: 'No active battle found.' });
      return;
    }

    const battleData = { ...activeBattle.battleData } as Record<string, unknown>;
    battleData.terrain = terrain;
    battleData.terrain_set_at = new Date().toISOString();
    battleData.terrain_set_by = discordUserId;

    await battleRepository.update(activeBattle.id, { battleData });

    await battleLogRepository.logSystem(
      activeBattle.id,
      `${TERRAIN_EMOJIS[terrain] ?? '\u{1F30D}'} **Terrain changed to ${terrain.toUpperCase()}!**`,
    );

    res.json({
      success: true,
      message: `Terrain set to ${terrain}! This may provide various battle effects.`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to set terrain';
    console.error('Error setting battle terrain:', message);
    res.status(400).json({ success: false, message });
  }
}

// =============================================================================
// Battle End / Force
// =============================================================================

export async function forceWinBattle(req: Request, res: Response): Promise<void> {
  try {
    const { adventureId, discordUserId, message } = req.body as {
      adventureId?: number;
      discordUserId?: string;
      message?: string;
    };

    if (!adventureId || !discordUserId) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }

    const activeBattle = await battleRepository.findActiveByAdventure(adventureId);
    if (!activeBattle) {
      res.status(404).json({ success: false, message: 'No active battle found in this adventure' });
      return;
    }

    const result = await battleManager.forceEndBattle(activeBattle.id, 'players', message);

    res.json({
      success: true,
      message: result.reason || 'Battle force won!',
      result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to force win battle';
    console.error('Error force winning battle:', message);
    res.status(400).json({ success: false, message });
  }
}

export async function forceLoseBattle(req: Request, res: Response): Promise<void> {
  try {
    const { adventureId, discordUserId, message } = req.body as {
      adventureId?: number;
      discordUserId?: string;
      message?: string;
    };

    if (!adventureId || !discordUserId) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }

    const activeBattle = await battleRepository.findActiveByAdventure(adventureId);
    if (!activeBattle) {
      res.status(404).json({ success: false, message: 'No active battle found in this adventure' });
      return;
    }

    const result = await battleManager.forceEndBattle(activeBattle.id, 'opponents', message);

    res.json({
      success: true,
      message: result.reason || 'Battle force lost!',
      result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to force lose battle';
    console.error('Error force losing battle:', message);
    res.status(400).json({ success: false, message });
  }
}

export async function setWinCondition(req: Request, res: Response): Promise<void> {
  try {
    const { adventureId, discordUserId, count } = req.body as {
      adventureId?: number;
      discordUserId?: string;
      count?: number;
    };

    if (!adventureId || !discordUserId || !count) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }

    const activeBattle = await battleRepository.findActiveByAdventure(adventureId);
    if (!activeBattle) {
      res.status(404).json({ success: false, message: 'No active battle found in this adventure' });
      return;
    }

    const updatedBattleData = {
      ...activeBattle.battleData,
      win_condition: {
        knockout_count: count,
        set_by: discordUserId,
        set_at: new Date().toISOString(),
      },
    };

    await battleRepository.update(activeBattle.id, { battleData: updatedBattleData });

    await battleLogRepository.logSystem(
      activeBattle.id,
      `\u{2699}\u{FE0F} **Win condition set**: ${count} monsters must be knocked out to win the battle`,
    );

    res.json({
      success: true,
      message: `Win condition set to ${count} knockouts`,
      winCondition: count,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to set win condition';
    console.error('Error setting win condition:', message);
    res.status(400).json({ success: false, message });
  }
}

export async function forfeitBattle(req: Request, res: Response): Promise<void> {
  try {
    const { adventureId, discordUserId } = req.body as {
      adventureId?: number;
      discordUserId?: string;
    };

    if (!adventureId || !discordUserId) {
      res.status(400).json({ success: false, message: 'Adventure ID and Discord user ID are required' });
      return;
    }

    const activeBattle = await battleRepository.findActiveByAdventure(adventureId);
    if (!activeBattle) {
      res.status(404).json({ success: false, message: 'No active battle found' });
      return;
    }

    const participant = await battleParticipantRepository.findByBattleAndUser(activeBattle.id, discordUserId);
    if (!participant) {
      res.status(404).json({ success: false, message: 'You are not participating in this battle' });
      return;
    }

    const winnerType = participant.teamSide === 'players' ? 'opponents' : 'players';
    const forfeitMessage =
      `\u{1F3F3}\u{FE0F} **BATTLE FORFEITED** \u{1F3F3}\u{FE0F}\n\n**${participant.trainerName || 'Player'}** has forfeited the battle!`;

    await battleManager.endBattle(activeBattle.id, winnerType, forfeitMessage);

    res.json({
      success: true,
      message: 'Battle forfeited successfully',
      result: {
        result: 'forfeit',
        message: forfeitMessage,
        winner_type: winnerType,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to forfeit battle';
    console.error('Error forfeiting battle:', message);
    res.status(400).json({ success: false, message });
  }
}

export async function fleeBattle(req: Request, res: Response): Promise<void> {
  try {
    const { adventureId, discordUserId, message } = req.body as {
      adventureId?: number;
      discordUserId?: string;
      message?: string;
    };

    if (!adventureId || !discordUserId) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }

    const activeBattle = await battleRepository.findActiveByAdventure(adventureId);
    if (!activeBattle) {
      res.status(404).json({ success: false, message: 'No active battle found' });
      return;
    }

    const fleeMessage = message
      ?? `🏃 **FLED FROM BATTLE!** 🏃\n\nThe trainers fled from the battle!`;

    await battleManager.endBattle(activeBattle.id, 'opponents', fleeMessage);

    res.json({
      success: true,
      message: 'Successfully fled from battle!',
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to flee from battle';
    console.error('Error fleeing from battle:', msg);
    res.status(400).json({ success: false, message: msg });
  }
}

// =============================================================================
// Adventure End & Rewards
// =============================================================================

export async function endAdventure(req: Request, res: Response): Promise<void> {
  try {
    const { adventureId, discordUserId } = req.body as {
      adventureId?: number;
      discordUserId?: string;
    };

    if (!adventureId || !discordUserId) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }

    const completionResult = await adventureRewardService.endAdventure({
      adventureId,
      discordUserId,
    });

    res.json({ success: true, ...completionResult });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to end adventure';
    console.error('Error ending adventure:', message);
    res.status(400).json({ success: false, message });
  }
}

export async function getUnclaimedRewards(req: Request, res: Response): Promise<void> {
  try {
    const discordUserId = paramToString(req.params.discordUserId);

    const unclaimedRewards = await adventureRewardService.getUnclaimedRewards(discordUserId);

    res.json({ success: true, rewards: unclaimedRewards });
  } catch (error) {
    console.error('Error getting unclaimed rewards:', error);
    res.status(500).json({ success: false, message: 'Failed to get unclaimed rewards' });
  }
}

export async function claimRewardsDiscord(req: Request, res: Response): Promise<void> {
  try {
    const claimResult = await adventureRewardService.claimRewards(req.body);

    res.json({ success: true, claimResult });
  } catch (error) {
    console.error('Error claiming adventure rewards:', error);
    res.status(500).json({ success: false, message: 'Failed to claim rewards' });
  }
}

// =============================================================================
// User Lookup
// =============================================================================

export async function getUserByDiscordId(req: Request, res: Response): Promise<void> {
  try {
    const discordUserId = paramToString(req.params.discordUserId);

    const user = await userRepository.findByDiscordId(discordUserId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        discord_id: user.discord_id,
      },
    });
  } catch (error) {
    console.error('Error getting user by Discord ID:', error);
    res.status(500).json({ success: false, message: 'Failed to get user' });
  }
}
