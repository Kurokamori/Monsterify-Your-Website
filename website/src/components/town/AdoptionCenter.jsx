import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useAuth } from '../../contexts/AuthContext';
import adoptionService from '../../services/adoptionService';
import trainerService from '../../services/trainerService';
import speciesService from '../../services/speciesService';
import evolutionCacheService from '../../services/evolutionCacheService';
import submissionService from '../../services/submissionService';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import Modal from '../common/Modal';
import Pagination from '../common/Pagination';
import TypeBadge from '../monsters/TypeBadge';
import AttributeBadge from '../monsters/AttributeBadge';
import TrainerAutocomplete from '../common/TrainerAutocomplete';
import AdoptionItemModal from './AdoptionItemModal';


const AdoptionCenter = () => {
  const { isAuthenticated, currentUser } = useAuth();
  const currentUserId = currentUser?.discord_id;

  // State for adoption center data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adopts, setAdopts] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 10
  });

  // State for user trainers
  const [userTrainers, setUserTrainers] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [trainerDaypasses, setTrainerDaypasses] = useState({});

  // State for adoption modal
  const [selectedAdopt, setSelectedAdopt] = useState(null);
  const [showAdoptModal, setShowAdoptModal] = useState(false);
  const [monsterName, setMonsterName] = useState('');
  const [adoptionLoading, setAdoptionLoading] = useState(false);
  const [adoptionSuccess, setAdoptionSuccess] = useState(false);
  const [adoptionError, setAdoptionError] = useState('');
  const [adoptedMonster, setAdoptedMonster] = useState(null);

  // State for item modal (berries and pastries)
  const [showItemModal, setShowItemModal] = useState(false);
  const [availableBerries, setAvailableBerries] = useState({});
  const [availablePastries, setAvailablePastries] = useState({});

  // State for view options
  const [showCurrentMonthOnly, setShowCurrentMonthOnly] = useState(true);
  const [monthsWithData, setMonthsWithData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  // State for species images
  const [speciesImages, setSpeciesImages] = useState({});

  // State for image popout modal
  const [showImagePopout, setShowImagePopout] = useState(false);
  const [popoutImage, setPopoutImage] = useState({ url: '', species: '' });

  // State for artwork selector
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const [userArtworks, setUserArtworks] = useState([]);
  const [artworksLoading, setArtworksLoading] = useState(false);
  const [artworksPagination, setArtworksPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 8
  });
  const [artworkSearchQuery, setArtworkSearchQuery] = useState('');

  // Load adopts and user trainers on component mount
  useEffect(() => {
    fetchData();
  }, [pagination.page, showCurrentMonthOnly, selectedYear, selectedMonth]);

  // Load user trainers when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserTrainers(currentUserId);
    }
  }, [isAuthenticated, currentUserId]);

  // Fetch adoption center data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch months with data
      if (monthsWithData.length === 0) {
        await fetchMonthsWithData();
      }

      // Fetch adopts based on view options
      let response;
      if (showCurrentMonthOnly) {
        response = await adoptionService.getCurrentMonthAdopts({
          page: pagination.page,
          limit: pagination.limit
        });
      } else {
        response = await adoptionService.getAdoptsByYearAndMonth(
          selectedYear,
          selectedMonth,
          {
            page: pagination.page,
            limit: pagination.limit
          }
        );
      }

      if (response.success) {
        const adoptsList = response.adopts || [];
        setAdopts(adoptsList);
        setPagination({
          ...pagination,
          total: response.total || 0,
          totalPages: response.pagination?.totalPages || 1
        });
        // Fetch species images for the adopts
        fetchSpeciesImages(adoptsList);
      } else {
        setError(response.message || 'Failed to load adoption data');
      }
    } catch (err) {
      console.error('Error fetching adoption center data:', err);
      let errorMessage = 'Failed to load adoption center data. Please try again later.';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fetch months with adoption data
  const fetchMonthsWithData = async () => {
    try {
      const response = await adoptionService.getMonthsWithData();
      if (response.success) {
        setMonthsWithData(response.months || []);
      }
    } catch (err) {
      console.error('Error fetching months with data:', err);
    }
  };

  // Fetch and cache species images for adopts
  const fetchSpeciesImages = useCallback(async (adoptsList) => {
    if (!adoptsList || adoptsList.length === 0) return;

    // Collect all unique species names from adopts
    const speciesNames = new Set();
    adoptsList.forEach(adopt => {
      if (adopt.species1) speciesNames.add(adopt.species1);
      if (adopt.species2) speciesNames.add(adopt.species2);
      if (adopt.species3) speciesNames.add(adopt.species3);
    });

    // Check cache first and find which species need to be fetched
    const cachedImages = {};
    const speciesToFetch = [];

    speciesNames.forEach(species => {
      const cached = evolutionCacheService.getImageData(species);
      if (cached) {
        cachedImages[species] = cached;
      } else {
        speciesToFetch.push(species);
      }
    });

    // Update state with cached images first
    if (Object.keys(cachedImages).length > 0) {
      setSpeciesImages(prev => ({ ...prev, ...cachedImages }));
    }

    // Fetch uncached species images
    if (speciesToFetch.length > 0) {
      try {
        const response = await speciesService.getSpeciesImages(speciesToFetch);
        if (response.success && response.speciesImages) {
          const newImages = {};
          Object.entries(response.speciesImages).forEach(([species, data]) => {
            const imageUrl = data.image_url || data.imageUrl;
            if (imageUrl) {
              newImages[species] = imageUrl;
              // Cache the image for future use
              evolutionCacheService.setImageData(species, imageUrl);
            }
          });
          setSpeciesImages(prev => ({ ...prev, ...newImages }));
        }
      } catch (err) {
        console.error('Error fetching species images:', err);
      }
    }
  }, []);

  // Open image popout modal
  const openImagePopout = useCallback((imageUrl, speciesName) => {
    if (!imageUrl) return;
    setPopoutImage({ url: imageUrl, species: speciesName });
    setShowImagePopout(true);
    document.body.style.overflow = 'hidden';
  }, []);

  // Close image popout modal
  const closeImagePopout = useCallback(() => {
    setShowImagePopout(false);
    setPopoutImage({ url: '', species: '' });
    document.body.style.overflow = '';
  }, []);

  // Cleanup effect for image popout
  useEffect(() => {
    return () => {
      if (showImagePopout) {
        document.body.style.overflow = '';
      }
    };
  }, [showImagePopout]);

  // Fetch user trainers
  const fetchUserTrainers = async (userId) => {
    try {
      const response = await trainerService.getUserTrainers(userId);
      if (response.success) {
        const trainers = response.trainers || [];
        setUserTrainers(trainers);

        if (trainers.length > 0) {
          setSelectedTrainer(trainers[0].id.toString());
          await checkTrainerDaypasses(trainers);
        }
      }
    } catch (err) {
      console.error('Error fetching user trainers:', err);
    }
  };

  // Check daycare daypasses for each trainer
  const checkTrainerDaypasses = async (trainers) => {
    try {
      const daypasses = {};

      for (const trainer of trainers) {
        const response = await adoptionService.checkDaycareDaypass(trainer.id);
        if (response.success) {
          daypasses[trainer.id] = {
            hasDaypass: response.hasDaypass,
            daypassCount: response.daypassCount
          };
        }
      }

      setTrainerDaypasses(daypasses);
    } catch (err) {
      console.error('Error checking trainer daypasses:', err);
    }
  };

  // Fetch available berries and pastries for a trainer
  const fetchTrainerInventory = async (trainerId) => {
    try {
      const response = await trainerService.getTrainerInventory(trainerId);
      if (response.success && response.data) {
        setAvailableBerries(response.data.berries || {});
        setAvailablePastries(response.data.pastries || {});
        return response.data;
      } else {
        console.error('Error fetching inventory:', response.message);
        setAvailableBerries({});
        setAvailablePastries({});
        return {};
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setAvailableBerries({});
      setAvailablePastries({});
      return {};
    }
  };

  // Fetch user artworks for artwork selector
  const fetchUserArtworks = useCallback(async (page = 1, searchQuery = '') => {
    if (!currentUser?.discord_id) return;

    try {
      setArtworksLoading(true);

      const params = {
        page,
        limit: artworksPagination.limit,
        userId: currentUser.discord_id,
        sort: 'newest'
      };

      // Add search filter if provided
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const response = await submissionService.getArtGallery(params);

      setUserArtworks(response.submissions || []);
      setArtworksPagination(prev => ({
        ...prev,
        page,
        totalPages: response.totalPages || 1,
        total: response.totalSubmissions || 0
      }));
    } catch (err) {
      console.error('Error fetching user artworks:', err);
      setUserArtworks([]);
    } finally {
      setArtworksLoading(false);
    }
  }, [currentUser?.discord_id, artworksPagination.limit]);

  // Handle artwork page change
  const handleArtworkPageChange = (newPage) => {
    fetchUserArtworks(newPage, artworkSearchQuery);
  };

  // Handle artwork search
  const handleArtworkSearch = (e) => {
    e.preventDefault();
    setArtworksPagination(prev => ({ ...prev, page: 1 }));
    fetchUserArtworks(1, artworkSearchQuery);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setPagination({
      ...pagination,
      page: newPage
    });
  };

  // Handle view option change
  const handleViewOptionChange = (showCurrent) => {
    setShowCurrentMonthOnly(showCurrent);
    setPagination({
      ...pagination,
      page: 1
    });
  };

  // Handle month selection change
  const handleMonthChange = (e) => {
    const [year, month] = e.target.value.split('-').map(Number);
    setSelectedYear(year);
    setSelectedMonth(month);
    setPagination({
      ...pagination,
      page: 1
    });
  };

  // Handle adopt click
  const handleAdoptClick = (adopt) => {
    setSelectedAdopt(adopt);
    setMonsterName(adopt.species1);
    setAdoptionSuccess(false);
    setAdoptionError('');
    setSelectedArtwork(null);
    setArtworkSearchQuery('');
    setShowAdoptModal(true);
    // Fetch user artworks when modal opens
    fetchUserArtworks(1, '');
  };

  // Handle adopt submit
  const handleAdoptSubmit = async () => {
    if (!selectedTrainer) {
      setAdoptionError('Please select a trainer');
      return;
    }

    if (!monsterName.trim()) {
      setAdoptionError('Please enter a name for your new monster');
      return;
    }

    if (!selectedArtwork) {
      setAdoptionError('Please select an artwork to proceed');
      return;
    }

    try {
      setAdoptionLoading(true);
      setAdoptionError('');

      // Find the selected trainer to get the Discord user ID
      const selectedTrainerObj = userTrainers.find(trainer => trainer.id.toString() === selectedTrainer.toString());
      const discordUserId = selectedTrainerObj?.discord_user_id || currentUserId;

      console.log('Adopting with Discord user ID:', discordUserId);
      console.log('Selected trainer:', selectedTrainerObj);
      console.log('Current user ID:', currentUserId);

      const response = await adoptionService.claimAdopt(
        selectedAdopt.id,
        selectedTrainer, // selectedTrainer is already a number from TrainerSelector
        monsterName,
        discordUserId
      );

      if (response.success) {
        setAdoptionSuccess(true);
        setAdoptedMonster(response.monster || null);

        // Fetch available berries and pastries for the selected trainer
        await fetchTrainerInventory(selectedTrainer);

        fetchData();
        fetchUserTrainers(currentUserId);
      } else {
        setAdoptionError(response.message || 'Failed to adopt monster');
      }
    } catch (err) {
      console.error('Error adopting monster:', err);
      setAdoptionError(err.response?.data?.message || 'Failed to adopt monster. Please try again.');
    } finally {
      setAdoptionLoading(false);
    }
  };

  // Close adopt modal
  const closeAdoptModal = () => {
    setShowAdoptModal(false);
    setSelectedAdopt(null);
    setMonsterName('');
    setAdoptionSuccess(false);
    setAdoptionError('');
    setAdoptedMonster(null);
    setSelectedArtwork(null);
    setArtworkSearchQuery('');
    setUserArtworks([]);
    setArtworksPagination(prev => ({ ...prev, page: 1, totalPages: 1, total: 0 }));
  };

  // Open item modal (berries and pastries)
  const openItemModal = () => {
    if (!adoptedMonster) return;
    setShowItemModal(true);
  };

  // Close item modal
  const closeItemModal = () => {
    setShowItemModal(false);
  };

  // Handle inventory update from item modal
  const handleInventoryUpdate = (itemType, itemName) => {
    if (itemType === 'berry') {
      setAvailableBerries(prev => ({
        ...prev,
        [itemName]: Math.max(0, (prev[itemName] || 0) - 1)
      }));
    } else if (itemType === 'pastry') {
      setAvailablePastries(prev => ({
        ...prev,
        [itemName]: Math.max(0, (prev[itemName] || 0) - 1)
      }));
    }
  };

  // Handle monster update from item modal
  const handleMonsterUpdate = (updatedMonster) => {
    setAdoptedMonster(updatedMonster);
  };

  // Get month name
  const getMonthName = (month) => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return monthNames[month - 1];
  };

  // Render loading state
  if (loading && !showAdoptModal) {
    return <LoadingSpinner message="Loading adoption center..." />;
  }

  // Render error state
  if (error) {
    return (
      <ErrorMessage
        message={error}
        onRetry={fetchData}
      />
    );
  }

  return (
    <div className="adoption-center-container">
      <div className="adoption-center-controls">
        <div className="view-options">
          <button
            className={`button filter ${showCurrentMonthOnly ? 'active' : ''}`}
            onClick={() => handleViewOptionChange(true)}
          >
            Current Month
          </button>
          <button
            className={`button filter ${!showCurrentMonthOnly ? 'active' : ''}`}
            onClick={() => handleViewOptionChange(false)}
          >
            All Months
          </button>
        </div>

        {!showCurrentMonthOnly && monthsWithData.length > 0 && (
          <div className="month-selector">
            <select
              value={`${selectedYear}-${selectedMonth}`}
              onChange={handleMonthChange}
            >
              {monthsWithData.map((data) => (
                <option key={`${data.year}-${data.month}`} value={`${data.year}-${data.month}`}>
                  {getMonthName(data.month)} {data.year}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {adopts.length === 0 ? (
        <div className="no-adopts-message">
          <p>No monsters available for adoption at this time.</p>
        </div>
      ) : (
        <>
          <div className="adopts-grid">
            {adopts.map((adopt) => {
              const speciesCount = [adopt.species1, adopt.species2, adopt.species3].filter(Boolean).length;
              return (
                <div
                  key={adopt.id}
                  className="adopt-card"
                  onClick={() => handleAdoptClick(adopt)}
                >
                  <div className="adopt-name">
                    <h3>{adopt.species1} {adopt.species2 ? `+ ${adopt.species2}` : ''} {adopt.species3 ? `+ ${adopt.species3}` : ''}</h3>
                  </div>
                  <div className="adopt-description">
                    {/* Species Images */}
                  <div className={`adopt-species-images species-count-${speciesCount}`}>
                    {adopt.species1 && (
                      <div className="species-image-wrapper" title={adopt.species1}>
                        {speciesImages[adopt.species1] ? (
                          <img
                            src={speciesImages[adopt.species1]}
                            alt={adopt.species1}
                            className="species-image"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="species-image-placeholder">
                            <span>{adopt.species1.charAt(0)}</span>
                          </div>
                        )}
                      </div>
                    )}
                    {adopt.species2 && (
                      <div className="species-image-wrapper fusion-species" title={adopt.species2}>
                        <span className="fusion-plus">+</span>
                        {speciesImages[adopt.species2] ? (
                          <img
                            src={speciesImages[adopt.species2]}
                            alt={adopt.species2}
                            className="species-image"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="species-image-placeholder">
                            <span>{adopt.species2.charAt(0)}</span>
                          </div>
                        )}
                      </div>
                    )}
                    {adopt.species3 && (
                      <div className="species-image-wrapper fusion-species" title={adopt.species3}>
                        <span className="fusion-plus">+</span>
                        {speciesImages[adopt.species3] ? (
                          <img
                            src={speciesImages[adopt.species3]}
                            alt={adopt.species3}
                            className="species-image"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="species-image-placeholder">
                            <span>{adopt.species3.charAt(0)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Types */}
                  <div className="adopt-types">
                    <TypeBadge type={adopt.type1} context={'adopt'} />
                    {adopt.type2 && <TypeBadge type={adopt.type2} context={'adopt'} />}
                    {adopt.type3 && <TypeBadge type={adopt.type3} context={'adopt'} />}
                    {adopt.type4 && <TypeBadge type={adopt.type4} context={'adopt'} />}
                    {adopt.type5 && <TypeBadge type={adopt.type5} context={'adopt'} />}
                  </div>

                  {/* Attribute */}
                  <div className="adopt-attribute">
                    {adopt.attribute && (
                      <AttributeBadge attribute={adopt.attribute} context={'adopt'} />
                    )}
                  </div>
                  </div>
                  

                  <div className="adopt-action">
                    <button className="button primary">
                      Adopt
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}

      {/* Adoption Modal */}
      <Modal
        isOpen={showAdoptModal}
        onClose={closeAdoptModal}
        title={adoptionSuccess ? "Adoption Successful!" : "Adopt Monster"}
      >
        {adoptionSuccess ? (
          <div className="adoption-success">
            <div className="success-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <p>
              Congratulations! You have successfully adopted {monsterName}.
              Take good care of your new monster!
            </p>

            {adoptedMonster && (
              <div className="adoption-actions">
                <button
                  className="button primary"
                  onClick={openItemModal}
                  disabled={
                    !Object.values(availableBerries).some(count => count > 0) &&
                    !Object.values(availablePastries).some(count => count > 0)
                  }
                >
                  <i className="fas fa-utensils"></i> Use Pastries and Berries
                </button>
              </div>
            )}

            <button
              className="button primary"
              onClick={closeAdoptModal}
            >
              Close
            </button>
          </div>
        ) : (
          <div className="adoption-form">
            {selectedAdopt && (
              <>
                <div className="adopt-details">
                  <h3>Monster Details</h3>

                  {/* Species Images in Modal - Clickable for Popout */}
                  <div className="modal-species-images">
                    {selectedAdopt.species1 && (
                      <div
                        className={`modal-species-image-container ${speciesImages[selectedAdopt.species1] ? 'clickable' : ''}`}
                        onClick={() => openImagePopout(speciesImages[selectedAdopt.species1], selectedAdopt.species1)}
                        title={speciesImages[selectedAdopt.species1] ? `Click to view ${selectedAdopt.species1}` : selectedAdopt.species1}
                      >
                        {speciesImages[selectedAdopt.species1] ? (
                          <img
                            src={speciesImages[selectedAdopt.species1]}
                            alt={selectedAdopt.species1}
                            className="modal-species-image"
                          />
                        ) : (
                          <div className="modal-species-placeholder">
                            <span>{selectedAdopt.species1.charAt(0)}</span>
                          </div>
                        )}
                        <span className="modal-species-name">{selectedAdopt.species1}</span>
                      </div>
                    )}
                    {selectedAdopt.species2 && (
                      <div
                        className={`modal-species-image-container fusion ${speciesImages[selectedAdopt.species2] ? 'clickable' : ''}`}
                        onClick={() => openImagePopout(speciesImages[selectedAdopt.species2], selectedAdopt.species2)}
                        title={speciesImages[selectedAdopt.species2] ? `Click to view ${selectedAdopt.species2}` : selectedAdopt.species2}
                      >
                        <span className="modal-fusion-indicator">+</span>
                        {speciesImages[selectedAdopt.species2] ? (
                          <img
                            src={speciesImages[selectedAdopt.species2]}
                            alt={selectedAdopt.species2}
                            className="modal-species-image"
                          />
                        ) : (
                          <div className="modal-species-placeholder">
                            <span>{selectedAdopt.species2.charAt(0)}</span>
                          </div>
                        )}
                        <span className="modal-species-name">{selectedAdopt.species2}</span>
                      </div>
                    )}
                    {selectedAdopt.species3 && (
                      <div
                        className={`modal-species-image-container fusion ${speciesImages[selectedAdopt.species3] ? 'clickable' : ''}`}
                        onClick={() => openImagePopout(speciesImages[selectedAdopt.species3], selectedAdopt.species3)}
                        title={speciesImages[selectedAdopt.species3] ? `Click to view ${selectedAdopt.species3}` : selectedAdopt.species3}
                      >
                        <span className="modal-fusion-indicator">+</span>
                        {speciesImages[selectedAdopt.species3] ? (
                          <img
                            src={speciesImages[selectedAdopt.species3]}
                            alt={selectedAdopt.species3}
                            className="modal-species-image"
                          />
                        ) : (
                          <div className="modal-species-placeholder">
                            <span>{selectedAdopt.species3.charAt(0)}</span>
                          </div>
                        )}
                        <span className="modal-species-name">{selectedAdopt.species3}</span>
                      </div>
                    )}
                  </div>

                  <div className="adopt-types-details">
                    <p><strong>Types:</strong></p>
                    <div className="types-list">
                      <TypeBadge type={selectedAdopt.type1} />
                      {selectedAdopt.type2 && <TypeBadge type={selectedAdopt.type2} />}
                      {selectedAdopt.type3 && <TypeBadge type={selectedAdopt.type3} />}
                      {selectedAdopt.type4 && <TypeBadge type={selectedAdopt.type4} />}
                      {selectedAdopt.type5 && <TypeBadge type={selectedAdopt.type5} />}
                    </div>
                  </div>

                  {selectedAdopt.attribute && (
                    <div className="adopt-attribute-details">
                      <p><strong>Attribute:</strong></p>
                      <div className="adopt-attribute-badge-container">
                        <AttributeBadge attribute={selectedAdopt.attribute} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="adoption-inputs">
                  <div className="form-group">
                    <label htmlFor="monster-name">Monster Name:</label>
                    <input
                      type="text"
                      id="monster-name"
                      value={monsterName}
                      onChange={(e) => setMonsterName(e.target.value)}
                      placeholder="Enter a name for your new monster"
                    />
                  </div>

                  <div className="form-group">
                    <TrainerAutocomplete
                      trainers={userTrainers.map(trainer => ({
                        ...trainer,
                        level: undefined,
                        displaySuffix: trainerDaypasses[trainer.id]?.hasDaypass
                          ? `${trainerDaypasses[trainer.id]?.daypassCount} Daypass(es)`
                          : 'No Daypasses'
                      }))}
                      selectedTrainerId={selectedTrainer}
                      onSelect={(id) => setSelectedTrainer(id ? id.toString() : '')}
                      label="Trainer"
                      placeholder="Type to search trainers..."
                    />
                  </div>

                  {/* Artwork Selector */}
                  <div className="form-group artwork-selector-section">
                    <label>Select Artwork <span className="required-indicator">*</span></label>

                    {/* Selected artwork preview */}
                    {selectedArtwork && (
                      <div className="selected-artwork-preview">
                        <img
                          src={selectedArtwork.image_url}
                          alt={selectedArtwork.title}
                          className="selected-artwork-thumbnail"
                        />
                        <div className="selected-artwork-info">
                          <span className="selected-artwork-title">{selectedArtwork.title}</span>
                          <button
                            type="button"
                            className="button secondary"
                            onClick={() => setSelectedArtwork(null)}
                          >
                            Change
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Artwork search */}
                    <form className="artwork-search-form" onSubmit={handleArtworkSearch}>
                      <input
                        type="text"
                        placeholder="Search by title..."
                        value={artworkSearchQuery}
                        onChange={(e) => setArtworkSearchQuery(e.target.value)}
                        className="artwork-search-input"
                      />
                      <button type="submit" className="button primary">
                        Search
                      </button>
                    </form>

                    {/* Artwork grid */}
                    <div className="artwork-selector-grid-container">
                      {artworksLoading ? (
                        <div className="artwork-loading">
                          <LoadingSpinner message="Loading artworks..." />
                        </div>
                      ) : userArtworks.length === 0 ? (
                        <div className="no-artworks-message">
                          <p>No artworks found.</p>
                          {artworkSearchQuery && (
                            <button
                              type="button"
                              className="button secondary"
                              onClick={() => {
                                setArtworkSearchQuery('');
                                fetchUserArtworks(1, '');
                              }}
                            >
                              Clear search
                            </button>
                          )}
                        </div>
                      ) : (
                        <>
                          <div className="artwork-selector-grid">
                            {userArtworks.map(artwork => (
                              <div
                                key={artwork.id}
                                className={`artwork-selector-item ${selectedArtwork?.id === artwork.id ? 'selected' : ''}`}
                                onClick={() => setSelectedArtwork(artwork)}
                                title={artwork.title}
                              >
                                <img
                                  src={artwork.image_url}
                                  alt={artwork.title}
                                  className="artwork-thumbnail"
                                />
                                <span className="artwork-title">{artwork.title}</span>
                              </div>
                            ))}
                          </div>

                          {artworksPagination.totalPages > 1 && (
                            <div className="artwork-pagination">
                              <Pagination
                                currentPage={artworksPagination.page}
                                totalPages={artworksPagination.totalPages}
                                onPageChange={handleArtworkPageChange}
                              />
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {adoptionError && (
                    <div className="adoption-error">
                      {adoptionError}
                    </div>
                  )}

                  <div className="adoption-actions">
                    <button
                      className="button secondary"
                      onClick={closeAdoptModal}
                    >
                      Cancel
                    </button>
                    <button
                      className="button primary"
                      onClick={handleAdoptSubmit}
                      disabled={adoptionLoading || !selectedTrainer || !monsterName.trim() || !selectedArtwork}
                    >
                      {adoptionLoading ? 'Adopting...' : 'Adopt Monster'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Item Modal (Berries and Pastries) */}
      <AdoptionItemModal
        isOpen={showItemModal}
        onClose={closeItemModal}
        monster={adoptedMonster}
        trainerId={parseInt(selectedTrainer)}
        availableBerries={availableBerries}
        availablePastries={availablePastries}
        onInventoryUpdate={handleInventoryUpdate}
      />

      {/* Image Popout Modal - Rendered via Portal */}
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
              alt={popoutImage.species}
              className="image-popout-image"
            />
            <p className="image-popout-caption">{popoutImage.species}</p>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AdoptionCenter;
