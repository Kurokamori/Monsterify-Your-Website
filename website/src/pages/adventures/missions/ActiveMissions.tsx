import { useState, useEffect, useCallback } from 'react';
import { AutoStateContainer } from '../../../components/common/StateContainer';
import missionService from '../../../services/missionService';
import { DifficultyBadge } from './MissionCard';
import type { UserMission } from './types';
import { getProgressPercentage } from './types';
import { formatDate } from '../../../components/adventures/types';

export const ActiveMissions = () => {
  const [missions, setMissions] = useState<UserMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<number | null>(null);

  const fetchMissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await missionService.getActiveMissions();
      setMissions(response.data ?? []);
    } catch {
      setError('Failed to load active missions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMissions();
  }, [fetchMissions]);

  const handleClaimRewards = async (missionId: number) => {
    try {
      setClaimingId(missionId);
      const response = await missionService.claimRewards(missionId);
      if (response.success) {
        fetchMissions();
      } else {
        setError(response.message ?? 'Failed to claim rewards.');
      }
    } catch {
      setError('Failed to claim rewards. Please try again.');
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div className="missions-section">
      <AutoStateContainer
        loading={loading}
        error={error}
        isEmpty={missions.length === 0}
        onRetry={fetchMissions}
        loadingMessage="Loading active missions..."
        emptyMessage="You don't have any active missions."
        emptyIcon="fas fa-scroll"
      >
        <div className="missions-grid">
          {missions.map((mission) => {
            const pct = getProgressPercentage(mission.currentProgress, mission.requiredProgress);
            const isCompleted = mission.status === 'completed';
            const isClaiming = claimingId === mission.id;

            return (
              <div
                key={mission.id}
                className={`mission-card${isCompleted ? ' mission-card--completed' : ' mission-card--active'}`}
              >
                <div className="mission-card__header">
                  <h3 className="mission-card__title">{mission.title}</h3>
                  <DifficultyBadge difficulty={mission.difficulty} />
                </div>

                {mission.description && (
                  <p className="mission-card__description">{mission.description}</p>
                )}

                {/* Progress bar */}
                <div className="mission-progress">
                  <div className="mission-progress__header">
                    <span>Progress</span>
                    <span>{mission.currentProgress} / {mission.requiredProgress}</span>
                  </div>
                  <div className="progress">
                    <div
                      className={`progress-fill ${isCompleted ? 'success' : 'primary'}`}
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                  <div className="mission-progress__percentage">{pct}%</div>
                </div>

                {/* Status details */}
                <div className="mission-card__details">
                  <div className="mission-card__detail">
                    <span className="mission-card__detail-label">Status:</span>
                    <span className={`badge badge--status badge--status-${mission.status}`}>
                      {isCompleted ? 'Complete' : 'In Progress'}
                    </span>
                  </div>
                  <div className="mission-card__detail">
                    <span className="mission-card__detail-label">Remaining:</span>
                    <span>
                      {isCompleted
                        ? 'Mission Complete!'
                        : `${mission.requiredProgress - mission.currentProgress} more progress needed`}
                    </span>
                  </div>
                  <div className="mission-card__detail">
                    <span className="mission-card__detail-label">Started:</span>
                    <span>{formatDate(mission.startedAt)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mission-card__footer">
                  {isCompleted && !mission.rewardClaimed && (
                    <button
                      className="button primary"
                      onClick={() => handleClaimRewards(mission.id)}
                      disabled={isClaiming}
                    >
                      {isClaiming ? (
                        <><i className="fas fa-spinner fa-spin"></i> Claiming...</>
                      ) : (
                        <><i className="fas fa-trophy"></i> Claim Rewards</>
                      )}
                    </button>
                  )}

                  {isCompleted && mission.rewardClaimed && (
                    <div className="mission-card__claimed-badge">
                      <i className="fas fa-check-circle"></i>
                      <span>Rewards Claimed</span>
                    </div>
                  )}

                  {!isCompleted && (
                    <div className="mission-card__info-note">
                      <i className="fas fa-info-circle"></i>
                      <span>Progress is added when you submit artwork.</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </AutoStateContainer>
    </div>
  );
};
