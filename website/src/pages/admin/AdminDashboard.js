import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../../services/adminService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

/**
 * Admin Dashboard
 * Main dashboard for admin users with stats, quick access, and all admin tools
 */
const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Categories for admin tools
  const categories = [
    { id: 'all', name: 'All Features', icon: 'fa-th' },
    { id: 'management', name: 'Management', icon: 'fa-cogs' },
    { id: 'databases', name: 'Databases', icon: 'fa-database' },
    { id: 'rollers', name: 'Rollers & Tools', icon: 'fa-dice' },
    { id: 'items', name: 'Items & Shops', icon: 'fa-shopping-bag' },
    { id: 'bulk', name: 'Bulk Operations', icon: 'fa-layer-group' },
    { id: 'systems', name: 'Game Systems', icon: 'fa-gamepad' },
    { id: 'quick', name: 'Quick Add', icon: 'fa-plus-circle' },
  ];

  // All admin tools/features
  const features = [
    // === MANAGEMENT ===
    {
      id: 'user-management',
      name: 'User Management',
      description: 'Manage user accounts, permissions, and roles',
      icon: 'fa-users',
      category: 'management',
      path: '/admin/users',
      implemented: true
    },
    {
      id: 'trainer-management',
      name: 'Trainer Management',
      description: 'Manage trainers and their profiles',
      icon: 'fa-user-friends',
      category: 'management',
      path: '/admin/trainers',
      implemented: true
    },
    {
      id: 'monster-management',
      name: 'Monster Management',
      description: 'Manage monsters in the game',
      icon: 'fa-dragon',
      category: 'management',
      path: '/admin/monsters',
      implemented: true
    },
    {
      id: 'fakemon-management',
      name: 'Fakemon Management',
      description: 'Manage fakemon entries in the Fakedex',
      icon: 'fa-paw',
      category: 'management',
      path: '/admin/fakemon',
      implemented: true
    },
    {
      id: 'submission-management',
      name: 'Submission Management',
      description: 'Review and manage art and writing submissions',
      icon: 'fa-images',
      category: 'management',
      path: '/admin/submissions',
      implemented: true
    },
    {
      id: 'prompt-management',
      name: 'Prompt Management',
      description: 'Create and manage prompts with rewards and automation',
      icon: 'fa-clipboard-list',
      category: 'management',
      path: '/admin/prompts',
      implemented: true
    },
    {
      id: 'content-management',
      name: 'Content Management',
      description: 'Manage guides, articles, and other content',
      icon: 'fa-file-alt',
      category: 'management',
      path: '/admin/content',
      implemented: true
    },
    {
      id: 'faction-people',
      name: 'Faction People',
      description: 'Manage faction NPCs and their monster teams',
      icon: 'fa-users-cog',
      category: 'management',
      path: '/admin/faction-people',
      implemented: true
    },
    {
      id: 'boss-management',
      name: 'Boss Management',
      description: 'Manage monthly bosses, rewards, and boss battles',
      icon: 'fa-crown',
      category: 'management',
      path: '/admin/bosses',
      implemented: true
    },
    {
      id: 'world-map',
      name: 'World Map Management',
      description: 'Manage landmasses, regions, and areas in the interactive world map',
      icon: 'fa-map',
      category: 'management',
      path: '/admin/world-map',
      implemented: true
    },
    {
      id: 'seasonal-adopts',
      name: 'Seasonal Adopts',
      description: 'Manage seasonal adopt monsters for antique auctions',
      icon: 'fa-snowflake',
      category: 'management',
      path: '/admin/seasonal-adopts',
      implemented: true
    },

    // === DATABASES ===
    {
      id: 'fakemon-database',
      name: 'Fakemon Database',
      description: 'Manage fakemon entries in the Fakedex',
      icon: 'fa-star',
      category: 'databases',
      path: '/admin/fakemon',
      implemented: true
    },
    {
      id: 'pokemon-database',
      name: 'Pokemon Database',
      description: 'Manage Pokemon species data',
      icon: 'fa-paw',
      category: 'databases',
      path: '/admin/pokemon-monsters',
      implemented: true
    },
    {
      id: 'digimon-database',
      name: 'Digimon Database',
      description: 'Manage Digimon species data',
      icon: 'fa-robot',
      category: 'databases',
      path: '/admin/digimon-monsters',
      implemented: true
    },
    {
      id: 'yokai-database',
      name: 'Yokai Database',
      description: 'Manage Yokai species data',
      icon: 'fa-ghost',
      category: 'databases',
      path: '/admin/yokai-monsters',
      implemented: true
    },
    {
      id: 'nexomon-database',
      name: 'Nexomon Database',
      description: 'Manage Nexomon species data',
      icon: 'fa-dragon',
      category: 'databases',
      path: '/admin/nexomon-monsters',
      implemented: true
    },
    {
      id: 'pal-database',
      name: 'Pals Database',
      description: 'Manage Pal species data',
      icon: 'fa-paw',
      category: 'databases',
      path: '/admin/pals-monsters',
      implemented: true
    },
    {
      id: 'monsterhunter-database',
      name: 'Monster Hunter Database',
      description: 'Manage Monster Hunter species data',
      icon: 'fa-shield-alt',
      category: 'databases',
      path: '/admin/monsterhunter-monsters',
      implemented: true
    },
    {
      id: 'finalfantasy-database',
      name: 'Final Fantasy Database',
      description: 'Manage Final Fantasy species data',
      icon: 'fa-crystal-ball',
      category: 'databases',
      path: '/admin/finalfantasy-monsters',
      implemented: true
    },

    // === ROLLERS & TOOLS ===
    {
      id: 'monster-roller',
      name: 'Monster Roller',
      description: 'Generate random monsters with customizable parameters',
      icon: 'fa-dice',
      category: 'rollers',
      path: '/admin/monster-roller',
      implemented: true
    },
    {
      id: 'item-roller',
      name: 'Item Roller',
      description: 'Generate random items with customizable parameters',
      icon: 'fa-box',
      category: 'rollers',
      path: '/admin/item-roller',
      implemented: true
    },
    {
      id: 'starter-roller',
      name: 'Starter Roller',
      description: 'Roll starter monsters without creating a trainer (admin preview)',
      icon: 'fa-egg',
      category: 'rollers',
      path: '/admin/starter-roller',
      implemented: true
    },
    {
      id: 'reroller',
      name: 'Reroller',
      description: 'Create custom rolls with claim links (Monster, Item, Gift, Birthday)',
      icon: 'fa-gift',
      category: 'rollers',
      path: '/admin/reroller',
      implemented: true
    },

    // === ITEMS & SHOPS ===
    {
      id: 'item-manager',
      name: 'Item Manager',
      description: 'Manage items in the game database',
      icon: 'fa-shopping-bag',
      category: 'items',
      path: '/admin/items',
      implemented: true
    },
    {
      id: 'shop-manager',
      name: 'Shop Manager',
      description: 'Manage shops and their inventory',
      icon: 'fa-store',
      category: 'items',
      path: '/admin/shop-manager',
      implemented: true
    },
    {
      id: 'item-management',
      name: 'Item Distribution',
      description: 'Add items to trainers inventories',
      icon: 'fa-gift',
      category: 'items',
      path: '/admin/item-management',
      implemented: true
    },
    {
      id: 'monthly-distribution',
      name: 'Monthly Distribution',
      description: 'Manage monthly item distribution to all trainers',
      icon: 'fa-calendar-alt',
      category: 'items',
      path: '/admin/item-management',
      implemented: true
    },
    {
      id: 'level-management',
      name: 'Level Management',
      description: 'Add levels and coins to trainers and monsters',
      icon: 'fa-level-up-alt',
      category: 'items',
      path: '/admin/level-management',
      implemented: true
    },

    // === BULK OPERATIONS ===
    {
      id: 'bulk-monster-add',
      name: 'Bulk Monster Add',
      description: 'Add multiple monsters to trainers using text input',
      icon: 'fa-plus-square',
      category: 'bulk',
      path: '/admin/bulk-monster-add',
      implemented: true
    },
    {
      id: 'bulk-item-add',
      name: 'Bulk Item Add',
      description: 'Add multiple items to the database at once',
      icon: 'fa-boxes',
      category: 'bulk',
      path: '/admin/items/bulk',
      implemented: true
    },
    {
      id: 'mass-fakemon-add',
      name: 'Mass Fakemon Add',
      description: 'Add multiple fakemon entries at once',
      icon: 'fa-layer-group',
      category: 'bulk',
      path: '/admin/fakemon/mass-add',
      implemented: true
    },

    // === GAME SYSTEMS ===
    {
      id: 'mission-manager',
      name: 'Mission Manager',
      description: 'Create and manage missions',
      icon: 'fa-tasks',
      category: 'systems',
      path: '/admin/mission-manager',
      implemented: false
    },
    {
      id: 'adventure-manager',
      name: 'Adventure Manager',
      description: 'Create and manage adventures',
      icon: 'fa-map-marked-alt',
      category: 'systems',
      path: '/admin/adventure-manager',
      implemented: false
    },
    {
      id: 'battle-system',
      name: 'Battle System',
      description: 'Configure battle system parameters',
      icon: 'fa-fist-raised',
      category: 'systems',
      path: '/admin/battle-system',
      implemented: false
    },
    {
      id: 'contest-system',
      name: 'Contest System',
      description: 'Configure contest system parameters',
      icon: 'fa-trophy',
      category: 'systems',
      path: '/admin/contest-system',
      implemented: false
    },
    {
      id: 'test-rewards',
      name: 'Test Rewards',
      description: 'Test reward distribution system',
      icon: 'fa-vial',
      category: 'systems',
      path: '/admin/test-rewards',
      implemented: false
    },

    // === QUICK ADD ===
    {
      id: 'add-user',
      name: 'Add User',
      description: 'Create a new user account',
      icon: 'fa-user-plus',
      category: 'quick',
      path: '/admin/users/add',
      implemented: true
    },
    {
      id: 'add-trainer',
      name: 'Add Trainer',
      description: 'Create a new trainer profile',
      icon: 'fa-user-plus',
      category: 'quick',
      path: '/admin/trainers/create',
      implemented: true
    },
    {
      id: 'add-monster',
      name: 'Add Monster',
      description: 'Add a new monster to a trainer',
      icon: 'fa-dragon',
      category: 'quick',
      path: '/admin/monsters/add',
      implemented: true
    },
    {
      id: 'add-fakemon',
      name: 'Add Fakemon',
      description: 'Add a new fakemon to the Fakedex',
      icon: 'fa-plus-circle',
      category: 'quick',
      path: '/admin/fakemon/add',
      implemented: true
    },
    {
      id: 'add-item',
      name: 'Add Item',
      description: 'Add a new item to the database',
      icon: 'fa-shopping-bag',
      category: 'quick',
      path: '/admin/items/add',
      implemented: true
    },
    {
      id: 'add-pokemon',
      name: 'Add Pokemon',
      description: 'Add a new Pokemon to the database',
      icon: 'fa-paw',
      category: 'quick',
      path: '/admin/pokemon-monsters/add',
      implemented: true
    },
    {
      id: 'add-digimon',
      name: 'Add Digimon',
      description: 'Add a new Digimon to the database',
      icon: 'fa-robot',
      category: 'quick',
      path: '/admin/digimon-monsters/add',
      implemented: true
    },
    {
      id: 'add-yokai',
      name: 'Add Yokai',
      description: 'Add a new Yokai to the database',
      icon: 'fa-ghost',
      category: 'quick',
      path: '/admin/yokai-monsters/add',
      implemented: true
    },
    {
      id: 'add-nexomon',
      name: 'Add Nexomon',
      description: 'Add a new Nexomon to the database',
      icon: 'fa-dragon',
      category: 'quick',
      path: '/admin/nexomon-monsters/add',
      implemented: true
    },
    {
      id: 'add-pals',
      name: 'Add Pals',
      description: 'Add a new Pal to the database',
      icon: 'fa-paw',
      category: 'quick',
      path: '/admin/pals-monsters/add',
      implemented: true
    },
    {
      id: 'add-boss',
      name: 'Add Boss',
      description: 'Create a new boss battle',
      icon: 'fa-crown',
      category: 'quick',
      path: '/admin/bosses/add',
      implemented: true
    },
  ];

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

  // Filter features based on category and search term
  const filteredFeatures = features.filter(feature => {
    const matchesCategory = activeCategory === 'all' || feature.category === activeCategory;
    const matchesSearch = searchTerm === '' ||
      feature.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feature.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Get counts for each category
  const getCategoryCount = (categoryId) => {
    if (categoryId === 'all') return features.length;
    return features.filter(f => f.category === categoryId).length;
  };

  // Get implemented count
  const implementedCount = features.filter(f => f.implemented).length;

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
        <Link to="/admin/users" className="admin-stat-card clickable">
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
        </Link>

        <Link to="/admin/trainers" className="admin-stat-card clickable">
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
        </Link>

        <Link to="/admin/monsters" className="admin-stat-card clickable">
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
        </Link>

        <Link to="/admin/fakemon" className="admin-stat-card clickable">
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
        </Link>

        <Link to="/admin/submissions" className="admin-stat-card clickable">
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
        </Link>
      </div>

      {/* Admin Tools Section */}
      <div className="admin-tools-section">
        {/* Search Bar */}
        <div className="admin-features-search">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search tools..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>

        {/* Categories */}
        <div className="admin-features-categories">
          {categories.map(category => (
            <button
              key={category.id}
              className={`admin-features-category ${activeCategory === category.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(category.id)}
            >
              <i className={`fas ${category.icon}`}></i>
              <span>{category.name}</span>
              <span className="category-count">{getCategoryCount(category.id)}</span>
            </button>
          ))}
        </div>

        {/* Features Grid */}
        <div className="admin-features-grid">
          {filteredFeatures.length === 0 ? (
            <div className="no-results">
              <i className="fas fa-search"></i>
              <p>No tools found matching your search.</p>
            </div>
          ) : (
            filteredFeatures.map(feature => (
              <div key={feature.id} className={`admin-feature-card ${!feature.implemented ? 'not-implemented' : ''}`}>
                <div className="admin-feature-icon">
                  <i className={`fas ${feature.icon}`}></i>
                </div>
                <div className="admin-feature-content">
                  <h3 className="admin-feature-title">{feature.name}</h3>
                  <p className="admin-feature-description">{feature.description}</p>
                  {!feature.implemented && (
                    <span className="admin-feature-badge">Coming Soon</span>
                  )}
                </div>
                <div className="admin-feature-actions">
                  {feature.implemented ? (
                    <Link to={feature.path} className="admin-feature-button">
                      <i className="fas fa-arrow-right"></i> Open
                    </Link>
                  ) : (
                    <button className="admin-feature-button disabled" disabled>
                      <i className="fas fa-clock"></i> Coming Soon
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
