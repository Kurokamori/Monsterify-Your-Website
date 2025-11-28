const db = require('../config/db');

class ArtTodoItem {
  constructor(data) {
    this.id = data.id;
    this.list_id = data.list_id;
    this.title = data.title;
    this.description = data.description;
    this.status = data.status;
    this.priority = data.priority;
    this.due_date = data.due_date;
    this.is_persistent = data.is_persistent;
    this.steps_total = data.steps_total;
    this.steps_completed = data.steps_completed;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  /**
   * Get all items for a specific list
   * @param {number} listId - List ID
   * @param {number} userId - User ID (for ownership verification)
   * @returns {Promise<ArtTodoItem[]>}
   */
  static async getByListId(listId, userId) {
    const query = `
      SELECT i.* FROM art_todo_items i
      JOIN art_todo_lists l ON i.list_id = l.id
      WHERE i.list_id = $1 AND l.user_id = $2
      ORDER BY 
        CASE i.status 
          WHEN 'pending' THEN 1 
          WHEN 'in_progress' THEN 2 
          WHEN 'completed' THEN 3 
        END,
        CASE i.priority 
          WHEN 'high' THEN 1 
          WHEN 'medium' THEN 2 
          WHEN 'low' THEN 3 
        END,
        i.created_at DESC
    `;
    
    const rows = await db.asyncAll(query, [listId, userId]);
    return rows.map(row => new ArtTodoItem(row));
  }

  /**
   * Get a specific item by ID
   * @param {number} id - Item ID
   * @param {number} userId - User ID (for ownership verification)
   * @returns {Promise<ArtTodoItem|null>}
   */
  static async getById(id, userId) {
    const query = `
      SELECT i.* FROM art_todo_items i
      JOIN art_todo_lists l ON i.list_id = l.id
      WHERE i.id = $1 AND l.user_id = $2
    `;
    
    const row = await db.asyncGet(query, [id, userId]);
    return row ? new ArtTodoItem(row) : null;
  }

  /**
   * Create a new art todo item
   * @param {Object} data - Item data
   * @param {number} userId - User ID (for ownership verification)
   * @returns {Promise<ArtTodoItem>}
   */
  static async create(data, userId) {
    // Verify list ownership
    const listQuery = `SELECT id FROM art_todo_lists WHERE id = $1 AND user_id = $2`;
    const listExists = await db.asyncGet(listQuery, [data.list_id, userId]);
    
    if (!listExists) {
      throw new Error('List not found or access denied');
    }

    const query = `
      INSERT INTO art_todo_items (
        list_id, title, description, status, priority, 
        due_date, is_persistent, steps_total, steps_completed
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `;
    
    const result = await db.asyncRun(query, [
      data.list_id,
      data.title,
      data.description || null,
      data.status || 'pending',
      data.priority || 'medium',
      data.due_date || null,
      data.is_persistent || 0,
      data.steps_total || 0,
      data.steps_completed || 0
    ]);
    
    const insertedId = db.isPostgreSQL ? result.rows[0].id : result.lastID;
    return await this.getById(insertedId, userId);
  }

  /**
   * Update an art todo item
   * @param {number} id - Item ID
   * @param {number} userId - User ID (for ownership verification)
   * @param {Object} data - Updated data
   * @returns {Promise<ArtTodoItem|null>}
   */
  static async update(id, userId, data) {
    const query = `
      UPDATE art_todo_items 
      SET title = $1, description = $2, status = $3, priority = $4, 
          due_date = $5, is_persistent = $6, steps_total = $7, 
          steps_completed = $8, updated_at = CURRENT_TIMESTAMP
      WHERE id = $9 AND id IN (
        SELECT i.id FROM art_todo_items i
        JOIN art_todo_lists l ON i.list_id = l.id
        WHERE l.user_id = $10
      )
    `;
    
    const result = await db.asyncRun(query, [
      data.title,
      data.description || null,
      data.status,
      data.priority,
      data.due_date || null,
      data.is_persistent || 0,
      data.steps_total || 0,
      data.steps_completed || 0,
      id,
      userId
    ]);
    
    const changes = db.isPostgreSQL ? result.rowCount : result.changes;
    if (changes === 0) {
      return null;
    }
    
    return await this.getById(id, userId);
  }

  /**
   * Move item to different list
   * @param {number} id - Item ID
   * @param {number} newListId - New list ID
   * @param {number} userId - User ID (for ownership verification)
   * @returns {Promise<ArtTodoItem|null>}
   */
  static async moveToList(id, newListId, userId) {
    // Verify both lists belong to user
    const listsQuery = `
      SELECT COUNT(*) as count FROM art_todo_lists 
      WHERE user_id = $1 AND id IN ($2, (
        SELECT list_id FROM art_todo_items 
        WHERE id = $3
      ))
    `;
    
    const verification = await db.asyncGet(listsQuery, [userId, newListId, id]);
    
    if (verification.count < 2) {
      throw new Error('Access denied or invalid list');
    }

    const query = `
      UPDATE art_todo_items 
      SET list_id = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `;
    
    const result = await db.asyncRun(query, [newListId, id]);
    
    const changes = db.isPostgreSQL ? result.rowCount : result.changes;
    if (changes === 0) {
      return null;
    }
    
    return await this.getById(id, userId);
  }

  /**
   * Delete an art todo item
   * @param {number} id - Item ID
   * @param {number} userId - User ID (for ownership verification)
   * @returns {Promise<boolean>}
   */
  static async delete(id, userId) {
    const query = `
      DELETE FROM art_todo_items 
      WHERE id = $1 AND id IN (
        SELECT i.id FROM art_todo_items i
        JOIN art_todo_lists l ON i.list_id = l.id
        WHERE l.user_id = $2
      )
    `;
    
    const result = await db.asyncRun(query, [id, userId]);
    const changes = db.isPostgreSQL ? result.rowCount : result.changes;
    return changes > 0;
  }

  /**
   * Get items with their references
   * @param {number} listId - List ID
   * @param {number} userId - User ID (for ownership verification)
   * @returns {Promise<Object[]>}
   */
  static async getWithReferences(listId, userId) {
    const items = await this.getByListId(listId, userId);
    
    for (let item of items) {
      const referencesQuery = `
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
        LEFT JOIN trainers t ON r.reference_type = 'trainer' AND r.reference_id = t.id
        LEFT JOIN monsters m ON r.reference_type = 'monster' AND r.reference_id = m.id
        WHERE r.item_id = $1
      `;
      
      const references = await db.asyncAll(referencesQuery, [item.id]);
      item.references = references;
    }
    
    return items;
  }
}

module.exports = ArtTodoItem;
