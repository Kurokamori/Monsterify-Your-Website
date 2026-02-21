import { Router } from 'express';
import { authenticate, requireAdmin } from '@middleware/auth.middleware';
import {
  getAllPrompts,
  getPromptById,
  createPrompt,
  updatePrompt,
  deletePrompt,
  getMonthlyPrompts,
  getEventPrompts,
  checkPromptAvailability,
  getAvailablePrompts,
  submitToPrompt,
  reviewSubmission,
  getTrainerProgress,
  getPromptStatistics,
  getPromptCategories,
  getPromptDifficulties,
  getPromptTypes,
  searchPrompts,
  rerollMonster,
} from '@controllers/api/prompt.controller';

const router = Router();

// =============================================================================
// Public Routes
// =============================================================================

// Get all prompts (with filtering/pagination)
router.get('/', getAllPrompts);

// Metadata routes (must be before /:id to avoid conflicts)
router.get('/meta/categories', getPromptCategories);
router.get('/meta/difficulties', getPromptDifficulties);
router.get('/meta/types', getPromptTypes);

// Monthly and event prompts (must be before /:id)
router.get('/monthly/current', getMonthlyPrompts);
router.get('/events/active', getEventPrompts);

// Search prompts (must be before /:id)
router.get('/search/:searchTerm', searchPrompts);

// Get available prompts for a trainer (must be before /:id)
router.get('/available/:trainerId', getAvailablePrompts);

// Get prompt by ID
router.get('/:id', getPromptById);

// Check prompt availability for a trainer
router.get('/:id/availability/:trainerId', checkPromptAvailability);

// =============================================================================
// Protected Routes
// =============================================================================

// Submit to a prompt
router.post('/:id/submit', authenticate, submitToPrompt);

// Get trainer's prompt progress
router.get('/progress/:trainerId', authenticate, getTrainerProgress);

// Reroll a monster using Forget-Me-Not berry
router.post('/reroll-monster', authenticate, rerollMonster);

// =============================================================================
// Admin Routes
// =============================================================================

// Create prompt
router.post('/', authenticate, requireAdmin, createPrompt);

// Update prompt
router.put('/:id', authenticate, requireAdmin, updatePrompt);

// Delete prompt
router.delete('/:id', authenticate, requireAdmin, deletePrompt);

// Review submission
router.put('/submissions/:submissionId/review', authenticate, requireAdmin, reviewSubmission);

// Get prompt statistics
router.get('/:id/statistics', authenticate, requireAdmin, getPromptStatistics);

export default router;
