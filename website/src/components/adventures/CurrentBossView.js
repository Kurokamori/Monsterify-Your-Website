import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import BossService from '../../services/bossService';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

const CurrentBossView = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bossData, setBossData] = useState(null);

  useEffect(() => {
    fetchBossData();
  }, []);

  const fetchBossData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await BossService.getCurrentBossWithLeaderboard(10);
      
      if (response.success) {
        setBossData(response.data);
      } else {
        setError(response.message || 'Failed to load boss data');
      }
    } catch (err) {
      console.error('Error fetching boss data:', err);
      setError('Failed to load boss data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  };

  const getHealthBarColor = (percentage) => {
    if (percentage > 60) return '#4CAF50'; // Green
    if (percentage > 30) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  if (loading) {
    return (
      <div className="current-boss-view">
        <LoadingSpinner message="Loading current boss..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="current-boss-view">
        <ErrorMessage 
          message={error} 
          onRetry={fetchBossData}
        />
      </div>
    );
  }

  if (!bossData || !bossData.boss) {
    return (
      <div className="current-boss-view">
        <div className="no-boss-message">
          <h3>No Active Boss</h3>
          <p>There is currently no active boss battle. Check back later!</p>
        </div>
      </div>
    );
  }

  const { boss, leaderboard } = bossData;

  return (
    <div className="current-boss-view">
      <div className="boss-header">
        <h2>Current Boss Battle</h2>
        <Link to="/boss" className="button primary">
          View Full Details
        </Link>
      </div>

      <div className="boss-content">
        {/* Boss Information Card */}
        <div className="boss-card">
          <div className="boss-image-container">
            {boss.image_url ? (
              <img 
                src={boss.image_url} 
                alt={boss.name}
                className="boss-image"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/images/default_boss.png';
                }}
              />
            ) : (
              <div className="boss-image-placeholder">
                <i className="fas fa-dragon"></i>
              </div>
            )}
          </div>
          
          <div className="boss-info">
            <h3 className="boss-name">{boss.name}</h3>
            
            {boss.description && (
              <p className="boss-description">{boss.description}</p>
            )}
            
            <div className="boss-stats">
              <div className="boss-stat">
                <span className="stat-label">Status:</span>
                <span className={`stat-value status-${boss.status}`}>
                  {boss.status.charAt(0).toUpperCase() + boss.status.slice(1)}
                </span>
              </div>
              
              <div className="boss-stat">
                <span className="stat-label">Month:</span>
                <span className="stat-value">{boss.month}/{boss.year}</span>
              </div>
              
              {boss.start_date && (
                <div className="boss-stat">
                  <span className="stat-label">Started:</span>
                  <span className="stat-value">{formatDate(boss.start_date)}</span>
                </div>
              )}
            </div>
            
            {/* Health Bar */}
            <div className="boss-health">
              <div className="health-label">
                <span>Health</span>
                <span>{boss.current_hp.toLocaleString()} / {boss.total_hp.toLocaleString()}</span>
              </div>
              <div className="health-bar-container">
                <div 
                  className="health-bar"
                  style={{
                    width: `${boss.healthPercentage}%`,
                    backgroundColor: getHealthBarColor(boss.healthPercentage)
                  }}
                ></div>
              </div>
              <div className="health-percentage">{boss.healthPercentage}%</div>
            </div>
          </div>
        </div>

        {/* Mini Leaderboard */}
        <div className="mini-leaderboard">
          <h4>Top Damage Dealers</h4>
          {leaderboard && leaderboard.length > 0 ? (
            <div className="leaderboard-list">
              {leaderboard.slice(0, 5).map((entry, index) => (
                <div key={entry.discord_user_id || index} className="leaderboard-entry">
                  <span className="rank">#{index + 1}</span>
                  <span className="trainer-name">
                    {entry.trainer_name || entry.username || 'Unknown'}
                  </span>
                  <span className="damage">{entry.total_damage.toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-leaderboard">
              <p>No damage dealt yet. Be the first to submit artwork!</p>
            </div>
          )}
          
          <Link to="/boss" className="view-full-leaderboard">
            View Full Leaderboard
          </Link>
        </div>
      </div>

      <div className="boss-actions">
        <Link to="/submissions/art" className="button primary">
          <i className="fas fa-palette"></i> Submit Art to Deal Damage
        </Link>
        <Link to="/boss" className="button secondary">
          <i className="fas fa-info-circle"></i> View Full Boss Details
        </Link>
      </div>
    </div>
  );
};

export default CurrentBossView;
