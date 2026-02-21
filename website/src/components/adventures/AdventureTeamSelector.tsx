import { useState, useEffect } from 'react';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import api from '../../services/api';
import { Monster } from './types';

interface AdventureTeamSelectorProps {
  adventureId: number;
  trainerId: number;
  onTeamUpdate?: (monsterIds: number[]) => void;
  onCancel?: () => void;
}

export const AdventureTeamSelector = ({
  adventureId,
  trainerId,
  onTeamUpdate,
  onCancel
}: AdventureTeamSelectorProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trainerMonsters, setTrainerMonsters] = useState<Monster[]>([]);
  const [selectedMonsters, setSelectedMonsters] = useState<number[]>([]);
  const [maxTeamSize, setMaxTeamSize] = useState(6);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch trainer's monsters
        const monstersResponse = await api.get(`/monsters/trainer/${trainerId}`);
        setTrainerMonsters(monstersResponse.data.monsters || []);

        // Fetch current adventure team
        const teamResponse = await api.get(`/adventures/${adventureId}/team/${trainerId}`);
        setSelectedMonsters(teamResponse.data.team?.map((monster: Monster) => monster.id) || []);
        setMaxTeamSize(teamResponse.data.max_team_size || 6);
      } catch (err) {
        console.error('Error fetching team data:', err);
        setError('Failed to load team data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (adventureId && trainerId) {
      fetchData();
    }
  }, [adventureId, trainerId]);

  const handleMonsterSelect = (monsterId: number) => {
    setSelectedMonsters(prev => {
      if (prev.includes(monsterId)) {
        return prev.filter(id => id !== monsterId);
      }

      if (prev.length < maxTeamSize) {
        return [...prev, monsterId];
      }

      return prev;
    });
  };

  const handleSaveTeam = () => {
    if (onTeamUpdate) {
      onTeamUpdate(selectedMonsters);
    }
  };

  const getMonsterTypes = (monster: Monster): string[] => {
    return [monster.type1, monster.type2, monster.type3, monster.type4, monster.type5]
      .filter((type): type is string => Boolean(type));
  };

  const getMonsterDisplayName = (monster: Monster): string => {
    if (monster.name) return monster.name;
    let species = monster.species1 || '';
    if (monster.species2) species += `/${monster.species2}`;
    if (monster.species3) species += `/${monster.species3}`;
    return species || 'Unknown';
  };

  if (loading) {
    return <LoadingSpinner message="Loading team data..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        message={error}
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="team-selector">
      <div className="team-selector__header">
        <h3>Select Your Adventure Team</h3>
        <p className="team-selector__count">
          Selected: {selectedMonsters.length}/{maxTeamSize}
        </p>
      </div>

      <div className="monster-grid">
        {trainerMonsters.map(monster => (
          <div
            key={monster.id}
            className={`monster-card ${selectedMonsters.includes(monster.id) ? 'monster-card--selected' : ''}`}
            onClick={() => handleMonsterSelect(monster.id)}
          >
            <div className="monster-select-card__image">
              <img
                src={monster.image_path || '/images/default_mon.png'}
                alt={getMonsterDisplayName(monster)}
                className="monster-card__image"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = '/images/default_mon.png';
                }}
              />
              {selectedMonsters.includes(monster.id) && (
                <div className="monster-select-card__badge">
                  <i className="fas fa-check"></i>
                </div>
              )}
            </div>

            <div className="monster-card__info">
              <h4 className="monster-card__name">{getMonsterDisplayName(monster)}</h4>
              <div className="monster-select-card__info">
                <span className="monster-card__species">
                  {monster.species1}
                  {monster.species2 && ` / ${monster.species2}`}
                  {monster.species3 && ` / ${monster.species3}`}
                </span>
                <span className="monster-card__level">Lv. {monster.level}</span>
              </div>

              <div className="monster-card__types">
                {getMonsterTypes(monster).map((type, index) => (
                  <span
                    key={index}
                    className={`badge badge--type-${type.toLowerCase()}`}
                  >
                    {type}
                  </span>
                ))}
              </div>

              <div className="monster-select-card__stats">
                <div className="stat-row">
                  <div className="stat-item">
                    <span className="stat-label">HP</span>
                    <span className="stat-value">{monster.stats.hp}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">ATK</span>
                    <span className="stat-value">{monster.stats.attack}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">DEF</span>
                    <span className="stat-value">{monster.stats.defense}</span>
                  </div>
                </div>
                <div className="stat-row">
                  <div className="stat-item">
                    <span className="stat-label">SP.A</span>
                    <span className="stat-value">{monster.stats.sp_attack}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">SP.D</span>
                    <span className="stat-value">{monster.stats.sp_defense}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">SPD</span>
                    <span className="stat-value">{monster.stats.speed}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="team-selector__actions">
        <button
          className="button secondary"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          className="button primary"
          onClick={handleSaveTeam}
          disabled={selectedMonsters.length === 0}
        >
          Save Team
        </button>
      </div>
    </div>
  );
};

export default AdventureTeamSelector;
