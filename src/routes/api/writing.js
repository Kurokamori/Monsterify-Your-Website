const express = require('express');
const router = express.Router();
const WritingSubmissionService = require('../../utils/WritingSubmissionService');
const Trainer = require('../../models/Trainer');

/**
 * @route POST /api/writing/calculate
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
    const calculation = await WritingSubmissionService.calculateRewards({
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
 * @route POST /api/writing
 * @desc Submit a writing submission
 * @access Private
 */
router.post('/', async (req, res) => {
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
    if (!writingType || !title || !wordCount || difficultyModifier === undefined || !participants || !participants.length) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters'
      });
    }

    // For external writing, URL is required
    if (writingType === 'external' && !writingUrl) {
      return res.status(400).json({
        success: false,
        message: 'Writing URL is required for external writing submissions'
      });
    }

    // Submit writing
    const result = await WritingSubmissionService.submitWriting(
      {
        writingType,
        title,
        writingUrl,
        wordCount,
        difficultyModifier,
        notes,
        participants
      },
      req.session.user.discord_id
    );

    res.json({
      success: true,
      message: 'Writing submission successful',
      submission: result.submission,
      calculation: result.calculation
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
 * @route GET /api/writing/trainers
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

    // Get user's trainers
    const trainers = await Trainer.getByUserId(req.session.user.discord_id);

    res.json({
      success: true,
      trainers: trainers
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
 * @route GET /api/writing/trainers/:trainerId/monsters
 * @desc Get all monsters for a specific trainer
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

    // Verify trainer exists
    const trainer = await Trainer.getById(trainerId);
    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }

    // Verify trainer belongs to user
    if (trainer.player_user_id !== req.session.user.discord_id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this trainer\'s monsters'
      });
    }

    // Get trainer's monsters
    const Monster = require('../../models/Monster');
    const monsters = await Monster.getByTrainerId(trainerId);

    res.json({
      success: true,
      monsters: monsters
    });
  } catch (error) {
    console.error('Error getting trainer monsters:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error getting trainer monsters'
    });
  }
});

module.exports = router;
