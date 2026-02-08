import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import ErrorMessage from '../../../components/common/ErrorMessage';
import SessionDisplay from '../../../components/town/activities/SessionDisplay';
import GardenHarvest from '../../../components/town/GardenHarvest';

const Garden = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [cooldown, setCooldown] = useState({ active: false, time_remaining: '' });
  const [activeTab, setActiveTab] = useState('garden');

  // New state variables for session display
  const [showSession, setShowSession] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [promptData, setPromptData] = useState(null);
  const [flavorData, setFlavorData] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(false);

  // Extract fetchGardenStatus to a named function so we can call it from other functions
  const fetchGardenStatus = async () => {
    try {
      setLoading(true);
      const response = await api.get('/town/activities/garden/status');

      // Always set the active session state based on the response
      // This will clear it if there's no active session
      setActiveSession(response.data.active_session || null);

      if (response.data.cooldown) {
        setCooldown(response.data.cooldown);
      }
    } catch (err) {
      console.error('Error fetching garden status:', err);
      setError('Failed to load garden status. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchGardenStatus();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const startActivity = async (activity) => {
    try {
      setSessionLoading(true);
      const response = await api.post('/town/activities/start', {
        location: 'garden',
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
          <h1>Garden</h1>
        </div>
        <div className="auth-message">
          <p>Please log in to access the garden.</p>
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

    // Refresh garden status in the background
    fetchGardenStatus();
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
      await api.post('/town/activities/clear-session', { location: 'garden' });
    } catch (error) {
      console.error('Error clearing session:', error);
    }
    
    // Refresh garden status to get the latest state from server
    fetchGardenStatus();
  };



  // If we're showing a session, display the SessionDisplay component
  if (showSession && sessionData && promptData && flavorData) {
    return (
      <div className="location-activity-container">
        <div className="quick-actions">
          <button onClick={returnToActivity} className="button secondary">
            <i className="fas fa-arrow-left mr-2"></i> Back to Garden
          </button>
          <h1>Garden - {sessionData.activity.replace(/_/g, ' ')}</h1>
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
          <h1>Garden</h1>
        </div>
        <div className="auth-message">
          <h2>Active Session</h2>
          <p>You have an active garden session in progress.</p>
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
        <h1>Garden</h1>
      </div>

      {activeTab === 'garden' ? (
        <div className="location-activity-content">
          <div className="location-activity-description">
            <p>
              Welcome to the mystical Aurora Town Garden! Ancient magic flows through these enchanted grounds, 
              where luminescent flowers bloom under starlight and crystal-clear streams carry whispers of old spells. 
              Here, the boundary between nature and wonder grows thin.
            </p>
            <p>
              Choose your path through this magical sanctuary - each holds its own mysteries and rewards.
            </p>
          </div>

          {cooldown.active && (
            <div className="location-activity-cooldown">
              <div className="cooldown-icon">
                <i className="fas fa-hourglass-half"></i>
              </div>
              <div className="cooldown-text">
                Garden activities will reset in {cooldown.time_remaining}
              </div>
            </div>
          )}

          <div className="location-activities">
            <div className="location-activity-card">
              <div className="npc-avatar">
                <img src="https://i.imgur.com/Z5dNHXv.jpeg" alt="Tend Garden" />
              </div>
              <div className="activity-info">
                <h3>Tend Garden</h3>
                <div className="activity-prompt-notice">
                  <strong>📝 Creative Prompt:</strong> Create artwork, write a story, poem, or any creative response inspired by the gardening prompt!
                </div>
                <p>Nurture the magical plants and commune with the ancient spirits that dwell among the enchanted blooms.</p>
                <button
                  className="button primary"
                  onClick={() => startActivity('tend')}
                  disabled={cooldown.active}
                >
                  <i className="fas fa-seedling mr-2"></i> Tend Garden
                </button>
              </div>
            </div>

            <div className="location-activity-card">
              <div className="npc-avatar">
                <img src="https://i.imgur.com/Z5dNHXv.jpeg" alt="Harvest Garden" />
              </div>
              <div className="activity-info">
                <h3>Harvest Garden</h3>
                <p>Harvest your garden points to collect berries and possibly find monsters!</p>
                <button
                  className="button primary"
                  onClick={() => setActiveTab('harvest')}
                >
                  <i className="fas fa-hand-holding-heart mr-2"></i> Harvest Garden
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'harvest' ? (
        <div className="location-activity-content">
          <div className="location-activity-tabs">
            <button
              className="button tab"
              onClick={() => setActiveTab('garden')}
            >
              <i className="fas fa-arrow-left mr-2"></i> Back to Garden
            </button>
          </div>

          <GardenHarvest />
        </div>
      ) : null}

      {error && <ErrorMessage message={error} />}
    </div>
  );
};

export default Garden;
