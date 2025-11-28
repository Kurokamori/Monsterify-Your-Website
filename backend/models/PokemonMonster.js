const db = require('../config/db');
const { buildLimitOffset } = require('../utils/dbUtils');

/**
 * Pokemon Monster model
 */
class PokemonMonster {
  /**
   * Get all Pokemon monsters with pagination and filtering
   * @param {Object} options - Query options
   * @param {number} options.page - Page number
   * @param {number} options.limit - Items per page
   * @param {string} options.search - Search term
   * @param {string} options.sortBy - Sort field
   * @param {string} options.sortOrder - Sort order (asc/desc)
   * @param {string} options.type - Filter by type
   * @param {boolean} options.legendary - Filter by legendary status
   * @param {boolean} options.mythical - Filter by mythical status
   * @param {string} options.stage - Filter by evolution stage
   * @returns {Promise<{data: Array, total: number, page: number, limit: number, totalPages: number}>}
   */
  static async getAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        sortBy = 'ndex',
        sortOrder = 'asc',
        type = '',
        legendary = null,
        mythical = null,
        stage = ''
      } = options;

      // Build the query
      let query = 'SELECT * FROM pokemon_monsters WHERE 1=1';
      const params = [];

      // Add search condition
      if (search) {
        query += ' AND name LIKE $' + (params.length + 1);
        params.push(`%${search}%`);
      }

      // Add type filter
      if (type) {
        query += ' AND (type_primary = $' + (params.length + 1) + ' OR type_secondary = $' + (params.length + 2) + ')';
        params.push(type, type);
      }

      // Add legendary filter
      if (legendary !== null) {
        query += ' AND is_legendary = $' + (params.length + 1);
        params.push(legendary ? 1 : 0);
      }

      // Add mythical filter
      if (mythical !== null) {
        query += ' AND is_mythical = $' + (params.length + 1);
        params.push(mythical ? 1 : 0);
      }

      // Add stage filter
      if (stage) {
        query += ' AND stage = ?';
        params.push(stage);
      }

      // Count total records for pagination
      const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
      const countResult = await db.asyncGet(countQuery, params);
      const total = countResult ? countResult.total : 0;

      // Add sorting and pagination
      query += ` ORDER BY ${sortBy} ${sortOrder === 'desc' ? 'DESC' : 'ASC'}`;
      query += buildLimitOffset(limit, (page - 1) * limit, params);

      // Execute the query
      const data = await db.asyncAll(query, params);

      // Calculate total pages
      const totalPages = Math.ceil(total / limit);

      return {
        data,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages
      };
    } catch (error) {
      console.error('Error getting all Pokemon monsters:', error);
      throw error;
    }
  }

  /**
   * Get a Pokemon monster by ID
   * @param {number} id - Pokemon monster ID
   * @returns {Promise<Object>} Pokemon monster
   */
  static async getById(id) {
    try {
      const query = 'SELECT * FROM pokemon_monsters WHERE id = $1';
      return await db.asyncGet(query, [id]);
    } catch (error) {
      console.error(`Error getting Pokemon monster with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new Pokemon monster
   * @param {Object} pokemon - Pokemon monster data
   * @returns {Promise<Object>} Created Pokemon monster
   */
  static async create(pokemon) {
    try {
      const query = `
        INSERT INTO pokemon_monsters (
          name, ndex, type_primary, type_secondary, evolves_from, evolves_to,
          breeding_results, stage, is_legendary, is_mythical, image_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `;

      const params = [
        pokemon.name,
        pokemon.ndex,
        pokemon.type_primary,
        pokemon.type_secondary,
        pokemon.evolves_from,
        pokemon.evolves_to,
        pokemon.breeding_results,
        pokemon.stage,
        pokemon.is_legendary ? 1 : 0,
        pokemon.is_mythical ? 1 : 0,
        pokemon.image_url
      ];

      const result = await db.asyncRun(query, params);
      return { id: result.lastID, ...pokemon };
    } catch (error) {
      console.error('Error creating Pokemon monster:', error);
      throw error;
    }
  }

  /**
   * Update a Pokemon monster
   * @param {number} id - Pokemon monster ID
   * @param {Object} pokemon - Pokemon monster data
   * @returns {Promise<Object>} Updated Pokemon monster
   */
  static async update(id, pokemon) {
    try {
      const query = `
        UPDATE pokemon_monsters SET
          name = ?, ndex = ?, type_primary = ?, type_secondary = ?,
          evolves_from = ?, evolves_to = ?, breeding_results = ?,
          stage = ?, is_legendary = ?, is_mythical = ?, image_url = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $12
      `;

      const params = [
        pokemon.name,
        pokemon.ndex,
        pokemon.type_primary,
        pokemon.type_secondary,
        pokemon.evolves_from,
        pokemon.evolves_to,
        pokemon.breeding_results,
        pokemon.stage,
        pokemon.is_legendary ? 1 : 0,
        pokemon.is_mythical ? 1 : 0,
        pokemon.image_url,
        id
      ];

      await db.asyncRun(query, params);
      return { id, ...pokemon };
    } catch (error) {
      console.error(`Error updating Pokemon monster with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a Pokemon monster
   * @param {number} id - Pokemon monster ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    try {
      const query = 'DELETE FROM pokemon_monsters WHERE id = $1';
      await db.asyncRun(query, [id]);
      return true;
    } catch (error) {
      console.error(`Error deleting Pokemon monster with ID ${id}:`, error);
      throw error;
    }
  }
}

module.exports = PokemonMonster;
