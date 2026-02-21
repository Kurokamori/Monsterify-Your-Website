import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware';
import {
  getCurrentMonthAdopts,
  getAllAdopts,
  getAdoptsByYearAndMonth,
  getMonthsWithData,
  checkDaycareDaypass,
  getBerriesForAdoption,
  getPastriesForAdoption,
  claimAdopt,
  generateMonthlyAdopts,
  generateTestData,
  addDaycareDaypass,
} from '../../controllers/town/adoption.controller';

const router = Router();

// Public endpoints
router.get('/', getAllAdopts);
router.get('/current', getCurrentMonthAdopts);
router.get('/months', getMonthsWithData);
router.get('/check-daypass/:trainerId', checkDaycareDaypass);
router.get('/:year/:month', getAdoptsByYearAndMonth);

// Authenticated endpoints
router.get('/berries/:trainerId', authenticate, getBerriesForAdoption);
router.get('/pastries/:trainerId', authenticate, getPastriesForAdoption);
router.post('/claim', authenticate, claimAdopt);

// Admin endpoints
router.post('/generate', authenticate, requireAdmin, generateMonthlyAdopts);
router.post('/generate-test-data', authenticate, requireAdmin, generateTestData);
router.post('/add-daypass/:trainerId', authenticate, requireAdmin, addDaycareDaypass);

export default router;
