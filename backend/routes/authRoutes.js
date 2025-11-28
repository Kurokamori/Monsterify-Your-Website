const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Routes for /api/auth

// Public routes
// Register a new user
router.post('/register', registerUser);

// Login user
router.post('/login', loginUser);

// Refresh token
router.post('/refresh', refreshToken);

// Discord OAuth routes
// Test Discord configuration
router.get('/discord/test', testDiscordConfig);

// Initiate Discord OAuth
router.get('/discord', discordAuth);

// Handle Discord OAuth callback
router.get('/discord/callback', discordCallback);

// Protected routes - require authentication
// Get user profile
router.get('/profile', protect, getUserProfile);

// Update user profile
router.patch('/profile', protect, updateUserProfile);

// Get monster roller settings
router.get('/roller-settings', protect, getMonsterRollerSettings);

// Update monster roller settings
router.put('/roller-settings', protect, updateMonsterRollerSettings);

module.exports = router;
