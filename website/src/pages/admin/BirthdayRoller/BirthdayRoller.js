import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import userService from '../../../services/userService';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import ErrorMessage from '../../../components/common/ErrorMessage';
import AdminTrainerSelector from '../../../components/admin/AdminTrainerSelector';

const BirthdayRoller = () => {
  const [rolledItems, setRolledItems] = useState([]);
  const [rolledMonsters, setRolledMonsters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // User selection
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [usersLoading, setUsersLoading] = useState(true);
  
  // Assignment state for items
  const [itemAssignments, setItemAssignments] = useState({});
  
  // Selected monster and trainer for monster assignment
  const [selectedMonster, setSelectedMonster] = useState(null);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  
  // Submitting state
  const [submitting, setSubmitting] = useState(false);

  // Fetch users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setUsersLoading(true);
        const userData = await userService.getAllUsers();
        setUsers(userData || []);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users. Please try again later.');
      } finally {
        setUsersLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Roll 10 items and 10 monsters with default parameters
  const handleRoll = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      setRolledItems([]);
      setRolledMonsters([]);
      setItemAssignments({});
      setSelectedMonster(null);
      setSelectedTrainer(null);

      if (!selectedUser) {
        setError('Please select a user to roll for.');
        return;
      }

      // Roll 10 items (any category, any rarity)
      const itemResponse = await api.post('/item-roller/roll', {
        quantity: 10
      });

      // Roll 10 monsters with default parameters for the selected user:
      // - Only Base Stage / Doesn't Evolve / Baby I / Baby II
      // - Up to 2 species and up to 3 types
      // - Apply user's table settings
      const monsterResponse = await api.post('/monster-roller/roll/many', {
        count: 10,
        includeStages: ['Base Stage', "Doesn't Evolve", 'Baby I', 'Baby II'],
        species_max: 2,
        types_max: 3,
        userId: parseInt(selectedUser) // Pass user ID to apply their settings
      });

      setRolledItems(itemResponse.data.data || []);
      setRolledMonsters(monsterResponse.data.data || []);

      // Initialize item assignments with empty values
      const initialAssignments = {};
      (itemResponse.data.data || []).forEach((item, index) => {
        initialAssignments[index] = '';
      });
      setItemAssignments(initialAssignments);

    } catch (err) {
      console.error('Error rolling birthday items:', err);
      setError(err.response?.data?.message || 'Failed to roll birthday items. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle item assignment change
  const handleItemAssignmentChange = (itemIndex, trainerId) => {
    setItemAssignments(prev => ({
      ...prev,
      [itemIndex]: trainerId
    }));
  };

  // Handle monster selection
  const handleMonsterSelect = (monsterIndex) => {
    setSelectedMonster(monsterIndex);
  };

  // Handle trainer selection for monster
  const handleTrainerSelect = (trainerId) => {
    setSelectedTrainer(trainerId);
  };

  // Submit all assignments
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      // Validate that all items have assignments
      const unassignedItems = Object.entries(itemAssignments).filter(([_, trainerId]) => !trainerId);
      if (unassignedItems.length > 0) {
        setError('Please assign all items to trainers before submitting.');
        return;
      }

      // Validate that a monster and trainer are selected
      if (selectedMonster === null || !selectedTrainer) {
        setError('Please select a monster and assign it to a trainer before submitting.');
        return;
      }

      // Prepare item assignments for API
      const itemDistributions = Object.entries(itemAssignments).map(([itemIndex, trainerId]) => ({
        item: rolledItems[parseInt(itemIndex)],
        trainerId: trainerId
      }));

      // Group items by trainer for batch processing
      const itemsByTrainer = {};
      itemDistributions.forEach(({ item, trainerId }) => {
        if (!itemsByTrainer[trainerId]) {
          itemsByTrainer[trainerId] = [];
        }
        itemsByTrainer[trainerId].push(item);
      });

      // Submit item distributions
      const itemPromises = Object.entries(itemsByTrainer).map(([trainerId, items]) => {
        return Promise.all(items.map(item => 
          api.post('/item-roller/roll/trainer', {
            trainer_id: trainerId,
            category: item.category,
            rarity: item.rarity,
            quantity: 1
          })
        ));
      });

      // Submit monster assignment
      const selectedMonsterData = rolledMonsters[selectedMonster];
      const monsterPromise = api.post('/monster-roller/roll/trainer', {
        trainerId: selectedTrainer,
        ...selectedMonsterData.rollParameters || {},
        count: 1
      });

      // Execute all API calls
      await Promise.all([...itemPromises, monsterPromise]);

      setSuccess('Birthday items and monster have been successfully distributed to trainers!');
      
      // Clear the rolled data
      setRolledItems([]);
      setRolledMonsters([]);
      setItemAssignments({});
      setSelectedMonster(null);
      setSelectedTrainer(null);

    } catch (err) {
      console.error('Error submitting birthday roller:', err);
      setError(err.response?.data?.message || 'Failed to distribute items and monster. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="birthday-roller-container">
      <div className="birthday-roller-header">
        <h1>Birthday Roller</h1>
        <p className="birthday-roller-description">
          Roll 10 random items and 10 monsters (using default parameters), assign items to trainers, 
          select one monster to add to a trainer, then distribute everything on submit.
        </p>
      </div>

      <div className="birthday-roller-content">
        <div className="roller-controls">
          <div className="user-selection">
            <h3>Select User to Roll For:</h3>
            <select
              value={selectedUser || ''}
              onChange={(e) => setSelectedUser(e.target.value || null)}
              disabled={usersLoading || loading || submitting}
              className="user-selector"
            >
              <option value="">Select a user...</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.display_name || user.username} ({user.username})
                </option>
              ))}
            </select>
            {selectedUser && (
              <div className="selected-user-info">
                Rolling for: <strong>{users.find(u => u.id == selectedUser)?.display_name || users.find(u => u.id == selectedUser)?.username}</strong>
                <small>(Their monster table preferences will be applied)</small>
              </div>
            )}
          </div>

          <button
            className="roll-button"
            onClick={handleRoll}
            disabled={loading || submitting || !selectedUser || usersLoading}
          >
            {loading ? 'Rolling...' : 'Roll Birthday Items & Monsters'}
          </button>

          {error && <div className="roll-error">{error}</div>}
          {success && <div className="roll-success">{success}</div>}
        </div>

        {/* Items Section */}
        {rolledItems.length > 0 && (
          <div className="rolled-items-section">
            <h2>Rolled Items - Assign to Trainers</h2>
            <div className="admin-item-grid">
              {rolledItems.map((item, index) => (
                <div key={index} className={`item-card ${item.rarity || 'common'}`}>
                  <div className="item-image-container">
                    <img
                      src={item.image_url || '/images/items/default_item.png'}
                      alt={item.name}
                      className="item-image"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/images/items/default_item.png';
                      }}
                    />
                  </div>
                  <div className="item-details">
                    <h3 className="item-name">{item.name}</h3>
                    <div className="item-meta">
                      <span className="item-category">{item.category}</span>
                      <span className="item-rarity">{item.rarity || 'Common'}</span>
                    </div>
                    <div className="admin-trainer-assignment">
                      <label>Assign to Trainer:</label>
                      <AdminTrainerSelector
                        selectedTrainerId={itemAssignments[index] || ''}
                        onChange={(trainerId) => handleItemAssignmentChange(index, trainerId)}
                        placeholder="Select Trainer"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Monsters Section */}
        {rolledMonsters.length > 0 && (
          <div className="rolled-monsters-section">
            <h2>Rolled Monsters - Select One to Add to Trainer</h2>
            <div className="admin-rolled-monsters">
              {rolledMonsters.map((monster, index) => (
                <div 
                  key={index} 
                  className={`monster-card ${selectedMonster === index ? 'selected' : ''}`}
                  onClick={() => handleMonsterSelect(index)}
                >
                  <div className="monster-image-container">
                    {monster.image_url && (
                      <img
                        src={monster.image_url}
                        alt={monster.name}
                        className="monster-image"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    )}
                  </div>
                  <div className="monster-details">
                    <h3 className="monster-name">{monster.name || 'Unknown Monster'}</h3>
                    <div className="monster-meta">
                      {monster.species && (
                        <span className="monster-species">Species: {Array.isArray(monster.species) ? monster.species.join(' + ') : monster.species}</span>
                      )}
                      {monster.types && (
                        <span className="monster-types">Types: {Array.isArray(monster.types) ? monster.types.join(', ') : monster.types}</span>
                      )}
                      {monster.stage && (
                        <span className="monster-stage">Stage: {monster.stage}</span>
                      )}
                      {monster.attribute && (
                        <span className="monster-attribute">Attribute: {monster.attribute}</span>
                      )}
                    </div>
                    {selectedMonster === index && (
                      <div className="monster-selected-indicator">
                        ✓ Selected
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {selectedMonster !== null && (
              <div className="monster-trainer-assignment">
                <h3>Assign Selected Monster to Trainer:</h3>
                <AdminTrainerSelector
                  selectedTrainerId={selectedTrainer || ''}
                  onChange={handleTrainerSelect}
                  placeholder="Select Trainer"
                />
              </div>
            )}
          </div>
        )}

        {/* Submit Section */}
        {rolledItems.length > 0 && rolledMonsters.length > 0 && (
          <div className="submit-section">
            <button
              className="submit-button"
              onClick={handleSubmit}
              disabled={submitting || loading}
            >
              {submitting ? 'Distributing...' : 'Submit All Assignments'}
            </button>
            <p className="submit-description">
              This will add all assigned items to their respective trainers' inventories 
              and initialize the selected monster for the chosen trainer.
            </p>
          </div>
        )}

        {loading && <LoadingSpinner />}
      </div>
    </div>
  );
};

export default BirthdayRoller;