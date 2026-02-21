import { TypeBadge } from '@components/common/TypeBadge';
import type { Trainer } from '@components/trainers/types/Trainer';

interface MegaInfoTabProps {
  trainer: Trainer;
}

export const MegaInfoTab = ({ trainer }: MegaInfoTabProps) => {
  let megaInfo: Record<string, string | undefined> = {};
  if (trainer.mega_info) {
    try {
      megaInfo = typeof trainer.mega_info === 'string'
        ? JSON.parse(trainer.mega_info)
        : (trainer.mega_info as unknown as Record<string, string>);
    } catch { /* skip */ }
  }

  const megaRef = megaInfo.mega_ref || trainer.mega_ref;
  const megaArtist = megaInfo.mega_artist || trainer.mega_artist;
  const megaSpecies = [
    megaInfo.mega_species1 || trainer.mega_species1,
    megaInfo.mega_species2 || trainer.mega_species2,
    megaInfo.mega_species3 || trainer.mega_species3,
  ].filter(Boolean) as string[];

  const megaTypes = [
    megaInfo.mega_type1 || trainer.mega_type1,
    megaInfo.mega_type2 || trainer.mega_type2,
    megaInfo.mega_type3 || trainer.mega_type3,
    megaInfo.mega_type4 || trainer.mega_type4,
    megaInfo.mega_type5 || trainer.mega_type5,
    megaInfo.mega_type6 || trainer.mega_type6,
  ].filter(Boolean) as string[];

  const megaAbility = megaInfo.mega_ability || trainer.mega_ability;
  const hasMega = megaSpecies.length > 0 || megaTypes.length > 0 || megaAbility || megaRef;

  if (!hasMega) {
    return (
      <div className="trainer-detail__stats-section">
        <h2>Mega Evolution Info</h2>
        <div className="no-data-message">
          <i className="fas fa-dna"></i>
          <p>No mega evolution information available for this trainer.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="trainer-detail__stats-section">
      <h2>Mega Evolution Info</h2>
      <div className="trainer-mega-info">
        {megaRef && (
          <div className="mega-image-container">
            <img
              src={megaRef}
              alt={`${trainer.name} Mega Form`}
              className="mega-image"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = '/images/default_trainer.png';
              }}
            />
            {megaArtist && <div className="image-credit">Art by: {megaArtist}</div>}
          </div>
        )}

        {megaSpecies.length > 0 && (
          <div className="mega-stat-group">
            <h4>Species</h4>
            <div className="badge-group badge-group--sm">
              {megaSpecies.map((species, i) => (
                <span key={i} className="badge secondary full-width">{species}</span>
              ))}
            </div>
          </div>
        )}

        {megaTypes.length > 0 && (
          <div className="mega-stat-group">
            <h4>Types</h4>
            <div className="mega-types">
              {megaTypes.map((type, i) => (
                <TypeBadge key={i} type={type} fullWidth />
              ))}
            </div>
          </div>
        )}

        {megaAbility && (
          <div className="mega-stat-group">
            <h4>Ability</h4>
            <span className="badge secondary full-width">{megaAbility}</span>
          </div>
        )}
      </div>
    </div>
  );
};
