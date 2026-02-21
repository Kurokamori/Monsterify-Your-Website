import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@contexts/useAuth';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { ErrorMessage } from '@components/common/ErrorMessage';
import { ActivityRewardGrid } from '@components/town/ActivityRewardGrid';
import townService from '@services/townService';
import itemsService from '@services/itemsService';
import api from '@services/api';
import type {
  ActivityReward,
  TownTrainer,
} from '@components/town';
import { extractErrorMessage } from '@utils/errorUtils';
import '@styles/town/activities.css';

interface SessionData {
  session_id: string;
  location: string;
  activity: string;
  rewards?: ActivityReward[];
  [key: string]: unknown;
}

/** Format snake_case / kebab-case to Title Case */
function formatName(name: string): string {
  return name
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

/** Parse trainers from the possibly-wrapped API response */
function parseTrainers(data: unknown): TownTrainer[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as { data: unknown }).data)) {
    return (data as { data: TownTrainer[] }).data;
  }
  return [];
}

export default function ActivityRewardsPage() {
  useDocumentTitle('Activity Rewards');

  const { sessionId } = useParams<{ sessionId: string }>();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<SessionData | null>(null);
  const [rewards, setRewards] = useState<ActivityReward[]>([]);
  const [trainers, setTrainers] = useState<TownTrainer[]>([]);
  const [selectedTrainers, setSelectedTrainers] = useState<Record<string | number, string | number>>({});
  const [claimingReward, setClaimingReward] = useState<string | number | null>(null);
  const [batchClaiming, setBatchClaiming] = useState(false);
  const [isGardenHarvest, setIsGardenHarvest] = useState(false);
  const [itemImages, setItemImages] = useState<Record<string, string | null>>({});
  const [monsterNames, setMonsterNames] = useState<Record<string | number, string>>({});

  // Fetch session and rewards data
  useEffect(() => {
    if (!isAuthenticated || !sessionId) {
      if (!isAuthenticated) setError('Please log in to access your rewards.');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        let sessionData: SessionData | null = null;
        let rewardsList: ActivityReward[] = [];
        let gardenSession = false;

        // Try garden harvest session first
        try {
          const gardenResponse = await townService.getGardenHarvestSession(sessionId);
          const gardenData = gardenResponse as Record<string, unknown>;

          if (gardenData.success || gardenData.session_id) {
            gardenSession = true;
            const gardenSessionObj = (gardenData.session ?? gardenData) as SessionData;
            sessionData = {
              session_id: sessionId,
              location: (gardenSessionObj.location as string) || 'garden',
              activity: (gardenSessionObj.activity as string) || 'harvest',
            };
            rewardsList = (
              (gardenData.rewards as ActivityReward[]) ??
              (gardenSessionObj.rewards as ActivityReward[]) ??
              []
            );
          }
        } catch {
          // Not a garden harvest session
        }

        // Fall back to regular activity session
        if (!sessionData) {
          const response = await townService.getActivitySession(sessionId);

          if (!response.success) {
            setError(response.message || 'Failed to load session data.');
            setLoading(false);
            return;
          }

          if (response.session) {
            sessionData = {
              session_id: response.session.session_id,
              location: response.session.location,
              activity: response.session.activity,
            };
            rewardsList = (response.session.rewards as ActivityReward[]) ?? [];
          }
        }

        if (!sessionData) {
          setError('Session not found.');
          setLoading(false);
          return;
        }

        setSession(sessionData);
        setRewards(rewardsList);
        setIsGardenHarvest(gardenSession);

        // Fetch trainers
        const trainersResponse = await api.get('/trainers/user');
        const trainersList = parseTrainers(trainersResponse.data);
        setTrainers(trainersList);

        // Fetch item images for item rewards (berries etc. have DB-stored images)
        const hasItems = rewardsList.some(r => r.type === 'item');
        if (hasItems) {
          itemsService.getBerryItems().then(res => {
            if (res.success) setItemImages(res.berryImages);
          }).catch(() => {});
        }

        // Initialize default trainer selection (first trainer for each reward)
        if (trainersList.length > 0) {
          const initial: Record<string | number, string | number> = {};
          rewardsList.forEach(reward => {
            initial[reward.id] = trainersList[0].id;
          });
          setSelectedTrainers(initial);
        }
      } catch (err) {
        setError(extractErrorMessage(err, 'Failed to load rewards data. Please try again later.'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, sessionId]);

  // Trainer selection handler
  const handleTrainerSelect = useCallback((rewardId: string | number, trainerId: string | number | null) => {
    if (trainerId == null) return;
    setSelectedTrainers(prev => ({ ...prev, [rewardId]: trainerId }));
  }, []);

  // Refresh rewards from server
  const refreshRewards = useCallback(async () => {
    if (!sessionId) return;

    try {
      if (isGardenHarvest) {
        const response = await townService.getGardenHarvestSession(sessionId);
        const data = response as Record<string, unknown>;
        const freshRewards =
          (data.rewards as ActivityReward[]) ??
          ((data.session as Record<string, unknown>)?.rewards as ActivityReward[]) ??
          null;
        if (freshRewards) setRewards(freshRewards);
      } else {
        const response = await townService.getActivitySession(sessionId);
        if (response.success && response.session?.rewards) {
          setRewards(response.session.rewards as ActivityReward[]);
        }
      }
    } catch {
      // Refresh failed silently — optimistic update already applied
    }
  }, [sessionId, isGardenHarvest]);

  // Claim a single reward
  const claimReward = useCallback(async (rewardId: string | number) => {
    if (!sessionId) return;

    const trainerId = selectedTrainers[rewardId];
    if (!trainerId) {
      setError('Please select a trainer to claim this reward.');
      return;
    }

    try {
      setClaimingReward(rewardId);
      setError(null);

      let response: { success: boolean; message?: string };

      if (isGardenHarvest) {
        const userMonsterName = monsterNames[rewardId] || '';
        response = await townService.claimGardenHarvestReward(sessionId, rewardId, trainerId, userMonsterName);
      } else {
        const userMonsterName = monsterNames[rewardId] || undefined;
        response = await townService.claimActivityReward(sessionId, rewardId, trainerId, userMonsterName);
      }

      if (response.success) {
        // Optimistic update
        setRewards(prev => prev.map(r =>
          r.id === rewardId
            ? { ...r, claimed: true, claimed_by: trainerId, claimed_at: new Date().toISOString() }
            : r
        ));
        setError(null);

        // Refresh from server
        await refreshRewards();
      } else {
        setError(response.message || 'Failed to claim reward. Please try again.');
      }
    } catch (err) {
      const status = (err as { response?: { status?: number } }).response?.status;
      if (status === 403) {
        setError('You do not have permission to claim this reward.');
      } else if (status === 404) {
        setError('Reward not found. It may have been claimed already or the session has expired.');
      } else {
        setError(extractErrorMessage(err, 'Failed to claim reward. Please try again later.'));
      }
    } finally {
      setClaimingReward(null);
    }
  }, [sessionId, selectedTrainers, isGardenHarvest, refreshRewards, monsterNames]);

  // Forfeit a monster reward to the bazar
  const forfeitReward = useCallback(async (rewardId: string | number) => {
    if (!sessionId) return;

    const reward = rewards.find(r => r.id === rewardId);
    if (!reward || reward.type !== 'monster') {
      setError('Only monster rewards can be forfeited.');
      return;
    }

    try {
      setClaimingReward(rewardId);
      setError(null);

      let response: { success: boolean; message?: string };

      if (isGardenHarvest) {
        response = await townService.forfeitGardenHarvestMonster(sessionId, rewardId, monsterNames[rewardId] || '');
      } else {
        response = await townService.forfeitActivityReward(sessionId, rewardId, monsterNames[rewardId] || undefined);
      }

      if (response.success) {
        setRewards(prev => prev.map(r =>
          r.id === rewardId
            ? { ...r, claimed: true, claimed_by: -1, claimed_at: new Date().toISOString() }
            : r
        ));
        setError(null);
        await refreshRewards();
      } else {
        setError(response.message || 'Failed to forfeit reward.');
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to forfeit reward. Please try again later.'));
    } finally {
      setClaimingReward(null);
    }
  }, [sessionId, rewards, isGardenHarvest, refreshRewards, monsterNames]);

  // Claim all unclaimed rewards
  const claimAllRewards = useCallback(async () => {
    if (!sessionId) return;

    const unclaimed = rewards.filter(r => !r.claimed);
    if (unclaimed.length === 0) return;

    setBatchClaiming(true);
    setError(null);

    let claimedCount = 0;
    let errorCount = 0;
    const updatedRewards = [...rewards];

    for (const reward of unclaimed) {
      const trainerId = selectedTrainers[reward.id];
      if (!trainerId) {
        errorCount++;
        continue;
      }

      try {
        let response: { success: boolean; message?: string };

        if (isGardenHarvest) {
          response = await townService.claimGardenHarvestReward(sessionId, reward.id, trainerId, monsterNames[reward.id] || '');
        } else {
          response = await townService.claimActivityReward(sessionId, reward.id, trainerId, monsterNames[reward.id] || undefined);
        }

        if (response.success) {
          claimedCount++;
          const idx = updatedRewards.findIndex(r => r.id === reward.id);
          if (idx !== -1) {
            updatedRewards[idx] = {
              ...updatedRewards[idx],
              claimed: true,
              claimed_by: trainerId,
              claimed_at: new Date().toISOString(),
            };
          }
        } else {
          errorCount++;
        }
      } catch {
        errorCount++;
      }
    }

    setRewards(updatedRewards);
    await refreshRewards();

    if (errorCount > 0 && claimedCount > 0) {
      setError(`Claimed ${claimedCount} rewards successfully, but ${errorCount} failed. Please try claiming the remaining rewards individually.`);
    } else if (errorCount > 0 && claimedCount === 0) {
      setError('Failed to claim any rewards. Please try again later or claim them individually.');
    } else {
      setError(null);
    }

    setBatchClaiming(false);
  }, [sessionId, rewards, selectedTrainers, isGardenHarvest, refreshRewards, monsterNames]);

  // ---------- Render States ----------

  if (loading) {
    return (
      <div className="activity-page">
        <div className="activity-page__breadcrumb">
          <Link to="/town" className="breadcrumb-link">
            <i className="fas fa-arrow-left"></i> Back to Town
          </Link>
        </div>
        <LoadingSpinner message="Loading activity rewards..." />
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
        <div className="activity-page__not-found">
          <p>Please log in to access your rewards.</p>
          <Link to="/login" className="button primary">Log In</Link>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="activity-page">
        <div className="activity-page__breadcrumb">
          <Link to="/town" className="breadcrumb-link">
            <i className="fas fa-arrow-left"></i> Back to Town
          </Link>
        </div>
        <div className="activity-page__not-found">
          <ErrorMessage message="Session not found or has expired." />
          <p>Session ID: {sessionId}</p>
          <p>This may happen if the server was restarted since the session was created.</p>
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

  // ---------- Main Render ----------

  const locationName = formatName(session.location);
  const activityName = formatName(session.activity);
  const hasUnclaimed = rewards.some(r => !r.claimed);

  return (
    <div className="activity-page">
      <div className="activity-page__breadcrumb">
        <Link to="/town" className="breadcrumb-link">
          <i className="fas fa-arrow-left"></i> Back to Town
        </Link>
      </div>

      <div className="activity-page__header">
        <div className="activity-page__icon">
          <i className="fas fa-gift"></i>
        </div>
        <div>
          <h1>Activity Completed!</h1>
          <p className="activity-page__description">
            Great job completing your {activityName} at the {locationName}! You've earned the following rewards:
          </p>
        </div>
      </div>

      <ActivityRewardGrid
        rewards={rewards}
        trainers={trainers}
        selectedTrainers={selectedTrainers}
        onTrainerSelect={handleTrainerSelect}
        onClaim={claimReward}
        onForfeit={forfeitReward}
        claimingReward={claimingReward}
        itemImages={itemImages}
        monsterNames={monsterNames}
        onMonsterNameChange={(rewardId, name) => {
          setMonsterNames(prev => ({ ...prev, [rewardId]: name }));
        }}
      />

      {/* Footer actions */}
      <div className="activity-page__actions">
        <Link to="/town" className="button secondary">
          <i className="fas fa-arrow-left"></i> Back to Town
        </Link>

        {hasUnclaimed && (
          <button
            className="button primary"
            onClick={claimAllRewards}
            disabled={batchClaiming}
          >
            {batchClaiming ? (
              <><i className="fas fa-spinner fa-spin"></i> Processing...</>
            ) : (
              <><i className="fas fa-check-circle"></i> Claim All Rewards</>
            )}
          </button>
        )}

        <Link to={`/town/activities/${session.location}`} className="button primary">
          <i className="fas fa-redo"></i> Do Another Task
        </Link>
      </div>

      {/* Error display */}
      {error && (
        <div className="mt-md">
          <ErrorMessage message={error} onDismiss={() => setError(null)} />
        </div>
      )}
    </div>
  );
}
