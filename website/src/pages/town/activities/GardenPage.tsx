import { Link } from 'react-router-dom';
import { useAuth } from '@contexts/useAuth';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { useActivityLocation } from '@hooks/useActivityLocation';
import { SessionDisplay } from '@components/town';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { ErrorMessage } from '@components/common/ErrorMessage';
import '@styles/town/activities.css';
import '@styles/town/session.css';

export default function GardenPage() {
  useDocumentTitle('Garden');

  const { isAuthenticated } = useAuth();

  const {
    loading,
    error,
    activeSession,
    cooldown,
    showSession,
    sessionData,
    promptData,
    flavorData,
    sessionLoading,
    startActivity,
    continueSession,
    returnToActivity,
  } = useActivityLocation('garden');

  const gardenCooldown = cooldown.garden;

  if (loading) {
    return (
      <div className="activity-page">
        <LoadingSpinner message="Loading garden..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="activity-page">
        <div className="activity-page__breadcrumb">
          <Link to="/town" className="breadcrumb-link">
            <i className="fas fa-arrow-left"></i> Back to Town
          </Link>
        </div>
        <div className="activity-page__header">
          <div className="activity-page__icon">
            <i className="fas fa-seedling"></i>
          </div>
          <div>
            <h1>Garden</h1>
          </div>
        </div>
        <div className="activity-page__auth">
          <p>Please log in to access the garden.</p>
          <Link to="/login" className="button primary">Log In</Link>
        </div>
      </div>
    );
  }

  // Session view
  if (showSession && sessionData && promptData && flavorData) {
    const activityName = sessionData.activity.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    return (
      <div className="activity-page">
        <div className="activity-page__breadcrumb">
          <button onClick={returnToActivity} className="breadcrumb-link">
            <i className="fas fa-arrow-left"></i> Back to Garden
          </button>
        </div>
        <div className="activity-page__header">
          <div className="activity-page__icon">
            <i className="fas fa-seedling"></i>
          </div>
          <div>
            <h1>Garden — {activityName}</h1>
          </div>
        </div>
        <SessionDisplay
          session={sessionData}
          prompt={promptData}
          flavor={flavorData}
          loading={sessionLoading}
          error={error}
          onReturnToActivity={returnToActivity}
        />
      </div>
    );
  }

  // Active session prompt
  if (activeSession && !showSession) {
    return (
      <div className="activity-page">
        <div className="activity-page__breadcrumb">
          <Link to="/town" className="breadcrumb-link">
            <i className="fas fa-arrow-left"></i> Back to Town
          </Link>
        </div>
        <div className="activity-page__header">
          <div className="activity-page__icon">
            <i className="fas fa-seedling"></i>
          </div>
          <div>
            <h1>Garden</h1>
          </div>
        </div>
        <div className="activity-location__active-session">
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
    <div className="activity-page">
      <div className="activity-page__breadcrumb">
        <Link to="/town" className="breadcrumb-link">
          <i className="fas fa-arrow-left"></i> Back to Town
        </Link>
      </div>

      <div className="activity-page__header">
        <div className="activity-page__icon">
          <i className="fas fa-seedling"></i>
        </div>
        <div>
          <h1>Garden</h1>
          <p className="activity-page__description">
            Nurture magical plants and harvest enchanted rewards
          </p>
        </div>
      </div>

      <div className="activity-location__description">
        <p>
          Welcome to the mystical Aurora Town Garden! Ancient magic flows through these enchanted grounds,
          where luminescent flowers bloom under starlight and crystal-clear streams carry whispers of old spells.
          Here, the boundary between nature and wonder grows thin.
        </p>
        <p>
          Choose your path through this magical sanctuary — each holds its own mysteries and rewards.
        </p>
      </div>

      {gardenCooldown?.active && (
        <div className="activity-location__cooldown">
          <i className="fas fa-hourglass-half"></i>
          <span>Garden activities will reset in {gardenCooldown.time_remaining}</span>
        </div>
      )}

      <div className="activity-location__grid">
        {/* Tend Garden */}
        <div className="activity-card">
          <img
            className="activity-card__image"
            src="https://i.imgur.com/Z5dNHXv.jpeg"
            alt="Tend Garden"
          />
          <div className="activity-card__body">
            <h3>Tend Garden</h3>
            <div className="activity-card__prompt-notice">
              <strong>Creative Prompt:</strong> Create artwork, write a story, poem, or any creative response inspired by the gardening prompt!
            </div>
            <p>
              Nurture the magical plants and commune with the ancient spirits that dwell among the enchanted blooms.
            </p>
            <div className="activity-card__actions">
              <button
                className="button primary"
                onClick={() => startActivity('tend')}
                disabled={gardenCooldown?.active}
              >
                <i className="fas fa-seedling"></i> Tend Garden
              </button>
            </div>
          </div>
        </div>

        {/* Harvest Garden */}
        <div className="activity-card">
          <img
            className="activity-card__image"
            src="https://i.imgur.com/Z5dNHXv.jpeg"
            alt="Harvest Garden"
          />
          <div className="activity-card__body">
            <h3>Harvest Garden</h3>
            <p>
              Harvest your garden points to collect berries and possibly find monsters!
            </p>
            <div className="activity-card__actions">
              <Link to="/town/activities/garden/harvest" className="button primary">
                <i className="fas fa-hand-holding-heart"></i> Harvest Garden
              </Link>
            </div>
          </div>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}
    </div>
  );
}
