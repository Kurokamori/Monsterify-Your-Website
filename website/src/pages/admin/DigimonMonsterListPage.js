import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import monsterTypesApi from '../../services/monsterTypesApi';
import AdminLayout from '../../components/layouts/AdminLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination';
import SearchBar from '../../components/common/SearchBar';
import { toast } from 'react-toastify';

const DigimonMonsterListPage = () => {
  const [monsters, setMonsters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [rankFilter, setRankFilter] = useState('');
  const [attributeFilter, setAttributeFilter] = useState('');

  // Digimon ranks for filter dropdown
  const digimonRanks = [
    'Fresh', 'In-Training', 'Rookie', 'Champion', 'Ultimate', 'Mega', 'Ultra', 'Armor'
  ];

  // Digimon attributes for filter dropdown
  const digimonAttributes = [
    'Vaccine', 'Data', 'Virus', 'Free', 'Variable'
  ];

  // Fetch Digimon monsters
  const fetchMonsters = async () => {
    try {
      setLoading(true);
      const response = await monsterTypesApi.getDigimonMonsters({
        page: currentPage,
        limit: 10,
        search: searchTerm,
        sortBy,
        sortOrder,
        rank: rankFilter,
        attribute: attributeFilter
      });

      setMonsters(response.data);
      setTotalPages(response.pagination.totalPages);
      setError(null);
    } catch (error) {
      console.error('Error fetching Digimon monsters:', error);
      setError('Failed to fetch Digimon monsters. Please try again later.');
      toast.error('Failed to fetch Digimon monsters');
    } finally {
      setLoading(false);
    }
  };

  // Delete Digimon monster
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this Digimon monster?')) {
      try {
        await monsterTypesApi.deleteDigimonMonster(id);
        toast.success('Digimon monster deleted successfully');
        fetchMonsters();
      } catch (error) {
        console.error('Error deleting Digimon monster:', error);
        toast.error('Failed to delete Digimon monster');
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
  const handleRankFilterChange = (e) => {
    setRankFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleAttributeFilterChange = (e) => {
    setAttributeFilter(e.target.value);
    setCurrentPage(1);
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setSortBy('name');
    setSortOrder('asc');
    setRankFilter('');
    setAttributeFilter('');
    setCurrentPage(1);
  };

  // Fetch monsters when dependencies change
  useEffect(() => {
    fetchMonsters();
  }, [currentPage, searchTerm, sortBy, sortOrder, rankFilter, attributeFilter]);

  return (
    <div>
      <div className="admin-page-header">
        <h1>Digimon Monsters</h1>
        <Link to="/admin/digimon-monsters/add" className="button primary">
          <i className="fas fa-plus"></i> Add Digimon Monster
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
            <label>Rank:</label>
            <select value={rankFilter} onChange={handleRankFilterChange}>
              <option value="">All Ranks</option>
              {digimonRanks.map((rank) => (
                <option key={rank} value={rank}>
                  {rank}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-filter">
            <label>Attribute:</label>
            <select value={attributeFilter} onChange={handleAttributeFilterChange}>
              <option value="">All Attributes</option>
              {digimonAttributes.map((attribute) => (
                <option key={attribute} value={attribute}>
                  {attribute}
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
        <LoadingSpinner message="Loading Digimon monsters..." />
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
                  <th onClick={() => handleSort('rank')} className="sortable">
                    Rank
                    {sortBy === 'rank' && (
                      <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                    )}
                  </th>
                  <th onClick={() => handleSort('attribute')} className="sortable">
                    Attribute
                    {sortBy === 'attribute' && (
                      <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                    )}
                  </th>
                  <th onClick={() => handleSort('level_required')} className="sortable">
                    Level Required
                    {sortBy === 'level_required' && (
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
                          src={monster.image_url || '/images/placeholder-digimon.png'}
                          alt={monster.name}
                          className="admin-monster-thumbnail"
                        />
                      </td>
                      <td>{monster.name}</td>
                      <td>{monster.rank}</td>
                      <td>
                        <span className={`monster-attribute attribute-${monster.attribute?.toLowerCase()}`}>
                          {monster.attribute}
                        </span>
                      </td>
                      <td>{monster.level_required || 'N/A'}</td>
                      <td className="admin-actions-cell">
                        <Link
                          to={`/admin/digimon-monsters/edit/${monster.id}`}
                          className="button info sm"
                          title="Edit Digimon Monster"
                        >
                          <i className="fas fa-edit"></i>
                        </Link>
                        <button
                          className="button danger sm"
                          title="Delete Digimon Monster"
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
                      No Digimon monsters found
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

export default DigimonMonsterListPage;
