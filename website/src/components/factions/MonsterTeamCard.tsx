import { TypeBadge, AttributeBadge, BadgeGroup } from '../common';

interface TeamMonster {
  id: number | string;
  name: string;
  image?: string;
  species?: string[];
  types?: string[];
  attribute?: string;
}

interface MonsterTeamCardProps {
  monster: TeamMonster;
}

export const MonsterTeamCard = ({ monster }: MonsterTeamCardProps) => {
  return (
    <div className="monster-team-card">
      <div className="monster-team-card__header">
        <div className="monster-team-card__image">
          {monster.image ? (
            <img src={monster.image} alt={monster.name} />
          ) : (
            <div className="monster-team-card__image-placeholder">
              <i className="fas fa-dragon"></i>
            </div>
          )}
        </div>
        <h5 className="monster-team-card__name">{monster.name}</h5>
      </div>

      <div className="monster-team-card__details">
        {monster.species && monster.species.length > 0 && (
          <div className="monster-team-card__row">
            <label>Species:</label>
            <div className="monster-team-card__species-list">
              {monster.species.map((species, index) => (
                <span key={index} className="monster-team-card__species-tag">
                  {species}
                </span>
              ))}
            </div>
          </div>
        )}

        {monster.types && monster.types.length > 0 && (
          <div className="monster-team-card__row">
            <label>Types:</label>
            <BadgeGroup className="monster-team-card__types-list" gap="xs">
              {monster.types.map((type, index) => (
                <TypeBadge key={index} type={type} size="xs" />
              ))}
            </BadgeGroup>
          </div>
        )}

        {monster.attribute && (
          <div className="monster-team-card__row">
            <label>Attribute:</label>
            <AttributeBadge attribute={monster.attribute} size="xs" />
          </div>
        )}
      </div>
    </div>
  );
};
