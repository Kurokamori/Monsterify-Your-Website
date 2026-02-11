const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submissionController');
const { authenticateJWT } = require('../middleware/auth');
const { optionalAuth } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public routes
// Get art gallery submissions
router.get('/gallery', submissionController.getArtGallery);

// Get writing library submissions (optionalAuth so we can filter empty books by owner)
router.get('/library', optionalAuth, submissionController.getWritingLibrary);

// Get submission tags
router.get('/tags', submissionController.getSubmissionTags);

// Book routes (must be before /:id to avoid matching)
// Get user's books
router.get('/user/books', authenticateJWT, submissionController.getUserBooks);

// Get user's own submissions (must be before /:id to avoid matching)
router.get('/user/my-submissions', authenticateJWT, submissionController.getMySubmissions);

// Get chapters for a book
router.get('/books/:bookId/chapters', submissionController.getBookChapters);

// Update chapter order in a book
router.put('/books/:bookId/chapters/order', authenticateJWT, submissionController.updateChapterOrder);

// Create a new book
router.post('/books', authenticateJWT, upload.single('coverImage'), submissionController.createBook);

// Book collaborator routes
// Get user's collaborations (books they collaborate on but don't own)
router.get('/user/collaborations', authenticateJWT, submissionController.getUserCollaborations);

// Get collaborators for a book
router.get('/books/:bookId/collaborators', submissionController.getBookCollaborators);

// Search users to add as collaborators
router.get('/books/:bookId/collaborators/search', authenticateJWT, submissionController.searchCollaboratorUsers);

// Add a collaborator to a book
router.post('/books/:bookId/collaborators', authenticateJWT, submissionController.addBookCollaborator);

// Update a collaborator's role
router.put('/books/:bookId/collaborators/:userId', authenticateJWT, submissionController.updateCollaboratorRole);

// Remove a collaborator from a book
router.delete('/books/:bookId/collaborators/:userId', authenticateJWT, submissionController.removeBookCollaborator);

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

// Submit combined prompt (art or writing + prompt)
router.post('/prompt/combined', authenticateJWT, upload.single('image'), submissionController.submitPromptCombined);

// Claim prompt rewards
router.post('/prompt/:id/claim-rewards', authenticateJWT, submissionController.claimPromptRewards);

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

// Update a submission (title, description, tags, content for writing)
router.put('/:id', authenticateJWT, submissionController.updateSubmission);

// Delete a submission (soft delete)
router.delete('/:id', authenticateJWT, submissionController.deleteSubmission);

module.exports = router;
