import { Request, Response } from 'express';
import { ItemsService } from '../../services/items.service';
import type { ItemCreateInput, ItemQueryOptions } from '../../repositories';
import type { SpecialBerryName } from '../../services/special-berry.service';
import type { ItemCategoryValue } from '../../utils/constants';

const itemsService = new ItemsService();

function paramToString(param: string | string[] | undefined): string {
  if (Array.isArray(param)) {
    return param[0] ?? '';
  }
  return param ?? '';
}

// ============================================================================
// CRUD Operations (Public + Admin)
// ============================================================================

export async function getAllItems(req: Request, res: Response): Promise<void> {
  try {
    const query = req.query as Record<string, string | undefined>;
    const options: ItemQueryOptions = {
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? parseInt(query.limit, 10) : 10,
      search: query.search ?? '',
      sortBy: (query.sortBy as ItemQueryOptions['sortBy']) ?? 'name',
      sortOrder: (query.sortOrder as ItemQueryOptions['sortOrder']) ?? 'asc',
      category: query.category ?? '',
      type: query.type ?? '',
      rarity: query.rarity ?? '',
    };

    const result = await itemsService.getAllItems(options);

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
    const msg = error instanceof Error ? error.message : 'Error fetching items';
    console.error('Error fetching items:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

export async function getAllCategories(_req: Request, res: Response): Promise<void> {
  try {
    const categories = await itemsService.getAllCategories();
    res.json({ success: true, data: categories });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error fetching categories';
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

export async function getAllTypes(_req: Request, res: Response): Promise<void> {
  try {
    const types = await itemsService.getAllTypes();
    res.json({ success: true, data: types });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error fetching types';
    console.error('Error fetching types:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

export async function getAllRarities(_req: Request, res: Response): Promise<void> {
  try {
    const rarities = await itemsService.getAllRarities();
    res.json({ success: true, data: rarities });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error fetching rarities';
    console.error('Error fetching rarities:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

export async function getItemById(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(paramToString(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid item ID' });
      return;
    }

    const item = await itemsService.getItemById(id);
    if (!item) {
      res.status(404).json({ success: false, message: 'Item not found' });
      return;
    }

    res.json({ success: true, data: item });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error fetching item';
    console.error('Error fetching item:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

export async function createItem(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as Record<string, unknown>;
    const name = body.name as string | undefined;
    const category = body.category as string | undefined;

    if (!name || !category) {
      res.status(400).json({ success: false, message: 'Please provide all required fields: name, category' });
      return;
    }

    const input: ItemCreateInput = {
      name,
      description: (body.description as string) ?? null,
      imageUrl: (body.image_url as string) ?? null,
      category,
      type: (body.type as string) ?? null,
      rarity: (body.rarity as string) ?? null,
      effect: (body.effect as string) ?? null,
      basePrice: body.base_price ? parseInt(String(body.base_price), 10) : 0,
    };

    const item = await itemsService.createItem(input);
    res.status(201).json({ success: true, data: item, message: 'Item created successfully' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error creating item';
    console.error('Error creating item:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

export async function createBulkItems(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as Record<string, unknown>;
    const items = body.items as Array<Record<string, unknown>> | undefined;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: 'Please provide an array of items' });
      return;
    }

    // Validate each item
    for (const item of items) {
      if (!item.name || !item.category) {
        res.status(400).json({ success: false, message: 'Each item must have a name and category' });
        return;
      }
    }

    const inputs: ItemCreateInput[] = items.map((item) => ({
      name: item.name as string,
      description: (item.description as string) ?? null,
      imageUrl: (item.image_url as string) ?? null,
      category: item.category as string,
      type: (item.type as string) ?? null,
      rarity: (item.rarity as string) ?? null,
      effect: (item.effect as string) ?? null,
      basePrice: item.base_price ? parseInt(String(item.base_price), 10) : 0,
    }));

    const created = await itemsService.createBulkItems(inputs);
    res.status(201).json({
      success: true,
      data: created,
      message: `${created.length} items created successfully`,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error creating items';
    console.error('Error creating items:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

export async function uploadImage(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'Please upload an image' });
      return;
    }

    const result = await itemsService.uploadImage(req.file.path);

    res.json({
      success: true,
      data: { url: result.url, public_id: result.publicId },
      message: 'Image uploaded successfully',
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error uploading image';
    console.error('Error uploading image:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

export async function updateItem(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(paramToString(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid item ID' });
      return;
    }

    const body = req.body as Record<string, unknown>;
    const name = body.name as string | undefined;
    const category = body.category as string | undefined;

    if (!name || !category) {
      res.status(400).json({ success: false, message: 'Please provide all required fields: name, category' });
      return;
    }

    const item = await itemsService.updateItem(id, {
      name,
      description: (body.description as string) ?? null,
      imageUrl: (body.image_url as string) ?? null,
      category,
      type: (body.type as string) ?? null,
      rarity: (body.rarity as string) ?? null,
      effect: (body.effect as string) ?? null,
      basePrice: body.base_price ? parseInt(String(body.base_price), 10) : 0,
    });

    res.json({ success: true, data: item, message: 'Item updated successfully' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error updating item';
    if (msg === 'Item not found') {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    console.error('Error updating item:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

export async function deleteItem(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(paramToString(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid item ID' });
      return;
    }

    await itemsService.deleteItem(id);
    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error deleting item';
    if (msg === 'Item not found') {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    console.error('Error deleting item:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

// ============================================================================
// Berry & Pastry Usage (Authenticated)
// ============================================================================

export async function useBerry(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as Record<string, unknown>;
    const monsterId = body.monsterId !== null ? Number(body.monsterId) : undefined;
    const berryName = body.berryName as string | undefined;
    const trainerId = body.trainerId !== null ? Number(body.trainerId) : undefined;
    const speciesValue = body.speciesValue as string | undefined;
    const userId = req.user?.discord_id;
    const isAdmin = req.user?.is_admin === true;

    if (!monsterId || !berryName || !trainerId) {
      res.status(400).json({ success: false, message: 'Missing required parameters' });
      return;
    }

    if (!userId && !isAdmin) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const result = await itemsService.useBerry({
      monsterId,
      berryName,
      trainerId,
      speciesValue,
      userId: userId ?? '',
      isAdmin,
    });

    res.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error using berry';

    if (msg.includes('does not belong') || msg.includes('does not have')) {
      res.status(403).json({ success: false, message: msg });
      return;
    }
    if (msg.includes('not found')) {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    if (msg.includes('Cannot apply') || msg.includes('must have at least') || msg.includes('Unknown berry')) {
      res.status(400).json({ success: false, message: msg });
      return;
    }

    console.error('Error using berry:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function usePastry(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as Record<string, unknown>;
    const monsterId = body.monsterId !== null ? Number(body.monsterId) : undefined;
    const pastryName = body.pastryName as string | undefined;
    const trainerId = body.trainerId !== null ? Number(body.trainerId) : undefined;
    const selectedValue = body.selectedValue as string | undefined;
    const userId = req.user?.discord_id;
    const isAdmin = req.user?.is_admin === true;

    if (!monsterId || !pastryName || !trainerId) {
      res.status(400).json({ success: false, message: 'Missing required parameters' });
      return;
    }

    if (!userId && !isAdmin) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const result = await itemsService.usePastry({
      monsterId,
      pastryName,
      trainerId,
      selectedValue,
      userId: userId ?? '',
      isAdmin,
    });

    res.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error using pastry';

    if (msg.includes('does not belong') || msg.includes('does not have')) {
      res.status(403).json({ success: false, message: msg });
      return;
    }
    if (msg.includes('not found')) {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    if (msg.includes('Cannot apply') || msg.includes('Invalid species') || msg.includes('Unknown pastry') || msg.includes('legendary') || msg.includes('mythical') || msg.includes('evolved') || msg.includes('rank')) {
      res.status(400).json({ success: false, message: msg });
      return;
    }

    console.error('Error using pastry:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function applyPastry(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as Record<string, unknown>;
    const monsterId = body.monsterId !== null ? Number(body.monsterId) : undefined;
    const pastryName = body.pastryName as string | undefined;
    const trainerId = body.trainerId !== null ? Number(body.trainerId) : undefined;
    const selectedValue = body.selectedValue as string | undefined;
    const userId = req.user?.discord_id;
    const isAdmin = req.user?.is_admin === true;

    if (!monsterId || !pastryName || !trainerId || !selectedValue) {
      res.status(400).json({ success: false, message: 'Missing required parameters' });
      return;
    }

    if (!userId && !isAdmin) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const result = await itemsService.usePastry({
      monsterId,
      pastryName,
      trainerId,
      selectedValue,
      userId: userId ?? '',
      isAdmin,
    });

    res.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error applying pastry';

    if (msg.includes('does not belong') || msg.includes('does not have')) {
      res.status(403).json({ success: false, message: msg });
      return;
    }
    if (msg.includes('not found')) {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    if (msg.includes('Cannot apply') || msg.includes('Invalid species') || msg.includes('Unknown pastry') || msg.includes('legendary') || msg.includes('mythical') || msg.includes('evolved') || msg.includes('rank')) {
      res.status(400).json({ success: false, message: msg });
      return;
    }

    console.error('Error applying pastry:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// ============================================================================
// Item Rolling (Authenticated)
// ============================================================================

export async function rollItems(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as Record<string, unknown>;
    const categories = body.categories as ItemCategoryValue[] | undefined;
    const category = body.category as ItemCategoryValue | undefined;
    const rarity = body.rarity as string | undefined;
    const quantity = body.quantity ? parseInt(String(body.quantity), 10) : 1;

    if (quantity < 1 || quantity > 20) {
      res.status(400).json({ success: false, message: 'Quantity must be between 1 and 20' });
      return;
    }

    const items = await itemsService.rollItems({
      category: categories ?? category,
      rarity,
      quantity,
    });
    res.json({ success: true, data: items });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error rolling items';
    console.error('Error rolling items:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

export async function rollItemsForTrainer(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as Record<string, unknown>;
    const trainerId = body.trainer_id as number | undefined;
    const category = body.category as ItemCategoryValue | undefined;
    const rarity = body.rarity as string | undefined;
    const quantity = body.quantity ? parseInt(String(body.quantity), 10) : 1;

    if (!trainerId) {
      res.status(400).json({ success: false, message: 'Please provide trainer_id' });
      return;
    }

    if (quantity < 1 || quantity > 20) {
      res.status(400).json({ success: false, message: 'Quantity must be between 1 and 20' });
      return;
    }

    const result = await itemsService.rollItemsForTrainer(trainerId, { category, rarity, quantity });
    res.json({
      success: true,
      data: result.items,
      message: 'Items rolled and added to trainer inventory successfully',
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error rolling items for trainer';
    if (msg === 'Trainer not found') {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    console.error('Error rolling items for trainer:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

// ============================================================================
// Admin Management (Admin only)
// ============================================================================

export async function addItemToTrainer(req: Request, res: Response): Promise<void> {
  try {
    const trainerId = parseInt(paramToString(req.params.trainerId), 10);
    if (isNaN(trainerId)) {
      res.status(400).json({ success: false, message: 'Invalid trainer ID' });
      return;
    }

    const body = req.body as Record<string, unknown>;
    const itemName = body.itemName as string | undefined;
    const quantity = body.quantity as number | string | undefined;
    const category = body.category as string | undefined;

    if (!itemName || !quantity || !category) {
      res.status(400).json({ success: false, message: 'Item name, quantity, and category are required' });
      return;
    }

    const parsedQuantity = parseInt(String(quantity), 10);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      res.status(400).json({ success: false, message: 'Quantity must be a positive number' });
      return;
    }

    const result = await itemsService.addItemToTrainer(trainerId, category, itemName, parsedQuantity);
    res.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error adding item to trainer';
    if (msg === 'Trainer not found') {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    console.error('Error adding item to trainer:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

export async function addItemToBulkTrainers(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as Record<string, unknown>;
    const trainerIds = body.trainerIds as number[] | undefined;
    const itemName = body.itemName as string | undefined;
    const quantity = body.quantity as number | string | undefined;
    const category = body.category as string | undefined;

    if (!trainerIds || !Array.isArray(trainerIds) || trainerIds.length === 0 || !itemName || !quantity || !category) {
      res.status(400).json({ success: false, message: 'Trainer IDs array, item name, quantity, and category are required' });
      return;
    }

    const parsedQuantity = parseInt(String(quantity), 10);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      res.status(400).json({ success: false, message: 'Quantity must be a positive number' });
      return;
    }

    const result = await itemsService.addItemToBulkTrainers(trainerIds, category, itemName, parsedQuantity);
    res.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error adding item to trainers';
    console.error('Error adding item to trainers:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

export async function addItemToAllTrainers(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as Record<string, unknown>;
    const itemName = body.itemName as string | undefined;
    const quantity = body.quantity as number | string | undefined;
    const category = body.category as string | undefined;

    if (!itemName || !quantity || !category) {
      res.status(400).json({ success: false, message: 'Item name, quantity, and category are required' });
      return;
    }

    const parsedQuantity = parseInt(String(quantity), 10);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      res.status(400).json({ success: false, message: 'Quantity must be a positive number' });
      return;
    }

    const result = await itemsService.addItemToAllTrainers(category, itemName, parsedQuantity);
    res.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error adding item to all trainers';
    if (msg === 'No trainers found') {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    console.error('Error adding item to all trainers:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

export async function batchUpdateItemImages(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as Record<string, unknown>;
    const updates = body.updates as Array<Record<string, unknown>> | undefined;

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      res.status(400).json({ success: false, message: 'Please provide an array of updates' });
      return;
    }

    for (const entry of updates) {
      if (typeof entry.id !== 'number' || typeof entry.image_url !== 'string') {
        res.status(400).json({ success: false, message: 'Each update must have a numeric id and a string image_url' });
        return;
      }
    }

    const mapped = updates.map((entry) => ({
      id: entry.id as number,
      imageUrl: entry.image_url as string,
    }));

    const updated = await itemsService.batchUpdateItemImages(mapped);
    res.json({ success: true, updated });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error batch updating item images';
    console.error('Error batch updating item images:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

export async function addSpecialBerriesToTrainer(req: Request, res: Response): Promise<void> {
  try {
    const trainerId = parseInt(paramToString(req.params.trainerId), 10);
    if (isNaN(trainerId)) {
      res.status(400).json({ success: false, message: 'Invalid trainer ID' });
      return;
    }

    const body = req.body as Record<string, unknown>;
    const berryName = body.berryName as SpecialBerryName | undefined;
    const quantity = body.quantity ? parseInt(String(body.quantity), 10) : 5;

    const validBerries: SpecialBerryName[] = ['Forget-Me-Not', 'Edenwiess'];
    if (berryName && !validBerries.includes(berryName)) {
      res.status(400).json({ success: false, message: 'Invalid berry name. Must be Forget-Me-Not or Edenwiess' });
      return;
    }

    const result = await itemsService.addSpecialBerriesToTrainer(trainerId, berryName, quantity);
    res.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to add special berries';
    console.error('Error adding special berries:', error);
    res.status(500).json({ success: false, message: msg });
  }
}
