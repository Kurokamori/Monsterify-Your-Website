import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import api from '../../services/api';

const NPCsPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [npcs, setNpcs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNpc, setSelectedNpc] = useState(null);

  useEffect(() => {
    fetchNpcs();
  }, []);

  const fetchNpcs = async () => {
    try {
      setLoading(true);
      
      // Fetch NPCs
      const npcsResponse = await api.get('/npcs');
      setNpcs(npcsResponse.data.npcs || []);
      
      // Fetch categories
      const categoriesResponse = await api.get('/npcs/categories');
      setCategories(categoriesResponse.data.categories || []);
      
    } catch (err) {
      console.error('Error fetching NPCs:', err);
      setError('Failed to load NPCs. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Filter NPCs based on selected category and search query
  const filteredNpcs = npcs.filter(npc => {
    const categoryMatch = selectedCategory === 'all' || npc.category === selectedCategory;
    const searchMatch = npc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        npc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        npc.location.toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && searchMatch;
  });

  // Fallback data for development
  const fallbackCategories = [
    { id: 'trainers', name: 'Gym Leaders & Elite Trainers' },
    { id: 'researchers', name: 'Professors & Researchers' },
    { id: 'merchants', name: 'Merchants & Shopkeepers' },
    { id: 'quest', name: 'Quest Givers' },
    { id: 'legendary', name: 'Legendary Figures' }
  ];

  const fallbackNpcs = [
    {
      id: 'professor-willow',
      name: 'Professor Willow',
      category: 'researchers',
      description: 'The leading monster researcher and head of the Monster Research Society.',
      location: 'Aurora Town',
      image_url: 'https://via.placeholder.com/200/1e2532/d6a339?text=Prof.+Willow',
      faction: 'Monster Research Society',
      specialization: 'Monster Evolution',
      quests: ['Introduction to Monster Research', 'Evolutionary Stones Study'],
      bio: `<p>Professor Willow has dedicated his life to the study of monsters, with a particular focus on evolution. After earning his doctorate in Monster Biology, he quickly rose through the ranks of the Monster Research Society, eventually becoming its director.</p>
      <p>Known for his approachable demeanor and passion for education, Willow often takes on apprentices and helps new trainers begin their journey. His research has led to numerous breakthroughs in understanding monster evolution and genetics.</p>
      <p>When not in his laboratory, Willow can be found in the field, observing monsters in their natural habitats. He maintains a small team of his own monsters, primarily for research and protection during expeditions.</p>`,
      dialogue: [
        "Welcome to the world of monsters! I'm Professor Willow, and I study these fascinating creatures.",
        "Evolution is perhaps the most remarkable aspect of monsters. Some evolve through experience, others through special items or conditions.",
        "Every trainer has their own style and approach. Finding yours is part of the journey!",
        "The bond between trainer and monster is a remarkable thing. It's more than just commands and battles - it's a true partnership."
      ],
      rewards: [
        { type: 'item', name: 'Evolution Stone', description: 'Rare stone that can trigger evolution in certain monsters' },
        { type: 'monster', name: 'Starter Monster', description: 'Choose your first monster companion' }
      ]
    },
    {
      id: 'champion-lance',
      name: 'Champion Lance',
      category: 'trainers',
      description: 'The current champion of the International Battle League and a master of dragon-type monsters.',
      location: 'Battle Tower (Crystal Mountains)',
      image_url: 'https://via.placeholder.com/200/1e2532/d6a339?text=Champion+Lance',
      faction: 'International Battle League',
      specialization: 'Dragon-type Monsters',
      quests: ['Champion\'s Challenge', 'Dragon Mastery'],
      bio: `<p>Lance rose to prominence as a trainer at a young age, showing an exceptional talent for working with dragon-type monsters. After years of training and competing, he claimed the title of Champion and has successfully defended it for five consecutive years.</p>
      <p>As Champion, Lance not only participates in battles but also helps govern the International Battle League, working to improve rules and ensure fair competition. He is known for his strict but fair judging and his commitment to ethical monster training.</p>
      <p>Despite his fame, Lance remains humble and approachable, often mentoring promising young trainers. His signature monster, a powerful Dragonite, has been with him since the beginning of his journey and is considered one of the strongest monsters in the competitive circuit.</p>`,
      dialogue: [
        "Power alone isn't enough to become a champion. Understanding your monsters and forming a true bond with them is essential.",
        "I specialize in dragon-type monsters. They're challenging to train but incredibly powerful when you earn their trust.",
        "The path to becoming a champion is long and difficult. Are you prepared for the journey?",
        "Every defeat is an opportunity to learn and grow stronger. Never be discouraged by loss."
      ],
      rewards: [
        { type: 'badge', name: 'Dragon Master Badge', description: 'Proof of defeating Champion Lance' },
        { type: 'training', name: 'Advanced Battle Techniques', description: 'Special training session with the Champion' }
      ]
    },
    {
      id: 'merchant-felix',
      name: 'Merchant Felix',
      category: 'merchants',
      description: 'A traveling merchant who sells rare items and monster supplies.',
      location: 'Various (follows a regular route)',
      image_url: 'https://via.placeholder.com/200/1e2532/d6a339?text=Merchant+Felix',
      faction: 'Independent',
      specialization: 'Rare Items & Artifacts',
      quests: ['Rare Item Hunt', 'Ancient Artifact Recovery'],
      bio: `<p>Felix comes from a long line of merchants who have traveled the world for generations. His knowledge of rare items and artifacts is unmatched, and he has an uncanny ability to find valuable treasures in the most unexpected places.</p>
      <p>While his primary business is selling supplies to trainers, Felix is also an avid collector of ancient artifacts related to the Ancient Ones. He often hires trainers to help him recover rare items from dangerous locations.</p>
      <p>Despite his somewhat eccentric personality, Felix is known for fair prices and honest dealings. His inventory changes regularly as he travels between towns, making his arrival an eagerly anticipated event for local trainers.</p>`,
      dialogue: [
        "Welcome, welcome! Felix's Fantastic Finds has everything a trainer could need - and many things you didn't know you needed!",
        "This? Oh, this is a very rare item indeed. Said to have belonged to one of the Original Seven trainers!",
        "I'll be heading to Verdant Valley next week, then to the Crystal Mountains. Check my schedule if you want to find me!",
        "I'm always looking for brave trainers to help me recover rare items. The pay is good, and you might find something interesting for yourself!"
      ],
      rewards: [
        { type: 'item', name: 'Discount Card', description: '10% off all purchases from Felix' },
        { type: 'access', name: 'Rare Inventory', description: 'Access to Felix\'s special inventory of rare items' }
      ]
    },
    {
      id: 'elder-aria',
      name: 'Elder Sage Aria',
      category: 'legendary',
      description: 'The mysterious leader of the Guardians and keeper of ancient knowledge.',
      location: 'Hidden Temple (Verdant Valley)',
      image_url: 'https://via.placeholder.com/200/1e2532/d6a339?text=Elder+Aria',
      faction: 'The Guardians',
      specialization: 'Ancient Knowledge & Spiritual Techniques',
      quests: ['Path of the Guardian', 'Ancient Wisdom'],
      bio: `<p>Elder Aria's exact age is unknown, but legends suggest she has led the Guardians for over a century. Some believe she has discovered the secret to longevity through her deep connection with the spiritual energy of monsters.</p>
      <p>As the leader of the Guardians, Aria works to maintain balance in the world and protect the artifacts of the Ancient Ones. She possesses vast knowledge of ancient techniques for monster training that have been lost to most of the modern world.</p>
      <p>Aria rarely leaves the Hidden Temple, instead sending her disciples to handle matters in the outside world. Those who seek her wisdom must prove themselves worthy through a series of trials designed to test both their skill as trainers and their moral character.</p>`,
      dialogue: [
        "The path of a Guardian is not an easy one. It requires dedication, wisdom, and a deep respect for the balance of our world.",
        "The Ancient Ones left us not just their power, but their responsibility. We must ensure that power is never misused.",
        "Your monsters are not tools, but partners on your journey. Listen to them, and they will reveal truths you never imagined.",
        "The Shadow Syndicate seeks power without understanding its cost. This is why we must remain vigilant."
      ],
      rewards: [
        { type: 'technique', name: 'Guardian Training', description: 'Ancient training techniques for monsters' },
        { type: 'item', name: 'Spirit Charm', description: 'Enhances the spiritual connection between trainer and monster' }
      ]
    },
    {
      id: 'ranger-thorne',
      name: 'Ranger Captain Thorne',
      category: 'quest',
      description: 'Leader of the Monster Rangers and protector of wild monster habitats.',
      location: 'Ranger Headquarters (Verdant Forest)',
      image_url: 'https://via.placeholder.com/200/1e2532/d6a339?text=Ranger+Thorne',
      faction: 'Monster Rangers',
      specialization: 'Conservation & Rescue',
      quests: ['Poacher Patrol', 'Endangered Monster Rescue', 'Habitat Restoration'],
      bio: `<p>Captain Thorne is the fifth generation of his family to lead the Monster Rangers, following in the footsteps of his ancestor who founded the organization. His dedication to monster conservation is unwavering, and he has personally led numerous dangerous missions to rescue endangered monsters.</p>
      <p>Under Thorne's leadership, the Rangers have expanded their operations to cover all major regions, establishing outposts in remote areas to monitor monster populations and prevent poaching. He has also developed new techniques for rehabilitating injured monsters and reintroducing them to the wild.</p>
      <p>Thorne is known for his no-nonsense attitude and strict adherence to Ranger protocols, but those who work with him closely know he has a compassionate heart, especially when it comes to monsters in need. His partner, a rescued Pyroar, is always by his side.</p>`,
      dialogue: [
        "The Rangers' mission is simple: protect monsters and their habitats so they can thrive for generations to come.",
        "We've received reports of poachers in the northern section of the forest. I need experienced trainers to help us investigate.",
        "Not all monsters should be captured and trained. Some are essential to their ecosystems and should remain wild.",
        "If you find an injured monster, don't try to capture it. Contact the nearest Ranger outpost, and we'll provide proper care."
      ],
      rewards: [
        { type: 'permit', name: 'Special Capture Permit', description: 'Permission to capture monsters in protected areas (with restrictions)' },
        { type: 'training', name: 'Wilderness Survival', description: 'Training in survival skills and monster first aid' }
      ]
    }
  ];

  const displayCategories = categories.length > 0 ? categories : fallbackCategories;
  const displayNpcs = npcs.length > 0 ? filteredNpcs : fallbackNpcs.filter(npc => {
    const categoryMatch = selectedCategory === 'all' || npc.category === selectedCategory;
    const searchMatch = npc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        npc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        npc.location.toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && searchMatch;
  });

  if (loading) {
    return <LoadingSpinner message="Loading NPCs..." />;
  }

  if (error) {
    return (
      <ErrorMessage 
        message={error} 
        onRetry={fetchNpcs}
      />
    );
  }

  return (
    <div className="lore-container">
      <div className="lore-header">
        <h1>Important Characters</h1>
        <p>Meet the key figures in the Monsterify world</p>
      </div>

      <div className="npcs-search-filter">
        <div className="npcs-search">
          <input
            type="text"
            placeholder="Search characters..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
          />
          <button className="button primary">
            <i className="fas fa-search"></i>
          </button>
        </div>
        <div className="npcs-filter">
          <label htmlFor="category-filter">Filter by:</label>
          <select
            id="category-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-select"
          >
            <option value="all">All Categories</option>
            {displayCategories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="npcs-grid">
        {displayNpcs.map(npc => (
          <div 
            className={`npc-card ${selectedNpc === npc.id ? 'expanded' : ''}`} 
            key={npc.id}
          >
            <div className="npc-basic-info" onClick={() => setSelectedNpc(selectedNpc === npc.id ? null : npc.id)}>
              <div className="npc-avatar">
                <img
                  src={npc.image_url}
                  alt={npc.name}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/images/default_avatar.png';
                  }}
                />
              </div>
              <div className="npc-info">
                <h3 className="npc-name">{npc.name}</h3>
                <div className="npc-category">
                  {displayCategories.find(cat => cat.id === npc.category)?.name || npc.category}
                </div>
                <p className="npc-description">{npc.description}</p>
                <div className="npc-location">
                  <i className="fas fa-map-marker-alt"></i> {npc.location}
                </div>
              </div>
              <div className="npc-toggle">
                <i className={`fas fa-chevron-${selectedNpc === npc.id ? 'up' : 'down'}`}></i>
              </div>
            </div>
            
            {selectedNpc === npc.id && (
              <div className="npc-details">
                <div className="npc-section">
                  <h4 className="section-title">Biography</h4>
                  <div 
                    className="npc-bio"
                    dangerouslySetInnerHTML={{ __html: npc.bio }}
                  />
                </div>
                
                <div className="npc-columns">
                  <div className="npc-section">
                    <h4 className="section-title">Information</h4>
                    <div className="auth-form">
                      <div className="stat-info">
                        <span className="info-label">Faction:</span>
                        <span className="info-value">{npc.faction}</span>
                      </div>
                      <div className="stat-info">
                        <span className="info-label">Specialization:</span>
                        <span className="info-value">{npc.specialization}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="npc-section">
                    <h4 className="section-title">Quests</h4>
                    <ul className="npc-quests">
                      {npc.quests.map((quest, index) => (
                        <li key={index}>{quest}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div className="npc-section">
                  <h4 className="section-title">Dialogue</h4>
                  <div className="map-filters">
                    {npc.dialogue.map((line, index) => (
                      <div className="dialogue-line" key={index}>
                        <i className="fas fa-quote-left"></i>
                        <p>{line}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="npc-section">
                  <h4 className="section-title">Rewards</h4>
                  <div className="npc-rewards">
                    {npc.rewards.map((reward, index) => (
                      <div className="reward-item" key={index}>
                        <div className="reward-icon">
                          <i className={`fas${getRewardIcon(reward.type)}`}></i>
                        </div>
                        <div className="reward-info">
                          <div className="reward-name">{reward.name}</div>
                          <div className="reward-description">{reward.description}</div>
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

      {displayNpcs.length === 0 && (
        <div className="no-npcs">
          <i className="fas fa-user-slash"></i>
          <p>No characters found matching your search criteria.</p>
          <button 
            className="button secondary"
            onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
            }}
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};

// Helper function to get icon based on reward type
const getRewardIcon = (type) => {
  switch (type) {
    case 'item':
      return 'fa-box';
    case 'monster':
      return 'fa-dragon';
    case 'badge':
      return 'fa-medal';
    case 'training':
      return 'fa-graduation-cap';
    case 'permit':
      return 'fa-scroll';
    case 'access':
      return 'fa-key';
    case 'technique':
      return 'fa-book';
    default:
      return 'fa-gift';
  }
};

export default NPCsPage;
