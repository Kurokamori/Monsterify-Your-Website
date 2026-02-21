import { Request, Response } from 'express';
import { BreedingService } from '../../services/breeding.service';

const breedingService = new BreedingService();

// =============================================================================
// Breed Monsters
// =============================================================================

export async function breedMonsters(req: Request, res: Response): Promise<void> {
  try {
    const { trainerId, parent1Id, parent2Id, extraItems } = req.body as {
      trainerId?: number;
      parent1Id?: number;
      parent2Id?: number;
      extraItems?: Record<string, number>;
    };
    const userId = req.user?.discord_id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    if (!trainerId || !parent1Id || !parent2Id) {
      res.status(400).json({
        success: false,
        message: 'Missing required parameters: trainerId, parent1Id, parent2Id',
      });
      return;
    }

    const result = await breedingService.breedMonsters(trainerId, parent1Id, parent2Id, userId, extraItems);

    res.json({
      success: true,
      message: 'Breeding successful',
      data: result,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Server error';
    console.error('Error in breedMonsters:', error);
    if (msg.includes('not found')) {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    if (msg.includes('only breed with your own') || msg.includes('not eligible')) {
      res.status(400).json({ success: false, message: msg });
      return;
    }
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Check Breeding Eligibility
// =============================================================================

export async function checkBreedingEligibility(req: Request, res: Response): Promise<void> {
  try {
    const { monsterId } = req.body as { monsterId?: number };

    if (!monsterId) {
      res.status(400).json({ success: false, message: 'Missing required parameter: monsterId' });
      return;
    }

    const result = await breedingService.checkMonsterEligibility(monsterId);

    res.json({
      success: true,
      eligible: result.eligible,
      reason: result.reason,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Server error';
    console.error('Error in checkBreedingEligibility:', error);
    if (msg.includes('not found')) {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Batch Check Breeding Eligibility
// =============================================================================

export async function batchCheckBreedingEligibility(req: Request, res: Response): Promise<void> {
  try {
    const { monsterIds } = req.body as { monsterIds?: number[] };

    if (!monsterIds || !Array.isArray(monsterIds) || monsterIds.length === 0) {
      res.status(400).json({ success: false, message: 'Missing required parameter: monsterIds (array)' });
      return;
    }

    const eligibleIds = await breedingService.getEligibleMonsterIds(monsterIds);

    res.json({
      success: true,
      eligibleIds,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Server error';
    console.error('Error in batchCheckBreedingEligibility:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Claim Breeding Result
// =============================================================================

export async function claimBreedingResult(req: Request, res: Response): Promise<void> {
  try {
    const { sessionId, monsterIndex, name, trainerId } = req.body as {
      sessionId?: string;
      monsterIndex?: number;
      name?: string;
      trainerId?: number;
    };
    const userId = req.user?.discord_id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    if (!sessionId || monsterIndex === undefined) {
      res.status(400).json({
        success: false,
        message: 'Missing required parameters: sessionId, monsterIndex',
      });
      return;
    }

    const result = await breedingService.claimBreedingResult(sessionId, monsterIndex, userId, name, trainerId);

    res.json({
      success: true,
      message: 'Monster claimed successfully',
      data: result,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Server error';
    console.error('Error in claimBreedingResult:', error);
    if (msg.includes('session not found')) {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    if (msg.includes('only access your own')) {
      res.status(403).json({ success: false, message: msg });
      return;
    }
    if (msg.includes('Invalid monster index') || msg.includes('already been claimed')) {
      res.status(400).json({ success: false, message: msg });
      return;
    }
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Reroll Breeding Results
// =============================================================================

export async function rerollBreedingResults(req: Request, res: Response): Promise<void> {
  try {
    const { sessionId } = req.body as { sessionId?: string };
    const userId = req.user?.discord_id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    if (!sessionId) {
      res.status(400).json({ success: false, message: 'Missing required parameter: sessionId' });
      return;
    }

    const result = await breedingService.rerollBreedingResults(sessionId, userId);

    res.json({
      success: true,
      message: 'Breeding results rerolled successfully',
      data: result,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Server error';
    console.error('Error in rerollBreedingResults:', error);
    if (msg.includes('session not found')) {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    if (msg.includes('only access your own')) {
      res.status(403).json({ success: false, message: msg });
      return;
    }
    if (msg.includes('do not have a Forget-Me-Not')) {
      res.status(400).json({ success: false, message: msg });
      return;
    }
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Get Breeding Session
// =============================================================================

export async function getBreedingSession(req: Request, res: Response): Promise<void> {
  try {
    const sessionId = req.params.sessionId as string;
    const userId = req.user?.discord_id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const session = await breedingService.getBreedingSession(sessionId, userId);

    res.json({
      success: true,
      data: session,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Server error';
    console.error('Error in getBreedingSession:', error);
    if (msg.includes('session not found')) {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    if (msg.includes('only access your own')) {
      res.status(403).json({ success: false, message: msg });
      return;
    }
    res.status(500).json({ success: false, message: msg });
  }
}
