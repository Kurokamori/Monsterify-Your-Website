import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@contexts/useAuth';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { PageHeader } from '@components/layouts/PageHeader';
import { TrainerReferenceSubmissionForm } from '@components/submissions';
import { SubmissionSuccessDisplay } from './SubmissionSuccessDisplay';

interface SubmissionResult {
  rewards?: Record<string, unknown>;
  hasPendingApprovals?: boolean;
  pendingApprovalCount?: number;
  message?: string;
}

const TrainerReferenceSubmissionPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  useDocumentTitle('Submit Trainer References');

  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/submissions/trainer-reference');
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
        title="Submit Trainer References"
        subtitle="Submit reference images for your trainers to help artists draw them accurately."
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
          {submissionResult?.rewards && (
            <SubmissionSuccessDisplay
              result={submissionResult}
              redirectMessage="Redirecting to gallery in 5 seconds..."
            />
          )}
          {!submissionResult?.rewards && !submissionResult?.hasPendingApprovals && (
            <SubmissionSuccessDisplay
              result={submissionResult}
              redirectMessage="Redirecting to gallery in 5 seconds..."
            />
          )}
        </>
      ) : (
        <TrainerReferenceSubmissionForm onSubmissionComplete={handleSubmissionComplete} />
      )}
    </div>
  );
};

export default TrainerReferenceSubmissionPage;
