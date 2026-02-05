import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import trainerService from '../../services/trainerService';
import useDocumentTitle from '../../hooks/useDocumentTitle';

const TrainersPage = () => {
  useDocumentTitle('Trainers');

  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [factionFilter, setFactionFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [retryCount, setRetryCount] = useState(0);
  const isFirstRender = useRef(true);
  const fetchIdRef = useRef(0);
  const searchInputRef = useRef(null);

  // Debounce the search term into a separate state
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Reset to page 1 when search or faction filter changes
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setCurrentPage(1);
  }, [debouncedSearch, factionFilter]);

  // Single effect that fetches trainers whenever any relevant param changes
  useEffect(() => {
    const currentFetchId = ++fetchIdRef.current;

    const fetchTrainers = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = {
          page: currentPage,
          limit: 50,
          sort_by: sortBy,
          sort_order: sortOrder
        };

        // Combine search term and faction filter into search parameter
        let searchParam = '';
        if (debouncedSearch && debouncedSearch.trim() !== '') {
          searchParam = debouncedSearch.trim();
        }
        if (factionFilter && factionFilter.trim() !== '') {
          if (searchParam) {
            searchParam += ' ' + factionFilter.trim();
          } else {
            searchParam = factionFilter.trim();
          }
        }

        if (searchParam) {
          params.search = searchParam;
        }

        console.log('Fetching trainers with params:', params);
        const response = await trainerService.getTrainersPaginated(params);

        // Only update state if this is still the latest request
        if (currentFetchId !== fetchIdRef.current) return;

        setTrainers(response.trainers || []);
        setTotalPages(response.totalPages || 1);

        if (response.trainers.length === 0 && debouncedSearch) {
          console.log('No trainers found matching search criteria');
        }
      } catch (err) {
        if (currentFetchId !== fetchIdRef.current) return;
        console.error('Error fetching trainers:', err);
        setError('Failed to load trainers. Please try again later.');
        setTrainers([]);
      } finally {
        if (currentFetchId === fetchIdRef.current) {
          setLoading(false);
        }
      }
    };

    fetchTrainers();
  }, [currentPage, sortBy, sortOrder, debouncedSearch, factionFilter, retryCount]);

  const handleSearch = (e) => {
    e.preventDefault();
    // When form is submitted (e.g. mobile keyboard "Go" button),
    // immediately flush the debounced search.
    // Use ref value as fallback since some mobile browsers (iOS Safari)
    // clear the input before the submit event fires, causing searchTerm to be empty.
    const currentValue = searchInputRef.current?.value ?? searchTerm;
    setDebouncedSearch(currentValue);
    // Sync the state in case it got out of sync
    if (currentValue !== searchTerm) {
      setSearchTerm(currentValue);
    }
  };

  const handleSort = (field) => {
    setCurrentPage(1); // Reset to first page when sorting changes
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // No fallback data needed as we're properly handling API responses

  return (
    <div className="trainers-container">
      <div className="trainers-controls-compact">
        <form className="search-form" onSubmit={handleSearch}>
          <div className="search-input">
            <input
              ref={searchInputRef}
              type="search"
              placeholder="Search trainers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
            <button type="submit">
              <i className="fas fa-search"></i>
            </button>
          </div>
        </form>

        <div className="faction-filter">
          <select
            value={factionFilter}
            onChange={(e) => setFactionFilter(e.target.value)}
            className="faction-select"
          >
            <option value="">All Factions</option>
            <option value="Nyakuza">Nyakuza</option>
            <option value="Digital Dawn">Digital Dawn</option>
            <option value="League">League</option>
            <option value="The Twilight Order">The Twilight Order</option>
            <option value="Ranchers">Ranchers</option>
            <option value="Rangers">Rangers</option>
            <option value="Tamers">Tamers</option>
            <option value="Project Obsidian">Project Obsidian</option>
            <option value="The Tribes">The Tribes</option>
            <option value="Spirit Keepers">Spirit Keepers</option>
          </select>
        </div>

        <div className="sort-controls">
          <button
            className={`button button-filter ${sortBy === 'name' ? 'active' : ''}`}
            onClick={() => handleSort('name')}
          >
            <i className="fas fa-font"></i>
            {sortBy === 'name' && (
              <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
            )}
          </button>
          <button
            className={`button button-filter ${sortBy === 'level' ? 'active' : ''}`}
            onClick={() => handleSort('level')}
          >
            <i className="fas fa-star"></i>
            {sortBy === 'level' && (
              <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
            )}
          </button>
          <button
            className={`button button-filter ${sortBy === 'monster_count' ? 'active' : ''}`}
            onClick={() => handleSort('monster_count')}
          >
            <i className="fas fa-dragon"></i>
            {sortBy === 'monster_count' && (
              <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
            )}
          </button>
          <button
            className={`button button-filter ${sortBy === 'faction' ? 'active' : ''}`}
            onClick={() => handleSort('faction')}
          >
            <i className="fas fa-flag"></i>
            {sortBy === 'faction' && (
              <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
            )}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner">
            <i className="fas fa-spinner fa-spin"></i>
          </div>
          <p>Loading trainers...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <i className="fas fa-exclamation-circle"></i>
          <p>{error}</p>
          <button onClick={() => setRetryCount(c => c + 1)} className="button button-primary">
            Try Again
          </button>
        </div>
      ) : (
        <>
          <div className="trainers-grid">
            {trainers.length === 0 ? (
              <div className="no-trainers-message">
                <i className="fas fa-users-slash"></i>
                <p>No trainers found. Try adjusting your search criteria.</p>
              </div>
            ) : (
              trainers.map((trainer) => (
                <Link to={`/trainers/${trainer.id}`} className="trainer-card" key={trainer.id}>
                  <div className="trainer-name-heading">
                    <h3 className="trainer-name">{trainer.name}</h3>
                    <div className="trainer-player">
                      <i className="fas fa-user"></i> {trainer.player_display_name || trainer.player_username || 'Unknown Player'}
                    </div>
                  </div>
                  <div className="trainer-image-container">
                    <img
                      src={trainer.main_ref || '/images/default_trainer.png'}
                      alt={trainer.name}
                      className="trainer-image"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/images/default_trainer.png';
                      }}
                    />
                  </div>
                  <div className="trainer-info">
                    <div className="trainer-details">
                      <span className="trainer-level">
                        <i className="fas fa-star"></i> Level {trainer.level || 1}
                      </span>
                      <span className="trainer-monsters">
                        <i className="fas fa-dragon"></i> {trainer.monster_count || 0} Monsters
                      </span>
                    </div>
                    {trainer.region && (
                      <span className="trainer-region">
                        <i className="fas fa-map-marker-alt"></i> {trainer.region}
                      </span>
                    )}
                    {trainer.faction && (
                      <span className={`trainer-faction faction-${trainer.faction.toLowerCase()}`}>
                        <i className="fas fa-flag"></i> {trainer.faction}
                      </span>
                    )}
                  </div>
                </Link>
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="button button-secondary"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                <i className="fas fa-chevron-left"></i>
              </button>

              {[...Array(totalPages).keys()].map((page) => (
                <button
                  key={page + 1}
                  className={`button button-secondary ${currentPage === page + 1 ? 'active' : ''}`}
                  onClick={() => handlePageChange(page + 1)}
                >
                  {page + 1}
                </button>
              ))}

              <button
                className="button button-secondary"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TrainersPage;
