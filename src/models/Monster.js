const pool = require('../db');

class Monster {
  /**
   * Get all monsters
   * @returns {Promise<Array>} - Array of monsters
   */
  static async getAll() {
    try {
      const query = 'SELECT * FROM mons ORDER BY name';
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error getting all monsters:', error);
      return [];
    }
  }

  /**
   * Get a monster by ID
   * @param {number} id - Monster ID
   * @returns {Promise<Object>} - Monster object
   */
  static async getById(id) {
    try {
      const query = 'SELECT * FROM mons WHERE mon_id = $1';
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error getting monster by ID:', error);
      return null;
    }
  }

  /**
   * Get monsters by trainer ID
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Array>} - Array of monsters
   */
  static async getByTrainerId(trainerId) {
    try {
      const query = 'SELECT * FROM mons WHERE trainer_id = $1 ORDER BY name';
      const result = await pool.query(query, [trainerId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting monsters by trainer ID:', error);
      return [];
    }
  }

  /**
   * Get monsters by trainer ID and name
   * @param {number} trainerId - Trainer ID
   * @param {string} name - Monster name
   * @returns {Promise<Array>} - Array of monsters
   */
  static async getByTrainerIdAndName(trainerId, name) {
    try {
      const query = 'SELECT * FROM mons WHERE trainer_id = $1 AND name = $2';
      const result = await pool.query(query, [trainerId, name]);
      return result.rows;
    } catch (error) {
      console.error('Error getting monsters by trainer ID and name:', error);
      return [];
    }
  }

  /**
   * Get monsters in a trainer's battle box
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Array>} - Array of monsters in battle box
   */
  static async getBattleBox(trainerId) {
    try {
      // Query for monsters with box_number = -1
      const query = 'SELECT * FROM mons WHERE trainer_id = $1 AND box_number = -1 ORDER BY name';
      const result = await pool.query(query, [trainerId]);

      // If no monsters found, try to query for monsters with box_number = 1 (in case the box number was changed)
      if (result.rows.length === 0) {
        const fallbackQuery = 'SELECT * FROM mons WHERE trainer_id = $1 AND box_number = 1 ORDER BY name';
        const fallbackResult = await pool.query(fallbackQuery, [trainerId]);
        return fallbackResult.rows;
      }

      return result.rows;
    } catch (error) {
      console.error('Error getting battle box monsters:', error);
      return [];
    }
  }

  /**
   * Create a new monster
   * @param {Object} monsterData - Monster data
   * @returns {Promise<Object>} - Created monster
   */
  static async create(monsterData) {
    try {
      // Create a copy of the monster data to modify
      const processedData = { ...monsterData };

      // Set default image if not provided
      if (!processedData.img_link) {
        processedData.img_link = '';
      }

      // Initialize monster stats and moves
      const MonsterInitializer = require('../utils/MonsterInitializer');
      const initializedData = await MonsterInitializer.initializeMonster(processedData);

      // Integer fields in the mons table
      const integerFields = ['mon_id', 'trainer_id', 'level', 'mon_index', 'box_number',
                            'hp_total', 'hp_ev', 'hp_iv', 'atk_total', 'atk_ev', 'atk_iv',
                            'def_total', 'def_ev', 'def_iv', 'spa_total', 'spa_ev', 'spa_iv',
                            'spd_total', 'spd_ev', 'spd_iv', 'spe_total', 'spe_ev', 'spe_iv',
                            'shiny', 'alpha', 'shadow', 'paradox', 'pokerus', 'friendship'];

      // Boolean fields in the database
      const booleanFields = ['is_starter_template'];

      // Build the columns and values for the query
      const columns = [];
      const placeholders = [];
      const values = [];
      let paramIndex = 1;

      // Add each field to the query
      Object.entries(initializedData).forEach(([key, value]) => {
        if (value !== undefined) {
          // For boolean fields, add explicit cast to boolean
          if (booleanFields.includes(key)) {
            columns.push(key);
            placeholders.push(`$${paramIndex}::boolean`);
          } else {
            columns.push(key);
            placeholders.push(`$${paramIndex}`);
          }

          // Handle empty strings for integer fields
          if (integerFields.includes(key) && value === '') {
            values.push(null);
          }
          // Handle boolean fields (ensure they are proper booleans)
          else if (booleanFields.includes(key)) {
            // Convert truthy/falsy values to true/false
            values.push(value === true || value === 'true' || value === 1);
          } else {
            values.push(value);
          }

          paramIndex++;
        }
      });

      // Ensure we have at least the required fields
      if (!columns.includes('trainer_id') || !columns.includes('name') || !columns.includes('level')) {
        throw new Error('Missing required fields: trainer_id, name, and level are required');
      }

      // Validate trainer_id is a valid integer
      const trainerIdIndex = columns.indexOf('trainer_id');
      if (trainerIdIndex !== -1) {
        const trainerId = values[trainerIdIndex];
        if (isNaN(parseInt(trainerId))) {
          throw new Error(`Invalid trainer_id: ${trainerId}`);
        }

        // Check if the trainer exists in the database
        try {
          const Trainer = require('./Trainer');
          const trainer = await Trainer.getById(trainerId);
          if (!trainer) {
            throw new Error(`Trainer with ID ${trainerId} not found in database`);
          }
        } catch (trainerError) {
          console.error('Error validating trainer:', trainerError);
          // Don't throw here, as we want to continue with the monster creation
          // The foreign key constraint will catch this if necessary
        }
      }

      // Ensure we have matching columns and placeholders
      if (columns.length !== placeholders.length || columns.length !== values.length) {
        throw new Error(`Mismatch in query parameters: ${columns.length} columns, ${placeholders.length} placeholders, ${values.length} values`);
      }

      const query = `
        INSERT INTO mons (
          ${columns.join(', ')}
        )
        VALUES (${placeholders.join(', ')})
        RETURNING *
      `;

      console.log('Monster creation query:', query);
      console.log('Monster creation values:', values);

      // Log the types of each value for debugging
      console.log('Value types:');
      values.forEach((value, index) => {
        console.log(`  ${columns[index]}: ${value === null ? 'null' : typeof value} = ${value}`);
      });

      const result = await pool.query(query, values);
      console.log('Monster created successfully:', result.rows[0]);

      // Update monster counts for the trainer
      if (result.rows[0] && result.rows[0].trainer_id) {
        const Trainer = require('./Trainer');
        await Trainer.recalculateMonsterCounts(result.rows[0].trainer_id);
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error creating monster:', error);
      // Don't try to access query or values here as they might not be defined in this scope
      console.error('Monster data that failed:', JSON.stringify(monsterData, null, 2));

      // Throw the error instead of returning null
      throw new Error(`Failed to create monster: ${error.message}`);
    }
  }

  /**
   * Update a monster
   * @param {number} id - Monster ID
   * @param {Object} monsterData - Monster data
   * @returns {Promise<Object>} - Updated monster
   */
  static async update(id, monsterData) {
    try {
      // Create a copy of the monster data to modify
      const processedData = { ...monsterData };

      // If img_link is empty string, set to default
      if (processedData.img_link === '') {
        processedData.img_link = '';
      }

      // Integer fields in the mons table
      const integerFields = ['mon_id', 'trainer_id', 'level', 'mon_index', 'box_number',
                            'hp_total', 'hp_ev', 'hp_iv', 'atk_total', 'atk_ev', 'atk_iv',
                            'def_total', 'def_ev', 'def_iv', 'spa_total', 'spa_ev', 'spa_iv',
                            'spd_total', 'spd_ev', 'spd_iv', 'spe_total', 'spe_ev', 'spe_iv',
                            'shiny', 'alpha', 'shadow', 'paradox', 'pokerus', 'friendship'];

      // Create a set of columns and values for the SQL query
      const columns = [];
      const values = [];
      let paramCounter = 1;

      // Add each property to the columns and values arrays
      Object.entries(processedData).forEach(([key, value]) => {
        if (value !== undefined) {
          // Handle empty strings for integer fields
          if (integerFields.includes(key) && value === '') {
            // Skip this field or set it to null
            columns.push(`${key} = $${paramCounter}`);
            values.push(null);
            paramCounter++;
          } else {
            columns.push(`${key} = $${paramCounter}`);
            values.push(value);
            paramCounter++;
          }
        }
      });

      // Add the updated_at timestamp if it's not already in the columns
      if (!columns.some(col => col.startsWith('updated_at ='))) {
        columns.push(`updated_at = CURRENT_TIMESTAMP`);
      }

      // Add the ID as the last parameter
      values.push(id);

      const query = `
        UPDATE mons
        SET ${columns.join(', ')}
        WHERE mon_id = $${paramCounter}
        RETURNING *
      `;

      const result = await pool.query(query, values);

      // Debug output
      console.log('Updated monster:', JSON.stringify(result.rows[0], null, 2));

      // Update monster counts for the trainer
      if (result.rows[0] && result.rows[0].trainer_id) {
        const Trainer = require('./Trainer');
        await Trainer.recalculateMonsterCounts(result.rows[0].trainer_id);
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error updating monster:', error);
      return null;
    }
  }

  /**
   * Delete a monster
   * @param {number} id - Monster ID
   * @returns {Promise<boolean>} - Success status
   */
  static async delete(id) {
    try {
      // First get the monster to get the trainer_id
      const getQuery = 'SELECT trainer_id FROM mons WHERE mon_id = $1';
      const getResult = await pool.query(getQuery, [id]);
      const trainerId = getResult.rows[0]?.trainer_id;

      // Delete the monster
      const query = 'DELETE FROM mons WHERE mon_id = $1';
      await pool.query(query, [id]);

      // Update monster counts for the trainer if we have a trainer_id
      if (trainerId) {
        const Trainer = require('./Trainer');
        await Trainer.recalculateMonsterCounts(trainerId);
      }

      return true;
    } catch (error) {
      console.error('Error deleting monster:', error);
      return false;
    }
  }

  /**
   * Get monsters by trainer ID and box number
   * @param {number} trainerId - Trainer ID
   * @param {number} boxNumber - Box number
   * @returns {Promise<Array>} - Array of monsters in the specified box
   */
  static async getByTrainerIdAndBoxNumber(trainerId, boxNumber) {
    try {
      const query = 'SELECT * FROM mons WHERE trainer_id = $1 AND box_number = $2 ORDER BY trainer_index, name';
      const result = await pool.query(query, [trainerId, boxNumber]);
      return result.rows;
    } catch (error) {
      console.error('Error getting monsters by trainer ID and box number:', error);
      return [];
    }
  }

  /**
   * Get all box numbers for a trainer
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Array>} - Array of box numbers
   */
  static async getBoxNumbersByTrainerId(trainerId) {
    try {
      const query = 'SELECT DISTINCT box_number FROM mons WHERE trainer_id = $1 ORDER BY box_number';
      const result = await pool.query(query, [trainerId]);
      return result.rows.map(row => row.box_number);
    } catch (error) {
      console.error('Error getting box numbers by trainer ID:', error);
      return [];
    }
  }

  /**
   * Get monsters by trainer ID with pagination
   * @param {number} trainerId - Trainer ID
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Number of monsters per page
   * @returns {Promise<Object>} - Object containing monsters and pagination info
   */
  static async getByTrainerIdPaginated(trainerId, page = 1, limit = 30) {
    try {
      // Calculate offset
      const offset = (page - 1) * limit;

      // Get total count
      const countQuery = 'SELECT COUNT(*) FROM mons WHERE trainer_id = $1';
      const countResult = await pool.query(countQuery, [trainerId]);
      const totalCount = parseInt(countResult.rows[0].count);

      // Get monsters for the current page
      const query = 'SELECT * FROM mons WHERE trainer_id = $1 ORDER BY box_number, trainer_index, name LIMIT $2 OFFSET $3';
      const result = await pool.query(query, [trainerId, limit, offset]);

      // Calculate total pages
      const totalPages = Math.ceil(totalCount / limit);

      return {
        monsters: result.rows,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages
        }
      };
    } catch (error) {
      console.error('Error getting paginated monsters by trainer ID:', error);
      return {
        monsters: [],
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
   * Get monsters by trainer ID and box number with pagination
   * @param {number} trainerId - Trainer ID
   * @param {number} boxNumber - Box number
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Number of monsters per page
   * @returns {Promise<Object>} - Object containing monsters and pagination info
   */
  static async getByTrainerIdAndBoxNumberPaginated(trainerId, boxNumber, page = 1, limit = 30) {
    try {
      // Calculate offset
      const offset = (page - 1) * limit;

      // Get total count
      const countQuery = 'SELECT COUNT(*) FROM mons WHERE trainer_id = $1 AND box_number = $2';
      const countResult = await pool.query(countQuery, [trainerId, boxNumber]);
      const totalCount = parseInt(countResult.rows[0].count);

      // Get monsters for the current page
      const query = 'SELECT * FROM mons WHERE trainer_id = $1 AND box_number = $2 ORDER BY trainer_index, name LIMIT $3 OFFSET $4';
      const result = await pool.query(query, [trainerId, boxNumber, limit, offset]);

      // Calculate total pages
      const totalPages = Math.ceil(totalCount / limit);

      return {
        monsters: result.rows,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages
        }
      };
    } catch (error) {
      console.error('Error getting paginated monsters by trainer ID and box number:', error);
      return {
        monsters: [],
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
   * Reorganize monsters into boxes of specified size
   * @param {number} trainerId - Trainer ID
   * @param {number} boxSize - Maximum number of monsters per box
   * @returns {Promise<boolean>} - Success status
   */
  static async reorganizeBoxes(trainerId, boxSize = 30) {
    try {
      // Get all monsters for the trainer, excluding battle box (box_number = -1)
      const query = 'SELECT * FROM mons WHERE trainer_id = $1 AND box_number != -1 ORDER BY trainer_index, name';
      const result = await pool.query(query, [trainerId]);
      const monsters = result.rows;

      // Calculate new box numbers
      const updates = [];
      monsters.forEach((monster, index) => {
        const newBoxNumber = Math.floor(index / boxSize) + 1; // Box numbers start at 1
        if (monster.box_number !== newBoxNumber) {
          updates.push({
            monId: monster.mon_id,
            boxNumber: newBoxNumber
          });
        }
      });

      // Update box numbers in batches
      for (const update of updates) {
        await pool.query(
          'UPDATE mons SET box_number = $1, updated_at = CURRENT_TIMESTAMP WHERE mon_id = $2',
          [update.boxNumber, update.monId]
        );
      }

      return true;
    } catch (error) {
      console.error('Error reorganizing boxes:', error);
      return false;
    }
  }

  /**
   * Add levels to a monster
   * @param {number} monsterId - Monster ID
   * @param {number} levels - Number of levels to add
   * @returns {Promise<boolean>} - Success status
   */
  static async addLevels(monsterId, levels) {
    try {
      // Get the monster
      const monster = await this.getById(monsterId);
      if (!monster) {
        throw new Error(`Monster with ID ${monsterId} not found`);
      }

      // Calculate new level (capped at 100)
      let newLevel = (monster.level || 1) + levels;

      // If the monster would exceed level 100, convert excess levels to coins
      let excessLevels = 0;
      if (newLevel > 100) {
        excessLevels = newLevel - 100;
        newLevel = 100;

        // Convert excess levels to coins (25 coins per level)
        if (excessLevels > 0) {
          const Trainer = require('./Trainer');
          await Trainer.addCoins(monster.trainer_id, excessLevels * 25);
          console.log(`Monster ${monsterId} reached level cap. Converted ${excessLevels} excess levels to ${excessLevels * 25} coins for trainer ${monster.trainer_id}`);
        }
      }

      // Get the MonsterInitializer to calculate new stats
      const MonsterInitializer = require('../utils/MonsterInitializer');
      const baseStats = MonsterInitializer.calculateBaseStats(newLevel);

      // Parse current moveset
      let currentMoves = [];
      try {
        if (monster.moveset) {
          currentMoves = JSON.parse(monster.moveset);
        }
      } catch (error) {
        console.error(`Error parsing moveset for monster ${monsterId}:`, error);
      }

      // Calculate how many moves the monster should have based on new level
      const oldMoveCount = Math.max(1, Math.floor(monster.level / 5) + 1);
      const newMoveCount = Math.max(1, Math.floor(newLevel / 5) + 1);

      // If the monster should learn new moves, get them
      let updatedMoves = [...currentMoves];
      if (newMoveCount > oldMoveCount) {
        try {
          // Get new moves
          const newMoves = await MonsterInitializer.getMovesForMonster(monster, newMoveCount - oldMoveCount);

          // Add new moves to the moveset
          updatedMoves = [...currentMoves, ...newMoves];
        } catch (moveError) {
          console.error(`Error getting new moves for monster ${monsterId}:`, moveError);
          // Continue with current moves if there's an error
        }
      }

      // Update monster with new level, stats, and moves
      const updatedMonster = {
        ...monster,
        level: newLevel,
        ...baseStats,
        moveset: JSON.stringify(updatedMoves)
      };

      // Save the updated monster
      await this.update(monsterId, updatedMonster);
      return true;
    } catch (error) {
      console.error(`Error adding levels to monster ${monsterId}:`, error);
      return false;
    }
  }
}

module.exports = Monster;
