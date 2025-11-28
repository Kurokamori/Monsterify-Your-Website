const db = require('../config/db');

class ArtTodoList {
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.title = data.title;
    this.description = data.description;
    this.created_at = data.created_at;
  }

  /**
   * Get all art todo lists for a user
   * @param {number} userId - User ID
   * @returns {Promise<ArtTodoList[]>}
   */
  static async getByUserId(userId) {
    const query = `
      SELECT * FROM art_todo_lists 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `;
    
    const rows = await db.asyncAll(query, [userId]);
    return rows.map(row => new ArtTodoList(row));
  }

  /**
   * Get a specific art todo list by ID
   * @param {number} id - List ID
   * @param {number} userId - User ID (for ownership verification)
   * @returns {Promise<ArtTodoList|null>}
   */
  static async getById(id, userId) {
    const query = `
      SELECT * FROM art_todo_lists 
      WHERE id = $1 AND user_id = $2
    `;
    
    const row = await db.asyncGet(query, [id, userId]);
    return row ? new ArtTodoList(row) : null;
  }

  /**
   * Create a new art todo list
   * @param {Object} data - List data
   * @returns {Promise<ArtTodoList>}
   */
  static async create(data) {
    const query = `
      INSERT INTO art_todo_lists (user_id, title, description)
      VALUES ($1, $2, $3)
      RETURNING id
    `;
    
    const result = await db.asyncRun(query, [
      data.user_id,
      data.title,
      data.description || null
    ]);
    
    const insertedId = db.isPostgreSQL ? result.rows[0].id : result.lastID;
    return await this.getById(insertedId, data.user_id);
  }

  /**
   * Update an art todo list
   * @param {number} id - List ID
   * @param {number} userId - User ID (for ownership verification)
   * @param {Object} data - Updated data
   * @returns {Promise<ArtTodoList|null>}
   */
  static async update(id, userId, data) {
    const query = `
      UPDATE art_todo_lists 
      SET title = $1, description = $2
      WHERE id = $3 AND user_id = $4
    `;
    
    const result = await db.asyncRun(query, [
      data.title,
      data.description || null,
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
   * Delete an art todo list and all its items
   * @param {number} id - List ID
   * @param {number} userId - User ID (for ownership verification)
   * @returns {Promise<boolean>}
   */
  static async delete(id, userId) {
    const query = `
      DELETE FROM art_todo_lists 
      WHERE id = $1 AND user_id = $2
    `;
    
    const result = await db.asyncRun(query, [id, userId]);
    const changes = db.isPostgreSQL ? result.rowCount : result.changes;
    return changes > 0;
  }

  /**
   * Get list with items count
   * @param {number} userId - User ID
   * @returns {Promise<Object[]>}
   */
  static async getWithItemCounts(userId) {
    const query = `
      SELECT 
        l.id,
        l.user_id,
        l.title,
        l.description,
        l.created_at,
        COUNT(i.id) as item_count,
        COUNT(CASE WHEN i.status = 'completed' THEN 1 ELSE NULL END) as completed_count
      FROM art_todo_lists l
      LEFT JOIN art_todo_items i ON l.id = i.list_id
      WHERE l.user_id = $1
      GROUP BY l.id, l.user_id, l.title, l.description, l.created_at
      ORDER BY l.created_at DESC
    `;
    
    const rows = await db.asyncAll(query, [userId]);
    return rows.map(row => ({
      ...new ArtTodoList(row),
      item_count: row.item_count,
      completed_count: row.completed_count
    }));
  }
}

module.exports = ArtTodoList;
