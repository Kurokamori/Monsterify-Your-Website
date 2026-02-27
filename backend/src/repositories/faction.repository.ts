import { BaseRepository } from './base.repository';
import { db } from '../database';

export type FactionRow = {
  id: number;
  name: string;
  description: string | null;
  banner_image: string | null;
  icon_image: string | null;
  color: string | null;
  created_at: Date;
};

export type FactionTitleRow = {
  id: number;
  faction_id: number;
  name: string;
  standing_requirement: number;
  is_positive: boolean;
  created_at: Date;
};

export type FactionRelationshipRow = {
  id: number;
  faction_id: number;
  related_faction_id: number;
  relationship_type: string;
  standing_modifier: number;
  related_faction_name?: string;
  created_at: Date;
};

export type FactionStandingRow = {
  id: number;
  trainer_id: number;
  faction_id: number;
  standing: number;
  created_at: Date;
};

export type FactionStoreItemRow = {
  id: number;
  faction_id: number;
  item_name: string;
  price: number;
  standing_requirement: number;
  is_active: boolean;
  item_category: string | null;
  title_id: number | null;
  title_name?: string | null;
  created_at: Date;
};

export type FactionCreateInput = {
  name: string;
  description?: string | null;
  bannerImage?: string | null;
  iconImage?: string | null;
  color?: string | null;
};

export type FactionUpdateInput = {
  name?: string;
  description?: string | null;
  bannerImage?: string | null;
  iconImage?: string | null;
  color?: string | null;
};

export class FactionRepository extends BaseRepository<FactionRow, FactionCreateInput, FactionUpdateInput> {
  constructor() {
    super('factions');
  }

  async findAll(): Promise<FactionRow[]> {
    const result = await db.query<FactionRow>(
      'SELECT * FROM factions ORDER BY name'
    );
    return result.rows;
  }

  override async findById(id: number): Promise<FactionRow | null> {
    const result = await db.query<FactionRow>(
      'SELECT * FROM factions WHERE id = $1',
      [id]
    );
    return result.rows[0] ?? null;
  }

  async findByName(name: string): Promise<FactionRow | null> {
    const result = await db.query<FactionRow>(
      'SELECT * FROM factions WHERE name = $1',
      [name]
    );
    return result.rows[0] ?? null;
  }

  async getTitles(factionId: number): Promise<FactionTitleRow[]> {
    const result = await db.query<FactionTitleRow>(
      `
        SELECT * FROM faction_titles
        WHERE faction_id = $1
        ORDER BY standing_requirement ASC
      `,
      [factionId]
    );
    return result.rows;
  }

  async getRelationships(factionId: number): Promise<FactionRelationshipRow[]> {
    const result = await db.query<FactionRelationshipRow>(
      `
        SELECT fr.*, f.name as related_faction_name
        FROM faction_relationships fr
        JOIN factions f ON fr.related_faction_id = f.id
        WHERE fr.faction_id = $1
      `,
      [factionId]
    );
    return result.rows;
  }

  async getStoreItems(factionId: number): Promise<FactionStoreItemRow[]> {
    const result = await db.query<FactionStoreItemRow>(
      `
        SELECT fs.*, ft.name as title_name
        FROM faction_stores fs
        LEFT JOIN faction_titles ft ON fs.title_id = ft.id
        WHERE fs.faction_id = $1 AND fs.is_active::boolean = true
        ORDER BY fs.standing_requirement ASC, fs.price ASC
      `,
      [factionId]
    );
    return result.rows;
  }

  async getTrainerStanding(trainerId: number, factionId: number): Promise<FactionStandingRow | null> {
    const result = await db.query<FactionStandingRow>(
      'SELECT * FROM faction_standings WHERE trainer_id = $1 AND faction_id = $2',
      [trainerId, factionId]
    );
    return result.rows[0] ?? null;
  }

  async getAllTrainerStandings(trainerId: number): Promise<(FactionStandingRow & { faction_name: string })[]> {
    const result = await db.query<FactionStandingRow & { faction_name: string }>(
      `
        SELECT fs.*, f.name as faction_name
        FROM faction_standings fs
        JOIN factions f ON fs.faction_id = f.id
        WHERE fs.trainer_id = $1
        ORDER BY f.name
      `,
      [trainerId]
    );
    return result.rows;
  }

  async updateTrainerStanding(trainerId: number, factionId: number, standingDelta: number): Promise<FactionStandingRow> {
    const existing = await this.getTrainerStanding(trainerId, factionId);

    if (existing) {
      const newStanding = existing.standing + standingDelta;
      await db.query(
        `
          UPDATE faction_standings
          SET standing = $1
          WHERE trainer_id = $2 AND faction_id = $3
        `,
        [newStanding, trainerId, factionId]
      );
    } else {
      await db.query(
        `
          INSERT INTO faction_standings (trainer_id, faction_id, standing)
          VALUES ($1, $2, $3)
        `,
        [trainerId, factionId, standingDelta]
      );
    }

    const updated = await this.getTrainerStanding(trainerId, factionId);
    if (!updated) {
      throw new Error('Failed to retrieve updated standing');
    }
    return updated;
  }

  async setTrainerStanding(trainerId: number, factionId: number, standing: number): Promise<FactionStandingRow> {
    const existing = await this.getTrainerStanding(trainerId, factionId);

    if (existing) {
      await db.query(
        `
          UPDATE faction_standings
          SET standing = $1
          WHERE trainer_id = $2 AND faction_id = $3
        `,
        [standing, trainerId, factionId]
      );
    } else {
      await db.query(
        `
          INSERT INTO faction_standings (trainer_id, faction_id, standing)
          VALUES ($1, $2, $3)
        `,
        [trainerId, factionId, standing]
      );
    }

    const updated = await this.getTrainerStanding(trainerId, factionId);
    if (!updated) {
      throw new Error('Failed to retrieve updated standing');
    }
    return updated;
  }

  override async create(input: FactionCreateInput): Promise<FactionRow> {
    const result = await db.query<FactionRow>(
      `
        INSERT INTO factions (name, description, banner_image, icon_image, color)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `,
      [
        input.name,
        input.description ?? null,
        input.bannerImage ?? null,
        input.iconImage ?? null,
        input.color ?? null,
      ]
    );
    const insertedRow = result.rows[0];
    if (!insertedRow) {
      throw new Error('Failed to insert faction');
    }
    return insertedRow;
  }

  override async update(id: number, input: FactionUpdateInput): Promise<FactionRow> {
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
    if (input.bannerImage !== undefined) {
      values.push(input.bannerImage);
      updates.push(`banner_image = $${values.length}`);
    }
    if (input.iconImage !== undefined) {
      values.push(input.iconImage);
      updates.push(`icon_image = $${values.length}`);
    }
    if (input.color !== undefined) {
      values.push(input.color);
      updates.push(`color = $${values.length}`);
    }

    if (updates.length === 0) {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('Faction not found');
      }
      return existing;
    }

    values.push(id);

    const result = await db.query<FactionRow>(
      `UPDATE factions SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    );

    const updatedRow = result.rows[0];
    if (!updatedRow) {
      throw new Error('Faction not found after update');
    }
    return updatedRow;
  }

  // ===========================================================================
  // Admin: Titles
  // ===========================================================================

  async createTitle(factionId: number, data: { titleName: string; standingRequirement: number; isPositive: boolean }): Promise<FactionTitleRow> {
    const result = await db.query<FactionTitleRow>(
      `INSERT INTO faction_titles (faction_id, name, standing_requirement, is_positive)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [factionId, data.titleName, data.standingRequirement, data.isPositive]
    );
    const row = result.rows[0];
    if (!row) { throw new Error('Failed to create title'); }
    return row;
  }

  async updateTitle(titleId: number, data: { titleName?: string; standingRequirement?: number; isPositive?: boolean }): Promise<FactionTitleRow> {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (data.titleName !== undefined) {
      values.push(data.titleName);
      updates.push(`name = $${values.length}`);
    }
    if (data.standingRequirement !== undefined) {
      values.push(data.standingRequirement);
      updates.push(`standing_requirement = $${values.length}`);
    }
    if (data.isPositive !== undefined) {
      values.push(data.isPositive);
      updates.push(`is_positive = $${values.length}`);
    }

    if (updates.length === 0) {
      const existing = await db.query<FactionTitleRow>('SELECT * FROM faction_titles WHERE id = $1', [titleId]);
      const row = existing.rows[0];
      if (!row) { throw new Error('Title not found'); }
      return row;
    }

    values.push(titleId);
    const result = await db.query<FactionTitleRow>(
      `UPDATE faction_titles SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    );
    const row = result.rows[0];
    if (!row) { throw new Error('Title not found after update'); }
    return row;
  }

  async deleteTitle(titleId: number): Promise<boolean> {
    const result = await db.query('DELETE FROM faction_titles WHERE id = $1', [titleId]);
    return (result.rowCount ?? 0) > 0;
  }

  // ===========================================================================
  // Admin: Relationships
  // ===========================================================================

  async getAllRelationships(factionId: number): Promise<FactionRelationshipRow[]> {
    const result = await db.query<FactionRelationshipRow>(
      `SELECT fr.*, f.name as related_faction_name
       FROM faction_relationships fr
       JOIN factions f ON fr.related_faction_id = f.id
       WHERE fr.faction_id = $1
       ORDER BY f.name`,
      [factionId]
    );
    return result.rows;
  }

  async createRelationship(data: { factionId: number; relatedFactionId: number; relationshipType: string; standingModifier: number }): Promise<FactionRelationshipRow> {
    const result = await db.query<FactionRelationshipRow>(
      `INSERT INTO faction_relationships (faction_id, related_faction_id, relationship_type, standing_modifier)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [data.factionId, data.relatedFactionId, data.relationshipType, data.standingModifier]
    );
    const row = result.rows[0];
    if (!row) { throw new Error('Failed to create relationship'); }
    return row;
  }

  async updateRelationship(relationshipId: number, data: { relatedFactionId?: number; relationshipType?: string; standingModifier?: number }): Promise<FactionRelationshipRow> {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (data.relatedFactionId !== undefined) {
      values.push(data.relatedFactionId);
      updates.push(`related_faction_id = $${values.length}`);
    }
    if (data.relationshipType !== undefined) {
      values.push(data.relationshipType);
      updates.push(`relationship_type = $${values.length}`);
    }
    if (data.standingModifier !== undefined) {
      values.push(data.standingModifier);
      updates.push(`standing_modifier = $${values.length}`);
    }

    if (updates.length === 0) {
      const existing = await db.query<FactionRelationshipRow>('SELECT * FROM faction_relationships WHERE id = $1', [relationshipId]);
      const row = existing.rows[0];
      if (!row) { throw new Error('Relationship not found'); }
      return row;
    }

    values.push(relationshipId);
    const result = await db.query<FactionRelationshipRow>(
      `UPDATE faction_relationships SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    );
    const row = result.rows[0];
    if (!row) { throw new Error('Relationship not found after update'); }
    return row;
  }

  async deleteRelationship(relationshipId: number): Promise<boolean> {
    const result = await db.query('DELETE FROM faction_relationships WHERE id = $1', [relationshipId]);
    return (result.rowCount ?? 0) > 0;
  }

  // ===========================================================================
  // Admin: Store Items
  // ===========================================================================

  async getAllStoreItemsAdmin(factionId: number): Promise<FactionStoreItemRow[]> {
    const result = await db.query<FactionStoreItemRow>(
      `SELECT fs.*, ft.name as title_name
       FROM faction_stores fs
       LEFT JOIN faction_titles ft ON fs.title_id = ft.id
       WHERE fs.faction_id = $1
       ORDER BY fs.standing_requirement ASC, fs.price ASC`,
      [factionId]
    );
    return result.rows;
  }

  async createStoreItem(data: { factionId: number; itemName: string; price: number; standingRequirement?: number; isActive?: boolean; itemCategory?: string | null; titleId?: number | null }): Promise<FactionStoreItemRow> {
    const result = await db.query<FactionStoreItemRow>(
      `INSERT INTO faction_stores (faction_id, item_name, price, standing_requirement, is_active, item_category, title_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [data.factionId, data.itemName, data.price, data.standingRequirement ?? 0, data.isActive ?? true, data.itemCategory ?? null, data.titleId ?? null]
    );
    const row = result.rows[0];
    if (!row) { throw new Error('Failed to create store item'); }
    return row;
  }

  async updateStoreItem(itemId: number, data: { itemName?: string; price?: number; standingRequirement?: number; isActive?: boolean; itemCategory?: string | null; titleId?: number | null }): Promise<FactionStoreItemRow> {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (data.itemName !== undefined) {
      values.push(data.itemName);
      updates.push(`item_name = $${values.length}`);
    }
    if (data.price !== undefined) {
      values.push(data.price);
      updates.push(`price = $${values.length}`);
    }
    if (data.standingRequirement !== undefined) {
      values.push(data.standingRequirement);
      updates.push(`standing_requirement = $${values.length}`);
    }
    if (data.isActive !== undefined) {
      values.push(data.isActive);
      updates.push(`is_active = $${values.length}`);
    }
    if (data.itemCategory !== undefined) {
      values.push(data.itemCategory);
      updates.push(`item_category = $${values.length}`);
    }
    if (data.titleId !== undefined) {
      values.push(data.titleId);
      updates.push(`title_id = $${values.length}`);
    }

    if (updates.length === 0) {
      const existing = await db.query<FactionStoreItemRow>('SELECT * FROM faction_stores WHERE id = $1', [itemId]);
      const row = existing.rows[0];
      if (!row) { throw new Error('Store item not found'); }
      return row;
    }

    values.push(itemId);
    const result = await db.query<FactionStoreItemRow>(
      `UPDATE faction_stores SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    );
    const row = result.rows[0];
    if (!row) { throw new Error('Store item not found after update'); }
    return row;
  }

  async deleteStoreItem(itemId: number): Promise<boolean> {
    const result = await db.query('DELETE FROM faction_stores WHERE id = $1', [itemId]);
    return (result.rowCount ?? 0) > 0;
  }

  // ===========================================================================
  // Admin: Bulk Property Update
  // ===========================================================================

  async bulkUpdateProperty(property: string, updates: { id: number; value: string | null }[]): Promise<FactionRow[]> {
    const allowedColumns: Record<string, string> = {
      name: 'name',
      description: 'description',
      banner_image: 'banner_image',
      icon_image: 'icon_image',
      color: 'color',
    };

    const column = allowedColumns[property];
    if (!column) {
      throw new Error(`Invalid property: ${property}`);
    }

    const results: FactionRow[] = [];
    for (const update of updates) {
      const result = await db.query<FactionRow>(
        `UPDATE factions SET ${column} = $1 WHERE id = $2 RETURNING *`,
        [update.value, update.id]
      );
      const row = result.rows[0];
      if (row) { results.push(row); }
    }
    return results;
  }
}
