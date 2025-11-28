import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import monsterTypesApi from '../../services/monsterTypesApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination';
import SearchBar from '../../components/common/SearchBar';
import { toast } from 'react-toastify';

const YokaiMonsterListPage = () => {
  const [monsters, setMonsters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [tribeFilter, setTribeFilter] = useState('');
  const [rankFilter, setRankFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');

  // Yokai tribes for filter dropdown
  const yokaiTribes = [
    'Brave', 'Mysterious', 'Tough', 'Charming', 'Heartful', 
    'Shady', 'Eerie', 'Slippery', 'Wicked', 'Enma'
  ];

  // Yokai ranks for filter dropdown
  const yokaiRanks = [
    'E-Rank', 'D-Rank', 'C-Rank', 'B-Rank', 'A-Rank', 'S-Rank', 'SS-Rank'
  ];

  // Evolution stages for filter dropdown
  const evolutionStages = [
    'Base Stage', 'Middle Stage', 'Final Stage', "Doesn't Evolve"
  ];

  // Fetch Yokai monsters
  const fetchMonsters = async () => {
    try {
      setLoading(true);
      const response = await monsterTypesApi.getYokaiMonsters({
        page: currentPage,
        limit: 10,
        search: searchTerm,
        sortBy,
        sortOrder,
        tribe: tribeFilter,
        rank: rankFilter,
        stage: stageFilter
      });

      setMonsters(response.data);
      setTotalPages(response.pagination.totalPages);
      setError(null);
    } catch (error) {
      console.error('Error fetching Yokai monsters:', error);
      setError('Failed to fetch Yokai monsters. Please try again later.');
      toast.error('Failed to fetch Yokai monsters');
    } finally {
      setLoading(false);
    }
  };

  // Delete Yokai monster
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this Yokai monster?')) {
      try {
        await monsterTypesApi.deleteYokaiMonster(id);
        toast.success('Yokai monster deleted successfully');
        fetchMonsters();
      } catch (error) {
        console.error('Error deleting Yokai monster:', error);
        toast.error('Failed to delete Yokai monster');
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
  const handleTribeFilterChange = (e) => {
    setTribeFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleRankFilterChange = (e) => {
    setRankFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleStageFilterChange = (e) => {
    setStageFilter(e.target.value);
    setCurrentPage(1);
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setSortBy('name');
    setSortOrder('asc');
    setTribeFilter('');
    setRankFilter('');
    setStageFilter('');
    setCurrentPage(1);
  };

  // Fetch monsters when dependencies change
  useEffect(() => {
    fetchMonsters();
  }, [currentPage, searchTerm, sortBy, sortOrder, tribeFilter, rankFilter, stageFilter]);

  return (
    <div>
      <div className="admin-page-header">
        <h1>Yokai Monsters</h1>
        <Link to="/admin/yokai-monsters/add" className="admin-button">
          <i className="fas fa-plus"></i> Add Yokai Monster
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
            <label>Tribe:</label>
            <select value={tribeFilter} onChange={handleTribeFilterChange}>
              <option value="">All Tribes</option>
              {yokaiTribes.map((tribe) => (
                <option key={tribe} value={tribe}>
                  {tribe}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-filter">
            <label>Rank:</label>
            <select value={rankFilter} onChange={handleRankFilterChange}>
              <option value="">All Ranks</option>
              {yokaiRanks.map((rank) => (
                <option key={rank} value={rank}>
                  {rank}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-filter">
            <label>Stage:</label>
            <select value={stageFilter} onChange={handleStageFilterChange}>
              <option value="">All Stages</option>
              {evolutionStages.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
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
        <LoadingSpinner message="Loading Yokai monsters..." />
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
                  <th onClick={() => handleSort('tribe')} className="sortable">
                    Tribe
                    {sortBy === 'tribe' && (
                      <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                    )}
                  </th>
                  <th onClick={() => handleSort('rank')} className="sortable">
                    Rank
                    {sortBy === 'rank' && (
                      <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                    )}
                  </th>
                  <th onClick={() => handleSort('stage')} className="sortable">
                    Stage
                    {sortBy === 'stage' && (
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
                          src={monster.image_url || '/images/placeholder-yokai.png'}
                          alt={monster.name}
                          className="admin-monster-thumbnail"
                        />
                      </td>
                      <td>{monster.name}</td>
                      <td>{monster.tribe}</td>
                      <td>{monster.rank}</td>
                      <td>{monster.stage}</td>
                      <td className="admin-actions-cell">
                        <Link
                          to={`/admin/yokai-monsters/edit/${monster.id}`}
                          className="admin-action-button edit"
                          title="Edit Yokai Monster"
                        >
                          <i className="fas fa-edit"></i>
                        </Link>
                        <button
                          className="admin-action-button delete"
                          title="Delete Yokai Monster"
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
                      No Yokai monsters found
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

export default YokaiMonsterListPage;
