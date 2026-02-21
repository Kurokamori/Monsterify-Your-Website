import { Link } from 'react-router-dom';
import { useAuth } from '@contexts/useAuth';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { useActivityLocation } from '@hooks/useActivityLocation';
import { SessionDisplay } from '@components/town';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { ErrorMessage } from '@components/common/ErrorMessage';
import '@styles/town/activities.css';
import '@styles/town/session.css';

export default function PiratesDockPage() {
  useDocumentTitle("Pirate's Dock");

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
  } = useActivityLocation('pirates_dock');

  const swabCooldown = cooldown.swab;
  const fishingCooldown = cooldown.fishing;

  if (loading) {
    return (
      <div className="activity-page">
        <LoadingSpinner message="Loading pirate's dock..." />
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
            <i className="fas fa-anchor"></i>
          </div>
          <div>
            <h1>Pirate's Dock</h1>
          </div>
        </div>
        <div className="activity-page__auth">
          <p>Please log in to access the pirate's dock.</p>
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
            <i className="fas fa-arrow-left"></i> Back to Pirate's Dock
          </button>
        </div>
        <div className="activity-page__header">
          <div className="activity-page__icon">
            <i className="fas fa-anchor"></i>
          </div>
          <div>
            <h1>Pirate's Dock — {activityName}</h1>
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
            <i className="fas fa-anchor"></i>
          </div>
          <div>
            <h1>Pirate's Dock</h1>
          </div>
        </div>
        <div className="activity-location__active-session">
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
    <div className="activity-page">
      <div className="activity-page__breadcrumb">
        <Link to="/town" className="breadcrumb-link">
          <i className="fas fa-arrow-left"></i> Back to Town
        </Link>
      </div>

      <div className="activity-page__header">
        <div className="activity-page__icon">
          <i className="fas fa-anchor"></i>
        </div>
        <div>
          <h1>Pirate's Dock</h1>
          <p className="activity-page__description">
            Set sail for adventure and treasure on the high seas
          </p>
        </div>
      </div>

      <div className="activity-location__description">
        <p>
          Welcome to the legendary Pirate's Dock! Weathered ships creak against ancient moorings while salty sea air
          carries tales of adventure and treasure. The dock bustles with rogues, merchants, and mysterious seafolk,
          all drawn by the promise of fortune and the call of the endless ocean.
        </p>
        <p>
          Chart your course through these maritime adventures — each tide brings new opportunities for glory and riches.
        </p>
      </div>

      <div className="activity-location__grid">
        {/* Swab the Deck */}
        <div className="activity-card">
          <img
            className="activity-card__image"
            src="https://i.imgur.com/RmKySNO.png"
            alt="Swab the Deck"
          />
          <div className="activity-card__body">
            <h3>Swab the Deck</h3>
            <div className="activity-card__prompt-notice">
              <strong>Creative Prompt:</strong> Create artwork, write a story, poem, or any creative response inspired by the pirate deck prompt!
            </div>
            <p>
              Join the crew in maintaining the ship's deck while listening to tales of distant lands and buried treasure.
            </p>
            <div className="activity-card__actions">
              {swabCooldown?.active ? (
                <div className="activity-card__cooldown">
                  <i className="fas fa-hourglass-half"></i>
                  <span>Resets in {swabCooldown.time_remaining}</span>
                </div>
              ) : (
                <button
                  className="button primary"
                  onClick={() => startActivity('swab')}
                >
                  <i className="fas fa-broom"></i> Swab the Deck
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Go Fishing */}
        <div className="activity-card">
          <img
            className="activity-card__image"
            src="https://i.imgur.com/RmKySNO.png"
            alt="Go Fishing"
          />
          <div className="activity-card__body">
            <h3>Go Fishing</h3>
            <div className="activity-card__prompt-notice">
              <strong>Creative Prompt:</strong> Create artwork, write a story, poem, or any creative response inspired by the fishing prompt!
            </div>
            <p>
              Cast your line into mysterious waters where legendary sea creatures are said to dwell beneath the waves.
            </p>
            <div className="activity-card__actions">
              {fishingCooldown?.active ? (
                <div className="activity-card__cooldown">
                  <i className="fas fa-hourglass-half"></i>
                  <span>Resets in {fishingCooldown.time_remaining}</span>
                </div>
              ) : (
                <button
                  className="button primary"
                  onClick={() => startActivity('fishing')}
                >
                  <i className="fas fa-fish"></i> Go Fishing
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}
    </div>
  );
}
