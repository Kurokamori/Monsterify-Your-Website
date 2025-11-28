import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import ErrorMessage from '../../../components/common/ErrorMessage';
import TrainerSelector from '../../../components/common/TrainerSelector';
import AntiqueAppraisal from '../../../components/town/AntiqueAppraisal';
import AntiqueAuction from '../../../components/town/AntiqueAuction';
import antiqueService from '../../../services/antiqueService';
import trainerService from '../../../services/trainerService';

const AntiqueStore = () => {
  const { isAuthenticated, currentUser } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userTrainers, setUserTrainers] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [trainerAntiques, setTrainerAntiques] = useState([]);
  const [selectedAntique, setSelectedAntique] = useState(null);
  const [actionType, setActionType] = useState(null); // 'appraise' or 'auction'
  const [showAppraisalModal, setShowAppraisalModal] = useState(false);
  const [showAuctionModal, setShowAuctionModal] = useState(false);

  // Fetch trainer antiques when trainer is selected
  useEffect(() => {
    if (selectedTrainer) {
      console.log('Fetching antiques for trainer:', selectedTrainer);
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

  // Fetch trainer antiques
  const fetchTrainerAntiques = async (trainerId) => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching antiques for trainer ID:', trainerId);
      const response = await antiqueService.getTrainerAntiques(trainerId);
      console.log('Antiques response:', response);
      setTrainerAntiques(response.data || []);
    } catch (err) {
      console.error('Error fetching trainer antiques:', err);
      setError(err.response?.data?.message || 'Failed to fetch trainer antiques');
    } finally {
      setLoading(false);
    }
  };

  // Handle trainer selection
  const handleTrainerChange = (trainerId) => {
    setSelectedTrainer(trainerId);
  };

  // Handle antique selection
  const handleAntiqueSelect = (antique) => {
    setSelectedAntique(antique);
  };

  // Handle appraise button click
  const handleAppraiseClick = (antique) => {
    setSelectedAntique(antique);
    setActionType('appraise');
    setShowAppraisalModal(true);
  };

  // Handle auction button click
  const handleAuctionClick = (antique) => {
    setSelectedAntique(antique);
    setActionType('auction');
    setShowAuctionModal(true);
  };

  // Close appraisal modal
  const closeAppraisalModal = () => {
    setShowAppraisalModal(false);
    setSelectedAntique(null);
    setActionType(null);
    // Refresh antiques after appraisal
    if (selectedTrainer) {
      fetchTrainerAntiques(selectedTrainer);
    }
  };

  // Close auction modal
  const closeAuctionModal = () => {
    setShowAuctionModal(false);
    setSelectedAntique(null);
    setActionType(null);
    // Refresh antiques after auction
    if (selectedTrainer) {
      fetchTrainerAntiques(selectedTrainer);
    }
  };

  // Render antique items
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
            className={`antique-item ${selectedAntique?.name === antique.name ? 'selected' : ''}`}
            onClick={() => handleAntiqueSelect(antique)}
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
                className="btn btn-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAppraiseClick(antique);
                }}
              >
                Appraise
              </button>
              <button
                className="btn btn-secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAuctionClick(antique);
                }}
              >
                Auction
              </button>
            </div>
          </div>
        ))}
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

      <div className="antique-store-content">
        <div className="trainer-selection-section">
          <h2>Select Trainer</h2>
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
        />
      )}
    </div>
  );
};

export default AntiqueStore;
