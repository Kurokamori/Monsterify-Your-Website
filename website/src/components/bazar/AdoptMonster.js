import React, { useState, useEffect } from 'react';
import bazarService from '../../services/bazarService';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import MonsterCard from '../monsters/MonsterCard';
import TypeBadge from '../monsters/TypeBadge';
import AttributeBadge from '../monsters/AttributeBadge';
import Modal from '../common/Modal';

const AdoptMonster = ({ userTrainers }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [availableMonsters, setAvailableMonsters] = useState([]);
  const [selectedMonster, setSelectedMonster] = useState(null);
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [newName, setNewName] = useState('');
  const [showAdoptModal, setShowAdoptModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch available monsters on component mount
  useEffect(() => {
    fetchAvailableMonsters();
  }, []);

  const fetchAvailableMonsters = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await bazarService.getAvailableMonsters();
      if (response.success) {
        setAvailableMonsters(response.monsters);
      } else {
        setError(response.message || 'Failed to fetch available monsters');
      }
    } catch (error) {
      console.error('Error fetching available monsters:', error);
      setError('Failed to fetch available monsters');
    } finally {
      setLoading(false);
    }
  };

  const handleAdoptClick = (monster) => {
    setSelectedMonster(monster);
    setNewName(monster.name); // Default to current name
    setSelectedTrainer('');
    setShowAdoptModal(true);
  };

  const handleAdopt = async () => {
    if (!selectedTrainer) {
      setError('Please select a trainer');
      return;
    }

    if (!newName.trim()) {
      setError('Please enter a name for the monster');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await bazarService.adoptMonster(
        selectedMonster.id,
        parseInt(selectedTrainer),
        newName.trim()
      );

      if (response.success) {
        setSuccess(`Successfully adopted ${newName}!`);
        setShowAdoptModal(false);
        setSelectedMonster(null);
        setNewName('');
        setSelectedTrainer('');
        // Refresh available monsters
        await fetchAvailableMonsters();
      } else {
        setError(response.message || 'Failed to adopt monster');
      }
    } catch (error) {
      console.error('Error adopting monster:', error);
      setError('Failed to adopt monster');
    } finally {
      setSubmitting(false);
    }
  };

  const renderMonsterCard = (monster) => {
    const types = [monster.type1, monster.type2, monster.type3, monster.type4, monster.type5]
      .filter(type => type && type.trim() !== '');
    
    const species = [monster.species1, monster.species2, monster.species3]
      .filter(species => species && species.trim() !== '');

    return (
      <div key={monster.id} className="monster-card">
        <div className="tree-header">
          <h3>{monster.name}</h3>
          <p className="monster-level">Level {monster.level}</p>
        </div>
        
        <div className="monster-types">
          <strong>Species:</strong> {species.join(', ')}
        </div>
        
        <div className="bazzar-monster-types">
          <strong>Types:</strong>
          <div className="container vertical gap-md">
            {types.map((type, index) => (
              <TypeBadge key={index} type={type} />
            ))}
          </div>
        </div>
        
        {monster.attribute && (
          <div className="monster-types">
            <strong>Attribute:</strong>
            <AttributeBadge attribute={monster.attribute} />
          </div>
        )}
                        
        <div className="monster-info">
          <p><strong>Forfeited by:</strong> {monster.forfeited_by_trainer_name}</p>
          <p><strong>Date:</strong> {new Date(monster.forfeited_at).toLocaleDateString()}</p>
        </div>
        
        <div className="monster-actions">
          <button
            className="button success"
            onClick={() => handleAdoptClick(monster)}
          >
            Adopt
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="adopt-monster">
        <div className="bazar-form">
          <h2>Adopt Monster</h2>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="adopt-monster">
      <div className="bazar-form">
        <h2>Adopt Monster</h2>
        <p>Browse available monsters and adopt one for your trainer. Each monster can only be adopted once.</p>

        {error && <ErrorMessage message={error} />}
        {success && <div className="success-message">{success}</div>}

        {availableMonsters.length === 0 ? (
          <p>No monsters are currently available for adoption.</p>
        ) : (
          <div className="bazar-monsters-grid">
            {availableMonsters.map(renderMonsterCard)}
          </div>
        )}
      </div>

      {showAdoptModal && selectedMonster && (
        <Modal isOpen={showAdoptModal} onClose={() => setShowAdoptModal(false)}>
          <div className="tree-header">
            <h3>Adopt {selectedMonster.name}</h3>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="trainer-select">Select Trainer:</label>
              <select
                id="trainer-select"
                className="trainer-select"
                value={selectedTrainer}
                onChange={(e) => setSelectedTrainer(e.target.value)}
                required
              >
                <option value="">Choose a trainer...</option>
                {userTrainers.map(trainer => (
                  <option key={trainer.id} value={trainer.id}>
                    {trainer.name} (Level {trainer.level})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="new-name">Monster Name:</label>
              <input
                type="text"
                id="new-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter a name for this monster"
                required
              />
            </div>
          </div>
          <div className="modal-actions">
            <button
              className="button secondary"
              onClick={() => setShowAdoptModal(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              className="button success"
              onClick={handleAdopt}
              disabled={submitting || !selectedTrainer || !newName.trim()}
            >
              {submitting ? 'Adopting...' : 'Adopt Monster'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdoptMonster;
