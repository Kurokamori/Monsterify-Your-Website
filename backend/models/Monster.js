const db = require('../config/db');
const { isPostgreSQL } = require('../utils/dbUtils');

/**
 * Normalize a type string to title case (e.g., 'bug' -> 'Bug')
 * @param {string} type The type string to normalize
 * @returns {string|null} The normalized type or null if input is falsy
 */
function normalizeType(type) {
  if (!type) return null;
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
}

/**
 * Normalize all type fields on a monster object
 * @param {Object} monster The monster object to normalize
 * @returns {Object} The monster with normalized types
 */
function normalizeMonsterTypes(monster) {
  if (!monster) return monster;
  if (monster.type1) monster.type1 = normalizeType(monster.type1);
  if (monster.type2) monster.type2 = normalizeType(monster.type2);
  if (monster.type3) monster.type3 = normalizeType(monster.type3);
  if (monster.type4) monster.type4 = normalizeType(monster.type4);
  if (monster.type5) monster.type5 = normalizeType(monster.type5);
  return monster;
}

class Monster {
  /**
   * Get all monsters
   * @returns {Promise<Array>} Array of monsters
   */
  static async getAll() {
    try {
      const query = `
        SELECT m.*, t.name as trainer_name
        FROM monsters m
        JOIN trainers t ON m.trainer_id = t.id
        ORDER BY m.name
      `;
      const monsters = await db.asyncAll(query);
      return monsters.map(normalizeMonsterTypes);
    } catch (error) {
      console.error('Error getting all monsters:', error);
      throw error;
    }
  }

  /**
   * Get monster by ID
   * @param {number} id Monster ID
   * @returns {Promise<Object>} Monster object
   */
  static async getById(id) {
    try {
      const query = `
        SELECT m.*, t.name as trainer_name
        FROM monsters m
        JOIN trainers t ON m.trainer_id = t.id
        WHERE m.id = $1
      `;
      const monster = await db.asyncGet(query, [id]);
      return normalizeMonsterTypes(monster);
    } catch (error) {
      console.error(`Error getting monster with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get monsters by trainer ID
   * @param {number} trainerId Trainer ID
   * @returns {Promise<Array>} Array of monsters
   */
  static async getByTrainerId(trainerId) {
    try {
      // Only auto-assign positions to monsters that have NULL positions (new monsters)
      // This preserves intentional gaps in box arrangements
      await this.autoAssignBoxPositions(trainerId, true);

      const query = `
        SELECT m.*, t.name as trainer_name
        FROM monsters m
        JOIN trainers t ON m.trainer_id = t.id
        WHERE m.trainer_id = $1
        ORDER BY m.name ASC
      `;

      const monsters = await db.asyncAll(query, [trainerId]);
      return monsters.map(normalizeMonsterTypes);
    } catch (error) {
      console.error(`Error getting monsters for trainer ${trainerId}:`, error);
      throw error;
    }
  }

  /**
   * Auto-assign box positions to monsters that don't have them and fix duplicates
   * @param {number} trainerId Trainer ID
   * @param {boolean} preserveGaps Whether to preserve gaps in box arrangements (default: false)
   */
  static async autoAssignBoxPositions(trainerId, preserveGaps = false) {
    try {
      // Get all monsters for this trainer
      const allMonstersQuery = `
        SELECT id, box_number, trainer_index
        FROM monsters
        WHERE trainer_id = $1
        ORDER BY id ASC
      `;
      const allMonsters = await db.asyncAll(allMonstersQuery, [trainerId]);

      // First, detect and fix duplicate positions
      await this.fixDuplicateBoxPositions(trainerId, allMonsters);

      // Re-fetch monsters after fixing duplicates
      const updatedMonsters = await db.asyncAll(allMonstersQuery, [trainerId]);

      // Find monsters without box assignments
      const unassignedMonsters = updatedMonsters.filter(m => m.box_number === null || m.trainer_index === null);

      if (unassignedMonsters.length === 0) {
        return; // No monsters need assignment
      }

      console.log(`Found ${unassignedMonsters.length} monsters without box assignments for trainer ${trainerId}`);

      // Get all currently assigned positions
      const assignedPositions = new Set();
      updatedMonsters.forEach(m => {
        if (m.box_number !== null && m.trainer_index !== null) {
          assignedPositions.add(`${m.box_number}-${m.trainer_index}`);
        }
      });

      // Assign positions to unassigned monsters
      if (preserveGaps) {
        // When preserving gaps, append new monsters at the end of existing collections
        // Find the highest box with monsters
        let maxBox = 0;
        let maxPositionInHighestBox = -1;
        
        updatedMonsters.forEach(m => {
          if (m.box_number !== null && m.trainer_index !== null) {
            if (m.box_number > maxBox) {
              maxBox = m.box_number;
              maxPositionInHighestBox = m.trainer_index;
            } else if (m.box_number === maxBox && m.trainer_index > maxPositionInHighestBox) {
              maxPositionInHighestBox = m.trainer_index;
            }
          }
        });

        let currentBox = maxBox;
        let currentPosition = maxPositionInHighestBox + 1;

        for (const monster of unassignedMonsters) {
          // If we've reached the box limit, move to next box
          if (currentPosition >= 30) {
            currentPosition = 0;
            currentBox++;
          }

          // Assign this position
          await this.update(monster.id, {
            box_number: currentBox,
            trainer_index: currentPosition
          });

          console.log(`Assigned monster ${monster.id} to box ${currentBox}, position ${currentPosition} (preserving gaps)`);

          // Move to next position
          currentPosition++;
        }
      } else {
        // Original logic: fill the first available slot
        let currentBox = 0;
        let currentPosition = 0;

        for (const monster of unassignedMonsters) {
          // Find next available position
          while (assignedPositions.has(`${currentBox}-${currentPosition}`)) {
            currentPosition++;
            if (currentPosition >= 30) {
              currentPosition = 0;
              currentBox++;
            }
          }

          // Assign this position
          await this.update(monster.id, {
            box_number: currentBox,
            trainer_index: currentPosition
          });

          assignedPositions.add(`${currentBox}-${currentPosition}`);
          console.log(`Assigned monster ${monster.id} to box ${currentBox}, position ${currentPosition}`);

          // Move to next position
          currentPosition++;
          if (currentPosition >= 30) {
            currentPosition = 0;
            currentBox++;
          }
        }
      }

      console.log(`Successfully assigned box positions to ${unassignedMonsters.length} monsters for trainer ${trainerId}`);
    } catch (error) {
      console.error(`Error auto-assigning box positions for trainer ${trainerId}:`, error);
      // Don't throw the error - we want to continue even if auto-assignment fails
    }
  }

  /**
   * Fix duplicate box positions by moving all but one monster from each duplicate slot to empty slots
   * @param {number} trainerId Trainer ID
   * @param {Array} allMonsters Array of monsters with their current positions
   */
  static async fixDuplicateBoxPositions(trainerId, allMonsters) {
    try {
      // Group monsters by their box position
      const positionGroups = new Map();
      
      allMonsters.forEach(monster => {
        // Only consider monsters with valid positions
        if (monster.box_number !== null && monster.trainer_index !== null) {
          const positionKey = `${monster.box_number}-${monster.trainer_index}`;
          if (!positionGroups.has(positionKey)) {
            positionGroups.set(positionKey, []);
          }
          positionGroups.get(positionKey).push(monster);
        }
      });

      // Find duplicate positions (positions with more than one monster)
      const duplicatePositions = [];
      for (const [position, monsters] of positionGroups) {
        if (monsters.length > 1) {
          duplicatePositions.push({ position, monsters });
        }
      }

      if (duplicatePositions.length === 0) {
        console.log(`No duplicate box positions found for trainer ${trainerId}`);
        return;
      }

      console.log(`Found ${duplicatePositions.length} duplicate box positions for trainer ${trainerId}`);

      // Get all currently occupied positions for reference
      const occupiedPositions = new Set();
      positionGroups.forEach((monsters, position) => {
        if (monsters.length === 1) { // Only single-occupied positions are truly "occupied"
          occupiedPositions.add(position);
        }
      });

      // For each duplicate position, keep the first monster and move the rest
      for (const { position, monsters } of duplicatePositions) {
        console.log(`Fixing duplicate position ${position} with ${monsters.length} monsters`);
        
        // Keep the first monster (usually the oldest by ID) in its current position
        const monsterToKeep = monsters[0];
        const monstersToMove = monsters.slice(1);
        
        console.log(`Keeping monster ${monsterToKeep.id} in position ${position}`);
        occupiedPositions.add(position);

        // Move the rest to empty positions
        for (const monster of monstersToMove) {
          const newPosition = this.findNextEmptyPosition(occupiedPositions);
          
          if (newPosition) {
            const [boxNumber, trainerIndex] = newPosition.split('-').map(Number);
            
            await this.update(monster.id, {
              box_number: boxNumber,
              trainer_index: trainerIndex
            });
            
            occupiedPositions.add(newPosition);
            console.log(`Moved monster ${monster.id} from duplicate position ${position} to ${newPosition}`);
          } else {
            console.error(`Could not find empty position for monster ${monster.id}`);
          }
        }
      }

      console.log(`Successfully fixed ${duplicatePositions.length} duplicate positions for trainer ${trainerId}`);
    } catch (error) {
      console.error(`Error fixing duplicate box positions for trainer ${trainerId}:`, error);
      // Don't throw the error - we want to continue even if duplicate fixing fails
    }
  }

  /**
   * Find the next empty position in the box system
   * @param {Set} occupiedPositions Set of occupied position strings (format: "box-index")
   * @returns {string|null} Next empty position or null if none found
   */
  static findNextEmptyPosition(occupiedPositions) {
    // Search through boxes starting from box 0
    for (let boxNumber = 0; boxNumber < 100; boxNumber++) { // Reasonable limit of 100 boxes
      for (let trainerIndex = 0; trainerIndex < 30; trainerIndex++) { // 30 slots per box
        const position = `${boxNumber}-${trainerIndex}`;
        if (!occupiedPositions.has(position)) {
          return position;
        }
      }
    }
    return null; // No empty position found
  }

  /**
   * Assign the next available box position to a specific monster
   * @param {number} monsterId Monster ID
   * @param {number} trainerId Trainer ID
   */
  static async assignNextAvailableBoxPosition(monsterId, trainerId) {
    try {
      // Get all currently assigned positions for this trainer
      const assignedQuery = `
        SELECT box_number, trainer_index
        FROM monsters
        WHERE trainer_id = $1 AND box_number IS NOT NULL AND trainer_index IS NOT NULL
        ORDER BY box_number ASC, trainer_index ASC
      `;
      const assignedPositions = await db.asyncAll(assignedQuery, [trainerId]);

      // Create a set of assigned positions for quick lookup
      const positionSet = new Set();
      assignedPositions.forEach(pos => {
        positionSet.add(`${pos.box_number}-${pos.trainer_index}`);
      });

      // Find the next available position
      let boxNumber = 0;
      let trainerIndex = 0;

      while (positionSet.has(`${boxNumber}-${trainerIndex}`)) {
        trainerIndex++;
        if (trainerIndex >= 30) {
          trainerIndex = 0;
          boxNumber++;
        }
      }

      // Assign this position to the monster
      await this.update(monsterId, {
        box_number: boxNumber,
        trainer_index: trainerIndex
      });

      console.log(`Assigned monster ${monsterId} to box ${boxNumber}, position ${trainerIndex}`);
    } catch (error) {
      console.error(`Error assigning box position to monster ${monsterId}:`, error);
      // Don't throw the error - we want to continue even if assignment fails
    }
  }

  /**
   * Get monsters by user ID (discord_id)
   * @param {string} userId User's discord ID
   * @returns {Promise<Array>} Array of monsters
   */
  static async getByUserId(userId) {
    try {
      const query = `
        SELECT m.*, t.name as trainer_name
        FROM monsters m
        JOIN trainers t ON m.trainer_id = t.id
        WHERE m.player_user_id = $1
        ORDER BY m.name
      `;
      const monsters = await db.asyncAll(query, [userId]);
      return monsters.map(normalizeMonsterTypes);
    } catch (error) {
      console.error(`Error getting monsters for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new monster
   * @param {Object} monsterData Monster data
   * @returns {Promise<Object>} Created monster
   */
  static async create(monsterData) {
    try {
      // Ensure required fields are present
      if (!monsterData.name || !monsterData.trainer_id ||
          !monsterData.species1 || !monsterData.type1) {
        throw new Error('Name, trainer_id, species1, and type1 are required fields');
      }

      // Set default values
      const defaultData = {
        level: 1,
        hp_total: 50,
        hp_iv: Math.floor(Math.random() * 32),
        atk_total: 50,
        atk_iv: Math.floor(Math.random() * 32),
        def_total: 50,
        def_iv: Math.floor(Math.random() * 32),
        spa_total: 50,
        spa_iv: Math.floor(Math.random() * 32),
        spd_total: 50,
        spd_iv: Math.floor(Math.random() * 32),
        spe_total: 50,
        spe_iv: Math.floor(Math.random() * 32),
        friendship: 70,
        moveset: JSON.stringify([])
      };

      // Merge default data with provided data
      const data = { ...defaultData, ...monsterData };

      // Ensure player_user_id is set
      if (!data.player_user_id) {
        // If discord_user_id is provided, use that
        if (data.discord_user_id) {
          data.player_user_id = data.discord_user_id;
        } else {
          // Otherwise, try to get the discord_user_id from the trainer
          try {
            const trainerQuery = 'SELECT player_user_id FROM trainers WHERE id = $1';
            const trainer = await db.asyncGet(trainerQuery, [data.trainer_id]);
            if (trainer && trainer.player_user_id) {
              data.player_user_id = trainer.player_user_id;
            } else {
              throw new Error('Could not determine player_user_id for monster');
            }
          } catch (trainerError) {
            console.error('Error getting trainer discord_user_id:', trainerError);
            throw new Error('Could not determine player_user_id for monster');
          }
        }
      }

      console.log('Final monster data for creation:', data);

      // Define valid fields for the monsters table
      const validFields = [
        'trainer_id', 'player_user_id', 'name', 'species1', 'species2', 'species3',
        'type1', 'type2', 'type3', 'type4', 'type5', 'attribute', 'level',
        'hp_total', 'hp_iv', 'hp_ev', 'atk_total', 'atk_iv', 'atk_ev',
        'def_total', 'def_iv', 'def_ev', 'spa_total', 'spa_iv', 'spa_ev',
        'spd_total', 'spd_iv', 'spd_ev', 'spe_total', 'spe_iv', 'spe_ev',
        'nature', 'characteristic', 'gender', 'friendship', 'ability1', 'ability2',
        'moveset', 'img_link', 'date_met', 'where_met', 'box_number', 'trainer_index'
      ];

      // Filter data to only include valid fields
      const filteredData = {};
      validFields.forEach(field => {
        if (data.hasOwnProperty(field)) {
          filteredData[field] = data[field];
        }
      });

      console.log('Filtered monster data for creation:', filteredData);

      // Build query dynamically based on filtered fields
      const fields = Object.keys(filteredData);
      const placeholders = fields.map((_, index) => `$${index + 1}`).join(', ');
      const values = fields.map(field => {
        const value = filteredData[field];

        // Stringify JSON fields
        if (field === 'moveset' && typeof value === 'object') {
          return JSON.stringify(value);
        }

        // Convert boolean fields to integers (0 or 1)
        const booleanFields = ['shiny', 'alpha', 'shadow', 'paradox', 'pokerus', 'is_starter_template'];
        if (booleanFields.includes(field)) {
          return value === true || value === 'true' || value === 1 || value === '1' ? 1 : 0;
        }

        return value;
      });

      let query, result, monsterId;

      if (isPostgreSQL) {
        // PostgreSQL: Use RETURNING clause to get the inserted ID
        query = `
          INSERT INTO monsters (${fields.join(', ')})
          VALUES (${placeholders})
          RETURNING id
        `;

        console.log('Monster creation SQL (PostgreSQL):', query);
        console.log('Monster creation values:', values);

        result = await db.asyncRun(query, values);
        monsterId = result.rows[0].id;
      } else {
        // SQLite: Use lastID from result
        query = `
          INSERT INTO monsters (${fields.join(', ')})
          VALUES (${placeholders})
        `;

        console.log('Monster creation SQL (SQLite):', query);
        console.log('Monster creation values:', values);

        result = await db.asyncRun(query, values);
        monsterId = result.lastID;
      }

      console.log('Monster created with ID:', monsterId);

      // Auto-assign box position if not already assigned
      if (!filteredData.box_number && !filteredData.trainer_index) {
        await this.assignNextAvailableBoxPosition(monsterId, data.trainer_id);
      }

      // Return the created monster
      return await this.getById(monsterId);
    } catch (error) {
      console.error('Error creating monster:', error);
      throw error;
    }
  }

  /**
   * Update a monster
   * @param {number} id Monster ID
   * @param {Object} monsterData Monster data
   * @returns {Promise<Object>} Updated monster
   */
  static async update(id, monsterData) {
    try {
      // Get current monster data
      const currentMonster = await this.getById(id);
      if (!currentMonster) {
        throw new Error(`Monster with ID ${id} not found`);
      }

      // Prevent updating certain fields
      const protectedFields = ['id', 'trainer_id', 'player_user_id', 'trainer_name', 'updated_at', 'mega_image', 'mega_stone_img'];
      const filteredData = { ...monsterData };
      protectedFields.forEach(field => delete filteredData[field]);

      // Build query dynamically based on provided fields
      const fields = Object.keys(filteredData);
      if (fields.length === 0) {
        return currentMonster; // Nothing to update
      }

      const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
      const values = fields.map(field => {
        const value = filteredData[field];

        // Stringify JSON fields
        if (field === 'moveset' && typeof value === 'object') {
          return JSON.stringify(value);
        }

        // Convert boolean fields to integers (0 or 1)
        const booleanFields = ['shiny', 'alpha', 'shadow', 'paradox', 'pokerus', 'is_starter_template'];
        if (booleanFields.includes(field)) {
          return value === true || value === 'true' || value === 1 || value === '1' ? 1 : 0;
        }

        return value;
      });
      values.push(id);

      const query = `
        UPDATE monsters
        SET ${setClause}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${values.length}
      `;

      await db.asyncRun(query, values);

      // Return the updated monster
      return await this.getById(id);
    } catch (error) {
      console.error(`Error updating monster with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Transfer a monster to a different trainer
   * @param {number} id Monster ID
   * @param {number} newTrainerId New trainer ID
   * @returns {Promise<Object>} Updated monster
   */
  static async transferToTrainer(id, newTrainerId) {
    try {
      // Check if monster exists
      const monster = await this.getById(id);
      if (!monster) {
        throw new Error(`Monster with ID ${id} not found`);
      }

      // Get the new trainer to get their player_user_id
      const Trainer = require('./Trainer');
      const newTrainer = await Trainer.getById(newTrainerId);
      if (!newTrainer) {
        throw new Error(`Trainer with ID ${newTrainerId} not found`);
      }

      // Update both trainer_id and player_user_id for proper ownership transfer
      const query = `
        UPDATE monsters
        SET trainer_id = $1, player_user_id = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `;

      await db.asyncRun(query, [newTrainerId, newTrainer.player_user_id, id]);

      // Return the updated monster
      return await this.getById(id);
    } catch (error) {
      console.error(`Error transferring monster ${id} to trainer ${newTrainerId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a monster
   * @param {number} id Monster ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    try {
      // Check if monster exists
      const monster = await this.getById(id);
      if (!monster) {
        throw new Error(`Monster with ID ${id} not found`);
      }

      // Delete monster (cascade will delete images and evolution lines)
      const query = 'DELETE FROM monsters WHERE id = $1';
      await db.asyncRun(query, [id]);

      return true;
    } catch (error) {
      console.error(`Error deleting monster with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Add images to a monster
   * @param {number} monsterId Monster ID
   * @param {Object} imageData Image data (image_url, image_type, order_index)
   * @returns {Promise<Object>} Created image
   */
  static async addImage(monsterId, imageData) {
    try {
      // Ensure required fields are present
      if (!imageData.image_url || !imageData.image_type) {
        throw new Error('image_url and image_type are required fields');
      }

      // Set default values
      const defaultData = {
        order_index: 0
      };

      // Merge default data with provided data
      const data = { ...defaultData, ...imageData, monster_id: monsterId };

      // Build query with RETURNING clause for PostgreSQL
      const query = `
        INSERT INTO monster_images (monster_id, image_url, image_type, order_index)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `;

      const result = await db.asyncRun(query, [
        data.monster_id,
        data.image_url,
        data.image_type,
        data.order_index
      ]);

      // Get the ID from PostgreSQL result
      const insertedId = result.rows ? result.rows[0].id : result.lastID;

      // Return the created image
      return {
        id: insertedId,
        ...data
      };
    } catch (error) {
      console.error(`Error adding image to monster ${monsterId}:`, error);
      throw error;
    }
  }

  /**
   * Get images for a monster
   * @param {number} monsterId Monster ID
   * @returns {Promise<Array>} Array of images
   */
  static async getImages(monsterId) {
    try {
      const query = `
        SELECT *
        FROM monster_images
        WHERE monster_id = $1
        ORDER BY image_type, order_index
      `;
      return await db.asyncAll(query, [monsterId]);
    } catch (error) {
      console.error(`Error getting images for monster ${monsterId}:`, error);
      throw error;
    }
  }

  /**
   * Get mega stone image for a monster
   * @param {number} monsterId Monster ID
   * @returns {Promise<Object|null>} Mega stone image or null
   */
  static async getMegaStoneImage(monsterId) {
    try {
      const query = `
        SELECT *
        FROM monster_images
        WHERE monster_id = $1 AND image_type = 'mega_stone'
        ORDER BY order_index
        LIMIT 1
      `;
      return await db.asyncGet(query, [monsterId]);
    } catch (error) {
      console.error(`Error getting mega stone image for monster ${monsterId}:`, error);
      throw error;
    }
  }

  /**
   * Get mega image for a monster
   * @param {number} monsterId Monster ID
   * @returns {Promise<Object|null>} Mega image or null
   */
  static async getMegaImage(monsterId) {
    try {
      const query = `
        SELECT *
        FROM monster_images
        WHERE monster_id = $1 AND image_type = 'mega_image'
        ORDER BY order_index
        LIMIT 1
      `;
      return await db.asyncGet(query, [monsterId]);
    } catch (error) {
      console.error(`Error getting mega image for monster ${monsterId}:`, error);
      throw error;
    }
  }

  /**
   * Add or update mega stone image for a monster
   * @param {number} monsterId Monster ID
   * @param {string} imageUrl Image URL
   * @returns {Promise<Object>} Created or updated image
   */
  static async setMegaStoneImage(monsterId, imageUrl) {
    try {
      // Check if mega stone image already exists
      const existingImage = await this.getMegaStoneImage(monsterId);

      if (existingImage) {
        // Update existing image
        const query = `
          UPDATE monster_images
          SET image_url = $1
          WHERE id = $2
        `;
        await db.asyncRun(query, [imageUrl, existingImage.id]);
        return { ...existingImage, image_url: imageUrl };
      } else {
        // Create new image
        return await this.addImage(monsterId, {
          image_url: imageUrl,
          image_type: 'mega_stone',
          order_index: 0
        });
      }
    } catch (error) {
      console.error(`Error setting mega stone image for monster ${monsterId}:`, error);
      throw error;
    }
  }

  /**
   * Add or update mega image for a monster
   * @param {number} monsterId Monster ID
   * @param {string} imageUrl Image URL
   * @returns {Promise<Object>} Created or updated image
   */
  static async setMegaImage(monsterId, imageUrl) {
    try {
      // Check if mega image already exists
      const existingImage = await this.getMegaImage(monsterId);

      if (existingImage) {
        // Update existing image
        const query = `
          UPDATE monster_images
          SET image_url = $1
          WHERE id = $2
        `;
        await db.asyncRun(query, [imageUrl, existingImage.id]);
        return { ...existingImage, image_url: imageUrl };
      } else {
        // Create new image
        return await this.addImage(monsterId, {
          image_url: imageUrl,
          image_type: 'mega_image',
          order_index: 0
        });
      }
    } catch (error) {
      console.error(`Error setting mega image for monster ${monsterId}:`, error);
      throw error;
    }
  }

  /**
   * Set evolution data for a monster
   * @param {number} monsterId Monster ID
   * @param {Object} evolutionData Evolution data
   * @returns {Promise<Object>} Created or updated evolution data
   */
  static async setEvolutionData(monsterId, evolutionData) {
    try {
      // Check if evolution data already exists
      const existingData = await db.asyncGet(
        'SELECT * FROM monster_evolution_lines WHERE monster_id = $1',
        [monsterId]
      );

      // Convert evolutionData to string if it's an object
      const evolutionDataStr = typeof evolutionData === 'object'
        ? JSON.stringify(evolutionData)
        : evolutionData;

      if (existingData) {
        // Update existing data
        await db.asyncRun(
          'UPDATE monster_evolution_lines SET evolution_data = $1, updated_at = CURRENT_TIMESTAMP WHERE monster_id = $2',
          [evolutionDataStr, monsterId]
        );
      } else {
        // Create new data
        await db.asyncRun(
          'INSERT INTO monster_evolution_lines (monster_id, evolution_data) VALUES ($1, $2)',
          [monsterId, evolutionDataStr]
        );
      }

      // Return the updated data
      return await this.getEvolutionData(monsterId);
    } catch (error) {
      console.error(`Error setting evolution data for monster ${monsterId}:`, error);
      throw error;
    }
  }

  /**
   * Get evolution data for a monster
   * @param {number} monsterId Monster ID
   * @returns {Promise<Object>} Evolution data
   */
  static async getEvolutionData(monsterId) {
    try {
      const data = await db.asyncGet(
        'SELECT * FROM monster_evolution_lines WHERE monster_id = $1',
        [monsterId]
      );

      if (!data) {
        return null;
      }

      // Parse evolution_data
      try {
        data.evolution_data = JSON.parse(data.evolution_data);
      } catch (e) {
        // If parsing fails, keep as is
      }

      return data;
    } catch (error) {
      console.error(`Error getting evolution data for monster ${monsterId}:`, error);
      throw error;
    }
  }

  /**
   * Get moves for a monster
   * @param {number} monsterId Monster ID
   * @returns {Promise<Array>} Array of moves
   */
  static async getMoves(monsterId) {
    try {
      // Get monster to check if it exists
      const monster = await this.getById(monsterId);
      if (!monster) {
        throw new Error(`Monster with ID ${monsterId} not found`);
      }

      // Get moves from monster's moveset - defensive parsing
      let moveset = [];
      try {
        if (monster.moveset && monster.moveset !== 'null') {
          const parsed = JSON.parse(monster.moveset);
          // Ensure it's an iterable array
          if (Array.isArray(parsed)) {
            moveset = parsed;
          }
        }
      } catch (e) {
        console.warn(`Monster ${monsterId} had invalid moveset JSON, defaulting to empty array:`, e.message);
      }

      // If no moves in moveset, return empty array
      if (!Array.isArray(moveset) || moveset.length === 0) {
        return [];
      }

      // Get move details from moves table
      const placeholders = moveset.map((_, index) => `$${index + 1}`).join(',');
      const query = `
        SELECT
          "MoveName" as move_name,
          "Type" as move_type,
          "Attribute" as attribute,
          "Power" as power,
          "Accuracy" as accuracy,
          "PP" as pp,
          "Effect" as description,
          "MoveType" as move_category
        FROM moves
        WHERE "MoveName" IN (${placeholders})
      `;

      const moves = await db.asyncAll(query, moveset);

      // Log the moves for debugging
      console.log(`Retrieved ${moves.length} moves for monster ${monsterId}:`, moves);

      return moves;
    } catch (error) {
      console.error(`Error getting moves for monster ${monsterId}:`, error);
      throw error;
    }
  }

  /**
   * Get references for a monster
   * @param {number} monsterId Monster ID
   * @returns {Promise<Array>} Array of references
   */
  static async getReferences(monsterId) {
    try {
      // Get monster to check if it exists
      const monster = await this.getById(monsterId);
      if (!monster) {
        throw new Error(`Monster with ID ${monsterId} not found`);
      }

      // Get references from submissions
      const query = `
        SELECT
          s.id,
          s.title,
          s.description,
          s.submission_date,
          s.content_type,
          s.user_id,
          u.username,
          u.display_name,
          (SELECT image_url FROM submission_images WHERE submission_id = s.id AND is_main = 1 LIMIT 1) as image_url
        FROM submissions s
        JOIN submission_references sr ON s.id = sr.submission_id
        JOIN users u ON s.user_id = u.id
        WHERE sr.monster_id = $1 AND sr.reference_type = 'monster'
        ORDER BY s.submission_date DESC
      `;

      return await db.asyncAll(query, [monsterId]);
    } catch (error) {
      console.error(`Error getting references for monster ${monsterId}:`, error);
      throw error;
    }
  }

  /**
   * Get gallery submissions for a monster
   * @param {number} monsterId Monster ID
   * @returns {Promise<Array>} Array of gallery submissions
   */
  static async getGallery(monsterId) {
    try {
      // Get monster to check if it exists
      const monster = await this.getById(monsterId);
      if (!monster) {
        throw new Error(`Monster with ID ${monsterId} not found`);
      }

      // Get submissions that feature this monster
      const query = `
        SELECT
          s.id,
          s.title,
          s.description,
          s.content_type,
          s.submission_date,
          u.username,
          u.display_name,
          (SELECT image_url FROM submission_images WHERE submission_id = s.id AND is_main = 1 LIMIT 1) as image_url
        FROM submissions s
        JOIN submission_monsters sm ON s.id = sm.submission_id
        JOIN users u ON s.user_id = u.id
        WHERE sm.monster_id = $1
        ORDER BY s.submission_date DESC
      `;

      const submissions = await db.asyncAll(query, [monsterId]);
      return submissions;
    } catch (error) {
      console.error(`Error getting gallery for monster ${monsterId}:`, error);
      throw error;
    }
  }

  /**
   * Add levels to a monster
   * @param {number} monsterId Monster ID
   * @param {number} levels Number of levels to add
   * @returns {Promise<Object>} Updated monster
   */
  static async addLevels(monsterId, levels) {
    try {
      // Use the MonsterInitializer to level up the monster with proper mechanics
      const MonsterInitializer = require('../utils/MonsterInitializer');

      // Level up the monster with proper stat calculation, EVs, friendship, and move learning
      const updatedMonster = await MonsterInitializer.levelUpMonster(monsterId, levels);

      console.log(`Successfully leveled up monster ${monsterId} to level ${updatedMonster.level} with proper stats, EVs, friendship, and moves`);
      return updatedMonster;
    } catch (error) {
      console.error(`Error adding levels for monster ${monsterId}:`, error);
      throw error;
    }
  }

  /**
   * Get evolution chain for a monster
   * @param {number} monsterId Monster ID
   * @returns {Promise<Object>} Evolution chain
   */
  static async getEvolutionChain(monsterId) {
    try {
      // Get monster to check if it exists
      const monster = await this.getById(monsterId);
      if (!monster) {
        throw new Error(`Monster with ID ${monsterId} not found`);
      }

      // Get evolution data
      const evolutionData = await this.getEvolutionData(monsterId);
      if (!evolutionData || !evolutionData.evolution_data) {
        return { chain: [] };
      }

      // Build evolution chain
      const chain = [];

      // Add pre-evolutions if any
      if (evolutionData.evolution_data.pre_evolutions) {
        for (const preEvo of evolutionData.evolution_data.pre_evolutions) {
          const preEvoMonster = await this.getById(preEvo.monster_id);
          if (preEvoMonster) {
            chain.push({
              id: preEvoMonster.id,
              name: preEvoMonster.name,
              species: preEvoMonster.species1,
              level: preEvoMonster.level,
              evolution_type: 'pre_evolution',
              evolution_method: preEvo.method || 'level_up',
              evolution_level: preEvo.level || null,
              evolution_item: preEvo.item || null
            });
          }
        }
      }

      // Add current monster
      chain.push({
        id: monster.id,
        name: monster.name,
        species: monster.species1,
        level: monster.level,
        evolution_type: 'current',
        evolution_method: null,
        evolution_level: null,
        evolution_item: null
      });

      // Add evolutions if any
      if (evolutionData.evolution_data.evolutions) {
        for (const evo of evolutionData.evolution_data.evolutions) {
          const evoMonster = await this.getById(evo.monster_id);
          if (evoMonster) {
            chain.push({
              id: evoMonster.id,
              name: evoMonster.name,
              species: evoMonster.species1,
              level: evoMonster.level,
              evolution_type: 'evolution',
              evolution_method: evo.method || 'level_up',
              evolution_level: evo.level || null,
              evolution_item: evo.item || null
            });
          }
        }
      }

      return { chain };
    } catch (error) {
      console.error(`Error getting evolution chain for monster ${monsterId}:`, error);
      throw error;
    }
  }
}

module.exports = Monster;
