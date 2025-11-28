import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

const AdminHome = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // Fetch real statistics from the admin API
        const response = await api.get('/admin/stats');
        
        if (response.data && response.data.success) {
          const stats = {
            users: {
              total: response.data.data.users?.total || 0,
              new_this_week: response.data.data.users?.new_this_week || 0
            },
            trainers: {
              total: response.data.data.trainers?.total || 0,
              new_this_week: response.data.data.trainers?.new_this_week || 0
            },
            monsters: {
              total: response.data.data.monsters?.total || 0,
              new_this_week: response.data.data.monsters?.new_this_week || 0
            },
            submissions: {
              total: response.data.data.submissions?.total || 0,
              pending: response.data.data.submissions?.pending || 0
            }
          };
          
          setStats(stats);
          console.log('Using real database stats:', stats);
        } else {
          throw new Error('Invalid response format from server');
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching admin stats:', err);
        setError('Failed to load dashboard statistics. Please try again later.');
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="admin-home">
      <h1>Admin Dashboard</h1>
      
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon users">
            <i className="fas fa-users"></i>
          </div>
          <div className="admin-stat-content">
            <h3>Users</h3>
            <div className="admin-stat-value">{stats.users.total}</div>
            <div className="admin-stat-subtext">
              <span className="highlight">+{stats.users.new_this_week}</span> new this week
            </div>
          </div>
          <Link to="/admin/dashboard/users" className="admin-stat-link">
            Manage Users <i className="fas fa-arrow-right"></i>
          </Link>
        </div>
        
        <div className="admin-stat-card">
          <div className="admin-stat-icon trainers">
            <i className="fas fa-user-friends"></i>
          </div>
          <div className="admin-stat-content">
            <h3>Trainers</h3>
            <div className="admin-stat-value">{stats.trainers.total}</div>
            <div className="admin-stat-subtext">
              <span className="highlight">+{stats.trainers.new_this_week}</span> new this week
            </div>
          </div>
          <Link to="/admin/dashboard/trainers" className="admin-stat-link">
            Manage Trainers <i className="fas fa-arrow-right"></i>
          </Link>
        </div>
        
        <div className="admin-stat-card">
          <div className="admin-stat-icon monsters">
            <i className="fas fa-dragon"></i>
          </div>
          <div className="admin-stat-content">
            <h3>Monsters</h3>
            <div className="admin-stat-value">{stats.monsters.total}</div>
            <div className="admin-stat-subtext">
              <span className="highlight">+{stats.monsters.new_this_week}</span> new this week
            </div>
          </div>
          <Link to="/admin/dashboard/monsters" className="admin-stat-link">
            Manage Monsters <i className="fas fa-arrow-right"></i>
          </Link>
        </div>
        
        <div className="admin-stat-card">
          <div className="admin-stat-icon submissions">
            <i className="fas fa-images"></i>
          </div>
          <div className="admin-stat-content">
            <h3>Submissions</h3>
            <div className="admin-stat-value">{stats.submissions.total}</div>
            <div className="admin-stat-subtext">
              <span className="highlight">{stats.submissions.pending}</span> pending review
            </div>
          </div>
          <Link to="/admin/dashboard/submissions" className="admin-stat-link">
            Manage Submissions <i className="fas fa-arrow-right"></i>
          </Link>
        </div>
      </div>
      
      <div className="admin-quick-actions">
        <h2>Quick Actions</h2>
        <div className="admin-actions-grid">
          <Link to="/admin/dashboard/trainers/create" className="admin-action-card">
            <i className="fas fa-user-plus"></i>
            <span>Create Trainer</span>
          </Link>
          <Link to="/admin/dashboard/monsters/create" className="admin-action-card">
            <i className="fas fa-plus-circle"></i>
            <span>Add Monster</span>
          </Link>
          <Link to="/admin/dashboard/world-map" className="admin-action-card">
            <i className="fas fa-map"></i>
            <span>Manage World Map</span>
          </Link>
          <Link to="/admin/dashboard/submissions/pending" className="admin-action-card">
            <i className="fas fa-check-circle"></i>
            <span>Review Submissions</span>
          </Link>
          <Link to="/admin/dashboard/users/create" className="admin-action-card">
            <i className="fas fa-user-plus"></i>
            <span>Add User</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminHome;
