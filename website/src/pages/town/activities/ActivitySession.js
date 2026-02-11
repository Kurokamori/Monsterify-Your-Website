import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';
import townService from '../../../services/townService';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import ErrorMessage from '../../../components/common/ErrorMessage';

const ActivitySession = () => {
  const { sessionId } = useParams();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [prompt, setPrompt] = useState(null);
  const [flavor, setFlavor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [rewards, setRewards] = useState(null);
  const [debugInfo, setDebugInfo] = useState({});

  console.log('ActivitySession: Component rendering with sessionId:', sessionId);
  console.log('ActivitySession: Auth state:', { isAuthenticated, userId: user?.id });

  const fetchSessionDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('ActivitySession: Fetching session details for session ID:', sessionId);

      // First, try to get garden harvest session
      try {
        const gardenResponse = await townService.getGardenHarvestSession(sessionId);
        console.log('ActivitySession: Garden Harvest API response:', gardenResponse);

        if (gardenResponse.success) {
          // This is a garden harvest session, redirect to rewards page
          navigate(`/town/activities/rewards/${sessionId}`);
          return;
        }
      } catch (gardenErr) {
        // Not a garden harvest session, continue with regular session
        console.log('Not a garden harvest session, trying regular session API');
      }

      // Regular activity session
      const response = await api.get(`/town/activities/session/${sessionId}`);
      console.log('ActivitySession: Session API response:', response.data);

      if (response.data.success) {
        setSession(response.data.session);
        setPrompt(response.data.prompt);
        setFlavor(response.data.flavor);
        if (response.data.debug) {
          setDebugInfo(response.data.debug);
        }
      } else {
        console.error('ActivitySession: API returned error:', response.data.message);
        setError(response.data.message || 'Failed to load session details');
        if (response.data.debug) {
          setDebugInfo(response.data.debug);
        }
      }
    } catch (err) {
      console.error('ActivitySession: Error fetching session details:', err);
      setError('Failed to load session details. Please try again later.');
      setDebugInfo({
        error: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && sessionId) {
      fetchSessionDetails();
    } else if (!isAuthenticated) {
      setError('You must be logged in to view this page');
      setLoading(false);
    }
  }, [isAuthenticated, sessionId, user]);

  const handleComplete = async () => {
    try {
      setSubmitting(true);
      const response = await api.post(`/town/activities/complete`, {
        sessionId
      });

      if (response.data.success) {
        setSuccess(true);
        setRewards(response.data.rewards);
      } else {
        setError(response.data.message || 'Failed to complete activity');
      }
    } catch (err) {
      console.error('Error completing activity:', err);
      setError('Failed to complete activity. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  const retryFetch = () => {
    fetchSessionDetails();
  };

  if (loading) {
    return (
      <div className="activity-session-container">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="activity-session-container">
        <ErrorMessage message={error} />
        <div className="debug-info">
          <h3>Debug Information</h3>
          <p>Session ID: {sessionId}</p>
          <p>User ID: {user?.id || 'Not logged in'}</p>
          <p>API URL: {`/town/activities/session/${sessionId}`}</p>
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          <div className="debug-actions">
            <button onClick={retryFetch} className="button primary">Retry</button>
            <Link to="/town" className="button secondary">Return to Town</Link>
          </div>
        </div>
      </div>
    );
  }

  if (success && rewards) {
    return (
      <div className="activity-session-container">
        <div className="adopt-card">
          <Link to="/town" className="button secondary">
            <i className="fas fa-arrow-left mr-2"></i> Back to Town
          </Link>
          <h2>Activity Completed!</h2>
        </div>

        <div className="activity-session-content">
          <div className="activity-rewards">
            <h3>Congratulations!</h3>
            <p>You've successfully completed the activity at {session.location}.</p>

            <div className="rewards-list">
              <h4>Your Rewards:</h4>
              <ul>
                {rewards.map((reward, index) => (
                  <li key={index} className="reward-item">
                    <span className="reward-icon">
                      {reward.type === 'coins' ? '💰' :
                       reward.type === 'xp' ? '⭐' :
                       reward.type === 'item' ? '🎁' : '🏆'}
                    </span>
                    <span className="reward-details">
                      {reward.amount} {reward.type}
                      {reward.description && <span className="reward-description"> - {reward.description}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rewards-actions">
              <Link to="/town" className="button primary">Return to Town</Link>
              <Link to="/profile" className="button secondary">View Profile</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!session || !prompt || !flavor) {
    return (
      <div className="activity-session-container">
        <ErrorMessage message="Session data not found. Please try starting a new activity." />
        <div className="debug-info">
          <h3>Debug Information</h3>
          <p>Session ID: {sessionId}</p>
          <p>User ID: {user?.id || 'Not logged in'}</p>
          <p>API URL: {`/town/activities/session/${sessionId}`}</p>
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          <div className="debug-actions">
            <button onClick={retryFetch} className="button primary">Retry</button>
            <Link to="/town" className="button secondary">Return to Town</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="activity-session-container">
      <div className="adopt-card">
        <Link to="/town" className="button secondary">
          <i className="fas fa-arrow-left mr-2"></i> Back to Town
        </Link>
        <h2>{session.location} - {session.activity}</h2>
      </div>

      <div className="activity-session-content">
        <div className="activity-flavor">
          {flavor.image_url && (
            <img
              src={flavor.image_url}
              alt={`${session.location} ${session.activity}`}
              className="npc-avatar"
            />
          )}
          <p className="flavor-text">{flavor.flavor_text}</p>
        </div>

        <div className="info-item">
          <h3>Your Task</h3>
          <p>{prompt.prompt_text}</p>
        </div>

        <div className="activity-completion">
          <p>Complete this activity to earn your rewards!</p>
          <button
            className="button success"
            onClick={handleComplete}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Completing...
              </>
            ) : (
              <>
                <i className="fas fa-check"></i> Done
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivitySession;



