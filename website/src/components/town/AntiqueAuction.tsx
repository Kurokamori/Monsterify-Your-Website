import { useState, useEffect, useCallback } from 'react';
import { Modal } from '../common/Modal';
import { Card } from '../common/Card';
import { DataGrid } from '../common/DataGrid';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import { SuccessMessage } from '../common/SuccessMessage';
import { FormInput } from '../common/FormInput';
import { TrainerAutocomplete } from '../common/TrainerAutocomplete';
import { TypeBadge } from '../common/TypeBadge';
import { AttributeBadge } from '../common/AttributeBadge';
import { ActionButtonGroup } from '../common/ActionButtonGroup';
import api from '../../services/api';
import type { AntiqueAuctionOption, TownTrainer, AntiqueTrainer } from './types';
import type { Monster } from '../common/MonsterDetails';

interface AntiqueAuctionProps {
  isOpen: boolean;
  trainerId: number | string;
  antique: string;
  onClose: () => void;
  onSuccess?: (monster: Monster) => void;
  userTrainers?: TownTrainer[];
}

/**
 * AntiqueAuction - Modal for selecting specific monsters from auction options
 * Displays available pre-designed monsters that can be claimed with an antique
 */
export function AntiqueAuction({
  isOpen,
  trainerId,
  antique,
  onClose,
  onSuccess,
  userTrainers = []
}: AntiqueAuctionProps) {
  // Trainer state
  const [trainer, setTrainer] = useState<AntiqueTrainer | null>(null);

  // Loading state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auction options state
  const [auctionOptions, setAuctionOptions] = useState<AntiqueAuctionOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<AntiqueAuctionOption | null>(null);

  // Adoption state
  const [monsterName, setMonsterName] = useState('');
  const [targetTrainerId, setTargetTrainerId] = useState<string | number>(trainerId);
  const [adoptSuccess, setAdoptSuccess] = useState(false);
  const [adoptLoading, setAdoptLoading] = useState(false);
  const [adoptError, setAdoptError] = useState<string | null>(null);

  // Image popout state
  const [showImagePopout, setShowImagePopout] = useState(false);
  const [popoutImage, setPopoutImage] = useState({ url: '', name: '' });

  // Fetch trainer data
  useEffect(() => {
    const fetchTrainer = async () => {
      if (!trainerId || !isOpen) return;

      try {
        const response = await api.get(`/trainers/${trainerId}`);
        if (response.data.success && response.data.trainer) {
          setTrainer(response.data.trainer);
        } else if (response.data) {
          setTrainer(response.data);
        }
      } catch (err) {
        console.error('Error fetching trainer:', err);
      }
    };

    fetchTrainer();
  }, [trainerId, isOpen]);

  // Fetch auction options
  useEffect(() => {
    const fetchAuctionOptions = async () => {
      if (!isOpen || !antique) return;

      try {
        setLoading(true);
        setError(null);

        const response = await api.get(`/antiques/auction-options/${encodeURIComponent(antique)}`);

        if (response.data.success && response.data.data) {
          setAuctionOptions(response.data.data);

          if (response.data.data.length > 0) {
            setSelectedOption(response.data.data[0]);
            setMonsterName(response.data.data[0].name || response.data.data[0].species1 || '');
          }
        } else {
          setAuctionOptions([]);
        }
      } catch (err) {
        console.error('Error fetching auction options:', err);
        const error = err as { response?: { status?: number; data?: { message?: string } } };
        if (error.response?.status === 404) {
          setAuctionOptions([]);
        } else {
          setError(error.response?.data?.message || 'Failed to fetch auction options');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAuctionOptions();
  }, [isOpen, antique]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setAdoptSuccess(false);
      setAdoptError(null);
      setTargetTrainerId(trainerId);
    }
  }, [isOpen, trainerId]);

  // Handle option selection
  const handleOptionSelect = useCallback((option: AntiqueAuctionOption) => {
    setSelectedOption(option);
    setMonsterName(option.name || option.species1 || '');
  }, []);

  // Open image popout
  const openImagePopout = useCallback((imageUrl: string, name: string) => {
    if (!imageUrl) return;
    setPopoutImage({ url: imageUrl, name });
    setShowImagePopout(true);
  }, []);

  // Handle auction
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

      const targetTrainer = userTrainers.find(t =>
        String(t.id) === String(targetTrainerId)
      ) as AntiqueTrainer | undefined;

      const response = await api.post('/antiques/auction', {
        trainerId,
        targetTrainerId: targetTrainerId || trainerId,
        antique,
        auctionId: selectedOption.id,
        monsterName,
        discordUserId: targetTrainer?.discord_user_id || targetTrainer?.discord_id ||
                       trainer.discord_user_id || trainer.discord_id
      });

      if (response.data.success) {
        setAdoptSuccess(true);
        if (onSuccess && response.data.monster) {
          onSuccess(response.data.monster);
        }
      } else {
        setAdoptError(response.data.message || 'Failed to auction antique');
      }
    } catch (err) {
      console.error('Error auctioning antique:', err);
      const error = err as { response?: { data?: { message?: string } } };
      setAdoptError(error.response?.data?.message || 'Failed to auction antique');
    } finally {
      setAdoptLoading(false);
    }
  };

  // Get species display
  const getSpeciesDisplay = (option: AntiqueAuctionOption) => {
    return [option.species1, option.species2, option.species3]
      .filter(Boolean)
      .join(' + ');
  };

  // Get types array
  const getTypes = (option: AntiqueAuctionOption) => {
    return [option.type1, option.type2, option.type3, option.type4, option.type5]
      .filter(Boolean) as string[];
  };

  // Render no options message
  const renderNoOptions = () => (
    <div className="antique-auction__no-options text-center">
      <i className="fas fa-box-open fa-3x text-muted mb-md"></i>
      <p className="mb-sm">No auction options available for this antique.</p>
      <p className="text-muted mb-md">This antique can only be used for appraisal (random roll).</p>
      <ActionButtonGroup align="center">
        <button className="button primary" onClick={onClose}>
          Close
        </button>
      </ActionButtonGroup>
    </div>
  );

  // Render auction options
  const renderAuctionOptions = () => (
    <div className="antique-auction__options">
      <div className="mb-md">
        <p className="mb-xs">
          Select a monster from the options below to adopt using your <strong>{antique}</strong>.
        </p>
        <p className="text-muted text-sm">
          The antique will only be consumed after successful adoption.
        </p>
      </div>

      <DataGrid
        data={auctionOptions}
        renderItem={(option) => (
          <Card
            className={`auction-option ${selectedOption?.id === option.id ? 'auction-option--selected' : ''}`}
            onClick={() => handleOptionSelect(option)}
            selected={selectedOption?.id === option.id}
          >
            <div className="card__content">
              {/* Image */}
              {option.image && (
                <div
                  className="auction-option__image-container mb-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    openImagePopout(option.image!, option.name || option.species1);
                  }}
                >
                  <img
                    src={option.image}
                    alt={option.name || option.species1}
                    className="auction-option__image"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <span className="auction-option__zoom-hint">Click to enlarge</span>
                </div>
              )}

              {/* Name */}
              <h4 className="mb-xxs">{option.name || getSpeciesDisplay(option)}</h4>

              {/* Species */}
              <p className="text-sm text-muted mb-xs">
                <span className="text-bold">Species:</span> {getSpeciesDisplay(option)}
              </p>

              {/* Types */}
              <div className="badge-group badge-group--sm mb-xs">
                {getTypes(option).map((type, idx) => (
                  <TypeBadge key={idx} type={type} size="sm" />
                ))}
              </div>

              {/* Attribute */}
              {option.attribute && (
                <AttributeBadge attribute={option.attribute} size="sm" />
              )}

              {/* Creator */}
              {option.creator && (
                <p className="text-xs text-muted mt-xs">
                  <span className="text-bold">Artist:</span> {option.creator}
                </p>
              )}

              {/* Description */}
              {option.description && (
                <p className="text-sm mt-xs">{option.description}</p>
              )}

              {/* Selection indicator */}
              {selectedOption?.id === option.id && (
                <div className="badge badge--accent mt-xs">
                  <i className="fas fa-check"></i> Selected
                </div>
              )}
            </div>
          </Card>
        )}
        keyExtractor={(option) => option.id.toString()}
        gridColumns={2}
        gap="md"
        className="mb-md"
      />

      {/* Adoption form */}
      {selectedOption && (
        <Card className="antique-auction__form">
          <div className="card__content form-stack gap-sm">
            {userTrainers.length > 1 && (
              <div className="form-group">
                <label className="form-label">Send monster to:</label>
                <TrainerAutocomplete
                  selectedTrainerId={targetTrainerId}
                  onSelect={(id: string | number | null) => {
                    if (id !== null) setTargetTrainerId(id);
                  }}
                  trainers={userTrainers}
                  placeholder="Select trainer"
                />
              </div>
            )}

            <FormInput
              name="monsterName"
              label="Name your new monster"
              value={monsterName}
              onChange={(e) => setMonsterName(e.target.value)}
              placeholder="Enter monster name"
              required
            />

            {adoptError && <ErrorMessage message={adoptError} />}

            <ActionButtonGroup align="end">
              <button
                className="button secondary"
                onClick={onClose}
                disabled={adoptLoading}
              >
                Cancel
              </button>
              <button
                className="button primary"
                onClick={handleAuction}
                disabled={adoptLoading || !monsterName.trim() || !selectedOption}
              >
                {adoptLoading ? (
                  <><i className="fas fa-spinner fa-spin"></i> Claiming...</>
                ) : (
                  <><i className="fas fa-gavel"></i> Claim Monster</>
                )}
              </button>
            </ActionButtonGroup>
          </div>
        </Card>
      )}
    </div>
  );

  // Render success
  const renderSuccess = () => (
    <div className="antique-auction__success text-center">
      <div className="mb-md">
        <i className="fas fa-check-circle fa-3x text-success"></i>
      </div>
      <SuccessMessage message={`Successfully adopted ${monsterName}!`} />
      <p className="mt-md mb-md">Your new monster has been added to your team.</p>
      <ActionButtonGroup align="center">
        <button className="button primary" onClick={onClose}>
          Close
        </button>
      </ActionButtonGroup>
    </div>
  );

  // Render content
  const renderContent = () => {
    if (loading) {
      return <LoadingSpinner message="Loading auction options..." />;
    }

    if (error) {
      return (
        <div>
          <ErrorMessage message={error} />
          <ActionButtonGroup align="center" className="mt-md">
            <button className="button secondary" onClick={onClose}>
              Close
            </button>
          </ActionButtonGroup>
        </div>
      );
    }

    if (adoptSuccess) {
      return renderSuccess();
    }

    if (auctionOptions.length === 0) {
      return renderNoOptions();
    }

    return renderAuctionOptions();
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Auction Antique: ${antique}`}
        size="xlarge"
        closeOnOverlayClick={!adoptLoading}
      >
        {renderContent()}
      </Modal>

      {/* Image Popout Modal */}
      <Modal
        isOpen={showImagePopout}
        onClose={() => setShowImagePopout(false)}
        title={popoutImage.name}
        size="large"
      >
        <div className="image-popout text-center">
          <img
            src={popoutImage.url}
            alt={popoutImage.name}
            className="w-full"
          />
        </div>
      </Modal>
    </>
  );
}

export default AntiqueAuction;
