import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { marked } from 'marked';
import adminApi from '../../../services/adminApi';
import trainerService from '../../../services/trainerService';
import LoadingSpinner from '../../common/LoadingSpinner';
import ErrorMessage from '../../common/ErrorMessage';
import { formatBirthday, getZodiacEmoji, getChineseZodiacEmoji } from '../../../utils/zodiacUtils';

const ThemeSection = ({ theme }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!theme || theme.trim() === '' || theme === '{"",""}') { // Check if theme is empty or just a pair of empty quotes
    return null; // Hide the theme section completely when no valid theme exists
  }

  // Check if theme contains a link (format: "Display Text || link")
  const hasLink = theme.includes(' || ');
  const [displayText, youtubeLink] = hasLink ? theme.split(' || ') : [theme, null];
  
  // Extract YouTube video ID from various YouTube URL formats
  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]+)/,
      /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/,
      /(?:youtu\.be\/)([a-zA-Z0-9_-]+)/,
      /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const videoId = getYouTubeVideoId(youtubeLink);

  return (
    <div className="trainer-info-item theme-section">
      <span className="info-label">Theme</span>
      <div className="theme-content">
        <div className="theme-display">
          <span className="info-value">{displayText}</span>
          {hasLink && videoId && (
            <button 
              className="theme-expand-btn"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? 'Hide theme player' : 'Show theme player'}
            >
              <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`}></i>
            </button>
          )}
        </div>
        {isExpanded && hasLink && videoId && (
          <div className="theme-player-container">
            <iframe
              width="100%"
              height="315"
              src={`https://www.youtube.com/embed/${videoId}`}
              title="Theme Music"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            ></iframe>
          </div>
        )}
      </div>
    </div>
  );
};

const TrainerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trainer, setTrainer] = useState(null);
  const [monsters, setMonsters] = useState([]);
  const [inventory, setInventory] = useState(null);
  const [references, setReferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    fetchTrainerData();
  }, [id]);

  const fetchTrainerData = async () => {
    try {
      setLoading(true);

      // Fetch trainer details
      const trainerResponse = await adminApi.getTrainerById(id);

      if (!trainerResponse.success) {
        throw new Error(trainerResponse.message || 'Failed to fetch trainer details');
      }

      setTrainer(trainerResponse.data);

      // Fetch trainer's monsters
      const monstersResponse = await adminApi.getTrainerMonsters(id);

      if (monstersResponse.success) {
        setMonsters(monstersResponse.monsters || []);
      }

      // Fetch trainer's inventory
      const inventoryResponse = await adminApi.getTrainerInventory(id);

      if (inventoryResponse.success) {
        setInventory(inventoryResponse.data || null);
      }

      // Fetch trainer's additional references
      const referencesResponse = await trainerService.getTrainerReferences(id);

      if (referencesResponse.success) {
        setReferences(referencesResponse.data || []);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching trainer data:', err);
      setError('Failed to load trainer details. Please try again later.');
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this trainer? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await adminApi.deleteTrainer(id);

      if (response.data.success) {
        navigate('/admin/dashboard/trainers');
      } else {
        throw new Error(response.data.message || 'Failed to delete trainer');
      }
    } catch (err) {
      console.error('Error deleting trainer:', err);
      alert('Failed to delete trainer. Please try again later.');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!trainer) return <ErrorMessage message="Trainer not found" />;

  return (
    <div className="trainer-details-container">
      <div className="trainer-details-header">
        <div className="trainer-details-title">
          <h1>{trainer.name}</h1>
          {trainer.nickname && <span className="trainer-nickname">"{trainer.nickname}"</span>}
        </div>

        <div className="trainer-details-actions">
          <Link to={`/admin/dashboard/trainers/${id}/edit`} className="trainer-details-btn edit">
            <i className="fas fa-edit"></i> Edit
          </Link>
          <button className="trainer-details-btn delete" onClick={handleDelete}>
            <i className="fas fa-trash-alt"></i> Delete
          </button>
          <Link to="/admin/dashboard/trainers" className="trainer-details-btn back">
            <i className="fas fa-arrow-left"></i> Back to List
          </Link>
        </div>
      </div>

      <div className="trainer-details-tabs">
        <button
          className={`trainer-tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <i className="fas fa-user"></i> Profile
        </button>
        <button
          className={`trainer-tab ${activeTab === 'monsters' ? 'active' : ''}`}
          onClick={() => setActiveTab('monsters')}
        >
          <i className="fas fa-dragon"></i> Monsters ({monsters.length})
        </button>
        <button
          className={`trainer-tab ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          <i className="fas fa-box-open"></i> Inventory
        </button>
        <button
          className={`trainer-tab ${activeTab === 'references' ? 'active' : ''}`}
          onClick={() => setActiveTab('references')}
        >
          <i className="fas fa-images"></i> References
        </button>
      </div>

      <div className="trainer-details-content">
        {activeTab === 'profile' && (
          <div className="trainer-profile">
            <div className="trainer-profile-grid">
              <div className="trainer-profile-image">
                {trainer.main_ref ? (
                  <img
                    src={trainer.main_ref}
                    alt={trainer.name}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/default_trainer.png';
                    }}
                  />
                ) : (
                  <div className="trainer-no-image">
                    <i className="fas fa-user"></i>
                    <span>No Image</span>
                  </div>
                )}
              </div>

              <div className="trainer-profile-info">
                <div className="trainer-info-section">
                  <h3>Basic Information</h3>
                  <div className="trainer-info-grid">
                    <div className="trainer-info-item">
                      <span className="info-label">ID</span>
                      <span className="info-value">{trainer.id}</span>
                    </div>
                    <div className="trainer-info-item">
                      <span className="info-label">Player</span>
                      <span className="info-value">
                        {trainer.player_display_name || trainer.player_username || 'Unknown Player'}
                      </span>
                    </div>
                    <div className="trainer-info-item">
                      <span className="info-label">Level</span>
                      <span className="info-value">{trainer.level}</span>
                    </div>
                    <div className="trainer-info-item">
                      <span className="info-label">Faction</span>
                      <span className="info-value">
                        <span className={`faction-badge faction-${trainer.faction?.toLowerCase() || 'none'}`}>
                          {trainer.faction || 'None'}
                        </span>
                      </span>
                    </div>
                    <div className="trainer-info-item">
                      <span className="info-label">Title</span>
                      <span className="info-value">{trainer.title || 'None'}</span>
                    </div>
                    <div className="trainer-info-item">
                      <span className="info-label">Currency</span>
                      <span className="info-value">{trainer.currency_amount}</span>
                    </div>
                    <div className="trainer-info-item">
                      <span className="info-label">Total Earned</span>
                      <span className="info-value">{trainer.total_earned_currency}</span>
                    </div>
                    <div className="trainer-info-item">
                      <span className="info-label">Monsters</span>
                      <span className="info-value">
                        {trainer.monster_count || 0} Total
                        {trainer.monster_ref_count !== undefined && (
                          <span className="monster-ref-stats">
                            {' '}({trainer.monster_ref_count}/{trainer.monster_count} Refs - {trainer.monster_ref_percent || 0}%)
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="trainer-info-item">
                      <span className="info-label">User ID</span>
                      <span className="info-value">{trainer.player_user_id}</span>
                    </div>
                    <div className="trainer-info-item">
                      <span className="info-label">Created</span>
                      <span className="info-value">{new Date(trainer.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="trainer-info-section">
                  <h3>Personal Information</h3>
                  <div className="trainer-info-grid">
                    <div className="trainer-info-item">
                      <span className="info-label">Gender</span>
                      <span className="info-value">{trainer.gender || 'Not specified'}</span>
                    </div>
                    <div className="trainer-info-item">
                      <span className="info-label">Pronouns</span>
                      <span className="info-value">{trainer.pronouns || 'Not specified'}</span>
                    </div>
                    <div className="trainer-info-item">
                      <span className="info-label">Age</span>
                      <span className="info-value">{trainer.age || 'Not specified'}</span>
                    </div>
                    <div className="trainer-info-item">
                      <span className="info-label">Height</span>
                      <span className="info-value">{trainer.height || 'Not specified'}</span>
                    </div>
                    <div className="trainer-info-item">
                      <span className="info-label">Weight</span>
                      <span className="info-value">{trainer.weight || 'Not specified'}</span>
                    </div>
                    <ThemeSection theme={trainer.theme} />
                    <div className="trainer-info-item">
                      <span className="info-label">Occupation</span>
                      <span className="info-value">{trainer.occupation || 'Not specified'}</span>
                    </div>
                    <div className="trainer-info-item">
                      <span className="info-label">Birthplace</span>
                      <span className="info-value">{trainer.birthplace || 'Not specified'}</span>
                    </div>
                    <div className="trainer-info-item">
                      <span className="info-label">Residence</span>
                      <span className="info-value">{trainer.residence || 'Not specified'}</span>
                    </div>
                  </div>
                </div>

                <div className="trainer-info-section">
                  <h3>Species & Types</h3>
                  <div className="trainer-info-grid">
                    <div className="trainer-info-item">
                      <span className="info-label">Species 1</span>
                      <span className="info-value">{trainer.species1 || 'None'}</span>
                    </div>
                    <div className="trainer-info-item">
                      <span className="info-label">Species 2</span>
                      <span className="info-value">{trainer.species2 || 'None'}</span>
                    </div>
                    <div className="trainer-info-item">
                      <span className="info-label">Species 3</span>
                      <span className="info-value">{trainer.species3 || 'None'}</span>
                    </div>
                    <div className="trainer-info-item">
                      <span className="info-label">Type 1</span>
                      <span className="info-value">{trainer.type1 || 'None'}</span>
                    </div>
                    <div className="trainer-info-item">
                      <span className="info-label">Type 2</span>
                      <span className="info-value">{trainer.type2 || 'None'}</span>
                    </div>
                    <div className="trainer-info-item">
                      <span className="info-label">Type 3</span>
                      <span className="info-value">{trainer.type3 || 'None'}</span>
                    </div>
                    <div className="trainer-info-item">
                      <span className="info-label">Type 4</span>
                      <span className="info-value">{trainer.type4 || 'None'}</span>
                    </div>
                    <div className="trainer-info-item">
                      <span className="info-label">Type 5</span>
                      <span className="info-value">{trainer.type5 || 'None'}</span>
                    </div>
                    <div className="trainer-info-item">
                      <span className="info-label">Type 6</span>
                      <span className="info-value">{trainer.type6 || 'None'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="trainer-bio-section">
              <h3>Biography</h3>
              <div className="trainer-quote">
                {trainer.quote ? `"${trainer.quote}"` : 'No quote provided'}
              </div>

              <div className="trainer-tldr">
                <h4>TL;DR</h4>
                <p>{trainer.tldr || 'No summary provided'}</p>
              </div>

              <div className="trainer-biography">
                <h4>Full Biography</h4>
                <div className="biography-content">
                  {trainer.biography ? (
                    <div 
                      className="markdown-content"
                      dangerouslySetInnerHTML={{ 
                        __html: marked.parse(trainer.biography) 
                      }}
                    />
                  ) : (
                    <p className="no-content">No biography provided</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'monsters' && (
          <div className="trainer-monsters">
            {monsters.length === 0 ? (
              <div className="no-monsters-message">
                <i className="fas fa-dragon"></i>
                <p>This trainer doesn't have any monsters yet.</p>
              </div>
            ) : (
              <div className="monsters-grid">
                {monsters.map(monster => (
                  <div key={monster.id} className="monster-card">
                    <div className="monster-card-image">
                      {monster.main_ref ? (
                        <img
                          src={monster.main_ref}
                          alt={monster.name}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/images/default_mon.png';
                          }}
                        />
                      ) : (
                        <div className="monster-no-image">
                          <i className="fas fa-dragon"></i>
                        </div>
                      )}
                    </div>
                    <div className="monster-card-content">
                      <h3>{monster.name}</h3>
                      <div className="monster-card-details">
                        <span className="monster-species">{monster.species}</span>
                        <span className="monster-level">Lv. {monster.level}</span>
                      </div>
                      <Link to={`/admin/dashboard/monsters/${monster.id}`} className="view-monster-btn">
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="trainer-inventory">
            {!inventory ? (
              <div className="no-inventory-message">
                <i className="fas fa-box-open"></i>
                <p>No inventory data available for this trainer.</p>
              </div>
            ) : (
              <div className="inventory-sections">
                <div className="inventory-section">
                  <h3>Items</h3>
                  <div className="inventory-items">
                    {Object.keys(JSON.parse(inventory.items || '{}')).length === 0 ? (
                      <p className="no-items">No items</p>
                    ) : (
                      Object.entries(JSON.parse(inventory.items || '{}')).map(([item, quantity]) => (
                        <div key={item} className="inventory-item">
                          <span className="item-name">{item}</span>
                          <span className="item-quantity">x{quantity}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="inventory-section">
                  <h3>Poké Balls</h3>
                  <div className="inventory-items">
                    {Object.keys(JSON.parse(inventory.balls || '{}')).length === 0 ? (
                      <p className="no-items">No balls</p>
                    ) : (
                      Object.entries(JSON.parse(inventory.balls || '{}')).map(([item, quantity]) => (
                        <div key={item} className="inventory-item">
                          <span className="item-name">{item}</span>
                          <span className="item-quantity">x{quantity}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="inventory-section">
                  <h3>Berries</h3>
                  <div className="inventory-items">
                    {Object.keys(JSON.parse(inventory.berries || '{}')).length === 0 ? (
                      <p className="no-items">No berries</p>
                    ) : (
                      Object.entries(JSON.parse(inventory.berries || '{}')).map(([item, quantity]) => (
                        <div key={item} className="inventory-item">
                          <span className="item-name">{item}</span>
                          <span className="item-quantity">x{quantity}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="inventory-section">
                  <h3>Eggs</h3>
                  <div className="inventory-items">
                    {Object.keys(JSON.parse(inventory.eggs || '{}')).length === 0 ? (
                      <p className="no-items">No eggs</p>
                    ) : (
                      Object.entries(JSON.parse(inventory.eggs || '{}')).map(([item, quantity]) => (
                        <div key={item} className="inventory-item">
                          <span className="item-name">{item}</span>
                          <span className="item-quantity">x{quantity}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainerDetails;
