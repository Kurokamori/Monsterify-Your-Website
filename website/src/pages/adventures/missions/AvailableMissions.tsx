import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AutoStateContainer } from '../../../components/common/StateContainer';
import { Modal } from '../../../components/common/Modal';
import { TrainerAutocomplete } from '../../../components/common/TrainerAutocomplete';
import { LevelCapReallocation } from '../../../components/submissions/LevelCapReallocation';
import missionService from '../../../services/missionService';
import { MissionCard } from './MissionCard';
import { MissionRewardSummary } from './MissionRewardSummary';
import type {
  Mission,
  UserMission,
  ClaimRewardsResponse,
  MissionRewardSummaryMonster,
  MissionRewardSummaryItem,
  LevelAllocationInput,
  ItemTrainerAssignment,
} from './types';
import { getDifficultyConfig, getProgressPercentage } from './types';
import { formatDate } from '../../../components/adventures/types';

type ClaimStep = null | 'preview' | 'reallocate';

interface ClaimData {
  userMissionId: number;
  excessLevels: number;
  redistributableLevels: number;
  rewardPreview: {
    totalLevels: number;
    totalCoins: number;
    items: MissionRewardSummaryItem[];
    monsters: MissionRewardSummaryMonster[];
  };
}

export const AvailableMissions = () => {
  const navigate = useNavigate();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [activeMissions, setActiveMissions] = useState<UserMission[]>([]);
  const [hasActiveMission, setHasActiveMission] = useState(false);
  const [lastMission, setLastMission] = useState<UserMission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [claimingId, setClaimingId] = useState<number | null>(null);

  // Claim flow state
  const [claimStep, setClaimStep] = useState<ClaimStep>(null);
  const [claimData, setClaimData] = useState<ClaimData | null>(null);
  const [itemTrainerMap, setItemTrainerMap] = useState<Record<number, number>>({});

  const fetchMissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [availableResponse, lastCompletedResponse] = await Promise.all([
        missionService.getAvailableMissions(),
        missionService.getLastCompletedMission().catch(() => ({ data: null })),
      ]);

      const available: Mission[] = availableResponse.data ?? [];
      const filtered = selectedDifficulty === 'all'
        ? available
        : available.filter((m: Mission) => m.difficulty === selectedDifficulty);

      setMissions(filtered);

      const allActive: UserMission[] = availableResponse.activeMissions ?? [];
      // Separate truly active (in-progress) from completed-unclaimed
      const trulyActive = allActive.filter((m: UserMission) => m.status === 'active');
      const completedUnclaimed = allActive.filter((m: UserMission) => m.status === 'completed' && !m.rewardClaimed);

      setHasActiveMission(trulyActive.length > 0 || completedUnclaimed.length > 0);
      setActiveMissions(allActive);

      // Use completed-unclaimed from active list as lastMission if no separate one found,
      // otherwise use the one from the dedicated endpoint
      const lastCompleted = lastCompletedResponse.data ?? null;
      if (completedUnclaimed.length > 0 && (!lastCompleted || completedUnclaimed[0].id !== lastCompleted.id)) {
        // Prefer the unclaimed one from active list since it's most relevant
        setLastMission(completedUnclaimed[0]);
      } else {
        setLastMission(lastCompleted);
      }
    } catch {
      setError('Failed to load missions.');
    } finally {
      setLoading(false);
    }
  }, [selectedDifficulty]);

  useEffect(() => {
    fetchMissions();
  }, [fetchMissions]);

  const handleClaimRewards = async (missionId: number, body?: { itemAssignments?: ItemTrainerAssignment[]; levelAllocations?: LevelAllocationInput[] }) => {
    try {
      setClaimingId(missionId);
      setError(null);

      const response: ClaimRewardsResponse = await missionService.claimRewards(missionId, body);

      if (response.needsAllocation && response.rewardPreview) {
        // Open the reallocation flow
        setClaimData({
          userMissionId: missionId,
          excessLevels: response.excessLevels ?? 0,
          redistributableLevels: response.redistributableLevels ?? 0,
          rewardPreview: response.rewardPreview,
        });
        setClaimStep('reallocate');
        return;
      }

      if (response.success) {
        setClaimStep(null);
        setClaimData(null);
        setItemTrainerMap({});

        // Immediately update state from the claim response instead of relying on re-fetch
        if (lastMission) {
          setLastMission({
            ...lastMission,
            rewardClaimed: true,
            rewardSummary: response.rewardSummary ?? null,
          });
        }
        setHasActiveMission(false);
        setActiveMissions([]);
      } else {
        setError(response.message ?? 'Failed to claim rewards.');
      }
    } catch {
      setError('Failed to claim rewards. Please try again.');
    } finally {
      setClaimingId(null);
    }
  };

  const handleReallocationComplete = (allocations: Record<number, Record<string, number>>) => {
    if (!claimData) return;

    // Convert allocations format to LevelAllocationInput[]
    const levelAllocations: LevelAllocationInput[] = [];
    for (const monsterAllocations of Object.values(allocations)) {
      for (const [targetKey, levels] of Object.entries(monsterAllocations)) {
        if (levels <= 0) continue;
        const [targetType, targetIdStr] = targetKey.split('_');
        const targetId = parseInt(targetIdStr, 10);
        if (targetType && !isNaN(targetId)) {
          levelAllocations.push({
            targetType: targetType as 'monster' | 'trainer',
            targetId,
            levels,
          });
        }
      }
    }

    // Convert itemTrainerMap to ItemTrainerAssignment[]
    const itemAssignments: ItemTrainerAssignment[] = Object.entries(itemTrainerMap).map(
      ([index, trainerId]) => ({ itemIndex: Number(index), trainerId }),
    );

    // Submit the final claim
    handleClaimRewards(claimData.userMissionId, {
      itemAssignments: itemAssignments.length > 0 ? itemAssignments : undefined,
      levelAllocations,
    });
  };

  const closeClaimModal = () => {
    setClaimStep(null);
    setClaimData(null);
    setItemTrainerMap({});
  };

  // Build capped monsters list for LevelCapReallocation
  const cappedMonsters = claimData?.rewardPreview.monsters
    .filter((m) => m.capped)
    .map((m) => ({
      monsterId: m.monsterId,
      name: m.name,
      currentLevel: m.newLevel,
      originalLevels: m.levelsGained + m.excessLevels,
      excessLevels: m.excessLevels,
    })) ?? [];

  // Separate truly in-progress missions from completed-unclaimed
  const inProgressMissions = activeMissions.filter(m => m.status === 'active');
  const hasInProgress = inProgressMissions.length > 0;

  return (
    <div className="missions-section">
      <AutoStateContainer
        loading={loading}
        error={error}
        isEmpty={!hasActiveMission && !lastMission && missions.length === 0}
        onRetry={fetchMissions}
        loadingMessage="Loading missions..."
        emptyMessage="No missions available at the moment. Check back later!"
        emptyIcon="fas fa-scroll"
      >
        {/* Completed-unclaimed mission reward summary */}
        {lastMission && !lastMission.rewardClaimed && (
          <div className="missions-section__summary">
            <MissionRewardSummary
              mission={lastMission}
              variant="needs-attention"
              onClaim={() => handleClaimRewards(lastMission.id)}
              claiming={claimingId === lastMission.id}
            />
          </div>
        )}

        {/* Last claimed mission reward summary (only when nothing else active) */}
        {!hasInProgress && lastMission && lastMission.rewardClaimed && lastMission.rewardSummary && (
          <div className="missions-section__summary">
            <MissionRewardSummary
              mission={lastMission}
              variant="view-only"
            />
          </div>
        )}

        {/* In-progress missions displayed on top */}
        {hasInProgress && (
          <div className="active-missions-hero">
            <h3 className="active-missions-hero__title">
              <i className="fas fa-compass"></i> Active Missions
            </h3>

            {inProgressMissions.map((m) => {
              const pct = getProgressPercentage(m.currentProgress, m.requiredProgress);
              const config = getDifficultyConfig(m.difficulty);

              return (
                <div
                  key={m.id}
                  className="active-mission-card"
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
                        className="progress-fill primary"
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                    <div className="mission-progress__percentage">{pct}%</div>
                  </div>

                  {/* Footer info */}
                  <div className="active-mission-card__footer">
                    <div className="active-mission-card__meta">
                      <span className="badge badge--status badge--status-active">
                        In Progress
                      </span>
                      <span className="active-mission-card__date">
                        Started {formatDate(m.startedAt)}
                      </span>
                    </div>

                    <span className="mission-card__info-note">
                      <i className="fas fa-info-circle"></i>
                      Progress is added when you submit artwork.
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Available missions */}
        {!hasInProgress && (
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

      {/* Claim Modal — Level Reallocation */}
      {claimStep === 'reallocate' && claimData && (
        <Modal
          isOpen={true}
          onClose={closeClaimModal}
          title="Claim Mission Rewards"
          size="large"
        >
          <div className="mission-claim-modal">
            <div className="mission-claim-modal__preview">
              <h4>
                <i className="fas fa-gift"></i> Reward Preview
              </h4>
              <div className="mission-claim-modal__stats">
                {claimData.rewardPreview.totalLevels > 0 && (
                  <span><i className="fas fa-arrow-up"></i> {claimData.rewardPreview.totalLevels} Levels</span>
                )}
                {claimData.rewardPreview.totalCoins > 0 && (
                  <span><i className="fas fa-coins"></i> {claimData.rewardPreview.totalCoins} Coins</span>
                )}
                {claimData.rewardPreview.items.length > 0 && (
                  <span><i className="fas fa-box-open"></i> {claimData.rewardPreview.items.length} Items</span>
                )}
              </div>
            </div>

            {/* Per-item trainer selection */}
            {claimData.rewardPreview.items.length > 0 && (
              <div className="mission-claim-modal__trainer-select">
                <h4><i className="fas fa-user"></i> Item Recipients</h4>
                <p className="form-tooltip--section">Select which trainer receives each item.</p>
                {claimData.rewardPreview.items.map((item, index) => (
                  <div key={index} className="mission-claim-modal__item-assignment">
                    <span className="mission-claim-modal__item-name">
                      {item.quantity > 1 ? `${item.quantity}x ` : ''}{item.itemName}
                    </span>
                    <TrainerAutocomplete
                      selectedTrainerId={itemTrainerMap[index] ?? null}
                      onSelect={(id) => setItemTrainerMap(prev => ({ ...prev, [index]: Number(id) }))}
                      label=""
                      placeholder="Select a trainer..."
                      noPadding
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Level reallocation */}
            {cappedMonsters.length > 0 && (
              <LevelCapReallocation
                cappedMonsters={cappedMonsters}
                availableTargets={[]}
                onComplete={handleReallocationComplete}
                onCancel={closeClaimModal}
              />
            )}

            {/* If no capped monsters, just submit directly */}
            {cappedMonsters.length === 0 && (
              <div className="mission-claim-modal__actions">
                <button className="button secondary" onClick={closeClaimModal}>Cancel</button>
                <button
                  className="button primary"
                  onClick={() => handleReallocationComplete({})}
                  disabled={claimingId !== null || (claimData.rewardPreview.items.length > 0 && Object.keys(itemTrainerMap).length < claimData.rewardPreview.items.length)}
                >
                  {claimingId !== null ? (
                    <><i className="fas fa-spinner fa-spin"></i> Claiming...</>
                  ) : (
                    <><i className="fas fa-trophy"></i> Claim Rewards</>
                  )}
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
