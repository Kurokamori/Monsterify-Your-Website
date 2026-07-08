import { useState, useMemo } from 'react';
import type { TrainerMonster } from '@services/trainerService';
import { MONSTER_TYPES } from '@utils/staticValues';
import { monsterHasImage } from './battleMonsterUtils';

const PAGE_SIZE = 24;

const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const img = e.target as HTMLImageElement;
  img.onerror = null;
  img.src = '/images/default_mon.png';
};

interface MonsterPickerProps {
  monsters: TrainerMonster[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  maxSelection?: number;
  /** If provided, monsters failing the predicate render disabled. */
  isEligible?: (m: TrainerMonster) => boolean;
}

/**
 * Reusable monster selection grid with name search, species/type filters and
 * pagination. Monsters with no image at all are hidden so they don't crowd the
 * grid; battle-ineligible monsters (per `isEligible`) are shown but disabled.
 */
export function MonsterPicker({
  monsters,
  selectedIds,
  onToggle,
  maxSelection = 6,
  isEligible,
}: MonsterPickerProps) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(0);

  // Only monsters that actually have an image.
  const withImages = useMemo(() => monsters.filter(monsterHasImage), [monsters]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return withImages.filter(m => {
      // Search matches the name or any of the monster's species.
      if (q) {
        const haystack = [m.name, m.species1, m.species2, m.species3]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (typeFilter && ![m.type1, m.type2, m.type3, m.type4, m.type5].includes(typeFilter)) return false;
      return true;
    });
  }, [withImages, search, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const clampedPage = Math.min(page, totalPages - 1);
  const pageItems = filtered.slice(clampedPage * PAGE_SIZE, clampedPage * PAGE_SIZE + PAGE_SIZE);

  const resetPage = () => setPage(0);
  const selectionFull = selectedIds.length >= maxSelection;

  return (
    <div className="monster-picker">
      <div className="monster-picker__controls">
        <div className="monster-picker__search">
          <i className="fas fa-search"></i>
          <input
            type="text"
            value={search}
            placeholder="Search by name or species..."
            onChange={(e) => { setSearch(e.target.value); resetPage(); }}
          />
          {search && (
            <button type="button" className="monster-picker__clear" onClick={() => { setSearch(''); resetPage(); }} title="Clear search">
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
        <select
          className="monster-picker__filter"
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); resetPage(); }}
        >
          <option value="">All types</option>
          {MONSTER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="state-container sm">
          <i className="fas fa-search"></i>
          <p>{withImages.length === 0 ? 'No monsters with images to pick from.' : 'No monsters match your filters.'}</p>
        </div>
      ) : (
        <>
          <div className="team-pick-modal__grid">
            {pageItems.map(m => {
              const selected = selectedIds.includes(m.id);
              const order = selectedIds.indexOf(m.id);
              const eligible = isEligible ? isEligible(m) : true;
              const disabled = !eligible || (!selected && selectionFull);
              return (
                <button
                  key={m.id}
                  type="button"
                  className={`team-pick-modal__monster ${selected ? 'selected' : ''} ${eligible ? '' : 'team-pick-modal__monster--ineligible'}`}
                  onClick={() => { if (eligible) onToggle(m.id); }}
                  disabled={disabled}
                  title={eligible ? undefined : `${m.name} needs a main reference image before it can battle`}
                >
                  {selected && <span className="team-pick-modal__order">{order + 1}</span>}
                  {!eligible && (
                    <span className="team-pick-modal__no-ref" title="No main reference image">
                      <i className="fas fa-image"></i>
                    </span>
                  )}
                  <img
                    src={m.img_link || (m.back_sprite as string | undefined) || (m.main_ref as string | undefined) || '/images/default_mon.png'}
                    alt={m.name}
                    onError={handleImgError}
                  />
                  <span className="team-pick-modal__name">{m.name}</span>
                  <span className="team-pick-modal__level">Lv. {m.level ?? '?'}</span>
                </button>
              );
            })}
          </div>

          <div className="monster-picker__pagination">
            <button
              type="button"
              className="button secondary sm"
              disabled={clampedPage === 0}
              onClick={() => setPage(clampedPage - 1)}
            >
              <i className="fas fa-chevron-left"></i> Prev
            </button>
            <span className="monster-picker__page-info">
              Page {clampedPage + 1} / {totalPages}
              <span className="monster-picker__count"> · {filtered.length} monster{filtered.length === 1 ? '' : 's'}</span>
            </span>
            <button
              type="button"
              className="button secondary sm"
              disabled={clampedPage >= totalPages - 1}
              onClick={() => setPage(clampedPage + 1)}
            >
              Next <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
