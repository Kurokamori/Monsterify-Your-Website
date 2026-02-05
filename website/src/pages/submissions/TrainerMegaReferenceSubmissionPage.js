import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import TrainerMegaReferenceSubmissionForm from '../../components/submissions/TrainerMegaReferenceSubmissionForm';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const TrainerMegaReferenceSubmissionPage = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/submissions/trainer-mega-reference');
    }
  }, [isAuthenticated, navigate]);

  // Handle successful submission
  const handleSubmissionComplete = (response) => {
    console.log('Trainer mega reference submission completed:', response);
    setIsSubmitting(false);
    
    // Could show a success modal or redirect
    // For now, just log the success
  };

  // Handle submission start
  const handleSubmissionStart = () => {
    setIsSubmitting(true);
  };

  if (!isAuthenticated) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <LoadingSpinner />
          <p>Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="submission-page-header">
        <button 
          className="button button-secondary"
          onClick={() => navigate('/submissions')}
        >
          <i className="fas fa-arrow-left"></i> Back to Submissions
        </button>
        
        <div className="page-title">
          <h1>
            <i className="fas fa-user-shield"></i> Trainer Mega Reference Submission
          </h1>
          <p>Submit mega evolution images for your trainers with optional mega information</p>
        </div>
      </div>

      <div className="submission-form-section">
        {isSubmitting && (
          <div className="submission-overlay">
            <LoadingSpinner />
            <p>Submitting your trainer mega reference...</p>
          </div>
        )}
        
        <TrainerMegaReferenceSubmissionForm 
          onSubmissionComplete={handleSubmissionComplete}
          onSubmissionStart={handleSubmissionStart}
        />
      </div>

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
            <p>
              You can optionally provide mega information including:
            </p>
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
            <p>
              Trainer mega references provide higher rewards than regular references:
            </p>
            <ul>
              <li><strong>9 levels</strong> (compared to 6 for regular references)</li>
              <li><strong>200 coins</strong> per submission</li>
              <li><strong>Garden points</strong> for community contribution</li>
              <li><strong>Mission progress</strong> toward your goals</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainerMegaReferenceSubmissionPage;