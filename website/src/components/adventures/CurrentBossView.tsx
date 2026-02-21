import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import api from '../../services/api';
import {
  BossData,
  formatDate,
  getHealthBarColor,
  capitalize
} from './types';

export const CurrentBossView = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bossData, setBossData] = useState<BossData | null>(null);

  useEffect(() => {
    fetchBossData();
  }, []);

  const fetchBossData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/boss/current', {
        params: { leaderboardLimit: 10 }
      });

      if (response.data.success) {
        setBossData(response.data.data);
      } else {
        setError(response.data.message || 'Failed to load boss data');
      }
    } catch (err) {
      console.error('Error fetching boss data:', err);
      setError('Failed to load boss data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="current-boss">
        <LoadingSpinner message="Loading current boss..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="current-boss">
        <ErrorMessage message={error} onRetry={fetchBossData} />
      </div>
    );
  }

  if (!bossData || !bossData.boss) {
    return (
      <div className="current-boss">
        <div className="current-boss__no-boss">
          <h3>No Active Boss</h3>
          <p>There is currently no active boss battle. Check back later!</p>
        </div>
      </div>
    );
  }

  const { boss, leaderboard } = bossData;

  return (
    <div className="current-boss">
      <div className="current-boss__header">
        <h2>Current Boss Battle</h2>
        <Link to="/boss" className="button primary">
          View Full Details
        </Link>
      </div>

      <div className="current-boss__content">
        {/* Boss Information Card */}
        <div className="boss-card">
          <div className="boss-card__image-container">
            {boss.image_url ? (
              <img
                src={boss.image_url}
                alt={boss.name}
                className="boss-card__image"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = '/images/default_boss.png';
                }}
              />
            ) : (
              <div className="boss-card__image-placeholder">
                <i className="fas fa-dragon"></i>
              </div>
            )}
          </div>

          <div className="boss-card__info">
            <h3 className="boss-card__name">{boss.name}</h3>

            {boss.description && (
              <p className="boss-card__description">{boss.description}</p>
            )}

            <div className="boss-card__stats">
              <div className="boss-card__stat">
                <span className="stat-label">Status:</span>
                <span className={`stat-value stat-value--${boss.status}`}>
                  {capitalize(boss.status)}
                </span>
              </div>

              <div className="boss-card__stat">
                <span className="stat-label">Month:</span>
                <span className="stat-value">{boss.month}/{boss.year}</span>
              </div>

              {boss.start_date && (
                <div className="boss-card__stat">
                  <span className="stat-label">Started:</span>
                  <span className="stat-value">{formatDate(boss.start_date)}</span>
                </div>
              )}
            </div>

            {/* Health Bar */}
            <div className="boss-health">
              <div className="boss-health__label">
                <span>Health</span>
                <span>{boss.current_hp.toLocaleString()} / {boss.total_hp.toLocaleString()}</span>
              </div>
              <div className="progress lg">
                <div
                  className="progress-fill"
                  style={{
                    width: `${boss.healthPercentage}%`,
                    backgroundColor: getHealthBarColor(boss.healthPercentage)
                  }}
                ></div>
              </div>
              <div className="boss-health__percentage">{boss.healthPercentage}%</div>
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
                  <span className="damage">
                    {entry.total_damage.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mini-leaderboard__empty">
              <p>No damage dealt yet. Be the first to submit artwork!</p>
            </div>
          )}

          <Link to="/boss" className="mini-leaderboard__link">
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
