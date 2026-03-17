import { Request, Response } from 'express';
import { AdminConnectService } from '../../services/admin-connect.service';

const service = new AdminConnectService();

// ── Public endpoints ────────────────────────────────────────────

export async function getAdminConnectItems(_req: Request, res: Response): Promise<void> {
  try {
    const items = await service.getAllItems();
    res.json({ success: true, data: items });
  } catch (error) {
    console.error('Error fetching admin connect items:', error);
    res.status(500).json({ success: false, message: 'Error fetching items' });
  }
}

export async function getAdminConnectItem(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid item ID' });
      return;
    }
    const item = await service.getItemById(id);
    if (!item) {
      res.status(404).json({ success: false, message: 'Item not found' });
      return;
    }
    res.json({ success: true, data: item });
  } catch (error) {
    console.error('Error fetching admin connect item:', error);
    res.status(500).json({ success: false, message: 'Error fetching item' });
  }
}

// ── Admin endpoints ─────────────────────────────────────────────

export async function createAdminConnectItem(req: Request, res: Response): Promise<void> {
  try {
    const { name, description, secretName, isSecret, category, status, urgency, difficulty, progress, priority, dataFields } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({ success: false, message: 'Name is required' });
      return;
    }
    const item = await service.createItem({
      name: name.trim(),
      description: description?.trim() ?? null,
      secretName: secretName?.trim() ?? null,
      isSecret: isSecret ?? false,
      category: category ?? 'misc',
      status: status ?? 'open',
      urgency: urgency ?? 'normal',
      difficulty: difficulty ?? 'normal',
      progress: progress ?? 0,
      priority: priority ?? 0,
      dataFields: dataFields ?? [],
      createdBy: req.user?.id ?? null,
    });
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    console.error('Error creating admin connect item:', error);
    res.status(500).json({ success: false, message: 'Error creating item' });
  }
}

export async function updateAdminConnectItem(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid item ID' });
      return;
    }
    const item = await service.updateItem(id, req.body);
    if (!item) {
      res.status(404).json({ success: false, message: 'Item not found' });
      return;
    }
    res.json({ success: true, data: item });
  } catch (error) {
    console.error('Error updating admin connect item:', error);
    res.status(500).json({ success: false, message: 'Error updating item' });
  }
}

export async function resolveAdminConnectItem(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid item ID' });
      return;
    }
    const item = await service.resolveItem(id);
    if (!item) {
      res.status(404).json({ success: false, message: 'Item not found' });
      return;
    }
    res.json({ success: true, data: item });
  } catch (error) {
    console.error('Error resolving admin connect item:', error);
    res.status(500).json({ success: false, message: 'Error resolving item' });
  }
}

export async function reopenAdminConnectItem(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid item ID' });
      return;
    }
    const item = await service.reopenItem(id);
    if (!item) {
      res.status(404).json({ success: false, message: 'Item not found' });
      return;
    }
    res.json({ success: true, data: item });
  } catch (error) {
    console.error('Error reopening admin connect item:', error);
    res.status(500).json({ success: false, message: 'Error reopening item' });
  }
}

export async function deleteAdminConnectItem(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid item ID' });
      return;
    }
    const deleted = await service.deleteItem(id);
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Item not found' });
      return;
    }
    res.json({ success: true, message: 'Item deleted' });
  } catch (error) {
    console.error('Error deleting admin connect item:', error);
    res.status(500).json({ success: false, message: 'Error deleting item' });
  }
}

export async function reorderAdminConnectItems(req: Request, res: Response): Promise<void> {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds) || orderedIds.some((id: unknown) => typeof id !== 'number')) {
      res.status(400).json({ success: false, message: 'orderedIds must be an array of numbers' });
      return;
    }
    await service.reorderItems(orderedIds);
    res.json({ success: true, message: 'Priorities updated' });
  } catch (error) {
    console.error('Error reordering admin connect items:', error);
    res.status(500).json({ success: false, message: 'Error reordering items' });
  }
}

// ── Sub-items (admin-only) ──────────────────────────────────────

export async function createAdminConnectSubItem(req: Request, res: Response): Promise<void> {
  try {
    const itemId = Number(req.params.itemId);
    if (Number.isNaN(itemId)) {
      res.status(400).json({ success: false, message: 'Invalid item ID' });
      return;
    }
    const { name, description, sortOrder } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({ success: false, message: 'Name is required' });
      return;
    }
    const sub = await service.createSubItem({
      itemId,
      name: name.trim(),
      description: description?.trim() ?? null,
      sortOrder: sortOrder ?? 0,
    });
    res.status(201).json({ success: true, data: sub });
  } catch (error) {
    console.error('Error creating sub-item:', error);
    res.status(500).json({ success: false, message: 'Error creating sub-item' });
  }
}

export async function updateAdminConnectSubItem(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.subId);
    if (Number.isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid sub-item ID' });
      return;
    }
    const sub = await service.updateSubItem(id, req.body);
    if (!sub) {
      res.status(404).json({ success: false, message: 'Sub-item not found' });
      return;
    }
    res.json({ success: true, data: sub });
  } catch (error) {
    console.error('Error updating sub-item:', error);
    res.status(500).json({ success: false, message: 'Error updating sub-item' });
  }
}

export async function deleteAdminConnectSubItem(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.subId);
    if (Number.isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid sub-item ID' });
      return;
    }
    const deleted = await service.deleteSubItem(id);
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Sub-item not found' });
      return;
    }
    res.json({ success: true, message: 'Sub-item deleted' });
  } catch (error) {
    console.error('Error deleting sub-item:', error);
    res.status(500).json({ success: false, message: 'Error deleting sub-item' });
  }
}

// ── Update Notes ────────────────────────────────────────────────

export async function getUpdateNotes(_req: Request, res: Response): Promise<void> {
  try {
    const content = await service.getUpdateNotes();
    res.json({ success: true, data: content });
  } catch (error) {
    console.error('Error fetching update notes:', error);
    res.status(500).json({ success: false, message: 'Error fetching update notes' });
  }
}

export async function saveUpdateNotes(req: Request, res: Response): Promise<void> {
  try {
    const { content } = req.body;
    if (typeof content !== 'string') {
      res.status(400).json({ success: false, message: 'Content must be a string' });
      return;
    }
    const saved = await service.saveUpdateNotes(content);
    res.json({ success: true, data: saved });
  } catch (error) {
    console.error('Error saving update notes:', error);
    res.status(500).json({ success: false, message: 'Error saving update notes' });
  }
}
