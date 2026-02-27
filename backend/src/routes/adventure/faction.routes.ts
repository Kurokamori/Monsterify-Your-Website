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
  updateFactionAdmin,
  bulkUpdateFactionPropertyAdmin,
  getFactionTitlesAdmin,
  createFactionTitleAdmin,
  updateFactionTitleAdmin,
  deleteFactionTitleAdmin,
  getFactionRelationshipsAdmin,
  createFactionRelationshipAdmin,
  updateFactionRelationshipAdmin,
  deleteFactionRelationshipAdmin,
  getFactionStoreItemsAdmin,
  createFactionStoreItemAdmin,
  updateFactionStoreItemAdmin,
  deleteFactionStoreItemAdmin,
  getAllPromptsAdmin,
  getFactionPromptsAdmin,
  deleteFactionPromptAdmin,
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

// Admin: Faction Management
router.put('/admin/factions/bulk-property', authenticate, requireAdmin, bulkUpdateFactionPropertyAdmin);
router.put('/admin/factions/:factionId', authenticate, requireAdmin, updateFactionAdmin);
router.get('/admin/factions/:factionId/titles', authenticate, requireAdmin, getFactionTitlesAdmin);
router.post('/admin/titles', authenticate, requireAdmin, createFactionTitleAdmin);
router.put('/admin/titles/:titleId', authenticate, requireAdmin, updateFactionTitleAdmin);
router.delete('/admin/titles/:titleId', authenticate, requireAdmin, deleteFactionTitleAdmin);
router.get('/admin/factions/:factionId/relationships', authenticate, requireAdmin, getFactionRelationshipsAdmin);
router.post('/admin/relationships', authenticate, requireAdmin, createFactionRelationshipAdmin);
router.put('/admin/relationships/:relationshipId', authenticate, requireAdmin, updateFactionRelationshipAdmin);
router.delete('/admin/relationships/:relationshipId', authenticate, requireAdmin, deleteFactionRelationshipAdmin);
router.get('/admin/factions/:factionId/store-items', authenticate, requireAdmin, getFactionStoreItemsAdmin);
router.post('/admin/store-items', authenticate, requireAdmin, createFactionStoreItemAdmin);
router.put('/admin/store-items/:itemId', authenticate, requireAdmin, updateFactionStoreItemAdmin);
router.delete('/admin/store-items/:itemId', authenticate, requireAdmin, deleteFactionStoreItemAdmin);
router.get('/admin/prompts/all', authenticate, requireAdmin, getAllPromptsAdmin);
router.get('/admin/factions/:factionId/prompts', authenticate, requireAdmin, getFactionPromptsAdmin);
router.delete('/admin/prompts/:promptId', authenticate, requireAdmin, deleteFactionPromptAdmin);

// Admin: People Management
router.get('/admin/people', authenticate, requireAdmin, getAllFactionPeopleAdmin);
router.post('/admin/people', authenticate, requireAdmin, createFactionPersonAdmin);
router.put('/admin/people/:personId', authenticate, requireAdmin, updateFactionPersonAdmin);
router.delete('/admin/people/:personId', authenticate, requireAdmin, deleteFactionPersonAdmin);
router.get('/admin/people/:personId/team', authenticate, requireAdmin, getPersonTeamAdmin);
router.post('/admin/people/:personId/team', authenticate, requireAdmin, addMonsterToTeamAdmin);
router.put('/admin/monsters/:monsterId', authenticate, requireAdmin, updateMonsterAdmin);
router.delete('/admin/monsters/:monsterId', authenticate, requireAdmin, deleteMonsterAdmin);

export default router;
