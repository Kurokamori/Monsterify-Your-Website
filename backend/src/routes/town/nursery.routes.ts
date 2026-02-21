import { Router } from 'express';
import { authenticate } from '@middleware/auth.middleware';
import { upload } from '@middleware/upload.middleware';
import {
  getTrainerEggs,
  getEggItems,
  startHatch,
  startNurture,
  getHatchSession,
  selectHatchedMonster,
  rerollHatchingResults,
} from '@controllers/town/nursery.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/nursery/eggs/:trainerId
router.get('/eggs/:trainerId', getTrainerEggs);

// GET /api/nursery/egg-items/:trainerId
router.get('/egg-items/:trainerId', getEggItems);

// POST /api/nursery/hatch
router.post('/hatch', upload.single('imageFile'), startHatch);

// POST /api/nursery/nurture
router.post('/nurture', upload.single('imageFile'), startNurture);

// GET /api/nursery/session/:sessionId
router.get('/session/:sessionId', getHatchSession);

// POST /api/nursery/select
router.post('/select', selectHatchedMonster);

// POST /api/nursery/reroll
router.post('/reroll', rerollHatchingResults);

export default router;
