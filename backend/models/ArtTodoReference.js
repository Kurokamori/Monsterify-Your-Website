const db = require('../config/db');

class ArtTodoReference {
  constructor(data) {
    this.id = data.id;
    this.item_id = data.item_id;
    this.reference_type = data.reference_type;
    this.reference_id = data.reference_id;
    this.created_at = data.created_at;
  }

  /**
   * Get all references for a specific item
   * @param {number} itemId - Item ID
   * @param {number} userId - User ID (for ownership verification)
   * @returns {Promise<Object[]>}
   */
  static async getByItemId(itemId, userId) {
    const query = `
      SELECT r.*,
             CASE
               WHEN r.reference_type = 'trainer' THEN t.name
               WHEN r.reference_type = 'monster' THEN m.name
             END as reference_name,
             CASE
               WHEN r.reference_type = 'trainer' THEN t.main_ref
               WHEN r.reference_type = 'monster' THEN m.img_link
             END as reference_image
      FROM art_todo_references r
      JOIN art_todo_items i ON r.item_id = i.id
      JOIN art_todo_lists l ON i.list_id = l.id
      LEFT JOIN trainers t ON r.reference_type = 'trainer' AND r.reference_id = t.id
      LEFT JOIN monsters m ON r.reference_type = 'monster' AND r.reference_id = m.id
      WHERE r.item_id = $1 AND l.user_id = $2
      ORDER BY r.created_at ASC
    `;

    const rows = await db.asyncAll(query, [itemId, userId]);
    return rows.map(row => ({
      ...new ArtTodoReference(row),
      reference_name: row.reference_name,
      reference_image: row.reference_image
    }));
  }

  /**
   * Add a reference to an item
   * @param {Object} data - Reference data
   * @param {number} userId - User ID (for ownership verification)
   * @returns {Promise<ArtTodoReference>}
   */
  static async create(data, userId) {
    // Verify item ownership
    const itemQuery = `
      SELECT i.id FROM art_todo_items i
      JOIN art_todo_lists l ON i.list_id = l.id
      WHERE i.id = $1 AND l.user_id = $2
    `;
    const itemExists = await db.asyncGet(itemQuery, [data.item_id, userId]);

    if (!itemExists) {
      throw new Error('Item not found or access denied');
    }

    // Verify reference exists and belongs to user
    let referenceQuery;
    if (data.reference_type === 'trainer') {
      // For trainers, check if it belongs to the user (using discord_id from user)
      referenceQuery = `
        SELECT t.id FROM trainers t
        JOIN users u ON t.player_user_id = u.discord_id
        WHERE t.id = $1 AND u.id = $2
      `;
    } else if (data.reference_type === 'monster') {
      // For monsters, check if it belongs to the user (using discord_id from user)
      referenceQuery = `
        SELECT m.id FROM monsters m
        JOIN users u ON m.player_user_id = u.discord_id
        WHERE m.id = $1 AND u.id = $2
      `;
    } else {
      throw new Error('Invalid reference type');
    }

    const referenceExists = await db.asyncGet(referenceQuery, [data.reference_id, userId]);

    if (!referenceExists) {
      throw new Error('Reference not found or access denied');
    }

    // Check if reference already exists for this item
    const existingQuery = `
      SELECT id FROM art_todo_references
      WHERE item_id = $1 AND reference_type = $2 AND reference_id = $3
    `;
    const existing = await db.asyncGet(existingQuery, [
      data.item_id,
      data.reference_type,
      data.reference_id
    ]);

    if (existing) {
      throw new Error('Reference already exists for this item');
    }

    const query = `
      INSERT INTO art_todo_references (item_id, reference_type, reference_id)
      VALUES ($1, $2, $3)
      RETURNING id
    `;

    const result = await db.asyncRun(query, [
      data.item_id,
      data.reference_type,
      data.reference_id
    ]);

    const insertedId = db.isPostgreSQL ? result.rows[0].id : result.lastID;
    return await this.getById(insertedId, userId);
  }

  /**
   * Get a specific reference by ID
   * @param {number} id - Reference ID
   * @param {number} userId - User ID (for ownership verification)
   * @returns {Promise<Object|null>}
   */
  static async getById(id, userId) {
    const query = `
      SELECT r.*,
             CASE
               WHEN r.reference_type = 'trainer' THEN t.name
               WHEN r.reference_type = 'monster' THEN m.name
             END as reference_name,
             CASE
               WHEN r.reference_type = 'trainer' THEN t.main_ref
               WHEN r.reference_type = 'monster' THEN m.img_link
             END as reference_image
      FROM art_todo_references r
      JOIN art_todo_items i ON r.item_id = i.id
      JOIN art_todo_lists l ON i.list_id = l.id
      LEFT JOIN trainers t ON r.reference_type = 'trainer' AND r.reference_id = t.id
      LEFT JOIN monsters m ON r.reference_type = 'monster' AND r.reference_id = m.id
      WHERE r.id = $1 AND l.user_id = $2
    `;

    const row = await db.asyncGet(query, [id, userId]);
    return row ? {
      ...new ArtTodoReference(row),
      reference_name: row.reference_name,
      reference_image: row.reference_image
    } : null;
  }

  /**
   * Delete a reference
   * @param {number} id - Reference ID
   * @param {number} userId - User ID (for ownership verification)
   * @returns {Promise<boolean>}
   */
  static async delete(id, userId) {
    const query = `
      DELETE FROM art_todo_references
      WHERE id = $1 AND id IN (
        SELECT r.id FROM art_todo_references r
        JOIN art_todo_items i ON r.item_id = i.id
        JOIN art_todo_lists l ON i.list_id = l.id
        WHERE l.user_id = $2
      )
    `;

    const result = await db.asyncRun(query, [id, userId]);
    const changes = db.isPostgreSQL ? result.rowCount : result.changes;
    return changes > 0;
  }

  /**
   * Get reference matrix for an item (organized by type)
   * @param {number} itemId - Item ID
   * @param {number} userId - User ID (for ownership verification)
   * @returns {Promise<Object>}
   */
  static async getReferenceMatrix(itemId, userId) {
    const references = await this.getByItemId(itemId, userId);

    const matrix = {
      trainers: references.filter(ref => ref.reference_type === 'trainer'),
      monsters: references.filter(ref => ref.reference_type === 'monster')
    };

    return matrix;
  }

  /**
   * Bulk add references to an item
   * @param {number} itemId - Item ID
   * @param {Array} references - Array of {reference_type, reference_id}
   * @param {number} userId - User ID (for ownership verification)
   * @returns {Promise<Object[]>}
   */
  static async bulkCreate(itemId, references, userId) {
    const results = [];

    for (const ref of references) {
      try {
        const result = await this.create({
          item_id: itemId,
          reference_type: ref.reference_type,
          reference_id: ref.reference_id
        }, userId);
        results.push(result);
      } catch (error) {
        // Skip duplicates or invalid references
        console.warn(`Failed to add reference: ${error.message}`);
      }
    }

    return results;
  }
}

module.exports = ArtTodoReference;
