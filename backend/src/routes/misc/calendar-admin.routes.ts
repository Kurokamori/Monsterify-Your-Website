import { Router } from 'express';
import { authenticate, requireAdmin } from '@middleware/auth.middleware';
import {
  listMiscEntries,
  getMiscEntry,
  createMiscEntry,
  updateMiscEntry,
  deleteMiscEntry,
} from '@controllers/misc/calendar-admin.controller';

const router: Router = Router();

router.use(authenticate, requireAdmin);

router.get('/', listMiscEntries);
router.get('/:id', getMiscEntry);
router.post('/', createMiscEntry);
router.put('/:id', updateMiscEntry);
router.delete('/:id', deleteMiscEntry);

export default router;
