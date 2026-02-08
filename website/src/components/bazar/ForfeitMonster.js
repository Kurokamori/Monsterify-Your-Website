import React, { useState, useEffect } from 'react';
import bazarService from '../../services/bazarService';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import MonsterCard from '../monsters/MonsterCard';
import Modal from '../common/Modal';

const ForfeitMonster = ({ userTrainers }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [trainerMonsters, setTrainerMonsters] = useState([]);
  const [selectedMonsters, setSelectedMonsters] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch trainer monsters when trainer is selected
  useEffect(() => {
    const fetchTrainerMonsters = async () => {
      if (!selectedTrainer) {
        setTrainerMonsters([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await bazarService.getTrainerMonsters(selectedTrainer);
        if (response.success) {
          setTrainerMonsters(response.monsters);
        } else {
          setError(response.message || 'Failed to fetch trainer monsters');
        }
      } catch (error) {
        console.error('Error fetching trainer monsters:', error);
        setError('Failed to fetch trainer monsters');
      } finally {
        setLoading(false);
      }
    };

    fetchTrainerMonsters();
  }, [selectedTrainer]);

  const handleTrainerChange = (e) => {
    setSelectedTrainer(e.target.value);
    setSelectedMonsters([]);
    setError(null);
    setSuccess(null);
  };

  const handleMonsterSelect = (monster) => {
    const isSelected = selectedMonsters.some(m => m.id === monster.id);
    if (isSelected) {
      setSelectedMonsters(selectedMonsters.filter(m => m.id !== monster.id));
    } else {
      setSelectedMonsters([...selectedMonsters, monster]);
    }
  };

  const handleConfirm = () => {
    if (selectedMonsters.length === 0) {
      setError('Please select at least one monster to forfeit');
      return;
    }
    setShowConfirmModal(true);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      const monsters = selectedMonsters.map(monster => ({
        monsterId: monster.id,
        trainerId: parseInt(selectedTrainer)
      }));

      const response = await bazarService.forfeitMonsters(monsters);
      
      if (response.success) {
        setSuccess(`Successfully forfeited ${response.results.length} monster(s) to the bazzar!`);
        if (response.errors.length > 0) {
          setError(`Some monsters could not be forfeited: ${response.errors.map(e => e.error).join(', ')}`);
        }
        setSelectedMonsters([]);
        setShowConfirmModal(false);
        // Refresh trainer monsters
        const refreshResponse = await bazarService.getTrainerMonsters(selectedTrainer);
        if (refreshResponse.success) {
          setTrainerMonsters(refreshResponse.monsters);
        }
      } else {
        setError(response.message || 'Failed to forfeit monsters');
      }
    } catch (error) {
      console.error('Error forfeiting monsters:', error);
      setError('Failed to forfeit monsters');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="forfeit-monster">
      <div className="bazar-form">
        <h2>Forfeit Monster</h2>
        <p>Select a trainer and choose monsters to forfeit to the bazzar. Other trainers will be able to adopt them.</p>

        {error && <ErrorMessage message={error} />}
        {success && <div className="success-message">{success}</div>}

        <div className="form-group">
          <label htmlFor="trainer-select">Select Trainer:</label>
          <select
            id="trainer-select"
            className="trainer-select"
            value={selectedTrainer}
            onChange={handleTrainerChange}
          >
            <option value="">Choose a trainer...</option>
            {userTrainers.map(trainer => (
              <option key={trainer.id} value={trainer.id}>
                {trainer.name} (Level {trainer.level})
              </option>
            ))}
          </select>
        </div>

        {selectedTrainer && (
          <>
            {loading ? (
              <LoadingSpinner />
            ) : (
              <>
                <div className="form-actions">
                  <button
                    className="button primary"
                    onClick={handleConfirm}
                    disabled={selectedMonsters.length === 0}
                  >
                    Forfeit Selected Monsters ({selectedMonsters.length})
                  </button>
                </div>

                <div className="bazar-monsters-grid">
                  {trainerMonsters.map(monster => (
                    <div
                      key={monster.id}
                      className={`bazar-monster-card ${selectedMonsters.some(m => m.id === monster.id) ? 'selected' : ''}`}
                    >
                      <MonsterCard monster={monster} />
                      <button
                        className={`button${selectedMonsters.some(m => m.id === monster.id) ? 'success' : 'secondary'}monster-select-btn`}
                        onClick={() => handleMonsterSelect(monster)}
                      >
                        {selectedMonsters.some(m => m.id === monster.id) ? '✓ Selected' : 'Select Monster'}
                      </button>
                    </div>
                  ))}
                </div>

                {trainerMonsters.length === 0 && (
                  <p>This trainer has no monsters to forfeit.</p>
                )}
              </>
            )}
          </>
        )}
      </div>

      {showConfirmModal && (
        <Modal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)}>
          <div className="tree-header">
            <h3>Confirm Forfeit</h3>
          </div>
          <div className="modal-body">
            <p>Are you sure you want to forfeit the following {selectedMonsters.length} monster(s) to the bazzar?</p>
            <ul>
              {selectedMonsters.map(monster => (
                <li key={monster.id}>
                  {monster.name} ({monster.species1}{monster.species2 ? `, ${monster.species2}` : ''}{monster.species3 ? `, ${monster.species3}` : ''})
                </li>
              ))}
            </ul>
            <p><strong>Warning:</strong> This action cannot be undone. The monsters will be removed from your trainer and made available for adoption by other trainers.</p>
          </div>
          <div className="modal-actions">
            <button
              className="button secondary"
              onClick={() => setShowConfirmModal(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              className="button danger"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Forfeiting...' : 'Confirm Forfeit'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ForfeitMonster;
