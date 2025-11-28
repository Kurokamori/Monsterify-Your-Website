import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import api from '../../services/api';
import trainerService from '../../services/trainerService';

const TrainerStats = () => {
  const { currentUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trainerStats, setTrainerStats] = useState(null);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [userTrainers, setUserTrainers] = useState([]);
  const [activityTimeframe, setActivityTimeframe] = useState('week');

  useEffect(() => {
    fetchTrainers();
  }, []);

  useEffect(() => {
    if (selectedTrainer) {
      fetchTrainerStats();
    }
  }, [selectedTrainer, activityTimeframe]);

  const fetchTrainers = async () => {
    try {
      setLoading(true);

      // Fetch user's trainers using the trainer service
      const response = await trainerService.getUserTrainers();

      // Check if the response has the expected structure
      if (response && response.success && response.data) {
        setUserTrainers(response.data || []);

        if (response.data && response.data.length > 0) {
          setSelectedTrainer(response.data[0].id);
        }
      } else if (response && response.trainers) {
        // Handle legacy API format
        setUserTrainers(response.trainers || []);

        if (response.trainers && response.trainers.length > 0) {
          setSelectedTrainer(response.trainers[0].id);
        }
      } else {
        setUserTrainers([]);
        setError('No trainers found for your account.');
      }

    } catch (err) {
      console.error('Error fetching trainers:', err);
      setError('Failed to load trainers. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrainerStats = async () => {
    try {
      setLoading(true);

      // Fetch trainer statistics
      const response = await api.get(`/statistics/trainer/${selectedTrainer}?timeframe=${activityTimeframe}`);

      // Check if the response has the expected structure
      if (response.data && response.data.success && response.data.data) {
        setTrainerStats(response.data.data);
      } else {
        setTrainerStats(null);
        setError('Invalid response format from the server.');
      }

    } catch (err) {
      console.error('Error fetching trainer statistics:', err);
      setError('Failed to load trainer statistics. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Fallback data for development
  const fallbackTrainers = [
    {
      id: 1,
      name: 'Ash Ketchum',
      avatar_url: 'https://via.placeholder.com/100/1e2532/d6a339?text=Ash'
    },
    {
      id: 2,
      name: 'Misty',
      avatar_url: 'https://via.placeholder.com/100/1e2532/d6a339?text=Misty'
    }
  ];

  const fallbackStats = {
    trainer: {
      id: 1,
      name: 'Ash Ketchum',
      level: 25,
      experience: 12500,
      next_level_exp: 15000,
      coins: 8750,
      join_date: '2023-01-15T00:00:00Z',
      avatar_url: 'https://via.placeholder.com/100/1e2532/d6a339?text=Ash'
    },
    monsters: {
      total: 42,
      unique_species: 28,
      highest_level: 35,
      types: {
        Fire: 8,
        Water: 10,
        Grass: 7,
        Electric: 5,
        Normal: 12
      }
    },
    activities: {
      battles_won: 87,
      battles_lost: 23,
      missions_completed: 35,
      bosses_defeated: 5,
      events_participated: 8,
      monsters_caught: 52,
      monsters_evolved: 15,
      items_collected: 124
    },
    activity_chart: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      data: [45, 60, 30, 75, 50, 90, 65]
    }
  };

  const displayTrainers = userTrainers.length > 0 ? userTrainers : fallbackTrainers;
  const displayStats = trainerStats || fallbackStats;

  if (loading && !displayStats) {
    return <LoadingSpinner message="Loading trainer statistics..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        message={error}
        onRetry={fetchTrainerStats}
      />
    );
  }

  return (
    <div className="trainer-stats">
      <div className="trainer-selector">
        <label htmlFor="trainer-select">Select Trainer:</label>
        <select
          id="trainer-select"
          value={selectedTrainer || ''}
          onChange={(e) => setSelectedTrainer(e.target.value)}
          className="trainer-select"
        >
          {displayTrainers.map((trainer) => (
            <option key={trainer.id} value={trainer.id}>
              {trainer.name}
            </option>
          ))}
        </select>
      </div>

      <div className="trainer-profile statistics-card">
        <div className="trainer-profile-header">
          <div className="trainer-avatar">
            <img
              src={displayStats.trainer.avatar_url}
              alt={displayStats.trainer.name}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/images/default_avatar.png';
              }}
            />
          </div>
          <div className="trainer-info">
            <h2 className="trainer-name">{displayStats.trainer.name}</h2>
            <div className="trainer-level">
              <span className="level-badge">Lv. {displayStats.trainer.level}</span>
              <span className="join-date">Joined {new Date(displayStats.trainer.join_date).toLocaleDateString()}</span>
            </div>
            <div className="trainer-progress">
              <div className="progress-container">
                <div className="progress-header">
                  <span className="progress-label">Experience</span>
                  <span className="progress-value">{displayStats.trainer.experience} / {displayStats.trainer.next_level_exp}</span>
                </div>
                <div className="progress-bar-container">
                  <div
                    className="progress-bar"
                    style={{ width: `${(displayStats.trainer.experience / displayStats.trainer.next_level_exp) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="trainer-currency">
              <span className="currency-item">
                <i className="fas fa-coins"></i> {displayStats.trainer.coins} Coins
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="statistics-section">
        <div className="statistics-section-header">
          <h3 className="statistics-section-title">Monster Collection</h3>
        </div>
        <div className="statistics-grid">
          <div className="statistic-item">
            <div className="statistic-icon">
              <i className="fas fa-dragon"></i>
            </div>
            <div className="statistic-value">{displayStats.monsters.total}</div>
            <div className="statistic-label">Total Monsters</div>
          </div>
          <div className="statistic-item">
            <div className="statistic-icon">
              <i className="fas fa-dna"></i>
            </div>
            <div className="statistic-value">{displayStats.monsters.unique_species}</div>
            <div className="statistic-label">Unique Species</div>
          </div>
          <div className="statistic-item">
            <div className="statistic-icon">
              <i className="fas fa-bolt"></i>
            </div>
            <div className="statistic-value">{displayStats.monsters.highest_level}</div>
            <div className="statistic-label">Highest Level</div>
          </div>
        </div>
        <div className="monster-types-chart statistics-card">
          <h4 className="chart-title">Monster Types Distribution</h4>
          <div className="types-distribution">
            {Object.entries(displayStats.monsters.types).map(([type, count]) => (
              <div className="type-distribution-item" key={type}>
                <div className="type-distribution-header">
                  <span className={`type-badge type-${type.toLowerCase()}`}>{type}</span>
                  <span className="type-count">{count}</span>
                </div>
                <div className="progress-bar-container">
                  <div
                    className={`progress-bar type-${type.toLowerCase()}-bg`}
                    style={{ width: `${(count / displayStats.monsters.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="statistics-section">
        <div className="statistics-section-header">
          <h3 className="statistics-section-title">Activities</h3>
        </div>
        <div className="statistics-grid">
          <div className="statistic-item">
            <div className="statistic-icon">
              <i className="fas fa-fist-raised"></i>
            </div>
            <div className="statistic-value">{displayStats.activities.battles_won}</div>
            <div className="statistic-label">Battles Won</div>
          </div>
          <div className="statistic-item">
            <div className="statistic-icon">
              <i className="fas fa-scroll"></i>
            </div>
            <div className="statistic-value">{displayStats.activities.missions_completed}</div>
            <div className="statistic-label">Missions Completed</div>
          </div>
          <div className="statistic-item">
            <div className="statistic-icon">
              <i className="fas fa-dragon"></i>
            </div>
            <div className="statistic-value">{displayStats.activities.bosses_defeated}</div>
            <div className="statistic-label">Bosses Defeated</div>
          </div>
          <div className="statistic-item">
            <div className="statistic-icon">
              <i className="fas fa-calendar-alt"></i>
            </div>
            <div className="statistic-value">{displayStats.activities.events_participated}</div>
            <div className="statistic-label">Events Participated</div>
          </div>
          <div className="statistic-item">
            <div className="statistic-icon">
              <i className="fas fa-bug"></i>
            </div>
            <div className="statistic-value">{displayStats.activities.monsters_caught}</div>
            <div className="statistic-label">Monsters Caught</div>
          </div>
          <div className="statistic-item">
            <div className="statistic-icon">
              <i className="fas fa-dna"></i>
            </div>
            <div className="statistic-value">{displayStats.activities.monsters_evolved}</div>
            <div className="statistic-label">Monsters Evolved</div>
          </div>
        </div>
      </div>

      <div className="statistics-section">
        <div className="statistics-section-header">
          <h3 className="statistics-section-title">Activity Over Time</h3>
          <div className="timeframe-selector">
            <button
              className={`timeframe-button ${activityTimeframe === 'week' ? 'active' : ''}`}
              onClick={() => setActivityTimeframe('week')}
            >
              Week
            </button>
            <button
              className={`timeframe-button ${activityTimeframe === 'month' ? 'active' : ''}`}
              onClick={() => setActivityTimeframe('month')}
            >
              Month
            </button>
            <button
              className={`timeframe-button ${activityTimeframe === 'year' ? 'active' : ''}`}
              onClick={() => setActivityTimeframe('year')}
            >
              Year
            </button>
          </div>
        </div>
        <div className="chart-container">
          <div className="chart-placeholder">
            <div className="chart-bars">
              {displayStats.activity_chart.data.map((value, index) => (
                <div className="chart-bar-container" key={index}>
                  <div
                    className="chart-bar"
                    style={{ height: `${(value / Math.max(...displayStats.activity_chart.data)) * 100}%` }}
                  ></div>
                  <div className="chart-label">{displayStats.activity_chart.labels[index]}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainerStats;
