import { Router } from 'express';
import { authenticate } from '../../middleware';
import {
  getBookmarkCategories,
  getBookmarkCategoryById,
  createBookmarkCategory,
  updateBookmarkCategory,
  deleteBookmarkCategory,
  getBookmarkCategoryItems,
  addBookmarkItem,
  updateBookmarkItemPosition,
  bulkUpdateBookmarkPositions,
  removeBookmarkItem,
  addBookmarkNote,
  updateBookmarkNote,
  removeBookmarkNote,
} from '../../controllers';

const router = Router();

router.use(authenticate);

// =============================================================================
// Category Routes
// =============================================================================

router.get('/categories', getBookmarkCategories);
router.post('/categories', createBookmarkCategory);
router.get('/categories/:id', getBookmarkCategoryById);
router.put('/categories/:id', updateBookmarkCategory);
router.delete('/categories/:id', deleteBookmarkCategory);

// =============================================================================
// Item Routes
// =============================================================================

router.get('/categories/:categoryId/items', getBookmarkCategoryItems);
router.post('/categories/:categoryId/items', addBookmarkItem);
router.put('/items/:id/position', updateBookmarkItemPosition);
router.put('/items/positions', bulkUpdateBookmarkPositions);
router.delete('/items/:id', removeBookmarkItem);

// =============================================================================
// Note Routes
// =============================================================================

router.post('/categories/:categoryId/notes', addBookmarkNote);
router.put('/notes/:id', updateBookmarkNote);
router.delete('/notes/:id', removeBookmarkNote);

export default router;
