import { db } from '../database';

export type CacheVersion = {
  key: string;
  version: number;
  updatedAt: Date;
};

type CacheVersionRow = {
  cache_key: string;
  version: number;
  updated_at: Date;
};

const normalize = (row: CacheVersionRow): CacheVersion => ({
  key: row.cache_key,
  version: row.version,
  updatedAt: row.updated_at,
});

/**
 * Stores monotonic cache-busting version numbers keyed by a logical cache name.
 * Clients compare the server version against their locally stored version and
 * drop their cache when it changes, so an admin can invalidate every user's
 * cache at once (used by the Evolution Explorer).
 */
export class CacheVersionRepository {
  private tableReady: Promise<void> | null = null;

  private ensureTable(): Promise<void> {
    if (!this.tableReady) {
      this.tableReady = db
        .query(
          `CREATE TABLE IF NOT EXISTS cache_versions (
             cache_key  TEXT PRIMARY KEY,
             version    INTEGER NOT NULL DEFAULT 1,
             updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
           )`
        )
        .then(() => undefined)
        .catch((error) => {
          this.tableReady = null;
          throw error;
        });
    }
    return this.tableReady;
  }

  async getVersion(key: string): Promise<CacheVersion> {
    await this.ensureTable();
    const result = await db.query<CacheVersionRow>(
      `INSERT INTO cache_versions (cache_key)
       VALUES ($1)
       ON CONFLICT (cache_key) DO UPDATE SET cache_key = EXCLUDED.cache_key
       RETURNING *`,
      [key]
    );
    const row = result.rows[0];
    if (!row) {
      throw new Error(`Failed to read cache version for "${key}"`);
    }
    return normalize(row);
  }

  async bumpVersion(key: string): Promise<CacheVersion> {
    await this.ensureTable();
    const result = await db.query<CacheVersionRow>(
      `INSERT INTO cache_versions (cache_key, version, updated_at)
       VALUES ($1, 2, NOW())
       ON CONFLICT (cache_key) DO UPDATE SET
         version = cache_versions.version + 1,
         updated_at = NOW()
       RETURNING *`,
      [key]
    );
    const row = result.rows[0];
    if (!row) {
      throw new Error(`Failed to bump cache version for "${key}"`);
    }
    return normalize(row);
  }
}
