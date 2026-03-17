import { Router } from 'express';
import { authenticate } from '@middleware/auth.middleware';
import {
  getGameCornerSession,
  saveGameCornerSession,
  deleteGameCornerSession,
  generateGameCornerRewards,
  claimGameCornerReward,
  forfeitGameCornerReward,
} from '@controllers/town/game-corner.controller';

const router = Router();

// ============================================================================
// Authenticated Routes
// ============================================================================

// GET /api/town/game-corner/session — Get current in-progress session
router.get('/session', authenticate, getGameCornerSession);

// PUT /api/town/game-corner/session — Create or update in-progress session
router.put('/session', authenticate, saveGameCornerSession);

// DELETE /api/town/game-corner/session — Delete session (on reset or completion)
router.delete('/session', authenticate, deleteGameCornerSession);

// POST /api/town/game-corner/rewards — Generate rewards for a pomodoro session
router.post('/rewards', authenticate, generateGameCornerRewards);

// POST /api/town/game-corner/claim — Manually claim a specific reward
router.post('/claim', authenticate, claimGameCornerReward);

// POST /api/town/game-corner/forfeit — Forfeit a monster reward to the bazar
router.post('/forfeit', authenticate, forfeitGameCornerReward);

export default router;
