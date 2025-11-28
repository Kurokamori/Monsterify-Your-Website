import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import api from '../../services/api';

const TrainerComparisonStats = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comparisonStats, setComparisonStats] = useState(null);

  useEffect(() => {
    fetchComparisonStats();
  }, []);

  const fetchComparisonStats = async () => {
    try {
      setLoading(true);
      
      // Fetch trainer comparison statistics
      const response = await api.get('/statistics/trainer-comparison');
      
      // Check if the response has the expected structure
      if (response.data && response.data.success && response.data.data) {
        setComparisonStats(response.data.data);
      } else {
        setComparisonStats(null);
        setError('Invalid response format from the server.');
      }
      
    } catch (err) {
      console.error('Error fetching trainer comparison statistics:', err);
      setError('Failed to load trainer comparison statistics. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Fallback data for development
  const fallbackStats = {
    global_stats: {
      total_trainers: 15,
      total_monsters: 342,
      total_players: 8,
      average_monsters_per_trainer: 22.8,
      average_reference_percentage: 68.5
    },
    top_trainers: {
      by_level: [
        { id: 1, name: 'Ash Ketchum', level: 35, player_display_name: 'AshTrainer' },
        { id: 2, name: 'Misty Waters', level: 32, player_display_name: 'WaterMaster' },
        { id: 3, name: 'Brock Stone', level: 30, player_display_name: 'RockSolid' },
        { id: 4, name: 'Gary Oak', level: 28, player_display_name: 'GaryOak' },
        { id: 5, name: 'Lance Dragon', level: 27, player_display_name: 'DragonMaster' }
      ],
      by_monsters: [
        { id: 1, name: 'Ash Ketchum', monster_count: 45, player_display_name: 'AshTrainer' },
        { id: 4, name: 'Gary Oak', monster_count: 38, player_display_name: 'GaryOak' },
        { id: 2, name: 'Misty Waters', monster_count: 35, player_display_name: 'WaterMaster' },
        { id: 3, name: 'Brock Stone', monster_count: 32, player_display_name: 'RockSolid' },
        { id: 5, name: 'Lance Dragon', monster_count: 28, player_display_name: 'DragonMaster' }
      ]
    }
  };

  const displayStats = comparisonStats || fallbackStats;

  if (loading && !displayStats) {
    return <LoadingSpinner message="Loading trainer comparison statistics..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        message={error}
        onRetry={fetchComparisonStats}
      />
    );
  }

  return (
    <div className="monster-stats">
      <div className="statistics-section">
        <div className="statistics-section-header">
          <h3 className="statistics-section-title">Global Statistics</h3>
        </div>
        <div className="statistics-grid">
          <div className="statistic-item">
            <div className="statistic-icon">
              <i className="fas fa-users"></i>
            </div>
            <div className="statistic-value">{displayStats.global_stats?.total_trainers || 0}</div>
            <div className="statistic-label">Total Trainers</div>
          </div>
          <div className="statistic-item">
            <div className="statistic-icon">
              <i className="fas fa-dragon"></i>
            </div>
            <div className="statistic-value">{displayStats.global_stats?.total_monsters || 0}</div>
            <div className="statistic-label">Total Monsters</div>
          </div>
          <div className="statistic-item">
            <div className="statistic-icon">
              <i className="fas fa-user-friends"></i>
            </div>
            <div className="statistic-value">{displayStats.global_stats?.total_players || 0}</div>
            <div className="statistic-label">Total Players</div>
          </div>
          <div className="statistic-item">
            <div className="statistic-icon">
              <i className="fas fa-chart-line"></i>
            </div>
            <div className="statistic-value">{displayStats.global_stats?.average_monsters_per_trainer || 0}</div>
            <div className="statistic-label">Avg Monsters/Trainer</div>
          </div>
          <div className="statistic-item">
            <div className="statistic-icon">
              <i className="fas fa-percentage"></i>
            </div>
            <div className="statistic-value">{displayStats.global_stats?.average_reference_percentage || 0}%</div>
            <div className="statistic-label">Avg Reference %</div>
          </div>
        </div>
      </div>

      <div className="statistics-section">
        <div className="statistics-section-header">
          <h3 className="statistics-section-title">Top Trainers by Level</h3>
        </div>
        <div className="leaderboard-podium">
          {displayStats.top_trainers?.by_level?.length > 0 ? (
            <>
              <div className="podium-positions">
                {[displayStats.top_trainers.by_level[1], displayStats.top_trainers.by_level[0], displayStats.top_trainers.by_level[2]].filter(Boolean).map((trainer, index) => {
                  const positions = [1, 0, 2]; // 2nd, 1st, 3rd order
                  const actualPosition = positions[index];
                  const isFirst = actualPosition === 0;
                  
                  return (
                    <div 
                      key={trainer.id || index} 
                      className={`podium-card ${isFirst ? 'first-place' : ''} position-${actualPosition + 1}`}
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
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <i className="fas fa-user-circle trainer-icon" style={trainer.main_ref ? {display: 'none'} : {}}></i>
                      </div>
                      <div className="podium-info">
                        <h4 className="podium-name">
                          {trainer.name || 'Unknown Trainer'}
                          {trainer.title && <span className="trainer-title"> - {trainer.title}</span>}
                        </h4>
                        <div className="podium-details">
                          <span className="podium-level">Level {trainer.level || 0}</span>
                          <span className="trainer-player">Player: {trainer.player_display_name || 'Unknown Player'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {displayStats.top_trainers.by_level.length > 3 && (
                <div className="remaining-positions">
                  {displayStats.top_trainers.by_level.slice(3, 5).map((trainer, index) => (
                    <div className="remaining-card" key={trainer.id || (index + 3)}>
                      <div className="remaining-rank">#{index + 4}</div>
                      <div className="remaining-image">
                        {trainer.main_ref ? (
                          <img 
                            src={trainer.main_ref} 
                            alt={trainer.name || 'Trainer'} 
                            className="trainer-avatar-image"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <i className="fas fa-user-circle trainer-icon" style={trainer.main_ref ? {display: 'none'} : {}}></i>
                      </div>
                      <div className="remaining-info">
                        <h4 className="remaining-name">
                          {trainer.name || 'Unknown Trainer'}
                          {trainer.title && <span className="trainer-title"> - {trainer.title}</span>}
                        </h4>
                        <div className="remaining-details">
                          <span className="remaining-level">Level {trainer.level || 0}</span>
                          <span className="trainer-player">Player: {trainer.player_display_name || 'Unknown Player'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="no-data-message">
              <p>No trainer data available</p>
            </div>
          )}
        </div>
      </div>

      <div className="statistics-section">
        <div className="statistics-section-header">
          <h3 className="statistics-section-title">Top Trainers by Monster Count</h3>
        </div>
        <div className="leaderboard-podium">
          {displayStats.top_trainers?.by_monsters?.length > 0 ? (
            <>
              <div className="podium-positions">
                {[displayStats.top_trainers.by_monsters[1], displayStats.top_trainers.by_monsters[0], displayStats.top_trainers.by_monsters[2]].filter(Boolean).map((trainer, index) => {
                  const positions = [1, 0, 2]; // 2nd, 1st, 3rd order
                  const actualPosition = positions[index];
                  const isFirst = actualPosition === 0;
                  
                  return (
                    <div 
                      key={trainer.id || index} 
                      className={`podium-card ${isFirst ? 'first-place' : ''} position-${actualPosition + 1}`}
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
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <i className="fas fa-dragon trainer-icon" style={trainer.main_ref ? {display: 'none'} : {}}></i>
                      </div>
                      <div className="podium-info">
                        <h4 className="podium-name">
                          {trainer.name || 'Unknown Trainer'}
                          {trainer.title && <span className="trainer-title"> - {trainer.title}</span>}
                        </h4>
                        <div className="podium-details">
                          <span className="podium-level">{trainer.monster_count || 0} Monsters</span>
                          <span className="trainer-player">Player: {trainer.player_display_name || 'Unknown Player'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {displayStats.top_trainers.by_monsters.length > 3 && (
                <div className="remaining-positions">
                  {displayStats.top_trainers.by_monsters.slice(3, 5).map((trainer, index) => (
                    <div className="remaining-card" key={trainer.id || (index + 3)}>
                      <div className="remaining-rank">#{index + 4}</div>
                      <div className="remaining-image">
                        {trainer.main_ref ? (
                          <img 
                            src={trainer.main_ref} 
                            alt={trainer.name || 'Trainer'} 
                            className="trainer-avatar-image"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <i className="fas fa-dragon trainer-icon" style={trainer.main_ref ? {display: 'none'} : {}}></i>
                      </div>
                      <div className="remaining-info">
                        <h4 className="remaining-name">
                          {trainer.name || 'Unknown Trainer'}
                          {trainer.title && <span className="trainer-title"> - {trainer.title}</span>}
                        </h4>
                        <div className="remaining-details">
                          <span className="remaining-level">{trainer.monster_count || 0} Monsters</span>
                          <span className="trainer-player">Player: {trainer.player_display_name || 'Unknown Player'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="no-data-message">
              <p>No trainer data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrainerComparisonStats;
