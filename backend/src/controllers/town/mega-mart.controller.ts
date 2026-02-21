import { Request, Response } from 'express';
import { MegaMartService } from '../../services/mega-mart.service';

const megaMartService = new MegaMartService();

// =============================================================================
// Abilities
// =============================================================================

export async function getMonsterAbilities(req: Request, res: Response): Promise<void> {
  try {
    const monsterId = parseInt(req.params.id as string);
    const abilities = await megaMartService.getMonsterAbilities(monsterId);
    res.json({ success: true, abilities });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error getting monster abilities';
    console.error('Error getting monster abilities:', error);
    if (msg === 'Monster not found') {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    res.status(500).json({ success: false, message: msg });
  }
}

export async function useAbilityCapsule(req: Request, res: Response): Promise<void> {
  try {
    const { monsterId, trainerId } = req.body as {
      monsterId?: number;
      trainerId?: number;
    };

    if (!monsterId || !trainerId) {
      res.status(400).json({
        success: false,
        message: 'monsterId and trainerId are required',
      });
      return;
    }

    const result = await megaMartService.useAbilityCapsule(monsterId, trainerId);
    res.json({ success: true, ...result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error using Ability Capsule';
    console.error('Error using Ability Capsule:', error);

    if (msg.includes('not found')) {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    if (msg.includes('does not belong') || msg.includes('does not have') || msg.includes('must have')) {
      res.status(400).json({ success: false, message: msg });
      return;
    }
    res.status(500).json({ success: false, message: msg });
  }
}

export async function useScrollOfSecrets(req: Request, res: Response): Promise<void> {
  try {
    const { monsterId, trainerId, abilityName, abilitySlot } = req.body as {
      monsterId?: number;
      trainerId?: number;
      abilityName?: string;
      abilitySlot?: string;
    };

    if (!monsterId || !trainerId || !abilityName || !abilitySlot) {
      res.status(400).json({
        success: false,
        message: 'monsterId, trainerId, abilityName, and abilitySlot are required',
      });
      return;
    }

    if (abilitySlot !== 'ability1' && abilitySlot !== 'ability2') {
      res.status(400).json({
        success: false,
        message: 'abilitySlot must be "ability1" or "ability2"',
      });
      return;
    }

    const result = await megaMartService.useScrollOfSecrets(
      monsterId,
      trainerId,
      abilityName,
      abilitySlot,
    );
    res.json({ success: true, ...result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error using Scroll of Secrets';
    console.error('Error using Scroll of Secrets:', error);

    if (msg.includes('not found')) {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    if (msg.includes('does not belong') || msg.includes('does not have')) {
      res.status(400).json({ success: false, message: msg });
      return;
    }
    res.status(500).json({ success: false, message: msg });
  }
}

export async function getAllAbilities(req: Request, res: Response): Promise<void> {
  try {
    const {
      page = '1',
      limit = '20',
      search = '',
      sortBy = 'name',
      sortOrder = 'asc',
    } = req.query as {
      page?: string;
      limit?: string;
      search?: string;
      sortBy?: string;
      sortOrder?: string;
    };

    const result = await megaMartService.getAllAbilities({
      page: parseInt(page),
      limit: parseInt(limit),
      search: search || undefined,
      sortBy: sortBy === 'effect' ? 'effect' : 'name',
      sortOrder: sortOrder === 'desc' ? 'desc' : 'asc',
    });

    res.json({
      success: true,
      data: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    console.error('Error getting abilities:', error);
    res.status(500).json({ success: false, message: 'Error getting abilities' });
  }
}
