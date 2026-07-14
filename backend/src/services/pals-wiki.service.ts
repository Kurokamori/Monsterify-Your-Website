/**
 * Palworld Pals scraper.
 *
 * Pulls the authoritative list of Pals from the Palpedia index at
 * https://palpedia.com/pals and returns each Pal's display name, Paldeck number
 * and a fully-qualified, extension-terminated image URL.
 *
 * Palpedia is an Inertia.js application: the server renders the complete Pal
 * index as a JSON payload inside a `<script data-page="app" type="application/json">`
 * element in the page shell, which the client then hydrates. Reading that payload
 * gives us the exact data the site itself renders, so there is no HTML table
 * markup to parse and no risk of element/work-suitability icons leaking in as
 * false positives.
 *
 * This module is intentionally free of any database dependency so it can be
 * reused both by the admin import endpoint and by the standalone CLI scraper
 * (`backend/scripts/scrape-pals.ts`).
 */

import axios from 'axios';

/** Base host of the Palpedia site. */
const SITE_HOST = 'https://palpedia.com';

/** Page holding the in-game index of every obtainable Pal (base species and subspecies). */
export const PALS_WIKI_SOURCE = `${SITE_HOST}/pals`;

/** Path template for a Pal's artwork, relative to the asset host. */
const IMAGE_PATH_PREFIX = '/img/pals';

/** Extension every Pal image on Palpedia is served with. */
const IMAGE_EXTENSION = '.webp';

const httpClient = axios.create({
  headers: {
    'User-Agent':
      'DuskAndDawnBot/1.0 (Palworld species importer; contact: admin@duskanddawn) axios',
    Accept: 'text/html,application/json',
  },
  timeout: 20_000,
});

/** A single Pal parsed from Palpedia, ready to be persisted. */
export interface WikiPalEntry {
  /** Display name, e.g. "Lamball" or "Frostallion Noct". */
  name: string;
  /** Palpedia slug, e.g. "frostallion-noct". Also the key our own artwork is filed under. */
  slug: string;
  /** Fully-qualified image URL ending in a valid extension, or null if none could be built. */
  imageUrl: string | null;
  /** Paldeck number as shown on the site, e.g. "001" or "200B"; used for ordering/logging. */
  number: string | null;
}

/** Optional logger so callers (CLI vs endpoint) can route progress output. */
export type ProgressLogger = (message: string) => void;

/** Shape of a single Pal inside the Inertia page payload. */
interface PalpediaPal {
  name?: unknown;
  slug?: unknown;
  paldex_number?: unknown;
}

/** The subset of the Inertia page payload this module relies on. */
interface PalpediaPageProps {
  props?: {
    pals?: unknown;
    cdn?: { url?: unknown };
  };
}

/**
 * Builds a Pal's full-size image URL from its Palpedia slug.
 *
 * Palpedia serves every Pal's artwork at `<host>/img/pals/<slug>.webp`, where the
 * host is its CDN when one is advertised in the page payload and the site itself
 * otherwise. Returns null for a blank or unusable slug.
 */
export function buildPalImageUrl(slug: string, assetHost: string = SITE_HOST): string | null {
  const cleanSlug = slug.trim().toLowerCase();
  if (!cleanSlug || !/^[a-z0-9][a-z0-9-]*$/.test(cleanSlug)) {
    return null;
  }

  const host = assetHost.trim().replace(/\/+$/, '') || SITE_HOST;
  return `${host}${IMAGE_PATH_PREFIX}/${cleanSlug}${IMAGE_EXTENSION}`;
}

/**
 * Extracts the Inertia page payload embedded in the rendered HTML shell.
 */
function extractPagePayload(html: string): PalpediaPageProps {
  const match = html.match(
    /<script[^>]*\bdata-page="app"[^>]*\btype="application\/json"[^>]*>([\s\S]*?)<\/script>/i
  );
  const json = match?.[1]?.trim();
  if (!json) {
    throw new Error(`No Inertia page payload found at ${PALS_WIKI_SOURCE}`);
  }

  try {
    return JSON.parse(json) as PalpediaPageProps;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse the Palpedia page payload: ${message}`);
  }
}

/**
 * Resolves the host Palpedia serves its images from, preferring the CDN it
 * advertises in the page payload and falling back to the site itself.
 */
function resolveAssetHost(payload: PalpediaPageProps): string {
  const cdnUrl = payload.props?.cdn?.url;
  return typeof cdnUrl === 'string' && cdnUrl.startsWith('http') ? cdnUrl : SITE_HOST;
}

/**
 * Converts one raw Pal from the payload into an entry, or null when the record
 * lacks the name/slug this importer needs.
 */
function toPalEntry(raw: PalpediaPal, assetHost: string): WikiPalEntry | null {
  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  const slug = typeof raw.slug === 'string' ? raw.slug.trim() : '';
  if (!name || !slug) {
    return null;
  }

  const rawNumber = raw.paldex_number;
  const number =
    typeof rawNumber === 'string' && rawNumber.trim()
      ? rawNumber.trim()
      : typeof rawNumber === 'number'
        ? String(rawNumber)
        : null;

  return { name, slug: slug.toLowerCase(), imageUrl: buildPalImageUrl(slug, assetHost), number };
}

/**
 * Orders Pals by Paldeck number, keeping subspecies (e.g. "200B") directly after
 * the base form they share a number with. Unnumbered Pals sort last, by name.
 */
function comparePaldexNumbers(a: WikiPalEntry, b: WikiPalEntry): number {
  const numericA = a.number ? parseInt(a.number, 10) : Number.NaN;
  const numericB = b.number ? parseInt(b.number, 10) : Number.NaN;
  const orderA = Number.isNaN(numericA) ? Number.MAX_SAFE_INTEGER : numericA;
  const orderB = Number.isNaN(numericB) ? Number.MAX_SAFE_INTEGER : numericB;

  if (orderA !== orderB) {
    return orderA - orderB;
  }

  const suffixA = a.number?.replace(/^\d+/, '') ?? '';
  const suffixB = b.number?.replace(/^\d+/, '') ?? '';
  if (suffixA !== suffixB) {
    return suffixA.localeCompare(suffixB);
  }

  return a.name.localeCompare(b.name);
}

/** Concurrent image checks. Kept low: the asset CDN throttles aggressive fan-out. */
const VERIFY_CONCURRENCY = 4;

/** Attempts per image before it is treated as unresolvable. */
const VERIFY_ATTEMPTS = 3;

/** Backoff between retries of a failed image check. */
const VERIFY_RETRY_DELAY_MS = 500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Confirms a Pal image URL actually resolves, so a Pal is never stored with a
 * broken image if Palpedia ever deviates from its slug-based naming.
 *
 * A transport failure (throttling, reset connection) is retried with backoff; a
 * definitive non-2xx response is not, since retrying cannot change it. Returns
 * the URL when it resolves and null when it does not, letting the caller degrade
 * to "no image" rather than aborting the whole import.
 */
export async function verifyPalImage(imageUrl: string): Promise<string | null> {
  for (let attempt = 1; attempt <= VERIFY_ATTEMPTS; attempt += 1) {
    try {
      const response = await httpClient.head(imageUrl, { validateStatus: () => true });
      if (response.status >= 200 && response.status < 300) {
        return imageUrl;
      }
      if (response.status < 500 && response.status !== 429) {
        return null;
      }
    } catch {
      // Transport-level failure — fall through to the retry below.
    }

    if (attempt < VERIFY_ATTEMPTS) {
      await sleep(VERIFY_RETRY_DELAY_MS * attempt);
    }
  }

  return null;
}

/**
 * Verifies each entry's image URL, returning copies whose `imageUrl` is null when
 * the artwork could not be resolved.
 *
 * Checks run through a small worker pool rather than all at once: the asset CDN
 * rejects large concurrent bursts, which would otherwise be misread as a wave of
 * missing images.
 */
export async function verifyPalImages(
  entries: WikiPalEntry[],
  log: ProgressLogger = () => {}
): Promise<WikiPalEntry[]> {
  const verified: WikiPalEntry[] = [...entries];
  let cursor = 0;

  async function worker(): Promise<void> {
    while (cursor < verified.length) {
      const index = cursor;
      cursor += 1;

      const entry = verified[index];
      if (!entry?.imageUrl) {
        continue;
      }

      const resolved = await verifyPalImage(entry.imageUrl);
      if (!resolved) {
        log(`  ? ${entry.name}: image did not resolve (${entry.imageUrl}) — importing without one.`);
      }
      verified[index] = { ...entry, imageUrl: resolved };
    }
  }

  const workers = Array.from({ length: Math.min(VERIFY_CONCURRENCY, verified.length) }, () =>
    worker()
  );
  await Promise.all(workers);

  return verified;
}

/**
 * Scrapes every Pal listed in the Palpedia index.
 *
 * Returns de-duplicated entries ordered by Paldeck number. Each entry carries an
 * extension-terminated image URL (or null when no usable slug was present).
 */
export async function fetchPalsFromWiki(log: ProgressLogger = () => {}): Promise<WikiPalEntry[]> {
  log(`Fetching Pal list from ${PALS_WIKI_SOURCE} ...`);

  const response = await httpClient.get<string>(PALS_WIKI_SOURCE, { responseType: 'text' });
  const payload = extractPagePayload(response.data);

  const rawPals = payload.props?.pals;
  if (!Array.isArray(rawPals)) {
    throw new Error(`Palpedia page payload contained no Pal list at ${PALS_WIKI_SOURCE}`);
  }

  const assetHost = resolveAssetHost(payload);

  const byKey = new Map<string, WikiPalEntry>();
  for (const raw of rawPals) {
    const entry = toPalEntry((raw ?? {}) as PalpediaPal, assetHost);
    if (!entry) {
      continue;
    }

    const key = entry.name.toLowerCase();
    const existing = byKey.get(key);
    if (!existing || (!existing.imageUrl && entry.imageUrl)) {
      byKey.set(key, entry);
    }
  }

  const entries = [...byKey.values()].sort(comparePaldexNumbers);

  const withoutImages = entries.filter((entry) => !entry.imageUrl).length;
  log(`Parsed ${entries.length} Pals (${withoutImages} without a resolvable image).`);

  return entries;
}
