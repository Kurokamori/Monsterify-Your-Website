import React, { useState, useEffect, useCallback, useMemo } from 'react';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import abilityService from '../../services/abilityService';
import TypeBadge from '../../components/monsters/TypeBadge';
import './AbilityDatabasePage.css';

// All 18 standard types for the filter
const ALL_TYPES = [
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
  'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
  'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'
];

const AbilityDatabasePage = () => {
  useDocumentTitle('Ability Database - Guides');

  // State for abilities data
  const [abilities, setAbilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [monsterSearch, setMonsterSearch] = useState('');
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [typeLogic, setTypeLogic] = useState('OR');

  // State for pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [limit] = useState(24);

  // State for sorting
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  // State for expanded ability details
  const [expandedAbility, setExpandedAbility] = useState(null);

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
        sortOrder
      });

      setAbilities(result.abilities);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch (err) {
      console.error('Error fetching abilities:', err);
      setError('Failed to load abilities. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, monsterSearch, selectedTypes, typeLogic, page, limit, sortBy, sortOrder]);

  // Fetch abilities when filters change
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
  const toggleType = (type) => {
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

  // Toggle sort order or change sort field
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return searchTerm || monsterSearch || selectedTypes.length > 0;
  }, [searchTerm, monsterSearch, selectedTypes]);

  // Toggle expanded ability
  const toggleExpanded = (name) => {
    setExpandedAbility(prev => prev === name ? null : name);
  };

  // Render ability card
  const renderAbilityCard = (ability) => {
    const isExpanded = expandedAbility === ability.name;
    const hasTypes = ability.commonTypes && ability.commonTypes.length > 0;
    const hasMonsters = ability.signatureMonsters && ability.signatureMonsters.length > 0;
    const hasDescription = ability.description && ability.description.trim();
    const hasEffect = ability.effect && ability.effect.trim();

    return (
      <div
        key={ability.name}
        className={`ability-card ${isExpanded ? 'expanded' : ''}`}
        onClick={() => toggleExpanded(ability.name)}
      >
        <div className="ability-card-header">
          <h3 className="ability-name">{ability.name}</h3>
          {hasTypes && (
            <div className="ability-types">
              {ability.commonTypes.map(type => (
                <TypeBadge key={type} type={type} />
              ))}
            </div>
          )}
        </div>

        <div className="ability-card-body">
          {hasEffect && (
            <div className="ability-effect">
              <span className="ability-label">Effect:</span>
              <p>{ability.effect}</p>
            </div>
          )}

          {hasDescription && (
            <div className="ability-description">
              <span className="ability-label">Description:</span>
              <p>{ability.description}</p>
            </div>
          )}

          {hasMonsters && (
            <div className="ability-monsters">
              <span className="ability-label">Signature Monsters:</span>
              <div className="monster-tags">
                {ability.signatureMonsters.map(monster => (
                  <span key={monster} className="monster-tag">{monster}</span>
                ))}
              </div>
            </div>
          )}

          {!hasEffect && !hasDescription && !hasMonsters && (
            <p className="no-details">No additional details available</p>
          )}
        </div>

        <div className="ability-card-expand-indicator">
          <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`}></i>
        </div>
      </div>
    );
  };

  return (
    <div className="ability-database-page">
      <div className="page-header">
        <h1>Ability Database</h1>
        <p>Browse and search all available abilities, filter by type, and find abilities used by specific monsters</p>
      </div>

      {/* Search and Filter Section */}
      <div className="ability-filter-section">
        <div className="filter-header">
          <h2>Search & Filter</h2>
          {hasActiveFilters && (
            <button className="clear-filters-btn" onClick={clearFilters}>
              <i className="fas fa-times"></i> Clear Filters
            </button>
          )}
        </div>

        <div className="search-row">
          <div className="search-input-group">
            <label htmlFor="ability-search">
              <i className="fas fa-search"></i> Search by Name
            </label>
            <input
              id="ability-search"
              type="text"
              placeholder="Search abilities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="search-input-group">
            <label htmlFor="monster-search">
              <i className="fas fa-dragon"></i> Search by Monster
            </label>
            <input
              id="monster-search"
              type="text"
              placeholder="Find abilities by monster..."
              value={monsterSearch}
              onChange={(e) => setMonsterSearch(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="type-filter-section">
          <div className="type-filter-header">
            <h3>Filter by Type</h3>
            <div className="type-logic-toggle">
              <span className="logic-label">Match:</span>
              <button
                className={`logic-btn ${typeLogic === 'OR' ? 'active' : ''}`}
                onClick={() => setTypeLogic('OR')}
                title="Match any selected type"
              >
                Any (OR)
              </button>
              <button
                className={`logic-btn ${typeLogic === 'AND' ? 'active' : ''}`}
                onClick={() => setTypeLogic('AND')}
                title="Match all selected types"
              >
                All (AND)
              </button>
            </div>
          </div>

          <div className="type-buttons">
            {ALL_TYPES.map(type => (
              <button
                key={type}
                className={`type-filter-btn type-${type.toLowerCase()} ${selectedTypes.includes(type) ? 'selected' : ''}`}
                onClick={() => toggleType(type)}
              >
                {type}
              </button>
            ))}
          </div>

          {selectedTypes.length > 0 && (
            <div className="selected-types-summary">
              <span>Filtering by: </span>
              {selectedTypes.map((type, index) => (
                <span key={type}>
                  <TypeBadge type={type} />
                  {index < selectedTypes.length - 1 && (
                    <span className="type-logic-indicator">{typeLogic}</span>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Results Section */}
      <div className="ability-results-section">
        <div className="results-header">
          <div className="results-count">
            {loading ? (
              <span>Loading...</span>
            ) : (
              <span>Found <strong>{total}</strong> abilities</span>
            )}
          </div>

          <div className="sort-controls">
            <span className="sort-label">Sort by:</span>
            <button
              className={`sort-btn ${sortBy === 'name' ? 'active' : ''}`}
              onClick={() => handleSort('name')}
            >
              Name {sortBy === 'name' && <i className={`fas fa-arrow-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>}
            </button>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading abilities...</p>
          </div>
        ) : abilities.length === 0 ? (
          <div className="no-results">
            <i className="fas fa-search"></i>
            <h3>No abilities found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="ability-grid">
            {abilities.map(renderAbilityCard)}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="pagination-btn"
              onClick={() => setPage(1)}
              disabled={page === 1}
            >
              <i className="fas fa-angle-double-left"></i>
            </button>
            <button
              className="pagination-btn"
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={page === 1}
            >
              <i className="fas fa-angle-left"></i>
            </button>

            <div className="pagination-info">
              Page <strong>{page}</strong> of <strong>{totalPages}</strong>
            </div>

            <button
              className="pagination-btn"
              onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
            >
              <i className="fas fa-angle-right"></i>
            </button>
            <button
              className="pagination-btn"
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
            >
              <i className="fas fa-angle-double-right"></i>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AbilityDatabasePage;
