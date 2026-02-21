import { Request, Response } from 'express';
import { ArtTodoService } from '../../services/art-todo.service';
import { ArtTodoReferenceType } from '../../repositories';

const artTodoService = new ArtTodoService();

// =============================================================================
// Personal Items (cross-list)
// =============================================================================

export async function getPersonalItems(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 3;
    const items = await artTodoService.getPersonalItems(req.user.id, limit);
    res.json({ success: true, items });
  } catch (error) {
    console.error('Error getting personal art todo items:', error);
    res.status(500).json({ success: false, message: 'Error getting personal items' });
  }
}

// =============================================================================
// List Endpoints
// =============================================================================

export async function getLists(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const lists = await artTodoService.getLists(req.user.id);
    res.json({ success: true, data: lists });
  } catch (error) {
    console.error('Error getting art todo lists:', error);
    res.status(500).json({ success: false, message: 'Error getting lists' });
  }
}

export async function getListById(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const id = parseInt(req.params.id as string);
    const list = await artTodoService.getListById(id, req.user.id);

    if (!list) {
      res.status(404).json({ success: false, message: 'List not found' });
      return;
    }

    res.json({ success: true, data: list });
  } catch (error) {
    console.error('Error getting art todo list:', error);
    res.status(500).json({ success: false, message: 'Error getting list' });
  }
}

export async function createList(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { title, description } = req.body as { title?: string; description?: string };

    if (!title || title.trim().length === 0) {
      res.status(400).json({ success: false, message: 'Title is required' });
      return;
    }

    const list = await artTodoService.createList(req.user.id, title.trim(), description?.trim());
    res.status(201).json({ success: true, data: list });
  } catch (error) {
    console.error('Error creating art todo list:', error);
    res.status(500).json({ success: false, message: 'Error creating list' });
  }
}

export async function updateList(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const id = parseInt(req.params.id as string);
    const { title, description } = req.body as { title?: string; description?: string };

    if (!title || title.trim().length === 0) {
      res.status(400).json({ success: false, message: 'Title is required' });
      return;
    }

    const list = await artTodoService.updateList(id, req.user.id, title.trim(), description?.trim());

    if (!list) {
      res.status(404).json({ success: false, message: 'List not found' });
      return;
    }

    res.json({ success: true, data: list });
  } catch (error) {
    console.error('Error updating art todo list:', error);
    res.status(500).json({ success: false, message: 'Error updating list' });
  }
}

export async function deleteList(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const id = parseInt(req.params.id as string);
    const deleted = await artTodoService.deleteList(id, req.user.id);

    if (!deleted) {
      res.status(404).json({ success: false, message: 'List not found' });
      return;
    }

    res.json({ success: true, message: 'List deleted successfully' });
  } catch (error) {
    console.error('Error deleting art todo list:', error);
    res.status(500).json({ success: false, message: 'Error deleting list' });
  }
}

// =============================================================================
// Item Endpoints
// =============================================================================

export async function getItems(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const listId = parseInt(req.params.listId as string);
    const items = await artTodoService.getItems(listId, req.user.id);
    res.json({ success: true, data: items });
  } catch (error) {
    console.error('Error getting art todo items:', error);
    res.status(500).json({ success: false, message: 'Error getting items' });
  }
}

export async function createItem(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const listId = parseInt(req.params.listId as string);
    const {
      title, description, status, priority, due_date, is_persistent, steps_total, references,
    } = req.body as {
      title?: string;
      description?: string;
      status?: string;
      priority?: string;
      due_date?: string;
      is_persistent?: boolean;
      steps_total?: number;
      references?: Array<{ referenceType: ArtTodoReferenceType; referenceId: number }>;
    };

    if (!title || title.trim().length === 0) {
      res.status(400).json({ success: false, message: 'Title is required' });
      return;
    }

    const item = await artTodoService.createItem(listId, req.user.id, {
      title: title.trim(),
      description: description?.trim(),
      status,
      priority,
      dueDate: due_date,
      isPersistent: is_persistent,
      stepsTotal: steps_total,
      references,
    });

    res.status(201).json({ success: true, data: item });
  } catch (error) {
    console.error('Error creating art todo item:', error);
    res.status(500).json({ success: false, message: 'Error creating item' });
  }
}

export async function updateItem(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const id = parseInt(req.params.id as string);
    const {
      title, description, status, priority, due_date, is_persistent, steps_total, steps_completed,
    } = req.body as {
      title?: string;
      description?: string;
      status?: string;
      priority?: string;
      due_date?: string;
      is_persistent?: boolean;
      steps_total?: number;
      steps_completed?: number;
    };

    if (!title || title.trim().length === 0) {
      res.status(400).json({ success: false, message: 'Title is required' });
      return;
    }

    const item = await artTodoService.updateItem(id, req.user.id, {
      title: title.trim(),
      description: description?.trim(),
      status,
      priority,
      dueDate: due_date,
      isPersistent: is_persistent,
      stepsTotal: steps_total,
      stepsCompleted: steps_completed,
    });

    if (!item) {
      res.status(404).json({ success: false, message: 'Item not found' });
      return;
    }

    res.json({ success: true, data: item });
  } catch (error) {
    console.error('Error updating art todo item:', error);
    res.status(500).json({ success: false, message: 'Error updating item' });
  }
}

export async function moveItem(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const id = parseInt(req.params.id as string);
    const { list_id } = req.body as { list_id?: number };

    if (!list_id) {
      res.status(400).json({ success: false, message: 'Target list ID is required' });
      return;
    }

    const item = await artTodoService.moveItem(id, list_id, req.user.id);

    if (!item) {
      res.status(404).json({ success: false, message: 'Item not found or access denied' });
      return;
    }

    res.json({ success: true, data: item });
  } catch (error) {
    console.error('Error moving art todo item:', error);
    res.status(500).json({ success: false, message: 'Error moving item' });
  }
}

export async function deleteItem(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const id = parseInt(req.params.id as string);
    const deleted = await artTodoService.deleteItem(id, req.user.id);

    if (!deleted) {
      res.status(404).json({ success: false, message: 'Item not found' });
      return;
    }

    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting art todo item:', error);
    res.status(500).json({ success: false, message: 'Error deleting item' });
  }
}

// =============================================================================
// Reference Endpoints
// =============================================================================

export async function getItemReferences(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const id = parseInt(req.params.id as string);
    const references = await artTodoService.getItemReferences(id, req.user.id);
    res.json({ success: true, data: references });
  } catch (error) {
    console.error('Error getting item references:', error);
    res.status(500).json({ success: false, message: 'Error getting references' });
  }
}

export async function getItemReferenceMatrix(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const id = parseInt(req.params.id as string);
    const matrix = await artTodoService.getReferenceMatrix(id, req.user.id);
    res.json({ success: true, data: matrix });
  } catch (error) {
    console.error('Error getting reference matrix:', error);
    res.status(500).json({ success: false, message: 'Error getting reference matrix' });
  }
}

export async function addItemReference(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const id = parseInt(req.params.id as string);
    const { reference_type, reference_id } = req.body as {
      reference_type?: string;
      reference_id?: number;
    };

    if (!reference_type || !reference_id) {
      res.status(400).json({ success: false, message: 'Reference type and ID are required' });
      return;
    }

    if (!['trainer', 'monster'].includes(reference_type)) {
      res.status(400).json({ success: false, message: 'Reference type must be "trainer" or "monster"' });
      return;
    }

    const reference = await artTodoService.addReference(
      id,
      req.user.id,
      reference_type as ArtTodoReferenceType,
      reference_id,
    );

    res.status(201).json({ success: true, data: reference });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to add reference';
    console.error('Error adding reference:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

export async function removeItemReference(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const id = parseInt(req.params.id as string);
    const deleted = await artTodoService.removeReference(id, req.user.id);

    if (!deleted) {
      res.status(404).json({ success: false, message: 'Reference not found' });
      return;
    }

    res.json({ success: true, message: 'Reference removed successfully' });
  } catch (error) {
    console.error('Error removing reference:', error);
    res.status(500).json({ success: false, message: 'Error removing reference' });
  }
}

// =============================================================================
// Helper Endpoints for Reference Selection
// =============================================================================

export async function getUserTrainers(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const discordId = req.user.discord_id;
    if (!discordId) {
      res.json({ success: true, data: [] });
      return;
    }

    const trainers = await artTodoService.getUserTrainers(discordId);
    res.json({ success: true, data: trainers });
  } catch (error) {
    console.error('Error getting user trainers:', error);
    res.status(500).json({ success: false, message: 'Error getting trainers' });
  }
}

export async function getUserMonsters(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const discordId = req.user.discord_id;
    if (!discordId) {
      res.json({ success: true, data: [] });
      return;
    }

    const monsters = await artTodoService.getUserMonsters(discordId);
    res.json({ success: true, data: monsters });
  } catch (error) {
    console.error('Error getting user monsters:', error);
    res.status(500).json({ success: false, message: 'Error getting monsters' });
  }
}
