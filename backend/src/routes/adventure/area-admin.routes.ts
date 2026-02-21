import { Router } from 'express';
import { authenticate, requireAdmin } from '@middleware/auth.middleware';
import {
  adminGetLandmass,
  adminUpdateLandmass,
  adminCreateLandmass,
  adminDeleteLandmass,
  adminGetRegion,
  adminUpdateRegion,
  adminCreateRegion,
  adminDeleteRegion,
  adminGetArea,
  adminUpdateArea,
  adminCreateArea,
  adminDeleteArea,
  adminUpdateCoordinates
} from '@controllers/adventure/area-admin.controller';

const router = Router();

// All routes require admin auth
router.use(authenticate, requireAdmin);

// Landmass routes
router.get('/landmasses/:id', adminGetLandmass);
router.put('/landmasses/:id', adminUpdateLandmass);
router.post('/landmasses', adminCreateLandmass);
router.delete('/landmasses/:id', adminDeleteLandmass);

// Region routes
router.get('/regions/:id', adminGetRegion);
router.put('/regions/:id', adminUpdateRegion);
router.post('/regions', adminCreateRegion);
router.delete('/regions/:id', adminDeleteRegion);

// Area routes
router.get('/areas/:id', adminGetArea);
router.put('/areas/:id', adminUpdateArea);
router.post('/areas', adminCreateArea);
router.delete('/areas/:id', adminDeleteArea);

// Coordinates route
router.patch('/coordinates/:type/:id', adminUpdateCoordinates);

export default router;
