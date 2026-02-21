import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@contexts/useAuth';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { PageHeader } from '@components/layouts/PageHeader';
import { WritingSubmissionForm } from '@components/submissions';
import { SubmissionSuccessDisplay } from './SubmissionSuccessDisplay';

interface SubmissionResult {
  rewards?: Record<string, unknown>;
}

const WritingSubmissionPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedBookId = searchParams.get('bookId');

  useDocumentTitle(preselectedBookId ? 'Add Chapter' : 'Submit Writing');

  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/submissions/writing');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, []);

  const handleSubmissionComplete = (result: SubmissionResult) => {
    setSubmissionSuccess(true);
    setSubmissionResult(result);
    redirectTimerRef.current = setTimeout(() => {
      navigate('/submissions?tab=library');
    }, 5000);
  };

  if (!isAuthenticated) return null;

  return (
    <div className="main-container">
      <PageHeader
        title={preselectedBookId ? 'Add Chapter' : 'Submit Writing'}
        subtitle={
          preselectedBookId
            ? 'Add a new chapter to your book and earn rewards based on word count.'
            : 'Share your stories, poems, and other written works with the community and earn rewards based on word count and quality.'
        }
      />

      {submissionSuccess ? (
        <SubmissionSuccessDisplay
          result={submissionResult}
          redirectMessage="Redirecting to library in 5 seconds..."
        />
      ) : (
        <WritingSubmissionForm
          onSubmissionComplete={handleSubmissionComplete}
          preselectedBookId={preselectedBookId ?? undefined}
        />
      )}
    </div>
  );
};

export default WritingSubmissionPage;
