const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserRelatedSubmissions
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

// Routes for /api/users

// Public route for related submissions (no auth required)
router.get('/:id/submissions/related', getUserRelatedSubmissions);

// All other routes require admin privileges
router.use(protect);
router.use(admin);

// Get all users
router.get('/', getAllUsers);

// Get user by ID
router.get('/:id', getUserById);

// Create a new user
router.post('/', createUser);

// Update user
router.put('/:id', updateUser);

// Delete user
router.delete('/:id', deleteUser);

module.exports = router;
