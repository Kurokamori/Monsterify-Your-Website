import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import PromptSubmissionWizard from '../../components/submissions/PromptSubmissionWizard';
import PageHeader from '../../components/layout/PageHeader';

/**
 * PromptSubmissionPage - Container page for prompt submissions
 *
 * Uses the PromptSubmissionWizard for a multi-step flow:
 * 1. Select trainer and prompt, choose art or writing
 * 2. Full art/writing submission with calculators
 * 3. Claim all rewards (art/writing + prompt rewards)
 */
const PromptSubmissionPage = () => {
  const { category = 'general' } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/submissions/prompt/' + category);
    }
  }, [isAuthenticated, navigate, category]);

  // Format category name for display
  const formatCategoryName = (cat) => {
    return cat.charAt(0).toUpperCase() + cat.slice(1);
  };

  // Handle wizard completion
  const handleComplete = (result) => {
    console.log('Prompt submission wizard completed:', result);
    // Navigate to gallery or stay on page
    navigate('/gallery');
  };

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="bazar-container">
      <PageHeader title={`${formatCategoryName(category)} Prompt Submission`} />

      <PromptSubmissionWizard
        category={category}
        onComplete={handleComplete}
      />
    </div>
  );
};

export default PromptSubmissionPage;
