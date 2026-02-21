import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware';
import {
  startActivity,
  getSession,
  completeActivity,
  claimReward,
  forfeitReward,
  clearSession,
  getLocationStatus,
  getAllSessions,
  getSessionById,
  forceCompleteSession,
  deleteSession,
  getPrompts,
  getPromptById,
  createPrompt,
  updatePrompt,
  deletePrompt,
  getFlavors,
  createFlavor,
  updateFlavor,
  deleteFlavor,
} from '../../controllers/town/location-activity.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Player endpoints
router.post('/start', startActivity);
router.get('/session/:sessionId', getSession);
router.post('/complete', completeActivity);
router.post('/claim', claimReward);
router.post('/forfeit', forfeitReward);
router.post('/clear-session', clearSession);
router.get('/:location/status', getLocationStatus);

// Admin endpoints (require admin role)
const adminRouter = Router();
adminRouter.use(requireAdmin);

// Admin: Session management
adminRouter.get('/sessions', getAllSessions);
adminRouter.get('/sessions/:sessionId', getSessionById);
adminRouter.post('/sessions/:sessionId/force-complete', forceCompleteSession);
adminRouter.delete('/sessions/:sessionId', deleteSession);

// Admin: Prompt CRUD
adminRouter.get('/prompts', getPrompts);
adminRouter.get('/prompts/:id', getPromptById);
adminRouter.post('/prompts', createPrompt);
adminRouter.put('/prompts/:id', updatePrompt);
adminRouter.delete('/prompts/:id', deletePrompt);

// Admin: Flavor CRUD
adminRouter.get('/flavors', getFlavors);
adminRouter.post('/flavors', createFlavor);
adminRouter.put('/flavors/:id', updateFlavor);
adminRouter.delete('/flavors/:id', deleteFlavor);

router.use('/admin', adminRouter);

export default router;
