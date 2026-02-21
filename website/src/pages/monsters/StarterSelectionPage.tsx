import { useParams } from 'react-router-dom';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { StarterSelectionFlow } from '@components/monsters/StarterSelectionFlow';
import { useStarterSelection } from './useStarterSelection';

const StarterSelectionPage = () => {
  useDocumentTitle('Starter Selection');
  const { id } = useParams<{ id: string }>();

  const starterSelection = useStarterSelection(id);

  return <StarterSelectionFlow {...starterSelection} />;
};

export default StarterSelectionPage;
