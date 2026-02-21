import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import {
  getMonsterAbilities,
  useAbilityCapsule,
  useScrollOfSecrets,
  getAllAbilities,
} from '../../controllers/town/mega-mart.controller';

const router = Router();

// All mega-mart routes require authentication
router.use(authenticate);

// ============================================================================
// Ability Routes
// ============================================================================

router.get('/monster/:id/abilities', getMonsterAbilities);
router.post('/use-ability-capsule', useAbilityCapsule);
router.post('/use-scroll-of-secrets', useScrollOfSecrets);
router.get('/abilities', getAllAbilities);

export default router;
