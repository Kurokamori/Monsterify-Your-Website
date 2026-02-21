import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@contexts/useAuth';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { PageHeader } from '@components/layouts/PageHeader';
import { ArtGallery, WritingLibrary, MySubmissions } from '@components/submissions';

type SubmissionTab = 'art-gallery' | 'writing-library' | 'submission-types' | 'my-submissions';

const TAB_PARAM_MAP: Record<string, SubmissionTab> = {
  gallery: 'art-gallery',
  library: 'writing-library',
  submit: 'submission-types',
  'my-submissions': 'my-submissions',
};

const TAB_TO_PARAM: Record<SubmissionTab, string> = {
  'art-gallery': 'gallery',
  'writing-library': 'library',
  'submission-types': 'submit',
  'my-submissions': 'my-submissions',
};

const TAB_HEADERS: Record<SubmissionTab, { title: string; subtitle: string }> = {
  'art-gallery': { title: 'Art Gallery', subtitle: 'Browse artwork from the community' },
  'writing-library': { title: 'Writing Library', subtitle: 'Explore stories and written works' },
  'my-submissions': { title: 'My Submissions', subtitle: 'View and manage your submissions' },
  'submission-types': { title: 'Submissions', subtitle: 'Share your creativity and earn rewards' },
};

const SubmissionPage = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const getTabFromUrl = (): SubmissionTab => {
    const tabParam = searchParams.get('tab');
    if (tabParam && tabParam in TAB_PARAM_MAP) {
      return TAB_PARAM_MAP[tabParam];
    }
    if (location.pathname === '/gallery') return 'art-gallery';
    if (location.pathname === '/library') return 'writing-library';
    return 'submission-types';
  };

  const [activeTab, setActiveTab] = useState<SubmissionTab>(getTabFromUrl);

  const headerInfo = TAB_HEADERS[activeTab];
  useDocumentTitle(headerInfo.title);

  useEffect(() => {
    setActiveTab(getTabFromUrl());
  }, [location.pathname, searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTabChange = (tab: SubmissionTab) => {
    navigate(`/submissions?tab=${TAB_TO_PARAM[tab]}`);
  };

  const navigateToSubmission = (type: string, category = 'general') => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/submissions/${type}`);
      return;
    }
    if (type === 'prompt') {
      navigate(`/submissions/${type}/${category}`);
      return;
    }
    navigate(`/submissions/${type}`);
  };

  return (
    <div className="main-container">
      <PageHeader title={headerInfo.title} subtitle={headerInfo.subtitle} />

      <div className="type-tags">
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
          <SubmissionTypesContent onNavigate={navigateToSubmission} />
        )}
        {activeTab === 'art-gallery' && <ArtGallery />}
        {activeTab === 'writing-library' && <WritingLibrary />}
        {activeTab === 'my-submissions' && <MySubmissions />}
      </div>
    </div>
  );
};

function SubmissionTypesContent({ onNavigate }: { onNavigate: (type: string, category?: string) => void }) {
  return (
    <div>
      <div className="submit-types-intro">
        <h2>Create a New Submission</h2>
        <p>Choose a submission type below to get started. Each type offers different rewards and opportunities.</p>
      </div>

      <div>
        <div className="submission-types-section">
          <h2 className="submission-types-heading">Generic Submissions</h2>
          <div className="refs-grid">
            <div className="adopt-card" onClick={() => onNavigate('art')}>
              <div className="submission-type-icon">
                <i className="fas fa-paint-brush"></i>
              </div>
              <h3>Art Submission</h3>
              <p>Submit your artwork and earn rewards based on quality and complexity.</p>
              <button className="button primary">
                <i className="fas fa-arrow-right"></i> Submit Art
              </button>
            </div>

            <div className="adopt-card" onClick={() => onNavigate('writing')}>
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
          <div className="refs-grid">
            <div className="adopt-card" onClick={() => onNavigate('trainer-reference')}>
              <div className="submission-type-icon">
                <i className="fas fa-user"></i>
              </div>
              <h3>Trainer Reference</h3>
              <p>Submit reference images for your trainers to help artists draw your characters accurately.</p>
              <button className="button primary">
                <i className="fas fa-arrow-right"></i> Submit Reference
              </button>
            </div>

            <div className="adopt-card" onClick={() => onNavigate('monster-reference')}>
              <div className="submission-type-icon">
                <i className="fas fa-dragon"></i>
              </div>
              <h3>Monster Reference</h3>
              <p>Submit reference images for your monsters to help artists draw them accurately.</p>
              <button className="button primary">
                <i className="fas fa-arrow-right"></i> Submit Reference
              </button>
            </div>

            <div className="adopt-card" onClick={() => onNavigate('mega-image-reference')}>
              <div className="submission-type-icon">
                <i className="fas fa-bolt"></i>
              </div>
              <h3>Mega Image Reference</h3>
              <p>Submit mega evolution images for your monsters to display their mega forms.</p>
              <button className="button primary">
                <i className="fas fa-arrow-right"></i> Submit Mega Image
              </button>
            </div>

            <div className="adopt-card" onClick={() => onNavigate('trainer-mega-reference')}>
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
          <h2 className="submission-types-heading">External Submissions</h2>
          <p className="submission-types-description">Submit artwork or writing created outside the game for reduced rewards. Levels are allocated manually after submission.</p>
          <div className="refs-grid">
            <div className="adopt-card" onClick={() => onNavigate('external/art')}>
              <div className="submission-type-icon">
                <i className="fas fa-palette"></i>
              </div>
              <h3>External Art</h3>
              <p>Submit fan art, commissions, or other artwork not created for the game. Earns half the normal art levels.</p>
              <button className="button primary">
                <i className="fas fa-arrow-right"></i> Submit External Art
              </button>
            </div>

            <div className="adopt-card" onClick={() => onNavigate('external/writing')}>
              <div className="submission-type-icon">
                <i className="fas fa-scroll"></i>
              </div>
              <h3>External Writing</h3>
              <p>Submit fan fiction, published stories, or other writing not created for the game. Earns 1 level per 100 words.</p>
              <button className="button primary">
                <i className="fas fa-arrow-right"></i> Submit External Writing
              </button>
            </div>
          </div>
        </div>

        <div className="submission-types-section">
          <h2 className="submission-types-heading">Prompt Submissions</h2>
          <div className="adopt-card prompt-card">
            <div className="submission-type-icon">
              <i className="fas fa-lightbulb"></i>
            </div>
            <h3>Prompt Submissions</h3>
            <p>Complete specific prompts to earn special rewards and participate in events.</p>
            <div className="type-tags">
              <button className="button primary" onClick={() => onNavigate('prompt', 'general')}>General</button>
              <button className="button primary" onClick={() => onNavigate('prompt', 'progression')}>Progression</button>
              <button className="button primary" onClick={() => onNavigate('prompt', 'monthly')}>Monthly</button>
              <button className="button primary" onClick={() => onNavigate('prompt', 'event')}>Event</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SubmissionPage;
