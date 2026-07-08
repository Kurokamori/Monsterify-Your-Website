/**
 * Battle Asset Controller
 * Admin CRUD for reusable battle visuals: backgrounds, place-spots, and text-box skins.
 */

import { Request, Response } from 'express';
import {
  BattleAssetRepository,
  BattleAssetKind,
  BATTLE_ASSET_KINDS,
} from '../../repositories/battle-asset.repository';

const assetRepo = new BattleAssetRepository();

const fail = (res: Response, err: unknown, fallback: string): void => {
  const message = err instanceof Error ? err.message : fallback;
  console.error(`[BattleAsset] ${fallback}:`, err);
  res.status(400).json({ success: false, message });
};

const isKind = (value: unknown): value is BattleAssetKind =>
  typeof value === 'string' && BATTLE_ASSET_KINDS.includes(value as BattleAssetKind);

const parseSlice = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') {return null;}
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
};

export async function listBattleAssets(_req: Request, res: Response): Promise<void> {
  try {
    const assets = await assetRepo.findAll();
    res.json({ success: true, assets });
  } catch (err) {
    fail(res, err, 'Failed to list battle assets');
  }
}

export async function createBattleAsset(req: Request, res: Response): Promise<void> {
  try {
    const { kind, name, imgLink, sliceInset, isActive } = req.body as {
      kind?: string;
      name?: string;
      imgLink?: string;
      sliceInset?: number | string | null;
      isActive?: boolean;
    };
    if (!isKind(kind)) {
      res.status(400).json({ success: false, message: 'Invalid asset kind' });
      return;
    }
    if (!name?.trim() || !imgLink?.trim()) {
      res.status(400).json({ success: false, message: 'Name and image are required' });
      return;
    }
    const asset = await assetRepo.create({
      kind,
      name: name.trim(),
      imgLink: imgLink.trim(),
      sliceInset: kind === 'textbox' ? parseSlice(sliceInset) : null,
      isActive: isActive ?? true,
    });
    res.status(201).json({ success: true, asset });
  } catch (err) {
    fail(res, err, 'Failed to create battle asset');
  }
}

export async function updateBattleAsset(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(String(req.params.assetId ?? ''), 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid asset id' });
      return;
    }
    const { kind, name, imgLink, sliceInset, isActive } = req.body as {
      kind?: string;
      name?: string;
      imgLink?: string;
      sliceInset?: number | string | null;
      isActive?: boolean;
    };
    if (kind !== undefined && !isKind(kind)) {
      res.status(400).json({ success: false, message: 'Invalid asset kind' });
      return;
    }
    const asset = await assetRepo.update(id, {
      ...(kind !== undefined ? { kind: kind as BattleAssetKind } : {}),
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(imgLink !== undefined ? { imgLink: imgLink.trim() } : {}),
      ...(sliceInset !== undefined ? { sliceInset: parseSlice(sliceInset) } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
    });
    res.json({ success: true, asset });
  } catch (err) {
    fail(res, err, 'Failed to update battle asset');
  }
}

export async function deleteBattleAsset(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(String(req.params.assetId ?? ''), 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid asset id' });
      return;
    }
    await assetRepo.delete(id);
    res.json({ success: true });
  } catch (err) {
    fail(res, err, 'Failed to delete battle asset');
  }
}
