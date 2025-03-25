const pool = require('../db');

class Pokemon {
  /**
   * Get all Pokemon
   * @returns {Promise<Array>} - Array of Pokemon
   */
  static async getAll() {
    try {
      const query = 'SELECT * FROM pokemon ORDER BY "SpeciesName"';
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error getting all Pokemon:', error);
      return [];
    }
  }

  /**
   * Get Pokemon by name
   * @param {string} name - Pokemon name
   * @returns {Promise<Object>} - Pokemon object
   */
  static async getByName(name) {
    try {
      const query = 'SELECT * FROM pokemon WHERE "SpeciesName" = $1';
      const result = await pool.query(query, [name]);
      return result.rows[0];
    } catch (error) {
      console.error('Error getting Pokemon by name:', error);
      return null;
    }
  }

  /**
   * Get Pokemon filtered by various criteria
   * @param {Object} filters - Filter criteria
   * @param {string|Array} [filters.rarity] - Rarity filter (Common, Legendary, Mythical)
   * @param {string|Array} [filters.region] - Region filter
   * @param {string|Array} [filters.includeType] - Type to include (matches Type1 or Type2)
   * @param {string|Array} [filters.excludeType] - Type to exclude (matches Type1 or Type2)
   * @param {string|Array} [filters.stage] - Stage filter (Base Stage, Middle Stage, Final Stage, Doesn't Evolve)
   * @returns {Promise<Array>} - Array of filtered Pokemon
   */
  static async getFiltered(filters = {}) {
    try {
      let query = 'SELECT * FROM pokemon WHERE 1=1';
      const values = [];
      let paramIndex = 1;

      // Process rarity filter
      if (filters.rarity) {
        if (Array.isArray(filters.rarity)) {
          const placeholders = filters.rarity.map((_, i) => `$${paramIndex + i}`).join(', ');
          query += ` AND "Rarity" IN (${placeholders})`;
          values.push(...filters.rarity);
          paramIndex += filters.rarity.length;
        } else {
          query += ` AND "Rarity" = $${paramIndex}`;
          values.push(filters.rarity);
          paramIndex++;
        }
      }

      // Process region filter
      if (filters.region) {
        if (Array.isArray(filters.region)) {
          const placeholders = filters.region.map((_, i) => `$${paramIndex + i}`).join(', ');
          query += ` AND region IN (${placeholders})`;
          values.push(...filters.region);
          paramIndex += filters.region.length;
        } else {
          query += ` AND region = $${paramIndex}`;
          values.push(filters.region);
          paramIndex++;
        }
      }

      // Process include type filter
      if (filters.includeType) {
        if (Array.isArray(filters.includeType)) {
          const typeConditions = filters.includeType.map((_, i) => 
            `("Type1" = $${paramIndex + i} OR "Type2" = $${paramIndex + i})`
          ).join(' OR ');
          query += ` AND (${typeConditions})`;
          // Add each type twice (once for Type1, once for Type2)
          filters.includeType.forEach(type => {
            values.push(type);
            paramIndex++;
          });
        } else {
          query += ` AND ("Type1" = $${paramIndex} OR "Type2" = $${paramIndex})`;
          values.push(filters.includeType);
          paramIndex++;
        }
      }

      // Process exclude type filter
      if (filters.excludeType) {
        if (Array.isArray(filters.excludeType)) {
          const typeConditions = filters.excludeType.map((_, i) => 
            `("Type1" != $${paramIndex + i} AND "Type2" != $${paramIndex + i})`
          ).join(' AND ');
          query += ` AND (${typeConditions})`;
          // Add each type twice (once for Type1, once for Type2)
          filters.excludeType.forEach(type => {
            values.push(type);
            paramIndex++;
          });
        } else {
          query += ` AND ("Type1" != $${paramIndex} AND "Type2" != $${paramIndex})`;
          values.push(filters.excludeType);
          paramIndex++;
        }
      }

      // Process stage filter
      if (filters.stage) {
        if (Array.isArray(filters.stage)) {
          const placeholders = filters.stage.map((_, i) => `$${paramIndex + i}`).join(', ');
          query += ` AND "Stage" IN (${placeholders})`;
          values.push(...filters.stage);
          paramIndex += filters.stage.length;
        } else {
          query += ` AND "Stage" = $${paramIndex}`;
          values.push(filters.stage);
          paramIndex++;
        }
      }

      query += ' ORDER BY "SpeciesName"';
      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      console.error('Error getting filtered Pokemon:', error);
      return [];
    }
  }

  /**
   * Get random Pokemon based on filters
   * @param {Object} filters - Filter criteria
   * @param {number} [count=1] - Number of random Pokemon to return
   * @returns {Promise<Array>} - Array of random Pokemon
   */
  static async getRandom(filters = {}, count = 1) {
    try {
      const filteredPokemon = await this.getFiltered(filters);
      
      if (filteredPokemon.length === 0) {
        return [];
      }

      // Shuffle and take the requested number
      const shuffled = [...filteredPokemon].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, Math.min(count, shuffled.length));
    } catch (error) {
      console.error('Error getting random Pokemon:', error);
      return [];
    }
  }
}

module.exports = Pokemon;
