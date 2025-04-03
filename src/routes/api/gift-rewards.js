const express = require('express');
const router = express.Router();
const Trainer = require('../../models/Trainer');
const Monster = require('../../models/Monster');
const MonsterRoller = require('../../utils/MonsterRoller');
const Item = require('../../models/Item');

/**
 * @route POST /api/gift-rewards/assign
 * @desc Assign pending gift rewards to a specific trainer or monster
 * @access Private
 */
router.post('/assign', async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const {
      recipientType, // 'trainer' or 'monster'
      trainerId,
      monsterName,
      rewardCount,
      giftLevels
    } = req.body;

    // Validate input
    if (!recipientType || !trainerId || !rewardCount || !giftLevels) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters'
      });
    }

    if (recipientType === 'monster' && !monsterName) {
      return res.status(400).json({
        success: false,
        message: 'Monster name is required when recipient type is monster'
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

    // Apply gift levels
    if (recipientType === 'trainer') {
      // Add levels to trainer
      await Trainer.addLevels(trainerId, giftLevels);
    } else {
      // Check if monster exists
      const monsters = await Monster.getByTrainerIdAndName(trainerId, monsterName);

      if (monsters && monsters.length > 0) {
        // Add levels to existing monster
        await Monster.addLevels(monsters[0].mon_id, giftLevels);
      } else {
        // Create a new monster with the specified name and levels
        const MonsterInitializer = require('../../utils/MonsterInitializer');
        const monsterData = await MonsterInitializer.generateRandomMonster(giftLevels);

        await Monster.create({
          trainer_id: trainerId,
          name: monsterName,
          ...monsterData
        });
      }
    }

    // Generate and assign rewards
    const itemRewards = [];
    const categories = ['ITEMS', 'BALLS', 'EVOLUTION', 'BERRIES', 'PASTRIES', 'ANTIQUE', 'HELDITEMS'];

    // Ensure at least one reward is generated when there are gift levels
    const actualRewardCount = Math.max(1, rewardCount);

    // Roll and distribute rewards
    for (let i = 0; i < actualRewardCount; i++) {
      // 20% chance to roll a monster instead of an item
      if (Math.random() < 0.2) {
        // Roll a monster using default parameters
        const roller = new MonsterRoller(); // Using default parameters
        const monster = await roller.rollMonster();

        // Create monster for trainer
        await Monster.create({
          trainer_id: trainerId,
          ...monster,
          level: 1
        });

        // Add to rewards list for display
        itemRewards.push({
          type: 'monster',
          name: `${monster.species1} ${monster.type1} Monster`,
          quantity: 1
        });
      } else {
        // Roll an item
        const category = categories[Math.floor(Math.random() * categories.length)];

        // Get random item from category
        const items = await Item.getByCategory(category);

        if (items && items.length > 0) {
          const item = items[Math.floor(Math.random() * items.length)];

          // Add item to trainer's inventory
          const inventoryCategory = mapCategoryToInventoryField(category);
          await Trainer.addItemDirectly(
            trainerId,
            inventoryCategory,
            item.name,
            1
          );

          // Add to rewards list for display
          itemRewards.push({
            type: 'item',
            id: item.id,
            name: item.name,
            category: item.category,
            quantity: 1
          });
        }
      }
    }

    res.json({
      success: true,
      message: 'Gift rewards assigned successfully',
      recipientType,
      trainerId,
      trainerName: trainer.name,
      monsterName: recipientType === 'monster' ? monsterName : null,
      giftLevels,
      itemRewards
    });
  } catch (error) {
    console.error('Error assigning gift rewards:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error assigning gift rewards'
    });
  }
});

/**
 * Map item category to inventory field
 * @param {string} category - Item category
 * @returns {string} - Inventory field name
 */
function mapCategoryToInventoryField(category) {
  const mapping = {
    'ITEMS': 'inv_items',
    'BALLS': 'inv_balls',
    'EVOLUTION': 'inv_evolution',
    'BERRIES': 'inv_berries',
    'PASTRIES': 'inv_pastries',
    'ANTIQUES': 'inv_antiques',
    'HELDITEMS': 'inv_helditems',
    'SEALS': 'inv_seals'
  };

  return mapping[category] || 'inv_items';
}

module.exports = router;
