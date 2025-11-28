const db = require('../config/db');
const { isPostgreSQL } = require('../utils/dbUtils');

class MonsterLineage {
  /**
   * Create a new lineage relationship
   * @param {Object} lineageData Lineage data
   * @returns {Promise<Object>} Created lineage relationship
   */
  static async create(lineageData) {
    try {
      // Ensure required fields are present
      if (!lineageData.monster_id || !lineageData.parent_id || !lineageData.relationship_type) {
        throw new Error('monster_id, parent_id, and relationship_type are required fields');
      }

      // Validate relationship type
      const validRelationshipTypes = ['parent', 'sibling', 'child'];
      if (!validRelationshipTypes.includes(lineageData.relationship_type)) {
        throw new Error('relationship_type must be parent, sibling, or child');
      }

      const data = {
        monster_id: lineageData.monster_id,
        parent_id: lineageData.parent_id,
        relationship_type: lineageData.relationship_type,
        created_by: lineageData.created_by || null,
        is_automatic: lineageData.is_automatic || false,
        notes: lineageData.notes || null
      };

      let query, result, lineageId;

      if (isPostgreSQL) {
        query = `
          INSERT INTO monster_lineage (monster_id, parent_id, relationship_type, created_by, is_automatic, notes)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id
        `;
        result = await db.asyncRun(query, [
          data.monster_id,
          data.parent_id,
          data.relationship_type,
          data.created_by,
          data.is_automatic,
          data.notes
        ]);
        lineageId = result.rows[0].id;
      } else {
        query = `
          INSERT INTO monster_lineage (monster_id, parent_id, relationship_type, created_by, is_automatic, notes)
          VALUES ($1, $2, $3, $4, $5, $6)
        `;
        result = await db.asyncRun(query, [
          data.monster_id,
          data.parent_id,
          data.relationship_type,
          data.created_by,
          data.is_automatic,
          data.notes
        ]);
        lineageId = result.lastID;
      }

      return await this.getById(lineageId);
    } catch (error) {
      console.error('Error creating lineage relationship:', error);
      throw error;
    }
  }

  /**
   * Get lineage relationship by ID
   * @param {number} id Lineage ID
   * @returns {Promise<Object>} Lineage relationship
   */
  static async getById(id) {
    try {
      const query = `
        SELECT 
          ml.*,
          m1.name as monster_name,
          m1.species1 as monster_species,
          m2.name as related_monster_name,
          m2.species1 as related_monster_species
        FROM monster_lineage ml
        JOIN monsters m1 ON ml.monster_id = m1.id
        JOIN monsters m2 ON ml.parent_id = m2.id
        WHERE ml.id = $1
      `;
      return await db.asyncGet(query, [id]);
    } catch (error) {
      console.error(`Error getting lineage relationship with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get all lineage relationships for a monster
   * @param {number} monsterId Monster ID
   * @returns {Promise<Array>} Array of lineage relationships
   */
  static async getByMonsterId(monsterId) {
    try {
      const query = `
        SELECT 
          ml.*,
          m.name as related_monster_name,
          m.species1 as related_monster_species,
          m.level as related_monster_level,
          u.username as created_by_username
        FROM monster_lineage ml
        JOIN monsters m ON ml.parent_id = m.id
        LEFT JOIN users u ON ml.created_by = u.id
        WHERE ml.monster_id = $1
        ORDER BY ml.relationship_type, ml.created_at
      `;
      return await db.asyncAll(query, [monsterId]);
    } catch (error) {
      console.error(`Error getting lineage for monster ${monsterId}:`, error);
      throw error;
    }
  }

  /**
   * Get parents of a monster
   * @param {number} monsterId Monster ID
   * @returns {Promise<Array>} Array of parent monsters
   */
  static async getParents(monsterId) {
    try {
      const query = `
        SELECT 
          m.*,
          ml.notes,
          ml.is_automatic,
          ml.created_at as relationship_created
        FROM monster_lineage ml
        JOIN monsters m ON ml.parent_id = m.id
        WHERE ml.monster_id = $1 AND ml.relationship_type = 'parent'
        ORDER BY ml.created_at
      `;
      return await db.asyncAll(query, [monsterId]);
    } catch (error) {
      console.error(`Error getting parents for monster ${monsterId}:`, error);
      throw error;
    }
  }

  /**
   * Get children of a monster
   * @param {number} monsterId Monster ID
   * @returns {Promise<Array>} Array of child monsters
   */
  static async getChildren(monsterId) {
    try {
      const query = `
        SELECT 
          m.*,
          ml.notes,
          ml.is_automatic,
          ml.created_at as relationship_created
        FROM monster_lineage ml
        JOIN monsters m ON ml.parent_id = m.id
        WHERE ml.monster_id = $1 AND ml.relationship_type = 'child'
        ORDER BY ml.created_at
      `;
      return await db.asyncAll(query, [monsterId]);
    } catch (error) {
      console.error(`Error getting children for monster ${monsterId}:`, error);
      throw error;
    }
  }

  /**
   * Get siblings of a monster
   * @param {number} monsterId Monster ID
   * @returns {Promise<Array>} Array of sibling monsters
   */
  static async getSiblings(monsterId) {
    try {
      const query = `
        SELECT 
          m.*,
          ml.notes,
          ml.is_automatic,
          ml.created_at as relationship_created
        FROM monster_lineage ml
        JOIN monsters m ON ml.parent_id = m.id
        WHERE ml.monster_id = $1 AND ml.relationship_type = 'sibling'
        ORDER BY ml.created_at
      `;
      return await db.asyncAll(query, [monsterId]);
    } catch (error) {
      console.error(`Error getting siblings for monster ${monsterId}:`, error);
      throw error;
    }
  }

  /**
   * Get grandchildren of a monster (children's children)
   * @param {number} monsterId Monster ID
   * @returns {Promise<Array>} Array of grandchild monsters
   */
  static async getGrandchildren(monsterId) {
    try {
      const query = `
        SELECT DISTINCT
          m3.*,
          ml2.notes,
          ml2.is_automatic,
          ml2.created_at as relationship_created
        FROM monster_lineage ml1
        JOIN monster_lineage ml2 ON ml1.parent_id = ml2.monster_id
        JOIN monsters m3 ON ml2.parent_id = m3.id
        WHERE ml1.monster_id = $1 
          AND ml1.relationship_type = 'child' 
          AND ml2.relationship_type = 'child'
        ORDER BY ml2.created_at
      `;
      return await db.asyncAll(query, [monsterId]);
    } catch (error) {
      console.error(`Error getting grandchildren for monster ${monsterId}:`, error);
      throw error;
    }
  }

  /**
   * Get complete lineage tree for a monster
   * @param {number} monsterId Monster ID
   * @returns {Promise<Object>} Complete lineage tree
   */
  static async getCompleteLineage(monsterId) {
    try {
      const [parents, children, siblings, grandchildren] = await Promise.all([
        this.getParents(monsterId),
        this.getChildren(monsterId),
        this.getSiblings(monsterId),
        this.getGrandchildren(monsterId)
      ]);

      return {
        monster_id: monsterId,
        parents: parents,
        siblings: siblings,
        children: children,
        grandchildren: grandchildren
      };
    } catch (error) {
      console.error(`Error getting complete lineage for monster ${monsterId}:`, error);
      throw error;
    }
  }

  /**
   * Add automatic breeding lineage when monsters breed
   * @param {number} parent1Id First parent monster ID
   * @param {number} parent2Id Second parent monster ID
   * @param {Array} offspringIds Array of offspring monster IDs
   * @returns {Promise<Array>} Array of created lineage relationships
   */
  static async addBreedingLineage(parent1Id, parent2Id, offspringIds) {
    try {
      const createdRelationships = [];

      // Create parent-child relationships for each offspring
      for (const offspringId of offspringIds) {
        // Record that parent1 is a parent of offspring
        const parent1Relationship = await this.create({
          monster_id: offspringId,
          parent_id: parent1Id,
          relationship_type: 'parent',
          is_automatic: true,
          notes: 'Automatically created from breeding'
        });
        createdRelationships.push(parent1Relationship);

        // Record that parent2 is a parent of offspring  
        const parent2Relationship = await this.create({
          monster_id: offspringId,
          parent_id: parent2Id,
          relationship_type: 'parent',
          is_automatic: true,
          notes: 'Automatically created from breeding'
        });
        createdRelationships.push(parent2Relationship);

        // Record that offspring is a child of parent1
        const child1Relationship = await this.create({
          monster_id: parent1Id,
          parent_id: offspringId,
          relationship_type: 'child',
          is_automatic: true,
          notes: 'Automatically created from breeding'
        });
        createdRelationships.push(child1Relationship);

        // Record that offspring is a child of parent2
        const child2Relationship = await this.create({
          monster_id: parent2Id,
          parent_id: offspringId,
          relationship_type: 'child',
          is_automatic: true,
          notes: 'Automatically created from breeding'
        });
        createdRelationships.push(child2Relationship);
      }

      // Create sibling relationships between offspring (if multiple)
      if (offspringIds.length > 1) {
        for (let i = 0; i < offspringIds.length; i++) {
          for (let j = i + 1; j < offspringIds.length; j++) {
            // Sibling relationship (bidirectional)
            const siblingRelationship1 = await this.create({
              monster_id: offspringIds[i],
              parent_id: offspringIds[j],
              relationship_type: 'sibling',
              is_automatic: true,
              notes: 'Automatically created from breeding - same clutch'
            });
            createdRelationships.push(siblingRelationship1);

            const siblingRelationship2 = await this.create({
              monster_id: offspringIds[j],
              parent_id: offspringIds[i],
              relationship_type: 'sibling',
              is_automatic: true,
              notes: 'Automatically created from breeding - same clutch'
            });
            createdRelationships.push(siblingRelationship2);
          }
        }
      }

      return createdRelationships;
    } catch (error) {
      console.error('Error adding breeding lineage:', error);
      throw error;
    }
  }

  /**
   * Add manual lineage relationship
   * @param {number} monsterId Monster ID
   * @param {number} relatedMonsterId Related monster ID
   * @param {string} relationshipType Type of relationship
   * @param {number} userId User ID who is creating the relationship
   * @param {string} notes Optional notes
   * @returns {Promise<Array>} Array of created relationships (bidirectional)
   */
  static async addManualRelationship(monsterId, relatedMonsterId, relationshipType, userId, notes = null) {
    try {
      const createdRelationships = [];

      // Determine the reverse relationship type
      let reverseRelationshipType;
      switch (relationshipType) {
        case 'parent':
          reverseRelationshipType = 'child';
          break;
        case 'child':
          reverseRelationshipType = 'parent';
          break;
        case 'sibling':
          reverseRelationshipType = 'sibling';
          break;
        default:
          throw new Error('Invalid relationship type');
      }

      // Create the primary relationship
      const primaryRelationship = await this.create({
        monster_id: monsterId,
        parent_id: relatedMonsterId,
        relationship_type: relationshipType,
        created_by: userId,
        is_automatic: false,
        notes: notes
      });
      createdRelationships.push(primaryRelationship);

      // Create the reverse relationship
      const reverseRelationship = await this.create({
        monster_id: relatedMonsterId,
        parent_id: monsterId,
        relationship_type: reverseRelationshipType,
        created_by: userId,
        is_automatic: false,
        notes: notes
      });
      createdRelationships.push(reverseRelationship);

      return createdRelationships;
    } catch (error) {
      console.error('Error adding manual relationship:', error);
      throw error;
    }
  }

  /**
   * Remove a lineage relationship (and its reverse)
   * @param {number} monsterId Monster ID
   * @param {number} relatedMonsterId Related monster ID
   * @param {string} relationshipType Type of relationship
   * @returns {Promise<boolean>} Success status
   */
  static async removeRelationship(monsterId, relatedMonsterId, relationshipType) {
    try {
      // Determine the reverse relationship type
      let reverseRelationshipType;
      switch (relationshipType) {
        case 'parent':
          reverseRelationshipType = 'child';
          break;
        case 'child':
          reverseRelationshipType = 'parent';
          break;
        case 'sibling':
          reverseRelationshipType = 'sibling';
          break;
        default:
          throw new Error('Invalid relationship type');
      }

      // Remove the primary relationship
      await db.asyncRun(`
        DELETE FROM monster_lineage 
        WHERE monster_id = $1 AND parent_id = $2 AND relationship_type = $3
      `, [monsterId, relatedMonsterId, relationshipType]);

      // Remove the reverse relationship
      await db.asyncRun(`
        DELETE FROM monster_lineage 
        WHERE monster_id = $1 AND parent_id = $2 AND relationship_type = $3
      `, [relatedMonsterId, monsterId, reverseRelationshipType]);

      return true;
    } catch (error) {
      console.error('Error removing lineage relationship:', error);
      throw error;
    }
  }

  /**
   * Check if a lineage relationship already exists
   * @param {number} monsterId Monster ID
   * @param {number} relatedMonsterId Related monster ID
   * @param {string} relationshipType Type of relationship
   * @returns {Promise<boolean>} True if relationship exists
   */
  static async relationshipExists(monsterId, relatedMonsterId, relationshipType) {
    try {
      const query = `
        SELECT id FROM monster_lineage 
        WHERE monster_id = $1 AND parent_id = $2 AND relationship_type = $3
      `;
      const relationship = await db.asyncGet(query, [monsterId, relatedMonsterId, relationshipType]);
      return !!relationship;
    } catch (error) {
      console.error('Error checking if relationship exists:', error);
      throw error;
    }
  }

  /**
   * Delete all lineage relationships for a monster
   * @param {number} monsterId Monster ID
   * @returns {Promise<boolean>} Success status
   */
  static async deleteAllForMonster(monsterId) {
    try {
      // Delete relationships where this monster is the primary monster
      await db.asyncRun('DELETE FROM monster_lineage WHERE monster_id = $1', [monsterId]);
      
      // Delete relationships where this monster is the related monster
      await db.asyncRun('DELETE FROM monster_lineage WHERE parent_id = $1', [monsterId]);

      return true;
    } catch (error) {
      console.error(`Error deleting lineage relationships for monster ${monsterId}:`, error);
      throw error;
    }
  }
}

module.exports = MonsterLineage;