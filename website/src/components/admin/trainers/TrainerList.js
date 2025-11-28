import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import adminApi from '../../../services/adminApi';
import LoadingSpinner from '../../common/LoadingSpinner';
import ErrorMessage from '../../common/ErrorMessage';
import Pagination from '../../common/Pagination';

const TrainerList = () => {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOptions, setFilterOptions] = useState({
    faction: '',
    level: '',
    sortBy: 'name',
    sortOrder: 'asc'
  });

  useEffect(() => {
    fetchTrainers();
  }, [currentPage, filterOptions, searchTerm]);

  const fetchTrainers = async () => {
    try {
      setLoading(true);

      // Build query parameters
      const params = {
        page: currentPage,
        limit: 10,
        sortBy: filterOptions.sortBy,
        sortOrder: filterOptions.sortOrder
      };

      if (searchTerm) {
        params.search = searchTerm;
      }

      if (filterOptions.faction) {
        params.faction = filterOptions.faction;
      }

      if (filterOptions.level) {
        params.level = filterOptions.level;
      }

      const response = await adminApi.getTrainers(params);

      if (response.data.success) {
        setTrainers(response.data.data);
        setTotalPages(response.data.totalPages || 1);
      } else {
        throw new Error(response.data.message || 'Failed to fetch trainers');
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching trainers:', err);
      setError('Failed to load trainers. Please try again later.');
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterOptions(prev => ({
      ...prev,
      [name]: value
    }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this trainer? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await adminApi.deleteTrainer(id);

      if (response.data.success) {
        // Remove the deleted trainer from the list
        setTrainers(trainers.filter(trainer => trainer.id !== id));
      } else {
        throw new Error(response.data.message || 'Failed to delete trainer');
      }
    } catch (err) {
      console.error('Error deleting trainer:', err);
      alert('Failed to delete trainer. Please try again later.');
    }
  };

  if (loading && trainers.length === 0) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="trainer-list-container">
      <div className="trainer-list-header">
        <h1>Trainer Management</h1>
        <Link to="/admin/dashboard/trainers/create" className="create-trainer-btn">
          <i className="fas fa-plus"></i> Create Trainer
        </Link>
      </div>

      <div className="trainer-list-filters">
        <form onSubmit={handleSearch} className="trainer-search-form">
          <input
            type="text"
            placeholder="Search trainers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="trainer-search-input"
          />
          <button type="submit" className="trainer-search-btn">
            <i className="fas fa-search"></i>
          </button>
        </form>

        <div className="trainer-filter-controls">
          <select
            name="faction"
            value={filterOptions.faction}
            onChange={handleFilterChange}
            className="trainer-filter-select"
          >
            <option value="">All Factions</option>
            <option value="Mystic">Mystic</option>
            <option value="Valor">Valor</option>
            <option value="Instinct">Instinct</option>
            <option value="Harmony">Harmony</option>
          </select>

          <select
            name="level"
            value={filterOptions.level}
            onChange={handleFilterChange}
            className="trainer-filter-select"
          >
            <option value="">All Levels</option>
            <option value="1-10">Level 1-10</option>
            <option value="11-20">Level 11-20</option>
            <option value="21-30">Level 21-30</option>
            <option value="31+">Level 31+</option>
          </select>

          <select
            name="sortBy"
            value={filterOptions.sortBy}
            onChange={handleFilterChange}
            className="trainer-filter-select"
          >
            <option value="name">Sort by Name</option>
            <option value="level">Sort by Level</option>
            <option value="created_at">Sort by Date Created</option>
          </select>

          <select
            name="sortOrder"
            value={filterOptions.sortOrder}
            onChange={handleFilterChange}
            className="trainer-filter-select"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : trainers.length === 0 ? (
        <div className="no-trainers-message">
          <p>No trainers found. Try adjusting your search or filters.</p>
        </div>
      ) : (
        <>
          <div className="trainer-table-container">
            <table className="trainer-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Player</th>
                  <th>Level</th>
                  <th>Faction</th>
                  <th>Monsters</th>
                  <th>Currency</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {trainers.map(trainer => (
                  <tr key={trainer.id}>
                    <td>{trainer.id}</td>
                    <td>
                      <div className="trainer-name-cell">
                        {trainer.main_ref && (
                          <img
                            src={trainer.main_ref}
                            alt={trainer.name}
                            className="trainer-avatar"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://via.placeholder.com/40/1e2532/d6a339?text=T';
                            }}
                          />
                        )}
                        <span>{trainer.name}</span>
                      </div>
                    </td>
                    <td>
                      <div className="player-info">
                        {trainer.player_display_name || trainer.player_username || 'Unknown Player'}
                      </div>
                    </td>
                    <td>{trainer.level}</td>
                    <td>
                      <span className={`faction-badge faction-${trainer.faction?.toLowerCase() || 'none'}`}>
                        {trainer.faction || 'None'}
                      </span>
                    </td>
                    <td>{trainer.monster_count || 0}</td>
                    <td>{trainer.currency_amount}</td>
                    <td>{new Date(trainer.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="trainer-actions">
                        <Link to={`/admin/dashboard/trainers/${trainer.id}`} className="trainer-action-btn view">
                          <i className="fas fa-eye"></i>
                        </Link>
                        <Link to={`/admin/dashboard/trainers/${trainer.id}/edit`} className="trainer-action-btn edit">
                          <i className="fas fa-edit"></i>
                        </Link>
                        <button
                          className="trainer-action-btn delete"
                          onClick={() => handleDelete(trainer.id)}
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
};

export default TrainerList;
