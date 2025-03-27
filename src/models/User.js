const bcrypt = require('bcrypt');
const pool = require('../db');

class User {
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @param {string} userData.username - Username
   * @param {string} userData.display_name - Display name (optional)
   * @param {string} userData.discord_id - Discord ID (optional)
   * @param {string} userData.password - Password
   * @param {boolean} userData.is_admin - Is admin (optional)
   * @returns {Promise<Object>} - Created user
   */
  static async create({ username, display_name, discord_id, password, is_admin = false }) {
    try {
      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Use display_name if provided, otherwise use username
      const finalDisplayName = display_name || username;

      // Insert user into database
      const query = `
        INSERT INTO users (username, display_name, discord_id, password, is_admin)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, username, display_name, discord_id, is_admin, created_at
      `;

      const values = [username, finalDisplayName, discord_id, hashedPassword, is_admin];
      const result = await pool.query(query, values);

      return result.rows[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Find a user by username
   * @param {string} username - Username
   * @returns {Promise<Object|null>} - User or null if not found
   */
  static async findByUsername(username) {
    try {
      const query = 'SELECT * FROM users WHERE username = $1';
      const result = await pool.query(query, [username]);

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user by username:', error);
      throw error;
    }
  }

  /**
   * Verify a user's password
   * @param {string} plainPassword - Plain text password
   * @param {string} hashedPassword - Hashed password
   * @returns {Promise<boolean>} - True if password matches
   */
  static async verifyPassword(plainPassword, hashedPassword) {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      console.error('Error verifying password:', error);
      throw error;
    }
  }

  /**
   * Find a user by Discord ID
   * @param {string} discordId - Discord ID
   * @returns {Promise<Object|null>} - User or null if not found
   */
  static async findByDiscordId(discordId) {
    try {
      const query = 'SELECT * FROM users WHERE discord_id = $1';
      const result = await pool.query(query, [discordId]);

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user by Discord ID:', error);
      throw error;
    }
  }

  /**
   * Initialize the database by creating the admin user if it doesn't exist
   */
  static async initializeDatabase() {
    try {
      // Check if admin user exists
      const adminUser = await this.findByUsername('Kurokamori');

      if (!adminUser) {
        // Create admin user
        await this.create({
          username: 'Kurokamori',
          display_name: 'Kurokamori',
          discord_id: null, // Admin doesn't need a Discord ID
          password: 'admin123', // This should be changed to a secure password in production
          is_admin: true
        });

        console.log('Admin user created successfully');
      }
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  /**
   * Get all users
   * @returns {Promise<Array>} - Array of users
   */
  static async getAll() {
    try {
      const query = 'SELECT id, username, display_name, discord_id, is_admin, created_at FROM users ORDER BY id';
      const result = await pool.query(query);

      return result.rows;
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }

  /**
   * Find a user by ID
   * @param {number} id - User ID
   * @returns {Promise<Object|null>} - User or null if not found
   */
  static async findById(id) {
    try {
      const query = 'SELECT id, username, display_name, discord_id, is_admin, created_at FROM users WHERE id = $1';
      const result = await pool.query(query, [id]);

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }

  /**
   * Update a user
   * @param {number} id - User ID
   * @param {Object} userData - User data to update
   * @returns {Promise<Object>} - Updated user
   */
  static async update(id, { username, display_name, discord_id, password, is_admin }) {
    try {
      let query;
      let values;

      if (password) {
        // Hash the new password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        query = `
          UPDATE users
          SET username = $1, display_name = $2, discord_id = $3, password = $4, is_admin = $5
          WHERE id = $6
          RETURNING id, username, display_name, discord_id, is_admin, created_at
        `;
        values = [username, display_name, discord_id, hashedPassword, is_admin, id];
      } else {
        // Don't update password
        query = `
          UPDATE users
          SET username = $1, display_name = $2, discord_id = $3, is_admin = $4
          WHERE id = $5
          RETURNING id, username, display_name, discord_id, is_admin, created_at
        `;
        values = [username, display_name, discord_id, is_admin, id];
      }

      const result = await pool.query(query, values);

      return result.rows[0];
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Delete a user
   * @param {number} id - User ID
   * @returns {Promise<boolean>} - True if user was deleted
   */
  static async delete(id) {
    try {
      const query = 'DELETE FROM users WHERE id = $1';
      await pool.query(query, [id]);

      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
}

module.exports = User;
