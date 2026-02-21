import { Link } from 'react-router-dom';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { Apothecary } from '@components/town';
import '@styles/town/item-use.css';

export default function ApothecaryPage() {
  useDocumentTitle('Apothecary');

  return (
    <div className="item-use-page">
      <div className="item-use-page__breadcrumb">
        <Link to="/town/market" className="breadcrumb-link">
          <i className="fas fa-arrow-left"></i> Back to Market
        </Link>
      </div>

      <div className="item-use-page__header">
        <div className="item-use-page__icon">
          <i className="fas fa-flask"></i>
        </div>
        <div>
          <h1>Apothecary</h1>
          <p className="item-use-page__description">
            Use berries to modify your monsters' species, types, and attributes
          </p>
        </div>
      </div>

      <Apothecary />
    </div>
  );
}
