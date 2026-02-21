import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { Modal } from '../common/Modal';
import { Card } from '../common/Card';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import { SuccessMessage } from '../common/SuccessMessage';
import { TrainerAutocomplete } from '../common/TrainerAutocomplete';
import { extractErrorMessage } from '../../utils/errorUtils';
import type { TownTrainer } from './types';

interface GardenProps {
  className?: string;
}

interface GardenPlot {
  id: number;
  plant_name: string | null;
  plant_type: string | null;
  growth_stage: number;
  max_growth_stage: number;
  next_stage_time: string | null;
  is_ready: boolean;
  needs_tending: boolean;
  image_path: string | null;
}

interface GardenState {
  trainer_id: number;
  plots: GardenPlot[];
  last_tended: string;
  can_tend: boolean;
  can_harvest: boolean;
  unlocked_plots: number;
  max_plots: number;
}

interface HarvestItem {
  name: string;
  image_path: string;
  quantity: number;
}

interface HarvestResults {
  items: HarvestItem[];
  experience: number;
}

/**
 * Garden component for managing garden plots
 * Allows trainers to tend and harvest their garden
 */
export function Garden({ className = '' }: GardenProps) {
  const { currentUser, isAuthenticated } = useAuth();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [gardenState, setGardenState] = useState<GardenState | null>(null);
  const [userTrainers, setUserTrainers] = useState<TownTrainer[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [actionSuccess, setActionSuccess] = useState(false);
  const [showHarvestModal, setShowHarvestModal] = useState(false);
  const [harvestResults, setHarvestResults] = useState<HarvestResults | null>(null);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated || !currentUser?.discord_id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const trainersResponse = await api.get(`/trainers/user/${currentUser.discord_id}`);
        const trainers = trainersResponse.data.trainers || [];
        setUserTrainers(trainers);

        if (trainers.length > 0) {
          const firstTrainer = trainers[0];
          setSelectedTrainer(firstTrainer.id.toString());

          const gardenResponse = await api.get(`/town/garden/${firstTrainer.id}`);
          setGardenState(gardenResponse.data.garden || null);
        }
      } catch (err) {
        console.error('Error fetching garden data:', err);
        setError(extractErrorMessage(err, 'Failed to load garden data.'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, currentUser?.discord_id]);

  // Handle trainer change
  const handleTrainerChange = useCallback(async (trainerId: string) => {
    if (!trainerId) return;

    try {
      setLoading(true);
      setSelectedTrainer(trainerId);

      const response = await api.get(`/town/garden/${trainerId}`);
      setGardenState(response.data.garden || null);
    } catch (err) {
      console.error('Error fetching garden:', err);
      setError(extractErrorMessage(err, 'Failed to load garden.'));
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle tend garden
  const handleTendGarden = useCallback(async () => {
    if (!selectedTrainer) return;

    try {
      setActionLoading(true);
      setActionSuccess(false);
      setActionMessage('');

      const response = await api.post(`/town/garden/${selectedTrainer}/tend`);

      setActionSuccess(true);
      setActionMessage(response.data.message || 'Garden tended successfully!');

      // Refresh garden state
      const gardenResponse = await api.get(`/town/garden/${selectedTrainer}`);
      setGardenState(gardenResponse.data.garden || null);
    } catch (err) {
      console.error('Error tending garden:', err);
      setActionMessage(extractErrorMessage(err, 'Failed to tend garden.'));
      setActionSuccess(false);
    } finally {
      setActionLoading(false);
    }
  }, [selectedTrainer]);

  // Handle harvest garden
  const handleHarvestGarden = useCallback(async () => {
    if (!selectedTrainer) return;

    try {
      setActionLoading(true);
      setActionSuccess(false);
      setActionMessage('');

      const response = await api.post(`/town/garden/${selectedTrainer}/harvest`);

      setHarvestResults(response.data.harvest || null);
      setShowHarvestModal(true);

      // Refresh garden state
      const gardenResponse = await api.get(`/town/garden/${selectedTrainer}`);
      setGardenState(gardenResponse.data.garden || null);
    } catch (err) {
      console.error('Error harvesting:', err);
      setActionMessage(extractErrorMessage(err, 'Failed to harvest garden.'));
      setActionSuccess(false);
    } finally {
      setActionLoading(false);
    }
  }, [selectedTrainer]);

  // Calculate time until next stage
  const calculateTimeRemaining = (nextStageTime: string | null): string => {
    if (!nextStageTime) return '';

    const remaining = new Date(nextStageTime).getTime() - Date.now();
    if (remaining <= 0) return 'Ready for next stage';

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  };

  // Render loading state
  if (loading && !gardenState) {
    return (
      <div className="state-container state-container--centered">
        <LoadingSpinner />
        <p className="spinner-message">Loading garden...</p>
      </div>
    );
  }

  // Render login prompt
  if (!isAuthenticated) {
    return (
      <div className={`garden ${className}`.trim()}>
        <div className="page-header">
          <h2>Garden</h2>
          <p>Grow berries and other plants for your monsters.</p>
        </div>
        <div className="empty-state">
          <i className="fas fa-seedling"></i>
          <h3>Login Required</h3>
          <p>Please log in to access your garden.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`garden ${className}`.trim()}>
      <div className="page-header">
        <h2>Garden</h2>
        <p>Grow berries and other plants for your monsters.</p>
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="form-section">
        <div className="form-group">
          <TrainerAutocomplete
            trainers={userTrainers}
            selectedTrainerId={selectedTrainer || null}
            onSelect={(id) => handleTrainerChange(id ? String(id) : '')}
            label="Trainer"
            placeholder="Type to search trainers..."
          />
        </div>

        <div className="action-button-group action-button-group--gap-md">
          <button
            className="button primary no-flex"
            onClick={handleTendGarden}
            disabled={actionLoading || !gardenState?.can_tend}
          >
            {actionLoading ? (
              <><LoadingSpinner /> Tending...</>
            ) : (
              <><i className="fas fa-seedling"></i> Tend Garden</>
            )}
          </button>

          <button
            className="button primary no-flex"
            onClick={handleHarvestGarden}
            disabled={actionLoading || !gardenState?.can_harvest}
          >
            {actionLoading ? (
              <><LoadingSpinner /> Harvesting...</>
            ) : (
              <><i className="fas fa-hand-holding-heart"></i> Harvest</>
            )}
          </button>
        </div>
      </div>

      {actionMessage && (
        actionSuccess
          ? <SuccessMessage message={actionMessage} />
          : <ErrorMessage message={actionMessage} />
      )}

      {gardenState && (
        <>
          <div className="garden-info">
            <div className="info-row">
              <span className="info-label">Last Tended:</span>
              <span className="info-value">
                {new Date(gardenState.last_tended).toLocaleString()}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Plots:</span>
              <span className="info-value">
                {gardenState.unlocked_plots} / {gardenState.max_plots}
              </span>
            </div>
          </div>

          <div className="garden-plots">
            {gardenState.plots.map((plot, index) => (
              <Card
                key={index}
                className={`garden-plot ${plot.plant_name ? 'planted' : 'empty'} ${plot.is_ready ? 'ready' : ''} ${plot.needs_tending ? 'needs-tending' : ''}`}
              >
                <div className="card__body">
                  {plot.plant_name ? (
                    <>
                      <div className="plot-image-container">
                        {plot.image_path && (
                          <img
                            src={plot.image_path}
                            alt={plot.plant_name}
                            className="plot-image"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://via.placeholder.com/100/1e2532/d6a339?text=${encodeURIComponent(plot.plant_name || '')}`;
                            }}
                          />
                        )}

                        {plot.is_ready && (
                          <div className="plot-badge plot-badge--ready">
                            <i className="fas fa-check-circle"></i> Ready
                          </div>
                        )}

                        {plot.needs_tending && (
                          <div className="plot-badge plot-badge--tending">
                            <i className="fas fa-exclamation-circle"></i> Needs Tending
                          </div>
                        )}
                      </div>

                      <h4 className="plot-name">{plot.plant_name}</h4>

                      <div className="growth-progress">
                        <div className="growth-bar">
                          <div
                            className="growth-bar__fill"
                            style={{ width: `${(plot.growth_stage / plot.max_growth_stage) * 100}%` }}
                          />
                        </div>
                        <span className="growth-label">
                          Stage {plot.growth_stage}/{plot.max_growth_stage}
                        </span>
                      </div>

                      {!plot.is_ready && plot.next_stage_time && (
                        <div className="plot-time">
                          <i className="fas fa-clock"></i> {calculateTimeRemaining(plot.next_stage_time)}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="empty-plot">
                      <i className="fas fa-plus"></i>
                      <span>Empty Plot</span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Harvest Modal */}
      <Modal
        isOpen={showHarvestModal}
        onClose={() => setShowHarvestModal(false)}
        title="Harvest Results"
        size="medium"
      >
        {harvestResults && (
          <div className="harvest-results">
            <div className="success-display">
              <div className="success-display__icon">
                <i className="fas fa-leaf"></i>
              </div>
              <h3 className="success-display__title">Harvest Complete!</h3>
              <p>You have successfully harvested your garden!</p>
            </div>

            <div className="harvested-items">
              <h4>Harvested Items:</h4>
              <div className="items-grid">
                {harvestResults.items.map((item, index) => (
                  <div key={index} className="harvested-item">
                    <img
                      src={item.image_path}
                      alt={item.name}
                      className="item-image"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://via.placeholder.com/50/1e2532/d6a339?text=${encodeURIComponent(item.name)}`;
                      }}
                    />
                    <div className="item-info">
                      <span className="item-name">{item.name}</span>
                      <span className="item-quantity">x{item.quantity}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {harvestResults.experience > 0 && (
              <div className="harvest-xp">
                <i className="fas fa-star"></i>
                <span>+{harvestResults.experience} XP</span>
              </div>
            )}

            <div className="action-button-group action-button-group--align-center action-button-group--gap-md mt-md">
              <button
                className="button primary no-flex"
                onClick={() => setShowHarvestModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Garden;
