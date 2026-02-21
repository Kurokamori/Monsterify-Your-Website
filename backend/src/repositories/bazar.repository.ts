import { BaseRepository } from './base.repository';
import { db } from '../database';

// Bazar Monster types
export type BazarMonsterRow = {
  id: number;
  original_monster_id: number;
  forfeited_by_trainer_id: number;
  forfeited_by_user_id: string | null;
  name: string;
  species1: string;
  species2: string | null;
  species3: string | null;
  type1: string;
  type2: string | null;
  type3: string | null;
  type4: string | null;
  type5: string | null;
  attribute: string | null;
  level: number;
  is_available: boolean;
  forfeited_at: Date;
};

export type BazarMonster = {
  id: number;
  originalMonsterId: number;
  forfeitedByTrainerId: number;
  forfeitedByUserId: string | null;
  name: string;
  species1: string;
  species2: string | null;
  species3: string | null;
  type1: string;
  type2: string | null;
  type3: string | null;
  type4: string | null;
  type5: string | null;
  attribute: string | null;
  level: number;
  isAvailable: boolean;
  forfeitedAt: Date;
};

export type BazarMonsterWithDetails = BazarMonster & {
  forfeitedByTrainerName: string | null;
  forfeitedByUserName: string | null;
};

// Bazar Item types
export type BazarItemRow = {
  id: number;
  forfeited_by_trainer_id: number;
  forfeited_by_user_id: string | null;
  item_name: string;
  item_category: string;
  quantity: number;
  is_available: boolean;
  forfeited_at: Date;
};

export type BazarItem = {
  id: number;
  forfeitedByTrainerId: number;
  forfeitedByUserId: string | null;
  itemName: string;
  itemCategory: string;
  quantity: number;
  isAvailable: boolean;
  forfeitedAt: Date;
};

export type BazarItemWithDetails = BazarItem & {
  forfeitedByTrainerName: string | null;
  forfeitedByUserName: string | null;
};

// Bazar Transaction types
export type TransactionType = 'forfeit_monster' | 'forfeit_item' | 'adopt_monster' | 'collect_item';
export type ItemType = 'monster' | 'item';

export type BazarTransactionRow = {
  id: number;
  transaction_type: TransactionType;
  item_type: ItemType;
  item_id: number;
  from_trainer_id: number | null;
  from_user_id: string | null;
  to_trainer_id: number | null;
  to_user_id: string | null;
  transaction_data: string | object | null;
  created_at: Date;
};

export type BazarTransaction = {
  id: number;
  transactionType: TransactionType;
  itemType: ItemType;
  itemId: number;
  fromTrainerId: number | null;
  fromUserId: string | null;
  toTrainerId: number | null;
  toUserId: string | null;
  transactionData: Record<string, unknown>;
  createdAt: Date;
};

// Input types
export type BazarMonsterCreateInput = {
  originalMonsterId: number;
  forfeitedByTrainerId: number;
  forfeitedByUserId?: string | null;
  name: string;
  species1: string;
  species2?: string | null;
  species3?: string | null;
  type1: string;
  type2?: string | null;
  type3?: string | null;
  type4?: string | null;
  type5?: string | null;
  attribute?: string | null;
  level: number;
};

export type BazarItemCreateInput = {
  forfeitedByTrainerId: number;
  forfeitedByUserId?: string | null;
  itemName: string;
  itemCategory: string;
  quantity: number;
};

const parseJsonField = (value: string | object | null): Record<string, unknown> => {
  if (!value) {return {};}
  if (typeof value === 'object') {return value as Record<string, unknown>;}
  try {
    if (value === '[object Object]' || value.includes('[object Object]')) {
      return {};
    }
    return JSON.parse(value);
  } catch {
    return {};
  }
};

const normalizeBazarMonster = (row: BazarMonsterRow): BazarMonster => ({
  id: row.id,
  originalMonsterId: row.original_monster_id,
  forfeitedByTrainerId: row.forfeited_by_trainer_id,
  forfeitedByUserId: row.forfeited_by_user_id,
  name: row.name,
  species1: row.species1,
  species2: row.species2,
  species3: row.species3,
  type1: row.type1,
  type2: row.type2,
  type3: row.type3,
  type4: row.type4,
  type5: row.type5,
  attribute: row.attribute,
  level: row.level,
  isAvailable: row.is_available,
  forfeitedAt: row.forfeited_at,
});

type BazarMonsterWithDetailsRow = BazarMonsterRow & {
  forfeited_by_trainer_name: string | null;
  forfeited_by_user_name: string | null;
};

const normalizeBazarMonsterWithDetails = (row: BazarMonsterWithDetailsRow): BazarMonsterWithDetails => ({
  ...normalizeBazarMonster(row),
  forfeitedByTrainerName: row.forfeited_by_trainer_name,
  forfeitedByUserName: row.forfeited_by_user_name,
});

const normalizeBazarItem = (row: BazarItemRow): BazarItem => ({
  id: row.id,
  forfeitedByTrainerId: row.forfeited_by_trainer_id,
  forfeitedByUserId: row.forfeited_by_user_id,
  itemName: row.item_name,
  itemCategory: row.item_category,
  quantity: row.quantity,
  isAvailable: row.is_available,
  forfeitedAt: row.forfeited_at,
});

type BazarItemWithDetailsRow = BazarItemRow & {
  forfeited_by_trainer_name: string | null;
  forfeited_by_user_name: string | null;
};

const normalizeBazarItemWithDetails = (row: BazarItemWithDetailsRow): BazarItemWithDetails => ({
  ...normalizeBazarItem(row),
  forfeitedByTrainerName: row.forfeited_by_trainer_name,
  forfeitedByUserName: row.forfeited_by_user_name,
});

const normalizeBazarTransaction = (row: BazarTransactionRow): BazarTransaction => ({
  id: row.id,
  transactionType: row.transaction_type,
  itemType: row.item_type,
  itemId: row.item_id,
  fromTrainerId: row.from_trainer_id,
  fromUserId: row.from_user_id,
  toTrainerId: row.to_trainer_id,
  toUserId: row.to_user_id,
  transactionData: parseJsonField(row.transaction_data),
  createdAt: row.created_at,
});

export class BazarRepository extends BaseRepository<BazarMonster, BazarMonsterCreateInput, object> {
  constructor() {
    super('bazar_monsters');
  }

  // Monster methods
  async findMonsterById(id: number): Promise<BazarMonsterWithDetails | null> {
    const result = await db.query<BazarMonsterWithDetailsRow>(
      `
        SELECT bm.*, t.name as forfeited_by_trainer_name, u.display_name as forfeited_by_user_name
        FROM bazar_monsters bm
        LEFT JOIN trainers t ON bm.forfeited_by_trainer_id = t.id
        LEFT JOIN users u ON bm.forfeited_by_user_id = u.discord_id
        WHERE bm.id = $1
      `,
      [id]
    );
    const row = result.rows[0];
    return row ? normalizeBazarMonsterWithDetails(row) : null;
  }

  override async findById(id: number): Promise<BazarMonsterWithDetails | null> {
    return this.findMonsterById(id);
  }

  async getAvailableMonsters(): Promise<BazarMonsterWithDetails[]> {
    const result = await db.query<BazarMonsterWithDetailsRow>(
      `
        SELECT bm.*, t.name as forfeited_by_trainer_name, u.display_name as forfeited_by_user_name
        FROM bazar_monsters bm
        LEFT JOIN trainers t ON bm.forfeited_by_trainer_id = t.id
        LEFT JOIN users u ON bm.forfeited_by_user_id = u.discord_id
        WHERE bm.is_available::boolean = true
        ORDER BY bm.forfeited_at DESC
      `
    );
    return result.rows.map(normalizeBazarMonsterWithDetails);
  }

  async createMonster(input: BazarMonsterCreateInput): Promise<BazarMonster> {
    const result = await db.query<{ id: number }>(
      `
        INSERT INTO bazar_monsters (
          original_monster_id, forfeited_by_trainer_id, forfeited_by_user_id,
          name, species1, species2, species3, type1, type2, type3, type4, type5,
          attribute, level
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING id
      `,
      [
        input.originalMonsterId,
        input.forfeitedByTrainerId,
        input.forfeitedByUserId ?? null,
        input.name,
        input.species1,
        input.species2 ?? null,
        input.species3 ?? null,
        input.type1,
        input.type2 ?? null,
        input.type3 ?? null,
        input.type4 ?? null,
        input.type5 ?? null,
        input.attribute ?? null,
        input.level,
      ]
    );

    const insertedRow = result.rows[0];
    if (!insertedRow) {
      throw new Error('Failed to insert bazar monster');
    }
    const monster = await this.findMonsterById(insertedRow.id);
    if (!monster) {
      throw new Error('Failed to create bazar monster');
    }
    return monster;
  }

  override async create(input: BazarMonsterCreateInput): Promise<BazarMonster> {
    return this.createMonster(input);
  }

  override async update(id: number): Promise<BazarMonster> {
    const existing = await this.findMonsterById(id);
    if (!existing) {
      throw new Error('Bazar monster not found');
    }
    return existing;
  }

  async markMonsterUnavailable(id: number): Promise<boolean> {
    const result = await db.query('UPDATE bazar_monsters SET is_available = false WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  // Item methods
  async findItemById(id: number): Promise<BazarItemWithDetails | null> {
    const result = await db.query<BazarItemWithDetailsRow>(
      `
        SELECT bi.*, t.name as forfeited_by_trainer_name, u.display_name as forfeited_by_user_name
        FROM bazar_items bi
        LEFT JOIN trainers t ON bi.forfeited_by_trainer_id = t.id
        LEFT JOIN users u ON bi.forfeited_by_user_id = u.discord_id
        WHERE bi.id = $1
      `,
      [id]
    );
    const row = result.rows[0];
    return row ? normalizeBazarItemWithDetails(row) : null;
  }

  async getAvailableItems(): Promise<BazarItemWithDetails[]> {
    const result = await db.query<BazarItemWithDetailsRow>(
      `
        SELECT bi.*, t.name as forfeited_by_trainer_name, u.display_name as forfeited_by_user_name
        FROM bazar_items bi
        LEFT JOIN trainers t ON bi.forfeited_by_trainer_id = t.id
        LEFT JOIN users u ON bi.forfeited_by_user_id = u.discord_id
        WHERE bi.is_available::boolean = true
        ORDER BY bi.item_category, bi.item_name, bi.forfeited_at DESC
      `
    );
    return result.rows.map(normalizeBazarItemWithDetails);
  }

  async createItem(input: BazarItemCreateInput): Promise<BazarItem> {
    const result = await db.query<{ id: number }>(
      `
        INSERT INTO bazar_items (forfeited_by_trainer_id, forfeited_by_user_id, item_name, item_category, quantity)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `,
      [
        input.forfeitedByTrainerId,
        input.forfeitedByUserId ?? null,
        input.itemName,
        input.itemCategory,
        input.quantity,
      ]
    );

    const insertedRow = result.rows[0];
    if (!insertedRow) {
      throw new Error('Failed to insert bazar item');
    }
    const item = await this.findItemById(insertedRow.id);
    if (!item) {
      throw new Error('Failed to create bazar item');
    }
    return item;
  }

  async markItemUnavailable(id: number): Promise<boolean> {
    const result = await db.query('UPDATE bazar_items SET is_available = false WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async reduceItemQuantity(id: number, quantity: number): Promise<boolean> {
    const item = await this.findItemById(id);
    if (!item) {return false;}

    if (quantity >= item.quantity) {
      return this.markItemUnavailable(id);
    }

    const result = await db.query('UPDATE bazar_items SET quantity = quantity - $1 WHERE id = $2', [quantity, id]);
    return (result.rowCount ?? 0) > 0;
  }

  // Transaction methods
  async recordTransaction(
    transactionType: TransactionType,
    itemType: ItemType,
    itemId: number,
    fromTrainerId: number | null,
    fromUserId: string | null,
    toTrainerId: number | null,
    toUserId: string | null,
    data: Record<string, unknown>
  ): Promise<BazarTransaction> {
    const result = await db.query<{ id: number }>(
      `
        INSERT INTO bazar_transactions (
          transaction_type, item_type, item_id,
          from_trainer_id, from_user_id, to_trainer_id, to_user_id,
          transaction_data
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `,
      [
        transactionType,
        itemType,
        itemId,
        fromTrainerId,
        fromUserId,
        toTrainerId,
        toUserId,
        JSON.stringify(data),
      ]
    );

    const insertedRow = result.rows[0];
    if (!insertedRow) {
      throw new Error('Failed to insert bazar transaction');
    }
    const txResult = await db.query<BazarTransactionRow>(
      'SELECT * FROM bazar_transactions WHERE id = $1',
      [insertedRow.id]
    );
    const txRow = txResult.rows[0];
    if (!txRow) {
      throw new Error('Failed to retrieve created transaction');
    }
    return normalizeBazarTransaction(txRow);
  }

  async getTransactionsByTrainer(trainerId: number): Promise<BazarTransaction[]> {
    const result = await db.query<BazarTransactionRow>(
      `
        SELECT * FROM bazar_transactions
        WHERE from_trainer_id = $1 OR to_trainer_id = $1
        ORDER BY created_at DESC
      `,
      [trainerId]
    );
    return result.rows.map(normalizeBazarTransaction);
  }
}
