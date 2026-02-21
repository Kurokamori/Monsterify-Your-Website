import { Router } from 'express';
import { authenticate, requireAdmin } from '@middleware/auth.middleware';
import {
  getAllFactions,
  getFactionById,
  getFactionStore,
  getFactionPrompts,
  getFactionPeople,
  getPersonById,
  getTrainerStandings,
  getTrainerFactionStanding,
  updateTrainerStanding,
  getTrainerTributes,
  getTrainerFactionSubmissions,
  getAvailableSubmissions,
  getAvailableSubmissionsForTribute,
  getAvailableSubmissionsForMeeting,
  getTrainerMetPeople,
  getTributeRequirement,
  purchaseFromFactionStore,
  submitTribute,
  createFactionSubmission,
  meetPerson,
  getPendingTributes,
  reviewTribute,
  createFactionPrompt,
  updateFactionPrompt,
  getAllFactionPeopleAdmin,
  createFactionPersonAdmin,
  updateFactionPersonAdmin,
  deleteFactionPersonAdmin,
  getPersonTeamAdmin,
  addMonsterToTeamAdmin,
  updateMonsterAdmin,
  deleteMonsterAdmin,
} from '@controllers/adventure/faction.controller';

const router = Router();

// =============================================================================
// Public Routes
// =============================================================================

router.get('/', getAllFactions);
router.get('/people/:personId', getPersonById);
router.get('/:factionId', getFactionById);
router.get('/:factionId/store', getFactionStore);
router.get('/:factionId/prompts', getFactionPrompts);
router.get('/:factionId/people', getFactionPeople);

// =============================================================================
// Authenticated Routes
// =============================================================================

router.get('/trainers/:trainerId/standings', authenticate, getTrainerStandings);
router.get('/trainers/:trainerId/:factionId/standing', authenticate, getTrainerFactionStanding);
router.get('/trainers/:trainerId/tributes', authenticate, getTrainerTributes);
router.get('/trainers/:trainerId/faction-submissions', authenticate, getTrainerFactionSubmissions);
router.get('/trainers/:trainerId/submissions/available', authenticate, getAvailableSubmissions);
router.get('/trainers/:trainerId/submissions/available-for-tribute', authenticate, getAvailableSubmissionsForTribute);
router.get('/trainers/:trainerId/submissions/available-for-meeting', authenticate, getAvailableSubmissionsForMeeting);
router.get('/trainers/:trainerId/:factionId/met-people', authenticate, getTrainerMetPeople);
router.get('/trainers/:trainerId/:factionId/tribute-requirement', authenticate, getTributeRequirement);
router.post('/:factionId/store/purchase', authenticate, purchaseFromFactionStore);
router.post('/:factionId/tributes', authenticate, submitTribute);
router.post('/:factionId/submissions', authenticate, createFactionSubmission);
router.post('/people/:personId/meet', authenticate, meetPerson);

// =============================================================================
// Admin Routes
// =============================================================================

router.post('/trainers/:trainerId/:factionId/standing', authenticate, requireAdmin, updateTrainerStanding);
router.get('/tributes/pending', authenticate, requireAdmin, getPendingTributes);
router.put('/tributes/:tributeId/review', authenticate, requireAdmin, reviewTribute);
router.post('/:factionId/prompts', authenticate, requireAdmin, createFactionPrompt);
router.put('/prompts/:promptId', authenticate, requireAdmin, updateFactionPrompt);
router.get('/admin/people', authenticate, requireAdmin, getAllFactionPeopleAdmin);
router.post('/admin/people', authenticate, requireAdmin, createFactionPersonAdmin);
router.put('/admin/people/:personId', authenticate, requireAdmin, updateFactionPersonAdmin);
router.delete('/admin/people/:personId', authenticate, requireAdmin, deleteFactionPersonAdmin);
router.get('/admin/people/:personId/team', authenticate, requireAdmin, getPersonTeamAdmin);
router.post('/admin/people/:personId/team', authenticate, requireAdmin, addMonsterToTeamAdmin);
router.put('/admin/monsters/:monsterId', authenticate, requireAdmin, updateMonsterAdmin);
router.delete('/admin/monsters/:monsterId', authenticate, requireAdmin, deleteMonsterAdmin);

export default router;
