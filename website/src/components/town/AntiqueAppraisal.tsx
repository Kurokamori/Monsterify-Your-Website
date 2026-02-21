import { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Card } from '../common/Card';
import { ErrorMessage } from '../common/ErrorMessage';
import { SuccessMessage } from '../common/SuccessMessage';
import { FormInput } from '../common/FormInput';
import { TypeBadge } from '../common/TypeBadge';
import { AttributeBadge } from '../common/AttributeBadge';
import { ActionButtonGroup } from '../common/ActionButtonGroup';
import api from '../../services/api';
import type { RolledMonster, AntiqueTrainer } from './types';
import type { Monster } from '../common/MonsterDetails';

interface AntiqueAppraisalProps {
  isOpen: boolean;
  trainerId: number | string;
  antique: string;
  onClose: () => void;
  onSuccess?: (monster: Monster) => void;
}

/**
 * AntiqueAppraisal - Modal for appraising antiques into random monsters
 * Consumes the antique and rolls a random monster with special parameters
 */
export function AntiqueAppraisal({
  isOpen,
  trainerId,
  antique,
  onClose,
  onSuccess
}: AntiqueAppraisalProps) {
  // Trainer state
  const [trainer, setTrainer] = useState<AntiqueTrainer | null>(null);

  // Appraisal state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rolledMonster, setRolledMonster] = useState<RolledMonster | null>(null);

  // Adoption state
  const [monsterName, setMonsterName] = useState('');
  const [adoptSuccess, setAdoptSuccess] = useState(false);
  const [adoptLoading, setAdoptLoading] = useState(false);
  const [adoptError, setAdoptError] = useState<string | null>(null);

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

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setRolledMonster(null);
      setMonsterName('');
      setAdoptSuccess(false);
      setError(null);
      setAdoptError(null);
    }
  }, [isOpen]);

  // Handle appraisal
  const handleAppraise = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/antiques/appraise', {
        trainerId,
        antique
      });

      if (response.data.success && response.data.data?.monster) {
        setRolledMonster(response.data.data.monster);
        setMonsterName(response.data.data.monster.species1 || '');
      } else {
        setError(response.data.message || 'Failed to appraise antique');
      }
    } catch (err) {
      console.error('Error appraising antique:', err);
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to appraise antique');
    } finally {
      setLoading(false);
    }
  };

  // Handle adopt
  const handleAdopt = async () => {
    if (!rolledMonster || !monsterName.trim()) {
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

      const monsterData = {
        ...rolledMonster,
        name: monsterName,
        trainer_id: parseInt(String(trainerId)),
        discord_user_id: trainer.discord_user_id || trainer.discord_id
      };

      const response = await api.post('/monsters', monsterData);

      if (response.data.success) {
        setAdoptSuccess(true);
        if (onSuccess && response.data.monster) {
          onSuccess(response.data.monster);
        }
      } else {
        setAdoptError(response.data.message || 'Failed to adopt monster');
      }
    } catch (err) {
      console.error('Error adopting monster:', err);
      const error = err as { response?: { data?: { message?: string } } };
      setAdoptError(error.response?.data?.message || 'Failed to adopt monster');
    } finally {
      setAdoptLoading(false);
    }
  };

  // Get species display
  const getSpeciesDisplay = () => {
    if (!rolledMonster) return '';
    return [rolledMonster.species1, rolledMonster.species2, rolledMonster.species3]
      .filter(Boolean)
      .join(' + ');
  };

  // Get types array
  const getTypes = () => {
    if (!rolledMonster) return [];
    return [rolledMonster.type1, rolledMonster.type2, rolledMonster.type3,
            rolledMonster.type4, rolledMonster.type5].filter(Boolean) as string[];
  };

  // Render confirmation step
  const renderConfirmation = () => (
    <div className="antique-appraisal__confirm">
      <p className="mb-sm">
        You're about to appraise your <strong>{antique}</strong>.
      </p>
      <p className="text-muted mb-md">
        This will consume the antique and give you a random monster with special parameters.
        Are you sure you want to proceed?
      </p>

      {error && <ErrorMessage message={error} />}

      <ActionButtonGroup align="end">
        <button
          className="button secondary"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          className="button primary"
          onClick={handleAppraise}
          disabled={loading}
        >
          {loading ? (
            <><i className="fas fa-spinner fa-spin"></i> Appraising...</>
          ) : (
            <><i className="fas fa-search"></i> Appraise Antique</>
          )}
        </button>
      </ActionButtonGroup>
    </div>
  );

  // Render result step
  const renderResult = () => (
    <div className="antique-appraisal__result">
      <h3 className="text-center mb-md">Appraisal Result</h3>

      <Card className="mb-md">
        <div className="card__content">
          <div className="flex gap-md">
            {rolledMonster?.img_link && (
              <img
                src={rolledMonster.img_link}
                alt={rolledMonster.species1}
                className="image-container large"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            <div className="flex-1">
              <h3>{getSpeciesDisplay()}</h3>
              <div className="badge-group badge-group--sm mt-xs">
                {getTypes().map((type, idx) => (
                  <TypeBadge key={idx} type={type} size="sm" />
                ))}
              </div>
              {rolledMonster?.attribute && (
                <AttributeBadge attribute={rolledMonster.attribute} size="sm" className="mt-xs" />
              )}
              {rolledMonster?.level && (
                <p className="text-sm text-muted mt-xs">Level {rolledMonster.level}</p>
              )}
            </div>
          </div>
        </div>
      </Card>

      <div className="form-stack gap-sm">
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
            onClick={handleAdopt}
            disabled={adoptLoading || !monsterName.trim()}
          >
            {adoptLoading ? (
              <><i className="fas fa-spinner fa-spin"></i> Adopting...</>
            ) : (
              <><i className="fas fa-heart"></i> Adopt Monster</>
            )}
          </button>
        </ActionButtonGroup>
      </div>
    </div>
  );

  // Render success step
  const renderSuccess = () => (
    <div className="antique-appraisal__success text-center">
      <SuccessMessage message={`Successfully adopted ${monsterName}!`} />

      <p className="mt-md mb-md">Your new monster has been added to your team.</p>

      <ActionButtonGroup align="center">
        <button className="button primary" onClick={onClose}>
          Close
        </button>
      </ActionButtonGroup>
    </div>
  );

  // Render content based on state
  const renderContent = () => {
    if (adoptSuccess) {
      return renderSuccess();
    }
    if (rolledMonster) {
      return renderResult();
    }
    return renderConfirmation();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Appraise Antique: ${antique}`}
      size="medium"
      closeOnOverlayClick={!loading && !adoptLoading}
    >
      {renderContent()}
    </Modal>
  );
}

export default AntiqueAppraisal;
