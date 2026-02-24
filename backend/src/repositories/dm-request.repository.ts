import { BaseRepository } from './base.repository';
import { db } from '../database';
import type {
  DmRequestRow,
  DmRequest,
  DmRequestWithProfiles,
  DmRequestCreateInput,
  DmRequestStatus,
} from '../utils/types';

const normalize = (row: DmRequestRow): DmRequest => ({
  id: row.id,
  fromTrainerId: row.from_trainer_id,
  toTrainerId: row.to_trainer_id,
  status: row.status,
  message: row.message,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

type DmRequestUpdateInput = { status?: DmRequestStatus };

export class DmRequestRepository extends BaseRepository<
  DmRequest,
  DmRequestCreateInput,
  DmRequestUpdateInput
> {
  constructor() {
    super('dm_requests');
  }

  override async findById(id: number): Promise<DmRequest | null> {
    const result = await db.query<DmRequestRow>(
      'SELECT * FROM dm_requests WHERE id = $1',
      [id],
    );
    const row = result.rows[0];
    return row ? normalize(row) : null;
  }

  async findPendingBetween(fromTrainerId: number, toTrainerId: number): Promise<DmRequest | null> {
    const result = await db.query<DmRequestRow>(
      `SELECT * FROM dm_requests
       WHERE from_trainer_id = $1 AND to_trainer_id = $2 AND status = 'pending'`,
      [fromTrainerId, toTrainerId],
    );
    const row = result.rows[0];
    return row ? normalize(row) : null;
  }

  async findForTrainer(trainerId: number): Promise<DmRequestWithProfiles[]> {
    const result = await db.query<
      DmRequestRow & {
        from_nickname: string;
        from_avatar_url: string | null;
        to_nickname: string;
        to_avatar_url: string | null;
      }
    >(
      `SELECT dr.*,
              COALESCE(cp_from.nickname, t_from.name) AS from_nickname,
              cp_from.avatar_url AS from_avatar_url,
              COALESCE(cp_to.nickname, t_to.name) AS to_nickname,
              cp_to.avatar_url AS to_avatar_url
       FROM dm_requests dr
       JOIN trainers t_from ON t_from.id = dr.from_trainer_id
       LEFT JOIN chat_profiles cp_from ON cp_from.trainer_id = dr.from_trainer_id
       JOIN trainers t_to ON t_to.id = dr.to_trainer_id
       LEFT JOIN chat_profiles cp_to ON cp_to.trainer_id = dr.to_trainer_id
       WHERE (dr.from_trainer_id = $1 OR dr.to_trainer_id = $1)
       ORDER BY dr.created_at DESC`,
      [trainerId],
    );

    return result.rows.map((row) => ({
      ...normalize(row),
      fromNickname: row.from_nickname,
      fromAvatarUrl: row.from_avatar_url,
      toNickname: row.to_nickname,
      toAvatarUrl: row.to_avatar_url,
    }));
  }

  override async create(input: DmRequestCreateInput): Promise<DmRequest> {
    const result = await db.query<DmRequestRow>(
      `INSERT INTO dm_requests (from_trainer_id, to_trainer_id, message)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [input.from_trainer_id, input.to_trainer_id, input.message ?? null],
    );
    return normalize(result.rows[0] as DmRequestRow);
  }

  override async update(id: number, input: DmRequestUpdateInput): Promise<DmRequest> {
    if (!input.status) {
      const existing = await this.findById(id);
      if (!existing) {throw new Error('DM request not found');}
      return existing;
    }

    await db.query(
      `UPDATE dm_requests SET status = $1, updated_at = NOW() WHERE id = $2`,
      [input.status, id],
    );

    const updated = await this.findById(id);
    if (!updated) {throw new Error('DM request not found after update');}
    return updated;
  }
}
