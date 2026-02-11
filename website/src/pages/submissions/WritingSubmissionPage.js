import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import WritingSubmissionForm from '../../components/submissions/WritingSubmissionForm';
import LoadingSpinner from '../../components/common/LoadingSpinner';


const WritingSubmissionPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get bookId from URL params for "Add Chapter" flow
  const preselectedBookId = searchParams.get('bookId');

  // State
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // State for submission result
  const [submissionResult, setSubmissionResult] = useState(null);

  // Handle submission complete
  const handleSubmissionComplete = (result) => {
    setSubmissionSuccess(true);

    // Keep the result as-is to preserve object structure for proper display
    setSubmissionResult(result);
    setLoading(false);

    console.log('Submission result:', result);

    // Redirect to library after a short delay
    setTimeout(() => {
      navigate('/library');
    }, 5000);
  };

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    navigate('/login?redirect=/submissions/writing');
    return null;
  }

  return (
    <div className="edit-monster-container">
      <div className="map-header">
        <h1>{preselectedBookId ? 'Add Chapter' : 'Submit Writing'}</h1>
        <p className="description">
          {preselectedBookId
            ? 'Add a new chapter to your book and earn rewards based on word count.'
            : 'Share your stories, poems, and other written works with the community and earn rewards based on word count and quality.'}
        </p>
      </div>

      {submissionSuccess ? (
        <div className="submission-success">
          <div className="success-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <h2>Submission Successful!</h2>
          <p>
            Your submission has been received and processed successfully!
            Thank you for your contribution to the community!
          </p>

          {submissionResult && submissionResult.rewards && (
            <div className="rewards-summary">
              <h3>Rewards Earned</h3>
              <div className="town-places">
                <div className="reward-item">
                  <i className="fas fa-book"></i>
                  <h4>Writing Rewards</h4>
                  <p>
                    {submissionResult.rewards.levels} levels and {submissionResult.rewards.coins} coins
                    {submissionResult.rewards.trainerId && ` for trainer #${submissionResult.rewards.trainerId}`}
                    {submissionResult.rewards.monsterId && ` for monster #${submissionResult.rewards.monsterId}`}
                  </p>
                  {submissionResult.rewards.cappedLevels > 0 && (
                    <p className="capped-levels">
                      {submissionResult.rewards.cappedLevels} levels were capped (level 100 reached)
                    </p>
                  )}
                </div>

                <div className="reward-item">
                  <i className="fas fa-seedling"></i>
                  <h4>Garden Points</h4>
                  <p>
                    {typeof submissionResult.rewards.gardenPoints === 'object'
                      ? (submissionResult.rewards.gardenPoints.amount || 0)
                      : submissionResult.rewards.gardenPoints} points
                  </p>
                </div>

                <div className="reward-item">
                  <i className="fas fa-tasks"></i>
                  <h4>Mission Progress</h4>
                  {typeof submissionResult.rewards.missionProgress === 'object' ? (
                    <div>
                      <p>{submissionResult.rewards.missionProgress.amount || 0} progress</p>
                      {submissionResult.rewards.missionProgress.message && (
                        <p className="reward-detail">{submissionResult.rewards.missionProgress.message}</p>
                      )}
                      {submissionResult.rewards.missionProgress.updatedMissions &&
                       submissionResult.rewards.missionProgress.updatedMissions.length > 0 && (
                        <div className="mission-updates">
                          <p className="reward-detail">Updated missions:</p>
                          <ul>
                            {submissionResult.rewards.missionProgress.updatedMissions.map((mission, index) => (
                              <li key={index}>{mission.title}: {mission.current_progress}/{mission.required_progress}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {submissionResult.rewards.missionProgress.completedMissions &&
                       submissionResult.rewards.missionProgress.completedMissions.length > 0 && (
                        <div className="mission-updates">
                          <p className="reward-detail">Completed missions:</p>
                          <ul>
                            {submissionResult.rewards.missionProgress.completedMissions.map((mission, index) => (
                              <li key={index}>{mission.title} - Ready to claim rewards!</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p>{submissionResult.rewards.missionProgress} progress</p>
                  )}
                </div>

                <div className="reward-item">
                  <i className="fas fa-fist-raised"></i>
                  <h4>Boss Damage</h4>
                  {typeof submissionResult.rewards.bossDamage === 'object' ? (
                    <div>
                      <p>{submissionResult.rewards.bossDamage.amount || 0} damage</p>
                      {submissionResult.rewards.bossDamage.results &&
                       submissionResult.rewards.bossDamage.results.length > 0 && (
                        <div className="boss-damage-results">
                          {submissionResult.rewards.bossDamage.results.map((result, index) => (
                            <div key={index} className="boss-result">
                              <p className="reward-detail">
                                Dealt {result.damage} damage to {result.boss?.name || 'Boss'}
                              </p>
                              {result.boss && (
                                <p className="reward-detail">
                                  Boss Health: {result.boss.currentHealth}/{result.boss.totalHealth}
                                  ({result.boss.healthPercentage}%)
                                  {result.boss.wasDefeated && <span className="boss-defeated"> - DEFEATED!</span>}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p>{submissionResult.rewards.bossDamage} damage</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <p>Redirecting to library in 5 seconds...</p>
          {loading && <LoadingSpinner />}
        </div>
      ) : (
        <div className="town-section">
          <WritingSubmissionForm onSubmissionComplete={handleSubmissionComplete} preselectedBookId={preselectedBookId} />
        </div>
      )}
    </div>
  );
};

export default WritingSubmissionPage;
