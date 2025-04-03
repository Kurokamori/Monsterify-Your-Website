const express = require('express');
const router = express.Router();
const pool = require('../../db');
const AdventureParticipant = require('../../models/AdventureParticipant');
const Trainer = require('../../models/Trainer');
const Monster = require('../../models/Monster');

/**
 * @route GET /api/adventure-rewards/unclaimed
 * @desc Get unclaimed rewards for the current user
 * @access Private
 */
router.get('/unclaimed', async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const userId = req.session.user.discord_id;

    // Get all adventure participants for this user
    const query = `
      SELECT ap.*, a.thread_id, a.status, ar.name as area_name
      FROM adventure_participants ap
      JOIN adventures a ON ap.adventure_id = a.adventure_id
      LEFT JOIN areas ar ON a.area_id = ar.area_id
      WHERE ap.user_id = $1 AND a.status = 'completed'
      ORDER BY ap.created_at DESC
    `;

    const result = await pool.query(query, [userId]);
    const rewards = result.rows;

    res.json({
      success: true,
      rewards
    });
  } catch (error) {
    console.error('Error getting unclaimed rewards:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error getting unclaimed rewards'
    });
  }
});

/**
 * @route POST /api/adventure-rewards/claim
 * @desc Claim rewards for a participant
 * @access Private
 */
router.post('/claim', async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const userId = req.session.user.discord_id;
    const { participantId, distributions } = req.body;

    // Validate input
    if (!participantId) {
      return res.status(400).json({
        success: false,
        message: 'Participant ID is required'
      });
    }

    if (!distributions || !Array.isArray(distributions) || distributions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Distributions are required'
      });
    }

    // Get the participant
    const participantQuery = 'SELECT * FROM adventure_participants WHERE participant_id = $1';
    const participantResult = await pool.query(participantQuery, [participantId]);
    const participant = participantResult.rows[0];

    // Check if participant exists
    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found'
      });
    }

    // Check if participant belongs to the current user
    if (participant.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only claim your own rewards'
      });
    }

    // Check if total levels in distributions match participant's levels_earned
    const totalLevels = distributions.reduce((sum, dist) => sum + dist.levels, 0);
    if (totalLevels > participant.levels_earned) {
      return res.status(400).json({
        success: false,
        message: `Total levels (${totalLevels}) exceed available levels (${participant.levels_earned})`
      });
    }

    // Process each distribution
    const results = [];
    for (const dist of distributions) {
      const { type, id, levels } = dist;

      if (type === 'trainer') {
        // Add levels to trainer
        const trainerQuery = 'SELECT * FROM trainers WHERE trainer_id = $1';
        const trainerResult = await pool.query(trainerQuery, [id]);
        const trainer = trainerResult.rows[0];

        if (!trainer) {
          return res.status(404).json({
            success: false,
            message: `Trainer with ID ${id} not found`
          });
        }

        // Check if trainer belongs to the user
        if (trainer.discord_id !== userId) {
          return res.status(403).json({
            success: false,
            message: `You can only assign levels to your own trainers`
          });
        }

        // Add levels to trainer
        const newLevel = trainer.level + levels;
        const updateQuery = 'UPDATE trainers SET level = $1 WHERE trainer_id = $2 RETURNING *';
        const updateResult = await pool.query(updateQuery, [newLevel, id]);
        const updatedTrainer = updateResult.rows[0];

        results.push({
          type: 'trainer',
          id,
          name: trainer.name,
          oldLevel: trainer.level,
          newLevel: updatedTrainer.level,
          levelsAdded: levels
        });
      } else if (type === 'monster') {
        // Add levels to monster
        const monsterQuery = 'SELECT m.*, t.discord_id FROM monsters m JOIN trainers t ON m.trainer_id = t.trainer_id WHERE m.monster_id = $1';
        const monsterResult = await pool.query(monsterQuery, [id]);
        const monster = monsterResult.rows[0];

        if (!monster) {
          return res.status(404).json({
            success: false,
            message: `Monster with ID ${id} not found`
          });
        }

        // Check if monster belongs to the user
        if (monster.discord_id !== userId) {
          return res.status(403).json({
            success: false,
            message: `You can only assign levels to your own monsters`
          });
        }

        // Calculate new level, respecting the level 100 cap
        let levelsToAdd = levels;
        let coinsToAdd = 0;
        let newLevel = monster.level + levelsToAdd;

        // If new level would exceed 100, convert excess levels to coins (25 coins per level)
        if (newLevel > 100) {
          const excessLevels = newLevel - 100;
          levelsToAdd = levels - excessLevels;
          coinsToAdd = excessLevels * 25;
          newLevel = 100;
        }

        // Update monster level
        const updateMonsterQuery = 'UPDATE monsters SET level = $1 WHERE monster_id = $2 RETURNING *';
        const updateMonsterResult = await pool.query(updateMonsterQuery, [newLevel, id]);
        const updatedMonster = updateMonsterResult.rows[0];

        // Add coins to trainer if there are excess levels
        if (coinsToAdd > 0) {
          const updateTrainerQuery = 'UPDATE trainers SET currency_amount = COALESCE(currency_amount, 0) + $1, total_earned_currency = COALESCE(total_earned_currency, 0) + $1 WHERE trainer_id = $2';
          await pool.query(updateTrainerQuery, [coinsToAdd, monster.trainer_id]);
        }

        results.push({
          type: 'monster',
          id,
          name: monster.name,
          oldLevel: monster.level,
          newLevel: updatedMonster.level,
          levelsAdded: levelsToAdd,
          excessLevelsConverted: levels - levelsToAdd,
          coinsAdded: coinsToAdd
        });
      }
    }

    // Add coins to the trainer
    const trainerQuery = 'SELECT * FROM trainers WHERE discord_id = $1';
    const trainerResult = await pool.query(trainerQuery, [userId]);
    const trainer = trainerResult.rows[0];

    if (trainer) {
      const updateTrainerQuery = 'UPDATE trainers SET currency_amount = COALESCE(currency_amount, 0) + $1, total_earned_currency = COALESCE(total_earned_currency, 0) + $1 WHERE trainer_id = $2';
      await pool.query(updateTrainerQuery, [participant.coins_earned, trainer.trainer_id]);

      results.push({
        type: 'coins',
        id: trainer.trainer_id,
        name: trainer.name,
        coinsAdded: participant.coins_earned
      });
    }

    // Mark the participant as claimed
    const updateParticipantQuery = 'UPDATE adventure_participants SET claimed = TRUE WHERE participant_id = $1';
    await pool.query(updateParticipantQuery, [participantId]);

    res.json({
      success: true,
      message: 'Rewards claimed successfully',
      results
    });
  } catch (error) {
    console.error('Error claiming rewards:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error claiming rewards'
    });
  }
});

module.exports = router;
