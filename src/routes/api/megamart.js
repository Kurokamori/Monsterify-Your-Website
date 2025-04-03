const express = require('express');
const router = express.Router();
const Monster = require('../../models/Monster');
const Trainer = require('../../models/Trainer');
const abilityMasterRouter = require('./megamart/ability-master');
const heldItemRouter = require('./megamart/held-item');

/**
 * @route POST /api/megamart/use-item
 * @desc Use an item on a monster
 * @access Private
 */
router.post('/use-item', async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const { trainerId, monsterId, itemName } = req.body;

    // Validate input
    if (!trainerId || !monsterId || !itemName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters'
      });
    }

    // Get the monster
    const monster = await Monster.getById(monsterId);
    if (!monster) {
      return res.status(404).json({
        success: false,
        message: 'Monster not found'
      });
    }

    // Verify monster belongs to trainer
    if (monster.trainer_id !== parseInt(trainerId)) {
      return res.status(403).json({
        success: false,
        message: 'This trainer does not own this monster'
      });
    }

    // Check if trainer has the item
    const trainer = await Trainer.getById(trainerId);
    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }

    // Check inventory for the item
    let hasItem = false;
    let inventoryCategory = '';

    // Check all inventory categories
    const inventoryCategories = ['inv_items', 'inv_balls', 'inv_berries', 'inv_pastries',
                               'inv_evolution', 'inv_antiques', 'inv_helditems'];

    console.log('Checking inventory for item:', itemName);
    console.log('Trainer inventory:', JSON.stringify(trainer, null, 2));

    // Parse inventory data from JSON strings to objects
    const inventory = {};
    for (const category of inventoryCategories) {
      if (trainer[category]) {
        try {
          // If it's already an object, use it as is
          if (typeof trainer[category] === 'object' && !Array.isArray(trainer[category]) && trainer[category] !== null) {
            inventory[category] = trainer[category];
          } else {
            // Otherwise, try to parse it as JSON
            inventory[category] = JSON.parse(trainer[category] || '{}');
          }
        } catch (e) {
          console.error(`Error parsing ${category} inventory:`, e);
          inventory[category] = {};
        }
      } else {
        inventory[category] = {};
      }
    }

    console.log('Parsed inventory:', inventory);

    // Special case for Calcium and other vitamins - they should be in inv_items
    if (itemName === 'Calcium' || itemName === 'Protein' || itemName === 'Iron' ||
        itemName === 'Zinc' || itemName === 'Carbos' || itemName === 'HP UP') {
      console.log('Checking for vitamin in inv_items');
      if (inventory.inv_items && inventory.inv_items[itemName]) {
        hasItem = true;
        inventoryCategory = 'inv_items';
        console.log(`Found ${itemName} in inv_items: ${inventory.inv_items[itemName]}`);
      }
    }
    // Special case for Bottle Caps
    else if (itemName === 'Bottle Cap' || itemName === 'Golden Bottle Cap') {
      console.log('Checking for bottle cap in inv_items');
      if (inventory.inv_items && inventory.inv_items[itemName]) {
        hasItem = true;
        inventoryCategory = 'inv_items';
        console.log(`Found ${itemName} in inv_items: ${inventory.inv_items[itemName]}`);
      }
    }
    // Check all categories for other items
    else {
      for (const category of inventoryCategories) {
        console.log(`Checking category ${category} for ${itemName}`);
        if (inventory[category] && inventory[category][itemName] && inventory[category][itemName] > 0) {
          hasItem = true;
          inventoryCategory = category;
          console.log(`Found ${itemName} in ${category}: ${inventory[category][itemName]}`);
          break;
        }
      }
    }

    if (!hasItem) {
      return res.status(400).json({
        success: false,
        message: `You don't have any ${itemName} in your inventory`
      });
    }

    // Process the item use based on item type
    let updateData = {};
    let message = '';

    // Handle Bottle Cap
    if (itemName === 'Bottle Cap') {
      // Get the stat to improve from request
      const { stat } = req.body;
      if (!stat) {
        return res.status(400).json({
          success: false,
          message: 'Missing stat parameter for Bottle Cap'
        });
      }

      // Validate stat
      const validStats = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
      if (!validStats.includes(stat)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid stat parameter'
        });
      }

      // Get current IV value
      const ivField = `${stat}_iv`;
      const currentIV = monster[ivField] || 0;

      // Calculate new IV value (max 31)
      const newIV = Math.min(31, currentIV + 10);

      // Only update if there's an improvement
      if (newIV > currentIV) {
        updateData[ivField] = newIV;
        message = `Increased ${monster.name}'s ${stat.toUpperCase()} IV from ${currentIV} to ${newIV}!`;
      } else {
        return res.status(400).json({
          success: false,
          message: `${monster.name}'s ${stat.toUpperCase()} IV is already at maximum!`
        });
      }
    }
    // Handle Golden Bottle Cap
    else if (itemName === 'Golden Bottle Cap') {
      const stats = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
      let improved = false;

      // Update each stat's IV
      for (const stat of stats) {
        const ivField = `${stat}_iv`;
        const currentIV = monster[ivField] || 0;

        // Calculate new IV value (max 31)
        const newIV = Math.min(31, currentIV + 10);

        if (newIV > currentIV) {
          updateData[ivField] = newIV;
          improved = true;
        }
      }

      if (improved) {
        message = `Increased all of ${monster.name}'s IVs by 10 (max 31)!`;
      } else {
        return res.status(400).json({
          success: false,
          message: `${monster.name}'s IVs are already at maximum!`
        });
      }
    }
    // Handle Vitamins
    else if (['HP UP', 'Protein', 'Iron', 'Calcium', 'Zinc', 'Carbos'].includes(itemName)) {
      let stat;
      switch (itemName) {
        case 'HP UP':
          stat = 'hp';
          break;
        case 'Protein':
          stat = 'atk';
          break;
        case 'Iron':
          stat = 'def';
          break;
        case 'Calcium':
          stat = 'spa';
          break;
        case 'Zinc':
          stat = 'spd';
          break;
        case 'Carbos':
          stat = 'spe';
          break;
      }

      // Get current EV value
      const evField = `${stat}_ev`;
      const currentEV = monster[evField] || 0;

      // Calculate new EV value (max 252)
      const newEV = Math.min(252, currentEV + 10);

      // Only update if there's an improvement
      if (newEV > currentEV) {
        updateData[evField] = newEV;
        message = `Increased ${monster.name}'s ${stat.toUpperCase()} EV from ${currentEV} to ${newEV}!`;
      } else {
        return res.status(400).json({
          success: false,
          message: `${monster.name}'s ${stat.toUpperCase()} EV is already at maximum!`
        });
      }
    }
    else {
      return res.status(400).json({
        success: false,
        message: `Item ${itemName} is not supported for use on monsters`
      });
    }

    // Update monster with the changes
    await Monster.update(monsterId, updateData);

    // Remove item from inventory
    if (inventoryCategory) {
      // Update the parsed inventory
      inventory[inventoryCategory][itemName] = Math.max(0, (inventory[inventoryCategory][itemName] || 0) - 1);

      // Create update object for trainer
      const inventoryUpdate = {};
      inventoryUpdate[inventoryCategory] = JSON.stringify(inventory[inventoryCategory]);

      // Update trainer inventory
      await Trainer.update(trainerId, inventoryUpdate);
    }

    // Return success response
    res.json({
      success: true,
      message: message,
      updatedMonster: await Monster.getById(monsterId)
    });
  } catch (error) {
    console.error('Error using item on monster:', error);
    res.status(500).json({
      success: false,
      message: 'Error using item on monster'
    });
  }
});

// Mount the ability master routes
router.use('/', abilityMasterRouter);

// Mount the held item routes
router.use('/held-item', heldItemRouter);

module.exports = router;
