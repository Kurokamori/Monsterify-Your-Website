import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@contexts/useAuth';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { PageHeader } from '@components/layouts/PageHeader';
import { TrainerMegaReferenceSubmissionForm } from '@components/submissions';
import { SubmissionSuccessDisplay } from './SubmissionSuccessDisplay';

interface SubmissionResult {
  rewards?: Record<string, unknown>;
}

const TrainerMegaReferenceSubmissionPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  useDocumentTitle('Trainer Mega Reference Submission');

  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/submissions/trainer-mega-reference');
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
        title="Trainer Mega Reference Submission"
        subtitle="Submit mega evolution images for your trainers with optional mega information"
        actions={
          <button className="button secondary" onClick={() => navigate('/submissions')}>
            <i className="fas fa-arrow-left"></i> Back to Submissions
          </button>
        }
      />

      {submissionSuccess ? (
        <SubmissionSuccessDisplay
          result={submissionResult}
          redirectMessage="Redirecting to gallery in 5 seconds..."
        />
      ) : (
        <TrainerMegaReferenceSubmissionForm onSubmissionComplete={handleSubmissionComplete} />
      )}

      {!submissionSuccess && (
        <div className="submission-help-section">
          <h2>About Trainer Mega References</h2>
          <div className="help-content">
            <div className="help-item">
              <h3>What are Trainer Mega References?</h3>
              <p>
                Trainer mega references are images that show what your trainer looks like when they undergo
                mega evolution. These images help artists understand your trainer's mega design and can be
                used in artwork featuring your character.
              </p>
            </div>

            <div className="help-item">
              <h3>Mega Information</h3>
              <p>You can optionally provide mega information including:</p>
              <ul>
                <li><strong>Artist:</strong> Who created the mega design</li>
                <li><strong>Species:</strong> Up to 3 species your trainer is based on</li>
                <li><strong>Types:</strong> Up to 6 elemental types</li>
                <li><strong>Ability:</strong> Special ability your mega trainer has</li>
              </ul>
              <p>
                This information is stored as JSON data with your trainer and can be updated later.
              </p>
            </div>

            <div className="help-item">
              <h3>Rewards</h3>
              <p>Trainer mega references provide higher rewards than regular references:</p>
              <ul>
                <li><strong>9 levels</strong> (compared to 6 for regular references)</li>
                <li><strong>200 coins</strong> per submission</li>
                <li><strong>Garden points</strong> for community contribution</li>
                <li><strong>Mission progress</strong> toward your goals</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainerMegaReferenceSubmissionPage;
