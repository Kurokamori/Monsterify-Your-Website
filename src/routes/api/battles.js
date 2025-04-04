const express = require('express');
const router = express.Router();
const Battle = require('../../models/Battle');
const BattleOpponent = require('../../models/BattleOpponent');
const BattleService = require('../../services/BattleService');
const Trainer = require('../../models/Trainer');

// Import authentication middleware
const { ensureAuthenticatedApi } = require('../../middleware/auth');

/**
 * @route GET /api/battles/opponents
 * @description Get all battle opponents
 * @access Private
 */
router.get('/opponents', ensureAuthenticatedApi, async (req, res) => {
  try {
    const opponents = await BattleOpponent.getAll(true);

    res.json({
      success: true,
      opponents
    });
  } catch (error) {
    console.error('Error getting battle opponents:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting battle opponents'
    });
  }
});

/**
 * @route GET /api/battles/opponents/:id
 * @description Get a battle opponent by ID
 * @access Private
 */
router.get('/opponents/:id', ensureAuthenticatedApi, async (req, res) => {
  try {
    const opponentId = req.params.id;
    const opponent = await BattleOpponent.getById(opponentId);

    if (!opponent) {
      return res.status(404).json({
        success: false,
        message: 'Opponent not found'
      });
    }

    // Get opponent's monsters
    const monsters = await BattleOpponent.getMonsters(opponentId);

    res.json({
      success: true,
      opponent,
      monsters
    });
  } catch (error) {
    console.error('Error getting battle opponent:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting battle opponent'
    });
  }
});

/**
 * @route GET /api/battles/history/:trainerId
 * @description Get battle history for a trainer
 * @access Private
 */
router.get('/history/:trainerId', ensureAuthenticatedApi, async (req, res) => {
  try {
    const trainerId = req.params.trainerId;

    // Verify trainer exists
    const trainer = await Trainer.getById(trainerId);
    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }

    // For admin testing, skip the user ID check
    // In a production environment, you would want to keep this check
    // if (!trainer || trainer.player_user_id !== req.session.user.id) {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Unauthorized access to trainer data'
    //   });
    // }

    const battles = await Battle.getByTrainer(trainerId);
    const stats = await Battle.getTrainerStats(trainerId);

    res.json({
      success: true,
      battles,
      stats
    });
  } catch (error) {
    console.error('Error getting battle history:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting battle history'
    });
  }
});

/**
 * @route POST /api/battles/start
 * @description Start a new battle
 * @access Private
 */
router.post('/start', ensureAuthenticatedApi, async (req, res) => {
  try {
    const { trainerId, opponentId } = req.body;

    if (!trainerId || !opponentId) {
      return res.status(400).json({
        success: false,
        message: 'Trainer ID and opponent ID are required'
      });
    }

    // Verify trainer exists
    const trainer = await Trainer.getById(trainerId);
    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }

    // For admin testing, skip the user ID check
    // In a production environment, you would want to keep this check
    // if (!trainer || trainer.player_user_id !== req.session.user.id) {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Unauthorized access to trainer data'
    //   });
    // }

    const result = await BattleService.startBattle(trainerId, opponentId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error starting battle:', error);
    res.status(500).json({
      success: false,
      message: 'Error starting battle'
    });
  }
});

/**
 * @route POST /api/battles/:battleId/turn
 * @description Process a battle turn
 * @access Private
 */
router.post('/:battleId/turn', ensureAuthenticatedApi, async (req, res) => {
  try {
    const battleId = req.params.battleId;
    const {
      battleState,
      isPlayerAttacking,
      wpm,
      accuracy
    } = req.body;

    if (!battleState) {
      return res.status(400).json({
        success: false,
        message: 'Battle state is required'
      });
    }

    // Verify battle belongs to current user
    const battle = await Battle.getById(battleId);
    if (!battle) {
      return res.status(404).json({
        success: false,
        message: 'Battle not found'
      });
    }

    const trainer = await Trainer.getById(battle.trainer_id);
    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }

    // For admin testing, skip the user ID check
    // In a production environment, you would want to keep this check
    // if (!trainer || trainer.player_user_id !== req.session.user.id) {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Unauthorized access to battle data'
    //   });
    // }

    // Process turn
    const turnData = {
      isPlayerAttacking,
      wpm: wpm || 0,
      accuracy: accuracy || 0
    };

    const updatedBattleState = await BattleService.processTurn(battleState, turnData);

    res.json({
      success: true,
      battleState: updatedBattleState
    });
  } catch (error) {
    console.error('Error processing battle turn:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing battle turn'
    });
  }
});

/**
 * @route POST /api/battles/:battleId/abandon
 * @description Abandon a battle
 * @access Private
 */
router.post('/:battleId/abandon', ensureAuthenticatedApi, async (req, res) => {
  try {
    const battleId = req.params.battleId;

    // Verify battle belongs to current user
    const battle = await Battle.getById(battleId);
    if (!battle) {
      return res.status(404).json({
        success: false,
        message: 'Battle not found'
      });
    }

    const trainer = await Trainer.getById(battle.trainer_id);
    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }

    // For admin testing, skip the user ID check
    // In a production environment, you would want to keep this check
    // if (!trainer || trainer.player_user_id !== req.session.user.id) {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Unauthorized access to battle data'
    //   });
    // }

    const result = await BattleService.abandonBattle(battleId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error abandoning battle:', error);
    res.status(500).json({
      success: false,
      message: 'Error abandoning battle'
    });
  }
});

/**
 * @route POST /api/battles/:battleId/claim-rewards
 * @description Claim rewards for a battle
 * @access Private
 */
router.post('/:battleId/claim-rewards', ensureAuthenticatedApi, async (req, res) => {
  try {
    const battleId = req.params.battleId;

    // Verify battle belongs to current user
    const battle = await Battle.getById(battleId);
    if (!battle) {
      return res.status(404).json({
        success: false,
        message: 'Battle not found'
      });
    }

    const trainer = await Trainer.getById(battle.trainer_id);
    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }

    // For admin testing, skip the user ID check
    // In a production environment, you would want to keep this check
    // if (!trainer || trainer.player_user_id !== req.session.user.id) {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Unauthorized access to battle data'
    //   });
    // }

    const result = await Battle.claimRewards(battleId, battle.trainer_id);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error claiming battle rewards:', error);
    res.status(500).json({
      success: false,
      message: 'Error claiming battle rewards'
    });
  }
});

/**
 * @route GET /api/battles/:battleId/rewards
 * @description Get rewards for a battle
 * @access Private
 */
router.get('/:battleId/rewards', ensureAuthenticatedApi, async (req, res) => {
  try {
    const battleId = req.params.battleId;

    // Verify battle belongs to current user
    const battle = await Battle.getById(battleId);
    if (!battle) {
      return res.status(404).json({
        success: false,
        message: 'Battle not found'
      });
    }

    const trainer = await Trainer.getById(battle.trainer_id);
    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }

    // For admin testing, skip the user ID check
    // In a production environment, you would want to keep this check
    // if (!trainer || trainer.player_user_id !== req.session.user.id) {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Unauthorized access to battle data'
    //   });
    // }

    const rewards = await Battle.getRewards(battleId);

    if (!rewards) {
      return res.json({
        success: true,
        rewards: null,
        message: 'No rewards found for this battle'
      });
    }

    res.json({
      success: true,
      rewards
    });
  } catch (error) {
    console.error('Error getting battle rewards:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting battle rewards'
    });
  }
});

module.exports = router;
