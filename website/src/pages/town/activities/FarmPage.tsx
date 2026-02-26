import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@contexts/useAuth';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { useActivityLocation } from '@hooks/useActivityLocation';
import { SessionDisplay, BreedMonsters } from '@components/town';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { ErrorMessage } from '@components/common/ErrorMessage';
import '@styles/town/activities.css';
import '@styles/town/session.css';
import '@styles/town/breeding.css';

export default function FarmPage() {
  useDocumentTitle('Farm');

  const { isAuthenticated } = useAuth();
  const [showBreeding, setShowBreeding] = useState(false);

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
    refreshStatus,
  } = useActivityLocation('farm');

  const farmCooldown = cooldown.farm;

  const handleBreedingComplete = () => {
    setShowBreeding(false);
    refreshStatus();
  };

  const handleBreedingCancel = () => {
    setShowBreeding(false);
  };

  if (loading) {
    return (
      <div className="activity-page">
        <LoadingSpinner message="Loading farm..." />
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
            <i className="fas fa-tractor"></i>
          </div>
          <div>
            <h1>Farm</h1>
          </div>
        </div>
        <div className="activity-page__auth">
          <p>Please log in to access the farm.</p>
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
            <i className="fas fa-arrow-left"></i> Back to Farm
          </button>
        </div>
        <div className="activity-page__header">
          <div className="activity-page__icon">
            <i className="fas fa-tractor"></i>
          </div>
          <div>
            <h1>Farm — {activityName}</h1>
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

  // Breeding view
  if (showBreeding) {
    return (
      <div className="activity-page">
        <div className="activity-page__breadcrumb">
          <button onClick={handleBreedingCancel} className="breadcrumb-link">
            <i className="fas fa-arrow-left"></i> Back to Farm
          </button>
        </div>
        <div className="activity-page__header">
          <div className="activity-page__icon">
            <i className="fas fa-egg"></i>
          </div>
          <div>
            <h1>Farm — Breed Monsters</h1>
          </div>
        </div>
        <BreedMonsters
          onBreedingComplete={handleBreedingComplete}
          onCancel={handleBreedingCancel}
        />
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
          <i className="fas fa-tractor"></i>
        </div>
        <div>
          <h1>Farm</h1>
          <p className="activity-page__description">
            Work the enchanted fields and foster new life
          </p>
        </div>
      </div>

      <div className="activity-location__description">
        <p>
          Welcome to the sprawling Heimdal City Farm! Rolling fields stretch to the horizon under golden skies,
          where mystical creatures graze alongside ordinary livestock, and crops grow with an otherworldly vigor.
          The scent of fresh earth and morning dew carries hints of magic in the air.
        </p>
        <p>
          From tending the enchanted fields to fostering new life, each endeavor offers its own rewards and adventures.
        </p>
      </div>

      {farmCooldown?.active && (
        <div className="activity-location__cooldown">
          <i className="fas fa-hourglass-half"></i>
          <span>Farm activities will reset in {farmCooldown.time_remaining}</span>
        </div>
      )}

      <div className="activity-location__grid">
        {/* Work the Farm */}
        <div className="activity-card">
          <img
            className="activity-card__image"
            src="https://i.imgur.com/fztdYkJ.png"
            alt="Work the Farm"
          />
          <div className="activity-card__body">
            <h3>Work the Farm</h3>
            {activeSession ? (
              <>
                <p>You have an active farm session in progress.</p>
                <div className="activity-card__actions">
                  <button onClick={continueSession} className="button primary">
                    <i className="fas fa-play"></i> Continue Session
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="activity-card__prompt-notice">
                  <strong>Creative Prompt:</strong> Create artwork, write a story, poem, or any creative response inspired by the farming prompt!
                </div>
                <p>
                  Toil in the magical fields where crops grow with supernatural abundance and mythical beasts aid in the harvest.
                </p>
                <div className="activity-card__actions">
                  <button
                    className="button primary"
                    onClick={() => startActivity('work')}
                    disabled={farmCooldown?.active}
                  >
                    <i className="fas fa-tractor"></i> Work the Farm
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Breed Monsters */}
        <div className="activity-card">
          <img
            className="activity-card__image"
            src="https://i.imgur.com/fztdYkJ.png"
            alt="Breed Monsters"
          />
          <div className="activity-card__body">
            <h3>Breed Monsters</h3>
            <p>
              Breed compatible monsters to create new monsters. Select one of your monsters and any monster in the game.
            </p>
            <div className="activity-card__actions">
              <button
                className="button primary"
                onClick={() => setShowBreeding(true)}
              >
                <i className="fas fa-egg"></i> Breed Monsters
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}
    </div>
  );
}
