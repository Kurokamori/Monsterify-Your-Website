import { Router } from 'express';
import { authenticate } from '@middleware/auth.middleware';
import {
  rollStarterSets,
  selectStarters,
} from '@controllers/monsters/starter-roller.controller';

const router = Router();

// All routes are protected
router.use(authenticate);

// POST /api/starter-roller/roll
router.post('/roll', rollStarterSets);

// POST /api/starter-roller/select
router.post('/select', selectStarters);

export default router;
