const express = require('express');
const router = express.Router();
const Trainer = require('../../models/Trainer');
const Monster = require('../../models/Monster');
const MonsterRoller = require('../../utils/MonsterRoller');
const MonsterService = require('../../utils/MonsterService');

/**
 * @route GET /api/nursery/eggs
 * @desc Get egg count for a trainer
 * @access Private
 */
router.get('/eggs', async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const { trainerId } = req.query;

    // Validate trainerId
    if (!trainerId) {
      return res.status(400).json({
        success: false,
        message: 'Trainer ID is required'
      });
    }

    // Get trainer
    const trainer = await Trainer.getById(trainerId);
    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }

    // Check if trainer belongs to the current user
    if (trainer.player_user_id !== req.session.user.discord_id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this trainer'
      });
    }

    // Get trainer's inventory
    const inventory = await Trainer.getInventory(trainerId);

    // Check for Standard Egg in inv_eggs
    const eggCount = inventory && inventory.inv_eggs && inventory.inv_eggs['Standard Egg']
      ? inventory.inv_eggs['Standard Egg']
      : 0;

    // Check for incubator in inv_items
    const hasIncubator = inventory && inventory.inv_items && inventory.inv_items['Incubator']
      ? inventory.inv_items['Incubator'] > 0
      : false;

    // Check for DNA Splicer in inv_items
    const dnaSplicerCount = inventory && inventory.inv_items && inventory.inv_items['DNA Splicer']
      ? inventory.inv_items['DNA Splicer']
      : 0;

    // Check for Edenwiess in inv_berries (functions the same as DNA Splicer)
    const edenwiessCount = inventory && inventory.inv_berries && inventory.inv_berries['Edenwiess']
      ? inventory.inv_berries['Edenwiess']
      : 0;

    // Check for Forget-Me-Not in inv_berries (rerolls egg batch)
    const forgetMeNotCount = inventory && inventory.inv_berries && inventory.inv_berries['Forget-Me-Not']
      ? inventory.inv_berries['Forget-Me-Not']
      : 0;

    res.json({
      success: true,
      eggCount,
      hasIncubator,
      dnaSplicerCount,
      edenwiessCount,
      forgetMeNotCount,
      trainerName: trainer.name
    });
  } catch (error) {
    console.error('Error getting egg count:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting egg count'
    });
  }
});

/**
 * @route POST /api/nursery/hatch
 * @desc Hatch an egg and generate monsters
 * @access Private
 */
router.post('/hatch', async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const { trainerId, useIncubator, submissionUrl, useForgetMeNot } = req.body;

    // Validate trainerId
    if (!trainerId) {
      return res.status(400).json({
        success: false,
        message: 'Trainer ID is required'
      });
    }

    // Get trainer
    const trainer = await Trainer.getById(trainerId);
    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }

    // Check if trainer belongs to the current user
    if (trainer.player_user_id !== req.session.user.discord_id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this trainer'
      });
    }

    // Get trainer's inventory
    const inventory = await Trainer.getInventory(trainerId);

    // Check for Standard Egg in inv_eggs
    const eggCount = inventory && inventory.inv_eggs && inventory.inv_eggs['Standard Egg']
      ? inventory.inv_eggs['Standard Egg']
      : 0;

    if (eggCount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'This trainer has no eggs to hatch'
      });
    }

    // If using incubator, check if trainer has one
    if (useIncubator) {
      const hasIncubator = inventory && inventory.inv_items && inventory.inv_items['Incubator']
        ? inventory.inv_items['Incubator'] > 0
        : false;

      if (!hasIncubator) {
        return res.status(400).json({
          success: false,
          message: 'This trainer does not have an incubator'
        });
      }
    } else {
      // If not using incubator, ensure submission URL is provided
      if (!submissionUrl) {
        return res.status(400).json({
          success: false,
          message: 'Submission URL is required when not using an incubator'
        });
      }
    }

    // If using Forget-Me-Not, check if trainer has one
    if (useForgetMeNot) {
      // Get trainer's inventory
      const inventory = await Trainer.getInventory(trainerId);

      // Check if trainer has Forget-Me-Not
      const forgetMeNotCount = inventory && inventory.inv_berries && inventory.inv_berries['Forget-Me-Not']
        ? inventory.inv_berries['Forget-Me-Not']
        : 0;

      if (forgetMeNotCount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'This trainer does not have a Forget-Me-Not'
        });
      }

      // Remove one Forget-Me-Not from the trainer's inventory
      await Trainer.updateInventoryItem(trainerId, 'inv_berries', 'Forget-Me-Not', -1);
    }

    // Roll 10 monsters using MonsterRoller with default parameters
    const monsters = await MonsterRoller.rollTen();

    // Remove one egg from the trainer's inventory if not using Forget-Me-Not
    if (!useForgetMeNot) {
      await Trainer.updateInventoryItem(trainerId, 'inv_eggs', 'Standard Egg', -1);
    }

    // If using incubator, remove one incubator from the trainer's inventory
    if (useIncubator) {
      await Trainer.updateInventoryItem(trainerId, 'inv_items', 'Incubator', -1);
    }

    res.json({
      success: true,
      message: 'Egg hatched successfully',
      data: {
        monsters,
        trainerId,
        trainerName: trainer.name
      }
    });
  } catch (error) {
    console.error('Error hatching egg:', error);
    res.status(500).json({
      success: false,
      message: 'Error hatching egg'
    });
  }
});

/**
 * @route POST /api/nursery/claim
 * @desc Claim a monster from hatched egg
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

    const { trainerId, monsterData, monsterName, useDnaSplicer, useEdenwiess } = req.body;

    // Validate required fields
    if (!trainerId || !monsterData || !monsterName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Get trainer's inventory for item checks
    const inventory = await Trainer.getInventory(trainerId);

    // Check if using DNA Splicer
    if (useDnaSplicer) {
      // Check if trainer has DNA Splicer
      const dnaSplicerCount = inventory && inventory.inv_items && inventory.inv_items['DNA Splicer']
        ? inventory.inv_items['DNA Splicer']
        : 0;

      if (dnaSplicerCount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'You do not have any DNA Splicers'
        });
      }

      // Use one DNA Splicer
      await Trainer.updateInventoryItem(trainerId, 'inv_items', 'DNA Splicer', -1);
    }

    // Check if using Edenwiess (functions the same as DNA Splicer)
    if (useEdenwiess) {
      // Check if trainer has Edenwiess
      const edenwiessCount = inventory && inventory.inv_berries && inventory.inv_berries['Edenwiess']
        ? inventory.inv_berries['Edenwiess']
        : 0;

      if (edenwiessCount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'You do not have any Edenwiess'
        });
      }

      // Use one Edenwiess
      await Trainer.updateInventoryItem(trainerId, 'inv_berries', 'Edenwiess', -1);
    }

    // Get trainer
    const trainer = await Trainer.getById(trainerId);
    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }

    // Check if trainer belongs to the current user
    if (trainer.player_user_id !== req.session.user.discord_id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this trainer'
      });
    }

    // Create the monster
    const monster = await MonsterService.claimMonster(monsterData, trainerId, monsterName);

    if (!monster) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create monster'
      });
    }

    res.json({
      success: true,
      message: 'Monster claimed successfully',
      data: {
        monster
      }
    });
  } catch (error) {
    console.error('Error claiming monster:', error);
    res.status(500).json({
      success: false,
      message: 'Error claiming monster'
    });
  }
});

module.exports = router;
