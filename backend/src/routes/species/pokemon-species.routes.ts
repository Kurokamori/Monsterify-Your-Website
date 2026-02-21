import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware';
import {
  getAllPokemon,
  getPokemonById,
  createPokemon,
  updatePokemon,
  deletePokemon,
} from '../../controllers/species/pokemon-species.controller';

const router = Router();

// Public endpoints
router.get('/', getAllPokemon);
router.get('/:id', getPokemonById);

// Admin endpoints
router.post('/', authenticate, requireAdmin, createPokemon);
router.put('/:id', authenticate, requireAdmin, updatePokemon);
router.delete('/:id', authenticate, requireAdmin, deletePokemon);

export default router;
