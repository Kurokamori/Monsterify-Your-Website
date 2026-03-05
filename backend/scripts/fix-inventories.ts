/**
 * Fix Inventories Script
 *
 * 1. Fixes typo: 'Edenwiess' → 'Edenweiss' in all inventories
 * 2. Moves misplaced items to their correct inventory category (based on items table)
 * 3. Flags items that don't exist in the items table
 *
 * Usage (from the backend/ directory):
 *   npx tsx scripts/fix-inventories.ts
 *   npx tsx scripts/fix-inventories.ts --dry-run
 */

import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { Pool } from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const DRY_RUN = process.argv.includes('--dry-run');

const INVENTORY_CATEGORIES = [
  'items',
  'balls',
  'berries',
  'pastries',
  'evolution',
  'eggs',
  'antiques',
  'helditems',
  'seals',
  'keyitems',
] as const;

type InventoryCategory = (typeof INVENTORY_CATEGORIES)[number];

function createPool(): Pool {
  if (process.env.DATABASE_URL) {
    return new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
  }
  return new Pool({
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
}

interface InventoryRow {
  id: number;
  trainer_id: number;
  items: Record<string, number> | null;
  balls: Record<string, number> | null;
  berries: Record<string, number> | null;
  pastries: Record<string, number> | null;
  evolution: Record<string, number> | null;
  eggs: Record<string, number> | null;
  antiques: Record<string, number> | null;
  helditems: Record<string, number> | null;
  seals: Record<string, number> | null;
  keyitems: Record<string, number> | null;
}

function parseJson(val: unknown): Record<string, number> {
  if (!val) return {};
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch {
      return {};
    }
  }
  return val as Record<string, number>;
}

async function main() {
  const pool = createPool();

  console.log(DRY_RUN ? '=== DRY RUN (no changes will be saved) ===' : '=== LIVE RUN ===');
  console.log('');

  // Load all items from the items table, keyed by lowercase name → { name, category }
  const { rows: itemRows } = await pool.query<{ name: string; category: string }>(
    'SELECT name, category FROM items'
  );

  const itemLookup = new Map<string, { name: string; category: InventoryCategory }>();
  for (const item of itemRows) {
    const cat = item.category as InventoryCategory;
    if (INVENTORY_CATEGORIES.includes(cat)) {
      itemLookup.set(item.name.toLowerCase(), { name: item.name, category: cat });
    }
  }

  console.log(`Loaded ${itemLookup.size} items from the items table.`);
  console.log('');

  // Load all trainers for name lookup
  const { rows: trainerRows } = await pool.query<{ id: number; name: string }>(
    'SELECT id, name FROM trainers'
  );
  const trainerNames = new Map<number, string>();
  for (const t of trainerRows) {
    trainerNames.set(t.id, t.name);
  }

  // Load all inventories
  const { rows: inventories } = await pool.query<InventoryRow>(
    `SELECT id, trainer_id, items, balls, berries, pastries, evolution, eggs, antiques, helditems, seals, keyitems FROM trainer_inventory`
  );

  console.log(`Processing ${inventories.length} inventories...`);
  console.log('');

  let typoFixes = 0;
  let categoryMoves = 0;
  let unknownItems = 0;
  let updatedInventories = 0;

  for (const inv of inventories) {
    const trainerName = trainerNames.get(inv.trainer_id) ?? `Unknown(ID:${inv.trainer_id})`;
    let changed = false;

    // Parse all categories
    const cats: Record<InventoryCategory, Record<string, number>> = {} as any;
    for (const cat of INVENTORY_CATEGORIES) {
      cats[cat] = parseJson(inv[cat]);
    }

    // --- Step 1: Fix 'Edenwiess' typo ---
    for (const cat of INVENTORY_CATEGORIES) {
      const data = cats[cat];
      if ('Edenwiess' in data) {
        const qty = data['Edenwiess'];
        delete data['Edenwiess'];
        data['Edenweiss'] = (data['Edenweiss'] ?? 0) + qty;
        console.log(`[TYPO FIX] ${trainerName}: 'Edenwiess' → 'Edenweiss' (×${qty}) in ${cat}`);
        typoFixes++;
        changed = true;
      }
    }

    // --- Step 2: Check items are in the correct category & flag unknowns ---
    for (const cat of INVENTORY_CATEGORIES) {
      const data = cats[cat];
      for (const [itemName, qty] of Object.entries(data)) {
        if (qty <= 0) continue;

        const lookup = itemLookup.get(itemName.toLowerCase());

        if (!lookup) {
          console.log(`[UNKNOWN ITEM] ${trainerName} has "${itemName}" (×${qty}) in ${cat} — not found in items table`);
          unknownItems++;
          continue;
        }

        const correctCategory = lookup.category;

        if (correctCategory !== cat) {
          // Move to correct category
          delete data[itemName];
          cats[correctCategory][lookup.name] = (cats[correctCategory][lookup.name] ?? 0) + qty;
          console.log(
            `[CATEGORY MOVE] ${trainerName}: "${itemName}" (×${qty}) moved from ${cat} → ${correctCategory}`
          );
          categoryMoves++;
          changed = true;
        }
      }
    }

    // --- Step 3: Save if changed ---
    if (changed) {
      updatedInventories++;
      if (!DRY_RUN) {
        await pool.query(
          `UPDATE trainer_inventory
           SET items = $1, balls = $2, berries = $3, pastries = $4,
               evolution = $5, eggs = $6, antiques = $7, helditems = $8,
               seals = $9, keyitems = $10, updated_at = NOW()
           WHERE id = $11`,
          [
            JSON.stringify(cats.items),
            JSON.stringify(cats.balls),
            JSON.stringify(cats.berries),
            JSON.stringify(cats.pastries),
            JSON.stringify(cats.evolution),
            JSON.stringify(cats.eggs),
            JSON.stringify(cats.antiques),
            JSON.stringify(cats.helditems),
            JSON.stringify(cats.seals),
            JSON.stringify(cats.keyitems),
            inv.id,
          ]
        );
      }
    }
  }

  console.log('');
  console.log('=== SUMMARY ===');
  console.log(`Typo fixes (Edenwiess → Edenweiss): ${typoFixes}`);
  console.log(`Category moves: ${categoryMoves}`);
  console.log(`Unknown items flagged: ${unknownItems}`);
  console.log(`Inventories updated: ${updatedInventories}`);
  if (DRY_RUN) {
    console.log('');
    console.log('This was a dry run. Run without --dry-run to apply changes.');
  }

  await pool.end();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
