import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import ErrorMessage from '../../../components/common/ErrorMessage';
import TrainerSelector from '../../../components/common/TrainerSelector';
import Pagination from '../../../components/common/Pagination';
import TypeBadge from '../../../components/monsters/TypeBadge';
import AttributeBadge from '../../../components/monsters/AttributeBadge';
import AntiqueAppraisal from '../../../components/town/AntiqueAppraisal';
import AntiqueAuction from '../../../components/town/AntiqueAuction';
import antiqueService from '../../../services/antiqueService';
import trainerService from '../../../services/trainerService';

const AntiqueStore = () => {
  const { isAuthenticated, currentUser } = useAuth();
  const navigate = useNavigate();

  // Main view state
  const [activeView, setActiveView] = useState('inventory'); // 'inventory' or 'catalogue'

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // User data states
  const [userTrainers, setUserTrainers] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [trainerAntiques, setTrainerAntiques] = useState([]);
  const [selectedAntique, setSelectedAntique] = useState(null);

  // Modal states
  const [showAppraisalModal, setShowAppraisalModal] = useState(false);
  const [showAuctionModal, setShowAuctionModal] = useState(false);

  // Catalogue states
  const [catalogueData, setCatalogueData] = useState([]);
  const [catalogueLoading, setCatalogueLoading] = useState(false);
  const [catalogueFilters, setCatalogueFilters] = useState({
    antiques: [],
    holidays: [],
    types: [],
    creators: []
  });
  const [selectedFilters, setSelectedFilters] = useState({
    antique: '',
    holiday: '',
    species: '',
    type: '',
    creator: ''
  });
  const [cataloguePagination, setCataloguePagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1
  });

  // Image popout state
  const [showImagePopout, setShowImagePopout] = useState(false);
  const [popoutImage, setPopoutImage] = useState({ url: '', name: '' });

  // Fetch trainer antiques when trainer is selected
  useEffect(() => {
    if (selectedTrainer) {
      fetchTrainerAntiques(selectedTrainer);
    }
  }, [selectedTrainer]);

  // Fetch user trainers on component mount
  useEffect(() => {
    const fetchUserTrainers = async () => {
      try {
        setLoading(true);
        const userId = currentUser?.discord_id;
        const response = await trainerService.getUserTrainers(userId);
        if (response.success && response.trainers) {
          setUserTrainers(response.trainers);
          if (response.trainers.length > 0) {
            setSelectedTrainer(response.trainers[0].id.toString());
          }
        }
      } catch (err) {
        console.error('Error fetching user trainers:', err);
        setError('Failed to fetch trainers');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchUserTrainers();
    } else {
      navigate('/login?redirect=/town/visit/antique-store');
    }
  }, [isAuthenticated, currentUser, navigate]);

  // Fetch catalogue filters when switching to catalogue view
  useEffect(() => {
    if (activeView === 'catalogue' && catalogueFilters.antiques.length === 0) {
      fetchCatalogueFilters();
    }
  }, [activeView]);

  // Fetch catalogue data when filters or pagination change
  useEffect(() => {
    if (activeView === 'catalogue') {
      fetchCatalogueData();
    }
  }, [activeView, selectedFilters, cataloguePagination.page]);

  // Fetch trainer antiques
  const fetchTrainerAntiques = async (trainerId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await antiqueService.getTrainerAntiques(trainerId);
      setTrainerAntiques(response.data || []);
    } catch (err) {
      console.error('Error fetching trainer antiques:', err);
      setError(err.response?.data?.message || 'Failed to fetch trainer antiques');
    } finally {
      setLoading(false);
    }
  };

  // Fetch catalogue filters
  const fetchCatalogueFilters = async () => {
    try {
      const response = await antiqueService.getCatalogueFilters();
      if (response.success && response.data) {
        setCatalogueFilters({
          antiques: response.data.antiques || [],
          holidays: response.data.holidays || [],
          types: response.data.types || [],
          creators: response.data.creators || []
        });
      }
    } catch (err) {
      console.error('Error fetching catalogue filters:', err);
    }
  };

  // Fetch catalogue data
  const fetchCatalogueData = async () => {
    try {
      setCatalogueLoading(true);

      const response = await antiqueService.getAuctionCatalogue({
        ...selectedFilters,
        page: cataloguePagination.page,
        limit: cataloguePagination.limit
      });

      if (response.success) {
        setCatalogueData(response.data || []);
        if (response.pagination) {
          setCataloguePagination(prev => ({
            ...prev,
            total: response.pagination.total,
            totalPages: response.pagination.totalPages
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching catalogue data:', err);
    } finally {
      setCatalogueLoading(false);
    }
  };

  // Handle trainer selection
  const handleTrainerChange = (trainerId) => {
    setSelectedTrainer(trainerId);
  };

  // Handle appraise button click
  const handleAppraiseClick = (antique) => {
    setSelectedAntique(antique);
    setShowAppraisalModal(true);
  };

  // Handle auction button click
  const handleAuctionClick = (antique) => {
    setSelectedAntique(antique);
    setShowAuctionModal(true);
  };

  // Close appraisal modal
  const closeAppraisalModal = () => {
    setShowAppraisalModal(false);
    setSelectedAntique(null);
    // Refresh antiques after appraisal
    if (selectedTrainer) {
      fetchTrainerAntiques(selectedTrainer);
    }
  };

  // Close auction modal
  const closeAuctionModal = () => {
    setShowAuctionModal(false);
    setSelectedAntique(null);
    // Refresh antiques after auction
    if (selectedTrainer) {
      fetchTrainerAntiques(selectedTrainer);
    }
  };

  // Handle filter change
  const handleFilterChange = (filterName, value) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
    setCataloguePagination(prev => ({ ...prev, page: 1 }));
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedFilters({
      antique: '',
      holiday: '',
      species: '',
      type: '',
      creator: ''
    });
    setCataloguePagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle catalogue page change
  const handleCataloguePageChange = (newPage) => {
    setCataloguePagination(prev => ({ ...prev, page: newPage }));
  };

  // Open image popout
  const openImagePopout = useCallback((imageUrl, name) => {
    if (!imageUrl) return;
    setPopoutImage({ url: imageUrl, name });
    setShowImagePopout(true);
    document.body.style.overflow = 'hidden';
  }, []);

  // Close image popout
  const closeImagePopout = useCallback(() => {
    setShowImagePopout(false);
    setPopoutImage({ url: '', name: '' });
    document.body.style.overflow = '';
  }, []);

  // Get antique display name with holiday
  const getAntiqueDisplayName = (antique) => {
    const antiqueData = catalogueFilters.antiques.find(a => a.name === antique.antique);
    if (antiqueData && antiqueData.holiday) {
      const holiday = antiqueData.holiday;
      return `${antique.antique} (${holiday})`;
    }
    return antique.antique;
  };

  // Get species display string
  const getSpeciesDisplay = (option) => {
    const species = [option.species1, option.species2, option.species3].filter(Boolean);
    return species.join(' + ');
  };

  // Get types array from option
  const getTypes = (option) => {
    return [option.type1, option.type2, option.type3, option.type4, option.type5].filter(Boolean);
  };

  // Render antique items (inventory view)
  const renderAntiqueItems = () => {
    if (trainerAntiques.length === 0) {
      return (
        <div className="no-antiques-message">
          <p>This trainer doesn't have any antiques.</p>
          <p>Antiques can be obtained from special events, shops, or as rewards for activities.</p>
        </div>
      );
    }

    return (
      <div className="antique-items-grid">
        {trainerAntiques.map((antique, index) => (
          <div
            key={`antique-${index}`}
            className="antique-item"
          >
            <div className="antique-item-image">
              <img
                src={`/images/items/antiques/${antique.name.toLowerCase().replace(/\s+/g, '_')}.png`}
                alt={antique.name}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/images/default_item.png';
                }}
              />
            </div>
            <div className="antique-item-info">
              <h4>{antique.name}</h4>
              <p>Quantity: {antique.quantity}</p>
            </div>
            <div className="antique-item-actions">
              <button
                className="button primary"
                onClick={() => handleAppraiseClick(antique)}
              >
                Appraise
              </button>
              <button
                className="button secondary"
                onClick={() => handleAuctionClick(antique)}
              >
                Auction
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render catalogue view
  const renderCatalogue = () => {
    return (
      <div className="catalogue-container">
        {/* Filters */}
        <div className="catalogue-filters">
          <div className="filter-group">
            <label>Antique:</label>
            <select
              value={selectedFilters.antique}
              onChange={(e) => handleFilterChange('antique', e.target.value)}
            >
              <option value="">All Antiques</option>
              {catalogueFilters.antiques.map((antique, index) => (
                <option key={index} value={antique.name}>
                  {antique.name} ({antique.holiday || 'Unknown'})
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Species:</label>
            <input
              type="text"
              value={selectedFilters.species}
              onChange={(e) => handleFilterChange('species', e.target.value)}
              placeholder="Search species..."
            />
          </div>

          <div className="filter-group">
            <label>Type:</label>
            <select
              value={selectedFilters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
            >
              <option value="">All Types</option>
              {catalogueFilters.types.map((type, index) => (
                <option key={index} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Creator:</label>
            <select
              value={selectedFilters.creator}
              onChange={(e) => handleFilterChange('creator', e.target.value)}
            >
              <option value="">All Creators</option>
              {catalogueFilters.creators.map((creator, index) => (
                <option key={index} value={creator}>{creator}</option>
              ))}
            </select>
          </div>

          <button className="button secondary button danger" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>

        {/* Catalogue Grid */}
        {catalogueLoading ? (
          <LoadingSpinner />
        ) : catalogueData.length === 0 ? (
          <div className="no-catalogue-message">
            <p>No monsters found matching your filters.</p>
            <p>Try adjusting your search criteria.</p>
          </div>
        ) : (
          <>
            <div className="catalogue-grid">
              {catalogueData.map((item) => (
                <div key={item.id} className="catalogue-card">
                  {/* Monster Image */}
                  {item.image && (
                    <div
                      className="catalogue-card-image"
                      onClick={() => openImagePopout(item.image, item.name || item.species1)}
                      title="Click to enlarge"
                    >
                      <img
                        src={item.image}
                        alt={item.name || item.species1}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                        }}
                      />
                      <span className="image-zoom-hint">Click to enlarge</span>
                    </div>
                  )}

                  {/* Monster Name */}
                  <div className="catalogue-card-name">
                    <h4>{item.name || getSpeciesDisplay(item)}</h4>
                  </div>

                  {/* Antique (with holiday) */}
                  <div className="catalogue-card-antique">
                    <span className="label">Item:</span> {getAntiqueDisplayName(item)}
                  </div>

                  {/* Species */}
                  <div className="catalogue-card-species">
                    <span className="label">Species:</span> {getSpeciesDisplay(item)}
                  </div>

                  {/* Types */}
                  <div className="catalogue-card-types">
                    {getTypes(item).map((type, index) => (
                      <TypeBadge key={index} type={type} />
                    ))}
                  </div>

                  {/* Attribute */}
                  {item.attribute && (
                    <div className="catalogue-card-attribute">
                      <AttributeBadge attribute={item.attribute} />
                    </div>
                  )}

                  {/* Creator */}
                  {item.creator && (
                    <div className="catalogue-card-creator">
                      <span className="label">Artist:</span> {item.creator}
                    </div>
                  )}

                  {/* Description */}
                  {item.description && (
                    <div className="catalogue-card-description">
                      <p>{item.description}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {cataloguePagination.totalPages > 1 && (
              <Pagination
                currentPage={cataloguePagination.page}
                totalPages={cataloguePagination.totalPages}
                onPageChange={handleCataloguePageChange}
              />
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="antique-store-container">
      <div className="antique-store-header">
        <h1>Antique Store</h1>
        <p className="antique-store-description">
          Welcome to the Antique Store! Here you can appraise your antiques for a random monster roll
          or auction them for a specific monster.
        </p>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* View Toggle */}
      <div className="antique-store-tabs">
        <button
          className={`button tab ${activeView === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveView('inventory')}
        >
          My Inventory
        </button>
        <button
          className={`button tab ${activeView === 'catalogue' ? 'active' : ''}`}
          onClick={() => setActiveView('catalogue')}
        >
          Explore Catalogue
        </button>
      </div>

      <div className="antique-store-content">
        {activeView === 'inventory' ? (
          <>
            {/* Trainer Selection */}
            <div className="trainer-selection">
              <TrainerSelector
                selectedTrainerId={selectedTrainer}
                onChange={handleTrainerChange}
                trainers={userTrainers}
              />
            </div>

            {loading ? (
              <LoadingSpinner />
            ) : selectedTrainer ? (
              <div className="antiques-section">
                <h2>Your Antiques</h2>
                {renderAntiqueItems()}
              </div>
            ) : (
              <div className="select-trainer-message">
                <p>Please select a trainer to view their antiques.</p>
              </div>
            )}
          </>
        ) : (
          renderCatalogue()
        )}
      </div>

      {/* Appraisal Modal */}
      {showAppraisalModal && selectedAntique && (
        <AntiqueAppraisal
          trainerId={selectedTrainer}
          antique={selectedAntique.name}
          onClose={closeAppraisalModal}
        />
      )}

      {/* Auction Modal */}
      {showAuctionModal && selectedAntique && (
        <AntiqueAuction
          trainerId={selectedTrainer}
          antique={selectedAntique.name}
          onClose={closeAuctionModal}
          userTrainers={userTrainers}
        />
      )}

      {/* Image Popout Modal */}
      {showImagePopout && ReactDOM.createPortal(
        <div
          className="image-popout-overlay"
          onClick={closeImagePopout}
        >
          <div className="image-popout-content" onClick={e => e.stopPropagation()}>
            <button className="image-popout-close" onClick={closeImagePopout}>
              &times;
            </button>
            <img
              src={popoutImage.url}
              alt={popoutImage.name}
              className="image-popout-image"
            />
            <p className="image-popout-caption">{popoutImage.name}</p>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AntiqueStore;
