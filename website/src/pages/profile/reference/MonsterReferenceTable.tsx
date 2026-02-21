import { Fragment, useState } from 'react';
import { Modal } from '../../../components/common/Modal';
import { TypeBadge } from '../../../components/common/TypeBadge';
import { AttributeBadge } from '../../../components/common/AttributeBadge';
import { BadgeGroup } from '../../../components/common/BadgeGroup';
import type { SpeciesImageMap } from '../../../services/speciesService';
import type { UnreferencedMonster, ImageSize } from './types';
import { getMonsterSpeciesInfo, getMonsterTypes } from './types';

interface MonsterReferenceTableProps {
  monsters: UnreferencedMonster[];
  speciesImages: SpeciesImageMap;
  imageSize: ImageSize;
}

export const MonsterReferenceTable = ({
  monsters,
  speciesImages,
  imageSize,
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
  onImageClick: (url: string) => void;
}

const SpeciesReferences = ({
  monster,
  speciesImages,
  imageSize,
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
    </div>
  );
};
