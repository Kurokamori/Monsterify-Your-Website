/**
 * Fix Nexomon Nr Script
 *
 * Sets incrementing `nr` values for all nexomon_monsters rows,
 * ordered by name, so every row has a unique non-null nr.
 *
 * Usage (from the backend/ directory):
 *   npx tsx scripts/fix-nexomon-nr.ts
 *   npx tsx scripts/fix-nexomon-nr.ts --dry-run
 */

import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { Pool } from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost')
      ? false
      : { rejectUnauthorized: false },
  });

  try {
    const { rows } = await pool.query<{ name: string; nr: number | null }>(
      `SELECT name, nr FROM nexomon_monsters ORDER BY name ASC`
    );

    console.log(`Found ${rows.length} nexomon monsters`);

    const nullCount = rows.filter((r) => r.nr === null).length;
    console.log(`${nullCount} have null nr values`);

    if (nullCount === 0) {
      console.log('Nothing to fix!');
      return;
    }

    if (DRY_RUN) {
      console.log('\n--- DRY RUN (no changes will be made) ---\n');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (let i = 0; i < rows.length; i++) {
        const newNr = i + 1;
        const row = rows[i]!;

        if (row.nr !== newNr) {
          console.log(`  ${row.name}: nr ${row.nr} → ${newNr}`);
          if (!DRY_RUN) {
            await client.query(
              `UPDATE nexomon_monsters SET nr = $1 WHERE name = $2`,
              [newNr, row.name]
            );
          }
        }
      }

      if (DRY_RUN) {
        await client.query('ROLLBACK');
        console.log('\nDry run complete — rolled back.');
      } else {
        await client.query('COMMIT');
        console.log('\nDone! All nr values updated.');
      }
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});
