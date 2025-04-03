const express = require('express');
const router = express.Router();
const Prompt = require('../../models/Prompt');
const PromptCompletion = require('../../models/PromptCompletion');
const PromptSubmissionService = require('../../utils/PromptSubmissionService');
const { ensureAuthenticatedApi } = require('../../middleware/auth');

/**
 * @route GET /api/prompt/categories/:category
 * @desc Get prompts by category
 * @access Private
 */
router.get('/categories/:category', ensureAuthenticatedApi, async (req, res) => {
  try {
    const { category } = req.params;
    const { activeOnly = 'true' } = req.query;
    
    const prompts = await Prompt.getByCategory(category, activeOnly === 'true');
    
    res.json({
      success: true,
      prompts
    });
  } catch (error) {
    console.error('Error getting prompts by category:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error getting prompts'
    });
  }
});

/**
 * @route GET /api/prompt/available/:trainerId/:category
 * @desc Get available prompts for a trainer by category
 * @access Private
 */
router.get('/available/:trainerId/:category', ensureAuthenticatedApi, async (req, res) => {
  try {
    const { trainerId, category } = req.params;
    
    const prompts = await Prompt.getAvailableForTrainer(trainerId, category);
    
    res.json({
      success: true,
      prompts
    });
  } catch (error) {
    console.error('Error getting available prompts for trainer:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error getting available prompts'
    });
  }
});

/**
 * @route GET /api/prompt/:promptId
 * @desc Get a prompt by ID
 * @access Private
 */
router.get('/:promptId', ensureAuthenticatedApi, async (req, res) => {
  try {
    const { promptId } = req.params;
    
    const prompt = await Prompt.getById(promptId);
    
    if (!prompt) {
      return res.status(404).json({
        success: false,
        message: 'Prompt not found'
      });
    }
    
    res.json({
      success: true,
      prompt
    });
  } catch (error) {
    console.error('Error getting prompt:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error getting prompt'
    });
  }
});

/**
 * @route POST /api/prompt/submit
 * @desc Submit a prompt completion
 * @access Private
 */
router.post('/submit', ensureAuthenticatedApi, async (req, res) => {
  try {
    const { promptId, trainerId, submissionUrl } = req.body;
    
    // Validate input
    if (!promptId || !trainerId || !submissionUrl) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters'
      });
    }
    
    // Submit prompt
    const result = await PromptSubmissionService.submitPrompt(
      {
        promptId,
        trainerId,
        submissionUrl
      },
      req.session.user.discord_id
    );
    
    res.json({
      success: true,
      message: 'Prompt submission successful',
      completion: result.completion,
      calculation: result.calculation
    });
  } catch (error) {
    console.error('Error submitting prompt:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error submitting prompt'
    });
  }
});

/**
 * @route GET /api/prompt/completions/trainer/:trainerId
 * @desc Get prompt completions for a trainer
 * @access Private
 */
router.get('/completions/trainer/:trainerId', ensureAuthenticatedApi, async (req, res) => {
  try {
    const { trainerId } = req.params;
    
    const completions = await PromptCompletion.getByTrainerId(trainerId);
    
    res.json({
      success: true,
      completions
    });
  } catch (error) {
    console.error('Error getting prompt completions for trainer:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error getting prompt completions'
    });
  }
});

/**
 * @route GET /api/prompt/completions/prompt/:promptId
 * @desc Get prompt completions for a prompt
 * @access Private
 */
router.get('/completions/prompt/:promptId', ensureAuthenticatedApi, async (req, res) => {
  try {
    const { promptId } = req.params;
    
    const completions = await PromptCompletion.getByPromptId(promptId);
    
    res.json({
      success: true,
      completions
    });
  } catch (error) {
    console.error('Error getting prompt completions for prompt:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error getting prompt completions'
    });
  }
});

/**
 * @route POST /api/prompt/create
 * @desc Create a new prompt
 * @access Private (Admin only)
 */
router.post('/create', ensureAuthenticatedApi, async (req, res) => {
  try {
    // Check if user is an admin
    if (!req.session.user.is_admin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Admin access required'
      });
    }
    
    const promptData = req.body;
    
    // Validate input
    if (!promptData.category || !promptData.title || !promptData.description) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters'
      });
    }
    
    // Create prompt
    const prompt = await Prompt.create(promptData);
    
    res.json({
      success: true,
      message: 'Prompt created successfully',
      prompt
    });
  } catch (error) {
    console.error('Error creating prompt:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating prompt'
    });
  }
});

/**
 * @route PUT /api/prompt/:promptId
 * @desc Update a prompt
 * @access Private (Admin only)
 */
router.put('/:promptId', ensureAuthenticatedApi, async (req, res) => {
  try {
    // Check if user is an admin
    if (!req.session.user.is_admin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Admin access required'
      });
    }
    
    const { promptId } = req.params;
    const promptData = req.body;
    
    // Update prompt
    const prompt = await Prompt.update(promptId, promptData);
    
    if (!prompt) {
      return res.status(404).json({
        success: false,
        message: 'Prompt not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Prompt updated successfully',
      prompt
    });
  } catch (error) {
    console.error('Error updating prompt:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating prompt'
    });
  }
});

/**
 * @route DELETE /api/prompt/:promptId
 * @desc Delete a prompt
 * @access Private (Admin only)
 */
router.delete('/:promptId', ensureAuthenticatedApi, async (req, res) => {
  try {
    // Check if user is an admin
    if (!req.session.user.is_admin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Admin access required'
      });
    }
    
    const { promptId } = req.params;
    
    // Delete prompt
    const success = await Prompt.delete(promptId);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Prompt not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Prompt deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting prompt:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting prompt'
    });
  }
});

module.exports = router;
