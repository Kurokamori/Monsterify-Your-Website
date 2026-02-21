import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { Trainer } from '@components/trainers/types/Trainer';
import type { TrainerMonster } from '@services/trainerService';

interface StatsTabProps {
  trainer: Trainer;
  monsters: TrainerMonster[];
}

export const StatsTab = ({ trainer, monsters }: StatsTabProps) => {
  const typeDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    monsters.forEach(m => {
      [m.type1, m.type2, m.type3].filter(Boolean).forEach(t => {
        counts[t as string] = (counts[t as string] || 0) + 1;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [monsters]);

  const speciesDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    monsters.forEach(m => {
      [m.species1, m.species2, m.species3].filter(Boolean).forEach(s => {
        counts[s as string] = (counts[s as string] || 0) + 1;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  }, [monsters]);

  const specialStatuses = useMemo(() => [
    { name: 'Shiny', count: monsters.filter(m => m.shiny === 1).length, icon: 'fas fa-star' },
    { name: 'Alpha', count: monsters.filter(m => m.alpha === 1).length, icon: 'fas fa-crown' },
    { name: 'Shadow', count: monsters.filter(m => m.shadow === 1).length, icon: 'fas fa-ghost' },
    { name: 'Paradox', count: monsters.filter(m => m.paradox === 1).length, icon: 'fas fa-infinity' },
    { name: 'Pokerus', count: monsters.filter(m => m.pokerus === 1).length, icon: 'fas fa-virus' },
  ], [monsters]);

  const attributeDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    monsters.forEach(m => {
      if (m.attribute) counts[m.attribute as string] = (counts[m.attribute as string] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [monsters]);

  const levelDistribution = useMemo(() => {
    const ranges: Record<string, number> = {
      '1-10': 0, '11-20': 0, '21-30': 0, '31-40': 0, '41-50': 0,
      '51-60': 0, '61-70': 0, '71-80': 0, '81-90': 0, '91-100': 0, '100+': 0,
    };
    monsters.forEach(m => {
      const level = Number(m.level) || 1;
      if (level <= 10) ranges['1-10']++;
      else if (level <= 20) ranges['11-20']++;
      else if (level <= 30) ranges['21-30']++;
      else if (level <= 40) ranges['31-40']++;
      else if (level <= 50) ranges['41-50']++;
      else if (level <= 60) ranges['51-60']++;
      else if (level <= 70) ranges['61-70']++;
      else if (level <= 80) ranges['71-80']++;
      else if (level <= 90) ranges['81-90']++;
      else if (level <= 100) ranges['91-100']++;
      else ranges['100+']++;
    });
    return Object.entries(ranges);
  }, [monsters]);

  const level100Count = useMemo(() =>
    monsters.filter(m => Number(m.level) === 100).length, [monsters]);

  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.onerror = null;
    target.src = '/images/default_mon.png';
  };

  return (
    <div className="trainer-detail__stats-section">
      <h2>Trainer Statistics</h2>

      <div className="trainer-detail__stats-section">
        <h3>Monster Statistics</h3>
        <div className="trainer-detail__stats-grid">
          <div className="ref-item">
            <div className="stat-icon"><i className="fas fa-dragon"></i></div>
            <div className="stat-content">
              <div className="trainer-detail__stat-value">{monsters.length}</div>
              <div className="trainer-detail__stat-label">Total Monsters</div>
            </div>
          </div>
          <div className="ref-item">
            <div className="stat-icon"><i className="fas fa-image"></i></div>
            <div className="stat-content">
              <div className="trainer-detail__stat-value">{trainer.monster_ref_count || 0}/{trainer.monster_count || 0}</div>
              <div className="trainer-detail__stat-label">Monster References</div>
              <div className="stat-progress">
                <div className="level-bar" style={{ width: `${trainer.monster_ref_percent || 0}%` }}></div>
              </div>
            </div>
          </div>
          <div className="ref-item">
            <div className="stat-icon"><i className="fas fa-trophy"></i></div>
            <div className="stat-content">
              <div className="trainer-detail__stat-value">{level100Count}</div>
              <div className="trainer-detail__stat-label">Level 100 Monsters</div>
            </div>
          </div>
          <div className="ref-item">
            <div className="stat-icon"><i className="fas fa-coins"></i></div>
            <div className="stat-content">
              <div className="trainer-detail__stat-value">{trainer.currency_amount || 0}</div>
              <div className="trainer-detail__stat-label">Current Currency</div>
            </div>
          </div>
          <div className="ref-item">
            <div className="stat-icon"><i className="fas fa-money-bill-wave"></i></div>
            <div className="stat-content">
              <div className="trainer-detail__stat-value">{trainer.total_earned_currency || 0}</div>
              <div className="trainer-detail__stat-label">Total Earned Currency</div>
            </div>
          </div>
        </div>
      </div>

      {monsters.length > 0 && (
        <>
          {/* Type Distribution */}
          <div className="trainer-detail__stats-section">
            <h3>Type Distribution</h3>
            <div className="type-distribution">
              <div className="type-bars">
                {typeDistribution.map(([type, count]) => (
                  <div className="type-bar-container" key={type}>
                    <div className="option-row">
                      <span className={`badge type-${type.toLowerCase()}`}>{type}</span>
                      <span className="type-count">{count}</span>
                    </div>
                    <div className="type-bar-wrapper">
                      <div className={`type-bar type-${type.toLowerCase()}`} style={{ width: `${(count / monsters.length) * 100}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Favorite Species */}
          <div className="trainer-detail__stats-section">
            <h3>Favorite Species</h3>
            <div className="favorite-species">
              <div className="refs-grid">
                {speciesDistribution.map(([species, count]) => {
                  const examples = monsters
                    .filter(m => m.species1 === species || m.species2 === species || m.species3 === species)
                    .slice(0, 3);
                  return (
                    <div className="ref-item" key={species}>
                      <div className="resource-header">
                        <h4>{species}</h4>
                        <span className="species-count">{count} monsters</span>
                      </div>
                      <div className="favorite-species-examples">
                        {examples.map(m => (
                          <Link to={`/monsters/${m.id}`} className="species-example" key={m.id}>
                            <img src={m.img_link || '/images/default_mon.png'} alt={m.name} onError={handleImgError} />
                            <span>{m.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Special Status */}
          <div className="trainer-detail__stats-section">
            <h3>Special Status Monsters</h3>
            <div className="special-status-grid">
              {specialStatuses.map(status => (
                <div className="ref-item" key={status.name}>
                  <div className="special-status-icon"><i className={status.icon}></i></div>
                  <div className="special-status-content">
                    <div className="species-count">{status.name}</div>
                    <div className="special-status-count">{status.count}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Attribute Distribution */}
          <div className="trainer-detail__stats-section">
            <h3>Attribute Distribution</h3>
            <div className="attribute-distribution">
              {attributeDistribution.length === 0 ? (
                <div className="no-data-message">
                  <p>No attribute data available for this trainer's monsters.</p>
                </div>
              ) : (
                <div className="type-bars">
                  {attributeDistribution.map(([attribute, count]) => (
                    <div className="attribute-item" key={attribute}>
                      <div className="type-count">{attribute}</div>
                      <div className="attribute-bar-wrapper">
                        <div className="attribute-bar" style={{ width: `${(count / monsters.length) * 100}%` }}></div>
                        <span className="attribute-count">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Level Distribution */}
          <div className="trainer-detail__stats-section">
            <h3>Level Distribution</h3>
            <div className="level-distribution">
              <div className="type-bars">
                {levelDistribution.map(([range, count]) => (
                  <div className="type-bar-container" key={range}>
                    <div className="option-row">
                      <span className="type-count">{range}</span>
                      <span className="type-count">{count}</span>
                    </div>
                    <div className="type-bar-wrapper">
                      <div className="level-bar" style={{ width: `${(count / monsters.length) * 100}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {monsters.length === 0 && (
        <div className="trainer-detail__map-header">
          <i className="fas fa-chart-bar"></i>
          <p>This trainer doesn't have any monsters yet, so statistics cannot be calculated.</p>
        </div>
      )}
    </div>
  );
};
