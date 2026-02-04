const express = require('express');
const router = express.Router();
const {
  getAllFakemon,
  getFakemonByNumber,
  getEvolutionChain,
  getAllTypes,
  getAllCategories,
  getNumbersByCategory,
  getRandomFakemon,
  searchFakemon,
  createFakemon,
  updateFakemon,
  deleteFakemon,
  getNextFakemonNumber,
  uploadImage,
  bulkCreateFakemon
} = require('../controllers/fakemonController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Routes for /api/fakedex

// Public routes
// Get all fakemon with pagination, filtering, and search
router.get('/', getAllFakemon);

// Get all fakemon types
router.get('/types', getAllTypes);

// Get all fakemon categories
router.get('/categories', getAllCategories);

// Get random fakemon
router.get('/random', getRandomFakemon);

// Search fakemon by name (for autocomplete)
router.get('/search', searchFakemon);

// Get fakemon by number
router.get('/:number', getFakemonByNumber);

// Get evolution chain for a fakemon
router.get('/:number/evolution', getEvolutionChain);

// Admin routes - protected by authentication and admin middleware
// Get next available fakemon number
router.get('/admin/next-number', protect, admin, getNextFakemonNumber);

// Get numbers used within a category
router.get('/admin/numbers-by-category', protect, admin, getNumbersByCategory);

// Upload fakemon image
router.post('/admin/upload', protect, admin, upload.single('image'), uploadImage);

// Bulk create fakemon
router.post('/admin/bulk', protect, admin, bulkCreateFakemon);

// Create a new fakemon
router.post('/admin', protect, admin, createFakemon);

// Update an existing fakemon
router.put('/admin/:number', protect, admin, updateFakemon);

// Delete a fakemon
router.delete('/admin/:number', protect, admin, deleteFakemon);

module.exports = router;
