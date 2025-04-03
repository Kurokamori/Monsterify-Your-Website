const express = require('express');
const router = express.Router();
const AntiqueAuction = require('../../models/AntiqueAuction');
const Trainer = require('../../models/Trainer');
const MonsterService = require('../../utils/MonsterService');

/**
 * @route GET /api/antique-auctions
 * @desc Get all auction monsters
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    const auctions = await AntiqueAuction.getAll();
    
    res.json({
      success: true,
      data: auctions
    });
  } catch (error) {
    console.error('Error getting auction monsters:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting auction monsters'
    });
  }
});

/**
 * @route GET /api/antique-auctions/:antique
 * @desc Get auction monsters by antique type
 * @access Public
 */
router.get('/:antique', async (req, res) => {
  try {
    const { antique } = req.params;
    const auctions = await AntiqueAuction.getByAntique(antique);
    
    res.json({
      success: true,
      data: auctions
    });
  } catch (error) {
    console.error(`Error getting auction monsters for antique ${req.params.antique}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error getting auction monsters'
    });
  }
});

/**
 * @route POST /api/antique-auctions/claim
 * @desc Claim a monster from the auction
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

    const { auctionId, trainerId, monsterName } = req.body;

    // Validate input
    if (!auctionId || !trainerId || !monsterName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters'
      });
    }

    // Get the auction monster
    const auctions = await AntiqueAuction.getAll();
    const auction = auctions.find(a => a.id === parseInt(auctionId));
    
    if (!auction) {
      return res.status(404).json({
        success: false,
        message: 'Auction monster not found'
      });
    }

    // Get the trainer
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
        message: 'You do not have permission to use this trainer'
      });
    }

    // Check if trainer has the antique
    let antiquesInventory = {};
    if (trainer.inv_antiques) {
      try {
        antiquesInventory = typeof trainer.inv_antiques === 'string'
          ? JSON.parse(trainer.inv_antiques)
          : trainer.inv_antiques;
      } catch (e) {
        console.error('Error parsing antiques inventory:', e);
        return res.status(500).json({
          success: false,
          message: 'Error reading inventory'
        });
      }
    }

    const quantity = antiquesInventory[auction.antique] || 0;
    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: `You don't have any ${auction.antique} to spend`
      });
    }

    // Spend the antique
    const success = await Trainer.updateInventoryItem(
      trainerId,
      'inv_antiques',
      auction.antique,
      -1 // Decrease by 1
    );

    if (!success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to spend antique'
      });
    }

    // Create the monster
    const monsterData = {
      species1: auction.species1,
      species2: auction.species2,
      species3: auction.species3,
      type1: auction.type1,
      type2: auction.type2,
      type3: auction.type3,
      type4: auction.type4,
      type5: auction.type5,
      attribute: auction.attribute,
      img_link: auction.image_link
    };

    const monster = await MonsterService.claimMonster(monsterData, trainerId, monsterName);

    if (!monster) {
      // Refund the antique if monster creation fails
      await Trainer.updateInventoryItem(
        trainerId,
        'inv_antiques',
        auction.antique,
        1
      );
      
      return res.status(500).json({
        success: false,
        message: 'Failed to create monster'
      });
    }

    // Initialize the monster with proper stats and moves
    const MonsterInitializer = require('../../utils/MonsterInitializer');
    const initializedMonster = await MonsterInitializer.initializeMonster({
      ...monster,
      level: 1
    });

    // Update the monster with initialized data
    if (initializedMonster) {
      await require('../../models/Monster').update(monster.mon_id, initializedMonster);
    }

    // Remove the auction monster
    await AntiqueAuction.delete(auctionId);

    res.json({
      success: true,
      message: 'Monster claimed successfully',
      monster
    });
  } catch (error) {
    console.error('Error claiming auction monster:', error);
    res.status(500).json({
      success: false,
      message: 'Error claiming auction monster'
    });
  }
});

/**
 * @route POST /api/antique-auctions/add
 * @desc Add a monster to the auction (admin only)
 * @access Private/Admin
 */
router.post('/add', async (req, res) => {
  try {
    // Ensure user is authenticated and is an admin
    if (!req.session.user || !req.session.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const {
      antique,
      image_link,
      name,
      species1,
      species2,
      species3,
      type1,
      type2,
      type3,
      type4,
      type5,
      attribute
    } = req.body;

    // Validate required fields
    if (!antique || !species1 || !type1) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Create the auction monster
    const auction = await AntiqueAuction.create({
      antique,
      image_link,
      name,
      species1,
      species2,
      species3,
      type1,
      type2,
      type3,
      type4,
      type5,
      attribute
    });

    res.json({
      success: true,
      message: 'Auction monster added successfully',
      data: auction
    });
  } catch (error) {
    console.error('Error adding auction monster:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding auction monster'
    });
  }
});

module.exports = router;
