import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import ErrorMessage from '../../../components/common/ErrorMessage';
import SessionDisplay from '../../../components/town/activities/SessionDisplay';
import BreedMonsters from '../../../components/town/BreedMonsters';

const Farm = () => {
  const { isAuthenticated, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [cooldown, setCooldown] = useState({ active: false, time_remaining: '' });

  // New state variables for session display
  const [showSession, setShowSession] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [promptData, setPromptData] = useState(null);
  const [flavorData, setFlavorData] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(false);

  // State for breeding
  const [showBreeding, setShowBreeding] = useState(false);

  // Extract fetchFarmStatus to a named function so we can call it from other functions
  const fetchFarmStatus = async () => {
    try {
      setLoading(true);
      const response = await api.get('/town/activities/farm/status');

      // Always set the active session state based on the response
      // This will clear it if there's no active session
      setActiveSession(response.data.active_session || null);

      if (response.data.cooldown) {
        setCooldown(response.data.cooldown);
      }
    } catch (err) {
      console.error('Error fetching farm status:', err);
      setError('Failed to load farm status. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchFarmStatus();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const startActivity = async (activity) => {
    try {
      setSessionLoading(true);
      const response = await api.post('/town/activities/start', {
        location: 'farm',
        activity
      });

      if (response.data.success && response.data.session_id) {
        // Instead of redirecting, fetch session details
        const sessionId = response.data.session_id;
        const sessionResponse = await api.get(`/town/activities/session/${sessionId}`);

        if (sessionResponse.data.success) {
          setSessionData(sessionResponse.data.session);
          setPromptData(sessionResponse.data.prompt);
          setFlavorData(sessionResponse.data.flavor);
          setShowSession(true);
          setActiveSession(sessionResponse.data.session);
        } else {
          setError(sessionResponse.data.message || 'Failed to load session details');
        }
      } else {
        setError('Failed to start activity. Please try again.');
      }
    } catch (err) {
      console.error('Error starting activity:', err);
      setError('Failed to start activity. Please try again later.');
    } finally {
      setSessionLoading(false);
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return (
      <div className="location-activity-container">
        <div className="quick-actions">
          <Link to="/town" className="button secondary">
            <i className="fas fa-arrow-left mr-2"></i> Back to Town
          </Link>
          <h1>Farm</h1>
        </div>
        <div className="auth-message">
          <p>Please log in to access the farm.</p>
          <Link to="/login" className="button primary">Log In</Link>
        </div>
      </div>
    );
  }

  // Function to handle continuing an active session
  const continueSession = async () => {
    try {
      setSessionLoading(true);
      const sessionResponse = await api.get(`/town/activities/session/${activeSession.session_id}`);

      if (sessionResponse.data.success) {
        setSessionData(sessionResponse.data.session);
        setPromptData(sessionResponse.data.prompt);
        setFlavorData(sessionResponse.data.flavor);
        setShowSession(true);
      } else {
        setError(sessionResponse.data.message || 'Failed to load session details');
      }
    } catch (err) {
      console.error('Error loading session:', err);
      setError('Failed to load session details. Please try again later.');
    } finally {
      setSessionLoading(false);
    }
  };

  // Function to handle session completion
  const handleSessionComplete = (rewards) => {
    // Don't reset the session state immediately
    // We want to keep showing the rewards

    // Just update the active session to null in the background
    // so that when the user returns to the activity selection,
    // they can start a new activity
    setActiveSession(null);

    // Refresh farm status in the background
    fetchFarmStatus();
  };

  // Function to return to activity selection
  const returnToActivity = async () => {
    // Reset the session state when the user explicitly chooses to return
    setShowSession(false);
    setSessionData(null);
    setPromptData(null);
    setFlavorData(null);
    
    // Force clear the active session
    setActiveSession(null);
    
    // Clear sessions on the backend
    try {
      await api.post('/town/activities/clear-session', { location: 'farm' });
    } catch (error) {
      console.error('Error clearing session:', error);
    }
    
    // Refresh farm status to get the latest state from server
    fetchFarmStatus();
  };

  // Function to start breeding
  const startBreeding = () => {
    setShowBreeding(true);
  };

  // Function to handle breeding completion
  const handleBreedingComplete = () => {
    setShowBreeding(false);
    // Refresh farm status
    fetchFarmStatus();
  };

  // Function to cancel breeding
  const handleBreedingCancel = () => {
    setShowBreeding(false);
  };

  // If we're showing a session, display the SessionDisplay component
  if (showSession && sessionData && promptData && flavorData) {
    return (
      <div className="location-activity-container">
        <div className="quick-actions">
          <button onClick={returnToActivity} className="button secondary">
            <i className="fas fa-arrow-left mr-2"></i> Back to Farm
          </button>
          <h1>Farm - {sessionData.activity.replace(/_/g, ' ')}</h1>
        </div>

        <SessionDisplay
          session={sessionData}
          prompt={promptData}
          flavor={flavorData}
          loading={sessionLoading}
          error={error}
          onSessionComplete={handleSessionComplete}
          onReturnToActivity={returnToActivity}
        />
      </div>
    );
  }

  // If we're showing breeding, display the BreedMonsters component
  if (showBreeding) {
    return (
      <div className="location-activity-container">
        <div className="quick-actions">
          <button onClick={handleBreedingCancel} className="button secondary">
            <i className="fas fa-arrow-left mr-2"></i> Back to Farm
          </button>
          <h1>Farm - Breed Monsters</h1>
        </div>

        <BreedMonsters
          onBreedingComplete={handleBreedingComplete}
          onCancel={handleBreedingCancel}
        />
      </div>
    );
  }

  if (activeSession && !showSession) {
    return (
      <div className="location-activity-container">
        <div className="quick-actions">
          <Link to="/town" className="button secondary">
            <i className="fas fa-arrow-left mr-2"></i> Back to Town
          </Link>
          <h1>Farm</h1>
        </div>
        <div className="auth-message">
          <h2>Active Session</h2>
          <p>You have an active farm session in progress.</p>
          <button onClick={continueSession} className="button primary">
            Continue Session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="location-activity-container">
      <div className="quick-actions">
        <Link to="/town" className="button secondary">
          <i className="fas fa-arrow-left mr-2"></i> Back to Town
        </Link>
        <h1>Farm</h1>
      </div>

      <div className="location-activity-content">
        <div className="location-activity-description">
          <p>
            Welcome to the sprawling Aurora Town Farm! Rolling fields stretch to the horizon under golden skies, 
            where mystical creatures graze alongside ordinary livestock, and crops grow with an otherworldly vigor. 
            The scent of fresh earth and morning dew carries hints of magic in the air.
          </p>
          <p>
            From tending the enchanted fields to fostering new life, each endeavor offers its own rewards and adventures.
          </p>
        </div>

        {cooldown.active && (
          <div className="location-activity-cooldown">
            <div className="cooldown-icon">
              <i className="fas fa-hourglass-half"></i>
            </div>
            <div className="cooldown-text">
              Farm activities will reset in {cooldown.time_remaining}
            </div>
          </div>
        )}

        <div className="location-activities">
          <div className="location-activity-card">
            <div className="npc-avatar">
              <img src="https://i.imgur.com/fztdYkJ.png" alt="Work the Farm" />
            </div>
            <div className="activity-info">
              <h3>Work the Farm</h3>
              <div className="activity-prompt-notice">
                <strong>📝 Creative Prompt:</strong> Create artwork, write a story, poem, or any creative response inspired by the farming prompt!
              </div>
              <p>Toil in the magical fields where crops grow with supernatural abundance and mythical beasts aid in the harvest.</p>
              <button
                className="button primary"
                onClick={() => startActivity('work')}
                disabled={cooldown.active}
              >
                <i className="fas fa-tractor mr-2"></i> Work the Farm
              </button>
            </div>
          </div>

          <div className="location-activity-card">
            <div className="npc-avatar">
              <img src="https://i.imgur.com/fztdYkJ.png" alt="Breed Monsters" />
            </div>
            <div className="activity-info">
              <h3>Breed Monsters</h3>
              <p>Breed compatible monsters to create new monsters. Select one of your monsters and any monster in the game.</p>
              <button
                className="button primary"
                onClick={startBreeding}
              >
                <i className="fas fa-egg mr-2"></i> Breed Monsters
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}
    </div>
  );
};

export default Farm;
