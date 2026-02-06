import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import submissionService from '../services/submissionService';

const HomePage = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const [userStats, setUserStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [artTodos, setArtTodos] = useState([]);
  const [randomFakemon, setRandomFakemon] = useState([]);
  const [userTrainers, setUserTrainers] = useState([]);
  const [gallerySubmissions, setGallerySubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomePageData = async () => {
      try {
        setLoading(true);
        
        if (isAuthenticated && currentUser) {
          // Fetch user-specific data for returning users
          try {
            const [statsRes, tasksRes, artRes, fakemonRes, trainersRes, galleryRes] = await Promise.allSettled([
              api.get(`/users/${currentUser.discord_id}/stats`),
              api.get(`/tasks/recent?limit=3`),
              api.get(`/art-todo/personal?limit=3`),
              api.get('/fakedex/random?limit=12'),
              api.get(`/trainers/user/${currentUser.discord_id}?limit=10`),
              submissionService.getArtGallery({ limit: 5, sort: 'newest' })
            ]);

            if (statsRes.status === 'fulfilled') setUserStats(statsRes.value.data);
            if (tasksRes.status === 'fulfilled') setRecentTasks(tasksRes.value.data?.tasks || []);
            if (artRes.status === 'fulfilled') setArtTodos(artRes.value.data?.items || []);
            if (fakemonRes.status === 'fulfilled') {
              const fakemonData = fakemonRes.value.data;
              let fakemon = fakemonData?.fakemon || fakemonData?.data || fakemonData || [];
              
              // Process types for each fakemon
              if (Array.isArray(fakemon)) {
                fakemon = fakemon.map(mon => {
                  // Create types array from type1, type2, etc. fields if types array doesn't exist
                  if (!mon.types) {
                    const types = [mon.type1, mon.type2, mon.type3, mon.type4, mon.type5]
                      .filter(Boolean); // Remove null/undefined values
                    mon.types = types.length > 0 ? types : ['Normal'];
                  }
                  return mon;
                });
              }
              
              setRandomFakemon(Array.isArray(fakemon) ? fakemon : []);
            }
            if (trainersRes.status === 'fulfilled') {
              const trainerData = trainersRes.value.data;
              let trainers = trainerData?.trainers || trainerData?.data || trainerData || [];
              
              // Randomize trainer order if we have trainers
              if (Array.isArray(trainers) && trainers.length > 0) {
                trainers = trainers.sort(() => Math.random() - 0.5);
              }
              
              setUserTrainers(Array.isArray(trainers) ? trainers : []);
            }
            if (galleryRes.status === 'fulfilled') {
              const galleryData = galleryRes.value;
              const submissions = galleryData?.submissions || galleryData?.data || galleryData || [];
              setGallerySubmissions(Array.isArray(submissions) ? submissions : []);
            }
          } catch (err) {
            console.error('Error fetching user data:', err);
          }
        } else {
          // Fetch general data for new users
          try {
            const [fakemonRes, galleryRes] = await Promise.allSettled([
              api.get('/fakedex/random?limit=16'),
              submissionService.getArtGallery({ limit: 5, sort: 'newest' })
            ]);
            
            if (fakemonRes.status === 'fulfilled') {
              const fakemonData = fakemonRes.value.data;
              let fakemon = fakemonData?.fakemon || fakemonData?.data || fakemonData || [];
              
              // Process types for each fakemon
              if (Array.isArray(fakemon)) {
                fakemon = fakemon.map(mon => {
                  // Create types array from type1, type2, etc. fields if types array doesn't exist
                  if (!mon.types) {
                    const types = [mon.type1, mon.type2, mon.type3, mon.type4, mon.type5]
                      .filter(Boolean); // Remove null/undefined values
                    mon.types = types.length > 0 ? types : ['Normal'];
                  }
                  return mon;
                });
              }
              
              setRandomFakemon(Array.isArray(fakemon) ? fakemon : []);
            }
            
            if (galleryRes.status === 'fulfilled') {
              const galleryData = galleryRes.value;
              const submissions = galleryData?.submissions || galleryData?.data || galleryData || [];
              setGallerySubmissions(Array.isArray(submissions) ? submissions : []);
            }
          } catch (err) {
            console.error('Error fetching data for new users:', err);
          }
        }
      } catch (err) {
        console.error('Error fetching home page data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomePageData();
  }, [isAuthenticated, currentUser]);

  // Fallback data
  const fallbackFakemon = [
    { number: 1, name: 'Leafsprout', image_path: 'https://via.placeholder.com/150/1e2532/d6a339?text=Grass', types: ['Grass'] },
    { number: 2, name: 'Emberclaw', image_path: 'https://via.placeholder.com/150/1e2532/d6a339?text=Fire', types: ['Fire'] },
    { number: 3, name: 'Aquafin', image_path: 'https://via.placeholder.com/150/1e2532/d6a339?text=Water', types: ['Water'] },
    { number: 4, name: 'Stormwing', image_path: 'https://via.placeholder.com/150/1e2532/d6a339?text=Electric', types: ['Electric', 'Flying'] },
    { number: 5, name: 'Crystalix', image_path: 'https://via.placeholder.com/150/1e2532/d6a339?text=Rock', types: ['Rock', 'Psychic'] },
    { number: 6, name: 'Shadowmist', image_path: 'https://via.placeholder.com/150/1e2532/d6a339?text=Ghost', types: ['Ghost', 'Dark'] },
    { number: 7, name: 'Ironclad', image_path: 'https://via.placeholder.com/150/1e2532/d6a339?text=Steel', types: ['Steel', 'Fighting'] },
    { number: 8, name: 'Pixiedust', image_path: 'https://via.placeholder.com/150/1e2532/d6a339?text=Fairy', types: ['Fairy', 'Flying'] },
    { number: 9, name: 'Frostbite', image_path: 'https://via.placeholder.com/150/1e2532/d6a339?text=Ice', types: ['Ice'] },
    { number: 10, name: 'Venomfang', image_path: 'https://via.placeholder.com/150/1e2532/d6a339?text=Poison', types: ['Poison', 'Bug'] },
    { number: 11, name: 'Earthshaker', image_path: 'https://via.placeholder.com/150/1e2532/d6a339?text=Ground', types: ['Ground'] },
    { number: 12, name: 'Mindrift', image_path: 'https://via.placeholder.com/150/1e2532/d6a339?text=Psychic', types: ['Psychic'] },
    { number: 13, name: 'Nightcrawler', image_path: 'https://via.placeholder.com/150/1e2532/d6a339?text=Dark', types: ['Dark'] },
    { number: 14, name: 'Dracoflame', image_path: 'https://via.placeholder.com/150/1e2532/d6a339?text=Dragon', types: ['Dragon', 'Fire'] },
    { number: 15, name: 'Galeforce', image_path: 'https://via.placeholder.com/150/1e2532/d6a339?text=Flying', types: ['Flying', 'Normal'] },
    { number: 16, name: 'Battlescale', image_path: 'https://via.placeholder.com/150/1e2532/d6a339?text=Fighting', types: ['Fighting'] }
  ];

  const fallbackTrainers = [
    { id: 1, name: 'Aria', level: 15, avatar_url: 'https://via.placeholder.com/60/1e2532/d6a339?text=A', monsters_count: 8 },
    { id: 2, name: 'Zeph', level: 23, avatar_url: 'https://via.placeholder.com/60/1e2532/d6a339?text=Z', monsters_count: 12 },
    { id: 3, name: 'Nova', level: 18, avatar_url: 'https://via.placeholder.com/60/1e2532/d6a339?text=N', monsters_count: 6 }
  ];

  const fallbackGallery = [
    { 
      id: 1, 
      title: 'Dragon Artwork', 
      description: 'A majestic dragon soaring through the clouds',
      trainer_name: 'ArtistOne', 
      display_name: 'ArtistOne',
      image_url: 'https://via.placeholder.com/200/1e2532/d6a339?text=Dragon',
      submission_date: new Date().toISOString()
    },
    { 
      id: 2, 
      title: 'Forest Scene', 
      description: 'A peaceful forest with magical creatures',
      trainer_name: 'NaturePainter', 
      display_name: 'NaturePainter',
      image_url: 'https://via.placeholder.com/200/1e2532/d6a339?text=Forest',
      submission_date: new Date().toISOString()
    },
    { 
      id: 3, 
      title: 'Character Design', 
      description: 'Original character concept art',
      trainer_name: 'Designer123', 
      display_name: 'Designer123',
      image_url: 'https://via.placeholder.com/200/1e2532/d6a339?text=Character',
      submission_date: new Date().toISOString()
    },
    { 
      id: 4, 
      title: 'Monster Battle', 
      description: 'Epic battle scene between trainers',
      trainer_name: 'ActionArt', 
      display_name: 'ActionArt',
      image_url: 'https://via.placeholder.com/200/1e2532/d6a339?text=Battle',
      submission_date: new Date().toISOString()
    },
    { 
      id: 5, 
      title: 'Peaceful Valley', 
      description: 'Serene landscape with hidden mysteries',
      trainer_name: 'LandscapeArt', 
      display_name: 'LandscapeArt',
      image_url: 'https://via.placeholder.com/200/1e2532/d6a339?text=Valley',
      submission_date: new Date().toISOString()
    }
  ];

  const displayFakemon = randomFakemon.length > 0 ? randomFakemon : fallbackFakemon;
  
  console.log('DisplayFakemon length:', displayFakemon.length);
  console.log('Sample fakemon:', displayFakemon[0]);

  if (loading) {
    return (
      <div className="homepage-loading">
        <div className="loading-spinner">
          <i className="fas fa-dragon"></i>
          <p>Loading your adventure...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="homepage">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <div className="hero-title">
              <img 
                src="/images/logo.png" 
                alt="Dusk & Dawn" 
                className="hero-logo"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'block';
                }}
              />
              <div className="hero-title-fallback" style={{display: 'none'}}>
                <span className="title-main">Dusk & Dawn</span>
              </div>
              <span className="title-sub">Monster Art Roleplay</span>
            </div>
            <p className="hero-description">
              Create, collect, and showcase your creatures in an immersive art-driven RPG experience. 
              Design unique monsters, complete artistic challenges, and build your trainer's legacy.
            </p>
          </div>
          <div className="hero-visual">
            <div className="floating-monsters">
              {displayFakemon.slice(0, 4).map((mon, index) => (
                <div key={mon.number} className={`floating-monster monster-${index + 1}`}>
                  <img 
                    src={mon.image_path || mon.image_url || `https://via.placeholder.com/150/1e2532/d6a339?text=${mon.name || 'Mon'}`}
                    alt={mon.name}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/default_mon.png';
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="homepage-content">
        {!isAuthenticated ? (
          // New User Experience
          <div className="new-user-content">
            <div className="welcome-steps">
              <div className="steps-header">
                <h2>Start Your Journey</h2>
                <p>Join our comminity of artists and monster enthusiasts to start your adventure!</p>
              </div>
              
              <div className="steps-grid">
                <div className="step-card">
                  <div className="step-number">1</div>
                  <div className="step-icon">
                    <i className="fab fa-discord"></i>
                  </div>
                  <h3>Join Discord</h3>
                  <p>Connect with our vibrant community</p>
                  <a href="https://discord.gg/YrF74RWA6v" className="step-button" target="_blank" rel="noopener noreferrer">
                    Join Server
                  </a>
                </div>

                <div className="step-card">
                  <div className="step-number">2</div>
                  <div className="step-icon">
                    <i className="fas fa-user-plus"></i>
                  </div>
                  <h3>Register Account</h3>
                  <p>Create your profile and get started</p>
                  <Link to="/register" className="step-button">
                    Sign Up
                  </Link>
                </div>

                <div className="step-card">
                  <div className="step-number">3</div>
                  <div className="step-icon">
                    <i className="fas fa-paint-brush"></i>
                  </div>
                  <h3>Create Trainer</h3>
                  <p>Design your character and start your adventure</p>
                  <Link to="/profile/trainers/add" className="step-button">
                    Create Trainer
                  </Link>
                </div>
              </div>
            </div>

            <div className="features-showcase">
              <h2>Game Features</h2>
              <div className="features-grid">
                <div className="feature-card">
                  <div className="feature-icon">
                    <i className="fas fa-palette"></i>
                  </div>
                  <h3>Art-Driven Gameplay</h3>
                  <p>Progress through creating and submitting artwork of your creatures and trainers</p>
                </div>

                <div className="feature-card">
                  <div className="feature-icon">
                    <i className="fas fa-dragon"></i>
                  </div>
                  <h3>Creature Collection</h3>
                  <p>Discover, adopt, and breed unique monsters from multiple universes</p>
                </div>

                <div className="feature-card">
                  <div className="feature-icon">
                    <i className="fas fa-scroll"></i>
                  </div>
                  <h3>Creative Writing</h3>
                  <p>Craft stories and lore to develop your characters and world</p>
                </div>

                <div className="feature-card">
                  <div className="feature-icon">
                    <i className="fas fa-users"></i>
                  </div>
                  <h3>Community Events</h3>
                  <p>Participate in collaborative adventures and seasonal challenges</p>
                </div>
              </div>
            </div>
            
            {/* Look Around Section for New Users */}
            <div className="look-around-section">
              <h2>Look Around</h2>
              <div className="look-around-grid">
                <Link to="/gallery" className="look-around-card">
                  <div className="look-around-icon">
                    <i className="fas fa-images"></i>
                  </div>
                  <h3>Gallery</h3>
                  <p>Browse amazing artwork from the community</p>
                </Link>
                
                <Link to="/library" className="look-around-card">
                  <div className="look-around-icon">
                    <i className="fas fa-book"></i>
                  </div>
                  <h3>Library</h3>
                  <p>Read stories and lore from trainers</p>
                </Link>
                
                <Link to="/trainers" className="look-around-card">
                  <div className="look-around-icon">
                    <i className="fas fa-users"></i>
                  </div>
                  <h3>Trainers</h3>
                  <p>Meet other trainers and their teams</p>
                </Link>
              </div>
              
              {/* Recent Gallery Carousel */}
              <div className="gallery-carousel">
                <h3>Recent Gallery Submissions</h3>
                <div className="gallery-carousel-items">
                  {(gallerySubmissions.length > 0 ? gallerySubmissions : fallbackGallery).map((submission, index) => (
                    <Link to={`/submissions/${submission.id}`} key={index} className="gallery-carousel-item">
                      <img 
                        src={submission.image_url || submission.url || `https://via.placeholder.com/200/1e2532/d6a339?text=Art`}
                        alt={submission.title || 'Gallery Submission'}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/images/default_art.png';
                        }}
                      />
                      <div className="gallery-item-info">
                        <span className="gallery-item-title">{submission.title || 'Untitled'}</span>
                        <span className="gallery-item-artist">{submission.trainer_name || submission.display_name || submission.artist || submission.username || 'Anonymous'}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Returning User Experience
          <div className="returning-user-content">
            <div className="welcome-back">
              <h2>Welcome back, {currentUser.display_name || currentUser.username}!</h2>
              <p>Ready to continue your artistic adventure?</p>
            </div>

            <div className="dashboard-grid">
              {/* Top Row - Quick Actions and User Trainers */}
              <div className="dashboard-row">
                <div className="dashboard-card quick-actions">
                  <h3>Quick Actions</h3>
                  <div className="action-buttons">
                    <Link to="/submissions/art" className="button primary art">
                      <i className="fas fa-palette"></i>
                      <span>Submit Art</span>
                    </Link>
                    <Link to="/submissions/writing" className="button primary writing">
                      <i className="fas fa-feather-alt"></i>
                      <span>Submit Writing</span>
                    </Link>
                    <Link to="/town/farm" className="button primary farm">
                      <i className="fas fa-seedling"></i>
                      <span>Visit Farm</span>
                    </Link>
                    <Link to="/town/adoption" className="button primary adoption">
                      <i className="fas fa-heart"></i>
                      <span>Adoption Center</span>
                    </Link>
                  </div>
                </div>

                {/* User Trainers */}
                <div className="dashboard-card user-trainers">
                  <div className="card-header">
                    <h3>Your Trainers</h3>
                    <Link to="/my_trainers" className="button primary view-all">View All</Link>
                  </div>
                  <div className="compact-trainers">
                    {(userTrainers.length > 0 ? userTrainers : fallbackTrainers).slice(0, 5).map((trainer) => (
                      <Link to={`/trainers/${trainer.id}`} key={trainer.id} className="compact-trainer-card">
                        <div className="compact-trainer-avatar">
                          <img 
                            src={trainer.avatar_url || trainer.main_ref || trainer.image_url || trainer.ref_url || `https://via.placeholder.com/60/1e2532/d6a339?text=${trainer.name ? trainer.name[0] : 'T'}`}
                            alt={trainer.name}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/images/default_trainer.png';
                            }}
                          />
                        </div>
                        <div className="compact-trainer-info">
                          <div className="compact-trainer-name">{trainer.name}</div>
                          <div className="compact-trainer-stats">
                            <span className="compact-trainer-level">Lv. {trainer.level || 1}</span>
                            <div className="compact-stat">
                              <i className="fas fa-dragon"></i>
                              <span>{trainer.monsters_count || trainer.monster_count || 0}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>


              {/* Recent Tasks and Art Todos Row */}
              <div className="dashboard-row">
                {/* Recent Tasks */}
                {recentTasks.length > 0 && (
                  <div className="dashboard-card recent-tasks">
                    <div className="card-header">
                      <h3>Recent Tasks</h3>
                      <Link to="/tasks" className="button primary view-all">View All</Link>
                    </div>
                    <div className="task-list">
                      {recentTasks.map((task, index) => (
                        <div key={index} className="task-item">
                          <div className="task-status">
                            <i className={`fas ${task.completed ? 'fa-check-circle completed' : 'fa-circle pending'}`}></i>
                          </div>
                          <div className="task-content">
                            <span className="task-name">{task.name}</span>
                            <span className="task-date">{new Date(task.due_date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Art Todo List */}
                {artTodos.length > 0 && (
                  <div className="dashboard-card art-todos">
                    <div className="card-header">
                      <h3>Art Todo List</h3>
                      <Link to="/profile/art-todo" className="button primary view-all">View All</Link>
                    </div>
                    <div className="todo-list">
                      {artTodos.map((todo, index) => (
                        <div key={index} className="todo-item">
                          <div className="todo-priority">
                            <span className={`priority-badge ${todo.priority}`}>{todo.priority}</span>
                          </div>
                          <div className="todo-content">
                            <span className="todo-title">{todo.title}</span>
                            <span className="todo-type">{todo.type}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Look Around Section for Returning Users */}
            <div className="look-around-section">
              <h2>Look Around</h2>
              <div className="look-around-grid">
                <Link to="/gallery" className="look-around-card">
                  <div className="look-around-icon">
                    <i className="fas fa-images"></i>
                  </div>
                  <h3>Gallery</h3>
                  <p>Browse amazing artwork from the community</p>
                </Link>
                
                <Link to="/library" className="look-around-card">
                  <div className="look-around-icon">
                    <i className="fas fa-book"></i>
                  </div>
                  <h3>Library</h3>
                  <p>Read stories and lore from trainers</p>
                </Link>
                
                <Link to="/trainers" className="look-around-card">
                  <div className="look-around-icon">
                    <i className="fas fa-users"></i>
                  </div>
                  <h3>Trainers</h3>
                  <p>Meet other trainers and their teams</p>
                </Link>
              </div>
              
              {/* Recent Gallery Carousel */}
              <div className="gallery-carousel">
                <h3>Recent Gallery Submissions</h3>
                <div className="gallery-carousel-items">
                  {(gallerySubmissions.length > 0 ? gallerySubmissions : fallbackGallery).map((submission, index) => (
                    <Link to={`/submissions/${submission.id}`} key={index} className="gallery-carousel-item">
                      <img 
                        src={submission.image_url || submission.url || `https://via.placeholder.com/200/1e2532/d6a339?text=Art`}
                        alt={submission.title || 'Gallery Submission'}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/images/default_art.png';
                        }}
                      />
                      <div className="gallery-item-info">
                        <span className="gallery-item-title">{submission.title || 'Untitled'}</span>
                        <span className="gallery-item-artist">{submission.trainer_name || submission.display_name || submission.artist || submission.username || 'Anonymous'}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Discover Creatures Section (for all users) */}
        <div className="discover-section">
          <div className="section-header">
            <h2>Discover Creatures</h2>
            <Link to="/fakedex" className="button primary button primary">
              <span>Explore Fakedex</span>
              <i className="fas fa-arrow-right"></i>
            </Link>
          </div>
          
          <div className="creatures-gallery">
            {displayFakemon.map((mon) => (
              <Link to={`/fakedex/${mon.number}`} className="creature-card" key={mon.number}>
                <div className="creature-image">
                  <img 
                    src={mon.image_path || mon.image_url || mon.sprite_url || `https://via.placeholder.com/150/1e2532/d6a339?text=${mon.name || 'Mon'}`}
                    alt={mon.name} 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/default_mon.png';
                    }}
                  />
                </div>
                <div className="creature-info">
                  <span className="creature-number">#{String(mon.number).padStart(3, '0')}</span>
                  <span className="creature-name">{mon.name}</span>
                  <div className="creature-types">
                    {(mon.types || ['Normal']).map((type, index) => (
                      <span className={`type-badge type-${type.toLowerCase()}`} key={index}>
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;