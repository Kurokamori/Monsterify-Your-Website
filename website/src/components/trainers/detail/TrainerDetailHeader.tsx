import { Link } from 'react-router-dom';
import { TypeBadge } from '@components/common/TypeBadge';
import type { Trainer } from '@components/trainers/types/Trainer';

interface TrainerDetailHeaderProps {
  trainer: Trainer;
  isOwner: boolean;
}

export const TrainerDetailHeader = ({ trainer, isOwner }: TrainerDetailHeaderProps) => {
  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.onerror = null;
    target.src = '/images/default_trainer.png';
  };

  const types = [trainer.type1, trainer.type2, trainer.type3, trainer.type4, trainer.type5, trainer.type6].filter(Boolean) as string[];
  const species = [trainer.species1, trainer.species2, trainer.species3].filter(Boolean) as string[];

  return (
    <div className="trainer-detail-header">
      <div className="trainer-profile-image-container">
        <img
          src={trainer.main_ref || '/images/default_trainer.png'}
          alt={trainer.name}
          className="trainer-profile-image"
          onError={handleImgError}
        />
        {!!(trainer as unknown as Record<string, unknown>).main_ref_artist && (
          <div className="image-credit">
            Art by: {String((trainer as unknown as Record<string, unknown>).main_ref_artist)}
          </div>
        )}
      </div>

      <div className="trainer-profile-info">
        <div className="trainer-profile-info-header">
          <div className="option-row">
            <h1 className="trainer-profile-name">
              {trainer.name}
              {trainer.nickname && <span className="trainer-nickname">({trainer.nickname})</span>}
            </h1>
            <h3 className="trainer-profile-age">
              {trainer.age ? `Age: ${trainer.age}` : 'Age: Unknown'}
            </h3>
          </div>

          <div className="trainer-player-info">
            <div>
              <i className="fas fa-user"></i>
              <span>Owned by {trainer.player_display_name || trainer.player_username || 'Unknown Player'}</span>
            </div>
            <div className="trainer-level-faction">
              <span className="trainer-level">Level {trainer.level || 1}</span>
              {trainer.faction && (
                <>
                  <span>-</span>
                  <span className="trainer-faction">{trainer.faction}</span>
                </>
              )}
            </div>
          </div>

          <div className="trainer-profile-stats-currency-monsters">
            <div className="trainer-monster-stats">
              <i className="fas fa-dragon"></i>
              <span>
                {trainer.monster_count || 0} Monsters
                {trainer.monster_ref_count != null && ` (${trainer.monster_ref_count}/${trainer.monster_count} Refs - ${trainer.monster_ref_percent || 0}%)`}
              </span>
            </div>
            <div className="trainer-monster-stats">
              <i className="fas fa-coins"></i>
              <span>
                Current : {trainer.currency_amount || 0} <br />Total Earned : {trainer.total_earned_currency || 0}
              </span>
            </div>
          </div>
        </div>

        {trainer.tldr && (
          <div className="trainer-tldr">
            <p>{trainer.tldr}</p>
          </div>
        )}

        <div className="trainer-compact-info">
          <div className="trainer-attributes-grid">
            <div className="claim-limits">
              {species.length > 0 && (
                <div className="attribute-column">
                  <span className="trainer-detail__info-label">Species</span>
                  <div className="attribute-column">
                    {species.map((s, i) => (
                      <span key={i} className="badge tertiary">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {types.length > 0 && (
                <div className="attribute-column">
                  <span className="trainer-detail__info-label">Type</span>
                  <div className="mega-types types-grid">
                    {types.map((type, i) => (
                      <TypeBadge key={i} type={type} fullWidth />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="attribute-column">
                {trainer.ability && (
                  <div className="attribute-item">
                    <span className="trainer-detail__info-label">Ability</span>
                    <div className="flex">
                      <span className="badge tertiary full-width">{trainer.ability}</span>
                    </div>
                  </div>
                )}

                {(trainer.nature || trainer.characteristic) && (
                  <div className="attribute-item">
                    <div className="nature-characteristic-row">
                      {trainer.nature && (
                        <div className="nature-characteristic-column">
                          <span className="trainer-detail__info-label">Nature</span>
                          <span className="badge tertiary">{trainer.nature}</span>
                        </div>
                      )}
                      {trainer.characteristic && (
                        <div className="nature-characteristic-column">
                          <span className="trainer-detail__info-label">Characteristic</span>
                          <span className="badge tertiary">{trainer.characteristic}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {isOwner && (
          <div className="trainer-actions">
            <Link to={`/trainers/${trainer.id}/edit`} className="button secondary">
              <i className="fas fa-edit"></i> Edit Trainer
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
