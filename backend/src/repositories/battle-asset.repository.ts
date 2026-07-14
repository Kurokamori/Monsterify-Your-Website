import { BaseRepository } from './base.repository';
import { db } from '../database';

/**
 * A reusable battle-visual asset: a background scene, a "place-spot" (the little
 * patch of ground drawn under each monster), or a text-box skin (a nine-slice PNG
 * used to frame battle dialogue). Uploaded to Cloudinary or linked by URL and
 * managed in the Battle Assets admin tool.
 */
export type BattleAssetKind = 'background' | 'spot' | 'textbox';

export const BATTLE_ASSET_KINDS: BattleAssetKind[] = ['background', 'spot', 'textbox'];

export type BattleAssetRow = {
  id: number;
  kind: BattleAssetKind;
  name: string;
  img_link: string;
  /** For text-box skins: the nine-slice inset in px (border-image-slice / width). */
  slice_inset: number | null;
  /** Draw with nearest-neighbour scaling (CSS image-rendering: pixelated) for pixel art. */
  pixelated: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
};

export type BattleAsset = {
  id: number;
  kind: BattleAssetKind;
  name: string;
  imgLink: string;
  sliceInset: number | null;
  pixelated: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type BattleAssetCreateInput = {
  kind: BattleAssetKind;
  name: string;
  imgLink: string;
  sliceInset?: number | null;
  pixelated?: boolean;
  isActive?: boolean;
};

export type BattleAssetUpdateInput = Partial<BattleAssetCreateInput>;

const normalize = (row: BattleAssetRow): BattleAsset => ({
  id: row.id,
  kind: row.kind,
  name: row.name,
  imgLink: row.img_link,
  sliceInset: row.slice_inset,
  pixelated: row.pixelated,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export class BattleAssetRepository extends BaseRepository<
  BattleAsset,
  BattleAssetCreateInput,
  BattleAssetUpdateInput
> {
  constructor() {
    super('battle_assets');
  }

  override async findById(id: number): Promise<BattleAsset | null> {
    const result = await db.query<BattleAssetRow>('SELECT * FROM battle_assets WHERE id = $1', [id]);
    const row = result.rows[0];
    return row ? normalize(row) : null;
  }

  async findAll(): Promise<BattleAsset[]> {
    const result = await db.query<BattleAssetRow>(
      'SELECT * FROM battle_assets ORDER BY kind, name, id'
    );
    return result.rows.map(normalize);
  }

  async findActiveByKind(kind: BattleAssetKind): Promise<BattleAsset[]> {
    const result = await db.query<BattleAssetRow>(
      'SELECT * FROM battle_assets WHERE kind = $1 AND is_active = TRUE ORDER BY name, id',
      [kind]
    );
    return result.rows.map(normalize);
  }

  /** Pick a random active asset of the given kind (used for "random" appearance). */
  async findRandomByKind(kind: BattleAssetKind): Promise<BattleAsset | null> {
    const result = await db.query<BattleAssetRow>(
      'SELECT * FROM battle_assets WHERE kind = $1 AND is_active = TRUE ORDER BY random() LIMIT 1',
      [kind]
    );
    const row = result.rows[0];
    return row ? normalize(row) : null;
  }

  override async create(input: BattleAssetCreateInput): Promise<BattleAsset> {
    const result = await db.query<BattleAssetRow>(
      `
        INSERT INTO battle_assets (kind, name, img_link, slice_inset, pixelated, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `,
      [
        input.kind,
        input.name,
        input.imgLink,
        input.sliceInset ?? null,
        input.pixelated ?? false,
        input.isActive ?? true,
      ]
    );
    const row = result.rows[0];
    if (!row) {
      throw new Error('Failed to create battle asset');
    }
    return normalize(row);
  }

  override async update(id: number, input: BattleAssetUpdateInput): Promise<BattleAsset> {
    const updates: string[] = [];
    const values: unknown[] = [];
    const push = (column: string, value: unknown): void => {
      values.push(value);
      updates.push(`${column} = $${values.length}`);
    };

    if (input.kind !== undefined) {push('kind', input.kind);}
    if (input.name !== undefined) {push('name', input.name);}
    if (input.imgLink !== undefined) {push('img_link', input.imgLink);}
    if (input.sliceInset !== undefined) {push('slice_inset', input.sliceInset);}
    if (input.pixelated !== undefined) {push('pixelated', input.pixelated);}
    if (input.isActive !== undefined) {push('is_active', input.isActive);}

    if (updates.length === 0) {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('Battle asset not found');
      }
      return existing;
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    await db.query(`UPDATE battle_assets SET ${updates.join(', ')} WHERE id = $${values.length}`, values);

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Battle asset not found after update');
    }
    return updated;
  }
}
