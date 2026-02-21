import { BaseRepository } from './base.repository';
import { db } from '../database';

export type AntiqueSettingRow = {
  id: number;
  item_name: string;
  category: string;
  holiday: string;
  description: string | null;
  roll_count: number;
  force_fusion: boolean | null;
  force_no_fusion: boolean | null;
  allow_fusion: boolean | null;
  force_min_types: number | null;
  override_parameters: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
};

export type AntiqueSetting = {
  id: number;
  itemName: string;
  category: string;
  holiday: string;
  description: string | null;
  rollCount: number;
  forceFusion: boolean | null;
  forceNoFusion: boolean | null;
  allowFusion: boolean | null;
  forceMinTypes: number | null;
  overrideParameters: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
};

export type AntiqueSettingUpsertInput = {
  itemName: string;
  category: string;
  holiday: string;
  description?: string | null;
  rollCount?: number;
  forceFusion?: boolean | null;
  forceNoFusion?: boolean | null;
  allowFusion?: boolean | null;
  forceMinTypes?: number | null;
  overrideParameters?: Record<string, unknown>;
};

const normalizeAntiqueSetting = (row: AntiqueSettingRow): AntiqueSetting => ({
  id: row.id,
  itemName: row.item_name,
  category: row.category,
  holiday: row.holiday,
  description: row.description,
  rollCount: row.roll_count,
  forceFusion: row.force_fusion,
  forceNoFusion: row.force_no_fusion,
  allowFusion: row.allow_fusion,
  forceMinTypes: row.force_min_types,
  overrideParameters: typeof row.override_parameters === 'string'
    ? JSON.parse(row.override_parameters)
    : (row.override_parameters ?? {}),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export class AntiqueSettingRepository extends BaseRepository<
  AntiqueSetting,
  AntiqueSettingUpsertInput,
  Partial<AntiqueSettingUpsertInput>
> {
  constructor() {
    super('antique_settings');
  }

  override async findById(id: number): Promise<AntiqueSetting | null> {
    const result = await db.query<AntiqueSettingRow>(
      'SELECT * FROM antique_settings WHERE id = $1',
      [id]
    );
    const row = result.rows[0];
    return row ? normalizeAntiqueSetting(row) : null;
  }

  async findByItemName(itemName: string): Promise<AntiqueSetting | null> {
    const result = await db.query<AntiqueSettingRow>(
      'SELECT * FROM antique_settings WHERE item_name = $1',
      [itemName]
    );
    const row = result.rows[0];
    return row ? normalizeAntiqueSetting(row) : null;
  }

  async findAll(): Promise<AntiqueSetting[]> {
    const result = await db.query<AntiqueSettingRow>(
      'SELECT * FROM antique_settings ORDER BY category ASC, holiday ASC, item_name ASC'
    );
    return result.rows.map(normalizeAntiqueSetting);
  }

  async upsert(input: AntiqueSettingUpsertInput): Promise<AntiqueSetting> {
    const result = await db.query<AntiqueSettingRow>(
      `INSERT INTO antique_settings
        (item_name, category, holiday, description, roll_count,
         force_fusion, force_no_fusion, allow_fusion, force_min_types,
         override_parameters)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)
       ON CONFLICT (item_name) DO UPDATE SET
         category = EXCLUDED.category,
         holiday = EXCLUDED.holiday,
         description = EXCLUDED.description,
         roll_count = EXCLUDED.roll_count,
         force_fusion = EXCLUDED.force_fusion,
         force_no_fusion = EXCLUDED.force_no_fusion,
         allow_fusion = EXCLUDED.allow_fusion,
         force_min_types = EXCLUDED.force_min_types,
         override_parameters = EXCLUDED.override_parameters,
         updated_at = NOW()
       RETURNING *`,
      [
        input.itemName,
        input.category,
        input.holiday,
        input.description ?? null,
        input.rollCount ?? 1,
        input.forceFusion ?? null,
        input.forceNoFusion ?? null,
        input.allowFusion ?? null,
        input.forceMinTypes ?? null,
        JSON.stringify(input.overrideParameters ?? {}),
      ]
    );
    const row = result.rows[0];
    if (!row) {
      throw new Error('Failed to upsert antique setting');
    }
    return normalizeAntiqueSetting(row);
  }

  async deleteByItemName(itemName: string): Promise<boolean> {
    const result = await db.query(
      'DELETE FROM antique_settings WHERE item_name = $1',
      [itemName]
    );
    return (result.rowCount ?? 0) > 0;
  }

  override async create(input: AntiqueSettingUpsertInput): Promise<AntiqueSetting> {
    return this.upsert(input);
  }

  override async update(id: number, input: Partial<AntiqueSettingUpsertInput>): Promise<AntiqueSetting> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error('Antique setting not found');
    }
    return this.upsert({
      itemName: input.itemName ?? existing.itemName,
      category: input.category ?? existing.category,
      holiday: input.holiday ?? existing.holiday,
      description: input.description !== undefined ? input.description : existing.description,
      rollCount: input.rollCount ?? existing.rollCount,
      forceFusion: input.forceFusion !== undefined ? input.forceFusion : existing.forceFusion,
      forceNoFusion: input.forceNoFusion !== undefined ? input.forceNoFusion : existing.forceNoFusion,
      allowFusion: input.allowFusion !== undefined ? input.allowFusion : existing.allowFusion,
      forceMinTypes: input.forceMinTypes !== undefined ? input.forceMinTypes : existing.forceMinTypes,
      overrideParameters: input.overrideParameters ?? existing.overrideParameters,
    });
  }

  override async delete(id: number): Promise<boolean> {
    const result = await db.query('DELETE FROM antique_settings WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
