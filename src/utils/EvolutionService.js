/**
 * Evolution Service
 * Handles evolution-related functionality
 */

const pool = require('../db');
const Pokemon = require('../models/Pokemon');
const Digimon = require('../models/Digimon');
const Yokai = require('../models/Yokai');
const Monster = require('../models/Monster');
const Trainer = require('../models/Trainer');
const Item = require('../models/Item');

// Evolution stone types mapping
const evolutionStoneTypes = {
  'Fire Stone': 'Fire',
  'Water Stone': 'Water',
  'Thunder Stone': 'Electric',
  'Electric Evolution Stone': 'Electric',
  'Leaf Stone': 'Grass',
  'Grass Evolution Stone': 'Grass',
  'Moon Stone': 'Fairy',
  'Sun Stone': 'Plant',
  'Shiny Stone': 'Light',
  'Dusk Stone': 'Dark',
  'Dawn Stone': 'Psychic',
  'Ice Stone': 'Ice',
  'Ice Evolution Stone': 'Ice',
  'Dragon Scale': 'Dragon',
  'Metal Coat': 'Steel',
  'Fighting Evolution Stone': 'Fighting', // Added Fighting Evolution Stone
  'Aurorus Stone': 'Random', // Special case - adds random type
  'Aurora Evolution Stone': 'Random', // Special case - adds random type
  'Void Stone': 'None' // Special case - doesn't add type
};

// Special evolution items
const specialEvolutionItems = [
  'Digital Repair Kit', // Allows setting any species for Digimon
  'Digital Kilobytes', // Evolve Baby II to Rookie
  'Digital Megabytes', // Evolve Rookie to Champion
  'Digital Gigabytes', // Evolve Champion to Ultimate
  'Digital Terabytes', // Evolve Ultimate to Mega
  'Eviolite', // Prevents evolution but boosts stats
  'Everstone' // Prevents evolution
];

// Random type options for Aurorus Stone
const randomTypes = [
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison',
  'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark',
  'Steel', 'Fairy', 'Light', 'Sound', 'Cosmic'
];

/**
 * Check if a monster can evolve
 * @param {number} monsterId - Monster ID
 * @returns {Promise<Object>} Evolution options and source
 */
async function checkEvolutionOptions(monsterId) {
  try {
    // Get monster data
    const monster = await Monster.getById(monsterId);
    if (!monster) {
      return {
        canEvolve: false,
        evolutionOptions: [],
        source: null,
        monster: null
      };
    }

    // Initialize result
    const result = {
      canEvolve: false,
      evolutionOptions: [],
      source: null,
      monster: monster
    };

    // Check if monster has species1
    if (!monster.species1) {
      return result;
    }

    // Check Yokai
    const yokai = await Yokai.getByName(monster.species1);
    if (yokai) {
      // Yokai cannot evolve
      result.source = 'yokai';
      return result;
    }

    // Check Digimon
    const digimon = await Digimon.getByName(monster.species1);
    if (digimon) {
      result.source = 'digimon';

      // Check if Digimon has next evolutions
      if (digimon.nextEvolutions) {
        const nextEvolutions = digimon.nextEvolutions.split(',').map(e => e.trim()).filter(e => e);
        if (nextEvolutions.length > 0) {
          result.canEvolve = true;
          result.evolutionOptions = nextEvolutions;
        }
      }

      return result;
    }

    // Check Pokemon
    const pokemon = await Pokemon.getByName(monster.species1);
    if (pokemon) {
      result.source = 'pokemon';

      // Check if Pokemon has evolutions
      if (pokemon.EvolvesInto) {
        const evolvesInto = pokemon.EvolvesInto.split(',').map(e => e.trim()).filter(e => e);
        if (evolvesInto.length > 0) {
          result.canEvolve = true;
          result.evolutionOptions = evolvesInto;
        }
      }

      return result;
    }

    // If we get here, the species wasn't found in any database
    return result;
  } catch (error) {
    console.error('Error checking evolution options:', error);
    throw error;
  }
}

/**
 * Check evolution options for a specific species
 * @param {string} speciesName - Species name
 * @returns {Promise<Object>} Evolution options and source
 */
async function checkSpeciesEvolutionOptions(speciesName) {
  try {
    // Initialize result
    const result = {
      canEvolve: false,
      evolutionOptions: [],
      source: null
    };

    // Check Yokai
    const yokai = await Yokai.getByName(speciesName);
    if (yokai) {
      // Yokai cannot evolve
      result.source = 'yokai';
      return result;
    }

    // Check Digimon
    const digimon = await Digimon.getByName(speciesName);
    if (digimon) {
      result.source = 'digimon';

      // Check if Digimon has next evolutions
      if (digimon.nextEvolutions) {
        const nextEvolutions = digimon.nextEvolutions.split(',').map(e => e.trim()).filter(e => e);
        if (nextEvolutions.length > 0) {
          result.canEvolve = true;
          result.evolutionOptions = nextEvolutions;
        }
      }

      return result;
    }

    // Check Pokemon
    const pokemon = await Pokemon.getByName(speciesName);
    if (pokemon) {
      result.source = 'pokemon';

      // Check if Pokemon has evolutions
      if (pokemon.EvolvesInto) {
        const evolvesInto = pokemon.EvolvesInto.split(',').map(e => e.trim()).filter(e => e);
        if (evolvesInto.length > 0) {
          result.canEvolve = true;
          result.evolutionOptions = evolvesInto;
        }
      }

      return result;
    }

    // If we get here, the species wasn't found in any database
    return result;
  } catch (error) {
    console.error('Error checking species evolution options:', error);
    throw error;
  }
}

/**
 * Process evolution
 * @param {Object} evolutionData - Evolution data
 * @returns {Promise<Object>} Result of evolution
 */
async function processEvolution(evolutionData) {
  try {
    const {
      monsterId,
      trainerId,
      submissionUrl,
      useItem,
      itemName,
      selectedEvolution,
      speciesIndex
    } = evolutionData;

    // Validate required fields
    if (!monsterId || !trainerId || !submissionUrl) {
      return {
        success: false,
        message: 'Missing required fields'
      };
    }

    // Get monster data
    const monster = await Monster.getById(monsterId);
    if (!monster) {
      return {
        success: false,
        message: 'Monster not found'
      };
    }

    // Get trainer data
    const trainer = await Trainer.getById(trainerId);
    if (!trainer) {
      return {
        success: false,
        message: 'Trainer not found'
      };
    }

    // Verify trainer owns monster
    if (monster.trainer_id !== parseInt(trainerId)) {
      return {
        success: false,
        message: 'This trainer does not own this monster'
      };
    }

    // Determine which species to evolve
    let speciesName;
    const speciesIndexNum = speciesIndex ? parseInt(speciesIndex) : 1;

    console.log(`Processing evolution for monster ${monsterId} with species index: ${speciesIndexNum}`);
    console.log(`Monster species: species1=${monster.species1}, species2=${monster.species2}, species3=${monster.species3}`);

    switch (speciesIndexNum) {
      case 1:
        speciesName = monster.species1;
        console.log(`Using species1: ${speciesName}`);
        break;
      case 2:
        speciesName = monster.species2;
        console.log(`Using species2: ${speciesName}`);
        break;
      case 3:
        speciesName = monster.species3;
        console.log(`Using species3: ${speciesName}`);
        break;
      default:
        speciesName = monster.species1;
        console.log(`Using default species1: ${speciesName}`);
    }

    // Check evolution options
    const evolutionOptions = await checkSpeciesEvolutionOptions(speciesName);

    if (!evolutionOptions.canEvolve) {
      return {
        success: false,
        message: 'This monster cannot evolve'
      };
    }

    // Determine evolution target
    let newSpecies;
    if (evolutionOptions.evolutionOptions.length === 1) {
      newSpecies = evolutionOptions.evolutionOptions[0];
    } else if (selectedEvolution && evolutionOptions.evolutionOptions.includes(selectedEvolution)) {
      newSpecies = selectedEvolution;
    } else {
      return {
        success: false,
        message: 'Invalid evolution selection'
      };
    }

    // Process evolution
    if (useItem && itemName) {
      return await processEvolutionWithItem(monster, trainer, itemName, newSpecies, speciesIndex, submissionUrl);
    } else {
      return await processEvolutionWithoutItem(monster, newSpecies, speciesIndex, submissionUrl);
    }
  } catch (error) {
    console.error('Error processing evolution:', error);
    return {
      success: false,
      message: 'An error occurred while processing evolution'
    };
  }
}

/**
 * Process evolution with item
 * @param {Object} monster - Monster object
 * @param {Object} trainer - Trainer object
 * @param {string} itemName - Item name
 * @param {string} newSpecies - New species name
 * @param {number} speciesIndex - Species index to evolve
 * @param {string} submissionUrl - Submission URL
 * @returns {Promise<Object>} Result of evolution
 */
async function processEvolutionWithItem(monster, trainer, itemName, newSpecies, speciesIndex, submissionUrl) {
  try {
    // Check if trainer has the item
    console.log(`Checking if trainer ${trainer.id} has item ${itemName}`);
    const inventory = await Trainer.getInventory(trainer.id);
    console.log('Trainer inventory:', inventory);

    // Get evolution items from inventory
    let evolutionItems = {};
    if (inventory && inventory.inv_evolution) {
      evolutionItems = inventory.inv_evolution;
      console.log('Evolution items in inventory:', evolutionItems);
    } else {
      console.error(`No inv_evolution found in inventory for trainer ${trainer.id}`);
    }

    if (!evolutionItems[itemName] || evolutionItems[itemName] < 1) {
      console.error(`Item ${itemName} not found in trainer's inventory or quantity is less than 1`);
      return {
        success: false,
        message: `You don't have any ${itemName} in your inventory`
      };
    }

    console.log(`Trainer has ${evolutionItems[itemName]} of item ${itemName}`);


    // Check if item is a special item
    if (specialEvolutionItems.includes(itemName)) {
      // Handle Digital Repair Kit (allows setting any species for Digimon)
      if (itemName === 'Digital Repair Kit') {
        // Update monster species
        const updateData = {};
        const speciesIndexNum = speciesIndex ? parseInt(speciesIndex) : 1;

        console.log(`Updating monster species with index ${speciesIndexNum} to ${newSpecies}`);

        switch (speciesIndexNum) {
          case 1:
            updateData.species1 = newSpecies;
            console.log(`Setting species1 to ${newSpecies}`);
            break;
          case 2:
            updateData.species2 = newSpecies;
            console.log(`Setting species2 to ${newSpecies}`);
            break;
          case 3:
            updateData.species3 = newSpecies;
            console.log(`Setting species3 to ${newSpecies}`);
            break;
          default:
            updateData.species1 = newSpecies;
            console.log(`Setting default species1 to ${newSpecies}`);
        }

        await Monster.update(monster.mon_id, updateData);

        // Remove item from inventory
        await Trainer.updateInventoryItem(trainer.id, 'inv_evolution', itemName, -1);

        return {
          success: true,
          message: `${monster.name} has evolved into ${newSpecies}!`,
          submissionUrl: submissionUrl
        };
      }

      // Handle other special items (Digital Kilobytes, etc.)
      // These would typically have specific evolution paths based on the Digimon stage

      // Remove item from inventory
      await Trainer.updateInventoryItem(trainer.id, 'inv_evolution', itemName, -1);

      return {
        success: true,
        message: `${monster.name} has evolved into ${newSpecies}!`,
        submissionUrl: submissionUrl
      };
    }

    // Check if item is an evolution stone
    console.log(`Checking if ${itemName} is a valid evolution stone...`);
    console.log('Available evolution stones:', Object.keys(evolutionStoneTypes));

    if (evolutionStoneTypes[itemName]) {
      const stoneType = evolutionStoneTypes[itemName];
      console.log(`${itemName} is a valid evolution stone with type: ${stoneType}`);

      // Handle Aurorus Stone (adds random type)
      if (stoneType === 'Random') {
        // Select random type
        const randomType = randomTypes[Math.floor(Math.random() * randomTypes.length)];

        // Update monster
        const updateData = {};
        const speciesIndexNum = speciesIndex ? parseInt(speciesIndex) : 1;

        console.log(`Updating monster species with index ${speciesIndexNum} to ${newSpecies} using Aurorus Stone`);

        switch (speciesIndexNum) {
          case 1:
            updateData.species1 = newSpecies;
            console.log(`Setting species1 to ${newSpecies}`);
            break;
          case 2:
            updateData.species2 = newSpecies;
            console.log(`Setting species2 to ${newSpecies}`);
            break;
          case 3:
            updateData.species3 = newSpecies;
            console.log(`Setting species3 to ${newSpecies}`);
            break;
          default:
            updateData.species1 = newSpecies;
            console.log(`Setting default species1 to ${newSpecies}`);
        }

        // Add type if not already present
        const currentTypes = [
          monster.type1,
          monster.type2,
          monster.type3,
          monster.type4,
          monster.type5
        ].filter(Boolean);

        if (!currentTypes.includes(randomType)) {
          // Find first empty type slot
          if (!monster.type2) updateData.type2 = randomType;
          else if (!monster.type3) updateData.type3 = randomType;
          else if (!monster.type4) updateData.type4 = randomType;
          else if (!monster.type5) updateData.type5 = randomType;
          else {
            // No empty slots - evolution fails
            return {
              success: false,
              message: `Evolution failed. ${monster.name} already has 5 types and cannot add another type.`
            };
          }
        }

        await Monster.update(monster.mon_id, updateData);

        // Remove item from inventory
        await Trainer.updateInventoryItem(trainer.id, 'inv_evolution', itemName, -1);

        return {
          success: true,
          message: `${monster.name} has evolved into ${newSpecies} and gained the ${randomType} type!`,
          submissionUrl: submissionUrl
        };
      }

      // Handle Void Stone (doesn't add type)
      if (stoneType === 'None') {
        // Update monster species
        const updateData = {};

        if (speciesIndex === 1 || !speciesIndex) {
          updateData.species1 = newSpecies;
        } else if (speciesIndex === 2) {
          updateData.species2 = newSpecies;
        } else if (speciesIndex === 3) {
          updateData.species3 = newSpecies;
        }

        await Monster.update(monster.mon_id, updateData);

        // Remove item from inventory
        await Trainer.updateInventoryItem(trainer.id, 'inv_evolution', itemName, -1);

        return {
          success: true,
          message: `${monster.name} has evolved into ${newSpecies}!`,
          submissionUrl: submissionUrl
        };
      }

      // Handle regular evolution stone (adds type if not already present)
      const updateData = {};
      const speciesIndexNum = speciesIndex ? parseInt(speciesIndex) : 1;

      console.log(`Updating monster species with index ${speciesIndexNum} to ${newSpecies} using evolution stone`);

      switch (speciesIndexNum) {
        case 1:
          updateData.species1 = newSpecies;
          console.log(`Setting species1 to ${newSpecies}`);
          break;
        case 2:
          updateData.species2 = newSpecies;
          console.log(`Setting species2 to ${newSpecies}`);
          break;
        case 3:
          updateData.species3 = newSpecies;
          console.log(`Setting species3 to ${newSpecies}`);
          break;
        default:
          updateData.species1 = newSpecies;
          console.log(`Setting default species1 to ${newSpecies}`);
      }

      // Add type if not already present
      const currentTypes = [
        monster.type1,
        monster.type2,
        monster.type3,
        monster.type4,
        monster.type5
      ].filter(Boolean);

      if (!currentTypes.includes(stoneType)) {
        // Find first empty type slot
        if (!monster.type2) updateData.type2 = stoneType;
        else if (!monster.type3) updateData.type3 = stoneType;
        else if (!monster.type4) updateData.type4 = stoneType;
        else if (!monster.type5) updateData.type5 = stoneType;
        else {
          // No empty slots - evolution fails
          return {
            success: false,
            message: `Evolution failed. ${monster.name} already has 5 types and cannot add the ${stoneType} type.`
          };
        }
      }

      await Monster.update(monster.mon_id, updateData);

      // Remove item from inventory
      await Trainer.updateInventoryItem(trainer.id, 'inv_evolution', itemName, -1);

      return {
        success: true,
        message: `${monster.name} has evolved into ${newSpecies}${!currentTypes.includes(stoneType) ? ` and gained the ${stoneType} type!` : '!'}`,
        submissionUrl: submissionUrl
      };
    }

    // If we get here, the item is not a recognized evolution item
    console.error(`${itemName} is not recognized as a valid evolution item`);
    console.log('Valid special evolution items:', specialEvolutionItems);
    console.log('Valid evolution stones:', Object.keys(evolutionStoneTypes));

    return {
      success: false,
      message: `${itemName} is not a valid evolution item`
    };
  } catch (error) {
    console.error('Error processing evolution with item:', error);
    return {
      success: false,
      message: 'An error occurred while processing evolution with item'
    };
  }
}

/**
 * Process evolution without item
 * @param {Object} monster - Monster object
 * @param {string} newSpecies - New species name
 * @param {number} speciesIndex - Species index to evolve
 * @param {string} submissionUrl - Submission URL
 * @returns {Promise<Object>} Result of evolution
 */
async function processEvolutionWithoutItem(monster, newSpecies, speciesIndex, submissionUrl) {
  try {
    // Update monster species
    const updateData = {};
    const speciesIndexNum = speciesIndex ? parseInt(speciesIndex) : 1;

    console.log(`Updating monster species with index ${speciesIndexNum} to ${newSpecies} without item`);

    switch (speciesIndexNum) {
      case 1:
        updateData.species1 = newSpecies;
        console.log(`Setting species1 to ${newSpecies}`);
        break;
      case 2:
        updateData.species2 = newSpecies;
        console.log(`Setting species2 to ${newSpecies}`);
        break;
      case 3:
        updateData.species3 = newSpecies;
        console.log(`Setting species3 to ${newSpecies}`);
        break;
      default:
        updateData.species1 = newSpecies;
        console.log(`Setting default species1 to ${newSpecies}`);
    }

    await Monster.update(monster.mon_id, updateData);

    return {
      success: true,
      message: `${monster.name} has evolved into ${newSpecies}!`,
      submissionUrl: submissionUrl
    };
  } catch (error) {
    console.error('Error processing evolution without item:', error);
    return {
      success: false,
      message: 'An error occurred while processing evolution'
    };
  }
}

/**
 * Get evolution items for a trainer
 * @param {number} trainerId - Trainer ID
 * @returns {Promise<Array>} Evolution items
 */
async function getEvolutionItems(trainerId) {
  try {
    // Get all evolution items
    const allItems = await Item.getByCategory('evolution');

    // Get trainer's inventory
    const inventory = await Trainer.getInventory(trainerId);

    // Get evolution items from inventory
    let evolutionItems = {};
    if (inventory && inventory.inv_evolution) {
      evolutionItems = inventory.inv_evolution;
    }

    // Combine data
    return allItems.map(item => ({
      name: item.name,
      effect: item.effect,
      rarity: item.rarity,
      quantity: evolutionItems[item.name] || 0
    }));
  } catch (error) {
    console.error('Error getting evolution items:', error);
    throw error;
  }
}

module.exports = {
  checkEvolutionOptions,
  checkSpeciesEvolutionOptions,
  processEvolution,
  getEvolutionItems
};
