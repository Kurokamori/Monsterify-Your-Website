import { Router } from 'express';
import { authenticate, requireAdmin } from '@middleware/auth.middleware';
import {
  // Admin
  createSession,
  listSessions,
  getSession,
  updateSession,
  deleteSession,
  updateResult,
  deleteResult,
  rerollResult,
  rerollAll,
  // Player
  checkToken,
  getClaimSession,
  submitClaims,
} from '@controllers/misc/reroller.controller';

const router = Router();

// =============================================================================
// Public Routes (no authentication required)
// =============================================================================

// Check if token is valid (for pre-login redirect)
router.get('/check/:token', checkToken);

// =============================================================================
// Player Routes (require authentication)
// =============================================================================

// Get claim session (player view)
router.get('/claim/:token', authenticate, getClaimSession);

// Submit claims
router.post('/claim/:token', authenticate, submitClaims);

// =============================================================================
// Admin Routes (require authentication + admin)
// =============================================================================

// Create new session
router.post('/sessions', authenticate, requireAdmin, createSession);

// List all sessions
router.get('/sessions', authenticate, requireAdmin, listSessions);

// Get single session
router.get('/sessions/:id', authenticate, requireAdmin, getSession);

// Update session
router.put('/sessions/:id', authenticate, requireAdmin, updateSession);

// Delete session
router.delete('/sessions/:id', authenticate, requireAdmin, deleteSession);

// Update specific result
router.put('/sessions/:id/result', authenticate, requireAdmin, updateResult);

// Delete specific result
router.delete('/sessions/:id/result/:type/:index', authenticate, requireAdmin, deleteResult);

// Reroll specific result
router.post('/sessions/:id/reroll-result', authenticate, requireAdmin, rerollResult);

// Reroll entire session
router.post('/sessions/:id/reroll-all', authenticate, requireAdmin, rerollAll);

export default router;
