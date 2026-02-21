import { useState, useEffect, useCallback, MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { TypeBadge, AttributeBadge, BadgeGroup } from '../common';

interface Monster {
  id?: number | string;
  name?: string;
  level?: number;
  species1?: string;
  species2?: string;
  species3?: string;
  species1_image?: string;
  species2_image?: string;
  species3_image?: string;
  type1?: string;
  type2?: string;
  type3?: string;
  type4?: string;
  type5?: string;
  type_primary?: string;
  type_secondary?: string;
  attribute?: string;
  monster_type?: string;
  mon_index?: number;
  gender?: string;
  nature?: string;
  img_link?: string;
  image_url?: string;
  ndex?: number;
  stage?: string;
  is_legendary?: boolean;
  is_mythical?: boolean;
  rank?: string;
  families?: string;
  digimon_type?: string;
  tribe?: string;
}

interface ReferenceImage {
  species: string;
  url: string | null;
}

interface MonsterCardProps {
  monster: Monster;
  linkToDetail?: boolean;
  fullHeight?: boolean;
  onImageClick?: (imageUrl: string) => void;
}

const DEFAULT_IMAGE = '/images/default_mon.png';

export const MonsterCard = ({
  monster,
  linkToDetail = true,
  fullHeight = false
}: MonsterCardProps) => {
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');

  const getTypes = useCallback((): string[] => {
    const types: string[] = [];
    const monsterType = monster.monster_type || '';

    if (monster.type1) types.push(monster.type1);
    if (monster.type2) types.push(monster.type2);
    if (monster.type3) types.push(monster.type3);
    if (monster.type4) types.push(monster.type4);
    if (monster.type5) types.push(monster.type5);

    if (types.length === 0) {
      if (monsterType === 'pokemon' || monsterType === 'nexomon') {
        if (monster.type_primary) types.push(monster.type_primary);
        if (monster.type_secondary) types.push(monster.type_secondary);
      } else if (monsterType === 'digimon') {
        if (monster.digimon_type) types.push(monster.digimon_type);
      } else if (monsterType === 'yokai') {
        if (monster.tribe) types.push(monster.tribe);
      }
    }

    return types;
  }, [monster]);

  const getMonsterInfo = useCallback((): string => {
    const monsterType = monster.monster_type || '';
    const parts: string[] = [];

    if (monster.species1) {
      if (monster.level) parts.push(`Lv. ${monster.level}`);
      if (monster.mon_index) parts.push(`#${monster.mon_index}`);
      if (monster.gender) parts.push(monster.gender);
      if (monster.nature) parts.push(monster.nature);
    } else {
      if (monsterType === 'pokemon') {
        parts.push(`#${monster.ndex || '???'}`);
        if (monster.stage) parts.push(monster.stage);
        if (monster.is_legendary) parts.push('(Legendary)');
        if (monster.is_mythical) parts.push('(Mythical)');
      } else if (monsterType === 'digimon') {
        if (monster.rank) parts.push(monster.rank);
        if (monster.families) parts.push(monster.families);
      } else if (monsterType === 'yokai') {
        if (monster.rank) parts.push(monster.rank);
        if (monster.stage) parts.push(monster.stage);
      } else if (monsterType === 'nexomon') {
        if (monster.stage) parts.push(monster.stage);
        if (monster.is_legendary) parts.push('(Legendary)');
      } else if (monsterType === 'pals') {
        parts.push('Pal');
      }
    }

    return parts.join(' - ');
  }, [monster]);

  useEffect(() => {
    const getSpeciesReferenceImages = async () => {
      try {
        const speciesImages: ReferenceImage[] = [];

        if (monster.species1) {
          speciesImages.push({
            species: monster.species1,
            url: monster.species1_image || monster.img_link || monster.image_url || null
          });
        }
        if (monster.species2) {
          speciesImages.push({
            species: monster.species2,
            url: monster.species2_image || null
          });
        }
        if (monster.species3) {
          speciesImages.push({
            species: monster.species3,
            url: monster.species3_image || null
          });
        }

        if (speciesImages.length === 0 && monster.name) {
          speciesImages.push({
            species: monster.name,
            url: monster.img_link || monster.image_url || null
          });
        }

        if (speciesImages.some(img => !img.url)) {
          try {
            const speciesArray = speciesImages.map(img => img.species);
            const response = await fetch(`/api/species/images?species=${speciesArray.join(',')}`);

            if (response.ok) {
              const data = await response.json();
              speciesImages.forEach((img, index) => {
                if (!img.url) {
                  const apiImage = data.images?.find(
                    (apiImg: { species: string; url: string }) => apiImg.species === img.species
                  );
                  if (apiImage?.url) {
                    speciesImages[index].url = apiImage.url;
                  }
                }
              });
            }
          } catch (error) {
            console.error('Error fetching species images from API:', error);
          }
        }

        setReferenceImages(speciesImages);
      } catch (error) {
        console.error('Error fetching reference images:', error);
      }
    };

    getSpeciesReferenceImages();
  }, [monster]);

  useEffect(() => {
    return () => {
      if (showModal) {
        document.body.style.overflow = '';
      }
    };
  }, [showModal]);

  const openModal = useCallback((imageUrl: string) => {
    setSelectedImage(imageUrl);
    setShowModal(true);
    document.body.style.overflow = 'hidden';
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setSelectedImage('');
    document.body.style.overflow = '';
  }, []);

  const handleModalClick = useCallback((e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  }, [closeModal]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    if (target.src !== DEFAULT_IMAGE) {
      target.src = DEFAULT_IMAGE;
    }
  };

  const imageUrl = monster.species1_image || monster.img_link || monster.image_url || '';
  const types = getTypes();
  const monsterInfo = getMonsterInfo();

  const cardContent = (
    <>
      <div className="monster-card__header">
        <h3 className="monster-card__name">
          {monster.name || monster.species1 || 'Unnamed Monster'}
        </h3>
        {monster.level && (
          <span className="monster-card__level">Lv. {monster.level}</span>
        )}
      </div>

      <div className="monster-card__image">
        <img
          src={imageUrl || DEFAULT_IMAGE}
          alt={monster.name || monster.species1}
          onError={handleImageError}
        />
      </div>

      <div className="monster-card__body">
        {monsterInfo && (
          <div className="monster-card__info">{monsterInfo}</div>
        )}

        <div className="monster-card__species">
          {monster.species1 && <span>{monster.species1}</span>}
          {monster.species2 && (
            <>
              <span className="monster-card__species-separator"> / </span>
              <span>{monster.species2}</span>
            </>
          )}
          {monster.species3 && (
            <>
              <span className="monster-card__species-separator"> / </span>
              <span>{monster.species3}</span>
            </>
          )}
        </div>

        {types.length > 0 && (
          <BadgeGroup className="monster-card__types" gap="xs">
            {types.map((type, index) => (
              <TypeBadge key={index} type={type} size="xs" />
            ))}
          </BadgeGroup>
        )}

        {monster.attribute && (
          <div className="monster-card__attribute">
            <AttributeBadge attribute={monster.attribute} size="xs" />
          </div>
        )}

        {referenceImages.length > 0 && (
          <div className="monster-card__references">
            {referenceImages.map((image, index) => (
              <div
                key={index}
                className="monster-card__reference"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (image.url) openModal(image.url);
                }}
              >
                {image.url ? (
                  <img
                    src={image.url}
                    alt={image.species}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const textEl = target.nextElementSibling as HTMLElement;
                      if (textEl) textEl.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div
                  className="monster-card__reference-text"
                  style={{ display: image.url ? 'none' : 'flex' }}
                >
                  {image.species}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );

  const modalElement = showModal
    ? createPortal(
        <div className="monster-image-modal" onClick={handleModalClick}>
          <div className="monster-image-modal__content" onClick={(e) => e.stopPropagation()}>
            <button
              className="monster-image-modal__close"
              onClick={closeModal}
              aria-label="Close modal"
            >
              &times;
            </button>
            <img
              src={selectedImage}
              alt="Reference"
              className="monster-image-modal__image"
            />
          </div>
        </div>,
        document.body
      )
    : null;

  const cardClasses = [
    'monster-card',
    fullHeight && 'monster-card--full-height',
    linkToDetail && monster.id && 'monster-card--clickable'
  ].filter(Boolean).join(' ');

  return (
    <>
      {linkToDetail && monster.id ? (
        <Link to={`/monsters/${monster.id}`} className={cardClasses}>
          {cardContent}
        </Link>
      ) : (
        <div className={cardClasses}>
          {cardContent}
        </div>
      )}
      {modalElement}
    </>
  );
};
