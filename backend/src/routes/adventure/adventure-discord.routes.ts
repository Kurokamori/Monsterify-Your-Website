import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { AdventureRepository } from '../../repositories';
import { db } from '../../database';
import {
  createAdventureThread,
  getAdventureByThreadId,
  trackMessage,
  generateEncounter,
  attemptCapture,
  resolveBattle,
  endAdventure,
  getUnclaimedRewards,
  claimRewardsDiscord,
  initiateBattle,
  executeAttack,
  useItemInBattle,
  getBattleStatus,
  initiatePvPBattle,
  releaseMonster,
  withdrawMonster,
  setBattleWeather,
  setBattleTerrain,
  forceWinBattle,
  forceLoseBattle,
  setWinCondition,
  forfeitBattle,
  fleeBattle,
  getUserByDiscordId,
} from '../../controllers/adventure/adventure-discord.controller';

const router = Router();
const adventureRepository = new AdventureRepository();

// =============================================================================
// Middleware
// =============================================================================

async function requireNonCustomAdventure(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let adventureId: number | undefined = (req.body as Record<string, unknown>).adventureId as number | undefined;

    if (!adventureId && req.params.adventureId) {
      const paramValue = Array.isArray(req.params.adventureId) ? req.params.adventureId[0] : req.params.adventureId;
      adventureId = parseInt(paramValue ?? '', 10) || undefined;
    }

    // For capture routes, resolve adventure ID from encounter
    if (!adventureId && (req.body as Record<string, unknown>).encounterId) {
      const encounterId = (req.body as Record<string, unknown>).encounterId as number;
      const result = await db.query<{ adventure_id: number }>(
        'SELECT adventure_id FROM adventure_encounters WHERE id = $1',
        [encounterId],
      );
      const row = result.rows[0];
      if (row) {
        adventureId = row.adventure_id;
      }
    }

    if (!adventureId) {
      res.status(400).json({ success: false, message: 'Missing adventureId' });
      return;
    }

    const adventure = await adventureRepository.findById(adventureId);
    if (!adventure) {
      res.status(404).json({ success: false, message: 'Adventure not found' });
      return;
    }

    if (!adventure.landmassId) {
      res.status(403).json({
        success: false,
        message: 'Encounters and battles are only available for area-based adventures, not custom adventures',
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Error checking adventure type:', error);
    res.status(500).json({ success: false, message: 'Failed to validate adventure type' });
  }
}

// =============================================================================
// Thread Management Routes
// =============================================================================

router.post('/thread', createAdventureThread);
router.get('/thread/:discordThreadId', getAdventureByThreadId);

// =============================================================================
// Message Tracking Routes
// =============================================================================

router.post('/message', trackMessage);

// =============================================================================
// Encounter Routes
// =============================================================================

router.post('/encounter', requireNonCustomAdventure, generateEncounter);
router.post('/capture', requireNonCustomAdventure, attemptCapture);

// =============================================================================
// Battle Routes
// =============================================================================

router.post('/battle/initiate', requireNonCustomAdventure, initiateBattle);
router.post('/battle/attack', requireNonCustomAdventure, executeAttack);
router.post('/battle/use-item', requireNonCustomAdventure, useItemInBattle);
router.get('/battle/status/:adventureId', requireNonCustomAdventure, getBattleStatus);
router.post('/battle/pvp', requireNonCustomAdventure, initiatePvPBattle);
router.post('/battle/release', requireNonCustomAdventure, releaseMonster);
router.post('/battle/withdraw', requireNonCustomAdventure, withdrawMonster);
router.post('/battle/weather', requireNonCustomAdventure, setBattleWeather);
router.post('/battle/terrain', requireNonCustomAdventure, setBattleTerrain);
router.post('/battle/resolve', requireNonCustomAdventure, resolveBattle);
router.post('/battle/forcewin', requireNonCustomAdventure, forceWinBattle);
router.post('/battle/forcelose', requireNonCustomAdventure, forceLoseBattle);
router.post('/battle/win-condition', requireNonCustomAdventure, setWinCondition);
router.post('/battle/forfeit', requireNonCustomAdventure, forfeitBattle);
router.post('/battle/flee', requireNonCustomAdventure, fleeBattle);

// =============================================================================
// Adventure End & Reward Routes
// =============================================================================

router.post('/end', endAdventure);
router.get('/rewards/unclaimed/:discordUserId', getUnclaimedRewards);
router.post('/rewards/claim', authenticate, claimRewardsDiscord);

// =============================================================================
// User Lookup Routes
// =============================================================================

router.get('/user/:discordUserId', getUserByDiscordId);

export default router;
