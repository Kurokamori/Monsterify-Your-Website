const express = require('express');
const router = express.Router();
const Trainer = require('../models/Trainer');
const Monster = require('../models/Monster');

/**
 * @route GET /writing
 * @desc Render the writing submission page
 * @access Private
 */
router.get('/', (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/login?error=' + encodeURIComponent('You must be logged in to submit writing'));
  }

  res.render('submit_writing', {
    title: 'Submit Writing'
  });
});

/**
 * @route GET /writing/trainers
 * @desc Get all trainers for the current user
 * @access Private
 */
router.get('/trainers', async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    // Get trainers for the current user
    const trainers = await Trainer.getByUserId(req.session.user.discord_id);

    res.json({
      success: true,
      trainers
    });
  } catch (error) {
    console.error('Error getting trainers:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error getting trainers'
    });
  }
});

/**
 * @route GET /writing/trainers/:trainerId/monsters
 * @desc Get all monsters for a trainer
 * @access Private
 */
router.get('/trainers/:trainerId/monsters', async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const trainerId = req.params.trainerId;

    // Get monsters for the trainer
    const monsters = await Monster.getByTrainerId(trainerId);

    res.json({
      success: true,
      monsters
    });
  } catch (error) {
    console.error('Error getting monsters:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error getting monsters'
    });
  }
});

/**
 * @route POST /writing/calculate
 * @desc Calculate rewards for a writing submission
 * @access Private
 */
router.post('/calculate', async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const { writingType, wordCount, difficultyModifier, participants } = req.body;

    // Validate input
    if (!writingType || !wordCount || difficultyModifier === undefined || !participants || !participants.length) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters'
      });
    }

    // Calculate rewards
    const calculation = calculateRewards({
      writingType,
      wordCount,
      difficultyModifier,
      participants
    });

    res.json({
      success: true,
      calculation
    });
  } catch (error) {
    console.error('Error calculating writing rewards:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error calculating writing rewards'
    });
  }
});

/**
 * @route POST /writing/submit
 * @desc Submit a writing submission and apply rewards
 * @access Private
 */
router.post('/submit', async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const {
      writingType,
      title,
      writingUrl,
      wordCount,
      difficultyModifier,
      notes,
      participants
    } = req.body;

    // Validate input
    if (!writingType || !title || !writingUrl || !wordCount || difficultyModifier === undefined || !participants || !participants.length) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters'
      });
    }

    // Calculate rewards
    const calculation = calculateRewards({
      writingType,
      wordCount,
      difficultyModifier,
      participants
    });

    // Apply rewards to each participant
    for (const reward of calculation.participantRewards) {
      const { trainerId, monsterId, levels, coins } = reward;

      // Add coins to trainer
      await Trainer.addCoins(trainerId, coins);

      // Add levels to trainer or monster
      if (monsterId) {
        await Monster.addLevels(monsterId, levels);
      } else {
        await Trainer.addLevels(trainerId, levels);
      }
    }

    res.json({
      success: true,
      message: 'Writing submission successful',
      calculation
    });
  } catch (error) {
    console.error('Error submitting writing:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error submitting writing'
    });
  }
});

/**
 * Calculate rewards for a writing submission
 * @param {Object} data - Submission data
 * @param {string} data.writingType - Type of writing ('game' or 'other')
 * @param {number} data.wordCount - Word count
 * @param {number} data.difficultyModifier - Difficulty modifier (0-3)
 * @param {Array} data.participants - Array of participant objects
 * @returns {Object} - Calculation results
 */
async function calculateRewards(data) {
  const { writingType, wordCount, difficultyModifier, participants } = data;

  // Calculate base levels from word count (1 level per 50 words)
  let baseLevels = Math.floor(wordCount / 50);

  // Add difficulty modifier
  baseLevels += difficultyModifier;

  // Calculate total levels and coins
  const totalLevels = baseLevels;
  const totalCoins = wordCount; // 1 coin per word

  // Calculate rewards per participant
  const participantRewards = await calculateParticipantRewards(
    participants,
    totalLevels,
    totalCoins,
    writingType
  );

  return {
    wordCount,
    difficultyModifier,
    totalLevels,
    totalCoins,
    participantRewards
  };
}

/**
 * Calculate rewards for each participant
 * @param {Array} participants - Array of participant objects
 * @param {number} totalLevels - Total levels to distribute
 * @param {number} totalCoins - Total coins to distribute
 * @param {string} writingType - Type of writing ('game' or 'other')
 * @returns {Array} - Array of participant rewards
 */
async function calculateParticipantRewards(participants, totalLevels, totalCoins, writingType) {
  const participantRewards = [];
  const participantCount = participants.length;

  // For game writing, each participant gets full rewards
  // For other writing, rewards are split between participants
  const levelsPerParticipant = writingType === 'game' ? totalLevels : Math.floor(totalLevels / participantCount);
  const coinsPerParticipant = writingType === 'game' ? totalCoins : Math.floor(totalCoins / participantCount);

  // Create reward objects for each participant
  for (const participant of participants) {
    const { trainerId, monsterId } = participant;

    // Get trainer details
    let trainerName = `Trainer ${trainerId}`;
    try {
      const trainer = await Trainer.getById(trainerId);
      if (trainer) {
        trainerName = trainer.name;
      }
    } catch (error) {
      console.error(`Error getting trainer ${trainerId}:`, error);
    }

    // Get monster details if provided
    let monsterName = null;
    if (monsterId) {
      try {
        const monster = await Monster.getById(monsterId);
        if (monster) {
          monsterName = monster.name;
        }
      } catch (error) {
        console.error(`Error getting monster ${monsterId}:`, error);
      }
    }

    participantRewards.push({
      trainerId,
      trainerName,
      monsterId: monsterId || null,
      monsterName,
      levels: levelsPerParticipant,
      coins: coinsPerParticipant
    });
  }

  return participantRewards;
}

module.exports = router;
