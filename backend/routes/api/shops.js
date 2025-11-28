const express = require('express');
const router = express.Router();
const { protect, admin } = require('../../middleware/authMiddleware');
const {
  getShops,
  getActiveShops,
  getVisibleShops,
  getShopById,
  createShop,
  updateShop,
  deleteShop,
  getShopItems,
  addShopItem,
  updateShopItem,
  removeShopItem,
  stockShop,
  purchaseItem
} = require('../../controllers/shopController');

// Get all shops
router.get('/', getShops);

// Get all active shops
router.get('/active', getActiveShops);

// Get visible shops for user
router.get('/visible', protect, getVisibleShops);

// Get shop by ID
router.get('/:id', getShopById);

// Create a shop
router.post('/', protect, admin, createShop);

// Update a shop
router.put('/:id', protect, admin, updateShop);

// Delete a shop
router.delete('/:id', protect, admin, deleteShop);

// Get shop items
router.get('/:id/items', getShopItems);

// Add item to shop
router.post('/:id/items', protect, admin, addShopItem);

// Update shop item
router.put('/:shopId/items/:itemId', protect, admin, updateShopItem);

// Remove item from shop
router.delete('/:shopId/items/:itemId', protect, admin, removeShopItem);

// Stock shop with items
router.post('/:id/stock', protect, admin, stockShop);

// Purchase item from shop
router.post('/:shopId/purchase', protect, purchaseItem);

module.exports = router;
