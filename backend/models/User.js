const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { isPostgreSQL } = require('../utils/dbUtils');

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
      // Check if username already exists
      const existingUser = await this.findByUsername(username);
      if (existingUser) {
        throw new Error('Username already exists');
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Use display_name if provided, otherwise use username
      const finalDisplayName = display_name || username;

      // Insert user into database
      const query = `
        INSERT INTO users (username, display_name, discord_id, password, is_admin)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `;

      const values = [username, finalDisplayName, discord_id, hashedPassword, is_admin ? 1 : 0];
      const result = await db.asyncGet(query, values);

      // Get the created user
      return await this.findById(result.id);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Find user by ID
   * @param {number} id - User ID
   * @returns {Promise<Object|null>} - User object or null if not found
   */
  static async findById(id) {
    try {
      const query = 'SELECT id, username, display_name, discord_id, is_admin, monster_roller_settings, created_at FROM users WHERE id = $1';
      const user = await db.asyncGet(query, [id]);

      // Parse monster_roller_settings if it exists
      if (user && user.monster_roller_settings) {
        try {
          user.monster_roller_settings = JSON.parse(user.monster_roller_settings);
        } catch (e) {
          console.error('Error parsing monster_roller_settings:', e);
          user.monster_roller_settings = { pokemon_enabled: true, digimon_enabled: true, yokai_enabled: true, pals_enabled: true, nexomon_enabled: true, fakemon_enabled: true, finalfantasy_enabled: true, monsterhunter_enabled: true };
        }
      }

      return user;
    } catch (error) {
      console.error(`Error finding user with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Find user by username
   * @param {string} username - Username
   * @returns {Promise<Object|null>} - User object or null if not found
   */
  static async findByUsername(username) {
    try {
      const query = 'SELECT * FROM users WHERE username = $1';
      return await db.asyncGet(query, [username]);
    } catch (error) {
      console.error(`Error finding user with username ${username}:`, error);
      throw error;
    }
  }

  /**
   * Find user by Discord ID
   * @param {string} discordId - Discord ID
   * @returns {Promise<Object|null>} - User object or null if not found
   */
  static async findByDiscordId(discordId) {
    try {
      const query = 'SELECT * FROM users WHERE discord_id = $1';
      return await db.asyncGet(query, [discordId]);
    } catch (error) {
      console.error(`Error finding user with Discord ID ${discordId}:`, error);
      throw error;
    }
  }

  /**
   * Authenticate user
   * @param {string} username - Username
   * @param {string} password - Password
   * @returns {Promise<Object|null>} - User object or authentication error info
   */
  static async authenticate(username, password) {
    try {
      console.log(`[Auth Debug] Attempting to authenticate user: ${username}`);
      
      // Find user by username
      const user = await this.findByUsername(username);
      if (!user) {
        console.log(`[Auth Debug] User not found: ${username}`);
        return { error: 'USER_NOT_FOUND', message: 'No user found matching that username' };
      }

      console.log(`[Auth Debug] User found: ${user.username}, is_admin: ${user.is_admin}, has_password: ${!!user.password}`);

      // Compare passwords
      const isMatch = await bcrypt.compare(password, user.password);
      console.log(`[Auth Debug] Password match result: ${isMatch}`);
      
      if (!isMatch) {
        console.log(`[Auth Debug] Password does not match for user: ${username}`);
        return { error: 'WRONG_PASSWORD', message: 'Incorrect password' };
      }

      console.log(`[Auth Debug] Authentication successful for user: ${username}`);
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      console.error('Error authenticating user:', error);
      throw error;
    }
  }

  /**
   * Generate JWT token for user
   * @param {Object} user - User object
   * @returns {string} - JWT token
   */
  static generateToken(user) {
    const payload = {
      id: user.id,
      username: user.username,
      is_admin: user.is_admin
    };

    return jwt.sign(
      payload,
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );
  }

  /**
   * Generate refresh token for user
   * @param {Object} user - User object
   * @param {boolean} rememberMe - Whether user wants to be remembered
   * @returns {string} - Refresh token
   */
  static generateRefreshToken(user, rememberMe = false) {
    const payload = {
      id: user.id,
      type: 'refresh'
    };

    // Set expiry based on remember me preference
    const expiresIn = rememberMe ? '30d' : '1d';

    return jwt.sign(
      payload,
      process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
      { expiresIn }
    );
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token
   * @returns {Object|null} - Decoded token payload or null if invalid
   */
  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (error) {
      console.error('Error verifying token:', error);
      return null;
    }
  }

  /**
   * Verify refresh token
   * @param {string} token - Refresh token
   * @returns {Object|null} - Decoded token payload or null if invalid
   */
  static verifyRefreshToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key');
    } catch (error) {
      console.error('Error verifying refresh token:', error);
      return null;
    }
  }

  /**
   * Get all users
   * @returns {Promise<Array>} - Array of users
   */
  static async getAll() {
    try {
      const query = 'SELECT id, username, display_name, discord_id, is_admin, created_at FROM users ORDER BY id';
      return await db.asyncAll(query);
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }

  /**
   * Update a user
   * @param {number} id - User ID
   * @param {Object} userData - User data to update
   * @param {string} userData.username - Username
   * @param {string} userData.display_name - Display name (optional)
   * @param {string} userData.discord_id - Discord ID (optional)
   * @param {string} userData.password - Password (optional)
   * @param {boolean} userData.is_admin - Is admin (optional)
   * @param {Object} userData.monster_roller_settings - Monster roller settings (optional)
   * @returns {Promise<Object>} - Updated user
   */
  static async update(id, { username, display_name, discord_id, password, is_admin, monster_roller_settings }) {
    try {
      // Check if user exists
      const user = await this.findById(id);
      if (!user) {
        throw new Error('User not found');
      }

      // Check if username already exists (if changing username)
      if (username && username !== user.username) {
        const existingUser = await this.findByUsername(username);
        if (existingUser) {
          throw new Error('Username already exists');
        }
      }

      // Prepare update fields
      const updates = [];
      const values = [];
      let paramIndex = 1;

      if (username) {
        updates.push(`username = $${paramIndex}`);
        values.push(username);
        paramIndex++;
      }

      if (display_name !== undefined) {
        updates.push(`display_name = $${paramIndex}`);
        values.push(display_name || (username || user.username)); // Use username if display_name is empty
        paramIndex++;
      }

      if (discord_id !== undefined) {
        updates.push(`discord_id = $${paramIndex}`);
        values.push(discord_id);
        paramIndex++;
      }

      if (password) {
        // Hash new password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        updates.push(`password = $${paramIndex}`);
        values.push(hashedPassword);
        paramIndex++;
      }

      if (is_admin !== undefined) {
        updates.push(`is_admin = $${paramIndex}`);
        values.push(is_admin ? 1 : 0);
        paramIndex++;
      }

      if (monster_roller_settings !== undefined) {
        updates.push(`monster_roller_settings = $${paramIndex}`);
        // Convert object to JSON string
        const settingsJson = typeof monster_roller_settings === 'string'
          ? monster_roller_settings
          : JSON.stringify(monster_roller_settings);
        values.push(settingsJson);
        paramIndex++;
      }

      // If no updates, return the current user
      if (updates.length === 0) {
        return user;
      }

      // Add ID to values array
      values.push(id);

      // Update user in database
      const query = `
        UPDATE users
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
      `;

      await db.asyncRun(query, values);

      // Get the updated user
      return await this.findById(id);
    } catch (error) {
      console.error(`Error updating user with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a user
   * @param {number} id - User ID
   * @returns {Promise<boolean>} - True if successful
   */
  static async delete(id) {
    try {
      const query = 'DELETE FROM users WHERE id = $1';
      await db.asyncRun(query, [id]);
      return true;
    } catch (error) {
      console.error(`Error deleting user with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create or update user from Discord OAuth
   * @param {Object} profile - Discord profile data
   * @returns {Promise<Object>} - Created or updated user
   */
  static async findOrCreateFromDiscord(profile) {
    try {
      console.log('findOrCreateFromDiscord called with profile:', {
        id: profile.id,
        username: profile.username,
        global_name: profile.global_name
      });

      // First try to find existing user by Discord ID
      let existingUser = await this.findByDiscordId(profile.id);
      console.log('Existing user found:', existingUser ? 'YES' : 'NO');
      
      if (existingUser) {
        console.log('Updating existing user...');
        // Update user with latest Discord info
        const updatedUser = await this.update(existingUser.id, {
          display_name: profile.global_name || profile.username,
          discord_id: profile.id
        });
        console.log('User updated successfully:', updatedUser.id);
        return updatedUser;
      }

      // Create new user with Discord data
      // Use Discord username as the username, but make it unique if needed
      let username = profile.username;
      let counter = 1;
      
      console.log('Checking username uniqueness for:', username);
      
      // Ensure username is unique
      while (await this.findByUsername(username)) {
        username = `${profile.username}${counter}`;
        counter++;
        console.log('Username taken, trying:', username);
      }

      console.log('Creating new user with username:', username);
      
      const newUser = await this.create({
        username: username,
        display_name: profile.global_name || profile.username,
        discord_id: profile.id,
        password: 'discord_oauth' // Placeholder password for Discord users
      });
      
      console.log('New user created successfully:', newUser.id);
      return newUser;
    } catch (error) {
      console.error('Error in findOrCreateFromDiscord:', error);
      console.error('Error stack:', error.stack);
      throw error;
    }
  }

  /**
   * Get user's monster roller settings
   * @param {number} id - User ID
   * @returns {Promise<Object>} - Monster roller settings
   */
  static async getMonsterRollerSettings(id) {
    try {
      const user = await this.findById(id);
      if (!user) {
        throw new Error('User not found');
      }

      // Return monster_roller_settings or default if not set
      return user.monster_roller_settings || { pokemon_enabled: true, digimon_enabled: true, yokai_enabled: true, pals_enabled: true, nexomon_enabled: true, fakemon_enabled: true, finalfantasy_enabled: true, monsterhunter_enabled: true };
    } catch (error) {
      console.error(`Error getting monster roller settings for user with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update user's monster roller settings
   * @param {number} id - User ID
   * @param {Object} settings - Monster roller settings
   * @returns {Promise<Object>} - Updated user
   */
  static async updateMonsterRollerSettings(id, settings) {
    try {
      return await this.update(id, { monster_roller_settings: settings });
    } catch (error) {
      console.error(`Error updating monster roller settings for user with ID ${id}:`, error);
      throw error;
    }
  }
}

module.exports = User;
