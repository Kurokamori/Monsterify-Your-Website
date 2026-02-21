import { Router } from 'express';
import { authenticate, requireAdmin } from '@middleware/auth.middleware';
import {
  getAllMissions,
  getMissionById,
  getAvailableMissions,
  getActiveMissions,
  getEligibleMonsters,
  startMission,
  claimMissionRewards,
  createMission,
  updateMission,
  deleteMission,
  getDifficulties,
  adminGetUserMissions,
  adminUpdateUserMission,
  adminCompleteMission,
  adminDeleteUserMission,
} from '@controllers/adventure/mission.controller';

const router: Router = Router();

// ============================================================================
// Public Routes
// ============================================================================

router.get('/', getAllMissions);

// ============================================================================
// Admin Routes (before /:id to avoid route conflicts)
// ============================================================================

router.get('/admin/difficulties', authenticate, requireAdmin, getDifficulties);
router.get('/admin/user-missions', authenticate, requireAdmin, adminGetUserMissions);
router.put('/admin/user-missions/:id', authenticate, requireAdmin, adminUpdateUserMission);
router.put('/admin/user-missions/:id/complete', authenticate, requireAdmin, adminCompleteMission);
router.delete('/admin/user-missions/:id', authenticate, requireAdmin, adminDeleteUserMission);

router.get('/:id', getMissionById);

// ============================================================================
// Protected Routes
// ============================================================================

router.get('/user/available', authenticate, getAvailableMissions);
router.get('/user/active', authenticate, getActiveMissions);
router.get('/:missionId/eligible-monsters', authenticate, getEligibleMonsters);
router.post('/:missionId/start', authenticate, startMission);
router.post('/:missionId/claim', authenticate, claimMissionRewards);

// ============================================================================
// Admin Routes
// ============================================================================

router.post('/', authenticate, requireAdmin, createMission);
router.put('/:id', authenticate, requireAdmin, updateMission);
router.delete('/:id', authenticate, requireAdmin, deleteMission);

export default router;
