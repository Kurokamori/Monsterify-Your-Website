import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import monsterTypesApi from '../../services/monsterTypesApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination';
import SearchBar from '../../components/common/SearchBar';
import { toast } from 'react-toastify';

const NexomonMonsterListPage = () => {
  const [monsters, setMonsters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('nr');
  const [sortOrder, setSortOrder] = useState('asc');
  const [typeFilter, setTypeFilter] = useState('');
  const [legendaryFilter, setLegendaryFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');

  // Nexomon types for filter dropdown
  const nexomonTypes = [
    'Normal', 'Fire', 'Water', 'Electric', 'Plant', 'Ice', 'Earth', 'Metal',
    'Wind', 'Ghost', 'Psychic', 'Dragon', 'Dark', 'Light'
  ];

  // Evolution stages for filter dropdown
  const evolutionStages = [
    'Base Stage', 'Middle Stage', 'Final Stage', "Doesn't Evolve"
  ];

  // Fetch Nexomon monsters
  const fetchMonsters = async () => {
    try {
      setLoading(true);
      const response = await monsterTypesApi.getNexomonMonsters({
        page: currentPage,
        limit: 10,
        search: searchTerm,
        sortBy,
        sortOrder,
        type: typeFilter,
        legendary: legendaryFilter,
        stage: stageFilter
      });

      setMonsters(response.data);
      setTotalPages(response.pagination.totalPages);
      setError(null);
    } catch (error) {
      console.error('Error fetching Nexomon monsters:', error);
      setError('Failed to fetch Nexomon monsters. Please try again later.');
      toast.error('Failed to fetch Nexomon monsters');
    } finally {
      setLoading(false);
    }
  };

  // Delete Nexomon monster
  const handleDelete = async (nr) => {
    if (window.confirm('Are you sure you want to delete this Nexomon monster?')) {
      try {
        await monsterTypesApi.deleteNexomonMonster(nr);
        toast.success('Nexomon monster deleted successfully');
        fetchMonsters();
      } catch (error) {
        console.error('Error deleting Nexomon monster:', error);
        toast.error('Failed to delete Nexomon monster');
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
  const handleTypeFilterChange = (e) => {
    setTypeFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleLegendaryFilterChange = (e) => {
    setLegendaryFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleStageFilterChange = (e) => {
    setStageFilter(e.target.value);
    setCurrentPage(1);
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setSortBy('nr');
    setSortOrder('asc');
    setTypeFilter('');
    setLegendaryFilter('');
    setStageFilter('');
    setCurrentPage(1);
  };

  // Fetch monsters when dependencies change
  useEffect(() => {
    fetchMonsters();
  }, [currentPage, searchTerm, sortBy, sortOrder, typeFilter, legendaryFilter, stageFilter]);

  return (
    <div>
      <div className="admin-page-header">
        <h1>Nexomon Monsters</h1>
        <Link to="/admin/nexomon-monsters/add" className="button primary">
          <i className="fas fa-plus"></i> Add Nexomon Monster
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
            <label>Type:</label>
            <select value={typeFilter} onChange={handleTypeFilterChange}>
              <option value="">All Types</option>
              {nexomonTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-filter">
            <label>Legendary:</label>
            <select value={legendaryFilter} onChange={handleLegendaryFilterChange}>
              <option value="">All</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
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

          <button className="button secondary" onClick={resetFilters}>
            Reset Filters
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading Nexomon monsters..." />
      ) : error ? (
        <div className="admin-error">{error}</div>
      ) : (
        <>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="admin-table-image-cell">Image</th>
                  <th onClick={() => handleSort('nr')} className="sortable">
                    #
                    {sortBy === 'nr' && (
                      <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                    )}
                  </th>
                  <th onClick={() => handleSort('name')} className="sortable">
                    Name
                    {sortBy === 'name' && (
                      <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                    )}
                  </th>
                  <th>Types</th>
                  <th onClick={() => handleSort('stage')} className="sortable">
                    Stage
                    {sortBy === 'stage' && (
                      <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                    )}
                  </th>
                  <th>Legendary</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {monsters.length > 0 ? (
                  monsters.map((monster) => (
                    <tr key={monster.nr}>
                      <td className="admin-table-image-cell">
                        <img
                          src={monster.image_url || '/images/placeholder-nexomon.png'}
                          alt={monster.name}
                          className="admin-monster-thumbnail"
                        />
                      </td>
                      <td>{monster.nr}</td>
                      <td>{monster.name}</td>
                      <td>
                        <div className="monster-types">
                          <span className={`monster-type type-${monster.type_primary?.toLowerCase()}`}>
                            {monster.type_primary}
                          </span>
                          {monster.type_secondary && (
                            <span className={`monster-type type-${monster.type_secondary?.toLowerCase()}`}>
                              {monster.type_secondary}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>{monster.stage}</td>
                      <td>
                        {monster.is_legendary ? (
                          <span className="monster-badge legendary">Legendary</span>
                        ) : (
                          <span>No</span>
                        )}
                      </td>
                      <td className="admin-actions-cell">
                        <Link
                          to={`/admin/nexomon-monsters/edit/${monster.nr}`}
                          className="button info sm"
                          title="Edit Nexomon Monster"
                        >
                          <i className="fas fa-edit"></i>
                        </Link>
                        <button
                          className="button danger sm"
                          title="Delete Nexomon Monster"
                          onClick={() => handleDelete(monster.nr)}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="admin-table-empty">
                      No Nexomon monsters found
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

export default NexomonMonsterListPage;
