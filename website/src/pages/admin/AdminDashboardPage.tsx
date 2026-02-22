import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { AdminRoute } from '@components/common/AdminRoute';
import { Card } from '@components/common/Card';

interface AdminTool {
  name: string;
  icon: string;
  description: string;
  path: string;
}

interface AdminCategory {
  name: string;
  icon: string;
  tools: AdminTool[];
}

const ADMIN_CATEGORIES: AdminCategory[] = [
  {
    name: 'Adventure Management',
    icon: 'fas fa-compass',
    tools: [
      { name: 'Boss Manager', icon: 'fas fa-dragon', description: 'Manage boss encounters and rewards', path: '/admin/boss-manager' },
      { name: 'Discord Adventure Manager', icon: 'fab fa-discord', description: 'Manage Discord-based adventures', path: '/admin/discord-adventure-manager' },
      { name: 'Mission Content Manager', icon: 'fas fa-scroll', description: 'Create and edit mission content', path: '/admin/mission-content-manager' },
      { name: 'Player Mission Manager', icon: 'fas fa-tasks', description: 'View and manage player mission progress', path: '/admin/player-mission-manager' },
      { name: 'Adventure Location Manager', icon: 'fas fa-map-marked-alt', description: 'Manage adventure locations and areas', path: '/admin/adventure-location-manager' },
      { name: 'Event Manager', icon: 'fas fa-calendar-alt', description: 'Create and manage game events', path: '/admin/event-manager' },
    ],
  },
  {
    name: 'Guide / Tool Manager',
    icon: 'fas fa-book-open',
    tools: [
      { name: 'Content Manager', icon: 'fas fa-file-alt', description: 'Manage guide content and pages', path: '/admin/content-manager' },
      { name: 'Interactive Map Manager', icon: 'fas fa-map', description: 'Edit interactive map data and regions', path: '/admin/interactive-map-manager' },
    ],
  },
  {
    name: 'Item Management',
    icon: 'fas fa-gem',
    tools: [
      { name: 'Item Roller', icon: 'fas fa-dice', description: 'Roll and distribute items', path: '/admin/item-roller' },
      { name: 'Item Manager', icon: 'fas fa-boxes', description: 'Create and edit item definitions', path: '/admin/item-manager' },
      { name: 'Item Image Manager', icon: 'fas fa-image', description: 'Manage item images and sprites', path: '/admin/item-image-manager' },
      { name: 'Antique Appraisal Editor', icon: 'fas fa-search-dollar', description: 'Edit antique appraisal values and items', path: '/admin/antique-appraisal-editor' },
    ],
  },
  {
    name: 'Monster-Trainer Management',
    icon: 'fas fa-paw',
    tools: [
      { name: 'Antique Auction Editor', icon: 'fas fa-gavel', description: 'Manage antique auction listings', path: '/admin/antique-auction-editor' },
      { name: 'Trainer Manager', icon: 'fas fa-user-edit', description: 'Edit and manage trainer profiles', path: '/admin/trainer-manager' },
      { name: 'Trainer Monster Manager', icon: 'fas fa-users-cog', description: 'Manage trainer-monster assignments', path: '/admin/trainer-monster-manager' },
      { name: 'Level Manager', icon: 'fas fa-chart-line', description: 'Manage leveling and experience', path: '/admin/level-manager' },
      { name: 'Trainer Inventory Editor', icon: 'fas fa-box-open', description: 'Manage trainer inventories and currency', path: '/admin/trainer-inventory-editor' },
      { name: 'Monster Roller', icon: 'fas fa-dice-d20', description: 'Roll monsters for encounters', path: '/admin/monster-roller' },
      { name: 'Starter Selection Test', icon: 'fas fa-flask', description: 'Test the starter selection flow without creating a trainer', path: '/admin/starter-test' },
    ],
  },
  {
    name: 'Reroller',
    icon: 'fas fa-sync-alt',
    tools: [
      { name: 'Reroller', icon: 'fas fa-sync-alt', description: 'Reroll monsters and items', path: '/admin/reroller' },
    ],
  },
  {
    name: 'Species Management',
    icon: 'fas fa-dna',
    tools: [
      { name: 'Yokai Watch', icon: 'fas fa-ghost', description: 'Manage Yokai Watch species', path: '/admin/species/yokai-watch' },
      { name: 'Pokemon', icon: 'fas fa-bolt', description: 'Manage Pokemon species', path: '/admin/species/pokemon' },
      { name: 'Nexomon', icon: 'fas fa-star', description: 'Manage Nexomon species', path: '/admin/species/nexomon' },
      { name: 'Pals', icon: 'fas fa-heart', description: 'Manage Pals species', path: '/admin/species/pals' },
      { name: 'Monster Hunter', icon: 'fas fa-shield-alt', description: 'Manage Monster Hunter species', path: '/admin/species/monster-hunter' },
      { name: 'Final Fantasy', icon: 'fas fa-hat-wizard', description: 'Manage Final Fantasy species', path: '/admin/species/final-fantasy' },
      { name: 'Fakemon', icon: 'fas fa-paint-brush', description: 'Manage Fakemon species', path: '/admin/species/fakemon' },
      { name: 'Digimon', icon: 'fas fa-microchip', description: 'Manage Digimon species', path: '/admin/species/digimon' },
    ],
  },
  {
    name: 'Submission Manager',
    icon: 'fas fa-inbox',
    tools: [
      { name: 'Submission Manager', icon: 'fas fa-inbox', description: 'Review and manage user submissions', path: '/admin/submission-manager' },
      { name: 'Prompt Manager', icon: 'fas fa-clipboard-list', description: 'Create and manage submission prompts and rewards', path: '/admin/prompt-manager' },
    ],
  },
  {
    name: 'User Manager',
    icon: 'fas fa-users',
    tools: [
      { name: 'User Manager', icon: 'fas fa-users', description: 'Manage user accounts and permissions', path: '/admin/user-manager' },
    ],
  },
  {
    name: 'Town Management',
    icon: 'fas fa-city',
    tools: [
      { name: 'Town Activities Editor', icon: 'fas fa-tasks', description: 'Edit town activities and rewards', path: '/admin/town-activities-editor' },
      { name: 'Shop Manager', icon: 'fas fa-store', description: 'Manage shops and inventory', path: '/admin/shop-manager' },
      { name: 'Garden Manager', icon: 'fas fa-seedling', description: 'View and manage user garden points', path: '/admin/garden-manager' },
      { name: 'Monthly Distribution', icon: 'fas fa-calendar-check', description: 'View and trigger monthly item distribution', path: '/admin/monthly-distribution' },
    ],
  },
];

type SortOrder = 'asc' | 'desc';

const AdminDashboardContent = () => {
  useDocumentTitle('Admin Dashboard');
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [activeCategories, setActiveCategories] = useState<Set<string>>(
    new Set(ADMIN_CATEGORIES.map(c => c.name))
  );

  const toggleCategory = (categoryName: string) => {
    setActiveCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryName)) {
        next.delete(categoryName);
      } else {
        next.add(categoryName);
      }
      return next;
    });
  };

  const selectAllCategories = () => {
    setActiveCategories(new Set(ADMIN_CATEGORIES.map(c => c.name)));
  };

  const clearAllCategories = () => {
    setActiveCategories(new Set());
  };

  const filteredCategories = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return ADMIN_CATEGORIES
      .filter(category => activeCategories.has(category.name))
      .map(category => {
        const filteredTools = category.tools
          .filter(tool => !query || tool.name.toLowerCase().includes(query))
          .sort((a, b) =>
            sortOrder === 'asc'
              ? a.name.localeCompare(b.name)
              : b.name.localeCompare(a.name)
          );

        return { ...category, tools: filteredTools };
      })
      .filter(category => category.tools.length > 0);
  }, [searchQuery, sortOrder, activeCategories]);

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <h1><i className="fas fa-shield-alt"></i> Admin Dashboard</h1>
        <p>Manage your game content, users, and settings</p>
      </div>

      <div className="admin-dashboard__controls">
        <div className="admin-dashboard__search">
          <i className="fas fa-search"></i>
          <input
            type="text"
            className="input"
            placeholder="Search tools..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <button
          className="button secondary sm"
          onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
        >
          <i className={`fas fa-sort-alpha-${sortOrder === 'asc' ? 'down' : 'up'}`}></i>
          {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
        </button>
      </div>

      <div className="admin-dashboard__filters">
        <span className="admin-dashboard__filters-label">Categories:</span>
        <button
          className="button ghost sm"
          onClick={selectAllCategories}
        >
          All
        </button>
        <button
          className="button ghost sm"
          onClick={clearAllCategories}
        >
          None
        </button>
        {ADMIN_CATEGORIES.map(category => (
          <button
            key={category.name}
            className={`admin-dashboard__chip ${activeCategories.has(category.name) ? 'admin-dashboard__chip--active' : ''}`}
            onClick={() => toggleCategory(category.name)}
          >
            <i className={category.icon}></i>
            {category.name}
          </button>
        ))}
      </div>

      <div className="admin-dashboard__categories">
        {filteredCategories.map(category => (
          <section key={category.name} className="admin-dashboard__category">
            <h2 className="admin-dashboard__category-title">
              <i className={category.icon}></i>
              {category.name}
            </h2>
            <div className="admin-dashboard__grid">
              {category.tools.map(tool => (
                <Card
                  key={tool.path}
                  title={tool.name}
                  subtitle={tool.description}
                  hoverable
                  onClick={() => navigate(tool.path)}
                  headerAction={<i className={`${tool.icon} admin-dashboard__tool-icon`}></i>}
                />
              ))}
            </div>
          </section>
        ))}

        {filteredCategories.length === 0 && (
          <div className="admin-dashboard__empty">
            <i className="fas fa-search"></i>
            <p>No tools match your search or filter criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const AdminDashboardPage = () => (
  <AdminRoute>
    <AdminDashboardContent />
  </AdminRoute>
);

export default AdminDashboardPage;
