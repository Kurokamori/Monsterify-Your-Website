import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const AdminFeatures = () => {
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Features' },
    { id: 'rollers', name: 'Rollers' },
    { id: 'managers', name: 'Managers' },
    { id: 'databases', name: 'Databases' },
    { id: 'systems', name: 'Game Systems' },
  ];

  const features = [
    // Rollers
    {
      id: 'monster-roller',
      name: 'Monster Roller',
      description: 'Generate random monsters with customizable parameters',
      icon: 'fa-dice',
      category: 'rollers',
      path: '/admin/monster-roller',
      implemented: false
    },
    {
      id: 'item-roller',
      name: 'Item Roller',
      description: 'Generate random items with customizable parameters',
      icon: 'fa-box',
      category: 'rollers',
      path: '/admin/item-roller',
      implemented: false
    },

    // Managers
    {
      id: 'level-management',
      name: 'Level Management',
      description: 'Add levels and coins to trainers and monsters',
      icon: 'fa-level-up-alt',
      category: 'managers',
      path: '/admin/level-management',
      implemented: true
    },
    {
      id: 'item-manager',
      name: 'Item Manager',
      description: 'Manage items in the game',
      icon: 'fa-shopping-bag',
      category: 'managers',
      path: '/admin/items',
      implemented: true
    },
    {
      id: 'item-management',
      name: 'Item Management',
      description: 'Add items to trainers',
      icon: 'fa-gift',
      category: 'managers',
      path: '/admin/item-management',
      implemented: true
    },
    {
      id: 'shop-manager',
      name: 'Shop Manager',
      description: 'Manage shops and their inventory',
      icon: 'fa-store',
      category: 'managers',
      path: '/admin/shop-manager',
      implemented: false
    },
    {
      id: 'mission-manager',
      name: 'Mission Manager',
      description: 'Create and manage missions',
      icon: 'fa-tasks',
      category: 'managers',
      path: '/admin/mission-manager',
      implemented: false
    },
    {
      id: 'adventure-manager',
      name: 'Adventure Manager',
      description: 'Create and manage adventures',
      icon: 'fa-map-marked-alt',
      category: 'managers',
      path: '/admin/adventure-manager',
      implemented: false
    },
    {
      id: 'boss-manager',
      name: 'Boss Manager',
      description: 'Create and manage boss battles',
      icon: 'fa-crown',
      category: 'managers',
      path: '/admin/boss-manager',
      implemented: false
    },
    {
      id: 'test-rewards',
      name: 'Test Rewards',
      description: 'Test reward distribution',
      icon: 'fa-gift',
      category: 'managers',
      path: '/admin/test-rewards',
      implemented: false
    },
    {
      id: 'monthly-distribution',
      name: 'Monthly Distribution',
      description: 'Manage monthly item distribution to all trainers',
      icon: 'fa-calendar-alt',
      category: 'managers',
      path: '/admin/item-management',
      implemented: true
    },

    // Databases
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
      id: 'pal-database',
      name: 'Pal Database',
      description: 'Manage Pal species data',
      icon: 'fa-paw',
      category: 'databases',
      path: '/admin/pals-monsters',
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

    // Game Systems
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
    }
  ];

  const filteredFeatures = activeCategory === 'all'
    ? features
    : features.filter(feature => feature.category === activeCategory);

  return (
    <div className="admin-features">
      <div className="admin-features-header">
        <h1>Admin Features</h1>
        <p>Manage all aspects of the Dusk and Dawn game</p>
      </div>

      <div className="admin-features-categories">
        {categories.map(category => (
          <button
            key={category.id}
            className={`admin-features-category ${activeCategory === category.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(category.id)}
          >
            {category.name}
          </button>
        ))}
      </div>

      <div className="admin-features-grid">
        {filteredFeatures.map(feature => (
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
                  Open
                </Link>
              ) : (
                <button className="admin-feature-button disabled" disabled>
                  Coming Soon
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminFeatures;
