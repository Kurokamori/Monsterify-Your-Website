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
  hp_total: number;
  hp_iv: number;
  hp_ev: number;
  atk_total: number;
  atk_iv: number;
  atk_ev: number;
  def_total: number;
  def_iv: number;
  def_ev: number;
  spa_total: number;
  spa_iv: number;
  spa_ev: number;
  spd_total: number;
  spd_iv: number;
  spd_ev: number;
  spe_total: number;
  spe_iv: number;
  spe_ev: number;
  nature: string | null;
  characteristic: string | null;
  gender: string | null;
  friendship: number;
  ability1: string | null;
  ability2: string | null;
  moveset: string | null;
  img_link: string | null;
  shiny: boolean;
  alpha: boolean;
  shadow: boolean;
  paradox: boolean;
  pokerus: boolean;
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
  hpTotal: number;
  hpIv: number;
  hpEv: number;
  atkTotal: number;
  atkIv: number;
  atkEv: number;
  defTotal: number;
  defIv: number;
  defEv: number;
  spaTotal: number;
  spaIv: number;
  spaEv: number;
  spdTotal: number;
  spdIv: number;
  spdEv: number;
  speTotal: number;
  speIv: number;
  speEv: number;
  nature: string | null;
  characteristic: string | null;
  gender: string | null;
  friendship: number;
  ability1: string | null;
  ability2: string | null;
  moveset: string | null;
  imgLink: string | null;
  shiny: boolean;
  alpha: boolean;
  shadow: boolean;
  paradox: boolean;
  pokerus: boolean;
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
  hpTotal?: number;
  hpIv?: number;
  hpEv?: number;
  atkTotal?: number;
  atkIv?: number;
  atkEv?: number;
  defTotal?: number;
  defIv?: number;
  defEv?: number;
  spaTotal?: number;
  spaIv?: number;
  spaEv?: number;
  spdTotal?: number;
  spdIv?: number;
  spdEv?: number;
  speTotal?: number;
  speIv?: number;
  speEv?: number;
  nature?: string | null;
  characteristic?: string | null;
  gender?: string | null;
  friendship?: number;
  ability1?: string | null;
  ability2?: string | null;
  moveset?: string | null;
  imgLink?: string | null;
  shiny?: boolean;
  alpha?: boolean;
  shadow?: boolean;
  paradox?: boolean;
  pokerus?: boolean;
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
  hpTotal: row.hp_total,
  hpIv: row.hp_iv,
  hpEv: row.hp_ev,
  atkTotal: row.atk_total,
  atkIv: row.atk_iv,
  atkEv: row.atk_ev,
  defTotal: row.def_total,
  defIv: row.def_iv,
  defEv: row.def_ev,
  spaTotal: row.spa_total,
  spaIv: row.spa_iv,
  spaEv: row.spa_ev,
  spdTotal: row.spd_total,
  spdIv: row.spd_iv,
  spdEv: row.spd_ev,
  speTotal: row.spe_total,
  speIv: row.spe_iv,
  speEv: row.spe_ev,
  nature: row.nature,
  characteristic: row.characteristic,
  gender: row.gender,
  friendship: row.friendship,
  ability1: row.ability1,
  ability2: row.ability2,
  moveset: row.moveset,
  imgLink: row.img_link,
  shiny: row.shiny,
  alpha: row.alpha,
  shadow: row.shadow,
  paradox: row.paradox,
  pokerus: row.pokerus,
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
          attribute, level,
          hp_total, hp_iv, hp_ev, atk_total, atk_iv, atk_ev,
          def_total, def_iv, def_ev, spa_total, spa_iv, spa_ev,
          spd_total, spd_iv, spd_ev, spe_total, spe_iv, spe_ev,
          nature, characteristic, gender, friendship,
          ability1, ability2, moveset, img_link,
          shiny, alpha, shadow, paradox, pokerus
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
          $15, $16, $17, $18, $19, $20,
          $21, $22, $23, $24, $25, $26,
          $27, $28, $29, $30, $31, $32,
          $33, $34, $35, $36,
          $37, $38, $39, $40,
          $41, $42, $43, $44, $45
        )
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
        input.hpTotal ?? 50,
        input.hpIv ?? 0,
        input.hpEv ?? 0,
        input.atkTotal ?? 50,
        input.atkIv ?? 0,
        input.atkEv ?? 0,
        input.defTotal ?? 50,
        input.defIv ?? 0,
        input.defEv ?? 0,
        input.spaTotal ?? 50,
        input.spaIv ?? 0,
        input.spaEv ?? 0,
        input.spdTotal ?? 50,
        input.spdIv ?? 0,
        input.spdEv ?? 0,
        input.speTotal ?? 50,
        input.speIv ?? 0,
        input.speEv ?? 0,
        input.nature ?? null,
        input.characteristic ?? null,
        input.gender ?? null,
        input.friendship ?? 70,
        input.ability1 ?? null,
        input.ability2 ?? null,
        input.moveset ?? null,
        input.imgLink ?? null,
        input.shiny ?? false,
        input.alpha ?? false,
        input.shadow ?? false,
        input.paradox ?? false,
        input.pokerus ?? false,
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
