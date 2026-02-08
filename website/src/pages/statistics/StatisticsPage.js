import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import MonsterStats from './MonsterStats';
import AchievementsStats from './AchievementsStats';
import LeaderboardStats from './LeaderboardStats';
import TrainerComparisonStats from './TrainerComparisonStats';

const StatisticsPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState('monster');

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }

    // Determine active tab from URL
    const path = location.pathname;
    if (path.includes('/monster')) {
      setActiveTab('monster');
    } else if (path.includes('/achievements')) {
      setActiveTab('achievements');
    } else if (path.includes('/leaderboard')) {
      setActiveTab('leaderboard');
    } else if (path.includes('/trainer-comparison')) {
      setActiveTab('trainer-comparison');
    } else {
      setActiveTab('monster');
    }
  }, [isAuthenticated, location, navigate]);

  return (
    <div className="missions-container">
      <div className="statistics-tabs">
        <Link
          to="/statistics/monster"
          className={`stats-tab-link${activeTab === 'monster' ? 'active' : ''}`}
        >
          <i className="fas fa-dragon"></i> Monster Stats
        </Link>
        <Link
          to="/statistics/trainer-comparison"
          className={`stats-tab-link${activeTab === 'trainer-comparison' ? 'active' : ''}`}
        >
          <i className="fas fa-users"></i> Trainer Comparison
        </Link>
        <Link
          to="/statistics/achievements"
          className={`stats-tab-link${activeTab === 'achievements' ? 'active' : ''}`}
        >
          <i className="fas fa-trophy"></i> Achievements
        </Link>
        <Link
          to="/statistics/leaderboard"
          className={`stats-tab-link${activeTab === 'leaderboard' ? 'active' : ''}`}
        >
          <i className="fas fa-crown"></i> Leaderboards
        </Link>
      </div>

      <div className="statistics-content">
        <Routes>
          <Route index element={<Navigate to="/statistics/monster" replace />} />
          <Route path="monster" element={<MonsterStats />} />
          <Route path="trainer-comparison" element={<TrainerComparisonStats />} />
          <Route path="achievements" element={<AchievementsStats />} />
          <Route path="leaderboard" element={<LeaderboardStats />} />
        </Routes>
      </div>
    </div>
  );
};

export default StatisticsPage;
