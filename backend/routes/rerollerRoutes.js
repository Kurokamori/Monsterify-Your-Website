const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  // Admin endpoints
  createSession,
  listSessions,
  getSession,
  updateSession,
  deleteSession,
  updateResult,
  deleteResult,
  rerollResult,
  rerollAll,
  // Player endpoints
  checkToken,
  getClaimSession,
  submitClaims
} = require('../controllers/rerollerController');

// ============================================================================
// PUBLIC ROUTES (no authentication required)
// ============================================================================

// Check if token is valid (for pre-login redirect)
router.get('/check/:token', checkToken);

// ============================================================================
// PLAYER ROUTES (require authentication)
// ============================================================================

// Get claim session (player view)
router.get('/claim/:token', protect, getClaimSession);

// Submit claims
router.post('/claim/:token', protect, submitClaims);

// ============================================================================
// ADMIN ROUTES (require authentication + admin)
// ============================================================================

// Create new session
router.post('/sessions', protect, admin, createSession);

// List all sessions
router.get('/sessions', protect, admin, listSessions);

// Get single session
router.get('/sessions/:id', protect, admin, getSession);

// Update session (claim limits, status, notes)
router.put('/sessions/:id', protect, admin, updateSession);

// Delete session
router.delete('/sessions/:id', protect, admin, deleteSession);

// Update specific result
router.put('/sessions/:id/result', protect, admin, updateResult);

// Delete specific result
router.delete('/sessions/:id/result/:type/:index', protect, admin, deleteResult);

// Reroll specific result
router.post('/sessions/:id/reroll-result', protect, admin, rerollResult);

// Reroll entire session
router.post('/sessions/:id/reroll-all', protect, admin, rerollAll);

module.exports = router;
