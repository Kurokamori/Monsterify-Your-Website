import { FRANCHISE_CONFIG, FranchiseKey, Species } from '../../services/speciesService';
import { TypeBadge } from '../common/TypeBadge';

interface SpeciesCardProps {
  species: Species;
  franchise: FranchiseKey;
  onClick?: () => void;
}

export const SpeciesCard = ({ species, franchise, onClick }: SpeciesCardProps) => {
  const config = FRANCHISE_CONFIG[franchise];

  if (!species || !config) {
    return null;
  }

  const name = (species[config.nameField] as string) || 'Unknown';
  const imageUrl = species[config.imageField] as string | undefined;

  const getAllTypes = (): string[] => {
    if (franchise === 'pokemon' || franchise === 'nexomon') {
      const types: string[] = [];
      if (species.typePrimary) types.push(species.typePrimary as string);
      if (species.typeSecondary) types.push(species.typeSecondary as string);
      return types;
    }
    if (franchise === 'fakemon') {
      return [species.type1, species.type2, species.type3, species.type4, species.type5]
        .filter(Boolean) as string[];
    }
    if (franchise === 'digimon') {
      return species.attribute ? [species.attribute as string] : [];
    }
    if (franchise === 'monsterhunter') {
      return species.element ? [species.element as string] : [];
    }
    return [];
  };

  const getSecondaryInfo = (): string | null => {
    if (franchise === 'pokemon' && species.ndex) {
      return `#${String(species.ndex).padStart(3, '0')}`;
    }
    if (franchise === 'nexomon' && species.nr) {
      return `#${String(species.nr).padStart(3, '0')}`;
    }
    if (franchise === 'fakemon' && species.number) {
      return `#${String(species.number).padStart(3, '0')}`;
    }
    if (franchise === 'digimon' && species.rank) {
      return species.rank as string;
    }
    if (franchise === 'yokai' && species.rank) {
      return `${species.tribe || ''} ${species.rank}`.trim();
    }
    if (franchise === 'monsterhunter' && species.rank) {
      return `Rank ${species.rank}`;
    }
    return null;
  };

  const types = getAllTypes();
  const secondaryInfo = getSecondaryInfo();

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.onerror = null;
    target.src = '/images/placeholder-monster.png';
  };

  return (
    <div className="species-card" onClick={onClick}>
      <div className="species-card__image">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            onError={handleImageError}
          />
        ) : (
          <div className="species-card__placeholder">
            <i className="fas fa-question"></i>
          </div>
        )}
      </div>

      <div className="species-card__info">
        <div className="species-card__name">{name}</div>

        {secondaryInfo && (
          <div className="species-card__secondary">{secondaryInfo}</div>
        )}

        {types.length > 0 && (
          <div className="species-card__type">
            {types.map((type, index) => (
              <TypeBadge key={index} type={type} size="xs" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
