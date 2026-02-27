import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import api from '../../services/api';

interface Submission {
  id: number;
  title: string;
  description: string | null;
  submissionType: 'art' | 'writing';
  imageUrl: string | null;
  url: string;
}

interface TributeTitle {
  id: number;
  name: string;
  standing_requirement: number;
}

interface TributeRequirements {
  item_requirement?: string;
  currency_requirement?: number;
  prompt?: string;
}

interface TributeRequirement {
  title: TributeTitle;
  current_standing: number;
  requirements?: TributeRequirements;
}

interface Faction {
  id: number | string;
  name: string;
}

interface FactionStanding {
  standing: number;
}

interface TributeSubmissionModalProps {
  faction: Faction;
  trainerId: number | string;
  standing?: FactionStanding;
  onClose: () => void;
  onSubmit: () => void;
}

export const TributeSubmissionModal = ({
  faction,
  trainerId,
  onClose,
  onSubmit
}: TributeSubmissionModalProps) => {
  const [tributeRequirement, setTributeRequirement] = useState<TributeRequirement | null>(null);
  const [availableSubmissions, setAvailableSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [useExistingSubmission, setUseExistingSubmission] = useState(true);
  const [submissionType, setSubmissionType] = useState<'art' | 'writing'>('art');
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [submissionDescription, setSubmissionDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tributeResponse, submissionsResponse] = await Promise.all([
          api.get(`/factions/trainers/${trainerId}/${faction.id}/tribute-requirement`),
          api.get(`/factions/trainers/${trainerId}/submissions/available-for-tribute`)
        ]);

        setTributeRequirement(tributeResponse.data.requirement);
        setAvailableSubmissions(submissionsResponse.data.data || []);
      } catch (err) {
        console.error('Error fetching tribute data:', err);
        setError('Failed to load tribute requirements');
      }
    };

    if (trainerId && faction?.id) {
      fetchData();
    }
  }, [trainerId, faction]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!tributeRequirement) {
      setError('No tribute requirement found');
      return;
    }

    if (useExistingSubmission) {
      if (!selectedSubmission) {
        setError('Please select a submission to use for this tribute');
        return;
      }
    } else {
      if (!submissionUrl || !submissionDescription) {
        setError('Please fill in all required fields');
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      const tributeData = {
        title_id: tributeRequirement.title.id,
        trainer_id: trainerId,
        submission_type: useExistingSubmission ? selectedSubmission!.submissionType : submissionType,
        submission_url: useExistingSubmission ? selectedSubmission!.url : submissionUrl,
        submission_description: useExistingSubmission
          ? `Using existing submission: ${selectedSubmission!.title}. ${submissionDescription || selectedSubmission!.description}`
          : submissionDescription,
        submission_id: useExistingSubmission ? selectedSubmission!.id : null,
        item_requirement: tributeRequirement.requirements?.item_requirement || null,
        currency_requirement: tributeRequirement.requirements?.currency_requirement || 0
      };

      const response = await api.post(`/factions/${faction.id}/tributes`, tributeData);

      if (response.data.success) {
        onSubmit();
      }
    } catch (err: unknown) {
      console.error('Error submitting tribute:', err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to submit tribute');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmissionSelect = (e: ChangeEvent<HTMLSelectElement>) => {
    const submission = availableSubmissions.find(s => s.id === parseInt(e.target.value));
    setSelectedSubmission(submission || null);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Submit Tribute to {faction.name}</h2>
          <button className="button ghost danger" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-body">
          {!tributeRequirement ? (
            <div className="submission-selector__no-submissions">
              <p>No tribute required at your current standing level.</p>
              <p>Gain more standing with {faction.name} to unlock tribute opportunities!</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="submission-preview" style={{ marginBottom: 'var(--spacing-medium)' }}>
                <h4>Tribute for: {tributeRequirement.title.name}</h4>
                <div style={{ display: 'flex', gap: 'var(--spacing-medium)', marginTop: 'var(--spacing-xsmall)' }}>
                  <span className="text-muted">Standing Required: {tributeRequirement.title.standing_requirement}</span>
                  <span className="text-muted">Your Standing: {tributeRequirement.current_standing}</span>
                </div>

                {tributeRequirement.requirements && (
                  <div style={{ marginTop: 'var(--spacing-small)' }}>
                    <h5 style={{ marginBottom: 'var(--spacing-xsmall)' }}>Requirements:</h5>
                    {tributeRequirement.requirements.item_requirement && (
                      <p><strong>Item:</strong> {tributeRequirement.requirements.item_requirement}</p>
                    )}
                    {tributeRequirement.requirements.currency_requirement && tributeRequirement.requirements.currency_requirement > 0 && (
                      <p><strong>Currency:</strong> {tributeRequirement.requirements.currency_requirement}</p>
                    )}
                    {tributeRequirement.requirements.prompt && (
                      <div className="meeting-prompt" style={{ marginTop: 'var(--spacing-xsmall)' }}>
                        <h4>Prompt:</h4>
                        <p>{tributeRequirement.requirements.prompt}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Submission Method:</label>
                <div style={{ display: 'flex', gap: 'var(--spacing-xsmall)' }}>
                  <button
                    type="button"
                    className={`button ${useExistingSubmission ? 'primary' : 'secondary'}`}
                    onClick={() => setUseExistingSubmission(true)}
                  >
                    Use Existing Submission
                  </button>
                  <button
                    type="button"
                    className={`button ${!useExistingSubmission ? 'primary' : 'secondary'}`}
                    onClick={() => setUseExistingSubmission(false)}
                  >
                    Create New Submission
                  </button>
                </div>
              </div>

              {useExistingSubmission ? (
                <div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="submission-select">Select Submission:</label>
                    {availableSubmissions.length === 0 ? (
                      <div className="submission-selector__no-submissions">
                        <p>No available submissions.</p>
                        <p>All your submissions have already been used for faction standing or tributes.</p>
                        <p>Switch to "Create New Submission" to create a new one.</p>
                      </div>
                    ) : (
                      <select
                        id="submission-select"
                        className="select"
                        value={selectedSubmission?.id || ''}
                        onChange={handleSubmissionSelect}
                        required
                      >
                        <option value="">Select a submission</option>
                        {availableSubmissions.map(submission => (
                          <option key={submission.id} value={submission.id}>
                            {submission.title} ({submission.submissionType})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {selectedSubmission && (
                    <div className="submission-preview">
                      <h5>Selected Submission:</h5>
                      <h6>{selectedSubmission.title}</h6>
                      <p>{selectedSubmission.description}</p>
                      <a href={selectedSubmission.url} target="_blank" rel="noopener noreferrer">
                        View Submission
                      </a>
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label" htmlFor="additional-description">
                      Additional Description (Optional):
                    </label>
                    <textarea
                      id="additional-description"
                      className="input textarea"
                      value={submissionDescription}
                      onChange={(e) => setSubmissionDescription(e.target.value)}
                      placeholder="Add any additional context for how this submission fulfills the tribute prompt..."
                      rows={3}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="submission-type">Submission Type:</label>
                    <select
                      id="submission-type"
                      className="select"
                      value={submissionType}
                      onChange={(e) => setSubmissionType(e.target.value as 'art' | 'writing')}
                      required
                    >
                      <option value="art">Art Submission</option>
                      <option value="writing">Writing Submission</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="submission-url">
                      Submission URL: <span className="required-indicator">*</span>
                    </label>
                    <input
                      type="url"
                      id="submission-url"
                      className="input"
                      value={submissionUrl}
                      onChange={(e) => setSubmissionUrl(e.target.value)}
                      placeholder="https://example.com/your-submission"
                      required
                    />
                    <div className="form-help-text">Link to your art or writing submission (DeviantArt, Google Docs, etc.)</div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="submission-description">
                      Description: <span className="required-indicator">*</span>
                    </label>
                    <textarea
                      id="submission-description"
                      className="input textarea"
                      value={submissionDescription}
                      onChange={(e) => setSubmissionDescription(e.target.value)}
                      placeholder="Describe your submission and how it fulfills the tribute prompt..."
                      rows={4}
                      required
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="alert error">
                  <i className="fas fa-exclamation-triangle"></i>
                  {error}
                </div>
              )}

              <div className="modal-actions">
                <button type="button" onClick={onClose} className="button secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="button success"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Submitting...
                    </>
                  ) : (
                    'Submit Tribute'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="modal-info">
          <h4>About Tributes</h4>
          <ul>
            <li>Tributes are reviewed by faction leaders and administrators</li>
            <li>Successful tributes grant you the associated title and standing</li>
            <li>Include items or currency to show your dedication</li>
            <li>Make sure your submission is high quality and faction-appropriate</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
