import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import MarkdownRenderer from '../../components/guides/MarkdownRenderer';
import GuideSidebar from '../../components/guides/GuideSidebar';
import GuideCategoryTabs from '../../components/guides/GuideCategoryTabs';
import guidesService from '../../services/guidesService';
import useDocumentTitle from '../../hooks/useDocumentTitle';

const GuidesPage = () => {
  return (
    <Routes>
      <Route index element={<GuideCategoryIndex />} />
      <Route path=":category" element={<GuideCategory />} />
      <Route path=":category/*" element={<GuideContent />} />
    </Routes>
  );
};

// Main index page showing all categories
const GuideCategoryIndex = () => {
  useDocumentTitle('Guides');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState({});

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await guidesService.getCategories();
      setCategories(response);
    } catch (err) {
      console.error('Error fetching guide categories:', err);
      setError('Failed to load guide categories. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading guide categories..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        message={error}
        onRetry={fetchCategories}
      />
    );
  }

  return (
    <div className="main-content-container">
      <div className="lore-header">
        <h1>Guides & Documentation</h1>
        <p>Learn everything you need to know about the game</p>
      </div>

      <div className="guide-categories-grid">
        {Object.keys(categories).map(key => (
          <Link to={`/guides/${key}`} className="guide-card" key={key}>
            <div className="guide-category-icon">
              <i className={getCategoryIcon(key)}></i>
            </div>
            <h2>{categories[key].name}</h2>
            <p>{getCategoryDescription(key)}</p>
          </Link>
        ))}
        <Link to="/guides/interactive-map" className="guide-card" key="map">
          <div className="guide-category-icon">
            <i className="fas fa-map-marked-alt"></i>
          </div>
          <h2>Map</h2>
          <p>Navigate through the world with our interactive map system.</p>
        </Link>
      </div>

      <div className="auth-header">
        <h2>Tools</h2>
        <div className="guide-categories-grid">
          <Link to="/guides/type-calculator" className="guide-card">
            <div className="guide-category-icon">
              <i className="fas fa-calculator"></i>
            </div>
            <h2>Type Calculator</h2>
            <p>Calculate type effectiveness and damage multipliers.</p>
          </Link>
          <Link to="/guides/evolution-explorer" className="guide-card">
            <div className="guide-category-icon">
              <i className="fas fa-dna"></i>
            </div>
            <h2>Evolution Explorer</h2>
            <p>Explore evolution chains and requirements.</p>
          </Link>
          <Link to="/guides/ability-database" className="guide-card">
            <div className="guide-category-icon">
              <i className="fas fa-bolt"></i>
            </div>
            <h2>Ability Database</h2>
            <p>Browse and search all available abilities.</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

// Category overview page
const GuideCategory = () => {
  const { category } = useParams();
  useDocumentTitle(`${category.charAt(0).toUpperCase() + category.slice(1)} - Guides`);
  
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showLoading, setShowLoading] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState({});
  const [content, setContent] = useState('');

  useEffect(() => {
    fetchCategoryContent();
  }, [category]);

  const fetchCategoryContent = async () => {
    try {
      setError(null);
      setLoading(true);
      
      // Delay showing loading indicator to prevent flash
      const loadingTimeout = setTimeout(() => setShowLoading(true), 200);

      // Fetch all categories for the tabs
      const categoriesResponse = await guidesService.getCategories();
      setCategories(categoriesResponse);

      // Fetch the content for this category
      const contentResponse = await guidesService.getGuideContent(category);
      setContent(contentResponse.content);

      clearTimeout(loadingTimeout);
    } catch (err) {
      console.error(`Error fetching content for category ${category}:`, err);
      setError('Failed to load guide content. Please try again later.');
    } finally {
      setLoading(false);
      setShowLoading(false);
    }
  };

  if (showLoading) {
    return <LoadingSpinner message={`Loading ${category} guides...`} />;
  }

  if (error) {
    return (
      <ErrorMessage
        message={error}
        onRetry={fetchCategoryContent}
      />
    );
  }

  return (
    <div className="main-content-container">
      <GuideCategoryTabs categories={categories} activeCategory={category} />

      <div className="guide-content-layout">
        <div className="guide-sidebar-container">
          {categories[category] && (
            <GuideSidebar
              structure={categories[category].structure}
              category={category}
            />
          )}
        </div>

        <div className="town-section">
          <MarkdownRenderer content={content} />
        </div>
      </div>
    </div>
  );
};

// Individual guide content page
const GuideContent = () => {
  const { category } = useParams();
  const location = useLocation();
  useDocumentTitle(`${category.charAt(0).toUpperCase() + category.slice(1)} - Guides`);
  
  const [loading, setLoading] = useState(true);
  const [showLoading, setShowLoading] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState({});
  const [content, setContent] = useState('');

  // Extract the path from the URL
  const path = location.pathname.replace(`/guides/${category}/`, '');

  useEffect(() => {
    fetchGuideContent();
  }, [category, path]);

  const fetchGuideContent = async () => {
    try {
      setError(null);
      setLoading(true);
      
      // Delay showing loading indicator to prevent flash
      const loadingTimeout = setTimeout(() => setShowLoading(true), 200);

      // Fetch all categories for the tabs and sidebar
      const categoriesResponse = await guidesService.getCategories();
      setCategories(categoriesResponse);

      // Fetch the content for this specific guide
      const contentResponse = await guidesService.getGuideContent(category, path);
      setContent(contentResponse.content);

      clearTimeout(loadingTimeout);
    } catch (err) {
      console.error(`Error fetching guide content for ${category}/${path}:`, err);
      setError('Failed to load guide content. Please try again later.');
    } finally {
      setLoading(false);
      setShowLoading(false);
    }
  };

  if (showLoading) {
    return <LoadingSpinner message="Loading guide content..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        message={error}
        onRetry={fetchGuideContent}
      />
    );
  }

  return (
    <div className="main-content-container">
      <GuideCategoryTabs categories={categories} activeCategory={category} />

      <div className="guide-content-layout">
        <div className="guide-sidebar-container">
          {categories[category] && (
            <GuideSidebar
              structure={categories[category].structure}
              category={category}
            />
          )}
        </div>

        <div className="town-section">
          <MarkdownRenderer content={content} />
        </div>
      </div>
    </div>
  );
};

// Helper function to get icon for category
const getCategoryIcon = (category) => {
  const icons = {
    guides: 'fas fa-book',
    lore: 'fas fa-scroll',
    factions: 'fas fa-flag',
    npcs: 'fas fa-user',
    'interactive-map': 'fas fa-globe-americas'
  };

  return icons[category] || 'fas fa-book';
};

// Helper function to get description for category
const getCategoryDescription = (category) => {
  const descriptions = {
    guides: 'Learn how to play the game with comprehensive guides and tutorials.',
    lore: 'Explore the rich history and mythology of the game world.',
    factions: 'Discover the different factions and their unique philosophies and goals.',
    npcs: 'Meet the important non-player characters that inhabit the game world.',
    'interactive-map': 'Navigate through the world with our interactive map system.'
  };

  return descriptions[category] || 'Explore guides and documentation.';
};

export default GuidesPage;
