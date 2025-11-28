const db = require('../config/db');

class FactionPerson {
  /**
   * Get all people for a faction
   * @param {number} factionId - Faction ID
   * @returns {Promise<Array>} Array of faction people
   */
  static async getFactionPeople(factionId) {
    try {
      const query = `
        SELECT * FROM faction_people
        WHERE faction_id = $1
        ORDER BY standing_requirement ASC, name ASC
      `;
      return await db.asyncAll(query, [factionId]);
    } catch (error) {
      console.error('Error getting faction people:', error);
      throw error;
    }
  }

  /**
   * Get person by ID
   * @param {number} id - Person ID
   * @returns {Promise<Object|null>} Person object or null if not found
   */
  static async getById(id) {
    try {
      const query = 'SELECT * FROM faction_people WHERE id = $1';
      return await db.asyncGet(query, [id]);
    } catch (error) {
      console.error('Error getting person by ID:', error);
      throw error;
    }
  }

  /**
   * Get person's monster team
   * @param {number} personId - Person ID
   * @returns {Promise<Array>} Array of monster team members
   */
  static async getPersonTeam(personId) {
    try {
      const query = `
        SELECT * FROM faction_person_monsters
        WHERE person_id = $1
        ORDER BY position ASC
      `;
      return await db.asyncAll(query, [personId]);
    } catch (error) {
      console.error('Error getting person team:', error);
      throw error;
    }
  }

  /**
   * Create a new faction person
   * @param {Object} personData - Person data
   * @returns {Promise<Object>} Created person
   */
  static async create(personData) {
    try {
      const {
        faction_id,
        name,
        alias,
        standing_requirement,
        blurb,
        short_bio,
        long_bio,
        role,
        available_assistance,
        images,
        standing_reward
      } = personData;
      
      const query = `
        INSERT INTO faction_people (
          faction_id, name, alias, standing_requirement, blurb,
          short_bio, long_bio, role, available_assistance, images, standing_reward
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `;
      
      const result = await db.asyncRun(query, [
        faction_id, name, alias, standing_requirement, blurb,
        short_bio, long_bio, role, available_assistance,
        JSON.stringify(images), standing_reward
      ]);
      
      return await this.getById(result.lastID);
    } catch (error) {
      console.error('Error creating faction person:', error);
      throw error;
    }
  }

  /**
   * Update faction person
   * @param {number} id - Person ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated person
   */
  static async update(id, updateData) {
    try {
      const fields = Object.keys(updateData);
      const values = Object.values(updateData);
      
      // Handle JSON fields
      if (updateData.images && typeof updateData.images === 'object') {
        const index = fields.indexOf('images');
        values[index] = JSON.stringify(updateData.images);
      }
      
      const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
      
      const query = `UPDATE faction_people SET ${setClause} WHERE id = $${fields.length + 1}`;
      await db.asyncRun(query, [...values, id]);
      
      return await this.getById(id);
    } catch (error) {
      console.error('Error updating faction person:', error);
      throw error;
    }
  }

  /**
   * Add monster to person's team
   * @param {Object} monsterData - Monster data
   * @returns {Promise<Object>} Created monster
   */
  static async addMonsterToTeam(monsterData) {
    try {
      const {
        person_id,
        name,
        species,
        types,
        attribute,
        image,
        position
      } = monsterData;
      
      const query = `
        INSERT INTO faction_person_monsters (
          person_id, name, species, types, attribute, image, position
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;
      
      const result = await db.asyncRun(query, [
        person_id, name,
        JSON.stringify(species),
        JSON.stringify(types),
        attribute, image, position
      ]);
      
      return { id: result.lastID, ...monsterData };
    } catch (error) {
      console.error('Error adding monster to team:', error);
      throw error;
    }
  }

  /**
   * Delete faction person
   * @param {number} id - Person ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    try {
      // Delete associated monsters first
      await db.asyncRun('DELETE FROM faction_person_monsters WHERE person_id = $1', [id]);
      
      // Delete the person
      const query = 'DELETE FROM faction_people WHERE id = $1';
      const result = await db.asyncRun(query, [id]);
      return result.changes > 0;
    } catch (error) {
      console.error('Error deleting faction person:', error);
      throw error;
    }
  }
}

module.exports = FactionPerson;