const db = require('../config/db');

/**
 * BookCollaborator model - manages collaborators for books
 * Allows multiple users to contribute chapters to a shared book
 */
class BookCollaborator {
  /**
   * Initialize the book_collaborators table if it doesn't exist
   * @returns {Promise<void>}
   */
  static async initializeTable() {
    try {
      const isPostgreSQL = process.env.NODE_ENV === 'production' || process.env.DATABASE_URL;

      const query = isPostgreSQL ? `
        CREATE TABLE IF NOT EXISTS book_collaborators (
          id SERIAL PRIMARY KEY,
          book_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
          user_id VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL DEFAULT 'editor',
          added_by VARCHAR(255) NOT NULL,
          added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(book_id, user_id)
        )
      ` : `
        CREATE TABLE IF NOT EXISTS book_collaborators (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          book_id INTEGER NOT NULL,
          user_id TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'editor',
          added_by TEXT NOT NULL,
          added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (book_id) REFERENCES submissions(id) ON DELETE CASCADE,
          UNIQUE(book_id, user_id)
        )
      `;

      await db.asyncRun(query);
      console.log('book_collaborators table initialized');
    } catch (error) {
      console.error('Error initializing book_collaborators table:', error);
      throw error;
    }
  }

  /**
   * Add a collaborator to a book
   * @param {number} bookId - Book submission ID
   * @param {string} userId - User ID (discord_id or user id) to add as collaborator
   * @param {string} addedBy - User ID of who added this collaborator
   * @param {string} role - Role of the collaborator ('editor', 'viewer')
   * @returns {Promise<Object>} Created collaborator record
   */
  static async addCollaborator(bookId, userId, addedBy, role = 'editor') {
    try {
      // Check if collaborator already exists
      const existing = await this.getCollaborator(bookId, userId);
      if (existing) {
        throw new Error('User is already a collaborator on this book');
      }

      const query = `
        INSERT INTO book_collaborators (book_id, user_id, role, added_by)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `;

      const result = await db.asyncGet(query, [bookId, userId, role, addedBy]);

      return {
        id: result.id,
        bookId,
        userId,
        role,
        addedBy
      };
    } catch (error) {
      console.error('Error adding collaborator:', error);
      throw error;
    }
  }

  /**
   * Remove a collaborator from a book
   * @param {number} bookId - Book submission ID
   * @param {string} userId - User ID to remove
   * @returns {Promise<boolean>} True if removed successfully
   */
  static async removeCollaborator(bookId, userId) {
    try {
      const query = `
        DELETE FROM book_collaborators
        WHERE book_id = $1 AND user_id::text = $2::text
      `;

      const result = await db.asyncRun(query, [bookId, userId]);
      return result.changes > 0 || result.rowCount > 0;
    } catch (error) {
      console.error('Error removing collaborator:', error);
      throw error;
    }
  }

  /**
   * Get a specific collaborator
   * @param {number} bookId - Book submission ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Collaborator record or null
   */
  static async getCollaborator(bookId, userId) {
    try {
      const query = `
        SELECT bc.*, u.username, u.display_name, u.discord_id as user_discord_id
        FROM book_collaborators bc
        LEFT JOIN users u ON (bc.user_id::text = u.discord_id OR bc.user_id::text = u.id::text)
        WHERE bc.book_id = $1 AND bc.user_id::text = $2::text
      `;

      return await db.asyncGet(query, [bookId, userId]);
    } catch (error) {
      console.error('Error getting collaborator:', error);
      throw error;
    }
  }

  /**
   * Get all collaborators for a book
   * @param {number} bookId - Book submission ID
   * @returns {Promise<Array>} List of collaborators with user info
   */
  static async getBookCollaborators(bookId) {
    try {
      const query = `
        SELECT
          bc.*,
          u.username,
          u.display_name,
          u.discord_id as user_discord_id
        FROM book_collaborators bc
        LEFT JOIN users u ON (bc.user_id::text = u.discord_id OR bc.user_id::text = u.id::text)
        WHERE bc.book_id = $1
        ORDER BY bc.added_at ASC
      `;

      return await db.asyncAll(query, [bookId]);
    } catch (error) {
      console.error('Error getting book collaborators:', error);
      throw error;
    }
  }

  /**
   * Get all books a user collaborates on
   * @param {string} userId - User ID
   * @returns {Promise<Array>} List of books with collaboration info
   */
  static async getUserCollaborations(userId) {
    try {
      const query = `
        SELECT
          bc.*,
          s.id as book_id,
          s.title as book_title,
          s.description as book_description,
          s.user_id as owner_id,
          owner_user.username as owner_username,
          owner_user.display_name as owner_display_name,
          (SELECT image_url FROM submission_images WHERE submission_id = s.id AND is_main = 1 LIMIT 1) as cover_image_url,
          (SELECT COUNT(*) FROM submissions WHERE parent_id = s.id) as chapter_count
        FROM book_collaborators bc
        JOIN submissions s ON bc.book_id = s.id
        LEFT JOIN users owner_user ON (s.user_id::text = owner_user.discord_id OR s.user_id::text = owner_user.id::text)
        WHERE bc.user_id::text = $1::text AND s.is_book = 1
        ORDER BY bc.added_at DESC
      `;

      return await db.asyncAll(query, [userId]);
    } catch (error) {
      console.error('Error getting user collaborations:', error);
      throw error;
    }
  }

  /**
   * Update a collaborator's role
   * @param {number} bookId - Book submission ID
   * @param {string} userId - User ID
   * @param {string} newRole - New role ('editor', 'viewer')
   * @returns {Promise<boolean>} True if updated successfully
   */
  static async updateRole(bookId, userId, newRole) {
    try {
      const query = `
        UPDATE book_collaborators
        SET role = $1
        WHERE book_id = $2 AND user_id::text = $3::text
      `;

      const result = await db.asyncRun(query, [newRole, bookId, userId]);
      return result.changes > 0 || result.rowCount > 0;
    } catch (error) {
      console.error('Error updating collaborator role:', error);
      throw error;
    }
  }

  /**
   * Check if a user can edit a book (is owner or editor collaborator)
   * @param {number} bookId - Book submission ID
   * @param {string} userId - User ID to check
   * @returns {Promise<boolean>} True if user can edit
   */
  static async canEditBook(bookId, userId) {
    try {
      // First check if user is the owner
      const ownerQuery = `
        SELECT user_id FROM submissions WHERE id = $1 AND is_book = 1
      `;
      const book = await db.asyncGet(ownerQuery, [bookId]);

      if (!book) {
        return false;
      }

      // Compare as strings to handle mixed types
      if (String(book.user_id) === String(userId)) {
        return true;
      }

      // Check if user is a collaborator with editor role
      const collaborator = await this.getCollaborator(bookId, userId);
      return collaborator && collaborator.role === 'editor';
    } catch (error) {
      console.error('Error checking edit permissions:', error);
      return false;
    }
  }

  /**
   * Check if a user can view a book (is owner or any collaborator)
   * @param {number} bookId - Book submission ID
   * @param {string} userId - User ID to check
   * @returns {Promise<boolean>} True if user can view
   */
  static async canViewBook(bookId, userId) {
    try {
      // First check if user is the owner
      const ownerQuery = `
        SELECT user_id FROM submissions WHERE id = $1 AND is_book = 1
      `;
      const book = await db.asyncGet(ownerQuery, [bookId]);

      if (!book) {
        return false;
      }

      // Compare as strings to handle mixed types
      if (String(book.user_id) === String(userId)) {
        return true;
      }

      // Check if user is any type of collaborator
      const collaborator = await this.getCollaborator(bookId, userId);
      return !!collaborator;
    } catch (error) {
      console.error('Error checking view permissions:', error);
      return false;
    }
  }

  /**
   * Search for users to add as collaborators
   * @param {string} searchTerm - Username or display name to search
   * @param {number} bookId - Book ID to exclude existing collaborators
   * @param {number} limit - Max results to return
   * @returns {Promise<Array>} List of matching users
   */
  static async searchUsers(searchTerm, bookId, limit = 10) {
    try {
      // Get the book owner's discord_id first
      const ownerQuery = `SELECT user_id FROM submissions WHERE id = $1`;
      const book = await db.asyncGet(ownerQuery, [bookId]);
      const ownerId = book ? book.user_id : null;

      // Get existing collaborator user_ids (discord_ids)
      let existingCollaboratorIds = [];
      try {
        const collabQuery = `SELECT user_id FROM book_collaborators WHERE book_id = $1`;
        const collabs = await db.asyncAll(collabQuery, [bookId]);
        existingCollaboratorIds = collabs.map(c => c.user_id);
      } catch (err) {
        // Table might not exist yet
      }

      // Search for users by username or display_name
      const searchPattern = `%${searchTerm}%`;

      const query = `
        SELECT u.id, u.username, u.display_name, u.discord_id
        FROM users u
        WHERE LOWER(u.username) LIKE LOWER($1) OR LOWER(u.display_name) LIKE LOWER($1)
        LIMIT $2
      `;

      const users = await db.asyncAll(query, [searchPattern, limit + 10]);

      // Filter out owner and existing collaborators
      const filtered = users.filter(user => {
        // Exclude the book owner (compare discord_id)
        if (ownerId && user.discord_id === ownerId) {
          return false;
        }

        // Exclude existing collaborators
        if (existingCollaboratorIds.includes(user.discord_id)) {
          return false;
        }

        return true;
      });

      return filtered.slice(0, limit);
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }
}

module.exports = BookCollaborator;
