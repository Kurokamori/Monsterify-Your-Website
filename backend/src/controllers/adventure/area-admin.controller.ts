import { Request, Response } from 'express';
import { AreaDataWriterService } from '../../services/adventure/area-data-writer.service';

const writer = AreaDataWriterService.getInstance();

/** Extract a required string route param. */
function param(req: Request, name: string): string {
  const value = req.params[name];
  if (typeof value !== 'string') {
    throw new Error(`Missing route parameter: ${name}`);
  }
  return value;
}

// ── Landmass ─────────────────────────────────────────────────────────

export async function adminGetLandmass(req: Request, res: Response): Promise<void> {
  try {
    const landmass = writer.getLandmass(param(req, 'id'));
    if (!landmass) {
      res.status(404).json({ success: false, message: 'Landmass not found' });
      return;
    }
    res.json({ success: true, data: landmass });
  } catch (error) {
    console.error('Error in adminGetLandmass:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch landmass' });
  }
}

export async function adminUpdateLandmass(req: Request, res: Response): Promise<void> {
  try {
    const updated = writer.updateLandmass(param(req, 'id'), req.body);
    if (!updated) {
      res.status(404).json({ success: false, message: 'Landmass not found' });
      return;
    }
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error in adminUpdateLandmass:', error);
    res.status(500).json({ success: false, message: 'Failed to update landmass' });
  }
}

export async function adminCreateLandmass(req: Request, res: Response): Promise<void> {
  try {
    if (!req.body.id) {
      res.status(400).json({ success: false, message: 'Landmass ID is required' });
      return;
    }
    const created = writer.createLandmass(req.body);
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    console.error('Error in adminCreateLandmass:', error);
    res.status(500).json({ success: false, message: 'Failed to create landmass' });
  }
}

export async function adminDeleteLandmass(req: Request, res: Response): Promise<void> {
  try {
    const deleted = writer.deleteLandmass(param(req, 'id'));
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Landmass not found' });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error in adminDeleteLandmass:', error);
    res.status(500).json({ success: false, message: 'Failed to delete landmass' });
  }
}

// ── Region ───────────────────────────────────────────────────────────

export async function adminGetRegion(req: Request, res: Response): Promise<void> {
  try {
    const region = writer.getRegion(param(req, 'id'));
    if (!region) {
      res.status(404).json({ success: false, message: 'Region not found' });
      return;
    }
    res.json({ success: true, data: region });
  } catch (error) {
    console.error('Error in adminGetRegion:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch region' });
  }
}

export async function adminUpdateRegion(req: Request, res: Response): Promise<void> {
  try {
    const updated = writer.updateRegion(param(req, 'id'), req.body);
    if (!updated) {
      res.status(404).json({ success: false, message: 'Region not found' });
      return;
    }
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error in adminUpdateRegion:', error);
    res.status(500).json({ success: false, message: 'Failed to update region' });
  }
}

export async function adminCreateRegion(req: Request, res: Response): Promise<void> {
  try {
    if (!req.body.id) {
      res.status(400).json({ success: false, message: 'Region ID is required' });
      return;
    }
    const created = writer.createRegion(req.body);
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    console.error('Error in adminCreateRegion:', error);
    res.status(500).json({ success: false, message: 'Failed to create region' });
  }
}

export async function adminDeleteRegion(req: Request, res: Response): Promise<void> {
  try {
    const deleted = writer.deleteRegion(param(req, 'id'));
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Region not found' });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error in adminDeleteRegion:', error);
    res.status(500).json({ success: false, message: 'Failed to delete region' });
  }
}

// ── Area ─────────────────────────────────────────────────────────────

export async function adminGetArea(req: Request, res: Response): Promise<void> {
  try {
    const area = writer.getArea(param(req, 'id'));
    if (!area) {
      res.status(404).json({ success: false, message: 'Area not found' });
      return;
    }
    res.json({ success: true, data: area });
  } catch (error) {
    console.error('Error in adminGetArea:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch area' });
  }
}

export async function adminUpdateArea(req: Request, res: Response): Promise<void> {
  try {
    const updated = writer.updateArea(param(req, 'id'), req.body);
    if (!updated) {
      res.status(404).json({ success: false, message: 'Area not found' });
      return;
    }
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error in adminUpdateArea:', error);
    res.status(500).json({ success: false, message: 'Failed to update area' });
  }
}

export async function adminCreateArea(req: Request, res: Response): Promise<void> {
  try {
    const { id, ...data } = req.body;
    if (!id) {
      res.status(400).json({ success: false, message: 'Area ID is required' });
      return;
    }
    const created = writer.createArea(id, data);
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    console.error('Error in adminCreateArea:', error);
    res.status(500).json({ success: false, message: 'Failed to create area' });
  }
}

export async function adminDeleteArea(req: Request, res: Response): Promise<void> {
  try {
    const deleted = writer.deleteArea(param(req, 'id'));
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Area not found' });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error in adminDeleteArea:', error);
    res.status(500).json({ success: false, message: 'Failed to delete area' });
  }
}

// ── Coordinates ──────────────────────────────────────────────────────

export async function adminUpdateCoordinates(req: Request, res: Response): Promise<void> {
  try {
    const type = param(req, 'type');
    const id = param(req, 'id');
    const coords = req.body;

    if (coords.x === undefined || coords.y === undefined || coords.width === undefined || coords.height === undefined) {
      res.status(400).json({ success: false, message: 'x, y, width, and height are required' });
      return;
    }

    const entityType = type as 'landmass' | 'region' | 'area';
    if (!['landmass', 'region', 'area'].includes(entityType)) {
      res.status(400).json({ success: false, message: 'Type must be landmass, region, or area' });
      return;
    }

    const success = writer.updateCoordinates(entityType, id, coords);
    if (!success) {
      res.status(404).json({ success: false, message: `${type} not found` });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error in adminUpdateCoordinates:', error);
    res.status(500).json({ success: false, message: 'Failed to update coordinates' });
  }
}
