const express = require('express');
const router = express.Router();
const Trainer = require('../models/Trainer');
const Monster = require('../models/Monster');
const Item = require('../models/Item');
const EvolutionService = require('../utils/EvolutionService');

// Import sub-routers
const trainersRouter = require('./api/trainers');
const farmRouter = require('./api/farm');
const adoptionRouter = require('./api/adoption');
const adoptionTableRouter = require('./api/adoption-table');
const antiquesRouter = require('./api/antiques');
const antiqueAuctionsRouter = require('./api/antique-auctions');
const writingRouter = require('./api/writing');
const artRouter = require('./api/art');
const bossRouter = require('./api/boss');
const missionsRouter = require('./api/missions');
const adventuresRouter = require('./api/adventures');
const adventureRewardsRouter = require('./api/adventure-rewards');
const discordWebhookRouter = require('./api/discord-webhook');
const giftRewardsRouter = require('./api/gift-rewards');
const referenceRouter = require('./api/reference');
const promptRouter = require('./api/prompt');
const megamartRouter = require('./api/megamart');
const abilityMasterRouter = require('./api/ability-master');
const achievementsRouter = require('./api/achievements');
const battlesRouter = require('./api/battles');
const activitiesRouter = require('./api/activities');

// Use sub-routers
router.use('/trainers', trainersRouter);
router.use('/farm', farmRouter);
router.use('/adoption', adoptionRouter);
router.use('/adoption-table', adoptionTableRouter);
router.use('/antiques', antiquesRouter);
router.use('/antique-auctions', antiqueAuctionsRouter);
router.use('/writing', writingRouter);
router.use('/art', artRouter);
router.use('/boss', bossRouter);
router.use('/missions', missionsRouter);
router.use('/adventures', adventuresRouter);
router.use('/adventure-rewards', adventureRewardsRouter);
router.use('/discord-webhook', discordWebhookRouter);
router.use('/gift-rewards', giftRewardsRouter);
router.use('/reference', referenceRouter);
router.use('/prompt', promptRouter);
router.use('/megamart', megamartRouter);
router.use('/ability-master', abilityMasterRouter);
router.use('/battles', battlesRouter);
router.use('/activities', activitiesRouter);
router.use('/', achievementsRouter);

// This route is now handled by the trainers router
// router.get('/trainers/user', async (req, res) => { ... });

// This route is now handled by the trainers router
// router.get('/trainers/:trainerId/monsters', async (req, res) => { ... });

// Get evolution items
router.get('/items/evolution', async (req, res) => {
  try {
    console.log('API route: /items/evolution called');
    // Ensure user is authenticated
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Fetch evolution items
    const items = await Item.getByCategory('evolution');
    console.log(`API route: Found ${items ? items.length : 0} evolution items`);

    // Return the items as JSON
    res.json(items || []);
  } catch (error) {
    console.error('Error fetching evolution items:', error);
    res.status(500).json({ error: 'Failed to fetch evolution items' });
  }
});

// Get trainer's evolution items
router.get('/trainers/:trainerId/items/evolution', async (req, res) => {
  try {
    console.log('API route: /trainers/:trainerId/items/evolution called');
    // Ensure user is authenticated
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const trainerId = req.params.trainerId;
    console.log(`API route: Getting evolution items for trainer with ID: ${trainerId}`);

    // Validate trainerId is a valid integer
    if (!trainerId || isNaN(parseInt(trainerId))) {
      console.error(`API route: Invalid trainer ID: ${trainerId}`);
      return res.status(400).json({ error: 'Invalid trainer ID' });
    }

    const trainerIdInt = parseInt(trainerId);

    // Verify trainer belongs to user
    const discordUserId = req.session.user.discord_id;
    const trainer = await Trainer.getById(trainerIdInt);

    if (!trainer || trainer.player_user_id !== discordUserId) {
      console.error(`API route: User ${discordUserId} does not own trainer ${trainerIdInt}`);
      return res.status(403).json({ error: 'You do not own this trainer' });
    }

    // Get trainer's inventory
    const inventory = await Trainer.getInventory(trainerIdInt);
    console.log('API route: Trainer inventory:', inventory);

    // Get evolution items from inventory
    let evolutionItems = {};
    if (inventory && inventory.inv_evolution) {
      evolutionItems = inventory.inv_evolution;
    }
    console.log('API route: Trainer evolution items:', evolutionItems);

    // Get all evolution items from database
    const allItems = await Item.getByCategory('evolution');
    console.log(`API route: Found ${allItems ? allItems.length : 0} evolution items in database`);

    // Create a list of items with quantities
    let itemsWithQuantity = [];

    // First, add all items from the database
    if (allItems && allItems.length > 0) {
      itemsWithQuantity = allItems.map(item => ({
        ...item,
        quantity: evolutionItems[item.name] || 0
      }));
    }

    // Then, add any items that are in the inventory but not in the database
    if (evolutionItems) {
      for (const [itemName, quantity] of Object.entries(evolutionItems)) {
        // Check if this item is already in the list
        const existingItem = itemsWithQuantity.find(item => item.name === itemName);
        if (!existingItem && quantity > 0) {
          // Add the item to the list
          itemsWithQuantity.push({
            name: itemName,
            effect: 'Evolution item',
            rarity: 'RARE',
            category: 'evolution',
            base_price: 1000,
            quantity: quantity
          });
        }
      }
    }

    console.log(`API route: Combined ${itemsWithQuantity.length} items with quantities:`, itemsWithQuantity);

    // Return the items as JSON
    res.json(itemsWithQuantity || []);
  } catch (error) {
    console.error('Error fetching trainer evolution items:', error);
    res.status(500).json({ error: 'Failed to fetch trainer evolution items' });
  }
});

// Get a monster by ID
router.get('/monsters/:monsterId', async (req, res) => {
  try {
    console.log('API route: /monsters/:monsterId called');
    // Ensure user is authenticated
    if (!req.session.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const monsterId = req.params.monsterId;
    console.log(`API route: Getting monster with ID: ${monsterId}`);

    // Validate monsterId is a valid integer
    if (!monsterId || isNaN(parseInt(monsterId))) {
      console.error(`API route: Invalid monster ID: ${monsterId}`);
      return res.status(400).json({ success: false, message: 'Invalid monster ID' });
    }

    const monsterIdInt = parseInt(monsterId);
    console.log(`API route: Parsed monster ID as integer: ${monsterIdInt}`);

    // Fetch monster
    const monster = await Monster.getById(monsterIdInt);
    console.log(`API route: Monster found:`, monster ? 'Yes' : 'No');

    if (!monster) {
      return res.status(404).json({ success: false, message: 'Monster not found' });
    }

    // Return the monster as JSON
    res.json({
      success: true,
      monster: monster
    });
  } catch (error) {
    console.error('Error fetching monster:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch monster' });
  }
});

// Get evolution options for a monster
router.get('/monsters/:monsterId/evolution-options', async (req, res) => {
  try {
    console.log('API route: /monsters/:monsterId/evolution-options called');
    // Ensure user is authenticated
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const monsterId = req.params.monsterId;
    console.log(`API route: Getting evolution options for monster with ID: ${monsterId}`);

    // Validate monsterId is a valid integer
    if (!monsterId || isNaN(parseInt(monsterId))) {
      console.error(`API route: Invalid monster ID: ${monsterId}`);
      return res.status(400).json({ error: 'Invalid monster ID', canEvolve: false, evolutionOptions: [], source: null, monster: null });
    }

    const monsterIdInt = parseInt(monsterId);
    console.log(`API route: Parsed monster ID as integer: ${monsterIdInt}`);

    // Fetch evolution options for the monster
    const evolutionOptions = await EvolutionService.checkEvolutionOptions(monsterIdInt);
    console.log(`API route: Evolution options:`, evolutionOptions);

    // Return the evolution options as JSON
    res.json(evolutionOptions || { canEvolve: false, evolutionOptions: [], source: null, monster: null });
  } catch (error) {
    console.error('Error fetching evolution options:', error);
    res.status(500).json({ error: 'Failed to fetch evolution options' });
  }
});

// Process monster evolution
router.post('/monsters/:monsterId/evolve', async (req, res) => {
  try {
    console.log('API route: /monsters/:monsterId/evolve called');
    // Ensure user is authenticated
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const monsterId = req.params.monsterId;
    const { trainerId, submissionUrl, useItem, itemName, selectedEvolution, speciesIndex } = req.body;
    console.log(`API route: Processing evolution for monster ${monsterId} with data:`, req.body);

    // Validate monsterId and trainerId are valid integers
    if (!monsterId || isNaN(parseInt(monsterId))) {
      console.error(`API route: Invalid monster ID: ${monsterId}`);
      return res.status(400).json({ success: false, message: 'Invalid monster ID' });
    }

    if (!trainerId || isNaN(parseInt(trainerId))) {
      console.error(`API route: Invalid trainer ID: ${trainerId}`);
      return res.status(400).json({ success: false, message: 'Invalid trainer ID' });
    }

    const monsterIdInt = parseInt(monsterId);
    const trainerIdInt = parseInt(trainerId);
    console.log(`API route: Parsed monster ID as integer: ${monsterIdInt}, trainer ID as integer: ${trainerIdInt}`);

    // Verify trainer belongs to user
    const discordUserId = req.session.user.discord_id;
    const trainer = await Trainer.getById(trainerId);

    if (!trainer || trainer.player_user_id !== discordUserId) {
      console.error(`API route: User ${discordUserId} does not own trainer ${trainerId}`);
      return res.status(403).json({ success: false, message: 'You do not own this trainer' });
    }

    // Verify monster belongs to trainer
    const monster = await Monster.getById(monsterId);

    if (!monster || monster.trainer_id !== parseInt(trainerId)) {
      console.error(`API route: Trainer ${trainerId} does not own monster ${monsterId}`);
      return res.status(403).json({ success: false, message: 'This trainer does not own this monster' });
    }

    // Process evolution
    const result = await EvolutionService.processEvolution({
      monsterId,
      trainerId,
      submissionUrl,
      useItem,
      itemName,
      selectedEvolution,
      speciesIndex
    });

    console.log(`API route: Evolution result:`, result);
    res.json(result);
  } catch (error) {
    console.error('Error processing evolution:', error);
    res.status(500).json({ success: false, message: 'Error processing evolution' });
  }
});

// Process berry feeding in the apothecary
router.post('/apothecary/feed-berry', async (req, res) => {
  try {
    console.log('API route: /apothecary/feed-berry called');
    // Ensure user is authenticated
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { trainerId, monsterId, berryName, selectedType } = req.body;
    console.log(`API route: Processing berry feeding for monster ${monsterId} with berry ${berryName}`);
    console.log('Selected type:', selectedType);

    // Validate inputs
    if (!trainerId || !monsterId || !berryName) {
      return res.status(400).json({ success: false, message: 'Missing required parameters' });
    }

    // Get monster
    const monster = await Monster.getById(monsterId);
    if (!monster) {
      return res.status(404).json({ success: false, message: 'Monster not found' });
    }

    // Get trainer's berry inventory
    const inventory = await Trainer.getInventory(trainerId);
    let berryInventory = {};

    if (inventory && inventory.inv_berries) {
      try {
        if (typeof inventory.inv_berries === 'string') {
          berryInventory = JSON.parse(inventory.inv_berries);
        } else {
          berryInventory = inventory.inv_berries;
        }
      } catch (e) {
        console.error('Error parsing berry inventory:', e);
        return res.status(500).json({ success: false, message: 'Error parsing berry inventory' });
      }
    }

    // Check if trainer has the berry
    if (!berryInventory[berryName] || berryInventory[berryName] <= 0) {
      return res.status(400).json({ success: false, message: `You don't have any ${berryName} in your inventory` });
    }

    // Process berry effect
    const result = await processBerryEffect(monster, berryName, selectedType);

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Update monster with the changes
    await Monster.update(monsterId, result.updateData);

    // Remove berry from inventory
    berryInventory[berryName]--;

    // Update trainer's inventory
    await Trainer.updateInventoryItem(trainerId, 'inv_berries', berryName, -1);

    // Return success response
    res.json({
      success: true,
      message: result.message || `Successfully used ${berryName} on ${monster.name}!`,
      updatedMonster: await Monster.getById(monsterId)
    });
  } catch (error) {
    console.error('Error processing berry feeding:', error);
    res.status(500).json({ success: false, message: 'Error processing berry feeding' });
  }
});

// Use a berry (for rerolling species options)
router.post('/trainers/use-berry', async (req, res) => {
  try {
    console.log('API route: /trainers/use-berry called');
    // Ensure user is authenticated
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { trainerId, berryName } = req.body;
    console.log(`API route: Using berry ${berryName} for trainer ${trainerId}`);

    // Validate inputs
    if (!trainerId || !berryName) {
      return res.status(400).json({ success: false, message: 'Missing required parameters' });
    }

    // Verify trainer belongs to user
    const discordUserId = req.session.user.discord_id;
    const trainer = await Trainer.getById(trainerId);
    if (!trainer || trainer.player_user_id !== discordUserId) {
      return res.status(403).json({ success: false, message: 'You do not own this trainer' });
    }

    // Get trainer's berry inventory
    const inventory = await Trainer.getInventory(trainerId);
    let berryInventory = {};

    if (inventory && inventory.inv_berries) {
      try {
        if (typeof inventory.inv_berries === 'string') {
          berryInventory = JSON.parse(inventory.inv_berries);
        } else {
          berryInventory = inventory.inv_berries;
        }
      } catch (e) {
        console.error('Error parsing berry inventory:', e);
        return res.status(500).json({ success: false, message: 'Error parsing berry inventory' });
      }
    }

    // Check if trainer has the berry
    if (!berryInventory[berryName] || berryInventory[berryName] <= 0) {
      return res.status(400).json({ success: false, message: `You don't have any ${berryName} in your inventory` });
    }

    // Remove berry from inventory
    berryInventory[berryName]--;

    // Update trainer's inventory
    await Trainer.updateInventoryItem(trainerId, 'inv_berries', berryName, -1);

    // Return success response
    res.json({
      success: true,
      message: `Successfully used ${berryName}!`,
      remainingQuantity: berryInventory[berryName]
    });
  } catch (error) {
    console.error('Error using berry:', error);
    res.status(500).json({ success: false, message: 'Error using berry' });
  }
});

// Get random species options for berry feeding
router.get('/apothecary/species-options', async (req, res) => {
  try {
    console.log('API route: /apothecary/species-options called');
    // Ensure user is authenticated
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const MonsterService = require('../utils/MonsterService');

    // Roll 10 random species options
    const options = [];

    // Use MonsterService to roll 10 monsters with default settings
    const monsters = await MonsterService.rollMultiple(10, {
      overrideParams: {
        forceNoFusion: true,  // Ensure we get single-species monsters
        minSpecies: 1,
        maxSpecies: 1
      }
    });

    // Extract species information from each monster
    for (const monster of monsters) {
      if (monster && monster.speciesData && monster.speciesData.length > 0) {
        const speciesData = monster.speciesData[0];
        let speciesName = '';

        if (speciesData.species === 'Pokemon' && speciesData.data.SpeciesName) {
          speciesName = speciesData.data.SpeciesName;
        } else if (speciesData.species === 'Digimon' && speciesData.data.name) {
          speciesName = speciesData.data.name;
        } else if (speciesData.species === 'Yokai' && speciesData.data.Name) {
          speciesName = speciesData.data.Name;
        }

        if (speciesName) {
          options.push({
            name: speciesName,
            type: monster.type1,
            species: speciesData.species
          });
        }
      }
    }

    // Return the options
    res.json({
      success: true,
      options: options
    });
  } catch (error) {
    console.error('Error generating species options:', error);
    res.status(500).json({ success: false, message: 'Error generating species options' });
  }
});

// Helper function to process berry effects
async function processBerryEffect(monster, berryName, selectedType) {
  // Define berry effects
  const berryEffects = {
    'Mala Berry': () => {
      if (!monster.species2) {
        return { success: false, message: 'This monster doesn\'t have a second species.' };
      }
      return {
        success: true,
        message: `Removed second species (${monster.species2}) from ${monster.name}!`,
        updateData: { species2: null }
      };
    },
    'Merco Berry': () => {
      if (!monster.species3) {
        return { success: false, message: 'This monster doesn\'t have a third species.' };
      }
      return {
        success: true,
        message: `Removed third species (${monster.species3}) from ${monster.name}!`,
        updateData: { species3: null }
      };
    },
    'Miraca Berry': () => {
      if (!selectedType) {
        return { success: false, message: 'No type selected for type change.' };
      }
      return {
        success: true,
        message: `Changed type1 from ${monster.type1} to ${selectedType} for ${monster.name}!`,
        updateData: { type1: selectedType }
      };
    },
    'Datei Berry': () => {
      // Get a random attribute
      const attributes = ['Vaccine', 'Data', 'Virus', 'Free', 'Unknown', 'Variable'];
      const randomAttribute = attributes[Math.floor(Math.random() * attributes.length)];

      return {
        success: true,
        message: `Changed attribute from ${monster.attribute || 'None'} to ${randomAttribute} for ${monster.name}!`,
        updateData: { attribute: randomAttribute }
      };
    }
  };

  // Check if berry effect exists
  if (!berryEffects[berryName]) {
    return { success: false, message: `No effect defined for ${berryName}` };
  }

  // Apply berry effect
  return berryEffects[berryName]();
}

// Process pastry feeding in the bakery
router.post('/bakery/feed-pastry', async (req, res) => {
  try {
    console.log('API route: /bakery/feed-pastry called');
    // Ensure user is authenticated
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { trainerId, monsterId, pastryName, customValue } = req.body;
    console.log(`API route: Processing pastry feeding for monster ${monsterId} with pastry ${pastryName}`);
    console.log('Custom value:', customValue);

    // Validate inputs
    if (!trainerId || !monsterId || !pastryName) {
      return res.status(400).json({ success: false, message: 'Missing required parameters' });
    }

    // Get monster
    const monster = await Monster.getById(monsterId);
    if (!monster) {
      return res.status(404).json({ success: false, message: 'Monster not found' });
    }

    // Get trainer's pastry inventory
    const inventory = await Trainer.getInventory(trainerId);
    let pastryInventory = {};

    if (inventory && inventory.inv_pastries) {
      try {
        if (typeof inventory.inv_pastries === 'string') {
          pastryInventory = JSON.parse(inventory.inv_pastries);
        } else {
          pastryInventory = inventory.inv_pastries;
        }
      } catch (e) {
        console.error('Error parsing pastry inventory:', e);
        return res.status(500).json({ success: false, message: 'Error parsing pastry inventory' });
      }
    }

    // Check if trainer has the pastry
    if (!pastryInventory[pastryName] || pastryInventory[pastryName] <= 0) {
      return res.status(400).json({ success: false, message: `You don't have any ${pastryName} in your inventory` });
    }

    // Process pastry effect
    const result = await processPastryEffect(monster, pastryName, customValue);

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Update monster with the changes
    await Monster.update(monsterId, result.updateData);

    // Remove pastry from inventory
    pastryInventory[pastryName]--;

    // Update trainer's inventory
    await Trainer.updateInventoryItem(trainerId, 'inv_pastries', pastryName, -1);

    // Return success response
    res.json({
      success: true,
      message: result.message || `Successfully used ${pastryName} on ${monster.name}!`,
      updatedMonster: await Monster.getById(monsterId)
    });
  } catch (error) {
    console.error('Error processing pastry feeding:', error);
    res.status(500).json({ success: false, message: 'Error processing pastry feeding' });
  }
});

// Helper function to process pastry effects
async function processPastryEffect(monster, pastryName, customValue) {
  // Define pastry effects
  const pastryEffects = {
    'Sweet Bun': () => {
      if (!customValue) {
        return { success: false, message: 'No species name provided.' };
      }
      return {
        success: true,
        message: `Changed primary species of ${monster.name} to ${customValue}!`,
        updateData: { species1: customValue }
      };
    },
    'Cream Puff': () => {
      if (!customValue) {
        return { success: false, message: 'No species name provided.' };
      }
      return {
        success: true,
        message: `Set second species of ${monster.name} to ${customValue}!`,
        updateData: { species2: customValue }
      };
    },
    'Fruit Tart': () => {
      if (!customValue) {
        return { success: false, message: 'No species name provided.' };
      }
      return {
        success: true,
        message: `Set third species of ${monster.name} to ${customValue}!`,
        updateData: { species3: customValue }
      };
    },
    'Spice Cake': () => {
      if (!customValue) {
        return { success: false, message: 'No type provided.' };
      }
      return {
        success: true,
        message: `Changed primary type of ${monster.name} to ${customValue}!`,
        updateData: { type1: customValue }
      };
    },
    'Honey Bread': () => {
      if (!customValue) {
        return { success: false, message: 'No type provided.' };
      }
      return {
        success: true,
        message: `Set secondary type of ${monster.name} to ${customValue}!`,
        updateData: { type2: customValue }
      };
    },
    'Mint Cookie': () => {
      if (!customValue) {
        return { success: false, message: 'No type provided.' };
      }
      return {
        success: true,
        message: `Set third type of ${monster.name} to ${customValue}!`,
        updateData: { type3: customValue }
      };
    },
    'Chocolate Cake': () => {
      if (!customValue) {
        return { success: false, message: 'No type provided.' };
      }
      return {
        success: true,
        message: `Set fourth type of ${monster.name} to ${customValue}!`,
        updateData: { type4: customValue }
      };
    },
    'Berry Pie': () => {
      if (!customValue) {
        return { success: false, message: 'No type provided.' };
      }
      return {
        success: true,
        message: `Set fifth type of ${monster.name} to ${customValue}!`,
        updateData: { type5: customValue }
      };
    },
    'Vanilla Custard': () => {
      if (!customValue) {
        return { success: false, message: 'No attribute provided.' };
      }
      return {
        success: true,
        message: `Set attribute of ${monster.name} to ${customValue}!`,
        updateData: { attribute: customValue }
      };
    },
    'Miraca Pastry': () => {
      if (!customValue) {
        return { success: false, message: 'No type provided.' };
      }
      return {
        success: true,
        message: `Set Type 1 of ${monster.name} to ${customValue}!`,
        updateData: { type1: customValue }
      };
    },
    'Cocon Pastry': () => {
      if (!customValue) {
        return { success: false, message: 'No type provided.' };
      }
      return {
        success: true,
        message: `Set Type 2 of ${monster.name} to ${customValue}!`,
        updateData: { type2: customValue }
      };
    },
    'Durian Pastry': () => {
      if (!customValue) {
        return { success: false, message: 'No type provided.' };
      }
      return {
        success: true,
        message: `Set Type 3 of ${monster.name} to ${customValue}!`,
        updateData: { type3: customValue }
      };
    },
    'Monel Pastry': () => {
      if (!customValue) {
        return { success: false, message: 'No type provided.' };
      }
      return {
        success: true,
        message: `Set Type 4 of ${monster.name} to ${customValue}!`,
        updateData: { type4: customValue }
      };
    },
    'Patama Pastry': () => {
      if (!customValue) {
        return { success: false, message: 'No species name provided.' };
      }
      return {
        success: true,
        message: `Set Species 1 of ${monster.name} to ${customValue}!`,
        updateData: { species1: customValue }
      };
    },
    'Perep Pastry': () => {
      if (!customValue) {
        return { success: false, message: 'No type provided.' };
      }
      return {
        success: true,
        message: `Set Type 5 of ${monster.name} to ${customValue}!`,
        updateData: { type5: customValue }
      };
    },
    'Addish Pastry': () => {
      if (!customValue) {
        return { success: false, message: 'No type provided.' };
      }
      return {
        success: true,
        message: `Added Type 2 to ${monster.name}: ${customValue}!`,
        updateData: { type2: customValue }
      };
    },
    'Sky Carrot Pastry': () => {
      if (!customValue) {
        return { success: false, message: 'No type provided.' };
      }
      return {
        success: true,
        message: `Added Type 3 to ${monster.name}: ${customValue}!`,
        updateData: { type3: customValue }
      };
    },
    'Kembre Pastry': () => {
      if (!customValue) {
        return { success: false, message: 'No type provided.' };
      }
      return {
        success: true,
        message: `Added Type 4 to ${monster.name}: ${customValue}!`,
        updateData: { type4: customValue }
      };
    },
    'Espara Pastry': () => {
      if (!customValue) {
        return { success: false, message: 'No type provided.' };
      }
      return {
        success: true,
        message: `Added Type 5 to ${monster.name}: ${customValue}!`,
        updateData: { type5: customValue }
      };
    },
    'Bluk Pastry': () => {
      if (!customValue) {
        return { success: false, message: 'No species name provided.' };
      }
      return {
        success: true,
        message: `Set Species 2 of ${monster.name} to ${customValue}!`,
        updateData: { species2: customValue }
      };
    },
    'Nuevo Pastry': () => {
      if (!customValue) {
        return { success: false, message: 'No species name provided.' };
      }
      return {
        success: true,
        message: `Set Species 3 of ${monster.name} to ${customValue}!`,
        updateData: { species3: customValue }
      };
    },
    'Azzuk Pastry': () => {
      if (!customValue) {
        return { success: false, message: 'No species name provided.' };
      }
      return {
        success: true,
        message: `Added Species 2 to ${monster.name}: ${customValue}!`,
        updateData: { species2: customValue }
      };
    },
    'Mangus Pastry': () => {
      if (!customValue) {
        return { success: false, message: 'No species name provided.' };
      }
      return {
        success: true,
        message: `Added Species 3 to ${monster.name}: ${customValue}!`,
        updateData: { species3: customValue }
      };
    },
    'Datei Pastry': () => {
      if (!customValue) {
        return { success: false, message: 'No attribute provided.' };
      }
      return {
        success: true,
        message: `Set attribute of ${monster.name} to ${customValue}!`,
        updateData: { attribute: customValue }
      };
    }
  };

  // Check if pastry effect exists
  if (!pastryEffects[pastryName]) {
    return { success: false, message: `No effect defined for ${pastryName}` };
  }

  // Apply pastry effect
  return pastryEffects[pastryName]();
}

// Get berries for a trainer
router.get('/trainers/:trainerId/berries', async (req, res) => {
  try {
    const trainerId = req.params.trainerId;

    // Ensure user is authenticated
    if (!req.session.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    // Get trainer's berry inventory
    const trainer = await Trainer.getById(trainerId);
    if (!trainer) {
      return res.status(404).json({ success: false, message: 'Trainer not found' });
    }

    // Get trainer's berry inventory
    const inventory = await Trainer.getInventory(trainerId);
    let berryInventory = {};

    if (inventory && inventory.inv_berries) {
      try {
        if (typeof inventory.inv_berries === 'string') {
          berryInventory = JSON.parse(inventory.inv_berries);
        } else {
          berryInventory = inventory.inv_berries;
        }
      } catch (e) {
        console.error('Error parsing berry inventory:', e);
        return res.status(500).json({ success: false, message: 'Error parsing berry inventory' });
      }
    }

    // Convert inventory object to array of berry objects
    const berries = Object.entries(berryInventory).map(([name, quantity]) => ({
      id: name,  // Using name as ID since that's what we need
      name: name,
      quantity: parseInt(quantity) || 0
    })).filter(berry => berry.quantity > 0);  // Only include berries with quantity > 0

    res.json({
      success: true,
      berries: berries
    });

  } catch (error) {
    console.error('Error getting trainer berries:', error);
    res.status(500).json({ success: false, message: 'Error getting trainer berries' });
  }
});

// Get pastries for a trainer
router.get('/trainers/:trainerId/pastries', async (req, res) => {
  try {
    console.log('API route: /trainers/:trainerId/pastries called');
    const trainerId = req.params.trainerId;

    // Ensure user is authenticated
    if (!req.session.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    // Get trainer's data
    const trainer = await Trainer.getById(trainerId);
    if (!trainer) {
      return res.status(404).json({ success: false, message: 'Trainer not found' });
    }

    // Get trainer's inventory
    const inventory = await Trainer.getInventory(trainerId);
    let pastryInventory = {};

    if (inventory && inventory.inv_pastries) {
      try {
        if (typeof inventory.inv_pastries === 'string') {
          pastryInventory = JSON.parse(inventory.inv_pastries);
        } else {
          pastryInventory = inventory.inv_pastries;
        }
      } catch (e) {
        console.error('Error parsing pastry inventory:', e);
        return res.status(500).json({ success: false, message: 'Error parsing pastry inventory' });
      }
    }

    console.log('Pastry inventory:', pastryInventory);

    // Convert inventory object to array of pastry objects
    const pastries = Object.entries(pastryInventory).map(([name, quantity]) => ({
      id: name,  // Using name as ID since that's what we need
      name: name,
      quantity: parseInt(quantity) || 0
    })).filter(pastry => pastry.quantity > 0);  // Only include pastries with quantity > 0

    console.log('Converted pastries array:', pastries);

    res.json({
      success: true,
      pastries: pastries
    });

  } catch (error) {
    console.error('Error getting trainer pastries:', error);
    res.status(500).json({ success: false, message: 'Error getting trainer pastries' });
  }
});

module.exports = router;

