import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import {
  executeTrade,
  getTradeHistory,
  getAvailableTrainers,
  getTrainerMonsters,
  getTrainerInventory,
} from '../../controllers/town/trade.controller';

const router = Router();

// All trade routes require authentication
router.post('/execute', authenticate, executeTrade);
router.get('/history/:trainerId', authenticate, getTradeHistory);
router.get('/trainers', authenticate, getAvailableTrainers);
router.get('/trainers/:trainerId/monsters', authenticate, getTrainerMonsters);
router.get('/trainers/:trainerId/inventory', authenticate, getTrainerInventory);

export default router;
