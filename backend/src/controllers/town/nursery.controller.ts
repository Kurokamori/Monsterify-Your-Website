import { Request, Response } from 'express';
import { NurseryService } from '../../services/nursery.service';
import type { SelectMonsterInput } from '../../services/nursery.service';
import type { SpeciesInputs } from '../../services/egg-hatcher.service';

const nurseryService = new NurseryService();

// ============================================================================
// Controllers
// ============================================================================

export async function getTrainerEggs(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.discord_id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const trainerId = parseInt(req.params.trainerId as string, 10);
    const result = await nurseryService.getTrainerEggs(trainerId, userId);

    if (!result.success) {
      res.status(result.status).json({ success: false, message: result.message });
      return;
    }

    res.json(result);
  } catch (error) {
    console.error('Error getting trainer eggs:', error);
    res.status(500).json({ success: false, message: 'Failed to get trainer eggs' });
  }
}

export async function getEggItems(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.discord_id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const trainerId = parseInt(req.params.trainerId as string, 10);
    const result = await nurseryService.getEggItems(trainerId, userId);

    if (!result.success) {
      res.status(result.status).json({ success: false, message: result.message });
      return;
    }

    res.json(result);
  } catch (error) {
    console.error('Error getting egg items:', error);
    res.status(500).json({ success: false, message: 'Failed to get egg items' });
  }
}

export async function startHatch(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.discord_id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const { trainerId, eggCount, useIncubator, useVoidStone, imageUrl } = req.body as {
      trainerId: number;
      eggCount: string | number;
      useIncubator: string | boolean;
      useVoidStone: string | boolean;
      imageUrl?: string;
    };

    const result = await nurseryService.startHatch({
      trainerId,
      userId,
      eggCount: parseInt(String(eggCount), 10),
      useIncubator: useIncubator === 'true' || useIncubator === true,
      useVoidStone: useVoidStone === 'true' || useVoidStone === true,
      imageUrl,
      file: req.file,
      rollerSettings: req.user?.monster_roller_settings ?? null,
    });

    if (!result.success) {
      res.status(result.status).json({ success: false, message: result.message });
      return;
    }

    res.json(result);
  } catch (error) {
    console.error('Error starting hatch:', error);
    res.status(500).json({ success: false, message: 'Failed to start hatching' });
  }
}

export async function startNurture(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.discord_id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const body = req.body as {
      trainerId: number;
      eggCount: string | number;
      useIncubator: string | boolean;
      useVoidStone: string | boolean;
      imageUrl?: string;
      selectedItems?: string | Record<string, number>;
      speciesInputs?: string | SpeciesInputs;
    };

    let selectedItems: Record<string, number> = {};
    if (typeof body.selectedItems === 'string') {
      try { selectedItems = JSON.parse(body.selectedItems); } catch { /* empty */ }
    } else if (body.selectedItems) {
      selectedItems = body.selectedItems;
    }

    let speciesInputs: SpeciesInputs = {};
    if (typeof body.speciesInputs === 'string') {
      try { speciesInputs = JSON.parse(body.speciesInputs); } catch { /* empty */ }
    } else if (body.speciesInputs) {
      speciesInputs = body.speciesInputs;
    }

    const result = await nurseryService.startNurture({
      trainerId: body.trainerId,
      userId,
      eggCount: parseInt(String(body.eggCount), 10),
      useIncubator: body.useIncubator === 'true' || body.useIncubator === true,
      useVoidStone: body.useVoidStone === 'true' || body.useVoidStone === true,
      imageUrl: body.imageUrl,
      file: req.file,
      selectedItems,
      speciesInputs,
      rollerSettings: req.user?.monster_roller_settings ?? null,
    });

    if (!result.success) {
      res.status(result.status).json({ success: false, message: result.message });
      return;
    }

    res.json(result);
  } catch (error) {
    console.error('Error starting nurture:', error);
    res.status(500).json({ success: false, message: 'Failed to start nurturing' });
  }
}

export async function getHatchSession(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.discord_id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const sessionId = req.params.sessionId as string;
    const result = nurseryService.getSession(sessionId, userId);

    if (!result.success) {
      res.status(result.status).json({ success: false, message: result.message });
      return;
    }

    res.json(result);
  } catch (error) {
    console.error('Error getting hatch session:', error);
    res.status(500).json({ success: false, message: 'Failed to get hatch session' });
  }
}

export async function selectHatchedMonster(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.discord_id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const input = req.body as SelectMonsterInput;
    const result = await nurseryService.selectMonster(input, userId);

    if (!result.success) {
      res.status(result.status).json({ success: false, message: result.message });
      return;
    }

    res.json(result);
  } catch (error) {
    console.error('Error selecting hatched monster:', error);
    res.status(500).json({ success: false, message: 'Failed to select hatched monster' });
  }
}

export async function rerollHatchingResults(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.discord_id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const { sessionId } = req.body as { sessionId: string };
    if (!sessionId) {
      res.status(400).json({ success: false, message: 'Missing required parameter: sessionId' });
      return;
    }

    const result = await nurseryService.rerollResults(sessionId, userId);

    if (!result.success) {
      res.status(result.status).json({ success: false, message: result.message });
      return;
    }

    res.json(result);
  } catch (error) {
    console.error('Error rerolling hatching results:', error);
    res.status(500).json({ success: false, message: 'Failed to reroll hatching results' });
  }
}
