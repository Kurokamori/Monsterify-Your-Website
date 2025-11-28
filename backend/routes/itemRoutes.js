const express = require('express');
const router = express.Router();
const {
  getAllItems,
  getAllCategories,
  getAllTypes,
  getAllRarities,
  getItemById,
  createItem,
  createBulkItems,
  uploadImage,
  updateItem,
  deleteItem
} = require('../controllers/itemController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Routes for /api/items

// Public routes
router.get('/', getAllItems);
router.get('/categories', getAllCategories);
router.get('/types', getAllTypes);
router.get('/rarities', getAllRarities);
router.get('/:id', getItemById);

// Admin routes - protected by authentication and admin middleware
router.post('/', protect, admin, createItem);
router.post('/bulk', protect, admin, createBulkItems);
router.post('/upload', protect, admin, upload.single('image'), uploadImage);
router.put('/:id', protect, admin, updateItem);
router.delete('/:id', protect, admin, deleteItem);

module.exports = router;
