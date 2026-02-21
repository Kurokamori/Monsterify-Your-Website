import { Link } from 'react-router-dom';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { Bakery } from '@components/town';
import '@styles/town/item-use.css';

export default function BakeryPage() {
  useDocumentTitle('Bakery');

  return (
    <div className="item-use-page">
      <div className="item-use-page__breadcrumb">
        <Link to="/town/market" className="breadcrumb-link">
          <i className="fas fa-arrow-left"></i> Back to Market
        </Link>
      </div>

      <div className="item-use-page__header">
        <div className="item-use-page__icon">
          <i className="fas fa-bread-slice"></i>
        </div>
        <div>
          <h1>Bakery</h1>
          <p className="item-use-page__description">
            Use pastries to precisely set or add types and species to your monsters
          </p>
        </div>
      </div>

      <Bakery />
    </div>
  );
}
