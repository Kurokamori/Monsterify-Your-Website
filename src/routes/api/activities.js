const express = require('express');
const router = express.Router();
const LocationTaskPrompt = require('../../models/LocationTaskPrompt');

/**
 * @route GET /api/activities/:location/:activity/tasks
 * @desc Get tasks for a specific location and activity
 * @access Private
 */
router.get('/:location/:activity/tasks', async (req, res) => {
  try {
    const { location, activity } = req.params;
    
    // Get all task prompts for the location
    const prompts = await LocationTaskPrompt.getAllForLocation(location);
    
    // Format the prompts as tasks
    const tasks = prompts.map(prompt => ({
      id: prompt.prompt_id,
      description: prompt.prompt_text,
      difficulty: prompt.difficulty,
      location: prompt.location
    }));
    
    res.json({
      success: true,
      tasks
    });
  } catch (error) {
    console.error(`Error getting tasks for ${req.params.location}/${req.params.activity}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error getting tasks',
      error: error.message
    });
  }
});

module.exports = router;
