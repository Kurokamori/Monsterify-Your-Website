const express = require('express');
const router = express.Router();
const { RewardGenerator } = require('../../utils/RewardGenerator');
const { RewardProcessor } = require('../../utils/RewardProcessor');
const { Trainer } = require('../../models/Trainer');
const { successResponse, errorResponse, validateGenerationParams, validateClaimParams } = require('../../api/rewards');
const pool = require('../../db');

// Reward generation endpoint
router.post('/generate', async (req, res) => {
  try {
    const { source, parameters } = req.body;

    // Check authentication
    if (!req.session.user) {
      return res.status(401).json(errorResponse('INSUFFICIENT_PERMISSION', 'Must be logged in to generate rewards'));
    }

    // Validate input parameters
    const validationError = validateGenerationParams(source, parameters);
    if (validationError) {
      return res.status(400).json(errorResponse('INVALID_INPUT', validationError));
    }

    // Initialize reward generator
    const generator = new RewardGenerator(req.app.locals.pool);

    // Generate rewards based on source
    let rewards;
    switch (source) {
      case 'game_corner':
        rewards = await generator.generateGameCornerRewards(parameters);
        break;
      case 'garden':
        rewards = await generator.generateGardenRewards(parameters);
        break;
      case 'farm':
        rewards = await generator.generateFarmRewards(parameters);
        break;
      case 'task':
        rewards = await generator.generateTaskRewards(parameters);
        break;
      case 'habit':
        rewards = await generator.generateHabitRewards(parameters);
        break;
      default:
        return res.status(400).json(errorResponse('INVALID_INPUT', 'Invalid reward source'));
    }

    // Store rewards in session for claiming
    req.session.pendingRewards = req.session.pendingRewards || {};
    req.session.pendingRewards[source] = rewards;

    return res.json(successResponse('Rewards generated successfully', {
      rewards,
      source
    }));

  } catch (error) {
    console.error('Error generating rewards:', error);
    return res.status(500).json(errorResponse('GENERATE_FAILED', 'Failed to generate rewards', error.message));
  }
});

// Source-specific parameters validation middleware
const validateSourceParams = (req, res, next) => {
  const { source, parameters } = req.body;

  switch (source) {
    case 'game_corner':
      if (!parameters.sessions || !parameters.minutes || parameters.productivity === undefined) {
        return res.status(400).json(errorResponse('INVALID_INPUT', 'Missing required game corner parameters'));
      }
      break;

    case 'garden':
      if (!parameters.gardenPoints) {
        return res.status(400).json(errorResponse('INVALID_INPUT', 'Missing garden points parameter'));
      }
      break;

    case 'farm':
      if (!parameters.farmingPoints) {
        return res.status(400).json(errorResponse('INVALID_INPUT', 'Missing farming points parameter'));
      }
      break;

    case 'task':
    case 'habit':
      if (!parameters.difficulty || !parameters.completion) {
        return res.status(400).json(errorResponse('INVALID_INPUT', 'Missing task/habit parameters'));
      }
      break;

    default:
      return res.status(400).json(errorResponse('INVALID_INPUT', 'Invalid reward source'));
  }

  next();
};

// Add validation middleware
router.use('/generate', validateSourceParams);

// Source-specific reward calculation functions
const calculateGameCornerRewards = (parameters) => {
  const { sessions, minutes, productivity } = parameters;
  
  // Base rewards
  const baseCoins = 50;
  const sessionFactor = sessions;
  const timeFactor = Math.ceil(minutes / 15); // Additional coins per 15 minutes
  const productivityMultiplier = productivity / 100;

  return {
    coins: Math.round(baseCoins * (sessionFactor + timeFactor) * productivityMultiplier),
    levelChance: productivity >= 50 ? Math.min(Math.floor(productivity / 20), 5) : 0,
    itemChance: Math.min(Math.floor(minutes / 25), 5),
    monsterChance: productivity >= 80 ? Math.min(Math.floor(productivity / 20), 5) : 0
  };
};

const calculateGardenRewards = (parameters) => {
  const { gardenPoints } = parameters;

  return {
    coins: gardenPoints * 50,
    berryChance: gardenPoints * 0.25,
    monsterChance: gardenPoints * 0.15
  };
};

const calculateFarmRewards = (parameters) => {
  const { farmingPoints } = parameters;

  return {
    coins: farmingPoints * 75,
    itemChance: farmingPoints * 0.3,
    monsterChance: farmingPoints * 0.1
  };
};

const calculateTaskRewards = (parameters) => {
  const { difficulty, completion } = parameters;

  return {
    coins: difficulty * completion * 25,
    levelChance: completion >= 0.8 ? 0.5 : 0,
    itemChance: completion >= 0.5 ? 0.3 : 0
  };
};

// Single reward claim endpoint
router.post('/claim', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.user) {
      return res.status(401).json(errorResponse('INSUFFICIENT_PERMISSION', 'You must be logged in to claim rewards'));
    }

    const { rewardId, trainerId } = req.body;

    // Validate parameters
    const validationError = validateClaimParams(rewardId, trainerId);
    if (validationError) {
      return res.status(400).json(errorResponse('INVALID_INPUT', validationError));
    }

    // Get the trainer
    const trainer = await Trainer.getById(trainerId);
    if (!trainer) {
      return res.status(404).json(errorResponse('TRAINER_NOT_FOUND', 'Trainer not found'));
    }

    // Verify trainer ownership
    if (trainer.player_user_id !== req.session.user.discord_id) {
      return res.status(403).json(errorResponse('INSUFFICIENT_PERMISSION', 'You do not own this trainer'));
    }

    // Find the reward in session
    const pendingRewards = req.session.pendingRewards || {};
    let reward = null;
    let rewardSource = null;

    // Search through all sources for the reward
    for (const [source, rewards] of Object.entries(pendingRewards)) {
      const found = rewards.find(r => r.id === rewardId);
      if (found) {
        reward = found;
        rewardSource = source;
        break;
      }
    }

    if (!reward) {
      return res.status(404).json(errorResponse('REWARD_NOT_FOUND', 'Reward not found'));
    }

    // Check if reward is already claimed
    if (reward.claimed) {
      return res.status(400).json(errorResponse('ALREADY_CLAIMED', 'Reward has already been claimed'));
    }

    // Process the reward claim using RewardProcessor
    const processor = new RewardProcessor(pool);
    const result = await processor.claimReward(reward, trainerId, rewardSource);

    if (!result.success) {
      return res.status(400).json(errorResponse('CLAIM_FAILED', result.message));
    }

    // Mark the reward as claimed in session
    const rewardIndex = pendingRewards[rewardSource].findIndex(r => r.id === rewardId);
    if (rewardIndex !== -1) {
      pendingRewards[rewardSource][rewardIndex].claimed = true;
      pendingRewards[rewardSource][rewardIndex].assignedTo = {
        id: trainer.id,
        name: trainer.name
      };
      req.session.pendingRewards = pendingRewards;
    }

    // Return success response with claim details
    return res.json(successResponse({
      message: result.message,
      claimed: {
        trainerId: trainer.id,
        trainerName: trainer.name,
        type: reward.type,
        details: result.details,
        source: rewardSource
      }
    }));

  } catch (error) {
    console.error('Error claiming reward:', error);
    return res.status(500).json(errorResponse('CLAIM_FAILED', 'Error claiming reward: ' + error.message));
  }
});

module.exports = router;