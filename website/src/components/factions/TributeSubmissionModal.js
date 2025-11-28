import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const TributeSubmissionModal = ({ faction, trainerId, standing, onClose, onSubmit }) => {
  const [tributeRequirement, setTributeRequirement] = useState(null);
  const [availableSubmissions, setAvailableSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [useExistingSubmission, setUseExistingSubmission] = useState(true);
  const [submissionType, setSubmissionType] = useState('art');
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [submissionDescription, setSubmissionDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get tribute requirement and available submissions
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get tribute requirement
        const tributeResponse = await api.get(`/factions/trainers/${trainerId}/${faction.id}/tribute-requirement`);
        setTributeRequirement(tributeResponse.data.requirement);

        // Get available submissions for tribute
        const submissionsResponse = await api.get(`/factions/trainers/${trainerId}/submissions/available-for-tribute`);
        setAvailableSubmissions(submissionsResponse.data.submissions || []);
      } catch (err) {
        console.error('Error fetching tribute data:', err);
        setError('Failed to load tribute requirements');
      }
    };

    if (trainerId && faction?.id) {
      fetchData();
    }
  }, [trainerId, faction]);

  const handleSubmit = async (e) => {
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
        submission_type: useExistingSubmission ? selectedSubmission.content_type : submissionType,
        submission_url: useExistingSubmission ? selectedSubmission.url : submissionUrl,
        submission_description: useExistingSubmission ? 
          `Using existing submission: ${selectedSubmission.title}. ${submissionDescription || selectedSubmission.description}` : 
          submissionDescription,
        submission_id: useExistingSubmission ? selectedSubmission.id : null,
        item_requirement: tributeRequirement.requirements?.item_requirement || null,
        currency_requirement: tributeRequirement.requirements?.currency_requirement || 0
      };

      const response = await api.post(`/factions/${faction.id}/tributes`, tributeData);

      if (response.data.success) {
        onSubmit();
      }
    } catch (err) {
      console.error('Error submitting tribute:', err);
      setError(err.response?.data?.message || 'Failed to submit tribute');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tribute-modal-overlay" onClick={onClose}>
      <div className="tribute-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Submit Tribute to {faction.name}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          {!tributeRequirement ? (
            <div className="no-tribute">
              <p>No tribute required at your current standing level.</p>
              <p>Gain more standing with {faction.name} to unlock tribute opportunities!</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="tribute-info">
                <h4>Tribute for: {tributeRequirement.title.name}</h4>
                <div className="title-requirements">
                  <span>Standing Required: {tributeRequirement.title.standing_requirement}</span>
                  <span>Your Standing: {tributeRequirement.current_standing}</span>
                </div>
                {tributeRequirement.requirements && (
                  <div className="tribute-requirements">
                    <h5>Requirements:</h5>
                    {tributeRequirement.requirements.item_requirement && (
                      <p><strong>Item:</strong> {tributeRequirement.requirements.item_requirement}</p>
                    )}
                    {tributeRequirement.requirements.currency_requirement > 0 && (
                      <p><strong>Currency:</strong> {tributeRequirement.requirements.currency_requirement}</p>
                    )}
                    <div className="tribute-prompt">
                      <strong>Prompt:</strong>
                      <p>{tributeRequirement.requirements.prompt}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Submission Method:</label>
                <div className="submission-method-toggle">
                  <button
                    type="button"
                    className={useExistingSubmission ? 'active' : ''}
                    onClick={() => setUseExistingSubmission(true)}
                  >
                    Use Existing Submission
                  </button>
                  <button
                    type="button"
                    className={!useExistingSubmission ? 'active' : ''}
                    onClick={() => setUseExistingSubmission(false)}
                  >
                    Create New Submission
                  </button>
                </div>
              </div>

              {useExistingSubmission ? (
                <div className="existing-submission-selector">
                  <div className="form-group">
                    <label htmlFor="submission-select">Select Submission:</label>
                    {availableSubmissions.length === 0 ? (
                      <p className="no-submissions">
                        No available submissions. All your submissions have already been used for faction standing or tributes.
                        <br />Switch to "Create New Submission" to create a new one.
                      </p>
                    ) : (
                      <select
                        id="submission-select"
                        value={selectedSubmission?.id || ''}
                        onChange={(e) => {
                          const submission = availableSubmissions.find(s => s.id === parseInt(e.target.value));
                          setSelectedSubmission(submission);
                        }}
                        required
                      >
                        <option value="">Select a submission</option>
                        {availableSubmissions.map(submission => (
                          <option key={submission.id} value={submission.id}>
                            {submission.title} ({submission.content_type})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {selectedSubmission && (
                    <div className="selected-submission-preview">
                      <h5>Selected Submission:</h5>
                      <div className="submission-preview">
                        <h6>{selectedSubmission.title}</h6>
                        <p>{selectedSubmission.description}</p>
                        <a href={selectedSubmission.url} target="_blank" rel="noopener noreferrer">
                          View Submission
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="additional-description">
                      Additional Description (Optional):
                    </label>
                    <textarea
                      id="additional-description"
                      value={submissionDescription}
                      onChange={(e) => setSubmissionDescription(e.target.value)}
                      placeholder="Add any additional context for how this submission fulfills the tribute prompt..."
                      rows={3}
                    />
                  </div>
                </div>
              ) : (
                <div className="new-submission-form">
                  <div className="form-group">
                    <label htmlFor="submission-type">Submission Type:</label>
                    <select
                      id="submission-type"
                      value={submissionType}
                      onChange={(e) => setSubmissionType(e.target.value)}
                      required
                    >
                      <option value="art">Art Submission</option>
                      <option value="writing">Writing Submission</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="submission-url">
                      Submission URL: <span className="required">*</span>
                    </label>
                    <input
                      type="url"
                      id="submission-url"
                      value={submissionUrl}
                      onChange={(e) => setSubmissionUrl(e.target.value)}
                      placeholder="https://example.com/your-submission"
                      required
                    />
                    <small>Link to your art or writing submission (DeviantArt, Google Docs, etc.)</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="submission-description">
                      Description: <span className="required">*</span>
                    </label>
                    <textarea
                      id="submission-description"
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
                <div className="error-message">
                  <i className="fas fa-exclamation-triangle"></i>
                  {error}
                </div>
              )}

              <div className="form-actions">
                <button type="button" onClick={onClose} className="cancel-button">
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submit-button"
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

export default TributeSubmissionModal;
