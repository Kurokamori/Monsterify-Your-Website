const express = require('express');
const router = express.Router();
const { RewardGenerator } = require('../utils/RewardGenerator');
const { successResponse, errorResponse } = require('../api/rewards');
const pool = require('../db');

// Game Corner rewards endpoint
router.post('/rewards', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.user) {
      return res.status(401).json(errorResponse('INSUFFICIENT_PERMISSION', 'You must be logged in to generate rewards'));
    }

    const { sessions, minutes, productivity } = req.body;

    // Validate input parameters
    if (!sessions || !minutes || productivity === undefined) {
      return res.status(400).json(errorResponse('INVALID_INPUT', 'Missing required parameters'));
    }

    // Initialize reward generator
    const generator = new RewardGenerator(pool);

    // Generate rewards using the game corner source
    const rewards = await generator.generateGameCornerRewards({
      sessions,
      minutes,
      productivity
    });

    // Store rewards in session for claiming
    req.session.pendingRewards = {
      ...req.session.pendingRewards,
      game_corner: rewards
    };

    // Return success response with rewards
    return res.json(successResponse({
      message: 'Game Corner rewards generated successfully',
      rewards,
      source: 'game_corner'
    }));

  } catch (error) {
    console.error('Error generating Game Corner rewards:', error);
    return res.status(500).json(errorResponse('GENERATE_FAILED', 'Failed to generate rewards: ' + error.message));
  }
});

module.exports = router;