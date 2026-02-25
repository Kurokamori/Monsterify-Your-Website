import { Router } from 'express';
import { authenticate, optionalAuth, requireAdmin } from '../../middleware/auth.middleware';
import { upload } from '../../middleware/upload.middleware';
import {
  // Admin
  getAdminSubmissions,
  // Gallery / Browse
  getArtGallery,
  getWritingLibrary,
  getSubmissionTags,
  getSubmissionById,
  getMySubmissions,
  // Reward Info
  getGiftItems,
  getSubmissionRewards,
  getAvailablePrompts,
  getLevelBreakdown,
  // Reward Calculation
  calculateArtRewards,
  calculateWritingRewards,
  calculateReferenceRewards,
  calculatePromptRewards,
  // Submission Creation
  submitArt,
  submitWriting,
  submitReference,
  submitPrompt,
  submitPromptCombined,
  // Reward Allocation
  allocateGiftLevels,
  allocateGiftCoins,
  allocateCappedLevels,
  allocateGiftItem,
  claimPromptRewards,
  generateGiftItems,
  generateGiftMonsters,
  finalizeGiftRewards,
  // Rerolls / Claims
  rerollSubmissionItems,
  rerollSubmissionMonsters,
  claimSubmissionMonster,
  // Books / Chapters
  getUserBooks,
  getBookChapters,
  updateChapterOrder,
  createBook,
  // Submission Management
  editParticipants,
  updateSubmission,
  deleteSubmission,
  // Collaborators
  getBookCollaborators,
  addBookCollaborator,
  removeBookCollaborator,
  updateCollaboratorRole,
  getUserCollaborations,
  searchCollaboratorUsers,
  // External Submissions
  calculateExternalArtRewards,
  calculateExternalWritingRewards,
  submitExternalArt,
  submitExternalWriting,
  allocateExternalLevels,
} from '../../controllers/misc/submission.controller';

const router = Router();

// =============================================================================
// Public Routes
// =============================================================================

router.get('/gallery', getArtGallery);
router.get('/library', optionalAuth, getWritingLibrary);
router.get('/tags', getSubmissionTags);

// Book routes (must be before /:id to avoid matching)
router.get('/user/books', authenticate, getUserBooks);
router.get('/user/my-submissions', authenticate, getMySubmissions);
router.get('/user/collaborations', authenticate, getUserCollaborations);

// Book chapter and collaborator routes
router.get('/books/:bookId/chapters', getBookChapters);
router.put('/books/:bookId/chapters/order', authenticate, updateChapterOrder);
router.post('/books', authenticate, upload.single('coverImage'), createBook);

// Collaborator routes
router.get('/books/:bookId/collaborators', getBookCollaborators);
router.get('/books/:bookId/collaborators/search', authenticate, searchCollaboratorUsers);
router.post('/books/:bookId/collaborators', authenticate, addBookCollaborator);
router.put('/books/:bookId/collaborators/:userId', authenticate, updateCollaboratorRole);
router.delete('/books/:bookId/collaborators/:userId', authenticate, removeBookCollaborator);

// Admin routes (before /:id to avoid matching)
router.get('/admin/list', authenticate, requireAdmin, getAdminSubmissions);

// Prompt routes (before /:id to avoid matching)
router.get('/prompt/available', authenticate, getAvailablePrompts);
router.post('/prompt/calculate', authenticate, calculatePromptRewards);
router.post('/prompt/submit', authenticate, upload.single('submissionFile'), submitPrompt);
router.post('/prompt/combined', authenticate, upload.single('image'), submitPromptCombined);
router.post('/prompt/:id/claim-rewards', authenticate, claimPromptRewards);

// External submission routes (must be before /:id to avoid matching)
router.post('/external/art/calculate', authenticate, calculateExternalArtRewards);
router.post('/external/writing/calculate', authenticate, calculateExternalWritingRewards);
router.post('/external/art', authenticate, upload.single('image'), submitExternalArt);
router.post('/external/writing', authenticate, upload.single('coverImage'), submitExternalWriting);
router.post('/external/allocate', authenticate, allocateExternalLevels);

// Public submission detail routes
router.get('/:id', getSubmissionById);
router.get('/:id/gift-items', getGiftItems);
router.get('/:id/rewards', getSubmissionRewards);
router.get('/:id/level-breakdown', getLevelBreakdown);

// =============================================================================
// Authenticated Routes
// =============================================================================

// Reward calculation
router.post('/art/calculate', authenticate, calculateArtRewards);
router.post('/writing/calculate', authenticate, calculateWritingRewards);
router.post('/reference/calculate', authenticate, calculateReferenceRewards);

// Submission creation
router.post('/art', authenticate, upload.single('image'), submitArt);
router.post('/writing', authenticate, upload.single('coverImage'), submitWriting);
router.post('/reference/submit', authenticate, upload.any(), submitReference);

// Gift reward allocation
router.post('/gift-levels/allocate', authenticate, allocateGiftLevels);
router.post('/gift-coins/allocate', authenticate, allocateGiftCoins);
router.post('/capped-levels/allocate', authenticate, allocateCappedLevels);
router.post('/gift-items/allocate', authenticate, allocateGiftItem);

// Gift reward generation
router.post('/gift-rewards/items', authenticate, generateGiftItems);
router.post('/gift-rewards/monsters', authenticate, generateGiftMonsters);
router.post('/gift-rewards/finalize', authenticate, finalizeGiftRewards);

// Reroll and claim
router.post('/:id/reroll-items', authenticate, rerollSubmissionItems);
router.post('/:id/reroll-monsters', authenticate, rerollSubmissionMonsters);
router.post('/:id/claim-monster', authenticate, claimSubmissionMonster);

// Edit participants
router.patch('/:id/edit-participants', authenticate, editParticipants);

// Submission management
router.put('/:id', authenticate, updateSubmission);
router.delete('/:id', authenticate, deleteSubmission);

export default router;
