const express = require('express');
const router = express.Router();
const Trainer = require('../../models/Trainer');
const pool = require('../../db');
const LocationActivitySession = require('../../models/LocationActivitySession');
const RewardSystem = require('../../utils/RewardSystem');

/**
 * Claim all rewards at once
 */
router.post('/', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.user) {
      return res.status(401).json({ success: false, message: 'You must be logged in to claim rewards' });
    }

    console.log('\n\n==== CLAIM ALL REWARDS REQUEST ====');
    console.log('File: src/routes/api/claim-all-rewards.js');
    console.log('Route: POST /api/claim-all-rewards');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Session user:', req.session.user ? req.session.user.discord_id : 'No user in session');
    console.log('Session rewards:', req.session.rewards ? req.session.rewards.length : 'No rewards in session');
    console.log('Session keys:', Object.keys(req.session));

    const { rewards, trainerId = 'random', source = 'game_corner', sessionId } = req.body;

    if (!rewards || !Array.isArray(rewards) || rewards.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid rewards data' });
    }

    // Get the user's trainers
    const trainers = await Trainer.getByUserId(req.session.user.discord_id);

    if (!trainers || trainers.length === 0) {
      return res.status(404).json({ success: false, message: 'No trainers found for this user' });
    }

    // Determine which rewards array to use
    let sessionRewards = [];

    if (req.session.rewards && Array.isArray(req.session.rewards) && req.session.rewards.length > 0) {
      console.log('Using rewards from req.session.rewards');
      sessionRewards = req.session.rewards;
    } else if (source === 'garden' && req.session.gardenRewards && Array.isArray(req.session.gardenRewards) && req.session.gardenRewards.length > 0) {
      console.log('Using rewards from req.session.gardenRewards');
      sessionRewards = req.session.gardenRewards;
    } else if (source === 'farm' && req.session.farmRewards && Array.isArray(req.session.farmRewards) && req.session.farmRewards.length > 0) {
      console.log('Using rewards from req.session.farmRewards');
      sessionRewards = req.session.farmRewards;
    } else if (source === 'location_activity' && req.session.activityRewards && Array.isArray(req.session.activityRewards) && req.session.activityRewards.length > 0) {
      console.log('Using rewards from req.session.activityRewards');
      sessionRewards = req.session.activityRewards;
    } else if (source === 'game_corner' && req.session.pendingRewards && req.session.pendingRewards.game_corner) {
      console.log('Using rewards from req.session.pendingRewards.game_corner');
      sessionRewards = req.session.pendingRewards.game_corner;
    } else {
      console.log('No rewards found in session, using rewards from request');
      sessionRewards = rewards;
    }

    // If we have a session ID, try to get rewards from the database
    if (sessionId) {
      try {
        console.log('Attempting to get rewards from database session:', sessionId);
        const session = await LocationActivitySession.getById(sessionId);
        if (session && session.rewards) {
          console.log('Found rewards in database session');
          sessionRewards = session.rewards;
        }
      } catch (error) {
        console.error('Error getting rewards from database session:', error);
        // Continue with session rewards
      }
    }

    // Process each reward
    const results = [];
    for (const reward of rewards) {
      // Find the reward in the session
      const sessionReward = sessionRewards.find(r => r.id === reward.id && r.type === reward.type);

      if (!sessionReward) {
        console.log(`Reward not found in session: ${reward.id} (${reward.type})`);
        results.push({
          rewardId: reward.id,
          success: false,
          message: 'Reward not found'
        });
        continue;
      }

      // Skip already claimed rewards
      if (sessionReward.claimed) {
        console.log(`Reward already claimed: ${reward.id} (${reward.type})`);
        results.push({
          rewardId: reward.id,
          success: false,
          message: 'Reward already claimed'
        });
        continue;
      }

      // Determine which trainer to use
      let selectedTrainer;
      // For game corner, always use random trainer regardless of trainerId
      if (source === 'game_corner') {
        // Randomly select a trainer for game corner rewards
        const randomIndex = Math.floor(Math.random() * trainers.length);
        selectedTrainer = trainers[randomIndex];
        console.log(`Game corner reward - randomly assigned to ${selectedTrainer.name} (${selectedTrainer.id})`);
      } else if (trainerId === 'random') {
        // Randomly select a trainer for other sources when explicitly requested
        const randomIndex = Math.floor(Math.random() * trainers.length);
        selectedTrainer = trainers[randomIndex];
        console.log(`Randomly selected trainer: ${selectedTrainer.name} (${selectedTrainer.id})`);
      } else {
        // Find the specified trainer for non-game corner rewards
        selectedTrainer = trainers.find(t => t.id == trainerId);
        if (!selectedTrainer) {
          console.log(`Trainer not found: ${trainerId}, using random trainer`);
          const randomIndex = Math.floor(Math.random() * trainers.length);
          selectedTrainer = trainers[randomIndex];
        }
      }

      // Process the reward claim
      console.log(`Processing reward claim: ${sessionReward.id} (${sessionReward.type}) for trainer ${selectedTrainer.name} (${selectedTrainer.id})`);
      const result = await RewardSystem.processRewardClaim(sessionReward, selectedTrainer.id, trainers, source);

      if (result.success) {
        // Mark the reward as claimed in the session
        sessionReward.claimed = true;
        sessionReward.assignedTo = {
          id: selectedTrainer.id,
          name: selectedTrainer.name
        };

        // If we have a session ID, update the rewards in the database
        if (sessionId) {
          try {
            await pool.query(
              'UPDATE location_activity_sessions SET rewards = $1 WHERE session_id = $2',
              [JSON.stringify(sessionRewards), sessionId]
            );
            console.log(`Updated rewards in database session ${sessionId}`);
          } catch (error) {
            console.error('Error updating rewards in database session:', error);
            // Continue even if update fails
          }
        }
      }

      results.push({
        rewardId: sessionReward.id,
        success: result.success,
        message: result.message,
        trainerId: result.trainerId,
        trainerName: result.trainerName
      });
    }

    // Update the session rewards
    if (source === 'garden') {
      req.session.gardenRewards = sessionRewards;
    } else if (source === 'farm') {
      req.session.farmRewards = sessionRewards;
    } else if (source === 'location_activity') {
      req.session.activityRewards = sessionRewards;
    } else if (source === 'game_corner') {
      if (req.session.pendingRewards) {
        req.session.pendingRewards.game_corner = sessionRewards;
      }
    } else {
      req.session.rewards = sessionRewards;
    }

    // Check if all rewards were processed successfully
    const allSuccessful = results.every(result => result.success);

    return res.json({
      success: allSuccessful,
      message: allSuccessful ? 'All rewards claimed successfully' : 'Some rewards failed to process',
      claimedRewards: results
    });
  } catch (error) {
    console.error('Error claiming all rewards:', error);
    return res.status(500).json({ success: false, message: 'Error claiming rewards: ' + error.message });
  }
});

module.exports = router;
