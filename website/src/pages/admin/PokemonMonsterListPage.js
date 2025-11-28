import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import monsterTypesApi from '../../services/monsterTypesApi';
import AdminLayout from '../../components/layouts/AdminLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination';
import SearchBar from '../../components/common/SearchBar';
import { toast } from 'react-toastify';

const PokemonMonsterListPage = () => {
  const [monsters, setMonsters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('ndex');
  const [sortOrder, setSortOrder] = useState('asc');
  const [typeFilter, setTypeFilter] = useState('');
  const [legendaryFilter, setLegendaryFilter] = useState('');
  const [mythicalFilter, setMythicalFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');

  // Pokemon types for filter dropdown
  const pokemonTypes = [
    'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison',
    'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark',
    'Steel', 'Fairy'
  ];

  // Evolution stages for filter dropdown
  const evolutionStages = [
    'Base Stage', 'Middle Stage', 'Final Stage', "Doesn't Evolve"
  ];

  // Fetch Pokemon monsters
  const fetchMonsters = async () => {
    try {
      setLoading(true);
      const response = await monsterTypesApi.getPokemonMonsters({
        page: currentPage,
        limit: 10,
        search: searchTerm,
        sortBy,
        sortOrder,
        type: typeFilter,
        legendary: legendaryFilter,
        mythical: mythicalFilter,
        stage: stageFilter
      });

      setMonsters(response.data);
      setTotalPages(response.pagination.totalPages);
      setError(null);
    } catch (error) {
      console.error('Error fetching Pokemon monsters:', error);
      setError('Failed to fetch Pokemon monsters. Please try again later.');
      toast.error('Failed to fetch Pokemon monsters');
    } finally {
      setLoading(false);
    }
  };

  // Delete Pokemon monster
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this Pokemon monster?')) {
      try {
        await monsterTypesApi.deletePokemonMonster(id);
        toast.success('Pokemon monster deleted successfully');
        fetchMonsters();
      } catch (error) {
        console.error('Error deleting Pokemon monster:', error);
        toast.error('Failed to delete Pokemon monster');
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

  const handleMythicalFilterChange = (e) => {
    setMythicalFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleStageFilterChange = (e) => {
    setStageFilter(e.target.value);
    setCurrentPage(1);
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setSortBy('ndex');
    setSortOrder('asc');
    setTypeFilter('');
    setLegendaryFilter('');
    setMythicalFilter('');
    setStageFilter('');
    setCurrentPage(1);
  };

  // Fetch monsters when dependencies change
  useEffect(() => {
    fetchMonsters();
  }, [currentPage, searchTerm, sortBy, sortOrder, typeFilter, legendaryFilter, mythicalFilter, stageFilter]);

  return (
    <div>
      <div className="admin-page-header">
        <h1>Pokemon Monsters</h1>
        <Link to="/admin/pokemon-monsters/add" className="admin-button">
          <i className="fas fa-plus"></i> Add Pokemon Monster
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
              {pokemonTypes.map((type) => (
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
            <label>Mythical:</label>
            <select value={mythicalFilter} onChange={handleMythicalFilterChange}>
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

          <button className="admin-button secondary" onClick={resetFilters}>
            Reset Filters
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading Pokemon monsters..." />
      ) : error ? (
        <div className="admin-error">{error}</div>
      ) : (
        <>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="admin-table-image-cell">Image</th>
                  <th onClick={() => handleSort('ndex')} className="sortable">
                    #
                    {sortBy === 'ndex' && (
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
                  <th>Special</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {monsters.length > 0 ? (
                  monsters.map((monster) => (
                    <tr key={monster.id}>
                      <td className="admin-table-image-cell">
                        <img
                          src={monster.image_url || '/images/placeholder-pokemon.png'}
                          alt={monster.name}
                          className="admin-monster-thumbnail"
                        />
                      </td>
                      <td>{monster.ndex}</td>
                      <td>{monster.name}</td>
                      <td>
                        <div className="monster-types">
                          <span className={`monster-type type-${monster.type_primary.toLowerCase()}`}>
                            {monster.type_primary}
                          </span>
                          {monster.type_secondary && (
                            <span className={`monster-type type-${monster.type_secondary.toLowerCase()}`}>
                              {monster.type_secondary}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>{monster.stage}</td>
                      <td>
                        {monster.is_legendary && <span className="monster-badge legendary">Legendary</span>}
                        {monster.is_mythical && <span className="monster-badge mythical">Mythical</span>}
                      </td>
                      <td className="admin-actions-cell">
                        <Link
                          to={`/admin/pokemon-monsters/edit/${monster.id}`}
                          className="admin-action-button edit"
                          title="Edit Pokemon Monster"
                        >
                          <i className="fas fa-edit"></i>
                        </Link>
                        <button
                          className="admin-action-button delete"
                          title="Delete Pokemon Monster"
                          onClick={() => handleDelete(monster.id)}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="admin-table-empty">
                      No Pokemon monsters found
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

export default PokemonMonsterListPage;
