const express = require('express');
const router = express.Router();
const pool = require('../../../db');
const Monster = require('../../../models/Monster');
const Trainer = require('../../../models/Trainer');

/**
 * @route GET /api/megamart/check-abilities/:monsterId
 * @desc Check a monster's abilities
 * @access Private
 */
router.get('/check-abilities/:monsterId', async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const { monsterId } = req.params;

    // Validate input
    if (!monsterId) {
      return res.status(400).json({
        success: false,
        message: 'Missing monster ID'
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

    // Verify monster belongs to the user
    if (monster.player_user_id !== req.session.user.discord_id) {
      return res.status(403).json({
        success: false,
        message: 'You do not own this monster'
      });
    }

    // Check if monster has abilities in the mon_abilities table
    const abilityQuery = `
      SELECT * FROM mon_abilities
      WHERE mon_id = $1
    `;
    const abilityResult = await pool.query(abilityQuery, [monsterId]);
    
    let monAbilities = null;
    if (abilityResult.rows.length > 0) {
      monAbilities = abilityResult.rows[0];
    }

    // If monster doesn't have abilities in the table, generate random ones
    if (!monAbilities) {
      // Get random abilities from the abilities table
      const randomAbilitiesQuery = `
        SELECT "AbilityName", "Effect"
        FROM abilities
        ORDER BY RANDOM()
        LIMIT 2
      `;
      const randomAbilitiesResult = await pool.query(randomAbilitiesQuery);
      
      if (randomAbilitiesResult.rows.length < 2) {
        return res.status(500).json({
          success: false,
          message: 'Failed to generate abilities'
        });
      }

      // Insert the random abilities into the mon_abilities table
      const insertAbilitiesQuery = `
        INSERT INTO mon_abilities (mon_id, ability, ability1, ability2)
        VALUES ($1, $2, $2, $3)
        RETURNING *
      `;
      const insertAbilitiesResult = await pool.query(insertAbilitiesQuery, [
        monsterId,
        randomAbilitiesResult.rows[0].AbilityName,
        randomAbilitiesResult.rows[1].AbilityName
      ]);

      monAbilities = insertAbilitiesResult.rows[0];

      // Get ability descriptions
      const ability1Description = randomAbilitiesResult.rows[0].Effect;
      const ability2Description = randomAbilitiesResult.rows[1].Effect;

      return res.json({
        success: true,
        ability: monAbilities.ability,
        ability1: monAbilities.ability1,
        ability2: monAbilities.ability2,
        abilityDescription: ability1Description,
        ability1Description: ability1Description,
        ability2Description: ability2Description
      });
    }

    // Get ability descriptions from the abilities table
    const abilityDescriptionsQuery = `
      SELECT "AbilityName", "Effect"
      FROM abilities
      WHERE "AbilityName" IN ($1, $2, $3)
    `;
    const abilityDescriptionsResult = await pool.query(abilityDescriptionsQuery, [
      monAbilities.ability || '',
      monAbilities.ability1 || '',
      monAbilities.ability2 || ''
    ]);

    // Create a map of ability names to descriptions
    const abilityDescriptions = {};
    abilityDescriptionsResult.rows.forEach(row => {
      abilityDescriptions[row.AbilityName] = row.Effect;
    });

    return res.json({
      success: true,
      ability: monAbilities.ability,
      ability1: monAbilities.ability1,
      ability2: monAbilities.ability2,
      abilityDescription: abilityDescriptions[monAbilities.ability] || 'No description available',
      ability1Description: abilityDescriptions[monAbilities.ability1] || 'No description available',
      ability2Description: abilityDescriptions[monAbilities.ability2] || 'No description available'
    });
  } catch (error) {
    console.error('Error checking monster abilities:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking monster abilities'
    });
  }
});

/**
 * @route GET /api/megamart/all-abilities
 * @desc Get all abilities
 * @access Private
 */
router.get('/all-abilities', async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    // Get all abilities from the abilities table
    const abilitiesQuery = `
      SELECT "AbilityName", "Effect"
      FROM abilities
      ORDER BY "AbilityName"
    `;
    const abilitiesResult = await pool.query(abilitiesQuery);

    return res.json({
      success: true,
      abilities: abilitiesResult.rows
    });
  } catch (error) {
    console.error('Error getting all abilities:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting all abilities'
    });
  }
});

/**
 * @route POST /api/megamart/ability-master
 * @desc Apply an ability item to a monster
 * @access Private
 */
router.post('/ability-master', async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const { trainerId, monsterId, itemName, selectedAbility } = req.body;

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

    // Get the trainer
    const trainer = await Trainer.getById(trainerId);
    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }

    // Verify trainer belongs to user
    if (trainer.player_user_id !== req.session.user.discord_id) {
      return res.status(403).json({
        success: false,
        message: 'You do not own this trainer'
      });
    }

    // Check if trainer has the item
    const inventory = await Trainer.getInventory(trainerId);
    const items = inventory.inv_items || {};
    
    // Parse items if it's a string
    let itemsObj = items;
    if (typeof items === 'string') {
      try {
        itemsObj = JSON.parse(items);
      } catch (e) {
        console.error('Error parsing items JSON:', e);
        itemsObj = {};
      }
    }

    if (!itemsObj[itemName] || itemsObj[itemName] <= 0) {
      return res.status(400).json({
        success: false,
        message: `Trainer does not have ${itemName}`
      });
    }

    // Get monster's abilities
    const abilityQuery = `
      SELECT * FROM mon_abilities
      WHERE mon_id = $1
    `;
    const abilityResult = await pool.query(abilityQuery, [monsterId]);
    
    let monAbilities = null;
    if (abilityResult.rows.length > 0) {
      monAbilities = abilityResult.rows[0];
    } else {
      // If monster doesn't have abilities in the table, generate random ones
      const randomAbilitiesQuery = `
        SELECT "AbilityName"
        FROM abilities
        ORDER BY RANDOM()
        LIMIT 2
      `;
      const randomAbilitiesResult = await pool.query(randomAbilitiesQuery);
      
      if (randomAbilitiesResult.rows.length < 2) {
        return res.status(500).json({
          success: false,
          message: 'Failed to generate abilities'
        });
      }

      // Insert the random abilities into the mon_abilities table
      const insertAbilitiesQuery = `
        INSERT INTO mon_abilities (mon_id, ability, ability1, ability2)
        VALUES ($1, $2, $2, $3)
        RETURNING *
      `;
      const insertAbilitiesResult = await pool.query(insertAbilitiesQuery, [
        monsterId,
        randomAbilitiesResult.rows[0].AbilityName,
        randomAbilitiesResult.rows[1].AbilityName
      ]);

      monAbilities = insertAbilitiesResult.rows[0];
    }

    let newAbility = '';
    let message = '';

    // Apply the item effect
    if (itemName === 'Ability Capsule') {
      // Switch between Ability 1 and Ability 2
      if (monAbilities.ability === monAbilities.ability1) {
        newAbility = monAbilities.ability2;
        message = `Changed ${monster.name}'s ability from ${monAbilities.ability1} to ${monAbilities.ability2}`;
      } else {
        newAbility = monAbilities.ability1;
        message = `Changed ${monster.name}'s ability from ${monAbilities.ability} to ${monAbilities.ability1}`;
      }
    } else if (itemName === 'Scroll of Secrets') {
      // Set any ability
      if (!selectedAbility) {
        return res.status(400).json({
          success: false,
          message: 'Missing selected ability'
        });
      }

      // Verify the ability exists
      const abilityExistsQuery = `
        SELECT "AbilityName" FROM abilities
        WHERE "AbilityName" = $1
      `;
      const abilityExistsResult = await pool.query(abilityExistsQuery, [selectedAbility]);
      
      if (abilityExistsResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid ability selected'
        });
      }

      newAbility = selectedAbility;
      message = `Changed ${monster.name}'s ability to ${selectedAbility}`;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid item'
      });
    }

    // Update the monster's ability
    const updateAbilityQuery = `
      UPDATE mon_abilities
      SET ability = $1, updated_at = CURRENT_TIMESTAMP
      WHERE mon_id = $2
      RETURNING *
    `;
    await pool.query(updateAbilityQuery, [newAbility, monsterId]);

    // Remove the item from the trainer's inventory
    itemsObj[itemName] = Math.max(0, (itemsObj[itemName] || 0) - 1);
    
    // Update the trainer's inventory
    const inventoryUpdate = {
      inv_items: JSON.stringify(itemsObj)
    };
    await Trainer.update(trainerId, inventoryUpdate);

    return res.json({
      success: true,
      message: message
    });
  } catch (error) {
    console.error('Error applying ability item:', error);
    return res.status(500).json({
      success: false,
      message: 'Error applying ability item'
    });
  }
});

module.exports = router;
