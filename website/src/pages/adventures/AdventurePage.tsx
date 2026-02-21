import { useParams, useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { AdventureDetail } from '../../components/adventures/AdventureDetail';

const AdventurePage = () => {
  const { adventureId } = useParams<{ adventureId: string }>();
  const navigate = useNavigate();
  useDocumentTitle('Adventure Details');

  if (!adventureId) {
    navigate('/adventures');
    return null;
  }

  return (
    <div className="adventures-page">
      <div className="adventures-page__header">
        <h1>Adventure Details</h1>
        <button
          className="button secondary"
          onClick={() => navigate('/adventures')}
        >
          <i className="fas fa-arrow-left"></i> Back to Adventures
        </button>
      </div>
      <AdventureDetail adventureId={Number(adventureId)} />
    </div>
  );
};

export default AdventurePage;
