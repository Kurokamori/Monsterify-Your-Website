const Item = require('../models/Item');
const Monster = require('../models/Monster');
const TrainerInventory = require('../models/TrainerInventory');
const db = require('../config/db');
const { buildRandomLimit } = require('../utils/dbUtils');
const MonsterRoller = require('../models/MonsterRoller');
const User = require('../models/User');
const Trainer = require('../models/Trainer');

/**
 * Get user settings for monster roller
 * @param {Object} user - User object
 * @returns {Object} User settings
 */
const getUserSettings = (user) => {
  // Default settings if user has no settings
  const defaultSettings = {
    pokemon: true,
    digimon: true,
    yokai: true,
    nexomon: true,
    pals: true,
    fakemon: true,
    finalfantasy: true,
    monsterhunter: true
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
      return { ...defaultSettings, ...settings };
    } catch (error) {
      console.error('Error parsing user monster roller settings:', error);
    }
  }

  return defaultSettings;
};

/**
 * Controller for items
 */
const itemsController = {
  /**
   * Use a berry on a monster
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  useBerry: async (req, res) => {
    try {
      const { monsterId, berryName, trainerId, speciesValue } = req.body;

      // Validate input
      if (!monsterId || !berryName || !trainerId) {
        return res.status(400).json({
          success: false,
          message: 'Missing required parameters'
        });
      }

      // Get trainer and user settings for monster rolling
      const trainer = await Trainer.getById(trainerId);
      if (!trainer) {
        return res.status(404).json({
          success: false,
          message: 'Trainer not found'
        });
      }

      const user = await User.findByDiscordId(trainer.player_user_id);
      const userSettings = getUserSettings(user);

      // Check if the trainer has the berry
      const inventory = await TrainerInventory.getItemByTrainerAndName(trainerId, berryName);

      if (!inventory || inventory.quantity < 1) {
        return res.status(400).json({
          success: false,
          message: `Trainer does not have ${berryName}`
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

      // Check if the monster belongs to the trainer
      if (monster.trainer_id !== parseInt(trainerId)) {
        return res.status(403).json({
          success: false,
          message: 'This monster does not belong to the trainer'
        });
      }

      // Apply berry effect
      let updatedMonster = { ...monster };
      let berryApplied = false;

      switch (berryName) {
        // Species removal berries - all should compact species after removal
        case 'Bugger Berry':
          if (monster.species2) {
            updatedMonster.species1 = monster.species2;
            updatedMonster.species2 = monster.species3 || null;
            updatedMonster.species3 = null;
            berryApplied = true;
          }
          break;
        case 'Mala Berry':
          if (monster.species2) {
            // Remove species2 and shift remaining species down
            updatedMonster.species2 = monster.species3 || null;
            updatedMonster.species3 = null;
            berryApplied = true;
          }
          break;
        case 'Merco Berry':
          if (monster.species3) {
            // Remove species3 (no shifting needed as it's the last slot)
            updatedMonster.species3 = null;
            berryApplied = true;
          }
          break;

        // Type removal berries - all should compact types after removal
        case 'Siron Berry':
          // Remove first type and shift remaining types, only if there is more than one type
          if (monster.type2 || monster.type3 || monster.type4 || monster.type5) {
            // Shift all types down by one position
            updatedMonster.type1 = monster.type2;
            updatedMonster.type2 = monster.type3;
            updatedMonster.type3 = monster.type4;
            updatedMonster.type4 = monster.type5;
            updatedMonster.type5 = null;
            berryApplied = true;
          }
          break;
        case 'Lilan Berry':
          if (monster.type2) {
            // Remove type2 and shift remaining types down
            updatedMonster.type2 = monster.type3;
            updatedMonster.type3 = monster.type4;
            updatedMonster.type4 = monster.type5;
            updatedMonster.type5 = null;
            berryApplied = true;
          }
          break;
        case 'Kham Berry':
          if (monster.type3) {
            // Remove type3 and shift remaining types down
            updatedMonster.type3 = monster.type4;
            updatedMonster.type4 = monster.type5;
            updatedMonster.type5 = null;
            berryApplied = true;
          }
          break;
        case 'Maizi Berry':
          if (monster.type4) {
            // Remove type4 and shift remaining types down
            updatedMonster.type4 = monster.type5;
            updatedMonster.type5 = null;
            berryApplied = true;
          }
          break;
        case 'Fani Berry':
          if (monster.type5) {
            // Remove type5 (no shifting needed as it's the last slot)
            updatedMonster.type5 = null;
            berryApplied = true;
          }
          break;

        // Type randomization berries
        case 'Miraca Berry': {
          let types = await getRandomType();
          // Check if the randomized type is a type the monster already has, and if so, generate a new random type
          while (types.includes(monster.type1, monster.type2, monster.type3, monster.type4, monster.type5)) {
            types = await getRandomType();
          }
          updatedMonster.type1 = types[0];
          berryApplied = true;
          break;
        }
        case 'Cocon Berry':
          if (monster.type2) {
            let types = await getRandomType();
            while (types.includes(monster.type1, monster.type2, monster.type3, monster.type4, monster.type5)) {
              types = await getRandomType();
            }
            updatedMonster.type2 = types[0];
            berryApplied = true;
          }
          break;
        case 'Durian Berry':
          if (monster.type3) {
            let types = await getRandomType();
            while (types.includes(monster.type1, monster.type2, monster.type3, monster.type4, monster.type5)) {
              types = await getRandomType();
            }
            updatedMonster.type3 = types[0];
            berryApplied = true;
          }
          break;
        case 'Monel Berry':
          if (monster.type4) {
            let types = await getRandomType();
            while (types.includes(monster.type1, monster.type2, monster.type3, monster.type4, monster.type5)) {
              types = await getRandomType();
            }
            updatedMonster.type4 = types[0];
            berryApplied = true;
          }
          break;
        case 'Perep Berry':
          if (monster.type5) {
            let types = await getRandomType();
            while (types.includes(monster.type1, monster.type2, monster.type3, monster.type4, monster.type5)) {
              types = await getRandomType();
            }
            updatedMonster.type5 = types[0];
            berryApplied = true;
          }
          break;

        // Type addition berries
        case 'Addish Berry':
          if (!monster.type2) {
            const types = await getRandomType();
            updatedMonster.type2 = types[0];
            berryApplied = true;
          }
          break;
        case 'Sky Carrot Berry':
          if (!monster.type3) {
            const types = await getRandomType();
            updatedMonster.type3 = types[0];
            berryApplied = true;
          }
          break;
        case 'Kembre Berry':
          if (!monster.type4) {
            const types = await getRandomType();
            updatedMonster.type4 = types[0];
            berryApplied = true;
          }
          break;
        case 'Espara Berry':
          if (!monster.type5) {
            const types = await getRandomType();
            updatedMonster.type5 = types[0];
            berryApplied = true;
          }
          break;

        // Species randomization berries
        case 'Patama Berry': {
          if (speciesValue) {
            updatedMonster.species1 = speciesValue;
          } else {
            const species = await getRandomSpecies(userSettings);
            updatedMonster.species1 = species[0];
          }
          berryApplied = true;
          break;
        }
        case 'Bluk Berry':
          if (monster.species2) {
            if (speciesValue) {
              updatedMonster.species2 = speciesValue;
            } else {
              const species = await getRandomSpecies(userSettings);
              updatedMonster.species2 = species[0];
            }
            berryApplied = true;
          }
          break;
        case 'Nuevo Berry':
          if (monster.species3) {
            if (speciesValue) {
              updatedMonster.species3 = speciesValue;
            } else {
              const species = await getRandomSpecies(userSettings);
              updatedMonster.species3 = species[0];
            }
            berryApplied = true;
          }
          break;

        // Species addition berries
        case 'Azzuk Berry':
          if (!monster.species2) {
            if (speciesValue) {
              updatedMonster.species2 = speciesValue;
            } else {
              const species = await getRandomSpecies(userSettings);
              updatedMonster.species2 = species[0];
            }
            berryApplied = true;
          }
          break;
        case 'Mangus Berry':
          if (!monster.species3) {
            if (speciesValue) {
              updatedMonster.species3 = speciesValue;
            } else {
              const species = await getRandomSpecies(userSettings);
              updatedMonster.species3 = species[0];
            }
            berryApplied = true;
          }
          break;

        // Attribute randomization berries
        case 'Datei Berry': {
          const attributes = ['Vaccine', 'Data', 'Virus', 'Free', 'Variable'];
          const randomIndex = Math.floor(Math.random() * attributes.length);
          updatedMonster.attribute = attributes[randomIndex];
          berryApplied = true;
          break;
        }

        // Species splitting berry
        case 'Divest Berry': {
          // Check if monster has at least 2 species
          if (!monster.species2) {
            return res.status(400).json({
              success: false,
              message: 'Monster must have at least 2 species to use Divest Berry'
            });
          }

          try {
            const Monster = require('../models/Monster');
            const MonsterInitializer = require('../utils/MonsterInitializer');
            
            let newMonster2Data = null;

            if (monster.species3) {
              // Case: 3 species -> split into 2 monsters
              // Monster1 keeps species1 + species2, Monster2 gets species3
              updatedMonster.species3 = null; // Remove species3 from original monster
              
              // Create new monster with species3 only
              newMonster2Data = {
                name: `${monster.name} Clone`,
                trainer_id: monster.trainer_id,
                player_user_id: monster.player_user_id,
                species1: monster.species3,
                species2: null,
                species3: null,
                type1: monster.type1,
                type2: monster.type2,
                type3: monster.type3,
                type4: monster.type4,
                type5: monster.type5,
                attribute: monster.attribute,
                level: 1,
                where_met: 'Species Split',
                date_met: new Date().toISOString().split('T')[0]
              };
            } else {
              // Case: 2 species -> split into 2 monsters  
              // Monster1 keeps species1, Monster2 gets species2
              const originalSpecies2 = monster.species2;
              updatedMonster.species2 = null; // Remove species2 from original monster
              
              // Create new monster with species2 only
              newMonster2Data = {
                name: `${monster.name} Clone`,
                trainer_id: monster.trainer_id,
                player_user_id: monster.player_user_id,
                species1: originalSpecies2,
                species2: null,
                species3: null,
                type1: monster.type1,
                type2: monster.type2,
                type3: monster.type3,
                type4: monster.type4,
                type5: monster.type5,
                attribute: monster.attribute,
                level: 1,
                where_met: 'Species Split',
                date_met: new Date().toISOString().split('T')[0]
              };
            }

            // Initialize the new monster with proper stats, IVs, moves, etc.
            const initializedNewMonsterData = await MonsterInitializer.initializeMonster(newMonster2Data);
            
            // Create the new monster in the database
            const newMonster = await Monster.create(initializedNewMonsterData);
            
            console.log(`Created new monster from Divest Berry: ${newMonster.id} (${newMonster.name}) with species ${newMonster.species1}`);
            
            // Store reference to the new monster for the response
            updatedMonster._newMonster = newMonster;
            
            berryApplied = true;
          } catch (error) {
            console.error('Error creating split monster:', error);
            return res.status(500).json({
              success: false,
              message: 'Failed to create split monster'
            });
          }
          break;
        }

        default:
          console.log('Unknown berry attempted:', berryName);
          return res.status(400).json({
            success: false,
            message: `Unknown berry: ${berryName}`
          });
      }

      if (!berryApplied) {
        return res.status(400).json({
          success: false,
          message: `Cannot apply ${berryName} to this monster`
        });
      }

      // Update the monster
      // Remove trainer_name and any temporary fields from updatedMonster to avoid SQL error
      const { trainer_name, _newMonster, ...cleanMonsterData } = updatedMonster;
      await Monster.update(monsterId, cleanMonsterData);

      // Consume the berry
      console.log(`Consuming berry: trainerId=${trainerId}, berry=${berryName}, quantity=1`);
      const consumeSuccess = await TrainerInventory.removeItem(trainerId, 'berries', berryName, 1);
      console.log(`Berry consumption result: ${consumeSuccess}`);

      // Prepare response
      const response = {
        success: true,
        message: `Successfully applied ${berryName} to the monster`,
        monster: updatedMonster
      };

      // Include new monster data for Divest Berry
      if (berryName === 'Divest Berry' && _newMonster) {
        response.newMonster = _newMonster;
        response.message = `Successfully applied ${berryName} to split ${monster.name} into two monsters`;
      }

      return res.status(200).json(response);
    } catch (error) {
      console.error('Error using berry:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  /**
   * Use a pastry on a monster
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  usePastry: async (req, res) => {
    try {
      const { monsterId, pastryName, trainerId, selectedValue } = req.body;

      // Validate input
      if (!monsterId || !pastryName || !trainerId) {
        return res.status(400).json({
          success: false,
          message: 'Missing required parameters'
        });
      }

      // If no selectedValue is provided, return requiresSelection response
      if (!selectedValue) {
        return res.status(200).json({
          success: true,
          message: 'Please select a value for the pastry',
          pastryName,
          requiresSelection: true
        });
      }

      // For species-setting pastries, validate that the selectedValue is not evolved, legendary, or mythical
      const speciesPastries = ['Patama Pastry', 'Bluk Pastry', 'Nuevo Pastry', 'Azzuk Pastry', 'Mangus Pastry'];
      if (speciesPastries.includes(pastryName)) {
        const validationResult = await validateSpeciesForPastry(selectedValue);
        if (!validationResult.valid) {
          return res.status(400).json({
            success: false,
            message: validationResult.error || `Invalid species: ${selectedValue}. Pastries can only use base stage, unevolved species (no legendaries, mythicals, or evolved forms).`
          });
        }
      }

      // Check if the trainer has the pastry
      const inventory = await TrainerInventory.getItemByTrainerAndName(trainerId, pastryName);
      if (!inventory || inventory.quantity < 1) {
        return res.status(400).json({
          success: false,
          message: `Trainer does not have ${pastryName}`
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

      // Check if the monster belongs to the trainer
      if (monster.trainer_id !== parseInt(trainerId)) {
        return res.status(403).json({
          success: false,
          message: 'This monster does not belong to the trainer'
        });
      }

      // Apply pastry effect
      let updatedMonster = { ...monster };
      let pastryApplied = false;

      console.log('Applying pastry:', pastryName);
      console.log('Selected value:', selectedValue);
      console.log('Monster before update:', monster);

      switch (pastryName) {
        // Type setting pastries
        case 'Miraca Pastry':
          updatedMonster.type1 = selectedValue;
          pastryApplied = true;
          break;
        case 'Cocon Pastry':
          if (monster.type2) {
            updatedMonster.type2 = selectedValue;
            pastryApplied = true;
          }
          break;
        case 'Durian Pastry':
          if (monster.type3) {
            updatedMonster.type3 = selectedValue;
            pastryApplied = true;
          }
          break;
        case 'Monel Pastry':
          if (monster.type4) {
            updatedMonster.type4 = selectedValue;
            pastryApplied = true;
          }
          break;
        case 'Perep Pastry':
          if (monster.type5) {
            updatedMonster.type5 = selectedValue;
            pastryApplied = true;
          }
          break;

        // Type addition pastries
        case 'Addish Pastry':
          if (!monster.type2) {
            updatedMonster.type2 = selectedValue;
            pastryApplied = true;
          }
          break;
        case 'Sky Carrot Pastry':
          if (!monster.type3) {
            updatedMonster.type3 = selectedValue;
            pastryApplied = true;
          }
          break;
        case 'Kembre Pastry':
          if (!monster.type4) {
            updatedMonster.type4 = selectedValue;
            pastryApplied = true;
          }
          break;
        case 'Espara Pastry':
          if (!monster.type5) {
            updatedMonster.type5 = selectedValue;
            pastryApplied = true;
          }
          break;

        // Species setting pastries
        case 'Patama Pastry':
          updatedMonster.species1 = selectedValue;
          pastryApplied = true;
          break;
        case 'Bluk Pastry':
          if (monster.species2) {
            updatedMonster.species2 = selectedValue;
            pastryApplied = true;
          }
          break;
        case 'Nuevo Pastry':
          if (monster.species3) {
            updatedMonster.species3 = selectedValue;
            pastryApplied = true;
          }
          break;

        // Species addition pastries
        case 'Azzuk Pastry':
          if (!monster.species2) {
            updatedMonster.species2 = selectedValue;
            pastryApplied = true;
          }
          break;
        case 'Mangus Pastry':
          if (!monster.species3) {
            updatedMonster.species3 = selectedValue;
            pastryApplied = true;
          }
          break;

        // Attribute setting pastry
        case 'Datei Pastry':
          updatedMonster.attribute = selectedValue;
          pastryApplied = true;
          break;

        default:
          return res.status(400).json({
            success: false,
            message: `Unknown pastry: ${pastryName}`
          });
      }

      console.log('Monster after update:', updatedMonster);
      console.log('Pastry applied:', pastryApplied);

      if (!pastryApplied) {
        return res.status(400).json({
          success: false,
          message: `Cannot apply ${pastryName} to this monster`
        });
      }

      // Update the monster
      // Remove trainer_name from updatedMonster to avoid SQL error
      const { trainer_name, ...cleanMonsterData } = updatedMonster;
      await Monster.update(monsterId, cleanMonsterData);

      // Consume the pastry
      console.log(`Consuming pastry: trainerId=${trainerId}, pastry=${pastryName}, quantity=1`);
      const consumeSuccess = await TrainerInventory.removeItem(trainerId, 'pastries', pastryName, 1);
      console.log(`Pastry consumption result: ${consumeSuccess}`);

      return res.status(200).json({
        success: true,
        message: `Successfully applied ${pastryName} to the monster`,
        monster: updatedMonster
      });
    } catch (error) {
      console.error('Error using pastry:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  /**
   * Apply pastry with selected value
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  applyPastry: async (req, res) => {
    try {
      const { monsterId, pastryName, trainerId, selectedValue } = req.body;

      // Validate input
      if (!monsterId || !pastryName || !trainerId || !selectedValue) {
        return res.status(400).json({
          success: false,
          message: 'Missing required parameters'
        });
      }

      // For species-setting pastries, validate that the selectedValue is not evolved, legendary, or mythical
      const speciesPastries = ['Patama Pastry', 'Bluk Pastry', 'Nuevo Pastry', 'Azzuk Pastry', 'Mangus Pastry'];
      if (speciesPastries.includes(pastryName)) {
        const validationResult = await validateSpeciesForPastry(selectedValue);
        if (!validationResult.valid) {
          return res.status(400).json({
            success: false,
            message: validationResult.error || `Invalid species: ${selectedValue}. Pastries can only use base stage, unevolved species (no legendaries, mythicals, or evolved forms).`
          });
        }
      }

      // Check if the trainer has the pastry
      const inventory = await TrainerInventory.getItemByTrainerAndName(trainerId, pastryName);
      if (!inventory || inventory.quantity < 1) {
        return res.status(400).json({
          success: false,
          message: `Trainer does not have ${pastryName}`
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

      // Check if the monster belongs to the trainer
      if (monster.trainer_id !== parseInt(trainerId)) {
        return res.status(403).json({
          success: false,
          message: 'This monster does not belong to the trainer'
        });
      }

      // Apply pastry effect
      let updatedMonster = { ...monster };
      let pastryApplied = false;

      console.log('Applying pastry:', pastryName);
      console.log('Selected value:', selectedValue);
      console.log('Monster before update:', monster);

      switch (pastryName) {
        // Type setting pastries
        case 'Miraca Pastry':
          updatedMonster.type1 = selectedValue;
          pastryApplied = true;
          break;
        case 'Cocon Pastry':
          if (monster.type2) {
            updatedMonster.type2 = selectedValue;
            pastryApplied = true;
          }
          break;
        case 'Durian Pastry':
          if (monster.type3) {
            updatedMonster.type3 = selectedValue;
            pastryApplied = true;
          }
          break;
        case 'Monel Pastry':
          if (monster.type4) {
            updatedMonster.type4 = selectedValue;
            pastryApplied = true;
          }
          break;
        case 'Perep Pastry':
          if (monster.type5) {
            updatedMonster.type5 = selectedValue;
            pastryApplied = true;
          }
          break;

        // Type addition pastries
        case 'Addish Pastry':
          if (!monster.type2) {
            updatedMonster.type2 = selectedValue;
            pastryApplied = true;
          }
          break;
        case 'Sky Carrot Pastry':
          if (!monster.type3) {
            updatedMonster.type3 = selectedValue;
            pastryApplied = true;
          }
          break;
        case 'Kembre Pastry':
          if (!monster.type4) {
            updatedMonster.type4 = selectedValue;
            pastryApplied = true;
          }
          break;
        case 'Espara Pastry':
          if (!monster.type5) {
            updatedMonster.type5 = selectedValue;
            pastryApplied = true;
          }
          break;

        // Species setting pastries
        case 'Patama Pastry':
          updatedMonster.species1 = selectedValue;
          pastryApplied = true;
          break;
        case 'Bluk Pastry':
          if (monster.species2) {
            updatedMonster.species2 = selectedValue;
            pastryApplied = true;
          }
          break;
        case 'Nuevo Pastry':
          if (monster.species3) {
            updatedMonster.species3 = selectedValue;
            pastryApplied = true;
          }
          break;

        // Species addition pastries
        case 'Azzuk Pastry':
          if (!monster.species2) {
            updatedMonster.species2 = selectedValue;
            pastryApplied = true;
          }
          break;
        case 'Mangus Pastry':
          if (!monster.species3) {
            updatedMonster.species3 = selectedValue;
            pastryApplied = true;
          }
          break;

        // Attribute setting pastry
        case 'Datei Pastry':
          updatedMonster.attribute = selectedValue;
          pastryApplied = true;
          break;

        default:
          return res.status(400).json({
            success: false,
            message: `Unknown pastry: ${pastryName}`
          });
      }

      console.log('Monster after update:', updatedMonster);
      console.log('Pastry applied:', pastryApplied);

      if (!pastryApplied) {
        return res.status(400).json({
          success: false,
          message: `Cannot apply ${pastryName} to this monster`
        });
      }

      // Update the monster
      // Remove trainer_name from updatedMonster to avoid SQL error
      const { trainer_name, ...cleanMonsterData } = updatedMonster;
      await Monster.update(monsterId, cleanMonsterData);

      // Consume the pastry
      console.log(`Consuming pastry: trainerId=${trainerId}, pastry=${pastryName}, quantity=1`);
      const consumeSuccess = await TrainerInventory.removeItem(trainerId, 'pastries', pastryName, 1);
      console.log(`Pastry consumption result: ${consumeSuccess}`);

      return res.status(200).json({
        success: true,
        message: `Successfully applied ${pastryName} to the monster`,
        monster: updatedMonster
      });
    } catch (error) {
      console.error('Error applying pastry:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
};

/**
 * Get random type
 * @returns {Promise<Array<string>>} Array of random types
 */
async function getRandomType() {
  const types = [
    'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison',
    'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark',
    'Steel', 'Fairy'
  ];
  const randomIndex = Math.floor(Math.random() * types.length);
  return [types[randomIndex]];
}

/**
 * Get random species (using same base roll parameters as nursery to exclude legendaries/mythicals/evolved forms)
 * Respects user's monster table preferences
 * @param {Object} userSettings - User's monster roller settings
 * @returns {Promise<Array<string>>} Array of random species
 */
async function getRandomSpecies(userSettings = {}) {
  try {
    // Use MonsterRoller with user settings to ensure we respect user preferences
    const monsterRoller = new MonsterRoller({
      seed: Date.now().toString(),
      userSettings
    });

    // Use the EXACT same filtering logic as EggHatcher to ensure berries can only roll
    // base stage, unevolved monsters (no legendaries, mythicals, or evolved forms)
    // This matches the nursery's strict egg hatching rules
    const rollParams = {
      // STRICT egg hatching rules - berries can ONLY roll base stage, unevolved monsters
      includeStages: ['Base Stage', 'Doesn\'t Evolve'],
      excludeStages: ['Stage 1', 'Stage 2', 'Stage 3', 'Middle Stage', 'Final Stage', 'Evolves', 'First Evolution', 'Second Evolution', 'Final Evolution'],
      
      // Table-specific rank filtering - different systems for different monster types
      tableFilters: {
        pokemon: {
          includeStages: ['Base Stage', 'Doesn\'t Evolve'],
          excludeStages: ['Stage 1', 'Stage 2', 'Stage 3', 'Middle Stage', 'Final Stage'],
          legendary: false,
          mythical: false
        },
        digimon: {
          includeRanks: ['Baby I', 'Baby II'],
          excludeRanks: ['Child', 'Adult', 'Perfect', 'Ultimate', 'Mega', 'Rookie', 'Champion']
        },
        yokai: {
          includeRanks: ['E', 'D', 'C'],
          excludeRanks: ['S', 'A', 'B'],
          includeStages: ['Base Stage', 'Doesn\'t Evolve'],
          excludeStages: ['Stage 1', 'Stage 2', 'Stage 3', 'Middle Stage', 'Final Stage']
        },
        nexomon: {
          includeStages: ['Base Stage', 'Doesn\'t Evolve'],
          excludeStages: ['Stage 1', 'Stage 2', 'Stage 3', 'Middle Stage', 'Final Stage'],
          legendary: false
        },
        pals: {
          // Pals don't have evolution stages or ranks, no restrictions needed
        }
      },
      
      legendary: false,  // NEVER allow legendary monsters from berries
      mythical: false    // NEVER allow mythical monsters from berries
    };

    // Roll a monster and return its name
    const monster = await monsterRoller.rollMonster(rollParams);
    return monster ? [monster.name] : ['Unknown'];
  } catch (error) {
    console.error('Error getting random species:', error);
    return ['Unknown'];
  }
}

/**
 * Validate that a species is valid for pastry use (not evolved, legendary, or mythical)
 * @param {string} speciesName - Name of the species to validate
 * @returns {Promise<boolean>} Whether the species is valid for pastries
 */
async function validateSpeciesForPastry(speciesName) {
  try {
    // First check if the species exists at all
    const { isPostgreSQL } = require('../utils/dbUtils');

    let existsQuery, existsParams;

    if (isPostgreSQL) {
      existsQuery = `
        SELECT name, 'pokemon' as monster_type, stage, is_legendary, is_mythical, null as rank FROM pokemon_monsters WHERE name = $1
        UNION
        SELECT name, 'digimon' as monster_type, null as stage, false as is_legendary, false as is_mythical, rank FROM digimon_monsters WHERE name = $2
        UNION
        SELECT name, 'yokai' as monster_type, stage, false as is_legendary, false as is_mythical, rank FROM yokai_monsters WHERE name = $3
        UNION
        SELECT name, 'nexomon' as monster_type, stage, is_legendary, false as is_mythical, null as rank FROM nexomon_monsters WHERE name = $4
        UNION
        SELECT name, 'pals' as monster_type, null as stage, false as is_legendary, false as is_mythical, null as rank FROM pals_monsters WHERE name = $5
        UNION
        SELECT name, 'fakemon' as monster_type, stage, is_legendary, is_mythical, null as rank FROM fakemon WHERE name = $6
        UNION
        SELECT name, 'finalfantasy' as monster_type, stage, false as is_legendary, false as is_mythical, null as rank FROM finalfantasy_monsters WHERE name = $7
        UNION
        SELECT name, 'monsterhunter' as monster_type, null as stage, false as is_legendary, false as is_mythical, null as rank FROM monsterhunter_monsters WHERE name = $8
        LIMIT 1`;
      existsParams = [speciesName, speciesName, speciesName, speciesName, speciesName, speciesName, speciesName, speciesName];
    } else {
      existsQuery = `
        SELECT name, 'pokemon' as monster_type, stage, is_legendary, is_mythical, null as rank FROM pokemon_monsters WHERE name = ?
        UNION
        SELECT name, 'digimon' as monster_type, null as stage, false as is_legendary, false as is_mythical, rank FROM digimon_monsters WHERE name = ?
        UNION
        SELECT name, 'yokai' as monster_type, stage, false as is_legendary, false as is_mythical, rank FROM yokai_monsters WHERE name = ?
        UNION
        SELECT name, 'nexomon' as monster_type, stage, is_legendary, false as is_mythical, null as rank FROM nexomon_monsters WHERE name = ?
        UNION
        SELECT name, 'pals' as monster_type, null as stage, false as is_legendary, false as is_mythical, null as rank FROM pals_monsters WHERE name = ?
        UNION
        SELECT name, 'fakemon' as monster_type, stage, is_legendary, is_mythical, null as rank FROM fakemon WHERE name = ?
        UNION
        SELECT name, 'finalfantasy' as monster_type, stage, false as is_legendary, false as is_mythical, null as rank FROM finalfantasy_monsters WHERE name = ?
        UNION
        SELECT name, 'monsterhunter' as monster_type, null as stage, false as is_legendary, false as is_mythical, null as rank FROM monsterhunter_monsters WHERE name = ?
        LIMIT 1`;
      existsParams = [speciesName, speciesName, speciesName, speciesName, speciesName, speciesName, speciesName, speciesName];
    }

    const species = await db.asyncGet(existsQuery, existsParams);

    if (!species) {
      throw new Error(`Species "${speciesName}" does not exist in the database.`);
    }

    // Check specific validation rules and provide detailed error messages
    if (species.is_legendary) {
      throw new Error(`"${speciesName}" is a legendary species. Pastries can only be used with non-legendary, base stage species (like those that can hatch from eggs).`);
    }

    if (species.is_mythical) {
      throw new Error(`"${speciesName}" is a mythical species. Pastries can only be used with non-mythical, base stage species (like those that can hatch from eggs).`);
    }

    // Check stage restrictions based on monster type
    if (species.monster_type === 'pokemon' || species.monster_type === 'yokai' || species.monster_type === 'nexomon' || species.monster_type === 'finalfantasy') {
      if (species.stage && !['Base Stage', 'Doesn\'t Evolve'].includes(species.stage)) {
        throw new Error(`"${speciesName}" is an evolved form (${species.stage}). Pastries can only be used with base stage or non-evolving species (like those that can hatch from eggs).`);
      }
    }

    // Monster Hunter monsters don't evolve, so no stage restrictions needed

    // Check rank restrictions for Digimon
    if (species.monster_type === 'digimon') {
      if (species.rank && !['Baby I', 'Baby II'].includes(species.rank)) {
        throw new Error(`"${speciesName}" is a ${species.rank} rank Digimon. Pastries can only be used with Baby I or Baby II rank Digimon (like those that can hatch from eggs).`);
      }
    }

    // Check rank restrictions for Yokai
    if (species.monster_type === 'yokai') {
      if (species.rank && !['E', 'D', 'C'].includes(species.rank)) {
        throw new Error(`"${speciesName}" is a ${species.rank} rank Yokai. Pastries can only be used with E, D, or C rank Yokai (like those that can hatch from eggs).`);
      }
    }

    // If we get here, the species is valid
    return { valid: true };

  } catch (error) {
    console.error('Error validating species for pastry:', error);
    return { valid: false, error: error.message };
  }
}

module.exports = itemsController;
