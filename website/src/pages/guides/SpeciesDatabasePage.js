import React, { useState, useEffect, useCallback, useMemo } from 'react';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import speciesDatabaseService, { FRANCHISE_CONFIG, FRANCHISE_LIST } from '../../services/speciesDatabaseService';
import SpeciesCard from '../../components/guides/SpeciesCard';
import SpeciesDetailModal from '../../components/guides/SpeciesDetailModal';
import FranchiseFilters from '../../components/guides/FranchiseFilters';
import Pagination from '../../components/common/Pagination';

const SpeciesDatabasePage = () => {
  useDocumentTitle('Species Database - Guides');

  // Franchise state
  const [franchise, setFranchise] = useState('pokemon');
  const franchiseConfig = useMemo(() => FRANCHISE_CONFIG[franchise], [franchise]);

  // Species data state
  const [species, setSpecies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [limit] = useState(30);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');

  // Modal state
  const [selectedSpecies, setSelectedSpecies] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [adjacentSpecies, setAdjacentSpecies] = useState({ prev: null, next: null });

  // Build current params for API calls
  const currentParams = useMemo(() => ({
    page,
    limit,
    search: searchTerm,
    sortBy: sortBy || franchiseConfig?.sortDefault,
    sortOrder,
    ...filters
  }), [page, limit, searchTerm, sortBy, sortOrder, filters, franchiseConfig]);

  // Fetch species data
  const fetchSpecies = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await speciesDatabaseService.getSpecies(franchise, currentParams);
      setSpecies(result.species);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch (err) {
      console.error('Error fetching species:', err);
      setError('Failed to load species. Please try again.');
      setSpecies([]);
    } finally {
      setLoading(false);
    }
  }, [franchise, currentParams]);

  // Debounced fetch when params change
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchSpecies();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [fetchSpecies]);

  // Reset page and filters when franchise changes
  useEffect(() => {
    setPage(1);
    setFilters({});
    setSearchTerm('');
    setSortBy('');
  }, [franchise]);

  // Reset page when filters or search changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm, filters]);

  // Handle franchise change
  const handleFranchiseChange = (e) => {
    setFranchise(e.target.value);
  };

  // Handle filter change
  const handleFilterChange = (filterKey, value) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      if (value === '' || value === null || value === undefined) {
        delete newFilters[filterKey];
      } else {
        newFilters[filterKey] = value;
      }
      return newFilters;
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setFilters({});
    setPage(1);
  };

  // Handle sort change
  const handleSortChange = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Open species detail modal
  const openSpeciesModal = async (speciesItem) => {
    setSelectedSpecies(speciesItem);
    setModalLoading(true);

    try {
      // Get adjacent species for navigation
      const adjacent = await speciesDatabaseService.getAdjacentSpecies(
        franchise,
        speciesItem[franchiseConfig.idField],
        { ...filters, search: searchTerm, sortBy: sortBy || franchiseConfig.sortDefault, sortOrder }
      );
      setAdjacentSpecies(adjacent);
    } catch (err) {
      console.error('Error getting adjacent species:', err);
      setAdjacentSpecies({ prev: null, next: null });
    } finally {
      setModalLoading(false);
    }
  };

  // Close modal
  const closeModal = () => {
    setSelectedSpecies(null);
    setAdjacentSpecies({ prev: null, next: null });
  };

  // Navigate to previous species
  const handlePrevSpecies = () => {
    if (adjacentSpecies.prev) {
      openSpeciesModal(adjacentSpecies.prev);
    }
  };

  // Navigate to next species
  const handleNextSpecies = () => {
    if (adjacentSpecies.next) {
      openSpeciesModal(adjacentSpecies.next);
    }
  };

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return searchTerm || Object.keys(filters).length > 0;
  }, [searchTerm, filters]);

  // Handle page change
  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="type-calculator-page species-database-page">
      <div className="lore-header">
        <h1>Species Database</h1>
        <p>Explore all available species across different monster franchises</p>
      </div>

      {/* Franchise Selector and Search */}
      <div className="ability-filter-section">
        <div className="tree-header">
          <h2>Browse Species</h2>
          {hasActiveFilters && (
            <button className="button danger" onClick={clearFilters}>
              <i className="fas fa-times"></i> Clear Filters
            </button>
          )}
        </div>

        <div className="species-search-row">
          {/* Franchise Dropdown */}
          <div className="container cols-2 gap-md">
            <label htmlFor="franchise-select">
              <i className="fas fa-gamepad"></i> Franchise
            </label>
            <select
              id="franchise-select"
              value={franchise}
              onChange={handleFranchiseChange}
              className="form-input"
            >
              {FRANCHISE_LIST.map(key => (
                <option key={key} value={key}>
                  {FRANCHISE_CONFIG[key].name}
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div className="container cols-2 gap-md">
            <label htmlFor="species-search">
              <i className="fas fa-search"></i> Search by Name
            </label>
            <input
              id="species-search"
              type="text"
              placeholder="Search species..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
            />
          </div>
        </div>

        {/* Dynamic Filters based on franchise */}
        <FranchiseFilters
          franchise={franchise}
          filters={filters}
          onFilterChange={handleFilterChange}
        />
      </div>

      {/* Results Section */}
      <div className="team-builder-section">
        <div className="option-row">
          <div className="results-count">
            {loading ? (
              <span>Loading...</span>
            ) : (
              <span>Found <strong>{total}</strong> {franchiseConfig?.name || franchise} species</span>
            )}
          </div>

          <div className="detail-row">
            <span className="file-name">Sort by:</span>
            <button
              className={`button filter ${(sortBy === 'name' || (!sortBy && franchiseConfig?.sortDefault === 'name')) ? 'active' : ''}`}
              onClick={() => handleSortChange('name')}
            >
              Name {(sortBy === 'name' || (!sortBy && franchiseConfig?.sortDefault === 'name')) && (
                <i className={`fas fa-arrow-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
              )}
            </button>
            {franchiseConfig?.sortDefault && franchiseConfig.sortDefault !== 'name' && (
              <button
                className={`button filter ${(sortBy === franchiseConfig.sortDefault || !sortBy) ? 'active' : ''}`}
                onClick={() => handleSortChange(franchiseConfig.sortDefault)}
              >
                #{franchiseConfig.sortDefault === 'ndex' ? 'Dex' : franchiseConfig.sortDefault === 'nr' ? 'Nr' : franchiseConfig.sortDefault === 'number' ? 'Num' : 'ID'}
                {(sortBy === franchiseConfig.sortDefault || !sortBy) && (
                  <i className={`fas fa-arrow-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                )}
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="alert error">
            <i className="fas fa-exclamation-circle"></i> {error}
            <button className="button secondary" onClick={fetchSpecies}>
              <i className="fas fa-redo"></i> Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="error-container">
            <div className="loading-spinner"></div>
            <p>Loading species...</p>
          </div>
        ) : species.length === 0 ? (
          <div className="no-results">
            <i className="fas fa-search"></i>
            <h3>No species found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="species-grid">
            {species.map((speciesItem) => (
              <SpeciesCard
                key={speciesItem[franchiseConfig.idField]}
                species={speciesItem}
                franchise={franchise}
                onClick={() => openSpeciesModal(speciesItem)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>

      {/* Species Detail Modal */}
      <SpeciesDetailModal
        isOpen={!!selectedSpecies}
        onClose={closeModal}
        species={selectedSpecies}
        franchise={franchise}
        onPrev={handlePrevSpecies}
        onNext={handleNextSpecies}
        hasPrev={!!adjacentSpecies.prev}
        hasNext={!!adjacentSpecies.next}
        loading={modalLoading}
        currentIndex={adjacentSpecies.currentIndex}
        totalCount={adjacentSpecies.total}
      />
    </div>
  );
};

export default SpeciesDatabasePage;
