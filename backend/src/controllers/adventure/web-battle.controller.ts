/**
 * Web Battle Controller
 * Website-facing battle endpoints: teams, friendly battles, gauntlets, PvP, badges.
 */

import { Request, Response } from 'express';
import { WebBattleService } from '../../services/adventure/web-battle.service';
import { BattleTeamRepository } from '../../repositories/battle-team.repository';
import { GymRepository } from '../../repositories/gym.repository';
import { TrainerRepository } from '../../repositories/trainer.repository';
import { UserRow } from '../../repositories/user.repository';
import { emitBattleUpdate, emitBattleChallenge } from '../../socket/battle-events';

const webBattleService = new WebBattleService();
const teamRepo = new BattleTeamRepository();
const gymRepo = new GymRepository();
const trainerRepo = new TrainerRepository();

const getUser = (req: Request): UserRow => {
  const user = req.user as UserRow | undefined;
  if (!user) {
    throw new Error('Not authenticated');
  }
  return user;
};

const ownsTrainer = async (user: UserRow, trainerId: number): Promise<boolean> => {
  const trainer = await trainerRepo.findById(trainerId);
  if (!trainer) {return false;}
  return (
    trainer.player_user_id === user.discord_id ||
    trainer.player_user_id === String(user.id) ||
    Boolean(user.is_admin)
  );
};

const fail = (res: Response, err: unknown, fallback: string): void => {
  const message = err instanceof Error ? err.message : fallback;
  console.error(`[WebBattle] ${fallback}:`, err);
  res.status(400).json({ success: false, message });
};

// ============================================================================
// Battle Teams
// ============================================================================

export async function getMyTeams(req: Request, res: Response): Promise<void> {
  try {
    const user = getUser(req);
    const trainerId = parseInt(String(req.query.trainerId), 10);
    if (isNaN(trainerId) || !(await ownsTrainer(user, trainerId))) {
      res.status(403).json({ success: false, message: 'Not your trainer' });
      return;
    }
    const teams = await teamRepo.findByTrainerId(trainerId);
    res.json({ success: true, teams });
  } catch (err) {
    fail(res, err, 'Failed to load teams');
  }
}

export async function createTeam(req: Request, res: Response): Promise<void> {
  try {
    const user = getUser(req);
    const { trainerId, name, description, monsterIds, isPublic } = req.body as {
      trainerId: number;
      name: string;
      description?: string;
      monsterIds: number[];
      isPublic?: boolean;
    };
    if (!trainerId || !name || !Array.isArray(monsterIds)) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }
    if (monsterIds.length < 1 || monsterIds.length > 6) {
      res.status(400).json({ success: false, message: 'A team needs 1-6 monsters' });
      return;
    }
    if (!(await ownsTrainer(user, trainerId))) {
      res.status(403).json({ success: false, message: 'Not your trainer' });
      return;
    }
    const team = await teamRepo.create({ trainerId, name, description, monsterIds, isPublic });
    res.status(201).json({ success: true, team });
  } catch (err) {
    fail(res, err, 'Failed to create team');
  }
}

export async function updateTeam(req: Request, res: Response): Promise<void> {
  try {
    const user = getUser(req);
    const teamId = parseInt(String(req.params.teamId ?? ''), 10);
    const team = await teamRepo.findById(teamId);
    if (!team) {
      res.status(404).json({ success: false, message: 'Team not found' });
      return;
    }
    if (!(await ownsTrainer(user, team.trainerId))) {
      res.status(403).json({ success: false, message: 'Not your team' });
      return;
    }
    const { name, description, monsterIds, isPublic } = req.body as {
      name?: string;
      description?: string;
      monsterIds?: number[];
      isPublic?: boolean;
    };
    if (monsterIds && (monsterIds.length < 1 || monsterIds.length > 6)) {
      res.status(400).json({ success: false, message: 'A team needs 1-6 monsters' });
      return;
    }
    const updated = await teamRepo.update(teamId, { name, description, monsterIds, isPublic });
    res.json({ success: true, team: updated });
  } catch (err) {
    fail(res, err, 'Failed to update team');
  }
}

export async function deleteTeam(req: Request, res: Response): Promise<void> {
  try {
    const user = getUser(req);
    const teamId = parseInt(String(req.params.teamId ?? ''), 10);
    const team = await teamRepo.findById(teamId);
    if (!team) {
      res.status(404).json({ success: false, message: 'Team not found' });
      return;
    }
    if (!(await ownsTrainer(user, team.trainerId))) {
      res.status(403).json({ success: false, message: 'Not your team' });
      return;
    }
    await teamRepo.delete(teamId);
    res.json({ success: true });
  } catch (err) {
    fail(res, err, 'Failed to delete team');
  }
}

export async function getOpponentTeams(req: Request, res: Response): Promise<void> {
  try {
    const user = getUser(req);
    const teams = await webBattleService.listOpponentTeams(user);
    res.json({ success: true, teams });
  } catch (err) {
    fail(res, err, 'Failed to load opponents');
  }
}

// ============================================================================
// Gyms & Badges
// ============================================================================

export async function getGyms(req: Request, res: Response): Promise<void> {
  try {
    const trainerId = req.query.trainerId ? parseInt(String(req.query.trainerId), 10) : undefined;
    const gyms = await webBattleService.listGyms(trainerId);
    res.json({ success: true, gyms });
  } catch (err) {
    fail(res, err, 'Failed to load gyms');
  }
}

export async function getTrainerBadges(req: Request, res: Response): Promise<void> {
  try {
    const trainerId = parseInt(String(req.params.trainerId ?? ''), 10);
    if (isNaN(trainerId)) {
      res.status(400).json({ success: false, message: 'Invalid trainer id' });
      return;
    }
    const badges = await webBattleService.getTrainerBadges(trainerId);
    res.json({ success: true, badges });
  } catch (err) {
    fail(res, err, 'Failed to load badges');
  }
}

// Admin gym CRUD (art/teams get filled in later via these endpoints)
export async function adminCreateGym(req: Request, res: Response): Promise<void> {
  try {
    const gym = await gymRepo.create(req.body);
    res.status(201).json({ success: true, gym });
  } catch (err) {
    fail(res, err, 'Failed to create gym');
  }
}

export async function adminUpdateGym(req: Request, res: Response): Promise<void> {
  try {
    const gymId = parseInt(String(req.params.gymId ?? ''), 10);
    const gym = await gymRepo.update(gymId, req.body);
    res.json({ success: true, gym });
  } catch (err) {
    fail(res, err, 'Failed to update gym');
  }
}

export async function adminDeleteGym(req: Request, res: Response): Promise<void> {
  try {
    const gymId = parseInt(String(req.params.gymId ?? ''), 10);
    await gymRepo.delete(gymId);
    res.json({ success: true });
  } catch (err) {
    fail(res, err, 'Failed to delete gym');
  }
}

export async function adminListGyms(_req: Request, res: Response): Promise<void> {
  try {
    const gyms = await gymRepo.findAll();
    res.json({ success: true, gyms });
  } catch (err) {
    fail(res, err, 'Failed to list gyms');
  }
}

// ============================================================================
// Battles
// ============================================================================

export async function startFriendlyBattle(req: Request, res: Response): Promise<void> {
  try {
    const user = getUser(req);
    const { trainerId, monsterIds, opponentTeamId, difficulty } = req.body as {
      trainerId: number;
      monsterIds: number[];
      opponentTeamId: number;
      difficulty?: 'easy' | 'medium' | 'hard';
    };
    if (!trainerId || !Array.isArray(monsterIds) || !opponentTeamId) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }
    const state = await webBattleService.startFriendlyBattle(
      user,
      trainerId,
      monsterIds,
      opponentTeamId,
      difficulty ?? 'medium'
    );
    res.status(201).json({ success: true, state });
  } catch (err) {
    fail(res, err, 'Failed to start battle');
  }
}

export async function startGauntlet(req: Request, res: Response): Promise<void> {
  try {
    const user = getUser(req);
    const { trainerId, monsterIds, gymId } = req.body as {
      trainerId: number;
      monsterIds: number[];
      gymId: number;
    };
    if (!trainerId || !Array.isArray(monsterIds) || !gymId) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }
    const state = await webBattleService.startGauntlet(user, trainerId, monsterIds, gymId);
    res.status(201).json({ success: true, state });
  } catch (err) {
    fail(res, err, 'Failed to start gauntlet');
  }
}

export async function createPvpChallenge(req: Request, res: Response): Promise<void> {
  try {
    const user = getUser(req);
    const { trainerId, monsterIds, opponentTrainerId } = req.body as {
      trainerId: number;
      monsterIds: number[];
      opponentTrainerId: number;
    };
    if (!trainerId || !Array.isArray(monsterIds) || !opponentTrainerId) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }
    const state = await webBattleService.createPvpChallenge(
      user,
      trainerId,
      monsterIds,
      opponentTrainerId
    );
    const challenger = state.participants.find((p) => p.isYou);
    emitBattleChallenge(state.battleId, challenger?.trainerName ?? 'A trainer');
    res.status(201).json({ success: true, state });
  } catch (err) {
    fail(res, err, 'Failed to create challenge');
  }
}

export async function acceptPvpChallenge(req: Request, res: Response): Promise<void> {
  try {
    const user = getUser(req);
    const battleId = parseInt(String(req.params.battleId ?? ''), 10);
    const { trainerId, monsterIds } = req.body as { trainerId: number; monsterIds: number[] };
    if (!trainerId || !Array.isArray(monsterIds)) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }
    const state = await webBattleService.acceptPvpChallenge(user, battleId, trainerId, monsterIds);
    emitBattleUpdate(battleId, 'accepted');
    res.json({ success: true, state });
  } catch (err) {
    fail(res, err, 'Failed to accept challenge');
  }
}

export async function declinePvpChallenge(req: Request, res: Response): Promise<void> {
  try {
    const user = getUser(req);
    const battleId = parseInt(String(req.params.battleId ?? ''), 10);
    await webBattleService.declinePvpChallenge(user, battleId);
    emitBattleUpdate(battleId, 'declined');
    res.json({ success: true });
  } catch (err) {
    fail(res, err, 'Failed to decline challenge');
  }
}

export async function getIncomingChallenges(req: Request, res: Response): Promise<void> {
  try {
    const user = getUser(req);
    const challenges = await webBattleService.listIncomingChallenges(user);
    res.json({ success: true, challenges });
  } catch (err) {
    fail(res, err, 'Failed to load challenges');
  }
}

export async function getMyBattles(req: Request, res: Response): Promise<void> {
  try {
    const user = getUser(req);
    const battles = await webBattleService.listMyBattles(user);
    res.json({ success: true, battles });
  } catch (err) {
    fail(res, err, 'Failed to load battles');
  }
}

export async function getBattleState(req: Request, res: Response): Promise<void> {
  try {
    const user = getUser(req);
    const battleId = parseInt(String(req.params.battleId ?? ''), 10);
    const state = await webBattleService.getBattleState(battleId, user);
    res.json({ success: true, state });
  } catch (err) {
    fail(res, err, 'Failed to load battle');
  }
}

export async function performBattleAction(req: Request, res: Response): Promise<void> {
  try {
    const user = getUser(req);
    const battleId = parseInt(String(req.params.battleId ?? ''), 10);
    const action = req.body as
      | { type: 'move'; moveName: string; targetBattleMonsterId?: number }
      | { type: 'switch'; battleMonsterId: number }
      | { type: 'forfeit' };

    if (!action || !['move', 'switch', 'forfeit'].includes(action.type)) {
      res.status(400).json({ success: false, message: 'Invalid action' });
      return;
    }

    const result = await webBattleService.performAction(battleId, user, action);
    emitBattleUpdate(battleId, result.battleEnded ? 'ended' : 'action');
    res.json({ ...result, success: true });
  } catch (err) {
    fail(res, err, 'Failed to perform action');
  }
}
