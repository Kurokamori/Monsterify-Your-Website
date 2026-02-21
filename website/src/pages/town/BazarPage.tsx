import { Link } from 'react-router-dom';
import { useAuth } from '@contexts/useAuth';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { TabContainer } from '@components/common/TabContainer';
import { BazarForfeitMonster } from '@components/town/BazarForfeitMonster';
import { BazarForfeitItem } from '@components/town/BazarForfeitItem';
import { BazarAdoptMonster } from '@components/town/BazarAdoptMonster';
import { BazarCollectItem } from '@components/town/BazarCollectItem';
import '@styles/town/activities.css';
import '@styles/town/bazar.css';

const BAZAR_TABS = [
  {
    key: 'forfeit-monster',
    label: 'Forfeit Monster',
    icon: 'fas fa-paw',
    content: <BazarForfeitMonster />,
  },
  {
    key: 'forfeit-item',
    label: 'Forfeit Item',
    icon: 'fas fa-box-open',
    content: <BazarForfeitItem />,
  },
  {
    key: 'adopt-monster',
    label: 'Adopt Monster',
    icon: 'fas fa-hand-holding-heart',
    content: <BazarAdoptMonster />,
  },
  {
    key: 'collect-item',
    label: 'Collect Items',
    icon: 'fas fa-gift',
    content: <BazarCollectItem />,
  },
];

export default function BazarPage() {
  useDocumentTitle('Bazar');

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
            <i className="fas fa-store"></i>
          </div>
          <div>
            <h1>Bazar</h1>
          </div>
        </div>
        <div className="activity-page__auth">
          <p>Please log in to access the bazar.</p>
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
          <i className="fas fa-store"></i>
        </div>
        <div>
          <h1>Bazar</h1>
          <p className="activity-page__description">
            Trade, forfeit, and adopt monsters and items
          </p>
        </div>
      </div>

      <div className="activity-location__description">
        <p>
          Forfeit monsters and items for others to adopt, or adopt monsters and collect items
          from other trainers.
        </p>
      </div>

      <TabContainer tabs={BAZAR_TABS} variant="underline" />
    </div>
  );
}
