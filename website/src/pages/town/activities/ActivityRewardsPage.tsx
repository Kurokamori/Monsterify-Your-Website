import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@contexts/useAuth';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { ErrorMessage } from '@components/common/ErrorMessage';
import { ErrorModal } from '@components/common/ErrorModal';
import { ActivityRewardGrid } from '@components/town/ActivityRewardGrid';
import { type BallInventoryEntry } from '@components/common/BallSelector';
import townService from '@services/townService';
import trainerService from '@services/trainerService';
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
  const { isAuthenticated, currentUser } = useAuth();
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
  const [selectedBalls, setSelectedBalls] = useState<Record<string | number, string>>({});
  const [ballInventoryMap, setBallInventoryMap] = useState<Record<string | number, BallInventoryEntry[]>>({});

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

        // Initialize default trainer selection (priority trainer first, then first trainer)
        if (trainersList.length > 0) {
          const priorityIds = currentUser?.priority_trainer_ids ?? [];
          const defaultTrainer = trainersList.find(t => priorityIds.includes(Number(t.id))) ?? trainersList[0];
          const initial: Record<string | number, string | number> = {};
          rewardsList.forEach(reward => {
            initial[reward.id] = defaultTrainer.id;
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
  // eslint-disable-next-line react-hooks/exhaustive-deps -- priority_trainer_ids only affects initial trainer selection, not data fetching
  }, [isAuthenticated, sessionId]);

  // Fetch ball inventory for a trainer (lazy-loads and caches)
  const fetchBallInventory = useCallback((trainerId: string | number) => {
    setBallInventoryMap(prev => {
      if (prev[trainerId]) return prev; // Already fetched
      // Kick off async fetch outside setState
      trainerService.getTrainerInventory(trainerId).then(inv => {
        const raw = (inv as unknown as { data?: { balls?: unknown } }).data?.balls ?? inv.balls;
        const balls: BallInventoryEntry[] = Array.isArray(raw)
          ? raw.map((b: { name: string; quantity: number }) => ({ name: b.name, quantity: b.quantity }))
          : Object.entries(raw || {}).map(([name, quantity]) => ({ name, quantity: quantity as number }));
        setBallInventoryMap(p => ({ ...p, [trainerId]: balls }));
      }).catch(() => {
        setBallInventoryMap(p => ({ ...p, [trainerId]: [] }));
      });
      return prev;
    });
  }, []);

  // Seed ball inventory for the default trainer on load
  useEffect(() => {
    if (trainers.length === 0) return;
    const priorityIds = currentUser?.priority_trainer_ids ?? [];
    const defaultTrainer = trainers.find(t => priorityIds.includes(Number(t.id))) ?? trainers[0];
    fetchBallInventory(defaultTrainer.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when trainers list changes
  }, [trainers, fetchBallInventory]);

  // Trainer selection handler — also fetches ball inventory for newly selected trainer
  const handleTrainerSelect = useCallback((rewardId: string | number, trainerId: string | number | null) => {
    if (trainerId == null) return;
    setSelectedTrainers(prev => ({ ...prev, [rewardId]: trainerId }));
    fetchBallInventory(trainerId);
  }, [fetchBallInventory]);

  // When inventory loads or trainer changes, reset ball if the trainer doesn't have it
  useEffect(() => {
    setSelectedBalls(prev => {
      const updated = { ...prev };
      let changed = false;
      for (const reward of rewards) {
        if (reward.claimed || reward.type !== 'monster') continue;
        const trainerId = selectedTrainers[reward.id];
        if (!trainerId) continue;
        const inventory = ballInventoryMap[trainerId];
        if (!inventory) continue; // Not loaded yet
        const currentBall = prev[reward.id] || 'Poke Ball';
        const hasCurrentBall = inventory.some(b => b.name === currentBall && b.quantity > 0);
        if (!hasCurrentBall) {
          const firstAvailable = inventory.find(b => b.quantity > 0);
          updated[reward.id] = firstAvailable?.name || 'Poke Ball';
          changed = true;
        }
      }
      return changed ? updated : prev;
    });
  }, [ballInventoryMap, selectedTrainers, rewards]);

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
    } catch (err) {
      // Session was deleted (all rewards claimed/forfeited) — mark everything as claimed
      const status = (err as { response?: { status?: number } }).response?.status;
      if (status === 404) {
        setRewards(prev => prev.map(r => r.claimed ? r : { ...r, claimed: true, claimed_at: new Date().toISOString() }));
      }
      // Other errors: optimistic update already applied, fail silently
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
        const ball = selectedBalls[rewardId] || undefined;
        response = await townService.claimGardenHarvestReward(sessionId, rewardId, trainerId, userMonsterName, ball);
      } else {
        const userMonsterName = monsterNames[rewardId] || undefined;
        const ball = selectedBalls[rewardId] || undefined;
        response = await townService.claimActivityReward(sessionId, rewardId, trainerId, userMonsterName, ball);
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
  }, [sessionId, selectedTrainers, isGardenHarvest, refreshRewards, monsterNames, selectedBalls]);

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

  // Assign random trainers to all unclaimed berry rewards
  const assignRandomBerries = useCallback(() => {
    if (trainers.length === 0) return;
    setSelectedTrainers(prev => {
      const updated = { ...prev };
      rewards.forEach(reward => {
        if (reward.type !== 'monster' && !reward.claimed) {
          updated[reward.id] = trainers[Math.floor(Math.random() * trainers.length)].id;
        }
      });
      return updated;
    });
  }, [rewards, trainers]);

  // Collect all unclaimed berry rewards with their currently selected trainers
  const collectAllBerries = useCallback(async () => {
    if (!sessionId) return;
    const unclaimed = rewards.filter(r => r.type !== 'monster' && !r.claimed);
    if (unclaimed.length === 0) return;

    setBatchClaiming(true);
    setError(null);

    try {
      if (isGardenHarvest) {
        const claims = unclaimed
          .filter(r => selectedTrainers[r.id])
          .map(r => ({ rewardId: String(r.id), trainerId: selectedTrainers[r.id] as number }));
        if (claims.length === 0) { setError('Please select trainers for all berries.'); setBatchClaiming(false); return; }

        const response = await townService.bulkClaimGardenRewards(sessionId, claims);
        const failed = response.results.filter(r => !r.success).length;
        const succeeded = response.results.filter(r => r.success).length;

        if (failed > 0) setError(`Claimed ${succeeded} berries, but ${failed} failed.`);
      } else {
        // Non-garden: fall back to sequential
        for (const reward of unclaimed) {
          const trainerId = selectedTrainers[reward.id];
          if (trainerId) await townService.claimActivityReward(sessionId, reward.id, trainerId, undefined, undefined);
        }
      }
      await refreshRewards();
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to collect berries.'));
    } finally {
      setBatchClaiming(false);
    }
  }, [sessionId, rewards, selectedTrainers, isGardenHarvest, refreshRewards]);

  // Claim all unclaimed berries for a specific trainer
  const claimAllBerriesFor = useCallback(async (trainerId: string | number) => {
    if (!sessionId) return;
    const unclaimed = rewards.filter(r => r.type !== 'monster' && !r.claimed);
    if (unclaimed.length === 0) return;

    setBatchClaiming(true);
    setError(null);

    try {
      if (isGardenHarvest) {
        const claims = unclaimed.map(r => ({ rewardId: String(r.id), trainerId: trainerId as number }));
        const response = await townService.bulkClaimGardenRewards(sessionId, claims);
        const failed = response.results.filter(r => !r.success).length;
        const succeeded = response.results.filter(r => r.success).length;
        if (failed > 0) setError(`Claimed ${succeeded} berries, but ${failed} failed.`);
      } else {
        for (const reward of unclaimed) {
          await townService.claimActivityReward(sessionId, reward.id, trainerId, undefined, undefined);
        }
      }
      await refreshRewards();
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to claim berries.'));
    } finally {
      setBatchClaiming(false);
    }
  }, [sessionId, rewards, isGardenHarvest, refreshRewards]);

  // Claim all unclaimed monster rewards with their currently selected trainers
  const claimAllMonsters = useCallback(async () => {
    if (!sessionId) return;
    const unclaimed = rewards.filter(r => r.type === 'monster' && !r.claimed);
    if (unclaimed.length === 0) return;

    setBatchClaiming(true);
    setError(null);

    try {
      if (isGardenHarvest) {
        const claims = unclaimed
          .filter(r => selectedTrainers[r.id])
          .map(r => ({
            rewardId: String(r.id),
            trainerId: selectedTrainers[r.id] as number,
            monsterName: monsterNames[r.id] || '',
            ball: selectedBalls[r.id] || undefined,
          }));
        if (claims.length === 0) { setError('Please select trainers for all monsters.'); setBatchClaiming(false); return; }

        const response = await townService.bulkClaimGardenRewards(sessionId, claims);
        const failed = response.results.filter(r => !r.success).length;
        const succeeded = response.results.filter(r => r.success).length;
        if (failed > 0) setError(`Claimed ${succeeded} monsters, but ${failed} failed.`);
      } else {
        for (const reward of unclaimed) {
          const trainerId = selectedTrainers[reward.id];
          if (trainerId) {
            await townService.claimActivityReward(sessionId, reward.id, trainerId, monsterNames[reward.id] || undefined, selectedBalls[reward.id] || undefined);
          }
        }
      }
      await refreshRewards();
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to claim monsters.'));
    } finally {
      setBatchClaiming(false);
    }
  }, [sessionId, rewards, selectedTrainers, isGardenHarvest, refreshRewards, monsterNames, selectedBalls]);

  // Claim all unclaimed monsters for a specific trainer
  const claimAllMonstersFor = useCallback(async (trainerId: string | number) => {
    if (!sessionId) return;
    const unclaimed = rewards.filter(r => r.type === 'monster' && !r.claimed);
    if (unclaimed.length === 0) return;

    setBatchClaiming(true);
    setError(null);

    try {
      if (isGardenHarvest) {
        const claims = unclaimed.map(r => ({
          rewardId: String(r.id),
          trainerId: trainerId as number,
          monsterName: monsterNames[r.id] || '',
          ball: selectedBalls[r.id] || undefined,
        }));
        const response = await townService.bulkClaimGardenRewards(sessionId, claims);
        const failed = response.results.filter(r => !r.success).length;
        const succeeded = response.results.filter(r => r.success).length;
        if (failed > 0) setError(`Claimed ${succeeded} monsters, but ${failed} failed.`);
      } else {
        for (const reward of unclaimed) {
          await townService.claimActivityReward(sessionId, reward.id, trainerId, monsterNames[reward.id] || undefined, selectedBalls[reward.id] || undefined);
        }
      }
      await refreshRewards();
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to claim monsters.'));
    } finally {
      setBatchClaiming(false);
    }
  }, [sessionId, rewards, isGardenHarvest, refreshRewards, monsterNames, selectedBalls]);

  // Forfeit all unclaimed monster rewards to the bazar
  const forfeitRemainingMonsters = useCallback(async () => {
    if (!sessionId) return;
    const unclaimed = rewards.filter(r => r.type === 'monster' && !r.claimed);
    if (unclaimed.length === 0) return;

    setBatchClaiming(true);
    setError(null);

    try {
      if (isGardenHarvest) {
        const forfeits = unclaimed.map(r => ({ rewardId: String(r.id), monsterName: monsterNames[r.id] || '' }));
        const response = await townService.bulkForfeitGardenMonsters(sessionId, forfeits);
        const failed = response.results.filter(r => !r.success).length;
        const succeeded = response.results.filter(r => r.success).length;
        if (failed > 0) setError(`Forfeited ${succeeded} monsters, but ${failed} failed.`);
      } else {
        for (const reward of unclaimed) {
          await townService.forfeitActivityReward(sessionId, reward.id, monsterNames[reward.id] || undefined);
        }
      }
      await refreshRewards();
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to forfeit monsters.'));
    } finally {
      setBatchClaiming(false);
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
          const ball = selectedBalls[reward.id] || undefined;
          response = await townService.claimGardenHarvestReward(sessionId, reward.id, trainerId, monsterNames[reward.id] || '', ball);
        } else {
          const ball = selectedBalls[reward.id] || undefined;
          response = await townService.claimActivityReward(sessionId, reward.id, trainerId, monsterNames[reward.id] || undefined, ball);
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
  }, [sessionId, rewards, selectedTrainers, isGardenHarvest, refreshRewards, monsterNames, selectedBalls]);

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
  const allClaimed = rewards.length > 0 && !hasUnclaimed;

  // Garden harvest completed — all rewards claimed/forfeited
  if (isGardenHarvest && allClaimed) {
    const claimedMonsters = rewards.filter(r => r.type === 'monster' && !r.forfeited);
    const claimedItems = rewards.filter(r => r.type === 'item');
    const forfeitedMonsters = rewards.filter(r => r.type === 'monster' && r.forfeited);

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
            <h1>Garden Harvest Complete!</h1>
            <p className="activity-page__description">
              All rewards from your garden harvest have been collected.
            </p>
          </div>
        </div>

        <div className="card-container" style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
            <i className="fas fa-check-circle text-success"></i>
          </div>
          <h2 style={{ marginBottom: '1rem' }}>Harvest Summary</h2>
          <ul style={{ listStyle: 'none', padding: 0, lineHeight: '2' }}>
            {claimedItems.length > 0 && (
              <li>
                <i className="fas fa-apple-alt text-success"></i>{' '}
                {claimedItems.length} {claimedItems.length === 1 ? 'berry' : 'berries'} collected
              </li>
            )}
            {claimedMonsters.length > 0 && (
              <li>
                <i className="fas fa-dragon text-warning"></i>{' '}
                {claimedMonsters.length} {claimedMonsters.length === 1 ? 'monster' : 'monsters'} claimed
              </li>
            )}
            {forfeitedMonsters.length > 0 && (
              <li>
                <i className="fas fa-store text-info"></i>{' '}
                {forfeitedMonsters.length} {forfeitedMonsters.length === 1 ? 'monster' : 'monsters'} sent to the Bazar
              </li>
            )}
          </ul>
        </div>

        <div className="activity-page__actions">
          <Link to="/town" className="button secondary">
            <i className="fas fa-arrow-left"></i> Back to Town
          </Link>
          <Link to="/town/activities/garden" className="button primary">
            <i className="fas fa-seedling"></i> Back to Garden
          </Link>
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
        selectedBalls={selectedBalls}
        onBallChange={(rewardId, ball) => {
          setSelectedBalls(prev => ({ ...prev, [rewardId]: ball }));
        }}
        ballInventoryMap={ballInventoryMap}
        {...(isGardenHarvest ? {
          onAssignRandomBerries: assignRandomBerries,
          onCollectAllBerries: collectAllBerries,
          onClaimAllBerriesFor: claimAllBerriesFor,
          onClaimAllMonsters: claimAllMonsters,
          onClaimAllMonstersFor: claimAllMonstersFor,
          onForfeitRemainingMonsters: forfeitRemainingMonsters,
          bulkProcessing: batchClaiming,
        } : {})}
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

        <Link to={`/town/activities/${session.location.replace(/_/g, '-')}`} className="button primary">
          <i className="fas fa-redo"></i> Do Another Task
        </Link>
      </div>

      <ErrorModal
        isOpen={!!error}
        onClose={() => setError(null)}
        message={error || undefined}
      />
    </div>
  );
}
