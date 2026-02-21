import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/useAuth';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';
import { AutoStateContainer } from '../../../components/common/StateContainer';
import { FormSelect } from '../../../components/common/FormSelect';
import trainerService from '../../../services/trainerService';
import speciesService from '../../../services/speciesService';
import type { SpeciesImageMap } from '../../../services/speciesService';
import { MonsterReferenceTable } from './MonsterReferenceTable';
import type { TrainerWithMonsters, TrainerSummary, ImageSize } from './types';
import {
  IMAGE_SIZES,
  IMAGE_SIZE_LABELS,
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
  const [selectedTrainerId, setSelectedTrainerId] = useState('');
  const [selectedTrainerData, setSelectedTrainerData] = useState<TrainerWithMonsters | null>(null);
  const [speciesImages, setSpeciesImages] = useState<SpeciesImageMap>({});
  const [imageSize, setImageSize] = useState<ImageSize>('medium');

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
          });
        }
      }

      // Sort by most unreferenced first
      trainersWithCounts.sort((a, b) => b.unreferencedCount - a.unreferencedCount);
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

  const cycleImageSize = () => {
    const idx = IMAGE_SIZES.indexOf(imageSize);
    setImageSize(IMAGE_SIZES[(idx + 1) % IMAGE_SIZES.length]);
  };

  const trainerOptions = allTrainers.map((t) => ({
    value: t.id,
    label: `${t.name} (${t.unreferencedCount} need refs)`,
  }));

  return (
    <div className="ref-page">
      <AutoStateContainer
        loading={loading}
        error={error && !selectedTrainerData ? error : undefined}
        isEmpty={allTrainers.length === 0}
        onRetry={fetchTrainers}
        loadingMessage="Loading trainers..."
        emptyMessage="All trainers have images for their monsters. Great work!"
        emptyIcon="fas fa-check-circle"
      >
        <div className="ref-page__header">
          <h1>Reference Helper</h1>
          {selectedTrainerData && (
            <button
              className="button secondary no-flex"
              onClick={cycleImageSize}
              title={`Current: ${IMAGE_SIZE_LABELS[imageSize]}. Click to cycle.`}
            >
              <i className="fas fa-expand-arrows-alt"></i>
              {IMAGE_SIZE_LABELS[imageSize]}
            </button>
          )}
        </div>

        <p className="ref-page__description">
          View other trainers&apos; monsters that need references.
          Select a trainer to see their unreferenced monsters and help them out!
        </p>

        <div className="ref-page__trainer-selector">
          <FormSelect
            label="Select a Trainer"
            name="trainer-select"
            value={selectedTrainerId}
            onChange={handleTrainerChange}
            options={trainerOptions}
            placeholder="Select a trainer..."
          />
        </div>

        {loadingMonsters && (
          <div className="ref-page__loading-inline">
            <i className="fas fa-spinner fa-spin"></i>
            <span>Loading monsters...</span>
          </div>
        )}

        {error && selectedTrainerData && (
          <div className="alert error">
            <i className="fas fa-exclamation-circle"></i>
            <span>{error}</span>
          </div>
        )}

        {selectedTrainerData && !loadingMonsters && (
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
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </AutoStateContainer>
    </div>
  );
};

export default ReferenceHelperPage;
