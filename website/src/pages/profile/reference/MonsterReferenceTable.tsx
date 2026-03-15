import { Fragment, useState, useEffect } from 'react';
import { Modal } from '../../../components/common/Modal';
import { TypeBadge } from '../../../components/common/TypeBadge';
import { AttributeBadge } from '../../../components/common/AttributeBadge';
import { BadgeGroup } from '../../../components/common/BadgeGroup';
import monsterService from '../../../services/monsterService';
import type { SpeciesImageMap } from '../../../services/speciesService';
import type { UnreferencedMonster, ImageSize, EvolutionStage } from './types';
import { getMonsterSpeciesInfo, getMonsterTypes } from './types';

interface MonsterReferenceTableProps {
  monsters: UnreferencedMonster[];
  speciesImages: SpeciesImageMap;
  imageSize: ImageSize;
  showLineage?: boolean;
}

export const MonsterReferenceTable = ({
  monsters,
  speciesImages,
  imageSize,
  showLineage = false,
}: MonsterReferenceTableProps) => {
  const [expandedMonsters, setExpandedMonsters] = useState<Record<number, boolean>>({});
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');

  const toggleExpanded = (monsterId: number) => {
    setExpandedMonsters((prev) => ({ ...prev, [monsterId]: !prev[monsterId] }));
  };

  return (
    <>
      <div className="ref-table-wrapper">
        <table className="ref-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Species</th>
              <th>Types</th>
              <th>Attribute</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {monsters.map((monster) => (
              <Fragment key={monster.id}>
                <tr>
                  <td className="ref-table__cell--name">{monster.name}</td>
                  <td className="ref-table__cell--species">
                    {[monster.species1, monster.species2, monster.species3]
                      .filter(Boolean)
                      .join(', ')}
                  </td>
                  <td className="ref-table__cell--types">
                    <BadgeGroup gap="xs">
                      {getMonsterTypes(monster).map((type) => (
                        <TypeBadge key={type} type={type} size="xs" />
                      ))}
                    </BadgeGroup>
                  </td>
                  <td className="ref-table__cell--attribute">
                    {monster.attribute && (
                      <AttributeBadge attribute={monster.attribute} size="xs" />
                    )}
                  </td>
                  <td>
                    <button
                      className="button secondary sm"
                      onClick={() => toggleExpanded(monster.id)}
                    >
                      {expandedMonsters[monster.id] ? 'Hide Refs' : 'Show Refs'}
                    </button>
                  </td>
                </tr>
                {expandedMonsters[monster.id] && (
                  <tr className="ref-table__expanded-row">
                    <td colSpan={5}>
                      <SpeciesReferences
                        monster={monster}
                        speciesImages={speciesImages}
                        imageSize={imageSize}
                        showLineage={showLineage}
                        onImageClick={(url) => {
                          setSelectedImage(url);
                          setImageModalOpen(true);
                        }}
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={imageModalOpen}
        onClose={() => {
          setImageModalOpen(false);
          setSelectedImage('');
        }}
        title="Species Reference"
        size="xlarge"
      >
        <div className="ref-image-viewer">
          <img
            src={selectedImage}
            alt="Species Reference"
            className="ref-image-viewer__image"
          />
        </div>
      </Modal>
    </>
  );
};

// ---------- Species References Sub-component ----------

interface SpeciesReferencesProps {
  monster: UnreferencedMonster;
  speciesImages: SpeciesImageMap;
  imageSize: ImageSize;
  showLineage: boolean;
  onImageClick: (url: string) => void;
}

const SpeciesReferences = ({
  monster,
  speciesImages,
  imageSize,
  showLineage,
  onImageClick,
}: SpeciesReferencesProps) => {
  const speciesInfo = getMonsterSpeciesInfo(monster, speciesImages);

  if (speciesInfo.length === 0) {
    return (
      <div className="ref-species-empty">
        <p>No species data available for this monster.</p>
      </div>
    );
  }

  return (
    <div className="ref-species">
      <h4 className="ref-species__title">Species References</h4>
      <div className={`ref-species__grid ref-species__grid--${imageSize}`}>
        {speciesInfo.map((species) => (
          <div key={species.name} className="ref-species__item">
            <span className="ref-species__name">{species.name}</span>
            <div className="ref-species__image-container">
              {species.image ? (
                <img
                  src={species.image}
                  alt={species.name}
                  className={`ref-species__image ref-species__image--${imageSize}`}
                  onClick={() => onImageClick(species.image!)}
                />
              ) : (
                <span className="ref-species__no-image">No image available</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {showLineage && (
        <PreEvolutionSection
          monsterId={monster.id}
          imageSize={imageSize}
          onImageClick={onImageClick}
        />
      )}
    </div>
  );
};

// ---------- Pre-Evolution Section ----------

interface PreEvolutionSectionProps {
  monsterId: number;
  imageSize: ImageSize;
  onImageClick: (url: string) => void;
}

const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const target = e.target as HTMLImageElement;
  target.onerror = null;
  target.src = '/images/default_mon.png';
};

const PreEvolutionSection = ({
  monsterId,
  imageSize,
  onImageClick,
}: PreEvolutionSectionProps) => {
  const [stages, setStages] = useState<EvolutionStage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchEvolution = async () => {
      setLoading(true);
      try {
        const res = await monsterService.getMonsterEvolutionData(monsterId);
        if (cancelled) return;

        // evolution_data is the array of this monster's evolution stages
        const rawData = res?.data as Record<string, unknown> | null;
        let evoData: EvolutionStage[] = [];

        if (rawData?.evolution_data) {
          const parsed =
            typeof rawData.evolution_data === 'string'
              ? JSON.parse(rawData.evolution_data)
              : rawData.evolution_data;

          if (Array.isArray(parsed)) {
            evoData = (parsed as EvolutionStage[])
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          }
        }

        if (!cancelled) {
          setStages(evoData);
        }
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchEvolution();
    return () => {
      cancelled = true;
    };
  }, [monsterId]);

  if (loading) {
    return (
      <div className="ref-preevo">
        <div className="ref-preevo__loading">
          <i className="fas fa-spinner fa-spin"></i>
          <span>Loading evolution data...</span>
        </div>
      </div>
    );
  }

  if (stages.length === 0) {
    return (
      <div className="ref-preevo ref-preevo--empty">
        <i className="fas fa-seedling"></i>
        <span>No evolution data recorded</span>
      </div>
    );
  }

  return (
    <div className="ref-preevo">
      <h4 className="ref-preevo__title">
        <i className="fas fa-seedling"></i>
        Evolution Stages ({stages.length})
      </h4>
      <div className={`ref-preevo__grid ref-species__grid--${imageSize}`}>
        {stages.map((stage, idx) => {
          const speciesLabel = [stage.species1, stage.species2, stage.species3]
            .filter(Boolean)
            .join(' / ') || 'Unknown';
          const types = [stage.type1, stage.type2, stage.type3, stage.type4, stage.type5]
            .filter((t): t is string => Boolean(t));

          return (
            <div key={stage.id ?? idx} className="ref-preevo__item">
              <span className="ref-preevo__label">{speciesLabel}</span>
              <div className="ref-species__image-container">
                {stage.image ? (
                  <img
                    src={stage.image}
                    alt={speciesLabel}
                    className={`ref-species__image ref-species__image--${imageSize}`}
                    onClick={() => onImageClick(stage.image!)}
                    onError={handleImgError}
                  />
                ) : (
                  <span className="ref-species__no-image">No image</span>
                )}
              </div>
              {types.length > 0 && (
                <BadgeGroup gap="xs">
                  {types.map((type) => (
                    <TypeBadge key={type} type={type} size="xs" />
                  ))}
                </BadgeGroup>
              )}
              {stage.evolution_method && (
                <span className="ref-preevo__method">{stage.evolution_method}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
