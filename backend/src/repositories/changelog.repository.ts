import { BaseRepository } from './base.repository';
import { db } from '../database';

// ── Row types (snake_case, matching DB columns) ─────────────────────

export type ChangelogVersionRow = {
  id: number;
  version: string;
  title: string;
  content: string;
  is_published: boolean;
  published_at: Date | null;
  created_by: number | null;
  created_at: Date;
  updated_at: Date;
};

// ── Domain types (camelCase) ────────────────────────────────────────

export type ChangelogVersion = {
  id: number;
  version: string;
  title: string;
  content: string;
  isPublished: boolean;
  publishedAt: Date | null;
  createdBy: number | null;
  createdAt: Date;
  updatedAt: Date;
};

// ── Input types ─────────────────────────────────────────────────────

export type ChangelogVersionCreateInput = {
  version: string;
  title: string;
  content?: string;
  isPublished?: boolean;
  createdBy?: number | null;
};

export type ChangelogVersionUpdateInput = {
  version?: string;
  title?: string;
  content?: string;
  isPublished?: boolean;
  publishedAt?: Date | null;
};

// ── Normalizer ──────────────────────────────────────────────────────

function normalizeVersion(row: ChangelogVersionRow): ChangelogVersion {
  return {
    id: row.id,
    version: row.version,
    title: row.title,
    content: row.content,
    isPublished: row.is_published,
    publishedAt: row.published_at,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ── Repository ──────────────────────────────────────────────────────

export class ChangelogRepository extends BaseRepository<
  ChangelogVersion,
  ChangelogVersionCreateInput,
  ChangelogVersionUpdateInput
> {
  constructor() {
    super('changelog_versions');
  }

  // ── BaseRepository abstract implementations ─────────────────────

  async findById(id: number): Promise<ChangelogVersion | null> {
    const result = await db.query<ChangelogVersionRow>(
      `SELECT * FROM changelog_versions WHERE id = $1`,
      [id],
    );
    return result.rows[0] ? normalizeVersion(result.rows[0]) : null;
  }

  async create(input: ChangelogVersionCreateInput): Promise<ChangelogVersion> {
    const publishedAt = input.isPublished ? new Date() : null;
    const result = await db.query<ChangelogVersionRow>(
      `INSERT INTO changelog_versions (version, title, content, is_published, published_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        input.version,
        input.title,
        input.content ?? '',
        input.isPublished ?? false,
        publishedAt,
        input.createdBy ?? null,
      ],
    );
    const row = result.rows[0];
    if (!row) {
      throw new Error('Failed to create changelog version');
    }
    return normalizeVersion(row);
  }

  async update(id: number, input: ChangelogVersionUpdateInput): Promise<ChangelogVersion> {
    const sets: string[] = [];
    const vals: unknown[] = [];
    let idx = 1;

    if (input.version !== undefined) { sets.push(`version = $${idx++}`); vals.push(input.version); }
    if (input.title !== undefined) { sets.push(`title = $${idx++}`); vals.push(input.title); }
    if (input.content !== undefined) { sets.push(`content = $${idx++}`); vals.push(input.content); }
    if (input.isPublished !== undefined) {
      sets.push(`is_published = $${idx++}`);
      vals.push(input.isPublished);
      if (input.isPublished && input.publishedAt === undefined) {
        sets.push(`published_at = COALESCE(published_at, NOW())`);
      }
    }
    if (input.publishedAt !== undefined) { sets.push(`published_at = $${idx++}`); vals.push(input.publishedAt); }

    if (sets.length === 0) {
      const existing = await this.findById(id);
      if (!existing) { throw new Error(`Changelog version with id ${id} not found`); }
      return existing;
    }

    sets.push(`updated_at = NOW()`);
    vals.push(id);

    const result = await db.query<ChangelogVersionRow>(
      `UPDATE changelog_versions SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
      vals,
    );
    const row = result.rows[0];
    if (!row) {
      throw new Error(`Changelog version with id ${id} not found`);
    }
    return normalizeVersion(row);
  }

  // ── Custom queries ──────────────────────────────────────────────

  async findAll(): Promise<ChangelogVersion[]> {
    const result = await db.query<ChangelogVersionRow>(
      `SELECT * FROM changelog_versions ORDER BY published_at DESC NULLS LAST, created_at DESC`,
    );
    return result.rows.map(normalizeVersion);
  }

  async findPublished(): Promise<ChangelogVersion[]> {
    const result = await db.query<ChangelogVersionRow>(
      `SELECT * FROM changelog_versions WHERE is_published = true ORDER BY published_at DESC`,
    );
    return result.rows.map(normalizeVersion);
  }

  async findLatestPublished(): Promise<ChangelogVersion | null> {
    const result = await db.query<ChangelogVersionRow>(
      `SELECT * FROM changelog_versions WHERE is_published = true ORDER BY published_at DESC LIMIT 1`,
    );
    return result.rows[0] ? normalizeVersion(result.rows[0]) : null;
  }
}
