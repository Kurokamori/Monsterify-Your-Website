import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import ArtGallery from '../../components/submissions/ArtGallery';
import WritingLibrary from '../../components/submissions/WritingLibrary';
import useDocumentTitle from '../../hooks/useDocumentTitle';

const SubmissionPage = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get tab from URL query param or path
  const getTabFromUrl = () => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      switch (tabParam) {
        case 'gallery': return 'art-gallery';
        case 'library': return 'writing-library';
        case 'submit': return 'submission-types';
        case 'my-submissions': return 'my-submissions';
        default: return 'submission-types';
      }
    }
    // Handle legacy routes
    if (location.pathname === '/gallery') return 'art-gallery';
    if (location.pathname === '/library') return 'writing-library';
    return 'submission-types';
  };

  // Set document title based on current tab
  const getPageTitle = () => {
    const tab = getTabFromUrl();
    switch (tab) {
      case 'art-gallery': return 'Gallery';
      case 'writing-library': return 'Library';
      case 'my-submissions': return 'My Submissions';
      default: return 'Submissions';
    }
  };

  useDocumentTitle(getPageTitle());

  // State
  const [activeTab, setActiveTab] = useState(getTabFromUrl());

  // Set active tab based on URL
  useEffect(() => {
    setActiveTab(getTabFromUrl());
  }, [location.pathname, searchParams]);

  // Handle tab change - navigate via URL
  const handleTabChange = (tab) => {
    const tabMap = {
      'submission-types': 'submit',
      'art-gallery': 'gallery',
      'writing-library': 'library',
      'my-submissions': 'my-submissions'
    };
    navigate(`/submissions?tab=${tabMap[tab]}`);
  };

  // Navigate to submission page
  const navigateToSubmission = (type, category = 'general') => {
    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      navigate(`/login?redirect=/submissions/${type}`);
      return;
    }

    // For prompt submissions, include the category
    if (type === 'prompt') {
      navigate(`/submissions/${type}/${category}`);
      return;
    }

    // For other submission types, navigate to the dedicated page
    navigate(`/submissions/${type}`);
  };

  // All submission types now use dedicated pages

  // Get page header text based on active tab
  const getHeaderText = () => {
    switch (activeTab) {
      case 'art-gallery': return { title: 'Art Gallery', subtitle: 'Browse artwork from the community' };
      case 'writing-library': return { title: 'Writing Library', subtitle: 'Explore stories and written works' };
      case 'my-submissions': return { title: 'My Submissions', subtitle: 'View and manage your submissions' };
      default: return { title: 'Submissions', subtitle: 'Share your creativity and earn rewards' };
    }
  };

  const headerText = getHeaderText();

  return (
    <div className="page-container">

        <div className="page-title">
          <h1>{headerText.title}</h1>
          <p>{headerText.subtitle}</p>
        </div>

        <div className="submission-tabs">
          <button
            className={`button tab ${activeTab === 'art-gallery' ? 'active' : ''}`}
            onClick={() => handleTabChange('art-gallery')}
          >
            <i className="fas fa-images"></i> Gallery
          </button>
          <button
            className={`button tab ${activeTab === 'writing-library' ? 'active' : ''}`}
            onClick={() => handleTabChange('writing-library')}
          >
            <i className="fas fa-book"></i> Library
          </button>
          {isAuthenticated && (
            <>
              <button
                className={`button tab ${activeTab === 'submission-types' ? 'active' : ''}`}
                onClick={() => handleTabChange('submission-types')}
              >
                <i className="fas fa-plus-circle"></i> Submit
              </button>
              <button
                className={`button tab ${activeTab === 'my-submissions' ? 'active' : ''}`}
                onClick={() => handleTabChange('my-submissions')}
              >
                <i className="fas fa-user"></i> My Submissions
              </button>
            </>
          )}
        </div>

      <div className="submission-content">
        {activeTab === 'submission-types' && (
          <div className="submission-types-container">
            <h2>Create a New Submission</h2>
            <p>Choose a submission type below to get started. Each type offers different rewards and opportunities.</p>

            <div className="submission-types-grid-row">
              <div className="submission-types-section">
                <h2 className="submission-types-heading">Generic Submissions</h2>
              <div className="submission-types-grid-column">
                <div className="submission-type-card" onClick={() => navigateToSubmission('art')}>
                  <div className="submission-type-icon">
                    <i className="fas fa-paint-brush"></i>
                  </div>
                  <h3>Art Submission</h3>
                  <p>Submit your artwork and earn rewards based on quality and complexity.</p>
                  <button className="button primary">
                    <i className="fas fa-arrow-right"></i> Submit Art
                  </button>
                </div>

                <div className="submission-type-card" onClick={() => navigateToSubmission('writing')}>
                  <div className="submission-type-icon">
                    <i className="fas fa-pen-fancy"></i>
                  </div>
                  <h3>Writing Submission</h3>
                  <p>Submit stories, poems, and other written works to earn rewards based on word count.</p>
                  <button className="button primary">
                    <i className="fas fa-arrow-right"></i> Submit Writing
                  </button>
                </div>
              </div>
              </div>
              <div className="submission-types-section">
                <h2 className="submission-types-heading">Reference Submissions</h2>
              <div className="submission-types-grid-column">
              <div className="submission-type-card" onClick={() => navigateToSubmission('trainer-reference')}>
                <div className="submission-type-icon">
                  <i className="fas fa-user"></i>
                </div>
                <h3>Trainer Reference</h3>
                <p>Submit reference images for your trainers to help artists draw your characters accurately.</p>
                <button className="button primary">
                  <i className="fas fa-arrow-right"></i> Submit Reference
                </button>
              </div>

              <div className="submission-type-card" onClick={() => navigateToSubmission('monster-reference')}>
                <div className="submission-type-icon">
                  <i className="fas fa-dragon"></i>
                </div>
                <h3>Monster Reference</h3>
                <p>Submit reference images for your monsters to help artists draw them accurately.</p>
                <button className="button primary">
                  <i className="fas fa-arrow-right"></i> Submit Reference
                </button>
              </div>

              <div className="submission-type-card" onClick={() => navigateToSubmission('mega-image-reference')}>
                <div className="submission-type-icon">
                  <i className="fas fa-bolt"></i>
                </div>
                <h3>Mega Image Reference</h3>
                <p>Submit mega evolution images for your monsters to display their mega forms.</p>
                <button className="button primary">
                  <i className="fas fa-arrow-right"></i> Submit Mega Image
                </button>
              </div>

              <div className="submission-type-card" onClick={() => navigateToSubmission('trainer-mega-reference')}>
                <div className="submission-type-icon">
                  <i className="fas fa-user-shield"></i>
                </div>
                <h3>Trainer Mega Reference</h3>
                <p>Submit mega evolution images for your trainers with optional mega information.</p>
                <button className="button primary">
                  <i className="fas fa-arrow-right"></i> Submit Trainer Mega
                </button>
              </div>
              </div>
              </div>

              <div className="submission-types-section">
                <h2 className="submission-types-heading">Prompt Submissions</h2>

              <div className="submission-type-card prompt-card">
                <div className="submission-type-icon">
                  <i className="fas fa-lightbulb"></i>
                </div>
                <h3>Prompt Submissions</h3>
                <p>Complete specific prompts to earn special rewards and participate in events.</p>
                <div className="button primarys">
                  <button className="button primary" onClick={() => navigateToSubmission('prompt', 'general')}>
                    General
                  </button>
                  <button className="button primary" onClick={() => navigateToSubmission('prompt', 'progression')}>
                    Progression
                  </button>
                  <button className="button primary" onClick={() => navigateToSubmission('prompt', 'monthly')}>
                    Monthly
                  </button>
                  <button className="button primary" onClick={() => navigateToSubmission('prompt', 'event')}>
                    Event
                  </button>
                </div>
              </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'art-gallery' && (
          <ArtGallery />
        )}

        {activeTab === 'writing-library' && (
          <WritingLibrary />
        )}

        {activeTab === 'my-submissions' && (
          <div className="my-submissions-container">
            <h2>My Submissions</h2>
            <p>This feature is coming soon. You'll be able to view and manage all your submissions here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubmissionPage;
