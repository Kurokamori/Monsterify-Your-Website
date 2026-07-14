/**
 * Palworld Pals Scraper
 *
 * Two modes, both safe to re-run:
 *
 *   Import (default) — scrapes every Pal from the Palpedia index and inserts any
 *   that are not already present in the `pals_monsters` table. Existing Pals are
 *   never modified, so this is safe to repeat whenever Palpedia adds new Pals.
 *
 *   Update images (`--update-images`) — re-points every stored Pal at the best
 *   image available: our own self-hosted artwork when it exists, and the Palpedia
 *   CDN image otherwise. Newly imported Pals start on the Palpedia fallback; once
 *   their real artwork is uploaded, this promotes them to the self-hosted URL.
 *
 * Usage (from the backend/ directory):
 *   npx tsx scripts/scrape-pals.ts                            # import missing Pals
 *   npx tsx scripts/scrape-pals.ts --dry-run                  # report what would be imported
 *   npx tsx scripts/scrape-pals.ts --update-images            # refresh stored images
 *   npx tsx scripts/scrape-pals.ts --update-images --dry-run  # report image changes only
 *
 * or via the package script:
 *   npm run scrape:pals -- --update-images --dry-run
 */

import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function runImport(dryRun: boolean): Promise<void> {
  const { importPalsFromWiki } = await import('../src/services/pals-import.service');

  const summary = await importPalsFromWiki({
    dryRun,
    log: (message) => console.log(message),
  });

  console.log('\n──────────── Summary ────────────');
  console.log(`Source:         ${summary.source}`);
  console.log(`Mode:           ${summary.dryRun ? 'DRY RUN (no writes)' : 'LIVE'}`);
  console.log(`Scraped:        ${summary.scraped}`);
  console.log(`Already stored: ${summary.existing}`);
  console.log(`${summary.dryRun ? 'Would import' : 'Imported'}:   ${summary.added.length}`);

  if (summary.added.length > 0) {
    console.log(`\n${summary.dryRun ? 'Would import' : 'Imported'} Pals:`);
    for (const pal of summary.added) {
      const num = pal.number ? `#${pal.number} ` : '';
      console.log(`  • ${num}${pal.name} — ${pal.imageUrl ?? '(no image)'}`);
    }
  }

  if (summary.missingImages.length > 0) {
    console.log(`\n⚠ ${summary.missingImages.length} new Pal(s) had no resolvable image:`);
    console.log(`  ${summary.missingImages.join(', ')}`);
  }

  if (summary.failed.length > 0) {
    console.log(`\n✗ ${summary.failed.length} insert(s) failed:`);
    for (const failure of summary.failed) {
      console.log(`  • ${failure.name}: ${failure.error}`);
    }
  }
}

async function runImageRefresh(dryRun: boolean): Promise<void> {
  const { refreshPalImages } = await import('../src/services/pals-image-refresh.service');

  const summary = await refreshPalImages({
    dryRun,
    log: (message) => console.log(message),
  });

  const promoted = summary.updated.filter((change) => change.source === 'self-hosted');
  const fallbacks = summary.updated.filter((change) => change.source === 'palpedia');

  console.log('\n──────────── Summary ────────────');
  console.log(`Fallback source: ${summary.source}`);
  console.log(`Mode:            ${summary.dryRun ? 'DRY RUN (no writes)' : 'LIVE'}`);
  console.log(`Checked:         ${summary.checked}`);
  console.log(`Already current: ${summary.unchanged}`);
  console.log(`${summary.dryRun ? 'Would update' : 'Updated'}:    ${summary.updated.length}`);

  if (promoted.length > 0) {
    console.log(`\n↑ ${promoted.length} Pal(s) promoted to self-hosted artwork:`);
    for (const change of promoted) {
      console.log(`  • ${change.name}`);
      console.log(`      from ${change.from ?? '(no image)'}`);
      console.log(`      to   ${change.to}`);
    }
  }

  if (fallbacks.length > 0) {
    console.log(`\n· ${fallbacks.length} Pal(s) moved to the Palpedia fallback image:`);
    for (const change of fallbacks) {
      console.log(`  • ${change.name}`);
      console.log(`      from ${change.from ?? '(no image)'}`);
      console.log(`      to   ${change.to}`);
    }
  }

  if (summary.unresolved.length > 0) {
    console.log(`\n⚠ ${summary.unresolved.length} Pal(s) had no image from any source (left as-is):`);
    console.log(`  ${summary.unresolved.join(', ')}`);
  }

  if (summary.failed.length > 0) {
    console.log(`\n✗ ${summary.failed.length} update(s) failed:`);
    for (const failure of summary.failed) {
      console.log(`  • ${failure.name}: ${failure.error}`);
    }
  }
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');
  const updateImages = process.argv.includes('--update-images');

  const { db } = await import('../src/database/index');

  try {
    await db.query('SELECT 1');
    console.log('✓ Database connected');

    if (updateImages) {
      await runImageRefresh(dryRun);
    } else {
      await runImport(dryRun);
    }

    const countResult = await db.query<{ count: string }>(
      'SELECT COUNT(*) AS count FROM pals_monsters'
    );
    console.log(`\n📊 Total records in pals_monsters: ${countResult.rows[0]?.count ?? 0}`);
    console.log('✅ Done.');
  } finally {
    await db.close();
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
