import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import EventsPage from './EventsPage';
import MissionsPage from './MissionsPage';
import AdventurePage from './AdventurePage';
import FactionQuestsPage from './FactionQuestsPage';


const AdventuresPage = () => {
  useDocumentTitle('Adventures');
  
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }

    // Determine active tab from URL
    const path = location.pathname;
    if (path.includes('/event')) {
      setActiveTab('events');
    } else if (path.includes('/mission')) {
      setActiveTab('missions');
    } else if (path.includes('/faction-quests')) {
      setActiveTab('faction-quests');
    } else if (path.includes('/boss')) {
      setActiveTab('bosses');
    } else {
      setActiveTab('overview');
    }
  }, [isAuthenticated, location, navigate]);

  if (loading) {
    return <LoadingSpinner message="Loading adventures..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        message={error}
        onRetry={() => setError(null)}
      />
    );
  }

  return (
    <div className="adventures-container">
      <div className="adventures-header">
        <h1>Adventures</h1>
        <p>Embark on exciting journeys, complete missions, and battle powerful bosses</p>
      </div>

      <div className="adventures-tabs">
        <Link
          to="/adventures/create"
          className={`tab-button ${activeTab === 'adventures' ? 'active' : ''}`}
        >
          Adventures
        </Link>
        <Link
          to="/adventures/event/current"
          className={`tab-button ${activeTab === 'events' ? 'active' : ''}`}
        >
          Events
        </Link>
        <Link
          to="/adventures/mission/available"
          className={`tab-button ${activeTab === 'missions' ? 'active' : ''}`}
        >
          Missions
        </Link>
        <Link
          to="/adventures/faction-quests"
          className={`tab-button ${activeTab === 'faction-quests' ? 'active' : ''}`}
        >
          Faction Quests
        </Link>
        <Link
          to="/boss"
          className={`tab-button ${activeTab === 'boss' ? 'active' : ''}`}
        >
          Current Boss
        </Link>
      </div>

      <div className="adventures-content">
        <Routes>
          <Route index element={<Navigate to="/adventures/create" replace />} />
          <Route path="event/*" element={<EventsPage />} />
          <Route path="mission/*" element={<MissionsPage />} />
          <Route path="missions/*" element={<MissionsPage />} />
          <Route path="faction-quests/*" element={<FactionQuestsPage />} />
          <Route path="boss" element={<Navigate to="/boss" replace />} />
          <Route path=":adventureId" element={<AdventurePage />} />
          <Route path="create" element={<AdventurePage />} />
        </Routes>
      </div>
    </div>
  );
};

// Adventures Overview Component
const AdventuresOverview = () => {
  return (
    <div className="adventures-overview">
      <div className="overview-section">
        <h2>Current Events</h2>
        <div className="overview-cards">
          <div className="event-card featured">
            <div className="event-image-container">
              <img
                src="https://via.placeholder.com/300/1e2532/d6a339?text=Summer+Festival"
                alt="Summer Festival"
                className="event-image"
              />
              <div className="event-badge">Featured</div>
            </div>
            <div className="event-info">
              <h3 className="event-title">Summer Festival</h3>
              <div className="event-details">
                <span className="event-date">
                  <i className="fas fa-calendar-alt"></i> Ends in 5 days
                </span>
                <span className="event-participants">
                  <i className="fas fa-users"></i> 1,245 participants
                </span>
              </div>
              <p className="event-description">
                Join the Summer Festival and catch special summer-themed monsters! Complete event challenges to earn exclusive rewards.
              </p>
              <Link to="/adventures/event/summer-festival" className="event-button">
                View Event
              </Link>
            </div>
          </div>

          <Link to="/adventures/event/current" className="view-all-link">
            View All Events <i className="fas fa-arrow-right"></i>
          </Link>
        </div>
      </div>

      <div className="overview-section">
        <h2>Available Missions</h2>
        <div className="overview-cards">
          <div className="mission-card">
            <div className="mission-icon">
              <i className="fas fa-map-marked-alt"></i>
            </div>
            <div className="mission-info">
              <h3 className="mission-title">Forest Expedition</h3>
              <div className="mission-details">
                <span className="mission-difficulty easy">
                  <i className="fas fa-star"></i> Easy
                </span>
                <span className="mission-time">
                  <i className="fas fa-clock"></i> 30 min
                </span>
              </div>
              <p className="mission-description">
                Explore the mysterious forest and collect rare plants for Professor Oak.
              </p>
              <div className="mission-rewards">
                <span className="reward">
                  <i className="fas fa-coins"></i> 500 coins
                </span>
                <span className="reward">
                  <i className="fas fa-star"></i> 200 XP
                </span>
              </div>
            </div>
          </div>

          <div className="mission-card">
            <div className="mission-icon">
              <i className="fas fa-mountain"></i>
            </div>
            <div className="mission-info">
              <h3 className="mission-title">Mountain Rescue</h3>
              <div className="mission-details">
                <span className="mission-difficulty medium">
                  <i className="fas fa-star"></i> Medium
                </span>
                <span className="mission-time">
                  <i className="fas fa-clock"></i> 1 hour
                </span>
              </div>
              <p className="mission-description">
                Rescue a lost hiker and their monster from the dangerous mountain peak.
              </p>
              <div className="mission-rewards">
                <span className="reward">
                  <i className="fas fa-coins"></i> 800 coins
                </span>
                <span className="reward">
                  <i className="fas fa-star"></i> 350 XP
                </span>
              </div>
            </div>
          </div>

          <Link to="/adventures/mission/available" className="view-all-link">
            View All Missions <i className="fas fa-arrow-right"></i>
          </Link>
        </div>
      </div>

      <div className="overview-section">
        <h2>Boss Battles</h2>
        <div className="overview-cards">
          <div className="boss-card">
            <div className="boss-image-container">
              <img
                src="https://via.placeholder.com/150/1e2532/d6a339?text=Dragon+Lord"
                alt="Dragon Lord"
                className="boss-image"
              />
            </div>
            <div className="boss-info">
              <h3 className="boss-title">Dragon Lord</h3>
              <div className="boss-details">
                <span className="boss-difficulty hard">
                  <i className="fas fa-skull"></i> Hard
                </span>
                <span className="boss-level">
                  <i className="fas fa-bolt"></i> Level 50
                </span>
              </div>
              <p className="boss-description">
                A powerful dragon that rules over the volcanic mountains. Bring water and ice type monsters.
              </p>
              <div className="boss-rewards">
                <span className="reward">
                  <i className="fas fa-coins"></i> 2000 coins
                </span>
                <span className="reward">
                  <i className="fas fa-gem"></i> Dragon Scale
                </span>
              </div>
            </div>
          </div>

          <div className="boss-links">
            <Link to="/boss" className="view-all-link">
              View Current Boss <i className="fas fa-eye"></i>
            </Link>
            <Link to="/adventures/boss/available" className="view-all-link">
              View All Bosses <i className="fas fa-arrow-right"></i>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdventuresPage;
