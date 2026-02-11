import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import trainerService from '../../services/trainerService';

const TrainerSelector = ({ selectedTrainerId, onChange, trainers: propTrainers }) => {
  // Ensure propTrainers is an array if provided
  const safeTrainers = Array.isArray(propTrainers) ? propTrainers : [];

  const [trainers, setTrainers] = useState(safeTrainers);
  const [loading, setLoading] = useState(!propTrainers);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  // If trainers are provided as props, use them
  useEffect(() => {
    if (propTrainers) {
      // Ensure we always set an array
      const trainersArray = Array.isArray(propTrainers) ? propTrainers : [];
      setTrainers(trainersArray);
      setLoading(false);

      // Auto-select the first trainer if none is selected
      if (!selectedTrainerId && trainersArray.length > 0) {
        onChange(trainersArray[0].id);
      }
    }
  }, [propTrainers, selectedTrainerId, onChange]);

  // Fetch trainers for the user if not provided as props
  useEffect(() => {
    const fetchTrainers = async () => {
      // Skip fetching if trainers are provided as props
      if (propTrainers) return;

      try {
        setLoading(true);
        setError(null);

        const userId = currentUser?.discord_id;

        // Get all trainers for the current user (no limit)
        const response = await trainerService.getUserTrainers(userId);

        // Ensure we always set an array
        const responseData = response.trainers || [];
        const trainersArray = Array.isArray(responseData) ? responseData : [];

        setTrainers(trainersArray);

        // Auto-select the first trainer if none is selected
        if (!selectedTrainerId && trainersArray.length > 0) {
          onChange(trainersArray[0].id);
        }

      } catch (err) {
        console.error('Error fetching trainers:', err);
        setError('Failed to load trainers');
        // Set empty array on error
        setTrainers([]);
      } finally {
        setLoading(false);
      }
    };

    if (!propTrainers) {
      fetchTrainers();
    }
  }, [selectedTrainerId, onChange, propTrainers, currentUser, trainerService]);

  // Handle trainer selection change
  const handleTrainerChange = (e) => {
    // Make sure we're passing a number, not a string
    const trainerId = e.target.value ? parseInt(e.target.value, 10) : null;
    onChange(trainerId);
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
        No trainers found. Please create a trainer first.
      </div>
    );
  }

  // Final safety check to ensure trainers is an array before rendering
  const renderTrainers = Array.isArray(trainers) ? trainers : [];

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
        {renderTrainers.map(trainer => (
          <option
            key={trainer.id || 'unknown'}
            value={trainer.id || 0}
            disabled={trainer.disabled}
          >
            {trainer.name || 'Unknown Trainer'}
          </option>
        ))}
      </select>
    </div>
  );
};

export default TrainerSelector;
