const pool = require('../db');

class Digimon {
  /**
   * Get all Digimon
   * @returns {Promise<Array>} - Array of Digimon
   */
  static async getAll() {
    try {
      const query = 'SELECT * FROM digimon ORDER BY name';
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error getting all Digimon:', error);
      return [];
    }
  }

  /**
   * Create a new Digimon
   * @param {Object} digimon - Digimon data
   * @returns {Promise<Object>} - Created Digimon
   */
  static async create(digimon) {
    try {
      const query = `
        INSERT INTO digimon (
          id, name, "xAntibody", "Stage", types, attributes, fields,
          "priorEvolutions", "nextEvolutions"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      const values = [
        digimon.id,
        digimon.name,
        digimon.xAntibody,
        digimon.Stage,
        digimon.types,
        digimon.attributes,
        digimon.fields,
        digimon.priorEvolutions,
        digimon.nextEvolutions
      ];

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating Digimon:', error);
      throw error;
    }
  }

  /**
   * Update an existing Digimon
   * @param {Object} digimon - Digimon data
   * @returns {Promise<Object>} - Updated Digimon
   */
  static async update(digimon) {
    try {
      const query = `
        UPDATE digimon SET
          id = $1,
          "xAntibody" = $3,
          "Stage" = $4,
          types = $5,
          attributes = $6,
          fields = $7,
          "priorEvolutions" = $8,
          "nextEvolutions" = $9
        WHERE name = $2
        RETURNING *
      `;

      const values = [
        digimon.id,
        digimon.name,
        digimon.xAntibody,
        digimon.Stage,
        digimon.types,
        digimon.attributes,
        digimon.fields,
        digimon.priorEvolutions,
        digimon.nextEvolutions
      ];

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating Digimon:', error);
      throw error;
    }
  }

  /**
   * Delete a Digimon
   * @param {string} name - Digimon name
   * @returns {Promise<boolean>} - Success status
   */
  static async delete(name) {
    try {
      const query = 'DELETE FROM digimon WHERE name = $1';
      const result = await pool.query(query, [name]);
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting Digimon:', error);
      throw error;
    }
  }

  /**
   * Get Digimon by name
   * @param {string} name - Digimon name
   * @returns {Promise<Object>} - Digimon object
   */
  static async getByName(name) {
    try {
      const query = 'SELECT * FROM digimon WHERE name = $1';
      const result = await pool.query(query, [name]);
      return result.rows[0];
    } catch (error) {
      console.error('Error getting Digimon by name:', error);
      return null;
    }
  }

  /**
   * Get Digimon filtered by various criteria
   * @param {Object} filters - Filter criteria
   * @param {string|Array} [filters.stage] - Stage filter
   * @param {string|Array} [filters.attribute] - Attribute filter
   * @param {string|Array} [filters.kind] - Kind/Type filter
   * @returns {Promise<Array>} - Array of filtered Digimon
   */
  static async getFiltered(filters = {}) {
    try {
      let query = 'SELECT * FROM digimon WHERE 1=1';
      const values = [];
      let paramIndex = 1;

      // Process stage filter
      if (filters.stage) {
        if (Array.isArray(filters.stage)) {
          // For array of stages, check if any of them are in the "Stage" field
          const stagePlaceholders = filters.stage.map((_, i) => `$${paramIndex + i}`).join(', ');
          query += ` AND "Stage" IN (${stagePlaceholders})`;
          values.push(...filters.stage);
          paramIndex += filters.stage.length;
        } else {
          query += ` AND "Stage" = $${paramIndex}`;
          values.push(filters.stage);
          paramIndex++;
        }
      }

      // Process attribute filter
      if (filters.attribute) {
        if (Array.isArray(filters.attribute)) {
          // For array of attributes, check if any of them are in the attributes field
          const attributeConditions = filters.attribute.map((_, i) =>
            `attributes LIKE $${paramIndex + i}`
          ).join(' OR ');
          query += ` AND (${attributeConditions})`;
          filters.attribute.forEach(attr => {
            values.push(`%${attr}%`);
            paramIndex++;
          });
        } else {
          query += ` AND attributes LIKE $${paramIndex}`;
          values.push(`%${filters.attribute}%`);
          paramIndex++;
        }
      }

      // Process kind/type filter
      if (filters.kind) {
        if (Array.isArray(filters.kind)) {
          // For array of kinds, check if any of them are in the types field
          const kindConditions = filters.kind.map((_, i) =>
            `types LIKE $${paramIndex + i}`
          ).join(' OR ');
          query += ` AND (${kindConditions})`;
          filters.kind.forEach(kind => {
            values.push(`%${kind}%`);
            paramIndex++;
          });
        } else {
          query += ` AND types LIKE $${paramIndex}`;
          values.push(`%${filters.kind}%`);
          paramIndex++;
        }
      }

      query += ' ORDER BY name';
      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      console.error('Error getting filtered Digimon:', error);
      return [];
    }
  }

  /**
   * Get random Digimon based on filters
   * @param {Object} filters - Filter criteria
   * @param {number} [count=1] - Number of random Digimon to return
   * @returns {Promise<Array>} - Array of random Digimon
   */
  static async getRandom(filters = {}, count = 1) {
    try {
      const filteredDigimon = await this.getFiltered(filters);

      if (filteredDigimon.length === 0) {
        return [];
      }

      // Shuffle and take the requested number
      const shuffled = [...filteredDigimon].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, Math.min(count, shuffled.length));
    } catch (error) {
      console.error('Error getting random Digimon:', error);
      return [];
    }
  }
}

module.exports = Digimon;
