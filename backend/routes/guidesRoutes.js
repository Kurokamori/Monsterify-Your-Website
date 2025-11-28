const express = require('express');
const router = express.Router();
const guidesController = require('../controllers/guidesController');

// Get all guide categories
router.get('/categories', guidesController.getCategories);

// Get content for a specific guide
router.get('/:category/:path(*)', guidesController.getGuideContent);

module.exports = router;
