import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import {
  getAvailableMonsters,
  getAvailableItems,
  forfeitMonster,
  forfeitMonsters,
  forfeitItem,
  adoptMonster,
  collectItem,
  getUserTrainers,
  getTrainerMonsters,
  getTrainerInventory,
} from '../../controllers/town/bazar.controller';

const router = Router();

// All bazar routes require authentication

// Get available monsters and items
router.get('/monsters', authenticate, getAvailableMonsters);
router.get('/items', authenticate, getAvailableItems);

// Forfeit monsters and items
router.post('/forfeit/monster', authenticate, forfeitMonster);
router.post('/forfeit/monsters', authenticate, forfeitMonsters);
router.post('/forfeit/item', authenticate, forfeitItem);

// Adopt monsters and collect items
router.post('/adopt/monster', authenticate, adoptMonster);
router.post('/collect/item', authenticate, collectItem);

// Helper routes for UI
router.get('/user/trainers', authenticate, getUserTrainers);
router.get('/trainer/:trainerId/monsters', authenticate, getTrainerMonsters);
router.get('/trainer/:trainerId/inventory', authenticate, getTrainerInventory);

export default router;
