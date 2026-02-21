import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/useAuth';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';
import { AutoStateContainer } from '../../../components/common/StateContainer';
import bossService from '../../../services/bossService';
import trainerService from '../../../services/trainerService';
import { BossRewardModal } from './BossRewardModal';
import {
  formatDate,
  getHealthBarColor,
  capitalize,
} from '../../../components/adventures/types';
import type {
  CurrentBossData,
  DefeatedBossSummary,
  UnclaimedBossReward,
  RewardClaimData,
  TrainerOption,
} from './types';
import { parseRewardData } from './types';

const BossViewPage = () => {
  useDocumentTitle('Boss Battle');

  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bossData, setBossData] = useState<CurrentBossData | null>(null);
  const [showDefeated, setShowDefeated] = useState(false);
  const [defeatedBosses, setDefeatedBosses] = useState<DefeatedBossSummary[]>([]);
  const [unclaimedRewards, setUnclaimedRewards] = useState<UnclaimedBossReward[]>([]);
  const [userTrainers, setUserTrainers] = useState<TrainerOption[]>([]);

  // Reward modal state
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [currentReward, setCurrentReward] = useState<RewardClaimData | null>(null);

  const fetchBossData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user-specific data in parallel if logged in
      if (currentUser) {
        const [trainersResult, rewardsResult] = await Promise.allSettled([
          trainerService.getUserTrainers(currentUser.discord_id),
          bossService.getUnclaimedRewards(currentUser.id),
        ]);

        if (trainersResult.status === 'fulfilled') {
          const trainers = trainersResult.value.trainers || [];
          setUserTrainers(trainers.map((t: { id: number | string; name: string }) => ({ id: t.id, name: t.name })));
        }

        if (rewardsResult.status === 'fulfilled' && rewardsResult.value.success) {
          setUnclaimedRewards(rewardsResult.value.data ?? []);
        }
      }

      // Try to get current boss
      try {
        const response = await bossService.getCurrentBossWithLeaderboard(20);
        if (response.success && response.data?.boss) {
          setBossData(response.data);
          setShowDefeated(false);
          return;
        }
      } catch {
        // No current boss, fall through to defeated bosses
      }

      // If no current boss, fetch defeated bosses
      try {
        const defeatedResponse = await bossService.getDefeatedBosses(5);
        if (defeatedResponse.success && defeatedResponse.data?.length > 0) {
          setDefeatedBosses(defeatedResponse.data);
          setShowDefeated(true);
        } else {
          setError('No bosses found. Check back later for new boss battles!');
        }
      } catch {
        setError('Failed to load boss data. Please try again later.');
      }
    } catch {
      setError('Failed to load boss data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchBossData();
  }, [fetchBossData]);

  const handleClaimReward = (reward: UnclaimedBossReward) => {
    setCurrentReward(parseRewardData(reward));
    setShowRewardModal(true);
  };

  const handleRewardClaimed = () => {
    if (currentReward) {
      setUnclaimedRewards((prev) =>
        prev.filter((r) => r.bossId !== currentReward.bossId)
      );
    }
    setShowRewardModal(false);
    setCurrentReward(null);
    fetchBossData();
  };

  const closeRewardModal = () => {
    setShowRewardModal(false);
    setCurrentReward(null);
  };

  // Determine the overall page state
  const isEmpty = !bossData && defeatedBosses.length === 0;

  return (
    <div className="boss-page">
      <AutoStateContainer
        loading={loading}
        error={error}
        isEmpty={isEmpty}
        onRetry={fetchBossData}
        loadingMessage="Loading boss data..."
        emptyMessage="No boss battles available. Check back later!"
        emptyIcon="fas fa-dragon"
      >
        {/* Unclaimed Rewards Banner */}
        {currentUser && unclaimedRewards.length > 0 && (
          <div className="alert success lg">
            <i className="fas fa-gift"></i>
            <div className="boss-page__reward-banner-text">
              <strong>You have unclaimed boss rewards!</strong>
              <span>
                {unclaimedRewards.length} reward{unclaimedRewards.length > 1 ? 's' : ''} waiting to be claimed.
              </span>
            </div>
            <button
              className="button success"
              onClick={() => handleClaimReward(unclaimedRewards[0])}
            >
              <i className="fas fa-trophy"></i>
              Claim Reward
            </button>
          </div>
        )}

        {/* Active Boss View */}
        {!showDefeated && bossData?.boss && (
          <ActiveBossView
            bossData={bossData}
          />
        )}

        {/* Defeated Bosses List */}
        {showDefeated && defeatedBosses.length > 0 && (
          <DefeatedBossesView bosses={defeatedBosses} />
        )}
      </AutoStateContainer>

      {/* Reward Modal */}
      {currentUser && (
        <BossRewardModal
          isOpen={showRewardModal}
          reward={currentReward}
          trainers={userTrainers}
          userId={currentUser.id}
          onClose={closeRewardModal}
          onClaimed={handleRewardClaimed}
        />
      )}
    </div>
  );
};

// ---------- Active Boss Sub-component ----------

interface ActiveBossViewProps {
  bossData: CurrentBossData;
}

const ActiveBossView = ({ bossData }: ActiveBossViewProps) => {
  const { boss, leaderboard } = bossData;

  return (
    <>
      <div className="boss-page__header">
        <h1>Monthly Boss Battle</h1>
        <p className="boss-page__subtitle">
          Defeat the boss by submitting artwork! The top damage dealer gets the boss monster.
        </p>
      </div>

      <div className="boss-page__content boss-page__content--vertical">
        {/* Boss Image */}
        <div className="boss-card__image-container boss-card__image-container--hero">
          {boss.imageUrl ? (
            <img
              src={boss.imageUrl}
              alt={boss.name}
              className="boss-card__image"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = '/images/default_boss.png';
              }}
            />
          ) : (
            <div className="boss-card__image-placeholder">
              <i className="fas fa-dragon"></i>
            </div>
          )}
        </div>

        {/* Boss Details */}
        <div className="boss-card__info">
          <h2 className="boss-card__name">{boss.name}</h2>

          {boss.description && (
            <p className="boss-card__description">{boss.description}</p>
          )}

          <div className="boss-card__stats">
            <div className="boss-card__stat">
              <span className="stat-label">Status:</span>
              <span className={`badge badge--status badge--status-${boss.status}`}>
                {capitalize(boss.status)}
              </span>
            </div>

            <div className="boss-card__stat">
              <span className="stat-label">Month:</span>
              <span className="stat-value">{boss.month}/{boss.year}</span>
            </div>

            {boss.startDate && (
              <div className="boss-card__stat">
                <span className="stat-label">Started:</span>
                <span className="stat-value">{formatDate(boss.startDate)}</span>
              </div>
            )}
          </div>

          {/* Health Bar */}
          <div className="boss-health">
            <div className="boss-health__label">
              <span>Health</span>
              <span>{(boss.currentHp ?? 0).toLocaleString()} / {(boss.totalHp ?? 0).toLocaleString()}</span>
            </div>
            <div className="progress lg">
              <div
                className="progress-fill"
                style={{
                  width: `${boss.healthPercentage ?? 0}%`,
                  backgroundColor: getHealthBarColor(boss.healthPercentage ?? 0),
                }}
              ></div>
            </div>
            <div className="boss-health__percentage">{boss.healthPercentage ?? 0}%</div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="boss-leaderboard">
          <h3 className="section-title">
            <i className="fas fa-trophy"></i>
            Damage Leaderboard
          </h3>

          {leaderboard && leaderboard.length > 0 ? (
            <div className="boss-leaderboard__content">
              {/* Top 3 Podium */}
              {leaderboard.slice(0, 3).length > 0 && (
                <div className="boss-leaderboard__podium">
                  {leaderboard.slice(0, 3).map((entry, index) => (
                    <div
                      key={entry.rank ?? index}
                      className={`boss-leaderboard__podium-entry boss-leaderboard__podium-entry--rank-${index + 1}`}
                    >
                      <div className="boss-leaderboard__rank-badge">
                        {index + 1}
                      </div>
                      <div className="boss-leaderboard__avatar">
                        {entry.trainerAvatar ? (
                          <img
                            src={entry.trainerAvatar}
                            alt={entry.trainerName || entry.username || 'Unknown'}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null;
                              target.src = '/images/default_avatar.png';
                            }}
                          />
                        ) : (
                          <div className="boss-leaderboard__avatar-placeholder">
                            <i className="fas fa-user"></i>
                          </div>
                        )}
                      </div>
                      <div className="boss-leaderboard__entry-info">
                        <span className="boss-leaderboard__entry-name">
                          {entry.trainerName || entry.username || 'Unknown'}
                        </span>
                        <span className="boss-leaderboard__entry-damage">
                          {(entry.totalDamage ?? 0).toLocaleString()} damage
                        </span>
                        <span className="boss-leaderboard__entry-submissions">
                          {entry.submissionCount ?? 0} submission{(entry.submissionCount ?? 0) !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Remaining entries as table */}
              {leaderboard.length > 3 && (
                <div className="boss-leaderboard__table-wrapper">
                  <table className="boss-leaderboard__table">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Trainer</th>
                        <th>Damage</th>
                        <th>Submissions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.slice(3).map((entry, index) => (
                        <tr key={entry.rank ?? (index + 3)}>
                          <td className="boss-leaderboard__cell--rank">#{entry.rank ?? (index + 4)}</td>
                          <td className="boss-leaderboard__cell--trainer">
                            <div className="boss-leaderboard__trainer-info">
                              {entry.trainerAvatar ? (
                                <img
                                  src={entry.trainerAvatar}
                                  alt={entry.trainerName || entry.username || 'Unknown'}
                                  className="boss-leaderboard__avatar-small"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.onerror = null;
                                    target.src = '/images/default_avatar.png';
                                  }}
                                />
                              ) : (
                                <div className="boss-leaderboard__avatar-placeholder-small">
                                  <i className="fas fa-user"></i>
                                </div>
                              )}
                              <span>{entry.trainerName || entry.username || 'Unknown'}</span>
                            </div>
                          </td>
                          <td>{(entry.totalDamage ?? 0).toLocaleString()}</td>
                          <td>{entry.submissionCount ?? 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="boss-leaderboard__empty">
              <p>No damage has been dealt to this boss yet. Be the first to submit artwork!</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// ---------- Defeated Bosses Sub-component ----------

interface DefeatedBossesViewProps {
  bosses: DefeatedBossSummary[];
}

const DefeatedBossesView = ({ bosses }: DefeatedBossesViewProps) => {
  const fmtDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  };

  return (
    <>
      <div className="boss-page__header">
        <h1>Boss Battles</h1>
        <p className="boss-page__subtitle">
          No active boss battles right now. Here are the most recent defeated bosses:
        </p>
      </div>

      <div className="boss-page__defeated-list">
        {bosses.map((boss) => (
          <Link
            key={boss.id}
            to={`/boss/defeated/${boss.id}`}
            className="boss-defeated-card"
          >
            <div className="boss-defeated-card__header">
              <div className="boss-defeated-card__image">
                {boss.imageUrl && (
                  <img
                    src={boss.imageUrl}
                    alt={boss.name}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = '/images/default_boss.png';
                    }}
                  />
                )}
              </div>
              <div className="boss-defeated-card__info">
                <h3>{boss.name}</h3>
                <div className="boss-defeated-card__meta">
                  <span>{boss.month}/{boss.year}</span>
                  <span>{boss.totalParticipants ?? 0} participants</span>
                  {boss.endDate && (
                    <span>Defeated {fmtDate(boss.endDate)}</span>
                  )}
                </div>
              </div>
            </div>

            {boss.topUsers && boss.topUsers.length > 0 && (
              <div className="boss-defeated-card__winners">
                <h4>Top 3 Winners:</h4>
                <div className="boss-defeated-card__winner-list">
                  {boss.topUsers.slice(0, 3).map((user, index) => (
                    <div key={user.userId} className="boss-defeated-card__winner">
                      <span className="boss-defeated-card__winner-rank">
                        {index === 0 ? '\u{1F947}' : index === 1 ? '\u{1F948}' : '\u{1F949}'}
                      </span>
                      <span className="boss-defeated-card__winner-name">
                        {user.username || 'Unknown'}
                      </span>
                      <span className="boss-defeated-card__winner-damage">
                        {user.totalDamage?.toLocaleString() ?? 0} dmg
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Link>
        ))}
      </div>

      <div className="boss-actions">
        <Link to="/boss/defeated" className="button primary">
          View All Defeated Bosses
        </Link>
      </div>
    </>
  );
};

export default BossViewPage;
