import { Router } from 'express';
import { authenticate } from '@middleware/auth.middleware';
import {
  generateGameCornerRewards,
  claimGameCornerReward,
  forfeitGameCornerReward,
} from '@controllers/town/game-corner.controller';

const router = Router();

// ============================================================================
// Authenticated Routes
// ============================================================================

// POST /api/town/game-corner/rewards — Generate rewards for a pomodoro session
router.post('/rewards', authenticate, generateGameCornerRewards);

// POST /api/town/game-corner/claim — Manually claim a specific reward
router.post('/claim', authenticate, claimGameCornerReward);

// POST /api/town/game-corner/forfeit — Forfeit a monster reward to the bazar
router.post('/forfeit', authenticate, forfeitGameCornerReward);

export default router;
