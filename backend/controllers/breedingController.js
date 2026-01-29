const asyncHandler = require('express-async-handler');
const Monster = require('../models/Monster');
const Trainer = require('../models/Trainer');
const User = require('../models/User');
const PokemonMonster = require('../models/PokemonMonster');
const DigimonMonster = require('../models/DigimonMonster');
const YokaiMonster = require('../models/YokaiMonster');
const NexomonMonster = require('../models/NexomonMonster');
const PalsMonster = require('../models/PalsMonster');
const MonsterRoller = require('../models/MonsterRoller');
const MonsterLineage = require('../models/MonsterLineage');
const { buildLimit } = require('../utils/dbUtils');
const MonsterInitializer = require('../utils/MonsterInitializer');
const SpecialBerryService = require('../services/specialBerryService');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');

// In-memory storage for breeding sessions
const breedingSessions = {};

/**
 * Get user settings for monster roller
 * @param {Object} user - User object
 * @returns {Object} User settings
 */
const getUserSettings = (user) => {
  // Default settings if user has no settings
  const defaultSettings = {
    pokemon_enabled: true,
    digimon_enabled: true,
    yokai_enabled: true,
    nexomon_enabled: true,
    pals_enabled: true,
    fakemon_enabled: true,
    finalfantasy_enabled: true,
    monsterhunter_enabled: true,
    species_min: 1,
    species_max: 2, // Default to max 2 species
    types_min: 1,
    types_max: 3    // Default to max 3 types
  };

  // If user has monster_roller_settings, parse them
  if (user && user.monster_roller_settings) {
    try {
      // Check if settings is already an object
      let settings;
      if (typeof user.monster_roller_settings === 'object') {
        settings = user.monster_roller_settings;
      } else {
        settings = JSON.parse(user.monster_roller_settings);
      }
      
      console.log('Breeding - Parsed settings from database:', settings);
      
      // Convert database format {pokemon: true} to expected format {pokemon_enabled: true}
      const convertedSettings = {};
      
      // Map database format to expected format
      if (settings.pokemon !== undefined) convertedSettings.pokemon_enabled = settings.pokemon;
      if (settings.digimon !== undefined) convertedSettings.digimon_enabled = settings.digimon;
      if (settings.yokai !== undefined) convertedSettings.yokai_enabled = settings.yokai;
      if (settings.pals !== undefined) convertedSettings.pals_enabled = settings.pals;
      if (settings.nexomon !== undefined) convertedSettings.nexomon_enabled = settings.nexomon;
      if (settings.fakemon !== undefined) convertedSettings.fakemon_enabled = settings.fakemon;
      if (settings.finalfantasy !== undefined) convertedSettings.finalfantasy_enabled = settings.finalfantasy;
      if (settings.monsterhunter !== undefined) convertedSettings.monsterhunter_enabled = settings.monsterhunter;

      // Also support if they're already in the expected format
      if (settings.pokemon_enabled !== undefined) convertedSettings.pokemon_enabled = settings.pokemon_enabled;
      if (settings.digimon_enabled !== undefined) convertedSettings.digimon_enabled = settings.digimon_enabled;
      if (settings.yokai_enabled !== undefined) convertedSettings.yokai_enabled = settings.yokai_enabled;
      if (settings.pals_enabled !== undefined) convertedSettings.pals_enabled = settings.pals_enabled;
      if (settings.nexomon_enabled !== undefined) convertedSettings.nexomon_enabled = settings.nexomon_enabled;
      if (settings.fakemon_enabled !== undefined) convertedSettings.fakemon_enabled = settings.fakemon_enabled;
      if (settings.finalfantasy_enabled !== undefined) convertedSettings.finalfantasy_enabled = settings.finalfantasy_enabled;
      if (settings.monsterhunter_enabled !== undefined) convertedSettings.monsterhunter_enabled = settings.monsterhunter_enabled;
      
      // Copy other settings (species_min, species_max, types_min, types_max)
      if (settings.species_min !== undefined) convertedSettings.species_min = settings.species_min;
      if (settings.species_max !== undefined) convertedSettings.species_max = settings.species_max;
      if (settings.types_min !== undefined) convertedSettings.types_min = settings.types_min;
      if (settings.types_max !== undefined) convertedSettings.types_max = settings.types_max;
      
      const result = { ...defaultSettings, ...convertedSettings };
      console.log('Breeding - Final userSettings:', result);
      return result;
    } catch (error) {
      console.error('Error parsing user monster roller settings:', error);
    }
  }

  return defaultSettings;
};

/**
 * Check if a species is eligible for breeding
 * @param {string} species - Species name
 * @returns {Promise<Object>} Eligibility result with status and reason
 */
const checkSpeciesEligibility = async (species) => {
  try {
    // Default to eligible
    const result = { eligible: true, reason: '' };

    // For Pals, all are eligible for breeding
    if (await isPalSpecies(species)) {
      return result;
    }

    // Check if it's a Pokemon
    if (await isPokemonSpecies(species)) {
      const stage = await getPokemonStage(species);
      if (stage && (stage !== 'Final Stage' && stage !== 'Doesn\'t Evolve')) {
        result.eligible = false;
        result.reason = `${species} is not in its final evolution stage`;
      }
    }
    // Check if it's a Yokai
    else if (await isYokaiSpecies(species)) {
      const stage = await getYokaiStage(species);
      if (stage && (stage !== 'Final Stage' && stage !== 'Doesn\'t Evolve')) {
        result.eligible = false;
        result.reason = `${species} is not in its final evolution stage`;
      }
    }
    // Check if it's a Nexomon
    else if (await isNexomonSpecies(species)) {
      const stage = await getNexomonStage(species);
      if (stage && (stage !== 'Final Stage' && stage !== 'Doesn\'t Evolve')) {
        result.eligible = false;
        result.reason = `${species} is not in its final evolution stage`;
      }
    }
    // Check if it's a Digimon
    else if (await isDigimonSpecies(species)) {
      const rank = await getDigimonRank(species);
      if (rank && (rank === 'Baby I' || rank === 'Baby II' || rank === 'Child')) {
        result.eligible = false;
        result.reason = `${species} is not mature enough for breeding`;
      }
    }
    // Check if it's a Fakemon
    else if (await isFakemonSpecies(species)) {
      const stage = await getFakemonStage(species);
      if (stage && (stage !== 'Final Stage' && stage !== 'Doesn\'t Evolve')) {
        result.eligible = false;
        result.reason = `${species} is not in its final evolution stage`;
      }
    }
    // Check if it's a Final Fantasy monster
    else if (await isFinalFantasySpecies(species)) {
      const stage = await getFinalFantasyStage(species);
      if (stage && (stage !== 'Final Stage' && stage !== 'Doesn\'t Evolve' && stage.toLowerCase() !== "doesn't evolve")) {
        result.eligible = false;
        result.reason = `${species} is not in its final evolution stage`;
      }
    }
    // Check if it's a Monster Hunter monster - all are always eligible (no evolution)
    else if (await isMonsterHunterSpecies(species)) {
      // Monster Hunter monsters don't evolve, so all are eligible
      return result;
    }

    return result;
  } catch (error) {
    console.error(`Error checking eligibility for species ${species}:`, error);
    return { eligible: false, reason: `Error checking eligibility for ${species}` };
  }
};

/**
 * Check if a monster is eligible for breeding
 * @param {Object} monster - Monster object
 * @returns {Object} Eligibility result with status and reason
 */
const checkBreedingEligibility = async (monster) => {
  try {
    // Default to eligible
    const result = { eligible: true, reason: '' };

    // Check if monster exists
    if (!monster) {
      result.eligible = false;
      result.reason = 'Monster not found';
      return result;
    }

    // Check each species of the monster
    const speciesToCheck = [monster.species1, monster.species2, monster.species3].filter(Boolean);

    // If no species found, monster is not eligible
    if (speciesToCheck.length === 0) {
      result.eligible = false;
      result.reason = 'Monster has no species';
      return result;
    }

    // Check eligibility for each species
    for (const species of speciesToCheck) {
      const speciesEligibility = await checkSpeciesEligibility(species);

      // If any species is not eligible, the monster is not eligible
      if (!speciesEligibility.eligible) {
        result.eligible = false;
        result.reason = speciesEligibility.reason;
        return result;
      }
    }

    return result;
  } catch (error) {
    console.error('Error checking breeding eligibility:', error);
    return { eligible: false, reason: 'Error checking eligibility' };
  }
};

/**
 * Check if a species is a Pokemon
 * @param {string} species - Species name
 * @returns {Promise<boolean>} True if species is a Pokemon
 */
const isPokemonSpecies = async (species) => {
  try {
    let query = 'SELECT * FROM pokemon_monsters WHERE name = $1';
    const params = [species];
    query += buildLimit(1, params);
    const pokemon = await db.asyncGet(query, params);
    return !!pokemon;
  } catch (error) {
    console.error('Error checking if species is Pokemon:', error);
    return false;
  }
};

/**
 * Check if a species is a Digimon
 * @param {string} species - Species name
 * @returns {Promise<boolean>} True if species is a Digimon
 */
const isDigimonSpecies = async (species) => {
  try {
    let query = 'SELECT * FROM digimon_monsters WHERE name = $1';
    const params = [species];
    query += buildLimit(1, params);
    const digimon = await db.asyncGet(query, params);
    return !!digimon;
  } catch (error) {
    console.error('Error checking if species is Digimon:', error);
    return false;
  }
};

/**
 * Check if a species is a Yokai
 * @param {string} species - Species name
 * @returns {Promise<boolean>} True if species is a Yokai
 */
const isYokaiSpecies = async (species) => {
  try {
    let query = 'SELECT * FROM yokai_monsters WHERE name = $1';
    const params = [species];
    query += buildLimit(1, params);
    const yokai = await db.asyncGet(query, params);
    return !!yokai;
  } catch (error) {
    console.error('Error checking if species is Yokai:', error);
    return false;
  }
};

/**
 * Check if a species is a Nexomon
 * @param {string} species - Species name
 * @returns {Promise<boolean>} True if species is a Nexomon
 */
const isNexomonSpecies = async (species) => {
  try {
    let query = 'SELECT * FROM nexomon_monsters WHERE name = $1';
    const params = [species];
    query += buildLimit(1, params);
    const nexomon = await db.asyncGet(query, params);
    return !!nexomon;
  } catch (error) {
    console.error('Error checking if species is Nexomon:', error);
    return false;
  }
};

/**
 * Check if a species is a Pal
 * @param {string} species - Species name
 * @returns {Promise<boolean>} True if species is a Pal
 */
const isPalSpecies = async (species) => {
  try {
    let query = 'SELECT * FROM pals_monsters WHERE name = $1';
    const params = [species];
    query += buildLimit(1, params);
    const pal = await db.asyncGet(query, params);
    return !!pal;
  } catch (error) {
    console.error('Error checking if species is Pal:', error);
    return false;
  }
};

/**
 * Check if a species is a Fakemon
 * @param {string} species - Species name
 * @returns {Promise<boolean>} True if species is a Fakemon
 */
const isFakemonSpecies = async (species) => {
  try {
    let query = 'SELECT * FROM fakemon WHERE name = $1';
    const params = [species];
    query += buildLimit(1, params);
    const fakemon = await db.asyncGet(query, params);
    return !!fakemon;
  } catch (error) {
    console.error('Error checking if species is Fakemon:', error);
    return false;
  }
};

/**
 * Check if a species is a Final Fantasy monster
 * @param {string} species - Species name
 * @returns {Promise<boolean>} True if species is a Final Fantasy monster
 */
const isFinalFantasySpecies = async (species) => {
  try {
    let query = 'SELECT * FROM finalfantasy_monsters WHERE name = $1';
    const params = [species];
    query += buildLimit(1, params);
    const ff = await db.asyncGet(query, params);
    return !!ff;
  } catch (error) {
    console.error('Error checking if species is Final Fantasy:', error);
    return false;
  }
};

/**
 * Check if a species is a Monster Hunter monster
 * @param {string} species - Species name
 * @returns {Promise<boolean>} True if species is a Monster Hunter monster
 */
const isMonsterHunterSpecies = async (species) => {
  try {
    let query = 'SELECT * FROM monsterhunter_monsters WHERE name = $1';
    const params = [species];
    query += buildLimit(1, params);
    const mh = await db.asyncGet(query, params);
    return !!mh;
  } catch (error) {
    console.error('Error checking if species is Monster Hunter:', error);
    return false;
  }
};

/**
 * Generate breeding results
 * @param {Object} parent1 - First parent monster
 * @param {Object} parent2 - Second parent monster
 * @param {Object} userSettings - User settings
 * @returns {Promise<Array>} Array of offspring monsters
 */
const generateBreedingResults = async (parent1, parent2, userSettings) => {
  try {
    console.log(`Generating breeding results for ${parent1.species1} and ${parent2.species1}`);

    // Determine number of offspring (1-4)
    const offspringCount = Math.floor(Math.random() * 4) + 1;
    console.log(`Will generate ${offspringCount} offspring`);

    const offspring = [];

    // Get enabled tables from user settings
    const enabledTables = [];
    if (userSettings.pokemon_enabled) enabledTables.push('pokemon');
    if (userSettings.digimon_enabled) enabledTables.push('digimon');
    if (userSettings.yokai_enabled) enabledTables.push('yokai');
    if (userSettings.nexomon_enabled) enabledTables.push('nexomon');
    if (userSettings.pals_enabled) enabledTables.push('pals');
    if (userSettings.fakemon_enabled) enabledTables.push('fakemon');
    if (userSettings.finalfantasy_enabled) enabledTables.push('finalfantasy');
    if (userSettings.monsterhunter_enabled) enabledTables.push('monsterhunter');

    // If no tables are enabled, enable all tables
    if (enabledTables.length === 0) {
      enabledTables.push('pokemon', 'digimon', 'yokai', 'nexomon', 'pals', 'fakemon', 'finalfantasy', 'monsterhunter');
    }

    console.log(`Enabled tables: ${enabledTables.join(', ')}`);

    // Generate offspring
    for (let i = 0; i < offspringCount; i++) {
      // Determine if mutation occurs (10% chance)
      const isMutation = Math.random() < 0.1;
      console.log(`Offspring ${i+1}: Mutation? ${isMutation}`);

      let offspringMonster;
      if (isMutation) {
        try {
          console.log(`Generating mutation for offspring ${i+1}`);
          // For mutations, roll a random monster with base stage or doesn't evolve
          const rollerOptions = {
            enabledTables,
            userSettings,
            seed: Date.now().toString() + i
          };

          const roller = new MonsterRoller(rollerOptions);

          // Set mutation parameters
          const mutationParams = {
            includeStages: ['Base Stage', 'Doesn\'t Evolve'],
            includeRanks: ['Baby I', 'Baby II', 'Child', 'E', 'D', 'C'],
            legendary: false,
            mythical: false
          };

          // Roll a random monster
          offspringMonster = await roller.rollMonster(mutationParams);
          console.log(`Mutation result: ${offspringMonster ? offspringMonster.species1 : 'failed'}`);

          // If rolling failed, fall back to normal breeding
          if (!offspringMonster || !offspringMonster.species1) {
            console.log(`Mutation failed, falling back to normal breeding`);
            offspringMonster = await determineOffspringSpecies(parent1, parent2, enabledTables);
          }
        } catch (mutationError) {
          console.error('Error during mutation:', mutationError);
          // Fall back to normal breeding
          console.log(`Mutation error, falling back to normal breeding`);
          offspringMonster = await determineOffspringSpecies(parent1, parent2, enabledTables);
        }
      } else {
        // For normal breeding, use breeding results from parent species
        console.log(`Using normal breeding for offspring ${i+1}`);
        offspringMonster = await determineOffspringSpecies(parent1, parent2, enabledTables);
      }

      // Combine parent types
      console.log(`Combining parent types for offspring ${i+1}`);
      offspringMonster = combineParentTypes(offspringMonster, parent1, parent2);

      // Random attribute
      offspringMonster.attribute = getRandomAttribute();
      console.log(`Final offspring ${i+1}: Species=${offspringMonster.species1}${offspringMonster.species2 ? '/' + offspringMonster.species2 : ''}, Types=${offspringMonster.type1}${offspringMonster.type2 ? '/' + offspringMonster.type2 : ''}${offspringMonster.type3 ? '/' + offspringMonster.type3 : ''}, Attribute=${offspringMonster.attribute}`);

      offspring.push(offspringMonster);
    }

    return offspring;
  } catch (error) {
    console.error('Error generating breeding results:', error);
    throw error;
  }
};

/**
 * Determine offspring species based on parent species
 * @param {Object} parent1 - First parent monster
 * @param {Object} parent2 - Second parent monster
 * @param {Array} enabledTables - Enabled monster tables
 * @returns {Promise<Object>} Offspring monster
 */
const determineOffspringSpecies = async (parent1, parent2, enabledTables) => {
  try {
    // Collect all parent species
    const parentSpecies = [];
    if (parent1.species1) parentSpecies.push(parent1.species1);
    if (parent1.species2) parentSpecies.push(parent1.species2);
    if (parent1.species3) parentSpecies.push(parent1.species3);
    if (parent2.species1) parentSpecies.push(parent2.species1);
    if (parent2.species2) parentSpecies.push(parent2.species2);
    if (parent2.species3) parentSpecies.push(parent2.species3);

    // Shuffle parent species to randomize selection
    const shuffledParentSpecies = parentSpecies.sort(() => 0.5 - Math.random());

    // Determine number of species for offspring (1-2)
    const speciesCount = Math.min(Math.floor(Math.random() * 2) + 1, shuffledParentSpecies.length);

    // Initialize offspring species
    let offspringSpecies1 = null;
    let offspringSpecies2 = null;

    // Try to get breeding results for the first selected parent species
    if (shuffledParentSpecies.length > 0) {
      const selectedParentSpecies = shuffledParentSpecies[0];
      let breedingResults = null;

      // Check which type of monster it is
      if (await isPokemonSpecies(selectedParentSpecies)) {
        let query = 'SELECT breeding_results FROM pokemon_monsters WHERE name = $1';
        const params = [selectedParentSpecies];
        query += buildLimit(1, params);
        const result = await db.asyncGet(query, params);
        if (result && result.breeding_results) {
          breedingResults = result.breeding_results;
        }
      } else if (await isDigimonSpecies(selectedParentSpecies)) {
        let query = 'SELECT breeding_results FROM digimon_monsters WHERE name = $1';
        const params = [selectedParentSpecies];
        query += buildLimit(1, params);
        const result = await db.asyncGet(query, params);
        if (result && result.breeding_results) {
          breedingResults = result.breeding_results;
        }
      } else if (await isYokaiSpecies(selectedParentSpecies)) {
        let query = 'SELECT breeding_results FROM yokai_monsters WHERE name = $1';
        const params = [selectedParentSpecies];
        query += buildLimit(1, params);
        const result = await db.asyncGet(query, params);
        if (result && result.breeding_results) {
          breedingResults = result.breeding_results;
        }
      } else if (await isNexomonSpecies(selectedParentSpecies)) {
        let query = 'SELECT breeds_into FROM nexomon_monsters WHERE name = $1';
        const params = [selectedParentSpecies];
        query += buildLimit(1, params);
        const result = await db.asyncGet(query, params);
        if (result && result.breeds_into) {
          breedingResults = result.breeds_into;
        }
      } else if (await isPalSpecies(selectedParentSpecies)) {
        let query = 'SELECT name FROM pals_monsters WHERE name = $1';
        const params = [selectedParentSpecies];
        query += buildLimit(1, params);
        const result = await db.asyncGet(query, params);
        if (result && result.name) {
          breedingResults = result.name;
        }
      } else if (await isFakemonSpecies(selectedParentSpecies)) {
        let query = 'SELECT breeding_results FROM fakemon WHERE name = $1';
        const params = [selectedParentSpecies];
        query += buildLimit(1, params);
        const result = await db.asyncGet(query, params);
        if (result && result.breeding_results) {
          breedingResults = result.breeding_results;
        }
      } else if (await isFinalFantasySpecies(selectedParentSpecies)) {
        // Final Fantasy uses breeding_results like Pokemon
        let query = 'SELECT breeding_results FROM finalfantasy_monsters WHERE name = $1';
        const params = [selectedParentSpecies];
        query += buildLimit(1, params);
        const result = await db.asyncGet(query, params);
        if (result && result.breeding_results) {
          breedingResults = result.breeding_results;
        }
      } else if (await isMonsterHunterSpecies(selectedParentSpecies)) {
        // Monster Hunter monsters always breed true - return the same species
        breedingResults = selectedParentSpecies;
      }

      // If we found breeding results, process them as a comma-separated string
      if (breedingResults) {
        // Split the string by commas and trim whitespace
        const speciesList = breedingResults.split(',').map(species => species.trim()).filter(Boolean);

        if (speciesList.length > 0) {
          // Randomly select one of the breeding results
          offspringSpecies1 = speciesList[Math.floor(Math.random() * speciesList.length)];
        }
      }

      // If we couldn't get breeding results or parse them, use the selected parent species
      if (!offspringSpecies1) {
        offspringSpecies1 = selectedParentSpecies;
      }
    }

    // If we need a second species and have more parent species available
    if (speciesCount > 1 && shuffledParentSpecies.length > 1) {
      // Use the second parent species directly (50% chance)
      // or try to get a breeding result from it (50% chance)
      const useDirectSpecies = Math.random() < 0;

      if (useDirectSpecies) {
        offspringSpecies2 = shuffledParentSpecies[1];
      } else {
        const selectedParentSpecies = shuffledParentSpecies[1];
        let breedingResults = null;

        // Check which type of monster it is (similar to above)
        if (await isPokemonSpecies(selectedParentSpecies)) {
          let query = 'SELECT breeding_results FROM pokemon_monsters WHERE name = $1';
          const params = [selectedParentSpecies];
          query += buildLimit(1, params);
          const result = await db.asyncGet(query, params);
          if (result && result.breeding_results) {
            breedingResults = result.breeding_results;
          }
        } else if (await isDigimonSpecies(selectedParentSpecies)) {
          let query = 'SELECT breeding_results FROM digimon_monsters WHERE name = $1';
          const params = [selectedParentSpecies];
          query += buildLimit(1, params);
          const result = await db.asyncGet(query, params);
          if (result && result.breeding_results) {
            breedingResults = result.breeding_results;
          }
        } else if (await isYokaiSpecies(selectedParentSpecies)) {
          let query = 'SELECT breeding_results FROM yokai_monsters WHERE name = $1';
          const params = [selectedParentSpecies];
          query += buildLimit(1, params);
          const result = await db.asyncGet(query, params);
          if (result && result.breeding_results) {
            breedingResults = result.breeding_results;
          }
        } else if (await isNexomonSpecies(selectedParentSpecies)) {
          let query = 'SELECT breeds_into FROM nexomon_monsters WHERE name = $1';
          const params = [selectedParentSpecies];
          query += buildLimit(1, params);
          const result = await db.asyncGet(query, params);
          if (result && result.breeds_into) {
            breedingResults = result.breeds_into;
          }
        } else if (await isPalSpecies(selectedParentSpecies)) {
          let query = 'SELECT name FROM pals_monsters WHERE name = $1';
          const params = [selectedParentSpecies];
          query += buildLimit(1, params);
          const result = await db.asyncGet(query, params);
          if (result && result.name) {
            breedingResults = result.name;
          }
        } else if (await isFakemonSpecies(selectedParentSpecies)) {
          let query = 'SELECT breeding_results FROM fakemon WHERE name = $1';
          const params = [selectedParentSpecies];
          query += buildLimit(1, params);
          const result = await db.asyncGet(query, params);
          if (result && result.breeding_results) {
            breedingResults = result.breeding_results;
          }
        } else if (await isFinalFantasySpecies(selectedParentSpecies)) {
          // Final Fantasy uses breeding_results like Pokemon
          let query = 'SELECT breeding_results FROM finalfantasy_monsters WHERE name = $1';
          const params = [selectedParentSpecies];
          query += buildLimit(1, params);
          const result = await db.asyncGet(query, params);
          if (result && result.breeding_results) {
            breedingResults = result.breeding_results;
          }
        } else if (await isMonsterHunterSpecies(selectedParentSpecies)) {
          // Monster Hunter monsters always breed true - return the same species
          breedingResults = selectedParentSpecies;
        }

        // Process breeding results
        if (breedingResults) {
          const speciesList = breedingResults.split(',').map(species => species.trim()).filter(Boolean);

          if (speciesList.length > 0) {
            offspringSpecies2 = speciesList[Math.floor(Math.random() * speciesList.length)];
          }
        }

        // Fallback to direct species if no breeding results
        if (!offspringSpecies2) {
          offspringSpecies2 = selectedParentSpecies;
        }
      }
    }

    // Ensure we don't have duplicate species
    if (offspringSpecies1 === offspringSpecies2) {
      offspringSpecies2 = null;
    }

    // Create offspring monster with the determined species
    const offspringMonster = {
      species1: offspringSpecies1 || (shuffledParentSpecies.length > 0 ? shuffledParentSpecies[0] : parent1.species1),
      species2: offspringSpecies2,
      species3: null,
      trainer_id: null, // Will be set when claimed
      player_user_id: null, // Will be set when claimed
      name: offspringSpecies1 || (shuffledParentSpecies.length > 0 ? shuffledParentSpecies[0] : parent1.species1) // Default name is the first species name
    };

    return offspringMonster;
  } catch (error) {
    console.error('Error determining offspring species:', error);
    // Fallback to parent1's species
    return {
      species1: parent1.species1,
      species2: null,
      species3: null,
      trainer_id: null,
      player_user_id: null,
      name: parent1.species1
    };
  }
};

/**
 * Combine parent types for offspring
 * @param {Object} offspring - Offspring monster
 * @param {Object} parent1 - First parent monster
 * @param {Object} parent2 - Second parent monster
 * @returns {Object} Offspring with combined types
 */
const combineParentTypes = (offspring, parent1, parent2) => {
  // Collect all parent types
  const parentTypes = [];
  if (parent1.type1) parentTypes.push(parent1.type1);
  if (parent1.type2) parentTypes.push(parent1.type2);
  if (parent1.type3) parentTypes.push(parent1.type3);
  if (parent1.type4) parentTypes.push(parent1.type4);
  if (parent1.type5) parentTypes.push(parent1.type5);
  if (parent2.type1) parentTypes.push(parent2.type1);
  if (parent2.type2) parentTypes.push(parent2.type2);
  if (parent2.type3) parentTypes.push(parent2.type3);
  if (parent2.type4) parentTypes.push(parent2.type4);
  if (parent2.type5) parentTypes.push(parent2.type5);

  // Remove duplicate types
  const uniqueTypes = [...new Set(parentTypes)];

  // Shuffle the unique types
  const shuffledTypes = uniqueTypes.sort(() => 0.5 - Math.random());

  // Determine number of types for offspring (1-3)
  // At least 1 type, at most 3 types, but limited by available unique types
  const typeCount = Math.min(Math.floor(Math.random() * 3) + 1, shuffledTypes.length);

  // Select the types for the offspring
  const selectedTypes = shuffledTypes.slice(0, typeCount);

  // Assign types to offspring
  offspring.type1 = selectedTypes[0] || null;
  offspring.type2 = selectedTypes[1] || null;
  offspring.type3 = selectedTypes[2] || null;
  offspring.type4 = null; // Limit to 3 types
  offspring.type5 = null; // Limit to 3 types

  return offspring;
};

/**
 * Get a random attribute
 * @returns {string} Random attribute
 */
const getRandomAttribute = () => {
  const attributes = ['Data', 'Virus', 'Vaccine', 'Variable', 'Free'];
  return attributes[Math.floor(Math.random() * attributes.length)];
};

/**
 * Get Pokemon stage by name
 * @param {string} species - Pokemon species name
 * @returns {Promise<string|null>} Pokemon stage or null if not found
 */
const getPokemonStage = async (species) => {
  try {
    let query = 'SELECT stage FROM pokemon_monsters WHERE name = $1';
    const params = [species];
    query += buildLimit(1, params);
    const pokemon = await db.asyncGet(query, params);
    return pokemon ? pokemon.stage : null;
  } catch (error) {
    console.error('Error getting Pokemon stage:', error);
    return null;
  }
};

/**
 * Get Yokai stage by name
 * @param {string} species - Yokai species name
 * @returns {Promise<string|null>} Yokai stage or null if not found
 */
const getYokaiStage = async (species) => {
  try {
    let query = 'SELECT stage FROM yokai_monsters WHERE name = $1';
    const params = [species];
    query += buildLimit(1, params);
    const yokai = await db.asyncGet(query, params);
    return yokai ? yokai.stage : null;
  } catch (error) {
    console.error('Error getting Yokai stage:', error);
    return null;
  }
};

/**
 * Get Nexomon stage by name
 * @param {string} species - Nexomon species name
 * @returns {Promise<string|null>} Nexomon stage or null if not found
 */
const getNexomonStage = async (species) => {
  try {
    let query = 'SELECT stage FROM nexomon_monsters WHERE name = $1';
    const params = [species];
    query += buildLimit(1, params);
    const nexomon = await db.asyncGet(query, params);
    return nexomon ? nexomon.stage : null;
  } catch (error) {
    console.error('Error getting Nexomon stage:', error);
    return null;
  }
};

/**
 * Get Digimon rank by name
 * @param {string} species - Digimon species name
 * @returns {Promise<string|null>} Digimon rank or null if not found
 */
const getDigimonRank = async (species) => {
  try {
    let query = 'SELECT rank FROM digimon_monsters WHERE name = $1';
    const params = [species];
    query += buildLimit(1, params);
    const digimon = await db.asyncGet(query, params);
    return digimon ? digimon.rank : null;
  } catch (error) {
    console.error('Error getting Digimon rank:', error);
    return null;
  }
};

/**
 * Get Fakemon stage by name
 * @param {string} species - Fakemon species name
 * @returns {Promise<string|null>} Fakemon stage or null if not found
 */
const getFakemonStage = async (species) => {
  try {
    let query = 'SELECT stage FROM fakemon WHERE name = $1';
    const params = [species];
    query += buildLimit(1, params);
    const fakemon = await db.asyncGet(query, params);
    return fakemon ? fakemon.stage : null;
  } catch (error) {
    console.error('Error getting Fakemon stage:', error);
    return null;
  }
};

/**
 * Get Final Fantasy monster stage by name
 * @param {string} species - Final Fantasy species name
 * @returns {Promise<string|null>} Final Fantasy stage or null if not found
 */
const getFinalFantasyStage = async (species) => {
  try {
    let query = 'SELECT stage FROM finalfantasy_monsters WHERE name = $1';
    const params = [species];
    query += buildLimit(1, params);
    const ff = await db.asyncGet(query, params);
    return ff ? ff.stage : null;
  } catch (error) {
    console.error('Error getting Final Fantasy stage:', error);
    return null;
  }
};

/**
 * @desc    Breed monsters
 * @route   POST /api/town/farm/breed
 * @access  Private
 */
const breedMonsters = asyncHandler(async (req, res) => {
  const { trainerId, parent1Id, parent2Id } = req.body;
  const userId = req.user.discord_id;

  // Validate input
  if (!trainerId || !parent1Id || !parent2Id) {
    res.status(400);
    throw new Error('Missing required parameters: trainerId, parent1Id, parent2Id');
  }

  // Check if trainer belongs to user
  const trainer = await Trainer.getById(trainerId);
  if (!trainer || trainer.player_user_id !== userId) {
    res.status(403);
    throw new Error('You can only breed with your own trainers');
  }

  // Get parent monsters
  const parent1 = await Monster.getById(parent1Id);
  const parent2 = await Monster.getById(parent2Id);

  if (!parent1 || !parent2) {
    res.status(404);
    throw new Error('One or both parent monsters not found');
  }

  // Check breeding eligibility
  const parent1Eligibility = await checkBreedingEligibility(parent1);
  const parent2Eligibility = await checkBreedingEligibility(parent2);

  if (!parent1Eligibility.eligible) {
    res.status(400);
    throw new Error(`Parent 1 is not eligible for breeding: ${parent1Eligibility.reason}`);
  }

  if (!parent2Eligibility.eligible) {
    res.status(400);
    throw new Error(`Parent 2 is not eligible for breeding: ${parent2Eligibility.reason}`);
  }

  // Get user settings
  const user = await User.findByDiscordId(userId);
  const userSettings = getUserSettings(user);

  // Generate breeding results
  const offspringData = await generateBreedingResults(parent1, parent2, userSettings);

  // Initialize offspring with stats, abilities, etc.
  const offspring = [];
  for (const monsterData of offspringData) {
    try {
      // Set default values for offspring
      monsterData.level = 1;
      monsterData.where_met = "Farm Breeding";
      monsterData.friendship = 70; // Higher base friendship for bred monsters

      // Initialize the monster using MonsterInitializer
      // We don't assign a trainer_id yet - that happens when the monster is claimed
      const initializedMonster = await MonsterInitializer.initializeMonster({
        ...monsterData
      });

      offspring.push(initializedMonster);
    } catch (error) {
      console.error('Error initializing offspring monster:', error);
      // Still add the basic monster data even if initialization fails
      offspring.push(monsterData);
    }
  }

  // Get available special berries
  const specialBerries = await SpecialBerryService.getAvailableSpecialBerries(trainerId);

  // Create breeding session
  const sessionId = uuidv4();
  const session = {
    sessionId,
    userId,
    trainerId,
    parent1Id,
    parent2Id,
    parent1,
    parent2,
    offspring,
    userSettings,
    specialBerries,
    claimedMonsters: [],
    createdAt: new Date().toISOString()
  };

  breedingSessions[sessionId] = session;

  // Return breeding results with session
  res.json({
    success: true,
    message: 'Breeding successful',
    data: {
      sessionId,
      parent1,
      parent2,
      offspring,
      specialBerries
    }
  });
});

/**
 * @desc    Claim a breeding result
 * @route   POST /api/town/farm/breed/claim
 * @access  Private
 */
const claimBreedingResult = asyncHandler(async (req, res) => {
  const { sessionId, monsterIndex } = req.body;
  const userId = req.user.discord_id;

  // Validate input
  if (!sessionId || monsterIndex === undefined) {
    res.status(400);
    throw new Error('Missing required parameters: sessionId, monsterIndex');
  }

  // Get breeding session
  const session = breedingSessions[sessionId];
  if (!session) {
    res.status(404);
    throw new Error('Breeding session not found');
  }

  if (session.userId !== userId) {
    res.status(403);
    throw new Error('You can only access your own breeding sessions');
  }

  // Check if monster index is valid
  if (monsterIndex < 0 || monsterIndex >= session.offspring.length) {
    res.status(400);
    throw new Error('Invalid monster index');
  }

  const monsterData = session.offspring[monsterIndex];

  // Check if this monster has already been claimed
  if (session.claimedMonsters.includes(monsterIndex)) {
    res.status(400);
    throw new Error('This monster has already been claimed');
  }

  // All offspring are claimable by default - no Edenwiess required

  try {
    // Get the trainer to ensure we use the correct Discord user ID
    const Trainer = require('../models/Trainer');
    const trainer = await Trainer.getById(session.trainerId);
    if (!trainer) {
      res.status(404);
      throw new Error('Trainer not found');
    }

    // Prepare monster data for initialization
    const monsterToInitialize = {
      ...monsterData,
      trainer_id: session.trainerId,
      player_user_id: trainer.player_user_id, // Use trainer's Discord user ID, not the requesting player's
      level: 1,
      where_met: "Farm Breeding",
      friendship: 70, // Higher base friendship for bred monsters
    };

    // Initialize the monster using MonsterInitializer
    const initializedMonster = await MonsterInitializer.initializeMonster(monsterToInitialize);

    // Save the monster to the database
    const savedMonster = await Monster.create(initializedMonster);

    // Add automatic lineage tracking for this bred monster
    try {
      await MonsterLineage.addBreedingLineage(
        session.parent1Id,
        session.parent2Id,
        [savedMonster.id]
      );
      console.log(`Added automatic lineage tracking for bred monster ${savedMonster.id}`);
    } catch (lineageError) {
      console.error('Error adding lineage tracking:', lineageError);
      // Don't fail the breeding if lineage tracking fails
    }

    // Mark monster as claimed
    session.claimedMonsters.push(monsterIndex);

    // Get updated special berries
    const updatedSpecialBerries = await SpecialBerryService.getAvailableSpecialBerries(session.trainerId);
    session.specialBerries = updatedSpecialBerries;

    // Return the saved monster
    res.json({
      success: true,
      message: 'Monster claimed successfully',
      data: {
        monster: savedMonster,
        claimedMonsters: session.claimedMonsters,
        specialBerries: updatedSpecialBerries
      }
    });
  } catch (error) {
    console.error('Error claiming breeding result:', error);
    res.status(500);
    throw new Error(`Failed to claim monster: ${error.message}`);
  }
});

/**
 * @desc    Check if a monster is eligible for breeding
 * @route   POST /api/town/farm/breed/check-eligibility
 * @access  Private
 */
const checkBreedingEligibilityEndpoint = asyncHandler(async (req, res) => {
  const { monsterId } = req.body;

  // Validate input
  if (!monsterId) {
    res.status(400);
    throw new Error('Missing required parameter: monsterId');
  }

  try {
    // Get the monster
    const monster = await Monster.getById(monsterId);

    if (!monster) {
      res.status(404);
      throw new Error('Monster not found');
    }

    // Check eligibility
    console.log(`Checking breeding eligibility for monster ${monsterId} (${monster.species1})`);
    const eligibilityResult = await checkBreedingEligibility(monster);
    console.log(`Eligibility result for ${monster.species1}: ${JSON.stringify(eligibilityResult)}`);

    // Return the result
    res.json({
      success: true,
      eligible: eligibilityResult.eligible,
      reason: eligibilityResult.reason
    });
  } catch (error) {
    console.error('Error checking breeding eligibility:', error);
    res.status(500);
    throw new Error(`Failed to check breeding eligibility: ${error.message}`);
  }
});

/**
 * @desc    Reroll breeding results using Forget-Me-Not berry
 * @route   POST /api/town/farm/breed/reroll
 * @access  Private
 */
const rerollBreedingResults = asyncHandler(async (req, res) => {
  const { sessionId } = req.body;
  const userId = req.user.discord_id;

  // Validate input
  if (!sessionId) {
    res.status(400);
    throw new Error('Missing required parameter: sessionId');
  }

  // Get breeding session
  const session = breedingSessions[sessionId];
  if (!session) {
    res.status(404);
    throw new Error('Breeding session not found');
  }

  if (session.userId !== userId) {
    res.status(403);
    throw new Error('You can only access your own breeding sessions');
  }

  // Check if trainer has Forget-Me-Not berry
  const hasForgetMeNot = await SpecialBerryService.hasSpecialBerry(session.trainerId, 'Forget-Me-Not');
  if (!hasForgetMeNot) {
    res.status(400);
    throw new Error('You do not have a Forget-Me-Not berry');
  }

  // Consume the berry
  const consumed = await SpecialBerryService.consumeSpecialBerry(session.trainerId, 'Forget-Me-Not');
  if (!consumed) {
    res.status(500);
    throw new Error('Failed to consume Forget-Me-Not berry');
  }

  // Generate new breeding results with same parameters
  const newOffspringData = await generateBreedingResults(session.parent1, session.parent2, session.userSettings);

  // Initialize new offspring
  const newOffspring = [];
  for (const monsterData of newOffspringData) {
    try {
      monsterData.level = 1;
      monsterData.where_met = "Farm Breeding";
      monsterData.friendship = 70;

      const initializedMonster = await MonsterInitializer.initializeMonster({
        ...monsterData
      });

      newOffspring.push(initializedMonster);
    } catch (error) {
      console.error('Error initializing rerolled offspring monster:', error);
      newOffspring.push(monsterData);
    }
  }

  // Update session with new offspring
  session.offspring = newOffspring;
  session.claimedMonsters = []; // Reset claimed monsters

  // Get updated special berries
  const updatedSpecialBerries = await SpecialBerryService.getAvailableSpecialBerries(session.trainerId);
  session.specialBerries = updatedSpecialBerries;

  res.json({
    success: true,
    message: 'Breeding results rerolled successfully',
    data: {
      sessionId,
      offspring: newOffspring,
      specialBerries: updatedSpecialBerries
    }
  });
});

/**
 * @desc    Get breeding session details
 * @route   GET /api/town/farm/breed/session/:sessionId
 * @access  Private
 */
const getBreedingSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const userId = req.user.discord_id;

  const session = breedingSessions[sessionId];
  if (!session) {
    res.status(404);
    throw new Error('Breeding session not found');
  }

  if (session.userId !== userId) {
    res.status(403);
    throw new Error('You can only access your own breeding sessions');
  }

  res.json({
    success: true,
    data: session
  });
});

module.exports = {
  breedMonsters,
  checkBreedingEligibility: checkBreedingEligibilityEndpoint,
  claimBreedingResult,
  rerollBreedingResults,
  getBreedingSession
};
