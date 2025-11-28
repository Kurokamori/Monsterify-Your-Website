const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  getAllFactions,
  getFactionById,
  getTrainerStandings,
  getTrainerFactionStanding,
  updateTrainerStanding,
  getFactionStore,
  purchaseFromFactionStore,
  submitTribute,
  getTrainerTributes,
  reviewTribute,
  getPendingTributes,
  getFactionPrompts,
  getAvailableSubmissions,
  createFactionSubmission,
  getTrainerFactionSubmissions,
  createFactionPrompt,
  updateFactionPrompt,
  getTributeRequirement,
  getAvailableSubmissionsForTribute,
  getFactionPeople,
  getPersonById,
  meetPerson,
  getTrainerMetPeople,
  getAvailableSubmissionsForMeeting
} = require('../controllers/factionController');

// Routes for /api/factions

// Public routes
// Get all factions
router.get('/', getAllFactions);

// Get faction by ID
router.get('/:id', getFactionById);

// Get faction store items
router.get('/:factionId/store', getFactionStore);

// Get faction prompts
router.get('/:factionId/prompts', getFactionPrompts);

// Get faction people
router.get('/:factionId/people', getFactionPeople);

// Get person by ID
router.get('/people/:personId', getPersonById);

// Protected routes
// Get trainer's standings with all factions
router.get('/trainers/:trainerId/standings', protect, getTrainerStandings);

// Get trainer's standing with a specific faction
router.get('/trainers/:trainerId/:factionId/standing', protect, getTrainerFactionStanding);

// Update trainer's standing with a faction (admin only)
router.post('/trainers/:trainerId/:factionId/standing', protect, admin, updateTrainerStanding);

// Purchase from faction store
router.post('/:factionId/store/purchase', protect, purchaseFromFactionStore);

// Submit tribute for faction title
router.post('/:factionId/tributes', protect, submitTribute);

// Get trainer's tributes
router.get('/trainers/:trainerId/tributes', protect, getTrainerTributes);

// Get trainer's available submissions
router.get('/trainers/:trainerId/submissions/available', protect, getAvailableSubmissions);

// Get trainer's available submissions for tribute
router.get('/trainers/:trainerId/submissions/available-for-tribute', protect, getAvailableSubmissionsForTribute);

// Get trainer's available submissions for meeting people
router.get('/trainers/:trainerId/submissions/available-for-meeting', protect, getAvailableSubmissionsForMeeting);

// Get trainer's met people for a faction
router.get('/trainers/:trainerId/:factionId/met-people', protect, getTrainerMetPeople);

// Meet a person (submit artwork)
router.post('/people/:personId/meet', protect, meetPerson);

// Get tribute requirement for trainer
router.get('/trainers/:trainerId/:factionId/tribute-requirement', protect, getTributeRequirement);

// Create faction submission
router.post('/:factionId/submissions', protect, createFactionSubmission);

// Get trainer's faction submissions
router.get('/trainers/:trainerId/faction-submissions', protect, getTrainerFactionSubmissions);

// Admin routes
// Create faction prompt
router.post('/:factionId/prompts', protect, admin, createFactionPrompt);

// Update faction prompt
router.put('/prompts/:promptId', protect, admin, updateFactionPrompt);
// Review tribute
router.put('/tributes/:tributeId/review', protect, admin, reviewTribute);

// Get pending tributes
router.get('/tributes/pending', protect, admin, getPendingTributes);

module.exports = router;
