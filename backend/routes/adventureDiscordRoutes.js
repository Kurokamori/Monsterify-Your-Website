const express = require('express');
const router = express.Router();
const {
  createAdventureThread,
  getAdventureByThreadId,
  trackMessage,
  generateEncounter,
  attemptCapture,
  resolveBattle,
  endAdventure,
  getUnclaimedRewards,
  initiateBattle,
  executeAttack,
  useItemInBattle,
  getBattleStatus,
  initiatePvPBattle,
  releaseMonster,
  withdrawMonster,
  setBattleWeather,
  setBattleTerrain,
  forceWinBattle,
  forceLoseBattle,
  setWinCondition,
  forfeitBattle
} = require('../controllers/adventureDiscordController');

const Adventure = require('../models/Adventure');

// Middleware to check if adventure is non-custom (has landmass_id)
const requireNonCustomAdventure = async (req, res, next) => {
  try {
    let adventureId = req.body.adventureId || req.params.adventureId;

    // For capture route, get adventure ID from encounter
    if (!adventureId && req.body.encounterId) {
      const AdventureEncounter = require('../models/AdventureEncounter');
      const encounter = await AdventureEncounter.getById(req.body.encounterId);
      if (encounter) {
        adventureId = encounter.adventure_id;
      }
    }

    if (!adventureId) {
      return res.status(400).json({
        success: false,
        message: 'Missing adventureId'
      });
    }

    // Get adventure to check if it has landmass_id
    const adventure = await Adventure.getById(adventureId);

    if (!adventure) {
      return res.status(404).json({
        success: false,
        message: 'Adventure not found'
      });
    }

    // Check if adventure is custom (landmass_id is null)
    if (!adventure.landmass_id) {
      return res.status(403).json({
        success: false,
        message: 'Encounters and battles are only available for area-based adventures, not custom adventures'
      });
    }

    // Adventure is non-custom, continue to the controller
    next();
  } catch (error) {
    console.error('Error checking adventure type:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate adventure type',
      error: error.message
    });
  }
};

const AdventureRewardService = require('../services/AdventureRewardService');

// Routes for /api/adventures/discord

/**
 * @route POST /api/adventures/discord/thread
 * @desc Create Discord thread for adventure
 * @access Public (called by Discord bot)
 */
router.post('/thread', createAdventureThread);

/**
 * @route GET /api/adventures/discord/thread/:discordThreadId
 * @desc Get adventure by Discord thread ID
 * @access Public (called by Discord bot)
 */
router.get('/thread/:discordThreadId', getAdventureByThreadId);

/**
 * @route POST /api/adventures/discord/message
 * @desc Track message word count
 * @access Public (called by Discord bot)
 */
router.post('/message', trackMessage);

/**
 * @route POST /api/adventures/encounter
 * @desc Generate random encounter
 * @access Public (called by Discord bot)
 * @restrictions Only works for non-custom adventures (landmass_id not null)
 */
router.post('/encounter', requireNonCustomAdventure, generateEncounter);

/**
 * @route POST /api/adventures/capture
 * @desc Attempt monster capture
 * @access Public (called by Discord bot)
 * @restrictions Only works for non-custom adventures (landmass_id not null)
 */
router.post('/capture', requireNonCustomAdventure, attemptCapture);

/**
 * @route POST /api/adventures/battle/resolve
 * @desc Resolve battle encounter
 * @access Public (called by Discord bot)
 * @restrictions Only works for non-custom adventures (landmass_id not null)
 */
router.post('/battle/resolve', requireNonCustomAdventure, resolveBattle);

/**
 * @route POST /api/adventures/discord/battle/initiate
 * @desc Initiate or join a battle
 * @access Public (called by Discord bot)
 * @restrictions Only works for non-custom adventures (landmass_id not null)
 */
router.post('/battle/initiate', requireNonCustomAdventure, initiateBattle);

/**
 * @route POST /api/adventures/discord/battle/attack
 * @desc Execute an attack in battle
 * @access Public (called by Discord bot)
 * @restrictions Only works for non-custom adventures (landmass_id not null)
 */
router.post('/battle/attack', requireNonCustomAdventure, executeAttack);

/**
 * @route POST /api/adventures/discord/battle/use-item
 * @desc Use an item in battle
 * @access Public (called by Discord bot)
 * @restrictions Only works for non-custom adventures (landmass_id not null)
 */
router.post('/battle/use-item', requireNonCustomAdventure, useItemInBattle);

/**
 * @route GET /api/adventures/discord/battle/status/:adventureId
 * @desc Get battle status
 * @access Public (called by Discord bot)
 * @restrictions Only works for non-custom adventures (landmass_id not null)
 */
router.get('/battle/status/:adventureId', requireNonCustomAdventure, getBattleStatus);

/**
 * @route POST /api/adventures/discord/battle/pvp
 * @desc Initiate a PvP battle
 * @access Public (called by Discord bot)
 * @restrictions Only works for non-custom adventures (landmass_id not null)
 */
router.post('/battle/pvp', requireNonCustomAdventure, initiatePvPBattle);

/**
 * @route POST /api/adventures/discord/battle/release
 * @desc Release a monster to the battlefield
 * @access Public (called by Discord bot)
 * @restrictions Only works for non-custom adventures (landmass_id not null)
 */
router.post('/battle/release', requireNonCustomAdventure, releaseMonster);

/**
 * @route POST /api/adventures/discord/battle/withdraw
 * @desc Withdraw a monster from the battlefield
 * @access Public (called by Discord bot)
 * @restrictions Only works for non-custom adventures (landmass_id not null)
 */
router.post('/battle/withdraw', requireNonCustomAdventure, withdrawMonster);

/**
 * @route POST /api/adventures/discord/battle/weather
 * @desc Set battle weather
 * @access Public (called by Discord bot)
 * @restrictions Only works for non-custom adventures (landmass_id not null)
 */
router.post('/battle/weather', requireNonCustomAdventure, setBattleWeather);

/**
 * @route POST /api/adventures/discord/battle/terrain
 * @desc Set battle terrain
 * @access Public (called by Discord bot)
 * @restrictions Only works for non-custom adventures (landmass_id not null)
 */
router.post('/battle/terrain', requireNonCustomAdventure, setBattleTerrain);

/**
 * @route POST /api/adventures/end
 * @desc End adventure and calculate rewards
 * @access Public (called by Discord bot)
 */
router.post('/end', endAdventure);

/**
 * @route GET /api/adventures/rewards/unclaimed/:discordUserId
 * @desc Get unclaimed adventure rewards for a Discord user
 * @access Public (called by Discord bot)
 */
router.get('/rewards/unclaimed/:discordUserId', getUnclaimedRewards);

/**
 * @route GET /api/adventures/discord/user/:discordUserId
 * @desc Get user by Discord ID
 * @access Public (called by Discord bot)
 */
router.get('/user/:discordUserId', async (req, res) => {
  try {
    const { discordUserId } = req.params;
    const db = require('../config/db');

    const query = `
      SELECT id, username, display_name, discord_id
      FROM users
      WHERE discord_id = $1
    `;

    const user = await db.asyncGet(query, [discordUserId]);

    if (user) {
      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          display_name: user.display_name,
          discord_id: user.discord_id
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
  } catch (error) {
    console.error('Error getting user by Discord ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user',
      error: error.message
    });
  }
});

/**
 * @route POST /api/adventures/rewards/claim
 * @desc Claim adventure rewards
 * @access Private (requires authentication)
 */
router.post('/rewards/claim', async (req, res) => {
  try {
    const claimResult = await AdventureRewardService.claimRewards(req.body);
    res.json({
      success: true,
      ...claimResult
    });
  } catch (error) {
    console.error('Error claiming adventure rewards:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to claim rewards',
      error: error.message
    });
  }
});

/**
 * @route POST /api/adventures/discord/battle/forcewin
 * @desc Force win the current battle
 * @access Public (called by Discord bot)
 * @restrictions Only works for non-custom adventures (landmass_id not null)
 */
router.post('/battle/forcewin', requireNonCustomAdventure, forceWinBattle);

/**
 * @route POST /api/adventures/discord/battle/forcelose
 * @desc Force lose the current battle
 * @access Public (called by Discord bot)
 * @restrictions Only works for non-custom adventures (landmass_id not null)
 */
router.post('/battle/forcelose', requireNonCustomAdventure, forceLoseBattle);

/**
 * @route POST /api/adventures/discord/battle/win-condition
 * @desc Set win condition for battle
 * @access Public (called by Discord bot)
 * @restrictions Only works for non-custom adventures (landmass_id not null)
 */
router.post('/battle/win-condition', requireNonCustomAdventure, setWinCondition);

/**
 * @route POST /api/adventures/discord/battle/forfeit
 * @desc Forfeit the current battle
 * @access Public (called by Discord bot)
 * @restrictions Only works for non-custom adventures (landmass_id not null)
 */
router.post('/battle/forfeit', requireNonCustomAdventure, forfeitBattle);

module.exports = router;
