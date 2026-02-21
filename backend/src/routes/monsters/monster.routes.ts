import { Router } from 'express';
import { authenticate, requireAdmin } from '@middleware/auth.middleware';
import { upload } from '@middleware/upload.middleware';
import {
  getAllMonsters,
  searchMonsters,
  getMonsterById,
  getMonstersByUserId,
  getMonstersByTrainerId,
  createMonster,
  updateMonster,
  deleteMonster,
  addMonsterImage,
  getMonsterImages,
  setMonsterEvolutionData,
  getMonsterEvolutionData,
  getMonsterEvolutionChain,
  getMonsterMoves,
  getMonsterGallery,
  getMonsterReferences,
  uploadMonsterImage,
  addMonsterLevels,
  addMegaStoneImage,
  addMegaImage,
  getMegaImages,
  getMonsterLineage,
  addMonsterLineage,
  removeMonsterLineage,
  initializeMonsterController,
  getMonsterTypes,
  getMonsterAttributes,
  getMonsterSpecies,
  adminAddLevelsToMonster,
  adminAddLevelsToBulkMonsters,
  adminBulkAddMonsters,
  adminGetFilterOptions,
  adminGetMonstersPaginated,
  adminChangeMonsterOwner,
  adminDeleteMonster as adminDeleteMonsterController,
} from '@controllers/monsters/monster.controller';
import {
  evolveMonster,
  getEvolutionOptions,
} from '@controllers/api/evolution.controller';

const router = Router();

// Routes for /api/monsters

// Get all monsters
router.get('/', getAllMonsters);

// Search monsters
router.get('/search', searchMonsters);

// Metadata routes (must be before /:id to avoid conflicts)
router.get('/types', getMonsterTypes);
router.get('/attributes', getMonsterAttributes);
router.get('/species', getMonsterSpecies);

// Get monsters by user ID
router.get('/user/:userId', getMonstersByUserId);

// Get current user's monsters
router.get('/user', authenticate, getMonstersByUserId);

// Get monsters by trainer ID
router.get('/trainer/:trainerId', getMonstersByTrainerId);

// Create a new monster
router.post('/', createMonster);

// Upload monster image
router.post('/upload-image', authenticate, uploadMonsterImage);

// Add levels to monster (for level cap reallocation)
router.post('/add-levels', authenticate, addMonsterLevels);

// Admin Monster Management (must be before /:id to avoid conflicts)
router.post('/admin/levels/:monsterId', authenticate, requireAdmin, adminAddLevelsToMonster);
router.post('/admin/levels', authenticate, requireAdmin, adminAddLevelsToBulkMonsters);
router.post('/admin/bulk-add', authenticate, requireAdmin, adminBulkAddMonsters);
router.get('/admin/filter-options', authenticate, requireAdmin, adminGetFilterOptions);
router.get('/admin/paginated', authenticate, requireAdmin, adminGetMonstersPaginated);
router.put('/admin/:id/owner', authenticate, requireAdmin, adminChangeMonsterOwner);
router.delete('/admin/:id', authenticate, requireAdmin, adminDeleteMonsterController);

// Get monster by ID
router.get('/:id', getMonsterById);

// Update monster
router.put('/:id', updateMonster);

// Delete monster
router.delete('/:id', deleteMonster);

// Monster images
router.post('/:id/images', addMonsterImage);
router.get('/:id/images', getMonsterImages);

// Evolution data
router.post('/:id/evolution', setMonsterEvolutionData);
router.get('/:id/evolution', getMonsterEvolutionData);

// Evolution chain
router.get('/:id/evolution-chain', getMonsterEvolutionChain);

// Moves
router.get('/:id/moves', getMonsterMoves);

// Gallery
router.get('/:id/gallery', getMonsterGallery);

// References
router.get('/:id/references', getMonsterReferences);

// Evolution options and evolve (handled by evolution controller)
router.get('/:id/evolution-options', authenticate, getEvolutionOptions);
router.post('/:id/evolve', authenticate, upload.single('image'), evolveMonster);

// Mega images
router.get('/:id/mega-images', getMegaImages);
router.post('/:id/mega-stone-image', authenticate, addMegaStoneImage);
router.post('/:id/mega-image', authenticate, addMegaImage);

// Lineage
router.get('/:id/lineage', getMonsterLineage);
router.post('/:id/lineage', authenticate, addMonsterLineage);
router.delete('/:id/lineage', authenticate, removeMonsterLineage);

// Initialize monster (stats, moves, abilities, etc.)
router.post('/:id/initialize', authenticate, initializeMonsterController);

export default router;
