import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/useAuth';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';
import { AutoStateContainer } from '../../../components/common/StateContainer';
import trainerService from '../../../services/trainerService';
import speciesService from '../../../services/speciesService';
import type { SpeciesImageMap } from '../../../services/speciesService';
import { MonsterReferenceTable } from './MonsterReferenceTable';
import type { TrainerWithMonsters, ImageSize } from './types';
import {
  IMAGE_SIZES,
  IMAGE_SIZE_LABELS,
  isEmptyImgLink,
  collectSpeciesNames,
} from './types';

const ReferenceTodoPage = () => {
  useDocumentTitle('Reference Todo');

  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trainers, setTrainers] = useState<TrainerWithMonsters[]>([]);
  const [collapsedTrainers, setCollapsedTrainers] = useState<Record<number, boolean>>({});
  const [speciesImages, setSpeciesImages] = useState<SpeciesImageMap>({});
  const [imageSize, setImageSize] = useState<ImageSize>('medium');

  const fetchData = useCallback(async () => {
    if (!currentUser?.discord_id) return;

    try {
      setLoading(true);
      setError(null);

      // Get user's trainers
      const trainersResponse = await trainerService.getUserTrainers(currentUser.discord_id);
      const trainersData = trainersResponse.trainers || [];

      // Fetch monsters for each trainer and filter unreferenced ones
      const trainersWithMonsters: TrainerWithMonsters[] = [];

      for (const trainer of trainersData) {
        const monstersResponse = await trainerService.getAllTrainerMonsters(trainer.id);
        const monsters = monstersResponse.monsters || [];

        const unreferenced = monsters.filter((m) => isEmptyImgLink(m.img_link));

        if (unreferenced.length > 0) {
          trainersWithMonsters.push({
            id: trainer.id,
            name: trainer.name,
            monsters: unreferenced,
          });
        }
      }

      setTrainers(trainersWithMonsters);

      // Fetch species images for all unreferenced monsters
      const allMonsters = trainersWithMonsters.flatMap((t) => t.monsters);
      const speciesNames = collectSpeciesNames(allMonsters);
      if (speciesNames.length > 0) {
        const images = await speciesService.getSpeciesImages(speciesNames);
        setSpeciesImages(images);
      }
    } catch {
      setError('Failed to load trainers and monsters. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const cycleImageSize = () => {
    const idx = IMAGE_SIZES.indexOf(imageSize);
    setImageSize(IMAGE_SIZES[(idx + 1) % IMAGE_SIZES.length]);
  };

  const toggleTrainer = (trainerId: number) => {
    setCollapsedTrainers((prev) => ({ ...prev, [trainerId]: !prev[trainerId] }));
  };

  const totalNeeded = trainers.reduce((sum, t) => sum + t.monsters.length, 0);
  const isEmpty = trainers.length === 0;

  return (
    <div className="ref-page">
      <AutoStateContainer
        loading={loading}
        error={error}
        isEmpty={isEmpty}
        onRetry={fetchData}
        loadingMessage="Loading trainers and monsters..."
        emptyMessage="All of your monsters have images. Great job!"
        emptyIcon="fas fa-check-circle"
      >
        <div className="ref-page__header">
          <h1>Reference To-Do List</h1>
          <button
            className="button secondary no-flex"
            onClick={cycleImageSize}
            title={`Current: ${IMAGE_SIZE_LABELS[imageSize]}. Click to cycle.`}
          >
            <i className="fas fa-expand-arrows-alt"></i>
            {IMAGE_SIZE_LABELS[imageSize]}
          </button>
        </div>

        <p className="ref-page__description">
          Monsters that need to be referenced (don&apos;t have images yet).
          Click &quot;Show Refs&quot; to see species reference images.
        </p>

        <div className="ref-page__summary">
          <span className="ref-page__summary-count">{totalNeeded}</span>
          <span>references needed</span>
        </div>

        <div className="ref-page__trainers">
          {trainers.map((trainer) => (
            <div key={trainer.id} className="ref-trainer-group">
              <button
                className="ref-trainer-group__header"
                onClick={() => toggleTrainer(trainer.id)}
              >
                <span className="ref-trainer-group__title">
                  <i className={`fas fa-chevron-${collapsedTrainers[trainer.id] ? 'right' : 'down'}`}></i>
                  {trainer.name}&apos;s Monsters
                </span>
                <span className="ref-trainer-group__count">{trainer.monsters.length}</span>
              </button>

              {!collapsedTrainers[trainer.id] && (
                <div className="ref-trainer-group__content">
                  <MonsterReferenceTable
                    monsters={trainer.monsters}
                    speciesImages={speciesImages}
                    imageSize={imageSize}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </AutoStateContainer>
    </div>
  );
};

export default ReferenceTodoPage;
