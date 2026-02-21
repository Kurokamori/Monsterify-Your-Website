import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';
import abilityService from '../../../services/abilityService';
import type { Ability } from '../../../services/abilityService';
import { TypeBadge } from '../../../components/common/TypeBadge';
import { Pagination } from '../../../components/common/Pagination';

const ALL_TYPES = [
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
  'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
  'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy',
];

const AbilityDatabasePage = () => {
  useDocumentTitle('Ability Database - Guides');

  // Abilities data
  const [abilities, setAbilities] = useState<Ability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [monsterSearch, setMonsterSearch] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [typeLogic, setTypeLogic] = useState<'OR' | 'AND'>('OR');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 24;

  // Sorting
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Expanded ability
  const [expandedAbility, setExpandedAbility] = useState<string | null>(null);

  // Fetch abilities with current filters
  const fetchAbilities = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await abilityService.getAbilities({
        search: searchTerm,
        monsterSearch,
        types: selectedTypes,
        typeLogic,
        page,
        limit,
        sortBy,
        sortOrder,
      });

      setAbilities(result.abilities);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch {
      setError('Failed to load abilities. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, monsterSearch, selectedTypes, typeLogic, page, limit, sortBy, sortOrder]);

  // Debounced fetch when filters change
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchAbilities();
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [fetchAbilities]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, monsterSearch, selectedTypes, typeLogic]);

  // Toggle type selection
  const toggleType = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setMonsterSearch('');
    setSelectedTypes([]);
    setTypeLogic('OR');
    setPage(1);
  };

  // Toggle sort
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Check active filters
  const hasActiveFilters = useMemo(() => {
    return searchTerm !== '' || monsterSearch !== '' || selectedTypes.length > 0;
  }, [searchTerm, monsterSearch, selectedTypes]);

  // Toggle expanded ability
  const toggleExpanded = (name: string) => {
    setExpandedAbility(prev => prev === name ? null : name);
  };

  // Render ability card
  const renderAbilityCard = (ability: Ability) => {
    const isExpanded = expandedAbility === ability.name;
    const types = Array.isArray(ability.commonTypes) ? ability.commonTypes : [];
    const monsters = Array.isArray(ability.signatureMonsters) ? ability.signatureMonsters : [];
    const hasTypes = types.length > 0;
    const hasMonsters = monsters.length > 0;
    const hasDescription = ability.description && ability.description.trim();
    const hasEffect = ability.effect && ability.effect.trim();

    return (
      <div
        key={ability.name}
        className={`ability-card ${isExpanded ? 'ability-card--expanded' : ''}`}
        onClick={() => toggleExpanded(ability.name)}
      >
        <div className="ability-card__header">
          <h3 className="ability-card__name">{ability.name}</h3>
          {hasTypes && (
            <div className="ability-card__types">
              {types.map(type => (
                <TypeBadge key={type} type={type} size="xs" />
              ))}
            </div>
          )}
        </div>

        <div className="ability-card__body">
          {hasEffect && (
            <div className="ability-card__detail">
              <span className="ability-card__label">Effect</span>
              <p>{ability.effect}</p>
            </div>
          )}

          {hasDescription && (
            <div className="ability-card__detail">
              <span className="ability-card__label">Description</span>
              <p>{ability.description}</p>
            </div>
          )}

          {hasMonsters && (
            <div className="ability-card__detail">
              <span className="ability-card__label">Signature Monsters</span>
              <div className="ability-card__monsters">
                {monsters.map(monster => (
                  <span key={monster} className="ability-card__monster-tag">{monster}</span>
                ))}
              </div>
            </div>
          )}

          {!hasEffect && !hasDescription && !hasMonsters && (
            <p className="ability-card__no-details">No additional details available</p>
          )}
        </div>

        <div className="ability-card__expand-indicator">
          <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`} />
        </div>
      </div>
    );
  };

  return (
    <div className="ability-database">
      <div className="guide-page__header">
        <h1>Ability Database</h1>
        <p>Browse and search all available abilities, filter by type, and find abilities used by specific monsters</p>
      </div>

      {/* Search and Filter Section */}
      <div className="ability-database__filter-section">
        <div className="ability-database__filter-header">
          <h2>Search &amp; Filter</h2>
          {hasActiveFilters && (
            <button className="button danger sm" onClick={clearFilters}>
              <i className="fas fa-times" /> Clear Filters
            </button>
          )}
        </div>

        <div className="ability-database__search-row">
          <div className="ability-database__search-group">
            <label htmlFor="ability-search">
              <i className="fas fa-search" /> Search by Name
            </label>
            <input
              id="ability-search"
              type="text"
              placeholder="Search abilities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
            />
          </div>

          <div className="ability-database__search-group">
            <label htmlFor="monster-search">
              <i className="fas fa-dragon" /> Search by Monster
            </label>
            <input
              id="monster-search"
              type="text"
              placeholder="Find abilities by monster..."
              value={monsterSearch}
              onChange={(e) => setMonsterSearch(e.target.value)}
              className="input"
            />
          </div>
        </div>

        <div className="ability-database__type-filter">
          <div className="ability-database__type-filter-header">
            <h3>Filter by Type</h3>
            <div className="ability-database__type-logic">
              <span className="ability-database__type-logic-label">Match:</span>
              <button
                className={`button sm ${typeLogic === 'OR' ? 'active' : 'secondary'}`}
                onClick={() => setTypeLogic('OR')}
                title="Match any selected type"
              >
                Any (OR)
              </button>
              <button
                className={`button sm ${typeLogic === 'AND' ? 'active' : 'secondary'}`}
                onClick={() => setTypeLogic('AND')}
                title="Match all selected types"
              >
                All (AND)
              </button>
            </div>
          </div>

          <div className="ability-database__type-buttons">
            {ALL_TYPES.map(type => (
              <button
                key={type}
                className={`ability-database__type-button ${selectedTypes.includes(type) ? 'ability-database__type-button--selected' : ''}`}
                onClick={() => toggleType(type)}
              >
                {type}
              </button>
            ))}
          </div>

          {selectedTypes.length > 0 && (
            <div className="ability-database__selected-types">
              <span>Filtering by: </span>
              {selectedTypes.map((type, index) => (
                <span key={type}>
                  <TypeBadge type={type} size="xs" />
                  {index < selectedTypes.length - 1 && (
                    <span className="ability-database__type-logic-indicator">{typeLogic}</span>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Results Section */}
      <div className="ability-database__results">
        <div className="ability-database__results-header">
          <div className="ability-database__results-count">
            {loading ? (
              <span>Loading...</span>
            ) : (
              <span>Found <strong>{total}</strong> abilities</span>
            )}
          </div>

          <div className="ability-database__sort">
            <span className="ability-database__sort-label">Sort by:</span>
            <button
              className={`button sm ${sortBy === 'name' ? 'active' : 'secondary'}`}
              onClick={() => handleSort('name')}
            >
              Name {sortBy === 'name' && <i className={`fas fa-arrow-${sortOrder === 'asc' ? 'up' : 'down'}`} />}
            </button>
          </div>
        </div>

        {error && (
          <div className="submission__alert submission__alert--error">
            <i className="fas fa-exclamation-circle" /> {error}
          </div>
        )}

        {loading ? (
          <div className="ability-database__loading">
            <div className="loading-spinner" />
            <p>Loading abilities...</p>
          </div>
        ) : abilities.length === 0 ? (
          <div className="ability-database__no-results">
            <i className="fas fa-search" />
            <h3>No abilities found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="ability-database__grid">
            {abilities.map(renderAbilityCard)}
          </div>
        )}

        {totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
};

export default AbilityDatabasePage;
