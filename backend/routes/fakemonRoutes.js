const express = require('express');
const router = express.Router();
const {
  getAllFakemon,
  getFakemonByNumber,
  getEvolutionChain,
  getAllTypes,
  getRandomFakemon,
  createFakemon,
  updateFakemon,
  deleteFakemon,
  getNextFakemonNumber
} = require('../controllers/fakemonController');
const { protect, admin } = require('../middleware/authMiddleware');

// Routes for /api/fakedex

// Public routes
// Get all fakemon with pagination, filtering, and search
router.get('/', getAllFakemon);

// Get all fakemon types
router.get('/types', getAllTypes);

// Get random fakemon
router.get('/random', getRandomFakemon);

// Get fakemon by number
router.get('/:number', getFakemonByNumber);

// Get evolution chain for a fakemon
router.get('/:number/evolution', getEvolutionChain);

// Admin routes - protected by authentication and admin middleware
// Get next available fakemon number
router.get('/admin/next-number', protect, admin, getNextFakemonNumber);

// Create a new fakemon
router.post('/admin', protect, admin, createFakemon);

// Update an existing fakemon
router.put('/admin/:number', protect, admin, updateFakemon);

// Delete a fakemon
router.delete('/admin/:number', protect, admin, deleteFakemon);

module.exports = router;
