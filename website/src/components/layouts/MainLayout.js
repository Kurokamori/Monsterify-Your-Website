import React, { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AuthButtons from '../common/AuthButtons';
import ShopDropdown from '../shop/ShopDropdown';
import MobileShopLinks from '../shop/MobileShopLinks';

const MainLayout = () => {
  const { currentUser, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState({});

  // Close mobile menu when window is resized
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileMenuOpen]);

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    // Prevent scrolling when mobile menu is open
    document.body.style.overflow = !mobileMenuOpen ? 'hidden' : '';
  };

  // Toggle dropdown
  const toggleDropdown = (id) => {
    setDropdownOpen(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="app-container">
      {/* Top Navigation */}
      <nav className="top-nav">
        <div className="nav-left">
          <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
            <img
              src="/images/logo.png"
              alt="Logo"
              className="logo"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/160x40/1e2532/d6a339?text=Dusk+and+Dawn';
              }}
            />
          </Link>
          <button
            type="button"
            className="mobile-menu-button"
            onClick={toggleMobileMenu}
          >
            <i className="fas fa-bars"></i>
          </button>
          <Link to="/trainers" className="top-nav-link">Trainers</Link>
          <Link to="/fakedex" className="top-nav-link">Fakedex</Link>
          <div className="dropdown">
            <Link to="/guides" className="top-nav-link">
              Guides
              <span className="dropdown-arrow"></span>
            </Link>
            <div className="dropdown-content">
              <Link to="/guides">All Guides</Link>
              <Link to="/guides/guides">Game Guides</Link>
              <Link to="/guides/lore">Lore</Link>
              <Link to="/guides/factions">Factions</Link>
              <Link to="/guides/npcs">NPCs</Link>
              <Link to="/guides/interactive-map">Interactive Map</Link>
              <Link to="/guides/type-calculator">Type Calculator</Link>
              <Link to="/guides/evolution-explorer">Evolution Explorer</Link>
            </div>
          </div>
          <Link to="/gallery" className="top-nav-link">Gallery</Link>
          <Link to="/library" className="top-nav-link">Library</Link>
          <div className="nav-divider"></div>
          {isAuthenticated && (
            <>
              <ShopDropdown />
              <div className="dropdown">
                <span className="top-nav-link">
                  Town
                  <span className="dropdown-arrow"></span>
                </span>
                <div className="dropdown-content">
                  <Link to="/town/apothecary">Apothecary</Link>
                  <Link to="/town/bakery">Bakery</Link>
                  <Link to="/town/visit/witchs_hut">Witch's Hut</Link>
                  <Link to="/town/mega-mart">Mega Mart</Link>
                  <Link to="/town/visit/antique-store">Antique Store</Link>
                  <Link to="/town/nursery">Nursery</Link>
                  <Link to="/town/activities/pirates-dock">Pirate's Dock</Link>
                  <Link to="/town/activities/garden">Garden</Link>
                  <Link to="/town/visit/game_corner">Game Corner</Link>
                  <Link to="/town/activities/farm">Farm</Link>
                  <Link to="/town/adoption">Adoption Center</Link>
                  <Link to="/town/trade">Trade Center</Link>
                  <Link to="/town/bazar">Bazzar</Link>
                </div>
              </div>
              <div className="dropdown">
                <span className="top-nav-link">
                  Adventures
                  <span className="dropdown-arrow"></span>
                </span>
                <div className="dropdown-content">
                  <Link to="/adventures">Adventures</Link>
                  <Link to="/adventures/event/current">Events</Link>
                  <Link to="/adventures/missions">Missions</Link>
                  <Link to="/adventures/faction-quests">Faction Quests</Link>
                  <Link to="/adventures/boss">Boss</Link>
                </div>
              </div>
              
            </>
          )}
        </div>
        <div className="nav-right">
          <AuthButtons />
        </div>
      </nav>

      {/* Mobile Navigation Menu */}
      <div className={`mobile-nav ${mobileMenuOpen ? 'active' : ''}`}>
        <div className="mobile-nav-header">
          <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
            <img
              src="/images/logo.png"
              alt="Logo"
              className="logo"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/160x40/1e2532/d6a339?text=Monsterify';
              }}
            />
          </Link>
          <button type="button" className="mobile-nav-close" onClick={toggleMobileMenu}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="mobile-nav-links">
          <Link to="/trainers" className="mobile-nav-link" onClick={toggleMobileMenu}>Trainers</Link>
          <Link to="/fakedex" className="mobile-nav-link" onClick={toggleMobileMenu}>Fakedex</Link>

          <div className="mobile-dropdown">
            <button
              className="mobile-dropdown-toggle"
              onClick={() => toggleDropdown('guides')}
            >
              Guides <i className={`fas fa-chevron-${dropdownOpen.guides ? 'up' : 'down'}`}></i>
            </button>
            <div className={`mobile-dropdown-content ${dropdownOpen.guides ? 'active' : ''}`}>
              <Link to="/guides" className="mobile-nav-link" onClick={toggleMobileMenu}>All Guides</Link>
              <Link to="/guides/guides" className="mobile-nav-link" onClick={toggleMobileMenu}>Game Guides</Link>
              <Link to="/guides/interactive-map" className="mobile-nav-link" onClick={toggleMobileMenu}>Interactive Map</Link>
              <Link to="/guides/type-calculator" className="mobile-nav-link" onClick={toggleMobileMenu}>Type Calculator</Link>
              <Link to="/guides/evolution-explorer" className="mobile-nav-link" onClick={toggleMobileMenu}>Evolution Explorer</Link>
              <Link to="/guides/lore" className="mobile-nav-link" onClick={toggleMobileMenu}>Lore</Link>
              <Link to="/guides/factions" className="mobile-nav-link" onClick={toggleMobileMenu}>Factions</Link>
              <Link to="/guides/npcs" className="mobile-nav-link" onClick={toggleMobileMenu}>NPCs</Link>
            </div>
          </div>

          <Link to="/gallery" className="mobile-nav-link" onClick={toggleMobileMenu}>Gallery</Link>
          <Link to="/library" className="mobile-nav-link" onClick={toggleMobileMenu}>Library</Link>

          {isAuthenticated && (
            <>


              <div className="mobile-dropdown">
                <button
                  className="mobile-dropdown-toggle"
                  onClick={() => toggleDropdown('markets')}
                >
                  Markets <i className={`fas fa-chevron-${dropdownOpen.markets ? 'up' : 'down'}`}></i>
                </button>
                <div className={`mobile-dropdown-content ${dropdownOpen.markets ? 'active' : ''}`}>
                  <MobileShopLinks toggleMobileMenu={toggleMobileMenu} />
                </div>
              </div>

              <div className="mobile-dropdown">
                <button
                  className="mobile-dropdown-toggle"
                  onClick={() => toggleDropdown('town')}
                >
                  Town <i className={`fas fa-chevron-${dropdownOpen.town ? 'up' : 'down'}`}></i>
                </button>
                <div className={`mobile-dropdown-content ${dropdownOpen.town ? 'active' : ''}`}>
                  <Link to="/town/apothecary" className="mobile-nav-link" onClick={toggleMobileMenu}>Apothecary</Link>
                  <Link to="/town/bakery" className="mobile-nav-link" onClick={toggleMobileMenu}>Bakery</Link>
                  <Link to="/town/visit/witchs_hut" className="mobile-nav-link" onClick={toggleMobileMenu}>Witch's Hut</Link>
                  <Link to="/town/mega-mart" className="mobile-nav-link" onClick={toggleMobileMenu}>Mega Mart</Link>
                  <Link to="/town/visit/antique-store" className="mobile-nav-link" onClick={toggleMobileMenu}>Antique Store</Link>
                  <Link to="/town/nursery" className="mobile-nav-link" onClick={toggleMobileMenu}>Nursery</Link>
                  <Link to="/town/activities/pirates-dock" className="mobile-nav-link" onClick={toggleMobileMenu}>Pirate's Dock</Link>
                  <Link to="/town/activities/garden" className="mobile-nav-link" onClick={toggleMobileMenu}>Garden</Link>
                  <Link to="/town/visit/game_corner" className="mobile-nav-link" onClick={toggleMobileMenu}>Game Corner</Link>
                  <Link to="/town/activities/farm" className="mobile-nav-link" onClick={toggleMobileMenu}>Farm</Link>
                  <Link to="/town/adoption" className="mobile-nav-link" onClick={toggleMobileMenu}>Adoption Center</Link>
                  <Link to="/town/trade" className="mobile-nav-link" onClick={toggleMobileMenu}>Trade Center</Link>
                </div>
              </div>

              <div className="mobile-dropdown">
                <button
                  className="mobile-dropdown-toggle"
                  onClick={() => toggleDropdown('adventures')}
                >
                  Adventures <i className={`fas fa-chevron-${dropdownOpen.adventures ? 'up' : 'down'}`}></i>
                </button>
                <div className={`mobile-dropdown-content ${dropdownOpen.adventures ? 'active' : ''}`}>
                  <Link to="/adventures" className="mobile-nav-link" onClick={toggleMobileMenu}>Adventures</Link>
                  <Link to="/adventures/event/current" className="mobile-nav-link" onClick={toggleMobileMenu}>Events</Link>
                  <Link to="/adventures/missions" className="mobile-nav-link" onClick={toggleMobileMenu}>Missions</Link>
                  <Link to="/adventures/faction-quests" className="mobile-nav-link" onClick={toggleMobileMenu}>Faction Quests</Link>
                  <Link to="/adventures/boss" className="mobile-nav-link" onClick={toggleMobileMenu}>Boss</Link>
                </div>
              </div>

            </>
          )}

          <div className="mobile-nav-auth">
            <AuthButtons onLogout={toggleMobileMenu} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content" style={{ gap: '1rem' }}>
          <div className="footer-section" style={{ flex: '2' }}>
            <h3>Dusk and Dawn</h3>
            <p style={{ fontSize: '0.85rem', margin: '0' }}>A monster collecting art roleplaying game</p>
          </div>
          <div className="footer-section" style={{ flex: '3' }}>
            <h3>Quick Links</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1rem' }}>
              <Link to="/">Home</Link>
              <Link to="/trainers">Trainers</Link>
              <Link to="/fakedex">Fakedex</Link>
              <Link to="/guides">Guides</Link>
              <Link to="/guides/locations">Locations</Link>
              <Link to="/guides/lore">Lore</Link>
              <Link to="/gallery">Gallery</Link>
              <Link to="/library">Library</Link>
            </div>
          </div>
          <div className="footer-section" style={{ flex: '2' }}>
                      </div>
        </div>
        <div className="footer-bottom">
          <p style={{ margin: '0' }}>&copy; {new Date().getFullYear()} Dusk and Dawn. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
