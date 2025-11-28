import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import api from '../../services/api';

const FactionsPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [factions, setFactions] = useState([]);
  const [selectedFaction, setSelectedFaction] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchFactions();
  }, []);

  const fetchFactions = async () => {
    try {
      setLoading(true);
      
      // Fetch factions
      const response = await api.get('/factions');
      setFactions(response.data.factions || []);
      
    } catch (err) {
      console.error('Error fetching factions:', err);
      setError('Failed to load factions. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Filter factions based on search query
  const filteredFactions = factions.filter(faction => {
    return faction.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           faction.description.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Fallback data for development
  const fallbackFactions = [
    {
      id: 'researchers',
      name: 'Monster Research Society',
      description: 'A scientific organization dedicated to studying monsters and their abilities.',
      leader: 'Professor Willow',
      headquarters: 'Aurora Town',
      alignment: 'neutral',
      image_url: 'https://via.placeholder.com/400/1e2532/d6a339?text=Research+Society',
      banner_url: 'https://via.placeholder.com/800/1e2532/d6a339?text=Research+Society+Banner',
      color: '#3b82f6',
      history: `<p>The Monster Research Society was founded 75 years ago by Professor Elm Oak, who believed that a scientific approach to understanding monsters would benefit both humans and monsters alike.</p>
      <p>Initially a small group of academics, the Society has grown into a worldwide organization with research facilities in every major region. Their discoveries have revolutionized monster training, healthcare, and conservation efforts.</p>
      <p>The Society maintains the world's largest database of monster information, accessible to all registered trainers. They also operate breeding centers and rehabilitation facilities for injured or abandoned monsters.</p>`,
      goals: [
        'Document and catalog all monster species',
        'Develop new technologies for monster care and training',
        'Promote ethical treatment of monsters',
        'Study monster evolution and genetics'
      ],
      notable_members: [
        {
          name: 'Professor Willow',
          role: 'Current Director',
          image_url: 'https://via.placeholder.com/100/1e2532/d6a339?text=Willow'
        },
        {
          name: 'Dr. Juniper',
          role: 'Head of Evolution Studies',
          image_url: 'https://via.placeholder.com/100/1e2532/d6a339?text=Juniper'
        },
        {
          name: 'Professor Rowan',
          role: 'Chief Historian',
          image_url: 'https://via.placeholder.com/100/1e2532/d6a339?text=Rowan'
        }
      ]
    },
    {
      id: 'guardians',
      name: 'The Guardians',
      description: 'An ancient order dedicated to protecting the balance between humans and monsters.',
      leader: 'Elder Sage Aria',
      headquarters: 'Hidden Temple (Verdant Valley)',
      alignment: 'good',
      image_url: 'https://via.placeholder.com/400/1e2532/d6a339?text=Guardians',
      banner_url: 'https://via.placeholder.com/800/1e2532/d6a339?text=Guardians+Banner',
      color: '#10b981',
      history: `<p>The Guardians trace their origins back to the time of the Original Seven trainers. They were formed to protect the sacred artifacts of the Ancient Ones and maintain the balance between humans and monsters.</p>
      <p>Throughout history, the Guardians have intervened during times of crisis, such as the Great Cataclysm, working to minimize damage and prevent such disasters from recurring.</p>
      <p>Membership in the Guardians is by invitation only, extended to trainers who demonstrate exceptional skill, wisdom, and compassion. Their training combines traditional monster handling with spiritual practices and ancient knowledge.</p>`,
      goals: [
        'Protect the artifacts of the Ancient Ones',
        'Maintain balance in the world',
        'Prevent the misuse of monster powers',
        'Preserve ancient knowledge and traditions'
      ],
      notable_members: [
        {
          name: 'Elder Sage Aria',
          role: 'Current Leader',
          image_url: 'https://via.placeholder.com/100/1e2532/d6a339?text=Aria'
        },
        {
          name: 'Ranger Orion',
          role: 'Chief Protector',
          image_url: 'https://via.placeholder.com/100/1e2532/d6a339?text=Orion'
        },
        {
          name: 'Mystic Selene',
          role: 'Keeper of Lore',
          image_url: 'https://via.placeholder.com/100/1e2532/d6a339?text=Selene'
        }
      ]
    },
    {
      id: 'shadow-syndicate',
      name: 'Shadow Syndicate',
      description: 'A secretive organization that seeks to harness monster power for their own gain.',
      leader: 'The Director (identity unknown)',
      headquarters: 'Unknown (rumored to be in Shadow Depths)',
      alignment: 'evil',
      image_url: 'https://via.placeholder.com/400/1e2532/d6a339?text=Shadow+Syndicate',
      banner_url: 'https://via.placeholder.com/800/1e2532/d6a339?text=Shadow+Syndicate+Banner',
      color: '#8b5cf6',
      history: `<p>The Shadow Syndicate emerged in the aftermath of the Great Cataclysm, taking advantage of the chaos to establish their organization. They believe that monsters should be tools for human advancement and power.</p>
      <p>Operating from the shadows, the Syndicate has been involved in numerous illegal activities, including monster theft, unauthorized experiments, and attempts to locate and control the artifacts of the Ancient Ones.</p>
      <p>Despite efforts by authorities and other factions to dismantle the organization, the Syndicate continues to grow in influence, recruiting trainers who seek power and are willing to use any means to achieve it.</p>`,
      goals: [
        'Acquire rare and powerful monsters',
        'Discover and control the artifacts of the Ancient Ones',
        'Develop technologies to enhance monster abilities',
        'Establish dominance over the monster training world'
      ],
      notable_members: [
        {
          name: 'The Director',
          role: 'Leader',
          image_url: 'https://via.placeholder.com/100/1e2532/d6a339?text=Director'
        },
        {
          name: 'Commander Vex',
          role: 'Head of Operations',
          image_url: 'https://via.placeholder.com/100/1e2532/d6a339?text=Vex'
        },
        {
          name: 'Dr. Nox',
          role: 'Chief Scientist',
          image_url: 'https://via.placeholder.com/100/1e2532/d6a339?text=Nox'
        }
      ]
    },
    {
      id: 'rangers',
      name: 'Monster Rangers',
      description: 'A group of skilled trainers who protect wild monsters and their habitats.',
      leader: 'Ranger Captain Thorne',
      headquarters: 'Ranger Outposts (multiple locations)',
      alignment: 'good',
      image_url: 'https://via.placeholder.com/400/1e2532/d6a339?text=Rangers',
      banner_url: 'https://via.placeholder.com/800/1e2532/d6a339?text=Rangers+Banner',
      color: '#ef4444',
      history: `<p>The Monster Rangers were established 120 years ago in response to increasing human encroachment on monster habitats. Their founder, Ranger Thorne (ancestor of the current captain), believed that wild monsters deserved protection and respect.</p>
      <p>The Rangers maintain outposts throughout the world, monitoring monster populations, preventing poaching, and rescuing injured monsters. They also work to educate the public about conservation and responsible interaction with wild monsters.</p>
      <p>Becoming a Ranger requires rigorous training in wilderness survival, monster behavior, and emergency response. Rangers are known for their distinctive red uniforms and their close bonds with their partner monsters.</p>`,
      goals: [
        'Protect wild monster habitats',
        'Prevent poaching and illegal monster capture',
        'Rescue and rehabilitate injured monsters',
        'Educate the public about conservation'
      ],
      notable_members: [
        {
          name: 'Captain Thorne',
          role: 'Current Leader',
          image_url: 'https://via.placeholder.com/100/1e2532/d6a339?text=Thorne'
        },
        {
          name: 'Ranger Lyra',
          role: 'Head of Rescue Operations',
          image_url: 'https://via.placeholder.com/100/1e2532/d6a339?text=Lyra'
        },
        {
          name: 'Ranger Cyrus',
          role: 'Training Coordinator',
          image_url: 'https://via.placeholder.com/100/1e2532/d6a339?text=Cyrus'
        }
      ]
    },
    {
      id: 'battle-league',
      name: 'International Battle League',
      description: 'The official organization that oversees competitive monster battles worldwide.',
      leader: 'Champion Lance',
      headquarters: 'Battle Tower (Crystal Mountains)',
      alignment: 'neutral',
      image_url: 'https://via.placeholder.com/400/1e2532/d6a339?text=Battle+League',
      banner_url: 'https://via.placeholder.com/800/1e2532/d6a339?text=Battle+League+Banner',
      color: '#f59e0b',
      history: `<p>The International Battle League was founded 200 years ago to standardize battle rules and provide a structured competitive environment for trainers. It has since grown into the premier organization for monster battling.</p>
      <p>The League operates regional tournaments throughout the year, culminating in the annual World Championship. Winning trainers earn not only prestige but also valuable prizes and opportunities for advanced training.</p>
      <p>The League is governed by a council of former champions and respected trainers who update rules, oversee tournaments, and ensure fair competition. They also work closely with the Monster Research Society to ensure the health and welfare of monsters used in battles.</p>`,
      goals: [
        'Promote fair and ethical monster battles',
        'Discover and nurture talented trainers',
        'Advance battle techniques and strategies',
        'Foster bonds between trainers and their monsters'
      ],
      notable_members: [
        {
          name: 'Champion Lance',
          role: 'Current Champion',
          image_url: 'https://via.placeholder.com/100/1e2532/d6a339?text=Lance'
        },
        {
          name: 'Elite Four Cynthia',
          role: 'Council Member',
          image_url: 'https://via.placeholder.com/100/1e2532/d6a339?text=Cynthia'
        },
        {
          name: 'Judge Steven',
          role: 'Head Referee',
          image_url: 'https://via.placeholder.com/100/1e2532/d6a339?text=Steven'
        }
      ]
    }
  ];

  const displayFactions = factions.length > 0 ? filteredFactions : fallbackFactions.filter(faction => {
    return faction.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           faction.description.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return <LoadingSpinner message="Loading factions..." />;
  }

  if (error) {
    return (
      <ErrorMessage 
        message={error} 
        onRetry={fetchFactions}
      />
    );
  }

  return (
    <div className="factions-container">
      <div className="factions-header">
        <h1>World Factions</h1>
        <p>Learn about the various organizations and groups in the Monsterify world</p>
      </div>

      <div className="factions-search">
        <input
          type="text"
          placeholder="Search factions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        <button className="search-button">
          <i className="fas fa-search"></i>
        </button>
      </div>

      <div className="factions-grid">
        {displayFactions.map(faction => (
          <div 
            className={`faction-card ${selectedFaction === faction.id ? 'selected' : ''}`} 
            key={faction.id}
            onClick={() => setSelectedFaction(selectedFaction === faction.id ? null : faction.id)}
          >
            <div 
              className="faction-banner"
              style={{ 
                backgroundImage: `url(${faction.banner_url})`,
                borderColor: faction.color
              }}
            >
              <div className="faction-logo">
                <img
                  src={faction.image_url}
                  alt={faction.name}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/images/default_faction.png';
                  }}
                />
              </div>
            </div>
            <div className="faction-content">
              <h3 className="faction-name" style={{ color: faction.color }}>{faction.name}</h3>
              <div className="faction-alignment" data-alignment={faction.alignment}>
                {faction.alignment.charAt(0).toUpperCase() + faction.alignment.slice(1)}
              </div>
              <p className="faction-description">{faction.description}</p>
              <div className="faction-info">
                <div className="faction-info-item">
                  <span className="info-label">Leader:</span>
                  <span className="info-value">{faction.leader}</span>
                </div>
                <div className="faction-info-item">
                  <span className="info-label">Headquarters:</span>
                  <span className="info-value">{faction.headquarters}</span>
                </div>
              </div>
              <button className="faction-toggle">
                {selectedFaction === faction.id ? 'Show Less' : 'Show More'}
              </button>
            </div>
            
            {selectedFaction === faction.id && (
              <div className="faction-details">
                <div className="faction-section">
                  <h4 className="section-title">History</h4>
                  <div 
                    className="faction-history"
                    dangerouslySetInnerHTML={{ __html: faction.history }}
                  />
                </div>
                
                <div className="faction-section">
                  <h4 className="section-title">Goals</h4>
                  <ul className="faction-goals">
                    {faction.goals.map((goal, index) => (
                      <li key={index}>{goal}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="faction-section">
                  <h4 className="section-title">Notable Members</h4>
                  <div className="faction-members">
                    {faction.notable_members.map((member, index) => (
                      <div className="faction-member" key={index}>
                        <div className="member-avatar">
                          <img
                            src={member.image_url}
                            alt={member.name}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/images/default_avatar.png';
                            }}
                          />
                        </div>
                        <div className="member-info">
                          <div className="member-name">{member.name}</div>
                          <div className="member-role">{member.role}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {displayFactions.length === 0 && (
        <div className="no-factions">
          <i className="fas fa-users"></i>
          <p>No factions found matching your search criteria.</p>
          <button 
            className="reset-button"
            onClick={() => setSearchQuery('')}
          >
            Reset Search
          </button>
        </div>
      )}
    </div>
  );
};

export default FactionsPage;
