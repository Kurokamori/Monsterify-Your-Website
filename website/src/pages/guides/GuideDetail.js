import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import api from '../../services/api';

const GuideDetail = () => {
  const { guideId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [guide, setGuide] = useState(null);
  const [relatedGuides, setRelatedGuides] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchGuideDetails();
  }, [guideId]);

  const fetchGuideDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch guide details
      const guideResponse = await api.get(`/guides/${guideId}`);
      setGuide(guideResponse.data.guide || null);
      
      // Fetch related guides
      const relatedResponse = await api.get(`/guides/related/${guideId}`);
      setRelatedGuides(relatedResponse.data.guides || []);
      
      // Fetch categories
      const categoriesResponse = await api.get('/guides/categories');
      setCategories(categoriesResponse.data.categories || []);
      
    } catch (err) {
      console.error(`Error fetching guide ${guideId}:`, err);
      setError('Failed to load guide details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Fallback data for development
  const fallbackCategories = [
    { id: 'beginner', name: 'Beginner Guides' },
    { id: 'monsters', name: 'Monster Guides' },
    { id: 'battles', name: 'Battle Guides' },
    { id: 'adventures', name: 'Adventure Guides' },
    { id: 'advanced', name: 'Advanced Strategies' }
  ];

  const fallbackGuide = {
    id: guideId,
    title: 'Getting Started with Monsterify',
    description: 'A comprehensive guide for new trainers to begin their monster adventure.',
    category: 'beginner',
    author: 'Professor Oak',
    date_published: '2023-01-15T00:00:00Z',
    image_url: 'https://via.placeholder.com/800/1e2532/d6a339?text=Getting+Started',
    read_time: '10 min',
    content: `
      <h2>Welcome to Dusk and Dawn!</h2>
      <p>If you're new to the world of monster training, this guide will help you get started on your journey to becoming a top trainer. We'll cover the basics of catching monsters, training them, and participating in battles.</p>
      
      <h3>Creating Your Trainer</h3>
      <p>The first step in your monster adventure is creating your trainer profile. Choose a name, customize your appearance, and select your starter monster. Your starter monster will be your first companion on your journey, so choose wisely!</p>
      
      <h3>Catching Monsters</h3>
      <p>To build your team, you'll need to catch monsters in the wild. Here's how:</p>
      <ol>
        <li>Explore different areas to find wild monsters</li>
        <li>Engage a wild monster in battle</li>
        <li>Weaken the monster using your own monsters' abilities</li>
        <li>Use a capture device to catch the weakened monster</li>
        <li>The weaker the monster, the higher your chances of catching it</li>
      </ol>
      
      <h3>Training Your Monsters</h3>
      <p>Once you've caught some monsters, you'll want to train them to make them stronger. There are several ways to train your monsters:</p>
      <ul>
        <li>Battle wild monsters to gain experience points</li>
        <li>Challenge other trainers to battles</li>
        <li>Complete missions and quests</li>
        <li>Use special training items to boost specific stats</li>
      </ul>
      
      <h3>Understanding Monster Types</h3>
      <p>Each monster belongs to one or more types, such as Fire, Water, Grass, etc. Types determine a monster's strengths and weaknesses in battle. For example, Water-type monsters are strong against Fire-type monsters but weak against Electric-type monsters.</p>
      
      <h3>Battling Basics</h3>
      <p>Battles are a core part of the Monsterify experience. Here are some basic battle tips:</p>
      <ul>
        <li>Choose monsters with type advantages against your opponent</li>
        <li>Balance your team with different types and abilities</li>
        <li>Use status effects to your advantage</li>
        <li>Know when to switch monsters during battle</li>
        <li>Save powerful moves for critical moments</li>
      </ul>
      
      <h3>Exploring the World</h3>
      <p>The world of Monsterify is vast and full of adventure. Visit different towns, explore forests, caves, and mountains, and discover new monsters along the way. Each area has unique monsters to catch and challenges to overcome.</p>
      
      <h3>Joining Events</h3>
      <p>Special events are held regularly in Monsterify. These events offer unique rewards, rare monsters, and exciting challenges. Keep an eye on the Events page to stay updated on current and upcoming events.</p>
      
      <h2>Next Steps</h2>
      <p>Now that you know the basics, you're ready to start your monster adventure! Check out our other guides for more detailed information on specific aspects of the game.</p>
      
      <p>Good luck, Trainer!</p>
    `
  };

  const fallbackRelatedGuides = [
    {
      id: 'monster-types',
      title: 'Understanding Monster Types',
      description: 'Learn about the different monster types, their strengths, weaknesses, and special abilities.',
      category: 'monsters',
      author: 'Professor Elm',
      date_published: '2023-02-10T00:00:00Z',
      image_url: 'https://via.placeholder.com/300/1e2532/d6a339?text=Monster+Types',
      read_time: '15 min'
    },
    {
      id: 'battle-basics',
      title: 'Battle Basics: How to Win',
      description: 'Master the fundamentals of monster battles and develop winning strategies.',
      category: 'battles',
      author: 'Champion Red',
      date_published: '2023-03-05T00:00:00Z',
      image_url: 'https://via.placeholder.com/300/1e2532/d6a339?text=Battle+Basics',
      read_time: '12 min'
    },
    {
      id: 'town-activities',
      title: 'Town Activities Guide',
      description: 'Make the most of town activities like gardening, farming, and trading.',
      category: 'beginner',
      author: 'Town Mayor',
      date_published: '2023-06-15T00:00:00Z',
      image_url: 'https://via.placeholder.com/300/1e2532/d6a339?text=Town+Activities',
      read_time: '10 min'
    }
  ];

  const displayCategories = categories.length > 0 ? categories : fallbackCategories;
  const displayGuide = guide || fallbackGuide;
  const displayRelatedGuides = relatedGuides.length > 0 ? relatedGuides : fallbackRelatedGuides;

  if (loading) {
    return <LoadingSpinner message="Loading guide..." />;
  }

  if (error) {
    return (
      <ErrorMessage 
        message={error} 
        onRetry={fetchGuideDetails}
        backButton={{
          text: 'Back to Guides',
          onClick: () => navigate('/guides')
        }}
      />
    );
  }

  return (
    <div className="guide-detail-container">
      <button 
        className="button secondary"
        onClick={() => navigate('/guides')}
      >
        <i className="fas fa-arrow-left"></i> Back to Guides
      </button>

      <div className="guide-detail-header">
        <img
          src={displayGuide.image_url}
          alt={displayGuide.title}
          className="guide-detail-image"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/images/default_guide.png';
          }}
        />
        <div className="guide-detail-overlay">
          <div className="guide-detail-category">
            {displayCategories.find(cat => cat.id === displayGuide.category)?.name || displayGuide.category}
          </div>
          <h1 className="guide-detail-title">{displayGuide.title}</h1>
          <div className="guide-detail-meta">
            <span className="guide-author">
              <i className="fas fa-user"></i> {displayGuide.author}
            </span>
            <span className="guide-date">
              <i className="fas fa-calendar-alt"></i> {new Date(displayGuide.date_published).toLocaleDateString()}
            </span>
            <span className="guide-read-time">
              <i className="fas fa-clock"></i> {displayGuide.read_time}
            </span>
          </div>
        </div>
      </div>

      <div className="guide-detail-content">
        <div 
          className="guide-content-body"
          dangerouslySetInnerHTML={{ __html: displayGuide.content }}
        />
      </div>

      {displayRelatedGuides.length > 0 && (
        <div className="guide-related">
          <h2 className="guide-related-title">Related Guides</h2>
          <div className="guide-related-grid">
            {displayRelatedGuides.map(relatedGuide => (
              <div className="guide-card" key={relatedGuide.id}>
                <div className="guide-image">
                  <img
                    src={relatedGuide.image_url}
                    alt={relatedGuide.title}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/default_guide.png';
                    }}
                  />
                </div>
                <div className="guide-content">
                  <div className="guide-category">
                    {displayCategories.find(cat => cat.id === relatedGuide.category)?.name || relatedGuide.category}
                  </div>
                  <h3 className="guide-title">{relatedGuide.title}</h3>
                  <p className="guide-description">{relatedGuide.description}</p>
                  <div className="guide-meta">
                    <span className="guide-author">
                      <i className="fas fa-user"></i> {relatedGuide.author}
                    </span>
                    <span className="guide-read-time">
                      <i className="fas fa-clock"></i> {relatedGuide.read_time}
                    </span>
                  </div>
                  <Link to={`/guides/${relatedGuide.id}`} className="guide-button">
                    Read Guide
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GuideDetail;
