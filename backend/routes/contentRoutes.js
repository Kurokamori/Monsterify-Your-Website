const express = require('express');
const router = express.Router();
const {
  getCategories,
  getContent,
  saveContent,
  deleteContent,
  createDirectory
} = require('../controllers/contentController');
const { protect, admin } = require('../middleware/authMiddleware');

// All routes require admin privileges
router.use(protect);
router.use(admin);

// Get all content categories
router.get('/categories', getCategories);

// Get content for a specific file
router.get('/:category/:path(*)', getContent);

// Create or update content
router.post('/:category/:path(*)', saveContent);

// Delete content
router.delete('/:category/:path(*)', deleteContent);

// Create directory
router.post('/:category/directory/:path(*)', createDirectory);

module.exports = router;
