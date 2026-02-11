import React, { useState, useEffect } from 'react';
import api from '../../services/api';

/**
 * AdminTrainerSelector component for admin pages
 * Shows all trainers in the system, not just those belonging to the current user
 */
const AdminTrainerSelector = ({ selectedTrainerId, onChange }) => {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all trainers
  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get all trainers for admin (non-paginated)
        const response = await api.get('/trainers/all');

        // Check if the response has data in the expected format
        if (response.data && Array.isArray(response.data)) {
          setTrainers(response.data);
        } else if (response.data && Array.isArray(response.data.data)) {
          setTrainers(response.data.data);
        } else {
          console.log('Unexpected API response format:', response.data);
          setTrainers([]);
        }

        // Auto-select the first trainer if none is selected and we have trainers
        if (!selectedTrainerId && trainers.length > 0) {
          onChange(trainers[0].id);
        }

      } catch (err) {
        console.error('Error fetching trainers:', err);
        setError('Failed to load trainers');
      } finally {
        setLoading(false);
      }
    };

    fetchTrainers();
  }, [selectedTrainerId, onChange]);

  // Handle trainer selection change
  const handleTrainerChange = (e) => {
    onChange(parseInt(e.target.value));
  };

  if (loading) {
    return <div className="trainer-selector-empty">Loading trainers...</div>;
  }

  if (error) {
    return <div className="trainer-selector-empty">{error}</div>;
  }

  if (trainers.length === 0) {
    return (
      <div className="trainer-selector-empty">
        No trainers found in the system.
      </div>
    );
  }

  return (
    <div className="missions-filters">
      <label htmlFor="trainer-select">Select Trainer:</label>
      <select
        id="trainer-select"
        value={selectedTrainerId || ''}
        onChange={handleTrainerChange}
        className="trainer-select"
      >
        <option value="" disabled>Select a trainer</option>
        {trainers.map(trainer => (
          <option key={trainer.id} value={trainer.id}>
            {trainer.name} {trainer.player_name ? `(${trainer.player_name})` : ''}
          </option>
        ))}
      </select>
    </div>
  );
};

export default AdminTrainerSelector;
