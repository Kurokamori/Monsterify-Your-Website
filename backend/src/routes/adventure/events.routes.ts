import { Router } from 'express';
import {
  getEventCategories,
  getEventContent,
  getCurrentEvents,
  getPastEvents,
  getUpcomingEvents,
} from '@controllers/adventure/events.controller';

const router: Router = Router();

// ============================================================================
// Public Routes
// ============================================================================

router.get('/categories', getEventCategories);
router.get('/current', getCurrentEvents);
router.get('/past', getPastEvents);
router.get('/upcoming', getUpcomingEvents);
router.get('/event/:eventId', getEventContent);

export default router;
