import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/useAuth';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';
import { AutoStateContainer } from '../../../components/common/StateContainer';
import bossService from '../../../services/bossService';
import trainerService from '../../../services/trainerService';
import { BossRewardModal } from './BossRewardModal';
import { formatDate } from '../../../components/adventures/types';
import type {
  DefeatedBossDetailData,
  RewardClaimData,
  BossMonsterData,
  TrainerOption,
  BossLeaderboardEntry,
} from './types';

const DefeatedBossDetailPage = () => {
  const { bossId } = useParams<{ bossId: string }>();
  const { currentUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bossData, setBossData] = useState<DefeatedBossDetailData | null>(null);
  const [userTrainers, setUserTrainers] = useState<TrainerOption[]>([]);

  // Reward modal state
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [currentReward, setCurrentReward] = useState<RewardClaimData | null>(null);

  useDocumentTitle(bossData?.boss?.name ? `${bossData.boss.name} - Victory Details` : 'Boss Details');

  const fetchBossDetail = useCallback(async () => {
    if (!bossId) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch trainers if logged in
      if (currentUser) {
        try {
          const trainersResponse = await trainerService.getUserTrainers(currentUser.discord_id);
          const trainers = trainersResponse.trainers || [];
          setUserTrainers(trainers.map((t: { id: number | string; name: string }) => ({ id: t.id, name: t.name })));
        } catch {
          // Non-critical, continue without trainers
        }
      }

      const response = await bossService.getDefeatedBossById(bossId, currentUser?.id);

      if (response.success) {
        setBossData(response.data);
      } else {
        setError('Boss not found or not defeated yet.');
      }
    } catch {
      setError('Failed to load boss details. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [bossId, currentUser]);

  useEffect(() => {
    fetchBossDetail();
  }, [fetchBossDetail]);

  const handleClaimReward = () => {
    if (!bossData?.userReward || bossData.userReward.isClaimed) return;

    let monsterData: BossMonsterData | null = null;
    try {
      if (bossData.userReward.rewardType === 'boss_monster' && bossData.boss.rewardMonsterData) {
        monsterData = JSON.parse(bossData.boss.rewardMonsterData) as BossMonsterData;
      } else if (bossData.boss.gruntMonsterData) {
        monsterData = JSON.parse(bossData.boss.gruntMonsterData) as BossMonsterData;
      }
    } catch {
      // Invalid JSON
    }

    setCurrentReward({
      bossId: bossData.boss.id,
      bossName: bossData.boss.name,
      bossImage: bossData.boss.imageUrl,
      rewardType: bossData.userReward.rewardType,
      damageDealt: bossData.userReward.damageDealt,
      rankPosition: bossData.userReward.rankPosition,
      monsterData,
    });
    setShowRewardModal(true);
  };

  const handleRewardClaimed = () => {
    setShowRewardModal(false);
    setCurrentReward(null);
    fetchBossDetail();
  };

  const closeRewardModal = () => {
    setShowRewardModal(false);
    setCurrentReward(null);
  };

  return (
    <div className="boss-page">
      <AutoStateContainer
        loading={loading}
        error={error}
        isEmpty={!bossData}
        onRetry={fetchBossDetail}
        loadingMessage="Loading boss details..."
        emptyMessage="Boss not found."
        emptyIcon="fas fa-dragon"
      >
        {bossData && (
          <BossDetailContent
            bossData={bossData}
            currentUserId={currentUser?.id}
            onClaimReward={handleClaimReward}
          />
        )}
      </AutoStateContainer>

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

// ---------- Detail Content Sub-component ----------

interface BossDetailContentProps {
  bossData: DefeatedBossDetailData;
  currentUserId?: number;
  onClaimReward: () => void;
}

const BossDetailContent = ({ bossData, currentUserId, onClaimReward }: BossDetailContentProps) => {
  const { boss, leaderboard, userReward } = bossData;

  return (
    <>
      <div className="boss-page__header">
        <h1>{boss.name} - Victory Details</h1>
        <p className="boss-page__subtitle">
          Final rankings and rewards from the defeated boss battle.
        </p>
      </div>

      {/* User Reward Status */}
      {currentUserId && userReward && (
        <div className={`alert ${userReward.isClaimed ? 'success' : 'warning'} lg`}>
          <i className={`fas ${userReward.isClaimed ? 'fa-check-circle' : 'fa-gift'}`}></i>
          <div className="boss-page__reward-banner-text">
            {userReward.isClaimed ? (
              <>
                <strong>Reward Claimed!</strong>
                <span>
                  You&apos;ve already claimed your {userReward.rewardType === 'boss_monster' ? 'Boss Monster' : 'Grunt Monster'} reward.
                  {userReward.monsterName && <> Monster Name: <strong>{userReward.monsterName}</strong></>}
                </span>
              </>
            ) : (
              <>
                <strong>Reward Available!</strong>
                <span>
                  You have an unclaimed {userReward.rewardType === 'boss_monster' ? 'Boss Monster' : 'Grunt Monster'} reward.
                  Rank: #{userReward.rankPosition} | Damage: {userReward.damageDealt?.toLocaleString()}
                </span>
              </>
            )}
          </div>
          {!userReward.isClaimed && (
            <button className="button primary" onClick={onClaimReward}>
              <i className="fas fa-trophy"></i>
              Claim Reward
            </button>
          )}
        </div>
      )}

      <div className="boss-page__content">
        {/* Boss Information Card */}
        <div className="boss-card boss-card--large boss-card--defeated">
          <div className="boss-card__image-container">
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
            <div className="boss-card__defeated-badge">
              <i className="fas fa-trophy"></i> Defeated
            </div>
          </div>

          <div className="boss-card__info">
            <h2 className="boss-card__name">{boss.name}</h2>

            {boss.description && (
              <p className="boss-card__description">{boss.description}</p>
            )}

            <div className="boss-card__stats">
              <div className="boss-card__stat">
                <span className="stat-label">Battle:</span>
                <span className="stat-value">{boss.month}/{boss.year}</span>
              </div>

              <div className="boss-card__stat">
                <span className="stat-label">Participants:</span>
                <span className="stat-value">{bossData.totalParticipants ?? 0}</span>
              </div>

              {boss.startDate && (
                <div className="boss-card__stat">
                  <span className="stat-label">Started:</span>
                  <span className="stat-value">{formatDate(boss.startDate)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Full Leaderboard */}
        <div className="boss-leaderboard">
          <h3 className="section-title">
            <i className="fas fa-trophy"></i>
            Final Damage Rankings
          </h3>

          {leaderboard && leaderboard.length > 0 ? (
            <div className="boss-leaderboard__table-wrapper">
              <table className="boss-leaderboard__table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Trainer</th>
                    <th>Damage</th>
                    <th>Submissions</th>
                    <th>Reward</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry) => (
                    <LeaderboardRow
                      key={entry.userId ?? entry.rank}
                      entry={entry}
                      isCurrentUser={currentUserId === entry.userId}
                      onClaimReward={onClaimReward}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="boss-leaderboard__empty">
              <p>No damage data available for this boss.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// ---------- Leaderboard Row Sub-component ----------

interface LeaderboardRowProps {
  entry: BossLeaderboardEntry;
  isCurrentUser: boolean;
  onClaimReward: () => void;
}

const LeaderboardRow = ({ entry, isCurrentUser, onClaimReward }: LeaderboardRowProps) => {
  const getRankIcon = (rank: number): string => {
    switch (rank) {
      case 1: return '\u{1F947}';
      case 2: return '\u{1F948}';
      case 3: return '\u{1F949}';
      default: return `#${rank}`;
    }
  };

  const getRankClass = (rank: number): string => {
    switch (rank) {
      case 1: return 'boss-leaderboard__row--first';
      case 2: return 'boss-leaderboard__row--second';
      case 3: return 'boss-leaderboard__row--third';
      default: return '';
    }
  };

  return (
    <tr className={getRankClass(entry.rank)}>
      <td className="boss-leaderboard__cell--rank">
        <span className="boss-leaderboard__rank-icon">{getRankIcon(entry.rank)}</span>
      </td>
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
      <td>
        {entry.rank === 1 ? (
          <span className="badge badge--boss-reward">
            <i className="fas fa-crown"></i> Boss Monster
          </span>
        ) : (
          <span className="badge badge--grunt-reward">
            <i className="fas fa-gift"></i> Grunt Monster
          </span>
        )}
      </td>
      <td>
        <div className="boss-leaderboard__status-cell">
          {entry.rewardClaim ? (
            entry.rewardClaim.isClaimed ? (
              <span className="badge badge--claimed">
                <i className="fas fa-check"></i> Claimed
              </span>
            ) : (
              <span className="badge badge--unclaimed">
                <i className="fas fa-clock"></i> Pending
              </span>
            )
          ) : (
            <span className="badge badge--no-reward">
              <i className="fas fa-minus"></i> N/A
            </span>
          )}
          {isCurrentUser && entry.rewardClaim && !entry.rewardClaim.isClaimed && (
            <button className="button primary sm" onClick={onClaimReward}>
              Claim
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

export default DefeatedBossDetailPage;
