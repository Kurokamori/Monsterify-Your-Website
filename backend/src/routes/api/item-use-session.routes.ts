import { Router } from 'express';
import { authenticate } from '@middleware/auth.middleware';
import {
  getItemUseSession,
  saveItemUseSession,
  deleteItemUseSession,
} from '@controllers/api/item-use-session.controller';

const router = Router();

router.get('/:sessionType', authenticate, getItemUseSession);
router.post('/', authenticate, saveItemUseSession);
router.delete('/:sessionType', authenticate, deleteItemUseSession);

export default router;
