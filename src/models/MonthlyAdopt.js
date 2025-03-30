const pool = require('../config/database');
const Pokemon = require('./Pokemon');
const Digimon = require('./Digimon');
const Yokai = require('./Yokai');
const MonsterRoller = require('../utils/MonsterRoller');

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
      const offset = (page - 1) * limit;
      
      // Get total count
      const countQuery = 'SELECT COUNT(*) FROM monthly_adopts WHERE year = $1 AND month = $2';
      const countResult = await pool.query(countQuery, [year, month]);
      const total = parseInt(countResult.rows[0].count);

      // Get adopts with pagination
      const query = `
        SELECT * FROM monthly_adopts 
        WHERE year = $1 AND month = $2 
        ORDER BY id ASC
        LIMIT $3 OFFSET $4
      `;
      
      const result = await pool.query(query, [year, month, limit, offset]);

      return {
        adopts: result.rows,
        total
      };
    } catch (error) {
      console.error('Error getting adopts by year and month:', error);
      throw error;
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
      // Calculate offset
      const offset = (page - 1) * limit;

      // Get total count
      const countQuery = 'SELECT COUNT(*) FROM monthly_adopts';
      const countResult = await pool.query(countQuery);
      const totalCount = parseInt(countResult.rows[0].count);

      // Get adopts for the current page
      const query = `
        SELECT a.*,
        (SELECT COUNT(*) FROM adoption_claims WHERE adopt_id = a.id) AS adoption_count
        FROM monthly_adopts a
        ORDER BY year DESC, month DESC, id
        LIMIT $1 OFFSET $2
      `;
      const result = await pool.query(query, [limit, offset]);

      // Calculate total pages
      const totalPages = Math.ceil(totalCount / limit);

      return {
        adopts: result.rows,
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
      const result = await pool.query(query, [id]);

      return result.rows[0] || null;
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
      const query = `
        INSERT INTO monthly_adopts 
        (year, month, species1, species2, species3, type1, type2, type3, type4, type5, attribute)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;
      
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

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating monthly adopt:', error);
      throw error;
    }
  }

  /**
   * Update a monthly adopt
   * @param {number} id - Adopt ID
   * @param {Object} adoptData - Updated monthly adopt data
   * @returns {Promise<Object|null>} - Updated monthly adopt or null if failed
   */
  static async update(id, adoptData) {
    try {
      // Create arrays for the columns to update and the values
      const columns = [];
      const values = [];
      let paramCounter = 1;

      // Add each field to the columns and values arrays
      for (const [key, value] of Object.entries(adoptData)) {
        columns.push(`${key} = $${paramCounter}`);
        values.push(value);
        paramCounter++;
      }

      // Add the ID as the last parameter
      values.push(id);

      const query = `
        UPDATE monthly_adopts
        SET ${columns.join(', ')}
        WHERE id = $${paramCounter}
        RETURNING *
      `;

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating monthly adopt:', error);
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
      const query = `
        INSERT INTO adoption_claims (adopt_id, trainer_id, monster_id, claimed_at)
        VALUES ($1, $2, $3, NOW())
        RETURNING *
      `;

      const result = await pool.query(query, [adoptId, trainerId, monsterId]);
      return result.rows[0];
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

      const result = await pool.query(query, [trainerId]);
      return result.rows;
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
      const existingQuery = 'SELECT COUNT(*) FROM monthly_adopts WHERE year = $1 AND month = $2';
      const existingResult = await pool.query(existingQuery, [year, month]);
      const existingCount = parseInt(existingResult.rows[0].count);
      
      console.log(`Found ${existingCount} existing adopts`);

      if (existingCount >= count) {
        console.log(`Monthly adopts for ${year}-${month} already exist (${existingCount})`);
        const query = 'SELECT * FROM monthly_adopts WHERE year = $1 AND month = $2';
        const result = await pool.query(query, [year, month]);
        return result.rows;
      }

      console.log(`Generating ${count - existingCount} new adopts`);

      const adopts = [];
      const needed = count - existingCount;

      // Create equal distribution between Pokemon, Digimon, and Yokai
      const pokemonCount = Math.ceil(needed / 3);
      const digimonCount = Math.floor(needed / 3);
      const yokaiCount = needed - pokemonCount - digimonCount;

      console.log(`Distribution: Pokemon=${pokemonCount}, Digimon=${digimonCount}, Yokai=${yokaiCount}`);

      // Create distribution array
      const distribution = [];
      for (let i = 0; i < pokemonCount; i++) distribution.push('Pokemon');
      for (let i = 0; i < digimonCount; i++) distribution.push('Digimon');
      for (let i = 0; i < yokaiCount; i++) distribution.push('Yokai');

      // Shuffle the distribution
      distribution.sort(() => Math.random() - 0.5);

      // Generate new adopts
      for (let i = 0; i < needed; i++) {
        const rollerOptions = {
          filters: {
            includeSpecies: [distribution[i]],
            excludeSpecies: []
          },
          overrideParams: {
            minSpecies: 1,
            maxSpecies: 1
          }
        };

        // 30% chance for fusion
        if (Math.random() < 0.3) {
          rollerOptions.filters.includeSpecies = ['Pokemon', 'Digimon', 'Yokai'];
          rollerOptions.overrideParams.minSpecies = 2;
        }

        const roller = new MonsterRoller(rollerOptions);
        const monster = await roller.rollMonster();

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

      return adopts;
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
      const month = now.getMonth() + 1;

      // Check if we already have adopts for this month
      const query = 'SELECT COUNT(*) FROM monthly_adopts WHERE year = $1 AND month = $2';
      const result = await pool.query(query, [year, month]);
      const count = parseInt(result.rows[0].count);

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
   * Initialize database tables for monthly adopts
   * @returns {Promise<boolean>} - Success status
   */
  static async initTables() {
    try {
      // Create monthly_adopts table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS monthly_adopts (
          id SERIAL PRIMARY KEY,
          year INTEGER NOT NULL,
          month INTEGER NOT NULL,
          species1 TEXT NOT NULL,
          species2 TEXT,
          species3 TEXT,
          type1 TEXT NOT NULL,
          type2 TEXT,
          type3 TEXT,
          type4 TEXT,
          type5 TEXT,
          attribute TEXT,
          UNIQUE(year, month, id)
        )
      `);

      // Create adoption_claims table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS adoption_claims (
          id SERIAL PRIMARY KEY,
          adopt_id INTEGER NOT NULL REFERENCES monthly_adopts(id),
          trainer_id INTEGER NOT NULL REFERENCES trainers(id),
          monster_id INTEGER REFERENCES mons(mon_id),
          claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create indexes
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_monthly_adopts_year_month ON monthly_adopts(year, month)`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_adoption_claims_adopt_id ON adoption_claims(adopt_id)`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_adoption_claims_trainer_id ON adoption_claims(trainer_id)`);

      console.log('Monthly adopts tables initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing monthly adopts tables:', error);
      return false;
    }
  }
}

module.exports = MonthlyAdopt;




