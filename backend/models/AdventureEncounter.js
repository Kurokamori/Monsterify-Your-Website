const db = require('../config/db');

/**
 * AdventureEncounter model for managing adventure encounters
 */
class AdventureEncounter {
  /**
   * Create a new encounter
   * @param {Object} encounterData - Encounter data
   * @returns {Promise<Object>} Created encounter
   */
  static async create(encounterData) {
    try {
      const {
        adventure_id,
        encounter_type,
        encounter_data,
        created_by_discord_user_id
      } = encounterData;

      const params = [
        adventure_id,
        encounter_type,
        JSON.stringify(encounter_data),
        created_by_discord_user_id
      ];

      const query = `
        INSERT INTO adventure_encounters (adventure_id, encounter_type, encounter_data, created_by_discord_user_id)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `;
      const result = await db.asyncRun(query, params);
      const encounterId = result.rows[0].id;

      return this.getById(encounterId);

    } catch (error) {
      console.error('Error creating adventure encounter:', error);
      throw error;
    }
  }

  /**
   * Get encounter by ID
   * @param {number} id - Encounter ID
   * @returns {Promise<Object|null>} Encounter record or null
   */
  static async getById(id) {
    try {
      const query = `
        SELECT ae.*, a.title as adventure_title
        FROM adventure_encounters ae
        LEFT JOIN adventures a ON ae.adventure_id = a.id
        WHERE ae.id = $1
      `;
      
      const encounter = await db.asyncGet(query, [id]);
      
      if (encounter && encounter.encounter_data) {
        try {
          // Check if encounter_data is already an object or needs parsing
          if (typeof encounter.encounter_data === 'string') {
            encounter.encounter_data = JSON.parse(encounter.encounter_data);
          }
          // If it's already an object, leave it as is
        } catch (parseError) {
          console.error('Error parsing encounter data:', parseError);
          encounter.encounter_data = {};
        }
      }
      
      return encounter || null;

    } catch (error) {
      console.error('Error getting adventure encounter by ID:', error);
      throw error;
    }
  }

  /**
   * Get encounters by adventure ID
   * @param {number} adventureId - Adventure ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of encounters
   */
  static async getByAdventure(adventureId, options = {}) {
    try {
      const {
        encounterType = null,
        isResolved = null,
        limit = null
      } = options;

      let query = `
        SELECT ae.*, a.title as adventure_title
        FROM adventure_encounters ae
        LEFT JOIN adventures a ON ae.adventure_id = a.id
        WHERE ae.adventure_id = $1
      `;
      const params = [adventureId];

      if (encounterType) {
        query += ' AND ae.encounter_type = $2';
        params.push(encounterType);
      }

      if (isResolved !== null) {
        query += ` AND ae.is_resolved = $${params.length + 1}`;
        params.push(isResolved);
      }

      query += ' ORDER BY ae.created_at DESC';

      if (limit) {
        query += ` LIMIT $${params.length + 1}`;
        params.push(limit);
      }

      const encounters = await db.asyncAll(query, params);
      
      // Parse encounter_data for each encounter
      encounters.forEach(encounter => {
        if (encounter.encounter_data) {
          try {
            // Check if encounter_data is already an object or needs parsing
            if (typeof encounter.encounter_data === 'string') {
              encounter.encounter_data = JSON.parse(encounter.encounter_data);
            }
            // If it's already an object, leave it as is
          } catch (parseError) {
            console.error('Error parsing encounter data:', parseError);
            encounter.encounter_data = {};
          }
        }
      });

      return encounters;

    } catch (error) {
      console.error('Error getting adventure encounters by adventure:', error);
      throw error;
    }
  }

  /**
   * Get most recent unresolved encounter of a specific type
   * @param {number} adventureId - Adventure ID
   * @param {string} encounterType - Encounter type
   * @returns {Promise<Object|null>} Encounter record or null
   */
  static async getMostRecentUnresolved(adventureId, encounterType) {
    try {
      const query = `
        SELECT ae.*, a.title as adventure_title
        FROM adventure_encounters ae
        LEFT JOIN adventures a ON ae.adventure_id = a.id
        WHERE ae.adventure_id = $1 AND ae.encounter_type = $2 AND ae.is_resolved = FALSE
        ORDER BY ae.created_at DESC
        LIMIT 1
      `;
      
      const encounter = await db.asyncGet(query, [adventureId, encounterType]);
      
      if (encounter && encounter.encounter_data) {
        try {
          // Check if encounter_data is already an object or needs parsing
          if (typeof encounter.encounter_data === 'string') {
            encounter.encounter_data = JSON.parse(encounter.encounter_data);
          }
          // If it's already an object, leave it as is
        } catch (parseError) {
          console.error('Error parsing encounter data:', parseError);
          encounter.encounter_data = {};
        }
      }
      
      return encounter || null;

    } catch (error) {
      console.error('Error getting most recent unresolved encounter:', error);
      throw error;
    }
  }

  /**
   * Update encounter
   * @param {number} id - Encounter ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|null>} Updated encounter or null
   */
  static async update(id, updateData) {
    try {
      const allowedFields = ['encounter_data', 'is_resolved', 'resolved_at'];
      const updates = [];
      const params = [];

      Object.keys(updateData).forEach((key, index) => {
        if (allowedFields.includes(key)) {
          if (key === 'encounter_data') {
            updates.push(`${key} = $${index + 1}`);
            params.push(JSON.stringify(updateData[key]));
          } else {
            updates.push(`${key} = $${index + 1}`);
            params.push(updateData[key]);
          }
        }
      });

      if (updates.length === 0) {
        throw new Error('No valid fields to update');
      }

      params.push(id);

      const query = `
        UPDATE adventure_encounters 
        SET ${updates.join(', ')}
        WHERE id = $${params.length}
      `;

      await db.asyncRun(query, params);
      return this.getById(id);

    } catch (error) {
      console.error('Error updating adventure encounter:', error);
      throw error;
    }
  }

  /**
   * Mark encounter as resolved
   * @param {number} id - Encounter ID
   * @returns {Promise<Object|null>} Updated encounter or null
   */
  static async markResolved(id) {
    try {
      const query = `
        UPDATE adventure_encounters 
        SET is_resolved = TRUE, resolved_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `;

      await db.asyncRun(query, [id]);
      return this.getById(id);

    } catch (error) {
      console.error('Error marking encounter as resolved:', error);
      throw error;
    }
  }

  /**
   * Delete encounter
   * @param {number} id - Encounter ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    try {
      const query = 'DELETE FROM adventure_encounters WHERE id = $1';
      await db.asyncRun(query, [id]);
      return true;

    } catch (error) {
      console.error('Error deleting adventure encounter:', error);
      throw error;
    }
  }

  /**
   * Count encounters for an adventure
   * @param {number} adventureId - Adventure ID
   * @param {Object} options - Count options
   * @returns {Promise<number>} Encounter count
   */
  static async countByAdventure(adventureId, options = {}) {
    try {
      const {
        encounterType = null,
        isResolved = null
      } = options;

      let query = 'SELECT COUNT(*) as count FROM adventure_encounters WHERE adventure_id = $1';
      const params = [adventureId];

      if (encounterType) {
        query += ' AND encounter_type = $2';
        params.push(encounterType);
      }

      if (isResolved !== null) {
        query += ` AND is_resolved = $${params.length + 1}`;
        params.push(isResolved);
      }

      const result = await db.asyncGet(query, params);
      return result.count || 0;

    } catch (error) {
      console.error('Error counting adventure encounters:', error);
      throw error;
    }
  }
}

module.exports = AdventureEncounter;
