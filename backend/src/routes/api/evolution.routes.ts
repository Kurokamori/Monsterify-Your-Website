import { Router } from 'express';
import { authenticate, requireAdmin } from '@middleware/auth.middleware';
import {
  getEvolutionOptionsBySpecies,
  getReverseEvolutionOptions,
  getSpeciesTablesByName,
  getEvolutionCacheVersion,
  bumpEvolutionCacheVersion,
} from '@controllers/api/evolution.controller';

const router = Router();

// Routes for /api/evolution

// Get evolution options by species name (public)
router.get('/options/:speciesName', getEvolutionOptionsBySpecies);

// Get reverse evolution options - what evolves into this species (public)
router.get('/reverse/:speciesName', getReverseEvolutionOptions);

// Get every franchise/table a species name appears in (public, for disambiguation)
router.get('/tables/:speciesName', getSpeciesTablesByName);

// Cache-busting version for the Evolution Explorer client cache
router.get('/cache-version', getEvolutionCacheVersion);
router.post('/cache-version/bump', authenticate, requireAdmin, bumpEvolutionCacheVersion);

export default router;
