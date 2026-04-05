import { Request, Response } from 'express';
import { ChangelogService } from '../../services/changelog.service';

const service = new ChangelogService();

// ── Public endpoints ────────────────────────────────────────────

export async function getPublishedChangelog(_req: Request, res: Response): Promise<void> {
  try {
    const versions = await service.getPublishedVersions();
    res.json({ success: true, data: versions });
  } catch (error) {
    console.error('Error fetching published changelog:', error);
    res.status(500).json({ success: false, message: 'Error fetching changelog' });
  }
}

export async function getLatestChangelog(_req: Request, res: Response): Promise<void> {
  try {
    const version = await service.getLatestPublished();
    res.json({ success: true, data: version });
  } catch (error) {
    console.error('Error fetching latest changelog:', error);
    res.status(500).json({ success: false, message: 'Error fetching latest changelog' });
  }
}

// ── Admin endpoints ─────────────────────────────────────────────

export async function getAllChangelog(_req: Request, res: Response): Promise<void> {
  try {
    const versions = await service.getAllVersions();
    res.json({ success: true, data: versions });
  } catch (error) {
    console.error('Error fetching all changelog versions:', error);
    res.status(500).json({ success: false, message: 'Error fetching changelog versions' });
  }
}

export async function getChangelogById(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid version ID' });
      return;
    }
    const version = await service.getVersionById(id);
    if (!version) {
      res.status(404).json({ success: false, message: 'Version not found' });
      return;
    }
    res.json({ success: true, data: version });
  } catch (error) {
    console.error('Error fetching changelog version:', error);
    res.status(500).json({ success: false, message: 'Error fetching changelog version' });
  }
}

export async function createChangelog(req: Request, res: Response): Promise<void> {
  try {
    const { version, title, content, isPublished } = req.body;
    if (!version || typeof version !== 'string' || version.trim().length === 0) {
      res.status(400).json({ success: false, message: 'Version is required' });
      return;
    }
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      res.status(400).json({ success: false, message: 'Title is required' });
      return;
    }
    const created = await service.createVersion({
      version: version.trim(),
      title: title.trim(),
      content: content ?? '',
      isPublished: isPublished ?? false,
      createdBy: req.user?.id ?? null,
    });
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    console.error('Error creating changelog version:', error);
    res.status(500).json({ success: false, message: 'Error creating changelog version' });
  }
}

export async function updateChangelog(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid version ID' });
      return;
    }
    const { version, title, content, isPublished } = req.body;
    const updated = await service.updateVersion(id, {
      version: version?.trim(),
      title: title?.trim(),
      content,
      isPublished,
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating changelog version:', error);
    res.status(500).json({ success: false, message: 'Error updating changelog version' });
  }
}

export async function deleteChangelog(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid version ID' });
      return;
    }
    const deleted = await service.deleteVersion(id);
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Version not found' });
      return;
    }
    res.json({ success: true, message: 'Version deleted' });
  } catch (error) {
    console.error('Error deleting changelog version:', error);
    res.status(500).json({ success: false, message: 'Error deleting changelog version' });
  }
}
