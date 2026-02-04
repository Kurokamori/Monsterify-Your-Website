import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import antiqueService from '../../services/antiqueService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import SearchBar from '../../components/common/SearchBar';
import { toast } from 'react-toastify';

const AntiqueAuctionListPage = () => {
  const [auctions, setAuctions] = useState([]);
  const [antiques, setAntiques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [antiqueFilter, setAntiqueFilter] = useState('');
  const [viewMode, setViewMode] = useState('grouped'); // 'grouped' or 'list'

  // Fetch auctions and antiques dropdown
  const fetchData = async () => {
    try {
      setLoading(true);
      const [auctionsResponse, antiquesResponse] = await Promise.all([
        antiqueService.getAntiqueAuctions(),
        antiqueService.getAllAntiquesDropdown()
      ]);

      setAuctions(auctionsResponse.data || []);
      setAntiques(antiquesResponse.data || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch seasonal adopts. Please try again later.');
      toast.error('Failed to fetch seasonal adopts');
    } finally {
      setLoading(false);
    }
  };

  // Delete auction
  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await antiqueService.deleteAntiqueAuction(id);
        toast.success('Seasonal adopt deleted successfully');
        fetchData();
      } catch (error) {
        console.error('Error deleting auction:', error);
        toast.error('Failed to delete seasonal adopt');
      }
    }
  };

  // Handle search
  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setAntiqueFilter('');
  };

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  // Create antique to holiday mapping
  const antiqueHolidayMap = useMemo(() => {
    const map = {};
    antiques.forEach(a => {
      map[a.name] = a.holiday;
    });
    return map;
  }, [antiques]);

  // Filter auctions
  const filteredAuctions = useMemo(() => {
    return auctions.filter(auction => {
      const matchesSearch = searchTerm === '' ||
        auction.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        auction.species1?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        auction.species2?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        auction.species3?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        auction.creator?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        auction.family?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesAntique = antiqueFilter === '' || auction.antique === antiqueFilter;

      return matchesSearch && matchesAntique;
    });
  }, [auctions, searchTerm, antiqueFilter]);

  // Group auctions by antique and then by family
  const groupedAuctions = useMemo(() => {
    const groups = {};

    filteredAuctions.forEach(auction => {
      const antiqueName = auction.antique || 'Unknown';
      if (!groups[antiqueName]) {
        groups[antiqueName] = {
          holiday: antiqueHolidayMap[antiqueName] || 'Unknown',
          families: {},
          noFamily: []
        };
      }

      if (auction.family) {
        if (!groups[antiqueName].families[auction.family]) {
          groups[antiqueName].families[auction.family] = [];
        }
        groups[antiqueName].families[auction.family].push(auction);
      } else {
        groups[antiqueName].noFamily.push(auction);
      }
    });

    return groups;
  }, [filteredAuctions, antiqueHolidayMap]);

  // Get unique antiques from existing auctions for filter
  const uniqueAntiquesInData = useMemo(() => {
    const unique = [...new Set(auctions.map(a => a.antique))].filter(Boolean);
    return unique.sort();
  }, [auctions]);

  // Render auction card
  const renderAuctionCard = (auction) => (
    <div key={auction.id} className="seasonal-adopt-card">
      <div className="seasonal-adopt-image">
        {auction.image ? (
          <img src={auction.image} alt={auction.name} />
        ) : (
          <div className="no-image">
            <i className="fas fa-image"></i>
          </div>
        )}
      </div>
      <div className="seasonal-adopt-info">
        <h4 className="seasonal-adopt-name">{auction.name}</h4>
        <div className="seasonal-adopt-species">
          <span className="species-tag">{auction.species1}</span>
          {auction.species2 && <span className="species-tag">{auction.species2}</span>}
          {auction.species3 && <span className="species-tag">{auction.species3}</span>}
        </div>
        <div className="seasonal-adopt-types">
          {auction.type1 && <span className={`type-badge type-${auction.type1?.toLowerCase()}`}>{auction.type1}</span>}
          {auction.type2 && <span className={`type-badge type-${auction.type2?.toLowerCase()}`}>{auction.type2}</span>}
          {auction.type3 && <span className={`type-badge type-${auction.type3?.toLowerCase()}`}>{auction.type3}</span>}
          {auction.type4 && <span className={`type-badge type-${auction.type4?.toLowerCase()}`}>{auction.type4}</span>}
          {auction.type5 && <span className={`type-badge type-${auction.type5?.toLowerCase()}`}>{auction.type5}</span>}
        </div>
        <div className="seasonal-adopt-attribute">
          <span className="attribute-badge">{auction.attribute}</span>
        </div>
        {auction.description && (
          <p className="seasonal-adopt-description">{auction.description}</p>
        )}
        <div className="seasonal-adopt-meta">
          <span className="creator">
            <i className="fas fa-user"></i> {auction.creator}
          </span>
        </div>
      </div>
      <div className="seasonal-adopt-actions">
        <Link
          to={`/admin/seasonal-adopts/edit/${auction.id}`}
          className="admin-action-button edit"
          title="Edit"
        >
          <i className="fas fa-edit"></i>
        </Link>
        <button
          className="admin-action-button delete"
          title="Delete"
          onClick={() => handleDelete(auction.id, auction.name)}
        >
          <i className="fas fa-trash"></i>
        </button>
      </div>
    </div>
  );

  return (
    <div className="seasonal-adopts-page">
      <div className="admin-page-header">
        <h1>Seasonal Adopts Management</h1>
        <Link to="/admin/seasonal-adopts/add" className="admin-button">
          <i className="fas fa-plus"></i> Add Seasonal Adopt
        </Link>
      </div>

      <div className="admin-filters">
        <div className="admin-search">
          <SearchBar
            placeholder="Search by name, species, creator, or family..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>

        <div className="admin-filter-group">
          <div className="admin-filter">
            <label>Antique:</label>
            <select value={antiqueFilter} onChange={(e) => setAntiqueFilter(e.target.value)}>
              <option value="">All Antiques</option>
              {uniqueAntiquesInData.map((antique) => (
                <option key={antique} value={antique}>
                  {antique} ({antiqueHolidayMap[antique] || 'Unknown'})
                </option>
              ))}
            </select>
          </div>

          <div className="admin-filter">
            <label>View:</label>
            <div className="view-toggle">
              <button
                className={`view-toggle-btn ${viewMode === 'grouped' ? 'active' : ''}`}
                onClick={() => setViewMode('grouped')}
                title="Grouped View"
              >
                <i className="fas fa-layer-group"></i>
              </button>
              <button
                className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="List View"
              >
                <i className="fas fa-list"></i>
              </button>
            </div>
          </div>

          <button className="admin-button secondary" onClick={resetFilters}>
            Reset Filters
          </button>
        </div>
      </div>

      <div className="stats-bar">
        <span className="stat-item">
          <i className="fas fa-gift"></i> {filteredAuctions.length} Seasonal Adopts
        </span>
        <span className="stat-item">
          <i className="fas fa-archive"></i> {Object.keys(groupedAuctions).length} Antiques
        </span>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading seasonal adopts..." />
      ) : error ? (
        <div className="admin-error">{error}</div>
      ) : filteredAuctions.length === 0 ? (
        <div className="admin-empty-state">
          <i className="fas fa-box-open"></i>
          <p>No seasonal adopts found</p>
          <Link to="/admin/seasonal-adopts/add" className="admin-button">
            Add your first seasonal adopt
          </Link>
        </div>
      ) : viewMode === 'grouped' ? (
        <div className="seasonal-adopts-grouped">
          {Object.entries(groupedAuctions).map(([antiqueName, group]) => (
            <div key={antiqueName} className="antique-group">
              <div className="antique-group-header">
                <h2>
                  <i className="fas fa-gem"></i> {antiqueName}
                  <span className="holiday-badge">{group.holiday}</span>
                </h2>
                <span className="count">
                  {Object.values(group.families).flat().length + group.noFamily.length} adopts
                </span>
              </div>

              <div className="antique-group-content">
                {/* Render families */}
                {Object.entries(group.families).map(([familyName, familyAuctions]) => (
                  <div key={familyName} className="family-group">
                    <h3 className="family-header">
                      <i className="fas fa-sitemap"></i> {familyName} Family
                      <span className="family-count">({familyAuctions.length})</span>
                    </h3>
                    <div className="seasonal-adopts-grid">
                      {familyAuctions.map(renderAuctionCard)}
                    </div>
                  </div>
                ))}

                {/* Render adopts without family */}
                {group.noFamily.length > 0 && (
                  <div className="no-family-group">
                    {Object.keys(group.families).length > 0 && (
                      <h3 className="family-header">
                        <i className="fas fa-paw"></i> Individual Adopts
                        <span className="family-count">({group.noFamily.length})</span>
                      </h3>
                    )}
                    <div className="seasonal-adopts-grid">
                      {group.noFamily.map(renderAuctionCard)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="seasonal-adopts-list">
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Antique</th>
                  <th>Species</th>
                  <th>Types</th>
                  <th>Attribute</th>
                  <th>Family</th>
                  <th>Creator</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAuctions.map((auction) => (
                  <tr key={auction.id}>
                    <td className="admin-table-image-cell">
                      {auction.image ? (
                        <img
                          src={auction.image}
                          alt={auction.name}
                          className="admin-item-thumbnail"
                        />
                      ) : (
                        <div className="no-image-small">
                          <i className="fas fa-image"></i>
                        </div>
                      )}
                    </td>
                    <td>{auction.name}</td>
                    <td>
                      <span className="antique-name">{auction.antique}</span>
                      <br />
                      <small className="holiday-text">({antiqueHolidayMap[auction.antique] || 'Unknown'})</small>
                    </td>
                    <td>
                      {auction.species1}
                      {auction.species2 && ` + ${auction.species2}`}
                      {auction.species3 && ` + ${auction.species3}`}
                    </td>
                    <td>
                      <div className="types-cell">
                        {auction.type1 && <span className={`type-badge-small type-${auction.type1?.toLowerCase()}`}>{auction.type1}</span>}
                        {auction.type2 && <span className={`type-badge-small type-${auction.type2?.toLowerCase()}`}>{auction.type2}</span>}
                        {auction.type3 && <span className={`type-badge-small type-${auction.type3?.toLowerCase()}`}>{auction.type3}</span>}
                        {auction.type4 && <span className={`type-badge-small type-${auction.type4?.toLowerCase()}`}>{auction.type4}</span>}
                        {auction.type5 && <span className={`type-badge-small type-${auction.type5?.toLowerCase()}`}>{auction.type5}</span>}
                      </div>
                    </td>
                    <td>
                      <span className="attribute-badge-small">{auction.attribute}</span>
                    </td>
                    <td>{auction.family || '-'}</td>
                    <td>{auction.creator}</td>
                    <td className="admin-actions-cell">
                      <Link
                        to={`/admin/seasonal-adopts/edit/${auction.id}`}
                        className="admin-action-button edit"
                        title="Edit"
                      >
                        <i className="fas fa-edit"></i>
                      </Link>
                      <button
                        className="admin-action-button delete"
                        title="Delete"
                        onClick={() => handleDelete(auction.id, auction.name)}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style jsx>{`
        .seasonal-adopts-page {
          padding: 20px;
        }

        .stats-bar {
          display: flex;
          gap: 20px;
          margin-bottom: 20px;
          padding: 10px 15px;
          background: var(--bg-secondary);
          border-radius: 8px;
        }

        .stats-bar .stat-item {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-secondary);
        }

        .stats-bar .stat-item i {
          color: var(--primary-color);
        }

        .view-toggle {
          display: flex;
          gap: 4px;
          background: var(--bg-tertiary);
          padding: 4px;
          border-radius: 6px;
        }

        .view-toggle-btn {
          padding: 6px 12px;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .view-toggle-btn:hover {
          background: var(--bg-hover);
        }

        .view-toggle-btn.active {
          background: var(--primary-color);
          color: white;
        }

        .seasonal-adopts-grouped {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }

        .antique-group {
          background: var(--bg-secondary);
          border-radius: 12px;
          overflow: hidden;
        }

        .antique-group-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          background: var(--bg-tertiary);
          border-bottom: 1px solid var(--border-color);
        }

        .antique-group-header h2 {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0;
          font-size: 1.25rem;
        }

        .antique-group-header h2 i {
          color: var(--primary-color);
        }

        .holiday-badge {
          font-size: 0.75rem;
          padding: 4px 10px;
          background: var(--primary-color);
          color: white;
          border-radius: 12px;
          font-weight: normal;
        }

        .holiday-text {
          color: var(--text-muted);
          font-style: italic;
        }

        .antique-group-header .count {
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        .antique-group-content {
          padding: 20px;
        }

        .family-group {
          margin-bottom: 25px;
        }

        .family-group:last-child {
          margin-bottom: 0;
        }

        .family-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 15px 0;
          padding-bottom: 10px;
          border-bottom: 1px solid var(--border-color);
          font-size: 1rem;
          color: var(--text-secondary);
        }

        .family-header i {
          color: var(--secondary-color);
        }

        .family-count {
          font-size: 0.85rem;
          color: var(--text-muted);
          font-weight: normal;
        }

        .seasonal-adopts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }

        .seasonal-adopt-card {
          background: var(--bg-primary);
          border-radius: 10px;
          border: 1px solid var(--border-color);
          overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .seasonal-adopt-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .seasonal-adopt-image {
          height: 180px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-tertiary);
          overflow: hidden;
        }

        .seasonal-adopt-image img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .seasonal-adopt-image .no-image {
          color: var(--text-muted);
          font-size: 3rem;
        }

        .seasonal-adopt-info {
          padding: 15px;
        }

        .seasonal-adopt-name {
          margin: 0 0 10px 0;
          font-size: 1.1rem;
        }

        .seasonal-adopt-species {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
          margin-bottom: 10px;
        }

        .species-tag {
          font-size: 0.8rem;
          padding: 2px 8px;
          background: var(--bg-tertiary);
          border-radius: 4px;
          color: var(--text-secondary);
        }

        .seasonal-adopt-types {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
          margin-bottom: 8px;
        }

        .type-badge {
          font-size: 0.75rem;
          padding: 3px 8px;
          border-radius: 4px;
          color: white;
          text-transform: capitalize;
        }

        .type-badge-small {
          font-size: 0.65rem;
          padding: 2px 6px;
          border-radius: 3px;
          color: white;
          text-transform: capitalize;
          display: inline-block;
          margin: 1px;
        }

        .types-cell {
          display: flex;
          flex-wrap: wrap;
          gap: 2px;
        }

        .attribute-badge {
          font-size: 0.8rem;
          padding: 3px 10px;
          background: var(--primary-color);
          color: white;
          border-radius: 4px;
          display: inline-block;
        }

        .attribute-badge-small {
          font-size: 0.7rem;
          padding: 2px 6px;
          background: var(--primary-color);
          color: white;
          border-radius: 3px;
        }

        .seasonal-adopt-description {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin: 10px 0;
          font-style: italic;
        }

        .seasonal-adopt-meta {
          display: flex;
          align-items: center;
          gap: 15px;
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid var(--border-color);
        }

        .seasonal-adopt-meta i {
          margin-right: 5px;
        }

        .seasonal-adopt-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          padding: 10px 15px;
          background: var(--bg-tertiary);
          border-top: 1px solid var(--border-color);
        }

        .no-image-small {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-tertiary);
          border-radius: 4px;
          color: var(--text-muted);
        }

        .antique-name {
          font-weight: 500;
        }

        .admin-empty-state {
          text-align: center;
          padding: 60px 20px;
          background: var(--bg-secondary);
          border-radius: 12px;
        }

        .admin-empty-state i {
          font-size: 4rem;
          color: var(--text-muted);
          margin-bottom: 20px;
        }

        .admin-empty-state p {
          color: var(--text-secondary);
          margin-bottom: 20px;
        }

        /* Type colors */
        .type-normal { background: #A8A878; }
        .type-fire { background: #F08030; }
        .type-water { background: #6890F0; }
        .type-electric { background: #F8D030; color: #333; }
        .type-grass { background: #78C850; }
        .type-ice { background: #98D8D8; color: #333; }
        .type-fighting { background: #C03028; }
        .type-poison { background: #A040A0; }
        .type-ground { background: #E0C068; color: #333; }
        .type-flying { background: #A890F0; }
        .type-psychic { background: #F85888; }
        .type-bug { background: #A8B820; }
        .type-rock { background: #B8A038; }
        .type-ghost { background: #705898; }
        .type-dragon { background: #7038F8; }
        .type-dark { background: #705848; }
        .type-steel { background: #B8B8D0; color: #333; }
        .type-fairy { background: #EE99AC; color: #333; }
      `}</style>
    </div>
  );
};

export default AntiqueAuctionListPage;
