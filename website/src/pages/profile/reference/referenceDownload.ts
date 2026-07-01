import type { SpeciesImageMap } from '../../../services/speciesService';
import type { TrainerWithMonsters, UnreferencedMonster } from './types';
import { getMonsterSpeciesInfo, getMonsterTypes } from './types';

export interface ReferenceDownloadOptions {
  trainers: TrainerWithMonsters[];
  speciesImages: SpeciesImageMap;
  includeImages: boolean;
}

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatSpecies = (monster: UnreferencedMonster): string =>
  [monster.species1, monster.species2, monster.species3]
    .filter((s): s is string => Boolean(s))
    .join(', ');

const buildImagesCell = (
  monster: UnreferencedMonster,
  speciesImages: SpeciesImageMap,
): string => {
  const speciesInfo = getMonsterSpeciesInfo(monster, speciesImages);
  const images = speciesInfo.filter((s) => Boolean(s.image));

  if (images.length === 0) {
    return '<span class="ref-dl__no-image">No reference image</span>';
  }

  const items = images
    .map(
      (species) =>
        `<figure class="ref-dl__figure">` +
        `<img class="ref-dl__img" src="${escapeHtml(species.image!)}" alt="${escapeHtml(species.name)}" loading="lazy" />` +
        `<figcaption class="ref-dl__caption">${escapeHtml(species.name)}</figcaption>` +
        `</figure>`,
    )
    .join('');

  return `<div class="ref-dl__images">${items}</div>`;
};

const buildMonsterRow = (
  monster: UnreferencedMonster,
  speciesImages: SpeciesImageMap,
  includeImages: boolean,
): string => {
  const types = getMonsterTypes(monster).join(', ') || '&mdash;';
  const attribute = monster.attribute ? escapeHtml(monster.attribute) : '&mdash;';
  const species = formatSpecies(monster) || '&mdash;';

  const cells = [
    `<td class="ref-dl__cell--name">${escapeHtml(monster.name)}</td>`,
    `<td>${escapeHtml(species)}</td>`,
    `<td>${escapeHtml(types)}</td>`,
    `<td>${attribute}</td>`,
  ];

  if (includeImages) {
    cells.push(`<td class="ref-dl__cell--images">${buildImagesCell(monster, speciesImages)}</td>`);
  }

  return `<tr>${cells.join('')}</tr>`;
};

const buildTrainerSection = (
  trainer: TrainerWithMonsters,
  speciesImages: SpeciesImageMap,
  includeImages: boolean,
): string => {
  const headerCells = ['Name', 'Species', 'Types', 'Attribute'];
  if (includeImages) headerCells.push('Reference Images');

  const rows = trainer.monsters
    .map((monster) => buildMonsterRow(monster, speciesImages, includeImages))
    .join('');

  return (
    `<section class="ref-dl__section">` +
    `<h2 class="ref-dl__trainer">${escapeHtml(trainer.name)}` +
    `<span class="ref-dl__trainer-count">${trainer.monsters.length} to reference</span></h2>` +
    `<table class="ref-dl__table">` +
    `<thead><tr>${headerCells.map((h) => `<th>${h}</th>`).join('')}</tr></thead>` +
    `<tbody>${rows}</tbody>` +
    `</table>` +
    `</section>`
  );
};

const DOCUMENT_STYLES = `
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    margin: 0;
    padding: 32px;
    background: #f5f5f7;
    color: #1a1a1a;
  }
  .ref-dl__header { margin-bottom: 24px; }
  .ref-dl__title { margin: 0 0 4px; font-size: 24px; color: #4a2c8f; }
  .ref-dl__meta { margin: 0; font-size: 13px; color: #666; }
  .ref-dl__section {
    margin-bottom: 32px;
    background: #fff;
    border-radius: 10px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
    overflow: hidden;
  }
  .ref-dl__trainer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin: 0;
    padding: 14px 18px;
    font-size: 18px;
    color: #fff;
    background: #4a2c8f;
  }
  .ref-dl__trainer-count {
    font-size: 12px;
    font-weight: 600;
    padding: 3px 10px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.2);
  }
  .ref-dl__table { width: 100%; border-collapse: collapse; }
  .ref-dl__table th {
    text-align: left;
    padding: 10px 14px;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #666;
    background: #f0eef7;
    border-bottom: 2px solid #e0dced;
  }
  .ref-dl__table td {
    padding: 10px 14px;
    font-size: 14px;
    border-bottom: 1px solid #eee;
    vertical-align: top;
  }
  .ref-dl__cell--name { font-weight: 600; }
  .ref-dl__cell--images { width: 40%; }
  .ref-dl__images { display: flex; flex-wrap: wrap; gap: 10px; }
  .ref-dl__figure { margin: 0; text-align: center; }
  .ref-dl__img {
    width: 96px;
    height: 96px;
    object-fit: contain;
    border-radius: 6px;
    background: #f5f5f7;
    border: 1px solid #e5e5ea;
  }
  .ref-dl__caption { font-size: 11px; color: #555; margin-top: 2px; }
  .ref-dl__no-image { font-size: 12px; color: #999; font-style: italic; }
  @media print {
    body { background: #fff; padding: 0; }
    .ref-dl__section { box-shadow: none; break-inside: avoid; }
    .ref-dl__trainer { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
`;

const buildDocument = (options: ReferenceDownloadOptions, generatedOn: string): string => {
  const { trainers, speciesImages, includeImages } = options;

  const totalMonsters = trainers.reduce((sum, t) => sum + t.monsters.length, 0);
  const sections = trainers
    .map((trainer) => buildTrainerSection(trainer, speciesImages, includeImages))
    .join('');

  return (
    `<!DOCTYPE html>` +
    `<html lang="en">` +
    `<head>` +
    `<meta charset="utf-8" />` +
    `<meta name="viewport" content="width=device-width, initial-scale=1" />` +
    `<title>Reference To-Do List</title>` +
    `<style>${DOCUMENT_STYLES}</style>` +
    `</head>` +
    `<body>` +
    `<header class="ref-dl__header">` +
    `<h1 class="ref-dl__title">Reference To-Do List</h1>` +
    `<p class="ref-dl__meta">${totalMonsters} monster${totalMonsters === 1 ? '' : 's'} across ` +
    `${trainers.length} trainer${trainers.length === 1 ? '' : 's'} &middot; Generated ${escapeHtml(generatedOn)}</p>` +
    `</header>` +
    sections +
    `</body>` +
    `</html>`
  );
};

const buildFilename = (trainers: TrainerWithMonsters[], date: Date): string => {
  const stamp = date.toISOString().slice(0, 10);
  const base =
    trainers.length === 1
      ? trainers[0].name.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'trainer'
      : 'reference-todo';
  return `${base}-references-${stamp}.html`;
};

/**
 * Builds a self-contained HTML reference sheet for the given trainers and
 * triggers a browser download.
 */
export const downloadReferenceSheet = (options: ReferenceDownloadOptions): void => {
  const now = new Date();
  const generatedOn = now.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = buildDocument(options, generatedOn);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = buildFilename(options.trainers, now);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};
