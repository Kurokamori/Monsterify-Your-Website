import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import monsterTypesApi from '../../services/monsterTypesApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination';
import SearchBar from '../../components/common/SearchBar';
import { toast } from 'react-toastify';

const FinalFantasyMonsterListPage = () => {
  const [monsters, setMonsters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [gameFilter, setGameFilter] = useState('');

  // Final Fantasy monster categories
  const monsterCategories = [
    'Beast', 'Aerial', 'Aquatic', 'Undead', 'Mechanical',
    'Demon', 'Dragon', 'Humanoid', 'Plant', 'Summon', 'Boss'
  ];

  // Final Fantasy games
  const ffGames = [
    'FF I', 'FF II', 'FF III', 'FF IV', 'FF V', 'FF VI',
    'FF VII', 'FF VIII', 'FF IX', 'FF X', 'FF XI', 'FF XII',
    'FF XIII', 'FF XIV', 'FF XV', 'FF XVI', 'FF Tactics', 'Other'
  ];

  // Fetch Final Fantasy monsters
  const fetchMonsters = async () => {
    try {
      setLoading(true);
      const response = await monsterTypesApi.getFinalFantasyMonsters({
        page: currentPage,
        limit: 10,
        search: searchTerm,
        sortBy,
        sortOrder,
        category: categoryFilter,
        game: gameFilter
      });

      setMonsters(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setError(null);
    } catch (error) {
      console.error('Error fetching Final Fantasy monsters:', error);
      setError('Failed to fetch Final Fantasy monsters. Please try again later.');
      toast.error('Failed to fetch Final Fantasy monsters');
    } finally {
      setLoading(false);
    }
  };

  // Delete Final Fantasy monster
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this Final Fantasy monster?')) {
      try {
        await monsterTypesApi.deleteFinalFantasyMonster(id);
        toast.success('Final Fantasy monster deleted successfully');
        fetchMonsters();
      } catch (error) {
        console.error('Error deleting Final Fantasy monster:', error);
        toast.error('Failed to delete Final Fantasy monster');
      }
    }
  };

  // Handle search
  const handleSearch = (term) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  // Handle sort
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  // Handle filter changes
  const handleCategoryFilterChange = (e) => {
    setCategoryFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleGameFilterChange = (e) => {
    setGameFilter(e.target.value);
    setCurrentPage(1);
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setSortBy('name');
    setSortOrder('asc');
    setCategoryFilter('');
    setGameFilter('');
    setCurrentPage(1);
  };

  // Fetch monsters when dependencies change
  useEffect(() => {
    fetchMonsters();
  }, [currentPage, searchTerm, sortBy, sortOrder, categoryFilter, gameFilter]);

  return (
    <div>
      <div className="admin-page-header">
        <h1>Final Fantasy Monsters</h1>
        <Link to="/admin/finalfantasy-monsters/add" className="admin-button">
          <i className="fas fa-plus"></i> Add Final Fantasy Monster
        </Link>
      </div>

      <div className="admin-filters">
        <div className="admin-search">
          <SearchBar
            placeholder="Search by name..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>

        <div className="admin-filter-group">
          <div className="admin-filter">
            <label>Category:</label>
            <select value={categoryFilter} onChange={handleCategoryFilterChange}>
              <option value="">All Categories</option>
              {monsterCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-filter">
            <label>Game:</label>
            <select value={gameFilter} onChange={handleGameFilterChange}>
              <option value="">All Games</option>
              {ffGames.map((game) => (
                <option key={game} value={game}>
                  {game}
                </option>
              ))}
            </select>
          </div>

          <button className="admin-button secondary" onClick={resetFilters}>
            Reset Filters
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading Final Fantasy monsters..." />
      ) : error ? (
        <div className="admin-error">{error}</div>
      ) : (
        <>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="admin-table-image-cell">Image</th>
                  <th onClick={() => handleSort('name')} className="sortable">
                    Name
                    {sortBy === 'name' && (
                      <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                    )}
                  </th>
                  <th onClick={() => handleSort('category')} className="sortable">
                    Category
                    {sortBy === 'category' && (
                      <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                    )}
                  </th>
                  <th>Elements</th>
                  <th onClick={() => handleSort('game')} className="sortable">
                    Game
                    {sortBy === 'game' && (
                      <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                    )}
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {monsters.length > 0 ? (
                  monsters.map((monster) => (
                    <tr key={monster.id}>
                      <td className="admin-table-image-cell">
                        <img
                          src={monster.image_url || '/images/placeholder-monster.png'}
                          alt={monster.name}
                          className="admin-monster-thumbnail"
                        />
                      </td>
                      <td>{monster.name}</td>
                      <td>{monster.category}</td>
                      <td>
                        <div className="monster-types">
                          {monster.element_primary && (
                            <span className={`monster-type type-${monster.element_primary.toLowerCase()}`}>
                              {monster.element_primary}
                            </span>
                          )}
                          {monster.element_secondary && (
                            <span className={`monster-type type-${monster.element_secondary.toLowerCase()}`}>
                              {monster.element_secondary}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>{monster.game || '-'}</td>
                      <td className="admin-actions-cell">
                        <Link
                          to={`/admin/finalfantasy-monsters/edit/${monster.id}`}
                          className="admin-action-button edit"
                          title="Edit Final Fantasy Monster"
                        >
                          <i className="fas fa-edit"></i>
                        </Link>
                        <button
                          className="admin-action-button delete"
                          title="Delete Final Fantasy Monster"
                          onClick={() => handleDelete(monster.id)}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="admin-table-empty">
                      No Final Fantasy monsters found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  );
};

export default FinalFantasyMonsterListPage;
