const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submissionController');
const { authenticateJWT } = require('../middleware/auth');
const upload = require('../middleware/uploadMiddleware');

// Public routes
// Get art gallery submissions
router.get('/gallery', submissionController.getArtGallery);

// Get writing library submissions
router.get('/library', submissionController.getWritingLibrary);

// Get submission tags
router.get('/tags', submissionController.getSubmissionTags);

// Get submission by ID
router.get('/:id', submissionController.getSubmissionById);

// Get gift items for a submission
router.get('/:id/gift-items', submissionController.getGiftItems);

// Get gift and capped levels for a submission
router.get('/:id/rewards', submissionController.getSubmissionRewards);


// Protected routes - require authentication
// Calculate art rewards
router.post('/art/calculate', authenticateJWT, submissionController.calculateArtRewards);

// Calculate writing rewards
router.post('/writing/calculate', authenticateJWT, submissionController.calculateWritingRewards);

// Calculate reference rewards
router.post('/reference/calculate', authenticateJWT, submissionController.calculateReferenceRewards);

// Submit art
router.post('/art', authenticateJWT, upload.single('image'), submissionController.submitArt);

// Submit writing
router.post('/writing', authenticateJWT, upload.single('coverImage'), submissionController.submitWriting);

// Submit reference
router.post('/reference/submit', authenticateJWT, upload.any(), submissionController.submitReference);

// Submit prompt
router.post('/prompt/submit', authenticateJWT, upload.single('submissionFile'), submissionController.submitPrompt);

// Get available prompts
router.get('/prompt/available', authenticateJWT, submissionController.getAvailablePrompts);

// Calculate prompt rewards
router.post('/prompt/calculate', authenticateJWT, submissionController.calculatePromptRewards);

// Allocate gift levels
router.post('/gift-levels/allocate', authenticateJWT, submissionController.allocateGiftLevels);

// Allocate gift coins
router.post('/gift-coins/allocate', authenticateJWT, submissionController.allocateGiftCoins);

// Allocate capped levels
router.post('/capped-levels/allocate', authenticateJWT, submissionController.allocateCappedLevels);

// Allocate gift item
router.post('/gift-items/allocate', authenticateJWT, submissionController.allocateGiftItem);

// Gift rewards endpoints
router.post('/gift-rewards/items', authenticateJWT, submissionController.generateGiftItems);
router.post('/gift-rewards/monsters', authenticateJWT, submissionController.generateGiftMonsters);
router.post('/gift-rewards/finalize', authenticateJWT, submissionController.finalizeGiftRewards);

// Reroll endpoints
router.post('/:id/reroll-items', authenticateJWT, submissionController.rerollSubmissionItems);
router.post('/:id/reroll-monsters', authenticateJWT, submissionController.rerollSubmissionMonsters);

// Claim endpoints
router.post('/:id/claim-monster', authenticateJWT, submissionController.claimSubmissionMonster);

module.exports = router;
