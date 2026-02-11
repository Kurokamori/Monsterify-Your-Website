import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const FactionSubmissionModal = ({ faction, trainerId, onClose, onSubmit }) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [availableSubmissions, setAvailableSubmissions] = useState([]);
  const [factionPrompts, setFactionPrompts] = useState([]);
  const [formData, setFormData] = useState({
    submissionId: '',
    promptId: '',
    trainerStatus: 'alone',
    taskSize: 'small',
    specialBonus: false
  });
  const [calculatedScore, setCalculatedScore] = useState(10);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch available submissions and prompts when modal opens
  useEffect(() => {
    fetchData();
  }, [trainerId, faction.id]);

  // Calculate score when form data changes
  useEffect(() => {
    calculateScore();
  }, [formData, factionPrompts]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch available submissions
      const submissionsResponse = await api.get(`/factions/trainers/${trainerId}/submissions/available`);
      setAvailableSubmissions(submissionsResponse.data.submissions || []);

      // Fetch faction prompts
      const promptsResponse = await api.get(`/factions/${faction.id}/prompts`);
      setFactionPrompts(promptsResponse.data.prompts || []);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load submissions and prompts');
    } finally {
      setLoading(false);
    }
  };

  const calculateScore = () => {
    let score = 10; // Base score

    // Add trainer status bonus
    if (formData.trainerStatus === 'alone') {
      score += 10;
    } else if (formData.trainerStatus === 'with_others') {
      score += 20;
    }

    // Add task size bonus
    if (formData.taskSize === 'medium') {
      score += 10;
    } else if (formData.taskSize === 'large') {
      score += 20;
    }

    // Add special bonus
    if (formData.specialBonus) {
      score += 20;
    }

    // Add prompt modifier
    if (formData.promptId) {
      const selectedPrompt = factionPrompts.find(p => p.id === parseInt(formData.promptId));
      if (selectedPrompt) {
        score += selectedPrompt.modifier;
      }
    }

    setCalculatedScore(score);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      if (!formData.submissionId) {
        setError('Please select a submission');
        return;
      }

      const submissionData = {
        trainerId: parseInt(trainerId),
        submissionId: parseInt(formData.submissionId),
        promptId: formData.promptId ? parseInt(formData.promptId) : null,
        trainerStatus: formData.trainerStatus,
        taskSize: formData.taskSize,
        specialBonus: formData.specialBonus
      };

      const response = await api.post(`/factions/${faction.id}/submissions`, submissionData);
      
      if (response.data.success) {
        setSuccessMessage(`Submission successful! You gained ${calculatedScore} standing with ${faction.name}.`);
        setStep(3); // Success step
        
        // Call onSubmit callback after a delay
        setTimeout(() => {
          onSubmit(response.data);
        }, 2000);
      }
    } catch (err) {
      console.error('Error submitting faction submission:', err);
      setError(err.response?.data?.message || 'Failed to submit faction submission');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedSubmission = () => {
    return availableSubmissions.find(s => s.id === parseInt(formData.submissionId));
  };

  const getSelectedPrompt = () => {
    return factionPrompts.find(p => p.id === parseInt(formData.promptId));
  };

  const renderStepIndicator = () => (
    <div className="step-indicator">
      <div className={`step${step >= 1 ? 'active' : ''}`}>
        <span>1</span>
        <label>Select Submission</label>
      </div>
      <div className={`step${step >= 2 ? 'active' : ''}`}>
        <span>2</span>
        <label>Configure Details</label>
      </div>
      <div className={`step${step >= 3 ? 'active' : ''}`}>
        <span>3</span>
        <label>Complete</label>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="submission-step">
      <h3>Select a Submission</h3>
      <p>Choose an approved artwork or writing submission to use for faction standing:</p>
      
      {availableSubmissions.length === 0 ? (
        <div className="no-submissions">
          <p>No available submissions found. You need approved artwork or writing submissions that haven't been used for faction standing yet.</p>
        </div>
      ) : (
        <div className="submissions-grid">
          {availableSubmissions.map(submission => (
            <div
              key={submission.id}
              className={`submission-card ${formData.submissionId === submission.id.toString() ? 'selected' : ''}`}
              onClick={() => setFormData(prev => ({ ...prev, submissionId: submission.id.toString() }))}
            >
              <div className="submission-type">
                {submission.content_type === 'art' ? '🎨' : '📝'} {submission.content_type}
              </div>
              <h4>{submission.title}</h4>
              <p>{submission.description}</p>
              <div className="submission-date">
                {new Date(submission.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="submission-step">
      <h3>Configure Submission Details</h3>
      
      <div className="selected-submission-info">
        <h4>Selected Submission:</h4>
        <div className="submission-preview">
          <span className="submission-type">
            {getSelectedSubmission()?.content_type === 'art' ? '🎨' : '📝'}
          </span>
          <span>{getSelectedSubmission()?.title}</span>
        </div>
      </div>

      <div className="form-section">
        <label>Faction Prompt (Optional)</label>
        <select
          value={formData.promptId}
          onChange={(e) => setFormData(prev => ({ ...prev, promptId: e.target.value }))}
          className="form-input"
        >
          <option value="">No specific prompt</option>
          {factionPrompts.map(prompt => (
            <option key={prompt.id} value={prompt.id}>
              {prompt.name} (+{prompt.modifier} bonus)
            </option>
          ))}
        </select>
        {formData.promptId && (
          <div className="prompt-description">
            {getSelectedPrompt()?.description}
          </div>
        )}
      </div>

      <div className="form-section">
        <label>Trainer Status</label>
        <div className="radio-group">
          <label className="radio-option">
            <input
              type="radio"
              name="trainerStatus"
              value="alone"
              checked={formData.trainerStatus === 'alone'}
              onChange={(e) => setFormData(prev => ({ ...prev, trainerStatus: e.target.value }))}
            />
            <span>Alone (+10 bonus)</span>
          </label>
          <label className="radio-option">
            <input
              type="radio"
              name="trainerStatus"
              value="with_others"
              checked={formData.trainerStatus === 'with_others'}
              onChange={(e) => setFormData(prev => ({ ...prev, trainerStatus: e.target.value }))}
            />
            <span>With Others (+20 bonus)</span>
          </label>
        </div>
      </div>

      <div className="form-section">
        <label>Task Size</label>
        <div className="radio-group">
          <label className="radio-option">
            <input
              type="radio"
              name="taskSize"
              value="small"
              checked={formData.taskSize === 'small'}
              onChange={(e) => setFormData(prev => ({ ...prev, taskSize: e.target.value }))}
            />
            <span>Small (no bonus)</span>
          </label>
          <label className="radio-option">
            <input
              type="radio"
              name="taskSize"
              value="medium"
              checked={formData.taskSize === 'medium'}
              onChange={(e) => setFormData(prev => ({ ...prev, taskSize: e.target.value }))}
            />
            <span>Medium (+10 bonus)</span>
          </label>
          <label className="radio-option">
            <input
              type="radio"
              name="taskSize"
              value="large"
              checked={formData.taskSize === 'large'}
              onChange={(e) => setFormData(prev => ({ ...prev, taskSize: e.target.value }))}
            />
            <span>Large (+20 bonus)</span>
          </label>
        </div>
      </div>

      <div className="form-section">
        <label className="radio-option">
          <input
            type="checkbox"
            checked={formData.specialBonus}
            onChange={(e) => setFormData(prev => ({ ...prev, specialBonus: e.target.checked }))}
          />
          <span>Deserves Special Bonus (+20 bonus)</span>
        </label>
      </div>

      <div className="score-calculation">
        <h4>Calculated Score: <span className="score-value">{calculatedScore}</span></h4>
        <div className="stat-info">
          <div>Base Score: 10</div>
          <div>Trainer Status: +{formData.trainerStatus === 'alone' ? 10 : formData.trainerStatus === 'with_others' ? 20 : 0}</div>
          <div>Task Size: +{formData.taskSize === 'small' ? 0 : formData.taskSize === 'medium' ? 10 : 20}</div>
          <div>Special Bonus: +{formData.specialBonus ? 20 : 0}</div>
          {formData.promptId && <div>Prompt Bonus: +{getSelectedPrompt()?.modifier || 0}</div>}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="submission-step success-step">
      <div className="success-icon">✅</div>
      <h3>Submission Successful!</h3>
      <div className="success-details">
        <p>{successMessage}</p>
        <div className="standing-preview">
          <div className="faction-badge" style={{ borderColor: faction.color }}>
            {faction.name}
          </div>
          <div className="standing-gain">+{calculatedScore} Standing</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="faction-submission-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tree-header">
          <h2>Submit to {faction.name}</h2>
          <button className="button close" onClick={onClose}>&times;</button>
        </div>

        {renderStepIndicator()}

        <div className="modal-content">
          {loading && <div className="loading-spinner">Loading...</div>}
          
          {error && (
            <div className="alert error">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          {!loading && step === 1 && renderStep1()}
          {!loading && step === 2 && renderStep2()}
          {!loading && step === 3 && renderStep3()}
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

export default FactionSubmissionModal;