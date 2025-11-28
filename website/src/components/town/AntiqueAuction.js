import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import antiqueService from '../../services/antiqueService';
import trainerService from '../../services/trainerService';


const AntiqueAuction = ({ trainerId, antique, onClose }) => {
  const [trainer, setTrainer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [auctionOptions, setAuctionOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [monsterName, setMonsterName] = useState('');
  const [adoptSuccess, setAdoptSuccess] = useState(false);
  const [adoptLoading, setAdoptLoading] = useState(false);
  const [adoptError, setAdoptError] = useState(null);

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
          setMonsterName(response.data[0].species1 || '');
        }
      } else {
        setError(response.message || 'Failed to fetch auction options');
      }
    } catch (err) {
      console.error('Error fetching auction options:', err);
      setError(err.response?.data?.message || 'Failed to fetch auction options');
    } finally {
      setLoading(false);
    }
  };

  // Handle option selection
  const handleOptionSelect = (option) => {
    setSelectedOption(option);
    setMonsterName(option.species1 || '');
  };

  // Handle monster name change
  const handleNameChange = (e) => {
    setMonsterName(e.target.value);
  };

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

      const response = await antiqueService.auctionAntique(
        trainerId,
        antique,
        selectedOption.id,
        monsterName,
        trainer.discord_user_id
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

  // Render auction options
  const renderAuctionOptions = () => {
    if (auctionOptions.length === 0) {
      return (
        <div className="no-options-message">
          <p>No auction options available for this antique.</p>
        </div>
      );
    }

    return (
      <div className="auction-options-grid">
        {auctionOptions.map((option) => (
          <div
            key={option.id}
            className={`auction-option ${selectedOption?.id === option.id ? 'selected' : ''}`}
            onClick={() => handleOptionSelect(option)}
          >
            <div className="auction-option-species">
              <h4>{option.species1}</h4>
              {option.species2 && <h4>+ {option.species2}</h4>}
              {option.species3 && <h4>+ {option.species3}</h4>}
            </div>
            <div className="auction-option-types">
              {option.type1 && <span className={`type-badge type-${option.type1.toLowerCase()}`}>{option.type1}</span>}
              {option.type2 && <span className={`type-badge type-${option.type2.toLowerCase()}`}>{option.type2}</span>}
              {option.type3 && <span className={`type-badge type-${option.type3.toLowerCase()}`}>{option.type3}</span>}
              {option.type4 && <span className={`type-badge type-${option.type4.toLowerCase()}`}>{option.type4}</span>}
              {option.type5 && <span className={`type-badge type-${option.type5.toLowerCase()}`}>{option.type5}</span>}
            </div>
            {option.attribute && (
              <div className="auction-option-attribute">
                <span className="attribute-badge">{option.attribute}</span>
              </div>
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
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="antique-auction-body">
          {error && <ErrorMessage message={error} />}

          {loading ? (
            <LoadingSpinner />
          ) : adoptSuccess ? (
            <div className="adoption-success">
              <h3>Congratulations!</h3>
              <p>You've successfully adopted {monsterName}!</p>
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
                  You're about to auction your <strong>{antique}</strong>.
                  This will consume the antique and give you one of the following monsters.
                  Select an option to continue.
                </p>
              </div>

              {renderAuctionOptions()}

              {selectedOption && (
                <div className="monster-adoption-form">
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
                          Auction Antique
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
    </div>
  );
};

export default AntiqueAuction;
