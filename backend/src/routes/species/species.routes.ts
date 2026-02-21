import { Router } from 'express';
import { optionalAuth } from '../../middleware/auth.middleware';
import {
  getSpeciesImages,
  getRandomSpecies,
  getSpeciesList,
  searchSpecies,
  rollSpecies,
  postSpeciesImages,
} from '../../controllers/species/species.controller';

const router = Router();

// GET endpoints (query-param based)
router.get('/images', getSpeciesImages);
router.get('/random', optionalAuth, getRandomSpecies);
router.get('/list', getSpeciesList);
router.get('/search', searchSpecies);

// POST endpoints (body-based, used by town components)
router.post('/roll', optionalAuth, rollSpecies);
router.post('/images', postSpeciesImages);

export default router;
