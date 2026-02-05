import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import useTrainerService from '../../hooks/useTrainerService';
import townService from '../../services/townService';
import trainerService from '../../services/trainerService';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import Modal from '../common/Modal';


const Garden = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const trainerService = useTrainerService();
  
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [gardenState, setGardenState] = useState(null);
  const [userTrainers, setUserTrainers] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [showHarvestModal, setShowHarvestModal] = useState(false);
  const [harvestResults, setHarvestResults] = useState(null);
  
  // Fetch garden state and user trainers
  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Fetch user trainers
        const trainersResponse = await trainerService.getUserTrainers();
        setUserTrainers(trainersResponse.trainers || []);
        
        if (trainersResponse.trainers && trainersResponse.trainers.length > 0) {
          const firstTrainer = trainersResponse.trainers[0];
          setSelectedTrainer(firstTrainer.id);
          
          // Fetch garden state for the first trainer
          const gardenResponse = await townService.getGardenState(firstTrainer.id);
          setGardenState(gardenResponse.garden || null);
        }
        
      } catch (err) {
        console.error('Error fetching garden data:', err);
        let errorMessage = 'Failed to load garden data. Please try again later.';
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

    fetchData();
  }, [isAuthenticated, trainerService]);
  
  // Handle trainer change
  const handleTrainerChange = async (trainerId) => {
    if (!trainerId) return;
    
    try {
      setLoading(true);
      setSelectedTrainer(trainerId);
      
      // Fetch garden state for the selected trainer
      const gardenResponse = await townService.getGardenState(trainerId);
      setGardenState(gardenResponse.garden || null);
      
    } catch (err) {
      console.error('Error fetching garden data:', err);
      let errorMessage = 'Failed to load garden data. Please try again later.';
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

  // Handle tend garden
  const handleTendGarden = async () => {
    if (!selectedTrainer) return;
    
    try {
      setActionLoading(true);
      setActionSuccess(false);
      setActionMessage('');
      
      const response = await townService.tendGarden(selectedTrainer);
      
      setActionSuccess(true);
      setActionMessage(response.message || 'Garden tended successfully!');
      
      // Refresh garden state
      const gardenResponse = await townService.getGardenState(selectedTrainer);
      setGardenState(gardenResponse.garden || null);
      
    } catch (err) {
      console.error('Error tending garden:', err);
      setActionMessage(err.response?.data?.message || 'Failed to tend garden. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };
  
  // Handle harvest garden
  const handleHarvestGarden = async () => {
    if (!selectedTrainer) return;
    
    try {
      setActionLoading(true);
      setActionSuccess(false);
      setActionMessage('');
      
      const response = await townService.harvestGarden(selectedTrainer);
      
      setHarvestResults(response.harvest || null);
      setShowHarvestModal(true);
      
      // Refresh garden state
      const gardenResponse = await townService.getGardenState(selectedTrainer);
      setGardenState(gardenResponse.garden || null);
      
      // Refresh trainer data
      const trainersResponse = await trainerService.getUserTrainers();
      setUserTrainers(trainersResponse.trainers || []);
      
    } catch (err) {
      console.error('Error harvesting garden:', err);
      setActionMessage(err.response?.data?.message || 'Failed to harvest garden. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };
  
  // Close harvest modal
  const closeHarvestModal = () => {
    setShowHarvestModal(false);
    setHarvestResults(null);
  };
  
  // Get trainer by ID
  const getTrainerById = (trainerId) => {
    return userTrainers.find(trainer => trainer.id === parseInt(trainerId));
  };
  
  // Calculate time until next growth stage
  const calculateTimeUntilNextStage = (plot) => {
    if (!plot || !plot.next_stage_time) return null;
    
    const nextStageTime = new Date(plot.next_stage_time).getTime();
    const currentTime = new Date().getTime();
    const timeRemaining = nextStageTime - currentTime;
    
    if (timeRemaining <= 0) return 'Ready for next stage';
    
    const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };
  
  // Render loading state
  if (loading && !gardenState) {
    return <LoadingSpinner message="Loading garden..." />;
  }
  
  // Render login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="garden-container">
        <div className="garden-header">
          <h2>Garden</h2>
          <p className="garden-description">
            Grow berries and other plants for your monsters.
          </p>
        </div>
        
        <div className="login-prompt">
          <p>Please log in to access your garden.</p>
        </div>
      </div>
    );
  }
  
  // Fallback data for development
  const fallbackGarden = {
    trainer_id: 1,
    plots: [
      {
        id: 1,
        plant_name: 'Oran Berry',
        plant_type: 'berry',
        growth_stage: 2,
        max_growth_stage: 4,
        next_stage_time: new Date(Date.now() + 3600000).toISOString(),
        is_ready: false,
        needs_tending: true,
        image_path: '/images/garden/oran-berry-2.png'
      },
      {
        id: 2,
        plant_name: 'Sitrus Berry',
        plant_type: 'berry',
        growth_stage: 4,
        max_growth_stage: 4,
        next_stage_time: null,
        is_ready: true,
        needs_tending: false,
        image_path: '/images/garden/sitrus-berry-4.png'
      },
      {
        id: 3,
        plant_name: 'Cheri Berry',
        plant_type: 'berry',
        growth_stage: 1,
        max_growth_stage: 4,
        next_stage_time: new Date(Date.now() + 7200000).toISOString(),
        is_ready: false,
        needs_tending: false,
        image_path: '/images/garden/cheri-berry-1.png'
      },
      {
        id: 4,
        plant_name: null,
        plant_type: null,
        growth_stage: 0,
        max_growth_stage: 0,
        next_stage_time: null,
        is_ready: false,
        needs_tending: false,
        image_path: null
      }
    ],
    last_tended: new Date(Date.now() - 86400000).toISOString(),
    can_tend: true,
    can_harvest: true,
    unlocked_plots: 4,
    max_plots: 6
  };
  
  const displayGarden = gardenState || fallbackGarden;
  
  return (
    <div className="garden-container">
      <div className="garden-header">
        <h2>Garden</h2>
        <p className="garden-description">
          Grow berries and other plants for your monsters.
        </p>
      </div>
      
      {error && (
        <ErrorMessage 
          message={error} 
          onDismiss={() => setError('')}
        />
      )}
      
      <div className="garden-controls">
        <div className="trainer-selector">
          <label htmlFor="garden-trainer">Trainer:</label>
          <select
            id="garden-trainer"
            value={selectedTrainer}
            onChange={(e) => handleTrainerChange(e.target.value)}
          >
            <option value="">Select a trainer</option>
            {userTrainers.map(trainer => (
              <option key={trainer.id} value={trainer.id}>
                {trainer.name} (Lv. {trainer.level})
              </option>
            ))}
          </select>
        </div>
        
        <div className="garden-actions">
          <button
            className="button button-primary"
            onClick={handleTendGarden}
            disabled={actionLoading || !displayGarden.can_tend}
          >
            {actionLoading ? (
              <>
                <LoadingSpinner size="small" />
                Tending...
              </>
            ) : (
              <>
                <i className="fas fa-seedling"></i> Tend Garden
              </>
            )}
          </button>
          
          <button
            className="button button-primary"
            onClick={handleHarvestGarden}
            disabled={actionLoading || !displayGarden.can_harvest}
          >
            {actionLoading ? (
              <>
                <LoadingSpinner size="small" />
                Harvesting...
              </>
            ) : (
              <>
                <i className="fas fa-hand-holding-heart"></i> Harvest
              </>
            )}
          </button>
        </div>
      </div>
      
      {actionMessage && (
        <div className={`action-message ${actionSuccess ? 'success' : 'error'}`}>
          {actionMessage}
        </div>
      )}
      
      <div className="garden-info">
        <div className="info-item">
          <span className="info-label">Last Tended:</span>
          <span className="info-value">
            {new Date(displayGarden.last_tended).toLocaleString()}
          </span>
        </div>
        
        <div className="info-item">
          <span className="info-label">Plots:</span>
          <span className="info-value">
            {displayGarden.unlocked_plots} / {displayGarden.max_plots}
          </span>
        </div>
      </div>
      
      <div className="garden-plots">
        {displayGarden.plots.map((plot, index) => (
          <div 
            key={index} 
            className={`garden-plot ${plot.plant_name ? 'planted' : 'empty'} ${plot.is_ready ? 'ready' : ''} ${plot.needs_tending ? 'needs-tending' : ''}`}
          >
            {plot.plant_name ? (
              <>
                <div className="plot-image-container">
                  <img
                    src={plot.image_path}
                    alt={plot.plant_name}
                    className="plot-image"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://via.placeholder.com/100/1e2532/d6a339?text=${plot.plant_name}`;
                    }}
                  />
                  
                  {plot.is_ready && (
                    <div className="ready-badge">
                      <i className="fas fa-check-circle"></i> Ready
                    </div>
                  )}
                  
                  {plot.needs_tending && (
                    <div className="needs-tending-badge">
                      <i className="fas fa-exclamation-circle"></i> Needs Tending
                    </div>
                  )}
                </div>
                
                <div className="plot-info">
                  <h3 className="plot-name">{plot.plant_name}</h3>
                  
                  <div className="plot-growth">
                    <div className="growth-bar-container">
                      <div 
                        className="growth-bar-fill"
                        style={{ width: `${(plot.growth_stage / plot.max_growth_stage) * 100}%` }}
                      ></div>
                    </div>
                    <div className="growth-text">
                      Stage {plot.growth_stage}/{plot.max_growth_stage}
                    </div>
                  </div>
                  
                  {!plot.is_ready && plot.next_stage_time && (
                    <div className="plot-time">
                      <i className="fas fa-clock"></i> {calculateTimeUntilNextStage(plot)}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="empty-plot">
                <i className="fas fa-plus"></i>
                <span>Empty Plot</span>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Harvest Modal */}
      <Modal
        isOpen={showHarvestModal}
        onClose={closeHarvestModal}
        title="Harvest Results"
      >
        {harvestResults && (
          <div className="harvest-results">
            <div className="success-icon">
              <i className="fas fa-leaf"></i>
            </div>
            
            <p className="harvest-message">
              You have successfully harvested your garden!
            </p>
            
            <div className="harvested-items">
              <h3>Harvested Items:</h3>
              
              <div className="items-list">
                {harvestResults.items.map((item, index) => (
                  <div key={index} className="harvested-item">
                    <div className="item-image-container">
                      <img
                        src={item.image_path}
                        alt={item.name}
                        className="item-image"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://via.placeholder.com/50/1e2532/d6a339?text=${item.name}`;
                        }}
                      />
                    </div>
                    
                    <div className="item-details">
                      <div className="item-name">{item.name}</div>
                      <div className="item-quantity">x{item.quantity}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {harvestResults.experience > 0 && (
              <div className="harvest-reward">
                <span className="reward-label">Experience:</span>
                <span className="reward-value">+{harvestResults.experience} XP</span>
              </div>
            )}
            
            <div className="modal-actions">
              <button
                className="modal-button primary"
                onClick={closeHarvestModal}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Garden;
