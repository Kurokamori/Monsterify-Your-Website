import { TypeBadge } from '@components/common/TypeBadge';
import { BadgeGroup } from '@components/common/BadgeGroup';
import type { Monster } from '@services/monsterService';
import type { MegaImages } from '../useMonsterDetail';

interface MegaEvolutionTabProps {
  monster: Monster;
  megaImages: MegaImages;
}

export const MegaEvolutionTab = ({ monster, megaImages }: MegaEvolutionTabProps) => {
  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>, fallback: string) => {
    const target = e.target as HTMLImageElement;
    target.onerror = null;
    target.src = fallback;
  };

  const megaStoneImgSrc =
    megaImages.mega_stone_image?.image_url || (monster.mega_stone_img as string);
  const megaImgSrc =
    megaImages.mega_image?.image_url ||
    (monster.mega_img_link as string) ||
    '/images/default_mon.png';

  const normalTypes = [monster.type1, monster.type2, monster.type3, monster.type4, monster.type5].filter(Boolean) as string[];
  const megaTypes = [monster.mega_type1 as string, monster.mega_type2 as string, monster.mega_type3 as string, monster.mega_type4 as string, monster.mega_type5 as string].filter(
    Boolean,
  );
  const normalSpecies = [monster.species1, monster.species2, monster.species3]
    .filter(Boolean)
    .join(' / ');
  const megaSpecies =
    [
      monster.mega_species1 as string,
      monster.mega_species2 as string,
      monster.mega_species3 as string,
    ]
      .filter(Boolean)
      .join(' / ') || `Mega ${monster.species1}`;

  return (
    <div className="town-square">
      {/* Mega Stone */}
      <div className="trainer-detail__stats-section">
        <h2>Mega Stone</h2>
        <div className="monster-mega-stone-info">
          <div className="monster-mega-stone-image">
            {megaStoneImgSrc ? (
              <img
                src={megaStoneImgSrc}
                alt={(monster.mega_stone_name as string) || 'Mega Stone'}
                onError={(e) => handleImgError(e, '/images/default_item.png')}
              />
            ) : (
              <div className="monster-mega-stone-placeholder">
                <i className="fas fa-gem"></i>
              </div>
            )}
          </div>
          <div>
            <h3>{(monster.mega_stone_name as string) || 'Mega Stone'}</h3>
            <p>A special stone that enables {monster.name} to Mega Evolve during battle.</p>
          </div>
        </div>
      </div>

      {/* Form Comparison */}
      <div className="trainer-detail__stats-section">
        <h2>Form Comparison</h2>
        <div className="monster-mega-comparison">
          {/* Normal Form */}
          <div className="monster-mega-form">
            <h3>Normal Form</h3>
            <div className="monster-mega-form-image">
              <img
                src={
                  (monster.img_link as string) ||
                  (monster.main_ref as string) ||
                  '/images/default_mon.png'
                }
                alt={monster.name ?? 'Normal Form'}
                onError={(e) => handleImgError(e, '/images/default_mon.png')}
              />
            </div>
            <div className="monster-mega-form-details">
              <p className="monster-mega-form-species">{normalSpecies}</p>
              {normalTypes.length > 0 && (
                <BadgeGroup gap="xs" align="center">
                  {normalTypes.map((type, i) => (
                    <TypeBadge key={i} type={type} size="sm" />
                  ))}
                </BadgeGroup>
              )}
              {!!monster.ability && (
                <div className="monster-mega-form-ability">
                  <span className="detail-label">Ability:</span>
                  <span className="detail-value">{String(monster.ability)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Arrow */}
          <div className="monster-mega-arrow">
            <i className="fas fa-arrow-right"></i>
          </div>

          {/* Mega Form */}
          <div className="monster-mega-form">
            <h3>Mega Form</h3>
            <div className="monster-mega-form-image">
              {megaImgSrc && megaImgSrc !== '/images/default_mon.png' ? (
                <img
                  src={megaImgSrc}
                  alt={`Mega ${monster.name}`}
                  onError={(e) => handleImgError(e, '/images/default_mon.png')}
                />
              ) : (
                <div className="monster-mega-stone-placeholder">
                  <i className="fas fa-question"></i>
                </div>
              )}
            </div>
            <div className="monster-mega-form-details">
              <p className="monster-mega-form-species">{megaSpecies}</p>
              {megaTypes.length > 0 && (
                <BadgeGroup gap="xs" align="center">
                  {megaTypes.map((type, i) => (
                    <TypeBadge key={i} type={type} size="sm" />
                  ))}
                </BadgeGroup>
              )}
              <div className="monster-mega-form-ability">
                <span className="detail-label">Ability:</span>
                <span className="detail-value">
                  {(monster.mega_ability as string) || 'Unknown'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Bonus */}
      {(monster.mega_stat_bonus as number) > 0 && (
        <div className="trainer-detail__stats-section">
          <h2>Mega Evolution Stat Bonus</h2>
          <p>
            When Mega Evolved, this monster gains a +{monster.mega_stat_bonus as number} boost to
            its total stats.
          </p>
        </div>
      )}
    </div>
  );
};
