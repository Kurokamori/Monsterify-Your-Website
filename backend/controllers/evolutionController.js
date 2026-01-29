const db = require('../config/db');
const Monster = require('../models/Monster');
const Trainer = require('../models/Trainer');
const cloudinary = require('../utils/cloudinary');
const asyncHandler = require('express-async-handler');

/**
 * @desc    Evolve a monster
 * @route   POST /api/monsters/:id/evolve
 * @access  Private
 */
const evolveMonster = asyncHandler(async (req, res) => {
  try {
    const monsterId = req.params.id;
    const {
      trainerId,
      speciesSlot,
      evolutionName,
      evolutionItem,
      imageUrl,
      useVoidStone,
      useDigitalRepairKit,
      customEvolutionName
    } = req.body;

    console.log('Evolve monster request received:', {
      monsterId,
      trainerId,
      speciesSlot,
      evolutionName,
      evolutionItem,
      hasImageUrl: !!imageUrl,
      useVoidStone,
      useDigitalRepairKit,
      customEvolutionName,
      hasFile: !!req.file
    });

    // Validate required fields
    if (!monsterId || !trainerId || !speciesSlot) {
      console.log('Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Monster ID, trainer ID, and species slot are required'
      });
    }

    // Check if monster exists
    const monster = await Monster.getById(monsterId);
    if (!monster) {
      console.log(`Monster with ID ${monsterId} not found`);
      return res.status(404).json({
        success: false,
        message: `Monster with ID ${monsterId} not found`
      });
    }

    console.log('Monster found:', monster);

    // Check if trainer exists
    const trainer = await Trainer.getById(trainerId);
    if (!trainer) {
      console.log(`Trainer with ID ${trainerId} not found`);
      return res.status(404).json({
        success: false,
        message: `Trainer with ID ${trainerId} not found`
      });
    }

    console.log('Trainer found:', trainer);

    // Check if monster belongs to trainer
    if (monster.trainer_id !== parseInt(trainerId)) {
      console.log(`Monster ${monsterId} does not belong to trainer ${trainerId}`);
      return res.status(403).json({
        success: false,
        message: 'This monster does not belong to the specified trainer'
      });
    }

    // Check if the species slot exists on the monster
    if (!monster[speciesSlot]) {
      console.log(`The monster does not have a ${speciesSlot}`);
      return res.status(400).json({
        success: false,
        message: `The monster does not have a ${speciesSlot}`
      });
    }

    // Check if image is provided or void stone is used
    if (!imageUrl && !useVoidStone && !req.file) {
      console.log('No image URL, file, or void stone provided');
      return res.status(400).json({
        success: false,
        message: 'Image URL or file upload is required, or use a Void Evolution Stone'
      });
    }

    // Check if the trainer has the evolution item in inventory (but avoid double check for void stone)
    if (evolutionItem && !(useVoidStone && evolutionItem === 'Void Evolution Stone')) {
      console.log(`Checking if trainer has ${evolutionItem} in inventory`);
      const inventory = await Trainer.getInventory(trainerId);
      console.log('Trainer inventory:', inventory);

      if (!inventory || !inventory.evolution || !inventory.evolution[evolutionItem] || inventory.evolution[evolutionItem] <= 0) {
        console.log(`Trainer does not have ${evolutionItem} in inventory`);
        return res.status(400).json({
          success: false,
          message: `Trainer does not have ${evolutionItem} in inventory`
        });
      }
    }

    // Check if the trainer has void evolution stones if using void stone
    if (useVoidStone) {
      console.log('Checking if trainer has Void Evolution Stone in inventory');
      const inventory = await Trainer.getInventory(trainerId);
      console.log('Trainer inventory:', inventory);

      if (!inventory || !inventory.evolution || !inventory.evolution['Void Evolution Stone'] || inventory.evolution['Void Evolution Stone'] <= 0) {
        console.log('Trainer does not have Void Evolution Stone in inventory');
        return res.status(400).json({
          success: false,
          message: 'Trainer does not have Void Evolution Stone in inventory'
        });
      }
    }

    // Check if the trainer has digital repair kit if using it
    if (useDigitalRepairKit) {
      console.log('Checking if trainer has Digital Repair Kit in inventory');
      const inventory = await Trainer.getInventory(trainerId);
      console.log('Trainer inventory:', inventory);

      if (!inventory || !inventory.evolution || !inventory.evolution['Digital Repair Kit'] || inventory.evolution['Digital Repair Kit'] <= 0) {
        console.log('Trainer does not have Digital Repair Kit in inventory');
        return res.status(400).json({
          success: false,
          message: 'Trainer does not have Digital Repair Kit in inventory'
        });
      }
    }

    // Upload image to Cloudinary if provided as file
    let uploadedImageUrl = imageUrl;
    if (req.file && !useVoidStone) {
      try {
        console.log('Uploading image to Cloudinary');
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'evolution_submissions'
        });
        uploadedImageUrl = result.secure_url;
        console.log('Image uploaded successfully:', uploadedImageUrl);
      } catch (error) {
        console.error('Error uploading image to Cloudinary:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload image'
        });
      }
    }

    // Prepare monster update data
    const updateData = {
      ...monster
    };

    // Update the species in the specified slot
    if (useDigitalRepairKit) {
      // For Digital Repair Kit, we allow custom evolution name
      const newName = customEvolutionName || `${monster[speciesSlot]} (Evolved)`;
      console.log(`Using Digital Repair Kit to set ${speciesSlot} to ${newName}`);
      updateData[speciesSlot] = newName;
    } else if (evolutionName) {
      console.log(`Setting ${speciesSlot} to ${evolutionName}`);
      updateData[speciesSlot] = evolutionName;
    } else {
      // Default evolution name
      const newName = `${monster[speciesSlot]} (Evolved)`;
      console.log(`Setting ${speciesSlot} to ${newName}`);
      updateData[speciesSlot] = newName;
    }

    // Add or modify type based on evolution item
    if (evolutionItem) {
      const typeMapping = {
        'Fire Stone': 'Fire',
        'Water Stone': 'Water',
        'Thunder Stone': 'Electric',
        'Leaf Stone': 'Grass',
        'Moon Stone': 'Fairy',
        'Sun Stone': 'Bug',
        'Shiny Stone': 'Ghost',
        'Dusk Stone': 'Dark',
        'Dawn Stone': 'Psychic',
        'Ice Stone': 'Ice',
        'Dragon Scale': 'Dragon',
        'Metal Coat': 'Steel',
        'Sensei\'s Pillow': 'Fighting',
        'Poison Fang': 'Poison',
        'Amber Stone': 'Ground',
        'Glass Wing': 'Flying',
        'Normal Stone': 'Normal'
      };

      // For Aurora Evolution Stone, pick a random type
      if (evolutionItem === 'Aurora Evolution Stone') {
        const types = Object.values(typeMapping);
        const randomType = types[Math.floor(Math.random() * types.length)];
        console.log(`Using Aurora Evolution Stone to add random type: ${randomType}`);

        // Find the first empty type slot or use type3
        if (!updateData.type2) {
          updateData.type2 = randomType;
        } else if (!updateData.type3) {
          updateData.type3 = randomType;
        } else if (!updateData.type4) {
          updateData.type4 = randomType;
        } else if (!updateData.type5) {
          updateData.type5 = randomType;
        } else {
          // If all type slots are filled, replace type3
          updateData.type3 = randomType;
        }
      }
      // Digital Repair Kit and Void Evolution Stone don't add types
      else if (evolutionItem === 'Digital Repair Kit' || evolutionItem === 'Void Evolution Stone') {
        console.log(`${evolutionItem} does not add any types`);
      }
      // For specific type stones, add the type
      else if (typeMapping[evolutionItem]) {
        const newType = typeMapping[evolutionItem];
        console.log(`Using ${evolutionItem} to add type: ${newType}`);

        // Find the first empty type slot or use type3
        if (!updateData.type2) {
          updateData.type2 = newType;
        } else if (!updateData.type3) {
          updateData.type3 = newType;
        } else if (!updateData.type4) {
          updateData.type4 = newType;
        } else if (!updateData.type5) {
          updateData.type5 = newType;
        } else {
          // If all type slots are filled, replace type3
          updateData.type3 = newType;
        }
      }
    }

    // Increment level
    updateData.level = parseInt(monster.level) + 1;
    console.log(`Incrementing level to ${updateData.level}`);

    // Create evolution data entry to record the pre-evolution state
    try {
      // Get current evolution data if it exists
      let currentEvolutionData = [];
      const existingEvolutionData = await Monster.getEvolutionData(monsterId);
      
      if (existingEvolutionData && existingEvolutionData.evolution_data) {
        try {
          currentEvolutionData = typeof existingEvolutionData.evolution_data === 'string'
            ? JSON.parse(existingEvolutionData.evolution_data)
            : existingEvolutionData.evolution_data;
          
          if (!Array.isArray(currentEvolutionData)) {
            currentEvolutionData = [];
          }
        } catch (parseErr) {
          console.error('Error parsing existing evolution data:', parseErr);
          currentEvolutionData = [];
        }
      }
      
      // Create new evolution entry for the pre-evolution state
      const preEvolutionEntry = {
        id: Date.now(),
        image: monster.img_link || '', // Current image before evolution
        species1: monster.species1 || '',
        species2: monster.species2 || '',
        species3: monster.species3 || '',
        type1: monster.type1 || '',
        type2: monster.type2 || '',
        type3: monster.type3 || '',
        type4: monster.type4 || '',
        type5: monster.type5 || '',
        attribute: monster.attribute || '',
        evolution_method: evolutionItem ? `Evolution Item: ${evolutionItem}` : 'Evolution',
        level: monster.level.toString(),
        key: evolutionItem ? 'item' : '',
        data: evolutionItem || '',
        order: currentEvolutionData.length
      };
      
      // Add the new entry to the evolution data
      currentEvolutionData.push(preEvolutionEntry);
      
      // Save the updated evolution data
      await Monster.setEvolutionData(monsterId, currentEvolutionData);
      console.log('Evolution data entry created for pre-evolution state');
    } catch (evolutionDataError) {
      console.error('Error creating evolution data entry:', evolutionDataError);
      // Don't fail the evolution if this fails
    }

    // Clear the image link since the monster has evolved and looks different
    updateData.img_link = null;
    console.log('Setting img_link to null as monster has evolved');

    console.log('Final update data:', updateData);

    // Update monster in database
    console.log(`Updating monster ${monsterId} in database`);
    // Remove trainer_name from updateData to avoid SQL error
    const { trainer_name, ...cleanUpdateData } = updateData;
    const updatedMonster = await Monster.update(monsterId, cleanUpdateData);
    console.log('Monster updated successfully:', updatedMonster);

    // Remove evolution item from trainer's inventory (but avoid double consumption of void stone)
    if (evolutionItem && !(useVoidStone && evolutionItem === 'Void Evolution Stone')) {
      console.log(`Removing ${evolutionItem} from trainer's inventory`);
      await Trainer.updateInventoryItem(trainerId, 'evolution', evolutionItem, -1);
      console.log('Inventory updated successfully');
    }

    // Remove void evolution stone from trainer's inventory if used
    if (useVoidStone) {
      console.log('Removing Void Evolution Stone from trainer\'s inventory');
      await Trainer.updateInventoryItem(trainerId, 'evolution', 'Void Evolution Stone', -1);
      console.log('Void Evolution Stone inventory updated successfully');
    }

    // Remove digital repair kit from trainer's inventory if used
    if (useDigitalRepairKit) {
      console.log('Removing Digital Repair Kit from trainer\'s inventory');
      await Trainer.updateInventoryItem(trainerId, 'evolution', 'Digital Repair Kit', -1);
      console.log('Digital Repair Kit inventory updated successfully');
    }

    // Record evolution in history (if you have such a table)
    // This would be a good place to record the evolution details for future reference

    res.json({
      success: true,
      message: 'Monster evolved successfully',
      data: updatedMonster
    });
  } catch (error) {
    console.error('Error evolving monster:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * @desc    Get evolution options for a monster
 * @route   GET /api/monsters/:id/evolution-options
 * @access  Private
 */
const getEvolutionOptions = asyncHandler(async (req, res) => {
  try {
    const monsterId = req.params.id;
    const { speciesSlot = 'species1' } = req.query;

    console.log(`Getting evolution options for monster ${monsterId}, species slot: ${speciesSlot}`);

    // Check if monster exists
    const monster = await Monster.getById(monsterId);
    if (!monster) {
      console.log(`Monster with ID ${monsterId} not found`);
      return res.status(404).json({
        success: false,
        message: `Monster with ID ${monsterId} not found`
      });
    }

    console.log(`Found monster:`, monster);

    // Check if the species slot exists on the monster
    if (!monster[speciesSlot]) {
      console.log(`The monster does not have a ${speciesSlot}`);
      return res.status(400).json({
        success: false,
        message: `The monster does not have a ${speciesSlot}`
      });
    }

    // Get the species name
    const speciesName = monster[speciesSlot];
    console.log(`Species name: ${speciesName}`);


   let monsterType = 'none';
   const tables = [
     'pokemon_monsters',
     'digimon_monsters',
     'yokai_monsters',
     'nexomon_monsters',
     'pals_monsters',
     'finalfantasy_monsters',
     'monsterhunter_monsters'
   ];
   for (const tableName of tables) {
     const query = `SELECT name FROM ${tableName} WHERE name = $1`;
     const result = await db.asyncGet(query, [speciesName]);
     if (result) {
       monsterType = tableName;
       break;
     }
  }

    console.log(`Monster type determined as: ${monsterType}`);

    if (monsterType === 'none') {
      console.log(`No evolution options found for ${speciesName}`);
      return res.json({
        success: true,
        data: []
      });
    }

    // Get evolution options based on monster type
    let evolutionOptions = [];

    try {
      // For Pokemon, check the pokemon_monsters table
      if (monsterType === 'pokemon_monsters') {
        const query = `
          SELECT evolves_to FROM pokemon_monsters
          WHERE name = $1 AND evolves_to IS NOT NULL
        `;

        console.log(`Executing query for Pokemon: ${query} with params [${speciesName}]`);
        const result = await db.asyncGet(query, [speciesName]);
        console.log(`Query result:`, result);

        if (result && result.evolves_to) {
          // Split by comma if it's a comma-separated list
          const evolutions = result.evolves_to.split(',').map(e => e.trim());
          evolutionOptions = evolutions.map(evo => ({ name: evo, type: 'pokemon' }));
        }
      }

      // For Digimon, check the digimon_monsters table
      else if (monsterType === 'digimon_monsters') {
        const query = `
          SELECT digivolves_to FROM digimon_monsters
          WHERE name = $1 AND digivolves_to IS NOT NULL
        `;

        console.log(`Executing query for Digimon: ${query} with params [${speciesName}]`);
        const result = await db.asyncGet(query, [speciesName]);
        console.log(`Query result:`, result);

        if (result && result.digivolves_to) {
          // Split by comma if it's a comma-separated list
          const evolutions = result.digivolves_to.split(',').map(e => e.trim());
          evolutionOptions = evolutions.map(evo => ({ name: evo, type: 'digimon' }));
        }
      }

      // For Yokai, check the yokai_monsters table
      else if (monsterType === 'yokai_monsters') {
        const query = `
          SELECT evolves_to FROM yokai_monsters
          WHERE name = $1 AND evolves_to IS NOT NULL
        `;

        console.log(`Executing query for Yokai: ${query} with params [${speciesName}]`);
        const result = await db.asyncGet(query, [speciesName]);
        console.log(`Query result:`, result);

        if (result && result.evolves_to) {
          // Split by comma if it's a comma-separated list
          const evolutions = result.evolves_to.split(',').map(e => e.trim());
          evolutionOptions = evolutions.map(evo => ({ name: evo, type: 'yokai' }));
        }
      }

      // For Nexomon, check the nexomon_monsters table
      else if (monsterType === 'nexomon_monsters') {
        const query = `
          SELECT evolves_to FROM nexomon_monsters
          WHERE name = $1 AND evolves_to IS NOT NULL
        `;

        console.log(`Executing query for Nexomon: ${query} with params [${speciesName}]`);
        const result = await db.asyncGet(query, [speciesName]);
        console.log(`Query result:`, result);

        if (result && result.evolves_to) {
          // Split by comma if it's a comma-separated list
          const evolutions = result.evolves_to.split(',').map(e => e.trim());
          evolutionOptions = evolutions.map(evo => ({ name: evo, type: 'nexomon' }));
        }
      }

      // For Final Fantasy, check the finalfantasy_monsters table
      else if (monsterType === 'finalfantasy_monsters') {
        const query = `
          SELECT evolves_to FROM finalfantasy_monsters
          WHERE name = $1 AND evolves_to IS NOT NULL
        `;

        console.log(`Executing query for Final Fantasy: ${query} with params [${speciesName}]`);
        const result = await db.asyncGet(query, [speciesName]);
        console.log(`Query result:`, result);

        if (result && result.evolves_to) {
          // Split by comma if it's a comma-separated list
          const evolutions = result.evolves_to.split(',').map(e => e.trim());
          evolutionOptions = evolutions.map(evo => ({ name: evo, type: 'finalfantasy' }));
        }
      }

      // For Monster Hunter, monsters don't evolve
      else if (monsterType === 'monsterhunter_monsters') {
        console.log(`Monster Hunter monsters do not evolve`);
        // Return empty array - Monster Hunter monsters don't have evolutions
        evolutionOptions = [];
      }
    } catch (dbError) {
      console.error('Database error when fetching evolution options:', dbError);
      // Continue with empty evolution options
    }

    console.log(`Evolution options found:`, evolutionOptions);

    res.json({
      success: true,
      data: evolutionOptions
    });
  } catch (error) {
    console.error('Error getting evolution options:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * @desc    Get evolution options for a species by name
 * @route   GET /api/evolution/options/:speciesName
 * @access  Public
 */
const getEvolutionOptionsBySpecies = asyncHandler(async (req, res) => {
  try {
    const speciesName = decodeURIComponent(req.params.speciesName);
    
    console.log(`Getting evolution options for species: ${speciesName}`);

    // Check if the species exists in any of the monster tables
    let monsterType = 'none';
    const tables = [
      'pokemon_monsters',
      'digimon_monsters',
      'yokai_monsters',
      'nexomon_monsters',
      'pals_monsters',
      'finalfantasy_monsters',
      'monsterhunter_monsters'
    ];

    for (const tableName of tables) {
      const query = `SELECT name FROM ${tableName} WHERE name = $1`;
      const result = await db.asyncGet(query, [speciesName]);
      if (result) {
        monsterType = tableName;
        break;
      }
    }

    console.log(`Monster type determined as: ${monsterType}`);

    if (monsterType === 'none') {
      console.log(`No evolution options found for ${speciesName}`);
      return res.json({
        success: true,
        data: []
      });
    }

    // Get evolution options based on monster type
    let evolutionOptions = [];

    try {
      if (monsterType === 'pokemon_monsters') {
        const query = `
          SELECT evolves_to FROM pokemon_monsters
          WHERE name = $1 AND evolves_to IS NOT NULL
        `;
        const result = await db.asyncGet(query, [speciesName]);
        
        if (result && result.evolves_to) {
          const evolutions = result.evolves_to.split(',').map(e => e.trim());
          evolutionOptions = evolutions.map(evo => ({ name: evo, type: 'pokemon' }));
        }
      }
      else if (monsterType === 'digimon_monsters') {
        const query = `
          SELECT digivolves_to FROM digimon_monsters
          WHERE name = $1 AND digivolves_to IS NOT NULL
        `;
        const result = await db.asyncGet(query, [speciesName]);
        
        if (result && result.digivolves_to) {
          const evolutions = result.digivolves_to.split(',').map(e => e.trim());
          evolutionOptions = evolutions.map(evo => ({ name: evo, type: 'digimon' }));
        }
      }
      else if (monsterType === 'yokai_monsters') {
        const query = `
          SELECT evolves_to FROM yokai_monsters
          WHERE name = $1 AND evolves_to IS NOT NULL
        `;
        const result = await db.asyncGet(query, [speciesName]);
        
        if (result && result.evolves_to) {
          const evolutions = result.evolves_to.split(',').map(e => e.trim());
          evolutionOptions = evolutions.map(evo => ({ name: evo, type: 'yokai' }));
        }
      }
      else if (monsterType === 'nexomon_monsters') {
        const query = `
          SELECT evolves_to FROM nexomon_monsters
          WHERE name = $1 AND evolves_to IS NOT NULL
        `;
        const result = await db.asyncGet(query, [speciesName]);

        if (result && result.evolves_to) {
          const evolutions = result.evolves_to.split(',').map(e => e.trim());
          evolutionOptions = evolutions.map(evo => ({ name: evo, type: 'nexomon' }));
        }
      }
      else if (monsterType === 'finalfantasy_monsters') {
        const query = `
          SELECT evolves_to FROM finalfantasy_monsters
          WHERE name = $1 AND evolves_to IS NOT NULL
        `;
        const result = await db.asyncGet(query, [speciesName]);

        if (result && result.evolves_to) {
          const evolutions = result.evolves_to.split(',').map(e => e.trim());
          evolutionOptions = evolutions.map(evo => ({ name: evo, type: 'finalfantasy' }));
        }
      }
      else if (monsterType === 'monsterhunter_monsters') {
        // Monster Hunter monsters do not evolve
        evolutionOptions = [];
      }
    } catch (dbError) {
      console.error('Database error when fetching evolution options:', dbError);
    }

    console.log(`Evolution options found:`, evolutionOptions);

    res.json({
      success: true,
      data: evolutionOptions
    });
  } catch (error) {
    console.error('Error getting evolution options by species:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * @desc    Get reverse evolution options (what evolves into this species)
 * @route   GET /api/evolution/reverse/:speciesName
 * @access  Public
 */
const getReverseEvolutionOptions = asyncHandler(async (req, res) => {
  try {
    const speciesName = decodeURIComponent(req.params.speciesName);
    
    console.log(`Getting reverse evolution options for species: ${speciesName}`);

    // Find species that evolve into the given species
    let reverseEvolutionOptions = [];

    try {
      // Helper function to check if species exists in comma-separated list
      const checkEvolutionMatch = (evolutionString, targetSpecies) => {
        if (!evolutionString) return false;
        // Split by comma and check for exact matches (after trimming whitespace)
        const evolutions = evolutionString.split(',').map(s => s.trim());
        return evolutions.includes(targetSpecies);
      };

      // Check Pokemon monsters
      const pokemonQuery = `
        SELECT name, evolves_to FROM pokemon_monsters
        WHERE evolves_to IS NOT NULL AND evolves_to != ''
      `;
      const pokemonResults = await db.asyncAll(pokemonQuery);
      
      pokemonResults.forEach(result => {
        if (result.name !== speciesName && checkEvolutionMatch(result.evolves_to, speciesName)) {
          reverseEvolutionOptions.push({ name: result.name, type: 'pokemon' });
        }
      });

      // Check Digimon monsters - check who has our target in their digivolves_to field
      const digimonQuery = `
        SELECT name, digivolves_to FROM digimon_monsters
        WHERE digivolves_to IS NOT NULL AND digivolves_to != ''
      `;
      const digimonResults = await db.asyncAll(digimonQuery);
      
      digimonResults.forEach(result => {
        if (result.name !== speciesName && checkEvolutionMatch(result.digivolves_to, speciesName)) {
          reverseEvolutionOptions.push({ name: result.name, type: 'digimon' });
        }
      });

      // Check Yokai monsters  
      const yokaiQuery = `
        SELECT name, evolves_to FROM yokai_monsters
        WHERE evolves_to IS NOT NULL AND evolves_to != ''
      `;
      const yokaiResults = await db.asyncAll(yokaiQuery);
      
      yokaiResults.forEach(result => {
        if (result.name !== speciesName && checkEvolutionMatch(result.evolves_to, speciesName)) {
          reverseEvolutionOptions.push({ name: result.name, type: 'yokai' });
        }
      });

      // Check Nexomon monsters
      const nexomonQuery = `
        SELECT name, evolves_to FROM nexomon_monsters
        WHERE evolves_to IS NOT NULL AND evolves_to != ''
      `;
      const nexomonResults = await db.asyncAll(nexomonQuery);

      nexomonResults.forEach(result => {
        if (result.name !== speciesName && checkEvolutionMatch(result.evolves_to, speciesName)) {
          reverseEvolutionOptions.push({ name: result.name, type: 'nexomon' });
        }
      });

      // Check Final Fantasy monsters
      const finalfantasyQuery = `
        SELECT name, evolves_to FROM finalfantasy_monsters
        WHERE evolves_to IS NOT NULL AND evolves_to != ''
      `;
      const finalfantasyResults = await db.asyncAll(finalfantasyQuery);

      finalfantasyResults.forEach(result => {
        if (result.name !== speciesName && checkEvolutionMatch(result.evolves_to, speciesName)) {
          reverseEvolutionOptions.push({ name: result.name, type: 'finalfantasy' });
        }
      });

      // Note: Monster Hunter monsters do not evolve, so no reverse evolution check needed

    } catch (dbError) {
      console.error('Database error when fetching reverse evolution options:', dbError);
    }

    console.log(`Reverse evolution options found:`, reverseEvolutionOptions);

    res.json({
      success: true,
      data: reverseEvolutionOptions
    });
  } catch (error) {
    console.error('Error getting reverse evolution options:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = {
  evolveMonster,
  getEvolutionOptions,
  getEvolutionOptionsBySpecies,
  getReverseEvolutionOptions
};
