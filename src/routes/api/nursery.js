const express = require('express');
const router = express.Router();
const MonsterRoller = require('../../utils/MonsterRoller');
const Trainer = require('../../models/Trainer');
const { EGG_ITEMS, validateItems } = require('./items');

/**
 * Process egg items and create roller options
 * @param {Array} items - Array of items with their parameters
 * @returns {Object} - MonsterRoller options
 */
function processEggItems(items) {
  const options = {
    overrideParams: {},
    filters: {
      pokemon: {},
      digimon: {},
      yokai: {},
      excludeSpecies: []
    },
    skipArtSubmission: false,
    extraClaims: 0
  };

  for (const item of items) {
    const itemDef = Object.values(EGG_ITEMS)
      .flat()
      .find(i => i.id === item.id);

    if (!itemDef) continue;

    // Handle special items
    if (itemDef.id === 'incubator') {
      options.skipArtSubmission = true;
      continue;
    }

    if (itemDef.id === 'dna_splicer') {
      options.extraClaims += 1;
      continue;
    }

    // Get item effect
    let effect = itemDef.effect;
    if (typeof effect === 'function') {
      if (itemDef.requiresMultipleSpecies) {
        effect = effect(item.species);
      } else if (itemDef.requiresType) {
        effect = effect(item.type);
      } else if (itemDef.requiresAttribute) {
        effect = effect(item.attribute);
      } else if (itemDef.requiresRank) {
        effect = effect(item.rank);
      }
    }

    // Merge effect into options
    if (effect.overrideParams) {
      options.overrideParams = {
        ...options.overrideParams,
        ...effect.overrideParams
      };
    }

    if (effect.filters) {
      for (const [key, value] of Object.entries(effect.filters)) {
        if (key === 'excludeSpecies') {
          options.filters.excludeSpecies.push(...value);
        } else {
          options.filters[key] = {
            ...options.filters[key],
            ...value
          };
        }
      }
    }
  }

  return options;
}

/**
 * Get egg count for a trainer
 * GET /api/nursery/eggs?trainerId=123
 */
router.get('/eggs', async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.session.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const { trainerId } = req.query;

    // Validate trainerId
    if (!trainerId || isNaN(parseInt(trainerId))) {
      return res.status(400).json({ success: false, message: 'Invalid trainer ID' });
    }

    // Get trainer
    const trainer = await Trainer.getById(trainerId);
    if (!trainer) {
      return res.status(404).json({ success: false, message: 'Trainer not found' });
    }

    // Get egg count from inventory
    const inventory = await Trainer.getInventory(trainerId);
    const eggCount = inventory && inventory.inv_eggs && inventory.inv_eggs['Standard Egg']
      ? parseInt(inventory.inv_eggs['Standard Egg'])
      : 0;

    // Return egg count
    res.json({
      success: true,
      eggCount,
      trainerName: trainer.name
    });
  } catch (error) {
    console.error('Error getting egg count:', error);
    res.status(500).json({ success: false, message: 'Error getting egg count' });
  }
});

/**
 * Process egg hatching
 * POST /api/nursery/hatch
 */
router.post('/hatch', async (req, res) => {
  try {
    const { trainerId, items = [], eggs = [] } = req.body;

    // Validate items
    const validation = validateItems(items);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Invalid item combination',
        details: validation.errors
      });
    }

    // Process items and create options
    const options = processEggItems(items);

    // Create roller instance
    const roller = new MonsterRoller(options);

    // Roll monsters
    const monsters = await roller.rollMultiple(eggs.length);

    // Calculate total claims allowed
    const maxClaims = eggs.length + options.extraClaims;

    return res.json({
      success: true,
      data: {
        monsters,
        maxClaims,
        requiresArtSubmission: !options.skipArtSubmission
      }
    });

  } catch (error) {
    console.error('Error processing egg hatching:', error);
    return res.status(500).json({ error: 'Error processing egg hatching' });
  }
});

/**
 * Claim hatched monsters
 * POST /api/nursery/claim
 */
router.post('/claim', async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.session.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const { trainerId, monsters } = req.body;

    // Validate trainerId
    if (!trainerId || isNaN(parseInt(trainerId))) {
      return res.status(400).json({ success: false, message: 'Invalid trainer ID' });
    }

    // Validate monsters
    if (!monsters || !Array.isArray(monsters) || monsters.length === 0) {
      return res.status(400).json({ success: false, message: 'No monsters to claim' });
    }

    // Process monster claiming
    const result = await EggHatchingService.claimHatchedMonsters(trainerId, monsters);

    // Return result
    res.json(result);
  } catch (error) {
    console.error('Error claiming hatched monsters:', error);
    res.status(500).json({ success: false, message: 'Error claiming hatched monsters' });
  }
});

module.exports = router;


