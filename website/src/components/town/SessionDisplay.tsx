import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import { Card } from '../common/Card';
import { ActionButtonGroup } from '../common/ActionButtonGroup';
import api from '../../services/api';
import { extractErrorMessage } from '../../utils/errorUtils';
import type {
  ActivitySession,
  ActivityPrompt,
  ActivityFlavor,
} from './types';

interface SessionDisplayProps {
  session: ActivitySession;
  prompt: ActivityPrompt;
  flavor: ActivityFlavor;
  onReturnToActivity?: () => void;
  loading?: boolean;
  error?: string | null;
}

interface AuthUser {
  discord_id?: string;
  is_admin?: boolean;
}

/**
 * SessionDisplay - Displays an activity session with prompt, timer, and
 * a "Done" button. On completion, navigates to the shared ActivityRewardsPage.
 */
export function SessionDisplay({
  session,
  prompt,
  flavor,
  onReturnToActivity,
  loading = false,
  error = null
}: SessionDisplayProps) {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [canSubmit, setCanSubmit] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);

  // Load current user
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setCurrentUser(JSON.parse(userData));
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);

  // Initialize session and check admin status
  useEffect(() => {
    if (session && !sessionStartTime) {
      setSessionStartTime(Date.now());
      if (currentUser?.is_admin) {
        setCanSubmit(true);
        setTimeRemaining(0);
      }
    }
  }, [session, currentUser, sessionStartTime]);

  // Cooldown timer
  useEffect(() => {
    if (!sessionStartTime || currentUser?.is_admin) return;

    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
      const remaining = Math.max(0, 60 - elapsed);

      setTimeRemaining(remaining);

      if (remaining === 0) {
        setCanSubmit(true);
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionStartTime, currentUser]);

  // Complete activity — navigate to the rewards page
  const handleComplete = async () => {
    try {
      setSubmitting(true);
      setSubmitError(null);

      const response = await api.post('/town/activities/complete', {
        sessionId: session.session_id
      });

      if (response.data.success) {
        navigate(`/town/activities/rewards/${session.session_id}`);
      } else {
        setSubmitError(response.data.message || 'Failed to submit activity');
      }
    } catch (err) {
      console.error('Error submitting activity:', err);
      setSubmitError(extractErrorMessage(err, 'Failed to submit activity. Please try again later.'));
    } finally {
      setSubmitting(false);
    }
  };

  // Format time remaining
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="session-display session-display--loading">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="session-display">
        <ErrorMessage message={error} />
        <ActionButtonGroup align="center" className="mt-md">
          <button onClick={onReturnToActivity} className="button secondary">
            Return to Activity
          </button>
        </ActionButtonGroup>
      </div>
    );
  }

  if (!session || !prompt || !flavor) {
    return (
      <div className="session-display">
        <ErrorMessage message="Session data not found. Please try starting a new activity." />
        <ActionButtonGroup align="center" className="mt-md">
          <button onClick={onReturnToActivity} className="button secondary">
            Return to Activity
          </button>
        </ActionButtonGroup>
      </div>
    );
  }

  return (
    <div className="session-display">
      <div className="session-display__content">
        {/* Flavor text with NPC */}
        <div className="session-display__flavor mb-md">
          {flavor.image_url && (
            <img
              src={flavor.image_url}
              alt={`${session.location} ${session.activity}`}
              className="session-display__npc-avatar"
            />
          )}
          <p className="session-display__flavor-text">{flavor.flavor_text}</p>
        </div>

        {/* Prompt */}
        <Card className="mb-md">
          <div className="card__content">
            <h3 className="mb-xs">Your Creative Prompt</h3>
            <p><strong>Prompt:</strong> {prompt.prompt_text}</p>
            <div className="info-box mt-sm">
              <p>
                <strong>Instructions:</strong> Create artwork, write a story, poem, or any creative response inspired by this prompt.
                This is a creative activity - trainers are not required to be included in your creation, but feel free to include them if you'd like!
              </p>
              <p className="text-muted mt-xs">
                <em>Express your creativity through any medium that inspires you!</em>
              </p>
            </div>
          </div>
        </Card>

        {/* Completion section */}
        <div className="session-display__completion">
          <p className="text-center mb-sm">
            When you've completed your creative work, click Done to earn your rewards!
          </p>

          {!canSubmit && !currentUser?.is_admin && (
            <div className="info-box info-box--warning mb-sm">
              <p>
                <i className="fas fa-clock"></i> Please wait {formatTime(timeRemaining)} before submitting
              </p>
              <p className="text-muted">
                <em>This gives you time to create something wonderful!</em>
              </p>
            </div>
          )}

          <ActionButtonGroup align="center">
            <button
              className="button success lg"
              onClick={handleComplete}
              disabled={submitting || (!canSubmit && !currentUser?.is_admin)}
            >
              {submitting ? (
                <><i className="fas fa-spinner fa-spin"></i> Completing...</>
              ) : !canSubmit && !currentUser?.is_admin ? (
                <><i className="fas fa-clock"></i> Please Wait ({formatTime(timeRemaining)})</>
              ) : (
                <><i className="fas fa-check"></i> Done</>
              )}
            </button>
          </ActionButtonGroup>
        </div>

        {submitError && <ErrorMessage message={submitError} />}
      </div>
    </div>
  );
}

export default SessionDisplay;
