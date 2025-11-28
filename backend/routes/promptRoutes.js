const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
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
  getPromptStatistics
} = require('../controllers/promptController');

const ImmediateRewardService = require('../services/immediateRewardService');

// =====================================================
// PUBLIC ROUTES
// =====================================================

/**
 * @route GET /api/prompts
 * @desc Get all prompts with filtering and pagination
 * @access Public
 * @params {string} type - Filter by prompt type (general, monthly, progress, event)
 * @params {string} category - Filter by category
 * @params {string} difficulty - Filter by difficulty
 * @params {boolean} active_only - Show only active prompts
 * @params {boolean} available_only - Show only currently available prompts
 * @params {number} trainer_id - Check availability for specific trainer
 * @params {number} page - Page number for pagination
 * @params {number} limit - Items per page
 */
router.get('/', getAllPrompts);

/**
 * @route GET /api/prompts/:id
 * @desc Get prompt by ID
 * @access Public
 */
router.get('/:id', getPromptById);

/**
 * @route GET /api/prompts/monthly/current
 * @desc Get monthly prompts for current month
 * @access Public
 * @params {number} month - Specific month (1-12)
 * @params {number} year - Specific year
 */
router.get('/monthly/current', getMonthlyPrompts);

/**
 * @route GET /api/prompts/events/active
 * @desc Get currently active event prompts
 * @access Public
 */
router.get('/events/active', getEventPrompts);

/**
 * @route GET /api/prompts/:id/availability/:trainerId
 * @desc Check if a prompt is available for a specific trainer
 * @access Public
 */
router.get('/:id/availability/:trainerId', checkPromptAvailability);

/**
 * @route GET /api/prompts/available/:trainerId
 * @desc Get all available prompts for a trainer
 * @access Public
 * @params {string} category - Filter by category
 * @params {string} type - Filter by type
 */
router.get('/available/:trainerId', getAvailablePrompts);

// =====================================================
// PROTECTED ROUTES (Authenticated Users)
// =====================================================

/**
 * @route POST /api/prompts/:id/submit
 * @desc Submit to a prompt
 * @access Protected
 * @body {number} trainer_id - Trainer ID
 * @body {number} monster_id - Monster ID (optional)
 * @body {string} submission_content - Submission content
 * @body {string} submission_notes - Additional notes
 */
router.post('/:id/submit', protect, submitToPrompt);

/**
 * @route GET /api/prompts/progress/:trainerId
 * @desc Get trainer's prompt progress
 * @access Protected
 * @params {string} type - Filter by prompt type
 * @params {boolean} completed_only - Show only completed prompts
 */
router.get('/progress/:trainerId', protect, getTrainerProgress);

/**
 * @route POST /api/prompts/reroll-monster
 * @desc Reroll a monster using Forget-Me-Not berry
 * @access Protected
 * @body {number} trainer_id - Trainer ID
 * @body {number} monster_id - Monster ID to reroll
 * @body {object} original_params - Original roll parameters
 */
router.post('/reroll-monster', protect, async (req, res) => {
  try {
    const { trainer_id, monster_id, original_params } = req.body;

    if (!trainer_id || !monster_id) {
      return res.status(400).json({
        success: false,
        message: 'Trainer ID and Monster ID are required'
      });
    }

    const result = await ImmediateRewardService.rerollMonsterWithForgetMeNot(
      trainer_id,
      monster_id,
      original_params || {}
    );

    res.json({
      success: true,
      ...result,
      message: 'Monster rerolled successfully'
    });
  } catch (error) {
    console.error('Error rerolling monster:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reroll monster'
    });
  }
});

// =====================================================
// ADMIN ROUTES (Admin Only)
// =====================================================

/**
 * @route POST /api/prompts
 * @desc Create new prompt
 * @access Protected (Admin)
 * @body {string} title - Prompt title
 * @body {string} description - Prompt description
 * @body {string} prompt_text - Actual prompt content
 * @body {string} type - Prompt type (general, monthly, progress, event)
 * @body {string} category - Prompt category
 * @body {string} difficulty - Difficulty level
 * @body {object} rewards - Reward configuration
 * @body {object} requirements - Requirements object
 * @body {array} tags - Tags array
 * @body {boolean} is_active - Active status
 * @body {number} priority - Priority level
 * @body {number} max_submissions - Maximum submissions allowed
 * @body {number} max_submissions_per_trainer - Max submissions per trainer
 * @body {boolean} requires_approval - Requires approval flag
 * @body {string} active_months - Active months for monthly prompts
 * @body {string} start_date - Start date for event prompts
 * @body {string} end_date - End date for event prompts
 * @body {string} event_name - Event name
 * @body {string} target_type - Target type (trainer, monster, both)
 * @body {number} min_trainer_level - Minimum trainer level
 * @body {number} max_trainer_level - Maximum trainer level
 * @body {array} required_factions - Required faction IDs
 * @body {object} bonus_rewards - Bonus reward configuration
 * @body {string} image_url - Optional prompt image
 */
router.post('/', protect, admin, createPrompt);

/**
 * @route PUT /api/prompts/:id
 * @desc Update prompt
 * @access Protected (Admin)
 * @body Same as create prompt
 */
router.put('/:id', protect, admin, updatePrompt);

/**
 * @route DELETE /api/prompts/:id
 * @desc Delete prompt
 * @access Protected (Admin)
 */
router.delete('/:id', protect, admin, deletePrompt);

/**
 * @route PUT /api/prompts/submissions/:submissionId/review
 * @desc Review prompt submission
 * @access Protected (Admin)
 * @body {string} status - Review status (approved, rejected, under_review)
 * @body {string} review_notes - Review notes
 * @body {number} quality_score - Quality score (1-10)
 * @body {boolean} bonus_applied - Whether bonus was applied
 */
router.put('/submissions/:submissionId/review', protect, admin, reviewSubmission);

/**
 * @route GET /api/prompts/:id/statistics
 * @desc Get prompt statistics
 * @access Protected (Admin)
 * @params {string} start_date - Start date for statistics
 * @params {string} end_date - End date for statistics
 */
router.get('/:id/statistics', protect, admin, getPromptStatistics);

// =====================================================
// CATEGORY AND TAG ROUTES
// =====================================================

/**
 * @route GET /api/prompts/meta/categories
 * @desc Get all prompt categories
 * @access Public
 */
router.get('/meta/categories', async (req, res) => {
  try {
    const Prompt = require('../models/Prompt');
    const categories = await Prompt.getCategories();
    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get categories',
      error: error.message
    });
  }
});

/**
 * @route GET /api/prompts/meta/difficulties
 * @desc Get available difficulty levels
 * @access Public
 */
router.get('/meta/difficulties', (req, res) => {
  res.json({
    success: true,
    difficulties: [
      { value: 'easy', label: 'Easy', description: 'Simple prompts suitable for beginners' },
      { value: 'medium', label: 'Medium', description: 'Standard difficulty prompts' },
      { value: 'hard', label: 'Hard', description: 'Challenging prompts requiring skill' },
      { value: 'expert', label: 'Expert', description: 'Advanced prompts for experienced users' }
    ]
  });
});

/**
 * @route GET /api/prompts/meta/types
 * @desc Get available prompt types
 * @access Public
 */
router.get('/meta/types', (req, res) => {
  res.json({
    success: true,
    types: [
      { 
        value: 'general', 
        label: 'General', 
        description: 'Standard prompts available anytime with no completion limit' 
      },
      { 
        value: 'monthly', 
        label: 'Monthly', 
        description: 'Special prompts available only during specific months' 
      },
      { 
        value: 'progress', 
        label: 'Progress', 
        description: 'One-time completion prompts that track trainer progress' 
      },
      { 
        value: 'event', 
        label: 'Event', 
        description: 'Time-limited prompts available during special events' 
      }
    ]
  });
});

// =====================================================
// SEARCH AND FILTER ROUTES
// =====================================================

/**
 * @route GET /api/prompts/search/:searchTerm
 * @desc Search prompts by title or description
 * @access Public
 * @params {string} type - Filter by type
 * @params {string} category - Filter by category
 * @params {boolean} active_only - Show only active prompts
 */
router.get('/search/:searchTerm', async (req, res) => {
  try {
    const { searchTerm } = req.params;
    const { type, category, active_only } = req.query;
    
    const Prompt = require('../models/Prompt');
    const prompts = await Prompt.search(searchTerm, {
      type,
      category,
      activeOnly: active_only === 'true'
    });

    res.json({
      success: true,
      prompts,
      searchTerm
    });
  } catch (error) {
    console.error('Error searching prompts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search prompts',
      error: error.message
    });
  }
});

module.exports = router;
