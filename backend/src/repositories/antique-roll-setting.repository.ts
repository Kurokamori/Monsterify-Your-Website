import { BaseRepository } from './base.repository';
import { db } from '../database';

export type AntiqueRollSettingRow = {
  id: number;
  item_name: string;
  fusion_forced: boolean;
  min_types: number;
  max_types: number;
  allowed_types: string | object | null;
  allowed_attributes: string | object | null;
  allowed_species: string | object | null;
  description: string | null;
  config: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
};

export type AntiqueRollSetting = {
  id: number;
  itemName: string;
  fusionForced: boolean;
  minTypes: number;
  maxTypes: number;
  allowedTypes: string[];
  allowedAttributes: string[];
  allowedSpecies: string[];
  description: string | null;
  config: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AntiqueRollSettingCreateInput = {
  itemName: string;
  fusionForced?: boolean;
  minTypes?: number;
  maxTypes?: number;
  allowedTypes?: string[];
  allowedAttributes?: string[];
  allowedSpecies?: string[];
  description?: string | null;
};

export type AntiqueRollSettingUpdateInput = Partial<AntiqueRollSettingCreateInput>;

const parseJsonField = <T>(value: string | object | null, defaultValue: T): T => {
  if (!value) {return defaultValue;}
  if (Array.isArray(value)) {return value as T;}
  if (typeof value === 'object') {return defaultValue;}
  try {
    if (value === '[object Object]' || value.includes('[object Object]')) {
      return defaultValue;
    }
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const normalizeAntiqueRollSetting = (row: AntiqueRollSettingRow): AntiqueRollSetting => ({
  id: row.id,
  itemName: row.item_name,
  fusionForced: row.fusion_forced,
  minTypes: row.min_types,
  maxTypes: row.max_types,
  allowedTypes: parseJsonField(row.allowed_types, []),
  allowedAttributes: parseJsonField(row.allowed_attributes, []),
  allowedSpecies: parseJsonField(row.allowed_species, []),
  description: row.description,
  config: row.config ?? null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export class AntiqueRollSettingRepository extends BaseRepository<
  AntiqueRollSetting,
  AntiqueRollSettingCreateInput,
  AntiqueRollSettingUpdateInput
> {
  constructor() {
    super('antique_roll_settings');
  }

  override async findById(id: number): Promise<AntiqueRollSetting | null> {
    const result = await db.query<AntiqueRollSettingRow>(
      'SELECT * FROM antique_roll_settings WHERE id = $1',
      [id]
    );
    const row = result.rows[0];
    return row ? normalizeAntiqueRollSetting(row) : null;
  }

  async findByItemName(itemName: string): Promise<AntiqueRollSetting | null> {
    const result = await db.query<AntiqueRollSettingRow>(
      'SELECT * FROM antique_roll_settings WHERE item_name = $1',
      [itemName]
    );
    const row = result.rows[0];
    return row ? normalizeAntiqueRollSetting(row) : null;
  }

  async findAll(): Promise<AntiqueRollSetting[]> {
    const result = await db.query<AntiqueRollSettingRow>(
      'SELECT * FROM antique_roll_settings ORDER BY item_name ASC'
    );
    return result.rows.map(normalizeAntiqueRollSetting);
  }

  override async create(input: AntiqueRollSettingCreateInput): Promise<AntiqueRollSetting> {
    const allowedTypesJson = JSON.stringify(input.allowedTypes ?? []);
    const allowedAttributesJson = JSON.stringify(input.allowedAttributes ?? []);
    const allowedSpeciesJson = JSON.stringify(input.allowedSpecies ?? []);

    const result = await db.query<{ id: number }>(
      `
        INSERT INTO antique_roll_settings (
          item_name, fusion_forced, min_types, max_types,
          allowed_types, allowed_attributes, allowed_species, description
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `,
      [
        input.itemName,
        input.fusionForced ?? false,
        input.minTypes ?? 1,
        input.maxTypes ?? 5,
        allowedTypesJson,
        allowedAttributesJson,
        allowedSpeciesJson,
        input.description ?? null,
      ]
    );

    const insertedRow = result.rows[0];
    if (!insertedRow) {
      throw new Error('Failed to insert antique roll setting');
    }
    const setting = await this.findById(insertedRow.id);
    if (!setting) {
      throw new Error('Failed to create antique roll setting');
    }
    return setting;
  }

  override async update(id: number, input: AntiqueRollSettingUpdateInput): Promise<AntiqueRollSetting> {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (input.itemName !== undefined) {
      values.push(input.itemName);
      updates.push(`item_name = $${values.length}`);
    }
    if (input.fusionForced !== undefined) {
      values.push(input.fusionForced);
      updates.push(`fusion_forced = $${values.length}`);
    }
    if (input.minTypes !== undefined) {
      values.push(input.minTypes);
      updates.push(`min_types = $${values.length}`);
    }
    if (input.maxTypes !== undefined) {
      values.push(input.maxTypes);
      updates.push(`max_types = $${values.length}`);
    }
    if (input.allowedTypes !== undefined) {
      values.push(JSON.stringify(input.allowedTypes));
      updates.push(`allowed_types = $${values.length}`);
    }
    if (input.allowedAttributes !== undefined) {
      values.push(JSON.stringify(input.allowedAttributes));
      updates.push(`allowed_attributes = $${values.length}`);
    }
    if (input.allowedSpecies !== undefined) {
      values.push(JSON.stringify(input.allowedSpecies));
      updates.push(`allowed_species = $${values.length}`);
    }
    if (input.description !== undefined) {
      values.push(input.description);
      updates.push(`description = $${values.length}`);
    }

    if (updates.length === 0) {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('Antique roll setting not found');
      }
      return existing;
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await db.query(
      `UPDATE antique_roll_settings SET ${updates.join(', ')} WHERE id = $${values.length}`,
      values
    );

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Antique roll setting not found after update');
    }
    return updated;
  }

  override async delete(id: number): Promise<boolean> {
    const result = await db.query('DELETE FROM antique_roll_settings WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async getUniqueItemNames(): Promise<string[]> {
    const result = await db.query<{ item_name: string }>(
      'SELECT DISTINCT item_name FROM antique_roll_settings ORDER BY item_name ASC'
    );
    return result.rows.map(row => row.item_name);
  }

  async upsertConfig(itemName: string, config: Record<string, unknown>): Promise<AntiqueRollSetting> {
    const result = await db.query<AntiqueRollSettingRow>(
      `INSERT INTO antique_roll_settings (item_name, config)
       VALUES ($1, $2::jsonb)
       ON CONFLICT (item_name) DO UPDATE SET config = $2::jsonb, updated_at = NOW()
       RETURNING *`,
      [itemName, JSON.stringify(config)]
    );
    const row = result.rows[0];
    if (!row) {
      throw new Error('Failed to upsert antique config');
    }
    return normalizeAntiqueRollSetting(row);
  }

  async deleteByItemName(itemName: string): Promise<boolean> {
    const result = await db.query(
      'DELETE FROM antique_roll_settings WHERE item_name = $1',
      [itemName]
    );
    return (result.rowCount ?? 0) > 0;
  }
}
