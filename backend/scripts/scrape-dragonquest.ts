/**
 * Dragon Quest Monster Scraper
 * Scrapes monster data from https://www.woodus.com/den/resources/global-bestiary.php
 * and inserts into the dragonquest_monsters table.
 *
 * Usage (from the backend/ directory):
 *   npx tsx src/scripts/scrape-dragonquest.ts
 */

import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import axios from 'axios';
import { Pool } from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE_URL = 'https://www.woodus.com/den/resources';

/** All DQ monster families listed on the bestiary index page. */
const FAMILIES = [
  'Beast',
  'Demon-Humanoid',
  'Dragon',
  'Elemental',
  'Material',
  'Nature-Aquatic-Bug-Bird',
  'Slime',
  'Undead',
  'Unknown',
] as const;

const VALID_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'] as const;

/** Milliseconds to wait between HTTP requests (polite scraping). */
const REQUEST_DELAY_MS = 400;

// ─── Database ────────────────────────────────────────────────────────────────

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

async function createTable(pool: Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS dragonquest_monsters (
      id         SERIAL PRIMARY KEY,
      name       VARCHAR(255) NOT NULL,
      family     VARCHAR(255),
      subfamily  VARCHAR(255),
      image_url  TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (name, subfamily)
    );
  `);
  console.log('✓ Table dragonquest_monsters ready');
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

const httpClient = axios.create({
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml',
  },
  timeout: 20_000,
});

async function fetchHtml(url: string): Promise<string> {
  const response = await httpClient.get<string>(url, { responseType: 'text' });
  return response.data;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Image URL helpers ────────────────────────────────────────────────────────

/**
 * Given a raw image src attribute value, returns a fully-qualified absolute URL
 * with the thumbnail suffix (`-th`) removed if present.
 * Returns null if the URL does not end with a supported image extension.
 */
function sanitizeImageUrl(rawSrc: string): string | null {
  // Resolve relative paths
  let url = rawSrc.trim();
  if (url.startsWith('//')) {
    url = 'https:' + url;
  } else if (url.startsWith('/')) {
    url = 'https://www.woodus.com' + url;
  } else if (!url.startsWith('http')) {
    // Relative to the resources directory
    url = BASE_URL + '/' + url;
  }

  // Strip thumbnail suffix, e.g. "Air Rat-th.webp" → "Air Rat.webp"
  url = url.replace(/-th(\.[^./?#]+)(\?.*)?$/, '$1$2');

  // Verify extension
  const lower = (url.split('?')[0] ?? '').toLowerCase();
  const hasValidExt = VALID_EXTENSIONS.some((ext) => lower.endsWith(ext));
  if (!hasValidExt) { return null; }

  return url;
}

/**
 * Derives a monster's display name from its image URL.
 * e.g. "https://.../appearance_art/Air%20Rat.webp" → "Air Rat"
 */
function nameFromImageUrl(imageUrl: string): string {
  const decoded = decodeURIComponent(imageUrl);
  const filename = decoded.split('/').pop() ?? '';
  // Remove extension and any trailing -th
  return filename
    .replace(/\.[^.]+$/, '')
    .replace(/-th$/, '')
    .trim();
}

// ─── Scraping logic ───────────────────────────────────────────────────────────

/**
 * Fetches the family page and returns every unique subfamily name found in links
 * that contain `subfamilysearch=`.
 */
async function getSubfamiliesForFamily(family: string): Promise<string[]> {
  const url = `${BASE_URL}/global-bestiary-family-subfamily.php?famsearch=${encodeURIComponent(family)}`;
  const html = await fetchHtml(url);

  // href="global-bestiary-subfamily-result.php?subfamilysearch=Air+Rat"
  // href="...subfamilysearch=Air%20Rat"
  const pattern = /subfamilysearch=([^"&\s]+)/gi;
  const found = new Set<string>();

  for (const m of html.matchAll(pattern)) {
    const raw = m[1];
    if (!raw) { continue; }
    const decoded = decodeURIComponent(raw.replace(/\+/g, ' ')).trim();
    if (decoded) { found.add(decoded); }
  }

  return [...found];
}

type MonsterEntry = {
  name: string;
  family: string;
  subfamily: string;
  imageUrl: string | null;
};

/**
 * Fetches the subfamily result page and extracts all monster entries.
 *
 * Strategy:
 *  1. Collect every `<img>` src that contains `appearance_art` and ends with a
 *     valid image extension.
 *  2. De-duplicate: if both a thumbnail (`-th`) and a full-size URL are present
 *     for the same monster, keep only the full-size one.
 *  3. Derive the monster name from the image filename (URL-decoded, ext stripped).
 *  4. Fall back to the `alt` attribute if the filename looks wrong.
 */
async function getMonstersInSubfamily(family: string, subfamily: string): Promise<MonsterEntry[]> {
  const url = `${BASE_URL}/global-bestiary-subfamily-result.php?subfamilysearch=${encodeURIComponent(subfamily)}`;
  const html = await fetchHtml(url);

  // Collect all img tags that reference appearance_art
  const imgTagRegex = /<img[^>]+>/gi;
  const srcRegex = /src="([^"]+)"/i;
  const altRegex = /alt="([^"]*)"/i;

  // Map from "canonical key" (filename without ext and -th) → { fullSizeUrl, altText }
  const byKey = new Map<string, { url: string; alt: string; isThumb: boolean }>();

  for (const imgTag of html.matchAll(imgTagRegex)) {
    const tag = imgTag[0];
    if (!tag) { continue; }

    const srcMatch = tag.match(srcRegex);
    if (!srcMatch?.[1]) { continue; }
    const rawSrc = srcMatch[1];

    // Only care about appearance_art images
    if (!rawSrc.includes('appearance_art')) { continue; }

    // Check extension validity (before stripping -th)
    const lowerSrc = (rawSrc.split('?')[0] ?? '').toLowerCase();
    const hasExt = VALID_EXTENSIONS.some((ext) => lowerSrc.endsWith(ext) || lowerSrc.replace(/-th(\.[^.]+)$/, '$1').endsWith(ext));
    if (!hasExt) { continue; }

    const altMatch = tag.match(altRegex);
    const altText = altMatch?.[1]?.replace(/^(Monster Sprite|Sprite):\s*/i, '').trim() ?? '';

    const isThumb = /-th\.[^.]+$/.test(rawSrc);

    // Canonical key: filename without -th and without extension
    const filename = rawSrc.split('/').pop() ?? '';
    const key = decodeURIComponent(filename)
      .replace(/-th(\.[^.]+)$/, '$1')
      .replace(/\.[^.]+$/, '')
      .trim()
      .toLowerCase();

    if (!key) { continue; }

    const existing = byKey.get(key);
    // Prefer full-size over thumbnail
    if (!existing || (existing.isThumb && !isThumb)) {
      byKey.set(key, { url: rawSrc, alt: altText, isThumb });
    }
  }

  const monsters: MonsterEntry[] = [];

  for (const [, entry] of byKey) {
    const sanitized = sanitizeImageUrl(entry.url);
    if (!sanitized) { continue; }

    // Prefer alt text for the name; fall back to filename
    let name = entry.alt || nameFromImageUrl(sanitized);
    name = name.trim();
    if (!name) { continue; }

    monsters.push({ name, family, subfamily, imageUrl: sanitized });
  }

  return monsters;
}

// ─── Database insertion ───────────────────────────────────────────────────────

async function insertMonsters(pool: Pool, monsters: MonsterEntry[]): Promise<number> {
  let inserted = 0;
  for (const m of monsters) {
    const result = await pool.query(
      `
      INSERT INTO dragonquest_monsters (name, family, subfamily, image_url)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (name, subfamily) DO NOTHING
      RETURNING id
      `,
      [m.name, m.family, m.subfamily, m.imageUrl]
    );
    if ((result.rowCount ?? 0) > 0) { inserted++; }
  }
  return inserted;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const pool = createPool();

  try {
    // Verify DB connection
    await pool.query('SELECT 1');
    console.log('✓ Database connected');

    await createTable(pool);

    let totalInserted = 0;
    let totalSkipped = 0;

    for (const family of FAMILIES) {
      console.log(`\n── Family: ${family} ──`);

      let subfamilies: string[];
      try {
        subfamilies = await getSubfamiliesForFamily(family);
        await sleep(REQUEST_DELAY_MS);
      } catch (err) {
        console.error(`  ✗ Failed to fetch subfamilies for ${family}:`, err instanceof Error ? err.message : err);
        continue;
      }

      console.log(`  Found ${subfamilies.length} subfamilies`);

      for (const subfamily of subfamilies) {
        let monsters: MonsterEntry[];
        try {
          monsters = await getMonstersInSubfamily(family, subfamily);
          await sleep(REQUEST_DELAY_MS);
        } catch (err) {
          console.error(`  ✗ Failed to fetch monsters for subfamily "${subfamily}":`, err instanceof Error ? err.message : err);
          continue;
        }

        if (monsters.length === 0) {
          console.log(`  [${family}] ${subfamily}: no monsters found`);
          continue;
        }

        const inserted = await insertMonsters(pool, monsters);
        const skipped = monsters.length - inserted;
        totalInserted += inserted;
        totalSkipped += skipped;

        const names = monsters.map((m) => m.name).join(', ');
        console.log(
          `  [${family}] ${subfamily}: ${monsters.length} monster(s) → ${inserted} inserted, ${skipped} skipped | ${names}`
        );
      }
    }

    console.log(`\n✅ Done! ${totalInserted} monsters inserted, ${totalSkipped} already existed.`);

    // Final count
    const countResult = await pool.query<{ count: string }>('SELECT COUNT(*) as count FROM dragonquest_monsters');
    console.log(`📊 Total records in dragonquest_monsters: ${countResult.rows[0]?.count ?? 0}`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
