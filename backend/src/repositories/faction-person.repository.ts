import { BaseRepository } from './base.repository';
import { db } from '../database';

export type FactionPersonRow = {
  id: number;
  faction_id: number;
  name: string;
  alias: string | null;
  standing_requirement: number;
  blurb: string | null;
  short_bio: string | null;
  long_bio: string | null;
  role: string | null;
  available_assistance: string | null;
  images: string | object | null;
  standing_reward: number;
  created_at: Date;
  updated_at: Date;
};

export type FactionPerson = {
  id: number;
  factionId: number;
  name: string;
  alias: string | null;
  standingRequirement: number;
  blurb: string | null;
  shortBio: string | null;
  longBio: string | null;
  role: string | null;
  availableAssistance: string | null;
  images: Record<string, string>;
  standingReward: number;
  createdAt: Date;
  updatedAt: Date;
};

export type FactionPersonWithDetails = FactionPerson & {
  factionName: string | null;
  factionColor: string | null;
};

export type FactionPersonMonsterRow = {
  id: number;
  person_id: number;
  name: string;
  species: string | object | null;
  types: string | object | null;
  attribute: string | null;
  image: string | null;
  position: number;
  created_at: Date;
};

export type FactionPersonMonster = {
  id: number;
  personId: number;
  name: string;
  species: string[];
  types: string[];
  attribute: string | null;
  image: string | null;
  position: number;
  createdAt: Date;
};

export type FactionPersonCreateInput = {
  factionId: number;
  name: string;
  alias?: string | null;
  standingRequirement?: number;
  blurb?: string | null;
  shortBio?: string | null;
  longBio?: string | null;
  role?: string | null;
  availableAssistance?: string | null;
  images?: Record<string, string>;
  standingReward?: number;
};

export type FactionPersonUpdateInput = Partial<FactionPersonCreateInput>;

export type FactionPersonMonsterCreateInput = {
  personId: number;
  name: string;
  species?: string[];
  types?: string[];
  attribute?: string | null;
  image?: string | null;
  position?: number;
};

const parseJsonField = <T>(value: string | object | null, defaultValue: T): T => {
  if (!value) {return defaultValue;}
  if (typeof value === 'object') {return value as T;}
  try {
    if (value === '[object Object]' || value.includes('[object Object]')) {
      return defaultValue;
    }
    return JSON.parse(value);
  } catch {
    return defaultValue;
  }
};

const normalizeFactionPerson = (row: FactionPersonRow): FactionPerson => ({
  id: row.id,
  factionId: row.faction_id,
  name: row.name,
  alias: row.alias,
  standingRequirement: row.standing_requirement,
  blurb: row.blurb,
  shortBio: row.short_bio,
  longBio: row.long_bio,
  role: row.role,
  availableAssistance: row.available_assistance,
  images: parseJsonField(row.images, {}),
  standingReward: row.standing_reward,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

type FactionPersonWithDetailsRow = FactionPersonRow & {
  faction_name: string | null;
  faction_color: string | null;
};

const normalizeFactionPersonWithDetails = (row: FactionPersonWithDetailsRow): FactionPersonWithDetails => ({
  ...normalizeFactionPerson(row),
  factionName: row.faction_name,
  factionColor: row.faction_color,
});

const normalizeFactionPersonMonster = (row: FactionPersonMonsterRow): FactionPersonMonster => ({
  id: row.id,
  personId: row.person_id,
  name: row.name,
  species: parseJsonField(row.species, []),
  types: parseJsonField(row.types, []),
  attribute: row.attribute,
  image: row.image,
  position: row.position,
  createdAt: row.created_at,
});

export class FactionPersonRepository extends BaseRepository<
  FactionPerson,
  FactionPersonCreateInput,
  FactionPersonUpdateInput
> {
  constructor() {
    super('faction_people');
  }

  override async findById(id: number): Promise<FactionPersonWithDetails | null> {
    const result = await db.query<FactionPersonWithDetailsRow>(
      `
        SELECT fp.*, f.name as faction_name, f.color as faction_color
        FROM faction_people fp
        LEFT JOIN factions f ON fp.faction_id = f.id
        WHERE fp.id = $1
      `,
      [id]
    );
    const row = result.rows[0];
    return row ? normalizeFactionPersonWithDetails(row) : null;
  }

  async findByFactionId(factionId: number): Promise<FactionPerson[]> {
    const result = await db.query<FactionPersonRow>(
      `
        SELECT * FROM faction_people
        WHERE faction_id = $1
        ORDER BY standing_requirement ASC, name ASC
      `,
      [factionId]
    );
    return result.rows.map(normalizeFactionPerson);
  }

  async findByStandingRequirement(factionId: number, minStanding: number): Promise<FactionPerson[]> {
    const result = await db.query<FactionPersonRow>(
      `
        SELECT * FROM faction_people
        WHERE faction_id = $1 AND standing_requirement <= $2
        ORDER BY standing_requirement ASC, name ASC
      `,
      [factionId, minStanding]
    );
    return result.rows.map(normalizeFactionPerson);
  }

  async getPersonTeam(personId: number): Promise<FactionPersonMonster[]> {
    const result = await db.query<FactionPersonMonsterRow>(
      `
        SELECT * FROM faction_person_monsters
        WHERE person_id = $1
        ORDER BY position ASC
      `,
      [personId]
    );
    return result.rows.map(normalizeFactionPersonMonster);
  }

  override async create(input: FactionPersonCreateInput): Promise<FactionPerson> {
    const imagesJson = JSON.stringify(input.images ?? {});

    const result = await db.query<{ id: number }>(
      `
        INSERT INTO faction_people (
          faction_id, name, alias, standing_requirement, blurb,
          short_bio, long_bio, role, available_assistance, images, standing_reward
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id
      `,
      [
        input.factionId,
        input.name,
        input.alias ?? null,
        input.standingRequirement ?? 0,
        input.blurb ?? null,
        input.shortBio ?? null,
        input.longBio ?? null,
        input.role ?? null,
        input.availableAssistance ?? null,
        imagesJson,
        input.standingReward ?? 0,
      ]
    );

    const insertedRow = result.rows[0];
    if (!insertedRow) {
      throw new Error('Failed to insert faction person');
    }
    const person = await this.findById(insertedRow.id);
    if (!person) {
      throw new Error('Failed to create faction person');
    }
    return person;
  }

  override async update(id: number, input: FactionPersonUpdateInput): Promise<FactionPerson> {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (input.factionId !== undefined) {
      values.push(input.factionId);
      updates.push(`faction_id = $${values.length}`);
    }
    if (input.name !== undefined) {
      values.push(input.name);
      updates.push(`name = $${values.length}`);
    }
    if (input.alias !== undefined) {
      values.push(input.alias);
      updates.push(`alias = $${values.length}`);
    }
    if (input.standingRequirement !== undefined) {
      values.push(input.standingRequirement);
      updates.push(`standing_requirement = $${values.length}`);
    }
    if (input.blurb !== undefined) {
      values.push(input.blurb);
      updates.push(`blurb = $${values.length}`);
    }
    if (input.shortBio !== undefined) {
      values.push(input.shortBio);
      updates.push(`short_bio = $${values.length}`);
    }
    if (input.longBio !== undefined) {
      values.push(input.longBio);
      updates.push(`long_bio = $${values.length}`);
    }
    if (input.role !== undefined) {
      values.push(input.role);
      updates.push(`role = $${values.length}`);
    }
    if (input.availableAssistance !== undefined) {
      values.push(input.availableAssistance);
      updates.push(`available_assistance = $${values.length}`);
    }
    if (input.images !== undefined) {
      values.push(JSON.stringify(input.images));
      updates.push(`images = $${values.length}`);
    }
    if (input.standingReward !== undefined) {
      values.push(input.standingReward);
      updates.push(`standing_reward = $${values.length}`);
    }

    if (updates.length === 0) {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('Faction person not found');
      }
      return existing;
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await db.query(
      `UPDATE faction_people SET ${updates.join(', ')} WHERE id = $${values.length}`,
      values
    );

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Faction person not found after update');
    }
    return updated;
  }

  async addMonsterToTeam(input: FactionPersonMonsterCreateInput): Promise<FactionPersonMonster> {
    const speciesJson = JSON.stringify(input.species ?? []);
    const typesJson = JSON.stringify(input.types ?? []);

    const result = await db.query<{ id: number }>(
      `
        INSERT INTO faction_person_monsters (person_id, name, species, types, attribute, image, position)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `,
      [
        input.personId,
        input.name,
        speciesJson,
        typesJson,
        input.attribute ?? null,
        input.image ?? null,
        input.position ?? 0,
      ]
    );

    const insertedRow = result.rows[0];
    if (!insertedRow) {
      throw new Error('Failed to insert faction person monster');
    }

    const monsterResult = await db.query<FactionPersonMonsterRow>(
      'SELECT * FROM faction_person_monsters WHERE id = $1',
      [insertedRow.id]
    );

    const monsterRow = monsterResult.rows[0];
    if (!monsterRow) {
      throw new Error('Failed to retrieve faction person monster');
    }

    return normalizeFactionPersonMonster(monsterRow);
  }

  async removeMonsterFromTeam(monsterId: number): Promise<boolean> {
    const result = await db.query('DELETE FROM faction_person_monsters WHERE id = $1', [monsterId]);
    return (result.rowCount ?? 0) > 0;
  }

  override async delete(id: number): Promise<boolean> {
    // Delete associated monsters first
    await db.query('DELETE FROM faction_person_monsters WHERE person_id = $1', [id]);

    // Delete the person
    const result = await db.query('DELETE FROM faction_people WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
