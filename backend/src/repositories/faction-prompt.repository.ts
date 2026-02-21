import { BaseRepository } from './base.repository';
import { db } from '../database';

export type FactionPromptRow = {
  id: number;
  faction_id: number;
  name: string;
  description: string | null;
  modifier: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
};

export type FactionPrompt = {
  id: number;
  factionId: number;
  name: string;
  description: string | null;
  modifier: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type FactionPromptWithDetails = FactionPrompt & {
  factionName: string | null;
  factionColor: string | null;
};

export type FactionPromptCreateInput = {
  factionId: number;
  name: string;
  description?: string | null;
  modifier?: number;
  isActive?: boolean;
};

export type FactionPromptUpdateInput = {
  name?: string;
  description?: string | null;
  modifier?: number;
  isActive?: boolean;
};

const normalizeFactionPrompt = (row: FactionPromptRow): FactionPrompt => ({
  id: row.id,
  factionId: row.faction_id,
  name: row.name,
  description: row.description,
  modifier: row.modifier,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

type FactionPromptWithDetailsRow = FactionPromptRow & {
  faction_name: string | null;
  faction_color: string | null;
};

const normalizeFactionPromptWithDetails = (row: FactionPromptWithDetailsRow): FactionPromptWithDetails => ({
  ...normalizeFactionPrompt(row),
  factionName: row.faction_name,
  factionColor: row.faction_color,
});

export class FactionPromptRepository extends BaseRepository<
  FactionPrompt,
  FactionPromptCreateInput,
  FactionPromptUpdateInput
> {
  constructor() {
    super('faction_prompts');
  }

  override async findById(id: number): Promise<FactionPromptWithDetails | null> {
    const result = await db.query<FactionPromptWithDetailsRow>(
      `
        SELECT fp.*, f.name as faction_name, f.color as faction_color
        FROM faction_prompts fp
        JOIN factions f ON fp.faction_id = f.id
        WHERE fp.id = $1
      `,
      [id]
    );
    const row = result.rows[0];
    return row ? normalizeFactionPromptWithDetails(row) : null;
  }

  async findByFactionId(factionId: number, activeOnly = true): Promise<FactionPrompt[]> {
    let query = `
      SELECT * FROM faction_prompts
      WHERE faction_id = $1
    `;
    const params: unknown[] = [factionId];

    if (activeOnly) {
      query += ' AND is_active::boolean = true';
    }

    query += ' ORDER BY modifier DESC, name ASC';

    const result = await db.query<FactionPromptRow>(query, params);
    return result.rows.map(normalizeFactionPrompt);
  }

  async findAllWithFactions(activeOnly = false): Promise<FactionPromptWithDetails[]> {
    let query = `
      SELECT fp.*, f.name as faction_name, f.color as faction_color
      FROM faction_prompts fp
      JOIN factions f ON fp.faction_id = f.id
    `;

    if (activeOnly) {
      query += ' WHERE fp.is_active::boolean = true';
    }

    query += ' ORDER BY f.name ASC, fp.modifier DESC, fp.name ASC';

    const result = await db.query<FactionPromptWithDetailsRow>(query);
    return result.rows.map(normalizeFactionPromptWithDetails);
  }

  override async create(input: FactionPromptCreateInput): Promise<FactionPrompt> {
    const result = await db.query<{ id: number }>(
      `
        INSERT INTO faction_prompts (faction_id, name, description, modifier, is_active)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `,
      [
        input.factionId,
        input.name,
        input.description ?? null,
        input.modifier ?? 0,
        input.isActive ?? true,
      ]
    );

    const insertedRow = result.rows[0];
    if (!insertedRow) {
      throw new Error('Failed to insert faction prompt');
    }
    const prompt = await this.findById(insertedRow.id);
    if (!prompt) {
      throw new Error('Failed to create faction prompt');
    }
    return prompt;
  }

  override async update(id: number, input: FactionPromptUpdateInput): Promise<FactionPrompt> {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (input.name !== undefined) {
      values.push(input.name);
      updates.push(`name = $${values.length}`);
    }
    if (input.description !== undefined) {
      values.push(input.description);
      updates.push(`description = $${values.length}`);
    }
    if (input.modifier !== undefined) {
      values.push(input.modifier);
      updates.push(`modifier = $${values.length}`);
    }
    if (input.isActive !== undefined) {
      values.push(input.isActive);
      updates.push(`is_active = $${values.length}`);
    }

    if (updates.length === 0) {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('Faction prompt not found');
      }
      return existing;
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await db.query(
      `UPDATE faction_prompts SET ${updates.join(', ')} WHERE id = $${values.length}`,
      values
    );

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Faction prompt not found after update');
    }
    return updated;
  }

  async setActive(id: number, isActive: boolean): Promise<FactionPrompt> {
    return this.update(id, { isActive });
  }

  override async delete(id: number): Promise<boolean> {
    const result = await db.query('DELETE FROM faction_prompts WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async getHighModifierPrompts(factionId: number, minModifier = 10): Promise<FactionPrompt[]> {
    const result = await db.query<FactionPromptRow>(
      `
        SELECT * FROM faction_prompts
        WHERE faction_id = $1 AND is_active::boolean = true AND modifier >= $2
        ORDER BY modifier DESC, name ASC
      `,
      [factionId, minModifier]
    );
    return result.rows.map(normalizeFactionPrompt);
  }
}
