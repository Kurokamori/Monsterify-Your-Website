import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@contexts/useAuth';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { SessionDisplay } from '@components/town';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { ErrorMessage } from '@components/common/ErrorMessage';
import townService from '@services/townService';
import type { ActivitySession, ActivityPrompt, ActivityFlavor } from '@components/town';
import { extractErrorMessage } from '@utils/errorUtils';
import '@styles/town/activities.css';
import '@styles/town/session.css';

export default function ActivitySessionPage() {
  useDocumentTitle('Activity Session');

  const { sessionId } = useParams<{ sessionId: string }>();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [session, setSession] = useState<ActivitySession | null>(null);
  const [prompt, setPrompt] = useState<ActivityPrompt | null>(null);
  const [flavor, setFlavor] = useState<ActivityFlavor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !sessionId) {
      if (!isAuthenticated) {
        setError('You must be logged in to view this page.');
      }
      setLoading(false);
      return;
    }

    const fetchSessionDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try garden harvest session first — redirect to rewards if found
        try {
          const gardenResponse = await townService.getGardenHarvestSession(sessionId);
          if (gardenResponse.session_id || gardenResponse.status) {
            navigate(`/town/activities/rewards/${sessionId}`, { replace: true });
            return;
          }
        } catch {
          // Not a garden harvest session, continue with regular
        }

        // Fetch regular activity session
        const response = await townService.getActivitySession(sessionId);

        if (response.success && response.session && response.prompt && response.flavor) {
          setSession({
            session_id: response.session.session_id,
            location: response.session.location,
            activity: response.session.activity,
            created_at: response.session.created_at,
          });
          setPrompt({
            id: response.prompt.prompt_id,
            prompt_text: response.prompt.prompt_text,
          });
          setFlavor({
            id: response.flavor.flavor_id,
            flavor_text: response.flavor.flavor_text,
            image_url: response.flavor.image_url,
          });
        } else {
          setError(response.message || 'Failed to load session details.');
        }
      } catch (err) {
        setError(extractErrorMessage(err, 'Failed to load session details. Please try again later.'));
      } finally {
        setLoading(false);
      }
    };

    fetchSessionDetails();
  }, [isAuthenticated, sessionId, navigate]);

  const handleReturnToActivity = () => {
    if (session?.location) {
      navigate(`/town/activities/${session.location}`);
    } else {
      navigate('/town');
    }
  };

  if (loading) {
    return (
      <div className="activity-page">
        <LoadingSpinner message="Loading activity session..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="activity-page">
        <div className="activity-page__breadcrumb">
          <Link to="/town" className="breadcrumb-link">
            <i className="fas fa-arrow-left"></i> Back to Town
          </Link>
        </div>
        <ErrorMessage
          message={error}
          onRetry={() => window.location.reload()}
          backButton={{ onClick: () => navigate('/town'), text: 'Return to Town' }}
        />
      </div>
    );
  }

  if (!session || !prompt || !flavor) {
    return (
      <div className="activity-page">
        <div className="activity-page__breadcrumb">
          <Link to="/town" className="breadcrumb-link">
            <i className="fas fa-arrow-left"></i> Back to Town
          </Link>
        </div>
        <div className="activity-page__not-found">
          <ErrorMessage message="Session data not found. Please try starting a new activity." />
          <div className="activity-page__not-found-actions">
            <Link to="/town" className="button primary">Return to Town</Link>
            <Link to="/town/activities/garden" className="button secondary">Garden</Link>
            <Link to="/town/activities/farm" className="button secondary">Farm</Link>
            <Link to="/town/activities/pirates-dock" className="button secondary">Pirate's Dock</Link>
          </div>
        </div>
      </div>
    );
  }

  const locationName = session.location
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div className="activity-page">
      <div className="activity-page__breadcrumb">
        <Link to="/town" className="breadcrumb-link">
          <i className="fas fa-arrow-left"></i> Back to Town
        </Link>
      </div>

      <div className="activity-page__header">
        <div className="activity-page__icon">
          <i className="fas fa-scroll"></i>
        </div>
        <div>
          <h1>{locationName}</h1>
          <p className="activity-page__description">
            Complete the activity to earn your rewards!
          </p>
        </div>
      </div>

      <SessionDisplay
        session={session}
        prompt={prompt}
        flavor={flavor}
        onReturnToActivity={handleReturnToActivity}
      />
    </div>
  );
}
