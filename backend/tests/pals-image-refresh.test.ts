import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  planPalImageUpdates,
  type StoredPalImage,
} from '../src/services/pals-image-refresh.service';
import type { WikiPalEntry } from '../src/services/pals-wiki.service';

const SELF_HOSTED_BASE = 'https://duskanddawn.net/api/species-images/pals';
const PALPEDIA_BASE = 'https://palpedia-543f.kxcdn.com/img/pals';

function makeEntry(name: string, slug: string): WikiPalEntry {
  return { name, slug, imageUrl: `${PALPEDIA_BASE}/${slug}.webp`, number: '001' };
}

function makeStored(id: number, name: string, imageUrl: string | null): StoredPalImage {
  return { id, name, imageUrl };
}

describe('planPalImageUpdates', () => {
  test('promotes a Pal from the Palpedia fallback once we host its artwork', () => {
    const stored = [makeStored(1, 'Astralym', `${PALPEDIA_BASE}/astralym.webp`)];
    const scraped = [makeEntry('Astralym', 'astralym')];
    const selfHosted = new Map([['astralym', `${SELF_HOSTED_BASE}/astralym.png`]]);

    const plan = planPalImageUpdates(stored, scraped, selfHosted);

    assert.equal(plan.changes.length, 1);
    assert.deepEqual(plan.changes[0], {
      id: 1,
      name: 'Astralym',
      from: `${PALPEDIA_BASE}/astralym.webp`,
      to: `${SELF_HOSTED_BASE}/astralym.png`,
      source: 'self-hosted',
    });
    assert.equal(plan.unchanged, 0);
  });

  test('leaves a Pal already on its self-hosted artwork untouched', () => {
    const stored = [makeStored(1, 'Cattiva', `${SELF_HOSTED_BASE}/cattiva.png`)];
    const scraped = [makeEntry('Cattiva', 'cattiva')];
    const selfHosted = new Map([['cattiva', `${SELF_HOSTED_BASE}/cattiva.png`]]);

    const plan = planPalImageUpdates(stored, scraped, selfHosted);

    assert.equal(plan.changes.length, 0);
    assert.equal(plan.unchanged, 1);
  });

  test('falls back to the Palpedia image when we host no artwork', () => {
    const stored = [makeStored(7, 'Panthalus', null)];
    const scraped = [makeEntry('Panthalus', 'panthalus')];

    const plan = planPalImageUpdates(stored, scraped, new Map());

    assert.equal(plan.changes.length, 1);
    assert.equal(plan.changes[0]?.to, `${PALPEDIA_BASE}/panthalus.webp`);
    assert.equal(plan.changes[0]?.source, 'palpedia');
  });

  test('repairs a stale image URL from a retired source', () => {
    const stored = [
      makeStored(9, 'Hartalis', 'https://palworld.wiki.gg/images/Hartalis_icon.png'),
    ];
    const scraped = [makeEntry('Hartalis', 'hartalis')];

    const plan = planPalImageUpdates(stored, scraped, new Map());

    assert.equal(plan.changes.length, 1);
    assert.equal(plan.changes[0]?.to, `${PALPEDIA_BASE}/hartalis.webp`);
  });

  test('prefers self-hosted artwork over the Palpedia image for a brand new Pal', () => {
    const stored = [makeStored(3, 'Frostallion Noct', null)];
    const scraped = [makeEntry('Frostallion Noct', 'frostallion-noct')];
    const selfHosted = new Map([
      ['frostallion-noct', `${SELF_HOSTED_BASE}/frostallion-noct.png`],
    ]);

    const plan = planPalImageUpdates(stored, scraped, selfHosted);

    assert.equal(plan.changes[0]?.to, `${SELF_HOSTED_BASE}/frostallion-noct.png`);
    assert.equal(plan.changes[0]?.source, 'self-hosted');
  });

  test('matches artwork by slugified name for a Pal absent from Palpedia', () => {
    const stored = [makeStored(4, 'Jetragon Terra', null)];
    const selfHosted = new Map([['jetragon-terra', `${SELF_HOSTED_BASE}/jetragon-terra.png`]]);

    const plan = planPalImageUpdates(stored, [], selfHosted);

    assert.equal(plan.changes[0]?.to, `${SELF_HOSTED_BASE}/jetragon-terra.png`);
    assert.equal(plan.unresolved.length, 0);
  });

  test('never clears an image when no source has one', () => {
    const stored = [makeStored(5, 'Mystery Pal', 'https://example.com/legacy.png')];

    const plan = planPalImageUpdates(stored, [], new Map());

    assert.equal(plan.changes.length, 0);
    assert.deepEqual(plan.unresolved, ['Mystery Pal']);
  });
});
