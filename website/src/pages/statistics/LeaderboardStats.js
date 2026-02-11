import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import api from '../../services/api';

const LeaderboardStats = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [leaderboardStats, setLeaderboardStats] = useState(null);
  const [globalStats, setGlobalStats] = useState(null);

  useEffect(() => {
    fetchLeaderboardStats();
  }, []);

  const fetchLeaderboardStats = async () => {
    try {
      setLoading(true);

      // Fetch both leaderboard and global statistics
      const [leaderboardResponse, comparisonResponse] = await Promise.all([
        api.get('/statistics/leaderboards'),
        api.get('/statistics/trainer-comparison')
      ]);

      // Check if the response has the expected structure
      if (leaderboardResponse.data && leaderboardResponse.data.success && leaderboardResponse.data.data) {
        setLeaderboardStats(leaderboardResponse.data.data);
      } else {
        setLeaderboardStats(null);
        setError('Invalid response format from the server.');
      }

      // Set global stats from trainer-comparison endpoint
      if (comparisonResponse.data && comparisonResponse.data.success && comparisonResponse.data.data) {
        setGlobalStats(comparisonResponse.data.data.global_stats);
      }

    } catch (err) {
      console.error('Error fetching leaderboard statistics:', err);
      setError('Failed to load leaderboard statistics. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Fallback data for development
  const fallbackStats = {
    top_trainers_by_level: [
      { id: 1, name: 'Ash Ketchum', level: 35, player_display_name: 'AshTrainer' },
      { id: 2, name: 'Misty Waters', level: 32, player_display_name: 'WaterMaster' },
      { id: 3, name: 'Brock Stone', level: 30, player_display_name: 'RockSolid' },
      { id: 4, name: 'Gary Oak', level: 28, player_display_name: 'GaryOak' },
      { id: 5, name: 'Lance Dragon', level: 27, player_display_name: 'DragonMaster' }
    ],
    top_trainers_by_monster_count: [
      { id: 1, name: 'Ash Ketchum', monster_count: 45, player_display_name: 'AshTrainer' },
      { id: 4, name: 'Gary Oak', monster_count: 38, player_display_name: 'GaryOak' },
      { id: 2, name: 'Misty Waters', monster_count: 35, player_display_name: 'WaterMaster' },
      { id: 3, name: 'Brock Stone', monster_count: 32, player_display_name: 'RockSolid' },
      { id: 5, name: 'Lance Dragon', monster_count: 28, player_display_name: 'DragonMaster' }
    ],
    top_trainers_by_ref_percent: [
      { id: 2, name: 'Misty Waters', monster_ref_percent: 95, monster_ref_count: 33, monster_count: 35, player_display_name: 'WaterMaster' },
      { id: 3, name: 'Brock Stone', monster_ref_percent: 90, monster_ref_count: 29, monster_count: 32, player_display_name: 'RockSolid' },
      { id: 1, name: 'Ash Ketchum', monster_ref_percent: 87, monster_ref_count: 39, monster_count: 45, player_display_name: 'AshTrainer' },
      { id: 4, name: 'Gary Oak', monster_ref_percent: 84, monster_ref_count: 32, monster_count: 38, player_display_name: 'GaryOak' },
      { id: 5, name: 'Lance Dragon', monster_ref_percent: 82, monster_ref_count: 23, monster_count: 28, player_display_name: 'DragonMaster' }
    ],
    bottom_trainers_by_ref_percent: [
      { id: 6, name: 'Team Rocket', monster_ref_percent: 25, monster_ref_count: 3, monster_count: 12, player_display_name: 'RocketTeam' },
      { id: 7, name: 'Youngster Joey', monster_ref_percent: 33, monster_ref_count: 2, monster_count: 6, player_display_name: 'TopPercentage' },
      { id: 8, name: 'Bug Catcher', monster_ref_percent: 40, monster_ref_count: 4, monster_count: 10, player_display_name: 'BugLover' },
      { id: 9, name: 'Picnicker', monster_ref_percent: 45, monster_ref_count: 5, monster_count: 11, player_display_name: 'NatureLover' },
      { id: 10, name: 'Hiker', monster_ref_percent: 50, monster_ref_count: 7, monster_count: 14, player_display_name: 'MountainMan' }
    ],
    top_trainers_by_currency: [
      { id: 1, name: 'Ash Ketchum', currency_amount: 15000, player_display_name: 'AshTrainer' },
      { id: 4, name: 'Gary Oak', currency_amount: 12500, player_display_name: 'GaryOak' },
      { id: 2, name: 'Misty Waters', currency_amount: 11000, player_display_name: 'WaterMaster' },
      { id: 3, name: 'Brock Stone', currency_amount: 9500, player_display_name: 'RockSolid' },
      { id: 5, name: 'Lance Dragon', currency_amount: 8750, player_display_name: 'DragonMaster' }
    ],
    top_trainers_by_total_currency: [
      { id: 1, name: 'Ash Ketchum', total_earned_currency: 45000, player_display_name: 'AshTrainer' },
      { id: 4, name: 'Gary Oak', total_earned_currency: 38000, player_display_name: 'GaryOak' },
      { id: 2, name: 'Misty Waters', total_earned_currency: 35000, player_display_name: 'WaterMaster' },
      { id: 3, name: 'Brock Stone', total_earned_currency: 32000, player_display_name: 'RockSolid' },
      { id: 5, name: 'Lance Dragon', total_earned_currency: 28000, player_display_name: 'DragonMaster' }
    ],
    top_trainers_by_total_level: [
      { id: 1, name: 'Ash Ketchum', total_monster_levels: 1250, player_display_name: 'AshTrainer' },
      { id: 4, name: 'Gary Oak', total_monster_levels: 980, player_display_name: 'GaryOak' },
      { id: 2, name: 'Misty Waters', total_monster_levels: 875, player_display_name: 'WaterMaster' },
      { id: 3, name: 'Brock Stone', total_monster_levels: 720, player_display_name: 'RockSolid' },
      { id: 5, name: 'Lance Dragon', total_monster_levels: 650, player_display_name: 'DragonMaster' }
    ],
    top_trainers_by_level_100_count: [
      { id: 1, name: 'Ash Ketchum', level_100_count: 8, player_display_name: 'AshTrainer' },
      { id: 4, name: 'Gary Oak', level_100_count: 6, player_display_name: 'GaryOak' },
      { id: 2, name: 'Misty Waters', level_100_count: 5, player_display_name: 'WaterMaster' },
      { id: 3, name: 'Brock Stone', level_100_count: 4, player_display_name: 'RockSolid' },
      { id: 5, name: 'Lance Dragon', level_100_count: 3, player_display_name: 'DragonMaster' }
    ],
    type_specialists: {
      Fire: { trainer_name: 'Blaze Master', player_display_name: 'FireTrainer', count: 15 },
      Water: { trainer_name: 'Misty Waters', player_display_name: 'WaterMaster', count: 18 },
      Grass: { trainer_name: 'Erika Green', player_display_name: 'PlantLover', count: 12 },
      Electric: { trainer_name: 'Lt. Surge', player_display_name: 'ThunderBolt', count: 10 },
      Psychic: { trainer_name: 'Sabrina Mind', player_display_name: 'PsychicMaster', count: 8 },
      Ice: { trainer_name: 'Pryce Frost', player_display_name: 'IceCold', count: 7 },
      Dragon: { trainer_name: 'Lance Dragon', player_display_name: 'DragonMaster', count: 14 },
      Dark: { trainer_name: 'Karen Shadow', player_display_name: 'DarkQueen', count: 9 },
      Steel: { trainer_name: 'Jasmine Metal', player_display_name: 'SteelWill', count: 6 },
      Fairy: { trainer_name: 'Valerie Pink', player_display_name: 'FairyTale', count: 11 }
    },
    attribute_specialists: {
      Virus: { trainer_name: 'Dark Tamer', player_display_name: 'VirusLord', count: 12 },
      Vaccine: { trainer_name: 'Holy Knight', player_display_name: 'LightBringer', count: 15 },
      Data: { trainer_name: 'Tech Master', player_display_name: 'DataMiner', count: 10 },
      Free: { trainer_name: 'Wild Spirit', player_display_name: 'FreedomFighter', count: 8 },
      Variable: { trainer_name: 'Chaos Walker', player_display_name: 'VariableMind', count: 6 }
    },
    species_specialists: [
      {
        trainer_name: 'Ash Ketchum',
        player_display_name: 'AshTrainer',
        species: 'Pikachu',
        count: 10,
        sample_monsters: [
          { id: 1, name: 'Pikachu #1', img_link: 'https://example.com/pikachu1.png' },
          { id: 2, name: 'Pikachu #2', img_link: 'https://example.com/pikachu2.png' },
          { id: 3, name: 'Pikachu #3', img_link: 'https://example.com/pikachu3.png' }
        ]
      },
      {
        trainer_name: 'Gary Oak',
        player_display_name: 'GaryOak',
        species: 'Eevee',
        count: 8,
        sample_monsters: [
          { id: 4, name: 'Eevee #1', img_link: 'https://example.com/eevee1.png' },
          { id: 5, name: 'Eevee #2', img_link: 'https://example.com/eevee2.png' },
          { id: 6, name: 'Eevee #3', img_link: 'https://example.com/eevee3.png' }
        ]
      },
      {
        trainer_name: 'Misty Waters',
        player_display_name: 'WaterMaster',
        species: 'Magikarp',
        count: 7,
        sample_monsters: [
          { id: 7, name: 'Magikarp #1', img_link: 'https://example.com/magikarp1.png' },
          { id: 8, name: 'Magikarp #2', img_link: 'https://example.com/magikarp2.png' },
          { id: 9, name: 'Magikarp #3', img_link: 'https://example.com/magikarp3.png' }
        ]
      }
    ]
  };

  const displayStats = leaderboardStats || fallbackStats;

  if (loading && !displayStats) {
    return <LoadingSpinner message="Loading leaderboard statistics..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        message={error}
        onRetry={fetchLeaderboardStats}
      />
    );
  }

  const renderLeaderboard = (title, data, valueKey, valueLabel, icon) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return (
        <div className="missions-header">
          <div className="option-row">
            <h3 className="statistics-section-title">{title}</h3>
          </div>
          <div className="no-data-message">
            <p>No data available</p>
          </div>
        </div>
      );
    }

    return (
      <div className="missions-header">
        <div className="option-row">
          <h3 className="statistics-section-title">{title}</h3>
        </div>
        <div className="leaderboard-podium">
          <div className="podium-positions">
            {[data[1], data[0], data[2]].filter(Boolean).map((trainer, index) => {
              const positions = [1, 0, 2]; // 2nd, 1st, 3rd order
              const actualPosition = positions[index];
              const isFirst = actualPosition === 0;
              
              return (
                <div
                  key={trainer.id || index}
                  className={`podium-card ${isFirst ? 'first-place ' : ''}position-${actualPosition + 1}`}
                  style={{ order: index }}
                >
                  <div className={`podium-rank rank-${actualPosition + 1}`}>
                    #{actualPosition + 1}
                  </div>
                  <div className="podium-image">
                    {trainer.main_ref ? (
                      <img
                        src={trainer.main_ref}
                        alt={trainer.name || 'Trainer'}
                        className="trainer-avatar-image"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <i className={`fas ${icon} trainer-icon`} style={trainer.main_ref ? {display: 'none'} : {}}></i>
                  </div>
                  <div className="podium-info">
                    <h4 className="podium-name">
                      {trainer.name || 'Unknown Trainer'}
                    </h4>
                    <div className="podium-details">
                      <span className="podium-value">
                        {valueKey === 'monster_ref_percent'
                          ? `${trainer[valueKey] || 0}% (${trainer.monster_ref_count || 0}/${trainer.monster_count || 0})`
                          : `${valueLabel} ${trainer[valueKey] || 0}`
                        }
                      </span>
                      <span className="podium-player">
                        <i className="fas fa-user"></i> {trainer.player_display_name || 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {data.length > 3 && (
            <div className="remaining-positions">
              {data.slice(3, 5).map((trainer, index) => (
                <div className="remaining-card" key={trainer.id || (index + 3)}>
                  <div className="remaining-rank">#{index + 4}</div>
                  <div className="remaining-avatar">
                    {trainer.main_ref ? (
                      <img
                        src={trainer.main_ref}
                        alt={trainer.name || 'Trainer'}
                        className="trainer-avatar-image"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <i className={`fas ${icon} trainer-icon`} style={trainer.main_ref ? {display: 'none'} : {}}></i>
                  </div>
                  <div className="remaining-info">
                    <h4 className="remaining-name">
                      {trainer.name || 'Unknown Trainer'}
                    </h4>
                    <div className="remaining-details">
                      <span className="remaining-value">
                        {valueKey === 'monster_ref_percent'
                          ? `${trainer[valueKey] || 0}% (${trainer.monster_ref_count || 0}/${trainer.monster_count || 0})`
                          : `${valueLabel} ${trainer[valueKey] || 0}`
                        }
                      </span>
                      <span className="remaining-player">
                        <i className="fas fa-user"></i> {trainer.player_display_name || 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="leaderboard-stats">
      {/* Global Statistics Section */}
      {globalStats && (
        <section className="statistics-section">
          <h3 className="statistics-section-title">Global Statistics</h3>
          <div className="statistics-card">
            <div className="statistics-grid">
              <div className="statistic-item">
                <div className="statistic-icon">
                  <i className="fas fa-users"></i>
                </div>
                <div className="statistic-value">{globalStats.total_trainers || 0}</div>
                <div className="statistic-label">Total Trainers</div>
              </div>
              <div className="statistic-item">
                <div className="statistic-icon">
                  <i className="fas fa-dragon"></i>
                </div>
                <div className="statistic-value">{globalStats.total_monsters || 0}</div>
                <div className="statistic-label">Total Monsters</div>
              </div>
              <div className="statistic-item">
                <div className="statistic-icon">
                  <i className="fas fa-user-friends"></i>
                </div>
                <div className="statistic-value">{globalStats.total_players || 0}</div>
                <div className="statistic-label">Total Players</div>
              </div>
              <div className="statistic-item">
                <div className="statistic-icon">
                  <i className="fas fa-chart-line"></i>
                </div>
                <div className="statistic-value">{globalStats.average_monsters_per_trainer || 0}</div>
                <div className="statistic-label">Avg Monsters/Trainer</div>
              </div>
              <div className="statistic-item">
                <div className="statistic-icon">
                  <i className="fas fa-percentage"></i>
                </div>
                <div className="statistic-value">{globalStats.average_reference_percentage || 0}%</div>
                <div className="statistic-label">Avg Reference %</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {renderLeaderboard(
        'Top 5 Trainers by Level',
        displayStats.top_trainers_by_level,
        'level',
        'Level',
        'fa-star'
      )}

      {renderLeaderboard(
        'Top 5 Trainers by Monster Count',
        displayStats.top_trainers_by_monster_count,
        'monster_count',
        '',
        'fa-dragon'
      )}

      {renderLeaderboard(
        'Top 5 Trainers by Reference Percentage',
        displayStats.top_trainers_by_ref_percent,
        'monster_ref_percent',
        '',
        'fa-image'
      )}

      {renderLeaderboard(
        'Bottom 5 Trainers by Reference Percentage',
        displayStats.bottom_trainers_by_ref_percent,
        'monster_ref_percent',
        '',
        'fa-image'
      )}

      {renderLeaderboard(
        'Top 5 Trainers by Current Currency',
        displayStats.top_trainers_by_currency,
        'currency_amount',
        '',
        'fa-coins'
      )}

      {renderLeaderboard(
        'Top 5 Trainers by Total Earned Currency',
        displayStats.top_trainers_by_total_currency,
        'total_earned_currency',
        '',
        'fa-money-bill-wave'
      )}

      {renderLeaderboard(
        'Top 5 Trainers by Total Monster Levels',
        displayStats.top_trainers_by_total_level,
        'total_monster_levels',
        'Total Levels:',
        'fa-chart-line'
      )}

      {renderLeaderboard(
        'Top 5 Trainers by Level 100 Monsters',
        displayStats.top_trainers_by_level_100_count,
        'level_100_count',
        'Level 100 Monsters:',
        'fa-trophy'
      )}

      <div className="missions-header">
        <div className="option-row">
          <h3 className="statistics-section-title">Type Specialists</h3>
        </div>
        <div className="specialists-grid">
          {Object.entries(displayStats.type_specialists).map(([type, specialist]) => (
            <div className="art-calculator" key={type}>
              <div className="specialist-type">
                <span className={`badge type-${type.toLowerCase()}`}>{type}</span>
              </div>
              {specialist.main_ref && (
                <div className="npc-avatar">
                  <img 
                    src={specialist.main_ref} 
                    alt={specialist.trainer_name || 'Trainer'} 
                    className="specialist-avatar-image"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="specialist-info">
                <h4 className="specialist-name">
                  {specialist.trainer_name}
                </h4>
                <div className="stat-info">
                  <span className="specialist-count">{specialist.count} {type} monsters</span>
                  <span className="specialist-player">Player: {specialist.player_display_name}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="missions-header">
        <div className="option-row">
          <h3 className="statistics-section-title">Attribute Specialists</h3>
        </div>
        <div className="specialists-grid">
          {Object.entries(displayStats.attribute_specialists).map(([attribute, specialist]) => (
            <div className="art-calculator" key={attribute}>
              <div className="specialist-type">
                <span className={`badge attribute-${attribute.toLowerCase()}`}>{attribute}</span>
              </div>
              {specialist.main_ref && (
                <div className="npc-avatar">
                  <img 
                    src={specialist.main_ref} 
                    alt={specialist.trainer_name || 'Trainer'} 
                    className="specialist-avatar-image"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="specialist-info">
                <h4 className="specialist-name">
                  {specialist.trainer_name}
                </h4>
                <div className="stat-info">
                  <span className="specialist-count">{specialist.count} {attribute} monsters</span>
                  <span className="specialist-player">Player: {specialist.player_display_name}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="missions-header">
        <div className="option-row">
          <h3 className="statistics-section-title">Species Specialists</h3>
        </div>
        <div className="species-specialists">
          {displayStats.species_specialists.map((specialist, index) => (
            <div className="art-calculator" key={`${specialist.trainer_name}-${specialist.species}`}>
              <div className="species-specialist-rank">#{index + 1}</div>
              {specialist.main_ref && (
                <div className="species-specialist-avatar">
                  <img 
                    src={specialist.main_ref} 
                    alt={specialist.trainer_name || 'Trainer'} 
                    className="species-specialist-avatar-image"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="species-specialist-info">
                <h4 className="species-specialist-trainer">
                  {specialist.trainer_name}
                </h4>
                <div className="type-bar-container">
                  <span className="species-specialist-species">{specialist.count} {specialist.species}</span>
                  {specialist.faction && (
                    <span className="species-specialist-faction">Faction: {specialist.faction}</span>
                  )}
                  <span className="species-specialist-player">Player: {specialist.player_display_name}</span>
                </div>
              </div>
              <div className="stat-group">
                {specialist.sample_monsters.map((monster) => (
                  <div className="my-trainer-stats" key={monster.id}>
                    <img
                      src={monster.img_link || '/images/default_mon.png'}
                      alt={monster.name}
                      className="species-monster-image"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/images/default_mon.png';
                      }}
                    />
                    <span className="species-monster-name">{monster.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardStats;
