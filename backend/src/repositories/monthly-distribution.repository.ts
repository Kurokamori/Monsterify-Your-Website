import { db } from '../database';
import type { InventoryCategory } from './trainer-inventory.repository';

// ─── Monthly Distribution Items ─────────────────────────────────────────────

export type MonthlyDistributionItemRow = {
  id: number;
  name: string;
  category: string;
  quantity: number;
  created_at: Date;
  updated_at: Date;
};

export type MonthlyDistributionItem = {
  id: number;
  name: string;
  category: InventoryCategory;
  quantity: number;
};

// ─── Distribution Runs ──────────────────────────────────────────────────────

export type DistributionRunRow = {
  id: number;
  trigger_type: 'automatic' | 'manual';
  success: boolean;
  total_trainers: number;
  success_count: number;
  fail_count: number;
  error_message: string | null;
  ran_at: Date;
};

export type DistributionRun = {
  id: number;
  triggerType: 'automatic' | 'manual';
  success: boolean;
  totalTrainers: number;
  successCount: number;
  failCount: number;
  errorMessage: string | null;
  ranAt: Date;
};

const normalizeRun = (row: DistributionRunRow): DistributionRun => ({
  id: row.id,
  triggerType: row.trigger_type,
  success: row.success,
  totalTrainers: row.total_trainers,
  successCount: row.success_count,
  failCount: row.fail_count,
  errorMessage: row.error_message,
  ranAt: row.ran_at,
});

export class MonthlyDistributionRepository {
  // ─── Items ──────────────────────────────────────────────────────────────────

  async getItems(): Promise<MonthlyDistributionItem[]> {
    const result = await db.query<MonthlyDistributionItemRow>(
      'SELECT * FROM monthly_distribution_items ORDER BY id ASC'
    );
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      category: row.category as InventoryCategory,
      quantity: row.quantity,
    }));
  }

  async replaceItems(items: Array<{ name: string; category: string; quantity: number }>): Promise<MonthlyDistributionItem[]> {
    await db.transaction(async (client) => {
      await client.query('DELETE FROM monthly_distribution_items');
      for (const item of items) {
        await client.query(
          'INSERT INTO monthly_distribution_items (name, category, quantity) VALUES ($1, $2, $3)',
          [item.name, item.category, item.quantity]
        );
      }
    });
    return this.getItems();
  }

  // ─── Runs ───────────────────────────────────────────────────────────────────

  async recordRun(data: {
    triggerType: 'automatic' | 'manual';
    success: boolean;
    totalTrainers: number;
    successCount: number;
    failCount: number;
    errorMessage?: string | null;
  }): Promise<DistributionRun> {
    const result = await db.query<DistributionRunRow>(
      `INSERT INTO distribution_runs
        (trigger_type, success, total_trainers, success_count, fail_count, error_message)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        data.triggerType,
        data.success,
        data.totalTrainers,
        data.successCount,
        data.failCount,
        data.errorMessage ?? null,
      ]
    );
    const row = result.rows[0];
    if (!row) { throw new Error('Failed to record distribution run'); }
    return normalizeRun(row);
  }

  async getRecentRuns(limit = 20): Promise<DistributionRun[]> {
    const result = await db.query<DistributionRunRow>(
      'SELECT * FROM distribution_runs ORDER BY ran_at DESC LIMIT $1',
      [limit]
    );
    return result.rows.map(normalizeRun);
  }

  async getLastRun(): Promise<DistributionRun | null> {
    const result = await db.query<DistributionRunRow>(
      'SELECT * FROM distribution_runs ORDER BY ran_at DESC LIMIT 1'
    );
    return result.rows[0] ? normalizeRun(result.rows[0]) : null;
  }
}
