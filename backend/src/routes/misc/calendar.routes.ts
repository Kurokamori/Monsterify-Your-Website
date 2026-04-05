import { Router } from 'express';
import { getCalendarData } from '@controllers/misc/calendar.controller';

const router: Router = Router();

router.get('/', getCalendarData);

export default router;
