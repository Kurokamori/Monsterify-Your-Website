import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import api from '../../services/api';

const MonsterStats = () => {
  const { currentUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [monsterStats, setMonsterStats] = useState(null);
  const [selectedType, setSelectedType] = useState('all');
  const [sortBy, setSortBy] = useState('level');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    fetchMonsterStats();
  }, [selectedType, sortBy, sortOrder]);

  const fetchMonsterStats = async () => {
    try {
      setLoading(true);

      // Fetch monster statistics
      const response = await api.get(`/statistics/monster?type=${selectedType}&sort=${sortBy}&order=${sortOrder}`);

      // Check if the response has the expected structure
      if (response.data && response.data.success && response.data.data) {
        setMonsterStats(response.data.data);
      } else {
        setMonsterStats(null);
        setError('Invalid response format from the server.');
      }

    } catch (err) {
      console.error('Error fetching monster statistics:', err);
      setError('Failed to load monster statistics. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      // Toggle sort order if clicking the same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort field and default to descending
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Fallback data for development
  const fallbackStats = {
    overview: {
      total_monsters: 42,
      unique_species: 28,
      average_level: 22,
      highest_level: 35,
      type_distribution: {
        Fire: 8,
        Water: 10,
        Grass: 7,
        Electric: 5,
        Normal: 12
      }
    },
    top_monsters: [
      {
        id: 1,
        name: 'Flameon',
        image_path: 'https://via.placeholder.com/80/1e2532/d6a339?text=Flameon',
        level: 35,
        types: ['Fire'],
        stats: {
          hp: 120,
          attack: 95,
          defense: 70,
          sp_attack: 110,
          sp_defense: 85,
          speed: 90
        },
        battles_won: 42,
        battles_total: 50
      },
      {
        id: 2,
        name: 'Aqueon',
        image_path: 'https://via.placeholder.com/80/1e2532/d6a339?text=Aqueon',
        level: 33,
        types: ['Water'],
        stats: {
          hp: 130,
          attack: 75,
          defense: 90,
          sp_attack: 100,
          sp_defense: 95,
          speed: 80
        },
        battles_won: 38,
        battles_total: 45
      },
      {
        id: 3,
        name: 'Zappeon',
        image_path: 'https://via.placeholder.com/80/1e2532/d6a339?text=Zappeon',
        level: 32,
        types: ['Electric'],
        stats: {
          hp: 110,
          attack: 85,
          defense: 65,
          sp_attack: 105,
          sp_defense: 75,
          speed: 120
        },
        battles_won: 35,
        battles_total: 42
      }
    ],
    monsters: [
      {
        id: 1,
        name: 'Flameon',
        image_path: 'https://via.placeholder.com/80/1e2532/d6a339?text=Flameon',
        level: 35,
        types: ['Fire'],
        battles_won: 42,
        battles_total: 50,
        win_rate: 84
      },
      {
        id: 2,
        name: 'Aqueon',
        image_path: 'https://via.placeholder.com/80/1e2532/d6a339?text=Aqueon',
        level: 33,
        types: ['Water'],
        battles_won: 38,
        battles_total: 45,
        win_rate: 84.4
      },
      {
        id: 3,
        name: 'Zappeon',
        image_path: 'https://via.placeholder.com/80/1e2532/d6a339?text=Zappeon',
        level: 32,
        types: ['Electric'],
        battles_won: 35,
        battles_total: 42,
        win_rate: 83.3
      },
      {
        id: 4,
        name: 'Leafeon',
        image_path: 'https://via.placeholder.com/80/1e2532/d6a339?text=Leafeon',
        level: 30,
        types: ['Grass'],
        battles_won: 30,
        battles_total: 38,
        win_rate: 78.9
      },
      {
        id: 5,
        name: 'Normeon',
        image_path: 'https://via.placeholder.com/80/1e2532/d6a339?text=Normeon',
        level: 28,
        types: ['Normal'],
        battles_won: 25,
        battles_total: 35,
        win_rate: 71.4
      }
    ]
  };

  const displayStats = monsterStats || fallbackStats;
  const allTypes = ['all', ...Object.keys(displayStats.overview.type_distribution)];

  if (loading && !displayStats) {
    return <LoadingSpinner message="Loading monster statistics..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        message={error}
        onRetry={fetchMonsterStats}
      />
    );
  }

  return (
    <div className="monster-stats">
      <div className="missions-header">
        <div className="option-row">
          <h3 className="statistics-section-title">Monster Collection Overview</h3>
        </div>
        <div className="button">
          <div className="statistic-item">
            <div className="statistic-icon">
              <i className="fas fa-dragon"></i>
            </div>
            <div className="statistic-value">{displayStats.overview.total_monsters}</div>
            <div className="statistic-label">Total Monsters</div>
          </div>
          <div className="statistic-item">
            <div className="statistic-icon">
              <i className="fas fa-dna"></i>
            </div>
            <div className="statistic-value">{displayStats.overview.unique_species}</div>
            <div className="statistic-label">Unique Species</div>
          </div>
          <div className="statistic-item">
            <div className="statistic-icon">
              <i className="fas fa-chart-line"></i>
            </div>
            <div className="statistic-value">{displayStats.overview.average_level}</div>
            <div className="statistic-label">Average Level</div>
          </div>
          <div className="statistic-item">
            <div className="statistic-icon">
              <i className="fas fa-bolt"></i>
            </div>
            <div className="statistic-value">{displayStats.overview.highest_level}</div>
            <div className="statistic-label">Highest Level</div>
          </div>
        </div>
        <div className="monster-types-chart statistics-card">
          <h4 className="chart-title">Monster Types Distribution</h4>
          <div className="button">
            {Object.entries(displayStats.overview.type_distribution).map(([type, count]) => (
              <div className="monster-card" key={type}>
                <div className="type-distribution-header">
                  <span className={`type-badge type-${type.toLowerCase()}`}>{type}</span>
                  <span className="type-count">{count}</span>
                </div>
                <div className="progress-bar-container">
                  <div
                    className={`progress-bar type-${type.toLowerCase()}-bg`}
                    style={{ width: `${(count / displayStats.overview.total_monsters) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="missions-header">
        <div className="option-row">
          <h3 className="statistics-section-title">Top Monsters</h3>
        </div>
        <div className="button">
          {displayStats.top_monsters.map((monster, index) => (
            <div className="art-calculator" key={monster.id}>
              <div className="top-monster-rank">#{index + 1}</div>
              <div className="pc-box-slot">
                <img
                  src={monster.image_path}
                  alt={monster.name}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/images/default_mon.png';
                  }}
                />
              </div>
              <div className="top-monster-info">
                <h4 className="top-monster-name">{monster.name}</h4>
                <div className="stat-info">
                  <span className="top-monster-level">Lv. {monster.level}</span>
                  <div className="top-monster-types">
                    {monster.types.map((type, typeIndex) => (
                      <span className={`type-badge type-${type.toLowerCase()}`} key={typeIndex}>
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="top-monster-stats">
                  <div className="button">
                    <div className="stat-item">
                      <div className="stat-label">HP</div>
                      <div className="stat-bar-container">
                        <div
                          className="stat-bar hp-bar"
                          style={{ width: `${(monster.stats.hp / 150) * 100}%` }}
                        ></div>
                      </div>
                      <div className="stat-value">{monster.stats.hp}</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-label">ATK</div>
                      <div className="stat-bar-container">
                        <div
                          className="stat-bar atk-bar"
                          style={{ width: `${(monster.stats.attack / 150) * 100}%` }}
                        ></div>
                      </div>
                      <div className="stat-value">{monster.stats.attack}</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-label">DEF</div>
                      <div className="stat-bar-container">
                        <div
                          className="stat-bar def-bar"
                          style={{ width: `${(monster.stats.defense / 150) * 100}%` }}
                        ></div>
                      </div>
                      <div className="stat-value">{monster.stats.defense}</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-label">SP.ATK</div>
                      <div className="stat-bar-container">
                        <div
                          className="stat-bar sp-atk-bar"
                          style={{ width: `${(monster.stats.sp_attack / 150) * 100}%` }}
                        ></div>
                      </div>
                      <div className="stat-value">{monster.stats.sp_attack}</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-label">SP.DEF</div>
                      <div className="stat-bar-container">
                        <div
                          className="stat-bar sp-def-bar"
                          style={{ width: `${(monster.stats.sp_defense / 150) * 100}%` }}
                        ></div>
                      </div>
                      <div className="stat-value">{monster.stats.sp_defense}</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-label">SPD</div>
                      <div className="stat-bar-container">
                        <div
                          className="stat-bar spd-bar"
                          style={{ width: `${(monster.stats.speed / 150) * 100}%` }}
                        ></div>
                      </div>
                      <div className="stat-value">{monster.stats.speed}</div>
                    </div>
                  </div>
                </div>
                
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="missions-header">
        <div className="option-row">
          <h3 className="statistics-section-title">Monster List</h3>
          <div className="monster-filters">
            <div className="type-filter">
              <label htmlFor="type-select">Filter by Type:</label>
              <select
                id="type-select"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="form-input"
              >
                {allTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="monster-table-container statistics-card">
          <table className="monster-table">
            <thead>
              <tr>
                <th>Monster</th>
                <th
                  className={`sortable${sortBy === 'level' ? 'active' : ''}`}
                  onClick={() => handleSort('level')}
                >
                  Level
                  {sortBy === 'level' && (
                    <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                  )}
                </th>
                <th>Type</th>
                <th
                  className={`sortable${sortBy === 'battles_won' ? 'active' : ''}`}
                  onClick={() => handleSort('battles_won')}
                >
                  Battles Won
                  {sortBy === 'battles_won' && (
                    <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                  )}
                </th>
                <th
                  className={`sortable${sortBy === 'win_rate' ? 'active' : ''}`}
                  onClick={() => handleSort('win_rate')}
                >
                  Win Rate
                  {sortBy === 'win_rate' && (
                    <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                  )}
                </th>
              </tr>
            </thead>
            <tbody>
              {displayStats.monsters.map((monster) => (
                <tr key={monster.id}>
                  <td className="monster-cell">
                    <div className="monster-cell-content">
                      <img
                        src={monster.image_path}
                        alt={monster.name}
                        className="monster-table-image"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/images/default_mon.png';
                        }}
                      />
                      <span className="monster-table-name">{monster.name}</span>
                    </div>
                  </td>
                  <td>{monster.level}</td>
                  <td>
                    <div className="monster-table-types">
                      {monster.types.map((type, typeIndex) => (
                        <span className={`type-badge type-${type.toLowerCase()}`} key={typeIndex}>
                          {type}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>{monster.battles_won} / {monster.battles_total}</td>
                  <td>
                    <div className="win-rate-container">
                      <div className="win-rate-bar-container">
                        <div
                          className="win-rate-bar"
                          style={{ width: `${monster.win_rate}%` }}
                        ></div>
                      </div>
                      <span className="win-rate-value">{monster.win_rate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MonsterStats;
