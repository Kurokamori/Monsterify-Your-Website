import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@contexts/useAuth';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { PageHeader } from '@components/layouts/PageHeader';
import { MonsterReferenceSubmissionForm } from '@components/submissions';
import { SubmissionSuccessDisplay } from './SubmissionSuccessDisplay';

interface SubmissionResult {
  rewards?: Record<string, unknown>;
}

const MonsterReferenceSubmissionPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  useDocumentTitle('Submit Monster References');

  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/submissions/monster-reference');
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
      navigate('/submissions?tab=gallery');
    }, 5000);
  };

  if (!isAuthenticated) return null;

  return (
    <div className="main-container">
      <PageHeader
        title="Submit Monster References"
        subtitle="Submit reference images for your monsters to help artists draw them accurately."
      />

      {submissionSuccess ? (
        <SubmissionSuccessDisplay
          result={submissionResult}
          redirectMessage="Redirecting to gallery in 5 seconds..."
        />
      ) : (
        <MonsterReferenceSubmissionForm onSubmissionComplete={handleSubmissionComplete} />
      )}
    </div>
  );
};

export default MonsterReferenceSubmissionPage;
