import { useState, useEffect, useMemo } from 'react';
import speciesService, {
  FRANCHISE_CONFIG,
  FRANCHISE_LIST,
  type FranchiseKey,
  type Species,
} from '../../services/speciesService';
import { SpeciesCard } from './SpeciesCard';
import { TypeBadge } from '../common/TypeBadge';

// ── Per-franchise facets ──────────────────────────────────────────────
// Each facet mirrors a real repository query field. Its `props` list the
// normalized species properties whose values it filters on, so the option
// lists are derived from the actual data rather than hard-coded guesses.
interface Facet {
  key: string;
  label: string;
  icon: string;
  props: string[];
  boolean?: boolean;
}

const RANDOM_FACETS: Partial<Record<FranchiseKey, Facet[]>> = {
  pokemon: [
    { key: 'type', label: 'Type', icon: 'fa-fire', props: ['typePrimary', 'typeSecondary'] },
    { key: 'stage', label: 'Stage', icon: 'fa-layer-group', props: ['stage'] },
    { key: 'legendary', label: 'Legendary', icon: 'fa-crown', props: ['isLegendary'], boolean: true },
    { key: 'mythical', label: 'Mythical', icon: 'fa-star', props: ['isMythical'], boolean: true },
  ],
  digimon: [
    { key: 'rank', label: 'Rank', icon: 'fa-star', props: ['rank'] },
    { key: 'attribute', label: 'Attribute', icon: 'fa-atom', props: ['attribute'] },
  ],
  nexomon: [
    { key: 'type', label: 'Type', icon: 'fa-fire', props: ['typePrimary', 'typeSecondary'] },
    { key: 'stage', label: 'Stage', icon: 'fa-layer-group', props: ['stage'] },
    { key: 'legendary', label: 'Legendary', icon: 'fa-crown', props: ['isLegendary'], boolean: true },
  ],
  yokai: [
    { key: 'tribe', label: 'Tribe', icon: 'fa-users', props: ['tribe'] },
    { key: 'rank', label: 'Rank', icon: 'fa-star', props: ['rank'] },
    { key: 'stage', label: 'Stage', icon: 'fa-layer-group', props: ['stage'] },
  ],
  monsterhunter: [
    { key: 'rank', label: 'Rank', icon: 'fa-star', props: ['rank'] },
    { key: 'element', label: 'Element', icon: 'fa-bolt', props: ['element'] },
  ],
  finalfantasy: [
    { key: 'stage', label: 'Category', icon: 'fa-layer-group', props: ['stage'] },
  ],
  dragonquest: [
    { key: 'family', label: 'Family', icon: 'fa-sitemap', props: ['family'] },
    { key: 'subfamily', label: 'Subfamily', icon: 'fa-code-branch', props: ['subfamily'] },
  ],
  fakemon: [
    { key: 'type', label: 'Type', icon: 'fa-fire', props: ['type1', 'type2', 'type3', 'type4', 'type5'] },
    { key: 'category', label: 'Category', icon: 'fa-tags', props: ['category'] },
    { key: 'attribute', label: 'Attribute', icon: 'fa-atom', props: ['attribute'] },
    { key: 'stage', label: 'Stage', icon: 'fa-layer-group', props: ['stage'] },
  ],
};

const ROLLER_TYPES = [
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison',
  'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy',
];
const ROLLER_ATTRIBUTES = ['Vaccine', 'Data', 'Virus', 'Free', 'Variable'];

// Extract a facet's comparable string values from a species object.
const facetValues = (facet: Facet, species: Species): string[] => {
  if (facet.boolean) {
    return [species[facet.props[0]] ? 'Yes' : 'No'];
  }
  return facet.props
    .map((p) => species[p])
    .filter((v) => v !== null && v !== undefined && v !== '')
    .map((v) => String(v));
};

const shuffle = <T,>(items: T[]): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

// franchise -> facetKey -> selected values
type Selections = Partial<Record<FranchiseKey, Record<string, Set<string>>>>;

interface RolledResult {
  franchise: FranchiseKey;
  species: Species;
}

export const SpeciesRandomGenerator = () => {
  const [selectedFranchises, setSelectedFranchises] = useState<Set<FranchiseKey>>(new Set(['pokemon']));
  const [expanded, setExpanded] = useState<Set<FranchiseKey>>(new Set());
  const [selections, setSelections] = useState<Selections>({});
  const [pools, setPools] = useState<Partial<Record<FranchiseKey, Species[]>>>({});
  const [loadingFranchises, setLoadingFranchises] = useState<Set<FranchiseKey>>(new Set());

  const [count, setCount] = useState(6);
  const [includeImages, setIncludeImages] = useState(true);
  const [results, setResults] = useState<RolledResult[]>([]);
  const [rolled, setRolled] = useState(false);

  // Utilities
  const [typeRollerOpen, setTypeRollerOpen] = useState(false);
  const [typeCount, setTypeCount] = useState(2);
  const [rolledTypes, setRolledTypes] = useState<string[]>([]);
  const [attributeRollerOpen, setAttributeRollerOpen] = useState(false);
  const [rolledAttribute, setRolledAttribute] = useState<string | null>(null);

  // Lazily fetch the full pool for any selected franchise we haven't cached.
  useEffect(() => {
    selectedFranchises.forEach((franchise) => {
      if (pools[franchise] || loadingFranchises.has(franchise)) return;
      setLoadingFranchises((prev) => new Set(prev).add(franchise));
      speciesService
        .getSpecies(franchise, { page: 1, limit: 2000 })
        .then((res) => setPools((prev) => ({ ...prev, [franchise]: res.species })))
        .catch(() => setPools((prev) => ({ ...prev, [franchise]: [] })))
        .finally(() =>
          setLoadingFranchises((prev) => {
            const next = new Set(prev);
            next.delete(franchise);
            return next;
          }),
        );
    });
  }, [selectedFranchises, pools, loadingFranchises]);

  const allSelected = selectedFranchises.size === FRANCHISE_LIST.length;

  const toggleAllFranchises = () => {
    setSelectedFranchises(allSelected ? new Set() : new Set(FRANCHISE_LIST));
  };

  const toggleFranchise = (franchise: FranchiseKey) => {
    setSelectedFranchises((prev) => {
      const next = new Set(prev);
      if (next.has(franchise)) next.delete(franchise);
      else next.add(franchise);
      return next;
    });
  };

  const toggleExpanded = (franchise: FranchiseKey) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(franchise)) next.delete(franchise);
      else next.add(franchise);
      return next;
    });
  };

  const toggleValue = (franchise: FranchiseKey, facetKey: string, value: string) => {
    setSelections((prev) => {
      const franchiseSel = { ...(prev[franchise] ?? {}) };
      const set = new Set(franchiseSel[facetKey] ?? []);
      if (set.has(value)) set.delete(value);
      else set.add(value);
      if (set.size === 0) delete franchiseSel[facetKey];
      else franchiseSel[facetKey] = set;
      return { ...prev, [franchise]: franchiseSel };
    });
  };

  // Distinct option values for a facet, derived from the fetched pool.
  const facetOptions = (franchise: FranchiseKey, facet: Facet): string[] => {
    const pool = pools[franchise] ?? [];
    const set = new Set<string>();
    pool.forEach((species) => facetValues(facet, species).forEach((v) => set.add(v)));
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  };

  const matchesSelections = (franchise: FranchiseKey, species: Species): boolean => {
    const franchiseSel = selections[franchise];
    if (!franchiseSel) return true;
    const facets = RANDOM_FACETS[franchise] ?? [];
    for (const facet of facets) {
      const selected = franchiseSel[facet.key];
      if (!selected || selected.size === 0) continue;
      const values = facetValues(facet, species);
      if (!values.some((v) => selected.has(v))) return false;
    }
    return true;
  };

  const matchingPool = useMemo(() => {
    const combined: RolledResult[] = [];
    selectedFranchises.forEach((franchise) => {
      const pool = pools[franchise] ?? [];
      pool.forEach((species) => {
        if (matchesSelections(franchise, species)) combined.push({ franchise, species });
      });
    });
    return combined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFranchises, pools, selections]);

  const isLoadingSelected = Array.from(selectedFranchises).some((f) => loadingFranchises.has(f));

  const handleRoll = () => {
    const wanted = Math.max(1, Math.min(count, matchingPool.length));
    setResults(shuffle(matchingPool).slice(0, wanted));
    setRolled(true);
  };

  const handleRollTypes = () => {
    const wanted = Math.max(1, Math.min(typeCount, ROLLER_TYPES.length));
    setRolledTypes(shuffle(ROLLER_TYPES).slice(0, wanted));
  };

  const handleRollAttribute = () => {
    setRolledAttribute(shuffle(ROLLER_ATTRIBUTES)[0]);
  };

  return (
    <div className="species-random">
      {/* ── Franchises ── */}
      <div className="species-random__section">
        <div className="species-random__section-head">
          <h2>Franchises</h2>
          <button className="button secondary sm" onClick={toggleAllFranchises}>
            <i className={`fas ${allSelected ? 'fa-square' : 'fa-check-double'}`} />
            {allSelected ? ' Unselect All' : ' Select All'}
          </button>
        </div>

        <div className="species-random__franchise-list">
          {FRANCHISE_LIST.map((franchise) => {
            const config = FRANCHISE_CONFIG[franchise];
            const isSelected = selectedFranchises.has(franchise);
            const facets = RANDOM_FACETS[franchise] ?? [];
            const isExpanded = expanded.has(franchise);
            const isLoading = loadingFranchises.has(franchise);

            return (
              <div
                key={franchise}
                className={`species-random__franchise${isSelected ? ' species-random__franchise--active' : ''}`}
              >
                <div className="species-random__franchise-head">
                  <label className="species-random__franchise-toggle">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleFranchise(franchise)}
                    />
                    <span>{config.name}</span>
                  </label>
                  {isSelected && facets.length > 0 && (
                    <button
                      className="species-random__expand"
                      onClick={() => toggleExpanded(franchise)}
                      aria-expanded={isExpanded}
                    >
                      <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`} /> Filters
                    </button>
                  )}
                </div>

                {isSelected && isExpanded && (
                  <div className="species-random__facets">
                    {isLoading ? (
                      <p className="species-random__hint">Loading filter options...</p>
                    ) : facets.length === 0 ? (
                      <p className="species-random__hint">No filters available for this franchise.</p>
                    ) : (
                      facets.map((facet) => {
                        const options = facetOptions(franchise, facet);
                        if (options.length === 0) return null;
                        const selected = selections[franchise]?.[facet.key];
                        return (
                          <div className="species-random__facet" key={facet.key}>
                            <div className="species-random__facet-label">
                              <i className={`fas ${facet.icon}`} /> {facet.label}
                            </div>
                            <div className="species-random__chips">
                              {options.map((opt) => {
                                const active = selected?.has(opt) ?? false;
                                return (
                                  <button
                                    key={opt}
                                    className={`species-random__chip${active ? ' species-random__chip--active' : ''}`}
                                    onClick={() => toggleValue(franchise, facet.key, opt)}
                                  >
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Generate controls ── */}
      <div className="species-random__section">
        <div className="species-random__controls">
          <div className="species-random__control">
            <label htmlFor="random-count">
              <i className="fas fa-hashtag" /> How many
            </label>
            <input
              id="random-count"
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="input"
            />
          </div>

          <label className="species-random__images-toggle">
            <input
              type="checkbox"
              checked={includeImages}
              onChange={(e) => setIncludeImages(e.target.checked)}
            />
            <i className="fas fa-image" /> Include images
          </label>

          <div className="species-random__control species-random__control--action">
            <span className="species-random__available">
              {isLoadingSelected ? 'Loading pool...' : `${matchingPool.length} match your filters`}
            </span>
            <button
              className="button"
              onClick={handleRoll}
              disabled={isLoadingSelected || matchingPool.length === 0}
            >
              <i className="fas fa-dice" /> Roll
            </button>
          </div>
        </div>
      </div>

      {/* ── Results ── */}
      {rolled && (
        <div className="species-random__results">
          <div className="species-random__section-head">
            <h2>
              Rolled <strong>{results.length}</strong> {results.length === 1 ? 'species' : 'species'}
            </h2>
          </div>

          {results.length === 0 ? (
            <p className="species-random__hint">No species matched your filters. Try loosening them.</p>
          ) : includeImages ? (
            <div className="species-database__grid">
              {results.map((result, index) => (
                <SpeciesCard
                  key={`${result.franchise}-${index}`}
                  species={result.species}
                  franchise={result.franchise}
                />
              ))}
            </div>
          ) : (
            <div className="species-random__list">
              {results.map((result, index) => {
                const config = FRANCHISE_CONFIG[result.franchise];
                return (
                  <div className="species-random__list-item" key={`${result.franchise}-${index}`}>
                    <span className="species-random__list-name">
                      {String(result.species[config.nameField] ?? 'Unknown')}
                    </span>
                    <span className="species-random__list-franchise">{config.name}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Utilities ── */}
      <div className="species-random__section species-random__utilities">
        <button
          className="species-random__util-head"
          onClick={() => setTypeRollerOpen((v) => !v)}
          aria-expanded={typeRollerOpen}
        >
          <span><i className="fas fa-dice-d20" /> Random Type Roller</span>
          <i className={`fas fa-chevron-${typeRollerOpen ? 'up' : 'down'}`} />
        </button>
        {typeRollerOpen && (
          <div className="species-random__util-body">
            <div className="species-random__control">
              <label htmlFor="type-roll-count">
                <i className="fas fa-hashtag" /> Types to roll
              </label>
              <input
                id="type-roll-count"
                type="number"
                min={1}
                max={ROLLER_TYPES.length}
                value={typeCount}
                onChange={(e) => setTypeCount(Number(e.target.value))}
                className="input"
              />
            </div>
            <button className="button secondary sm" onClick={handleRollTypes}>
              <i className="fas fa-dice" /> Roll
            </button>
            {rolledTypes.length > 0 && (
              <div className="species-random__chips">
                {rolledTypes.map((type, index) => (
                  <TypeBadge key={index} type={type} size="sm" />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="species-random__section species-random__utilities">
        <button
          className="species-random__util-head"
          onClick={() => setAttributeRollerOpen((v) => !v)}
          aria-expanded={attributeRollerOpen}
        >
          <span><i className="fas fa-atom" /> Random Attribute Roller</span>
          <i className={`fas fa-chevron-${attributeRollerOpen ? 'up' : 'down'}`} />
        </button>
        {attributeRollerOpen && (
          <div className="species-random__util-body">
            <button className="button secondary sm" onClick={handleRollAttribute}>
              <i className="fas fa-dice" /> Roll
            </button>
            {rolledAttribute && (
              <span className="species-random__attribute">{rolledAttribute}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
