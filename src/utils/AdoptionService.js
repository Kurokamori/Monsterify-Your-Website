const MonthlyAdopt = require('../models/MonthlyAdopt');
const Trainer = require('../models/Trainer');
const MonsterService = require('./MonsterService');
const TrainerInventoryChecker = require('./TrainerInventoryChecker');

class AdoptionService {
  /**
   * Get monthly adopts for the current month
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Number of adopts per page
   * @returns {Promise<Object>} - Object containing adopts and pagination info
   */
  static async getCurrentMonthAdopts(page = 1, limit = 10) {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      const result = await MonthlyAdopt.getByYearAndMonth(year, month, page, limit);

      const adopts = result.adopts.map(adopt => ({
        id: adopt.id,
        species1: adopt.species1,
        species2: adopt.species2,
        species3: adopt.species3,
        type1: adopt.type1,
        type2: adopt.type2,
        type3: adopt.type3,
        type4: adopt.type4,
        type5: adopt.type5,
        attribute: adopt.attribute,
        claimed: adopt.claimed || false
      }));

      console.log('Processed adopts:', adopts);

      return {
        adopts: adopts,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(result.total / limit),
          total: result.total,
          limit
        }
      };
    } catch (error) {
      console.error('Error getting current month adopts:', error);
      throw error;
    }
  }

  /**
   * Get all monthly adopts with pagination
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Number of adopts per page
   * @returns {Promise<Object>} - Object containing adopts and pagination info
   */
  static async getAllAdopts(page = 1, limit = 10) {
    try {
      console.log(`AdoptionService.getAllAdopts called with page=${page}, limit=${limit}`);

      const result = await MonthlyAdopt.getAll(page, limit);
      console.log('MonthlyAdopt.getAll returned:', {
        adoptCount: result.adopts ? result.adopts.length : 0,
        total: result.total,
        pagination: result.pagination
      });

      const adopts = result.adopts.map(adopt => ({
        id: adopt.id,
        species1: adopt.species1,
        species2: adopt.species2,
        species3: adopt.species3,
        type1: adopt.type1,
        type2: adopt.type2,
        type3: adopt.type3,
        type4: adopt.type4,
        type5: adopt.type5,
        attribute: adopt.attribute,
        claimed: adopt.claimed || false,
        year: adopt.year,
        month: adopt.month
      }));

      console.log('Processed all adopts:', adopts);

      // Calculate total pages properly
      const totalPages = result.pagination ? result.pagination.totalPages : Math.ceil(result.total / limit);
      const total = result.total || (result.pagination ? result.pagination.total : 0);

      console.log(`Calculated totalPages=${totalPages}, total=${total}`);

      return {
        adopts: adopts,
        total: total,
        pagination: {
          currentPage: page,
          totalPages: totalPages,
          total: total,
          limit
        }
      };
    } catch (error) {
      console.error('Error getting all adopts:', error);
      throw error;
    }
  }

  /**
   * Get monthly adopts for a specific year and month with pagination
   * @param {number} year - Year
   * @param {number} month - Month (1-12)
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Number of adopts per page
   * @returns {Promise<Object>} - Object containing adopts and pagination info
   */
  static async getAdoptsByYearAndMonth(year, month, page = 1, limit = 10) {
    try {
      console.log(`AdoptionService.getAdoptsByYearAndMonth called with year=${year}, month=${month}, page=${page}, limit=${limit}`);

      const result = await MonthlyAdopt.getByYearAndMonth(year, month, page, limit);
      console.log('MonthlyAdopt.getByYearAndMonth returned:', {
        adoptCount: result.adopts ? result.adopts.length : 0,
        total: result.total,
        pagination: result.pagination
      });

      const adopts = result.adopts.map(adopt => ({
        id: adopt.id,
        species1: adopt.species1,
        species2: adopt.species2,
        species3: adopt.species3,
        type1: adopt.type1,
        type2: adopt.type2,
        type3: adopt.type3,
        type4: adopt.type4,
        type5: adopt.type5,
        attribute: adopt.attribute,
        claimed: adopt.claimed || false,
        year: adopt.year,
        month: adopt.month
      }));

      console.log(`Processed ${adopts.length} adopts for ${year}-${month}`);

      return {
        adopts: adopts,
        total: result.total,
        pagination: result.pagination
      };
    } catch (error) {
      console.error('Error getting monthly adopts by year and month:', error);
      return {
        adopts: [],
        total: 0,
        pagination: {
          currentPage: page,
          totalPages: 0,
          total: 0,
          limit
        }
      };
    }
  }

  /**
   * Get adoption claims for a trainer
   * @param {number} trainerId - Trainer ID
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Number of items per page
   * @returns {Promise<Array>} - Array of adoption claims
   */
  static async getTrainerAdoptionClaims(trainerId, page = 1, limit = 10) {
    try {
      return await MonthlyAdopt.getAdoptionClaimsByTrainer(trainerId);
    } catch (error) {
      console.error('Error getting trainer adoption claims:', error);
      return [];
    }
  }

  /**
   * Claim a monthly adopt
   * @param {number} adoptId - Adopt ID
   * @param {number} trainerId - Trainer ID
   * @param {string} monsterName - Monster name
   * @returns {Promise<Object>} - Result of claiming
   */
  static async claimAdopt(adoptId, trainerId, monsterName) {
    try {
      // Get the adopt
      const adopt = await MonthlyAdopt.getById(adoptId);
      if (!adopt) {
        return {
          success: false,
          message: 'Adopt not found'
        };
      }

      // Get the trainer
      const trainer = await Trainer.getById(trainerId);
      if (!trainer) {
        return {
          success: false,
          message: 'Trainer not found'
        };
      }

      // Use the Daycare Daypass directly without checking
      await Trainer.updateInventoryItem(trainerId, 'inv_items', 'Daycare Daypass', -1);

      // Create the monster
      const monsterData = {
        species1: adopt.species1,
        species2: adopt.species2 || null,
        species3: adopt.species3 || null,
        type1: adopt.type1,
        type2: adopt.type2 || null,
        type3: adopt.type3 || null,
        type4: adopt.type4 || null,
        type5: adopt.type5 || null,
        attribute: adopt.attribute
      };

      console.log('Creating monster with data:', monsterData);
      const monster = await MonsterService.claimMonster(monsterData, trainerId, monsterName);
      console.log('Monster created:', monster);

      if (!monster) {
        // Refund the Daycare Daypass
        await Trainer.updateInventoryItem(trainerId, 'inv_items', 'Daycare Daypass', 1);
        console.log('Failed to create monster, refunding Daycare Daypass');

        return {
          success: false,
          message: 'Failed to create monster'
        };
      }

      // Initialize the monster with proper stats and moves
      const MonsterInitializer = require('./MonsterInitializer');
      console.log('Initializing monster with stats and moves');
      const initializedMonster = await MonsterInitializer.initializeMonster({
        ...monster,
        level: 1
      });
      console.log('Initialized monster:', initializedMonster);

      // Update the monster with initialized data
      if (initializedMonster) {
        console.log('Updating monster with initialized data');
        const Monster = require('../models/Monster');
        const updatedMonster = await Monster.update(monster.mon_id, initializedMonster);
        console.log('Updated monster:', updatedMonster);
      } else {
        console.log('No initialized monster data to update');
      }

      // Record the adoption claim
      console.log('Recording adoption claim for adoptId:', adoptId, 'trainerId:', trainerId, 'monsterId:', monster.mon_id);
      const adoptionClaim = await MonthlyAdopt.recordAdoptionClaim(adoptId, trainerId, monster.mon_id);
      console.log('Adoption claim recorded:', adoptionClaim);

      // Force recalculate monster counts for the trainer
      console.log('Recalculating monster counts for trainer:', trainerId);
      await Trainer.recalculateMonsterCounts(trainerId);

      return {
        success: true,
        message: 'Monster adopted successfully',
        monster
      };
    } catch (error) {
      console.error('Error claiming adopt:', error);
      return {
        success: false,
        message: 'Error claiming adopt: ' + error.message
      };
    }
  }

  /**
   * Initialize the adoption system
   * @returns {Promise<boolean>} - Success status
   */
  static async initialize() {
    try {
      // Initialize database tables
      await MonthlyAdopt.initTables();

      // Ensure current month adopts exist
      await MonthlyAdopt.ensureCurrentMonthAdopts();

      return true;
    } catch (error) {
      console.error('Error initializing adoption system:', error);
      return false;
    }
  }
}

module.exports = AdoptionService;




