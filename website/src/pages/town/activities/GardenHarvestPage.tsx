import { Link } from 'react-router-dom';
import { useAuth } from '@contexts/useAuth';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { GardenHarvest } from '@components/town';
import '@styles/town/activities.css';

export default function GardenHarvestPage() {
  useDocumentTitle('Garden Harvest');

  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="activity-page">
        <div className="activity-page__breadcrumb">
          <Link to="/town/activities/garden" className="breadcrumb-link">
            <i className="fas fa-arrow-left"></i> Back to Garden
          </Link>
        </div>
        <div className="activity-page__header">
          <div className="activity-page__icon">
            <i className="fas fa-hand-holding-heart"></i>
          </div>
          <div>
            <h1>Garden Harvest</h1>
          </div>
        </div>
        <div className="activity-page__auth">
          <p>Please log in to access the garden harvest.</p>
          <Link to="/login" className="button primary">Log In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="activity-page">
      <div className="activity-page__breadcrumb">
        <Link to="/town/activities/garden" className="breadcrumb-link">
          <i className="fas fa-arrow-left"></i> Back to Garden
        </Link>
      </div>
      <div className="activity-page__header">
        <div className="activity-page__icon">
          <i className="fas fa-hand-holding-heart"></i>
        </div>
        <div>
          <h1>Garden Harvest</h1>
          <p className="activity-page__description">
            Spend your garden points to harvest rewards
          </p>
        </div>
      </div>
      <GardenHarvest />
    </div>
  );
}
