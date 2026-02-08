import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import monsterTypesApi from '../../services/monsterTypesApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination';
import SearchBar from '../../components/common/SearchBar';
import { toast } from 'react-toastify';

const PalsMonsterListPage = () => {
  const [monsters, setMonsters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  // Fetch Pals monsters
  const fetchMonsters = async () => {
    try {
      setLoading(true);
      const response = await monsterTypesApi.getPalsMonsters({
        page: currentPage,
        limit: 10,
        search: searchTerm,
        sortBy,
        sortOrder
      });

      setMonsters(response.data);
      setTotalPages(response.pagination.totalPages);
      setError(null);
    } catch (error) {
      console.error('Error fetching Pals monsters:', error);
      setError('Failed to fetch Pals monsters. Please try again later.');
      toast.error('Failed to fetch Pals monsters');
    } finally {
      setLoading(false);
    }
  };

  // Delete Pals monster
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this Pals monster?')) {
      try {
        await monsterTypesApi.deletePalsMonster(id);
        toast.success('Pals monster deleted successfully');
        fetchMonsters();
      } catch (error) {
        console.error('Error deleting Pals monster:', error);
        toast.error('Failed to delete Pals monster');
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

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setSortBy('name');
    setSortOrder('asc');
    setCurrentPage(1);
  };

  // Fetch monsters when dependencies change
  useEffect(() => {
    fetchMonsters();
  }, [currentPage, searchTerm, sortBy, sortOrder]);

  return (
    <div>
      <div className="admin-page-header">
        <h1>Pals Monsters</h1>
        <Link to="/admin/pals-monsters/add" className="button primary">
          <i className="fas fa-plus"></i> Add Pals Monster
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

        <div className="form-input">
          <button className="button secondary" onClick={resetFilters}>
            Reset Filters
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading Pals monsters..." />
      ) : error ? (
        <div className="admin-error">{error}</div>
      ) : (
        <>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="admin-table-image-cell">Image</th>
                  <th onClick={() => handleSort('id')} className="sortable">
                    ID
                    {sortBy === 'id' && (
                      <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                    )}
                  </th>
                  <th onClick={() => handleSort('name')} className="sortable">
                    Name
                    {sortBy === 'name' && (
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
                          src={monster.image_url || '/images/placeholder-pals.png'}
                          alt={monster.name}
                          className="admin-monster-thumbnail"
                        />
                      </td>
                      <td>{monster.id}</td>
                      <td>{monster.name}</td>
                      <td className="admin-actions-cell">
                        <Link
                          to={`/admin/pals-monsters/edit/${monster.id}`}
                          className="button info sm"
                          title="Edit Pals Monster"
                        >
                          <i className="fas fa-edit"></i>
                        </Link>
                        <button
                          className="button danger sm"
                          title="Delete Pals Monster"
                          onClick={() => handleDelete(monster.id)}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="admin-table-empty">
                      No Pals monsters found
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

export default PalsMonsterListPage;
