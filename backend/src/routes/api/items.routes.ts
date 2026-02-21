import { Router } from 'express';
import { authenticate, requireAdmin } from '@middleware/auth.middleware';
import { upload } from '@middleware/upload.middleware';
import {
  // CRUD
  getAllItems,
  getAllCategories,
  getAllTypes,
  getAllRarities,
  getItemById,
  createItem,
  createBulkItems,
  uploadImage,
  updateItem,
  deleteItem,
  // Berry & Pastry Usage
  useBerry,
  usePastry,
  applyPastry,
  // Item Rolling
  rollItems,
  rollItemsForTrainer,
  // Admin Management
  addItemToTrainer,
  addItemToBulkTrainers,
  addItemToAllTrainers,
  addSpecialBerriesToTrainer,
  batchUpdateItemImages,
} from '@controllers/api/items.controller';

const router = Router();

// ============================================================================
// Public Routes
// ============================================================================

router.get('/', getAllItems);
router.get('/categories', getAllCategories);
router.get('/types', getAllTypes);
router.get('/rarities', getAllRarities);
router.get('/:id', getItemById);

// ============================================================================
// Authenticated Routes - Berry & Pastry Usage
// ============================================================================

router.post('/use-berry', authenticate, useBerry);
router.post('/use-pastry', authenticate, usePastry);
router.post('/apply-pastry', authenticate, applyPastry);

// ============================================================================
// Authenticated Routes - Item Rolling
// ============================================================================

router.post('/roll', authenticate, rollItems);
router.post('/roll/trainer', authenticate, rollItemsForTrainer);

// ============================================================================
// Admin Routes - Item CRUD
// ============================================================================

router.patch('/batch-images', authenticate, requireAdmin, batchUpdateItemImages);
router.post('/', authenticate, requireAdmin, createItem);
router.post('/bulk', authenticate, requireAdmin, createBulkItems);
router.post('/upload', authenticate, requireAdmin, upload.single('image'), uploadImage);
router.put('/:id', authenticate, requireAdmin, updateItem);
router.delete('/:id', authenticate, requireAdmin, deleteItem);

// ============================================================================
// Admin Routes - Inventory Management
// ============================================================================

router.post('/admin/trainers/:trainerId', authenticate, requireAdmin, addItemToTrainer);
router.post('/admin/trainers', authenticate, requireAdmin, addItemToBulkTrainers);
router.post('/admin/all-trainers', authenticate, requireAdmin, addItemToAllTrainers);
router.post('/admin/special-berries/:trainerId', authenticate, requireAdmin, addSpecialBerriesToTrainer);

export default router;
