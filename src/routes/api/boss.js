const express = require('express');
const router = express.Router();
const Boss = require('../../models/Boss');
const Trainer = require('../../models/Trainer');
const BossRewardTemplate = require('../../models/BossRewardTemplate');

// Import authentication middleware
const { ensureAuthenticatedApi, ensureAdminApi } = require('../../middleware/auth');

// Get current boss
router.get('/current', ensureAuthenticatedApi, async (req, res) => {
  try {
    const boss = await Boss.getCurrentBoss();

    if (!boss) {
      return res.json({
        success: true,
        boss: null,
        message: 'No active boss found'
      });
    }

    // Get the user's trainers
    const trainers = await Trainer.getByUserId(req.session.user.id);

    if (!trainers || trainers.length === 0) {
      return res.json({
        success: true,
        boss,
        damage: { total_damage: 0 },
        message: 'No trainers found for this user'
      });
    }

    // Get the player's damage using player_user_id
    const trainerId = trainers[0].id;
    const playerUserId = req.session.user.id;
    const damage = await Boss.getPlayerDamage(boss.boss_id, playerUserId);

    // Get top damagers
    const topDamagers = await Boss.getTopDamagers(boss.boss_id, 10);

    // Check if the boss is defeated and if there are rewards
    let rewards = null;
    let rewardStatus = null;
    if (boss.is_defeated) {
      rewards = await Boss.getTrainerRewards(boss.boss_id, trainerId);
      rewardStatus = await Boss.checkPlayerRewardStatus(boss.boss_id, playerUserId);
    }

    res.json({
      success: true,
      boss,
      damage,
      topDamagers,
      rewards,
      rewardStatus,
      trainerId: playerUserId // Send player_user_id instead of trainerId
    });
  } catch (error) {
    console.error('Error getting current boss:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting current boss'
    });
  }
});

// Damage boss
router.post('/damage', ensureAuthenticatedApi, async (req, res) => {
  try {
    const { bossId, trainerId, damageAmount, source } = req.body;

    // Validate required fields
    if (!bossId || !trainerId || !damageAmount || !source) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Validate that the trainer belongs to the user
    const trainers = await Trainer.getByUserId(req.session.user.id);
    const trainerIds = trainers.map(t => t.id);

    if (!trainerIds.includes(parseInt(trainerId))) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to damage boss with this trainer'
      });
    }

    // Get the player_user_id from the session
    const playerUserId = req.session.user.id;

    // Damage the boss with player_user_id instead of trainerId
    const updatedBoss = await Boss.damageBoss(bossId, playerUserId, damageAmount, source, trainerId);

    // Get the trainer's updated damage
    const damage = await Boss.getTrainerDamage(bossId, trainerId);

    // Get top damagers
    const topDamagers = await Boss.getTopDamagers(bossId, 10);

    // Check if the boss is defeated and if there are rewards
    let rewards = null;
    let rewardStatus = null;
    if (updatedBoss.is_defeated) {
      rewards = await Boss.getTrainerRewards(bossId, trainerId);
      rewardStatus = await Boss.checkPlayerRewardStatus(bossId, playerUserId);
    }

    res.json({
      success: true,
      boss: updatedBoss,
      damage,
      topDamagers,
      rewards,
      rewardStatus,
      message: `Successfully dealt ${damageAmount} damage to the boss`
    });
  } catch (error) {
    console.error('Error damaging boss:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error damaging boss'
    });
  }
});

// Claim rewards
router.post('/claim-rewards', ensureAuthenticatedApi, async (req, res) => {
  try {
    const { bossId, trainerId } = req.body;

    // Validate required fields
    if (!bossId || !trainerId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Validate that the trainer belongs to the user
    const trainers = await Trainer.getByUserId(req.session.user.id);
    const trainerIds = trainers.map(t => t.id);

    if (!trainerIds.includes(parseInt(trainerId))) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to claim rewards for this trainer'
      });
    }

    // Get the boss
    const boss = await Boss.getById(bossId);
    if (!boss) {
      return res.status(404).json({
        success: false,
        message: 'Boss not found'
      });
    }

    // Check if the boss is defeated
    if (!boss.is_defeated) {
      return res.status(400).json({
        success: false,
        message: 'Cannot claim rewards for a boss that is not defeated'
      });
    }

    // Claim the rewards
    const claimedRewards = await Boss.claimRewards(bossId, trainerId);

    res.json({
      success: true,
      rewards: claimedRewards,
      message: 'Successfully claimed rewards'
    });
  } catch (error) {
    console.error('Error claiming rewards:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error claiming rewards'
    });
  }
});

// Admin: Create a new boss
router.post('/create', ensureAdminApi, async (req, res) => {
  try {
    const { name, flavor_text, image_url, max_health } = req.body;

    // Validate required fields
    if (!name || !max_health) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Create the boss
    const boss = await Boss.create({
      name,
      flavor_text,
      image_url,
      max_health
    });

    if (!boss) {
      return res.status(500).json({
        success: false,
        message: 'Error creating boss'
      });
    }

    res.json({
      success: true,
      boss,
      message: 'Successfully created new boss'
    });
  } catch (error) {
    console.error('Error creating boss:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating boss'
    });
  }
});

// Admin: Get all bosses
router.get('/all', ensureAdminApi, async (req, res) => {
  try {
    const query = `
      SELECT * FROM bosses
      ORDER BY created_at DESC
    `;

    const result = await require('../../db').query(query);
    const bosses = result.rows;

    res.json({
      success: true,
      bosses
    });
  } catch (error) {
    console.error('Error getting all bosses:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting all bosses'
    });
  }
});

// Check reward status
router.get('/reward-status/:bossId', ensureAuthenticatedApi, async (req, res) => {
  try {
    const bossId = req.params.bossId;
    const playerUserId = req.session.user.id;

    // Get the boss
    const boss = await Boss.getById(bossId);
    if (!boss) {
      return res.status(404).json({
        success: false,
        message: 'Boss not found'
      });
    }

    // Check reward status
    const rewardStatus = await Boss.checkPlayerRewardStatus(bossId, playerUserId);

    res.json({
      success: true,
      rewardStatus
    });
  } catch (error) {
    console.error('Error checking reward status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error checking reward status'
    });
  }
});

// Admin: Get reward templates for a boss
router.get('/templates/:bossId', ensureAdminApi, async (req, res) => {
  try {
    const bossId = req.params.bossId;

    // Get the boss
    const boss = await Boss.getById(bossId);
    if (!boss) {
      return res.status(404).json({
        success: false,
        message: 'Boss not found'
      });
    }

    // Get assigned templates
    const assignedTemplates = await BossRewardTemplate.getAssignedTemplates(bossId);

    res.json({
      success: true,
      boss,
      templates: assignedTemplates
    });
  } catch (error) {
    console.error('Error getting boss templates:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error getting boss templates'
    });
  }
});

module.exports = router;
