import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import monsterService from '../../services/monsterService';
import trainerService from '../../services/trainerService';
import { useAuth } from '../../contexts/AuthContext';

import BackendFileUpload from '../../components/common/BackendFileUpload';

const EditMonsterPage = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [monster, setMonster] = useState(null);
  const [trainer, setTrainer] = useState(null);

  const [formData, setFormData] = useState({
    // Basic Information
    name: '',
    level: 1,

    // Personality
    nature: '',
    characteristic: '',
    gender: '',
    pronouns: '',

    // Physical Characteristics
    height: '',
    weight: '',

    // Origin Information
    where_met: '',
    date_met: '',

    // Special Features
    shiny: false,
    alpha: false,
    shadow: false,
    paradox: false,
    pokerus: false,

    // Held Items
    held_item: '',
    seal: '',
    mark: '',



    // Biography
    tldr: '',
    bio: '',

    // Images
    img_link: '',

    // Mega Evolution
    mega_species1: '',
    mega_species2: '',
    mega_species3: '',
    mega_type1: '',
    mega_type2: '',
    mega_type3: '',
    mega_type4: '',
    mega_type5: '',
    mega_ability: '',
    mega_stat_bonus: '',

    // Mega Images (from monster_images table)
    mega_stone_img: '',
    mega_image: '',

    // New fields
    likes: '',
    dislikes: '',
    lore: '',
    relations: '',
    fun_facts: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [funFacts, setFunFacts] = useState([]);
  const [relations, setRelations] = useState([]);
  const [allTrainers, setAllTrainers] = useState([]);
  const [trainerMonsters, setTrainerMonsters] = useState({});

  useEffect(() => {
    fetchMonsterData();
    fetchAllTrainers();
  }, [id]);

  const fetchAllTrainers = async () => {
    try {
      const response = await trainerService.getAllTrainers();
      if (response && response.trainers) {
        setAllTrainers(response.trainers);
      }
    } catch (err) {
      console.error('Error fetching trainers list:', err);
    }
  };

  const fetchTrainerMonsters = async (trainerId) => {
    try {
      const response = await trainerService.getTrainerMonsters(trainerId);
      if (response && response.monsters) {
        setTrainerMonsters(prev => ({
          ...prev,
          [trainerId]: response.monsters
        }));
      }
    } catch (err) {
      console.error(`Error fetching monsters for trainer ${trainerId}:`, err);
    }
  };

  const fetchMonsterData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate ID
      if (!id) {
        setError('Invalid monster ID');
        setLoading(false);
        return;
      }

      // Fetch monster details
      const monsterResponse = await monsterService.getMonsterById(id);

      if (!monsterResponse.success || !monsterResponse.data) {
        setError('Monster not found');
        setLoading(false);
        return;
      }

      const monsterData = monsterResponse.data;
      setMonster(monsterData);

      // Initialize form data with monster data
      const initialFormData = {};
      Object.keys(formData).forEach(key => {
        if (monsterData[key] !== undefined) {
          initialFormData[key] = monsterData[key];
        }
      });

      // Fetch mega images
      try {
        const megaImagesResponse = await monsterService.getMegaImages(id);
        if (megaImagesResponse.success && megaImagesResponse.data) {
          const { mega_stone_image, mega_image } = megaImagesResponse.data;
          initialFormData.mega_stone_img = mega_stone_image?.image_url || '';
          initialFormData.mega_image = mega_image?.image_url || '';
          initialFormData.has_mega_stone = !!mega_stone_image;
        }
      } catch (megaErr) {
        console.error('Error fetching mega images:', megaErr);
        // Don't fail the whole request if mega images fetch fails
      }

      setFormData(initialFormData);

      // Parse fun facts if they exist
      if (monsterData.fun_facts) {
        try {
          const funFactsData = typeof monsterData.fun_facts === 'string'
            ? JSON.parse(monsterData.fun_facts)
            : monsterData.fun_facts;
          if (Array.isArray(funFactsData)) {
            setFunFacts(funFactsData.map(fact => ({
              ...fact,
              id: fact.id || Date.now() + Math.floor(Math.random() * 1000)
            })));
          }
        } catch (parseErr) {
          console.error('Error parsing fun facts:', parseErr);
        }
      }

      // Parse relations if they exist
      if (monsterData.relations) {
        try {
          const relationsData = typeof monsterData.relations === 'string'
            ? JSON.parse(monsterData.relations)
            : monsterData.relations;
          if (Array.isArray(relationsData)) {
            setRelations(relationsData.map(relation => ({
              ...relation,
              id: relation.id || Date.now() + Math.floor(Math.random() * 1000)
            })));
          }
        } catch (parseErr) {
          console.error('Error parsing relations:', parseErr);
        }
      }

      // Fetch trainer details if we have a trainer ID
      if (monsterData.trainer_id) {
        try {
          const trainerResponse = await trainerService.getTrainerById(monsterData.trainer_id);
          if (trainerResponse && trainerResponse.trainer) {
            setTrainer(trainerResponse.trainer);


          }
        } catch (trainerErr) {
          console.error(`Error fetching trainer:`, trainerErr);
          // Don't fail the whole request if trainer fetch fails
        }
      }
    } catch (err) {
      console.error(`Error fetching monster ${id}:`, err);
      setError('Failed to load monster data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Fun Facts handlers
  const handleAddFunFact = () => {
    setFunFacts([
      ...funFacts,
      { id: Date.now(), title: '', content: '' }
    ]);
  };

  const handleRemoveFunFact = (id) => {
    setFunFacts(funFacts.filter(fact => fact.id !== id));
  };

  const handleFunFactChange = (id, field, value) => {
    setFunFacts(funFacts.map(fact =>
      fact.id === id ? { ...fact, [field]: value } : fact
    ));
  };

  // Relations handlers
  const handleAddRelation = () => {
    setRelations([
      ...relations,
      { id: Date.now(), related_type: 'trainer', related_id: '', name: '', elaboration: '' }
    ]);
  };

  const handleRemoveRelation = (id) => {
    setRelations(relations.filter(relation => relation.id !== id));
  };

  const handleRelationChange = (id, field, value) => {
    setRelations(relations.map(relation => {
      if (relation.id === id) {
        const updatedRelation = { ...relation, [field]: value };
        
        // If changing the related type or trainer, reset the related_id
        if (field === 'related_type') {
          updatedRelation.related_id = '';
        } else if (field === 'trainer_id') {
          updatedRelation.related_id = '';
          // Fetch monsters for this trainer if it's a monster relation
          if (updatedRelation.related_type === 'monster' && value) {
            fetchTrainerMonsters(value);
          }
        }
        
        return updatedRelation;
      }
      return relation;
    }));
  };





  const handleImageUpload = (response) => {
    if (response && response.secure_url) {
      setFormData(prevData => ({
        ...prevData,
        img_link: response.secure_url
      }));
    }
  };



  const handleMegaStoneUpload = async (response) => {
    if (response && response.secure_url) {
      try {
        // Add mega stone image to monster_images table
        await monsterService.addMegaStoneImage(id, { image_url: response.secure_url });

        setFormData(prevData => ({
          ...prevData,
          mega_stone_img: response.secure_url,
          has_mega_stone: true
        }));
      } catch (error) {
        console.error('Error adding mega stone image:', error);
      }
    } else {
      setFormData(prevData => ({
        ...prevData,
        mega_stone_img: null,
        has_mega_stone: false
      }));
    }
  };

  const handleMegaImageUpload = async (response) => {
    if (response && response.secure_url) {
      try {
        // Add mega image to monster_images table
        await monsterService.addMegaImage(id, { image_url: response.secure_url });

        setFormData(prevData => ({
          ...prevData,
          mega_image: response.secure_url
        }));
      } catch (error) {
        console.error('Error adding mega image:', error);
      }
    } else {
      setFormData(prevData => ({
        ...prevData,
        mega_image: null
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Prepare form data with structured fields
      const updatedFormData = {
        ...formData,
        fun_facts: JSON.stringify(funFacts),
        relations: JSON.stringify(relations)
      };

      // Update monster
      const response = await monsterService.updateMonster(id, updatedFormData);

      if (!response.success) {
        setError(response.message || 'Failed to update monster');
        return;
      }

      setSuccess('Monster updated successfully');

      // Update local monster data
      setMonster(response.data);

      // Redirect to monster detail page after a short delay
      setTimeout(() => {
        navigate(`/monsters/${id}`);
      }, 2000);
    } catch (err) {
      console.error(`Error updating monster ${id}:`, err);
      setError('Failed to update monster. Please try again later.');
    } finally {
      setSaving(false);
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

  if (error && !monster) {
    return (
      <div className="error-container">
        <i className="fas fa-exclamation-circle"></i>
        <p>{error}</p>
        <button onClick={fetchMonsterData} className="button primary">
          Try Again
        </button>
        <button onClick={() => navigate(-1)} className="button secondary">
          Go Back
        </button>
      </div>
    );
  }

  // Debug ownership check
  console.log('Edit Monster - Current User:', currentUser);
  console.log('Edit Monster - Monster:', monster);
  console.log('Edit Monster - Ownership check:', currentUser?.id, monster?.player_user_id);

  // Check if user is authorized to edit this monster
  const isAuthorized = currentUser && monster && (
    // Check if IDs match (converted to strings for comparison)
    String(currentUser.id) === String(monster.player_user_id) ||
    // Check if username matches
    currentUser.username === monster.player_user_id ||
    // Check if email matches
    (currentUser.email && currentUser.email === monster.player_user_id) ||
    // Check if discord_id matches
    (currentUser.discord_id && currentUser.discord_id === monster.player_user_id) ||
    // Check if the user is an admin
    currentUser.is_admin === 1 || currentUser.is_admin === true
  );

  console.log('Edit Monster - Is authorized result:', isAuthorized);

  if (!isAuthorized) {
    return (
      <div className="error-container">
        <i className="fas fa-lock"></i>
        <p>You are not authorized to edit this monster.</p>
        <button onClick={() => navigate(`/monsters/${id}`)} className="button secondary">
          View Monster
        </button>
      </div>
    );
  }

  return (
    <div className="edit-monster-container">
      <h1>Edit Monster: {monster.name}</h1>

      {error && (
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-circle"></i>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <i className="fas fa-check-circle"></i>
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="edit-monster-form">
        {/* Basic Information Section */}
        <div className="form-section">
          <h2>Basic Information</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="level">Level</label>
              <input
                type="number"
                id="level"
                name="level"
                min="1"
                max="100"
                value={formData.level}
                onChange={handleChange}
                required
                disabled
              />
              <small className="field-note">Level cannot be changed directly</small>
            </div>

          </div>
        </div>

        {/* Personality Section */}
        <div className="form-section">
          <h2>Personality</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="nature">Nature</label>
              <input
                type="text"
                id="nature"
                name="nature"
                value={formData.nature || ''}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="characteristic">Characteristic</label>
              <input
                type="text"
                id="characteristic"
                name="characteristic"
                value={formData.characteristic || ''}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="gender">Gender</label>
              <input
                type="text"
                id="gender"
                name="gender"
                value={formData.gender || ''}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="pronouns">Pronouns</label>
              <input
                type="text"
                id="pronouns"
                name="pronouns"
                value={formData.pronouns || ''}
                onChange={handleChange}
              />
            </div>


          </div>
        </div>

        {/* Physical Characteristics Section */}
        <div className="form-section">
          <h2>Physical Characteristics</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="height">Height</label>
              <input
                type="text"
                id="height"
                name="height"
                value={formData.height || ''}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="weight">Weight</label>
              <input
                type="text"
                id="weight"
                name="weight"
                value={formData.weight || ''}
                onChange={handleChange}
              />
            </div>

          </div>
        </div>

        {/* Origin Information Section */}
        <div className="form-section">
          <h2>Origin Information</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="where_met">Where Met</label>
              <input
                type="text"
                id="where_met"
                name="where_met"
                value={formData.where_met || ''}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="date_met">Date Met</label>
              <input
                type="date"
                id="date_met"
                name="date_met"
                value={formData.date_met || ''}
                onChange={handleChange}
              />
            </div>





          </div>
        </div>

        {/* Special Features Section */}
        <div className="form-section">
          <h2>Special Features</h2>
          <div className="form-grid">
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="shiny"
                  checked={formData.shiny}
                  onChange={handleChange}
                />
                Shiny
              </label>
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="alpha"
                  checked={formData.alpha}
                  onChange={handleChange}
                />
                Alpha
              </label>
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="shadow"
                  checked={formData.shadow}
                  onChange={handleChange}
                />
                Shadow
              </label>
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="paradox"
                  checked={formData.paradox}
                  onChange={handleChange}
                />
                Paradox
              </label>
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="pokerus"
                  checked={formData.pokerus}
                  onChange={handleChange}
                />
                Pokérus
              </label>
            </div>
          </div>
        </div>


        {/* Held Items Section */}
        <div className="form-section">
          <h2>Held Items</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="held_item">Held Item</label>
              <input
                type="text"
                id="held_item"
                name="held_item"
                value={formData.held_item || ''}
                onChange={handleChange}
                placeholder="Enter held item name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="seal">Seal</label>
              <input
                type="text"
                id="seal"
                name="seal"
                value={formData.seal || ''}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="mark">Mark</label>
              <input
                type="text"
                id="mark"
                name="mark"
                value={formData.mark || ''}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>



        {/* Biography Section */}
        <div className="form-section">
          <h2>Biography</h2>
          <div className="form-grid">


            <div className="form-group full-width">
              <label htmlFor="tldr">Summary (TLDR)</label>
              <textarea
                id="tldr"
                name="tldr"
                value={formData.tldr || ''}
                onChange={handleChange}
                rows="3"
              ></textarea>
            </div>

            <div className="form-group full-width">
              <label htmlFor="bio">Full Biography</label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio || ''}
                onChange={handleChange}
                rows="6"
              ></textarea>
            </div>
          </div>
        </div>

        {/* Images Section */}
        <div className="form-section">
          <h2>Images</h2>
          <div className="form-grid">
            <div className="form-group full-width">
              <label htmlFor="img_link">Main Image</label>
              <BackendFileUpload
                onUploadSuccess={handleImageUpload}
                onUploadError={(error) => console.error('Upload error:', error)}
                uploadEndpoint="/monsters/upload-image"
                acceptedFileTypes="image/*"
                buttonText="Upload Monster Image"
                initialImageUrl={formData.img_link}
              />
              <small className="field-note">Upload a clear image of your monster. Recommended size: 800x800 pixels.</small>
            </div>
          </div>
        </div>

        {/* Mega Evolution Section */}
        <div className="form-section">
          <h2>Mega Evolution</h2>

          {parseInt(formData.level) < 100 ? (
            <div className="mega-evolution-locked">
              <i className="fas fa-lock"></i>
              <p>Mega Evolution is only available for level 100 monsters.</p>
            </div>
          ) : (
            <>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="has_mega_stone">Has Mega Stone</label>
                  <div className="checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        id="has_mega_stone"
                        name="has_mega_stone"
                        checked={formData.has_mega_stone || false}
                        onChange={handleChange}
                      />
                      Yes
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="mega_stone_name">Mega Stone Name</label>
                  <input
                    type="text"
                    id="mega_stone_name"
                    name="mega_stone_name"
                    value={formData.mega_stone_name || ''}
                    onChange={handleChange}
                    disabled={!formData.has_mega_stone}
                  />
                </div>
              </div>

              {formData.has_mega_stone && (
                <>
                  <div className="mega-stone-section">
                    <h3>Mega Stone Artwork</h3>
                    <div className="form-grid">
                      <div className="form-group full-width">
                        <BackendFileUpload
                          onUploadSuccess={handleMegaStoneUpload}
                          onUploadError={(error) => console.error('Upload error:', error)}
                          uploadEndpoint="/monsters/upload-image"
                          acceptedFileTypes="image/*"
                          buttonText="Upload Mega Stone Image"
                          initialImageUrl={formData.mega_stone_img}
                        />
                        <small className="field-note">Upload an image of your monster's mega stone. Recommended size: 400x400 pixels.</small>
                      </div>
                    </div>
                  </div>

                  <div className="mega-evolution-section">
                    <h3>Mega Evolution Form</h3>
                    <div className="form-grid">


                      <div className="form-group">
                        <label htmlFor="mega_species1">Mega Primary Species</label>
                        <input
                          type="text"
                          id="mega_species1"
                          name="mega_species1"
                          value={formData.mega_species1 || ''}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="mega_species2">Mega Secondary Species</label>
                        <input
                          type="text"
                          id="mega_species2"
                          name="mega_species2"
                          value={formData.mega_species2 || ''}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="mega_species3">Mega Tertiary Species</label>
                        <input
                          type="text"
                          id="mega_species3"
                          name="mega_species3"
                          value={formData.mega_species3 || ''}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="mega_type1">Mega Primary Type</label>
                        <input
                          type="text"
                          id="mega_type1"
                          name="mega_type1"
                          value={formData.mega_type1 || ''}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="mega_type2">Mega Secondary Type</label>
                        <input
                          type="text"
                          id="mega_type2"
                          name="mega_type2"
                          value={formData.mega_type2 || ''}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="mega_ability">Mega Ability</label>
                        <input
                          type="text"
                          id="mega_ability"
                          name="mega_ability"
                          value={formData.mega_ability || ''}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="mega_stat_bonus">Mega Stat Bonus</label>
                        <input
                          type="number"
                          id="mega_stat_bonus"
                          name="mega_stat_bonus"
                          value={formData.mega_stat_bonus || 0}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mega-image-section">
                    <h3>Mega Evolution Image</h3>
                    <div className="form-grid">
                      <div className="form-group full-width">
                        <BackendFileUpload
                          onUploadSuccess={handleMegaImageUpload}
                          onUploadError={(error) => console.error('Upload error:', error)}
                          uploadEndpoint="/monsters/upload-image"
                          acceptedFileTypes="image/*"
                          buttonText="Upload Mega Evolution Image"
                          initialImageUrl={formData.mega_image}
                        />
                        <small className="field-note">Upload an image of your monster's mega evolution form. Recommended size: 800x800 pixels.</small>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Personal Information Section */}
        <div className="form-section">
          <h2>Personal Information</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="likes">Likes</label>
              <textarea
                id="likes"
                name="likes"
                value={formData.likes || ''}
                onChange={handleChange}
                rows="3"
                placeholder="What does this monster enjoy and love?"
              ></textarea>
            </div>

            <div className="form-group">
              <label htmlFor="dislikes">Dislikes</label>
              <textarea
                id="dislikes"
                name="dislikes"
                value={formData.dislikes || ''}
                onChange={handleChange}
                rows="3"
                placeholder="What does this monster dislike or hate?"
              ></textarea>
            </div>

            <div className="form-group full-width">
              <label htmlFor="lore">Lore</label>
              <textarea
                id="lore"
                name="lore"
                value={formData.lore || ''}
                onChange={handleChange}
                rows="4"
                placeholder="Background stories, legends, or interesting lore about this monster"
              ></textarea>
            </div>
          </div>
        </div>

        {/* Fun Facts Section */}
        <div className="form-section">
          <h2>Fun Facts</h2>
          <p className="section-description">Add interesting fun facts about this monster with titles and content.</p>

          {funFacts.length > 0 ? (
            <div className="fun-facts-list">
              {funFacts.map((fact, index) => (
                <div key={fact.id} className="fun-fact-item">
                  <div className="fun-fact-header">
                    <h3>Fun Fact #{index + 1}</h3>
                    <button
                      type="button"
                      className="button icon danger"
                      onClick={() => handleRemoveFunFact(fact.id)}
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>Title</label>
                      <input
                        type="text"
                        value={fact.title || ''}
                        onChange={(e) => handleFunFactChange(fact.id, 'title', e.target.value)}
                        placeholder="Fun Fact Title"
                      />
                    </div>

                    <div className="form-group full-width">
                      <label>Content</label>
                      <textarea
                        value={fact.content || ''}
                        onChange={(e) => handleFunFactChange(fact.id, 'content', e.target.value)}
                        placeholder="Describe the fun fact"
                        rows="3"
                      ></textarea>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-fun-facts">
              <i className="fas fa-lightbulb"></i>
              <p>No fun facts added yet.</p>
            </div>
          )}

          <div className="add-fun-fact-button-container">
            <button
              type="button"
              className="button primary"
              onClick={handleAddFunFact}
            >
              <i className="fas fa-plus"></i> Add Fun Fact
            </button>
          </div>
        </div>

        {/* Relations Section */}
        <div className="form-section">
          <h2>Relations</h2>
          <p className="section-description">Add relationships with other monsters or trainers.</p>

          {relations.length > 0 ? (
            <div className="relations-list">
              {relations.map((relation, index) => (
                <div key={relation.id} className="relation-item">
                  <div className="relation-header">
                    <h3>Relation #{index + 1}</h3>
                    <button
                      type="button"
                      className="button icon danger"
                      onClick={() => handleRemoveRelation(relation.id)}
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>Type</label>
                      <select
                        value={relation.related_type || 'trainer'}
                        onChange={(e) => handleRelationChange(relation.id, 'related_type', e.target.value)}
                      >
                        <option value="trainer">Trainer</option>
                        <option value="monster">Monster</option>
                      </select>
                    </div>

                    {relation.related_type === 'monster' && (
                      <div className="form-group">
                        <label>Trainer</label>
                        <select
                          value={relation.trainer_id || ''}
                          onChange={(e) => handleRelationChange(relation.id, 'trainer_id', e.target.value)}
                        >
                          <option value="">Select Trainer</option>
                          {allTrainers.map(trainer => (
                            <option key={trainer.id} value={trainer.id}>
                              {trainer.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="form-group">
                      <label>{relation.related_type === 'monster' ? 'Monster' : 'Trainer'}</label>
                      <select
                        value={relation.related_id || ''}
                        onChange={(e) => handleRelationChange(relation.id, 'related_id', e.target.value)}
                        disabled={relation.related_type === 'monster' && !relation.trainer_id}
                      >
                        <option value="">Select {relation.related_type === 'monster' ? 'Monster' : 'Trainer'}</option>
                        {relation.related_type === 'monster' ? (
                          relation.trainer_id && trainerMonsters[relation.trainer_id] ? 
                            trainerMonsters[relation.trainer_id].filter(monster => monster.id !== parseInt(id)).map(monster => (
                              <option key={monster.id} value={monster.id}>
                                {monster.name}
                              </option>
                            )) : []
                        ) : (
                          allTrainers.map(trainer => (
                            <option key={trainer.id} value={trainer.id}>
                              {trainer.name}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Relationship Name</label>
                      <input
                        type="text"
                        value={relation.name || ''}
                        onChange={(e) => handleRelationChange(relation.id, 'name', e.target.value)}
                        placeholder="e.g., Friend, Rival, Partner"
                      />
                    </div>

                    <div className="form-group full-width">
                      <label>Elaboration</label>
                      <textarea
                        value={relation.elaboration || ''}
                        onChange={(e) => handleRelationChange(relation.id, 'elaboration', e.target.value)}
                        placeholder="Describe how they interact"
                        rows="3"
                      ></textarea>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-relations">
              <i className="fas fa-users"></i>
              <p>No relations added yet.</p>
            </div>
          )}

          <div className="add-relation-button-container">
            <button
              type="button"
              className="button primary"
              onClick={handleAddRelation}
            >
              <i className="fas fa-plus"></i> Add Relation
            </button>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="button secondary" onClick={() => navigate(`/monsters/${id}`)}>
            Cancel
          </button>
          <button type="submit" className="button primary" disabled={saving}>
            {saving ? <i className="fas fa-spinner fa-spin"></i> : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditMonsterPage;
