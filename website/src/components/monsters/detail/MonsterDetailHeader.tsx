import { Link } from 'react-router-dom';
import { TypeBadge } from '@components/common/TypeBadge';
import { AttributeBadge } from '@components/common/AttributeBadge';
import type { Monster } from '@services/monsterService';
import type { Trainer } from '@components/trainers/types/Trainer';

interface MonsterDetailHeaderProps {
  monster: Monster;
  trainer: Trainer | null;
  isOwner: boolean;
  prevMonster: Monster | null;
  nextMonster: Monster | null;
}

export const MonsterDetailHeader = ({
  monster,
  trainer,
  isOwner,
  prevMonster,
  nextMonster,
}: MonsterDetailHeaderProps) => {
  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.onerror = null;
    target.src = '/images/default_mon.png';
  };

  const types = [monster.type1, monster.type2, monster.type3, monster.type4, monster.type5].filter(
    Boolean,
  ) as string[];
  const species = [monster.species1, monster.species2, monster.species3].filter(
    Boolean,
  ) as string[];

  return (
    <>
      {/* Monster Navigation */}
      {(prevMonster || nextMonster || trainer) && (
        <div className="monster-box-navigation">
          {prevMonster ? (
            <Link to={`/monsters/${prevMonster.id}`} className="button tertiary">
              <i className="fas fa-chevron-left"></i>
              <span>{prevMonster.name}</span>
            </Link>
          ) : (
            <div className="box-nav-placeholder"></div>
          )}

          {/* Return to Trainer Navigation */}
          <div className="monster-box-navigation">
            <Link to ={`/trainers/${trainer?.id}`} className="button tertiary">
              <i className="fas fa-chevron-left"></i>
              <span>Return to Trainer</span>
            </Link>
          </div>

          {nextMonster ? (
            <Link to={`/monsters/${nextMonster.id}`} className="button tertiary">
              <span>{nextMonster.name}</span>
              <i className="fas fa-chevron-right"></i>
            </Link>
          ) : (
            <div className="box-nav-placeholder"></div>
          )}
        </div>
      )}

      <div className="trainer-detail-header">
        <div className="monster-profile-image-container">
          <img
            src={
              (monster.img_link as string) ||
              (monster.main_ref as string) ||
              '/images/default_mon.png'
            }
            alt={monster.name ?? 'Monster'}
            className="monster-profile-image"
            onError={handleImgError}
          />
        </div>

        <div className="trainer-profile-info">
          <div className="trainer-profile-info-header">
            <div className="flex justify-between items-center">
              <h1 className="trainer-profile-name">
                {monster.name}
              </h1>
              <span className="badge info half-height">Level {(monster.level as number) || 1}</span>
            </div>
          </div>

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

              {monster.attribute && (
                <div className="attribute-column">
                  <span className="trainer-detail__info-label">Attribute</span>
                  <AttributeBadge attribute={monster.attribute as string} />
                </div>
              )}
            </div>
          </div>

          {trainer && (
            <div className="trainer-player-info">
              <div>
                <i className="fas fa-user"></i>
                <span>
                  Trainer:{' '}
                  <Link to={`/trainers/${trainer.id}`} className="trainer-link">
                    {trainer.name}
                  </Link>
                </span>
              </div>
            </div>
          )}

          {isOwner && (
            <div className="trainer-actions">
              <Link to={`/monsters/${monster.id}/edit`} className="button secondary">
                <i className="fas fa-edit"></i> Edit Monster
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
