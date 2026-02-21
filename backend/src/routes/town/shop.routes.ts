import { Router } from 'express';
import { authenticate, authenticateAny, requireAdmin } from '@middleware/auth.middleware';
import {
  getShops,
  getActiveShops,
  getVisibleShops,
  getShopById,
  createShop,
  updateShop as updateShopHandler,
  deleteShop as deleteShopHandler,
  getShopItems,
  addShopItem,
  updateShopItem,
  removeShopItem,
  stockShop,
  purchaseItem,
} from '@controllers/town/shop.controller';

const router = Router();

// ============================================================================
// Public Routes
// ============================================================================

router.get('/', getShops);
router.get('/active', getActiveShops);
router.get('/visible', authenticateAny, getVisibleShops);
router.get('/:id', getShopById);
router.get('/:id/items', getShopItems);
router.post('/:shopId/purchase', authenticateAny, purchaseItem);

// ============================================================================
// Admin Routes - Shop CRUD
// ============================================================================

router.post('/', authenticate, requireAdmin, createShop);
router.put('/:id', authenticate, requireAdmin, updateShopHandler);
router.delete('/:id', authenticate, requireAdmin, deleteShopHandler);

// ============================================================================
// Admin Routes - Shop Item Management
// ============================================================================

router.post('/:id/items', authenticate, requireAdmin, addShopItem);
router.put('/:shopId/items/:itemId', authenticate, requireAdmin, updateShopItem);
router.delete('/:shopId/items/:itemId', authenticate, requireAdmin, removeShopItem);
router.post('/:id/stock', authenticate, requireAdmin, stockShop);

export default router;
