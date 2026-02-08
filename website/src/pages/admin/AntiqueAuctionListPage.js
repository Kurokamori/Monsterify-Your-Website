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
      <div className="item-icon">
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
        <div className="gift-monster-types">
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
          className="button info sm"
          title="Edit"
        >
          <i className="fas fa-edit"></i>
        </Link>
        <button
          className="button danger sm"
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
        <Link to="/admin/seasonal-adopts/add" className="button primary">
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

        <div className="form-input">
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
                className={`view-toggle-btn${viewMode === 'grouped' ? 'active' : ''}`}
                onClick={() => setViewMode('grouped')}
                title="Grouped View"
              >
                <i className="fas fa-layer-group"></i>
              </button>
              <button
                className={`view-toggle-btn${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="List View"
              >
                <i className="fas fa-list"></i>
              </button>
            </div>
          </div>

          <button className="button secondary" onClick={resetFilters}>
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
        <div className="empty-results">
          <i className="fas fa-box-open"></i>
          <p>No seasonal adopts found</p>
          <Link to="/admin/seasonal-adopts/add" className="button primary">
            Add your first seasonal adopt
          </Link>
        </div>
      ) : viewMode === 'grouped' ? (
        <div className="antique-store-content">
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
                      <small className="no-content">({antiqueHolidayMap[auction.antique] || 'Unknown'})</small>
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
                        className="button info sm"
                        title="Edit"
                      >
                        <i className="fas fa-edit"></i>
                      </Link>
                      <button
                        className="button danger sm"
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
    </div>
  );
};

export default AntiqueAuctionListPage;
