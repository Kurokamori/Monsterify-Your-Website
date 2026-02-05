import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import MegaImageReferenceSubmissionForm from '../../components/submissions/MegaImageReferenceSubmissionForm';

const MegaImageReferenceSubmissionPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleSubmissionComplete = (result) => {
    console.log('Mega image reference submission completed:', result);
    // Navigate back to submissions page or show success message
    navigate('/submissions');
  };

  if (!currentUser) {
    return (
      <div className="submission-page">
        <div className="submission-container">
          <div className="auth-required">
            <h2>Authentication Required</h2>
            <p>Please log in to submit mega image references.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="submission-page">
      <div className="submission-container">
        <div className="submission-header">
          <button 
            className="button button-secondary"
            onClick={() => navigate('/submissions')}
          >
            <i className="fas fa-arrow-left"></i> Back to Submissions
          </button>
        </div>
        
        <MegaImageReferenceSubmissionForm 
          onSubmissionComplete={handleSubmissionComplete}
        />
      </div>
    </div>
  );
};

export default MegaImageReferenceSubmissionPage;
