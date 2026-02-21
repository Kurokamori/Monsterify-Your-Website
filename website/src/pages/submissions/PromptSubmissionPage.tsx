import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@contexts/useAuth';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { PageHeader } from '@components/layouts/PageHeader';
import { PromptSubmissionWizard } from '@components/submissions';

const PromptSubmissionPage = () => {
  const { category = 'general' } = useParams<{ category: string }>();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const displayCategory = category.charAt(0).toUpperCase() + category.slice(1);
  useDocumentTitle(`${displayCategory} Prompt Submission`);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/submissions/prompt/${category}`);
    }
  }, [isAuthenticated, navigate, category]);

  const handleComplete = () => {
    navigate('/submissions?tab=gallery');
  };

  if (!isAuthenticated) return null;

  return (
    <div className="main-container">
      <PageHeader title={`${displayCategory} Prompt Submission`} />

      <PromptSubmissionWizard
        category={category}
        onComplete={handleComplete}
      />
    </div>
  );
};

export default PromptSubmissionPage;
