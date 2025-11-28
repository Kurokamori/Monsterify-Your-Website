import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useModalManager } from '../../hooks/useModalManager';
import api from '../../services/api';
import speciesService from '../../services/speciesService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import useDocumentTitle from '../../hooks/useDocumentTitle';

const ReferenceHelperPage = () => {
  useDocumentTitle('Reference Helper');
  
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allTrainers, setAllTrainers] = useState([]);
  const [selectedTrainerId, setSelectedTrainerId] = useState('');
  const [selectedTrainerData, setSelectedTrainerData] = useState(null);
  const [expandedMonsters, setExpandedMonsters] = useState({});
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [speciesImages, setSpeciesImages] = useState({});
  const [imageSize, setImageSize] = useState('medium');

  // Use modal manager for proper z-index stacking
  const { modalId, zIndex } = useModalManager(imageModalOpen, 'image-modal-reference-helper');

  // Fetch all trainers who have monsters without images
  useEffect(() => {
    const fetchAllTrainers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get all trainers (no pagination)
        const response = await api.get('/trainers/all');
        const allTrainersData = response.data.data || [];
        
        // Filter trainers who have monsters without images
        const trainersWithUnrefMonsters = [];
        
        for (const trainer of allTrainersData) {
          // Skip current user's trainers since they can use the regular Reference To-Do page
          if (trainer.player_user_id === currentUser?.discord_id) {
            continue;
          }
          
          // Get ALL monsters for this trainer (not just first page)
          const monstersResponse = await api.get(`/trainers/${trainer.id}/monsters`, { 
            params: { limit: 1000 } 
          });
          let monsters = [];
          
          // Handle different response formats
          if (monstersResponse.data && monstersResponse.data.monsters) {
            monsters = monstersResponse.data.monsters;
          } else if (monstersResponse.data && monstersResponse.data.data) {
            monsters = monstersResponse.data.data;
          } else if (Array.isArray(monstersResponse.data)) {
            monsters = monstersResponse.data;
          }
          
          // Filter monsters without images (show if img_link is missing/empty)
          const monstersWithoutImages = monsters.filter(monster => {
            // More robust check for empty/null img_link values
            const imgLink = monster.img_link;
            
            // Check if img_link is truly empty/null/undefined
            const hasImgLink = imgLink && 
                              imgLink !== '' && 
                              imgLink !== 'null' && 
                              imgLink !== 'NULL' && 
                              imgLink !== 'undefined' && 
                              imgLink.toString().trim() !== '';
            
            // Show monsters that don't have img_link populated
            return !hasImgLink;
          });
          
          if (monstersWithoutImages.length > 0) {
            trainersWithUnrefMonsters.push({
              ...trainer,
              unreferencedCount: monstersWithoutImages.length
            });
          }
        }
        
        // Sort trainers by number of unreferenced monsters (descending)
        trainersWithUnrefMonsters.sort((a, b) => b.unreferencedCount - a.unreferencedCount);
        
        setAllTrainers(trainersWithUnrefMonsters);
      } catch (err) {
        console.error('Error fetching trainers:', err);
        setError('Failed to load trainers. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    if (currentUser?.discord_id) {
      fetchAllTrainers();
    }
  }, [currentUser]);

  // Fetch selected trainer's monsters without images
  const fetchTrainerMonsters = async (trainerId) => {
    try {
      setLoading(true);
      setError(null);
      
      // Find trainer info
      const trainer = allTrainers.find(t => t.id === parseInt(trainerId));
      if (!trainer) return;
      
      // Get monsters for this trainer
      const monstersResponse = await api.get(`/trainers/${trainerId}/monsters`, { 
        params: { limit: 1000 } 
      });
      let monsters = [];
      
      // Handle different response formats
      if (monstersResponse.data && monstersResponse.data.monsters) {
        monsters = monstersResponse.data.monsters;
      } else if (monstersResponse.data && monstersResponse.data.data) {
        monsters = monstersResponse.data.data;
      } else if (Array.isArray(monstersResponse.data)) {
        monsters = monstersResponse.data;
      }
      
      // Filter monsters without images
      const monstersWithoutImages = monsters.filter(monster => {
        const imgLink = monster.img_link;
        const hasImgLink = imgLink && 
                          imgLink !== '' && 
                          imgLink !== 'null' && 
                          imgLink !== 'NULL' && 
                          imgLink !== 'undefined' && 
                          imgLink.toString().trim() !== '';
        return !hasImgLink;
      });
      
      const trainerWithMonsters = {
        ...trainer,
        monsters: monstersWithoutImages
      };
      
      setSelectedTrainerData(trainerWithMonsters);
      
      // Fetch species images for monsters
      await fetchSpeciesImages([trainerWithMonsters]);
    } catch (err) {
      console.error('Error fetching trainer monsters:', err);
      setError('Failed to load trainer monsters. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle trainer selection
  const handleTrainerSelection = (e) => {
    const trainerId = e.target.value;
    setSelectedTrainerId(trainerId);
    setSelectedTrainerData(null);
    setExpandedMonsters({});
    
    if (trainerId) {
      fetchTrainerMonsters(trainerId);
    }
  };

  // Fetch species images for all monsters
  const fetchSpeciesImages = async (trainersWithMonsters) => {
    try {
      // Collect all unique species from all monsters
      const allSpecies = new Set();
      
      trainersWithMonsters.forEach(trainer => {
        trainer.monsters.forEach(monster => {
          if (monster.species1) allSpecies.add(monster.species1);
          if (monster.species2) allSpecies.add(monster.species2);
          if (monster.species3) allSpecies.add(monster.species3);
        });
      });
      
      if (allSpecies.size > 0) {
        const speciesList = Array.from(allSpecies);
        const response = await speciesService.getSpeciesImages(speciesList);
        
        if (response.success) {
          setSpeciesImages(response.speciesImages);
        }
      }
    } catch (err) {
      console.error('Error fetching species images:', err);
    }
  };
  
  // Toggle expanded state for a monster
  const toggleMonsterExpanded = (monsterId) => {
    setExpandedMonsters(prev => ({
      ...prev,
      [monsterId]: !prev[monsterId]
    }));
  };
  
  // Open image modal
  const openImageModal = (imageUrl) => {
    setSelectedImage(imageUrl);
    setImageModalOpen(true);
  };
  
  // Close image modal
  const closeImageModal = () => {
    setImageModalOpen(false);
    setSelectedImage('');
  };
  
  // Cycle through image sizes
  const cycleImageSize = () => {
    const sizes = ['small', 'medium', 'large', 'max-width'];
    const currentIndex = sizes.indexOf(imageSize);
    const nextIndex = (currentIndex + 1) % sizes.length;
    setImageSize(sizes[nextIndex]);
  };
  
  // Get display name for image size
  const getImageSizeDisplayName = (size) => {
    switch (size) {
      case 'small': return 'Small Images';
      case 'medium': return 'Medium Images';
      case 'large': return 'Large Images';
      case 'max-width': return 'Max Width';
      default: return 'Medium Images';
    }
  };
  
  // Render species information
  const renderSpeciesInfo = (monster) => {
    const speciesInfo = [];
    
    // Add species1 if it exists
    if (monster.species1) {
      speciesInfo.push({
        name: monster.species1,
        image: speciesImages[monster.species1]?.image_url || monster.species1_image
      });
    }
    
    // Add species2 if it exists
    if (monster.species2) {
      speciesInfo.push({
        name: monster.species2,
        image: speciesImages[monster.species2]?.image_url || monster.species2_image
      });
    }
    
    // Add species3 if it exists
    if (monster.species3) {
      speciesInfo.push({
        name: monster.species3,
        image: speciesImages[monster.species3]?.image_url || monster.species3_image
      });
    }
    
    return (
      <div className="species-info">
        <h4>Species References</h4>
        <div className={`species-references species-references--${imageSize}`}>
          {speciesInfo.map((species, index) => (
            <div key={index} className={`species-reference-item species-reference-item--${imageSize}`}>
              <div className="species-name">{species.name}</div>
              <div className="species-image-container">
                {species.image ? (
                  <img 
                    src={species.image} 
                    alt={species.name} 
                    className={`reference-species-image reference-species-image--${imageSize}`}
                    onClick={() => openImageModal(species.image)}
                  />
                ) : (
                  <span className="no-image">No image available</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // Render types
  const renderTypes = (monster) => {
    const types = [];
    
    // Add all types that exist
    if (monster.type1) types.push(monster.type1);
    if (monster.type2) types.push(monster.type2);
    if (monster.type3) types.push(monster.type3);
    if (monster.type4) types.push(monster.type4);
    if (monster.type5) types.push(monster.type5);
    
    return types.join(', ');
  };

  if (loading && !selectedTrainerData) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="reference-todo-container">
      <div className="reference-todo-header">
        <h1>Reference Helper</h1>
        {selectedTrainerData && (
          <button 
            className="image-size-toggle"
            onClick={cycleImageSize}
            title={`Current: ${getImageSizeDisplayName(imageSize)}. Click to cycle.`}
          >
            {getImageSizeDisplayName(imageSize)}
          </button>
        )}
      </div>
      
      <p className="reference-todo-description">
        This page shows other trainers' monsters that need to be referenced (don't have images yet).
        Select a trainer from the dropdown to see their monsters that need references and help them out!
      </p>

      <div className="trainer-selector-container">
        <label htmlFor="trainer-select">Select a Trainer:</label>
        <select
          id="trainer-select"
          value={selectedTrainerId}
          onChange={handleTrainerSelection}
          className="trainer-select"
        >
          <option value="">Select a trainer...</option>
          {allTrainers.map(trainer => (
            <option key={trainer.id} value={trainer.id}>
              {trainer.name} ({trainer.unreferencedCount} monsters need references)
            </option>
          ))}
        </select>
      </div>

      {selectedTrainerData && (
        <>
          <div className="total-needed-container">
            <h3>
              {selectedTrainerData.name}'s References Needed: {selectedTrainerData.monsters.length}
            </h3>
          </div>
          
          <div className="trainer-section">
            <table className="monster-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Species</th>
                  <th>Types</th>
                  <th>Attribute</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {selectedTrainerData.monsters.map(monster => (
                  <React.Fragment key={monster.id}>
                    <tr>
                      <td>{monster.name}</td>
                      <td>
                        {monster.species1}
                        {monster.species2 && `, ${monster.species2}`}
                        {monster.species3 && `, ${monster.species3}`}
                      </td>
                      <td>{renderTypes(monster)}</td>
                      <td>{monster.attribute}</td>
                      <td>
                        <button 
                          className="show-references-button"
                          onClick={() => toggleMonsterExpanded(monster.id)}
                        >
                          {expandedMonsters[monster.id] ? 'Hide References' : 'Show References'}
                        </button>
                      </td>
                    </tr>
                    {expandedMonsters[monster.id] && (
                      <tr className="expanded-row">
                        <td colSpan="5">
                          {renderSpeciesInfo(monster)}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!selectedTrainerId && allTrainers.length === 0 && (
        <div className="no-references-needed">
          <p>Great! All trainers have images for their monsters.</p>
        </div>
      )}
      
      {/* Image Modal */}
      {imageModalOpen && (
        <div className="image-modal" style={{ zIndex }} onClick={closeImageModal}>
          <div className="image-modal-content" onClick={e => e.stopPropagation()}>
            <span className="close-modal" onClick={closeImageModal}>&times;</span>
            <img src={selectedImage} alt="Reference" className="modal-image" />
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferenceHelperPage;