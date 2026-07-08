/**
 * Web Battle Routes
 * Website-facing battle system: teams, friendly AI battles, gym gauntlets, PvP, badges.
 * Mounted at /battle
 */

import express, { Router } from 'express';
import { authenticate, requireAdmin } from '@middleware/auth.middleware';
import {
  getMyTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  getOpponentTeams,
  getGyms,
  getTrainerBadges,
  adminListGyms,
  adminCreateGym,
  adminUpdateGym,
  adminDeleteGym,
  startFriendlyBattle,
  startGauntlet,
  createPvpChallenge,
  acceptPvpChallenge,
  declinePvpChallenge,
  getIncomingChallenges,
  getMyBattles,
  getBattleState,
  performBattleAction,
} from '../../controllers/adventure/web-battle.controller';
import {
  listBattleAssets,
  createBattleAsset,
  updateBattleAsset,
  deleteBattleAsset,
} from '../../controllers/adventure/battle-asset.controller';

const router: Router = express.Router();

// Teams
router.get('/teams', authenticate, getMyTeams);
router.post('/teams', authenticate, createTeam);
router.put('/teams/:teamId', authenticate, updateTeam);
router.delete('/teams/:teamId', authenticate, deleteTeam);
router.get('/opponents', authenticate, getOpponentTeams);

// Gyms & badges
router.get('/gyms', getGyms);
router.get('/badges/trainer/:trainerId', getTrainerBadges);
router.get('/admin/gyms', authenticate, requireAdmin, adminListGyms);
router.post('/admin/gyms', authenticate, requireAdmin, adminCreateGym);
router.put('/admin/gyms/:gymId', authenticate, requireAdmin, adminUpdateGym);
router.delete('/admin/gyms/:gymId', authenticate, requireAdmin, adminDeleteGym);

// Battle visual assets (backgrounds / place-spots / text-box skins)
router.get('/admin/assets', authenticate, requireAdmin, listBattleAssets);
router.post('/admin/assets', authenticate, requireAdmin, createBattleAsset);
router.put('/admin/assets/:assetId', authenticate, requireAdmin, updateBattleAsset);
router.delete('/admin/assets/:assetId', authenticate, requireAdmin, deleteBattleAsset);

// Battles
router.post('/start', authenticate, startFriendlyBattle);
router.post('/gauntlet/start', authenticate, startGauntlet);
router.post('/pvp/challenge', authenticate, createPvpChallenge);
router.post('/pvp/:battleId/accept', authenticate, acceptPvpChallenge);
router.post('/pvp/:battleId/decline', authenticate, declinePvpChallenge);
router.get('/pvp/incoming', authenticate, getIncomingChallenges);
router.get('/mine', authenticate, getMyBattles);
router.get('/:battleId/state', authenticate, getBattleState);
router.post('/:battleId/action', authenticate, performBattleAction);

export default router;
