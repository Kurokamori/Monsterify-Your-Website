import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Shop from '../../components/town/Shop';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import Nursery from './locations/Nursery';
import TradeCenter from './locations/TradeCenter';
import AutomatedTradeCenter from './locations/AutomatedTradeCenter';
import MegaMart from './locations/MegaMart';
import Bazar from './locations/Bazar';
import Garden from './activities/Garden';
import GardenHarvestPage from './activities/GardenHarvest';
import Farm from './activities/Farm';
import PiratesDock from './activities/PiratesDock';
import GameCorner from './visit/GameCorner';
import WitchsHut from './visit/WitchsHut';
import AntiqueStore from './visit/AntiqueStore';
import ActivitySession from './activities/ActivitySession';
import ActivityRewards from './activities/ActivityRewards';

const TownPage = ({ children, currentLocation: propCurrentLocation }) => {
  useDocumentTitle('Town');
  
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading] = useState(false);
  const [error, setError] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(propCurrentLocation || 'town-square');

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }

    // If propCurrentLocation is provided, use it
    if (propCurrentLocation) {
      setCurrentLocation(propCurrentLocation);
      return;
    }

    // Otherwise determine current location from URL
    const path = location.pathname;
    if (path.includes('/adoption')) {
      setCurrentLocation('adoption');
    } else if (path.includes('/shop')) {
      setCurrentLocation('shop');
    } else if (path.includes('/nursery')) {
      setCurrentLocation('nursery');
    } else if (path.includes('/trade')) {
      setCurrentLocation('trade');
    } else if (path.includes('/garden') || path.includes('/activities/garden')) {
      setCurrentLocation('garden');
    } else if (path.includes('/farm') || path.includes('/activities/farm')) {
      setCurrentLocation('farm');
    } else if (path.includes('/pirates-dock') || path.includes('/activities/pirates-dock')) {
      setCurrentLocation('pirates-dock');
    } else if (path.includes('/game-corner') || path.includes('/game_corner') || path.includes('/visit/game_corner')) {
      setCurrentLocation('game-corner');
    } else if (path.includes('/witchs_hut') || path.includes('/visit/witchs_hut')) {
      setCurrentLocation('witchs-hut');
    } else if (path.includes('/antique-store') || path.includes('/visit/antique-store')) {
      setCurrentLocation('antique-store');
    } else if (path.includes('/apothecary')) {
      setCurrentLocation('apothecary');
    } else if (path.includes('/bakery')) {
      setCurrentLocation('bakery');
    } else if (path.includes('/mega-mart')) {
      setCurrentLocation('mega-mart');
    } else {
      setCurrentLocation('town-square');
    }
  }, [isAuthenticated, location, navigate, propCurrentLocation]);

  if (loading) {
    return <LoadingSpinner message="Loading town..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        message={error}
        onRetry={() => setError(null)}
      />
    );
  }

  return (
    <div className="town-container">

      <div className="town-content">
        {children ? (
          children
        ) : propCurrentLocation === 'mega-mart' ? (
          <MegaMart />
        ) : propCurrentLocation === 'bazar' ? (
          <Bazar />
        ) : propCurrentLocation === 'trade' ? (
          <AutomatedTradeCenter />
        ) : propCurrentLocation === 'automated-trade' ? (
          <AutomatedTradeCenter />
        ) : propCurrentLocation === 'nursery' ? (
          <Nursery />
        ) : (
          <Routes>
            <Route index element={<TownSquare />} />
            {/* Adoption Center is now handled by AdoptionCenterPage */}
            <Route path="shop" element={<Shop />} />
            <Route path="nursery" element={<Nursery />} />
            <Route path="trade" element={<AutomatedTradeCenter />} />
            <Route path="automated-trade" element={<AutomatedTradeCenter />} />
            <Route path="activities/garden" element={<Garden />} />
            <Route path="activities/garden/harvest" element={<GardenHarvestPage />} />
            <Route path="activities/farm" element={<Farm />} />
            <Route path="activities/pirates-dock" element={<PiratesDock />} />
            <Route path="visit/game_corner" element={<GameCorner />} />
            <Route path="visit/witchs_hut" element={<WitchsHut />} />
            <Route path="visit/antique-store" element={<AntiqueStore />} />
            <Route path="mega-mart" element={<MegaMart />} />
            <Route path="activities/session/:sessionId" element={<ActivitySession />} />
            <Route path="activities/rewards/:sessionId" element={<ActivityRewards />} />
            {/* Add route for session ID that should render ActivityRewards */}
            <Route path="activities/session/:sessionId/rewards" element={<ActivityRewards />} />
            {/* Add direct routes for backward compatibility */}
            <Route path="garden" element={<Garden />} />
            <Route path="farm" element={<Farm />} />
            <Route path="pirates-dock" element={<PiratesDock />} />
            <Route path="game_corner" element={<GameCorner />} />
            <Route path="witchs_hut" element={<WitchsHut />} />
            <Route path="antique-store" element={<AntiqueStore />} />
          </Routes>
        )}
      </div>

      <div className="town-map-container">
        <div className="town-map">
          <div className={`town-location ${currentLocation === 'town-square' ? 'active' : ''}`}>
            <Link to="/town" className="location-icon">
              <i className="fas fa-monument"></i>
            </Link>
            <span className="location-name">Town Square</span>
          </div>

          <div className={`town-location ${currentLocation === 'adoption' ? 'active' : ''}`}>
            <Link to="/town/adoption" className="location-icon">
              <i className="fas fa-home"></i>
            </Link>
            <span className="location-name">Adoption Center</span>
          </div>

          <div className={`town-location ${currentLocation === 'shop' ? 'active' : ''}`}>
            <Link to="/town/shop" className="location-icon">
              <i className="fas fa-store"></i>
            </Link>
            <span className="location-name">Shop</span>
          </div>

          <div className={`town-location ${currentLocation === 'nursery' ? 'active' : ''}`}>
            <Link to="/town/nursery" className="location-icon">
              <i className="fas fa-egg"></i>
            </Link>
            <span className="location-name">Nursery</span>
          </div>

          <div className={`town-location ${currentLocation === 'trade' ? 'active' : ''}`}>
            <Link to="/town/trade" className="location-icon">
              <i className="fas fa-exchange-alt"></i>
            </Link>
            <span className="location-name">Trade Center</span>
          </div>

          <div className={`town-location ${currentLocation === 'garden' ? 'active' : ''}`}>
            <Link to="/town/activities/garden" className="location-icon">
              <i className="fas fa-seedling"></i>
            </Link>
            <span className="location-name">Garden</span>
          </div>

          <div className={`town-location ${currentLocation === 'farm' ? 'active' : ''}`}>
            <Link to="/town/activities/farm" className="location-icon">
              <i className="fas fa-tractor"></i>
            </Link>
            <span className="location-name">Farm</span>
          </div>

          <div className={`town-location ${currentLocation === 'pirates-dock' ? 'active' : ''}`}>
            <Link to="/town/activities/pirates-dock" className="location-icon">
              <i className="fas fa-anchor"></i>
            </Link>
            <span className="location-name">Pirate's Dock</span>
          </div>

          <div className={`town-location ${currentLocation === 'game-corner' ? 'active' : ''}`}>
            <Link to="/town/visit/game_corner" className="location-icon">
              <i className="fas fa-gamepad"></i>
            </Link>
            <span className="location-name">Game Corner</span>
          </div>

          <div className={`town-location ${currentLocation === 'apothecary' ? 'active' : ''}`}>
            <Link to="/town/apothecary" className="location-icon">
              <i className="fas fa-mortar-pestle"></i>
            </Link>
            <span className="location-name">Apothecary</span>
          </div>

          <div className={`town-location ${currentLocation === 'bakery' ? 'active' : ''}`}>
            <Link to="/town/bakery" className="location-icon">
              <i className="fas fa-cookie"></i>
            </Link>
            <span className="location-name">Bakery</span>
          </div>

          <div className={`town-location ${currentLocation === 'witchs-hut' ? 'active' : ''}`}>
            <Link to="/town/visit/witchs_hut" className="location-icon">
              <i className="fas fa-hat-wizard"></i>
            </Link>
            <span className="location-name">Witch's Hut</span>
          </div>

          <div className={`town-location ${currentLocation === 'mega-mart' ? 'active' : ''}`}>
            <Link to="/town/mega-mart" className="location-icon">
              <i className="fas fa-shopping-basket"></i>
            </Link>
            <span className="location-name">Mega Mart</span>
          </div>

          <div className={`town-location ${currentLocation === 'antique-store' ? 'active' : ''}`}>
            <Link to="/town/visit/antique-store" className="location-icon">
              <i className="fas fa-gem"></i>
            </Link>
            <span className="location-name">Antique Store</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Town Square Component
const TownSquare = () => {
  return (
    <div className="town-square">
      <div className="town-welcome">
        <h2>Welcome to Aurora Town</h2>
        <p>
          Aurora Town is a bustling hub for trainers from all regions. Here you can adopt new monsters,
          purchase items, breed your monsters, trade with other trainers, and participate in various activities
          to earn rewards.
        </p>
      </div>

      <div className="town-sections">
        <div className="town-section">
          <h3>Places to Visit</h3>
          <div className="town-places">
            <Link to="/town/adoption" className="town-place-card">
              <div className="place-icon">
                <i className="fas fa-home"></i>
              </div>
              <div className="place-info">
                <h4>Adoption Center</h4>
                <p>Adopt new monsters to join your team</p>
              </div>
            </Link>

            <Link to="/town/nursery" className="town-place-card">
              <div className="place-icon">
                <i className="fas fa-egg"></i>
              </div>
              <div className="place-info">
                <h4>Nursery</h4>
                <p>Breed your monsters to get eggs</p>
              </div>
            </Link>

            <Link to="/town/trade" className="town-place-card">
              <div className="place-icon">
                <i className="fas fa-bolt"></i>
              </div>
              <div className="place-info">
                <h4>Trade Center</h4>
                <p>Execute instant trades between any trainers</p>
              </div>
            </Link>
          </div>
        </div>

        <div className="town-section">
          <h3>Daily Activities</h3>
          <div className="town-places">
            <Link to="/town/activities/garden" className="town-place-card">
              <div className="place-icon">
                <i className="fas fa-seedling"></i>
              </div>
              <div className="place-info">
                <h4>Garden</h4>
                <p>Plant and harvest berries for rewards</p>
              </div>
            </Link>

            <Link to="/town/activities/farm" className="town-place-card">
              <div className="place-icon">
                <i className="fas fa-tractor"></i>
              </div>
              <div className="place-info">
                <h4>Farm</h4>
                <p>Tend to crops and animals for daily rewards</p>
              </div>
            </Link>

            <Link to="/town/activities/pirates-dock" className="town-place-card">
              <div className="place-icon">
                <i className="fas fa-anchor"></i>
              </div>
              <div className="place-info">
                <h4>Pirate's Dock</h4>
                <p>Help the pirates with tasks for unique rewards</p>
              </div>
            </Link>

            <Link to="/town/visit/game_corner" className="town-place-card">
              <div className="place-icon">
                <i className="fas fa-gamepad"></i>
              </div>
              <div className="place-info">
                <h4>Game Corner</h4>
                <p>Use the pomodoro timer to earn rewards while you work</p>
              </div>
            </Link>

            <Link to="/town/apothecary" className="town-place-card">
              <div className="place-icon">
                <i className="fas fa-mortar-pestle"></i>
              </div>
              <div className="place-info">
                <h4>Apothecary</h4>
                <p>Use berries to modify your monsters</p>
              </div>
            </Link>

            <Link to="/town/bakery" className="town-place-card">
              <div className="place-icon">
                <i className="fas fa-cookie"></i>
              </div>
              <div className="place-info">
                <h4>Bakery</h4>
                <p>Use pastries to precisely modify your monsters</p>
              </div>
            </Link>

            <Link to="/town/visit/witchs_hut" className="town-place-card">
              <div className="place-icon">
                <i className="fas fa-hat-wizard"></i>
              </div>
              <div className="place-info">
                <h4>Witch's Hut</h4>
                <p>Evolve your monsters using special evolution items</p>
              </div>
            </Link>

            <Link to="/town/mega-mart" className="town-place-card">
              <div className="place-icon">
                <i className="fas fa-shopping-basket"></i>
              </div>
              <div className="place-info">
                <h4>Mega Mart</h4>
                <p>Use ability capsules and scrolls to modify monster abilities</p>
              </div>
            </Link>

            <Link to="/town/visit/antique-store" className="town-place-card">
              <div className="place-icon">
                <i className="fas fa-gem"></i>
              </div>
              <div className="place-info">
                <h4>Antique Store</h4>
                <p>Appraise or auction your antiques for unique monsters</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TownPage;
