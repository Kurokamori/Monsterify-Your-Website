import { Router } from 'express';
import adminRouter from './area-admin.routes';
import {
  getLandmasses,
  getRegionsForLandmass,
  getAreasForRegion,
  getAreaConfiguration,
  getAreaHierarchy,
  getWorldMapData,
  getLandmassGuide,
  getRegionGuide,
  getAreaGuide,
} from '@controllers/adventure/area.controller';

const router = Router();

// Admin routes (auth protected)
router.use('/admin', adminRouter);

// ============================================================================
// Public Routes (static paths first, then parameterized)
// ============================================================================

// GET /api/areas/hierarchy — Get complete area hierarchy (landmasses -> regions -> areas)
router.get('/hierarchy', getAreaHierarchy);

// GET /api/areas/world-map — Get world map data (all landmasses with coordinates)
router.get('/world-map', getWorldMapData);

// GET /api/areas/landmasses — Get all available landmasses
router.get('/landmasses', getLandmasses);

// GET /api/areas/landmasses/:landmassId/regions — Get regions for a specific landmass
router.get('/landmasses/:landmassId/regions', getRegionsForLandmass);

// GET /api/areas/landmasses/:landmassId/guide — Get landmass guide data
router.get('/landmasses/:landmassId/guide', getLandmassGuide);

// GET /api/areas/regions/:regionId/areas — Get areas for a specific region
router.get('/regions/:regionId/areas', getAreasForRegion);

// GET /api/areas/regions/:regionId/guide — Get region guide data
router.get('/regions/:regionId/guide', getRegionGuide);

// GET /api/areas/:areaId/configuration — Get configuration for a specific area
router.get('/:areaId/configuration', getAreaConfiguration);

// GET /api/areas/:areaId/guide — Get area guide data
router.get('/:areaId/guide', getAreaGuide);

export default router;
