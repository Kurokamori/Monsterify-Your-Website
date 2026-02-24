import { BaseRepository } from './base.repository';
import { db } from '../database';

// =============================================================================
// Types
// =============================================================================

export type SubmissionStatus = 'pending' | 'approved' | 'rejected' | 'revision_requested';
export type SubmissionType = 'art' | 'writing' | 'craft' | 'other';
export type ContentType = 'image' | 'text' | 'mixed';

export type SubmissionRow = {
  id: number;
  user_id: number;
  trainer_id: number;
  title: string;
  description: string | null;
  content_type: ContentType;
  content: string | null;
  submission_type: SubmissionType;
  is_book: boolean;
  parent_id: number | null;
  chapter_number: number | null;
  status: SubmissionStatus;
  gift_levels: number;
  gift_coins: number;
  capped_levels: number;
  is_external: boolean;
  external_characters: string | null;
  external_levels: number;
  external_coins: number;
  submission_date: Date;
  created_at: Date;
  updated_at: Date;
};

export type SubmissionWithDetails = SubmissionRow & {
  user_username: string | null;
  user_display_name: string | null;
  trainer_name: string | null;
};

export type Submission = {
  id: number;
  userId: number;
  trainerId: number;
  title: string;
  description: string | null;
  contentType: ContentType;
  content: string | null;
  submissionType: SubmissionType;
  isBook: boolean;
  parentId: number | null;
  chapterNumber: number | null;
  status: SubmissionStatus;
  giftLevels: number;
  giftCoins: number;
  cappedLevels: number;
  isExternal: boolean;
  externalCharacters: unknown[] | null;
  externalLevels: number;
  externalCoins: number;
  userUsername: string | null;
  userDisplayName: string | null;
  trainerName: string | null;
  submissionDate: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type SubmissionCreateInput = {
  userId: number;
  trainerId: number;
  title: string;
  description?: string | null;
  contentType: ContentType;
  content?: string | null;
  submissionType: SubmissionType;
  isBook?: boolean;
  parentId?: number | null;
  chapterNumber?: number | null;
  status?: SubmissionStatus;
};

export type SubmissionUpdateInput = {
  title?: string;
  description?: string | null;
  content?: string | null;
  status?: SubmissionStatus;
  giftLevels?: number;
  giftCoins?: number;
  cappedLevels?: number;
};

export type SubmissionQueryOptions = {
  userId?: number;
  trainerId?: number;
  status?: SubmissionStatus | 'all';
  submissionType?: SubmissionType;
  isBook?: boolean;
  parentId?: number | null;
  page?: number;
  limit?: number;
};

export type AdminSubmissionQueryOptions = {
  search?: string;
  status?: string;
  submissionType?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
};

export type AdminSubmissionRow = {
  id: number;
  title: string;
  description: string | null;
  content_type: string;
  submission_type: string;
  is_book: number;
  status: string;
  submission_date: Date;
  created_at: Date;
  user_id: number;
  user_username: string | null;
  user_display_name: string | null;
  trainer_name: string | null;
  image_url: string | null;
  is_mature: number;
  tags: string[] | null;
};

export type PaginatedSubmissions = {
  data: Submission[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type FullSubmissionCreateInput = {
  userId: string;
  trainerId?: number | null;
  title: string;
  description?: string | null;
  contentType: string;
  content?: string | null;
  submissionType: string;
  status?: string;
  isBook?: boolean;
  parentId?: number | null;
  chapterNumber?: number | null;
  isMature?: boolean;
  contentRating?: string | null;
  isExternal?: boolean;
  externalCharacters?: string | null;
  externalLevels?: number;
  externalCoins?: number;
};

export type GalleryFilters = {
  page?: number;
  limit?: number;
  contentType?: string;
  tags?: string[];
  trainerId?: number;
  userId?: string;
  monsterId?: number;
  sort?: string;
  search?: string;
  showMature?: boolean;
  matureFilters?: Record<string, boolean>;
  isExternal?: boolean;
};

export type LibraryFilters = GalleryFilters & {
  booksOnly?: boolean;
  excludeChapters?: boolean;
  currentUserId?: string | null;
};

export type MySubmissionsFilters = {
  page?: number;
  limit?: number;
  submissionType?: string;
  sortBy?: string;
};

export type SubmissionImageRow = {
  id: number;
  image_url: string;
  is_main: boolean;
  order_index: number;
};

export type OwnershipRow = {
  id: number;
  user_id: string;
  user_discord_id: string | null;
  status: string;
  submission_type: string;
  is_book: boolean;
};

export type GiftItemRow = {
  id: number;
  item_category: string;
  item_name: string;
  quantity: number;
  recipient_id: number | null;
  is_claimed: boolean;
  claimed_at: Date | null;
};

export type ReferenceInsertData = {
  referenceType: string;
  trainerId: number;
  monsterName?: string | null;
  referenceUrl: string;
  instanceCount?: number;
};

// =============================================================================
// Helpers
// =============================================================================

const normalizeSubmission = (row: SubmissionWithDetails): Submission => {
  let externalCharacters: unknown[] | null = null;
  if (row.external_characters) {
    try {
      externalCharacters = typeof row.external_characters === 'string'
        ? JSON.parse(row.external_characters)
        : row.external_characters as unknown as unknown[];
    } catch {
      externalCharacters = null;
    }
  }
  return {
    id: row.id,
    userId: row.user_id,
    trainerId: row.trainer_id,
    title: row.title,
    description: row.description,
    contentType: row.content_type,
    content: row.content,
    submissionType: row.submission_type,
    isBook: row.is_book,
    parentId: row.parent_id,
    chapterNumber: row.chapter_number,
    status: row.status,
    giftLevels: row.gift_levels || 0,
    giftCoins: row.gift_coins || 0,
    cappedLevels: row.capped_levels || 0,
    isExternal: !!row.is_external,
    externalCharacters,
    externalLevels: row.external_levels || 0,
    externalCoins: row.external_coins || 0,
    userUsername: row.user_username,
    userDisplayName: row.user_display_name,
    trainerName: row.trainer_name,
    submissionDate: row.submission_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const BASE_SELECT = `
  SELECT s.*,
         u.username as user_username,
         u.display_name as user_display_name,
         t.name as trainer_name
  FROM submissions s
  LEFT JOIN users u ON (s.user_id::text = u.discord_id OR s.user_id::text = u.id::text)
  LEFT JOIN trainers t ON s.trainer_id = t.id
`;

function buildMatureContentFilter(
  showMature: boolean,
  matureFilters: Record<string, boolean> | undefined,
): string {
  if (!showMature) {
    return ' AND (s.is_mature::boolean IS NOT TRUE)';
  }
  if (matureFilters) {
    const enabledFilters = Object.keys(matureFilters).filter(key => matureFilters[key]);
    if (enabledFilters.length > 0) {
      const filterConditions = enabledFilters
        .map(f => `(s.content_rating->>'${f}')::boolean = true`)
        .join(' OR ');
      return ` AND (s.is_mature::boolean IS NOT TRUE OR (${filterConditions}))`;
    }
  }
  return '';
}

const MONSTER_SPECIES_CASE = `
  CASE
    WHEN m.species3 IS NOT NULL AND m.species3 != '' AND m.species2 IS NOT NULL AND m.species2 != ''
      THEN m.species1 || '/' || m.species2 || '/' || m.species3
    WHEN m.species2 IS NOT NULL AND m.species2 != ''
      THEN m.species1 || '/' || m.species2
    ELSE m.species1
  END`;

const MONSTER_TYPE_CASE = `
  CASE
    WHEN m.type5 IS NOT NULL AND m.type5 != '' AND m.type4 IS NOT NULL AND m.type4 != '' AND m.type3 IS NOT NULL AND m.type3 != '' AND m.type2 IS NOT NULL AND m.type2 != ''
      THEN m.type1 || '/' || m.type2 || '/' || m.type3 || '/' || m.type4 || '/' || m.type5
    WHEN m.type4 IS NOT NULL AND m.type4 != '' AND m.type3 IS NOT NULL AND m.type3 != '' AND m.type2 IS NOT NULL AND m.type2 != ''
      THEN m.type1 || '/' || m.type2 || '/' || m.type3 || '/' || m.type4
    WHEN m.type3 IS NOT NULL AND m.type3 != '' AND m.type2 IS NOT NULL AND m.type2 != ''
      THEN m.type1 || '/' || m.type2 || '/' || m.type3
    WHEN m.type2 IS NOT NULL AND m.type2 != ''
      THEN m.type1 || '/' || m.type2
    ELSE m.type1
  END`;

const MONSTERS_SUBQUERY = `
  (SELECT json_agg(json_build_object(
    'id', m.id,
    'name', m.name,
    'species', (${MONSTER_SPECIES_CASE}),
    'type', (${MONSTER_TYPE_CASE}),
    'level', m.level,
    'attribute', m.attribute,
    'img_link', m.img_link
  ))
  FROM submission_monsters sm
  JOIN monsters m ON sm.monster_id = m.id
  WHERE sm.submission_id = s.id)`;

// =============================================================================
// Repository
// =============================================================================

export class SubmissionRepository extends BaseRepository<Submission, SubmissionCreateInput, SubmissionUpdateInput> {
  constructor() {
    super('submissions');
  }

  // ===========================================================================
  // Core CRUD
  // ===========================================================================

  async findAll(options: SubmissionQueryOptions = {}): Promise<PaginatedSubmissions> {
    const { page = 1, limit = 10 } = options;
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (options.userId) {
      params.push(options.userId);
      conditions.push(`s.user_id = $${params.length}`);
    }

    if (options.trainerId) {
      params.push(options.trainerId);
      conditions.push(`s.trainer_id = $${params.length}`);
    }

    if (options.status && options.status !== 'all') {
      params.push(options.status);
      conditions.push(`s.status = $${params.length}`);
    }

    if (options.submissionType) {
      params.push(options.submissionType);
      conditions.push(`s.submission_type = $${params.length}`);
    }

    if (options.isBook !== undefined) {
      params.push(options.isBook ? 1 : 0);
      conditions.push(`s.is_book = $${params.length}`);
    }

    if (options.parentId !== undefined) {
      if (options.parentId === null) {
        conditions.push('s.parent_id IS NULL');
      } else {
        params.push(options.parentId);
        conditions.push(`s.parent_id = $${params.length}`);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM submissions s ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

    const offset = (page - 1) * limit;
    params.push(limit, offset);

    const dataResult = await db.query<SubmissionWithDetails>(
      `
        ${BASE_SELECT}
        ${whereClause}
        ORDER BY s.created_at DESC
        LIMIT $${params.length - 1} OFFSET $${params.length}
      `,
      params
    );

    return {
      data: dataResult.rows.map(normalizeSubmission),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findAdminList(options: AdminSubmissionQueryOptions = {}): Promise<{
    data: AdminSubmissionRow[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20 } = options;
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (options.status) {
      params.push(options.status);
      conditions.push(`s.status = $${params.length}`);
    }

    if (options.submissionType) {
      params.push(options.submissionType);
      conditions.push(`s.submission_type = $${params.length}`);
    }

    if (options.search) {
      params.push(`%${options.search}%`);
      conditions.push(`(s.title ILIKE $${params.length} OR u.username ILIKE $${params.length})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count query
    const countResult = await db.query<{ count: string }>(
      `SELECT COUNT(*) as count
       FROM submissions s
       LEFT JOIN users u ON s.user_id = u.id
       ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

    // Sort
    const allowedSorts: Record<string, string> = {
      created_at: 's.created_at',
      title: 's.title',
      username: 'u.username',
      status: 's.status',
      submission_type: 's.submission_type',
    };
    const sortCol = allowedSorts[options.sortBy ?? ''] ?? 's.created_at';
    const sortDir = options.sortOrder === 'asc' ? 'ASC' : 'DESC';

    const offset = (page - 1) * limit;
    params.push(limit, offset);

    const dataResult = await db.query<AdminSubmissionRow>(
      `SELECT
        s.id, s.title, s.description, s.content_type, s.submission_type,
        s.is_book, s.status, s.submission_date, s.created_at,
        s.user_id, u.username as user_username, u.display_name as user_display_name,
        t.name as trainer_name,
        (SELECT image_url FROM submission_images WHERE submission_id = s.id AND is_main::boolean = true LIMIT 1) as image_url,
        s.is_mature,
        (SELECT json_agg(tag) FROM submission_tags WHERE submission_id = s.id) as tags
      FROM submissions s
      LEFT JOIN users u ON (s.user_id::text = u.discord_id OR s.user_id::text = u.id::text)
      LEFT JOIN trainers t ON s.trainer_id = t.id
      ${whereClause}
      ORDER BY ${sortCol} ${sortDir}
      LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return {
      data: dataResult.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  override async findById(id: number): Promise<Submission | null> {
    const result = await db.query<SubmissionWithDetails>(
      `${BASE_SELECT} WHERE s.id = $1`,
      [id]
    );
    const row = result.rows[0];
    return row ? normalizeSubmission(row) : null;
  }

  async findByUserId(userId: number, options: SubmissionQueryOptions = {}): Promise<PaginatedSubmissions> {
    return this.findAll({ ...options, userId });
  }

  async findByTrainerId(trainerId: number, options: SubmissionQueryOptions = {}): Promise<PaginatedSubmissions> {
    return this.findAll({ ...options, trainerId });
  }

  async findBookChapters(parentId: number): Promise<Submission[]> {
    const result = await db.query<SubmissionWithDetails>(
      `
        ${BASE_SELECT}
        WHERE s.parent_id = $1
        ORDER BY s.chapter_number ASC
      `,
      [parentId]
    );
    return result.rows.map(normalizeSubmission);
  }

  override async create(input: SubmissionCreateInput): Promise<Submission> {
    const result = await db.query<{ id: number }>(
      `
        INSERT INTO submissions (
          user_id, trainer_id, title, description, content_type,
          content, submission_type, is_book, parent_id, chapter_number,
          status, submission_date
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
        RETURNING id
      `,
      [
        input.userId,
        input.trainerId,
        input.title,
        input.description ?? null,
        input.contentType,
        input.content ?? null,
        input.submissionType,
        (input.isBook ?? false) ? 1 : 0,
        input.parentId ?? null,
        input.chapterNumber ?? null,
        input.status ?? 'pending',
      ]
    );

    const row = result.rows[0];
    if (!row) {
      throw new Error('Failed to create submission');
    }
    const submission = await this.findById(row.id);
    if (!submission) {
      throw new Error('Failed to create submission');
    }
    return submission;
  }

  override async update(id: number, input: SubmissionUpdateInput): Promise<Submission> {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (input.title !== undefined) {
      values.push(input.title);
      updates.push(`title = $${values.length}`);
    }
    if (input.description !== undefined) {
      values.push(input.description);
      updates.push(`description = $${values.length}`);
    }
    if (input.content !== undefined) {
      values.push(input.content);
      updates.push(`content = $${values.length}`);
    }
    if (input.status !== undefined) {
      values.push(input.status);
      updates.push(`status = $${values.length}`);
    }
    if (input.giftLevels !== undefined) {
      values.push(input.giftLevels);
      updates.push(`gift_levels = $${values.length}`);
    }
    if (input.giftCoins !== undefined) {
      values.push(input.giftCoins);
      updates.push(`gift_coins = $${values.length}`);
    }
    if (input.cappedLevels !== undefined) {
      values.push(input.cappedLevels);
      updates.push(`capped_levels = $${values.length}`);
    }

    if (updates.length === 0) {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('Submission not found');
      }
      return existing;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    await db.query(
      `UPDATE submissions SET ${updates.join(', ')} WHERE id = $${values.length}`,
      values
    );

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Submission not found after update');
    }
    return updated;
  }

  async updateStatus(id: number, status: SubmissionStatus): Promise<Submission> {
    return this.update(id, { status });
  }

  async updateGiftRewards(
    id: number,
    giftLevels: number,
    giftCoins: number,
    cappedLevels: number
  ): Promise<Submission> {
    return this.update(id, { giftLevels, giftCoins, cappedLevels });
  }

  async decrementGiftLevels(id: number, amount: number): Promise<Submission> {
    await db.query(
      'UPDATE submissions SET gift_levels = gift_levels - $1 WHERE id = $2 AND gift_levels >= $1',
      [amount, id]
    );
    const updated = await this.findById(id);
    if (!updated) { throw new Error('Submission not found'); }
    return updated;
  }

  async decrementGiftCoins(id: number, amount: number): Promise<Submission> {
    await db.query(
      'UPDATE submissions SET gift_coins = gift_coins - $1 WHERE id = $2 AND gift_coins >= $1',
      [amount, id]
    );
    const updated = await this.findById(id);
    if (!updated) { throw new Error('Submission not found'); }
    return updated;
  }

  async decrementCappedLevels(id: number, amount: number): Promise<Submission> {
    await db.query(
      'UPDATE submissions SET capped_levels = capped_levels - $1 WHERE id = $2 AND capped_levels >= $1',
      [amount, id]
    );
    const updated = await this.findById(id);
    if (!updated) { throw new Error('Submission not found'); }
    return updated;
  }

  async decrementExternalLevels(id: number, amount: number): Promise<Submission> {
    await db.query(
      'UPDATE submissions SET external_levels = external_levels - $1 WHERE id = $2 AND external_levels >= $1',
      [amount, id]
    );
    const updated = await this.findById(id);
    if (!updated) { throw new Error('Submission not found'); }
    return updated;
  }

  async decrementExternalCoins(id: number, amount: number): Promise<Submission> {
    await db.query(
      'UPDATE submissions SET external_coins = external_coins - $1 WHERE id = $2 AND external_coins >= $1',
      [amount, id]
    );
    const updated = await this.findById(id);
    if (!updated) { throw new Error('Submission not found'); }
    return updated;
  }

  // ===========================================================================
  // Full Submission Creation (with mature/contentRating fields)
  // ===========================================================================

  async createSubmission(input: FullSubmissionCreateInput): Promise<{ id: number }> {
    const result = await db.query<{ id: number }>(
      `INSERT INTO submissions (
        user_id, trainer_id, title, description, content_type, content,
        submission_type, status, is_book, parent_id, chapter_number,
        is_mature, content_rating, is_external, external_characters,
        external_levels, external_coins, submission_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, CURRENT_TIMESTAMP) RETURNING id`,
      [
        input.userId,
        input.trainerId ?? null,
        input.title,
        input.description ?? null,
        input.contentType,
        input.content ?? null,
        input.submissionType,
        input.status ?? 'approved',
        input.isBook ? 1 : 0,
        input.parentId ?? null,
        input.chapterNumber ?? null,
        input.isMature ? 1 : 0,
        input.contentRating ?? null,
        input.isExternal ? 1 : 0,
        input.externalCharacters ?? null,
        input.externalLevels ?? 0,
        input.externalCoins ?? 0,
      ]
    );
    const row = result.rows[0];
    if (!row) { throw new Error('Failed to create submission'); }
    return row;
  }

  // ===========================================================================
  // Ownership & Permission Checks
  // ===========================================================================

  async findByIdForOwnership(id: number): Promise<OwnershipRow | null> {
    const result = await db.query<OwnershipRow>(
      `SELECT s.id, s.user_id::text as user_id, u.discord_id as user_discord_id,
              s.status, s.submission_type, s.is_book
       FROM submissions s
       LEFT JOIN users u ON (s.user_id::text = u.discord_id OR s.user_id::text = u.id::text)
       WHERE s.id = $1`,
      [id]
    );
    return result.rows[0] ?? null;
  }

  // ===========================================================================
  // Field Updates & Soft Delete
  // ===========================================================================

  async updateFields(id: number, fields: Record<string, unknown>): Promise<void> {
    const updateParts: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(fields)) {
      updateParts.push(`${key} = $${paramIndex}`);
      params.push(value);
      paramIndex++;
    }

    if (updateParts.length === 0) {
      return;
    }

    params.push(id);
    await db.query(
      `UPDATE submissions SET ${updateParts.join(', ')} WHERE id = $${paramIndex}`,
      params
    );
  }

  async hardDelete(id: number): Promise<void> {
    await db.query('DELETE FROM submission_tags WHERE submission_id = $1', [id]);
    await db.query('DELETE FROM submission_images WHERE submission_id = $1', [id]);
    await db.query('DELETE FROM submission_likes WHERE submission_id = $1', [id]);
    await db.query('DELETE FROM submissions WHERE id = $1', [id]);
  }

  async findByIdWithTagsAndImage(id: number): Promise<Record<string, unknown> | null> {
    const result = await db.query(
      `SELECT s.*,
        (SELECT json_agg(tag) FROM submission_tags WHERE submission_id = s.id) as tags,
        (SELECT image_url FROM submission_images WHERE submission_id = s.id AND is_main::boolean = true LIMIT 1) as image_url
       FROM submissions s WHERE s.id = $1`,
      [id]
    );
    return (result.rows[0] as Record<string, unknown>) ?? null;
  }

  // ===========================================================================
  // Images
  // ===========================================================================

  async addImage(submissionId: number, imageUrl: string, isMain: boolean, orderIndex?: number): Promise<void> {
    await db.query(
      'INSERT INTO submission_images (submission_id, image_url, is_main, order_index) VALUES ($1, $2, $3, $4)',
      [submissionId, imageUrl, isMain ? 1 : 0, orderIndex ?? 0]
    );
  }

  async findImagesBySubmissionId(submissionId: number): Promise<SubmissionImageRow[]> {
    const result = await db.query<SubmissionImageRow>(
      'SELECT id, image_url, is_main, order_index FROM submission_images WHERE submission_id = $1 ORDER BY is_main DESC, order_index ASC',
      [submissionId]
    );
    return result.rows;
  }

  // ===========================================================================
  // Tags
  // ===========================================================================

  async addTags(submissionId: number, tags: string[]): Promise<void> {
    for (const tag of tags) {
      if (tag?.trim()) {
        await db.query('INSERT INTO submission_tags (submission_id, tag) VALUES ($1, $2)', [submissionId, tag.trim()]);
      }
    }
  }

  async replaceTags(submissionId: number, tags: string[]): Promise<void> {
    await db.query('DELETE FROM submission_tags WHERE submission_id = $1', [submissionId]);
    await this.addTags(submissionId, tags);
  }

  async findAllDistinctTags(): Promise<string[]> {
    const result = await db.query<{ tag: string }>(
      'SELECT DISTINCT tag FROM submission_tags ORDER BY tag ASC'
    );
    return result.rows.map(r => r.tag);
  }

  async findTagsBySubmissionId(submissionId: number): Promise<string[]> {
    const result = await db.query<{ tag: string }>(
      'SELECT tag FROM submission_tags WHERE submission_id = $1 ORDER BY tag ASC',
      [submissionId]
    );
    return result.rows.map(t => t.tag);
  }

  // ===========================================================================
  // Monster / Trainer Links
  // ===========================================================================

  async linkMonster(submissionId: number, monsterId: number): Promise<void> {
    await db.query(
      'INSERT INTO submission_monsters (submission_id, monster_id) VALUES ($1, $2)',
      [submissionId, monsterId]
    );
  }

  async linkTrainer(submissionId: number, trainerId: number): Promise<void> {
    await db.query(
      'INSERT INTO submission_trainers (submission_id, trainer_id) VALUES ($1, $2)',
      [submissionId, trainerId]
    );
  }

  async findMonstersBySubmissionId(submissionId: number): Promise<Record<string, unknown>[]> {
    const result = await db.query(
      `SELECT m.id, m.name, m.species1, m.species2, m.species3,
              m.type1, m.type2, m.type3, m.type4, m.type5,
              m.level, m.attribute, m.trainer_id, m.img_link,
              t.name as trainer_name
       FROM submission_monsters sm
       JOIN monsters m ON sm.monster_id = m.id
       LEFT JOIN trainers t ON m.trainer_id = t.id
       WHERE sm.submission_id = $1`,
      [submissionId]
    );
    return result.rows as Record<string, unknown>[];
  }

  async findTrainersBySubmissionId(submissionId: number): Promise<Record<string, unknown>[]> {
    const result = await db.query(
      `SELECT t.id, t.name, t.main_ref,
              t.species1, t.species2, t.species3,
              t.type1, t.type2, t.type3, t.type4, t.type5, t.type6
       FROM submission_trainers st
       JOIN trainers t ON st.trainer_id = t.id
       WHERE st.submission_id = $1`,
      [submissionId]
    );
    return result.rows as Record<string, unknown>[];
  }

  // ===========================================================================
  // References
  // ===========================================================================

  async addReference(submissionId: number, data: ReferenceInsertData): Promise<void> {
    await db.query(
      `INSERT INTO submission_references (submission_id, reference_type, trainer_id, monster_name, reference_url, instance_count)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [submissionId, data.referenceType, data.trainerId, data.monsterName ?? null, data.referenceUrl, data.instanceCount ?? 1]
    );
  }

  // ===========================================================================
  // Gift Items
  // ===========================================================================

  async findGiftItems(submissionId: number): Promise<GiftItemRow[]> {
    const result = await db.query<GiftItemRow>(
      `SELECT id, item_category, item_name, quantity, recipient_id, is_claimed, claimed_at
       FROM submission_gift_items WHERE submission_id = $1`,
      [submissionId]
    );
    return result.rows;
  }

  async findUnclaimedGiftItem(itemId: number): Promise<{ item_category: string; item_name: string; quantity: number } | null> {
    const result = await db.query<{ item_category: string; item_name: string; quantity: number }>(
      'SELECT item_category, item_name, quantity FROM submission_gift_items WHERE id = $1 AND is_claimed::boolean = false',
      [itemId]
    );
    return result.rows[0] ?? null;
  }

  async claimGiftItem(itemId: number, recipientId: number): Promise<void> {
    await db.query(
      'UPDATE submission_gift_items SET is_claimed = 1, recipient_id = $1, claimed_at = CURRENT_TIMESTAMP WHERE id = $2',
      [recipientId, itemId]
    );
  }

  // ===========================================================================
  // Reward Allocations
  // ===========================================================================

  async findRewardAllocations(submissionId: number): Promise<{
    giftLevelAllocations: Record<string, unknown>[];
    giftCoinAllocations: Record<string, unknown>[];
    cappedLevelAllocations: Record<string, unknown>[];
  }> {
    const [giftLevelsResult, giftCoinsResult, cappedLevelsResult] = await Promise.all([
      db.query(
        `SELECT id, recipient_type, recipient_id, amount, is_claimed, claimed_at
         FROM submission_rewards WHERE submission_id = $1 AND reward_type = 'allocated_gift_level'`,
        [submissionId]
      ),
      db.query(
        `SELECT id, recipient_type, recipient_id, amount, is_claimed, claimed_at
         FROM submission_rewards WHERE submission_id = $1 AND reward_type = 'allocated_gift_coin'`,
        [submissionId]
      ),
      db.query(
        `SELECT id, recipient_type, recipient_id, levels_amount
         FROM submission_capped_levels WHERE submission_id = $1`,
        [submissionId]
      ),
    ]);

    return {
      giftLevelAllocations: giftLevelsResult.rows as Record<string, unknown>[],
      giftCoinAllocations: giftCoinsResult.rows as Record<string, unknown>[],
      cappedLevelAllocations: cappedLevelsResult.rows as Record<string, unknown>[],
    };
  }

  // ===========================================================================
  // Gallery / Browse Queries
  // ===========================================================================

  async findArtGallery(filters: GalleryFilters): Promise<{
    rows: Record<string, unknown>[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 12;
    const offset = (page - 1) * limit;

    let query = `
      SELECT
        s.id, s.title, s.description, s.content_type, s.submission_type,
        s.submission_date, s.user_id, s.trainer_id,
        u.id as user_table_id, u.username, u.display_name,
        u.discord_id as user_discord_id,
        t.name as trainer_name, t.main_ref,
        (SELECT image_url FROM submission_images WHERE submission_id = s.id AND is_main::boolean = true LIMIT 1) as image_url,
        (SELECT json_agg(tag) FROM submission_tags WHERE submission_id = s.id) as tags,
        ${MONSTERS_SUBQUERY} as monsters
      FROM submissions s
      LEFT JOIN users u ON (s.user_id::text = u.discord_id OR s.user_id::text = u.id::text)
      LEFT JOIN trainers t ON s.trainer_id = t.id
      WHERE s.submission_type = 'art'
    `;

    const queryParams: unknown[] = [];
    let paramIndex = 1;

    if (filters.isExternal !== undefined) {
      query += ` AND s.is_external::boolean = $${paramIndex}`;
      queryParams.push(filters.isExternal);
      paramIndex++;
    }
    if (filters.contentType && filters.contentType !== 'all') {
      query += ` AND s.content_type = $${paramIndex}`;
      queryParams.push(filters.contentType);
      paramIndex++;
    }
    if (filters.tags && filters.tags.length > 0) {
      for (const tag of filters.tags) {
        query += ` AND EXISTS (SELECT 1 FROM submission_tags WHERE submission_id = s.id AND tag = $${paramIndex})`;
        queryParams.push(tag);
        paramIndex++;
      }
    }
    if (filters.trainerId) {
      query += ` AND s.trainer_id = $${paramIndex}`;
      queryParams.push(filters.trainerId);
      paramIndex++;
    }
    if (filters.userId) {
      query += ` AND s.user_id = $${paramIndex}`;
      queryParams.push(filters.userId);
      paramIndex++;
    }
    if (filters.monsterId) {
      query += ` AND EXISTS (SELECT 1 FROM submission_monsters WHERE submission_id = s.id AND monster_id = $${paramIndex})`;
      queryParams.push(filters.monsterId);
      paramIndex++;
    }
    if (filters.search) {
      query += ` AND LOWER(s.title) LIKE LOWER($${paramIndex})`;
      queryParams.push(`%${filters.search}%`);
      paramIndex++;
    }

    query += buildMatureContentFilter(!!filters.showMature, filters.matureFilters);
    query += filters.sort === 'oldest'
      ? ' ORDER BY s.submission_date ASC'
      : ' ORDER BY s.submission_date DESC';
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    // Count query
    let countQuery = `SELECT COUNT(*) as total FROM submissions s WHERE s.submission_type = 'art'`;
    const countParams: unknown[] = [];
    let countIdx = 1;

    if (filters.isExternal !== undefined) {
      countQuery += ` AND s.is_external::boolean = $${countIdx}`;
      countParams.push(filters.isExternal);
      countIdx++;
    }
    if (filters.contentType && filters.contentType !== 'all') {
      countQuery += ` AND s.content_type = $${countIdx}`;
      countParams.push(filters.contentType);
      countIdx++;
    }
    if (filters.tags && filters.tags.length > 0) {
      for (const tag of filters.tags) {
        countQuery += ` AND EXISTS (SELECT 1 FROM submission_tags WHERE submission_id = s.id AND tag = $${countIdx})`;
        countParams.push(tag);
        countIdx++;
      }
    }
    if (filters.trainerId) {
      countQuery += ` AND s.trainer_id = $${countIdx}`;
      countParams.push(filters.trainerId);
      countIdx++;
    }
    if (filters.userId) {
      countQuery += ` AND s.user_id = $${countIdx}`;
      countParams.push(filters.userId);
      countIdx++;
    }
    if (filters.monsterId) {
      countQuery += ` AND EXISTS (SELECT 1 FROM submission_monsters WHERE submission_id = s.id AND monster_id = $${countIdx})`;
      countParams.push(filters.monsterId);
      countIdx++;
    }
    if (filters.search) {
      countQuery += ` AND LOWER(s.title) LIKE LOWER($${countIdx})`;
      countParams.push(`%${filters.search}%`);
    }
    countQuery += buildMatureContentFilter(!!filters.showMature, filters.matureFilters);

    const [dataResult, countResult] = await Promise.all([
      db.query(query, queryParams),
      db.query<{ total: string }>(countQuery, countParams),
    ]);

    const total = parseInt(countResult.rows[0]?.total ?? '0', 10);

    return {
      rows: dataResult.rows as Record<string, unknown>[],
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findWritingLibrary(filters: LibraryFilters): Promise<{
    rows: Record<string, unknown>[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 12;
    const offset = (page - 1) * limit;

    let query = `
      SELECT
        s.id, s.title, s.description, s.content_type, s.submission_type,
        s.submission_date, s.user_id, s.trainer_id, s.is_book, s.parent_id,
        u.username, u.display_name,
        t.name as trainer_name, t.main_ref,
        (SELECT image_url FROM submission_images WHERE submission_id = s.id AND is_main::boolean = true LIMIT 1) as cover_image_url,
        (SELECT json_agg(tag) FROM submission_tags WHERE submission_id = s.id) as tags,
        ${MONSTERS_SUBQUERY} as monsters,
        (SELECT COUNT(*) FROM submissions WHERE parent_id = s.id) as chapter_count,
        (LENGTH(s.content) - LENGTH(REPLACE(s.content, ' ', '')) + 1) as word_count,
        LEFT(s.content, 400) as content_preview
      FROM submissions s
      LEFT JOIN users u ON (s.user_id::text = u.discord_id OR s.user_id::text = u.id::text)
      LEFT JOIN trainers t ON s.trainer_id = t.id
      WHERE s.submission_type = 'writing'
    `;

    const queryParams: unknown[] = [];
    let paramIndex = 1;

    if (filters.isExternal !== undefined) {
      query += ` AND s.is_external::boolean = $${paramIndex}`;
      queryParams.push(filters.isExternal);
      paramIndex++;
    }
    if (filters.contentType && filters.contentType !== 'all') {
      query += ` AND s.content_type = $${paramIndex}`;
      queryParams.push(filters.contentType);
      paramIndex++;
    }
    if (filters.tags && filters.tags.length > 0) {
      for (const tag of filters.tags) {
        query += ` AND EXISTS (SELECT 1 FROM submission_tags WHERE submission_id = s.id AND tag = $${paramIndex})`;
        queryParams.push(tag);
        paramIndex++;
      }
    }
    if (filters.trainerId) {
      query += ` AND s.trainer_id = $${paramIndex}`;
      queryParams.push(filters.trainerId);
      paramIndex++;
    }
    if (filters.userId) {
      query += ` AND s.user_id = $${paramIndex}`;
      queryParams.push(filters.userId);
      paramIndex++;
    }
    if (filters.monsterId) {
      query += ` AND EXISTS (SELECT 1 FROM submission_monsters WHERE submission_id = s.id AND monster_id = $${paramIndex})`;
      queryParams.push(filters.monsterId);
      paramIndex++;
    }
    if (filters.booksOnly) {
      query += ' AND s.is_book::boolean = true';
    }
    if (filters.excludeChapters) {
      query += ' AND s.parent_id IS NULL';
    }

    if (filters.currentUserId) {
      query += ` AND (
        s.is_book::boolean IS NOT TRUE
        OR (SELECT COUNT(*) FROM submissions WHERE parent_id = s.id) > 0
        OR s.user_id::text = $${paramIndex}::text
        OR EXISTS (SELECT 1 FROM book_collaborators bc WHERE bc.book_id = s.id AND bc.user_id::text = $${paramIndex}::text)
      )`;
      queryParams.push(filters.currentUserId);
      paramIndex++;
    } else {
      query += ` AND (
        s.is_book::boolean IS NOT TRUE
        OR (SELECT COUNT(*) FROM submissions WHERE parent_id = s.id) > 0
      )`;
    }

    query += buildMatureContentFilter(!!filters.showMature, filters.matureFilters);
    query += filters.sort === 'oldest'
      ? ' ORDER BY s.submission_date ASC'
      : ' ORDER BY s.submission_date DESC';
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    // Count query
    let countQuery = `SELECT COUNT(*) as total FROM submissions s WHERE s.submission_type = 'writing'`;
    const countParams: unknown[] = [];
    let countIdx = 1;

    if (filters.isExternal !== undefined) {
      countQuery += ` AND s.is_external::boolean = $${countIdx}`;
      countParams.push(filters.isExternal);
      countIdx++;
    }
    if (filters.contentType && filters.contentType !== 'all') {
      countQuery += ` AND s.content_type = $${countIdx}`;
      countParams.push(filters.contentType);
      countIdx++;
    }
    if (filters.tags && filters.tags.length > 0) {
      for (const tag of filters.tags) {
        countQuery += ` AND EXISTS (SELECT 1 FROM submission_tags WHERE submission_id = s.id AND tag = $${countIdx})`;
        countParams.push(tag);
        countIdx++;
      }
    }
    if (filters.trainerId) {
      countQuery += ` AND s.trainer_id = $${countIdx}`;
      countParams.push(filters.trainerId);
      countIdx++;
    }
    if (filters.userId) {
      countQuery += ` AND s.user_id = $${countIdx}`;
      countParams.push(filters.userId);
      countIdx++;
    }
    if (filters.monsterId) {
      countQuery += ` AND EXISTS (SELECT 1 FROM submission_monsters WHERE submission_id = s.id AND monster_id = $${countIdx})`;
      countParams.push(filters.monsterId);
      countIdx++;
    }
    if (filters.booksOnly) {
      countQuery += ' AND s.is_book::boolean = true';
    }
    if (filters.excludeChapters) {
      countQuery += ' AND s.parent_id IS NULL';
    }
    if (filters.currentUserId) {
      countQuery += ` AND (
        s.is_book::boolean IS NOT TRUE
        OR (SELECT COUNT(*) FROM submissions WHERE parent_id = s.id) > 0
        OR s.user_id::text = $${countIdx}::text
        OR EXISTS (SELECT 1 FROM book_collaborators bc WHERE bc.book_id = s.id AND bc.user_id::text = $${countIdx}::text)
      )`;
      countParams.push(filters.currentUserId);
    } else {
      countQuery += ` AND (
        s.is_book::boolean IS NOT TRUE
        OR (SELECT COUNT(*) FROM submissions WHERE parent_id = s.id) > 0
      )`;
    }
    countQuery += buildMatureContentFilter(!!filters.showMature, filters.matureFilters);

    const [dataResult, countResult] = await Promise.all([
      db.query(query, queryParams),
      db.query<{ total: string }>(countQuery, countParams),
    ]);

    const total = parseInt(countResult.rows[0]?.total ?? '0', 10);

    return {
      rows: dataResult.rows as Record<string, unknown>[],
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findMySubmissions(userId: string, filters: MySubmissionsFilters): Promise<{
    rows: Record<string, unknown>[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 12;
    const offset = (page - 1) * limit;

    let query = `
      SELECT
        s.id, s.title, s.description, s.content, s.content_type,
        s.submission_type, s.submission_date, s.user_id, s.trainer_id,
        s.status, s.is_mature, s.parent_id, s.is_book,
        (SELECT image_url FROM submission_images WHERE submission_id = s.id AND is_main::boolean = true LIMIT 1) as image_url,
        (SELECT json_agg(tag) FROM submission_tags WHERE submission_id = s.id) as tags
      FROM submissions s
      WHERE (s.user_id::text = $1 OR s.user_id::text = (SELECT id::text FROM users WHERE discord_id = $1))
        AND (s.status IS NULL OR s.status != 'deleted')
    `;

    const queryParams: unknown[] = [userId];
    let paramIndex = 2;

    if (filters.submissionType && (filters.submissionType === 'art' || filters.submissionType === 'writing')) {
      query += ` AND s.submission_type = $${paramIndex}`;
      queryParams.push(filters.submissionType);
      paramIndex++;
    }

    switch (filters.sortBy) {
      case 'oldest':
        query += ' ORDER BY s.submission_date ASC';
        break;
      case 'title':
        query += ' ORDER BY s.title ASC';
        break;
      default:
        query += ' ORDER BY s.submission_date DESC';
        break;
    }

    // Count
    let countQuery = `
      SELECT COUNT(*) as total FROM submissions s
      WHERE (s.user_id::text = $1 OR s.user_id::text = (SELECT id::text FROM users WHERE discord_id = $1))
        AND (s.status IS NULL OR s.status != 'deleted')
    `;
    const countParams: unknown[] = [userId];

    if (filters.submissionType && (filters.submissionType === 'art' || filters.submissionType === 'writing')) {
      countQuery += ' AND s.submission_type = $2';
      countParams.push(filters.submissionType);
    }

    const countResult = await db.query<{ total: string }>(countQuery, countParams);
    const total = parseInt(countResult.rows[0]?.total ?? '0', 10);

    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const dataResult = await db.query(query, queryParams);

    return {
      rows: dataResult.rows as Record<string, unknown>[],
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ===========================================================================
  // Book Management
  // ===========================================================================

  async findUserOwnedBooks(userId: string): Promise<Record<string, unknown>[]> {
    const result = await db.query(
      `SELECT s.id, s.title, s.description, s.submission_date, s.user_id, 'owner' as role,
        (SELECT image_url FROM submission_images WHERE submission_id = s.id AND is_main::boolean = true LIMIT 1) as cover_image_url,
        (SELECT COUNT(*) FROM submissions WHERE parent_id = s.id) as chapter_count
       FROM submissions s
       WHERE s.submission_type = 'writing' AND s.is_book::boolean = true AND s.user_id = $1
       ORDER BY s.submission_date DESC`,
      [userId]
    );
    return result.rows as Record<string, unknown>[];
  }

  async findUserCollaboratedBooks(userId: string): Promise<Record<string, unknown>[]> {
    const result = await db.query(
      `SELECT s.id, s.title, s.description, s.submission_date, s.user_id, bc.role,
        (SELECT image_url FROM submission_images WHERE submission_id = s.id AND is_main::boolean = true LIMIT 1) as cover_image_url,
        (SELECT COUNT(*) FROM submissions WHERE parent_id = s.id) as chapter_count,
        u.username as owner_username, u.display_name as owner_display_name
       FROM submissions s
       JOIN book_collaborators bc ON bc.book_id = s.id
       LEFT JOIN users u ON (s.user_id::text = u.discord_id OR s.user_id::text = u.id::text)
       WHERE s.submission_type = 'writing' AND s.is_book::boolean = true
         AND bc.user_id::text = $1::text AND bc.role = 'editor'
       ORDER BY s.submission_date DESC`,
      [userId]
    );
    return result.rows as Record<string, unknown>[];
  }

  async findBookWithChapters(bookId: number): Promise<{
    book: { id: number; title: string; is_book: boolean } | null;
    chapters: Record<string, unknown>[];
  }> {
    const bookResult = await db.query<{ id: number; title: string; is_book: boolean }>(
      'SELECT id, title, is_book FROM submissions WHERE id = $1',
      [bookId]
    );
    const book = bookResult.rows[0] ?? null;

    if (!book) {
      return { book: null, chapters: [] };
    }

    const chaptersResult = await db.query(
      `SELECT s.id, s.title, s.description, s.submission_date, s.chapter_number,
        (SELECT SUM(LENGTH(content) - LENGTH(REPLACE(content, ' ', '')) + 1) FROM submissions WHERE id = s.id) as word_count,
        (SELECT image_url FROM submission_images WHERE submission_id = s.id AND is_main::boolean = true LIMIT 1) as cover_image_url
       FROM submissions s WHERE s.parent_id = $1
       ORDER BY CASE WHEN s.chapter_number IS NOT NULL THEN s.chapter_number ELSE 999999 END ASC, s.submission_date ASC`,
      [bookId]
    );

    return {
      book,
      chapters: chaptersResult.rows as Record<string, unknown>[],
    };
  }

  async getMaxChapterNumber(parentId: number): Promise<number> {
    const result = await db.query<{ max_chapter: number }>(
      'SELECT COALESCE(MAX(chapter_number), 0) as max_chapter FROM submissions WHERE parent_id = $1',
      [parentId]
    );
    return result.rows[0]?.max_chapter ?? 0;
  }

  async updateChapterNumber(chapterId: number, chapterNumber: number, parentId: number): Promise<void> {
    await db.query(
      'UPDATE submissions SET chapter_number = $1 WHERE id = $2 AND parent_id = $3',
      [chapterNumber, chapterId, parentId]
    );
  }

  // ===========================================================================
  // Collaborators
  // ===========================================================================

  async findCollaboratorRole(bookId: number, userId: string): Promise<string | null> {
    const result = await db.query<{ role: string }>(
      'SELECT role FROM book_collaborators WHERE book_id = $1 AND user_id::text = $2::text',
      [bookId, userId]
    );
    return result.rows[0]?.role ?? null;
  }

  async findCollaboratorsByBookId(bookId: number): Promise<Record<string, unknown>[]> {
    const result = await db.query(
      `SELECT bc.*, u.username, u.display_name
       FROM book_collaborators bc
       LEFT JOIN users u ON (bc.user_id::text = u.discord_id OR bc.user_id::text = u.id::text)
       WHERE bc.book_id = $1`,
      [bookId]
    );
    return result.rows as Record<string, unknown>[];
  }

  async addCollaborator(bookId: number, userId: string, role: string, addedBy: string): Promise<{ id: number }> {
    const result = await db.query<{ id: number }>(
      `INSERT INTO book_collaborators (book_id, user_id, role, added_by, added_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) RETURNING id`,
      [bookId, userId, role, addedBy]
    );
    const row = result.rows[0];
    if (!row) { throw new Error('Failed to add collaborator'); }
    return row;
  }

  async removeCollaborator(bookId: number, userId: string): Promise<boolean> {
    const result = await db.query(
      'DELETE FROM book_collaborators WHERE book_id = $1 AND user_id::text = $2::text',
      [bookId, userId]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async updateCollaboratorRole(bookId: number, userId: string, role: string): Promise<boolean> {
    const result = await db.query(
      'UPDATE book_collaborators SET role = $1 WHERE book_id = $2 AND user_id::text = $3::text',
      [role, bookId, userId]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async findCollaborationsByUserId(userId: string): Promise<Record<string, unknown>[]> {
    const result = await db.query(
      `SELECT s.id, s.title, s.description, s.submission_date, bc.role,
        (SELECT image_url FROM submission_images WHERE submission_id = s.id AND is_main::boolean = true LIMIT 1) as cover_image_url,
        (SELECT COUNT(*) FROM submissions WHERE parent_id = s.id) as chapter_count,
        u.username as owner_username, u.display_name as owner_display_name
       FROM submissions s
       JOIN book_collaborators bc ON bc.book_id = s.id
       LEFT JOIN users u ON (s.user_id::text = u.discord_id OR s.user_id::text = u.id::text)
       WHERE bc.user_id::text = $1::text
       ORDER BY s.submission_date DESC`,
      [userId]
    );
    return result.rows as Record<string, unknown>[];
  }

  async searchUsersForCollaboration(bookId: number, search: string, excludeUserId: string): Promise<Record<string, unknown>[]> {
    const result = await db.query(
      `SELECT id, username, display_name, discord_id
       FROM users
       WHERE (LOWER(username) LIKE LOWER($1) OR LOWER(display_name) LIKE LOWER($1))
         AND discord_id != $2 AND id::text != $2
         AND NOT EXISTS (SELECT 1 FROM book_collaborators WHERE book_id = $3 AND (user_id::text = users.discord_id OR user_id::text = users.id::text))
       LIMIT 10`,
      [`%${search}%`, excludeUserId, bookId]
    );
    return result.rows as Record<string, unknown>[];
  }

  async findUserByDiscordIdOrId(identifier: string): Promise<{ id: number; username: string; display_name: string; discord_id: string } | null> {
    const result = await db.query<{ id: number; username: string; display_name: string; discord_id: string }>(
      'SELECT id, username, display_name, discord_id FROM users WHERE discord_id = $1 OR id::text = $1',
      [identifier]
    );
    return result.rows[0] ?? null;
  }

  async findPlayerUserId(trainerId: number): Promise<string | null> {
    const result = await db.query<{ player_user_id: string }>(
      'SELECT player_user_id FROM trainers WHERE id = $1',
      [trainerId]
    );
    return result.rows[0]?.player_user_id ?? null;
  }
}
