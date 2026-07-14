import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db } from './client.js';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

/**
 * A lightweight, forward-only SQL migration runner.
 *
 * On startup it applies every `*.sql` file in `src/database/migrations` that
 * hasn't been applied yet, in ascending filename order, each inside its own
 * transaction. Applied filenames are recorded in the `schema_migrations` table,
 * so a migration file can be safely **deleted** once it has run everywhere — a
 * recorded-but-missing file is simply skipped and never re-run.
 *
 * Because it is forward-only there is no rollback; author idempotent SQL
 * (`ADD COLUMN IF NOT EXISTS`, `CREATE TABLE IF NOT EXISTS`, …) so a partially
 * applied file can be re-run safely if it ever fails midway.
 */

const ensureMigrationsTable = async (): Promise<void> => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

const getAppliedMigrations = async (): Promise<Set<string>> => {
  const result = await db.query<{ name: string }>('SELECT name FROM schema_migrations');
  return new Set(result.rows.map((row) => row.name));
};

const listMigrationFiles = (): string[] => {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    return [];
  }
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.toLowerCase().endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b));
};

const applyMigration = async (name: string): Promise<void> => {
  const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, name), 'utf8');
  await db.transaction(async (client) => {
    await client.query(sql);
    await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name]);
  });
};

/**
 * Run all pending migrations. Safe to call on every boot — it is a no-op when
 * everything is already applied. Throws if a migration fails so startup can
 * abort rather than run against a half-migrated schema.
 */
export const runMigrations = async (): Promise<void> => {
  await ensureMigrationsTable();

  const applied = await getAppliedMigrations();
  const pending = listMigrationFiles().filter((name) => !applied.has(name));

  if (pending.length === 0) {
    console.log('Migrations: schema up to date');
    return;
  }

  console.log(`Migrations: applying ${pending.length} pending migration(s)`);
  for (const name of pending) {
    try {
      await applyMigration(name);
      console.log(`Migrations: applied ${name}`);
    } catch (error) {
      console.error(`Migrations: failed to apply ${name}`, error);
      throw error;
    }
  }
  console.log('Migrations: complete');
};
