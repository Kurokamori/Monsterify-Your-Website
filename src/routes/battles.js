const express = require('express');
const router = express.Router();
const BattleOpponent = require('../models/BattleOpponent');
const Battle = require('../models/Battle');
const Trainer = require('../models/Trainer');

// Import authentication middleware
const { ensureAuthenticated } = require('../middleware/auth');

/**
 * @route GET /battles
 * @description Battle system home page
 * @access Private
 */
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    console.log('Session user:', req.session.user);

    // Get user's trainers - use discord_id instead of id
    const trainers = await Trainer.getByUserId(req.session.user.discord_id);
    console.log(`Found ${trainers.length} trainers for user ${req.session.user.discord_id}`);

    // Get battle opponents
    const opponents = await BattleOpponent.getAll(true);

    res.render('battles/index', {
      title: 'Battle System',
      trainers,
      opponents
    });
  } catch (error) {
    console.error('Error loading battle system:', error);

    // Try to get all trainers as a fallback
    let trainers = [];
    try {
      trainers = await Trainer.getAll();
      console.log(`Fallback: Found ${trainers.length} total trainers`);
    } catch (fallbackError) {
      console.error('Error in fallback trainer loading:', fallbackError);
    }

    res.render('battles/index', {
      title: 'Battle System',
      trainers: trainers,
      opponents: [],
      error: 'Error loading battle system'
    });
  }
});

/**
 * @route GET /battles/trainer/:trainerId
 * @description Battle selection page for a specific trainer
 * @access Private
 */
router.get('/trainer/:trainerId', ensureAuthenticated, async (req, res) => {
  try {
    const trainerId = req.params.trainerId;

    // Verify trainer exists
    const trainer = await Trainer.getById(trainerId);
    if (!trainer) {
      return res.redirect('/battles');
    }

    // For admin testing, skip the user ID check
    // In a production environment, you would want to keep this check
    // if (trainer.player_user_id !== req.session.user.discord_id) {
    //   return res.redirect('/battles');
    // }

    // Get all trainer's monsters instead of just battle box
    const trainerMonsters = await Trainer.getMonsters(trainerId);

    // Check if trainer has any monsters
    if (!trainerMonsters || trainerMonsters.length === 0) {
      return res.render('battles/trainer', {
        title: `${trainer.name}'s Battles`,
        trainer,
        battleBoxMonsters: [],
        opponents: [],
        error: 'You need to have monsters to battle'
      });
    }

    // Get battle opponents
    const opponents = await BattleOpponent.getAll(true);

    // Get battle history
    const battleHistory = await Battle.getByTrainer(trainerId, 5);

    // Get battle statistics
    const battleStats = await Battle.getTrainerStats(trainerId);

    res.render('battles/trainer', {
      title: `${trainer.name}'s Battles`,
      trainer,
      battleBoxMonsters: trainerMonsters, // Use all monsters instead of just battle box
      opponents,
      battleHistory,
      battleStats,
      error: null // Explicitly pass null to avoid undefined error
    });
  } catch (error) {
    console.error('Error loading trainer battle page:', error);
    res.redirect('/battles');
  }
});

/**
 * @route GET /battles/arena/:battleId
 * @description Battle arena page
 * @access Private
 */
router.get('/arena/:battleId', ensureAuthenticated, async (req, res) => {
  try {
    const battleId = req.params.battleId;

    // Get battle
    const battle = await Battle.getById(battleId);
    if (!battle) {
      return res.redirect('/battles');
    }

    // Get trainer
    const trainer = await Trainer.getById(battle.trainer_id);
    if (!trainer) {
      return res.redirect('/battles');
    }

    // For admin testing, skip the user ID check
    // In a production environment, you would want to keep this check
    // if (trainer.player_user_id !== req.session.user.id) {
    //   return res.redirect('/battles');
    // }

    // Check if battle is already completed
    if (battle.status !== 'in_progress') {
      return res.redirect(`/battles/results/${battleId}`);
    }

    // Get all trainer's monsters instead of just battle box
    const trainerMonsters = await Trainer.getMonsters(battle.trainer_id);

    // Get opponent
    const opponent = await BattleOpponent.getById(battle.opponent_id);

    // Get opponent's monsters
    const opponentMonsters = await BattleOpponent.getMonsters(battle.opponent_id);

    res.render('battles/arena', {
      title: `Battle: ${trainer.name} vs ${opponent.name}`,
      battle,
      trainer,
      opponent,
      trainerMonsters,
      opponentMonsters
    });
  } catch (error) {
    console.error('Error loading battle arena:', error);
    res.redirect('/battles');
  }
});

/**
 * @route GET /battles/results/:battleId
 * @description Battle results page
 * @access Private
 */
router.get('/results/:battleId', ensureAuthenticated, async (req, res) => {
  try {
    const battleId = req.params.battleId;

    // Get battle
    const battle = await Battle.getById(battleId);
    if (!battle) {
      return res.redirect('/battles');
    }

    // Get trainer
    const trainer = await Trainer.getById(battle.trainer_id);
    if (!trainer) {
      return res.redirect('/battles');
    }

    // For admin testing, skip the user ID check
    // In a production environment, you would want to keep this check
    // if (trainer.player_user_id !== req.session.user.id) {
    //   return res.redirect('/battles');
    // }

    // Get opponent
    const opponent = await BattleOpponent.getById(battle.opponent_id);

    // Get rewards if battle was won
    let rewards = null;
    if (battle.status === 'won') {
      rewards = await Battle.getRewards(battleId);
    }

    res.render('battles/results', {
      title: 'Battle Results',
      battle,
      trainer,
      opponent,
      rewards
    });
  } catch (error) {
    console.error('Error loading battle results:', error);
    res.redirect('/battles');
  }
});

/**
 * @route GET /battles/history/:trainerId
 * @description Battle history page for a trainer
 * @access Private
 */
router.get('/history/:trainerId', ensureAuthenticated, async (req, res) => {
  try {
    const trainerId = req.params.trainerId;

    // Verify trainer belongs to current user
    const trainer = await Trainer.getById(trainerId);
    if (!trainer || trainer.player_user_id !== req.session.user.id) {
      return res.redirect('/battles');
    }

    // Get battle history
    const battles = await Battle.getByTrainer(trainerId, 50);

    // Get battle statistics
    const stats = await Battle.getTrainerStats(trainerId);

    res.render('battles/history', {
      title: `${trainer.name}'s Battle History`,
      trainer,
      battles,
      stats
    });
  } catch (error) {
    console.error('Error loading battle history:', error);
    res.redirect('/battles');
  }
});

module.exports = router;
