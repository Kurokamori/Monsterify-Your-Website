import React, { useState, useEffect, useCallback } from 'react';
import adventureService from '../../services/adventureService';
import ErrorMessage from '../common/ErrorMessage';

const AdventureDetail = ({ adventureId }) => {
  // State
  const [adventure, setAdventure] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAdventureData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch adventure details
      const adventureResponse = await adventureService.getAdventureById(adventureId);
      setAdventure(adventureResponse.adventure);
      
    } catch (err) {
      console.error('Error fetching adventure data:', err);
      setError('Failed to load adventure data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [adventureId]);

  // Fetch adventure data
  useEffect(() => {
    fetchAdventureData();
  }, [fetchAdventureData]);

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (loading && !adventure) {
    return <div className="loading">Loading adventure...</div>;
  }

  if (error && !adventure) {
    return (
      <ErrorMessage 
        message={error} 
        onRetry={fetchAdventureData}
      />
    );
  }

  // Fallback data for development
  const fallbackAdventure = {
    id: adventureId,
    title: 'The Crystal Caves',
    description: 'A mysterious cave system filled with glowing crystals and ancient secrets.',
    status: 'active',
    is_custom: false,
    creator: {
      name: 'Adventure Master',
      user_id: 'system'
    },
    created_at: '2023-12-01T10:00:00Z',
    current_encounter_count: 3,
    max_encounters: 10,
    participants: []
  };

  const displayAdventure = adventure || fallbackAdventure;

  return (
    <div className="form">
      {error && (
        <ErrorMessage 
          message={error} 
          onDismiss={() => setError('')}
        />
      )}
      
      <div className="adventure-header">
        <div className="adopt-card">
          <h2>{displayAdventure.title}</h2>
          <div className={`adventure-status${displayAdventure.status}`}>
            {displayAdventure.status.charAt(0).toUpperCase() + displayAdventure.status.slice(1)}
          </div>
        </div>
        
        <p className="adventure-description">{displayAdventure.description}</p>
        
        <div className="adventure-meta">
          <div className="meta-item">
            <span className="meta-label">Created by:</span>
            <span className="meta-value">{displayAdventure.creator?.name || 'Unknown'}</span>
          </div>
          
          <div className="meta-item">
            <span className="meta-label">Created:</span>
            <span className="meta-value">{formatDate(displayAdventure.created_at)}</span>
          </div>
          
          <div className="meta-item">
            <span className="meta-label">Type:</span>
            <span className="meta-value">{displayAdventure.is_custom ? 'Custom' : 'Preset'}</span>
          </div>
        </div>
        
        <div className="adventure-discord-info">
          <h3>Join the Adventure</h3>
          <p>This adventure is managed through Discord. To participate, respond to the adventure thread in the Discord server.</p>
          <div className="discord-link">
            <i className="fab fa-discord"></i>
            <span>Adventure managed via Discord thread</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdventureDetail;
