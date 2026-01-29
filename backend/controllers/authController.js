const User = require('../models/User');
const passport = require('../config/passport');

/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
const registerUser = async (req, res) => {
  try {
    const { username, display_name, discord_id, password } = req.body;

    // Validate input
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
      password
    });

    // Generate tokens
    const token = User.generateToken(user);
    const refreshToken = User.generateRefreshToken(user);

    // Return user data and tokens
    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        discord_id: user.discord_id,
        is_admin: user.is_admin,
        monster_roller_settings: user.monster_roller_settings
      },
      token,
      refreshToken
    });
  } catch (error) {
    console.error('Registration error:', error);

    // Handle duplicate username error
    if (error.message === 'Username already exists') {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

/**
 * Login user
 * @route POST /api/auth/login
 * @access Public
 */
const loginUser = async (req, res) => {
  try {
    const { username, password, rememberMe } = req.body;
    console.log(`[Login Debug] Login attempt for username: ${username}, rememberMe: ${rememberMe}`);

    // Validate input
    if (!username || !password) {
      console.log('[Login Debug] Missing username or password');
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Authenticate user
    console.log('[Login Debug] Calling User.authenticate...');
    const authResult = await User.authenticate(username, password);
    console.log(`[Login Debug] User.authenticate returned: ${authResult && !authResult.error ? 'SUCCESS' : 'FAILURE'}`);
    
    // Check if authentication failed
    if (!authResult || authResult.error) {
      console.log('[Login Debug] Authentication failed - returning 401');
      const message = authResult?.message || 'Invalid username or password';
      return res.status(401).json({
        success: false,
        message: message
      });
    }
    
    const user = authResult;

    // Generate tokens
    const token = User.generateToken(user);

    // Always generate refresh token, but with different expiry based on rememberMe
    const refreshToken = User.generateRefreshToken(user, rememberMe);

    // Return user data and tokens
    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        discord_id: user.discord_id,
        is_admin: user.is_admin,
        monster_roller_settings: user.monster_roller_settings
      },
      token,
      refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

/**
 * Refresh token
 * @route POST /api/auth/refresh
 * @access Public
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    // Validate input
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = User.verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Get user from database
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate new token
    const newToken = User.generateToken(user);

    // Return new token
    res.status(200).json({
      success: true,
      token: newToken
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during token refresh'
    });
  }
};

/**
 * Get current user profile
 * @route GET /api/auth/profile
 * @access Private
 */
const getUserProfile = async (req, res) => {
  try {
    // User is already attached to request by protect middleware
    // Get full user data including monster_roller_settings
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        discord_id: user.discord_id,
        is_admin: user.is_admin,
        monster_roller_settings: user.monster_roller_settings
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting profile'
    });
  }
};

/**
 * Update user profile
 * @route PATCH /api/auth/profile
 * @access Private
 */
const updateUserProfile = async (req, res) => {
  try {
    const { display_name, discord_id } = req.body;

    // Update user profile
    const updatedUser = await User.update(req.user.id, {
      display_name,
      discord_id
    });

    res.status(200).json({
      success: true,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        display_name: updatedUser.display_name,
        discord_id: updatedUser.discord_id,
        is_admin: updatedUser.is_admin,
        monster_roller_settings: updatedUser.monster_roller_settings
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile'
    });
  }
};

/**
 * Get user's monster roller settings
 * @route GET /api/auth/roller-settings
 * @access Private
 */
const getMonsterRollerSettings = async (req, res) => {
  try {
    const settings = await User.getMonsterRollerSettings(req.user.id);

    res.status(200).json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Get monster roller settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting monster roller settings'
    });
  }
};

/**
 * Update user's monster roller settings
 * @route PUT /api/auth/roller-settings
 * @access Private
 */
const updateMonsterRollerSettings = async (req, res) => {
  try {
    const settings = req.body;

    // Validate settings
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid settings format'
      });
    }

    // Update settings
    const updatedUser = await User.updateMonsterRollerSettings(req.user.id, settings);

    res.status(200).json({
      success: true,
      settings: updatedUser.monster_roller_settings
    });
  } catch (error) {
    console.error('Update monster roller settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating monster roller settings'
    });
  }
};

/**
 * Test Discord configuration
 * @route GET /api/auth/discord/test
 * @access Public
 */
const testDiscordConfig = (req, res) => {
  const config = {
    clientIdSet: !!process.env.DISCORD_CLIENT_ID,
    clientSecretSet: !!process.env.DISCORD_CLIENT_SECRET,
    callbackUrl: process.env.DISCORD_CALLBACK_URL || "/api/auth/discord/callback",
    frontendUrl: process.env.FRONTEND_URL || 'https://duskanddawn.net'
  };
  
  res.json({
    success: true,
    message: 'Discord configuration check',
    config: config
  });
};

/**
 * Initiate Discord OAuth login
 * @route GET /api/auth/discord
 * @access Public
 */
const discordAuth = passport.authenticate('discord', { session: false });

/**
 * Handle Discord OAuth callback
 * @route GET /api/auth/discord/callback
 * @access Public
 */
const discordCallback = (req, res, next) => {
  passport.authenticate('discord', { session: false }, async (err, user) => {
    try {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      
      if (err) {
        console.error('Discord callback error:', err);
        console.error('Error details:', {
          message: err.message,
          code: err.code,
          status: err.status,
          uri: err.uri
        });
        return res.redirect(`${frontendUrl}/login?error=discord_error`);
      }

      if (!user) {
        console.error('No user returned from Discord OAuth');
        return res.redirect(`${frontendUrl}/login?error=discord_no_user`);
      }

      // Generate JWT tokens for the user
      const token = User.generateToken(user);
      const refreshToken = User.generateRefreshToken(user, true); // Remember user for Discord login

      // Redirect to frontend with tokens in URL params (for SPA handling)
      const userData = {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        discord_id: user.discord_id,
        is_admin: user.is_admin,
        monster_roller_settings: user.monster_roller_settings
      };
      
      const redirectUrl = `${frontendUrl}/auth/discord/success?token=${encodeURIComponent(token)}&refreshToken=${encodeURIComponent(refreshToken)}&user=${encodeURIComponent(JSON.stringify(userData))}`;
      
      console.log('Discord OAuth success, redirecting to:', redirectUrl);
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Discord callback processing error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/login?error=server_error`);
    }
  })(req, res, next);
};

module.exports = {
  registerUser,
  loginUser,
  refreshToken,
  getUserProfile,
  updateUserProfile,
  getMonsterRollerSettings,
  updateMonsterRollerSettings,
  testDiscordConfig,
  discordAuth,
  discordCallback
};
