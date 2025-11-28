const MonthlyAdopt = require('../models/MonthlyAdopt');
const Monster = require('../models/Monster');
const Trainer = require('../models/Trainer');
const monsterController = require('./monsterController');
const trainerController = require('./trainerController');
const TrainerInventory = require('../models/TrainerInventory');
const db = require('../config/db');
const MonsterInitializer = require('../utils/MonsterInitializer');
const { buildRandomLimit } = require('../utils/dbUtils');

/**
 * Controller for adoption-related functionality
 */
const adoptionController = {
  /**
   * Get monthly adopts for the current month
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getCurrentMonthAdopts: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1; // JavaScript months are 0-based

      // Ensure current month adopts exist
      await MonthlyAdopt.ensureCurrentMonthAdopts();

      const result = await MonthlyAdopt.getByYearAndMonth(year, month, page, limit);
      console.log('MonthlyAdopt.getByYearAndMonth returned:', {
        adoptCount: result.adopts ? result.adopts.length : 0,
        total: result.total,
        pagination: result.pagination
      });

      res.json({
        success: true,
        adopts: result.adopts,
        total: result.total,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error getting current month adopts:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting current month adopts'
      });
    }
  },

  /**
   * Get all monthly adopts with pagination
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getAllAdopts: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      console.log(`adoptionController.getAllAdopts called with page=${page}, limit=${limit}`);

      const result = await MonthlyAdopt.getAll(page, limit);
      console.log('MonthlyAdopt.getAll returned:', {
        adoptCount: result.adopts ? result.adopts.length : 0,
        total: result.total,
        pagination: result.pagination
      });

      res.json({
        success: true,
        adopts: result.adopts,
        total: result.total,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error getting all adopts:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting all adopts'
      });
    }
  },

  /**
   * Get monthly adopts for a specific year and month
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getAdoptsByYearAndMonth: async (req, res) => {
    try {
      const year = parseInt(req.params.year);
      const month = parseInt(req.params.month);
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        return res.status(400).json({
          success: false,
          message: 'Invalid year or month'
        });
      }

      console.log(`adoptionController.getAdoptsByYearAndMonth called with year=${year}, month=${month}, page=${page}, limit=${limit}`);

      // Get the current date
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      // Only generate adopts for the current month
      if (year === currentYear && month === currentMonth) {
        // Ensure current month adopts exist
        await MonthlyAdopt.ensureCurrentMonthAdopts();
      }

      const result = await MonthlyAdopt.getByYearAndMonth(year, month, page, limit);
      console.log('MonthlyAdopt.getByYearAndMonth returned:', {
        adoptCount: result.adopts ? result.adopts.length : 0,
        total: result.total,
        pagination: result.pagination
      });

      res.json({
        success: true,
        adopts: result.adopts,
        total: result.total,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error getting adopts by year and month:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting adopts by year and month'
      });
    }
  },

  /**
   * Claim a monthly adopt
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  claimAdopt: async (req, res) => {
    try {
      const { adoptId, trainerId, monsterName, discordUserId, berryName, pastryName, speciesValue, typeValue } = req.body;

      // Validate input
      if (!adoptId || !trainerId) {
        return res.status(400).json({
          success: false,
          message: 'Missing required parameters'
        });
      }

      console.log('Claiming adopt with Discord user ID:', discordUserId);
      console.log('Request body:', req.body);

      // Get the adopt
      const adopt = await MonthlyAdopt.getById(adoptId);
      if (!adopt) {
        return res.json({
          success: false,
          message: 'Adopt not found'
        });
      }

      // No need to check if the adopt is already claimed
      // Any adopt can be claimed multiple times

      // Get the trainer
      const trainer = await trainerController.getTrainerByIdInternal(trainerId);
      if (!trainer) {
        return res.json({
          success: false,
          message: 'Trainer not found'
        });
      }

      // Check if using a berry or pastry instead of Daycare Daypass
      let usingBerry = false;
      let usingPastry = false;
      let itemUsed = 'Daycare Daypass';
      let itemCategory = '';

      // Get trainer inventory
      const inventory = await TrainerInventory.getByTrainerId(trainerId);
      console.log('Trainer inventory:', inventory);

      if (berryName) {
        // Check if the trainer has the berry
        const berries = inventory.berries || {};
        const berryQuantity = berries[berryName] || 0;

        if (berryQuantity < 1) {
          return res.json({
            success: false,
            message: `You don't have any ${berryName}`
          });
        }
        usingBerry = true;
        itemUsed = berryName;
        itemCategory = 'berries';
        console.log(`Using berry: ${berryName}, quantity: ${berryQuantity}`);
      } else if (pastryName) {
        // Check if the trainer has the pastry
        const pastries = inventory.pastries || {};
        const pastryQuantity = pastries[pastryName] || 0;

        if (pastryQuantity < 1) {
          return res.json({
            success: false,
            message: `You don't have any ${pastryName}`
          });
        }
        usingPastry = true;
        itemUsed = pastryName;
        itemCategory = 'pastries';
        console.log(`Using pastry: ${pastryName}, quantity: ${pastryQuantity}`);
      } else {
        // Check if the trainer has a Daycare Daypass in any category
        let hasDaypass = false;
        const categories = ['items', 'keyitems', 'berries', 'pastries', 'evolution', 'eggs', 'antiques', 'helditems', 'seals'];

        // Debug log to show all inventory categories
        for (const category of categories) {
          console.log(`Checking category ${category} for Daycare Daypass:`, inventory[category]);
        }

        for (const category of categories) {
          // The TrainerInventory model already parses JSON strings
          const items = inventory[category] || {};

          // Debug log to see what's in the items object
          console.log(`Category ${category} items:`, items);

          const daypassQuantity = items['Daycare Daypass'] || 0;

          if (daypassQuantity > 0) {
            hasDaypass = true;
            itemCategory = category;
            console.log(`Found Daycare Daypass in ${category}, quantity: ${daypassQuantity}`);
            break;
          }
        }

        if (!hasDaypass) {
          return res.json({
            success: false,
            message: 'You need a Daycare Daypass to adopt a monster'
          });
        }
      }

      // Create a monster from the adopt data
      const monsterData = {
        species1: adopt.species1,
        species2: adopt.species2,
        species3: adopt.species3,
        type1: adopt.type1,
        type2: adopt.type2,
        type3: adopt.type3,
        type4: adopt.type4,
        type5: adopt.type5,
        attribute: adopt.attribute,
        name: monsterName || adopt.species1,
        level: 1,
        trainer_id: trainerId,
        player_user_id: discordUserId || trainer.player_user_id
      };

      // Apply berry or pastry effects if using them
      if (usingBerry && berryName) {
        // Apply berry effects based on berry name
        switch (berryName) {
          // Species modification berries
          case 'Patama Berry':
            if (speciesValue) {
              monsterData.species1 = speciesValue;
            } else {
              const species = await getRandomSpecies();
              monsterData.species1 = species[0];
            }
            break;
          case 'Azzuk Berry':
            if (!monsterData.species2 && speciesValue) {
              monsterData.species2 = speciesValue;
            } else if (!monsterData.species2) {
              const species = await getRandomSpecies();
              monsterData.species2 = species[0];
            }
            break;
          case 'Mangus Berry':
            if (!monsterData.species3 && speciesValue) {
              monsterData.species3 = speciesValue;
            } else if (!monsterData.species3) {
              const species = await getRandomSpecies();
              monsterData.species3 = species[0];
            }
            break;

          // Type modification berries
          case 'Miraca Berry':
            const types = await getRandomType();
            monsterData.type1 = types[0];
            break;
          case 'Addish Berry':
            if (!monsterData.type2) {
              const types = await getRandomType();
              monsterData.type2 = types[0];
            }
            break;
          case 'Sky Carrot Berry':
            if (!monsterData.type3) {
              const types = await getRandomType();
              monsterData.type3 = types[0];
            }
            break;

          // Attribute modification berries
          case 'Datei Berry':
            const attributes = ['Vaccine', 'Data', 'Virus', 'Free', 'Variable'];
            const randomIndex = Math.floor(Math.random() * attributes.length);
            monsterData.attribute = attributes[randomIndex];
            break;
        }
      } else if (usingPastry && pastryName) {
        // Apply pastry effects based on pastry name
        switch (pastryName) {
          // Species modification pastries
          case 'Patama Pastry':
            if (speciesValue) {
              monsterData.species1 = speciesValue;
            }
            break;
          case 'Azzuk Pastry':
            if (!monsterData.species2 && speciesValue) {
              monsterData.species2 = speciesValue;
            }
            break;
          case 'Mangus Pastry':
            if (!monsterData.species3 && speciesValue) {
              monsterData.species3 = speciesValue;
            }
            break;

          // Type modification pastries
          case 'Miraca Pastry':
            if (typeValue) {
              monsterData.type1 = typeValue;
            }
            break;
          case 'Addish Pastry':
            if (!monsterData.type2 && typeValue) {
              monsterData.type2 = typeValue;
            }
            break;
          case 'Sky Carrot Pastry':
            if (!monsterData.type3 && typeValue) {
              monsterData.type3 = typeValue;
            }
            break;

          // Attribute modification pastries
          case 'Datei Pastry':
            if (typeValue) {
              monsterData.attribute = typeValue;
            }
            break;
        }
      }

      console.log('Creating monster with data:', monsterData);
      console.log('Discord user ID:', discordUserId);
      console.log('Trainer discord_user_id:', trainer.discord_user_id);

      // Use the item (Daycare Daypass, berry, or pastry)
      try {
        const TrainerInventory = require('../models/TrainerInventory');

        if (usingBerry) {
          // Remove berry from inventory
          const success = await TrainerInventory.removeItem(trainerId, 'berries', itemUsed, 1);
          if (!success) {
            throw new Error(`Failed to remove ${itemUsed} from trainer ${trainerId} inventory`);
          }
          console.log(`Used 1 ${itemUsed} from trainer ${trainerId}`);
        } else if (usingPastry) {
          // Remove pastry from inventory
          const success = await TrainerInventory.removeItem(trainerId, 'pastries', itemUsed, 1);
          if (!success) {
            throw new Error(`Failed to remove ${itemUsed} from trainer ${trainerId} inventory`);
          }
          console.log(`Used 1 ${itemUsed} from trainer ${trainerId}`);
        } else {
          // Remove Daycare Daypass from inventory
          const success = await TrainerInventory.removeItem(trainerId, itemCategory, 'Daycare Daypass', 1);
          if (!success) {
            throw new Error(`Failed to remove Daycare Daypass from trainer ${trainerId} inventory`);
          }
          console.log(`Used 1 Daycare Daypass from trainer ${trainerId} in category ${itemCategory}`);
        }
      } catch (error) {
        console.error(`Error using item for trainer ${trainerId}:`, error);
        return res.status(500).json({
          success: false,
          message: 'Error using item: ' + error.message
        });
      }

      // Initialize the monster with proper stats and moves using the monster data
      const initializedMonster = await MonsterInitializer.initializeMonster(monsterData);
      console.log('Monster initialized:', initializedMonster);

      // Create the initialized monster in the database
      const Monster = require('../models/Monster');
      const createdMonster = await Monster.create(initializedMonster);
      console.log('Monster created with ID:', createdMonster.id);

      if (!createdMonster) {
        // Refund the item used
        try {
          if (usingBerry) {
            // Update berries in inventory
            const berries = inventory.berries || {};
            berries[itemUsed] = (berries[itemUsed] || 0) + 1;

            // Update inventory in database
            await db.asyncRun(
              'UPDATE trainer_inventory SET berries = $1 WHERE trainer_id = $2',
              [JSON.stringify(berries), trainerId]
            );
          } else if (usingPastry) {
            // Update pastries in inventory
            const pastries = inventory.pastries || {};
            pastries[itemUsed] = (pastries[itemUsed] || 0) + 1;

            // Update inventory in database
            await db.asyncRun(
              'UPDATE trainer_inventory SET pastries = $1 WHERE trainer_id = $2',
              [JSON.stringify(pastries), trainerId]
            );
          } else {
            // Update the inventory in the correct category
            const items = inventory[itemCategory] || {};
            items['Daycare Daypass'] = (items['Daycare Daypass'] || 0) + 1;

            // Update inventory in database
            await db.asyncRun(
              `UPDATE trainer_inventory SET ${itemCategory} = $1 WHERE trainer_id = $2`,
              [JSON.stringify(items), trainerId]
            );
          }
          console.log(`Failed to create monster, refunding ${itemUsed}`);
        } catch (refundError) {
          console.error(`Error refunding item for trainer ${trainerId}:`, refundError);
        }

        return res.json({
          success: false,
          message: 'Failed to create monster'
        });
      }

      // Record the adoption claim
      console.log('Recording adoption claim for adoptId:', adoptId, 'trainerId:', trainerId, 'monsterId:', createdMonster.id);
      const adoptionClaim = await MonthlyAdopt.recordAdoptionClaim(adoptId, trainerId, createdMonster.id);
      console.log('Adoption claim recorded:', adoptionClaim);

      // Update trainer's monster count
      await trainerController.updateTrainerMonsterCount(trainerId);

      res.json({
        success: true,
        message: 'Monster adopted successfully',
        monster: createdMonster
      });
    } catch (error) {
      console.error('Error claiming adopt:', error);
      res.status(500).json({
        success: false,
        message: 'Error claiming adopt: ' + error.message
      });
    }
  },

  /**
   * Check if a trainer has a Daycare Daypass
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  checkDaycareDaypass: async (req, res) => {
    try {
      // Log the request for debugging
      console.log('checkDaycareDaypass called with params:', req.params);

      // Parse trainerId and handle invalid values
      let trainerId;
      try {
        trainerId = parseInt(req.params.trainerId);
        if (isNaN(trainerId)) {
          console.log('Invalid trainer ID format:', req.params.trainerId);
          return res.json({
            success: true,
            hasDaypass: false,
            daypassCount: 0,
            error: 'Invalid trainer ID format'
          });
        }
      } catch (parseError) {
        console.error('Error parsing trainer ID:', parseError);
        return res.json({
          success: true,
          hasDaypass: false,
          daypassCount: 0,
          error: 'Error parsing trainer ID'
        });
      }

      // Get trainer inventory
      const inventory = await TrainerInventory.getByTrainerId(trainerId);
      console.log('Trainer inventory for daypass check:', inventory);

      // If inventory is null or undefined, return 0 daypasses
      if (!inventory) {
        console.log(`No inventory found for trainer ${trainerId}`);
        return res.json({
          success: true,
          hasDaypass: false,
          daypassCount: 0
        });
      }

      // Check if the trainer has a Daycare Daypass in any category
      let totalDaypassCount = 0;
      const categories = ['items', 'keyitems', 'berries', 'pastries', 'evolution', 'eggs', 'antiques', 'helditems', 'seals'];

      for (const category of categories) {
        // The TrainerInventory model already parses JSON strings
        // Make sure the category exists in the inventory
        if (inventory[category]) {
          const items = inventory[category] || {};

          // Debug log to see what's in the items object
          console.log(`Category ${category} items:`, items);

          // Check if 'Daycare Daypass' exists in the items object
          const daypassCount = items['Daycare Daypass'] || 0;

          if (daypassCount > 0) {
            console.log(`Found ${daypassCount} Daycare Daypass(es) in ${category}`);
            totalDaypassCount += daypassCount;
          }
        }
      }

      // Debug log to show the final count
      console.log(`Total Daycare Daypass count for trainer ${trainerId}: ${totalDaypassCount}`);

      return res.json({
        success: true,
        hasDaypass: totalDaypassCount > 0,
        daypassCount: totalDaypassCount
      });
    } catch (error) {
      console.error('Error checking daycare daypass:', error);
      // Return a successful response with 0 daypasses instead of an error
      // This ensures the frontend can still display the trainer in the list
      return res.json({
        success: true,
        hasDaypass: false,
        daypassCount: 0,
        error: error.message
      });
    }
  },

  /**
   * Get list of months with adoption data
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getMonthsWithData: async (req, res) => {
    try {
      const months = await MonthlyAdopt.getMonthsWithData();

      res.json({
        success: true,
        months: months
      });
    } catch (error) {
      console.error('Error getting months with adoption data:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting months with adoption data'
      });
    }
  },

  /**
   * Generate monthly adopts for the current month
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  generateMonthlyAdopts: async (req, res) => {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1; // JavaScript months are 0-based

      const adopts = await MonthlyAdopt.generateMonthlyAdopts(year, month, 10);

      res.json({
        success: true,
        message: `Generated ${adopts.length} monthly adopts for ${year}-${month}`,
        data: adopts
      });
    } catch (error) {
      console.error('Error generating monthly adopts:', error);
      res.status(500).json({
        success: false,
        message: 'Error generating monthly adopts'
      });
    }
  },

  /**
   * Generate test data for past months
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  generateTestData: async (req, res) => {
    try {
      const monthsCount = parseInt(req.body.monthsCount) || 3;
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      const results = [];

      // Generate data for past months
      for (let i = 1; i <= monthsCount; i++) {
        let targetMonth = currentMonth - i;
        let targetYear = currentYear;

        // Handle year rollover
        if (targetMonth <= 0) {
          targetMonth += 12;
          targetYear -= 1;
        }

        console.log(`Generating test data for ${targetYear}-${targetMonth}`);
        const adopts = await MonthlyAdopt.generateMonthlyAdopts(targetYear, targetMonth, 10);

        results.push({
          year: targetYear,
          month: targetMonth,
          adopts: adopts.length
        });
      }

      res.json({
        success: true,
        message: `Generated test data for ${results.length} past months`,
        data: results
      });
    } catch (error) {
      console.error('Error generating test data:', error);
      res.status(500).json({
        success: false,
        message: 'Error generating test data'
      });
    }
  },

  /**
   * Add a Daycare Daypass to a trainer's inventory (for testing)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  addDaycareDaypass: async (req, res) => {
    try {
      const trainerId = parseInt(req.params.trainerId);

      if (isNaN(trainerId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid trainer ID'
        });
      }

      // Get trainer inventory
      const inventory = await TrainerInventory.getByTrainerId(trainerId);

      // Add Daycare Daypass to items
      const items = inventory.items || {};
      items['Daycare Daypass'] = (items['Daycare Daypass'] || 0) + 1;

      console.log('Adding Daycare Daypass to items:', items);

      // Update inventory in database
      await db.asyncRun(
        'UPDATE trainer_inventory SET items = $1 WHERE trainer_id = $2',
        [JSON.stringify(items), trainerId]
      );

      console.log(`Added 1 Daycare Daypass to trainer ${trainerId}`);

      // Verify the update
      const updatedInventory = await TrainerInventory.getByTrainerId(trainerId);
      console.log('Updated inventory items:', updatedInventory.items);

      // Check if the Daycare Daypass was added correctly
      const daypassCount = updatedInventory.items['Daycare Daypass'] || 0;
      console.log(`Verified Daycare Daypass count: ${daypassCount}`);

      return res.json({
        success: true,
        message: `Added 1 Daycare Daypass to trainer ${trainerId}`,
        daypassCount: daypassCount
      });
    } catch (error) {
      console.error('Error adding daycare daypass:', error);
      return res.status(500).json({
        success: false,
        message: 'Error adding daycare daypass',
        error: error.message
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
 * Get random species
 * @returns {Promise<Array<string>>} Array of random species
 */
async function getRandomSpecies() {
  try {
    // Get a random species from the database
    const params = [];
    let query = `
      SELECT name FROM (
        SELECT name FROM pokemon_monsters
        UNION
        SELECT name FROM digimon_monsters
        UNION
        SELECT name FROM nexomon_monsters
        UNION
        SELECT name FROM yokai_monsters
      ) as all_species
    `;
    query += buildRandomLimit(1, params);
    const result = await db.asyncGet(query, params);
    return result ? [result.name] : ['Unknown'];
  } catch (error) {
    console.error('Error getting random species:', error);
    return ['Unknown'];
  }
}

module.exports = adoptionController;
