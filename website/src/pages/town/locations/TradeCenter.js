import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import ErrorMessage from '../../../components/common/ErrorMessage';
import Modal from '../../../components/common/Modal';
import api from '../../../services/api';
import tradeService from '../../../services/tradeService';

const TradeCenter = () => {
  const { currentUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tradeListings, setTradeListings] = useState([]);
  const [userMonsters, setUserMonsters] = useState([]);
  const [isCreateTradeModalOpen, setIsCreateTradeModalOpen] = useState(false);
  const [isOfferTradeModalOpen, setIsOfferTradeModalOpen] = useState(false);
  const [selectedMonsterToOffer, setSelectedMonsterToOffer] = useState(null);
  const [selectedListing, setSelectedListing] = useState(null);
  const [tradeSuccess, setTradeSuccess] = useState(false);
  const [tradeError, setTradeError] = useState(null);
  const [userTrainers, setUserTrainers] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [tradeTitle, setTradeTitle] = useState('');
  const [selectedMonsterToTrade, setSelectedMonsterToTrade] = useState(null);
  const [tradeNotes, setTradeNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredListings, setFilteredListings] = useState([]);

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  useEffect(() => {
    if (tradeListings.length > 0 && searchTerm) {
      const filtered = tradeListings.filter(listing => {
        const searchLower = searchTerm.toLowerCase();
        const monster = listing.monster;
        return (
          listing.title.toLowerCase().includes(searchLower) ||
          monster.name.toLowerCase().includes(searchLower) ||
          listing.trainer.name.toLowerCase().includes(searchLower) ||
          (listing.notes && listing.notes.toLowerCase().includes(searchLower)) ||
          monster.species1?.toLowerCase().includes(searchLower) ||
          monster.species2?.toLowerCase().includes(searchLower) ||
          monster.species3?.toLowerCase().includes(searchLower) ||
          monster.type1?.toLowerCase().includes(searchLower) ||
          monster.type2?.toLowerCase().includes(searchLower) ||
          monster.type3?.toLowerCase().includes(searchLower) ||
          monster.type4?.toLowerCase().includes(searchLower) ||
          monster.type5?.toLowerCase().includes(searchLower) ||
          (monster.types && monster.types.some(type => type.toLowerCase().includes(searchLower)))
        );
      });
      setFilteredListings(filtered);
    } else {
      setFilteredListings(tradeListings);
    }
  }, [tradeListings, searchTerm]);

  const fetchData = async () => {
    try {
      setLoading(true);

      if (!currentUser || !currentUser.id) {
        console.error('User not authenticated or missing ID');
        setError('You must be logged in to access the Trade Center');
        setLoading(false);
        return;
      }

      // Fetch trade listings
      const listingsResponse = await tradeService.getTradeListings();
      setTradeListings(listingsResponse.listings || []);
      setFilteredListings(listingsResponse.listings || []);

      // Fetch user's monsters
      const monstersResponse = await api.get(`/monsters/user/${currentUser.id}`);
      setUserMonsters(monstersResponse.data.monsters || []);

      // Fetch user's trainers
      const trainersResponse = await api.get(`/trainers/user/${currentUser.id}`);
      setUserTrainers(trainersResponse.data.trainers || []);

      if (trainersResponse.data.trainers && trainersResponse.data.trainers.length > 0) {
        setSelectedTrainer(trainersResponse.data.trainers[0].id);
      }

    } catch (err) {
      console.error('Error fetching trade center data:', err);
      setError('Failed to load trade center data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTradeClick = () => {
    setIsCreateTradeModalOpen(true);
    setTradeError(null);
    setTradeTitle('');
    setSelectedMonsterToTrade(null);
    setTradeNotes('');
  };

  const handleOfferTradeClick = (listing) => {
    setSelectedListing(listing);
    setIsOfferTradeModalOpen(true);
    setTradeError(null);
    setSelectedMonsterToOffer(null);
  };

  const handleCreateTrade = async () => {
    if (!selectedTrainer) {
      setTradeError('Please select a trainer.');
      return;
    }

    if (!selectedMonsterToTrade) {
      setTradeError('Please select a monster to trade.');
      return;
    }

    if (!tradeTitle.trim()) {
      setTradeError('Please enter a title for your trade listing.');
      return;
    }

    try {
      setLoading(true);

      // Call API to create trade listing
      await tradeService.createTradeListing({
        title: tradeTitle,
        monster_id: selectedMonsterToTrade,
        trainer_id: selectedTrainer,
        notes: tradeNotes
      });

      setTradeSuccess(true);

      // Refresh trade listings
      const listingsResponse = await tradeService.getTradeListings();
      setTradeListings(listingsResponse.listings || []);
      setFilteredListings(listingsResponse.listings || []);

    } catch (err) {
      console.error('Error creating trade listing:', err);
      setTradeError(err.response?.data?.message || 'Failed to create trade listing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOfferTrade = async () => {
    if (!selectedTrainer) {
      setTradeError('Please select a trainer.');
      return;
    }

    if (!selectedMonsterToOffer) {
      setTradeError('Please select a monster to offer.');
      return;
    }

    try {
      setLoading(true);

      // Call API to offer trade
      await tradeService.offerTrade({
        listing_id: selectedListing.id,
        monster_id: selectedMonsterToOffer,
        trainer_id: selectedTrainer
      });

      setTradeSuccess(true);

    } catch (err) {
      console.error('Error offering trade:', err);
      setTradeError(err.response?.data?.message || 'Failed to offer trade. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const closeCreateTradeModal = () => {
    setIsCreateTradeModalOpen(false);
    setTradeSuccess(false);
    setTradeError(null);
  };

  const closeOfferTradeModal = () => {
    setIsOfferTradeModalOpen(false);
    setSelectedListing(null);
    setTradeSuccess(false);
    setTradeError(null);
  };

  // Fallback data for development
  const fallbackListings = [
    {
      id: 1,
      title: 'Looking for a Water type',
      trainer: {
        id: 1,
        name: 'Ash Ketchum'
      },
      monster: {
        id: 1,
        name: 'Leafeon',
        image_path: 'https://via.placeholder.com/80/1e2532/d6a339?text=Leafeon',
        level: 25,
        types: ['Grass']
      },
      notes: 'I have a Leafeon and I\'m looking for a Water type monster of similar level.',
      created_at: '2023-11-15T12:00:00Z'
    },
    {
      id: 2,
      title: 'Trading Flameon for Electric type',
      trainer: {
        id: 2,
        name: 'Misty'
      },
      monster: {
        id: 2,
        name: 'Flameon',
        image_path: 'https://via.placeholder.com/80/1e2532/d6a339?text=Flameon',
        level: 27,
        types: ['Fire']
      },
      notes: 'Looking for an Electric type monster. Preferably level 25+.',
      created_at: '2023-11-14T15:30:00Z'
    }
  ];

  const fallbackMonsters = [
    {
      id: 3,
      name: 'Aqueon',
      image_path: 'https://via.placeholder.com/80/1e2532/d6a339?text=Aqueon',
      level: 22,
      types: ['Water']
    },
    {
      id: 4,
      name: 'Zappeon',
      image_path: 'https://via.placeholder.com/80/1e2532/d6a339?text=Zappeon',
      level: 24,
      types: ['Electric']
    }
  ];

  const fallbackTrainers = [
    {
      id: 1,
      name: 'Ash Ketchum'
    },
    {
      id: 2,
      name: 'Misty'
    }
  ];

  const displayListings = filteredListings.length > 0 ? filteredListings : (tradeListings.length > 0 ? [] : fallbackListings);
  const displayMonsters = userMonsters.length > 0 ? userMonsters : fallbackMonsters;
  const displayTrainers = userTrainers.length > 0 ? userTrainers : fallbackTrainers;

  if (loading && !isCreateTradeModalOpen && !isOfferTradeModalOpen) {
    return <LoadingSpinner message="Loading trade center..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        message={error}
        onRetry={fetchData}
      />
    );
  }

  return (
    <div className="location-container">
      <div className="location-header">
        <div className="location-icon-large">
          <i className="fas fa-exchange-alt"></i>
        </div>
        <div className="location-title">
          <h2>Trade Center</h2>
          <p>Trade monsters with other trainers</p>
        </div>
      </div>

      <div className="location-content">
        <div className="town-location-description">
          <p>
            Welcome to the Aurora Town Trade Center! Here you can trade monsters with other trainers.
            Create a trade listing to offer one of your monsters, or browse existing listings to find a monster you want.
          </p>
          <p>
            Trading is a great way to get monsters that are rare or difficult to find in your region.
            It's also a way to help other trainers complete their collections.
          </p>
        </div>

        <div className="trade-center-content">
          <div className="trade-listings-section">
            <div className="section-header">
              <h3>Trade Listings</h3>
              <button
                className="location-action-button"
                onClick={handleCreateTradeClick}
              >
                <i className="fas fa-plus"></i> Create Listing
              </button>
            </div>

            <div className="trade-search">
              <input
                type="text"
                placeholder="Search by monster name, trainer, type, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <i className="fas fa-search search-icon"></i>
            </div>

            {displayListings.length === 0 ? (
              <div className="empty-state">
                <p>There are no trade listings at the moment.</p>
                <button
                  className="location-action-button"
                  onClick={handleCreateTradeClick}
                >
                  <i className="fas fa-plus"></i> Create First Listing
                </button>
              </div>
            ) : (
              <div className="trade-listings">
                {displayListings.map((listing) => (
                  <div className="trade-listing-card" key={listing.id}>
                    <div className="trade-listing-header">
                      <h4 className="trade-listing-title">{listing.title}</h4>
                      <div className="trade-listing-trainer">
                        <span>Posted by: {listing.trainer.name}</span>
                      </div>
                    </div>

                    <div className="trade-listing-content">
                      <div className="trade-offer">
                        <div className="trade-offer-label">Offering:</div>
                        <div className="trade-monster">
                          <img
                            src={listing.monster.image_path}
                            alt={listing.monster.name}
                            className="trade-monster-image"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/images/default_mon.png';
                            }}
                          />
                          <div className="trade-monster-info">
                            <div className="trade-monster-name">{listing.monster.name}</div>
                            <div className="trade-monster-details">
                              <span>Lv. {listing.monster.level}</span>
                              <span>
                                {listing.monster.types.map((type, index) => (
                                  <span key={index} className={`type-badge type-${type.toLowerCase()}`}>
                                    {type}
                                  </span>
                                ))}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {listing.notes && (
                        <div className="trade-notes">
                          <div className="trade-notes-label">Notes:</div>
                          <p>{listing.notes}</p>
                        </div>
                      )}

                      <div className="trade-listing-actions">
                        <button
                          className="trade-action-button"
                          onClick={() => handleOfferTradeClick(listing)}
                        >
                          <i className="fas fa-handshake"></i> Offer Trade
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Trade Modal */}
      <Modal
        isOpen={isCreateTradeModalOpen}
        onClose={closeCreateTradeModal}
        title={tradeSuccess ? "Trade Listing Created!" : "Create Trade Listing"}
      >
        {tradeSuccess ? (
          <div className="trade-success">
            <div className="success-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <p>
              Your trade listing has been created successfully.
              Other trainers can now see your listing and offer trades.
            </p>
            <button
              className="modal-button primary"
              onClick={closeCreateTradeModal}
            >
              Close
            </button>
          </div>
        ) : (
          <div className="create-trade-form">
            <div className="form-group">
              <label htmlFor="trade-title">Listing Title:</label>
              <input
                id="trade-title"
                type="text"
                value={tradeTitle}
                onChange={(e) => setTradeTitle(e.target.value)}
                placeholder="E.g., 'Looking for a Water type'"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="trade-monster">Monster to Trade:</label>
              <select
                id="trade-monster"
                value={selectedMonsterToTrade || ''}
                onChange={(e) => setSelectedMonsterToTrade(e.target.value)}
                className="form-select"
              >
                <option value="">Select a monster</option>
                {displayMonsters.map((monster) => (
                  <option key={monster.id} value={monster.id}>
                    {monster.name} (Lv. {monster.level}, {monster.types.join('/')})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="trade-trainer">Trainer:</label>
              <select
                id="trade-trainer"
                value={selectedTrainer}
                onChange={(e) => setSelectedTrainer(e.target.value)}
                className="form-select"
              >
                <option value="">Select a trainer</option>
                {displayTrainers.map((trainer) => (
                  <option key={trainer.id} value={trainer.id}>
                    {trainer.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="trade-notes">Notes (Optional):</label>
              <textarea
                id="trade-notes"
                value={tradeNotes}
                onChange={(e) => setTradeNotes(e.target.value)}
                placeholder="Describe what you're looking for in return"
                className="form-textarea"
                rows={4}
              ></textarea>
            </div>

            {tradeError && (
              <div className="trade-error">
                <i className="fas fa-exclamation-circle"></i>
                <span>{tradeError}</span>
              </div>
            )}

            <div className="trade-modal-actions">
              <button
                className="modal-button secondary"
                onClick={closeCreateTradeModal}
              >
                Cancel
              </button>
              <button
                className="modal-button primary"
                onClick={handleCreateTrade}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Processing...
                  </>
                ) : (
                  'Create Listing'
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Offer Trade Modal */}
      <Modal
        isOpen={isOfferTradeModalOpen}
        onClose={closeOfferTradeModal}
        title={tradeSuccess ? "Trade Offer Sent!" : "Offer Trade"}
      >
        {tradeSuccess ? (
          <div className="trade-success">
            <div className="success-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <p>
              Your trade offer has been sent successfully.
              The other trainer will be notified of your offer.
            </p>
            <button
              className="modal-button primary"
              onClick={closeOfferTradeModal}
            >
              Close
            </button>
          </div>
        ) : (
          <>
            {selectedListing && (
              <div className="offer-trade-form">
                <div className="trade-offer-preview">
                  <div className="trade-offer-label">You will receive:</div>
                  <div className="trade-monster">
                    <img
                      src={selectedListing.monster.image_path}
                      alt={selectedListing.monster.name}
                      className="trade-monster-image"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/images/default_mon.png';
                      }}
                    />
                    <div className="trade-monster-info">
                      <div className="trade-monster-name">{selectedListing.monster.name}</div>
                      <div className="trade-monster-details">
                        <span>Lv. {selectedListing.monster.level}</span>
                        <span>
                          {selectedListing.monster.types.map((type, index) => (
                            <span key={index} className={`type-badge type-${type.toLowerCase()}`}>
                              {type}
                            </span>
                          ))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="offer-monster">Monster to Offer:</label>
                  <select
                    id="offer-monster"
                    value={selectedMonsterToOffer || ''}
                    onChange={(e) => setSelectedMonsterToOffer(e.target.value)}
                    className="form-select"
                  >
                    <option value="">Select a monster</option>
                    {displayMonsters.map((monster) => (
                      <option key={monster.id} value={monster.id}>
                        {monster.name} (Lv. {monster.level}, {monster.types.join('/')})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="offer-trainer">Trainer:</label>
                  <select
                    id="offer-trainer"
                    value={selectedTrainer}
                    onChange={(e) => setSelectedTrainer(e.target.value)}
                    className="form-select"
                  >
                    <option value="">Select a trainer</option>
                    {displayTrainers.map((trainer) => (
                      <option key={trainer.id} value={trainer.id}>
                        {trainer.name}
                      </option>
                    ))}
                  </select>
                </div>

                {tradeError && (
                  <div className="trade-error">
                    <i className="fas fa-exclamation-circle"></i>
                    <span>{tradeError}</span>
                  </div>
                )}

                <div className="trade-modal-actions">
                  <button
                    className="modal-button secondary"
                    onClick={closeOfferTradeModal}
                  >
                    Cancel
                  </button>
                  <button
                    className="modal-button primary"
                    onClick={handleOfferTrade}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i> Processing...
                      </>
                    ) : (
                      'Send Offer'
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  );
};

export default TradeCenter;
