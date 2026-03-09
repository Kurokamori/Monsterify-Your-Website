import { BaseRepository } from './base.repository';
import { db } from '../database';

export type ReferenceApprovalRow = {
  id: number;
  submission_id: number;
  submitter_user_id: number;
  owner_user_id: number;
  trainer_id: number;
  reference_type: string;
  reference_url: string;
  reward_levels: number;
  reward_coins: number;
  metadata: Record<string, unknown> | null;
  status: string;
  gift_rewards_claimed: boolean;
  created_at: Date;
  reviewed_at: Date | null;
};

export type ReferenceApproval = {
  id: number;
  submissionId: number;
  submitterUserId: number;
  ownerUserId: number;
  trainerId: number;
  referenceType: string;
  referenceUrl: string;
  rewardLevels: number;
  rewardCoins: number;
  metadata: Record<string, unknown> | null;
  status: string;
  giftRewardsClaimed: boolean;
  createdAt: Date;
  reviewedAt: Date | null;
};

export type ReferenceApprovalCreateInput = {
  submissionId: number;
  submitterUserId: number;
  ownerUserId: number;
  trainerId: number;
  referenceType: string;
  referenceUrl: string;
  rewardLevels: number;
  rewardCoins: number;
  metadata?: Record<string, unknown>;
};

export type PendingApprovalWithDetails = ReferenceApproval & {
  trainerName: string;
  submitterUsername: string | null;
  submitterDisplayName: string | null;
  monsterName: string | null;
};

export type AcceptedApprovalForSubmitter = ReferenceApproval & {
  trainerName: string;
};

const normalize = (row: ReferenceApprovalRow): ReferenceApproval => ({
  id: row.id,
  submissionId: row.submission_id,
  submitterUserId: row.submitter_user_id,
  ownerUserId: row.owner_user_id,
  trainerId: row.trainer_id,
  referenceType: row.reference_type,
  referenceUrl: row.reference_url,
  rewardLevels: row.reward_levels,
  rewardCoins: row.reward_coins,
  metadata: row.metadata,
  status: row.status,
  giftRewardsClaimed: Boolean(row.gift_rewards_claimed),
  createdAt: row.created_at,
  reviewedAt: row.reviewed_at,
});

export class ReferenceApprovalRepository extends BaseRepository<
  ReferenceApproval,
  ReferenceApprovalCreateInput,
  Partial<ReferenceApprovalCreateInput>
> {
  constructor() {
    super('reference_approvals');
  }

  override async findById(id: number): Promise<ReferenceApproval | null> {
    const result = await db.query<ReferenceApprovalRow>(
      'SELECT * FROM reference_approvals WHERE id = $1',
      [id]
    );
    const row = result.rows[0];
    return row ? normalize(row) : null;
  }

  override async create(input: ReferenceApprovalCreateInput): Promise<ReferenceApproval> {
    const result = await db.query<{ id: number }>(
      `INSERT INTO reference_approvals
         (submission_id, submitter_user_id, owner_user_id, trainer_id, reference_type,
          reference_url, reward_levels, reward_coins, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        input.submissionId,
        input.submitterUserId,
        input.ownerUserId,
        input.trainerId,
        input.referenceType,
        input.referenceUrl,
        input.rewardLevels,
        input.rewardCoins,
        input.metadata ? JSON.stringify(input.metadata) : null,
      ]
    );
    const row = result.rows[0];
    if (!row) {throw new Error('Failed to create reference approval');}
    const created = await this.findById(row.id);
    if (!created) {throw new Error('Failed to retrieve created approval');}
    return created;
  }

  async findPendingByOwner(ownerUserId: number): Promise<PendingApprovalWithDetails[]> {
    const result = await db.query<
      ReferenceApprovalRow & {
        trainer_name: string;
        submitter_username: string | null;
        submitter_display_name: string | null;
      }
    >(
      `SELECT ra.*, t.name AS trainer_name,
              u.username AS submitter_username,
              u.display_name AS submitter_display_name
       FROM reference_approvals ra
       JOIN trainers t ON t.id = ra.trainer_id
       JOIN users u ON u.id = ra.submitter_user_id
       WHERE ra.owner_user_id = $1 AND ra.status = 'pending'
       ORDER BY ra.created_at DESC`,
      [ownerUserId]
    );
    return result.rows.map((row) => ({
      ...normalize(row),
      trainerName: row.trainer_name,
      submitterUsername: row.submitter_username,
      submitterDisplayName: row.submitter_display_name,
      monsterName: (row.metadata as Record<string, unknown> | null)?.monsterName as string | null ?? null,
    }));
  }

  async findAcceptedBySubmitter(submitterUserId: number): Promise<AcceptedApprovalForSubmitter[]> {
    const result = await db.query<ReferenceApprovalRow & { trainer_name: string }>(
      `SELECT ra.*, t.name AS trainer_name
       FROM reference_approvals ra
       JOIN trainers t ON t.id = ra.trainer_id
       WHERE ra.submitter_user_id = $1
         AND ra.status = 'accepted'
         AND ra.gift_rewards_claimed = false
       ORDER BY ra.reviewed_at DESC`,
      [submitterUserId]
    );
    return result.rows.map((row) => ({
      ...normalize(row),
      trainerName: row.trainer_name,
    }));
  }

  override async update(id: number, _input: Partial<ReferenceApprovalCreateInput>): Promise<ReferenceApproval> {
    const existing = await this.findById(id);
    if (!existing) {throw new Error('Approval not found');}
    // Generic update not needed – use specific methods instead
    return existing;
  }

  async updateStatus(id: number, status: 'accepted' | 'rejected'): Promise<ReferenceApproval | null> {
    await db.query(
      `UPDATE reference_approvals SET status = $1, reviewed_at = NOW() WHERE id = $2`,
      [status, id]
    );
    return this.findById(id);
  }

  async acceptAllForOwner(ownerUserId: number): Promise<number> {
    const result = await db.query<{ count: string }>(
      `WITH updated AS (
         UPDATE reference_approvals
         SET status = 'accepted', reviewed_at = NOW()
         WHERE owner_user_id = $1 AND status = 'pending'
         RETURNING id
       ) SELECT COUNT(*)::text AS count FROM updated`,
      [ownerUserId]
    );
    return parseInt(result.rows[0]?.count ?? '0', 10);
  }

  async rejectAllForOwner(ownerUserId: number): Promise<number> {
    const result = await db.query<{ count: string }>(
      `WITH updated AS (
         UPDATE reference_approvals
         SET status = 'rejected', reviewed_at = NOW()
         WHERE owner_user_id = $1 AND status = 'pending'
         RETURNING id
       ) SELECT COUNT(*)::text AS count FROM updated`,
      [ownerUserId]
    );
    return parseInt(result.rows[0]?.count ?? '0', 10);
  }

  async markGiftRewardsClaimed(submitterUserId: number): Promise<void> {
    await db.query(
      `UPDATE reference_approvals
       SET gift_rewards_claimed = true
       WHERE submitter_user_id = $1 AND status = 'accepted' AND gift_rewards_claimed = false`,
      [submitterUserId]
    );
  }

  async countPendingForOwner(ownerUserId: number): Promise<number> {
    const result = await db.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM reference_approvals
       WHERE owner_user_id = $1 AND status = 'pending'`,
      [ownerUserId]
    );
    return parseInt(result.rows[0]?.count ?? '0', 10);
  }

  async countUnclaimedGiftsForSubmitter(submitterUserId: number): Promise<number> {
    const result = await db.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM reference_approvals
       WHERE submitter_user_id = $1 AND status = 'accepted' AND gift_rewards_claimed = false`,
      [submitterUserId]
    );
    return parseInt(result.rows[0]?.count ?? '0', 10);
  }

  async sumUnclaimedGiftLevels(submitterUserId: number): Promise<number> {
    const result = await db.query<{ total: string }>(
      `SELECT COALESCE(SUM(reward_levels), 0)::text AS total FROM reference_approvals
       WHERE submitter_user_id = $1 AND status = 'accepted' AND gift_rewards_claimed = false`,
      [submitterUserId]
    );
    return parseInt(result.rows[0]?.total ?? '0', 10);
  }
}
