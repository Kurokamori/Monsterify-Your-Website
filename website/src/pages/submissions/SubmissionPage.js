import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import ArtGallery from '../../components/submissions/ArtGallery';
import WritingLibrary from '../../components/submissions/WritingLibrary';
import useDocumentTitle from '../../hooks/useDocumentTitle';

const SubmissionPage = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Set document title based on current path
  const getPageTitle = () => {
    if (location.pathname === '/gallery') return 'Gallery';
    if (location.pathname === '/library') return 'Library';
    return 'Submissions';
  };
  
  useDocumentTitle(getPageTitle());

  // State
  const [activeTab, setActiveTab] = useState(location.pathname === '/submissions' ? 'submission-types' : 'art-gallery');

  // Set active tab based on URL path
  useEffect(() => {
    if (location.pathname === '/gallery') {
      setActiveTab('art-gallery');
    } else if (location.pathname === '/library') {
      setActiveTab('writing-library');
    } else if (location.pathname === '/submissions') {
      setActiveTab('submission-types');
    }
  }, [location.pathname]);

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
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

  return (
    <div className="page-container">

        <div className="page-title">
          <h1>
            {location.pathname === '/gallery' ? 'Art Gallery' :
             location.pathname === '/library' ? 'Writing Library' :
             'Submissions'}
          </h1>
          <p>
            {location.pathname === '/gallery' ? 'Browse artwork from the community' :
             location.pathname === '/library' ? 'Explore stories and written works' :
             'Share your creativity and earn rewards'}
          </p>
        </div>

      {location.pathname !== '/gallery' && location.pathname !== '/library' && (
        <div className="submission-tabs">
          <button
            className={`tab-button ${activeTab === 'submission-types' ? 'active' : ''}`}
            onClick={() => handleTabChange('submission-types')}
          >
            <i className="fas fa-plus-circle"></i> Create Submission
          </button>
          <button
            className={`tab-button ${activeTab === 'art-gallery' ? 'active' : ''}`}
            onClick={() => handleTabChange('art-gallery')}
          >
            <i className="fas fa-images"></i> Art Gallery
          </button>
          <button
            className={`tab-button ${activeTab === 'writing-library' ? 'active' : ''}`}
            onClick={() => handleTabChange('writing-library')}
          >
            <i className="fas fa-book"></i> Writing Library
          </button>
          <button
            className={`tab-button ${activeTab === 'my-submissions' ? 'active' : ''}`}
            onClick={() => handleTabChange('my-submissions')}
          >
            <i className="fas fa-user"></i> My Submissions
          </button>
        </div>
      )}

      <div className="submission-content">
        {activeTab === 'submission-types' && (
          <div className="submission-types-container">
            <h2>Create a New Submission</h2>
            <p>Choose a submission type below to get started. Each type offers different rewards and opportunities.</p>

            <div className="submission-types-grid">
              <div className="submission-type-card" onClick={() => navigateToSubmission('art')}>
                <div className="submission-type-icon">
                  <i className="fas fa-paint-brush"></i>
                </div>
                <h3>Art Submission</h3>
                <p>Submit your artwork and earn rewards based on quality and complexity.</p>
                <button className="submission-type-button">
                  <i className="fas fa-arrow-right"></i> Submit Art
                </button>
              </div>

              <div className="submission-type-card" onClick={() => navigateToSubmission('writing')}>
                <div className="submission-type-icon">
                  <i className="fas fa-pen-fancy"></i>
                </div>
                <h3>Writing Submission</h3>
                <p>Submit stories, poems, and other written works to earn rewards based on word count.</p>
                <button className="submission-type-button">
                  <i className="fas fa-arrow-right"></i> Submit Writing
                </button>
              </div>

              <div className="submission-type-card" onClick={() => navigateToSubmission('trainer-reference')}>
                <div className="submission-type-icon">
                  <i className="fas fa-user"></i>
                </div>
                <h3>Trainer Reference</h3>
                <p>Submit reference images for your trainers to help artists draw your characters accurately.</p>
                <button className="submission-type-button">
                  <i className="fas fa-arrow-right"></i> Submit Reference
                </button>
              </div>

              <div className="submission-type-card" onClick={() => navigateToSubmission('monster-reference')}>
                <div className="submission-type-icon">
                  <i className="fas fa-dragon"></i>
                </div>
                <h3>Monster Reference</h3>
                <p>Submit reference images for your monsters to help artists draw them accurately.</p>
                <button className="submission-type-button">
                  <i className="fas fa-arrow-right"></i> Submit Reference
                </button>
              </div>

              <div className="submission-type-card" onClick={() => navigateToSubmission('mega-image-reference')}>
                <div className="submission-type-icon">
                  <i className="fas fa-bolt"></i>
                </div>
                <h3>Mega Image Reference</h3>
                <p>Submit mega evolution images for your monsters to display their mega forms.</p>
                <button className="submission-type-button">
                  <i className="fas fa-arrow-right"></i> Submit Mega Image
                </button>
              </div>

              <div className="submission-type-card" onClick={() => navigateToSubmission('trainer-mega-reference')}>
                <div className="submission-type-icon">
                  <i className="fas fa-user-shield"></i>
                </div>
                <h3>Trainer Mega Reference</h3>
                <p>Submit mega evolution images for your trainers with optional mega information.</p>
                <button className="submission-type-button">
                  <i className="fas fa-arrow-right"></i> Submit Trainer Mega
                </button>
              </div>

              <div className="submission-type-card prompt-card">
                <div className="submission-type-icon">
                  <i className="fas fa-lightbulb"></i>
                </div>
                <h3>Prompt Submissions</h3>
                <p>Complete specific prompts to earn special rewards and participate in events.</p>
                <div className="prompt-buttons">
                  <button className="prompt-button" onClick={() => navigateToSubmission('prompt', 'general')}>
                    General
                  </button>
                  <button className="prompt-button" onClick={() => navigateToSubmission('prompt', 'progression')}>
                    Progression
                  </button>
                  <button className="prompt-button" onClick={() => navigateToSubmission('prompt', 'monthly')}>
                    Monthly
                  </button>
                  <button className="prompt-button" onClick={() => navigateToSubmission('prompt', 'event')}>
                    Event
                  </button>
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

      {/* Prompt submissions now use dedicated pages */}

      {/* Reward Information - only show on main submissions page */}
      {location.pathname !== '/gallery' && location.pathname !== '/library' && (
        <div className="reward-info-container">
          <h2>Submission Rewards</h2>
          <p>
            Share your creativity and earn rewards for your trainers and monsters! Each submission type offers different rewards,
            and all submissions contribute to your garden points, mission progress, and boss damage.
          </p>

        <div className="reward-categories">
          <div className="reward-category">
            <div className="reward-category-icon">
              <i className="fas fa-paint-brush"></i>
            </div>
            <h3>Art Submissions</h3>
            <p>
              Submit your artwork and earn rewards based on quality and complexity.
              Higher quality submissions earn more rewards!
            </p>
            <div className="reward-examples">
              <div className="reward-example">
                <span className="reward-type">Sketch:</span>
                <span className="reward-value">2 Lvls, 100 coins</span>
              </div>
              <div className="reward-example">
                <span className="reward-type">Rendered:</span>
                <span className="reward-value">5 lvls, 250 coins</span>
              </div>
              <div className="reward-example">
                <span className="reward-type">Polished:</span>
                <span className="reward-value">7 lvls, 350 coins</span>
              </div>
            </div>
          </div>

          <div className="reward-category">
            <div className="reward-category-icon">
              <i className="fas fa-pen-fancy"></i>
            </div>
            <h3>Writing Submissions</h3>
            <p>
              Submit your stories, poems, and other written works to earn rewards based on
              word count and quality.
            </p>
            <div className="reward-examples">
              <div className="reward-example">
                <span className="reward-type">Short (500-1000 words):</span>
                <span className="reward-value">10-20 lvls, 500-1000 coins</span>
              </div>
              <div className="reward-example">
                <span className="reward-type">Medium (1000-3000 words):</span>
                <span className="reward-value">20-60 lvls, 1000-3000 coins</span>
              </div>
              <div className="reward-example">
                <span className="reward-type">Long (3000+ words):</span>
                <span className="reward-value">60+ lvls, 3000+ coins</span>
              </div>
            </div>
          </div>
        </div>

        <div className="reward-categories">
          <div className="reward-category">
            <div className="reward-category-icon">
              <i className="fas fa-user"></i>
            </div>
            <h3>Reference Submissions</h3>
            <p>
              Submit reference images for your trainers and monsters to help artists draw them accurately.
            </p>
            <div className="reward-examples">
              <div className="reward-example">
                <span className="reward-type">Trainer Reference:</span>
                <span className="reward-value">6 lvls, 200 coins</span>
              </div>
              <div className="reward-example">
                <span className="reward-type">Monster Reference:</span>
                <span className="reward-value">6 lvls, 200 coins</span>
              </div>
              <div className="reward-example">
                <span className="reward-type">Monster Mega Image:</span>
                <span className="reward-value">6 lvls, 200 coins</span>
              </div>
              <div className="reward-example">
                <span className="reward-type">Trainer Mega Image:</span>
                <span className="reward-value">9 lvls, 200 coins</span>
              </div>
            </div>
          </div>
        </div>

        <div className="reward-bonus">
          <h3>Additional Rewards</h3>
          <p>
            All submissions also provide additional benefits to your trainers and the community!
          </p>
          <ul className="bonus-list">
            <li>
              <i className="fas fa-seedling"></i>
              <span>Garden Points: +5-20 points per submission</span>
            </li>
            <li>
              <i className="fas fa-tasks"></i>
              <span>Mission Progress: +1-3 progress per submission</span>
            </li>
            <li>
              <i className="fas fa-dragon"></i>
              <span>Boss Damage: +5-15 damage per submission</span>
            </li>
            <li>
              <i className="fas fa-gift"></i>
              <span>Special Items: Chance to earn rare items</span>
            </li>
          </ul>
        </div>
      </div>
      )}
    </div>
  );
};

export default SubmissionPage;
