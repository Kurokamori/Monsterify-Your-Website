import { Router } from 'express';
import { authenticate, requireAdmin } from '@middleware/auth.middleware';
import { upload } from '@middleware/upload.middleware';
import {
  listAllEvents,
  getEventForEdit,
  createEvent,
  updateEvent,
  deleteEvent,
  uploadEventImage,
  addPart,
  updatePart,
  deletePart,
} from '@controllers/adventure/event-admin.controller';

const router: Router = Router();

// All routes require admin authentication
router.use(authenticate, requireAdmin);

// ============================================================================
// Admin Event CRUD Routes
// ============================================================================

router.get('/', listAllEvents);
router.get('/:eventId', getEventForEdit);
router.post('/', createEvent);
router.put('/:eventId', updateEvent);
router.delete('/:eventId', deleteEvent);
router.post('/upload-image', upload.single('image'), uploadEventImage);

// Multi-part event part routes
router.post('/:eventId/parts', addPart);
router.put('/:eventId/parts/:partId', updatePart);
router.delete('/:eventId/parts/:partId', deletePart);

export default router;
