import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import trainerService from '../../services/trainerService';
import useDocumentTitle from '../../hooks/useDocumentTitle';

const TrainersPage = () => {
  useDocumentTitle('Trainers');
  
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [factionFilter, setFactionFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    fetchTrainers();
  }, [currentPage, sortBy, sortOrder]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when searching
      fetchTrainers();
    }, 500); // 500ms delay

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Faction filter effect
  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filtering
    fetchTrainers();
  }, [factionFilter]);

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
      if (searchTerm && searchTerm.trim() !== '') {
        searchParam = searchTerm.trim();
      }
      if (factionFilter && factionFilter.trim() !== '') {
        // If we have both search term and faction filter, combine them
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

      setTrainers(response.trainers || []);
      setTotalPages(response.totalPages || 1);

      // If no trainers found with search, show a message but don't treat as error
      if (response.trainers.length === 0 && searchTerm) {
        console.log('No trainers found matching search criteria');
      }
    } catch (err) {
      console.error('Error fetching trainers:', err);
      setError('Failed to load trainers. Please try again later.');
      setTrainers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Search is now handled automatically by the debounced useEffect
    // This just prevents the default form submission behavior
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
              type="text"
              placeholder="Search trainers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
            className={`sort-button ${sortBy === 'name' ? 'active' : ''}`}
            onClick={() => handleSort('name')}
          >
            <i className="fas fa-font"></i>
            {sortBy === 'name' && (
              <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
            )}
          </button>
          <button
            className={`sort-button ${sortBy === 'level' ? 'active' : ''}`}
            onClick={() => handleSort('level')}
          >
            <i className="fas fa-star"></i>
            {sortBy === 'level' && (
              <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
            )}
          </button>
          <button
            className={`sort-button ${sortBy === 'monster_count' ? 'active' : ''}`}
            onClick={() => handleSort('monster_count')}
          >
            <i className="fas fa-dragon"></i>
            {sortBy === 'monster_count' && (
              <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
            )}
          </button>
          <button
            className={`sort-button ${sortBy === 'faction' ? 'active' : ''}`}
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
          <button onClick={fetchTrainers} className="retry-button">
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
                    <h3 className="trainer-name">{trainer.name}</h3>
                    <div className="trainer-player">
                      <i className="fas fa-user"></i> {trainer.player_display_name || trainer.player_username || 'Unknown Player'}
                    </div>
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
                className="pagination-button"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                <i className="fas fa-chevron-left"></i>
              </button>

              {[...Array(totalPages).keys()].map((page) => (
                <button
                  key={page + 1}
                  className={`pagination-button ${currentPage === page + 1 ? 'active' : ''}`}
                  onClick={() => handlePageChange(page + 1)}
                >
                  {page + 1}
                </button>
              ))}

              <button
                className="pagination-button"
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
