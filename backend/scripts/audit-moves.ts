/**
 * Move Implementation Audit
 *
 * Compares every move in the `moves` database table against the moves that have
 * an explicit effect handler in code, and reports which ones are unimplemented.
 *
 * A move counts as "implemented" if:
 *   - It has a named entry in ALL_STATUS_MOVES (stat/affliction/healing/other), OR
 *   - It has a named entry in SPECIAL_DAMAGE_MOVES (damaging moves w/ secondary effects), OR
 *   - It is a damaging move (category Physical/Special) — these resolve generically
 *     through DamageCalculatorService and always do *something* (deal damage).
 *
 * The real gap is Status-category moves with no named handler: they fall through
 * to the "But nothing happened..." branch in battle-action.service.ts.
 *
 * Damaging moves whose Effect text implies a secondary effect (heal/status/multi-hit
 * etc.) but which lack a SPECIAL_DAMAGE_MOVES entry are reported separately as a
 * "partial" gap — they deal damage but their described rider is ignored.
 *
 * Usage (from the backend/ directory):
 *   npx tsx scripts/audit-moves.ts               # summary + unimplemented status moves
 *   npx tsx scripts/audit-moves.ts --all         # also list partial (damaging) gaps
 *   npx tsx scripts/audit-moves.ts --json         # machine-readable JSON dump
 */

import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import { ALL_STATUS_MOVES } from '../src/utils/constants/monster-status-moves';
import { SPECIAL_DAMAGE_MOVES } from '../src/services/adventure/status-move.service';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SHOW_ALL = process.argv.includes('--all');
const AS_JSON = process.argv.includes('--json');

interface MoveRow {
  MoveName: string;
  Type: string | null;
  Power: number | null;
  Accuracy: number | null;
  MoveType: string | null;
  Effect: string | null;
}

interface GapEntry {
  name: string;
  type: string | null;
  category: string | null;
  effect: string | null;
}

const normalize = (name: string): string => name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * Build a lookup set of every implemented move name (normalized).
 */
function buildImplementedSet(): Set<string> {
  const implemented = new Set<string>();
  for (const name of Object.keys(ALL_STATUS_MOVES)) {
    implemented.add(normalize(name));
  }
  for (const name of Object.keys(SPECIAL_DAMAGE_MOVES)) {
    implemented.add(normalize(name));
  }
  return implemented;
}

/**
 * Keyword heuristic mirroring damage-calculator's parseStatusEffect plus common
 * secondary-effect riders. Used only to flag damaging moves whose described
 * effect is being silently ignored.
 */
const SECONDARY_EFFECT_KEYWORDS: RegExp =
  /\b(burn|poison|paralyz|paralysis|freeze|frozen|sleep|confus|flinch|recoil|drain|absorb|heals? the user|restores? .* hp|lowers? the target|raises? the user|two[- ]turn|charg|traps? the target|multiple times|two to five|hits? \d)/i;

async function main(): Promise<void> {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
  });

  try {
    const implemented = buildImplementedSet();

    const { rows } = await pool.query<MoveRow>(
      `SELECT "MoveName", "Type", "Power", "Accuracy", "MoveType", "Effect"
         FROM moves
        ORDER BY "MoveName"`
    );

    const unimplementedStatus: GapEntry[] = [];
    const partialDamaging: GapEntry[] = [];
    let implementedStatus = 0;
    let damagingImplemented = 0;

    for (const row of rows) {
      const category = (row.MoveType ?? '').toLowerCase();
      const isImplemented = implemented.has(normalize(row.MoveName));

      if (category === 'status') {
        if (isImplemented) {
          implementedStatus++;
        } else {
          unimplementedStatus.push({
            name: row.MoveName,
            type: row.Type,
            category: row.MoveType,
            effect: row.Effect,
          });
        }
      } else {
        // Physical / Special — deals damage generically.
        damagingImplemented++;
        if (!isImplemented && row.Effect && SECONDARY_EFFECT_KEYWORDS.test(row.Effect)) {
          partialDamaging.push({
            name: row.MoveName,
            type: row.Type,
            category: row.MoveType,
            effect: row.Effect,
          });
        }
      }
    }

    if (AS_JSON) {
      console.log(
        JSON.stringify(
          {
            totals: {
              moves: rows.length,
              statusMoves: implementedStatus + unimplementedStatus.length,
              statusImplemented: implementedStatus,
              statusUnimplemented: unimplementedStatus.length,
              damagingMoves: damagingImplemented,
              damagingPartialGaps: partialDamaging.length,
              handlersRegistered: implemented.size,
            },
            unimplementedStatus,
            partialDamaging,
          },
          null,
          2
        )
      );
      return;
    }

    const statusTotal = implementedStatus + unimplementedStatus.length;
    const pct = statusTotal > 0 ? Math.round((implementedStatus / statusTotal) * 100) : 0;

    console.log('=== MOVE IMPLEMENTATION AUDIT ===\n');
    console.log(`Total moves in DB:            ${rows.length}`);
    console.log(`Registered effect handlers:   ${implemented.size}`);
    console.log('');
    console.log(`Status moves:                 ${statusTotal}`);
    console.log(`  ✅ implemented:             ${implementedStatus} (${pct}%)`);
    console.log(`  ❌ unimplemented:           ${unimplementedStatus.length}`);
    console.log('');
    console.log(`Damaging moves (auto-damage): ${damagingImplemented}`);
    console.log(`  ⚠️  described rider ignored: ${partialDamaging.length} (partial)`);
    console.log('');

    console.log(`--- UNIMPLEMENTED STATUS MOVES (${unimplementedStatus.length}) ---`);
    console.log('(these hit the "But nothing happened..." fallback)\n');
    for (const g of unimplementedStatus) {
      const effect = g.effect ? ` — ${g.effect.slice(0, 90)}${g.effect.length > 90 ? '…' : ''}` : '';
      console.log(`  ${g.name.padEnd(22)} [${g.type ?? '?'}]${effect}`);
    }

    if (SHOW_ALL) {
      console.log(`\n--- DAMAGING MOVES WITH IGNORED RIDERS (${partialDamaging.length}) ---`);
      console.log('(these deal damage, but their secondary effect is not applied)\n');
      for (const g of partialDamaging) {
        const effect = g.effect ? ` — ${g.effect.slice(0, 80)}${g.effect.length > 80 ? '…' : ''}` : '';
        console.log(`  ${g.name.padEnd(22)} [${g.category}/${g.type ?? '?'}]${effect}`);
      }
    } else if (partialDamaging.length > 0) {
      console.log(`\n(${partialDamaging.length} damaging moves have ignored riders — run with --all to list them)`);
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});
