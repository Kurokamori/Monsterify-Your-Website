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
          <Link to="/" className="logo-link">
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
            className="button ghost mobile-menu-button"
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
            <div className="dropdown-content dropdown-sectioned">
              <Link to="/guides">All Guides</Link>
              <div className="dropdown-section-header">Game Guides</div>
              <Link to="/guides/guides/Creating%20a%20Trainer/!Creating%20a%20Trainer.md" className="dropdown-sub-item">Creating a Trainer</Link>
              <Link to="/guides/guides/Monster%20Creation/Monster%20Design%20Guide.md" className="dropdown-sub-item">Monster Creation</Link>
              <Link to="/guides/guides/Submissions%20and%20Progression/!!Submitting%20Artwork.md" className="dropdown-sub-item">Submissions and Progression</Link>
              <Link to="/guides/guides/Table%20of%20Items/Items.md" className="dropdown-sub-item">Table of Items</Link>
              <Link to="/guides/guides/The%20Town%20Square/!index.md" className="dropdown-sub-item">Town Square</Link>
              <Link to="/guides/guides/General%20Rules.md" className="dropdown-sub-item">General Rules</Link>
              <Link to="/guides/lore" className="dropdown-mid-item">Lore</Link>
              <Link to="/guides/factions" className="dropdown-mid-item">Factions</Link>
              <Link to="/guides/npcs" className="dropdown-mid-item">NPCs</Link>
              <div className="dropdown-section-header">Tools</div>
              <Link to="/guides/type-calculator" className="dropdown-sub-item">Type Calculator</Link>
              <Link to="/guides/evolution-explorer" className="dropdown-sub-item">Evolution Explorer</Link>
              <Link to="/guides/ability-database" className="dropdown-sub-item">Ability Database</Link>
              <Link to="/guides/interactive-map" className="dropdown-sub-item">Interactive Map</Link>
            </div>
          </div>
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
          <Link to="/" className="logo-link">
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
          <button type="button" className="button primary" onClick={toggleMobileMenu}>
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
              <div className="mobile-dropdown-section-header">Game Guides</div>
              <Link to="/guides/guides/Creating%20a%20Trainer/!Creating%20a%20Trainer.md" className="mobile-nav-link mobile-sub-item" onClick={toggleMobileMenu}>Creating a Trainer</Link>
              <Link to="/guides/guides/Monster%20Creation/Monster%20Design%20Guide.md" className="mobile-nav-link mobile-sub-item" onClick={toggleMobileMenu}>Monster Creation</Link>
              <Link to="/guides/guides/Submissions%20and%20Progression/!!Submitting%20Artwork.md" className="mobile-nav-link mobile-sub-item" onClick={toggleMobileMenu}>Submissions and Progression</Link>
              <Link to="/guides/guides/Table%20of%20Items/Items.md" className="mobile-nav-link mobile-sub-item" onClick={toggleMobileMenu}>Table of Items</Link>
              <Link to="/guides/guides/The%20Town%20Square/!index.md" className="mobile-nav-link mobile-sub-item" onClick={toggleMobileMenu}>Town Square</Link>
              <Link to="/guides/guides/General%20Rules.md" className="mobile-nav-link mobile-sub-item" onClick={toggleMobileMenu}>General Rules</Link>
              <Link to="/guides/lore" className="mobile-nav-link" onClick={toggleMobileMenu}>Lore</Link>
              <Link to="/guides/factions" className="mobile-nav-link" onClick={toggleMobileMenu}>Factions</Link>
              <Link to="/guides/npcs" className="mobile-nav-link" onClick={toggleMobileMenu}>NPCs</Link>
              <div className="mobile-dropdown-section-header">Tools</div>
              <Link to="/guides/type-calculator" className="mobile-nav-link mobile-sub-item" onClick={toggleMobileMenu}>Type Calculator</Link>
              <Link to="/guides/evolution-explorer" className="mobile-nav-link mobile-sub-item" onClick={toggleMobileMenu}>Evolution Explorer</Link>
              <Link to="/guides/ability-database" className="mobile-nav-link mobile-sub-item" onClick={toggleMobileMenu}>Ability Database</Link>
              <Link to="/guides/interactive-map" className="mobile-nav-link mobile-sub-item" onClick={toggleMobileMenu}>Interactive Map</Link>
            </div>
          </div>

          <div className="mobile-dropdown">
            <button
              className="mobile-dropdown-toggle"
              onClick={() => toggleDropdown('submissions')}
            >
              Submissions <i className={`fas fa-chevron-${dropdownOpen.submissions ? 'up' : 'down'}`}></i>
            </button>
            <div className={`mobile-dropdown-content ${dropdownOpen.submissions ? 'active' : ''}`}>
              <Link to="/submissions?tab=gallery" className="mobile-nav-link" onClick={toggleMobileMenu}>Gallery</Link>
              <Link to="/submissions?tab=library" className="mobile-nav-link" onClick={toggleMobileMenu}>Library</Link>
              {isAuthenticated && (
                <>
                  <Link to="/submissions?tab=submit" className="mobile-nav-link" onClick={toggleMobileMenu}>Submit</Link>
                  <Link to="/submissions?tab=my-submissions" className="mobile-nav-link" onClick={toggleMobileMenu}>My Submissions</Link>
                </>
              )}
            </div>
          </div>

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
        <div className="footer-content">
          <div className="footer-section about">
            <h3>Dusk and Dawn</h3>
            <p className="tagline">A monster collecting art roleplaying game</p>
          </div>
          <div className="footer-section links">
            <h3>Quick Links</h3>
            <div className="footer-links-grid">
              <Link to="/">Home</Link>
              <Link to="/trainers">Trainers</Link>
              <Link to="/fakedex">Fakedex</Link>
              <Link to="/guides">Guides</Link>
              <Link to="/guides/locations">Locations</Link>
              <Link to="/guides/lore">Lore</Link>
              <Link to="/submissions">Submissions</Link>
            </div>
          </div>
          <div className="footer-section social">
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Dusk and Dawn. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
