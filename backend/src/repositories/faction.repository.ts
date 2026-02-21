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
  updated_at: Date;
};

export type FactionTitleRow = {
  id: number;
  faction_id: number;
  title_name: string;
  standing_requirement: number;
  is_positive: boolean;
  created_at: Date;
};

export type FactionRelationshipRow = {
  id: number;
  faction_id: number;
  related_faction_id: number;
  relationship_type: string;
  related_faction_name?: string;
  created_at: Date;
};

export type FactionStandingRow = {
  id: number;
  trainer_id: number;
  faction_id: number;
  standing: number;
  created_at: Date;
  updated_at: Date;
};

export type FactionStoreItemRow = {
  id: number;
  faction_id: number;
  item_name: string;
  price: number;
  standing_requirement: number;
  is_active: boolean;
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
        SELECT * FROM faction_stores
        WHERE faction_id = $1 AND is_active::boolean = true
        ORDER BY standing_requirement ASC, price ASC
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
          SET standing = $1, updated_at = CURRENT_TIMESTAMP
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
          SET standing = $1, updated_at = CURRENT_TIMESTAMP
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

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
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
}
