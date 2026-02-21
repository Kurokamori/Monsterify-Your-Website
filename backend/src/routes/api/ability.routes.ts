import { Router } from 'express';
import {
  getAbilities,
  getAbilityTypes,
  getAbilityNames,
  getAbilityByName,
} from '../../controllers/api/ability.controller';

const router = Router();

// Routes for /api/abilities

// Get all abilities with filtering, search, pagination (public)
router.get('/', getAbilities);

// Get all unique ability types (public)
router.get('/types', getAbilityTypes);

// Get ability names for autocomplete (public)
router.get('/names', getAbilityNames);

// Get ability by name (public)
router.get('/:name', getAbilityByName);

export default router;
