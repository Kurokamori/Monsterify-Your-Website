import { Link } from 'react-router-dom';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { WitchsHut } from '@components/town';
import '@styles/town/item-use.css';
import '@styles/town/witchhut.css';

export default function WitchsHutPage() {
  useDocumentTitle("Witch's Hut");

  return (
    <div className="item-use-page">
      <div className="item-use-page__breadcrumb">
        <Link to="/town/market" className="breadcrumb-link">
          <i className="fas fa-arrow-left"></i> Back to Market
        </Link>
      </div>

      <div className="item-use-page__header">
        <div className="item-use-page__icon">
          <i className="fas fa-hat-wizard"></i>
        </div>
        <div>
          <h1>Witch's Hut</h1>
          <p className="item-use-page__description">
            Evolve your monsters using evolution items and magic
          </p>
        </div>
      </div>

      <WitchsHut />
    </div>
  );
}
