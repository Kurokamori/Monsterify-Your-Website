import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@contexts/useAuth';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { PageHeader } from '@components/layouts/PageHeader';
import { MonsterReferenceSubmissionForm } from '@components/submissions';
import { SubmissionSuccessDisplay } from './SubmissionSuccessDisplay';

interface SubmissionResult {
  rewards?: Record<string, unknown>;
  hasPendingApprovals?: boolean;
  pendingApprovalCount?: number;
  message?: string;
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
    if (!result.hasPendingApprovals || result.rewards) {
      redirectTimerRef.current = setTimeout(() => {
        navigate('/submissions?tab=gallery');
      }, 5000);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="main-container">
      <PageHeader
        title="Submit Monster References"
        subtitle="Submit reference images for your monsters to help artists draw them accurately."
      />

      {submissionSuccess ? (
        <>
          {submissionResult?.hasPendingApprovals && (
            <div className="info-message" style={{ marginBottom: '1rem' }}>
              <strong>Pending Approval:</strong>{' '}
              {submissionResult.message ?? `${submissionResult.pendingApprovalCount} reference(s) are pending approval by the trainer owner(s).`}
              {' '}
              <Link to="/profile/notifications">View in Notifications</Link>
            </div>
          )}
          {(submissionResult?.rewards || !submissionResult?.hasPendingApprovals) && (
            <SubmissionSuccessDisplay
              result={submissionResult}
              redirectMessage="Redirecting to gallery in 5 seconds..."
            />
          )}
        </>
      ) : (
        <MonsterReferenceSubmissionForm onSubmissionComplete={handleSubmissionComplete} />
      )}
    </div>
  );
};

export default MonsterReferenceSubmissionPage;
