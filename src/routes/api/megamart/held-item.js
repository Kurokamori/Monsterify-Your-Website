const express = require('express');
const router = express.Router();
const pool = require('../../../db');
const Monster = require('../../../models/Monster');
const Trainer = require('../../../models/Trainer');

/**
 * @route POST /api/megamart/held-item
 * @desc Apply held item changes to a monster
 * @access Private
 */
router.post('/', async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const { trainerId, monsterId, action, itemName } = req.body;

    // Validate input
    if (!trainerId || !monsterId || !action) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters'
      });
    }

    if (action === 'give' && !itemName) {
      return res.status(400).json({
        success: false,
        message: 'Missing item name for give action'
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

    // Get the trainer
    const trainer = await Trainer.getById(trainerId);
    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }

    // Verify trainer belongs to user
    const trainerUserId = String(trainer.player_user_id || '');
    const sessionUserId = String(req.session.user.discord_id || '');
    
    console.log('Trainer player_user_id:', trainerUserId);
    console.log('Session discord_id:', sessionUserId);
    
    if (trainerUserId !== sessionUserId) {
      return res.status(403).json({
        success: false,
        message: 'You do not own this trainer'
      });
    }

    // Verify monster belongs to trainer
    const monsterTrainerId = parseInt(monster.trainer_id || 0);
    const requestedTrainerId = parseInt(trainerId || 0);
    
    console.log('Monster trainer_id:', monsterTrainerId);
    console.log('Requested trainer_id:', requestedTrainerId);
    
    if (monsterTrainerId !== requestedTrainerId) {
      return res.status(403).json({
        success: false,
        message: 'This trainer does not own this monster'
      });
    }

    // Get trainer inventory
    const inventory = await Trainer.getInventory(trainerId);
    
    // Define item effects and their stat impacts
    const ITEM_EFFECTS = {
      'Assault Vest': (monster) => {
        const defBoost = Math.floor(monster.level / 4);
        return { def_ev: defBoost };
      },
      'Eviolite': (monster) => {
        const boost = Math.floor(4 * monster.level / 10);
        return { def_ev: boost, spdef_ev: boost };
      },
      'Macho Brace': (monster) => {
        const boost = Math.floor(monster.speed_ev / 2);
        return { atk_ev: boost, spatk_ev: boost };
      },
      'Power Anklet': () => {
        return { speed_ev: 2, speed_iv: -2 };
      },
      'Power Band': () => {
        return { spdef_ev: 2, speed_iv: -2 };
      },
      'Power Belt': () => {
        return { def_ev: 2, speed_iv: -2 };
      },
      'Power Bracer': () => {
        return { atk_ev: 2, speed_iv: -2 };
      },
      'Power Lens': () => {
        return { spatk_ev: 2, speed_iv: -2 };
      },
      'Power Weight': () => {
        return { hp_ev: 2, speed_iv: -2 };
      },
      'Quick Claw': () => {
        return { speed_iv: 2 };
      },
      'Offense Plugin A': () => {
        return { atk_iv: 1, spatk_iv: 1 };
      },
      'Offense Plugin X': () => {
        return { atk_iv: 3, spatk_iv: 3 };
      },
      'Defence Plugin A': () => {
        return { def_iv: 3, spdef_iv: 3 };
      },
      'Defence Plugin X': () => {
        return { def_iv: 3, spdef_iv: 3 };
      },
      'Speed Plugin B': () => {
        return { speed_iv: 1 };
      },
      'Speed Plugin EX': () => {
        return { speed_iv: 4 };
      },
      'Miracle Charm': () => {
        return { hp_iv: 1, atk_iv: 1, def_iv: 1, spatk_iv: 1, spdef_iv: 1, speed_iv: 1 };
      },
      'Spirit Ring': () => {
        return { atk_iv: 2, spatk_iv: 2 };
      },
      'Brute Bracer': () => {
        return { atk_ev: 2 };
      },
      'Guard Glorifier': () => {
        return { def_ev: 2 };
      },
      'Runic Charm': () => {
        return { spatk_ev: 2, spdef_ev: 2 };
      },
      'Tough Bell': () => {
        return { def_ev: 4 };
      },
      'Rough Whetstone': () => {
        return { atk_ev: 2, spatk_ev: 2, def_ev: -2 };
      },
      'Fiend Badge': () => {
        return { atk_ev: 4, spatk_ev: 4, speed_ev: -2 };
      },
      'General\'s Soul': () => {
        return { atk_ev: 8, spatk_ev: 8, speed_ev: -6 };
      }
    };

    if (action === 'remove') {
      // Check if monster has a held item
      if (!monster.held_item) {
        return res.status(400).json({
          success: false,
          message: 'This monster is not holding any item'
        });
      }

      const oldHeldItem = monster.held_item;

      // Remove held item effect if it exists
      if (ITEM_EFFECTS[oldHeldItem]) {
        // Get the stat changes from the item
        const statChanges = ITEM_EFFECTS[oldHeldItem](monster);
        
        // Reverse the stat changes
        const updates = {};
        
        if (statChanges.hp_ev) updates.hp_ev = Math.max(0, monster.hp_ev - statChanges.hp_ev);
        if (statChanges.atk_ev) updates.atk_ev = Math.max(0, monster.atk_ev - statChanges.atk_ev);
        if (statChanges.def_ev) updates.def_ev = Math.max(0, monster.def_ev - statChanges.def_ev);
        if (statChanges.spatk_ev) updates.spatk_ev = Math.max(0, monster.spatk_ev - statChanges.spatk_ev);
        if (statChanges.spdef_ev) updates.spdef_ev = Math.max(0, monster.spdef_ev - statChanges.spdef_ev);
        if (statChanges.speed_ev) updates.speed_ev = Math.max(0, monster.speed_ev - statChanges.speed_ev);
        
        if (statChanges.hp_iv) updates.hp_iv = Math.max(0, monster.hp_iv - statChanges.hp_iv);
        if (statChanges.atk_iv) updates.atk_iv = Math.max(0, monster.atk_iv - statChanges.atk_iv);
        if (statChanges.def_iv) updates.def_iv = Math.max(0, monster.def_iv - statChanges.def_iv);
        if (statChanges.spatk_iv) updates.spatk_iv = Math.max(0, monster.spatk_iv - statChanges.spatk_iv);
        if (statChanges.spdef_iv) updates.spdef_iv = Math.max(0, monster.spdef_iv - statChanges.spdef_iv);
        if (statChanges.speed_iv) updates.speed_iv = Math.max(0, monster.speed_iv - statChanges.speed_iv);
        
        // Update monster stats
        await Monster.update(monsterId, updates);
      }

      // Remove held item from monster
      await Monster.update(monsterId, { held_item: null });

      // Add the item back to trainer's inventory
      const heldItems = inventory.inv_helditems || {};
      
      // Parse items if it's a string
      let itemsObj = heldItems;
      if (typeof heldItems === 'string') {
        try {
          itemsObj = JSON.parse(heldItems);
        } catch (e) {
          console.error('Error parsing held items JSON:', e);
          itemsObj = {};
        }
      }
      
      // Add the item back to inventory
      itemsObj[oldHeldItem] = (itemsObj[oldHeldItem] || 0) + 1;
      
      // Update trainer inventory
      await Trainer.update(trainerId, {
        inv_helditems: JSON.stringify(itemsObj)
      });

      return res.json({
        success: true,
        message: `Removed ${oldHeldItem} from ${monster.name} and returned it to ${trainer.name}'s inventory.`
      });
    } else if (action === 'give') {
      // Check if trainer has the item
      const heldItems = inventory.inv_helditems || {};
      
      // Parse items if it's a string
      let itemsObj = heldItems;
      if (typeof heldItems === 'string') {
        try {
          itemsObj = JSON.parse(heldItems);
        } catch (e) {
          console.error('Error parsing held items JSON:', e);
          itemsObj = {};
        }
      }
      
      if (!itemsObj[itemName] || itemsObj[itemName] <= 0) {
        return res.status(400).json({
          success: false,
          message: `Trainer does not have ${itemName}`
        });
      }

      // If monster already has a held item, remove its effect
      if (monster.held_item && ITEM_EFFECTS[monster.held_item]) {
        // Get the stat changes from the old item
        const oldStatChanges = ITEM_EFFECTS[monster.held_item](monster);
        
        // Reverse the stat changes
        const reverseUpdates = {};
        
        if (oldStatChanges.hp_ev) reverseUpdates.hp_ev = Math.max(0, monster.hp_ev - oldStatChanges.hp_ev);
        if (oldStatChanges.atk_ev) reverseUpdates.atk_ev = Math.max(0, monster.atk_ev - oldStatChanges.atk_ev);
        if (oldStatChanges.def_ev) reverseUpdates.def_ev = Math.max(0, monster.def_ev - oldStatChanges.def_ev);
        if (oldStatChanges.spatk_ev) reverseUpdates.spatk_ev = Math.max(0, monster.spatk_ev - oldStatChanges.spatk_ev);
        if (oldStatChanges.spdef_ev) reverseUpdates.spdef_ev = Math.max(0, monster.spdef_ev - oldStatChanges.spdef_ev);
        if (oldStatChanges.speed_ev) reverseUpdates.speed_ev = Math.max(0, monster.speed_ev - oldStatChanges.speed_ev);
        
        if (oldStatChanges.hp_iv) reverseUpdates.hp_iv = Math.max(0, monster.hp_iv - oldStatChanges.hp_iv);
        if (oldStatChanges.atk_iv) reverseUpdates.atk_iv = Math.max(0, monster.atk_iv - oldStatChanges.atk_iv);
        if (oldStatChanges.def_iv) reverseUpdates.def_iv = Math.max(0, monster.def_iv - oldStatChanges.def_iv);
        if (oldStatChanges.spatk_iv) reverseUpdates.spatk_iv = Math.max(0, monster.spatk_iv - oldStatChanges.spatk_iv);
        if (oldStatChanges.spdef_iv) reverseUpdates.spdef_iv = Math.max(0, monster.spdef_iv - oldStatChanges.spdef_iv);
        if (oldStatChanges.speed_iv) reverseUpdates.speed_iv = Math.max(0, monster.speed_iv - oldStatChanges.speed_iv);
        
        // Update monster stats to remove old item effect
        await Monster.update(monsterId, reverseUpdates);
        
        // Add the old item back to inventory
        itemsObj[monster.held_item] = (itemsObj[monster.held_item] || 0) + 1;
      }

      // Apply new item effect if it exists
      if (ITEM_EFFECTS[itemName]) {
        // Get the stat changes from the new item
        const newStatChanges = ITEM_EFFECTS[itemName](monster);
        
        // Apply the stat changes
        const updates = { held_item: itemName };
        
        if (newStatChanges.hp_ev) updates.hp_ev = Math.min(252, (monster.hp_ev || 0) + newStatChanges.hp_ev);
        if (newStatChanges.atk_ev) updates.atk_ev = Math.min(252, (monster.atk_ev || 0) + newStatChanges.atk_ev);
        if (newStatChanges.def_ev) updates.def_ev = Math.min(252, (monster.def_ev || 0) + newStatChanges.def_ev);
        if (newStatChanges.spatk_ev) updates.spatk_ev = Math.min(252, (monster.spatk_ev || 0) + newStatChanges.spatk_ev);
        if (newStatChanges.spdef_ev) updates.spdef_ev = Math.min(252, (monster.spdef_ev || 0) + newStatChanges.spdef_ev);
        if (newStatChanges.speed_ev) updates.speed_ev = Math.min(252, (monster.speed_ev || 0) + newStatChanges.speed_ev);
        
        if (newStatChanges.hp_iv) updates.hp_iv = Math.min(31, Math.max(0, (monster.hp_iv || 0) + newStatChanges.hp_iv));
        if (newStatChanges.atk_iv) updates.atk_iv = Math.min(31, Math.max(0, (monster.atk_iv || 0) + newStatChanges.atk_iv));
        if (newStatChanges.def_iv) updates.def_iv = Math.min(31, Math.max(0, (monster.def_iv || 0) + newStatChanges.def_iv));
        if (newStatChanges.spatk_iv) updates.spatk_iv = Math.min(31, Math.max(0, (monster.spatk_iv || 0) + newStatChanges.spatk_iv));
        if (newStatChanges.spdef_iv) updates.spdef_iv = Math.min(31, Math.max(0, (monster.spdef_iv || 0) + newStatChanges.spdef_iv));
        if (newStatChanges.speed_iv) updates.speed_iv = Math.min(31, Math.max(0, (monster.speed_iv || 0) + newStatChanges.speed_iv));
        
        // Update monster stats and held item
        await Monster.update(monsterId, updates);
      } else {
        // Just update the held item
        await Monster.update(monsterId, { held_item: itemName });
      }

      // Remove the item from trainer's inventory
      itemsObj[itemName] = Math.max(0, (itemsObj[itemName] || 0) - 1);
      
      // Update trainer inventory
      await Trainer.update(trainerId, {
        inv_helditems: JSON.stringify(itemsObj)
      });

      const message = monster.held_item
        ? `Replaced ${monster.held_item} with ${itemName} for ${monster.name}.`
        : `Gave ${itemName} to ${monster.name}.`;

      return res.json({
        success: true,
        message
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid action'
      });
    }
  } catch (error) {
    console.error('Error applying held item changes:', error);
    return res.status(500).json({
      success: false,
      message: 'Error applying held item changes'
    });
  }
});

module.exports = router;
