import { ReactNode, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface AdminNavItem {
  path: string;
  icon: string;
  label: string;
  exactMatch?: boolean;
}

interface AdminNavSection {
  title: string;
  items: AdminNavItem[];
}

const NAV_SECTIONS: AdminNavSection[] = [
  {
    title: 'Main',
    items: [
      { path: '/admin', icon: 'fa-tachometer-alt', label: 'Dashboard', exactMatch: true }
    ]
  },
  {
    title: 'Core Management',
    items: [
      { path: '/admin/users', icon: 'fa-users', label: 'Users' },
      { path: '/admin/trainers', icon: 'fa-user-friends', label: 'Trainers' },
      { path: '/admin/monsters', icon: 'fa-dragon', label: 'Monsters' },
      { path: '/admin/fakemon', icon: 'fa-paw', label: 'Fakemon' },
      { path: '/admin/submissions', icon: 'fa-images', label: 'Submissions' },
      { path: '/admin/prompts', icon: 'fa-clipboard-list', label: 'Prompts' }
    ]
  },
  {
    title: 'Species Databases',
    items: [
      { path: '/admin/species/pokemon', icon: 'fa-paw', label: 'Pokemon' },
      { path: '/admin/species/digimon', icon: 'fa-robot', label: 'Digimon' },
      { path: '/admin/species/yokai-watch', icon: 'fa-ghost', label: 'Yokai' },
      { path: '/admin/species/nexomon', icon: 'fa-dragon', label: 'Nexomon' },
      { path: '/admin/species/pals', icon: 'fa-paw', label: 'Pals' },
      { path: '/admin/species/final-fantasy', icon: 'fa-hat-wizard', label: 'Final Fantasy' },
      { path: '/admin/species/monster-hunter', icon: 'fa-crosshairs', label: 'Monster Hunter' },
      { path: '/admin/species/fakemon', icon: 'fa-pencil-alt', label: 'Fakemon' }
    ]
  },
  {
    title: 'Tools',
    items: [
      { path: '/admin/seasonal-adopts', icon: 'fa-snowflake', label: 'Seasonal Adopts' },
      { path: '/admin/items', icon: 'fa-shopping-bag', label: 'Items' },
      { path: '/admin/shop-manager', icon: 'fa-store', label: 'Shop Manager' },
      { path: '/admin/level-management', icon: 'fa-level-up-alt', label: 'Level Management' },
      { path: '/admin/item-roller', icon: 'fa-dice', label: 'Item Roller' },
      { path: '/admin/monster-roller', icon: 'fa-dragon', label: 'Monster Roller' },
      { path: '/admin/reroller', icon: 'fa-gift', label: 'Reroller' }
    ]
  },
  {
    title: 'Adventure Management',
    items: [
      { path: '/admin/boss-manager', icon: 'fa-dragon', label: 'Boss Manager' },
      { path: '/admin/event-manager', icon: 'fa-calendar-alt', label: 'Event Manager' },
      { path: '/admin/discord-adventure-manager', icon: 'fa-compass', label: 'Adventures' },
      { path: '/admin/mission-content-manager', icon: 'fa-scroll', label: 'Missions' },
    ]
  },
  {
    title: 'Guide Management',
    items: [
      { path: '/admin/interactive-map-manager', icon: 'fa-map', label: 'Map Manager' },
      { path: '/admin/content-manager', icon: 'fa-file-alt', label: 'Content Manager' },
    ]
  }
];

interface AdminLayoutProps {
  children: ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = useCallback((path: string, exactMatch?: boolean): boolean => {
    if (exactMatch) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  }, [location.pathname]);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  return (
    <div className="admin-layout">
      <aside className="admin-layout__sidebar">
        <div className="admin-layout__header">
          <h2 className="admin-layout__title">Admin Panel</h2>
          <div className="admin-layout__user">
            <span>{currentUser?.display_name || currentUser?.username}</span>
          </div>
        </div>

        <nav className="admin-layout__nav">
          <ul className="admin-layout__menu">
            <li className="admin-layout__return">
              <Link to="/">
                <i className="fas fa-home"></i> Return to Main Site
              </Link>
            </li>

            {NAV_SECTIONS.map((section) => (
              <li key={section.title} className="admin-layout__section">
                <span className="admin-layout__section-title">{section.title}</span>
                <ul className="admin-layout__submenu">
                  {section.items.map((item) => (
                    <li
                      key={item.path}
                      className={isActive(item.path, item.exactMatch) ? 'admin-layout__item--active' : ''}
                    >
                      <Link to={item.path}>
                        <i className={`fas ${item.icon}`}></i> {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </nav>

        <div className="admin-layout__footer">
          <button className="button danger" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </aside>

      <main className="admin-layout__content">
        <div className="admin-layout__content-wrapper">
          {children}
        </div>
      </main>
    </div>
  );
};
