import { Link } from 'react-router-dom';
import { useAuth } from '@contexts/useAuth';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { AdoptionCenter } from '@components/town/AdoptionCenter';
import '@styles/town/activities.css';
import '@styles/town/adoption.css';

export default function AdoptionPage() {
  useDocumentTitle('Adoption Center');

  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="activity-page">
        <div className="activity-page__breadcrumb">
          <Link to="/town" className="breadcrumb-link">
            <i className="fas fa-arrow-left"></i> Back to Town
          </Link>
        </div>
        <div className="activity-page__header">
          <div className="activity-page__icon">
            <i className="fas fa-heart"></i>
          </div>
          <div>
            <h1>Adoption Center</h1>
          </div>
        </div>
        <div className="activity-page__auth">
          <p>Please log in to access the adoption center.</p>
          <Link to="/login" className="button primary">Log In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="activity-page">
      <div className="activity-page__breadcrumb">
        <Link to="/town" className="breadcrumb-link">
          <i className="fas fa-arrow-left"></i> Back to Town
        </Link>
      </div>

      <div className="activity-page__header">
        <div className="activity-page__icon">
          <i className="fas fa-heart"></i>
        </div>
        <div>
          <h1>Adoption Center</h1>
          <p className="activity-page__description">
            Give a monster a loving home
          </p>
        </div>
      </div>

      <div className="activity-location__description">
        <p>
          Welcome to the Adoption Center! Browse available monsters from monthly batches and give them
          a new home with one of your trainers. Each month brings new monsters looking for loving trainers.
        </p>
      </div>

      <AdoptionCenter />
    </div>
  );
}
