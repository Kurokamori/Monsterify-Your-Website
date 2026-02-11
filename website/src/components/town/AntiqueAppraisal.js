import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import MonsterCard from '../monsters/MonsterCard';
import antiqueService from '../../services/antiqueService';
import monsterService from '../../services/monsterService';
import trainerService from '../../services/trainerService';


const AntiqueAppraisal = ({ trainerId, antique, onClose }) => {
  const [trainer, setTrainer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rolledMonster, setRolledMonster] = useState(null);
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

  // Handle appraisal
  const handleAppraise = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await antiqueService.appraiseAntique(trainerId, antique);

      if (response.success && response.data.monster) {
        setRolledMonster(response.data.monster);
        // Set default monster name to species1
        setMonsterName(response.data.monster.species1 || '');
      } else {
        setError(response.message || 'Failed to appraise antique');
      }
    } catch (err) {
      console.error('Error appraising antique:', err);
      setError(err.response?.data?.message || 'Failed to appraise antique');
    } finally {
      setLoading(false);
    }
  };

  // Handle monster name change
  const handleNameChange = (e) => {
    setMonsterName(e.target.value);
  };

  // Handle adopt button click
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

      // Initialize the monster for the trainer
      const monsterData = {
        ...rolledMonster,
        name: monsterName,
        trainer_id: parseInt(trainerId),
        discord_user_id: trainer.discord_user_id
      };

      const response = await monsterService.createMonster(monsterData);

      if (response.success) {
        setAdoptSuccess(true);
      } else {
        setAdoptError(response.message || 'Failed to adopt monster');
      }
    } catch (err) {
      console.error('Error adopting monster:', err);
      setAdoptError(err.response?.data?.message || 'Failed to adopt monster');
    } finally {
      setAdoptLoading(false);
    }
  };

  return (
    <div className="antique-appraisal-modal">
      <div className="antique-appraisal-content">
        <div className="antique-appraisal-header">
          <h2>Appraise Antique: {antique}</h2>
          <button className="button close" onClick={onClose}>×</button>
        </div>

        <div className="antique-appraisal-body">
          {error && <ErrorMessage message={error} />}

          {!rolledMonster ? (
            <div className="appraisal-start">
              <p>
                You're about to appraise your <strong>{antique}</strong>.
                This will consume the antique and give you a random monster with special parameters.
              </p>
              <p>Are you sure you want to proceed?</p>

              <div className="appraisal-actions">
                {loading ? (
                  <LoadingSpinner />
                ) : (
                  <>
                    <button
                      className="button primary"
                      onClick={handleAppraise}
                    >
                      Appraise Antique
                    </button>
                    <button
                      className="button secondary"
                      onClick={onClose}
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : adoptSuccess ? (
            <div className="adoption-success">
              <h3>Congratulations!</h3>
              <p>You've successfully adopted {monsterName}!</p>
              <button
                className="button primary"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          ) : (
            <div className="monster-result">
              <h3>Appraisal Result</h3>

              <div className="monster-card-container">
                <MonsterCard monster={rolledMonster} linkToDetail={false} />
              </div>

              <div className="monster-adoption-form">
                <div className="form-group">
                  <label htmlFor="monster-name">Name your new monster:</label>
                  <input
                    type="text"
                    id="monster-name"
                    value={monsterName}
                    onChange={handleNameChange}
                    placeholder="Enter monster name"
                    className="form-input"
                  />
                </div>

                {adoptError && <ErrorMessage message={adoptError} />}

                <div className="type-tags fw">
                  {adoptLoading ? (
                    <LoadingSpinner />
                  ) : (
                    <>
                      <button
                        className="button primary"
                        onClick={handleAdopt}
                        disabled={!monsterName.trim()}
                      >
                        Adopt Monster
                      </button>
                      <button
                        className="button secondary"
                        onClick={onClose}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AntiqueAppraisal;
