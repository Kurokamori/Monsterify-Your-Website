import { Router } from 'express';
import { authenticate } from '@middleware/auth.middleware';
import {
  breedMonsters,
  checkBreedingEligibility,
  batchCheckBreedingEligibility,
  claimBreedingResult,
  forfeitBreedingResult,
  rerollBreedingResults,
  getBreedingSession,
  getActiveClutch,
} from '@controllers/town/breeding.controller';

const router = Router();

// All breeding routes require authentication

// Breed monsters
router.post('/', authenticate, breedMonsters);

// Check breeding eligibility for a monster
router.post('/check-eligibility', authenticate, checkBreedingEligibility);

// Batch check breeding eligibility for multiple monsters
router.post('/check-eligibility/batch', authenticate, batchCheckBreedingEligibility);

// Claim a breeding result
router.post('/claim', authenticate, claimBreedingResult);

// Forfeit a breeding result to the bazar
router.post('/forfeit', authenticate, forfeitBreedingResult);

// Reroll breeding results (uses Forget-Me-Not berry)
router.post('/reroll', authenticate, rerollBreedingResults);

// Get active breeding clutch for current user
router.get('/active', authenticate, getActiveClutch);

// Get breeding session details
router.get('/session/:sessionId', authenticate, getBreedingSession);

export default router;
