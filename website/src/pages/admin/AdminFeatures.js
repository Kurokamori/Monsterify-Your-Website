import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const AdminFeatures = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Get category from URL query params
  const getInitialCategory = () => {
    const params = new URLSearchParams(location.search);
    return params.get('category') || 'all';
  };

  const [activeCategory, setActiveCategory] = useState(getInitialCategory);
  const [searchTerm, setSearchTerm] = useState('');

  // Update category when URL changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryFromUrl = params.get('category');
    if (categoryFromUrl && categoryFromUrl !== activeCategory) {
      setActiveCategory(categoryFromUrl);
    }
  }, [location.search]);

  // Update URL when category changes
  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId);
    if (categoryId === 'all') {
      navigate('/admin/features');
    } else {
      navigate(`/admin/features?category=${categoryId}`);
    }
  };

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
      icon: 'fa-gift',
      category: 'management',
      path: '/admin/seasonal-adopts',
      implemented: true
    },

    // === DATABASES ===
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

  return (
    <div className="admin-features">
      <div className="admin-features-header">
        <h1>Admin Tools</h1>
        <p>All admin tools and features in one place</p>
        <div className="admin-features-stats">
          <span className="stat-item">
            <i className="fas fa-tools"></i> {features.length} Total Tools
          </span>
          <span className="stat-item implemented">
            <i className="fas fa-check-circle"></i> {implementedCount} Implemented
          </span>
          <span className="stat-item coming-soon">
            <i className="fas fa-clock"></i> {features.length - implementedCount} Coming Soon
          </span>
        </div>
      </div>

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
            onClick={() => handleCategoryChange(category.id)}
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
                  <Link to={feature.path} className="button primary block">
                    <i className="fas fa-arrow-right"></i> Open
                  </Link>
                ) : (
                  <button className="button primary block" disabled>
                    <i className="fas fa-clock"></i> Coming Soon
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminFeatures;
