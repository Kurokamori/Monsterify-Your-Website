import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import MonsterReferenceSubmissionForm from '../../components/submissions/MonsterReferenceSubmissionForm';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const MonsterReferenceSubmissionPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Handle submission complete
  const handleSubmissionComplete = (result) => {
    setSubmissionSuccess(true);
    setLoading(false);

    // Redirect to gallery after a short delay
    setTimeout(() => {
      navigate('/gallery');
    }, 3000);
  };

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    navigate('/login?redirect=/submissions/monster-reference');
    return null;
  }

  return (
    <div className="edit-monster-container">
      <div className="map-header">
        <h1>Submit Monster References</h1>
        <p>Submit reference images for your monsters to help artists draw them accurately.</p>
      </div>

      {submissionSuccess ? (
        <div className="submission-success">
          <div className="success-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <h2>Submission Successful!</h2>
          <p>
            Your monster reference(s) have been received successfully!
          </p>
          <p>Redirecting to gallery...</p>
          {loading && <LoadingSpinner />}
        </div>
      ) : (
        <div className="town-section">
          <MonsterReferenceSubmissionForm onSubmissionComplete={handleSubmissionComplete} />
        </div>
      )}
    </div>
  );
};

export default MonsterReferenceSubmissionPage;
