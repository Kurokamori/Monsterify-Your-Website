import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import adminService from '../../services/adminService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

/**
 * Admin Dashboard
 * Main dashboard for admin users with links to various admin features
 */
const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        // Fetch statistics from the admin service
        const response = await adminService.getDashboardStats();
        console.log('Admin stats response:', response);

        // Process the API response to ensure it has the expected structure
        if (response && response.success && response.data) {
          const apiStats = {
            users: {
              total: response.data.users?.total || 0,
              new_this_week: response.data.users?.new_this_week || 0
            },
            trainers: {
              total: response.data.trainers?.total || 0,
              new_this_week: response.data.trainers?.new_this_week || 0
            },
            monsters: {
              total: response.data.monsters?.total || 0,
              new_this_week: response.data.monsters?.new_this_week || 0
            },
            fakemon: {
              total: response.data.fakemon?.total || 0,
              new_this_week: response.data.fakemon?.new_this_week || 0
            },
            submissions: {
              total: response.data.submissions?.total || 0,
              pending: response.data.submissions?.pending || 0
            }
          };

          setStats(apiStats);
          console.log('Using real database stats:', apiStats);
        } else {
          // Handle unexpected response format
          console.error('API returned unexpected format:', response);
          throw new Error('Failed to fetch statistics from server');
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
    <div className="admin-dashboard">
      <div className="admin-dashboard-header">
        <h1 className="admin-dashboard-title">Admin Dashboard</h1>
        <p className="admin-dashboard-subtitle">
          Manage all aspects of the Dusk and Dawn website
        </p>
      </div>

      {/* Stats Overview */}
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
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon fakemon">
            <i className="fas fa-paw"></i>
          </div>
          <div className="admin-stat-content">
            <h3>Fakemon</h3>
            <div className="admin-stat-value">{stats.fakemon.total}</div>
            <div className="admin-stat-subtext">
              <span className="highlight">+{stats.fakemon.new_this_week}</span> new this week
            </div>
          </div>
        </div>
      </div>

      {/* Admin Features */}
      <h2 className="admin-section-title">Admin Features</h2>
      <div className="admin-cards-grid">
        {/* User Management */}
        <div className="admin-dashboard-card">
          <div className="admin-dashboard-card-content">
            <h3 className="admin-dashboard-card-title">User Management</h3>
            <p className="admin-dashboard-card-description">
              Manage user accounts, permissions, and roles
            </p>
          </div>
          <div className="admin-dashboard-card-actions">
            <Link to="/admin/users" className="admin-button">
              Manage Users
            </Link>
          </div>
        </div>

        {/* Content Management */}
        <div className="admin-dashboard-card">
          <div className="admin-dashboard-card-content">
            <h3 className="admin-dashboard-card-title">Content Management</h3>
            <p className="admin-dashboard-card-description">
              Manage guides, articles, and other content
            </p>
          </div>
          <div className="admin-dashboard-card-actions">
            <Link to="/admin/content" className="admin-button">
              Manage Content
            </Link>
          </div>
        </div>

        {/* Fakemon Management */}
        <div className="admin-dashboard-card">
          <div className="admin-dashboard-card-content">
            <h3 className="admin-dashboard-card-title">Fakemon Management</h3>
            <p className="admin-dashboard-card-description">
              Manage fakemon entries in the Fakedex
            </p>
          </div>
          <div className="admin-dashboard-card-actions">
            <Link to="/admin/fakemon" className="admin-button">
              Manage Fakemon
            </Link>
          </div>
        </div>

        {/* Monster Management */}
        <div className="admin-dashboard-card">
          <div className="admin-dashboard-card-content">
            <h3 className="admin-dashboard-card-title">Monster Management</h3>
            <p className="admin-dashboard-card-description">
              Manage monsters in the game
            </p>
          </div>
          <div className="admin-dashboard-card-actions">
            <Link to="/admin/monsters" className="admin-button">
              Manage Monsters
            </Link>
          </div>
        </div>

        {/* Trainer Management */}
        <div className="admin-dashboard-card">
          <div className="admin-dashboard-card-content">
            <h3 className="admin-dashboard-card-title">Trainer Management</h3>
            <p className="admin-dashboard-card-description">
              Manage trainers and their profiles
            </p>
          </div>
          <div className="admin-dashboard-card-actions">
            <Link to="/admin/trainers" className="admin-button">
              Manage Trainers
            </Link>
          </div>
        </div>

        {/* Submission Management */}
        <div className="admin-dashboard-card">
          <div className="admin-dashboard-card-content">
            <h3 className="admin-dashboard-card-title">Submission Management</h3>
            <p className="admin-dashboard-card-description">
              Review and manage art and writing submissions
            </p>
          </div>
          <div className="admin-dashboard-card-actions">
            <Link to="/admin/submissions" className="admin-button">
              Manage Submissions
            </Link>
          </div>
        </div>

        {/* Prompt Management */}
        <div className="admin-dashboard-card">
          <div className="admin-dashboard-card-content">
            <h3 className="admin-dashboard-card-title">Prompt Management</h3>
            <p className="admin-dashboard-card-description">
              Create and manage prompts with rewards and automation
            </p>
          </div>
          <div className="admin-dashboard-card-actions">
            <Link to="/admin/prompts" className="admin-button">
              Manage Prompts
            </Link>
          </div>
        </div>

        {/* Level Management */}
        <div className="admin-dashboard-card">
          <div className="admin-dashboard-card-content">
            <h3 className="admin-dashboard-card-title">Level Management</h3>
            <p className="admin-dashboard-card-description">
              Add levels and coins to trainers and monsters
            </p>
          </div>
          <div className="admin-dashboard-card-actions">
            <Link to="/admin/level-management" className="admin-button">
              Manage Levels
            </Link>
          </div>
        </div>

        {/* Pokemon Monster Management */}
        <div className="admin-dashboard-card">
          <div className="admin-dashboard-card-content">
            <h3 className="admin-dashboard-card-title">Pokemon Database</h3>
            <p className="admin-dashboard-card-description">
              Manage Pokemon species database
            </p>
          </div>
          <div className="admin-dashboard-card-actions">
            <Link to="/admin/pokemon-monsters" className="admin-button">
              Manage Pokemon
            </Link>
          </div>
        </div>

        {/* Digimon Monster Management */}
        <div className="admin-dashboard-card">
          <div className="admin-dashboard-card-content">
            <h3 className="admin-dashboard-card-title">Digimon Database</h3>
            <p className="admin-dashboard-card-description">
              Manage Digimon species database
            </p>
          </div>
          <div className="admin-dashboard-card-actions">
            <Link to="/admin/digimon-monsters" className="admin-button">
              Manage Digimon
            </Link>
          </div>
        </div>

        {/* Yokai Monster Management */}
        <div className="admin-dashboard-card">
          <div className="admin-dashboard-card-content">
            <h3 className="admin-dashboard-card-title">Yokai Database</h3>
            <p className="admin-dashboard-card-description">
              Manage Yokai species database
            </p>
          </div>
          <div className="admin-dashboard-card-actions">
            <Link to="/admin/yokai-monsters" className="admin-button">
              Manage Yokai
            </Link>
          </div>
        </div>

        {/* Nexomon Monster Management */}
        <div className="admin-dashboard-card">
          <div className="admin-dashboard-card-content">
            <h3 className="admin-dashboard-card-title">Nexomon Database</h3>
            <p className="admin-dashboard-card-description">
              Manage Nexomon species database
            </p>
          </div>
          <div className="admin-dashboard-card-actions">
            <Link to="/admin/nexomon-monsters" className="admin-button">
              Manage Nexomon
            </Link>
          </div>
        </div>

        {/* Pals Monster Management */}
        <div className="admin-dashboard-card">
          <div className="admin-dashboard-card-content">
            <h3 className="admin-dashboard-card-title">Pals Database</h3>
            <p className="admin-dashboard-card-description">
              Manage Pals species database
            </p>
          </div>
          <div className="admin-dashboard-card-actions">
            <Link to="/admin/pals-monsters" className="admin-button">
              Manage Pals
            </Link>
          </div>
        </div>

        {/* Shop Management */}
        <div className="admin-dashboard-card">
          <div className="admin-dashboard-card-content">
            <h3 className="admin-dashboard-card-title">Shop Manager</h3>
            <p className="admin-dashboard-card-description">
              Manage shop items and inventory
            </p>
          </div>
          <div className="admin-dashboard-card-actions">
            <Link to="/admin/items" className="admin-button">
              Manage Items
            </Link>
          </div>
        </div>

        {/* Birthday Roller */}
        <div className="admin-dashboard-card">
          <div className="admin-dashboard-card-content">
            <h3 className="admin-dashboard-card-title">Birthday Roller</h3>
            <p className="admin-dashboard-card-description">
              Roll items and monsters for birthday events
            </p>
          </div>
          <div className="admin-dashboard-card-actions">
            <Link to="/admin/birthday-roller" className="admin-button">
              Birthday Roller
            </Link>
          </div>
        </div>

        {/* Faction People Management */}
        <div className="admin-dashboard-card">
          <div className="admin-dashboard-card-content">
            <h3 className="admin-dashboard-card-title">Faction People</h3>
            <p className="admin-dashboard-card-description">
              Manage faction NPCs and their monster teams
            </p>
          </div>
          <div className="admin-dashboard-card-actions">
            <Link to="/admin/faction-people" className="admin-button">
              Manage Faction People
            </Link>
          </div>
        </div>

        {/* Boss Management */}
        <div className="admin-dashboard-card">
          <div className="admin-dashboard-card-content">
            <h3 className="admin-dashboard-card-title">Boss Management</h3>
            <p className="admin-dashboard-card-description">
              Manage monthly bosses, rewards, and boss battles
            </p>
          </div>
          <div className="admin-dashboard-card-actions">
            <Link to="/admin/bosses" className="admin-button">
              Manage Bosses
            </Link>
          </div>
        </div>

        {/* World Map Management */}
        <div className="admin-dashboard-card">
          <div className="admin-dashboard-card-content">
            <h3 className="admin-dashboard-card-title">World Map Management</h3>
            <p className="admin-dashboard-card-description">
              Manage landmasses, regions, and areas in the interactive world map
            </p>
          </div>
          <div className="admin-dashboard-card-actions">
            <Link to="/admin/world-map" className="admin-button">
              Manage World Map
            </Link>
          </div>
        </div>

        {/* Bulk Monster Add */}
        <div className="admin-dashboard-card">
          <div className="admin-dashboard-card-content">
            <h3 className="admin-dashboard-card-title">Bulk Monster Add</h3>
            <p className="admin-dashboard-card-description">
              Add multiple monsters to trainers using text input
            </p>
          </div>
          <div className="admin-dashboard-card-actions">
            <Link to="/admin/bulk-monster-add" className="admin-button">
              Bulk Add Monsters
            </Link>
          </div>
        </div>

        {/* Admin Features */}
        <div className="admin-dashboard-card">
          <div className="admin-dashboard-card-content">
            <h3 className="admin-dashboard-card-title">Admin Features</h3>
            <p className="admin-dashboard-card-description">
              Access all admin tools and features
            </p>
          </div>
          <div className="admin-dashboard-card-actions">
            <Link to="/admin/features" className="admin-button">
              View All Features
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <h2 className="admin-section-title">Quick Actions</h2>
      <div className="admin-quick-actions">
        <Link to="/admin/users/add" className="admin-quick-action-button">
          <i className="fas fa-user-plus"></i>
          <span>Add User</span>
        </Link>
        <Link to="/admin/fakemon/add" className="admin-quick-action-button">
          <i className="fas fa-plus-circle"></i>
          <span>Add Fakemon</span>
        </Link>
        <Link to="/admin/monsters/add" className="admin-quick-action-button">
          <i className="fas fa-dragon"></i>
          <span>Add Monster</span>
        </Link>
        <Link to="/admin/trainers/create" className="admin-quick-action-button">
          <i className="fas fa-user-plus"></i>
          <span>Add Trainer</span>
        </Link>
        <Link to="/admin/pokemon-monsters/add" className="admin-quick-action-button">
          <i className="fas fa-paw"></i>
          <span>Add Pokemon</span>
        </Link>
        <Link to="/admin/digimon-monsters/add" className="admin-quick-action-button">
          <i className="fas fa-robot"></i>
          <span>Add Digimon</span>
        </Link>
        <Link to="/admin/yokai-monsters/add" className="admin-quick-action-button">
          <i className="fas fa-ghost"></i>
          <span>Add Yokai</span>
        </Link>
        <Link to="/admin/nexomon-monsters/add" className="admin-quick-action-button">
          <i className="fas fa-dragon"></i>
          <span>Add Nexomon</span>
        </Link>
        <Link to="/admin/pals-monsters/add" className="admin-quick-action-button">
          <i className="fas fa-paw"></i>
          <span>Add Pals</span>
        </Link>
        <Link to="/admin/items/add" className="admin-quick-action-button">
          <i className="fas fa-shopping-bag"></i>
          <span>Add Item</span>
        </Link>
        <Link to="/admin/items/bulk" className="admin-quick-action-button">
          <i className="fas fa-boxes"></i>
          <span>Bulk Add Items</span>
        </Link>
        <Link to="/admin/shop-manager" className="admin-quick-action-button">
          <i className="fas fa-store"></i>
          <span>Shop Manager</span>
        </Link>
        <Link to="/admin/item-roller" className="admin-quick-action-button">
          <i className="fas fa-dice"></i>
          <span>Item Roller</span>
        </Link>
        <Link to="/admin/monster-roller" className="admin-quick-action-button">
          <i className="fas fa-dragon"></i>
          <span>Monster Roller</span>
        </Link>
        <Link to="/admin/birthday-roller" className="admin-quick-action-button">
          <i className="fas fa-birthday-cake"></i>
          <span>Birthday Roller</span>
        </Link>
        <Link to="/admin/level-management" className="admin-quick-action-button">
          <i className="fas fa-level-up-alt"></i>
          <span>Manage Levels</span>
        </Link>
        <Link to="/admin/item-management" className="admin-quick-action-button">
          <i className="fas fa-calendar-alt"></i>
          <span>Monthly Distribution</span>
        </Link>
        <Link to="/admin/faction-people" className="admin-quick-action-button">
          <i className="fas fa-users"></i>
          <span>Faction People</span>
        </Link>
        <Link to="/admin/bosses/add" className="admin-quick-action-button">
          <i className="fas fa-dragon"></i>
          <span>Add Boss</span>
        </Link>
        <Link to="/admin/world-map" className="admin-quick-action-button">
          <i className="fas fa-map"></i>
          <span>World Map</span>
        </Link>
        <Link to="/admin/bulk-monster-add" className="admin-quick-action-button">
          <i className="fas fa-plus-square"></i>
          <span>Bulk Add Monsters</span>
        </Link>
        <Link to="/admin/features" className="admin-quick-action-button">
          <i className="fas fa-tools"></i>
          <span>Admin Features</span>
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;
