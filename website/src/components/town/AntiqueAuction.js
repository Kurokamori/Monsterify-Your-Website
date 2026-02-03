import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import TrainerSelector from '../common/TrainerSelector';
import TypeBadge from '../monsters/TypeBadge';
import AttributeBadge from '../monsters/AttributeBadge';
import antiqueService from '../../services/antiqueService';
import trainerService from '../../services/trainerService';

const AntiqueAuction = ({ trainerId, antique, onClose, userTrainers = [] }) => {
  const [trainer, setTrainer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [auctionOptions, setAuctionOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [monsterName, setMonsterName] = useState('');
  const [adoptSuccess, setAdoptSuccess] = useState(false);
  const [adoptLoading, setAdoptLoading] = useState(false);
  const [adoptError, setAdoptError] = useState(null);

  // Target trainer selection state
  const [targetTrainerId, setTargetTrainerId] = useState(trainerId);

  // Image popout state
  const [showImagePopout, setShowImagePopout] = useState(false);
  const [popoutImage, setPopoutImage] = useState({ url: '', name: '' });

  // Fetch trainer data when trainerId changes
  useEffect(() => {
    const fetchTrainer = async () => {
      if (trainerId) {
        try {
          const response = await trainerService.getTrainerById(trainerId);
          if (response.success && response.trainer) {
            setTrainer(response.trainer);
          }
        } catch (err) {
          console.error('Error fetching trainer:', err);
        }
      }
    };

    fetchTrainer();
  }, [trainerId]);

  // Fetch auction options on component mount
  useEffect(() => {
    fetchAuctionOptions();
  }, [antique]);

  // Fetch auction options for the antique
  const fetchAuctionOptions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await antiqueService.getAuctionOptions(antique);

      if (response.success && response.data) {
        setAuctionOptions(response.data);

        // Select the first option by default if available
        if (response.data.length > 0) {
          setSelectedOption(response.data[0]);
          setMonsterName(response.data[0].name || response.data[0].species1 || '');
        }
      } else {
        // No options available - this is OK, we'll show the close button
        setAuctionOptions([]);
      }
    } catch (err) {
      console.error('Error fetching auction options:', err);
      // If it's a 404, just show no options message
      if (err.response?.status === 404) {
        setAuctionOptions([]);
      } else {
        setError(err.response?.data?.message || 'Failed to fetch auction options');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle option selection
  const handleOptionSelect = (option) => {
    setSelectedOption(option);
    setMonsterName(option.name || option.species1 || '');
  };

  // Handle monster name change
  const handleNameChange = (e) => {
    setMonsterName(e.target.value);
  };

  // Handle target trainer change
  const handleTargetTrainerChange = (newTrainerId) => {
    setTargetTrainerId(newTrainerId);
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

  // Handle auction button click
  const handleAuction = async () => {
    if (!selectedOption || !monsterName.trim()) {
      setAdoptError('Please provide a name for your monster');
      return;
    }

    if (!trainer) {
      setAdoptError('Trainer information not available');
      return;
    }

    try {
      setAdoptLoading(true);
      setAdoptError(null);

      // Get the target trainer to get the discord_user_id
      const targetTrainer = userTrainers.find(t => t.id.toString() === targetTrainerId.toString()) || trainer;

      const response = await antiqueService.auctionAntique(
        trainerId, // Source trainer (who has the antique)
        antique,
        selectedOption.id,
        monsterName,
        targetTrainer.discord_user_id || trainer.discord_user_id,
        parseInt(targetTrainerId) // Target trainer (where monster goes)
      );

      if (response.success) {
        setAdoptSuccess(true);
      } else {
        setAdoptError(response.message || 'Failed to auction antique');
      }
    } catch (err) {
      console.error('Error auctioning antique:', err);
      setAdoptError(err.response?.data?.message || 'Failed to auction antique');
    } finally {
      setAdoptLoading(false);
    }
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

  // Render auction options
  const renderAuctionOptions = () => {
    if (auctionOptions.length === 0) {
      return (
        <div className="no-options-message">
          <p>No auction options available for this antique.</p>
          <p>This antique can only be used for appraisal (random roll).</p>
          <button
            className="btn btn-primary"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      );
    }

    return (
      <div className="auction-options-grid">
        {auctionOptions.map((option) => (
          <div
            key={option.id}
            className={`auction-option-card ${selectedOption?.id === option.id ? 'selected' : ''}`}
            onClick={() => handleOptionSelect(option)}
          >
            {/* Monster Image */}
            {option.image && (
              <div
                className="auction-option-image-container"
                onClick={(e) => {
                  e.stopPropagation();
                  openImagePopout(option.image, option.name || option.species1);
                }}
                title="Click to enlarge"
              >
                <img
                  src={option.image}
                  alt={option.name || option.species1}
                  className="auction-option-image"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                  }}
                />
                <span className="image-zoom-hint">Click to enlarge</span>
              </div>
            )}

            {/* Monster Name */}
            <div className="auction-option-name">
              <h4>{option.name || getSpeciesDisplay(option)}</h4>
            </div>

            {/* Species */}
            <div className="auction-option-species">
              <span className="label">Species:</span> {getSpeciesDisplay(option)}
            </div>

            {/* Types */}
            <div className="auction-option-types">
              {getTypes(option).map((type, index) => (
                <TypeBadge key={index} type={type} />
              ))}
            </div>

            {/* Attribute */}
            {option.attribute && (
              <div className="auction-option-attribute">
                <AttributeBadge attribute={option.attribute} />
              </div>
            )}

            {/* Creator */}
            {option.creator && (
              <div className="auction-option-creator">
                <span className="label">Artist:</span> {option.creator}
              </div>
            )}

            {/* Description/Flavor Text */}
            {option.description && (
              <div className="auction-option-description">
                <p>{option.description}</p>
              </div>
            )}

            {/* Selection indicator */}
            {selectedOption?.id === option.id && (
              <div className="selected-indicator">Selected</div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="antique-auction-modal">
      <div className="antique-auction-content">
        <div className="antique-auction-header">
          <h2>Auction Antique: {antique}</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>

        <div className="antique-auction-body">
          {error && <ErrorMessage message={error} />}

          {loading ? (
            <LoadingSpinner />
          ) : adoptSuccess ? (
            <div className="adoption-success">
              <div className="success-icon">
                <i className="fas fa-check-circle"></i>
              </div>
              <h3>Congratulations!</h3>
              <p>You've successfully adopted <strong>{monsterName}</strong>!</p>
              <p>Your new monster has been added to your team.</p>
              <button
                className="btn btn-primary"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <div className="auction-description">
                <p>
                  Select a monster from the options below to adopt using your <strong>{antique}</strong>.
                </p>
                <p className="auction-warning">
                  The antique will only be consumed after successful adoption.
                </p>
              </div>

              {renderAuctionOptions()}

              {selectedOption && auctionOptions.length > 0 && (
                <div className="monster-adoption-form">
                  {/* Target Trainer Selection */}
                  <div className="form-group">
                    <label>Send monster to:</label>
                    <TrainerSelector
                      selectedTrainerId={targetTrainerId}
                      onChange={handleTargetTrainerChange}
                      trainers={userTrainers}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="monster-name">Name your new monster:</label>
                    <input
                      type="text"
                      id="monster-name"
                      value={monsterName}
                      onChange={handleNameChange}
                      placeholder="Enter monster name"
                      className="form-control"
                    />
                  </div>

                  {adoptError && <ErrorMessage message={adoptError} />}

                  <div className="adoption-actions">
                    {adoptLoading ? (
                      <LoadingSpinner />
                    ) : (
                      <>
                        <button
                          className="btn btn-primary"
                          onClick={handleAuction}
                          disabled={!monsterName.trim() || !selectedOption}
                        >
                          Claim Monster
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={onClose}
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

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

export default AntiqueAuction;
