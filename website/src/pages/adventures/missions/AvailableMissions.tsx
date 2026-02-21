import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AutoStateContainer } from '../../../components/common/StateContainer';
import missionService from '../../../services/missionService';
import { MissionCard } from './MissionCard';
import type { Mission, UserMission } from './types';
import { getDifficultyConfig, getProgressPercentage } from './types';
import { formatDate } from '../../../components/adventures/types';

export const AvailableMissions = () => {
  const navigate = useNavigate();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [activeMissions, setActiveMissions] = useState<UserMission[]>([]);
  const [hasActiveMission, setHasActiveMission] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [claimingId, setClaimingId] = useState<number | null>(null);

  const fetchMissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await missionService.getAvailableMissions();
      const available: Mission[] = response.data ?? [];

      const filtered = selectedDifficulty === 'all'
        ? available
        : available.filter((m: Mission) => m.difficulty === selectedDifficulty);

      setMissions(filtered);
      setHasActiveMission(response.hasActiveMission ?? false);
      setActiveMissions(response.activeMissions ?? []);
    } catch {
      setError('Failed to load missions.');
    } finally {
      setLoading(false);
    }
  }, [selectedDifficulty]);

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
        isEmpty={!hasActiveMission && missions.length === 0}
        onRetry={fetchMissions}
        loadingMessage="Loading missions..."
        emptyMessage="No missions available at the moment. Check back later!"
        emptyIcon="fas fa-scroll"
      >
        {/* Active missions displayed on top */}
        {hasActiveMission && activeMissions.length > 0 && (
          <div className="active-missions-hero">
            <h3 className="active-missions-hero__title">
              <i className="fas fa-compass"></i> Active Missions
            </h3>

            {activeMissions.map((m) => {
              const pct = getProgressPercentage(m.currentProgress, m.requiredProgress);
              const config = getDifficultyConfig(m.difficulty);
              const isCompleted = m.status === 'completed';
              const isClaiming = claimingId === m.id;

              return (
                <div
                  key={m.id}
                  className={`active-mission-card${isCompleted ? ' active-mission-card--completed' : ''}`}
                >
                  <div className="active-mission-card__header">
                    <div className="active-mission-card__title-row">
                      <h4 className="active-mission-card__title">{m.title}</h4>
                      <span className="mission-card__difficulty" style={{ backgroundColor: config.color }}>
                        <i className={config.icon}></i> {config.label}
                      </span>
                    </div>
                    {m.description && (
                      <p className="active-mission-card__description">{m.description}</p>
                    )}
                  </div>

                  {/* Monster squad */}
                  {m.monsters && m.monsters.length > 0 && (
                    <div className="active-mission-card__monsters">
                      <span className="active-mission-card__monsters-label">
                        <i className="fas fa-paw"></i> Deployed Monsters
                      </span>
                      <div className="mission-monster-row">
                        {m.monsters.map((monster) => (
                          <div key={monster.id} className="mission-monster-avatar">
                            <img
                              src={monster.imgLink || '/images/default_monster.png'}
                              alt={monster.name}
                              className="mission-monster-avatar__img"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.onerror = null;
                                target.src = '/images/default_monster.png';
                              }}
                            />
                            <span className="mission-monster-avatar__name">{monster.name}</span>
                            <span className="mission-monster-avatar__level">Lv. {monster.level}</span>
                            {monster.types.length > 0 && (
                              <div className="mission-monster-avatar__types">
                                {monster.types.map((type) => (
                                  <span key={type} className="badge badge--type xs">{type}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Progress */}
                  <div className="mission-progress">
                    <div className="mission-progress__header">
                      <span>Progress</span>
                      <span>{m.currentProgress} / {m.requiredProgress}</span>
                    </div>
                    <div className="progress">
                      <div
                        className={`progress-fill ${isCompleted ? 'success' : 'primary'}`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                    <div className="mission-progress__percentage">{pct}%</div>
                  </div>

                  {/* Footer info/actions */}
                  <div className="active-mission-card__footer">
                    <div className="active-mission-card__meta">
                      <span className={`badge badge--status badge--status-${m.status}`}>
                        {isCompleted ? 'Complete' : 'In Progress'}
                      </span>
                      <span className="active-mission-card__date">
                        Started {formatDate(m.startedAt)}
                      </span>
                    </div>

                    {isCompleted && !m.rewardClaimed && (
                      <button
                        className="button primary"
                        onClick={() => handleClaimRewards(m.id)}
                        disabled={isClaiming}
                      >
                        {isClaiming ? (
                          <><i className="fas fa-spinner fa-spin"></i> Claiming...</>
                        ) : (
                          <><i className="fas fa-trophy"></i> Claim Rewards</>
                        )}
                      </button>
                    )}

                    {isCompleted && m.rewardClaimed && (
                      <div className="mission-card__claimed-badge">
                        <i className="fas fa-check-circle"></i>
                        <span>Rewards Claimed</span>
                      </div>
                    )}

                    {!isCompleted && (
                      <span className="mission-card__info-note">
                        <i className="fas fa-info-circle"></i>
                        Progress is added when you submit artwork.
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Available missions */}
        {!hasActiveMission && (
          <>
            <div className="missions-section__filters">
              <label htmlFor="difficulty-filter">
                <i className="fas fa-filter"></i> Difficulty:
              </label>
              <select
                id="difficulty-filter"
                className="select"
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
              >
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="extreme">Extreme</option>
              </select>
            </div>

            <div className="missions-grid">
              {missions.map((mission) => (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  onClick={() => navigate(`/adventures/missions/${mission.id}/start`)}
                  footer={
                    <button
                      className="button primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/adventures/missions/${mission.id}/start`);
                      }}
                    >
                      <i className="fas fa-play"></i> Start Mission
                    </button>
                  }
                />
              ))}
            </div>
          </>
        )}
      </AutoStateContainer>
    </div>
  );
};
