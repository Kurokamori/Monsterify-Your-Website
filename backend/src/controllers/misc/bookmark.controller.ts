import { Request, Response } from 'express';
import { BookmarkService } from '../../services/bookmark.service';
import { BookmarkItemType } from '../../repositories';

const bookmarkService = new BookmarkService();

// =============================================================================
// Category Endpoints
// =============================================================================

export async function getCategories(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const categories = await bookmarkService.getCategories(req.user.id);
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Error getting bookmark categories:', error);
    res.status(500).json({ success: false, message: 'Error getting categories' });
  }
}

export async function getCategoryById(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const id = parseInt(req.params.id as string);
    const category = await bookmarkService.getCategoryById(id, req.user.id);

    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found' });
      return;
    }

    res.json({ success: true, data: category });
  } catch (error) {
    console.error('Error getting bookmark category:', error);
    res.status(500).json({ success: false, message: 'Error getting category' });
  }
}

export async function createCategory(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { title, sort_order } = req.body as { title?: string; sort_order?: number };

    if (!title || title.trim().length === 0) {
      res.status(400).json({ success: false, message: 'Title is required' });
      return;
    }

    const category = await bookmarkService.createCategory(req.user.id, title.trim(), sort_order);
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    console.error('Error creating bookmark category:', error);
    res.status(500).json({ success: false, message: 'Error creating category' });
  }
}

export async function updateCategory(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const id = parseInt(req.params.id as string);
    const { title, sort_order } = req.body as { title?: string; sort_order?: number };

    if (!title || title.trim().length === 0) {
      res.status(400).json({ success: false, message: 'Title is required' });
      return;
    }

    const category = await bookmarkService.updateCategory(id, req.user.id, title.trim(), sort_order);

    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found' });
      return;
    }

    res.json({ success: true, data: category });
  } catch (error) {
    console.error('Error updating bookmark category:', error);
    res.status(500).json({ success: false, message: 'Error updating category' });
  }
}

export async function deleteCategory(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const id = parseInt(req.params.id as string);
    const deleted = await bookmarkService.deleteCategory(id, req.user.id);

    if (!deleted) {
      res.status(404).json({ success: false, message: 'Category not found' });
      return;
    }

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting bookmark category:', error);
    res.status(500).json({ success: false, message: 'Error deleting category' });
  }
}

// =============================================================================
// Item Endpoints
// =============================================================================

export async function getCategoryItems(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const categoryId = parseInt(req.params.categoryId as string);
    const data = await bookmarkService.getCategoryItems(categoryId, req.user.id);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error getting bookmark items:', error);
    res.status(500).json({ success: false, message: 'Error getting items' });
  }
}

export async function addItem(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const categoryId = parseInt(req.params.categoryId as string);
    const { item_type, item_id, pos_x, pos_y, card_width } = req.body as {
      item_type?: string;
      item_id?: number;
      pos_x?: number;
      pos_y?: number;
      card_width?: number;
    };

    if (!item_type || !item_id) {
      res.status(400).json({ success: false, message: 'Item type and item ID are required' });
      return;
    }

    if (!['trainer', 'monster'].includes(item_type)) {
      res.status(400).json({ success: false, message: 'Item type must be "trainer" or "monster"' });
      return;
    }

    const item = await bookmarkService.addItem(
      categoryId,
      req.user.id,
      item_type as BookmarkItemType,
      item_id,
      pos_x,
      pos_y,
      card_width,
    );

    res.status(201).json({ success: true, data: item });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to add item';
    console.error('Error adding bookmark item:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

export async function updateItemPosition(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const id = parseInt(req.params.id as string);
    const { pos_x, pos_y, card_width, card_height } = req.body as {
      pos_x?: number; pos_y?: number; card_width?: number; card_height?: number | null;
    };

    if (pos_x === undefined || pos_y === undefined) {
      res.status(400).json({ success: false, message: 'pos_x and pos_y are required' });
      return;
    }

    const item = await bookmarkService.updateItemPosition(id, req.user.id, pos_x, pos_y, card_width, card_height);

    if (!item) {
      res.status(404).json({ success: false, message: 'Item not found' });
      return;
    }

    res.json({ success: true, data: item });
  } catch (error) {
    console.error('Error updating bookmark item position:', error);
    res.status(500).json({ success: false, message: 'Error updating position' });
  }
}

export async function bulkUpdatePositions(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { positions } = req.body as {
      positions?: Array<{ id: number; pos_x: number; pos_y: number }>;
    };

    if (!positions || !Array.isArray(positions)) {
      res.status(400).json({ success: false, message: 'positions array is required' });
      return;
    }

    const mapped = positions.map(p => ({ id: p.id, posX: p.pos_x, posY: p.pos_y }));
    await bookmarkService.bulkUpdatePositions(mapped, req.user.id);

    res.json({ success: true, message: 'Positions updated' });
  } catch (error) {
    console.error('Error bulk updating positions:', error);
    res.status(500).json({ success: false, message: 'Error updating positions' });
  }
}

export async function removeItem(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const id = parseInt(req.params.id as string);
    const deleted = await bookmarkService.removeItem(id, req.user.id);

    if (!deleted) {
      res.status(404).json({ success: false, message: 'Item not found' });
      return;
    }

    res.json({ success: true, message: 'Item removed successfully' });
  } catch (error) {
    console.error('Error removing bookmark item:', error);
    res.status(500).json({ success: false, message: 'Error removing item' });
  }
}

// =============================================================================
// Note Endpoints
// =============================================================================

export async function addNote(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const categoryId = parseInt(req.params.categoryId as string);
    const { content, pos_x, pos_y, font_size, width, color } = req.body as {
      content?: string;
      pos_x?: number;
      pos_y?: number;
      font_size?: number;
      width?: number;
      color?: string;
    };

    const note = await bookmarkService.addNote(
      categoryId, req.user.id, content, pos_x, pos_y, font_size, width, color,
    );

    res.status(201).json({ success: true, data: note });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to add note';
    console.error('Error adding bookmark note:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

export async function updateNote(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const id = parseInt(req.params.id as string);
    const { content, pos_x, pos_y, font_size, width, color } = req.body as {
      content?: string;
      pos_x?: number;
      pos_y?: number;
      font_size?: number;
      width?: number;
      color?: string;
    };

    const note = await bookmarkService.updateNote(id, req.user.id, {
      content, posX: pos_x, posY: pos_y, fontSize: font_size, width, color,
    });

    if (!note) {
      res.status(404).json({ success: false, message: 'Note not found' });
      return;
    }

    res.json({ success: true, data: note });
  } catch (error) {
    console.error('Error updating bookmark note:', error);
    res.status(500).json({ success: false, message: 'Error updating note' });
  }
}

export async function removeNote(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const id = parseInt(req.params.id as string);
    const deleted = await bookmarkService.removeNote(id, req.user.id);

    if (!deleted) {
      res.status(404).json({ success: false, message: 'Note not found' });
      return;
    }

    res.json({ success: true, message: 'Note removed successfully' });
  } catch (error) {
    console.error('Error removing bookmark note:', error);
    res.status(500).json({ success: false, message: 'Error removing note' });
  }
}
