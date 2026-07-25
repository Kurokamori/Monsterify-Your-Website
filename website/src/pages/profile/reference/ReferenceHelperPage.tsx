import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/useAuth';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';
import { AutoStateContainer } from '../../../components/common/StateContainer';
import { FormSelect } from '../../../components/common/FormSelect';
import trainerService from '../../../services/trainerService';
import speciesService from '../../../services/speciesService';
import type { SpeciesImageMap } from '../../../services/speciesService';
import { MonsterReferenceTable } from './MonsterReferenceTable';
import type {
  TrainerWithMonsters,
  TrainerSummary,
  UserWithTrainers,
  ImageSize,
  TrainerSortMode,
  UserSortMode,
  BrowseMode,
} from './types';
import {
  IMAGE_SIZES,
  IMAGE_SIZE_LABELS,
  TRAINER_SORT_OPTIONS,
  USER_SORT_OPTIONS,
  BROWSE_MODE_OPTIONS,
  buildUserSummaries,
  isEmptyImgLink,
  collectSpeciesNames,
} from './types';

const ReferenceHelperPage = () => {
  useDocumentTitle('Reference Helper');

  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loadingMonsters, setLoadingMonsters] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allTrainers, setAllTrainers] = useState<TrainerSummary[]>([]);
  const [browseMode, setBrowseMode] = useState<BrowseMode>('trainer');
  const [selectedTrainerId, setSelectedTrainerId] = useState('');
  const [selectedTrainerData, setSelectedTrainerData] = useState<TrainerWithMonsters | null>(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedUserData, setSelectedUserData] = useState<UserWithTrainers | null>(null);
  const [speciesImages, setSpeciesImages] = useState<SpeciesImageMap>({});
  const [imageSize, setImageSize] = useState<ImageSize>('medium');
  const [showLineage, setShowLineage] = useState(true);
  const [sortMode, setSortMode] = useState<TrainerSortMode>('refs');
  const [userSortMode, setUserSortMode] = useState<UserSortMode>('refs');

  // Fetch all trainers that have unreferenced monsters
  const fetchTrainers = useCallback(async () => {
    if (!currentUser?.discord_id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await trainerService.getAllTrainers({ limit: 10000 });
      const trainersData = response.trainers || [];

      const trainersWithCounts: TrainerSummary[] = [];

      for (const trainer of trainersData) {
        // Skip current user's trainers
        if (trainer.player_user_id === currentUser.discord_id) continue;

        const monstersResponse = await trainerService.getTrainerMonsters(trainer.id, { limit: 1000 });
        const monsters = monstersResponse.monsters || [];
        const unreferencedCount = monsters.filter((m) => isEmptyImgLink(m.img_link)).length;

        if (unreferencedCount > 0) {
          trainersWithCounts.push({
            id: trainer.id,
            name: trainer.name,
            unreferencedCount,
            player_user_id: trainer.player_user_id as string | undefined,
            ownerName: trainer.player_display_name || trainer.player_username || undefined,
          });
        }
      }

      setAllTrainers(trainersWithCounts);
    } catch {
      setError('Failed to load trainers. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchTrainers();
  }, [fetchTrainers]);

  // Fetch monsters for a selected trainer
  const fetchTrainerMonsters = async (trainerId: string) => {
    const trainer = allTrainers.find((t) => t.id === Number(trainerId));
    if (!trainer) return;

    try {
      setLoadingMonsters(true);
      setError(null);

      const monstersResponse = await trainerService.getTrainerMonsters(Number(trainerId), { limit: 1000 });
      const monsters = monstersResponse.monsters || [];
      const unreferenced = monsters.filter((m) => isEmptyImgLink(m.img_link));

      const trainerWithMonsters: TrainerWithMonsters = {
        id: trainer.id,
        name: trainer.name,
        monsters: unreferenced,
      };

      setSelectedTrainerData(trainerWithMonsters);

      // Fetch species images
      const speciesNames = collectSpeciesNames(unreferenced);
      if (speciesNames.length > 0) {
        const images = await speciesService.getSpeciesImages(speciesNames);
        setSpeciesImages(images);
      }
    } catch {
      setError('Failed to load trainer monsters. Please try again later.');
    } finally {
      setLoadingMonsters(false);
    }
  };

  const handleTrainerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const trainerId = e.target.value;
    setSelectedTrainerId(trainerId);
    setSelectedTrainerData(null);
    setSpeciesImages({});

    if (trainerId) {
      fetchTrainerMonsters(trainerId);
    }
  };

  // Fetch monsters for every trainer belonging to a selected user
  const fetchUserMonsters = async (userId: string) => {
    const userTrainers = allTrainers.filter((t) => t.player_user_id === userId);
    if (userTrainers.length === 0) return;

    try {
      setLoadingMonsters(true);
      setError(null);

      const trainersWithMonsters: TrainerWithMonsters[] = [];
      const speciesNames = new Set<string>();

      for (const trainer of userTrainers) {
        const monstersResponse = await trainerService.getTrainerMonsters(trainer.id, { limit: 1000 });
        const monsters = monstersResponse.monsters || [];
        const unreferenced = monsters.filter((m) => isEmptyImgLink(m.img_link));

        if (unreferenced.length === 0) continue;

        trainersWithMonsters.push({
          id: trainer.id,
          name: trainer.name,
          monsters: unreferenced,
        });

        for (const name of collectSpeciesNames(unreferenced)) {
          speciesNames.add(name);
        }
      }

      setSelectedUserData({
        userId,
        name: userTrainers[0].ownerName || 'Unknown Owner',
        trainers: trainersWithMonsters,
      });

      if (speciesNames.size > 0) {
        const images = await speciesService.getSpeciesImages(Array.from(speciesNames));
        setSpeciesImages(images);
      }
    } catch {
      setError('Failed to load user monsters. Please try again later.');
    } finally {
      setLoadingMonsters(false);
    }
  };

  const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const userId = e.target.value;
    setSelectedUserId(userId);
    setSelectedUserData(null);
    setSpeciesImages({});

    if (userId) {
      fetchUserMonsters(userId);
    }
  };

  const handleBrowseModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setBrowseMode(e.target.value as BrowseMode);
    setSelectedTrainerId('');
    setSelectedTrainerData(null);
    setSelectedUserId('');
    setSelectedUserData(null);
    setSpeciesImages({});
    setError(null);
  };

  const cycleImageSize = () => {
    const idx = IMAGE_SIZES.indexOf(imageSize);
    setImageSize(IMAGE_SIZES[(idx + 1) % IMAGE_SIZES.length]);
  };

  const ownerLabel = (t: TrainerSummary) => t.ownerName || 'Unknown Owner';

  const sortedTrainers = [...allTrainers].sort((a, b) => {
    if (sortMode === 'trainer') {
      return a.name.localeCompare(b.name);
    }
    if (sortMode === 'owner') {
      const ownerCompare = ownerLabel(a).localeCompare(ownerLabel(b));
      if (ownerCompare !== 0) return ownerCompare;
      return a.name.localeCompare(b.name);
    }
    return b.unreferencedCount - a.unreferencedCount;
  });

  const trainerOptions = sortedTrainers.map((t) => ({
    value: t.id,
    label:
      sortMode === 'owner'
        ? `${ownerLabel(t)} — ${t.name} (${t.unreferencedCount} need refs)`
        : `${t.name} (${t.unreferencedCount} need refs)`,
  }));

  const sortedUsers = buildUserSummaries(allTrainers).sort((a, b) => {
    if (userSortMode === 'user') {
      return a.name.localeCompare(b.name);
    }
    return b.unreferencedCount - a.unreferencedCount;
  });

  const userOptions = sortedUsers.map((u) => ({
    value: u.userId,
    label: `${u.name} (${u.trainerCount} trainer${u.trainerCount === 1 ? '' : 's'}, ${u.unreferencedCount} need refs)`,
  }));

  const hasSelection = browseMode === 'trainer' ? !!selectedTrainerData : !!selectedUserData;

  return (
    <div className="ref-page">
      <AutoStateContainer
        loading={loading}
        error={error && !hasSelection ? error : undefined}
        isEmpty={allTrainers.length === 0}
        onRetry={fetchTrainers}
        loadingMessage="Loading trainers..."
        emptyMessage="All trainers have images for their monsters. Great work!"
        emptyIcon="fas fa-check-circle"
      >
        <div className="ref-page__header">
          <h1>Reference Helper</h1>
          {hasSelection && (
            <div className="ref-page__header-actions">
              <button
                className={`button secondary no-flex ${showLineage ? 'active' : ''}`}
                onClick={() => setShowLineage((prev) => !prev)}
                title="Show pre-evolution images from lineage data"
              >
                <i className="fas fa-sitemap"></i>
                {showLineage ? 'Hide Lineage' : 'Show Lineage'}
              </button>
              <button
                className="button secondary no-flex"
                onClick={cycleImageSize}
                title={`Current: ${IMAGE_SIZE_LABELS[imageSize]}. Click to cycle.`}
              >
                <i className="fas fa-expand-arrows-alt"></i>
                {IMAGE_SIZE_LABELS[imageSize]}
              </button>
            </div>
          )}
        </div>

        <p className="ref-page__description">
          View other trainers&apos; monsters that need references.
          Browse by a single trainer, or by a whole user to see every one of their
          trainers&apos; unreferenced monsters at once, and help them out!
        </p>

        <div className="ref-page__trainer-selector">
          <FormSelect
            label="Browse by"
            name="browse-mode"
            value={browseMode}
            onChange={handleBrowseModeChange}
            options={BROWSE_MODE_OPTIONS}
          />
          {browseMode === 'trainer' ? (
            <>
              <FormSelect
                label="Sort by"
                name="trainer-sort"
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as TrainerSortMode)}
                options={TRAINER_SORT_OPTIONS}
              />
              <FormSelect
                label="Select a Trainer"
                name="trainer-select"
                value={selectedTrainerId}
                onChange={handleTrainerChange}
                options={trainerOptions}
                placeholder="Select a trainer..."
              />
            </>
          ) : (
            <>
              <FormSelect
                label="Sort by"
                name="user-sort"
                value={userSortMode}
                onChange={(e) => setUserSortMode(e.target.value as UserSortMode)}
                options={USER_SORT_OPTIONS}
              />
              <FormSelect
                label="Select a User"
                name="user-select"
                value={selectedUserId}
                onChange={handleUserChange}
                options={userOptions}
                placeholder="Select a user..."
              />
            </>
          )}
        </div>

        {loadingMonsters && (
          <div className="ref-page__loading-inline">
            <i className="fas fa-spinner fa-spin"></i>
            <span>Loading monsters...</span>
          </div>
        )}

        {error && hasSelection && (
          <div className="alert error">
            <i className="fas fa-exclamation-circle"></i>
            <span>{error}</span>
          </div>
        )}

        {browseMode === 'trainer' && selectedTrainerData && !loadingMonsters && (
          <>
            <div className="ref-page__summary">
              <span className="ref-page__summary-count">
                {selectedTrainerData.monsters.length}
              </span>
              <span>references needed for {selectedTrainerData.name}</span>
            </div>

            <div className="ref-page__trainers">
              <div className="ref-trainer-group">
                <div className="ref-trainer-group__content">
                  <MonsterReferenceTable
                    monsters={selectedTrainerData.monsters}
                    speciesImages={speciesImages}
                    imageSize={imageSize}
                    showLineage={showLineage}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {browseMode === 'user' && selectedUserData && !loadingMonsters && (
          <>
            <div className="ref-page__summary">
              <span className="ref-page__summary-count">
                {selectedUserData.trainers.reduce((sum, t) => sum + t.monsters.length, 0)}
              </span>
              <span>
                references needed across {selectedUserData.trainers.length} trainer
                {selectedUserData.trainers.length === 1 ? '' : 's'} for {selectedUserData.name}
              </span>
            </div>

            {selectedUserData.trainers.length === 0 ? (
              <div className="ref-page__loading-inline">
                <i className="fas fa-check-circle"></i>
                <span>All of {selectedUserData.name}&apos;s monsters have references. Great work!</span>
              </div>
            ) : (
              <div className="ref-page__trainers">
                {selectedUserData.trainers.map((trainer) => (
                  <div key={trainer.id} className="ref-trainer-group">
                    <h3 className="ref-trainer-group__title">
                      {trainer.name} ({trainer.monsters.length} need refs)
                    </h3>
                    <div className="ref-trainer-group__content">
                      <MonsterReferenceTable
                        monsters={trainer.monsters}
                        speciesImages={speciesImages}
                        imageSize={imageSize}
                        showLineage={showLineage}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </AutoStateContainer>
    </div>
  );
};

export default ReferenceHelperPage;
