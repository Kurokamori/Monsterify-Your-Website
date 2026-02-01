const db = require('../config/db');
const { isPostgreSQL } = require('../utils/dbUtils');
const MonsterRoller = require('../models/MonsterRoller');
const { buildLimitOffset } = require('../utils/dbUtils');

/**
 * Model for monthly adopts
 */
class MonthlyAdopt {
  /**
   * Get all monthly adopts for a specific year and month
   * @param {number} year - Year
   * @param {number} month - Month (1-12)
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Number of adopts per page
   * @returns {Promise<Object>} - Object containing adopts and pagination info
   */
  static async getByYearAndMonth(year, month, page = 1, limit = 10) {
    try {
      console.log(`MonthlyAdopt.getByYearAndMonth called with year=${year}, month=${month}, page=${page}, limit=${limit}`);

      const offset = (page - 1) * limit;

      // Get total count
      const countQuery = 'SELECT COUNT(*) as count FROM monthly_adopts WHERE year = $1 AND month = $2';
      const countResult = await db.asyncGet(countQuery, [year, month]);
      const total = countResult ? countResult.count : 0;

      console.log(`Total count for ${year}-${month}: ${total}`);

      // Get adopts with pagination
      let query = `
        SELECT a.*,
        (SELECT COUNT(*) FROM adoption_claims WHERE adopt_id = a.id) AS adoption_count
        FROM monthly_adopts a
        WHERE year = $1 AND month = $2
        ORDER BY id ASC`;
      
      const params = [year, month];
      query += buildLimitOffset(limit, offset, params);
      const result = await db.asyncAll(query, params);

      console.log(`Retrieved ${result ? result.length : 0} adopts for ${year}-${month}`);

      // Calculate total pages
      const totalPages = Math.ceil(total / limit);

      console.log(`Total pages calculated: ${totalPages}`);

      return {
        adopts: result || [],
        total,
        pagination: {
          total,
          page,
          limit,
          totalPages
        }
      };
    } catch (error) {
      console.error('Error getting monthly adopts by year and month:', error);
      return {
        adopts: [],
        total: 0,
        pagination: {
          total: 0,
          page,
          limit,
          totalPages: 0
        }
      };
    }
  }

  /**
   * Get all monthly adopts with pagination
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Number of adopts per page
   * @returns {Promise<Object>} - Object containing adopts and pagination info
   */
  static async getAll(page = 1, limit = 10) {
    try {
      console.log(`MonthlyAdopt.getAll called with page=${page}, limit=${limit}`);

      const offset = (page - 1) * limit;

      // Get total count
      const countQuery = 'SELECT COUNT(*) as count FROM monthly_adopts';
      const countResult = await db.asyncGet(countQuery);
      const totalCount = countResult ? countResult.count : 0;

      console.log(`Total count of all monthly adopts: ${totalCount}`);

      // Get adopts for the current page
      let query = `
        SELECT a.*,
        (SELECT COUNT(*) FROM adoption_claims WHERE adopt_id = a.id) AS adoption_count
        FROM monthly_adopts a
        ORDER BY year DESC, month DESC, id`;
      
      const params = [];
      query += buildLimitOffset(limit, offset, params);
      const result = await db.asyncAll(query, params);

      console.log(`Retrieved ${result ? result.length : 0} adopts for page ${page}`);

      // Calculate total pages
      const totalPages = Math.ceil(totalCount / limit);

      console.log(`Total pages calculated: ${totalPages}`);

      return {
        adopts: result || [],
        total: totalCount,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages
        }
      };
    } catch (error) {
      console.error('Error getting all monthly adopts:', error);
      return {
        adopts: [],
        total: 0,
        pagination: {
          total: 0,
          page,
          limit,
          totalPages: 0
        }
      };
    }
  }

  /**
   * Get a specific monthly adopt by ID
   * @param {number} id - Adopt ID
   * @returns {Promise<Object|null>} - Monthly adopt or null if not found
   */
  static async getById(id) {
    try {
      const query = `
        SELECT a.*,
        (SELECT COUNT(*) FROM adoption_claims WHERE adopt_id = a.id) AS adoption_count
        FROM monthly_adopts a
        WHERE a.id = $1
      `;
      const result = await db.asyncGet(query, [id]);
      return result || null;
    } catch (error) {
      console.error('Error getting monthly adopt by ID:', error);
      return null;
    }
  }

  /**
   * Create a new monthly adopt
   * @param {Object} adoptData - Monthly adopt data
   * @returns {Promise<Object|null>} - Created monthly adopt or null if failed
   */
  static async create(adoptData) {
    try {
      let query, result, adoptId;

      const values = [
        adoptData.year,
        adoptData.month,
        adoptData.species1,
        adoptData.species2,
        adoptData.species3,
        adoptData.type1,
        adoptData.type2,
        adoptData.type3,
        adoptData.type4,
        adoptData.type5,
        adoptData.attribute
      ];

      if (isPostgreSQL) {
        // PostgreSQL: Use RETURNING clause to get the inserted ID
        query = `
          INSERT INTO monthly_adopts
          (year, month, species1, species2, species3, type1, type2, type3, type4, type5, attribute)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING id
        `;

        result = await db.asyncRun(query, values);
        adoptId = result.rows[0].id;
      } else {
        // SQLite: Use lastID from result
        query = `
          INSERT INTO monthly_adopts
          (year, month, species1, species2, species3, type1, type2, type3, type4, type5, attribute)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `;

        result = await db.asyncRun(query, values);
        adoptId = result.lastID;
      }

      if (adoptId) {
        // Get the created adopt
        return this.getById(adoptId);
      }

      return null;
    } catch (error) {
      console.error('Error creating monthly adopt:', error);
      return null;
    }
  }

  /**
   * Record an adoption claim
   * @param {number} adoptId - Adopt ID
   * @param {number} trainerId - Trainer ID
   * @param {number} monsterId - Monster ID
   * @returns {Promise<Object|null>} - Adoption claim record or null if failed
   */
  static async recordAdoptionClaim(adoptId, trainerId, monsterId) {
    try {
      // Insert into adoption_claims table
      let insertClaimQuery, result, claimId;

      if (isPostgreSQL) {
        // PostgreSQL: Use RETURNING clause to get the inserted ID
        insertClaimQuery = `
          INSERT INTO adoption_claims (adopt_id, trainer_id, monster_id, claimed_at)
          VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
          RETURNING id
        `;

        result = await db.asyncRun(insertClaimQuery, [adoptId, trainerId, monsterId]);
        claimId = result.rows[0].id;
      } else {
        // SQLite: Use lastID from result
        insertClaimQuery = `
          INSERT INTO adoption_claims (adopt_id, trainer_id, monster_id, claimed_at)
          VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        `;

        result = await db.asyncRun(insertClaimQuery, [adoptId, trainerId, monsterId]);
        claimId = result.lastID;
      }

      if (claimId) {
        // Get the created claim
        const getClaimQuery = 'SELECT * FROM adoption_claims WHERE id = $1';
        return await db.asyncGet(getClaimQuery, [claimId]);
      }

      return null;
    } catch (error) {
      console.error('Error recording adoption claim:', error);
      return null;
    }
  }

  /**
   * Get adoption claims for a trainer
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Array>} - Array of adoption claims
   */
  static async getAdoptionClaimsByTrainer(trainerId) {
    try {
      const query = `
        SELECT ac.*, ma.*
        FROM adoption_claims ac
        JOIN monthly_adopts ma ON ac.adopt_id = ma.id
        WHERE ac.trainer_id = $1
        ORDER BY ac.claimed_at DESC
      `;

      const result = await db.asyncAll(query, [trainerId]);
      return result || [];
    } catch (error) {
      console.error('Error getting adoption claims by trainer:', error);
      return [];
    }
  }

  /**
   * Generate monthly adopts for a specific year and month
   * @param {number} year - Year
   * @param {number} month - Month (1-12)
   * @param {number} count - Number of adopts to generate (default: 10)
   * @returns {Promise<Array>} - Array of generated monthly adopts
   */
  static async generateMonthlyAdopts(year, month, count = 10) {
    try {
      console.log(`Checking for existing adopts for ${year}-${month}`);

      // Check if adopts already exist for this month
      const existingQuery = 'SELECT COUNT(*) as count FROM monthly_adopts WHERE year = $1 AND month = $2';
      const existingResult = await db.asyncGet(existingQuery, [year, month]);
      const existingCount = existingResult ? existingResult.count : 0;

      console.log(`Found ${existingCount} existing adopts`);

      // Calculate how many more adopts we need to generate
      const neededCount = Math.max(0, count - existingCount);
      console.log(`Need to generate ${neededCount} more adopts`);

      if (neededCount <= 0) {
        console.log('No need to generate more adopts');

        // Return existing adopts
        const query = 'SELECT * FROM monthly_adopts WHERE year = $1 AND month = $2 ORDER BY id ASC';
        const existingAdopts = await db.asyncAll(query, [year, month]);
        return existingAdopts || [];
      }

      // Generate new adopts
      const adopts = [];
      const rollerOptions = {
        enabledTables: ['pokemon', 'digimon', 'yokai', 'nexomon'],
        userSettings: {
          pokemon_enabled: true,
          digimon_enabled: true,
          yokai_enabled: true,
          nexomon_enabled: true,
          pals_enabled: false,
          fakemon_enabled: false,
          finalfantasy_enabled: false,
          monsterhunter_enabled: false
        }
      };

      // Roll parameters for the monster
      const rollParams = {
        tables: ['pokemon', 'digimon', 'yokai', 'nexomon'],
        species_min: 1,
        species_max: 3,  // Allow up to 3 species for fusions
        types_min: 1,
        types_max: 3,
        legendary: false,
        mythical: false,
        includeStages: ['base stage', "doesn't evolve"],
        tableFilters: {
          digimon: {
            includeRanks: ['Baby I', 'Baby II', 'Child', 'E', 'D', 'C']
          },
          yokai: {
            includeRanks: ['E', 'D', 'C']
          }
        }
      };

      for (let i = 0; i < neededCount; i++) {
        console.log(`Generating adopt #${i + 1}`);

        const roller = new MonsterRoller(rollerOptions);
        const monster = await roller.rollMonster(rollParams);

        const adoptData = {
          year,
          month,
          species1: monster.species1,
          species2: monster.species2 || null,
          species3: monster.species3 || null,
          type1: monster.type1,
          type2: monster.type2 || null,
          type3: monster.type3 || null,
          type4: monster.type4 || null,
          type5: monster.type5 || null,
          attribute: monster.attribute
        };

        console.log(`Creating adopt: `, adoptData);

        const createdAdopt = await this.create(adoptData);
        if (createdAdopt) {
          adopts.push(createdAdopt);
          console.log(`Successfully created adopt #${adopts.length}`);
        }
      }

      // Return all adopts for this month (existing + newly created)
      const query = 'SELECT * FROM monthly_adopts WHERE year = $1 AND month = $2 ORDER BY id ASC';
      const allAdopts = await db.asyncAll(query, [year, month]);
      return allAdopts || [];
    } catch (error) {
      console.error('Error generating monthly adopts:', error);
      throw error;
    }
  }

  /**
   * Ensure monthly adopts exist for the current month
   * @returns {Promise<boolean>} - Success status
   */
  static async ensureCurrentMonthAdopts() {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1; // JavaScript months are 0-based

      // Check if we already have adopts for this month
      const query = 'SELECT COUNT(*) as count FROM monthly_adopts WHERE year = $1 AND month = $2';
      const result = await db.asyncGet(query, [year, month]);
      const count = result ? result.count : 0;

      if (count < 10) {
        // Calculate how many more adopts we need
        const needed = 10 - count;
        await this.generateMonthlyAdopts(year, month, needed);
      }

      return true;
    } catch (error) {
      console.error('Error ensuring current month adopts:', error);
      throw error;
    }
  }

  /**
   * Get the earliest month with adoption data
   * @returns {Promise<Object|null>} - Object with year and month, or null if no data
   */
  static async getEarliestMonth() {
    try {
      const query = `
        SELECT year, month
        FROM monthly_adopts
        ORDER BY year ASC, month ASC
        LIMIT 1
      `;
      const result = await db.asyncGet(query);
      return result || null;
    } catch (error) {
      console.error('Error getting earliest month:', error);
      return null;
    }
  }

  /**
   * Fill any gaps in monthly adoption data between the earliest month and current month
   * This ensures there are no missing months in the adoption history
   * @returns {Promise<void>}
   */
  static async fillMonthlyGaps() {
    try {
      // Get the earliest month with data
      const earliest = await this.getEarliestMonth();
      if (!earliest) {
        console.log('No existing adoption data found, nothing to fill');
        return;
      }

      // Get the current month
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      // Get all existing months
      const existingQuery = `
        SELECT DISTINCT year, month
        FROM monthly_adopts
      `;
      const existingMonths = await db.asyncAll(existingQuery);

      // Create a Set of existing year-month combinations for quick lookup
      const existingSet = new Set(
        (existingMonths || []).map(m => `${m.year}-${m.month}`)
      );

      // Iterate through all months from earliest to current and fill gaps
      let year = earliest.year;
      let month = earliest.month;

      while (year < currentYear || (year === currentYear && month <= currentMonth)) {
        const key = `${year}-${month}`;

        if (!existingSet.has(key)) {
          console.log(`Filling gap: generating adopts for ${year}-${month}`);
          await this.generateMonthlyAdopts(year, month, 10);
        }

        // Move to next month
        month++;
        if (month > 12) {
          month = 1;
          year++;
        }
      }
    } catch (error) {
      console.error('Error filling monthly gaps:', error);
      // Don't throw - this is a silent operation
    }
  }

  /**
   * Get list of months with adoption data
   * Also fills any gaps in the data between the earliest month and current month
   * @returns {Promise<Array>} - Array of objects with year and month
   */
  static async getMonthsWithData() {
    try {
      // First, fill any gaps in the monthly data
      await this.fillMonthlyGaps();

      // Query to get distinct year and month combinations
      const query = `
        SELECT DISTINCT year, month
        FROM monthly_adopts
        ORDER BY year DESC, month DESC
      `;

      const result = await db.asyncAll(query);
      console.log(`Found ${result ? result.length : 0} months with adoption data`);

      return result || [];
    } catch (error) {
      console.error('Error getting months with adoption data:', error);
      return [];
    }
  }
}

module.exports = MonthlyAdopt;
