import { Router } from 'express';
import { authenticate, requireAdmin } from '@middleware/auth.middleware';
import {
  listHolidayDates,
  getHolidayDate,
  upsertHolidayDate,
  generateHolidayDates,
  deleteHolidayDate,
} from '@controllers/misc/holiday-date-admin.controller';

const router: Router = Router();

router.use(authenticate, requireAdmin);

router.get('/', listHolidayDates);
router.get('/:id', getHolidayDate);
router.post('/', upsertHolidayDate);
router.post('/generate', generateHolidayDates);
router.delete('/:id', deleteHolidayDate);

export default router;
