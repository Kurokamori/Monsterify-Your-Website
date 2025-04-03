const express = require('express');
const router = express.Router();
const Trainer = require('../../models/Trainer');
const Monster = require('../../models/Monster');
const MonsterRoller = require('../../utils/MonsterRoller');
const MonsterService = require('../../utils/MonsterService');

/**
 * @route GET /api/nurture/eggs
 * @desc Get egg count and available items for a trainer
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
    const inventory = await Trainer.getInventory(trainerId) || {};
    console.log('Trainer inventory:', JSON.stringify(inventory, null, 2));

    // If inventory is empty, try to get the trainer directly
    if (Object.keys(inventory).length === 0) {
      console.log('Inventory is empty, getting trainer directly');
      const trainer = await Trainer.getById(trainerId);
      console.log('Trainer:', JSON.stringify(trainer, null, 2));

      // Check if trainer has a flat inventory
      if (trainer && trainer.inventory) {
        try {
          const parsedInventory = JSON.parse(trainer.inventory);
          console.log('Parsed trainer inventory:', JSON.stringify(parsedInventory, null, 2));

          // Use the parsed inventory
          Object.assign(inventory, parsedInventory);
        } catch (e) {
          console.error('Error parsing trainer inventory:', e);
        }
      }
    }

    // Check if inventory is a flat structure instead of categorized
    let flatInventory = false;
    if (inventory['Standard Egg'] !== undefined) {
      flatInventory = true;
      console.log('Detected flat inventory structure');
    }

    // Check for Standard Egg
    let eggCount = 0;
    if (flatInventory) {
      eggCount = inventory['Standard Egg'] || 0;
    } else if (inventory.inv_eggs) {
      eggCount = inventory.inv_eggs['Standard Egg'] || 0;
    }

    // Check for incubator
    let hasIncubator = false;
    if (flatInventory) {
      hasIncubator = inventory['Incubator'] > 0;
    } else if (inventory.inv_items) {
      hasIncubator = inventory.inv_items['Incubator'] > 0;
    }

    // Get all available nurture items
    const nurtureItems = {
      // Pool influence items
      rankIncense: getInventoryItems(inventory, 'inv_eggs', ['S Rank Incense', 'A Rank Incense', 'B Rank Incense', 'C Rank Incense', 'D Rank Incense', 'E Rank Incense']),
      colorIncense: getInventoryItems(inventory, 'inv_eggs', ['Restoration Color Incense', 'Mysterious Color Incense', 'Tough Color Incense', 'Heartful Color Incense', 'Shady Color Incense', 'Eerie Color Incense', 'Charming Color Incense', 'Slippery Color Incense']),
      typePoffins: getInventoryItems(inventory, 'inv_eggs', ['Normal Poffin', 'Fire Poffin', 'Water Poffin', 'Electric Poffin', 'Grass Poffin', 'Ice Poffin', 'Fighting Poffin', 'Poison Poffin', 'Ground Poffin', 'Flying Poffin', 'Psychic Poffin', 'Bug Poffin', 'Rock Poffin', 'Ghost Poffin', 'Dragon Poffin', 'Dark Poffin', 'Steel Poffin', 'Fairy Poffin']),
      digimonFilters: getInventoryItems(inventory, 'inv_eggs', ['DigiMeat', 'DigiTofu', 'Digi Meat', 'Digi Tofu']),
      pokemonFilters: getInventoryItems(inventory, 'inv_eggs', ['Broken Bell', 'Spell Tag', 'BrokenBell', 'SpellTag']),
      digimonAttributes: getInventoryItems(inventory, 'inv_eggs', ['Data', 'Vaccine', 'Virus', 'Free', 'Variable']),
      digimonKinds: getInventoryItems(inventory, 'inv_eggs', []),

      // Outcome influence items
      nurtureKits: getInventoryItems(inventory, 'inv_eggs', [
        'Normal Nurture Kit', 'Fire Nurture Kit', 'Water Nurture Kit', 'Electric Nurture Kit',
        'Grass Nurture Kit', 'Ice Nurture Kit', 'Fighting Nurture Kit', 'Poison Nurture Kit',
        'Ground Nurture Kit', 'Flying Nurture Kit', 'Psychic Nurture Kit', 'Bug Nurture Kit',
        'Rock Nurture Kit', 'Ghost Nurture Kit', 'Dragon Nurture Kit', 'Dark Nurture Kit',
        'Steel Nurture Kit', 'Fairy Nurture Kit',
        // No-space versions
        'NormalNurtureKit', 'FireNurtureKit', 'WaterNurtureKit', 'ElectricNurtureKit',
        'GrassNurtureKit', 'IceNurtureKit', 'FightingNurtureKit', 'PoisonNurtureKit',
        'GroundNurtureKit', 'FlyingNurtureKit', 'PsychicNurtureKit', 'BugNurtureKit',
        'RockNurtureKit', 'GhostNurtureKit', 'DragonNurtureKit', 'DarkNurtureKit',
        'SteelNurtureKit', 'FairyNurtureKit'
      ]),
      attributeCodes: getInventoryItems(inventory, 'inv_eggs', ['Corruption Code', 'Repair Code', 'Shiny New Code', 'CorruptionCode', 'RepairCode', 'ShinyNewCode']),
      milks: getInventoryItems(inventory, 'inv_eggs', ['Hot Chocolate', 'Vanilla Milk', 'Chocolate Milk', 'Strawberry Milk', 'MooMoo Milk', 'HotChocolate', 'VanillaMilk', 'ChocolateMilk', 'StrawberryMilk', 'MooMooMilk']),

      // Ice creams
      iceCreams: getInventoryItems(inventory, 'inv_eggs', ['Vanilla Ice Cream', 'Strawberry Ice Cream', 'Chocolate Ice Cream', 'Mint Ice Cream', 'Pecan Ice Cream', 'VanillaIceCream', 'StrawberryIceCream', 'ChocolateIceCream', 'MintIceCream', 'PecanIceCream']),

      // Species selection items
      speciesItems: getInventoryItems(inventory, 'inv_eggs', ['Input Field', 'Drop Down', 'Radio Buttons', 'InputField', 'DropDown', 'RadioButtons'])
    };

    // Normalize item names to ensure consistent display
    Object.entries(nurtureItems).forEach(([category, items]) => {
      // Create a new object with normalized keys
      const normalizedItems = {};

      // Map of no-space to spaced item names
      const itemNameMap = {
        'DigiMeat': 'Digi Meat',
        'DigiTofu': 'Digi Tofu',
        'SpellTag': 'Spell Tag',
        'BrokenBell': 'Broken Bell',
        'FireNurtureKit': 'Fire Nurture Kit',
        'WaterNurtureKit': 'Water Nurture Kit',
        'GrassNurtureKit': 'Grass Nurture Kit',
        'ElectricNurtureKit': 'Electric Nurture Kit',
        'IceNurtureKit': 'Ice Nurture Kit',
        'FightingNurtureKit': 'Fighting Nurture Kit',
        'PoisonNurtureKit': 'Poison Nurture Kit',
        'GroundNurtureKit': 'Ground Nurture Kit',
        'FlyingNurtureKit': 'Flying Nurture Kit',
        'PsychicNurtureKit': 'Psychic Nurture Kit',
        'BugNurtureKit': 'Bug Nurture Kit',
        'RockNurtureKit': 'Rock Nurture Kit',
        'GhostNurtureKit': 'Ghost Nurture Kit',
        'DragonNurtureKit': 'Dragon Nurture Kit',
        'DarkNurtureKit': 'Dark Nurture Kit',
        'SteelNurtureKit': 'Steel Nurture Kit',
        'FairyNurtureKit': 'Fairy Nurture Kit',
        'HotChocolate': 'Hot Chocolate',
        'VanillaMilk': 'Vanilla Milk',
        'ChocolateMilk': 'Chocolate Milk',
        'StrawberryMilk': 'Strawberry Milk',
        'MooMooMilk': 'MooMoo Milk',
        'VanillaIceCream': 'Vanilla Ice Cream',
        'StrawberryIceCream': 'Strawberry Ice Cream',
        'ChocolateIceCream': 'Chocolate Ice Cream',
        'MintIceCream': 'Mint Ice Cream',
        'PecanIceCream': 'Pecan Ice Cream',
        'InputField': 'Input Field',
        'DropDown': 'Drop Down',
        'RadioButtons': 'Radio Buttons'
      };

      // Also create a reverse map for spaced to no-space
      const reverseItemNameMap = {};
      Object.entries(itemNameMap).forEach(([noSpace, spaced]) => {
        reverseItemNameMap[spaced] = noSpace;
      });

      // Process each item
      Object.entries(items).forEach(([itemName, count]) => {
        if (count > 0) {
          // Check if this is a no-space version
          if (itemNameMap[itemName]) {
            // Use the spaced version
            const spacedName = itemNameMap[itemName];
            normalizedItems[spacedName] = (normalizedItems[spacedName] || 0) + count;
          } else if (reverseItemNameMap[itemName]) {
            // This is already a spaced version, but we'll use it consistently
            normalizedItems[itemName] = (normalizedItems[itemName] || 0) + count;
          } else {
            // Use the original name
            normalizedItems[itemName] = (normalizedItems[itemName] || 0) + count;
          }
        }
      });

      // Special case for digimonFilters - we need to handle both 'Digi Tofu' and 'DigiTofu'
      if (category === 'digimonFilters') {
        // If we have both versions, combine them
        if (items['Digi Tofu'] > 0 && items['DigiTofu'] > 0) {
          normalizedItems['Digi Tofu'] = items['Digi Tofu'] + items['DigiTofu'];
          delete normalizedItems['DigiTofu'];
        }
        if (items['Digi Meat'] > 0 && items['DigiMeat'] > 0) {
          normalizedItems['Digi Meat'] = items['Digi Meat'] + items['DigiMeat'];
          delete normalizedItems['DigiMeat'];
        }
      }

      // Replace the original items with normalized ones
      nurtureItems[category] = normalizedItems;
    });

    console.log('Normalized nurture items:', nurtureItems);

    res.json({
      success: true,
      eggCount,
      hasIncubator,
      nurtureItems,
      trainerName: trainer.name
    });
  } catch (error) {
    console.error('Error getting nurture data:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting nurture data'
    });
  }
});

/**
 * @route POST /api/nurture/hatch
 * @desc Nurture an egg with selected items
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

    const {
      trainerId,
      useIncubator,
      submissionUrl,
      useForgetMeNot, // Add useForgetMeNot parameter
      // Pool influence items
      rankIncense,
      colorIncense,
      typePoffins,
      digimonFilters,
      pokemonFilters,
      digimonAttributes,
      digimonKinds,

      // Outcome influence items
      nurtureKits,
      attributeCodes,
      milks,

      // Ice creams and their values
      iceCreams,
      iceCreamValues,

      // Species selection items and their values
      speciesItems,
      speciesValues
    } = req.body;

    console.log('Nurture egg request parameters:', {
      trainerId,
      useIncubator,
      useForgetMeNot,
      hasSubmissionUrl: !!submissionUrl
    });

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
    const inventory = await Trainer.getInventory(trainerId) || {};
    console.log('Trainer inventory for nurture:', inventory);

    // Check if inventory is a flat structure instead of categorized
    let flatInventory = false;
    if (inventory['Standard Egg'] !== undefined) {
      flatInventory = true;
      console.log('Detected flat inventory structure for nurture');
    }

    // Check for Standard Egg
    let eggCount = 0;
    if (flatInventory) {
      eggCount = inventory['Standard Egg'] || 0;
    } else if (inventory.inv_eggs) {
      eggCount = inventory.inv_eggs['Standard Egg'] || 0;
    }

    if (eggCount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'This trainer has no eggs to hatch'
      });
    }

    // If using incubator, check if trainer has one
    if (useIncubator) {
      let hasIncubator = false;
      if (flatInventory) {
        hasIncubator = inventory['Incubator'] > 0;
      } else if (inventory && inventory.inv_items) {
        hasIncubator = inventory.inv_items['Incubator'] > 0;
      }

      if (!hasIncubator) {
        return res.status(400).json({
          success: false,
          message: 'This trainer does not have an incubator'
        });
      }
    } else {
      // If not using incubator, ensure submission URL is provided (unless using Forget-Me-Not)
      if (!submissionUrl && !useForgetMeNot) {
        return res.status(400).json({
          success: false,
          message: 'Submission URL is required when not using an incubator'
        });
      }
    }

    // Check if using Forget-Me-Not
    if (useForgetMeNot) {
      // Check if trainer has Forget-Me-Not
      let forgetMeNotCount = 0;

      // Check in inv_eggs
      if (inventory.inv_eggs && inventory.inv_eggs['Forget-Me-Not']) {
        forgetMeNotCount += inventory.inv_eggs['Forget-Me-Not'];
      }

      // Also check in inv_berries for backward compatibility
      if (inventory.inv_berries && inventory.inv_berries['Forget-Me-Not']) {
        forgetMeNotCount += inventory.inv_berries['Forget-Me-Not'];
      }

      console.log(`Trainer has ${forgetMeNotCount} Forget-Me-Not items`);

      if (forgetMeNotCount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'This trainer does not have any Forget-Me-Not items'
        });
      }

      // Use one Forget-Me-Not (prefer inv_eggs if available)
      if (inventory.inv_eggs && inventory.inv_eggs['Forget-Me-Not'] > 0) {
        await Trainer.updateInventoryItem(trainerId, 'inv_eggs', 'Forget-Me-Not', -1);
      } else {
        await Trainer.updateInventoryItem(trainerId, 'inv_berries', 'Forget-Me-Not', -1);
      }
    }

    // Validate and consume items
    // Process all selected items and build MonsterRoller options
    const rollerOptions = {
      overrideParams: {},
      filters: {
        pokemon: {},
        digimon: {},
        yokai: {},
        includeSpecies: ['Pokemon', 'Digimon', 'Yokai'],
        excludeSpecies: []
      }
    };

    // Process pool influence items

    // 1. Rank Incense (Yokai Ranks)
    if (rankIncense && rankIncense.length > 0) {
      // Extract ranks from incense names (e.g., "S Rank Incense" -> "S")
      const ranks = rankIncense.map(item => item.split(' ')[0]);
      rollerOptions.filters.yokai = rollerOptions.filters.yokai || {};
      rollerOptions.filters.yokai.rank = ranks;
    }

    // 2. Color Incense (Yokai Attributes)
    if (colorIncense && colorIncense.length > 0) {
      // Extract attributes from incense names (e.g., "Restoration Color Incense" -> "Restoration")
      const attributes = colorIncense.map(item => item.split(' ')[0]);
      rollerOptions.filters.yokai = rollerOptions.filters.yokai || {};
      rollerOptions.filters.yokai.attribute = attributes;
    }

    // 3. Type Poffins (Pokemon Types)
    if (typePoffins && typePoffins.length > 0) {
      // Extract types from poffin names (e.g., "Fire Poffin" -> "Fire")
      const types = typePoffins.map(item => item.split(' ')[0]);

      // For now, just use the first type poffin since the current implementation
      // doesn't support filtering for multiple types at once
      const primaryType = types[0];

      rollerOptions.filters.pokemon = rollerOptions.filters.pokemon || {};
      rollerOptions.filters.pokemon.includeType = primaryType;

      // Log the types for debugging
      console.log('Setting Pokemon type filter to:', primaryType);

      // If multiple type poffins are selected, we'll need to filter the results manually
      if (types.length > 1) {
        console.log('Multiple type poffins selected, will filter results manually');
        rollerOptions.postProcessFilters = rollerOptions.postProcessFilters || {};
        rollerOptions.postProcessFilters.pokemonTypes = types;
      }
    }

    // Initialize species filters arrays
    rollerOptions.filters.includeSpecies = rollerOptions.filters.includeSpecies || [];
    rollerOptions.filters.excludeSpecies = rollerOptions.filters.excludeSpecies || [];

    // 4. Species Filters
    // Process Digimon filters
    if (digimonFilters && digimonFilters.length > 0) {
      console.log('Processing Digimon filters:', digimonFilters);
      digimonFilters.forEach(filter => {
        // Normalize filter names
        const normalizedFilter = filter.replace(/\s+/g, '');

        if (normalizedFilter === 'DigiMeat') {
          // Include Rookie Digimon
          rollerOptions.filters.digimon = rollerOptions.filters.digimon || {};
          rollerOptions.filters.digimon.stage = ['Rookie'];
          console.log('Added filter for Rookie Digimon');
        } else if (normalizedFilter === 'DigiTofu') {
          // Exclude Digimon
          if (!rollerOptions.filters.excludeSpecies.includes('Digimon')) {
            rollerOptions.filters.excludeSpecies.push('Digimon');
            console.log('Added filter to exclude Digimon');
          }
        }
      });
    }

    // Process Pokemon filters
    if (pokemonFilters && pokemonFilters.length > 0) {
      console.log('Processing Pokemon filters:', pokemonFilters);
      pokemonFilters.forEach(filter => {
        // Normalize filter names
        const normalizedFilter = filter.replace(/\s+/g, '');

        if (normalizedFilter === 'BrokenBell') {
          // Exclude Pokemon
          if (!rollerOptions.filters.excludeSpecies.includes('Pokemon')) {
            rollerOptions.filters.excludeSpecies.push('Pokemon');
            console.log('Added filter to exclude Pokemon');
          }
        } else if (normalizedFilter === 'SpellTag') {
          // Exclude Yokai
          if (!rollerOptions.filters.excludeSpecies.includes('Yokai')) {
            rollerOptions.filters.excludeSpecies.push('Yokai');
            console.log('Added filter to exclude Yokai');
          }
        }
      });
    }

    // Log the final species filters
    console.log('Final species filters:', {
      includeSpecies: rollerOptions.filters.includeSpecies,
      excludeSpecies: rollerOptions.filters.excludeSpecies
    });

    // 5. Digimon Attributes
    if (digimonAttributes && digimonAttributes.length > 0) {
      rollerOptions.filters.digimon = rollerOptions.filters.digimon || {};
      rollerOptions.filters.digimon.attribute = digimonAttributes;
    }

    // 6. Digimon Kinds
    if (digimonKinds && digimonKinds.length > 0) {
      rollerOptions.filters.digimon = rollerOptions.filters.digimon || {};
      rollerOptions.filters.digimon.kind = digimonKinds;
    }

    // Process outcome influence items

    // 1. Nurture Kits (Type Guarantees)
    if (nurtureKits && nurtureKits.length > 0) {
      // Extract types from kit names (e.g., "Fire Nurture Kit" -> "Fire")
      const guaranteedTypes = nurtureKits.map(item => item.split(' ')[0]);
      rollerOptions.overrideParams.guaranteedTypes = guaranteedTypes;
    }

    // 2. Attribute Codes
    if (attributeCodes && attributeCodes.length > 0) {
      console.log('Processing attribute codes:', attributeCodes);

      // Only use the first attribute code if multiple are selected
      const code = attributeCodes[0];
      const normalizedCode = code.replace(/\s+/g, '');

      // Check for both spaced and no-space versions
      if (normalizedCode === 'CorruptionCode' || code === 'Corruption Code') {
        rollerOptions.overrideParams.attributes = ['Virus'];
        console.log('Setting attribute to Virus from Corruption Code');
      } else if (normalizedCode === 'RepairCode' || code === 'Repair Code') {
        rollerOptions.overrideParams.attributes = ['Vaccine'];
        console.log('Setting attribute to Vaccine from Repair Code');
      } else if (normalizedCode === 'ShinyNewCode' || code === 'Shiny New Code') {
        rollerOptions.overrideParams.attributes = ['Data'];
        console.log('Setting attribute to Data from Shiny New Code');
      }
    }

    // 3. Milk Items
    if (milks && milks.length > 0) {
      milks.forEach(milk => {
        if (milk === 'Hot Chocolate') {
          // Guarantee fusions (at least 2 species)
          rollerOptions.overrideParams.forceFusion = true;
          rollerOptions.overrideParams.minSpecies = 2;
        } else if (milk === 'Vanilla Milk') {
          // Guarantee 2+ types
          rollerOptions.overrideParams.minType = 2;
        } else if (milk === 'Chocolate Milk') {
          // Guarantee 3+ types
          rollerOptions.overrideParams.minType = 3;
        } else if (milk === 'Strawberry Milk') {
          // Guarantee 4+ types
          rollerOptions.overrideParams.minType = 4;
        } else if (milk === 'MooMoo Milk') {
          // Guarantee 5 types
          rollerOptions.overrideParams.minType = 5;
          rollerOptions.overrideParams.maxType = 5;
        }
      });
    }

    // 4. Ice Creams
    if (iceCreams && iceCreams.length > 0 && iceCreamValues) {
      console.log('Processing ice creams:', iceCreams);
      console.log('Ice cream values:', iceCreamValues);

      rollerOptions.overrideParams.types = rollerOptions.overrideParams.types || [];

      // Process ice creams in order
      const iceCreamOrder = [
        'Vanilla Ice Cream',
        'Strawberry Ice Cream',
        'Chocolate Ice Cream',
        'Mint Ice Cream',
        'Pecan Ice Cream'
      ];

      iceCreamOrder.forEach((iceCream, index) => {
        if (iceCreams.includes(iceCream) && iceCreamValues[iceCream]) {
          rollerOptions.overrideParams.types[index] = iceCreamValues[iceCream];
          console.log(`Setting type ${index + 1} to ${iceCreamValues[iceCream]} from ${iceCream}`);
        }
      });
    }

    // 5. Species Selection Items
    if (speciesItems && speciesValues) {
      if (speciesItems['Input Field'] && speciesValues['Input Field']) {
        // Set species 1
        rollerOptions.overrideParams.species = [speciesValues['Input Field']];

        // Ensure this species is used as the first species
        rollerOptions.overrideParams.guaranteedSpecies = speciesValues['Input Field'];
        rollerOptions.overrideParams.guaranteedSpeciesPosition = 0;

        console.log(`Setting guaranteed first species to ${speciesValues['Input Field']}`);
      }

      if (speciesItems['Drop Down'] && speciesValues['Drop Down'] && speciesValues['Drop Down'].length === 2) {
        // Set species 1 and 2
        rollerOptions.overrideParams.species = speciesValues['Drop Down'];
        rollerOptions.overrideParams.minSpecies = 2;
        rollerOptions.overrideParams.maxSpecies = 2;
      }

      if (speciesItems['Radio Buttons'] && speciesValues['Radio Buttons'] && speciesValues['Radio Buttons'].length === 3) {
        // Set species 1, 2, and 3
        rollerOptions.overrideParams.species = speciesValues['Radio Buttons'];
        rollerOptions.overrideParams.minSpecies = 3;
        rollerOptions.overrideParams.maxSpecies = 3;
      }
    }

    // Roll 10 monsters using MonsterRoller with the configured options
    const monsters = await MonsterRoller.rollTen(rollerOptions);

    // Consume the used items
    // 1. Consume Rank Incense
    if (rankIncense && rankIncense.length > 0) {
      for (const item of rankIncense) {
        await Trainer.updateInventoryItem(trainerId, 'inv_eggs', item, -1);
      }
    }

    // 2. Consume Color Incense
    if (colorIncense && colorIncense.length > 0) {
      for (const item of colorIncense) {
        await Trainer.updateInventoryItem(trainerId, 'inv_eggs', item, -1);
      }
    }

    // 3. Consume Type Poffins
    if (typePoffins && typePoffins.length > 0) {
      for (const item of typePoffins) {
        await Trainer.updateInventoryItem(trainerId, 'inv_eggs', item, -1);
      }
    }

    // 4. Consume Species Filters
    if (digimonFilters && digimonFilters.length > 0) {
      for (const item of digimonFilters) {
        await Trainer.updateInventoryItem(trainerId, 'inv_eggs', item, -1);
      }
    }

    if (pokemonFilters && pokemonFilters.length > 0) {
      for (const item of pokemonFilters) {
        await Trainer.updateInventoryItem(trainerId, 'inv_eggs', item, -1);
      }
    }

    // 5. Consume Digimon Attributes
    if (digimonAttributes && digimonAttributes.length > 0) {
      for (const item of digimonAttributes) {
        await Trainer.updateInventoryItem(trainerId, 'inv_eggs', item, -1);
      }
    }

    // 6. Consume Digimon Kinds
    if (digimonKinds && digimonKinds.length > 0) {
      for (const item of digimonKinds) {
        await Trainer.updateInventoryItem(trainerId, 'inv_eggs', item, -1);
      }
    }

    // 7. Consume Nurture Kits
    if (nurtureKits && nurtureKits.length > 0) {
      // Check if all types are set by ice creams
      const allTypesSetByIceCreams = iceCreams && iceCreams.length === 5;

      if (!allTypesSetByIceCreams) {
        // Consume the nurture kits
        for (const item of nurtureKits) {
          await Trainer.updateInventoryItem(trainerId, 'inv_eggs', item, -1);
        }
      }
      // If all types are set by ice creams, don't consume nurture kits
    }

    // 8. Consume Attribute Codes
    if (attributeCodes && attributeCodes.length > 0) {
      for (const item of attributeCodes) {
        await Trainer.updateInventoryItem(trainerId, 'inv_eggs', item, -1);
      }
    }

    // 9. Consume Milk Items
    if (milks && milks.length > 0) {
      for (const item of milks) {
        await Trainer.updateInventoryItem(trainerId, 'inv_eggs', item, -1);
      }
    }

    // 10. Consume Ice Creams
    if (iceCreams && iceCreams.length > 0) {
      for (const item of iceCreams) {
        await Trainer.updateInventoryItem(trainerId, 'inv_eggs', item, -1);
      }
    }

    // 11. Consume Species Selection Items
    if (speciesItems) {
      if (speciesItems['Input Field']) {
        await Trainer.updateInventoryItem(trainerId, 'inv_eggs', 'Input Field', -1);
      }

      if (speciesItems['Drop Down']) {
        await Trainer.updateInventoryItem(trainerId, 'inv_eggs', 'Drop Down', -1);
      }

      if (speciesItems['Radio Buttons']) {
        await Trainer.updateInventoryItem(trainerId, 'inv_eggs', 'Radio Buttons', -1);
      }
    }

    // Remove one egg from the trainer's inventory (unless using Forget-Me-Not)
    if (!useForgetMeNot) {
      await Trainer.updateInventoryItem(trainerId, 'inv_eggs', 'Standard Egg', -1);
      console.log('Consumed 1 Standard Egg');
    } else {
      console.log('Using Forget-Me-Not - no egg consumed');
    }

    // If using incubator, remove one incubator from the trainer's inventory
    if (useIncubator) {
      await Trainer.updateInventoryItem(trainerId, 'inv_items', 'Incubator', -1);
    }

    res.json({
      success: true,
      message: 'Egg nurtured successfully',
      data: {
        monsters,
        trainerId,
        trainerName: trainer.name
      }
    });
  } catch (error) {
    console.error('Error nurturing egg:', error);
    res.status(500).json({
      success: false,
      message: 'Error nurturing egg'
    });
  }
});

/**
 * @route POST /api/nurture/claim
 * @desc Claim a monster from nurtured egg
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

    const { trainerId, monsterData, monsterName, useDnaSplicer, useEdenwiess, useForgetMeNot } = req.body;

    // Validate required fields
    if (!trainerId || !monsterData || !monsterName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Get trainer's inventory for item checks
    const inventory = await Trainer.getInventory(trainerId) || {};
    console.log('Trainer inventory for claim:', inventory);

    // Check if inventory is a flat structure instead of categorized
    let flatInventory = false;
    if (inventory['Standard Egg'] !== undefined) {
      flatInventory = true;
      console.log('Detected flat inventory structure for claim');
    }

    // Check if using DNA Splicer
    if (useDnaSplicer) {
      // Check if trainer has DNA Splicer
      const dnaSplicerCount = inventory && inventory.inv_eggs && inventory.inv_eggs['DNA Splicer']
        ? inventory.inv_eggs['DNA Splicer']
        : 0;

      // Also check in items inventory for backward compatibility
      const dnaSplicerInItems = inventory && inventory.inv_items && inventory.inv_items['DNA Splicer']
        ? inventory.inv_items['DNA Splicer']
        : 0;

      if (dnaSplicerCount + dnaSplicerInItems <= 0) {
        return res.status(400).json({
          success: false,
          message: 'You do not have any DNA Splicers'
        });
      }

      // Use one DNA Splicer (prefer inv_eggs if available)
      if (dnaSplicerCount > 0) {
        await Trainer.updateInventoryItem(trainerId, 'inv_eggs', 'DNA Splicer', -1);
      } else {
        await Trainer.updateInventoryItem(trainerId, 'inv_items', 'DNA Splicer', -1);
      }
    }

    // Check if using Edenwiess (functions the same as DNA Splicer)
    if (useEdenwiess) {
      // Check if trainer has Edenwiess
      const edenwiessCount = inventory && inventory.inv_eggs && inventory.inv_eggs['Edenwiess']
        ? inventory.inv_eggs['Edenwiess']
        : 0;

      // Also check in berries inventory for backward compatibility
      const edenwiessInBerries = inventory && inventory.inv_berries && inventory.inv_berries['Edenwiess']
        ? inventory.inv_berries['Edenwiess']
        : 0;

      if (edenwiessCount + edenwiessInBerries <= 0) {
        return res.status(400).json({
          success: false,
          message: 'You do not have any Edenwiess'
        });
      }

      // Use one Edenwiess (prefer inv_eggs if available)
      if (edenwiessCount > 0) {
        await Trainer.updateInventoryItem(trainerId, 'inv_eggs', 'Edenwiess', -1);
      } else {
        await Trainer.updateInventoryItem(trainerId, 'inv_berries', 'Edenwiess', -1);
      }
    }

    // Check if using Forget-Me-Not (rerolls all monsters without consuming an egg)
    if (useForgetMeNot) {
      // Check if trainer has Forget-Me-Not
      const forgetMeNotCount = inventory && inventory.inv_eggs && inventory.inv_eggs['Forget-Me-Not']
        ? inventory.inv_eggs['Forget-Me-Not']
        : 0;

      // Also check in berries inventory for backward compatibility
      const forgetMeNotInBerries = inventory && inventory.inv_berries && inventory.inv_berries['Forget-Me-Not']
        ? inventory.inv_berries['Forget-Me-Not']
        : 0;

      if (forgetMeNotCount + forgetMeNotInBerries <= 0) {
        return res.status(400).json({
          success: false,
          message: 'You do not have any Forget-Me-Not'
        });
      }

      // Use one Forget-Me-Not (prefer inv_eggs if available)
      if (forgetMeNotCount > 0) {
        await Trainer.updateInventoryItem(trainerId, 'inv_eggs', 'Forget-Me-Not', -1);
      } else {
        await Trainer.updateInventoryItem(trainerId, 'inv_berries', 'Forget-Me-Not', -1);
      }

      // Note: Forget-Me-Not allows rerolling without consuming an egg, but that's handled in the hatch endpoint
      // This endpoint just consumes the Forget-Me-Not item
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

/**
 * Helper function to get inventory items by category and names
 * @param {Object} inventory - The trainer's inventory
 * @param {string} category - The inventory category (e.g., 'inv_items', 'inv_berries')
 * @param {Array} itemNames - Array of item names to check
 * @returns {Object} - Object with item names as keys and counts as values
 */
function getInventoryItems(inventory, category, itemNames) {
  const result = {};

  // Check if inventory is a flat structure (no categories)
  const isFlatInventory = inventory && typeof inventory === 'object' && inventory['Standard Egg'] !== undefined;

  console.log(`getInventoryItems: isFlatInventory=${isFlatInventory}, category=${category}, itemNames=${JSON.stringify(itemNames)}`);
  console.log('Inventory:', inventory);

  // Ensure itemNames is an array
  if (Array.isArray(itemNames)) {
    // Initialize all items to 0
    itemNames.forEach(itemName => {
      result[itemName] = 0;
    });

    // Check for items in the inventory
    if (inventory && typeof inventory === 'object') {
      // First check in the specified category
      if (inventory[category] && typeof inventory[category] === 'object') {
        itemNames.forEach(itemName => {
          if (inventory[category][itemName]) {
            result[itemName] = inventory[category][itemName];
            console.log(`Found in category: ${category}.${itemName} = ${result[itemName]}`);
          }
        });
      }

      // Also check for items directly in the inventory (flat structure)
      itemNames.forEach(itemName => {
        if (inventory[itemName]) {
          result[itemName] = inventory[itemName];
          console.log(`Found in flat inventory: ${itemName} = ${result[itemName]}`);
        }
      });

      // Special case for 'Digi Tofu' vs 'DigiTofu' and similar items
      if (category === 'inv_eggs') {
        // Map of common variations
        const variations = {
          'DigiTofu': 'Digi Tofu',
          'DigiMeat': 'Digi Meat',
          'Spell Tag': 'SpellTag',
          'Broken Bell': 'BrokenBell',
          'Fire Nurture Kit': 'FireNurtureKit',
          'Water Nurture Kit': 'WaterNurtureKit',
          'Grass Nurture Kit': 'GrassNurtureKit',
          'Electric Nurture Kit': 'ElectricNurtureKit',
          'Ice Nurture Kit': 'IceNurtureKit',
          'Fighting Nurture Kit': 'FightingNurtureKit',
          'Poison Nurture Kit': 'PoisonNurtureKit',
          'Ground Nurture Kit': 'GroundNurtureKit',
          'Flying Nurture Kit': 'FlyingNurtureKit',
          'Psychic Nurture Kit': 'PsychicNurtureKit',
          'Bug Nurture Kit': 'BugNurtureKit',
          'Rock Nurture Kit': 'RockNurtureKit',
          'Ghost Nurture Kit': 'GhostNurtureKit',
          'Dragon Nurture Kit': 'DragonNurtureKit',
          'Dark Nurture Kit': 'DarkNurtureKit',
          'Steel Nurture Kit': 'SteelNurtureKit',
          'Fairy Nurture Kit': 'FairyNurtureKit',
          'Hot Chocolate': 'HotChocolate',
          'Vanilla Ice Cream': 'VanillaIceCream',
          'Strawberry Ice Cream': 'StrawberryIceCream',
          'Chocolate Ice Cream': 'ChocolateIceCream',
          'Mint Ice Cream': 'MintIceCream',
          'Pecan Ice Cream': 'PecanIceCream',
          'Input Field': 'InputField',
          'Drop Down': 'DropDown',
          'Radio Buttons': 'RadioButtons'
        };

        // Check for variations
        itemNames.forEach(itemName => {
          // Check for space-less version
          const spacelessName = itemName.replace(/\s+/g, '');
          if (inventory[category] && inventory[category][spacelessName]) {
            result[itemName] = inventory[category][spacelessName];
            console.log(`Found spaceless variation: ${category}.${spacelessName} = ${result[itemName]}`);
          } else if (inventory[spacelessName]) {
            result[itemName] = inventory[spacelessName];
            console.log(`Found spaceless variation in flat inventory: ${spacelessName} = ${result[itemName]}`);
          }

          // Check for variation with spaces
          if (variations[itemName] && inventory[category] && inventory[category][variations[itemName]]) {
            result[itemName] = inventory[category][variations[itemName]];
            console.log(`Found variation: ${category}.${variations[itemName]} = ${result[itemName]}`);
          } else if (variations[itemName] && inventory[variations[itemName]]) {
            result[itemName] = inventory[variations[itemName]];
            console.log(`Found variation in flat inventory: ${variations[itemName]} = ${result[itemName]}`);
          }
        });
      }
    }
  }

  return result;
}

// Get special items for nurture
router.get('/special-items', async (req, res) => {
  try {
    const { trainerId } = req.query;

    if (!trainerId) {
      return res.status(400).json({
        success: false,
        message: 'Trainer ID is required'
      });
    }

    // Get trainer's inventory
    const inventory = await Trainer.getInventory(trainerId) || {};

    // Check for DNA Splicer, Edenwiess, and Forget-Me-Not
    const dnaSplicer = inventory.inv_eggs && inventory.inv_eggs['DNA Splicer'] ? inventory.inv_eggs['DNA Splicer'] : 0;
    const edenwiess = inventory.inv_eggs && inventory.inv_eggs['Edenwiess'] ? inventory.inv_eggs['Edenwiess'] : 0;
    const forgetMeNot = inventory.inv_eggs && inventory.inv_eggs['Forget-Me-Not'] ? inventory.inv_eggs['Forget-Me-Not'] : 0;

    // Also check in berries inventory for backward compatibility
    const edenwiessInBerries = inventory.inv_berries && inventory.inv_berries['Edenwiess'] ? inventory.inv_berries['Edenwiess'] : 0;
    const forgetMeNotInBerries = inventory.inv_berries && inventory.inv_berries['Forget-Me-Not'] ? inventory.inv_berries['Forget-Me-Not'] : 0;

    // Also check in items inventory for backward compatibility
    const dnaSplicerInItems = inventory.inv_items && inventory.inv_items['DNA Splicer'] ? inventory.inv_items['DNA Splicer'] : 0;

    return res.json({
      success: true,
      items: {
        dnaSplicer: dnaSplicer + dnaSplicerInItems,
        edenwiess: edenwiess + edenwiessInBerries,
        forgetMeNot: forgetMeNot + forgetMeNotInBerries
      }
    });
  } catch (error) {
    console.error('Error getting special items:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting special items'
    });
  }
});

module.exports = router;
