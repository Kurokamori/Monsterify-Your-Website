import { BaseRepository } from './base.repository';
import { db } from '../database';

export type MonsterLineageRow = {
  id: number;
  monster_id: number;
  parent_id: number;
  relationship_type: 'parent' | 'sibling' | 'child';
  created_by: number | null;
  is_automatic: boolean;
  notes: string | null;
  created_at: Date;
};

export type MonsterLineage = {
  id: number;
  monsterId: number;
  parentId: number;
  relationshipType: 'parent' | 'sibling' | 'child';
  createdBy: number | null;
  isAutomatic: boolean;
  notes: string | null;
  createdAt: Date;
};

export type MonsterLineageWithDetails = MonsterLineage & {
  relatedMonsterName: string | null;
  relatedMonsterSpecies: string | null;
  relatedMonsterLevel: number | null;
  createdByUsername: string | null;
};

export type MonsterLineageCreateInput = {
  monsterId: number;
  parentId: number;
  relationshipType: 'parent' | 'sibling' | 'child';
  createdBy?: number | null;
  isAutomatic?: boolean;
  notes?: string | null;
};

export type MonsterLineageUpdateInput = {
  notes?: string | null;
};

export type CompleteLineage = {
  monsterId: number;
  parents: MonsterLineageWithDetails[];
  siblings: MonsterLineageWithDetails[];
  children: MonsterLineageWithDetails[];
  grandchildren: MonsterLineageWithDetails[];
};

const normalizeMonsterLineage = (row: MonsterLineageRow): MonsterLineage => ({
  id: row.id,
  monsterId: row.monster_id,
  parentId: row.parent_id,
  relationshipType: row.relationship_type,
  createdBy: row.created_by,
  isAutomatic: row.is_automatic,
  notes: row.notes,
  createdAt: row.created_at,
});

type MonsterLineageWithDetailsRow = MonsterLineageRow & {
  related_monster_name: string | null;
  related_monster_species: string | null;
  related_monster_level: number | null;
  created_by_username: string | null;
};

const normalizeMonsterLineageWithDetails = (row: MonsterLineageWithDetailsRow): MonsterLineageWithDetails => ({
  ...normalizeMonsterLineage(row),
  relatedMonsterName: row.related_monster_name,
  relatedMonsterSpecies: row.related_monster_species,
  relatedMonsterLevel: row.related_monster_level,
  createdByUsername: row.created_by_username,
});

export class MonsterLineageRepository extends BaseRepository<
  MonsterLineage,
  MonsterLineageCreateInput,
  MonsterLineageUpdateInput
> {
  constructor() {
    super('monster_lineage');
  }

  override async findById(id: number): Promise<MonsterLineage | null> {
    const result = await db.query<MonsterLineageRow>(
      'SELECT * FROM monster_lineage WHERE id = $1',
      [id]
    );
    const row = result.rows[0];
    return row ? normalizeMonsterLineage(row) : null;
  }

  async findByMonsterId(monsterId: number): Promise<MonsterLineageWithDetails[]> {
    const result = await db.query<MonsterLineageWithDetailsRow>(
      `
        SELECT
          ml.*,
          m.name as related_monster_name,
          m.species1 as related_monster_species,
          m.level as related_monster_level,
          u.username as created_by_username
        FROM monster_lineage ml
        JOIN monsters m ON ml.parent_id = m.id
        LEFT JOIN users u ON ml.created_by::text = u.id::text
        WHERE ml.monster_id = $1
        ORDER BY ml.relationship_type, ml.created_at
      `,
      [monsterId]
    );
    return result.rows.map(normalizeMonsterLineageWithDetails);
  }

  async getParents(monsterId: number): Promise<MonsterLineageWithDetails[]> {
    const result = await db.query<MonsterLineageWithDetailsRow>(
      `
        SELECT
          ml.*,
          m.name as related_monster_name,
          m.species1 as related_monster_species,
          m.level as related_monster_level,
          u.username as created_by_username
        FROM monster_lineage ml
        JOIN monsters m ON ml.parent_id = m.id
        LEFT JOIN users u ON ml.created_by::text = u.id::text
        WHERE ml.monster_id = $1 AND ml.relationship_type = 'parent'
        ORDER BY ml.created_at
      `,
      [monsterId]
    );
    return result.rows.map(normalizeMonsterLineageWithDetails);
  }

  async getChildren(monsterId: number): Promise<MonsterLineageWithDetails[]> {
    const result = await db.query<MonsterLineageWithDetailsRow>(
      `
        SELECT
          ml.*,
          m.name as related_monster_name,
          m.species1 as related_monster_species,
          m.level as related_monster_level,
          u.username as created_by_username
        FROM monster_lineage ml
        JOIN monsters m ON ml.parent_id = m.id
        LEFT JOIN users u ON ml.created_by::text = u.id::text
        WHERE ml.monster_id = $1 AND ml.relationship_type = 'child'
        ORDER BY ml.created_at
      `,
      [monsterId]
    );
    return result.rows.map(normalizeMonsterLineageWithDetails);
  }

  async getSiblings(monsterId: number): Promise<MonsterLineageWithDetails[]> {
    const result = await db.query<MonsterLineageWithDetailsRow>(
      `
        SELECT
          ml.*,
          m.name as related_monster_name,
          m.species1 as related_monster_species,
          m.level as related_monster_level,
          u.username as created_by_username
        FROM monster_lineage ml
        JOIN monsters m ON ml.parent_id = m.id
        LEFT JOIN users u ON ml.created_by::text = u.id::text
        WHERE ml.monster_id = $1 AND ml.relationship_type = 'sibling'
        ORDER BY ml.created_at
      `,
      [monsterId]
    );
    return result.rows.map(normalizeMonsterLineageWithDetails);
  }

  async getGrandchildren(monsterId: number): Promise<MonsterLineageWithDetails[]> {
    const result = await db.query<MonsterLineageWithDetailsRow>(
      `
        SELECT DISTINCT
          ml2.*,
          m3.name as related_monster_name,
          m3.species1 as related_monster_species,
          m3.level as related_monster_level,
          u.username as created_by_username
        FROM monster_lineage ml1
        JOIN monster_lineage ml2 ON ml1.parent_id = ml2.monster_id
        JOIN monsters m3 ON ml2.parent_id = m3.id
        LEFT JOIN users u ON ml2.created_by::text = u.id::text
        WHERE ml1.monster_id = $1
          AND ml1.relationship_type = 'child'
          AND ml2.relationship_type = 'child'
        ORDER BY ml2.created_at
      `,
      [monsterId]
    );
    return result.rows.map(normalizeMonsterLineageWithDetails);
  }

  async getCompleteLineage(monsterId: number): Promise<CompleteLineage> {
    const [parents, children, siblings, grandchildren] = await Promise.all([
      this.getParents(monsterId),
      this.getChildren(monsterId),
      this.getSiblings(monsterId),
      this.getGrandchildren(monsterId),
    ]);

    return {
      monsterId,
      parents,
      siblings,
      children,
      grandchildren,
    };
  }

  override async create(input: MonsterLineageCreateInput): Promise<MonsterLineage> {
    const validRelationshipTypes = ['parent', 'sibling', 'child'];
    if (!validRelationshipTypes.includes(input.relationshipType)) {
      throw new Error('relationship_type must be parent, sibling, or child');
    }

    const result = await db.query<{ id: number }>(
      `
        INSERT INTO monster_lineage (monster_id, parent_id, relationship_type, created_by, is_automatic, notes)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `,
      [
        input.monsterId,
        input.parentId,
        input.relationshipType,
        input.createdBy ?? null,
        input.isAutomatic ?? false,
        input.notes ?? null,
      ]
    );

    const insertedRow = result.rows[0];
    if (!insertedRow) {
      throw new Error('Failed to insert lineage relationship');
    }
    const lineage = await this.findById(insertedRow.id);
    if (!lineage) {
      throw new Error('Failed to create lineage relationship');
    }
    return lineage;
  }

  override async update(id: number, input: MonsterLineageUpdateInput): Promise<MonsterLineage> {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (input.notes !== undefined) {
      values.push(input.notes);
      updates.push(`notes = $${values.length}`);
    }

    if (updates.length === 0) {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('Lineage relationship not found');
      }
      return existing;
    }

    values.push(id);

    await db.query(
      `UPDATE monster_lineage SET ${updates.join(', ')} WHERE id = $${values.length}`,
      values
    );

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Lineage relationship not found after update');
    }
    return updated;
  }

  async addBreedingLineage(
    parent1Id: number,
    parent2Id: number,
    offspringIds: number[]
  ): Promise<MonsterLineage[]> {
    const createdRelationships: MonsterLineage[] = [];

    for (const offspringId of offspringIds) {
      // Record that parent1 is a parent of offspring
      const parent1Rel = await this.create({
        monsterId: offspringId,
        parentId: parent1Id,
        relationshipType: 'parent',
        isAutomatic: true,
        notes: 'Automatically created from breeding',
      });
      createdRelationships.push(parent1Rel);

      // Record that parent2 is a parent of offspring
      const parent2Rel = await this.create({
        monsterId: offspringId,
        parentId: parent2Id,
        relationshipType: 'parent',
        isAutomatic: true,
        notes: 'Automatically created from breeding',
      });
      createdRelationships.push(parent2Rel);

      // Record that offspring is a child of parent1
      const child1Rel = await this.create({
        monsterId: parent1Id,
        parentId: offspringId,
        relationshipType: 'child',
        isAutomatic: true,
        notes: 'Automatically created from breeding',
      });
      createdRelationships.push(child1Rel);

      // Record that offspring is a child of parent2
      const child2Rel = await this.create({
        monsterId: parent2Id,
        parentId: offspringId,
        relationshipType: 'child',
        isAutomatic: true,
        notes: 'Automatically created from breeding',
      });
      createdRelationships.push(child2Rel);
    }

    // Create sibling relationships between offspring (if multiple)
    if (offspringIds.length > 1) {
      for (let i = 0; i < offspringIds.length; i++) {
        for (let j = i + 1; j < offspringIds.length; j++) {
          const offspringIdI = offspringIds[i];
          const offspringIdJ = offspringIds[j];
          if (offspringIdI === undefined || offspringIdJ === undefined) {
            continue;
          }
          const sibling1Rel = await this.create({
            monsterId: offspringIdI,
            parentId: offspringIdJ,
            relationshipType: 'sibling',
            isAutomatic: true,
            notes: 'Automatically created from breeding - same clutch',
          });
          createdRelationships.push(sibling1Rel);

          const sibling2Rel = await this.create({
            monsterId: offspringIdJ,
            parentId: offspringIdI,
            relationshipType: 'sibling',
            isAutomatic: true,
            notes: 'Automatically created from breeding - same clutch',
          });
          createdRelationships.push(sibling2Rel);
        }
      }
    }

    return createdRelationships;
  }

  async addManualRelationship(
    monsterId: number,
    relatedMonsterId: number,
    relationshipType: 'parent' | 'sibling' | 'child',
    userId: number,
    notes: string | null = null
  ): Promise<MonsterLineage[]> {
    const createdRelationships: MonsterLineage[] = [];

    // Determine the reverse relationship type
    let reverseRelationshipType: 'parent' | 'sibling' | 'child';
    switch (relationshipType) {
      case 'parent':
        reverseRelationshipType = 'child';
        break;
      case 'child':
        reverseRelationshipType = 'parent';
        break;
      case 'sibling':
        reverseRelationshipType = 'sibling';
        break;
    }

    // Create the primary relationship
    const primaryRel = await this.create({
      monsterId,
      parentId: relatedMonsterId,
      relationshipType,
      createdBy: userId,
      isAutomatic: false,
      notes,
    });
    createdRelationships.push(primaryRel);

    // Create the reverse relationship
    const reverseRel = await this.create({
      monsterId: relatedMonsterId,
      parentId: monsterId,
      relationshipType: reverseRelationshipType,
      createdBy: userId,
      isAutomatic: false,
      notes,
    });
    createdRelationships.push(reverseRel);

    return createdRelationships;
  }

  async removeRelationship(
    monsterId: number,
    relatedMonsterId: number,
    relationshipType: 'parent' | 'sibling' | 'child'
  ): Promise<boolean> {
    // Determine the reverse relationship type
    let reverseRelationshipType: 'parent' | 'sibling' | 'child';
    switch (relationshipType) {
      case 'parent':
        reverseRelationshipType = 'child';
        break;
      case 'child':
        reverseRelationshipType = 'parent';
        break;
      case 'sibling':
        reverseRelationshipType = 'sibling';
        break;
    }

    // Remove the primary relationship
    await db.query(
      `DELETE FROM monster_lineage WHERE monster_id = $1 AND parent_id = $2 AND relationship_type = $3`,
      [monsterId, relatedMonsterId, relationshipType]
    );

    // Remove the reverse relationship
    await db.query(
      `DELETE FROM monster_lineage WHERE monster_id = $1 AND parent_id = $2 AND relationship_type = $3`,
      [relatedMonsterId, monsterId, reverseRelationshipType]
    );

    return true;
  }

  async relationshipExists(
    monsterId: number,
    relatedMonsterId: number,
    relationshipType: 'parent' | 'sibling' | 'child'
  ): Promise<boolean> {
    const result = await db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM monster_lineage WHERE monster_id = $1 AND parent_id = $2 AND relationship_type = $3`,
      [monsterId, relatedMonsterId, relationshipType]
    );
    return parseInt(result.rows[0]?.count ?? '0', 10) > 0;
  }

  async deleteAllForMonster(monsterId: number): Promise<boolean> {
    // Delete relationships where this monster is the primary monster
    await db.query('DELETE FROM monster_lineage WHERE monster_id = $1', [monsterId]);

    // Delete relationships where this monster is the related monster
    await db.query('DELETE FROM monster_lineage WHERE parent_id = $1', [monsterId]);

    return true;
  }
}
