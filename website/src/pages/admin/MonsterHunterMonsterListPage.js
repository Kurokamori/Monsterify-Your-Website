import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import monsterTypesApi from '../../services/monsterTypesApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination';
import SearchBar from '../../components/common/SearchBar';
import { toast } from 'react-toastify';

const MonsterHunterMonsterListPage = () => {
  const [monsters, setMonsters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [classFilter, setClassFilter] = useState('');
  const [elementFilter, setElementFilter] = useState('');

  // Monster Hunter classes
  const monsterClasses = [
    'Flying Wyvern', 'Brute Wyvern', 'Fanged Wyvern', 'Bird Wyvern',
    'Piscine Wyvern', 'Leviathan', 'Elder Dragon', 'Fanged Beast',
    'Neopteron', 'Carapaceon', 'Amphibian', 'Snake Wyvern', 'Temnoceran'
  ];

  // Monster Hunter elements
  const monsterElements = [
    'Fire', 'Water', 'Thunder', 'Ice', 'Dragon',
    'Poison', 'Sleep', 'Paralysis', 'Blast', 'None'
  ];

  // Fetch Monster Hunter monsters
  const fetchMonsters = async () => {
    try {
      setLoading(true);
      const response = await monsterTypesApi.getMonsterHunterMonsters({
        page: currentPage,
        limit: 10,
        search: searchTerm,
        sortBy,
        sortOrder,
        monster_class: classFilter,
        element: elementFilter
      });

      setMonsters(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setError(null);
    } catch (error) {
      console.error('Error fetching Monster Hunter monsters:', error);
      setError('Failed to fetch Monster Hunter monsters. Please try again later.');
      toast.error('Failed to fetch Monster Hunter monsters');
    } finally {
      setLoading(false);
    }
  };

  // Delete Monster Hunter monster
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this Monster Hunter monster?')) {
      try {
        await monsterTypesApi.deleteMonsterHunterMonster(id);
        toast.success('Monster Hunter monster deleted successfully');
        fetchMonsters();
      } catch (error) {
        console.error('Error deleting Monster Hunter monster:', error);
        toast.error('Failed to delete Monster Hunter monster');
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
  const handleClassFilterChange = (e) => {
    setClassFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleElementFilterChange = (e) => {
    setElementFilter(e.target.value);
    setCurrentPage(1);
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setSortBy('name');
    setSortOrder('asc');
    setClassFilter('');
    setElementFilter('');
    setCurrentPage(1);
  };

  // Fetch monsters when dependencies change
  useEffect(() => {
    fetchMonsters();
  }, [currentPage, searchTerm, sortBy, sortOrder, classFilter, elementFilter]);

  return (
    <div>
      <div className="admin-page-header">
        <h1>Monster Hunter Monsters</h1>
        <Link to="/admin/monsterhunter-monsters/add" className="admin-button">
          <i className="fas fa-plus"></i> Add Monster Hunter Monster
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
            <label>Class:</label>
            <select value={classFilter} onChange={handleClassFilterChange}>
              <option value="">All Classes</option>
              {monsterClasses.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-filter">
            <label>Element:</label>
            <select value={elementFilter} onChange={handleElementFilterChange}>
              <option value="">All Elements</option>
              {monsterElements.map((element) => (
                <option key={element} value={element}>
                  {element}
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
        <LoadingSpinner message="Loading Monster Hunter monsters..." />
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
                  <th onClick={() => handleSort('monster_class')} className="sortable">
                    Class
                    {sortBy === 'monster_class' && (
                      <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                    )}
                  </th>
                  <th>Elements</th>
                  <th>Weaknesses</th>
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
                      <td>{monster.monster_class}</td>
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
                      <td>{monster.weaknesses || '-'}</td>
                      <td className="admin-actions-cell">
                        <Link
                          to={`/admin/monsterhunter-monsters/edit/${monster.id}`}
                          className="admin-action-button edit"
                          title="Edit Monster Hunter Monster"
                        >
                          <i className="fas fa-edit"></i>
                        </Link>
                        <button
                          className="admin-action-button delete"
                          title="Delete Monster Hunter Monster"
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
                      No Monster Hunter monsters found
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

export default MonsterHunterMonsterListPage;
