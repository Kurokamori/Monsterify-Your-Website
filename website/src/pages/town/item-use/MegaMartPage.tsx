import { Link } from 'react-router-dom';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { MegaMart } from '@components/town';
import '@styles/town/item-use.css';

export default function MegaMartPage() {
  useDocumentTitle('Mega Mart');

  return (
    <div className="item-use-page">
      <div className="item-use-page__breadcrumb">
        <Link to="/town/market" className="breadcrumb-link">
          <i className="fas fa-arrow-left"></i> Back to Market
        </Link>
      </div>

      <div className="item-use-page__header">
        <div className="item-use-page__icon">
          <i className="fas fa-shopping-cart"></i>
        </div>
        <div>
          <h1>Mega Mart</h1>
          <p className="item-use-page__description">
            Modify your monsters' abilities using Ability Capsules and Scrolls of Secrets
          </p>
        </div>
      </div>

      <MegaMart />
    </div>
  );
}
