import { Router } from 'express';
import { authenticate, optionalAuth, requireAdmin } from '@middleware/auth.middleware';
import { upload } from '@middleware/upload.middleware';
import {
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
  getTrainerGallery,
  getTrainerReferences,
  getTrainerImages,
  uploadTrainerImage,
  addTrainerMegaImage,
  addTrainerAdditionalRef,
  addTrainerLevels,
  getTrainerAchievements,
  claimTrainerAchievement,
  claimAllTrainerAchievements,
  getTrainerAchievementStats,
  getTrainerBerries,
  adminAddLevelsToTrainer,
  adminAddLevelsToBulkTrainers,
  adminUpdateCurrency,
  adminChangeTrainerOwner,
  adminDeleteTrainer,
  bulkAddItemToAllTrainers,
} from '@controllers/api/trainer.controller';

const router = Router();

// =============================================================================
// Trainer CRUD
// =============================================================================

// Get all trainers for forms (no pagination)
router.get('/all', getAllTrainersForForms);

// Get all trainers (paginated)
router.get('/', getAllTrainers);

// Get trainers by user ID
router.get('/user/:userId', getTrainersByUserId);

// Get current user's trainers
router.get('/user', authenticate, getTrainersByUserId);

// Create a new trainer (with optional file upload)
router.post('/', authenticate, upload.single('image'), createTrainer);

// Add levels to trainer (self-service level cap reallocation)
router.post('/add-levels', authenticate, addTrainerLevels);

// Upload trainer image
router.post('/upload-image', authenticate, upload.single('image'), uploadTrainerImage);

// Admin Trainer Management (must come before /:id routes)
router.put('/admin/:id/owner', authenticate, requireAdmin, adminChangeTrainerOwner);
router.delete('/admin/:id', authenticate, requireAdmin, adminDeleteTrainer);

// Get trainer by ID
router.get('/:id', getTrainerById);

// Update trainer (with optional file upload)
router.put('/:id', upload.single('image'), updateTrainer);

// Delete trainer
router.delete('/:id', deleteTrainer);

// =============================================================================
// Inventory
// =============================================================================

router.post('/admin/inventory/bulk-add', authenticate, requireAdmin, bulkAddItemToAllTrainers);
router.get('/:id/inventory', getTrainerInventory);
router.put('/:id/inventory', updateTrainerInventoryItem);

// =============================================================================
// Monsters
// =============================================================================

router.get('/:id/monsters', getTrainerMonsters);
router.get('/:id/monsters/all', getAllTrainerMonsters);
router.put('/:id/monsters/boxes', updateMonsterBoxPositions);

// =============================================================================
// Featured Monsters
// =============================================================================

router.get('/:id/featured-monsters', getFeaturedMonsters);
router.put('/:id/featured-monsters', authenticate, updateFeaturedMonsters);

// =============================================================================
// References & Images
// =============================================================================

router.get('/:id/gallery', getTrainerGallery);
router.get('/:id/references', getTrainerReferences);
router.get('/:id/images', getTrainerImages);
router.post('/:id/mega-image', authenticate, addTrainerMegaImage);
router.post('/:id/additional-ref', authenticate, addTrainerAdditionalRef);

// =============================================================================
// Achievements
// =============================================================================

router.get('/:id/achievements', optionalAuth, getTrainerAchievements);
router.post('/:id/achievements/:achievementId/claim', authenticate, claimTrainerAchievement);
router.post('/:id/achievements/claim-all', authenticate, claimAllTrainerAchievements);
router.get('/:id/achievements/stats', optionalAuth, getTrainerAchievementStats);

// =============================================================================
// Berries
// =============================================================================

router.get('/:id/berries', getTrainerBerries);

// =============================================================================
// Admin Level Management (consolidated from old level management controller)
// =============================================================================

router.post('/admin/levels/:trainerId', authenticate, requireAdmin, adminAddLevelsToTrainer);
router.post('/admin/levels', authenticate, requireAdmin, adminAddLevelsToBulkTrainers);
router.post('/admin/currency/:trainerId', authenticate, requireAdmin, adminUpdateCurrency);

export default router;
