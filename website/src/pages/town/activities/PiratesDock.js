import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import ErrorMessage from '../../../components/common/ErrorMessage';
import SessionDisplay from '../../../components/town/activities/SessionDisplay';

const PiratesDock = () => {
  const { isAuthenticated, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [cooldown, setCooldown] = useState({
    swab: { active: false, time_remaining: '' },
    fishing: { active: false, time_remaining: '' }
  });

  // New state variables for session display
  const [showSession, setShowSession] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [promptData, setPromptData] = useState(null);
  const [flavorData, setFlavorData] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(false);

  // Extract fetchPiratesDockStatus to a named function so we can call it from other functions
  const fetchPiratesDockStatus = async () => {
    try {
      setLoading(true);
      const response = await api.get('/town/activities/pirates-dock/status');

      // Always set the active session state based on the response
      // This will clear it if there's no active session
      setActiveSession(response.data.active_session || null);

      if (response.data.cooldown) {
        setCooldown(response.data.cooldown);
      }
    } catch (err) {
      console.error('Error fetching pirates dock status:', err);
      setError('Failed to load pirates dock status. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchPiratesDockStatus();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const startActivity = async (activity) => {
    try {
      setSessionLoading(true);
      const response = await api.post('/town/activities/start', {
        location: 'pirates_dock',
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
          <h1>Pirate's Dock</h1>
        </div>
        <div className="auth-message">
          <p>Please log in to access the pirate's dock.</p>
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

    // Refresh pirates dock status in the background
    fetchPiratesDockStatus();
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
      await api.post('/town/activities/clear-session', { location: 'pirates_dock' });
    } catch (error) {
      console.error('Error clearing session:', error);
    }
    
    // Refresh pirates dock status to get the latest state from server
    fetchPiratesDockStatus();
  };

  // If we're showing a session, display the SessionDisplay component
  if (showSession && sessionData && promptData && flavorData) {
    return (
      <div className="location-activity-container">
        <div className="quick-actions">
          <button onClick={returnToActivity} className="button secondary">
            <i className="fas fa-arrow-left mr-2"></i> Back to Pirate's Dock
          </button>
          <h1>Pirate's Dock - {sessionData.activity.replace(/_/g, ' ')}</h1>
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

  if (activeSession && !showSession) {
    return (
      <div className="location-activity-container">
        <div className="quick-actions">
          <Link to="/town" className="button secondary">
            <i className="fas fa-arrow-left mr-2"></i> Back to Town
          </Link>
          <h1>Pirate's Dock</h1>
        </div>
        <div className="auth-message">
          <h2>Active Session</h2>
          <p>You have an active pirate's dock session in progress.</p>
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
        <h1>Pirate's Dock</h1>
      </div>

      <div className="location-activity-content">
        <div className="location-activity-description">
          <p>
            Welcome to the legendary Pirate's Dock! Weathered ships creak against ancient moorings while salty sea air 
            carries tales of adventure and treasure. The dock bustles with rogues, merchants, and mysterious seafolk, 
            all drawn by the promise of fortune and the call of the endless ocean.
          </p>
          <p>
            Chart your course through these maritime adventures - each tide brings new opportunities for glory and riches.
          </p>
        </div>

        <div className="location-activities">
          <div className="location-activity-card">
            <div className="image-container activity">
              <img src="https://i.imgur.com/RmKySNO.png" alt="Swab the Deck" />
            </div>
            <div className="activity-info">
              <h3>Swab the Deck</h3>
              <div className="activity-prompt-notice">
                <strong>📝 Creative Prompt:</strong> Create artwork, write a story, poem, or any creative response inspired by the pirate deck prompt!
              </div>
              <p>Join the crew in maintaining the ship's deck while listening to tales of distant lands and buried treasure.</p>
              {cooldown.swab.active ? (
                <div className="cooldown-indicator">
                  <i className="fas fa-hourglass-half mr-2"></i>
                  Resets in {cooldown.swab.time_remaining}
                </div>
              ) : (
                <button
                  className="button primary"
                  onClick={() => startActivity('swab')}
                >
                  <i className="fas fa-broom mr-2"></i> Swab the Deck
                </button>
              )}
            </div>
          </div>

          <div className="location-activity-card">
            <div className="image-container activity">
              <img src="https://i.imgur.com/RmKySNO.png" alt="Go Fishing" />
            </div>
            <div className="activity-info">
              <h3>Go Fishing</h3>
              <div className="activity-prompt-notice">
                <strong>📝 Creative Prompt:</strong> Create artwork, write a story, poem, or any creative response inspired by the fishing prompt!
              </div>
              <p>Cast your line into mysterious waters where legendary sea creatures are said to dwell beneath the waves.</p>
              {cooldown.fishing.active ? (
                <div className="cooldown-indicator">
                  <i className="fas fa-hourglass-half mr-2"></i>
                  Resets in {cooldown.fishing.time_remaining}
                </div>
              ) : (
                <button
                  className="button primary"
                  onClick={() => startActivity('fishing')}
                >
                  <i className="fas fa-fish mr-2"></i> Go Fishing
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}
    </div>
  );
};

export default PiratesDock;
