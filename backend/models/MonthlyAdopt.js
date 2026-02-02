const db = require('../config/db');
const { isPostgreSQL } = require('../utils/dbUtils');
const MonsterRoller = require('../models/MonsterRoller');
const { buildLimitOffset } = require('../utils/dbUtils');

// All franchises available in the adoption center
const ALL_FRANCHISES = ['pokemon', 'digimon', 'yokai', 'nexomon', 'pals', 'fakemon', 'finalfantasy', 'monsterhunter'];

// Franchises that require minimum representation (fakemon excluded)
const FRANCHISES_WITH_MINIMUMS = ['pokemon', 'digimon', 'yokai', 'nexomon', 'pals', 'finalfantasy', 'monsterhunter'];

// Franchise table configuration
const FRANCHISE_CONFIG = {
  pokemon: { tableName: 'pokemon_monsters', idField: 'id' },
  digimon: { tableName: 'digimon_monsters', idField: 'id' },
  yokai: { tableName: 'yokai_monsters', idField: 'id' },
  nexomon: { tableName: 'nexomon_monsters', idField: 'nr' },
  pals: { tableName: 'pals_monsters', idField: 'id' },
  fakemon: { tableName: 'fakemon', idField: 'id' },
  finalfantasy: { tableName: 'finalfantasy_monsters', idField: 'id' },
  monsterhunter: { tableName: 'monsterhunter_monsters', idField: 'id' }
};

/**
 * Model for monthly adopts
 */
class MonthlyAdopt {
  /**
   * Determine which franchise a species belongs to
   * @param {string} speciesName - Name of the species
   * @returns {Promise<string|null>} - Franchise name or null if not found
   */
  static async getSpeciesFranchise(speciesName) {
    if (!speciesName) return null;

    // Check each franchise table
    for (const franchise of ALL_FRANCHISES) {
      const config = FRANCHISE_CONFIG[franchise];
      if (!config) continue;

      const query = isPostgreSQL
        ? `SELECT ${config.idField} FROM ${config.tableName} WHERE LOWER(name) = LOWER($1) LIMIT 1`
        : `SELECT ${config.idField} FROM ${config.tableName} WHERE LOWER(name) = LOWER(?) LIMIT 1`;

      try {
        const result = await db.asyncGet(query, [speciesName]);
        if (result) {
          console.log(`Found species "${speciesName}" in franchise: ${franchise}`);
          return franchise;
        }
      } catch (error) {
        // Table might not exist, that's OK
        console.log(`Table ${config.tableName} check failed for ${speciesName}: ${error.message}`);
      }
    }

    console.log(`Species "${speciesName}" not found in any franchise table`);
    return null;
  }

  /**
   * Analyze franchise distribution across all species in adopts
   * @param {Array} adopts - Array of adopt objects with species1, species2, species3
   * @returns {Promise<Object>} - Analysis object with counts and details
   */
  static async analyzeAdoptsFranchiseDistribution(adopts) {
    const analysis = {
      totalSpecies: 0,
      franchiseCounts: {},
      speciesDetails: [], // Array of { adoptIndex, speciesSlot, speciesName, franchise }
    };

    // Initialize counts for ALL franchises
    for (const franchise of ALL_FRANCHISES) {
      analysis.franchiseCounts[franchise] = 0;
    }

    console.log(`Analyzing ${adopts.length} adopts for franchise distribution...`);

    // Analyze each adopt
    for (let i = 0; i < adopts.length; i++) {
      const adopt = adopts[i];

      // Check each species slot
      for (const slot of ['species1', 'species2', 'species3']) {
        const speciesName = adopt[slot];
        if (speciesName) {
          analysis.totalSpecies++;

          const franchise = await this.getSpeciesFranchise(speciesName);
          if (franchise) {
            analysis.franchiseCounts[franchise] = (analysis.franchiseCounts[franchise] || 0) + 1;
            analysis.speciesDetails.push({
              adoptIndex: i,
              speciesSlot: slot,
              speciesName,
              franchise
            });
          } else {
            console.log(`WARNING: Could not determine franchise for species "${speciesName}"`);
          }
        }
      }
    }

    console.log(`Analysis complete: ${analysis.totalSpecies} total species`);
    console.log('Franchise counts:', JSON.stringify(analysis.franchiseCounts));

    return analysis;
  }

  /**
   * Roll a single species from a specific franchise
   * @param {string} franchise - The franchise to roll from
   * @param {Object} rollParams - Roll parameters (same as generateMonthlyAdopts)
   * @param {Array} excludeSpecies - Species names to exclude (already used)
   * @returns {Promise<string|null>} - Species name or null if failed
   */
  static async rollSpeciesFromFranchise(franchise, rollParams, excludeSpecies = []) {
    console.log(`\n--- Rolling species from ${franchise} ---`);

    // Build userSettings dynamically - enable only the target franchise
    const userSettings = {};
    for (const f of ALL_FRANCHISES) {
      userSettings[`${f}_enabled`] = (f === franchise);
    }

    const rollerOptions = {
      enabledTables: [franchise],
      userSettings
    };

    // Build params for single species roll
    // For rerolling, we're more permissive - don't apply stage filters
    // to maximize chances of finding a valid monster
    const params = {
      tables: [franchise],
      species_min: 1,
      species_max: 1,
      types_min: 1,
      types_max: 1,
      excludeSpecies: excludeSpecies,
      // Copy over relevant filters from rollParams
      legendary: rollParams.legendary,
      mythical: rollParams.mythical
    };

    // Add franchise-specific filters if they exist (ranks, etc.)
    if (rollParams.tableFilters && rollParams.tableFilters[franchise]) {
      params.tableFilters = { [franchise]: rollParams.tableFilters[franchise] };
    }

    // NOTE: We intentionally do NOT apply includeStages filter for rerolls
    // to maximize chances of finding a replacement species from deficient franchises

    console.log(`Rolling species from ${franchise} with params:`, JSON.stringify(params));

    try {
      const roller = new MonsterRoller(rollerOptions);
      const monster = await roller.rollMonster(params);
      if (monster && monster.name) {
        console.log(`Successfully rolled ${monster.name} from ${franchise}`);
        return monster.name;
      }
      console.log(`No monster rolled from ${franchise} - roller returned:`, monster);
    } catch (error) {
      console.error(`Error rolling species from ${franchise}:`, error.message);
      console.error(error.stack);
    }

    return null;
  }

  /**
   * Enforce franchise minimums on a set of adopts
   * Modifies adopts in place and updates database
   * @param {Array} adopts - Array of adopt objects
   * @param {Object} rollParams - Roll parameters for rerolling
   * @returns {Promise<Array>} - Modified adopts array
   */
  static async enforceFranchiseMinimums(adopts, rollParams) {
    console.log('\n\n========================================');
    console.log('=== ENFORCING FRANCHISE MINIMUMS ===');
    console.log('========================================');
    console.log(`Processing ${adopts.length} adopts...`);
    console.log('Adopts IDs:', adopts.map(a => a.id).join(', '));

    // Check database state for each franchise (diagnostic)
    console.log('\n--- Database Franchise Counts ---');
    for (const franchise of FRANCHISES_WITH_MINIMUMS) {
      const config = FRANCHISE_CONFIG[franchise];
      try {
        const countQuery = `SELECT COUNT(*) as count FROM ${config.tableName}`;
        const result = await db.asyncGet(countQuery);
        console.log(`  ${franchise}: ${result?.count || 0} entries in ${config.tableName}`);
      } catch (err) {
        console.log(`  ${franchise}: ERROR - ${err.message}`);
      }
    }
    console.log('--- End Database Check ---\n');

    // Analyze current distribution
    let analysis = await this.analyzeAdoptsFranchiseDistribution(adopts);
    console.log('Initial analysis:', JSON.stringify(analysis.franchiseCounts), `Total species: ${analysis.totalSpecies}`);

    // Determine minimum required per franchise: floor(totalSpecies / 7)
    // For every 7 species rolled, each franchise (excluding fakemon) should have 1 representative
    const minRequired = Math.floor(analysis.totalSpecies / 7);
    console.log(`Minimum required per franchise: ${minRequired} (total species: ${analysis.totalSpecies}, formula: floor(${analysis.totalSpecies}/7))`);
    console.log(`Franchises requiring minimums: ${FRANCHISES_WITH_MINIMUMS.join(', ')}`);

    // If minRequired is 0, no enforcement needed
    if (minRequired === 0) {
      console.log('Minimum required is 0, no franchise enforcement needed');
      return adopts;
    }

    // Find deficient franchises (only for FRANCHISES_WITH_MINIMUMS - excludes fakemon)
    const deficientFranchises = [];
    for (const franchise of FRANCHISES_WITH_MINIMUMS) {
      const count = analysis.franchiseCounts[franchise] || 0;
      if (count < minRequired) {
        deficientFranchises.push({ franchise, deficit: minRequired - count });
        console.log(`  ${franchise}: has ${count}, needs ${minRequired}, deficit: ${minRequired - count}`);
      }
    }

    // Find excess franchises - ONLY from FRANCHISES_WITH_MINIMUMS (fakemon excluded)
    // Fakemon should not be rerolled to fill deficits
    const excessFranchises = [];
    for (const franchise of FRANCHISES_WITH_MINIMUMS) {
      const count = analysis.franchiseCounts[franchise] || 0;
      // Excess is count - minRequired for franchises with minimums
      if (count > minRequired) {
        excessFranchises.push({ franchise, excess: count - minRequired });
        console.log(`  ${franchise}: has ${count}, required ${minRequired}, excess: ${count - minRequired}`);
      }
    }

    // Log fakemon count for clarity (they are not counted as excess)
    const fakemonCount = analysis.franchiseCounts['fakemon'] || 0;
    if (fakemonCount > 0) {
      console.log(`  fakemon: has ${fakemonCount} (not counted as excess, will not be rerolled)`);
    }

    console.log('Deficient franchises:', JSON.stringify(deficientFranchises));
    console.log('Excess franchises:', JSON.stringify(excessFranchises));

    // If no deficiencies, we're done
    if (deficientFranchises.length === 0) {
      console.log('No franchise deficiencies found, adopts are balanced');
      return adopts;
    }

    // Calculate total deficit and excess
    const totalDeficit = deficientFranchises.reduce((sum, f) => sum + f.deficit, 0);
    const totalExcess = excessFranchises.reduce((sum, f) => sum + f.excess, 0);

    // If no excess available (fakemon took all the slots), accept as "close enough"
    if (totalExcess === 0) {
      console.log(`No excess species available from non-fakemon franchises to reroll.`);
      console.log(`Fakemon count: ${fakemonCount}. Accepting current distribution as close enough.`);
      return adopts;
    }

    if (totalExcess < totalDeficit) {
      console.log(`Warning: Not enough excess species (${totalExcess}) to cover deficit (${totalDeficit}). Will do best effort reroll.`);
    }

    // Build a list of species from excess franchises that can be rerolled
    // Sort by franchise with most excess first
    excessFranchises.sort((a, b) => b.excess - a.excess);

    const rerollableSpecies = [];
    for (const { franchise, excess } of excessFranchises) {
      // Get species from this franchise (take up to 'excess' count from the end to preserve some variety)
      const franchiseSpecies = analysis.speciesDetails
        .filter(s => s.franchise === franchise)
        .slice(-excess); // Take the last 'excess' entries

      rerollableSpecies.push(...franchiseSpecies);
    }

    console.log(`Found ${rerollableSpecies.length} species available for rerolling`);
    if (rerollableSpecies.length > 0) {
      console.log('Rerollable species:', rerollableSpecies.map(s => `${s.speciesName}(${s.franchise})`).join(', '));
    }

    // Get all current species names to avoid duplicates
    const allSpeciesNames = new Set(analysis.speciesDetails.map(s => s.speciesName));

    // Process each deficient franchise
    console.log('\n=== STARTING REROLL PROCESS ===');
    for (const { franchise: targetFranchise, deficit } of deficientFranchises) {
      console.log(`\nAttempting to add ${deficit} ${targetFranchise} species (${rerollableSpecies.length} rerollable remaining)`);

      let added = 0;
      while (added < deficit && rerollableSpecies.length > 0) {
        // Get the next species to reroll (from excess franchises)
        const toReroll = rerollableSpecies.shift();
        if (!toReroll) {
          console.log('No more species available to reroll');
          break;
        }

        console.log(`Rerolling ${toReroll.speciesName} (${toReroll.franchise}, adopt ${toReroll.adoptIndex}, slot ${toReroll.speciesSlot}) to ${targetFranchise}`);

        // Roll a new species from the target franchise
        const newSpecies = await this.rollSpeciesFromFranchise(
          targetFranchise,
          rollParams,
          Array.from(allSpeciesNames)
        );

        if (newSpecies) {
          // Update the adopt in memory
          const adopt = adopts[toReroll.adoptIndex];
          if (!adopt) {
            console.error(`ERROR: Could not find adopt at index ${toReroll.adoptIndex}`);
            continue;
          }
          const oldSpecies = adopt[toReroll.speciesSlot];
          adopt[toReroll.speciesSlot] = newSpecies;

          // Update the database
          const updateSuccess = await this.updateAdoptSpecies(adopt.id, toReroll.speciesSlot, newSpecies);
          console.log(`Database update for adopt ${adopt.id}: ${updateSuccess ? 'SUCCESS' : 'FAILED'}`);

          // Update our tracking
          allSpeciesNames.delete(oldSpecies);
          allSpeciesNames.add(newSpecies);

          added++;
          console.log(`Successfully replaced ${oldSpecies} with ${newSpecies} in adopt ${adopt.id}`);
        } else {
          console.log(`Failed to roll a new ${targetFranchise} species - rollSpeciesFromFranchise returned null`);
        }
      }

      console.log(`Finished ${targetFranchise}: added ${added}/${deficit} species`);
      if (added < deficit) {
        console.log(`Warning: Could only add ${added}/${deficit} ${targetFranchise} species`);
      }
    }
    console.log('=== REROLL PROCESS COMPLETE ===\n');

    // Log final distribution
    const finalAnalysis = await this.analyzeAdoptsFranchiseDistribution(adopts);
    console.log('Final franchise distribution:', JSON.stringify(finalAnalysis.franchiseCounts));

    return adopts;
  }

  /**
   * Update a specific species slot for an adopt in the database
   * @param {number} adoptId - The adopt ID
   * @param {string} speciesSlot - 'species1', 'species2', or 'species3'
   * @param {string} newSpecies - The new species name
   * @returns {Promise<boolean>} - Success status
   */
  static async updateAdoptSpecies(adoptId, speciesSlot, newSpecies) {
    try {
      const query = isPostgreSQL
        ? `UPDATE monthly_adopts SET ${speciesSlot} = $1 WHERE id = $2`
        : `UPDATE monthly_adopts SET ${speciesSlot} = ? WHERE id = ?`;

      await db.asyncRun(query, [newSpecies, adoptId]);
      return true;
    } catch (error) {
      console.error(`Error updating adopt ${adoptId} ${speciesSlot}:`, error);
      return false;
    }
  }
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

      // Roll parameters for the monster (defined early for both new generation and enforcement)
      // Uses ALL franchises for rolling
      const rollParams = {
        tables: ALL_FRANCHISES,
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
          },
          monsterhunter: {
            includeRanks: [1, 2, 3] // Lower rank monster hunter monsters
          }
        }
      };

      if (neededCount <= 0) {
        console.log('No need to generate more adopts');

        // Return existing adopts (with franchise enforcement for pre-existing sets)
        const query = 'SELECT * FROM monthly_adopts WHERE year = $1 AND month = $2 ORDER BY id ASC';
        let existingAdopts = await db.asyncAll(query, [year, month]);

        // Enforce franchise minimums even on existing adopts
        if (existingAdopts && existingAdopts.length > 0) {
          existingAdopts = await this.enforceFranchiseMinimums(existingAdopts, rollParams);
        }

        return existingAdopts || [];
      }

      // Generate new adopts - enable ALL franchises
      const adopts = [];
      const userSettings = {};
      for (const f of ALL_FRANCHISES) {
        userSettings[`${f}_enabled`] = true;
      }
      const rollerOptions = {
        enabledTables: ALL_FRANCHISES,
        userSettings
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

      // Get all adopts for this month (existing + newly created)
      const query = 'SELECT * FROM monthly_adopts WHERE year = $1 AND month = $2 ORDER BY id ASC';
      let allAdopts = await db.asyncAll(query, [year, month]);

      // Enforce franchise minimums on the complete set of adopts
      if (allAdopts && allAdopts.length > 0) {
        allAdopts = await this.enforceFranchiseMinimums(allAdopts, rollParams);
      }

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
