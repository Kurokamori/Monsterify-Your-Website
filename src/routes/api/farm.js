const express = require('express');
const router = express.Router();
const Trainer = require('../../models/Trainer');
const Monster = require('../../models/Monster');
const MonsterService = require('../../utils/MonsterService');
const Pokemon = require('../../models/Pokemon');
const Digimon = require('../../models/Digimon');
const Yokai = require('../../models/Yokai');

/**
 * Check if a monster is eligible for breeding
 * @param {Object} monster - Monster data
 * @returns {Promise<{eligible: boolean, reason: string|null}>} - Eligibility result
 */
async function checkMonsterEligibility(monster) {
  try {
    // Check if monster exists
    if (!monster) {
      return { eligible: false, reason: 'Monster not found' };
    }

    // Check species eligibility
    const species = [monster.species1, monster.species2, monster.species3].filter(Boolean);

    for (const speciesName of species) {
      // Check if it's a Yokai
      const yokai = await Yokai.getByName(speciesName);
      if (yokai) {
        // All Yokai are eligible
        continue;
      }

      // Check if it's a Digimon
      const digimon = await Digimon.getByName(speciesName);
      if (digimon) {
        // Check Digimon stage
        const stage = digimon.Stage;
        const ineligibleStages = ['Training 1', 'Training 2', 'Rookie'];

        if (ineligibleStages.includes(stage)) {
          return {
            eligible: false,
            reason: `Digimon ${speciesName} is ${stage} stage. Must be Champion or higher.`
          };
        }

        continue;
      }

      // Check if it's a Pokemon
      const pokemon = await Pokemon.getByName(speciesName);
      if (pokemon) {
        // Check Pokemon stage
        const stage = pokemon.Stage;
        const eligibleStages = ['Final Stage', 'Doesn\'t Evolve'];

        if (!eligibleStages.includes(stage)) {
          return {
            eligible: false,
            reason: `Pokemon ${speciesName} is not fully evolved. Must be Final Stage or Doesn't Evolve.`
          };
        }

        continue;
      }
    }

    return { eligible: true, reason: null };
  } catch (error) {
    console.error('Error checking monster eligibility:', error);
    return { eligible: false, reason: 'Error checking eligibility' };
  }
}

/**
 * Generate offspring from two parent monsters
 * @param {Object} parent1 - First parent monster
 * @param {Object} parent2 - Second parent monster
 * @param {number} count - Number of offspring to generate (1-4)
 * @returns {Promise<Array>} - Array of offspring data
 */
async function generateOffspring(parent1, parent2, count = 1) {
  try {
    const offspring = [];

    // Combine parent species and types for inheritance pool
    const speciesPool = [
      parent1.species1, parent1.species2, parent1.species3,
      parent2.species1, parent2.species2, parent2.species3
    ].filter(Boolean);

    const typePool = [
      parent1.type1, parent1.type2, parent1.type3, parent1.type4, parent1.type5,
      parent2.type1, parent2.type2, parent2.type3, parent2.type4, parent2.type5
    ].filter(Boolean);

    const attributePool = [
      parent1.attribute, parent2.attribute
    ].filter(Boolean);

    // Generate offspring
    for (let i = 0; i < count; i++) {
      const offspringData = {
        species1: null,
        species2: null,
        species3: null,
        type1: null,
        type2: null,
        type3: null,
        type4: null,
        type5: null,
        attribute: null
      };

      // Process species inheritance
      const inheritedSpecies = [];

      for (const speciesName of speciesPool) {
        // 10% chance of mutation for each species
        if (Math.random() < 0.1) {
          // Mutation - roll a random species
          const speciesTypes = ['Pokemon', 'Digimon', 'Yokai'];
          const randomSpeciesType = speciesTypes[Math.floor(Math.random() * speciesTypes.length)];

          let mutatedSpecies;

          switch (randomSpeciesType) {
            case 'Pokemon':
              // Only use base stage or doesn't evolve Pokemon
              const pokemonResult = await Pokemon.getRandom({
                Stage: ['Base Stage', 'Doesn\'t Evolve']
              }, 1);
              mutatedSpecies = pokemonResult[0]?.SpeciesName;
              break;
            case 'Digimon':
              // Only use Training 1 or Training 2 Digimon
              const digimonResult = await Digimon.getRandom({
                Stage: ['Training 1', 'Training 2']
              }, 1);
              mutatedSpecies = digimonResult[0]?.Name;
              break;
            case 'Yokai':
              // Any Yokai is fine
              const yokaiResult = await Yokai.getRandom({}, 1);
              mutatedSpecies = yokaiResult[0]?.Name;
              break;
          }

          if (mutatedSpecies && !inheritedSpecies.includes(mutatedSpecies)) {
            inheritedSpecies.push(mutatedSpecies);
          }
        } else {
          // Check species type for inheritance rules
          const yokai = await Yokai.getByName(speciesName);
          if (yokai) {
            // Yokai directly inherit
            if (!inheritedSpecies.includes(speciesName)) {
              inheritedSpecies.push(speciesName);
            }
            continue;
          }

          const digimon = await Digimon.getByName(speciesName);
          if (digimon) {
            // Digimon inherit a random Training 1 or Training 2 stage
            const trainingDigimon = await Digimon.getRandom({ Stage: ['Training 1', 'Training 2'] }, 1);
            if (trainingDigimon && trainingDigimon.length > 0) {
              const babyDigimon = trainingDigimon[0].Name;
              if (!inheritedSpecies.includes(babyDigimon)) {
                inheritedSpecies.push(babyDigimon);
              }
            }
            continue;
          }

          const pokemon = await Pokemon.getByName(speciesName);
          if (pokemon && pokemon.BreedingResultsIn) {
            // Pokemon inherit what's in BreedingResultsIn field
            if (!inheritedSpecies.includes(pokemon.BreedingResultsIn)) {
              inheritedSpecies.push(pokemon.BreedingResultsIn);
            }
            continue;
          }
        }
      }

      // Ensure we have at least one species
      if (inheritedSpecies.length === 0) {
        // Fallback to a random common species
        const speciesTypes = ['Pokemon', 'Digimon', 'Yokai'];
        const randomSpeciesType = speciesTypes[Math.floor(Math.random() * speciesTypes.length)];

        switch (randomSpeciesType) {
          case 'Pokemon':
            const pokemonResult = await Pokemon.getRandom({
              Rarity: 'Common',
              Stage: ['Base Stage', 'Doesn\'t Evolve']
            }, 1);
            inheritedSpecies.push(pokemonResult[0]?.SpeciesName);
            break;
          case 'Digimon':
            const digimonResult = await Digimon.getRandom({ Stage: 'Training 1' }, 1);
            inheritedSpecies.push(digimonResult[0]?.Name);
            break;
          case 'Yokai':
            const yokaiResult = await Yokai.getRandom({ Rank: 'E' }, 1);
            inheritedSpecies.push(yokaiResult[0]?.Name);
            break;
        }
      }

      // Assign species (up to 3)
      offspringData.species1 = inheritedSpecies[0] || null;
      offspringData.species2 = inheritedSpecies[1] || null;
      offspringData.species3 = inheritedSpecies[2] || null;

      // Process type inheritance
      const inheritedTypes = [];

      // Determine how many types to inherit (1-5)
      const typeCount = Math.floor(Math.random() * 5) + 1;

      for (let j = 0; j < typeCount; j++) {
        // 10% chance of mutation for each type
        if (Math.random() < 0.1) {
          // Mutation - roll a random type
          const allTypes = [
            'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison',
            'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark',
            'Steel', 'Fairy', 'Wind', 'Earth', 'Lightning', 'Wood', 'Vaccine', 'Data',
            'Virus', 'Free', 'Variable'
          ];

          const randomType = allTypes[Math.floor(Math.random() * allTypes.length)];

          if (!inheritedTypes.includes(randomType)) {
            inheritedTypes.push(randomType);
          }
        } else if (typePool.length > 0) {
          // Inherit a random type from the pool
          const randomIndex = Math.floor(Math.random() * typePool.length);
          const randomType = typePool[randomIndex];

          if (!inheritedTypes.includes(randomType)) {
            inheritedTypes.push(randomType);
          }
        }
      }

      // Ensure we have at least one type
      if (inheritedTypes.length === 0 && typePool.length > 0) {
        const randomIndex = Math.floor(Math.random() * typePool.length);
        inheritedTypes.push(typePool[randomIndex]);
      } else if (inheritedTypes.length === 0) {
        // Fallback to Normal type
        inheritedTypes.push('Normal');
      }

      // Assign types (up to 5)
      offspringData.type1 = inheritedTypes[0] || null;
      offspringData.type2 = inheritedTypes[1] || null;
      offspringData.type3 = inheritedTypes[2] || null;
      offspringData.type4 = inheritedTypes[3] || null;
      offspringData.type5 = inheritedTypes[4] || null;

      // Process attribute inheritance
      if (attributePool.length > 0) {
        // 10% chance of mutation
        if (Math.random() < 0.1) {
          // Mutation - roll a random attribute
          const allAttributes = ['Vaccine', 'Data', 'Virus', 'Free', 'Variable', 'Fire', 'Water', 'Wind', 'Earth', 'Light', 'Dark'];
          offspringData.attribute = allAttributes[Math.floor(Math.random() * allAttributes.length)];
        } else {
          // Inherit a random attribute from the pool
          const randomIndex = Math.floor(Math.random() * attributePool.length);
          offspringData.attribute = attributePool[randomIndex];
        }
      }

      offspring.push(offspringData);
    }

    return offspring;
  } catch (error) {
    console.error('Error generating offspring:', error);
    throw error;
  }
}

// API Routes

/**
 * @route POST /api/farm/breed/check-eligibility
 * @desc Check if monsters are eligible for breeding
 * @access Private
 */
router.post('/breed/check-eligibility', async (req, res) => {
  try {
    const { monster1Id, monster2Id } = req.body;

    // Get monsters
    const monster1 = await Monster.getById(monster1Id);
    const monster2 = await Monster.getById(monster2Id);

    if (!monster1 || !monster2) {
      return res.status(404).json({
        success: false,
        message: 'One or both monsters not found'
      });
    }

    // Check eligibility for both monsters
    const eligibility1 = await checkMonsterEligibility(monster1);
    const eligibility2 = await checkMonsterEligibility(monster2);

    if (!eligibility1.eligible) {
      return res.json({
        success: true,
        eligible: false,
        message: `First monster is not eligible: ${eligibility1.reason}`
      });
    }

    if (!eligibility2.eligible) {
      return res.json({
        success: true,
        eligible: false,
        message: `Second monster is not eligible: ${eligibility2.reason}`
      });
    }

    return res.json({
      success: true,
      eligible: true,
      message: 'Both monsters are eligible for breeding'
    });
  } catch (error) {
    console.error('Error checking breeding eligibility:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking breeding eligibility'
    });
  }
});

/**
 * @route POST /api/farm/breed/start
 * @desc Start breeding process and generate offspring
 * @access Private
 */
router.post('/breed/start', async (req, res) => {
  try {
    const { trainer1Id, monster1Id, monster2Id } = req.body;

    // Validate input
    if (!trainer1Id || !monster1Id || !monster2Id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters'
      });
    }

    // Get trainer
    const trainer = await Trainer.getById(trainer1Id);
    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }

    // Check if trainer has Legacy Leeway
    const inventory = await Trainer.getInventory(trainer1Id);
    const legacyLeewayCount = inventory?.inv_items?.['Legacy Leeway'] || 0;

    if (legacyLeewayCount < 1) {
      return res.status(400).json({
        success: false,
        message: 'Trainer does not have a Legacy Leeway'
      });
    }

    // Get monsters
    const monster1 = await Monster.getById(monster1Id);
    const monster2 = await Monster.getById(monster2Id);

    if (!monster1 || !monster2) {
      return res.status(404).json({
        success: false,
        message: 'One or both monsters not found'
      });
    }

    // Check eligibility for both monsters
    const eligibility1 = await checkMonsterEligibility(monster1);
    const eligibility2 = await checkMonsterEligibility(monster2);

    if (!eligibility1.eligible) {
      return res.status(400).json({
        success: false,
        message: `First monster is not eligible: ${eligibility1.reason}`
      });
    }

    if (!eligibility2.eligible) {
      return res.status(400).json({
        success: false,
        message: `Second monster is not eligible: ${eligibility2.reason}`
      });
    }

    // Use Legacy Leeway
    await Trainer.updateInventoryItem(trainer1Id, 'inv_items', 'Legacy Leeway', -1);

    // Generate random number of offspring (1-5) with cascading chances
    // 1: 40% chance, 2: 30% chance, 3: 15% chance, 4: 10% chance, 5: 5% chance
    let offspringCount;
    const roll = Math.random() * 100;
    if (roll < 40) {
      offspringCount = 1;
    } else if (roll < 70) {
      offspringCount = 2;
    } else if (roll < 85) {
      offspringCount = 3;
    } else if (roll < 95) {
      offspringCount = 4;
    } else {
      offspringCount = 5;
    }

    // Generate offspring
    const offspring = await generateOffspring(monster1, monster2, offspringCount);

    return res.json({
      success: true,
      message: `Successfully bred ${offspringCount} offspring`,
      offspring
    });
  } catch (error) {
    console.error('Error starting breeding:', error);
    return res.status(500).json({
      success: false,
      message: 'Error starting breeding process'
    });
  }
});

/**
 * @route POST /api/farm/breed/claim
 * @desc Claim an offspring monster
 * @access Private
 */
router.post('/breed/claim', async (req, res) => {
  try {
    const { trainerId, monsterName, monsterData } = req.body;

    // Validate input
    if (!trainerId || !monsterName || !monsterData) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters'
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

    // Create monster
    const monster = await MonsterService.claimMonster(monsterData, trainerId, monsterName);

    if (!monster) {
      return res.status(500).json({
        success: false,
        message: 'Error creating monster'
      });
    }

    return res.json({
      success: true,
      message: 'Monster claimed successfully',
      monster
    });
  } catch (error) {
    console.error('Error claiming offspring:', error);
    return res.status(500).json({
      success: false,
      message: 'Error claiming offspring'
    });
  }
});

module.exports = router;
