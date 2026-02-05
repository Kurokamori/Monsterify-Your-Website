import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import monsterService from '../../services/monsterService';
import trainerService from '../../services/trainerService';
import { useAuth } from '../../contexts/AuthContext';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import EvolutionEditor from '../../components/monsters/EvolutionEditor';
import EvolutionCards from '../../components/monsters/EvolutionCards';

const MonsterDetailPage = () => {
  const params = useParams();
  // Get the ID from URL parameters and ensure it's a valid number
  const id = params.id ? parseInt(params.id) : null;
  console.log("URL Parameters:", params);
  console.log("Monster ID from URL (parsed):", id);

  // Function to get friendship message based on friendship level
  const getFriendshipMessage = (friendship) => {
    if (friendship === undefined || friendship === null) return '';
    
    const friendshipLevel = parseInt(friendship);
    
    if (friendshipLevel === 0) return "Doesn't seem to trust or like their trainer";
    if (friendshipLevel <= 30) return "Shows some wariness towards their trainer";
    if (friendshipLevel <= 50) return "Beginning to warm up to their trainer";
    if (friendshipLevel <= 70) return "Getting along well with their trainer";
    if (friendshipLevel <= 100) return "Trusts and respects their trainer";
    if (friendshipLevel <= 130) return "Has formed a strong bond with their trainer";
    if (friendshipLevel <= 150) return "Deeply loyal and devoted to their trainer";
    if (friendshipLevel <= 180) return "Considers their trainer a true companion";
    if (friendshipLevel <= 210) return "Would do anything to protect their trainer";
    if (friendshipLevel <= 240) return "Shares an unbreakable bond with their trainer";
    if (friendshipLevel >= 255) return "Adores their trainer and trusts them fully";
    
    return `Friendship level: ${friendshipLevel}`;
  };

  // Function to fetch relation entities (monsters and trainers)
  const fetchRelationEntities = async (monster) => {
    if (!monster.relations) return;

    try {
      const relations = typeof monster.relations === 'string'
        ? JSON.parse(monster.relations)
        : monster.relations;

      if (!Array.isArray(relations)) return;

      const entities = {};

      for (const relation of relations) {
        if (relation.related_type === 'trainer' && relation.related_id) {
          try {
            const response = await trainerService.getTrainerById(relation.related_id);
            if (response && response.trainer) {
              entities[`trainer_${relation.related_id}`] = {
                type: 'trainer',
                name: response.trainer.name,
                data: response.trainer
              };
            }
          } catch (err) {
            console.error(`Error fetching trainer ${relation.related_id}:`, err);
          }
        } else if (relation.related_type === 'monster' && relation.related_id) {
          try {
            const response = await monsterService.getMonsterById(relation.related_id);
            if (response && response.success && response.data) {
              const monsterData = response.data;
              // Also fetch the trainer for this monster
              let trainerName = 'Unknown Trainer';
              if (monsterData.trainer_id) {
                try {
                  const trainerResponse = await trainerService.getTrainerById(monsterData.trainer_id);
                  if (trainerResponse && trainerResponse.trainer) {
                    trainerName = trainerResponse.trainer.name;
                  }
                } catch (trainerErr) {
                  console.error(`Error fetching trainer for monster ${relation.related_id}:`, trainerErr);
                }
              }
              
              entities[`monster_${relation.related_id}`] = {
                type: 'monster',
                name: `${monsterData.name} (${trainerName})`,
                data: monsterData,
                trainerName: trainerName
              };
            }
          } catch (err) {
            console.error(`Error fetching monster ${relation.related_id}:`, err);
          }
        }
      }

      setRelationEntities(entities);
    } catch (err) {
      console.error('Error parsing monster relations:', err);
    }
  };

  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [monster, setMonster] = useState(null);
  const [trainer, setTrainer] = useState(null);
  const [moves, setMoves] = useState([]);
  const [evolutionChain, setEvolutionChain] = useState([]);
  const [galleryImages, setGalleryImages] = useState([]);
  const [lineage, setLineage] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [prevMonster, setPrevMonster] = useState(null);
  const [nextMonster, setNextMonster] = useState(null);
  const [megaImages, setMegaImages] = useState({ mega_stone_image: null, mega_image: null });
  const [showEditLineage, setShowEditLineage] = useState(false);
  const [newRelationshipType, setNewRelationshipType] = useState('parent');
  const [monsterSearch, setMonsterSearch] = useState('');
  const [relationshipNotes, setRelationshipNotes] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMonster, setSelectedMonster] = useState(null);
  const [relationEntities, setRelationEntities] = useState({});
  const [showEvolutionEditor, setShowEvolutionEditor] = useState(false);
  const [evolutionSaving, setEvolutionSaving] = useState(false);

  // Set document title based on monster name
  useDocumentTitle(monster ? monster.name : 'Monster');

  useEffect(() => {
    console.log("useEffect triggered with ID:", id);
    if (id && !isNaN(id)) {
      fetchMonsterData();
    } else {
      console.error("Invalid monster ID detected:", id);
      setError('Invalid monster ID. Please make sure you are accessing a valid monster page.');
      setLoading(false);
    }
  }, [id]);

  const fetchMonsterData = async () => {
    try {
      setLoading(true);

      // ID validation is already done in the useEffect hook
      // We know id is a valid number at this point
      console.log(`Fetching monster with ID: ${id}`);

      // Fetch monster details
      const monsterResponse = await monsterService.getMonsterById(id);
      console.log('Full monster response:', monsterResponse);

      if (!monsterResponse || !monsterResponse.success || !monsterResponse.data) {
        console.error('Monster not found or invalid response:', monsterResponse);
        setError(monsterResponse?.message || 'Monster not found');
        setLoading(false);
        return;
      }

      const monsterData = monsterResponse.data;
      console.log('Monster data received:', monsterData);

      // Ensure we have a valid monster object
      if (!monsterData || typeof monsterData !== 'object') {
        console.error('Invalid monster data format:', monsterData);
        setError('Invalid monster data format');
        setLoading(false);
        return;
      }

      setMonster(monsterData);

      // Fetch relation entities
      await fetchRelationEntities(monsterData);

      // Fetch trainer details if trainer_id exists
      if (monsterData.trainer_id) {
        try {
          const trainerResponse = await trainerService.getTrainerById(monsterData.trainer_id);
          setTrainer(trainerResponse.trainer || null);
        } catch (trainerErr) {
          console.error(`Error fetching trainer for monster ${id}:`, trainerErr);
          // Don't fail the whole request if trainer fetch fails
        }
      }

      // Fetch monster moves
      try {
        const movesResponse = await monsterService.getMonsterMoves(id);
        console.log('Moves response:', movesResponse);
        if (movesResponse && movesResponse.success && Array.isArray(movesResponse.data)) {
          setMoves(movesResponse.data);
        } else if (movesResponse && Array.isArray(movesResponse.data)) {
          setMoves(movesResponse.data);
        } else {
          console.warn('Unexpected moves response format:', movesResponse);
          setMoves([]);
        }
      } catch (movesErr) {
        console.error(`Error fetching moves for monster ${id}:`, movesErr);
        // Don't fail the whole request if moves fetch fails
        setMoves([]);
      }

      // Fetch evolution data from the same endpoint that the editor saves to
      try {
        const evolutionResponse = await monsterService.getMonsterEvolutionData(id);
        console.log('Evolution data response:', evolutionResponse);
        if (evolutionResponse && evolutionResponse.success && evolutionResponse.data) {
          // If the data is an object with evolution_data property, use that
          if (evolutionResponse.data.evolution_data) {
            try {
              // Evolution data might be stored as a JSON string
              const parsedData = typeof evolutionResponse.data.evolution_data === 'string'
                ? JSON.parse(evolutionResponse.data.evolution_data)
                : evolutionResponse.data.evolution_data;

              setEvolutionChain(Array.isArray(parsedData) ? parsedData : []);
            } catch (parseErr) {
              console.error('Error parsing evolution data:', parseErr);
              setEvolutionChain([]);
            }
          }
          // If the data is an array, use it directly
          else if (Array.isArray(evolutionResponse.data)) {
            setEvolutionChain(evolutionResponse.data);
          } else {
            console.warn('No evolution data found');
            setEvolutionChain([]);
          }
        } else {
          console.warn('No evolution data available:', evolutionResponse);
          setEvolutionChain([]);
        }
      } catch (evolutionErr) {
        console.error(`Error fetching evolution data for monster ${id}:`, evolutionErr);
        // Don't fail the whole request if evolution data fetch fails
        setEvolutionChain([]);
      }

      // Fetch gallery images
      try {
        const galleryResponse = await monsterService.getMonsterGallery(id);
        console.log('Gallery response:', galleryResponse);
        if (galleryResponse && galleryResponse.success && galleryResponse.data) {
          // If the data is an array, use it directly
          if (Array.isArray(galleryResponse.data)) {
            setGalleryImages(galleryResponse.data);
          }
          // If the data has an images property that's an array
          else if (galleryResponse.data.images && Array.isArray(galleryResponse.data.images)) {
            setGalleryImages(galleryResponse.data.images);
          }
          // If the data has a data property that's an array
          else if (galleryResponse.data.data && Array.isArray(galleryResponse.data.data)) {
            setGalleryImages(galleryResponse.data.data);
          }
          // If monster has images property directly
          else if (monsterData.images && Array.isArray(monsterData.images)) {
            setGalleryImages(monsterData.images);
          } else {
            console.warn('Unexpected gallery format:', galleryResponse);
            setGalleryImages([]);
          }
        } else {
          console.warn('No gallery data available:', galleryResponse);
          setGalleryImages([]);
        }
      } catch (galleryErr) {
        console.error(`Error fetching gallery for monster ${id}:`, galleryErr);
        // Don't fail the whole request if gallery fetch fails
        setGalleryImages([]);
      }

      // Fetch box navigation (prev/next monsters)
      if (monsterData.trainer_id && monsterData.box_number) {
        try {
          const monstersResponse = await trainerService.getTrainerMonsters(monsterData.trainer_id);
          const boxMonsters = monstersResponse.monsters.filter(m => m.box_number === monsterData.box_number);

          // Sort by box position if available
          if (boxMonsters.length > 0 && boxMonsters[0].trainer_index !== undefined) {
            boxMonsters.sort((a, b) => a.trainer_index - b.trainer_index);
          }

          const currentIndex = boxMonsters.findIndex(m => m.id === parseInt(id));

          if (currentIndex > 0) {
            setPrevMonster(boxMonsters[currentIndex - 1]);
          }

          if (currentIndex < boxMonsters.length - 1) {
            setNextMonster(boxMonsters[currentIndex + 1]);
          }
        } catch (boxErr) {
          console.error(`Error fetching box monsters for monster ${id}:`, boxErr);
          // Don't fail the whole request if box navigation fetch fails
        }
      }

      // Fetch mega images if monster has mega stone
      if (monsterData.has_mega_stone || monsterData.level >= 100) {
        try {
          const megaImagesResponse = await monsterService.getMegaImages(id);
          if (megaImagesResponse.success && megaImagesResponse.data) {
            setMegaImages(megaImagesResponse.data);
          }
        } catch (megaErr) {
          console.error(`Error fetching mega images for monster ${id}:`, megaErr);
          // Don't fail the whole request if mega images fetch fails
        }
      }

      // Fetch monster lineage
      try {
        const lineageResponse = await monsterService.getMonsterLineage(id);
        console.log('Lineage response:', lineageResponse);
        if (lineageResponse && lineageResponse.success && lineageResponse.data) {
          setLineage(lineageResponse.data);
        } else {
          console.warn('No lineage data available:', lineageResponse);
          setLineage(null);
        }
      } catch (lineageErr) {
        console.error(`Error fetching lineage for monster ${id}:`, lineageErr);
        // Don't fail the whole request if lineage fetch fails
        setLineage(null);
      }

    } catch (err) {
      console.error(`Error fetching monster ${id}:`, err);
      setError('Failed to load monster data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Debug ownership check
  console.log('Monster Detail - Current User:', currentUser);
  console.log('Monster Detail - Trainer:', trainer);
  console.log('Monster Detail - Monster:', monster);
  console.log('Monster Detail - Ownership check:', currentUser?.id, trainer?.player_user_id);

  // Check if the current user is the owner of the trainer
  const isOwner = currentUser && trainer && (
    // Check if IDs match (converted to strings for comparison)
    String(currentUser.id) === String(trainer.player_user_id) ||
    // Check if username matches
    currentUser.username === trainer.player_user_id ||
    // Check if email matches
    (currentUser.email && currentUser.email === trainer.player_user_id) ||
    // Check if discord_id matches
    (currentUser.discord_id && currentUser.discord_id === trainer.player_user_id) ||
    // Check if the user is an admin
    currentUser.is_admin === 1 || currentUser.is_admin === true
  );

  console.log('Monster Detail - Is owner result:', isOwner);

  // Function to remove a lineage relationship
  const removeLineageRelationship = async (relatedMonsterId, relationshipType) => {
    try {
      const response = await monsterService.removeLineageRelationship(id, relatedMonsterId, relationshipType);
      
      if (response.success) {
        // Refresh lineage data
        const lineageResponse = await monsterService.getMonsterLineage(id);
        if (lineageResponse && lineageResponse.success && lineageResponse.data) {
          setLineage(lineageResponse.data);
        }
      } else {
        console.error('Failed to remove lineage relationship:', response.message);
      }
    } catch (error) {
      console.error('Error removing lineage relationship:', error);
    }
  };

  // Function to search for monsters
  const searchMonsters = async (searchTerm) => {
    if (!searchTerm.trim() || searchTerm.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      // Search monsters by name, species, or trainer name
      const response = await monsterService.searchMonsters(searchTerm, 10);
      if (response.success && response.data) {
        // Filter out the current monster from search results
        const filtered = response.data.filter(m => m.id !== parseInt(id));
        setSearchResults(filtered);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching monsters:', error);
      setSearchResults([]);
    }
  };

  // Function to add a lineage relationship
  const addLineageRelationship = async () => {
    if (!selectedMonster) {
      alert('Please select a monster first');
      return;
    }

    try {
      console.log('Adding lineage relationship:', {
        monsterId: id,
        relatedMonsterId: selectedMonster.id,
        relationshipType: newRelationshipType,
        notes: relationshipNotes
      });

      const response = await monsterService.addLineageRelationship(
        id, 
        selectedMonster.id, 
        newRelationshipType, 
        relationshipNotes
      );
      
      console.log('Add lineage response:', response);
      
      if (response.success) {
        // Refresh lineage data
        const lineageResponse = await monsterService.getMonsterLineage(id);
        if (lineageResponse && lineageResponse.success && lineageResponse.data) {
          setLineage(lineageResponse.data);
        }
        
        // Reset form
        setSelectedMonster(null);
        setMonsterSearch('');
        setRelationshipNotes('');
        setSearchResults([]);
        
        alert('Lineage relationship added successfully!');
      } else {
        alert('Failed to add lineage relationship: ' + (response.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error adding lineage relationship:', error);
      alert('An error occurred while adding the lineage relationship: ' + error.message);
    }
  };

  // Handle search input changes
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setMonsterSearch(value);
    
    // Clear existing search timeout
    if (window.searchTimeout) {
      clearTimeout(window.searchTimeout);
    }
    
    // Debounce search - shorter delay for better UX
    if (value.trim().length >= 2) {
      window.searchTimeout = setTimeout(() => {
        searchMonsters(value);
      }, 300);
    } else {
      // Clear results if search term is too short
      setSearchResults([]);
    }
  };

  // Handle monster selection
  const selectMonster = (monster) => {
    setSelectedMonster(monster);
    setMonsterSearch(monster.name);
    setSearchResults([]);
  };

  // Handle evolution data save
  const handleSaveEvolution = async (evolutionData) => {
    try {
      setEvolutionSaving(true);
      
      const response = await monsterService.setMonsterEvolutionData(id, evolutionData);
      
      if (response.success) {
        // Update the evolution chain state
        setEvolutionChain(evolutionData);
        setShowEvolutionEditor(false);
        alert('Evolution data saved successfully!');
      } else {
        throw new Error(response.message || 'Failed to save evolution data');
      }
    } catch (error) {
      console.error('Error saving evolution data:', error);
      alert('Failed to save evolution data: ' + error.message);
    } finally {
      setEvolutionSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
        </div>
        <p>Loading monster data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <i className="fas fa-exclamation-circle"></i>
        <p>{error}</p>
        <button onClick={fetchMonsterData} className="btn btn-primary">
          Try Again
        </button>
        <button onClick={() => navigate(-1)} className="button button-secondary">
          Go Back
        </button>
      </div>
    );
  }

  if (!monster) {
    return (
      <div className="error-container">
        <i className="fas fa-dragon-slash"></i>
        <p>Monster not found. The monster you're looking for might not exist or has been removed.</p>
        <button onClick={() => navigate(-1)} className="button button-secondary">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="monster-detail-container">
      {/* Box Navigation */}
      {(prevMonster || nextMonster) && (
        <div className="monster-box-navigation">
          {prevMonster ? (
            <Link to={`/monsters/${prevMonster.id}`} className="box-nav-button prev-monster">
              <i className="fas fa-chevron-left"></i>
              <span>{prevMonster.name}</span>
            </Link>
          ) : (
            <div className="box-nav-placeholder"></div>
          )}

          <div className="box-info">
            <span>Box {monster.box_number || 1}</span>
          </div>

          {nextMonster ? (
            <Link to={`/monsters/${nextMonster.id}`} className="box-nav-button next-monster">
              <span>{nextMonster.name}</span>
              <i className="fas fa-chevron-right"></i>
            </Link>
          ) : (
            <div className="box-nav-placeholder"></div>
          )}
        </div>
      )}

      <div className="monster-detail-header">
        <div className="monster-profile-image-container">
          <img
            src={monster.img_link || monster.main_image || '/images/default_mon.png'}
            alt={monster.name}
            className="monster-profile-image"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/images/default_mon.png';
            }}
          />
        </div>

        <div className="monster-profile-info">
          <h1 className="monster-profile-name">
            {monster.name}
            <span className="level-badge">Level {monster.level || 1}</span>
          </h1>

          <div className="monster-species-types">
            <div className="monster-species">
              {[monster.species1, monster.species2, monster.species3]
                .filter(Boolean)
                .join(' / ')}
            </div>

            <div className="monster-types">
              {monster.type1 && (
                <span className={`type-badge type-${monster.type1.toLowerCase()}`}>
                  {monster.type1}
                </span>
              )}
              {monster.type2 && (
                <span className={`type-badge type-${monster.type2.toLowerCase()}`}>
                  {monster.type2}
                </span>
              )}
              {monster.type3 && (
                <span className={`type-badge type-${monster.type3.toLowerCase()}`}>
                  {monster.type3}
                </span>
              )}
              {monster.type4 && (
                <span className={`type-badge type-${monster.type4.toLowerCase()}`}>
                  {monster.type4}
                </span>
              )}
              {monster.type5 && (
                <span className={`type-badge type-${monster.type5.toLowerCase()}`}>
                  {monster.type5}
                </span>
              )}
            </div>
          </div>

          {monster.attribute && (
            <div className="monster-attribute">
              <span className={`attribute-badge attribute-${monster.attribute.toLowerCase()}`}>
                {monster.attribute}
              </span>
            </div>
          )}

          {trainer && (
            <div className="monster-trainer">
              <span className="trainer-label">Trainer:</span>
              <Link to={`/trainers/${trainer.id}`} className="trainer-link">
                {trainer.name}
              </Link>
            </div>
          )}

          {isOwner && (
            <div className="monster-actions">
              <Link to={`/monsters/${monster.id}/edit`} className="monster-action-button">
                <i className="fas fa-edit"></i> Edit Monster
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="monster-detail-content">
        <div className="monster-sidebar">
          {trainer && (
            <div className="trainer-nav-card">
              <Link 
                to={`/trainers/${trainer.id}?tab=pc`} 
                className="back-to-trainer-link"
              >
                <i className="fas fa-arrow-left"></i>
                <span>Back to Trainer</span>
              </Link>
            </div>
          )}
          
          <div className="sidebar-nav">
            <button
              className={`sidebar-link ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              Profile
            </button>
            <button
              className={`sidebar-link ${activeTab === 'stats' ? 'active' : ''}`}
              onClick={() => setActiveTab('stats')}
            >
              Stats
            </button>
            <button
              className={`sidebar-link ${activeTab === 'moves' ? 'active' : ''}`}
              onClick={() => setActiveTab('moves')}
            >
              Moves
            </button>
            <button
              className={`sidebar-link ${activeTab === 'evolution' ? 'active' : ''}`}
              onClick={() => setActiveTab('evolution')}
            >
              Evolution
            </button>
            <button
              className={`sidebar-link ${activeTab === 'bio' ? 'active' : ''}`}
              onClick={() => setActiveTab('bio')}
            >
              Biography
            </button>
            <button
              className={`sidebar-link ${activeTab === 'gallery' ? 'active' : ''}`}
              onClick={() => setActiveTab('gallery')}
            >
              Gallery
            </button>
            <button
              className={`sidebar-link ${activeTab === 'lineage' ? 'active' : ''}`}
              onClick={() => setActiveTab('lineage')}
            >
              Lineage
            </button>

            {/* Mega Evolution tab - only show if monster has mega evolution data */}
            {monster.has_mega_stone && monster.level >= 100 && (
              <button
                className={`sidebar-link ${activeTab === 'mega' ? 'active' : ''}`}
                onClick={() => setActiveTab('mega')}
              >
                Mega Evolution
              </button>
            )}

            {/* Owner-only controls */}
            {isOwner && (
              <>
                <div className="sidebar-divider">Owner Controls</div>
                <Link
                  to={`/monsters/${monster.id}/edit`}
                  className="sidebar-link"
                >
                  Edit Monster
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="monster-main-content">
          {/* Profile Tab Content */}
          {activeTab === 'profile' && (
            <div className="monster-profile-tab">
              {/* Additional Information Panel */}
              {(monster.gender || monster.pronouns || monster.age || monster.nature || monster.characteristic || monster.ability || monster.friendship !== undefined) && (
                <div className="info-panel">
                  <div className="panel-header">
                    <h3 className="panel-title">
                      <i className="fas fa-info-circle"></i>
                      Additional Information
                    </h3>
                  </div>
                  <div className="monster-panel-content">
                    <div className="info-cards-grid">
                      {Boolean(monster.gender) && (
                        <div className="info-card">
                          <div className="info-card-icon">
                            <i className={`fas ${monster.gender.toLowerCase() === 'male' ? 'fa-mars' : monster.gender.toLowerCase() === 'female' ? 'fa-venus' : 'fa-genderless'}`}></i>
                          </div>
                          <div className="info-card-content">
                            <div className="info-label">Gender</div>
                            <div className="info-value">{monster.gender}</div>
                          </div>
                        </div>
                      )}
                      {Boolean(monster.pronouns) && (
                        <div className="info-card">
                          <div className="info-card-icon">
                            <i className="fas fa-user-tag"></i>
                          </div>
                          <div className="info-card-content">
                            <div className="info-label">Pronouns</div>
                            <div className="info-value">{monster.pronouns}</div>
                          </div>
                        </div>
                      )}
                      {Boolean(monster.age) && (
                        <div className="info-card">
                          <div className="info-card-icon">
                            <i className="fas fa-calendar-alt"></i>
                          </div>
                          <div className="info-card-content">
                            <div className="info-label">Age</div>
                            <div className="info-value">{monster.age}</div>
                          </div>
                        </div>
                      )}
                      {Boolean(monster.nature) && (
                        <div className="info-card nature-card">
                          <div className="info-card-icon">
                            <i className="fas fa-heart"></i>
                          </div>
                          <div className="info-card-content">
                            <div className="info-label">Nature</div>
                            <div className="info-value">{monster.nature}</div>
                          </div>
                        </div>
                      )}
                      {Boolean(monster.characteristic) && (
                        <div className="info-card">
                          <div className="info-card-icon">
                            <i className="fas fa-star"></i>
                          </div>
                          <div className="info-card-content">
                            <div className="info-label">Characteristic</div>
                            <div className="info-value">{monster.characteristic}</div>
                          </div>
                        </div>
                      )}
                      {Boolean(monster.ability) && (
                        <div className="info-card ability-card">
                          <div className="info-card-icon">
                            <i className="fas fa-bolt"></i>
                          </div>
                          <div className="info-card-content">
                            <div className="info-label">Ability</div>
                            <div className="info-value">{monster.ability}</div>
                          </div>
                        </div>
                      )}
                    </div>
                    {Boolean(monster.friendship) && (
                      <div className="friendship-panel">
                        <div className="friendship-header">
                          <div className="friendship-icon">
                            <i className="fas fa-handshake"></i>
                          </div>
                          <div className="friendship-title">Trainer Bond</div>
                        </div>
                        <div className="friendship-content">
                          <div className="friendship-meter">
                            <div className="friendship-bar">
                              <div 
                                className="friendship-fill" 
                                style={{ width: `${(monster.friendship / 255) * 100}%` }}
                              ></div>
                            </div>
                            <div className="friendship-value">{monster.friendship}/255</div>
                          </div>
                          <div className="friendship-message">{getFriendshipMessage(monster.friendship)}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Origin Information Panel */}
              {(monster.where_met || monster.date_met || monster.acquired || monster.ball) && (
                <div className="info-panel">
                  <div className="panel-header">
                    <h3 className="panel-title">
                      <i className="fas fa-map-marked-alt"></i>
                      Origin Story
                    </h3>
                  </div>
                  <div className="monster-panel-content">
                    <div className="origin-timeline">
                      {monster.where_met && (
                        <div className="origin-item">
                          <div className="origin-icon">
                            <i className="fas fa-map-marker-alt"></i>
                          </div>
                          <div className="origin-content">
                            <div className="origin-label">Where Met</div>
                            <div className="origin-value">{monster.where_met}</div>
                          </div>
                        </div>
                      )}
                      {monster.date_met && (
                        <div className="origin-item">
                          <div className="origin-icon">
                            <i className="fas fa-calendar"></i>
                          </div>
                          <div className="origin-content">
                            <div className="origin-label">Date Met</div>
                            <div className="origin-value">{monster.date_met}</div>
                          </div>
                        </div>
                      )}
                      {monster.acquired && (
                        <div className="origin-item">
                          <div className="origin-icon">
                            <i className="fas fa-handshake"></i>
                          </div>
                          <div className="origin-content">
                            <div className="origin-label">How Acquired</div>
                            <div className="origin-value">{monster.acquired}</div>
                          </div>
                        </div>
                      )}
                      {monster.ball && (
                        <div className="origin-item">
                          <div className="origin-icon">
                            <i className="fas fa-circle"></i>
                          </div>
                          <div className="origin-content">
                            <div className="origin-label">Poké Ball</div>
                            <div className="origin-value">{monster.ball}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Physical Characteristics Panel */}
              {(monster.height || monster.weight) && (
                <div className="info-panel">
                  <div className="panel-header">
                    <h3 className="panel-title">
                      <i className="fas fa-ruler-combined"></i>
                      Physical Characteristics
                    </h3>
                  </div>
                  <div className="monster-panel-content">
                    <div className="physical-stats">
                      {monster.height && (
                        <div className="physical-stat-card">
                          <div className="stat-icon height-icon">
                            <i className="fas fa-arrows-alt-v"></i>
                          </div>
                          <div className="stat-info">
                            <div className="stat-label">Height</div>
                            <div className="monster-stat-value">{monster.height}</div>
                          </div>
                        </div>
                      )}
                      {monster.weight && (
                        <div className="physical-stat-card">
                          <div className="stat-icon weight-icon">
                            <i className="fas fa-weight"></i>
                          </div>
                          <div className="stat-info">
                            <div className="stat-label">Weight</div>
                            <div className="monster-stat-value">{monster.weight}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Summary Panel */}
              {monster.tldr && (
                <div className="info-panel summary-panel">
                  <div className="panel-header">
                    <h3 className="panel-title">
                      <i className="fas fa-file-alt"></i>
                      Summary
                    </h3>
                  </div>
                  <div className="monster-panel-content">
                    <div className="summary-content">
                      <div className="summary-quote">
                        <i className="fas fa-quote-left quote-icon"></i>
                        <p>{monster.tldr}</p>
                        <i className="fas fa-quote-right quote-icon"></i>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Lore Panel */}
              {monster.lore && (
                <div className="info-panel lore-panel">
                  <div className="panel-header">
                    <h3 className="panel-title">
                      <i className="fas fa-scroll"></i>
                      Lore & Legends
                    </h3>
                  </div>
                  <div className="monster-panel-content">
                    <div className="lore-content">
                      <div className="lore-text">
                        {monster.lore}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Special Features Panel */}
              {Boolean(monster.shiny || monster.alpha || monster.shadow || monster.paradox || monster.pokerus) && (
                <div className="info-panel special-panel">
                  <div className="panel-header">
                    <h3 className="panel-title">
                      <i className="fas fa-magic"></i>
                      Special Features
                    </h3>
                  </div>
                  <div className="monster-panel-content">
                    <div className="special-features-grid">
                      {Boolean(monster.shiny) && (
                        <div className="special-feature-card shiny">
                          <div className="feature-icon">
                            <i className="fas fa-sparkles"></i>
                          </div>
                          <div className="feature-content">
                            <div className="feature-title">Shiny</div>
                            <div className="feature-description">This monster has rare coloration!</div>
                          </div>
                        </div>
                      )}
                      {Boolean(monster.alpha) && (
                        <div className="special-feature-card alpha">
                          <div className="feature-icon">
                            <i className="fas fa-crown"></i>
                          </div>
                          <div className="feature-content">
                            <div className="feature-title">Alpha</div>
                            <div className="feature-description">Larger and more powerful than normal</div>
                          </div>
                        </div>
                      )}
                      {Boolean(monster.shadow) && (
                        <div className="special-feature-card shadow">
                          <div className="feature-icon">
                            <i className="fas fa-ghost"></i>
                          </div>
                          <div className="feature-content">
                            <div className="feature-title">Shadow</div>
                            <div className="feature-description">Touched by dark energy</div>
                          </div>
                        </div>
                      )}
                      {Boolean(monster.paradox) && (
                        <div className="special-feature-card paradox">
                          <div className="feature-icon">
                            <i className="fas fa-infinity"></i>
                          </div>
                          <div className="feature-content">
                            <div className="feature-title">Paradox</div>
                            <div className="feature-description">From another time or dimension</div>
                          </div>
                        </div>
                      )}
                      {Boolean(monster.pokerus) && (
                        <div className="special-feature-card pokerus">
                          <div className="feature-icon">
                            <i className="fas fa-virus"></i>
                          </div>
                          <div className="feature-content">
                            <div className="feature-title">Pokérus</div>
                            <div className="feature-description">Beneficial virus enhancing growth</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}


            </div>
          )}

          {/* Stats Tab Content */}
          {activeTab === 'stats' && (
            <div className="monster-stats-tab">
              <div className="info-panel pokemon-stats-panel">
                <div className="panel-header">
                  <h3 className="panel-title">
                    <i className="fas fa-chart-bar"></i>
                    Base Stats
                  </h3>
                </div>
                <div className="monster-panel-content">
                  <div className="pokemon-stats-container">
                    {[
                      { 
                        name: 'HP', 
                        shortName: 'HP',
                        total: monster.hp_total || 0, 
                        iv: monster.hp_iv || 0, 
                        ev: monster.hp_ev || 0, 
                        color: '#FF5959',
                        maxStat: 714 // Blissey's max HP for scaling
                      },
                      { 
                        name: 'Attack', 
                        shortName: 'ATK',
                        total: monster.atk_total || 0, 
                        iv: monster.atk_iv || 0, 
                        ev: monster.atk_ev || 0, 
                        color: '#F5AC78',
                        maxStat: 526 // Mega Mewtwo X's max Attack for scaling
                      },
                      { 
                        name: 'Defense', 
                        shortName: 'DEF',
                        total: monster.def_total || 0, 
                        iv: monster.def_iv || 0, 
                        ev: monster.def_ev || 0, 
                        color: '#FAE078',
                        maxStat: 614 // Mega Steelix's max Defense for scaling
                      },
                      { 
                        name: 'Sp. Atk', 
                        shortName: 'SPA',
                        total: monster.spa_total || 0, 
                        iv: monster.spa_iv || 0, 
                        ev: monster.spa_ev || 0, 
                        color: '#9DB7F5',
                        maxStat: 526 // Mega Mewtwo Y's max Sp. Attack for scaling
                      },
                      { 
                        name: 'Sp. Def', 
                        shortName: 'SPD',
                        total: monster.spd_total || 0, 
                        iv: monster.spd_iv || 0, 
                        ev: monster.spd_ev || 0, 
                        color: '#A7DB8D',
                        maxStat: 614 // Lugia's max Sp. Defense for scaling
                      },
                      { 
                        name: 'Speed', 
                        shortName: 'SPE',
                        total: monster.spe_total || 0, 
                        iv: monster.spe_iv || 0, 
                        ev: monster.spe_ev || 0, 
                        color: '#FA92B2',
                        maxStat: 504 // Ninjask's max Speed for scaling
                      }
                    ].map((stat, index) => (
                      <div key={index} className="pokemon-stat-row">
                        <div className="stat-info-section">
                          <div className="stat-label-container">
                            <span className="stat-name-full">{stat.name}</span>
                            <span className="stat-name-short">{stat.shortName}</span>
                          </div>
                          <div className="monster-stat-value-display">
                            <span className="stat-total-value">{stat.total}</span>
                          </div>
                        </div>
                        
                        <div className="stat-bar-section">
                          <div className="main-stat-bar-container">
                            <div 
                              className="main-stat-bar"
                              style={{ 
                                width: `${Math.min((stat.total / stat.maxStat) * 100, 100)}%`,
                                backgroundColor: stat.color
                              }}
                            >
                              <div className="stat-bar-shine"></div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="iv-ev-indicators">
                          <div className="iv-indicator">
                            <div className="iv-label">IV</div>
                            <div className="iv-bar-mini">
                              <div 
                                className="iv-fill-mini"
                                style={{ 
                                  width: `${(stat.iv / 31) * 100}%`,
                                  backgroundColor: stat.color
                                }}
                              ></div>
                            </div>
                            <div className="iv-value">{stat.iv}</div>
                          </div>
                          
                          <div className="ev-indicator">
                            <div className="ev-label">EV</div>
                            <div className="ev-bar-mini">
                              <div 
                                className="ev-fill-mini"
                                style={{ 
                                  width: `${(stat.ev / 252) * 100}%`,
                                  backgroundColor: stat.color,
                                  opacity: 0.8
                                }}
                              ></div>
                            </div>
                            <div className="ev-value">{stat.ev}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Total Stats Summary */}
                  <div className="stats-summary">
                    <div className="summary-item">
                      <span className="summary-label">Total Base Stats</span>
                      <span className="summary-value">
                        {(monster.hp_total || 0) + (monster.atk_total || 0) + (monster.def_total || 0) + 
                         (monster.spa_total || 0) + (monster.spd_total || 0) + (monster.spe_total || 0)}
                      </span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Average IV</span>
                      <span className="summary-value">
                        {Math.round(((monster.hp_iv || 0) + (monster.atk_iv || 0) + (monster.def_iv || 0) + 
                                   (monster.spa_iv || 0) + (monster.spd_iv || 0) + (monster.spe_iv || 0)) / 6 * 10) / 10}
                      </span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Total EVs</span>
                      <span className="summary-value">
                        {(monster.hp_ev || 0) + (monster.atk_ev || 0) + (monster.def_ev || 0) + 
                         (monster.spa_ev || 0) + (monster.spd_ev || 0) + (monster.spe_ev || 0)}/510
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Moves Tab Content */}
          {activeTab === 'moves' && (
            <div className="monster-moves-tab">
              <div className="info-panel moves-panel">
                <div className="panel-header">
                  <h3 className="panel-title">
                    <i className="fas fa-fist-raised"></i>
                    Move Arsenal
                  </h3>
                </div>
                <div className="monster-panel-content">
                  {moves.length === 0 ? (
                    <div className="no-content-message">
                      <div className="no-content-icon">
                        <i className="fas fa-slash"></i>
                      </div>
                      <p>No moves have been recorded for this monster yet.</p>
                    </div>
                  ) : (
                    <div className="enhanced-moves-grid">
                      {moves.map((move, index) => (
                        <div className="enhanced-move-card" key={index}>
                          <div className="move-card-header">
                            <div className="move-title-section">
                              <h4 className="move-title">{move.move_name}</h4>
                              <span className={`move-type-badge type-${move.move_type?.toLowerCase() || 'normal'}`}>
                                {move.move_type}
                              </span>
                            </div>
                          </div>

                          <div className="move-stats-row">
                            <div className="move-stat-item">
                              <div className="move-stat-icon">
                                <i className="fas fa-battery-three-quarters"></i>
                              </div>
                              <div className="move-stat-content">
                                <span className="move-stat-label">PP</span>
                                <span className="move-monster-stat-value">{move.pp}</span>
                              </div>
                            </div>

                            {move.power !== null && (
                              <div className="move-stat-item">
                                <div className="move-stat-icon">
                                  <i className="fas fa-fist-raised"></i>
                                </div>
                                <div className="move-stat-content">
                                  <span className="move-stat-label">Power</span>
                                  <span className="move-monster-stat-value">{move.power}</span>
                                </div>
                              </div>
                            )}

                            {move.accuracy !== null && (
                              <div className="move-stat-item">
                                <div className="move-stat-icon">
                                  <i className="fas fa-crosshairs"></i>
                                </div>
                                <div className="move-stat-content">
                                  <span className="move-stat-label">Accuracy</span>
                                  <span className="move-monster-stat-value">{move.accuracy}</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {move.description && (
                            <div className="move-description-section">
                              <div className="description-icon">
                                <i className="fas fa-info-circle"></i>
                              </div>
                              <p className="move-description-text">{move.description}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Evolution Tab Content */}
          {activeTab === 'evolution' && (
            <div className="monster-evolution-tab">
              <div className="evolution-tab-header">
                <h2>Evolution Information</h2>
                {isOwner && (
                  <button
                    className={`evolution-edit-button ${showEvolutionEditor ? 'active' : ''}`}
                    onClick={() => setShowEvolutionEditor(!showEvolutionEditor)}
                    disabled={evolutionSaving}
                  >
                    <i className={`fas ${showEvolutionEditor ? 'fa-times' : 'fa-edit'}`}></i>
                    {showEvolutionEditor ? 'Cancel Edit' : 'Edit Evolution Information'}
                  </button>
                )}
              </div>

              {showEvolutionEditor && isOwner ? (
                <EvolutionEditor
                  monsterId={id}
                  evolutionData={evolutionChain}
                  onSave={handleSaveEvolution}
                  onCancel={() => setShowEvolutionEditor(false)}
                  isOwner={isOwner}
                />
              ) : (
                <EvolutionCards
                  evolutionData={evolutionChain}
                  currentMonsterId={parseInt(id)}
                />
              )}
            </div>
          )}

          {/* Biography Tab Content */}
          {activeTab === 'bio' && (
            <div className="monster-bio-tab">
                            {/* Personal Information Panel */}
              {(monster.likes || monster.dislikes) && (
                <div className="info-panel personal-panel">
                  <div className="panel-header">
                    <h3 className="panel-title">
                      <i className="fas fa-user-circle"></i>
                      Personal Preferences
                    </h3>
                  </div>
                  <div className="monster-panel-content">
                    <div className="preferences-grid">
                      {monster.likes && (
                        <div className="preference-card likes-card">
                          <div className="preference-icon">
                            <i className="fas fa-heart"></i>
                          </div>
                          <div className="preference-content">
                            <div className="preference-label">Likes</div>
                            <div className="preference-value">{monster.likes}</div>
                          </div>
                        </div>
                      )}
                      {monster.dislikes && (
                        <div className="preference-card dislikes-card">
                          <div className="preference-icon">
                            <i className="fas fa-heart-broken"></i>
                          </div>
                          <div className="preference-content">
                            <div className="preference-label">Dislikes</div>
                            <div className="preference-value">{monster.dislikes}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Fun Facts Panel */}
              {monster.fun_facts && (() => {
                try {
                  const funFacts = typeof monster.fun_facts === 'string'
                    ? JSON.parse(monster.fun_facts)
                    : monster.fun_facts;
                  return Array.isArray(funFacts) && funFacts.length > 0;
                } catch (e) {
                  return false;
                }
              })() && (
                <div className="info-panel fun-facts-panel">
                  <div className="panel-header">
                    <h3 className="panel-title">
                      <i className="fas fa-lightbulb"></i>
                      Fun Facts & Trivia
                    </h3>
                  </div>
                  <div className="monster-panel-content">
                    <div className="enhanced-fun-facts-container">
                      {(() => {
                        try {
                          const funFacts = typeof monster.fun_facts === 'string'
                            ? JSON.parse(monster.fun_facts)
                            : monster.fun_facts;

                          if (Array.isArray(funFacts) && funFacts.length > 0) {
                            return (
                              <div className="enhanced-fun-facts-grid">
                                {funFacts.map((fact, index) => (
                                  <div className="enhanced-fun-fact-card" key={fact.id || index}>
                                    <div className="fact-icon">
                                      <i className="fas fa-star"></i>
                                    </div>
                                    <div className="fact-content">
                                      {fact.title && (
                                        <div className="fact-title">{fact.title}</div>
                                      )}
                                      {fact.content && (
                                        <div className="fact-text">{fact.content}</div>
                                      )}
                                    </div>
                                    <div className="fact-number">#{index + 1}</div>
                                  </div>
                                ))}
                              </div>
                            );
                          }
                        } catch (e) {
                          console.error('Error parsing fun facts:', e);
                          return (
                            <div className="no-content-message">
                              <div className="no-content-icon">
                                <i className="fas fa-exclamation-triangle"></i>
                              </div>
                              <p>Error loading fun facts.</p>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* Relations Panel */}
              {monster.relations && (() => {
                try {
                  const relations = typeof monster.relations === 'string'
                    ? JSON.parse(monster.relations)
                    : monster.relations;
                  return Array.isArray(relations) && relations.length > 0;
                } catch (e) {
                  return false;
                }
              })() && (
                <div className="info-panel relations-panel">
                  <div className="panel-header">
                    <h3 className="panel-title">
                      <i className="fas fa-users"></i>
                      Relationships & Connections
                    </h3>
                  </div>
                  <div className="monster-panel-content">
                    <div className="enhanced-relations-container">
                    {(() => {
                      try {
                        const relations = typeof monster.relations === 'string'
                          ? JSON.parse(monster.relations)
                          : monster.relations;

                        if (Array.isArray(relations) && relations.length > 0) {
                          return (
                            <div className="enhanced-relations-grid">
                              {relations.map((relation, index) => {
                                const entityKey = `${relation.related_type}_${relation.related_id}`;
                                const entity = relationEntities[entityKey];
                                
                                return (
                                  <div className="enhanced-relation-card" key={relation.id || index}>
                                    <div className="relation-header-section">
                                      <div className="relation-icon">
                                        <i className={`fas ${relation.related_type === 'trainer' ? 'fa-user' : 'fa-paw'}`}></i>
                                      </div>
                                      <div className="relation-title-info">
                                        <h4 className="relation-title">{relation.name || 'Unknown Relation'}</h4>
                                        <span className="relation-type">{relation.related_type === 'trainer' ? 'Trainer' : 'Monster'}</span>
                                      </div>
                                    </div>
                                    
                                    {relation.related_id && relation.related_type && entity && (
                                      <div className="entity-link-section">
                                        <Link 
                                          to={`/${relation.related_type === 'monster' ? 'monsters' : 'trainers'}/${relation.related_id}`} 
                                          className="enhanced-entity-link"
                                        >
                                          <div className="entity-preview-card">
                                            <div className="entity-avatar">
                                              <i className={`fas ${relation.related_type === 'trainer' ? 'fa-user-circle' : 'fa-dragon'}`}></i>
                                            </div>
                                            <div className="entity-info">
                                              <div className="entity-name">{entity.name}</div>
                                              <div className="entity-type">{relation.related_type === 'trainer' ? 'View Trainer' : 'View Monster'}</div>
                                            </div>
                                            <div className="link-arrow">
                                              <i className="fas fa-arrow-right"></i>
                                            </div>
                                          </div>
                                        </Link>
                                      </div>
                                    )}
                                    
                                    {relation.elaboration && (
                                      <div className="relation-description">
                                        <div className="description-header">
                                          <i className="fas fa-quote-left"></i>
                                          <span>Story</span>
                                        </div>
                                        <p className="relation-text">{relation.elaboration}</p>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        }
                      } catch (e) {
                        console.error('Error parsing relations:', e);
                        return (
                          <div className="no-content-message">
                            <div className="no-content-icon">
                              <i className="fas fa-exclamation-triangle"></i>
                            </div>
                            <p>Error loading relations data.</p>
                          </div>
                        );
                      }
                    })()}
                    </div>
                  </div>
                </div>
              )}
              {/* Biography Summary Panel */}
              {monster.tldr && (
                <div className="info-panel bio-summary-panel">
                  <div className="panel-header">
                    <h3 className="panel-title">
                      <i className="fas fa-bookmark"></i>
                      Biography Summary
                    </h3>
                  </div>
                  <div className="monster-panel-content">
                    <div className="bio-summary-content">
                      <div className="summary-highlight">
                        <div className="highlight-icon">
                          <i className="fas fa-quote-left"></i>
                        </div>
                        <p className="summary-text">{monster.tldr}</p>
                        <div className="highlight-icon">
                          <i className="fas fa-quote-right"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Full Biography Panel */}
              {(monster.bio || monster.biography) && (
                <div className="info-panel full-bio-panel">
                  <div className="panel-header">
                    <h3 className="panel-title">
                      <i className="fas fa-book"></i>
                      Complete Biography
                    </h3>
                  </div>
                  <div className="monster-panel-content">
                    <div className="full-bio-content">
                      <div className="bio-text-container">
                        <div className="bio-decoration">
                          <i className="fas fa-feather-alt"></i>
                        </div>
                        <div className="bio-text">
                          {monster.bio || monster.biography}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* No Biography Message */}
              {!monster.tldr && !monster.bio && !monster.biography && !monster.lore && !monster.fun_facts && !monster.relations && (
                <div className="no-content-message">
                  <div className="no-content-icon">
                    <i className="fas fa-book-open"></i>
                  </div>
                  <p>No biography has been written for this monster yet.</p>
                  <div className="no-content-subtitle">Check back later for updates!</div>
                </div>
              )}
            </div>
          )}

          {/* Gallery Tab Content */}
          {activeTab === 'gallery' && (
            <div className="monster-gallery-tab">
              <h2>Image Gallery</h2>

              <div className="gallery-images">
                {/* Main Image */}
                {(monster.img_link || monster.main_image) && (
                  <div className="gallery-image-container">
                    <img
                      src={monster.img_link || monster.main_image || '/images/default_mon.png'}
                      alt={`${monster.name} - Main Image`}
                      className="gallery-image"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/images/default_mon.png';
                      }}
                    />
                    <div className="image-caption">Main Reference</div>
                  </div>
                )}

                {/* Additional Images from the API */}
                {galleryImages.length > 0 ? (
                  galleryImages.map((image, index) => (
                    <div className="gallery-image-container" key={index}>
                      <img
                        src={image.url || image.image_url || image.img_link || image || '/images/default_mon.png'}
                        alt={`${monster.name} - Image ${index + 1}`}
                        className="gallery-image"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/images/default_mon.png';
                        }}
                      />
                      <div className="image-caption">
                        {image.caption || image.description || `Image ${index + 1}`}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-additional-images">
                    <i className="fas fa-images"></i>
                    <p>No additional images available.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Lineage Tab Content */}
          {activeTab === 'lineage' && (
            <div className="monster-lineage-tab">
              <div className="lineage-header">
                <h2>Monster Lineage</h2>
                {isOwner && (
                  <button 
                    className={`lineage-edit-button ${showEditLineage ? 'active' : ''}`}
                    onClick={() => setShowEditLineage(!showEditLineage)}
                  >
                    <i className={`fas ${showEditLineage ? 'fa-times' : 'fa-edit'}`}></i>
                    {showEditLineage ? 'Done Editing' : 'Edit Lineage'}
                  </button>
                )}
              </div>

              {lineage ? (
                <div className="lineage-tree">
                  {/* Parents Section */}
                  {lineage.parents && lineage.parents.length > 0 && (
                    <div className="lineage-section">
                      <h3>
                        <i className="fas fa-chevron-up"></i>
                        Parents ({lineage.parents.length})
                      </h3>
                      <div className="lineage-monsters">
                        {lineage.parents.map((parent, index) => (
                          <div className="lineage-monster-card" key={index}>
                            <div className="monster-image-container">
                              <img
                                src={parent.img_link || '/images/default_mon.png'}
                                alt={parent.name}
                                className="monster-image"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = '/images/default_mon.png';
                                }}
                              />
                              <div className="monster-level-badge">Lv. {parent.level}</div>
                            </div>
                            <div className="monster-info">
                              <h4 className="monster-name">
                                <Link to={`/monsters/${parent.id}`}>
                                  {parent.name}
                                </Link>
                              </h4>
                              <div className="monster-species">
                                {[parent.species1, parent.species2, parent.species3]
                                  .filter(Boolean)
                                  .join(' / ')}
                              </div>
                              <div className="monster-types">
                                {parent.type1 && (
                                  <span className={`type-badge type-${parent.type1.toLowerCase()}`}>
                                    {parent.type1}
                                  </span>
                                )}
                                {parent.type2 && (
                                  <span className={`type-badge type-${parent.type2.toLowerCase()}`}>
                                    {parent.type2}
                                  </span>
                                )}
                              </div>
                              {parent.is_automatic && (
                                <div className="relationship-info">
                                  <i className="fas fa-dna"></i>
                                  <span>Breeding Parent</span>
                                </div>
                              )}
                              {showEditLineage && isOwner && (
                                <button 
                                  className="button button-icon button-danger"
                                  onClick={() => removeLineageRelationship(parent.id, 'parent')}
                                  title="Remove parent relationship"
                                >
                                  <i className="fas fa-times"></i>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Siblings Section */}
                  {lineage.siblings && lineage.siblings.length > 0 && (
                    <div className="lineage-section">
                      <h3>
                        <i className="fas fa-equals"></i>
                        Siblings ({lineage.siblings.length})
                      </h3>
                      <div className="lineage-monsters">
                        {lineage.siblings.map((sibling, index) => (
                          <div className="lineage-monster-card" key={index}>
                            <div className="monster-image-container">
                              <img
                                src={sibling.img_link || '/images/default_mon.png'}
                                alt={sibling.name}
                                className="monster-image"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = '/images/default_mon.png';
                                }}
                              />
                              <div className="monster-level-badge">Lv. {sibling.level}</div>
                            </div>
                            <div className="monster-info">
                              <h4 className="monster-name">
                                <Link to={`/monsters/${sibling.id}`}>
                                  {sibling.name}
                                </Link>
                              </h4>
                              <div className="monster-species">
                                {[sibling.species1, sibling.species2, sibling.species3]
                                  .filter(Boolean)
                                  .join(' / ')}
                              </div>
                              <div className="monster-types">
                                {sibling.type1 && (
                                  <span className={`type-badge type-${sibling.type1.toLowerCase()}`}>
                                    {sibling.type1}
                                  </span>
                                )}
                                {sibling.type2 && (
                                  <span className={`type-badge type-${sibling.type2.toLowerCase()}`}>
                                    {sibling.type2}
                                  </span>
                                )}
                              </div>
                              {sibling.is_automatic && (
                                <div className="relationship-info">
                                  <i className="fas fa-dna"></i>
                                  <span>Same Clutch</span>
                                </div>
                              )}
                              {showEditLineage && isOwner && (
                                <button 
                                  className="remove-relationship-button"
                                  onClick={() => removeLineageRelationship(sibling.id, 'sibling')}
                                  title="Remove sibling relationship"
                                >
                                  <i className="fas fa-times"></i>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Children Section */}
                  {lineage.children && lineage.children.length > 0 && (
                    <div className="lineage-section">
                      <h3>
                        <i className="fas fa-chevron-down"></i>
                        Children ({lineage.children.length})
                      </h3>
                      <div className="lineage-monsters">
                        {lineage.children.map((child, index) => (
                          <div className="lineage-monster-card" key={index}>
                            <div className="monster-image-container">
                              <img
                                src={child.img_link || '/images/default_mon.png'}
                                alt={child.name}
                                className="monster-image"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = '/images/default_mon.png';
                                }}
                              />
                              <div className="monster-level-badge">Lv. {child.level}</div>
                            </div>
                            <div className="monster-info">
                              <h4 className="monster-name">
                                <Link to={`/monsters/${child.id}`}>
                                  {child.name}
                                </Link>
                              </h4>
                              <div className="monster-species">
                                {[child.species1, child.species2, child.species3]
                                  .filter(Boolean)
                                  .join(' / ')}
                              </div>
                              <div className="monster-types">
                                {child.type1 && (
                                  <span className={`type-badge type-${child.type1.toLowerCase()}`}>
                                    {child.type1}
                                  </span>
                                )}
                                {child.type2 && (
                                  <span className={`type-badge type-${child.type2.toLowerCase()}`}>
                                    {child.type2}
                                  </span>
                                )}
                              </div>
                              {child.is_automatic && (
                                <div className="relationship-info">
                                  <i className="fas fa-dna"></i>
                                  <span>Bred Offspring</span>
                                </div>
                              )}
                              {showEditLineage && isOwner && (
                                <button 
                                  className="button button-icon button-danger"
                                  onClick={() => removeLineageRelationship(child.id, 'child')}
                                  title="Remove child relationship"
                                >
                                  <i className="fas fa-times"></i>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Grandchildren Section */}
                  {lineage.grandchildren && lineage.grandchildren.length > 0 && (
                    <div className="lineage-section">
                      <h3>
                        <i className="fas fa-angle-double-down"></i>
                        Grandchildren ({lineage.grandchildren.length})
                      </h3>
                      <div className="lineage-monsters">
                        {lineage.grandchildren.map((grandchild, index) => (
                          <div className="lineage-monster-card" key={index}>
                            <div className="monster-image-container">
                              <img
                                src={grandchild.img_link || '/images/default_mon.png'}
                                alt={grandchild.name}
                                className="monster-image"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = '/images/default_mon.png';
                                }}
                              />
                              <div className="monster-level-badge">Lv. {grandchild.level}</div>
                            </div>
                            <div className="monster-info">
                              <h4 className="monster-name">
                                <Link to={`/monsters/${grandchild.id}`}>
                                  {grandchild.name}
                                </Link>
                              </h4>
                              <div className="monster-species">
                                {[grandchild.species1, grandchild.species2, grandchild.species3]
                                  .filter(Boolean)
                                  .join(' / ')}
                              </div>
                              <div className="monster-types">
                                {grandchild.type1 && (
                                  <span className={`type-badge type-${grandchild.type1.toLowerCase()}`}>
                                    {grandchild.type1}
                                  </span>
                                )}
                                {grandchild.type2 && (
                                  <span className={`type-badge type-${grandchild.type2.toLowerCase()}`}>
                                    {grandchild.type2}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Lineage Message */}
                  {(!lineage.parents || lineage.parents.length === 0) &&
                   (!lineage.siblings || lineage.siblings.length === 0) &&
                   (!lineage.children || lineage.children.length === 0) &&
                   (!lineage.grandchildren || lineage.grandchildren.length === 0) && (
                    <div className="no-lineage-message">
                      <i className="fas fa-sitemap"></i>
                      <p>No lineage relationships have been recorded for this monster yet.</p>
                      {isOwner && (
                        <p>Use the "Edit Lineage" button to manually add relationships.</p>
                      )}
                    </div>
                  )}

                  {/* Edit Lineage Form */}
                  {showEditLineage && isOwner && (
                    <div className="edit-lineage-section">
                      <h3>Add New Relationship</h3>
                      <div className="add-relationship-form">
                        <div className="form-row">
                          <div className="form-group">
                            <label htmlFor="relationship-type">Relationship Type:</label>
                            <select 
                              id="relationship-type" 
                              className="form-control"
                              value={newRelationshipType}
                              onChange={(e) => setNewRelationshipType(e.target.value)}
                            >
                              <option value="parent">Parent</option>
                              <option value="sibling">Sibling</option>
                              <option value="child">Child</option>
                            </select>
                          </div>
                          <div className="form-group monster-search-group">
                            <label htmlFor="monster-search">Find Monster:</label>
                            <div className="search-input-container">
                              <input 
                                type="text" 
                                id="monster-search" 
                                className="form-control" 
                                placeholder="Search by trainer name, monster name, or species..."
                                value={monsterSearch}
                                onChange={handleSearchChange}
                              />
                              {searchResults.length > 0 && (
                                <div className="search-results">
                                  {searchResults.map((result) => (
                                    <div 
                                      key={result.id} 
                                      className="search-result-item"
                                      onClick={() => selectMonster(result)}
                                    >
                                      <img 
                                        src={result.img_link || '/images/default_mon.png'} 
                                        alt={result.name}
                                        className="result-image"
                                        onError={(e) => {
                                          e.target.onerror = null;
                                          e.target.src = '/images/default_mon.png';
                                        }}
                                      />
                                      <div className="result-info">
                                        <div className="result-name">{result.name}</div>
                                        <div className="result-trainer">Trainer: {result.trainer_name}</div>
                                        <div className="result-species">
                                          {[result.species1, result.species2, result.species3]
                                            .filter(Boolean)
                                            .join(' / ')}
                                        </div>
                                        <div className="result-level">Level {result.level}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            {selectedMonster && (
                              <div className="selected-monster">
                                <i className="fas fa-check-circle"></i>
                                Selected: {selectedMonster.name}
                              </div>
                            )}
                          </div>
                          <div className="form-group">
                            <label htmlFor="relationship-notes">Notes (optional):</label>
                            <input 
                              type="text" 
                              id="relationship-notes" 
                              className="form-control" 
                              placeholder="Additional notes about this relationship..."
                              value={relationshipNotes}
                              onChange={(e) => setRelationshipNotes(e.target.value)}
                            />
                          </div>
                        </div>
                        <button 
                          className="button button-primary"
                          onClick={addLineageRelationship}
                          disabled={!selectedMonster}
                        >
                          <i className="fas fa-plus"></i>
                          Add Relationship
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="no-lineage-message">
                  <i className="fas fa-sitemap"></i>
                  <p>No lineage data available for this monster.</p>
                  {isOwner && (
                    <p>Use the "Edit Lineage" button to manually add relationships.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Mega Evolution Tab Content */}
          {activeTab === 'mega' && monster.has_mega_stone && monster.level >= 100 && (
            <div className="monster-mega-tab">
              <h2>Mega Evolution</h2>

              <div className="mega-evolution-container">
                <div className="mega-stone-section">
                  <h3>Mega Stone</h3>
                  <div className="mega-stone-info">
                    <div className="mega-stone-image-container">
                      {(megaImages.mega_stone_image?.image_url || monster.mega_stone_img) ? (
                        <img
                          src={megaImages.mega_stone_image?.image_url || monster.mega_stone_img}
                          alt={`${monster.mega_stone_name || 'Mega Stone'}`}
                          className="mega-stone-image"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/images/default_item.png';
                          }}
                        />
                      ) : (
                        <div className="no-mega-stone-image">
                          <i className="fas fa-gem"></i>
                        </div>
                      )}
                    </div>
                    <div className="mega-stone-details">
                      <h4>{monster.mega_stone_name || 'Mega Stone'}</h4>
                      <p className="mega-stone-description">
                        A special stone that enables {monster.name} to Mega Evolve during battle.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mega-evolution-comparison">
                  <div className="mega-comparison-normal">
                    <h3>Normal Form</h3>
                    <div className="mega-comparison-image-container">
                      <img
                        src={monster.img_link || monster.main_image || '/images/default_mon.png'}
                        alt={monster.name}
                        className="mega-comparison-image"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/images/default_mon.png';
                        }}
                      />
                    </div>
                    <div className="mega-comparison-details">
                      <div className="mega-comparison-species">
                        {[monster.species1, monster.species2, monster.species3]
                          .filter(Boolean)
                          .join(' / ')}
                      </div>
                      <div className="mega-comparison-types">
                        {monster.type1 && (
                          <span className={`type-badge type-${monster.type1.toLowerCase()}`}>
                            {monster.type1}
                          </span>
                        )}
                        {monster.type2 && (
                          <span className={`type-badge type-${monster.type2.toLowerCase()}`}>
                            {monster.type2}
                          </span>
                        )}
                      </div>
                      <div className="mega-comparison-ability">
                        <span className="ability-label">Ability:</span>
                        <span className="ability-value">{monster.ability1}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mega-evolution-arrow">
                    <i className="fas fa-arrow-right"></i>
                  </div>

                  <div className="mega-comparison-mega">
                    <h3>Mega Form</h3>
                    <div className="mega-comparison-image-container">
                      {(megaImages.mega_image?.image_url || monster.mega_img_link) ? (
                        <img
                          src={megaImages.mega_image?.image_url || monster.mega_img_link || '/images/default_mon.png'}
                          alt={`Mega ${monster.name}`}
                          className="mega-comparison-image"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/images/default_mon.png';
                          }}
                        />
                      ) : (
                        <div className="no-mega-image">
                          <i className="fas fa-question"></i>
                        </div>
                      )}
                    </div>
                    <div className="mega-comparison-details">
                      <div className="mega-comparison-species">
                        {[monster.mega_species1, monster.mega_species2, monster.mega_species3]
                          .filter(Boolean)
                          .join(' / ') || `Mega ${monster.species1}`}
                      </div>
                      <div className="mega-comparison-types">
                        {monster.mega_type1 && (
                          <span className={`type-badge type-${monster.mega_type1.toLowerCase()}`}>
                            {monster.mega_type1}
                          </span>
                        )}
                        {monster.mega_type2 && (
                          <span className={`type-badge type-${monster.mega_type2.toLowerCase()}`}>
                            {monster.mega_type2}
                          </span>
                        )}
                      </div>
                      <div className="mega-comparison-ability">
                        <span className="ability-label">Ability:</span>
                        <span className="ability-value">{monster.mega_ability || 'Unknown'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {monster.mega_stat_bonus > 0 && (
                  <div className="mega-stat-bonus">
                    <h3>Mega Evolution Stat Bonus</h3>
                    <p>
                      When Mega Evolved, this monster gains a +{monster.mega_stat_bonus} boost to its total stats.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonsterDetailPage;
