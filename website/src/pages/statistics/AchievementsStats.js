import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

const AchievementsStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchAchievementStats = async () => {
      try {
        setLoading(true);
        const response = await api.get('/statistics/achievement-stats');
        
        if (response.data.success) {
          setStats(response.data.data);
        } else {
          setError(response.data.message || 'Failed to load achievement statistics');
        }
      } catch (err) {
        console.error('Error fetching achievement statistics:', err);
        setError('Failed to load achievement statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchAchievementStats();
  }, []);

  const formatTrainerName = (trainer) => {
    return trainer.trainer_name;
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!stats) return <ErrorMessage message="No achievement statistics available" />;

  return (
    <div className="achievements-stats">
      <div className="missions-header">
        <div className="option-row">
          <h3 className="statistics-section-title">Achievement Statistics</h3>
          <p className="statistics-section-description">
            Track achievement progress across all trainers
          </p>
        </div>

        <div className="achievement-tabs">
          <button 
            className={`button tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <i className="fas fa-chart-pie"></i> Overview
          </button>
          <button 
            className={`button tab ${activeTab === 'leaderboards' ? 'active' : ''}`}
            onClick={() => setActiveTab('leaderboards')}
          >
            <i className="fas fa-trophy"></i> Leaderboards
          </button>
          <button 
            className={`button tab ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            <i className="fas fa-tags"></i> Categories
          </button>
          <button 
            className={`button tab ${activeTab === 'subtypes' ? 'active' : ''}`}
            onClick={() => setActiveTab('subtypes')}
          >
            <i className="fas fa-list"></i> Subtypes
          </button>
        </div>

        {activeTab === 'overview' && (
          <div className="achievement-overview">
            <div className="achievement-overview-cards">
              <div className="statistics-card">
                <div className="stat-icon">
                  <i className="fas fa-trophy"></i>
                </div>
                <div className="stat-content">
                  <h4>Total Achievements</h4>
                  <p className="stat-number">{stats.overview.total_achievements_available}</p>
                  <span className="stat-subtitle">Available</span>
                </div>
              </div>
              
              <div className="statistics-card">
                <div className="stat-icon">
                  <i className="fas fa-check-circle"></i>
                </div>
                <div className="stat-content">
                  <h4>Total Claimed</h4>
                  <p className="stat-number">{stats.overview.total_achievements_claimed}</p>
                  <span className="stat-subtitle">Achievements</span>
                </div>
              </div>
              
              <div className="statistics-card">
                <div className="stat-icon">
                  <i className="fas fa-users"></i>
                </div>
                <div className="stat-content">
                  <h4>Active Achievers</h4>
                  <p className="stat-number">{stats.overview.trainers_with_achievements}</p>
                  <span className="stat-subtitle">out of {stats.overview.total_trainers}</span>
                </div>
              </div>
              
              <div className="statistics-card">
                <div className="stat-icon">
                  <i className="fas fa-chart-line"></i>
                </div>
                <div className="stat-content">
                  <h4>Average per Trainer</h4>
                  <p className="stat-number">{stats.overview.average_achievements_per_trainer}</p>
                  <span className="stat-subtitle">Achievements</span>
                </div>
              </div>
            </div>

            <div className="category-breakdown">
              <h4>Achievement Categories</h4>
              <div className="category-grid">
                <div className="category-item">
                  <span className="task-name">Type Achievements</span>
                  <span className="category-count">{stats.category_breakdown.type}</span>
                </div>
                <div className="category-item">
                  <span className="task-name">Attribute Achievements</span>
                  <span className="category-count">{stats.category_breakdown.attribute}</span>
                </div>
                <div className="category-item">
                  <span className="task-name">Level 100 Achievements</span>
                  <span className="category-count">{stats.category_breakdown.level100}</span>
                </div>
                <div className="category-item">
                  <span className="task-name">Trainer Level Achievements</span>
                  <span className="category-count">{stats.category_breakdown.trainer_level}</span>
                </div>
                <div className="category-item">
                  <span className="task-name">Special Achievements</span>
                  <span className="category-count">{stats.category_breakdown.special}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'leaderboards' && (
          <div className="achievement-leaderboards">
            <div className="missions-header">
              <h4><i className="fas fa-crown"></i> Most Achievements</h4>
              <div className="leaderboard-podium">
                {stats.most_achievements.slice(0, 3).length > 0 && (
                  <div className="podium-positions">
                    {stats.most_achievements.slice(0, 3).map((trainer, index) => {
                      const positions = [1, 0, 2]; // 2nd, 1st, 3rd order
                      const actualPosition = positions[index];
                      const isFirst = actualPosition === 0;

                      return (
                        <div
                          key={trainer.trainer_id}
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
                                alt={trainer.trainer_name}
                                className="trainer-avatar-image"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <i className="fas fa-trophy trainer-icon" style={trainer.main_ref ? {display: 'none'} : {}}></i>
                          </div>
                          <div className="podium-info">
                            <h4 className="podium-name">{formatTrainerName(trainer)}</h4>
                            <div className="podium-details">
                              <span className="podium-value">{trainer.count} achievements</span>
                              <span className="podium-player">
                                <i className="fas fa-user"></i> {trainer.player_display_name}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {stats.most_achievements.length > 3 && (
                  <div className="remaining-positions">
                    {stats.most_achievements.slice(3, 10).map((trainer, index) => (
                      <div key={trainer.trainer_id} className="remaining-card">
                        <div className="remaining-rank">#{index + 4}</div>
                        <div className="remaining-avatar">
                          {trainer.main_ref ? (
                            <img
                              src={trainer.main_ref}
                              alt={trainer.trainer_name}
                              className="trainer-avatar-image"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <i className="fas fa-trophy trainer-icon" style={trainer.main_ref ? {display: 'none'} : {}}></i>
                        </div>
                        <div className="remaining-info">
                          <h4 className="remaining-name">{formatTrainerName(trainer)}</h4>
                          <div className="remaining-details">
                            <span className="remaining-value">{trainer.count} achievements</span>
                            <span className="remaining-player">
                              <i className="fas fa-user"></i> {trainer.player_display_name}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="missions-header">
              <h4><i className="fas fa-seedling"></i> Least Achievements (Room to Grow!)</h4>
              <div className="achievement-category-list">
                {stats.least_achievements.slice(0, 10).map((trainer, index) => (
                  <div key={trainer.trainer_id} className="stats-leaderboard-row">
                    <div className="stats-rank">#{index + 1}</div>
                    <div className="stats-trainer-info">
                      {trainer.main_ref && (
                        <img src={trainer.main_ref} alt={trainer.trainer_name} className="stats-trainer-avatar" />
                      )}
                      <div className="stats-trainer-details">
                        <span className="stats-trainer-name">{formatTrainerName(trainer)}</span>
                        <span className="stats-player-name">Player: {trainer.player_display_name}</span>
                      </div>
                    </div>
                    <div className="stats-value">{trainer.count} achievements</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="achievement-categories">
            {Object.entries(stats.top_by_category).map(([category, trainers]) => (
              <div key={category} className="achievement-category-section">
                <h4>
                  <i className="fas fa-medal"></i>
                  Top {category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')} Achievers
                </h4>
                <div className="achievement-category-list">
                  {trainers.slice(0, 5).map((trainer, index) => (
                    <div key={trainer.trainer_id} className="stats-leaderboard-row">
                      <div className="stats-rank">#{index + 1}</div>
                      <div className="stats-trainer-info">
                        {trainer.main_ref && (
                          <img src={trainer.main_ref} alt={trainer.trainer_name} className="stats-trainer-avatar" />
                        )}
                        <div className="stats-trainer-details">
                          <span className="stats-trainer-name">{formatTrainerName(trainer)}</span>
                          <span className="stats-player-name">Player: {trainer.player_display_name}</span>
                        </div>
                      </div>
                      <div className="stats-value">{trainer.count} achievements</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'subtypes' && (
          <div className="achievement-subtypes">
            <div className="subtype-section">
              <h4><i className="fas fa-dragon"></i> Top Type Specialists</h4>
              <div className="subtype-grid">
                {Object.entries(stats.top_by_subtype.types).map(([type, trainers]) => (
                  <div key={type} className={`subtype-card sub-type-${type.toLowerCase()}`}>
                    <h5>{type} Type</h5>
                    <div className="mega-types">
                      {trainers.slice(0, 3).map((trainer, index) => (
                        <div key={trainer.trainer_id} className="subtype-trainer">
                          <span className="rank">#{index + 1}</span>
                          <span className="trainer-name">{trainer.trainer_name}</span>
                          <span className="count">{trainer.count}</span>
                        </div>
                      ))}
                      {trainers.length === 0 && (
                        <div className="no-data">No achievements yet</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="subtype-section">
              <h4><i className="fas fa-shield-alt"></i> Top Attribute Specialists</h4>
              <div className="subtype-grid">
                {Object.entries(stats.top_by_subtype.attributes).map(([attribute, trainers]) => (
                  <div key={attribute} className={`subtype-card sub-attribute-${attribute.toLowerCase()}`}>
                    <h5>{attribute} Attribute</h5>
                    <div className="mega-types">
                      {trainers.slice(0, 3).map((trainer, index) => (
                        <div key={trainer.trainer_id} className="subtype-trainer">
                          <span className="rank">#{index + 1}</span>
                          <span className="trainer-name">{trainer.trainer_name}</span>
                          <span className="count">{trainer.count}</span>
                        </div>
                      ))}
                      {trainers.length === 0 && (
                        <div className="no-data">No achievements yet</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AchievementsStats;
