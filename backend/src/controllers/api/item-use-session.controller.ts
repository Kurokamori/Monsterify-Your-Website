import { Request, Response } from 'express';
import { ItemUseSessionService } from '../../services/item-use-session.service';
import type { ItemUseSessionType } from '../../repositories';

const VALID_SESSION_TYPES: ItemUseSessionType[] = ['apothecary', 'adoption_item', 'mass_edit'];
const service = new ItemUseSessionService();

function isValidSessionType(value: unknown): value is ItemUseSessionType {
  if (typeof value !== 'string') {
    return false;
  }
  return VALID_SESSION_TYPES.includes(value as ItemUseSessionType);
}

export async function getItemUseSession(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.discord_id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { sessionType } = req.params;
    if (!isValidSessionType(sessionType)) {
      res.status(400).json({ success: false, message: 'Invalid session type' });
      return;
    }

    const session = await service.getSession(userId, sessionType);
    res.json({ success: true, session });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error fetching item-use session';
    console.error('Error fetching item-use session:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

export async function saveItemUseSession(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.discord_id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { sessionType, sessionData } = req.body;
    if (!isValidSessionType(sessionType)) {
      res.status(400).json({ success: false, message: 'Invalid session type' });
      return;
    }
    if (!sessionData || typeof sessionData !== 'object') {
      res.status(400).json({ success: false, message: 'sessionData is required' });
      return;
    }

    const session = await service.saveSession(userId, sessionType, sessionData);
    res.json({ success: true, session });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error saving item-use session';
    console.error('Error saving item-use session:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

export async function deleteItemUseSession(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.discord_id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { sessionType } = req.params;
    if (!isValidSessionType(sessionType)) {
      res.status(400).json({ success: false, message: 'Invalid session type' });
      return;
    }

    await service.deleteSession(userId, sessionType);
    res.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error deleting item-use session';
    console.error('Error deleting item-use session:', error);
    res.status(500).json({ success: false, message: msg });
  }
}
