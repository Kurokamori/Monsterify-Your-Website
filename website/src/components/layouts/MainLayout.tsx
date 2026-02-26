import { useState, useEffect, useCallback } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AuthButtons } from '../common/AuthButtons';
import chatService from '../../services/chatService';
import chatSocketService from '../../services/chatSocketService';

interface DropdownState {
  [key: string]: boolean;
}

interface NavLink {
  to: string;
  label: string;
  subItem?: boolean;
  midItem?: boolean;
}

const GUIDES_LINKS: (NavLink | { sectionHeader: string })[] = [
  { to: '/guides', label: 'All Guides' },
  { sectionHeader: 'Game Guides' },
  { to: '/guides/guides/Creating%20a%20Trainer/!Creating%20a%20Trainer.md', label: 'Creating a Trainer', subItem: true },
  { to: '/guides/guides/Monster%20Creation/Monster%20Design%20Guide.md', label: 'Monster Creation', subItem: true },
  { to: '/guides/guides/Submissions%20and%20Progression/!!Submitting%20Artwork.md', label: 'Submissions and Progression', subItem: true },
  { to: '/guides/guides/Table%20of%20Items/Items.md', label: 'Table of Items', subItem: true },
  { to: '/guides/guides/The%20Town%20Square/!index.md', label: 'Town Square', subItem: true },
  { to: '/guides/guides/General%20Rules.md', label: 'General Rules', subItem: true },
  { to: '/guides/lore', label: 'Lore', midItem: true },
  { to: '/guides/factions', label: 'Factions', midItem: true },
  { to: '/guides/npcs', label: 'NPCs', midItem: true },
  { sectionHeader: 'Tools' },
  { to: '/guides/type-calculator', label: 'Type Calculator', subItem: true },
  { to: '/guides/evolution-explorer', label: 'Evolution Explorer', subItem: true },
  { to: '/guides/ability-database', label: 'Ability Database', subItem: true },
  { to: '/guides/species-database', label: 'Species Database', subItem: true },
  { to: '/under-construction', label: 'Interactive Map', subItem: true }
];

const MARKET_LINKS: NavLink[] = [
  { to: '/town/market', label: 'All Shops' },
  { to: '/town/market/apothecary', label: 'Apothecary' },
  { to: '/town/market/bakery', label: 'Bakery' },
  { to: '/town/market/witchs_hut', label: "Witch's Hut" },
  { to: '/town/market/megamart', label: 'Mega Mart' },
  { to: '/town/market/antique_store', label: 'Antique Store' },
  { to: '/town/market/nursery', label: 'Nursery' },
  { to: '/town/market/pirates_dock', label: "Pirate's Dock" },
];

const TOWN_LINKS: NavLink[] = [
  { to: '/town', label: 'All Locations' },
  { to: '/town/apothecary', label: 'Apothecary' },
  { to: '/town/bakery', label: 'Bakery' },
  { to: '/town/visit/witchs-hut', label: "Witch's Hut" },
  { to: '/town/mega-mart', label: 'Mega Mart' },
  { to: '/town/visit/antique-store', label: 'Antique Store' },
  { to: '/town/activities/nursery', label: 'Nursery' },
  { to: '/town/activities/pirates-dock', label: "Pirate's Dock" },
  { to: '/town/activities/garden', label: 'Garden' },
  { to: '/town/activities/game-corner', label: 'Game Corner' },
  { to: '/town/activities/farm', label: 'Farm' },
  { to: '/town/adoption', label: 'Adoption Center' },
  { to: '/town/trade', label: 'Trade Center' },
  { to: '/town/bazar', label: 'Bazzar' },
];

const ADVENTURES_LINKS: NavLink[] = [
  { to: '/adventures', label: 'Adventures' },
  { to: '/adventures?tab=events', label: 'Events' },
  { to: '/adventures?tab=missions', label: 'Missions' },
  { to: '/adventures?tab=boss', label: 'Boss' },
  { to: '/adventures?tab=faction-quests', label: 'Faction Quests' },
];

export const MainLayout = () => {
  const { isAuthenticated, currentUser } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<DropdownState>({});
  const [totalUnread, setTotalUnread] = useState(0);
  const location = useLocation();

  // Fetch total unread count if chat notifications are enabled
  const chatNotificationsEnabled = currentUser?.notification_settings?.chat_notifications;

  const fetchUnread = useCallback(() => {
    if (!isAuthenticated || !chatNotificationsEnabled) return;
    chatService.getTotalUnread()
      .then(setTotalUnread)
      .catch(() => setTotalUnread(0));
  }, [isAuthenticated, chatNotificationsEnabled]);

  // Poll unread count and listen to socket for realtime updates
  useEffect(() => {
    if (!isAuthenticated || !chatNotificationsEnabled) {
      setTotalUnread(0);
      return;
    }

    fetchUnread();
    const interval = setInterval(fetchUnread, 60000);

    // Listen to socket room:updated events to bump the badge immediately
    chatSocketService.connect();
    const handleRoomUpdate = () => {
      // A new message arrived somewhere — re-fetch the accurate count
      // Small delay to let the backend update last_message_at first
      setTimeout(fetchUnread, 500);
    };
    chatSocketService.onRoomUpdate(handleRoomUpdate);

    return () => {
      clearInterval(interval);
      chatSocketService.offRoomUpdate(handleRoomUpdate);
      chatSocketService.disconnect();
    };
  }, [isAuthenticated, chatNotificationsEnabled, fetchUnread]);

  // Re-fetch unread when navigating away from group chats (to pick up markRead changes)
  useEffect(() => {
    if (!isAuthenticated || !chatNotificationsEnabled) return;
    if (!location.pathname.startsWith('/toys/group-chats')) {
      fetchUnread();
    }
  }, [location.pathname, isAuthenticated, chatNotificationsEnabled, fetchUnread]);

  // Listen for explicit unread-changed events from chat components
  useEffect(() => {
    if (!isAuthenticated || !chatNotificationsEnabled) return;
    const handler = () => fetchUnread();
    window.addEventListener('chat:unread-changed', handler);
    return () => window.removeEventListener('chat:unread-changed', handler);
  }, [isAuthenticated, chatNotificationsEnabled, fetchUnread]);

  // Close mobile menu when window is resized
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && mobileMenuOpen) {
        setMobileMenuOpen(false);
        document.body.style.overflow = '';
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileMenuOpen]);

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen(prev => {
      const newState = !prev;
      document.body.style.overflow = newState ? 'hidden' : '';
      return newState;
    });
  }, []);

  const toggleDropdown = useCallback((id: string) => {
    setDropdownOpen(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
    document.body.style.overflow = '';
  }, []);

  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement;
    img.onerror = null;
    img.src = 'https://via.placeholder.com/160x40/1e2532/d6a339?text=Dusk+and+Dawn';
  }, []);

  const renderNavLink = (link: NavLink | { sectionHeader: string }, onClick?: () => void, mobile = false) => {
    if ('sectionHeader' in link) {
      return (
        <div key={link.sectionHeader} className="dropdown-section-header">
          {link.sectionHeader}
        </div>
      );
    }

    const className = mobile
      ? `mobile-nav-link${link.subItem ? ' mobile-sub-item' : ''}`
      : `${link.subItem ? 'dropdown-sub-item' : ''}${link.midItem ? 'dropdown-mid-item' : ''}`;

    return (
      <Link
        key={link.to}
        to={link.to}
        className={className || undefined}
        onClick={onClick}
      >
        {link.label}
      </Link>
    );
  };

  return (
    <div className="app-container">
      {/* Top Navigation */}
      <nav className="top-nav">
        <div className="nav-left">
          <Link to="/" className="logo-link">
            <img
              src="/images/logo.png"
              alt="Logo"
              className="logo"
              onError={handleImageError}
            />
          </Link>
          <button
            type="button"
            className="button ghost mobile-menu-button"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            <i className="fas fa-bars"></i>
            {totalUnread > 0 && (
              <span className="mobile-menu-badge">{totalUnread}</span>
            )}
          </button>
          <Link to="/trainers" className="top-nav-link">Trainers</Link>
          <Link to="/fakedex" className="top-nav-link">Fakedex</Link>

          {/* Guides Dropdown */}
          <div className="dropdown">
            <Link to="/guides" className="top-nav-link">
              Guides
              <span className="dropdown-arrow"></span>
            </Link>
            <div className="dropdown-content dropdown-sectioned">
              {GUIDES_LINKS.map(link => renderNavLink(link))}
            </div>
          </div>

          {/* Submissions Dropdown */}
          <div className="dropdown">
            <Link to="/submissions" className="top-nav-link">
              Submissions
              <span className="dropdown-arrow"></span>
            </Link>
            <div className="dropdown-content">
              <Link to="/submissions?tab=gallery">Gallery</Link>
              <Link to="/submissions?tab=library">Library</Link>
              {isAuthenticated && (
                <>
                  <Link to="/submissions?tab=submit">Submit</Link>
                  <Link to="/submissions?tab=my-submissions">My Submissions</Link>
                </>
              )}
            </div>
          </div>

          <div className="nav-divider"></div>

          {isAuthenticated && (
            <>
              {/* Markets Dropdown */}
              <div className="dropdown">
                <Link to="/town/market" className="top-nav-link">
                  Markets
                  <span className="dropdown-arrow"></span>
                </Link>
                <div className="dropdown-content">
                  {MARKET_LINKS.map(link => (
                    <Link key={link.to} to={link.to}>{link.label}</Link>
                  ))}
                </div>
              </div>

              {/* Town Dropdown */}
              <div className="dropdown">
                <Link to="/town" className="top-nav-link">
                  Town
                  <span className="dropdown-arrow"></span>
                </Link>
                <div className="dropdown-content">
                  {TOWN_LINKS.map(link => (
                    <Link key={link.to} to={link.to}>{link.label}</Link>
                  ))}
                </div>
              </div>

              {/* Adventures Dropdown */}
              <div className="dropdown">
                <span className="top-nav-link">
                  Adventures
                  <span className="dropdown-arrow"></span>
                </span>
                <div className="dropdown-content">
                  {ADVENTURES_LINKS.map(link => (
                    <Link key={link.to} to={link.to}>{link.label}</Link>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        <div className="nav-right">
          <AuthButtons totalUnread={totalUnread} />
        </div>
      </nav>

      {/* Mobile Navigation Menu */}
      <div className={`mobile-nav ${mobileMenuOpen ? 'active' : ''}`}>
        <div className="mobile-nav__header">
          <Link to="/" className="logo-link" onClick={closeMobileMenu}>
            <img
              src="/images/logo.png"
              alt="Logo"
              className="logo"
              onError={handleImageError}
            />
          </Link>
          <button type="button" className="button primary no-flex" onClick={toggleMobileMenu}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="mobile-nav__content">
          <Link to="/trainers" className="mobile-nav-link" onClick={closeMobileMenu}>Trainers</Link>
          <Link to="/fakedex" className="mobile-nav-link" onClick={closeMobileMenu}>Fakedex</Link>

          {/* Mobile Guides Dropdown */}
          <div className="mobile-dropdown">
            <button
              className="mobile-nav-link"
              onClick={() => toggleDropdown('guides')}
            >
              Guides <i className={`fas fa-chevron-${dropdownOpen.guides ? 'up' : 'down'}`}></i>
            </button>
            <div className={`mobile-dropdown-content ${dropdownOpen.guides ? 'active' : ''}`}>
              {GUIDES_LINKS.map(link => renderNavLink(link, closeMobileMenu, true))}
            </div>
          </div>

          {/* Mobile Submissions Dropdown */}
          <div className="mobile-dropdown">
            <button
              className="mobile-nav-link"
              onClick={() => toggleDropdown('submissions')}
            >
              Submissions <i className={`fas fa-chevron-${dropdownOpen.submissions ? 'up' : 'down'}`}></i>
            </button>
            <div className={`mobile-dropdown-content ${dropdownOpen.submissions ? 'active' : ''}`}>
              <Link to="/submissions?tab=gallery" className="mobile-nav-link" onClick={closeMobileMenu}>Gallery</Link>
              <Link to="/submissions?tab=library" className="mobile-nav-link" onClick={closeMobileMenu}>Library</Link>
              {isAuthenticated && (
                <>
                  <Link to="/submissions?tab=submit" className="mobile-nav-link" onClick={closeMobileMenu}>Submit</Link>
                  <Link to="/submissions?tab=my-submissions" className="mobile-nav-link" onClick={closeMobileMenu}>My Submissions</Link>
                </>
              )}
            </div>
          </div>

          {isAuthenticated && (
            <>
              {/* Mobile Markets Dropdown */}
              <div className="mobile-dropdown">
                <button
                  className="mobile-nav-link"
                  onClick={() => toggleDropdown('markets')}
                >
                  Markets <i className={`fas fa-chevron-${dropdownOpen.markets ? 'up' : 'down'}`}></i>
                </button>
                <div className={`mobile-dropdown-content ${dropdownOpen.markets ? 'active' : ''}`}>
                  {MARKET_LINKS.map(link => (
                    <Link key={link.to} to={link.to} className="mobile-nav-link" onClick={closeMobileMenu}>
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Mobile Town Dropdown */}
              <div className="mobile-dropdown">
                <button
                  className="mobile-nav-link"
                  onClick={() => toggleDropdown('town')}
                >
                  Town <i className={`fas fa-chevron-${dropdownOpen.town ? 'up' : 'down'}`}></i>
                </button>
                <div className={`mobile-dropdown-content ${dropdownOpen.town ? 'active' : ''}`}>
                  {TOWN_LINKS.map(link => (
                    <Link key={link.to} to={link.to} className="mobile-nav-link" onClick={closeMobileMenu}>
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Mobile Adventures Dropdown */}
              <div className="mobile-dropdown">
                <button
                  className="mobile-nav-link"
                  onClick={() => toggleDropdown('adventures')}
                >
                  Adventures <i className={`fas fa-chevron-${dropdownOpen.adventures ? 'up' : 'down'}`}></i>
                </button>
                <div className={`mobile-dropdown-content ${dropdownOpen.adventures ? 'active' : ''}`}>
                  {ADVENTURES_LINKS.map(link => (
                    <Link key={link.to} to={link.to} className="mobile-nav-link" onClick={closeMobileMenu}>
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="mobile-nav__auth">
            <AuthButtons onLogout={closeMobileMenu} totalUnread={totalUnread} />
          </div>
        </div>
      </div>

      {/* Admin Nav Bar */}
      {currentUser?.is_admin && (
        <div className="admin-nav-bar">
          <span className="admin-nav-bar__label"><i className="fas fa-shield-alt"></i> Admin</span>
          <Link to="/admin">Dashboard</Link>
          <span className="admin-nav-bar__divider" />
          <Link to="/admin/submission-manager">Submissions</Link>
          <Link to="/admin/user-manager">Users</Link>
          <Link to="/admin/item-manager">Items</Link>
          <Link to="/admin/trainer-manager">Trainers</Link>
        </div>
      )}

      {/* Main Content */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer__content">
          <div className="footer__section">
            <h3>Dusk and Dawn</h3>
            <p className="footer__tagline">A monster collecting art roleplaying game</p>
          </div>
          <div className="footer__section">
            <h3>Quick Links</h3>
            <div className="footer__links-grid">
              <Link to="/">Home</Link>
              <Link to="/trainers">Trainers</Link>
              <Link to="/fakedex">Fakedex</Link>
              <Link to="/guides">Guides</Link>
              <Link to="/guides/locations">Locations</Link>
              <Link to="/guides/lore">Lore</Link>
              <Link to="/submissions">Submissions</Link>
            </div>
          </div>
          <div className="footer__section">
            {/* Social links can be added here */}
          </div>
        </div>
        <div className="footer__bottom">
          <p>&copy; {new Date().getFullYear()} Dusk and Dawn. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
