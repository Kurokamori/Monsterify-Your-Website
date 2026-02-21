import { Router } from 'express';
import {
  getEvolutionOptionsBySpecies,
  getReverseEvolutionOptions,
} from '@controllers/api/evolution.controller';

const router = Router();

// Routes for /api/evolution

// Get evolution options by species name (public)
router.get('/options/:speciesName', getEvolutionOptionsBySpecies);

// Get reverse evolution options - what evolves into this species (public)
router.get('/reverse/:speciesName', getReverseEvolutionOptions);

export default router;
