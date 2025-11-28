const User = require('../models/User');
const db = require('../config/db');
const { buildLimit } = require('../utils/dbUtils');

/**
 * Get all users
 * @route GET /api/users
 * @access Admin
 */
const getAllUsers = async (req, res) => {
  try {
    const users = await User.getAll();
    
    res.status(200).json({
      success: true,
      users: users.map(user => ({
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        discord_id: user.discord_id,
        is_admin: user.is_admin,
        created_at: user.created_at
      }))
    });
  } catch (error) {
    console.error('Error getting all users:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting users'
    });
  }
};

/**
 * Get user by ID
 * @route GET /api/users/:id
 * @access Admin
 */
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        discord_id: user.discord_id,
        is_admin: user.is_admin,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error(`Error getting user with ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting user'
    });
  }
};

/**
 * Create a new user
 * @route POST /api/users
 * @access Admin
 */
const createUser = async (req, res) => {
  try {
    const { username, display_name, discord_id, password, is_admin } = req.body;
    
    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }
    
    // Create user
    const user = await User.create({
      username,
      display_name,
      discord_id,
      password,
      is_admin
    });
    
    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        discord_id: user.discord_id,
        is_admin: user.is_admin,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    
    // Handle duplicate username error
    if (error.message === 'Username already exists') {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while creating user'
    });
  }
};

/**
 * Update a user
 * @route PUT /api/users/:id
 * @access Admin
 */
const updateUser = async (req, res) => {
  try {
    const { username, display_name, discord_id, password, is_admin } = req.body;
    
    // Validate required fields
    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username is required'
      });
    }
    
    // Update user
    const user = await User.update(req.params.id, {
      username,
      display_name,
      discord_id,
      password, // Will only update if provided
      is_admin
    });
    
    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        discord_id: user.discord_id,
        is_admin: user.is_admin,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error(`Error updating user with ID ${req.params.id}:`, error);
    
    // Handle duplicate username error
    if (error.message === 'Username already exists') {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while updating user'
    });
  }
};

/**
 * Delete a user
 * @route DELETE /api/users/:id
 * @access Admin
 */
const deleteUser = async (req, res) => {
  try {
    // Check if user exists
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Don't allow deleting the current user
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }
    
    // Delete user
    await User.delete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error(`Error deleting user with ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting user'
    });
  }
};

/**
 * Get related submissions for a user
 * @route GET /api/users/:id/submissions/related
 * @access Public
 */
const getUserRelatedSubmissions = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { excludeId, contentType } = req.query;

    // Build the query to get related submissions
    let query = `
      SELECT
        s.id,
        s.title,
        s.description,
        s.submission_type,
        s.submission_date,
        (SELECT image_url FROM submission_images WHERE submission_id = s.id AND is_main = 1 LIMIT 1) as image_url
      FROM submissions s
      WHERE s.user_id = $1
    `;

    const queryParams = [userId];
    let paramIndex = 2;

    // Exclude the current submission
    if (excludeId) {
      query += ` AND s.id != $${paramIndex}`;
      queryParams.push(parseInt(excludeId));
      paramIndex++;
    }

    // Filter by content type (submission_type)
    if (contentType && contentType !== 'all') {
      query += ` AND s.submission_type = $${paramIndex}`;
      queryParams.push(contentType);
      paramIndex++;
    }

    // Order by date and limit results
    query += ` ORDER BY s.submission_date DESC`;
    query += buildLimit(6, queryParams);

    const submissions = await db.asyncAll(query, queryParams);

    res.json({
      success: true,
      submissions
    });
  } catch (error) {
    console.error('Error getting user related submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get related submissions',
      error: error.message
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserRelatedSubmissions
};
