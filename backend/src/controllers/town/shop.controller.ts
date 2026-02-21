import { Request, Response } from 'express';
import { ShopService } from '../../services/shop.service';

const shopService = new ShopService();

// =============================================================================
// Shop CRUD
// =============================================================================

export async function getShops(_req: Request, res: Response): Promise<void> {
  try {
    const shops = await shopService.getAllShops();
    res.json({ success: true, data: shops });
  } catch (error) {
    console.error('Error getting shops:', error);
    res.status(500).json({ success: false, message: 'Error getting shops' });
  }
}

export async function getActiveShops(_req: Request, res: Response): Promise<void> {
  try {
    const shops = await shopService.getActiveShops();
    res.json({ success: true, data: shops });
  } catch (error) {
    console.error('Error getting active shops:', error);
    res.status(500).json({ success: false, message: 'Error getting active shops' });
  }
}

export async function getVisibleShops(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const shops = await shopService.getVisibleShops(userId);
    res.json({ success: true, data: shops });
  } catch (error) {
    console.error('Error getting visible shops:', error);
    res.status(500).json({ success: false, message: 'Error getting visible shops' });
  }
}

export async function getShopById(req: Request, res: Response): Promise<void> {
  try {
    const shopId = req.params.id as string;
    const shop = await shopService.getShopByShopId(shopId);

    if (!shop) {
      res.status(404).json({ success: false, message: 'Shop not found' });
      return;
    }

    res.json({ success: true, data: shop });
  } catch (error) {
    console.error('Error getting shop:', error);
    res.status(500).json({ success: false, message: 'Error getting shop' });
  }
}

export async function createShop(req: Request, res: Response): Promise<void> {
  try {
    const {
      shop_id, name, description, flavor_text, banner_image,
      category, price_modifier, is_constant, is_active, visibility_condition,
    } = req.body as {
      shop_id?: string;
      name?: string;
      description?: string;
      flavor_text?: string;
      banner_image?: string;
      category?: string;
      price_modifier?: number;
      is_constant?: boolean;
      is_active?: boolean;
      visibility_condition?: string;
    };

    if (!shop_id || !name || !category) {
      res.status(400).json({
        success: false,
        message: 'shop_id, name, and category are required',
      });
      return;
    }

    const shop = await shopService.createShop({
      shopId: shop_id,
      name,
      description,
      flavorText: flavor_text,
      bannerImage: banner_image,
      category,
      priceModifier: price_modifier ?? 1.0,
      isConstant: is_constant ?? true,
      isActive: is_active ?? true,
      visibilityCondition: visibility_condition,
    });

    res.status(201).json({ success: true, data: shop, message: 'Shop created successfully' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error creating shop';
    console.error('Error creating shop:', error);
    if (msg === 'Shop ID already exists') {
      res.status(400).json({ success: false, message: msg });
      return;
    }
    res.status(500).json({ success: false, message: msg });
  }
}

export async function updateShop(req: Request, res: Response): Promise<void> {
  try {
    const shopId = req.params.id as string;
    const {
      name, description, flavor_text, banner_image,
      category, price_modifier, is_constant, is_active, visibility_condition,
    } = req.body as {
      name?: string;
      description?: string;
      flavor_text?: string;
      banner_image?: string;
      category?: string;
      price_modifier?: number;
      is_constant?: boolean;
      is_active?: boolean;
      visibility_condition?: string;
    };

    if (!name || !category) {
      res.status(400).json({
        success: false,
        message: 'name and category are required',
      });
      return;
    }

    const shop = await shopService.updateShop(shopId, {
      name,
      description,
      flavorText: flavor_text,
      bannerImage: banner_image,
      category,
      priceModifier: price_modifier ?? 1.0,
      isConstant: is_constant,
      isActive: is_active,
      visibilityCondition: visibility_condition,
    });

    res.json({ success: true, data: shop, message: 'Shop updated successfully' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error updating shop';
    console.error('Error updating shop:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

export async function deleteShop(req: Request, res: Response): Promise<void> {
  try {
    const shopId = req.params.id as string;
    await shopService.deleteShop(shopId);
    res.json({ success: true, message: 'Shop deleted successfully' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error deleting shop';
    console.error('Error deleting shop:', error);
    if (msg === 'Shop not found') {
      res.status(404).json({ success: false, message: msg });
      return;
    }
    res.status(500).json({ success: false, message: msg });
  }
}

// =============================================================================
// Shop Items
// =============================================================================

export async function getShopItems(req: Request, res: Response): Promise<void> {
  try {
    const shopId = req.params.id as string;
    const shop = await shopService.getShopByShopId(shopId);
    if (!shop) {
      res.status(404).json({ success: false, message: 'Shop not found' });
      return;
    }

    const items = await shopService.getShopItems(shopId);
    res.json({ success: true, data: items });
  } catch (error) {
    console.error('Error getting shop items:', error);
    res.status(500).json({ success: false, message: 'Error getting shop items' });
  }
}

export async function addShopItem(req: Request, res: Response): Promise<void> {
  try {
    const shopId = req.params.id as string;
    const { item_id, price, max_quantity, current_quantity } = req.body as {
      item_id?: number;
      price?: number;
      max_quantity?: number | null;
      current_quantity?: number | null;
    };

    if (!item_id || price === undefined) {
      res.status(400).json({
        success: false,
        message: 'item_id and price are required',
      });
      return;
    }

    const shop = await shopService.getShopByShopId(shopId);
    if (!shop) {
      res.status(404).json({ success: false, message: 'Shop not found' });
      return;
    }

    const shopItem = await shopService.addShopItem({
      shopId,
      itemId: item_id,
      price,
      maxQuantity: max_quantity ?? null,
      currentQuantity: current_quantity ?? null,
    });

    res.status(201).json({ success: true, data: shopItem, message: 'Item added to shop' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error adding shop item';
    console.error('Error adding shop item:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

export async function updateShopItem(req: Request, res: Response): Promise<void> {
  try {
    const itemId = parseInt(req.params.itemId as string);
    const { price, max_quantity, current_quantity } = req.body as {
      price?: number;
      max_quantity?: number | null;
      current_quantity?: number | null;
    };

    const shopItem = await shopService.updateShopItem(itemId, {
      price,
      maxQuantity: max_quantity,
      currentQuantity: current_quantity,
    });

    res.json({ success: true, data: shopItem, message: 'Shop item updated' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error updating shop item';
    console.error('Error updating shop item:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

export async function removeShopItem(req: Request, res: Response): Promise<void> {
  try {
    const itemId = parseInt(req.params.itemId as string);
    const deleted = await shopService.removeShopItem(itemId);

    if (!deleted) {
      res.status(404).json({ success: false, message: 'Shop item not found' });
      return;
    }

    res.json({ success: true, message: 'Item removed from shop' });
  } catch (error) {
    console.error('Error removing shop item:', error);
    res.status(500).json({ success: false, message: 'Error removing shop item' });
  }
}

export async function stockShop(req: Request, res: Response): Promise<void> {
  try {
    const shopId = req.params.id as string;
    const { category, count, price_modifier } = req.body as {
      category?: string;
      count?: number;
      price_modifier?: number;
    };

    const shop = await shopService.getShopByShopId(shopId);
    if (!shop) {
      res.status(404).json({ success: false, message: 'Shop not found' });
      return;
    }

    const result = await shopService.stockShop(
      shopId,
      category ?? shop.category ?? '',
      count ?? 10,
      price_modifier ?? shop.price_modifier ?? 1.0,
    );

    res.json({ success: true, data: result, message: 'Shop stocked successfully' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error stocking shop';
    console.error('Error stocking shop:', error);
    res.status(500).json({ success: false, message: msg });
  }
}

export async function purchaseItem(req: Request, res: Response): Promise<void> {
  try {
    const shopId = req.params.shopId as string;
    const { trainer_id, item_id, quantity } = req.body as {
      trainer_id?: number;
      item_id?: number;
      quantity?: number;
    };

    if (!trainer_id || !item_id || !quantity) {
      res.status(400).json({
        success: false,
        message: 'trainer_id, item_id, and quantity are required',
      });
      return;
    }

    const result = await shopService.purchaseItem(
      trainer_id,
      shopId,
      item_id,
      quantity,
    );

    res.json({ success: true, data: result, message: 'Item purchased successfully' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error purchasing item';
    console.error('Error purchasing item:', error);
    if (msg.includes('Insufficient') || msg.includes('not found') || msg.includes('unavailable')) {
      res.status(400).json({ success: false, message: msg });
      return;
    }
    res.status(500).json({ success: false, message: msg });
  }
}
