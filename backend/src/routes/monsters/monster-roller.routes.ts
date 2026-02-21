import { Router } from 'express';
import { authenticate, requireAdmin } from '@middleware/auth.middleware';
import {
  rollMonster,
  rollMany,
  rollForTrainer,
  getOptions,
} from '@controllers/monsters/monster-roller.controller';

const router = Router();

// All routes are protected and require admin access
router.use(authenticate);
router.use(requireAdmin);

// GET /api/monster-roller/options
router.get('/options', getOptions);

// POST /api/monster-roller/roll
router.post('/roll', rollMonster);

// POST /api/monster-roller/roll/many
router.post('/roll/many', rollMany);

// POST /api/monster-roller/roll/trainer
router.post('/roll/trainer', rollForTrainer);

export default router;
