import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import api from '../../services/api';

const LorePage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loreEntries, setLoreEntries] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedEntry, setExpandedEntry] = useState(null);

  useEffect(() => {
    fetchLoreData();
  }, []);

  const fetchLoreData = async () => {
    try {
      setLoading(true);
      
      // Fetch lore entries
      const loreResponse = await api.get('/lore');
      setLoreEntries(loreResponse.data.entries || []);
      
      // Fetch categories
      const categoriesResponse = await api.get('/lore/categories');
      setCategories(categoriesResponse.data.categories || []);
      
    } catch (err) {
      console.error('Error fetching lore data:', err);
      setError('Failed to load lore data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpandEntry = (entryId) => {
    if (expandedEntry === entryId) {
      setExpandedEntry(null);
    } else {
      setExpandedEntry(entryId);
    }
  };

  // Filter lore entries based on selected category and search query
  const filteredEntries = loreEntries.filter(entry => {
    const categoryMatch = selectedCategory === 'all' || entry.category === selectedCategory;
    const searchMatch = entry.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        entry.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        entry.content.toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && searchMatch;
  });

  // Fallback data for development
  const fallbackCategories = [
    { id: 'world', name: 'World History' },
    { id: 'monsters', name: 'Monster Origins' },
    { id: 'legends', name: 'Legends & Myths' },
    { id: 'characters', name: 'Important Characters' },
    { id: 'events', name: 'Historical Events' }
  ];

  const fallbackLoreEntries = [
    {
      id: 'creation-myth',
      title: 'The Creation Myth',
      category: 'world',
      summary: 'The ancient legend of how the world and the first monsters came to be.',
      content: `<p>Long ago, before humans walked the earth, the world was shaped by the Ancient Ones - powerful beings of pure energy. They created the land, sea, and sky, and breathed life into the first monsters.</p>
      <p>The Ancient Ones each embodied a different element: Fire, Water, Earth, Air, Light, and Shadow. They worked together to create a balanced world, but soon began to disagree on how it should evolve.</p>
      <p>Their disagreements led to a great conflict, and the energy released during their battles created even more monsters, each reflecting the nature of the Ancient One that spawned them.</p>
      <p>Eventually, the Ancient Ones realized their conflict was destroying the very world they had created. They decided to retreat into six sacred artifacts, leaving the world to develop on its own. These artifacts were scattered across the world, and it is said that those who find them can commune with the Ancient Ones and gain a portion of their power.</p>
      <p>Humans emerged long after, and discovered they could form bonds with the monsters. Those who showed exceptional ability to connect with monsters became the first Trainers, beginning the tradition that continues to this day.</p>`,
      image_url: 'https://via.placeholder.com/400/1e2532/d6a339?text=Creation+Myth'
    },
    {
      id: 'first-trainers',
      title: 'The First Trainers',
      category: 'characters',
      summary: 'The story of the original monster trainers who established the training tradition.',
      content: `<p>The first documented monster trainers emerged about 1,000 years ago in the Aurora Region. A group of seven individuals discovered they could form special bonds with monsters, allowing them to communicate with and guide them.</p>
      <p>These seven trainers - known as the Original Seven - traveled across the land, learning about different monster species and developing techniques for training them. They established the first training academies and created the code of ethics that trainers still follow today.</p>
      <p>The Original Seven were:</p>
      <ul>
        <li><strong>Elara the Wise</strong> - Known for her deep understanding of monster psychology</li>
        <li><strong>Thorne the Brave</strong> - Famous for bonding with the most dangerous monsters</li>
        <li><strong>Lyra the Swift</strong> - Renowned for her agility and training techniques</li>
        <li><strong>Orion the Strong</strong> - Respected for his powerful monsters and battle strategies</li>
        <li><strong>Selene the Gentle</strong> - Beloved for her healing abilities and care for injured monsters</li>
        <li><strong>Cyrus the Clever</strong> - Admired for his innovative training methods</li>
        <li><strong>Aria the Harmonious</strong> - Celebrated for her ability to bring trainers and monsters together</li>
      </ul>
      <p>Their legacy lives on in the training academies and battle arenas that bear their names, and in the traditions that have been passed down through generations of trainers.</p>`,
      image_url: 'https://via.placeholder.com/400/1e2532/d6a339?text=First+Trainers'
    },
    {
      id: 'elemental-stones',
      title: 'The Elemental Stones',
      category: 'legends',
      summary: 'Mysterious stones that can evolve certain monsters and enhance their powers.',
      content: `<p>The Elemental Stones are rare minerals that resonate with the energy of specific monster types. When a compatible monster comes into contact with these stones, they can undergo evolution or experience a temporary power boost.</p>
      <p>According to legend, the Elemental Stones are fragments of the artifacts left behind by the Ancient Ones. Each stone contains a concentrated form of elemental energy:</p>
      <ul>
        <li><strong>Fire Stone</strong> - Glows with an inner flame and is warm to the touch</li>
        <li><strong>Water Stone</strong> - Appears to contain flowing water within its translucent blue surface</li>
        <li><strong>Thunder Stone</strong> - Crackles with electricity when handled</li>
        <li><strong>Leaf Stone</strong> - Contains a perfectly preserved leaf at its center</li>
        <li><strong>Moon Stone</strong> - Shimmers with moonlight even in complete darkness</li>
        <li><strong>Sun Stone</strong> - Radiates warmth and light like a miniature sun</li>
        <li><strong>Dusk Stone</strong> - Absorbs light, creating shadows around it</li>
        <li><strong>Dawn Stone</strong> - Glimmers with the colors of sunrise</li>
      </ul>
      <p>These stones can be found in specific locations throughout the world, often in areas with strong elemental energy. Trainers prize these stones for their ability to help their monsters reach new evolutionary stages.</p>`,
      image_url: 'https://via.placeholder.com/400/1e2532/d6a339?text=Elemental+Stones'
    },
    {
      id: 'great-cataclysm',
      title: 'The Great Cataclysm',
      category: 'events',
      summary: 'A world-changing disaster that reshaped the land and altered monster populations.',
      content: `<p>Approximately 500 years ago, a catastrophic event known as the Great Cataclysm forever changed the world. According to historical records and archaeological evidence, a massive surge of energy erupted from deep within the earth, causing widespread destruction and transformation.</p>
      <p>The Cataclysm is believed to have been triggered when an ambitious group of researchers attempted to harness the power of all six Ancient One artifacts simultaneously. The resulting energy release caused:</p>
      <ul>
        <li>Massive earthquakes that reshaped coastlines and created new mountain ranges</li>
        <li>The formation of the Crystal Mountains, where normal rock was transmuted into crystalline structures</li>
        <li>The emergence of the Ember Islands as volcanic activity created a new archipelago</li>
        <li>The flooding of the ancient city of Aquatica, now lying beneath Aurora Lake</li>
        <li>The creation of the Shadow Depths, where reality itself seems distorted</li>
      </ul>
      <p>The Cataclysm also had profound effects on monster populations. Some species were driven to extinction, while others evolved rapidly to adapt to their changed environments. New species emerged, particularly in areas most affected by the energy surge.</p>
      <p>The artifacts of the Ancient Ones were scattered once again, and their locations remain unknown to this day. Many trainers and researchers continue to search for these powerful relics, hoping to uncover their secrets while avoiding the mistakes of the past.</p>`,
      image_url: 'https://via.placeholder.com/400/1e2532/d6a339?text=Great+Cataclysm'
    },
    {
      id: 'monster-origins',
      title: 'Origins of Monsters',
      category: 'monsters',
      summary: 'How the diverse species of monsters came into existence and evolved over time.',
      content: `<p>Monsters have existed on the planet for millennia, predating human civilization by thousands of years. Their origins are diverse, with different types emerging through various natural and supernatural processes.</p>
      <p>The earliest monsters were created directly by the Ancient Ones, embodying the pure elemental forces of nature. These primal monsters became the ancestors of many species we know today.</p>
      <p>Over time, monsters evolved and adapted to different environments, developing specialized traits and abilities. This natural evolution led to the incredible diversity of monster species found across the world.</p>
      <p>Scientists have identified several categories of monster origins:</p>
      <ul>
        <li><strong>Elemental Manifestations</strong> - Monsters born directly from natural forces like fire, water, and lightning</li>
        <li><strong>Biological Evolution</strong> - Monsters that evolved from simpler life forms through natural selection</li>
        <li><strong>Spiritual Entities</strong> - Monsters that emerged from human emotions, dreams, or spiritual energy</li>
        <li><strong>Artificial Creation</strong> - Monsters created through ancient or modern scientific experiments</li>
        <li><strong>Extraterrestrial</strong> - Rare monsters believed to have come from beyond our world</li>
      </ul>
      <p>Monster evolution continues to this day, with new species occasionally being discovered in remote regions. The relationship between monsters and humans has also influenced their development, with some species evolving specifically to form stronger bonds with human trainers.</p>`,
      image_url: 'https://via.placeholder.com/400/1e2532/d6a339?text=Monster+Origins'
    }
  ];

  const displayCategories = categories.length > 0 ? categories : fallbackCategories;
  const displayLoreEntries = loreEntries.length > 0 ? filteredEntries : fallbackLoreEntries.filter(entry => {
    const categoryMatch = selectedCategory === 'all' || entry.category === selectedCategory;
    const searchMatch = entry.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        entry.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && searchMatch;
  });

  if (loading) {
    return <LoadingSpinner message="Loading lore..." />;
  }

  if (error) {
    return (
      <ErrorMessage 
        message={error} 
        onRetry={fetchLoreData}
      />
    );
  }

  return (
    <div className="main-content-container">
      <div className="lore-header">
        <h1>World Lore & History</h1>
        <p>Explore the rich history, legends, and stories of the Monsterify world</p>
      </div>

      <div className="lore-search-filter">
        <div className="lore-search">
          <input
            type="text"
            placeholder="Search lore entries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
          />
          <button className="button primary">
            <i className="fas fa-search"></i>
          </button>
        </div>
        <div className="lore-filter">
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
        {displayLoreEntries.map(entry => (
          <div 
            className={`lore-entry ${expandedEntry === entry.id ? 'expanded' : ''}`} 
            key={entry.id}
          >
            <div className="option-row" onClick={() => toggleExpandEntry(entry.id)}>
              <div className="lore-entry-title-container">
                <h3 className="lore-entry-title">{entry.title}</h3>
                <span className="lore-entry-category">
                  {displayCategories.find(cat => cat.id === entry.category)?.name || entry.category}
                </span>
              </div>
              <div className="lore-entry-toggle">
                <i className={`fas fa-chevron-${expandedEntry === entry.id ? 'up' : 'down'}`}></i>
              </div>
            </div>
            
            <div className="lore-entry-summary">
              <p>{entry.summary}</p>
            </div>
            
            {expandedEntry === entry.id && (
              <div className="lore-entry-content">
                <div className="lore-entry-image">
                  <img
                    src={entry.image_url}
                    alt={entry.title}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/default_lore.png';
                    }}
                  />
                </div>
                <div 
                  className="lore-entry-text"
                  dangerouslySetInnerHTML={{ __html: entry.content }}
                />
                <div className="lore-entry-related">
                  <h4>Related Entries</h4>
                  <div className="related-links">
                    {getRelatedEntries(entry, displayLoreEntries).map(related => (
                      <button 
                        key={related.id} 
                        className="related-link"
                        onClick={() => {
                          setExpandedEntry(related.id);
                          document.getElementById(related.id).scrollIntoView({ behavior: 'smooth' });
                        }}
                      >
                        {related.title}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {displayLoreEntries.length === 0 && (
        <div className="no-npcs">
          <i className="fas fa-book"></i>
          <p>No lore entries found matching your search criteria.</p>
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

// Helper function to get related entries
const getRelatedEntries = (currentEntry, allEntries) => {
  // Find entries in the same category
  const sameCategory = allEntries.filter(entry => 
    entry.id !== currentEntry.id && entry.category === currentEntry.category
  );
  
  // Return up to 3 related entries
  return sameCategory.slice(0, 3);
};

export default LorePage;
