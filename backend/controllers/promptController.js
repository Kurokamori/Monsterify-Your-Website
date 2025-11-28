const db = require('../config/db');
const Prompt = require('../models/Prompt');
const PromptSubmission = require('../models/PromptSubmission');
const ImmediateRewardService = require('../services/immediateRewardService');
const { isPostgreSQL } = require('../utils/dbUtils');

/**
 * Get all prompts with filtering and pagination
 * @route GET /api/prompts
 * @access Public
 */
const getAllPrompts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      category,
      difficulty,
      active_only = 'true',
      available_only = 'false',
      trainer_id
    } = req.query;

    const filters = {
      page: parseInt(page),
      limit: parseInt(limit),
      type,
      category,
      difficulty,
      activeOnly: active_only === 'true',
      availableOnly: available_only === 'true',
      trainerId: trainer_id ? parseInt(trainer_id) : null
    };

    const prompts = await Prompt.getAll(filters);

    res.json({
      success: true,
      prompts,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: prompts.length
      }
    });
  } catch (error) {
    console.error('Error getting prompts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get prompts',
      error: error.message
    });
  }
};

/**
 * Get prompt by ID
 * @route GET /api/prompts/:id
 * @access Public
 */
const getPromptById = async (req, res) => {
  try {
    const { id } = req.params;
    const prompt = await Prompt.getById(id);

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
      message: 'Failed to get prompt',
      error: error.message
    });
  }
};

/**
 * Create new prompt (Admin only)
 * @route POST /api/prompts
 * @access Protected (Admin)
 */
const createPrompt = async (req, res) => {
  try {
    const promptData = {
      ...req.body,
      created_by: req.user.id
    };

    // Validate required fields
    if (!promptData.title || !promptData.description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required'
      });
    }

    // Validate reward configuration
    if (promptData.rewards) {
      const rewardValidation = validateRewardConfig(promptData.rewards);
      if (!rewardValidation.valid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid reward configuration',
          errors: rewardValidation.errors
        });
      }
    }

    const prompt = await Prompt.create(promptData);

    res.status(201).json({
      success: true,
      prompt,
      message: 'Prompt created successfully'
    });
  } catch (error) {
    console.error('Error creating prompt:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create prompt',
      error: error.message
    });
  }
};

/**
 * Update prompt (Admin only)
 * @route PUT /api/prompts/:id
 * @access Protected (Admin)
 */
const updatePrompt = async (req, res) => {
  try {
    const { id } = req.params;
    const promptData = req.body;

    // Check if prompt exists
    const existingPrompt = await Prompt.getById(id);
    if (!existingPrompt) {
      return res.status(404).json({
        success: false,
        message: 'Prompt not found'
      });
    }

    // Validate reward configuration if provided
    if (promptData.rewards) {
      const rewardValidation = validateRewardConfig(promptData.rewards);
      if (!rewardValidation.valid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid reward configuration',
          errors: rewardValidation.errors
        });
      }
    }

    const updatedPrompt = await Prompt.update(id, promptData);

    res.json({
      success: true,
      prompt: updatedPrompt,
      message: 'Prompt updated successfully'
    });
  } catch (error) {
    console.error('Error updating prompt:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update prompt',
      error: error.message
    });
  }
};

/**
 * Delete prompt (Admin only)
 * @route DELETE /api/prompts/:id
 * @access Protected (Admin)
 */
const deletePrompt = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if prompt exists
    const existingPrompt = await Prompt.getById(id);
    if (!existingPrompt) {
      return res.status(404).json({
        success: false,
        message: 'Prompt not found'
      });
    }

    // Check if prompt has submissions
    const submissions = await PromptSubmission.getByPromptId(id);
    if (submissions.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete prompt with existing submissions'
      });
    }

    await Prompt.delete(id);

    res.json({
      success: true,
      message: 'Prompt deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting prompt:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete prompt',
      error: error.message
    });
  }
};

/**
 * Get monthly prompts for current or specified month
 * @route GET /api/prompts/monthly
 * @access Public
 */
const getMonthlyPrompts = async (req, res) => {
  try {
    const { month, year } = req.query;
    const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();

    const prompts = await Prompt.getMonthlyPrompts(targetMonth, targetYear);

    res.json({
      success: true,
      prompts,
      month: targetMonth,
      year: targetYear
    });
  } catch (error) {
    console.error('Error getting monthly prompts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get monthly prompts',
      error: error.message
    });
  }
};

/**
 * Get active event prompts
 * @route GET /api/prompts/events
 * @access Public
 */
const getEventPrompts = async (req, res) => {
  try {
    const prompts = await Prompt.getEventPrompts();

    res.json({
      success: true,
      prompts
    });
  } catch (error) {
    console.error('Error getting event prompts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get event prompts',
      error: error.message
    });
  }
};

/**
 * Check prompt availability for a trainer
 * @route GET /api/prompts/:id/availability/:trainerId
 * @access Public
 */
const checkPromptAvailability = async (req, res) => {
  try {
    const { id, trainerId } = req.params;

    const availability = await Prompt.checkAvailability(id, trainerId);

    res.json({
      success: true,
      ...availability
    });
  } catch (error) {
    console.error('Error checking prompt availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check prompt availability',
      error: error.message
    });
  }
};

/**
 * Get available prompts for a trainer
 * @route GET /api/prompts/available/:trainerId
 * @access Public
 */
const getAvailablePrompts = async (req, res) => {
  try {
    const { trainerId } = req.params;
    const { category, type } = req.query;

    const filters = {
      trainerId: parseInt(trainerId),
      category,
      type,
      availableOnly: true
    };

    const prompts = await Prompt.getAll(filters);

    res.json({
      success: true,
      prompts
    });
  } catch (error) {
    console.error('Error getting available prompts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get available prompts',
      error: error.message
    });
  }
};

/**
 * Validate reward configuration
 * @param {Object} rewards - Reward configuration object
 * @returns {Object} Validation result
 */
function validateRewardConfig(rewards) {
  const errors = [];

  // Allow null rewards (no rewards configured)
  if (rewards === null || rewards === undefined) {
    return { valid: true, errors: [] };
  }

  // Check if rewards is an object (and not an array)
  if (typeof rewards !== 'object' || Array.isArray(rewards)) {
    errors.push('Rewards must be an object');
    return { valid: false, errors };
  }

  // Validate levels
  if (rewards.levels !== undefined) {
    if (!Number.isInteger(rewards.levels) || rewards.levels < 0) {
      errors.push('Levels must be a non-negative integer');
    }
  }

  // Validate coins
  if (rewards.coins !== undefined) {
    if (!Number.isInteger(rewards.coins) || rewards.coins < 0) {
      errors.push('Coins must be a non-negative integer');
    }
  }

  // Validate items array
  if (rewards.items !== undefined) {
    if (!Array.isArray(rewards.items)) {
      errors.push('Items must be an array');
    } else {
      rewards.items.forEach((item, index) => {
        // Check if it's a random item configuration
        const isRandomFromCategory = item.is_random_from_category && item.category;
        const isRandomFromSet = item.is_random_from_set && item.random_set_items && item.random_set_items.length > 0;
        const isSpecificItem = item.item_id || item.item_name;
        
        // Must have either specific item, random from category, or random from set
        if (!isSpecificItem && !isRandomFromCategory && !isRandomFromSet) {
          errors.push(`Item ${index + 1} must have either item_id/item_name, a category for random selection, or a set of items for random selection`);
        }
        
        // Validate quantity
        if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
          errors.push(`Item ${index + 1} quantity must be a positive integer`);
        }
        
        // Validate chance (should be between 1 and 100)
        if (item.chance !== undefined && (!Number.isInteger(item.chance) || item.chance < 1 || item.chance > 100)) {
          errors.push(`Item ${index + 1} chance must be an integer between 1 and 100`);
        }
        
        // Validate random from category configuration
        if (item.is_random_from_category && !item.category) {
          errors.push(`Item ${index + 1} is set to random from category but no category is specified`);
        }
        
        // Validate random from set configuration
        if (item.is_random_from_set && (!item.random_set_items || item.random_set_items.length === 0)) {
          errors.push(`Item ${index + 1} is set to random from set but no items are specified in the set`);
        }
      });
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Submit to a prompt
 * @route POST /api/prompts/:id/submit
 * @access Protected
 */
const submitToPrompt = async (req, res) => {
  try {
    const { id } = req.params;
    const { trainer_id, monster_id, submission_content, submission_notes } = req.body;

    // Check if prompt exists and is available
    const prompt = await Prompt.getById(id);
    if (!prompt) {
      return res.status(404).json({
        success: false,
        message: 'Prompt not found'
      });
    }

    // Check availability for trainer
    const availability = await Prompt.checkAvailability(id, trainer_id);
    if (!availability.available) {
      return res.status(400).json({
        success: false,
        message: availability.reason || 'Prompt not available'
      });
    }

    // Create submission - all submissions are automatically approved
    const submissionData = {
      promptId: id,
      trainerId: trainer_id,
      monsterId: monster_id || null,
      submissionContent: submission_content,
      submissionNotes: submission_notes,
      status: 'approved' // All submissions are automatically approved
    };

    const submission = await PromptSubmission.create(submissionData);

    // Calculate and apply rewards immediately
    let appliedRewards = null;
    appliedRewards = await ImmediateRewardService.calculateAndApplyRewards(
      prompt,
      submission,
      7, // Default quality score
      false // No bonus
    );

    // Update submission with granted rewards
    await PromptSubmission.update(submission.id, {
      rewardsGranted: JSON.stringify(appliedRewards),
      approvedAt: new Date().toISOString()
    });

    // Update progress for progress-type prompts
    if (prompt.type === 'progress') {
      await updateTrainerProgress(trainer_id, id, { submitted: true });
    }

    res.status(201).json({
      success: true,
      submission: {
        ...submission,
        applied_rewards: appliedRewards
      },
      message: 'Submission approved and rewards applied!'
    });
  } catch (error) {
    console.error('Error submitting to prompt:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit to prompt',
      error: error.message
    });
  }
};

/**
 * Review prompt submission (Admin only)
 * @route PUT /api/prompts/submissions/:submissionId/review
 * @access Protected (Admin)
 */
const reviewSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { status, review_notes, quality_score, bonus_applied } = req.body;

    // Validate status
    if (!['approved', 'rejected', 'under_review'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    // Get submission details
    const submission = await PromptSubmission.getById(submissionId);
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Update submission
    const updateData = {
      status,
      reviewNotes: review_notes,
      qualityScore: quality_score,
      bonusApplied: bonus_applied || false,
      reviewedBy: req.user.id,
      reviewedAt: new Date().toISOString()
    };

    if (status === 'approved') {
      updateData.approvedAt = new Date().toISOString();
    }

    const updatedSubmission = await PromptSubmission.update(submissionId, updateData);

    // Calculate and distribute rewards if approved
    if (status === 'approved') {
      const prompt = await Prompt.getById(submission.prompt_id);
      const rewards = await ImmediateRewardService.calculateAndApplyRewards(
        prompt,
        submission,
        quality_score,
        bonus_applied
      );

      // Update submission with granted rewards
      await PromptSubmission.update(submissionId, {
        rewardsGranted: JSON.stringify(rewards)
      });

      // Mark progress as completed for progress prompts
      if (prompt.type === 'progress') {
        await updateTrainerProgress(submission.trainer_id, submission.prompt_id, {
          completed: true,
          completedAt: new Date().toISOString()
        });
      }

      // Return the rewards in the response for immediate display
      updatedSubmission.applied_rewards = rewards;
    }

    res.json({
      success: true,
      submission: updatedSubmission,
      message: 'Submission reviewed successfully'
    });
  } catch (error) {
    console.error('Error reviewing submission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to review submission',
      error: error.message
    });
  }
};

/**
 * Get trainer's prompt progress
 * @route GET /api/prompts/progress/:trainerId
 * @access Protected
 */
const getTrainerProgress = async (req, res) => {
  try {
    const { trainerId } = req.params;
    const { type, completed_only } = req.query;

    let query = `
      SELECT
        tpp.*,
        p.title as prompt_title,
        p.type as prompt_type,
        p.category as prompt_category,
        p.difficulty,
        COUNT(ps.id) as submission_count,
        COUNT(CASE WHEN ps.status = 'approved' THEN 1 END) as approved_count
      FROM trainer_prompt_progress tpp
      JOIN prompts p ON tpp.prompt_id = p.id
      LEFT JOIN prompt_submissions ps ON tpp.trainer_id = ps.trainer_id AND tpp.prompt_id = ps.prompt_id
      WHERE tpp.trainer_id = $1
    `;

    const params = [trainerId];

    if (type) {
      params.push(type);
      query += ` AND p.type = $${params.length}`;
    }

    if (completed_only === 'true') {
      query += ` AND tpp.is_completed = true`;
    }

    query += ` GROUP BY tpp.id, p.title, p.type, p.category, p.difficulty ORDER BY tpp.started_at DESC`;

    const progress = await db.asyncAll(query, params);

    res.json({
      success: true,
      progress
    });
  } catch (error) {
    console.error('Error getting trainer progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trainer progress',
      error: error.message
    });
  }
};

/**
 * Get prompt statistics (Admin only)
 * @route GET /api/prompts/:id/statistics
 * @access Protected (Admin)
 */
const getPromptStatistics = async (req, res) => {
  try {
    const { id } = req.params;
    const { start_date, end_date } = req.query;

    let query = `
      SELECT
        DATE(ps.submitted_at) as date,
        COUNT(*) as total_submissions,
        COUNT(CASE WHEN ps.status = 'approved' THEN 1 END) as approved_submissions,
        COUNT(CASE WHEN ps.status = 'rejected' THEN 1 END) as rejected_submissions,
        COUNT(CASE WHEN ps.status = 'pending' THEN 1 END) as pending_submissions,
        COUNT(DISTINCT ps.trainer_id) as unique_participants,
        AVG(ps.quality_score) as avg_quality_score
      FROM prompt_submissions ps
      WHERE ps.prompt_id = $1
    `;

    const params = [id];

    if (start_date) {
      params.push(start_date);
      query += ` AND ps.submitted_at >= $${params.length}`;
    }

    if (end_date) {
      params.push(end_date);
      query += ` AND ps.submitted_at <= $${params.length}`;
    }

    query += ` GROUP BY DATE(ps.submitted_at) ORDER BY date DESC`;

    const statistics = await db.asyncAll(query, params);

    // Get overall statistics
    const overallQuery = `
      SELECT
        COUNT(*) as total_submissions,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_submissions,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_submissions,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_submissions,
        COUNT(DISTINCT trainer_id) as unique_participants,
        AVG(quality_score) as avg_quality_score
      FROM prompt_submissions
      WHERE prompt_id = $1
    `;

    const overall = await db.asyncGet(overallQuery, [id]);

    res.json({
      success: true,
      statistics,
      overall
    });
  } catch (error) {
    console.error('Error getting prompt statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get prompt statistics',
      error: error.message
    });
  }
};

// Old reward functions removed - now using ImmediateRewardService

// Old reward distribution functions removed - now using ImmediateRewardService

/**
 * Update trainer progress for a prompt
 * @param {number} trainerId - Trainer ID
 * @param {number} promptId - Prompt ID
 * @param {Object} progressData - Progress update data
 */
async function updateTrainerProgress(trainerId, promptId, progressData) {
  try {
    const existingProgress = await db.asyncGet(
      'SELECT * FROM trainer_prompt_progress WHERE trainer_id = $1 AND prompt_id = $2',
      [trainerId, promptId]
    );

    if (existingProgress) {
      // Update existing progress
      const updateFields = [];
      const params = [];
      let paramIndex = 1;

      if (progressData.completed !== undefined) {
        updateFields.push(`is_completed = $${paramIndex++}`);
        params.push(progressData.completed);
      }

      if (progressData.completedAt) {
        updateFields.push(`completed_at = $${paramIndex++}`);
        params.push(progressData.completedAt);
      }

      if (progressData.progressData) {
        updateFields.push(`progress_data = $${paramIndex++}`);
        params.push(JSON.stringify(progressData.progressData));
      }

      if (updateFields.length > 0) {
        params.push(trainerId, promptId);
        await db.asyncRun(
          `UPDATE trainer_prompt_progress SET ${updateFields.join(', ')} WHERE trainer_id = $${paramIndex++} AND prompt_id = $${paramIndex++}`,
          params
        );
      }
    } else {
      // Create new progress entry
      await db.asyncRun(
        `INSERT INTO trainer_prompt_progress (trainer_id, prompt_id, is_completed, completed_at, progress_data)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          trainerId,
          promptId,
          progressData.completed || false,
          progressData.completedAt || null,
          progressData.progressData ? JSON.stringify(progressData.progressData) : null
        ]
      );
    }
  } catch (error) {
    console.error('Error updating trainer progress:', error);
    throw error;
  }
}

// Old helper functions removed - now using ImmediateRewardService

module.exports = {
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
};
