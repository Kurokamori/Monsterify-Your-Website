import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from '../../../hooks/useDebounce';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';
import speciesService from '../../../services/speciesService';
import evolutionCacheService from '../../../services/evolutionCacheService';
import api from '../../../services/api';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../../components/common/ErrorMessage';
import type {
  EvolutionSpecies,
  EvolutionNode,
  EvolutionOption,
  BidirectionalEvolution,
} from './types';

const MAX_DEPTH = 8;

const EvolutionExplorerPage = () => {
  useDocumentTitle('Evolution Explorer - Guides');

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [selectedSpecies, setSelectedSpecies] = useState<string | null>(null);
  const [evolutionChain, setEvolutionChain] = useState<BidirectionalEvolution[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedDigimon, setExpandedDigimon] = useState<Set<string>>(new Set());
  const [showSearch, setShowSearch] = useState(true);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // --- API helpers ---

  const getEvolutionOptions = async (speciesName: string): Promise<EvolutionOption[]> => {
    if (!speciesName || speciesName.trim() === '') return [];
    const trimmed = speciesName.trim();

    try {
      const cachedData = evolutionCacheService.getEvolutionData(trimmed);
      if (cachedData) return cachedData as EvolutionOption[];

      const response = await api.get(`/evolution/options/${encodeURIComponent(trimmed)}`);
      const data: EvolutionOption[] = response.data.success ? response.data.data : [];
      evolutionCacheService.setEvolutionData(trimmed, data);
      return data;
    } catch {
      return [];
    }
  };

  const getReverseEvolutionOptions = async (speciesName: string): Promise<EvolutionOption[]> => {
    if (!speciesName || speciesName.trim() === '') return [];
    const trimmed = speciesName.trim();

    try {
      const cachedData = evolutionCacheService.getReverseEvolutionData(trimmed);
      if (cachedData) return cachedData as EvolutionOption[];

      const response = await api.get(`/evolution/reverse/${encodeURIComponent(trimmed)}`);
      const data: EvolutionOption[] = response.data.success ? response.data.data : [];
      evolutionCacheService.setReverseEvolutionData(trimmed, data);
      return data;
    } catch {
      return [];
    }
  };

  const getSpeciesWithImage = async (speciesName: string): Promise<EvolutionSpecies | null> => {
    if (!speciesName || speciesName.trim() === '') return null;
    const trimmed = speciesName.trim();
    const species: EvolutionSpecies = { name: trimmed, image: null };

    try {
      const cachedImage = evolutionCacheService.getImageData(trimmed);
      if (cachedImage) {
        species.image = cachedImage;
      } else {
        const imageMap = await speciesService.getSpeciesImages([trimmed]);
        if (imageMap[trimmed]) {
          species.image = imageMap[trimmed].image_url;
          evolutionCacheService.setImageData(trimmed, imageMap[trimmed].image_url);
        } else {
          evolutionCacheService.setImageData(trimmed, '');
        }
      }
    } catch {
      evolutionCacheService.setImageData(trimmed, '');
    }

    return species;
  };

  const isSpeciesDigimon = async (speciesName: string): Promise<boolean> => {
    try {
      const evolutionOptions = await getEvolutionOptions(speciesName);
      const reverseOptions = await getReverseEvolutionOptions(speciesName);
      const allOptions = [...evolutionOptions, ...reverseOptions];
      return allOptions.some(option => option?.type === 'digimon');
    } catch {
      return false;
    }
  };

  // --- Tree building ---

  const buildEvolutionDirection = async (
    speciesName: string,
    direction: 'forward' | 'reverse',
    maxTreeDepth: number,
    visited: Set<string>,
    depth = 0
  ): Promise<EvolutionNode[]> => {
    if (depth >= maxTreeDepth || visited.has(speciesName)) return [];

    const newVisited = new Set(visited);
    newVisited.add(speciesName);

    const options = direction === 'forward'
      ? await getEvolutionOptions(speciesName)
      : await getReverseEvolutionOptions(speciesName);

    const validOptions = options.filter(
      opt => opt && typeof opt === 'object' && opt.name && opt.name.trim() !== ''
    );

    const children: EvolutionNode[] = [];
    for (const option of validOptions) {
      const optionName = option.name.trim();
      if (!newVisited.has(optionName)) {
        const speciesData = await getSpeciesWithImage(optionName);
        if (speciesData) {
          const subChildren = await buildEvolutionDirection(
            optionName, direction, maxTreeDepth, newVisited, depth + 1
          );
          children.push({ species: speciesData, children: subChildren, depth: depth + 1 });
        }
      }
    }

    return children;
  };

  const buildEvolutionChain = useCallback(async (startSpecies: string): Promise<BidirectionalEvolution[]> => {
    if (!startSpecies || startSpecies.trim() === '') return [];
    const trimmed = startSpecies.trim();

    const species = await getSpeciesWithImage(trimmed);
    if (!species) return [];

    const isDigimon = await isSpeciesDigimon(trimmed);
    const isExpanded = expandedDigimon.has(trimmed);
    const shouldLimitDepth = isDigimon && !isExpanded;
    const maxTreeDepth = shouldLimitDepth ? 1 : MAX_DEPTH;

    const forwardEvolutions = await buildEvolutionDirection(trimmed, 'forward', maxTreeDepth, new Set());
    const reverseEvolutions = await buildEvolutionDirection(trimmed, 'reverse', maxTreeDepth, new Set());

    return [{
      species,
      forwardEvolutions,
      reverseEvolutions,
      isDigimon,
      isExpanded,
      isRoot: true,
    }];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedDigimon]);

  // --- Search ---

  useEffect(() => {
    const searchSpecies = async () => {
      if (debouncedSearchTerm.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      try {
        setLoading(true);

        const cachedResults = evolutionCacheService.getSearchResults<string[]>(debouncedSearchTerm);
        if (cachedResults) {
          setSearchResults(cachedResults);
          setLoading(false);
          return;
        }

        const response = await speciesService.searchSpecies(debouncedSearchTerm);
        if (response.success) {
          const results = (response.species as string[]).slice(0, 10);
          setSearchResults(results);
          evolutionCacheService.setSearchResults(debouncedSearchTerm, results);
        }
      } catch {
        setError('Failed to search species');
      } finally {
        setLoading(false);
      }
    };

    searchSpecies();
  }, [debouncedSearchTerm]);

  // --- Handlers ---

  const handleSpeciesSelect = async (speciesName: string) => {
    setSelectedSpecies(speciesName);
    setShowSearch(false);
    setLoading(true);
    setError(null);

    try {
      const chain = await buildEvolutionChain(speciesName);
      setEvolutionChain(chain);
    } catch {
      setError('Failed to load evolution chain');
    } finally {
      setLoading(false);
    }
  };

  const handleDigimonExpand = async (speciesName: string) => {
    const newExpanded = new Set(expandedDigimon);
    if (newExpanded.has(speciesName)) {
      newExpanded.delete(speciesName);
    } else {
      newExpanded.add(speciesName);
    }
    setExpandedDigimon(newExpanded);

    if (selectedSpecies) {
      setLoading(true);
      try {
        const chain = await buildEvolutionChain(selectedSpecies);
        setEvolutionChain(chain);
      } catch {
        setError('Failed to reload evolution chain');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSpeciesClick = (speciesName: string) => {
    handleSpeciesSelect(speciesName);
  };

  const resetToSearch = () => {
    setSelectedSpecies(null);
    setEvolutionChain([]);
    setShowSearch(true);
    setSearchTerm('');
    setError(null);
  };

  // --- Rendering ---

  const renderSpeciesCard = (
    species: EvolutionSpecies,
    isTarget = false,
    isDigimon = false,
    isExpanded = false
  ) => {
    const handleClick = () => {
      if (isTarget && isDigimon) {
        handleDigimonExpand(species.name);
      } else if (!isTarget) {
        handleSpeciesClick(species.name);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        handleClick();
      }
    };

    const isInteractive = (isTarget && isDigimon) || !isTarget;

    return (
      <div
        key={species.name}
        className={`evolution-explorer__species-card ${isTarget ? 'evolution-explorer__species-card--target' : ''}`}
        onClick={handleClick}
        role={isInteractive ? 'button' : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        onKeyDown={isInteractive ? handleKeyDown : undefined}
      >
        <div className="evolution-explorer__species-image-container">
          {species.image ? (
            <img
              src={species.image}
              alt={species.name}
              className="evolution-explorer__species-image"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                if (target.nextElementSibling) {
                  (target.nextElementSibling as HTMLElement).style.display = 'flex';
                }
              }}
            />
          ) : null}
          <div
            className="evolution-explorer__species-placeholder"
            style={{ display: species.image ? 'none' : 'flex' }}
          >
            <span>No Image</span>
          </div>
        </div>
        <div className="evolution-explorer__species-name">{species.name}</div>
        {isTarget && isDigimon ? (
          <div className="evolution-explorer__click-hint">
            {isExpanded ? 'Click to show less' : 'Click to show full tree'}
          </div>
        ) : !isTarget ? (
          <div className="evolution-explorer__click-hint">Click to explore</div>
        ) : null}
      </div>
    );
  };

  const renderEvolutionTree = (evolutions: EvolutionNode[], direction: string) => {
    return evolutions.map((node, index) => (
      <div key={`${direction}-${node.species.name}-${index}`} className="evolution-explorer__column">
        <div className="evolution-explorer__level">
          {renderSpeciesCard(node.species)}
        </div>
        {node.children && node.children.length > 0 && (
          <>
            <div className="evolution-explorer__level-connector" />
            {renderEvolutionTree(node.children, direction)}
          </>
        )}
      </div>
    ));
  };

  // Flatten the full evolution tree into levels for non-digimon bottom-to-top display.
  // Level 0 = base forms, level 1 = their evolutions, etc.
  const flattenTreeToLevels = (
    species: EvolutionSpecies,
    reverseEvolutions: EvolutionNode[],
    forwardEvolutions: EvolutionNode[]
  ): EvolutionSpecies[][] => {
    // Build levels from root → forward, starting from the target species
    const addForwardLevels = (nodes: EvolutionNode[], levels: EvolutionSpecies[][], levelIndex: number) => {
      for (const node of nodes) {
        if (!levels[levelIndex]) levels[levelIndex] = [];
        levels[levelIndex].push(node.species);
        if (node.children && node.children.length > 0) {
          addForwardLevels(node.children, levels, levelIndex + 1);
        }
      }
    };

    // Reverse evolutions give us ancestors. The deepest reverse node is the base form.
    // We need to count how deep the reverse tree goes to know what level the target is at.
    const getReverseDepth = (nodes: EvolutionNode[]): number => {
      if (nodes.length === 0) return 0;
      let maxDepth = 0;
      for (const node of nodes) {
        const childDepth = node.children ? getReverseDepth(node.children) : 0;
        maxDepth = Math.max(maxDepth, 1 + childDepth);
      }
      return maxDepth;
    };

    const addReverseLevels = (nodes: EvolutionNode[], levels: EvolutionSpecies[][], levelIndex: number) => {
      for (const node of nodes) {
        if (node.children && node.children.length > 0) {
          addReverseLevels(node.children, levels, levelIndex - 1);
        }
        if (!levels[levelIndex]) levels[levelIndex] = [];
        levels[levelIndex].push(node.species);
      }
    };

    const reverseDepth = getReverseDepth(reverseEvolutions);
    const targetLevel = reverseDepth; // target sits at this level index

    const levels: EvolutionSpecies[][] = [];
    // Add reverse evolution levels (ancestors)
    if (reverseEvolutions.length > 0) {
      addReverseLevels(reverseEvolutions, levels, targetLevel - 1);
    }
    // Add target species
    if (!levels[targetLevel]) levels[targetLevel] = [];
    levels[targetLevel].push(species);
    // Add forward evolutions
    if (forwardEvolutions.length > 0) {
      addForwardLevels(forwardEvolutions, levels, targetLevel + 1);
    }

    // Filter out any empty slots
    return levels.filter(level => level && level.length > 0);
  };

  const renderBidirectionalEvolution = (data: BidirectionalEvolution) => {
    const { species, forwardEvolutions, reverseEvolutions, isDigimon, isExpanded } = data;

    // For non-digimon, render as leveled rows bottom-to-top
    if (!isDigimon) {
      const levels = flattenTreeToLevels(species, reverseEvolutions, forwardEvolutions);
      // Reverse so highest evolution is at top, base form at bottom
      const reversedLevels = [...levels].reverse();

      return (
        <div key={`bidirectional-${species.name}`} className="evolution-explorer__bidirectional">
          {reversedLevels.map((level, index) => (
            <div key={`level-${index}`}>
              {index > 0 && <div className="evolution-explorer__level-connector" />}
              <div className="evolution-explorer__children-row">
                {level.map(s => (
                  <div key={s.name}>
                    {renderSpeciesCard(
                      s,
                      s.name === species.name,
                      false,
                      false
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Digimon: keep existing bidirectional layout
    return (
      <div key={`bidirectional-${species.name}`} className="evolution-explorer__bidirectional">
        {reverseEvolutions.length > 0 && (
          <div className="evolution-explorer__section">
            <div className="evolution-explorer__section-header">
              <span className="evolution-explorer__section-label">Pre-evolutions</span>
            </div>
            <div className="evolution-explorer__children-row">
              {renderEvolutionTree(reverseEvolutions, 'reverse')}
            </div>
          </div>
        )}

        <div className="evolution-explorer__target-section">
          {renderSpeciesCard(species, true, isDigimon, isExpanded)}
        </div>

        {forwardEvolutions.length > 0 && (
          <div className="evolution-explorer__section">
            <div className="evolution-explorer__section-header">
              <span className="evolution-explorer__section-label">Evolutions</span>
            </div>
            <div className="evolution-explorer__children-row">
              {renderEvolutionTree(forwardEvolutions, 'forward')}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="evolution-explorer">
      <div className="guide-page__header">
        <h1>Evolution Explorer</h1>
        <p>
          Explore evolution trees for Digimon, Yokai, Pokemon, Nexomon, Fakemon, and Final Fantasy creatures.
          Monster Hunter creatures can be searched but do not evolve.
        </p>
      </div>

      {/* Search Section */}
      {showSearch && (
        <div className="evolution-explorer__search">
          <div className="evolution-explorer__search-input">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter a species name to explore its evolution tree..."
              className="input"
            />
          </div>

          {searchResults.length > 0 && (
            <div className="evolution-explorer__search-results">
              <h3>Search Results:</h3>
              <div className="evolution-explorer__search-results-grid">
                {searchResults.map(name => (
                  <button
                    key={name}
                    className="button secondary sm"
                    onClick={() => handleSpeciesSelect(name)}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Evolution Tree Display */}
      {!showSearch && (
        <div className="evolution-explorer__tree">
          <div className="evolution-explorer__tree-header">
            <button className="button secondary" onClick={resetToSearch}>
              &larr; Back to Search
            </button>
            <h2>Evolution tree for {selectedSpecies}</h2>
          </div>

          {loading && <LoadingSpinner message="Building evolution chain..." />}

          {error && (
            <ErrorMessage
              message={error}
              onRetry={() => selectedSpecies && handleSpeciesSelect(selectedSpecies)}
            />
          )}

          {!loading && !error && evolutionChain.length > 0 && (
            <div className="evolution-explorer__nested-container">
              <div className="evolution-explorer__nested-tree">
                {evolutionChain.map(data => renderBidirectionalEvolution(data))}
              </div>
            </div>
          )}

          {!loading && !error && evolutionChain.length === 0 && selectedSpecies && (
            <div className="evolution-explorer__no-evolutions">
              <p>{selectedSpecies} doesn&apos;t have any known evolutions or pre-evolutions.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EvolutionExplorerPage;
