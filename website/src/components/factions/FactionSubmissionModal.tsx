import { useState, useEffect, useMemo, ChangeEvent } from 'react';
import api from '../../services/api';

interface Submission {
  id: number;
  title: string;
  description: string | null;
  submissionType: 'art' | 'writing';
  imageUrl: string | null;
  createdAt: string;
}

interface FactionPrompt {
  id: number;
  name: string;
  description: string;
  modifier: number;
}

interface Faction {
  id: number | string;
  name: string;
  color?: string;
}

interface SubmissionFormData {
  submissionId: string;
  promptId: string;
  trainerStatus: 'alone' | 'with_others';
  taskSize: 'small' | 'medium' | 'large';
  specialBonus: boolean;
}

interface FactionSubmissionModalProps {
  faction: Faction;
  trainerId: number | string;
  onClose: () => void;
  onSubmit: (data: unknown) => void;
}

const INITIAL_FORM_DATA: SubmissionFormData = {
  submissionId: '',
  promptId: '',
  trainerStatus: 'alone',
  taskSize: 'small',
  specialBonus: false
};

export const FactionSubmissionModal = ({
  faction,
  trainerId,
  onClose,
  onSubmit
}: FactionSubmissionModalProps) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [availableSubmissions, setAvailableSubmissions] = useState<Submission[]>([]);
  const [factionPrompts, setFactionPrompts] = useState<FactionPrompt[]>([]);
  const [formData, setFormData] = useState<SubmissionFormData>(INITIAL_FORM_DATA);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const calculatedScore = useMemo(() => {
    let score = 10;

    if (formData.trainerStatus === 'alone') {
      score += 10;
    } else if (formData.trainerStatus === 'with_others') {
      score += 20;
    }

    if (formData.taskSize === 'medium') {
      score += 10;
    } else if (formData.taskSize === 'large') {
      score += 20;
    }

    if (formData.specialBonus) {
      score += 20;
    }

    if (formData.promptId) {
      const selectedPrompt = factionPrompts.find(p => p.id === parseInt(formData.promptId));
      if (selectedPrompt) {
        score += selectedPrompt.modifier;
      }
    }

    return score;
  }, [formData, factionPrompts]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        const [submissionsResponse, promptsResponse] = await Promise.all([
          api.get(`/factions/trainers/${trainerId}/submissions/available`),
          api.get(`/factions/${faction.id}/prompts`)
        ]);

        setAvailableSubmissions(submissionsResponse.data.data || []);
        setFactionPrompts(promptsResponse.data.data || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load submissions and prompts');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [trainerId, faction.id]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      if (!formData.submissionId) {
        setError('Please select a submission');
        setLoading(false);
        return;
      }

      const submissionData = {
        trainerId: typeof trainerId === 'string' ? parseInt(trainerId) : trainerId,
        submissionId: parseInt(formData.submissionId),
        promptId: formData.promptId ? parseInt(formData.promptId) : null,
        trainerStatus: formData.trainerStatus,
        taskSize: formData.taskSize,
        specialBonus: formData.specialBonus
      };

      const response = await api.post(`/factions/${faction.id}/submissions`, submissionData);

      if (response.data.success) {
        setSuccessMessage(`Submission successful! You gained ${calculatedScore} standing with ${faction.name}.`);
        setStep(3);

        setTimeout(() => {
          onSubmit(response.data);
        }, 2000);
      }
    } catch (err: unknown) {
      console.error('Error submitting faction submission:', err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to submit faction submission');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedSubmission = (): Submission | undefined => {
    return availableSubmissions.find(s => s.id === parseInt(formData.submissionId));
  };

  const getSelectedPrompt = (): FactionPrompt | undefined => {
    return factionPrompts.find(p => p.id === parseInt(formData.promptId));
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const renderStepIndicator = () => (
    <div className="multistep-modal__progress-steps">
      <div className={`multistep-modal__step-indicator ${step >= 1 ? 'multistep-modal__step-indicator--active' : ''} ${step > 1 ? 'multistep-modal__step-indicator--completed' : ''}`}>
        <div className="multistep-modal__step-number">1</div>
        <span className="multistep-modal__step-title">Select Submission</span>
      </div>
      <div className={`multistep-modal__step-indicator ${step >= 2 ? 'multistep-modal__step-indicator--active' : ''} ${step > 2 ? 'multistep-modal__step-indicator--completed' : ''}`}>
        <div className="multistep-modal__step-number">2</div>
        <span className="multistep-modal__step-title">Configure Details</span>
      </div>
      <div className={`multistep-modal__step-indicator ${step >= 3 ? 'multistep-modal__step-indicator--active' : ''}`}>
        <div className="multistep-modal__step-number">3</div>
        <span className="multistep-modal__step-title">Complete</span>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="multistep-modal__content">
      <h3>Select a Submission</h3>
      <p className="text-muted">Choose a submitted artwork or writing submission to use for faction standing:</p>

      {availableSubmissions.length === 0 ? (
        <div className="submission-selector__no-submissions">
          <p>No available submissions found.</p>
          <p>You need submitted artwork or writing submissions that haven't been used for faction standing yet.</p>
        </div>
      ) : (
        <div className="submission__gallery-grid" style={{ gap: 'var(--spacing-small)' }}>
          {availableSubmissions.map(submission => {
            const isSelected = formData.submissionId === submission.id.toString();
            const isArt = submission.submissionType === 'art';

            return (
              <div
                key={submission.id}
                className={`gallery-item card card--clickable ${isSelected ? 'card--selected' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, submissionId: submission.id.toString() }))}
              >
                {isArt && submission.imageUrl ? (
                  <>
                    <div className="card__image">
                      <img
                        src={submission.imageUrl}
                        alt={submission.title}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = '/images/default_art.png';
                        }}
                      />
                    </div>
                    <div className="card__body">
                      <h4 className="submission__gallery-item-title">{submission.title}</h4>
                      <span className="text-muted" style={{ fontSize: 'var(--font-size-xsmall)' }}>
                        {new Date(submission.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="library-item-text-cover">
                    <div className="library-item-text-cover-icon">
                      <i className="fas fa-feather-alt"></i>
                    </div>
                    <h4 className="submission__gallery-item-title">{submission.title}</h4>
                    {submission.description && (
                      <p className="library-item-text-cover-description">{submission.description}</p>
                    )}
                    <span className="text-muted" style={{ fontSize: 'var(--font-size-xsmall)' }}>
                      {new Date(submission.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderStep2 = () => {
    const selectedSubmission = getSelectedSubmission();
    const selectedPrompt = getSelectedPrompt();

    return (
      <div className="multistep-modal__content">
        <h3>Configure Submission Details</h3>

        <div className="submission-preview">
          <h5>Selected Submission:</h5>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xsmall)' }}>
            {selectedSubmission?.submissionType === 'art' && selectedSubmission?.imageUrl ? (
              <img src={selectedSubmission.imageUrl} alt="" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: 'var(--radius-small)' }} />
            ) : (
              <i className="fas fa-feather-alt"></i>
            )}
            <span>{selectedSubmission?.title}</span>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Faction Prompt (Optional)</label>
          <select
            name="promptId"
            value={formData.promptId}
            onChange={handleInputChange}
            className="select"
          >
            <option value="">No specific prompt</option>
            {factionPrompts.map(prompt => (
              <option key={prompt.id} value={prompt.id}>
                {prompt.name} (+{prompt.modifier} bonus)
              </option>
            ))}
          </select>
          {selectedPrompt && (
            <div className="form-help-text">{selectedPrompt.description}</div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Trainer Status</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xsmall)' }}>
            <label className="checkbox-label">
              <input
                type="radio"
                name="trainerStatus"
                value="alone"
                checked={formData.trainerStatus === 'alone'}
                onChange={handleInputChange}
              />
              <span>Alone (+10 bonus)</span>
            </label>
            <label className="checkbox-label">
              <input
                type="radio"
                name="trainerStatus"
                value="with_others"
                checked={formData.trainerStatus === 'with_others'}
                onChange={handleInputChange}
              />
              <span>With Others (+20 bonus)</span>
            </label>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Task Size</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xsmall)' }}>
            <label className="checkbox-label">
              <input
                type="radio"
                name="taskSize"
                value="small"
                checked={formData.taskSize === 'small'}
                onChange={handleInputChange}
              />
              <span>Small (no bonus)</span>
            </label>
            <label className="checkbox-label">
              <input
                type="radio"
                name="taskSize"
                value="medium"
                checked={formData.taskSize === 'medium'}
                onChange={handleInputChange}
              />
              <span>Medium (+10 bonus)</span>
            </label>
            <label className="checkbox-label">
              <input
                type="radio"
                name="taskSize"
                value="large"
                checked={formData.taskSize === 'large'}
                onChange={handleInputChange}
              />
              <span>Large (+20 bonus)</span>
            </label>
          </div>
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="specialBonus"
              checked={formData.specialBonus}
              onChange={handleInputChange}
            />
            <span>Deserves Special Bonus (+20 bonus)</span>
          </label>
        </div>

        <div className="shop-purchase-summary">
          <h4>Calculated Score: <span style={{ color: 'var(--accent-color)' }}>{calculatedScore}</span></h4>
          <div className="shop-purchase-summary__row">
            <span className="label">Base Score:</span>
            <span className="value">10</span>
          </div>
          <div className="shop-purchase-summary__row">
            <span className="label">Trainer Status:</span>
            <span className="value">+{formData.trainerStatus === 'alone' ? 10 : 20}</span>
          </div>
          <div className="shop-purchase-summary__row">
            <span className="label">Task Size:</span>
            <span className="value">+{formData.taskSize === 'small' ? 0 : formData.taskSize === 'medium' ? 10 : 20}</span>
          </div>
          <div className="shop-purchase-summary__row">
            <span className="label">Special Bonus:</span>
            <span className="value">+{formData.specialBonus ? 20 : 0}</span>
          </div>
          {formData.promptId && (
            <div className="shop-purchase-summary__row">
              <span className="label">Prompt Bonus:</span>
              <span className="value">+{selectedPrompt?.modifier || 0}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderStep3 = () => (
    <div className="multistep-modal__content" style={{ textAlign: 'center' }}>
      <div className="shop-purchase-success">
        <div className="shop-purchase-success__icon">
          <i className="fas fa-check-circle"></i>
        </div>
        <h3>Submission Successful!</h3>
        <p>{successMessage}</p>
        <div style={{ marginTop: 'var(--spacing-medium)' }}>
          <span className="badge success lg" style={{ borderColor: faction.color }}>
            {faction.name}
          </span>
          <div style={{ marginTop: 'var(--spacing-xsmall)', fontSize: 'var(--font-size-large)', fontWeight: 700, color: 'var(--success-color)' }}>
            +{calculatedScore} Standing
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Submit to {faction.name}</h2>
          <button className="button ghost" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {renderStepIndicator()}

        <div className="modal-body">
          {loading && step !== 3 && (
            <div style={{ textAlign: 'center', padding: 'var(--spacing-medium)' }}>
              <i className="fas fa-spinner fa-spin"></i> Loading...
            </div>
          )}

          {error && (
            <div className="alert error">
              <i className="fas fa-exclamation-triangle"></i>
              {error}
            </div>
          )}

          {!loading && step === 1 && renderStep1()}
          {!loading && step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>

        <div className="modal-footer">
          {step === 1 && (
            <>
              <button className="button secondary" onClick={onClose}>
                Cancel
              </button>
              <button
                className="button primary"
                onClick={() => setStep(2)}
                disabled={!formData.submissionId || availableSubmissions.length === 0}
              >
                Next
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <button className="button secondary" onClick={() => setStep(1)}>
                Back
              </button>
              <button
                className="button primary"
                onClick={handleSubmit}
                disabled={loading || !formData.submissionId}
              >
                {loading ? 'Submitting...' : 'Submit'}
              </button>
            </>
          )}

          {step === 3 && (
            <button className="button primary" onClick={onClose}>
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
