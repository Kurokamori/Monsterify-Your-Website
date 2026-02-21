import { Router } from 'express';
import { authenticate } from '@middleware/auth.middleware';
import {
  // Personal
  getPersonalItems,
  // Lists
  getLists,
  getListById,
  createList,
  updateList,
  deleteList,
  // Items
  getArtTodoItems,
  createArtTodoItem,
  updateArtTodoItem,
  moveItem,
  deleteArtTodoItem,
  // References
  getItemReferences,
  getItemReferenceMatrix,
  addItemReference,
  removeItemReference,
  // Helpers
  getUserTrainers,
  getUserMonsters,
} from '../../controllers';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Personal items (cross-list)
router.get('/personal', getPersonalItems);

// ============================================================================
// List Routes
// ============================================================================

router.get('/lists', getLists);
router.post('/lists', createList);
router.get('/lists/:id', getListById);
router.put('/lists/:id', updateList);
router.delete('/lists/:id', deleteList);

// ============================================================================
// Item Routes
// ============================================================================

router.get('/lists/:listId/items', getArtTodoItems);
router.post('/lists/:listId/items', createArtTodoItem);
router.put('/items/:id', updateArtTodoItem);
router.delete('/items/:id', deleteArtTodoItem);
router.put('/items/:id/move', moveItem);

// ============================================================================
// Reference Routes
// ============================================================================

router.get('/items/:id/references', getItemReferences);
router.post('/items/:id/references', addItemReference);
router.get('/items/:id/reference-matrix', getItemReferenceMatrix);
router.delete('/references/:id', removeItemReference);

// ============================================================================
// Helper Routes (for reference selection)
// ============================================================================

router.get('/trainers', getUserTrainers);
router.get('/monsters', getUserMonsters);

export default router;
