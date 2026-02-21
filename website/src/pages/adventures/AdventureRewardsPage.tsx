import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { AdventureRewards } from '../../components/adventures/AdventureRewards';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

const AdventureRewardsPage = () => {
  useDocumentTitle('Adventure Rewards');
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Loading..." />;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="adventures-page">
      <AdventureRewards />
    </div>
  );
};

export default AdventureRewardsPage;
