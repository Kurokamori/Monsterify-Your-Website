import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';
import speciesService, {
  FRANCHISE_CONFIG,
  FRANCHISE_LIST,
  type FranchiseKey,
  type Species,
  type FranchiseConfigItem,
  type AdjacentSpeciesResult,
} from '../../../services/speciesService';
import { SpeciesCard } from '../../../components/guides/SpeciesCard';
import { SpeciesDetailModal } from '../../../components/guides/SpeciesDetailModal';
import { FranchiseFilters } from '../../../components/guides/FranchiseFilters';
import { Pagination } from '../../../components/common/Pagination';

const SpeciesDatabasePage = () => {
  useDocumentTitle('Species Database - Guides');

  // Franchise state
  const [franchise, setFranchise] = useState<FranchiseKey>('pokemon');
  const franchiseConfig = useMemo<FranchiseConfigItem>(() => FRANCHISE_CONFIG[franchise], [franchise]);

  // Species data
  const [species, setSpecies] = useState<Species[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 30;

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modal
  const [selectedSpecies, setSelectedSpecies] = useState<Species | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [adjacentSpecies, setAdjacentSpecies] = useState<AdjacentSpeciesResult>({
    prev: null,
    next: null,
    currentIndex: -1,
    total: 0,
  });

  // Build params for API calls
  const currentParams = useMemo(() => ({
    page,
    limit,
    search: searchTerm,
    sortBy: sortBy || franchiseConfig.sortDefault,
    sortOrder,
    ...filters,
  }), [page, limit, searchTerm, sortBy, sortOrder, filters, franchiseConfig]);

  // Fetch species data
  const fetchSpecies = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await speciesService.getSpecies(franchise, currentParams);
      setSpecies(result.species);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch {
      setError('Failed to load species. Please try again.');
      setSpecies([]);
    } finally {
      setLoading(false);
    }
  }, [franchise, currentParams]);

  // Debounced fetch
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchSpecies();
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [fetchSpecies]);

  // Reset on franchise change
  useEffect(() => {
    setPage(1);
    setFilters({});
    setSearchTerm('');
    setSortBy('');
  }, [franchise]);

  // Reset page on filter/search change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, filters]);

  // Handle franchise change
  const handleFranchiseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFranchise(e.target.value as FranchiseKey);
  };

  // Handle filter change
  const handleFilterChange = (filterKey: string, value: string) => {
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
  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Open species detail modal
  const openSpeciesModal = async (speciesItem: Species) => {
    setSelectedSpecies(speciesItem);
    setModalLoading(true);

    try {
      const adjacent = await speciesService.getAdjacentSpecies(
        franchise,
        speciesItem[franchiseConfig.idField] as string | number,
        { ...filters, search: searchTerm, sortBy: sortBy || franchiseConfig.sortDefault, sortOrder }
      );
      setAdjacentSpecies(adjacent);
    } catch {
      setAdjacentSpecies({ prev: null, next: null, currentIndex: -1, total: 0 });
    } finally {
      setModalLoading(false);
    }
  };

  // Close modal
  const closeModal = () => {
    setSelectedSpecies(null);
    setAdjacentSpecies({ prev: null, next: null, currentIndex: -1, total: 0 });
  };

  // Navigate prev/next
  const handlePrevSpecies = () => {
    if (adjacentSpecies.prev) {
      openSpeciesModal(adjacentSpecies.prev);
    }
  };

  const handleNextSpecies = () => {
    if (adjacentSpecies.next) {
      openSpeciesModal(adjacentSpecies.next);
    }
  };

  // Check active filters
  const hasActiveFilters = useMemo(() => {
    return searchTerm !== '' || Object.keys(filters).length > 0;
  }, [searchTerm, filters]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sort button active check
  const isSortActive = (field: string) => {
    return sortBy === field || (!sortBy && franchiseConfig.sortDefault === field);
  };

  // Get sort label for franchise-specific ID field
  const getSortIdLabel = () => {
    const defaultSort = franchiseConfig.sortDefault;
    if (defaultSort === 'ndex') return '#Dex';
    if (defaultSort === 'nr') return '#Nr';
    if (defaultSort === 'number') return '#Num';
    return '#ID';
  };

  return (
    <div className="ability-database">
      <div className="guide-page__header">
        <h1>Species Database</h1>
        <p>Explore all available species across different monster franchises</p>
      </div>

      {/* Franchise Selector and Search */}
      <div className="ability-database__filter-section">
        <div className="ability-database__filter-header">
          <h2>Browse Species</h2>
          {hasActiveFilters && (
            <button className="button danger sm" onClick={clearFilters}>
              <i className="fas fa-times" /> Clear Filters
            </button>
          )}
        </div>

        <div className="ability-database__search-row">
          {/* Franchise Dropdown */}
          <div className="ability-database__search-group">
            <label htmlFor="franchise-select">
              <i className="fas fa-gamepad" /> Franchise
            </label>
            <select
              id="franchise-select"
              value={franchise}
              onChange={handleFranchiseChange}
              className="select"
            >
              {FRANCHISE_LIST.map(key => (
                <option key={key} value={key}>
                  {FRANCHISE_CONFIG[key].name}
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div className="ability-database__search-group">
            <label htmlFor="species-search">
              <i className="fas fa-search" /> Search by Name
            </label>
            <input
              id="species-search"
              type="text"
              placeholder="Search species..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
            />
          </div>
        </div>

        {/* Dynamic Filters */}
        <FranchiseFilters
          franchise={franchise}
          filters={filters}
          onFilterChange={handleFilterChange}
        />
      </div>

      {/* Results Section */}
      <div className="ability-database__results">
        <div className="ability-database__results-header">
          <div className="ability-database__results-count">
            {loading ? (
              <span>Loading...</span>
            ) : (
              <span>Found <strong>{total}</strong> {franchiseConfig.name} species</span>
            )}
          </div>

          <div className="ability-database__sort">
            <span className="ability-database__sort-label">Sort by:</span>
            <button
              className={`button sm ${isSortActive('name') ? 'active' : 'secondary'}`}
              onClick={() => handleSortChange('name')}
            >
              Name {isSortActive('name') && (
                <i className={`fas fa-arrow-${sortOrder === 'asc' ? 'up' : 'down'}`} />
              )}
            </button>
            {franchiseConfig.sortDefault && franchiseConfig.sortDefault !== 'name' && (
              <button
                className={`button sm ${isSortActive(franchiseConfig.sortDefault) ? 'active' : 'secondary'}`}
                onClick={() => handleSortChange(franchiseConfig.sortDefault)}
              >
                {getSortIdLabel()}
                {isSortActive(franchiseConfig.sortDefault) && (
                  <i className={`fas fa-arrow-${sortOrder === 'asc' ? 'up' : 'down'}`} />
                )}
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="submission__alert submission__alert--error">
            <i className="fas fa-exclamation-circle" /> {error}
            <button className="button secondary sm" onClick={fetchSpecies}>
              <i className="fas fa-redo" /> Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="ability-database__loading">
            <div className="loading-spinner" />
            <p>Loading species...</p>
          </div>
        ) : species.length === 0 ? (
          <div className="ability-database__no-results">
            <i className="fas fa-search" />
            <h3>No species found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="species-grid">
            {species.map((speciesItem) => (
              <SpeciesCard
                key={speciesItem[franchiseConfig.idField] as string}
                species={speciesItem}
                franchise={franchise}
                onClick={() => openSpeciesModal(speciesItem)}
              />
            ))}
          </div>
        )}

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
