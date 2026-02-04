import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import fakemonService from '../../services/fakemonService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { FAKEMON_CATEGORIES } from '../../data/trainerFormOptions';

const FakemonDexPage = () => {
  useDocumentTitle('Fakedex');
  
  const [fakemon, setFakemon] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedType, setSelectedType] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedAttribute, setSelectedAttribute] = useState('');
  const [types, setTypes] = useState([]);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [showAttributeFilter, setShowAttributeFilter] = useState(false);
  const [showTypeFilter, setShowTypeFilter] = useState(false);

  useEffect(() => {
    fetchFakemonTypes();
    fetchFakemon();
  }, [currentPage, selectedType, selectedCategory, selectedAttribute]);

  const fetchFakemonTypes = async () => {
    try {
      const response = await fakemonService.getAllTypes();
      setTypes(response.types || []);
    } catch (err) {
      console.error('Error fetching fakemon types:', err);
    }
  };

  const fetchFakemon = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 36, // Increased for smaller cards
        type: selectedType || undefined,
        category: selectedCategory || undefined,
        attribute: selectedAttribute || undefined,
        search: searchTerm || undefined
      };

      const response = await fakemonService.getAllFakemon(params);

      console.log('Fakemon response:', response); // Debug log
      setFakemon(response.fakemon || []);
      setTotalPages(response.totalPages || 1);
    } catch (err) {
      console.error('Error fetching fakemon:', err);
      setError('Failed to load fakemon. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchFakemon();
  };

  const handleTypeChange = (type) => {
    setSelectedType(type);
    setCurrentPage(1);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const handleAttributeChange = (attribute) => {
    setSelectedAttribute(attribute);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Fallback data for development
  const fallbackFakemon = [
    {
      number: 1,
      name: 'Leafeon',
      category: 'Pokemon',
      attribute: 'Data',
      image_path: 'https://via.placeholder.com/120/1e2532/d6a339?text=Fakemon+1',
      types: ['Grass'],
      displayNumber: '001'
    },
    {
      number: 2,
      name: 'Flameon',
      category: 'Digimon',
      attribute: 'Vaccine',
      image_path: 'https://via.placeholder.com/120/1e2532/d6a339?text=Fakemon+2',
      types: ['Fire'],
      displayNumber: '002'
    },
    {
      number: 3,
      name: 'Aqueon',
      category: 'Yokai',
      attribute: 'Variable',
      image_path: 'https://via.placeholder.com/120/1e2532/d6a339?text=Fakemon+3',
      types: ['Water'],
      displayNumber: '003'
    },
    {
      number: 4,
      name: 'Zappeon',
      category: 'Nexomon',
      attribute: 'Free',
      image_path: 'https://via.placeholder.com/120/1e2532/d6a339?text=Fakemon+4',
      types: ['Electric'],
      displayNumber: '004'
    },
    {
      number: 5,
      name: 'Psycheon',
      category: 'Palmon',
      attribute: 'Virus',
      image_path: 'https://via.placeholder.com/120/1e2532/d6a339?text=Fakemon+5',
      types: ['Psychic'],
      displayNumber: '005'
    },
    {
      number: 6,
      name: 'Darkon',
      category: 'Pokemon',
      attribute: 'Data',
      image_path: 'https://via.placeholder.com/120/1e2532/d6a339?text=Fakemon+6',
      types: ['Dark'],
      displayNumber: '006'
    }
  ];

  const fallbackTypes = [
    'Normal', 'Fire', 'Water', 'Grass', 'Electric', 'Ice',
    'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
    'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'
  ];

  const categories = FAKEMON_CATEGORIES;
  const attributes = ['Data', 'Vaccine', 'Variable', 'Free', 'Virus'];

  // Process fakemon data to ensure each has a types array and formatted number
  const processedFakemon = fakemon.map(mon => {
    // Create types array from type1, type2, etc. fields
    const types = [mon.type1, mon.type2, mon.type3, mon.type4, mon.type5]
      .filter(Boolean); // Remove null/undefined values

    // Ensure number is properly handled (could be string or number from DB)
    const numberValue = parseInt(mon.number) || mon.id || 1;
    const formattedNumber = String(numberValue).padStart(3, '0');

    return {
      ...mon,
      number: numberValue, // Ensure it's a number for routing
      displayNumber: formattedNumber, // For display purposes
      types: types,
      // Use image_url if available, otherwise use image_path
      image_path: mon.image_url || mon.image_path || 'https://via.placeholder.com/120/1e2532/d6a339?text=No+Image'
    };
  });

  const displayFakemon = fakemon.length > 0 ? processedFakemon : fallbackFakemon;
  const displayTypes = types.length > 0 ? types : fallbackTypes;

  return (
    <div className="fakedex-container">
      <div className="fakedex-header">
        <h1>Fakemon Dex</h1>
        <p>Discover all the unique fakemon in the world</p>
      </div>

      <div className="fakedex-controls">
        <div className="fakedex-controls-inner">
          <div className="search-and-toggles">
            <form className="search-form" onSubmit={handleSearch}>
              <div className="search-input">
                <input
                  type="text"
                  placeholder="Search fakemon..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button type="submit">
                  <i className="fas fa-search"></i>
                </button>
              </div>
            </form>

            <div className="filter-toggles">
              <button
                className={`filter-toggle ${showCategoryFilter ? 'active' : ''}`}
                onClick={() => setShowCategoryFilter(!showCategoryFilter)}
              >
                <i className="fas fa-layer-group"></i>
                Category
                {selectedCategory && <span className="filter-count">1</span>}
              </button>
              <button
                className={`filter-toggle ${showAttributeFilter ? 'active' : ''}`}
                onClick={() => setShowAttributeFilter(!showAttributeFilter)}
              >
                <i className="fas fa-tags"></i>
                Attribute
                {selectedAttribute && <span className="filter-count">1</span>}
              </button>
              <button
                className={`filter-toggle ${showTypeFilter ? 'active' : ''}`}
                onClick={() => setShowTypeFilter(!showTypeFilter)}
              >
                <i className="fas fa-fire"></i>
                Type
                {selectedType && <span className="filter-count">1</span>}
              </button>
            </div>
          </div>

          <div className="filters-container">
            {/* Category Filters */}
            {showCategoryFilter && (
              <div className="filter-section">
                <div className="filter-buttons">
                  <button
                    className={`filter-button ${selectedCategory === '' ? 'active' : ''}`}
                    onClick={() => handleCategoryChange('')}
                  >
                    All Categories
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category}
                      className={`filter-button category-${category.toLowerCase()} ${selectedCategory === category ? 'active' : ''}`}
                      onClick={() => handleCategoryChange(category)}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Attribute Filters */}
            {showAttributeFilter && (
              <div className="filter-section">
                <div className="filter-buttons">
                  <button
                    className={`filter-button ${selectedAttribute === '' ? 'active' : ''}`}
                    onClick={() => handleAttributeChange('')}
                  >
                    All Attributes
                  </button>
                  {attributes.map((attribute) => (
                    <button
                      key={attribute}
                      className={`filter-button attribute-${attribute.toLowerCase()} ${selectedAttribute === attribute ? 'active' : ''}`}
                      onClick={() => handleAttributeChange(attribute)}
                    >
                      {attribute}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Type Filters */}
            {showTypeFilter && (
              <div className="filter-section">
                <div className="filter-buttons type-filters">
                  <button
                    className={`filter-button ${selectedType === '' ? 'active' : ''}`}
                    onClick={() => handleTypeChange('')}
                  >
                    All Types
                  </button>
                  {displayTypes.map((type) => (
                    <button
                      key={type}
                      className={`filter-button type-${type.toLowerCase()} ${selectedType === type ? 'active' : ''}`}
                      onClick={() => handleTypeChange(type)}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading fakemon..." />
      ) : error ? (
        <ErrorMessage
          message={error}
          onRetry={fetchFakemon}
        />
      ) : (
        <>
          <div className="fakedex-grid">
            {displayFakemon.map((mon) => (
              <Link to={`/fakedex/${mon.number}`} className="fakemon-card" key={mon.number}>
                <div>
                  <img
                    src={mon.image_path}
                    alt={mon.name}
                    className="fakemon-image"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/default_mon.png';
                    }}
                  />
                </div>
                <div className="fakemon-info">
                  <span className="dex-number">#{mon.displayNumber || String(mon.number).padStart(3, '0')}</span>
                  <h3 className="dex-name">{mon.name}</h3>
                  <div className="types-container">
                    {mon.types && mon.types.length > 0 ? (
                      mon.types.map((type, index) => (
                        <span className={`type-badge type-${type.toLowerCase()}`} key={index}>
                          {type}
                        </span>
                      ))
                    ) : (
                      <span className="type-badge type-normal">Unknown</span>
                    )}
                  </div>
                  {mon.category && (
                    <div className="fakemon-category">
                      <span className="category-label">Category:</span> {mon.category}
                    </div>
                  )}
                  {mon.classification && (
                    <div className="fakemon-classification">
                      {mon.classification}
                    </div>
                  )}
                  {mon.attribute && (
                    <div className="fakemon-attribute">
                      <span className="attribute-label">Attribute:</span> {mon.attribute}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-button"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                <i className="fas fa-chevron-left"></i>
              </button>

              {[...Array(totalPages).keys()].map((page) => (
                <button
                  key={page + 1}
                  className={`pagination-button ${currentPage === page + 1 ? 'active' : ''}`}
                  onClick={() => handlePageChange(page + 1)}
                >
                  {page + 1}
                </button>
              ))}

              <button
                className="pagination-button"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FakemonDexPage;
