const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
  getAllTrainers,
  getAllTrainersForForms,
  getTrainerById,
  getTrainersByUserId,
  createTrainer,
  updateTrainer,
  deleteTrainer,
  getTrainerInventory,
  updateTrainerInventoryItem,
  getTrainerMonsters,
  getAllTrainerMonsters,
  updateMonsterBoxPositions,
  getFeaturedMonsters,
  updateFeaturedMonsters,
  getTrainerReferences,
  addTrainerLevels,
  getTrainerAchievements,
  claimTrainerAchievement,
  claimAllTrainerAchievements,
  getTrainerAchievementStats,
  getTrainerBerries
} = require('../controllers/trainerController');

const { getTrainerAdventures } = require('../controllers/adventureController');

// Routes for /api/trainers

// Get all trainers for forms (no pagination)
router.get('/all', getAllTrainersForForms);

// Get all trainers
router.get('/', getAllTrainers);

// Get trainers by user ID
router.get('/user/:userId', getTrainersByUserId);

// Get current user's trainers - requires authentication
router.get('/user', protect, getTrainersByUserId);

// Create a new trainer (with optional file upload)
router.post('/', protect, upload.single('image'), createTrainer);

// Get trainer by ID
router.get('/:id', getTrainerById);

// Update trainer (with optional file upload)
router.put('/:id', upload.single('image'), updateTrainer);

// Delete trainer
router.delete('/:id', deleteTrainer);

// Get trainer inventory
router.get('/:id/inventory', getTrainerInventory);

// Update trainer inventory item
router.put('/:id/inventory', updateTrainerInventoryItem);

// Get trainer monsters (paginated)
router.get('/:id/monsters', getTrainerMonsters);

// Get all trainer monsters (no pagination, for dropdowns and forms)
router.get('/:id/monsters/all', getAllTrainerMonsters);

// Update monster box positions
router.put('/:id/monsters/boxes', updateMonsterBoxPositions);

// Get featured monsters
router.get('/:id/featured-monsters', getFeaturedMonsters);

// Update featured monsters
router.put('/:id/featured-monsters', protect, updateFeaturedMonsters);

// Get trainer references
router.get('/:id/references', getTrainerReferences);

// Get trainer adventures
router.get('/:id/adventures', getTrainerAdventures);

// Add levels to trainer (for level cap reallocation)
router.post('/add-levels', protect, addTrainerLevels);

// Get trainer achievements (with optional authentication)
router.get('/:id/achievements', optionalAuth, getTrainerAchievements);

// Claim trainer achievement
router.post('/:id/achievements/:achievementId/claim', protect, claimTrainerAchievement);

// Claim all trainer achievements
router.post('/:id/achievements/claim-all', protect, claimAllTrainerAchievements);

// Get trainer achievement statistics (with optional authentication)
router.get('/:id/achievements/stats', optionalAuth, getTrainerAchievementStats);

// Get trainer berries
router.get('/:id/berries', getTrainerBerries);

module.exports = router;
