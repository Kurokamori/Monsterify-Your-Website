import { useState, useEffect, useCallback } from 'react';
import { type EvolutionEntry } from '@services/fakemonService';
import speciesService from '@services/speciesService';
import '../../styles/admin/fakemon-evo-method-editor.css';

const EVOLUTION_METHODS = ['level', 'item', 'condition', 'trade', 'friendship', 'location', 'other'];

// ── Fakemon lookup (name/number → data) ────────────────────────────

interface FakemonLookup {
  number: number;
  name: string;
  type1?: string;
  type2?: string;
}

function useFakemonLookup(): Map<string, FakemonLookup> {
  const [map, setMap] = useState<Map<string, FakemonLookup>>(new Map());

  useEffect(() => {
    let cancelled = false;
    speciesService
      .getSpecies('fakemon', { page: 1, limit: 9999 })
      .then(res => {
        if (cancelled) return;
        const m = new Map<string, FakemonLookup>();
        for (const f of res.species) {
          const entry: FakemonLookup = {
            number: Number(f.number ?? 0),
            name: String(f.name ?? ''),
            type1: f.type1 as string | undefined,
            type2: (f.type2 as string | null | undefined) ?? undefined,
          };
          if (entry.name) m.set(entry.name.toLowerCase(), entry);
          if (entry.number) m.set(String(entry.number), entry);
        }
        setMap(m);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return map;
}

// ── Component ───────────────────────────────────────────────────────

interface Props {
  formValues: Record<string, unknown>;
  formOnChange: (key: string, value: unknown) => void;
}

export function FakemonEvolutionMethodEditor({ formValues, formOnChange }: Props) {
  const lookup = useFakemonLookup();
  const chain = (Array.isArray(formValues.evolutionLine) ? formValues.evolutionLine : []) as EvolutionEntry[];

  const evolvesFromName = String(formValues.evolvesFrom ?? '').trim();
  const evolvesToName   = String(formValues.evolvesTo   ?? '').trim();
  const currentNumber   = Number(formValues.number ?? 0);
  const currentName     = String(formValues.name ?? '').trim();
  const hasLinks = !!(evolvesFromName || evolvesToName);

  // Build the chain from evolvesFrom / current / evolvesTo.
  // Preserves existing method/detail for each entry if it was already in the chain.
  const buildChain = useCallback(() => {
    const newChain: EvolutionEntry[] = [];
    const byNumber = new Map(chain.map(e => [e.number, e]));

    // Pre-evolution
    if (evolvesFromName) {
      const opt = lookup.get(evolvesFromName.toLowerCase());
      if (opt) {
        const prev = byNumber.get(opt.number);
        newChain.push({
          number: opt.number,
          name: opt.name,
          type1: opt.type1,
          type2: opt.type2,
          evolves_from: null,
          method: prev?.method,
          method_detail: prev?.method_detail,
          level: prev?.level,
        });
      }
    }

    // Current fakemon
    if (currentNumber) {
      const prev = byNumber.get(currentNumber);
      newChain.push({
        number: currentNumber,
        name: currentName || prev?.name || '???',
        type1: String(formValues.type1 ?? '') || undefined,
        type2: String(formValues.type2 ?? '') || undefined,
        evolves_from: newChain.length > 0 ? newChain[newChain.length - 1].number : null,
        method: prev?.method,
        method_detail: prev?.method_detail,
        level: prev?.level,
      });
    }

    // Next evolution
    if (evolvesToName) {
      const opt = lookup.get(evolvesToName.toLowerCase());
      if (opt) {
        const prev = byNumber.get(opt.number);
        newChain.push({
          number: opt.number,
          name: opt.name,
          type1: opt.type1,
          type2: opt.type2,
          evolves_from: currentNumber || (newChain.length > 0 ? newChain[newChain.length - 1].number : null),
          method: prev?.method,
          method_detail: prev?.method_detail,
          level: prev?.level,
        });
      }
    }

    formOnChange('evolutionLine', newChain);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lookup, evolvesFromName, evolvesToName, currentNumber, currentName, formValues.type1, formValues.type2]);

  // Auto-sync once the lookup map is ready if the chain is empty but links exist
  useEffect(() => {
    if (chain.length === 0 && hasLinks && lookup.size > 0) {
      buildChain();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lookup.size]);

  const updateEntry = (index: number, updates: Partial<EvolutionEntry>) => {
    const updated = chain.map((e, i) => i === index ? { ...e, ...updates } : e);
    formOnChange('evolutionLine', updated);
  };

  return (
    <div className="evo-method">
      <div className="evo-method__header">
        <label className="form-label">Evolution Chain</label>
        <div className="evo-method__actions">
          {hasLinks && (
            <button type="button" className="button small" onClick={buildChain}>
              <i className="fas fa-sync-alt" /> Sync Chain
            </button>
          )}
          {chain.length > 0 && (
            <button
              type="button"
              className="button small secondary"
              onClick={() => formOnChange('evolutionLine', [])}
            >
              <i className="fas fa-times" /> Clear
            </button>
          )}
        </div>
      </div>

      {chain.length === 0 ? (
        <p className="evo-method__empty">
          {hasLinks
            ? 'Click "Sync Chain" to build from the Evolves From / To fields.'
            : 'Fill in Evolves From / Evolves To above, then sync.'}
        </p>
      ) : (
        <div className="evo-method__chain">
          {chain.map((entry, i) => {
            const isBase = i === 0;
            return (
              <div key={i} className="evo-method__step">
                {/* Method/detail block ABOVE each non-base entry */}
                {!isBase && (
                  <div className="evo-method__arrow-block">
                    <div className="evo-method__line" />
                    <div className="evo-method__method-row">
                      <select
                        className="evo-method__select"
                        value={entry.method ?? ''}
                        onChange={e => updateEntry(i, {
                          method: e.target.value || undefined,
                          level: e.target.value !== 'level' ? undefined : entry.level,
                          method_detail: e.target.value === 'level' ? undefined : entry.method_detail,
                        })}
                      >
                        <option value="">— method —</option>
                        {EVOLUTION_METHODS.map(m => (
                          <option key={m} value={m}>
                            {m.charAt(0).toUpperCase() + m.slice(1)}
                          </option>
                        ))}
                      </select>

                      {entry.method === 'level' && (
                        <input
                          type="number"
                          className="evo-method__level-input"
                          placeholder="Lv."
                          value={entry.level ?? ''}
                          onChange={e => updateEntry(i, {
                            level: e.target.value === '' ? undefined : Number(e.target.value),
                          })}
                          min={1}
                          max={100}
                        />
                      )}

                      {entry.method && entry.method !== 'level' && (
                        <input
                          type="text"
                          className="evo-method__detail-input"
                          placeholder="Detail (e.g. Fire Stone)"
                          value={entry.method_detail ?? ''}
                          onChange={e => updateEntry(i, { method_detail: e.target.value || undefined })}
                        />
                      )}
                    </div>
                    <div className="evo-method__arrow">▼</div>
                  </div>
                )}

                {/* Entry card */}
                <div className="evo-method__card">
                  <span className="evo-method__card-num">#{entry.number}</span>
                  <strong className="evo-method__card-name">{entry.name || '???'}</strong>
                  <div className="evo-method__card-types">
                    {entry.type1 && <span className="evo-method__type-tag">{entry.type1}</span>}
                    {entry.type2 && <span className="evo-method__type-tag">{entry.type2}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
