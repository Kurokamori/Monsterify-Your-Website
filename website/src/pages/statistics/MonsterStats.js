import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import api from '../../services/api';

const MonsterStats = () => {
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

      const response = await api.get(`/statistics/monster?type=${selectedType}&sort=${sortBy}&order=${sortOrder}`);

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
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  if (loading && !monsterStats) {
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

  if (!monsterStats) {
    return <ErrorMessage message="No monster statistics available." />;
  }

  const allTypes = ['all', ...Object.keys(monsterStats.overview?.type_distribution || {})];

  return (
    <div className="monster-stats-page">
      {/* Overview Section */}
      <section className="stats-section">
        <h3 className="stats-section-title">
          <i className="fas fa-chart-pie"></i>
          Monster Collection Overview
        </h3>
        <div className="stats-overview-grid">
          <div className="stats-overview-card">
            <div className="stats-overview-icon">
              <i className="fas fa-dragon"></i>
            </div>
            <div className="stats-overview-content">
              <span className="stats-overview-value">{monsterStats.overview?.total_monsters || 0}</span>
              <span className="stats-overview-label">Total Monsters</span>
            </div>
          </div>
          <div className="stats-overview-card">
            <div className="stats-overview-icon">
              <i className="fas fa-dna"></i>
            </div>
            <div className="stats-overview-content">
              <span className="stats-overview-value">{monsterStats.overview?.unique_species || 0}</span>
              <span className="stats-overview-label">Unique Species</span>
            </div>
          </div>
          <div className="stats-overview-card">
            <div className="stats-overview-icon">
              <i className="fas fa-chart-line"></i>
            </div>
            <div className="stats-overview-content">
              <span className="stats-overview-value">{monsterStats.overview?.average_level || 0}</span>
              <span className="stats-overview-label">Average Level</span>
            </div>
          </div>
          <div className="stats-overview-card">
            <div className="stats-overview-icon">
              <i className="fas fa-bolt"></i>
            </div>
            <div className="stats-overview-content">
              <span className="stats-overview-value">{monsterStats.overview?.highest_level || 0}</span>
              <span className="stats-overview-label">Highest Level</span>
            </div>
          </div>
        </div>
      </section>

      {/* Type Distribution Section */}
      {monsterStats.overview?.type_distribution && Object.keys(monsterStats.overview.type_distribution).length > 0 && (
        <section className="stats-section">
          <h3 className="stats-section-title">
            <i className="fas fa-th-large"></i>
            Type Distribution
          </h3>
          <div className="stats-card">
            <div className="type-distribution-grid">
              {Object.entries(monsterStats.overview.type_distribution).map(([type, count]) => (
                <div className="type-distribution-card" key={type}>
                  <div className="type-distribution-info">
                    <span className={`badge type-${type.toLowerCase()}`}>{type}</span>
                    <span className="type-distribution-count">{count}</span>
                  </div>
                  <div className="type-distribution-bar">
                    <div
                      className={`type-distribution-fill type-${type.toLowerCase()}-bg`}
                      style={{ width: `${(count / (monsterStats.overview.total_monsters || 1)) * 100}%` }}
                    ></div>
                  </div>
                  <span className="type-distribution-percent">
                    {Math.round((count / (monsterStats.overview.total_monsters || 1)) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Top Monsters Section */}
      {monsterStats.top_monsters && monsterStats.top_monsters.length > 0 && (
        <section className="stats-section">
          <h3 className="stats-section-title">
            <i className="fas fa-trophy"></i>
            Top Monsters
          </h3>
          <div className="top-monsters-grid">
            {monsterStats.top_monsters.map((monster, index) => (
              <div className={`top-monster-card rank-${index + 1}`} key={monster.id}>
                <div className="top-monster-rank-badge">#{index + 1}</div>
                <div className="top-monster-avatar">
                  <img
                    src={monster.image_path}
                    alt={monster.name}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/default_mon.png';
                    }}
                  />
                </div>
                <div className="top-monster-details">
                  <h4 className="top-monster-name">{monster.name}</h4>
                  <div className="top-monster-meta">
                    <span className="level-badge">Lv. {monster.level}</span>
                    <div className="top-monster-types">
                      {monster.types?.map((type, typeIndex) => (
                        <span className={`badge sm type-${type.toLowerCase()}`} key={typeIndex}>
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                  {monster.stats && (
                    <div className="monster-stats-bars">
                      <div className="monster-stat-row">
                        <span className="monster-stat-label">HP</span>
                        <div className="monster-stat-bar">
                          <div className="monster-stat-fill hp" style={{ width: `${(monster.stats.hp / 150) * 100}%` }}></div>
                        </div>
                        <span className="monster-stat-value">{monster.stats.hp}</span>
                      </div>
                      <div className="monster-stat-row">
                        <span className="monster-stat-label">ATK</span>
                        <div className="monster-stat-bar">
                          <div className="monster-stat-fill attack" style={{ width: `${(monster.stats.attack / 150) * 100}%` }}></div>
                        </div>
                        <span className="monster-stat-value">{monster.stats.attack}</span>
                      </div>
                      <div className="monster-stat-row">
                        <span className="monster-stat-label">DEF</span>
                        <div className="monster-stat-bar">
                          <div className="monster-stat-fill defense" style={{ width: `${(monster.stats.defense / 150) * 100}%` }}></div>
                        </div>
                        <span className="monster-stat-value">{monster.stats.defense}</span>
                      </div>
                      <div className="monster-stat-row">
                        <span className="monster-stat-label">SP.A</span>
                        <div className="monster-stat-bar">
                          <div className="monster-stat-fill special-attack" style={{ width: `${(monster.stats.sp_attack / 150) * 100}%` }}></div>
                        </div>
                        <span className="monster-stat-value">{monster.stats.sp_attack}</span>
                      </div>
                      <div className="monster-stat-row">
                        <span className="monster-stat-label">SP.D</span>
                        <div className="monster-stat-bar">
                          <div className="monster-stat-fill special-defense" style={{ width: `${(monster.stats.sp_defense / 150) * 100}%` }}></div>
                        </div>
                        <span className="monster-stat-value">{monster.stats.sp_defense}</span>
                      </div>
                      <div className="monster-stat-row">
                        <span className="monster-stat-label">SPD</span>
                        <div className="monster-stat-bar">
                          <div className="monster-stat-fill speed" style={{ width: `${(monster.stats.speed / 150) * 100}%` }}></div>
                        </div>
                        <span className="monster-stat-value">{monster.stats.speed}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default MonsterStats;
