import { useMemo } from 'react';
import { TypeBadge, AttributeBadge, BadgeGroup } from '../common';

interface Monster {
  id?: number | string;
  name?: string;
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
  attribute?: string;
  img_link?: string;
  image_url?: string;
  species_images?: string | Record<string, string>;
}

interface SpeciesImage {
  src: string;
  alt: string;
  title: string;
}

interface StarterMonsterCardProps {
  monster: Monster;
  selected?: boolean;
  onClick?: () => void;
}

const DEFAULT_IMAGE = '/images/default_mon.png';

export const StarterMonsterCard = ({
  monster,
  selected = false,
  onClick
}: StarterMonsterCardProps) => {
  const types = useMemo(() => {
    return [monster.type1, monster.type2, monster.type3, monster.type4, monster.type5]
      .filter((t): t is string => Boolean(t));
  }, [monster.type1, monster.type2, monster.type3, monster.type4, monster.type5]);

  const imageUrl = useMemo(() => {
    if (monster.img_link) return monster.img_link;
    if (monster.image_url) return monster.image_url;

    if (monster.species_images) {
      try {
        const images = typeof monster.species_images === 'string'
          ? JSON.parse(monster.species_images)
          : monster.species_images;

        return images.species1_image || null;
      } catch (e) {
        console.error('Error parsing species_images:', e);
      }
    }

    if (monster.species1_image) return monster.species1_image;

    return null;
  }, [monster.img_link, monster.image_url, monster.species_images, monster.species1_image]);

  const speciesImages = useMemo((): SpeciesImage[] => {
    const images: SpeciesImage[] = [];

    if (monster.species1_image && monster.species1) {
      images.push({
        src: monster.species1_image,
        alt: monster.species1,
        title: monster.species1
      });
    }

    if (monster.species2_image && monster.species2) {
      images.push({
        src: monster.species2_image,
        alt: monster.species2,
        title: monster.species2
      });
    }

    if (monster.species3_image && monster.species3) {
      images.push({
        src: monster.species3_image,
        alt: monster.species3,
        title: monster.species3
      });
    }

    return images;
  }, [
    monster.species1, monster.species1_image,
    monster.species2, monster.species2_image,
    monster.species3, monster.species3_image
  ]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    if (target.src !== DEFAULT_IMAGE) {
      target.src = DEFAULT_IMAGE;
    }
  };

  const cardClasses = [
    'starter-monster-card',
    selected && 'starter-monster-card--selected',
    onClick && 'monster-card--clickable'
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClasses} onClick={onClick}>
      <div className="starter-monster-card__header">
        <h3 className="starter-monster-card__name">
          {monster.species1 && <span>{monster.species1}</span>}
          {monster.species2 && (
            <>
              <span className="starter-monster-card__species-separator">/</span>
              <span>{monster.species2}</span>
            </>
          )}
          {monster.species3 && (
            <>
              <span className="starter-monster-card__species-separator">/</span>
              <span>{monster.species3}</span>
            </>
          )}
        </h3>
      </div>

      <div className="starter-monster-card__image">
        <img
          src={imageUrl || DEFAULT_IMAGE}
          alt={monster.name || monster.species1}
          onError={handleImageError}
        />
      </div>

      <div className="starter-monster-card__body">
        {types.length > 0 && (
          <BadgeGroup className="starter-monster-card__types" align="center" gap="xs">
            {types.map((type, index) => (
              <TypeBadge key={index} type={type} size="sm" />
            ))}
          </BadgeGroup>
        )}

        {monster.attribute && (
          <div className="starter-monster-card__attribute">
            <AttributeBadge attribute={monster.attribute} size="sm" />
          </div>
        )}

        {speciesImages.length > 0 && (
          <div className="starter-monster-card__species-images">
            {speciesImages.map((image, index) => (
              <div key={index} className="starter-monster-card__species-image">
                <img
                  src={image.src}
                  alt={image.alt}
                  title={image.title}
                  onError={handleImageError}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
