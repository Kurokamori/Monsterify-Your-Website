import { db } from '../database';

export type InventoryCategory =
  | 'items'
  | 'balls'
  | 'berries'
  | 'pastries'
  | 'evolution'
  | 'eggs'
  | 'antiques'
  | 'helditems'
  | 'seals'
  | 'keyitems';

export const INVENTORY_CATEGORIES: InventoryCategory[] = [
  'items',
  'balls',
  'berries',
  'pastries',
  'evolution',
  'eggs',
  'antiques',
  'helditems',
  'seals',
  'keyitems',
];

export type InventoryItems = Record<string, number>;

export type TrainerInventoryRow = {
  id: number;
  trainer_id: number;
  items: string | InventoryItems;
  balls: string | InventoryItems;
  berries: string | InventoryItems;
  pastries: string | InventoryItems;
  evolution: string | InventoryItems;
  eggs: string | InventoryItems;
  antiques: string | InventoryItems;
  helditems: string | InventoryItems;
  seals: string | InventoryItems;
  keyitems: string | InventoryItems;
  created_at: Date;
  updated_at: Date;
};

export type TrainerInventory = {
  id: number;
  trainer_id: number;
  items: InventoryItems;
  balls: InventoryItems;
  berries: InventoryItems;
  pastries: InventoryItems;
  evolution: InventoryItems;
  eggs: InventoryItems;
  antiques: InventoryItems;
  helditems: InventoryItems;
  seals: InventoryItems;
  keyitems: InventoryItems;
  created_at: Date;
  updated_at: Date;
};

export type InventoryItemInfo = {
  id: number;
  trainerId: number;
  category: InventoryCategory;
  name: string;
  quantity: number;
};

const DEFAULT_INVENTORY = {
  items: { 'Daycare Daypass': 1, 'Legacy Leeway': 1 },
  balls: { 'Poke Ball': 10 },
  berries: { 'Forget-Me-Not': 2, 'Edenwiess': 2 },
  eggs: { 'Standard Egg': 1 },
  keyitems: { 'Mission Mandate': 1 },
};

const parseJsonField = (value: string | InventoryItems | null | undefined): InventoryItems => {
  if (!value) {return {};}
  if (typeof value === 'object') {return value;}
  try {
    return JSON.parse(value) as InventoryItems;
  } catch {
    return {};
  }
};

const normalizeInventory = (row: TrainerInventoryRow): TrainerInventory => ({
  id: row.id,
  trainer_id: row.trainer_id,
  items: parseJsonField(row.items),
  balls: parseJsonField(row.balls),
  berries: parseJsonField(row.berries),
  pastries: parseJsonField(row.pastries),
  evolution: parseJsonField(row.evolution),
  eggs: parseJsonField(row.eggs),
  antiques: parseJsonField(row.antiques),
  helditems: parseJsonField(row.helditems),
  seals: parseJsonField(row.seals),
  keyitems: parseJsonField(row.keyitems),
  created_at: row.created_at,
  updated_at: row.updated_at,
});

/**
 * Find the canonical key in an inventory object, matching case-insensitively.
 * Returns the actual key from the object, or the original input if no match found.
 */
function findCanonicalKey(items: InventoryItems, name: string): string {
  if (name in items) { return name; }
  const lower = name.toLowerCase();
  for (const key of Object.keys(items)) {
    if (key.toLowerCase() === lower) { return key; }
  }
  return name;
}

export class TrainerInventoryRepository {
  async findByTrainerId(trainerId: number): Promise<TrainerInventory | null> {
    const result = await db.query<TrainerInventoryRow>(
      'SELECT * FROM trainer_inventory WHERE trainer_id = $1',
      [trainerId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    if (!row) {
      return null;
    }
    return normalizeInventory(row);
  }

  async findOrCreate(trainerId: number): Promise<TrainerInventory> {
    const existing = await this.findByTrainerId(trainerId);
    if (existing) {
      return existing;
    }
    return this.create(trainerId);
  }

  async create(trainerId: number): Promise<TrainerInventory> {
    const result = await db.query<TrainerInventoryRow>(
      `
        INSERT INTO trainer_inventory (trainer_id, items, balls, berries, eggs, keyitems)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `,
      [
        trainerId,
        JSON.stringify(DEFAULT_INVENTORY.items),
        JSON.stringify(DEFAULT_INVENTORY.balls),
        JSON.stringify(DEFAULT_INVENTORY.berries),
        JSON.stringify(DEFAULT_INVENTORY.eggs),
        JSON.stringify(DEFAULT_INVENTORY.keyitems),
      ]
    );

    const row = result.rows[0];
    if (!row) {
      throw new Error('Failed to create inventory');
    }
    return normalizeInventory(row);
  }

  async getItemByName(trainerId: number, itemName: string): Promise<InventoryItemInfo | null> {
    const inventory = await this.findOrCreate(trainerId);

    for (const category of INVENTORY_CATEGORIES) {
      const items = inventory[category];
      const key = findCanonicalKey(items, itemName);
      if (items[key] !== undefined && items[key] > 0) {
        return {
          id: inventory.id,
          trainerId: inventory.trainer_id,
          category,
          name: key,
          quantity: items[key],
        };
      }
    }

    return null;
  }

  async updateCategory(
    trainerId: number,
    category: InventoryCategory,
    items: InventoryItems
  ): Promise<TrainerInventory> {
    if (!INVENTORY_CATEGORIES.includes(category)) {
      throw new Error(`Invalid inventory category: ${category}`);
    }

    await db.query(
      `
        UPDATE trainer_inventory
        SET ${category} = $1, updated_at = CURRENT_TIMESTAMP
        WHERE trainer_id = $2
      `,
      [JSON.stringify(items), trainerId]
    );

    const updated = await this.findByTrainerId(trainerId);
    if (!updated) {
      throw new Error('Inventory not found after update');
    }
    return updated;
  }

  async addItem(
    trainerId: number,
    category: InventoryCategory,
    itemName: string,
    quantity: number
  ): Promise<TrainerInventory> {
    const inventory = await this.findOrCreate(trainerId);
    const items = { ...inventory[category] };
    const key = findCanonicalKey(items, itemName);
    const currentQuantity = items[key] ?? 0;
    items[key] = currentQuantity + quantity;

    return this.updateCategory(trainerId, category, items);
  }

  async removeItem(
    trainerId: number,
    category: InventoryCategory,
    itemName: string,
    quantity: number
  ): Promise<TrainerInventory> {
    const inventory = await this.findOrCreate(trainerId);
    const items = { ...inventory[category] };
    const key = findCanonicalKey(items, itemName);
    const currentQuantity = items[key] ?? 0;
    const newQuantity = Math.max(0, currentQuantity - quantity);

    if (newQuantity <= 0) {
      delete items[key];
    } else {
      items[key] = newQuantity;
    }

    return this.updateCategory(trainerId, category, items);
  }

  async setItemQuantity(
    trainerId: number,
    category: InventoryCategory,
    itemName: string,
    quantity: number
  ): Promise<TrainerInventory> {
    const inventory = await this.findOrCreate(trainerId);
    const items = { ...inventory[category] };
    const key = findCanonicalKey(items, itemName);

    if (quantity <= 0) {
      delete items[key];
    } else {
      items[key] = quantity;
    }

    return this.updateCategory(trainerId, category, items);
  }

  async hasItem(trainerId: number, itemName: string, requiredQuantity = 1): Promise<boolean> {
    const item = await this.getItemByName(trainerId, itemName);
    return item !== null && item.quantity >= requiredQuantity;
  }

  async getItemQuantity(trainerId: number, itemName: string): Promise<number> {
    const item = await this.getItemByName(trainerId, itemName);
    return item?.quantity ?? 0;
  }
}
