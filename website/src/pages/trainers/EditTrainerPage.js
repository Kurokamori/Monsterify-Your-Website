import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import trainerService from '../../services/trainerService';
import abilityService from '../../services/abilityService';
import { useAuth } from '../../contexts/AuthContext';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { calculateZodiac, calculateChineseZodiac } from '../../utils/zodiacUtils';
import AutocompleteInput from '../../components/common/AutocompleteInput';
import { TYPES, FACTIONS, NATURES, CHARACTERISTICS, BERRIES } from '../../data/trainerFormOptions';


const EditTrainerPage = () => {
  const { id } = useParams();
  useDocumentTitle('Edit Trainer');

  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [trainer, setTrainer] = useState(null);
  const [additionalRefs, setAdditionalRefs] = useState([]);
  const [abilities, setAbilities] = useState([]);

  // Load abilities from backend
  useEffect(() => {
    const loadAbilities = async () => {
      const abilityData = await abilityService.getAbilityNames();
      setAbilities(abilityData);
    };
    loadAbilities();
  }, []);
  const [formData, setFormData] = useState({
    // Basic Information
    name: '',
    nickname: '',
    full_name: '',
    faction: '',
    level: 1,
    currency_amount: 0,
    total_earned_currency: 0,

    // Species and Types
    species1: '',
    species2: '',
    species3: '',
    type1: '',
    type2: '',
    type3: '',
    type4: '',
    type5: '',
    type6: '',

    // Abilities and Characteristics
    ability: '',
    nature: '',
    characteristic: '',

    // Favorite Types
    fav_type1: '',
    fav_type2: '',
    fav_type3: '',
    fav_type4: '',
    fav_type5: '',
    fav_type6: '',

    // Personal Information
    gender: '',
    pronouns: '',
    sexuality: '',
    age: '',
    height: '',
    weight: '',
    theme: '',
    occupation: '',
    birthday: '',
    zodiac: '',
    chinese_zodiac: '',

    // Location Information
    birthplace: '',
    residence: '',

    // Other Information
    fav_berry: '',

    // Biography
    quote: '',
    tldr: '',
    biography: '',

    // Images
    main_ref: '',

    // Mega Evolution
    mega_ref: '',
    mega_artist: '',
    mega_species1: '',
    mega_species2: '',
    mega_species3: '',
    mega_type1: '',
    mega_type2: '',
    mega_type3: '',
    mega_type4: '',
    mega_type5: '',
    mega_type6: '',
    mega_ability: '',

    // Other
    race: 'Human',

    // New character fields
    strengths: '',
    weaknesses: '',
    likes: '',
    dislikes: '',
    flaws: '',
    values: '',
    quirks: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [themeDisplay, setThemeDisplay] = useState('');
  const [themeLink, setThemeLink] = useState('');
  const [voiceClaimDisplay, setVoiceClaimDisplay] = useState('');
  const [voiceClaimLink, setVoiceClaimLink] = useState('');
  const [secrets, setSecrets] = useState([]);
  const [relations, setRelations] = useState([]);
  const [allTrainers, setAllTrainers] = useState([]);
  const [trainerMonsters, setTrainerMonsters] = useState({});

  useEffect(() => {
    fetchTrainerData();
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
      console.error('Error fetching trainer monsters:', err);
    }
  };

  const fetchTrainerData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate ID
      if (!id) {
        setError('Invalid trainer ID');
        setLoading(false);
        return;
      }

      // Fetch trainer details
      const response = await trainerService.getTrainerById(id);

      if (!response || !response.trainer) {
        setError('Trainer not found');
        setLoading(false);
        return;
      }

      const trainerData = response.trainer;
      setTrainer(trainerData);

      // Initialize form data with trainer data
      const initialFormData = {};
      Object.keys(formData).forEach(key => {
        if (trainerData[key] !== undefined) {
          initialFormData[key] = trainerData[key];
        }
      });

      // Handle mega info if it's stored as JSON
      if (trainerData.mega_info) {
        try {
          const megaInfo = typeof trainerData.mega_info === 'string'
            ? JSON.parse(trainerData.mega_info)
            : trainerData.mega_info;

          Object.keys(megaInfo).forEach(key => {
            initialFormData[key] = megaInfo[key];
          });
        } catch (parseErr) {
          console.error('Error parsing mega info:', parseErr);
        }
      }

      // Handle additional references if they're stored as JSON
      if (trainerData.additional_refs) {
        try {
          const refs = typeof trainerData.additional_refs === 'string'
            ? JSON.parse(trainerData.additional_refs)
            : trainerData.additional_refs;

          if (Array.isArray(refs)) {
            // Make sure each ref has an id
            setAdditionalRefs(refs.map(ref => ({
              ...ref,
              id: ref.id || Date.now() + Math.floor(Math.random() * 1000)
            })));
          }
        } catch (parseErr) {
          console.error('Error parsing additional refs:', parseErr);
        }
      }

      setFormData(initialFormData);
      
      // Parse existing theme data if it exists
      if (trainerData.theme && trainerData.theme.includes(' || ')) {
        const [display, link] = trainerData.theme.split(' || ');
        setThemeDisplay(display);
        setThemeLink(link);
      } else {
        setThemeDisplay(trainerData.theme || '');
        setThemeLink('');
      }

      // Parse existing voice claim data if it exists
      if (trainerData.voice_claim && trainerData.voice_claim.includes(' || ')) {
        const [display, link] = trainerData.voice_claim.split(' || ');
        setVoiceClaimDisplay(display);
        setVoiceClaimLink(link);
      } else {
        setVoiceClaimDisplay(trainerData.voice_claim || '');
        setVoiceClaimLink('');
      }

      // Parse secrets if they exist
      if (trainerData.secrets) {
        try {
          const secretsData = typeof trainerData.secrets === 'string'
            ? JSON.parse(trainerData.secrets)
            : trainerData.secrets;
          if (Array.isArray(secretsData)) {
            setSecrets(secretsData.map(secret => ({
              ...secret,
              id: secret.id || Date.now() + Math.floor(Math.random() * 1000)
            })));
          }
        } catch (parseErr) {
          console.error('Error parsing secrets:', parseErr);
        }
      }

      // Parse relations if they exist
      if (trainerData.relations) {
        try {
          const relationsData = typeof trainerData.relations === 'string'
            ? JSON.parse(trainerData.relations)
            : trainerData.relations;
          if (Array.isArray(relationsData)) {
            setRelations(relationsData.map(relation => ({
              ...relation,
              id: relation.id || Date.now() + Math.floor(Math.random() * 1000),
              type: relation.type || (relation.monster_id ? 'monster' : 'trainer'), // Backward compatibility
              monster_id: relation.monster_id || '' // Ensure monster_id exists
            })));
          }
        } catch (parseErr) {
          console.error('Error parsing relations:', parseErr);
        }
      }
    } catch (err) {
      console.error(`Error fetching trainer ${id}:`, err);
      setError('Failed to load trainer data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prevData => {
      const newData = {
        ...prevData,
        [name]: newValue
      };
      
      // Auto-calculate zodiac when birthday changes
      if (name === 'birthday' && value) {
        newData.zodiac = calculateZodiac(value);
        newData.chinese_zodiac = calculateChineseZodiac(value);
      }
      
      return newData;
    });
  };

  const handleImageUpload = (file) => {
    setFormData(prevData => ({
      ...prevData,
      main_ref_file: file
    }));
  };

  const handleMegaImageUpload = (file) => {
    setFormData(prevData => ({
      ...prevData,
      mega_ref_file: file
    }));
  };

  const handleAddAdditionalRef = () => {
    setAdditionalRefs([
      ...additionalRefs,
      { id: Date.now(), title: '', description: '', image_url: '' }
    ]);
  };

  const handleRemoveAdditionalRef = (id) => {
    setAdditionalRefs(additionalRefs.filter(ref => ref.id !== id));
  };

  const handleAdditionalRefChange = (id, field, value) => {
    setAdditionalRefs(additionalRefs.map(ref =>
      ref.id === id ? { ...ref, [field]: value } : ref
    ));
  };

  const handleAdditionalRefImageUpload = (id, file) => {
    setAdditionalRefs(additionalRefs.map(ref =>
      ref.id === id ? { ...ref, image_file: file } : ref
    ));
  };

  // Secrets handlers
  const handleAddSecret = () => {
    setSecrets([
      ...secrets,
      { id: Date.now(), title: '', description: '' }
    ]);
  };

  const handleRemoveSecret = (id) => {
    setSecrets(secrets.filter(secret => secret.id !== id));
  };

  const handleSecretChange = (id, field, value) => {
    setSecrets(secrets.map(secret =>
      secret.id === id ? { ...secret, [field]: value } : secret
    ));
  };

  // Relations handlers
  const handleAddRelation = () => {
    setRelations([
      ...relations,
      { id: Date.now(), type: 'trainer', trainer_id: '', monster_id: '', name: '', elaboration: '' }
    ]);
  };

  const handleRemoveRelation = (id) => {
    setRelations(relations.filter(relation => relation.id !== id));
  };

  const handleRelationChange = (id, field, value) => {
    setRelations(relations.map(relation => {
      if (relation.id === id) {
        const updatedRelation = { ...relation, [field]: value };
        
        // If relation type changes, reset the selection
        if (field === 'type') {
          updatedRelation.trainer_id = '';
          updatedRelation.monster_id = '';
        }
        
        // If trainer is selected for a monster relation, fetch their monsters
        if (field === 'trainer_id' && relation.type === 'monster' && value) {
          fetchTrainerMonsters(value);
          updatedRelation.monster_id = ''; // Reset monster selection
        }
        
        return updatedRelation;
      }
      return relation;
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Create FormData for file uploads
      const submitFormData = new FormData();

      // Prepare mega info
      const megaInfo = {
        mega_ref: formData.mega_ref,
        mega_artist: formData.mega_artist,
        mega_species1: formData.mega_species1,
        mega_species2: formData.mega_species2,
        mega_species3: formData.mega_species3,
        mega_type1: formData.mega_type1,
        mega_type2: formData.mega_type2,
        mega_type3: formData.mega_type3,
        mega_type4: formData.mega_type4,
        mega_type5: formData.mega_type5,
        mega_type6: formData.mega_type6,
        mega_ability: formData.mega_ability
      };

      // Create a copy of formData without mega fields and file fields
      const {
        mega_ref, mega_artist, mega_species1, mega_species2, mega_species3,
        mega_type1, mega_type2, mega_type3, mega_type4, mega_type5, mega_type6,
        mega_ability, main_ref_file, mega_ref_file, ...trainerData
      } = formData;

      // Add mega_info as JSON
      trainerData.mega_info = JSON.stringify(megaInfo);

      // Process additional refs to separate files from data
      const additionalRefsData = additionalRefs.map(ref => {
        const { image_file, ...refData } = ref;
        return refData;
      });
      trainerData.additional_refs = JSON.stringify(additionalRefsData);
      
      // Concatenate theme fields if both are provided
      trainerData.theme = themeLink && themeDisplay ? `${themeDisplay} || ${themeLink}` : themeDisplay;

      // Concatenate voice claim fields if both are provided
      trainerData.voice_claim = voiceClaimLink && voiceClaimDisplay ? `${voiceClaimDisplay} || ${voiceClaimLink}` : voiceClaimDisplay;

      // Add secrets and relations as JSON
      trainerData.secrets = JSON.stringify(secrets);
      trainerData.relations = JSON.stringify(relations);

      // Add all text fields to FormData
      Object.keys(trainerData).forEach(key => {
        if (trainerData[key] !== undefined && trainerData[key] !== null) {
          submitFormData.append(key, trainerData[key]);
        }
      });

      // Debug logging for file uploads
      console.log('File upload debug:', {
        hasMainRefFile: !!formData.main_ref_file,
        hasMegaRefFile: !!formData.mega_ref_file,
        mainRefFileName: formData.main_ref_file?.name,
        megaRefFileName: formData.mega_ref_file?.name
      });

      // Handle only one image at a time - prioritize main_ref
      if (formData.main_ref_file) {
        submitFormData.append('image', formData.main_ref_file);
        submitFormData.append('uploadType', 'main_ref');
      } else if (formData.mega_ref_file) {
        submitFormData.append('image', formData.mega_ref_file);
        submitFormData.append('uploadType', 'mega_ref');
      }

      // Update trainer
      const response = await trainerService.updateTrainer(id, submitFormData);

      console.log('Update trainer response:', response);

      if (!response.success) {
        setError(response.message || 'Failed to update trainer');
        return;
      }

      // After main form is updated, upload additional_refs files if any
      const refsWithFiles = additionalRefs.filter(ref => ref.image_file);
      
      for (const ref of refsWithFiles) {
        try {
          const refFormData = new FormData();
          refFormData.append('image', ref.image_file);
          refFormData.append('uploadType', 'additional_ref');
          refFormData.append('refId', ref.id);
          refFormData.append('title', ref.title || '');
          refFormData.append('description', ref.description || '');

          const refResponse = await trainerService.updateTrainer(id, refFormData);
          
          if (!refResponse.success) {
            console.error('Failed to upload additional ref:', refResponse.message);
            // Continue with other refs even if one fails
          }
        } catch (refError) {
          console.error('Error uploading additional ref:', refError);
          // Continue with other refs even if one fails
        }
      }


      setSuccess('Trainer updated successfully');

      // Update local trainer data - handle different response formats
      if (response.trainer) {
        setTrainer(response.trainer);
      } else if (response.data && response.data.trainer) {
        setTrainer(response.data.trainer);
      } else if (response.data) {
        setTrainer(response.data);
      } else {
        // If no trainer data in response, refetch the trainer
        console.warn('No trainer data in update response, refetching...');
        await fetchTrainerData();
      }

      // Redirect to trainer detail page after a short delay
      setTimeout(() => {
        navigate(`/trainers/${id}`);
      }, 2000);
    } catch (err) {
      console.error(`Error updating trainer ${id}:`, err);
      setError('Failed to update trainer. Please try again later.');
    } finally {
      setSaving(false);
    }
  };

  // Debug ownership check
  console.log('Edit Trainer - Current User:', currentUser);
  console.log('Edit Trainer - Trainer:', trainer);
  console.log('Edit Trainer - Ownership check:', {
    currentUserId: currentUser?.id,
    currentUserDiscordId: currentUser?.discord_id,
    currentUserUsername: currentUser?.username,
    currentUserEmail: currentUser?.email,
    trainerPlayerUserId: trainer?.player_user_id,
    isAdmin: currentUser?.is_admin
  });

  // Check if user is authorized to edit this trainer
  const isAuthorized = currentUser && trainer && (
    // Check if IDs match (converted to strings for comparison)
    String(currentUser.id) === String(trainer.player_user_id) ||
    // Check if username matches
    String(currentUser.username) === String(trainer.player_user_id) ||
    // Check if email matches
    (currentUser.email && String(currentUser.email) === String(trainer.player_user_id)) ||
    // Check if discord_id matches
    (currentUser.discord_id && String(currentUser.discord_id) === String(trainer.player_user_id)) ||
    // Check if the user is an admin
    currentUser.is_admin === 1 || currentUser.is_admin === true ||
    // Additional check: sometimes trainer.player_user_id might be the user's ID
    String(currentUser.id) === String(trainer.player_user_id) ||
    // Check against trainer's user_id field if it exists
    (trainer.user_id && String(currentUser.id) === String(trainer.user_id)) ||
    // Check against trainer's discord_id field if it exists  
    (trainer.discord_id && currentUser.discord_id && String(currentUser.discord_id) === String(trainer.discord_id))
  );

  console.log('Edit Trainer - Is authorized result:', isAuthorized);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
        </div>
        <p>Loading trainer data...</p>
      </div>
    );
  }

  if (error && !trainer) {
    return (
      <div className="error-container">
        <i className="fas fa-exclamation-circle"></i>
        <p>{error}</p>
        <button onClick={fetchTrainerData} className="retry-button">
          Try Again
        </button>
        <button onClick={() => navigate(-1)} className="back-button">
          Go Back
        </button>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="error-container">
        <i className="fas fa-lock"></i>
        <p>You are not authorized to edit this trainer.</p>
        <button onClick={() => navigate(`/trainers/${id}`)} className="back-button">
          View Trainer
        </button>
      </div>
    );
  }

  return (
    <div className="edit-trainer-container">
      <h1>Edit Trainer: {trainer.name}</h1>

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

      <form onSubmit={handleSubmit} className="edit-trainer-form">
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
              <label htmlFor="nickname">Nickname</label>
              <input
                type="text"
                id="nickname"
                name="nickname"
                value={formData.nickname || ''}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="full_name">Full Name</label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={formData.full_name || ''}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <AutocompleteInput
                id="faction"
                name="faction"
                label="Faction"
                value={formData.faction || ''}
                onChange={handleChange}
                options={FACTIONS}
                placeholder="Select or type faction"
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
                value={formData.level || 1}
                onChange={handleChange}
                disabled
              />
              <small className="field-note">Level cannot be changed directly</small>
            </div>

            <div className="form-group">
              <label htmlFor="currency_amount">Currency</label>
              <input
                type="number"
                id="currency_amount"
                name="currency_amount"
                min="0"
                value={formData.currency_amount || 0}
                onChange={handleChange}
                disabled
              />
              <small className="field-note">Currency cannot be changed directly</small>
            </div>
          </div>
        </div>

        {/* Species and Types Section */}
        <div className="form-section">
          <h2>Species and Types</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="species1">Primary Species</label>
              <input
                type="text"
                id="species1"
                name="species1"
                value={formData.species1 || ''}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="species2">Secondary Species</label>
              <input
                type="text"
                id="species2"
                name="species2"
                value={formData.species2 || ''}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="species3">Tertiary Species</label>
              <input
                type="text"
                id="species3"
                name="species3"
                value={formData.species3 || ''}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <AutocompleteInput
                id="type1"
                name="type1"
                label="Primary Type"
                value={formData.type1 || ''}
                onChange={handleChange}
                options={TYPES}
                placeholder="Primary type"
              />
            </div>

            <div className="form-group">
              <AutocompleteInput
                id="type2"
                name="type2"
                label="Secondary Type"
                value={formData.type2 || ''}
                onChange={handleChange}
                options={TYPES}
                placeholder="Secondary type"
              />
            </div>

            <div className="form-group">
              <AutocompleteInput
                id="type3"
                name="type3"
                label="Tertiary Type"
                value={formData.type3 || ''}
                onChange={handleChange}
                options={TYPES}
                placeholder="Tertiary type"
              />
            </div>

            <div className="form-group">
              <AutocompleteInput
                id="type4"
                name="type4"
                label="Fourth Type"
                value={formData.type4 || ''}
                onChange={handleChange}
                options={TYPES}
                placeholder="Fourth type"
              />
            </div>

            <div className="form-group">
              <AutocompleteInput
                id="type5"
                name="type5"
                label="Fifth Type"
                value={formData.type5 || ''}
                onChange={handleChange}
                options={TYPES}
                placeholder="Fifth type"
              />
            </div>

            <div className="form-group">
              <AutocompleteInput
                id="type6"
                name="type6"
                label="Sixth Type"
                value={formData.type6 || ''}
                onChange={handleChange}
                options={TYPES}
                placeholder="Sixth type"
              />
            </div>
          </div>
        </div>

        {/* Abilities and Characteristics Section */}
        <div className="form-section">
          <h2>Abilities and Characteristics</h2>
          <div className="form-grid">
            <div className="form-group">
              <AutocompleteInput
                id="ability"
                name="ability"
                label="Ability"
                value={formData.ability || ''}
                onChange={handleChange}
                options={abilities}
                placeholder="Trainer ability"
                showDescriptionBelow={true}
              />
            </div>

            <div className="form-group">
              <AutocompleteInput
                id="nature"
                name="nature"
                label="Nature"
                value={formData.nature || ''}
                onChange={handleChange}
                options={NATURES}
                placeholder="e.g. Brave, Timid, Jolly"
              />
            </div>

            <div className="form-group">
              <AutocompleteInput
                id="characteristic"
                name="characteristic"
                label="Characteristic"
                value={formData.characteristic || ''}
                onChange={handleChange}
                options={CHARACTERISTICS}
                placeholder="Trainer characteristic"
              />
            </div>
          </div>
        </div>

        {/* Favorite Types Section */}
        <div className="form-section">
          <h2>Favorite Types</h2>
          <div className="form-grid">
            <div className="form-group">
              <AutocompleteInput
                id="fav_type1"
                name="fav_type1"
                label="Primary Favorite Type"
                value={formData.fav_type1 || ''}
                onChange={handleChange}
                options={TYPES}
                placeholder="Favorite type 1"
              />
            </div>

            <div className="form-group">
              <AutocompleteInput
                id="fav_type2"
                name="fav_type2"
                label="Secondary Favorite Type"
                value={formData.fav_type2 || ''}
                onChange={handleChange}
                options={TYPES}
                placeholder="Favorite type 2"
              />
            </div>

            <div className="form-group">
              <AutocompleteInput
                id="fav_type3"
                name="fav_type3"
                label="Tertiary Favorite Type"
                value={formData.fav_type3 || ''}
                onChange={handleChange}
                options={TYPES}
                placeholder="Favorite type 3"
              />
            </div>

            <div className="form-group">
              <AutocompleteInput
                id="fav_type4"
                name="fav_type4"
                label="Fourth Favorite Type"
                value={formData.fav_type4 || ''}
                onChange={handleChange}
                options={TYPES}
                placeholder="Favorite type 4"
              />
            </div>

            <div className="form-group">
              <AutocompleteInput
                id="fav_type5"
                name="fav_type5"
                label="Fifth Favorite Type"
                value={formData.fav_type5 || ''}
                onChange={handleChange}
                options={TYPES}
                placeholder="Favorite type 5"
              />
            </div>

            <div className="form-group">
              <AutocompleteInput
                id="fav_type6"
                name="fav_type6"
                label="Sixth Favorite Type"
                value={formData.fav_type6 || ''}
                onChange={handleChange}
                options={TYPES}
                placeholder="Favorite type 6"
              />
            </div>
          </div>
        </div>

        {/* Personal Information Section */}
        <div className="form-section">
          <h2>Personal Information</h2>
          <div className="form-grid">
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

            <div className="form-group">
              <label htmlFor="sexuality">Sexuality</label>
              <input
                type="text"
                id="sexuality"
                name="sexuality"
                value={formData.sexuality || ''}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="age">Age</label>
              <input
                type="text"
                id="age"
                name="age"
                value={formData.age || ''}
                onChange={handleChange}
              />
            </div>

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

            <div className="form-group theme-fields">
              <label htmlFor="theme_display">Theme Display Text</label>
              <input
                type="text"
                id="theme_display"
                name="theme_display"
                value={themeDisplay}
                onChange={(e) => setThemeDisplay(e.target.value)}
                placeholder="e.g., Pokémon Champion Theme"
              />
            </div>

            <div className="form-group theme-fields">
              <label htmlFor="theme_link">Theme YouTube Link (Optional)</label>
              <input
                type="url"
                id="theme_link"
                name="theme_link"
                value={themeLink}
                onChange={(e) => setThemeLink(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <small className="field-note">
                If provided, users will be able to expand and play the theme music on your trainer profile.
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="voice_claim_display">Voice Claim Display Text</label>
              <input
                type="text"
                id="voice_claim_display"
                name="voice_claim_display"
                value={voiceClaimDisplay}
                onChange={(e) => setVoiceClaimDisplay(e.target.value)}
                placeholder="e.g., Character Name (Actor Name)"
              />
            </div>

            <div className="form-group">
              <label htmlFor="voice_claim_link">Voice Claim Video Link (Optional)</label>
              <input
                type="url"
                id="voice_claim_link"
                name="voice_claim_link"
                value={voiceClaimLink}
                onChange={(e) => setVoiceClaimLink(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <small className="field-note">
                If provided, users will be able to expand and view the voice claim video on your trainer profile.
              </small>
            </div>

            
          </div>
        </div>

        {/* Location Information Section */}
        <div className="form-section">
          <h2>Location Information</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="birthplace">Birthplace</label>
              <input
                type="text"
                id="birthplace"
                name="birthplace"
                value={formData.birthplace || ''}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="residence">Residence</label>
              <input
                type="text"
                id="residence"
                name="residence"
                value={formData.residence || ''}
                onChange={handleChange}
              />
            </div>


          </div>
        </div>

        {/* Character Information Section */}
        <div className="form-section">
          <h2>Character Information</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="strengths">Character Strengths</label>
              <textarea
                id="strengths"
                name="strengths"
                value={formData.strengths || ''}
                onChange={handleChange}
                rows="3"
                placeholder="List your character's strengths and positive traits"
              ></textarea>
            </div>

            <div className="form-group">
              <label htmlFor="weaknesses">Character Weaknesses</label>
              <textarea
                id="weaknesses"
                name="weaknesses"
                value={formData.weaknesses || ''}
                onChange={handleChange}
                rows="3"
                placeholder="List your character's weaknesses and areas for improvement"
              ></textarea>
            </div>

            <div className="form-group">
              <label htmlFor="likes">Character Likes</label>
              <textarea
                id="likes"
                name="likes"
                value={formData.likes || ''}
                onChange={handleChange}
                rows="3"
                placeholder="What does your character enjoy and love?"
              ></textarea>
            </div>

            <div className="form-group">
              <label htmlFor="dislikes">Character Dislikes</label>
              <textarea
                id="dislikes"
                name="dislikes"
                value={formData.dislikes || ''}
                onChange={handleChange}
                rows="3"
                placeholder="What does your character dislike or hate?"
              ></textarea>
            </div>

            <div className="form-group">
              <label htmlFor="flaws">Flaws</label>
              <textarea
                id="flaws"
                name="flaws"
                value={formData.flaws || ''}
                onChange={handleChange}
                rows="3"
                placeholder="Character flaws and imperfections"
              ></textarea>
            </div>

            <div className="form-group">
              <label htmlFor="values">Core Values</label>
              <textarea
                id="values"
                name="values"
                value={formData.values || ''}
                onChange={handleChange}
                rows="3"
                placeholder="What principles and values does your character hold dear?"
              ></textarea>
            </div>

            <div className="form-group">
              <label htmlFor="quirks">Quirks</label>
              <textarea
                id="quirks"
                name="quirks"
                value={formData.quirks || ''}
                onChange={handleChange}
                rows="3"
                placeholder="Unique habits, behaviors, or characteristics"
              ></textarea>
            </div>
          </div>
        </div>

        {/* Other Information Section */}
        <div className="form-section">
          <h2>Other Information</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="occupation">Occupation</label>
              <input
                type="text"
                id="occupation"
                name="occupation"
                value={formData.occupation || ''}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="birthday">Birthday</label>
              <input
                type="date"
                id="birthday"
                name="birthday"
                value={formData.birthday || ''}
                onChange={handleChange}
                className="form-input"
              />
              <small className="field-note">Zodiac will be calculated automatically</small>
            </div>

            <div className="form-group">
              <label htmlFor="zodiac">Zodiac Sign</label>
              <input
                type="text"
                id="zodiac"
                name="zodiac"
                value={formData.zodiac || ''}
                readOnly
                className="form-input readonly"
                placeholder="Will be calculated from birthday"
              />
              <small className="field-note">Automatically calculated from birthday</small>
            </div>

            <div className="form-group">
              <label htmlFor="chinese_zodiac">Chinese Zodiac</label>
              <input
                type="text"
                id="chinese_zodiac"
                name="chinese_zodiac"
                value={formData.chinese_zodiac || ''}
                readOnly
                className="form-input readonly"
                placeholder="Will be calculated from birth year"
              />
              <small className="field-note">Automatically calculated from birth year</small>
            </div>

            <div className="form-group">
              <AutocompleteInput
                id="fav_berry"
                name="fav_berry"
                label="Favorite Berry"
                value={formData.fav_berry || ''}
                onChange={handleChange}
                options={BERRIES}
                placeholder="Favorite berry"
              />
            </div>

            <div className="form-group">
              <label htmlFor="race">Race</label>
              <select
                id="race"
                name="race"
                value={formData.race || 'Human'}
                onChange={handleChange}
              >
                <option value="Human">Human</option>
                <option value="Alter">Alter</option>
                <option value="Ultra Beast">Ultra Beast</option>
                <option value="Alter (Faller)">Alter (Faller)</option>
                <option value="Human (Faller)">Human (Faller)</option>
                <option value="Catfolk">Catfolk</option>
              </select>
            </div>
          </div>
        </div>

        {/* Biography Section */}
        <div className="form-section">
          <h2>Biography</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="quote">Quote</label>
              <input
                type="text"
                id="quote"
                name="quote"
                value={formData.quote || ''}
                onChange={handleChange}
              />
            </div>

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
              <label htmlFor="biography">Full Biography</label>
              <textarea
                id="biography"
                name="biography"
                value={formData.biography || ''}
                onChange={handleChange}
                rows="6"
                placeholder="Write your trainer's biography (supports Markdown formatting)"
              ></textarea>
              <small className="field-note">
                You can use Markdown formatting: **bold**, *italic*, [links](url), # headings, lists, etc.
              </small>
            </div>
          </div>
        </div>

        {/* Secrets Section */}
        <div className="form-section">
          <h2>Secrets</h2>
          <p className="section-description">Add character secrets with titles and descriptions.</p>

          {secrets.length > 0 ? (
            <div className="secrets-list">
              {secrets.map((secret, index) => (
                <div key={secret.id} className="secret-item">
                  <div className="secret-header">
                    <h3>Secret #{index + 1}</h3>
                    <button
                      type="button"
                      className="remove-secret-button"
                      onClick={() => handleRemoveSecret(secret.id)}
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>Title</label>
                      <input
                        type="text"
                        value={secret.title || ''}
                        onChange={(e) => handleSecretChange(secret.id, 'title', e.target.value)}
                        placeholder="Secret Title"
                      />
                    </div>

                    <div className="form-group full-width">
                      <label>Description</label>
                      <textarea
                        value={secret.description || ''}
                        onChange={(e) => handleSecretChange(secret.id, 'description', e.target.value)}
                        placeholder="Describe the secret"
                        rows="3"
                      ></textarea>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-secrets">
              <i className="fas fa-eye-slash"></i>
              <p>No secrets added yet.</p>
            </div>
          )}

          <div className="add-secret-button-container">
            <button
              type="button"
              className="add-secret-button"
              onClick={handleAddSecret}
            >
              <i className="fas fa-plus"></i> Add Secret
            </button>
          </div>
        </div>

        {/* Relations Section */}
        <div className="form-section">
          <h2>Relations</h2>
          <p className="section-description">Add relationships with other trainers and their monsters.</p>

          {relations.length > 0 ? (
            <div className="relations-list">
              {relations.map((relation, index) => (
                <div key={relation.id} className="relation-item">
                  <div className="relation-header">
                    <h3>Relation #{index + 1}</h3>
                    <button
                      type="button"
                      className="remove-relation-button"
                      onClick={() => handleRemoveRelation(relation.id)}
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>Relation Type</label>
                      <select
                        value={relation.type || 'trainer'}
                        onChange={(e) => handleRelationChange(relation.id, 'type', e.target.value)}
                      >
                        <option value="trainer">Trainer Relation</option>
                        <option value="monster">Monster Relation</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Trainer</label>
                      <select
                        value={relation.trainer_id || ''}
                        onChange={(e) => handleRelationChange(relation.id, 'trainer_id', e.target.value)}
                      >
                        <option value="">Select Trainer</option>
                        {allTrainers.filter(trainer => 
                          relation.type === 'monster' ? true : trainer.id !== parseInt(id)
                        ).map(trainer => (
                          <option key={trainer.id} value={trainer.id}>
                            {trainer.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {relation.type === 'monster' && (
                      <div className="form-group">
                        <label>Monster</label>
                        <select
                          value={relation.monster_id || ''}
                          onChange={(e) => handleRelationChange(relation.id, 'monster_id', e.target.value)}
                          disabled={!relation.trainer_id}
                        >
                          <option value="">
                            {relation.trainer_id ? 'Select Monster' : 'Select Trainer First'}
                          </option>
                          {relation.trainer_id && trainerMonsters[relation.trainer_id] && 
                            trainerMonsters[relation.trainer_id].map(monster => (
                              <option key={monster.id} value={monster.id}>
                                {monster.name} ({monster.species1 || monster.species || 'Unknown'})
                              </option>
                            ))
                          }
                        </select>
                      </div>
                    )}

                    <div className="form-group">
                      <label>Relationship Name</label>
                      <input
                        type="text"
                        value={relation.name || ''}
                        onChange={(e) => handleRelationChange(relation.id, 'name', e.target.value)}
                        placeholder={relation.type === 'monster' ? "e.g., Partner, Rival, Feared" : "e.g., Friend, Rival, Mentor"}
                      />
                    </div>

                    <div className="form-group full-width">
                      <label>Elaboration</label>
                      <textarea
                        value={relation.elaboration || ''}
                        onChange={(e) => handleRelationChange(relation.id, 'elaboration', e.target.value)}
                        placeholder={
                          relation.type === 'monster' 
                            ? "Describe how they interact with this monster" 
                            : "Describe how they interact with this trainer"
                        }
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
              className="add-relation-button"
              onClick={handleAddRelation}
            >
              <i className="fas fa-plus"></i> Add Relation
            </button>
          </div>
        </div>

        {/* Images Section */}
        <div className="form-section">
          <h2>Images</h2>
          <div className="form-grid">
            <div className="form-group full-width">
              <label htmlFor="main_ref">Main Image</label>
              <div className="file-upload-container">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e.target.files[0])}
                  id="main-ref-upload"
                />
                <label htmlFor="main-ref-upload" className="file-upload-button">
                  {formData.main_ref_file ? formData.main_ref_file.name : 'Upload Trainer Image'}
                </label>
                {(formData.main_ref || formData.main_ref_file) && (
                  <div className="image-preview">
                    <img 
                      src={formData.main_ref_file ? URL.createObjectURL(formData.main_ref_file) : formData.main_ref} 
                      alt="Main reference preview" 
                      style={{maxWidth: '200px', maxHeight: '200px', objectFit: 'cover'}}
                    />
                  </div>
                )}
              </div>
              <small className="field-note">Upload a clear image of your trainer. Recommended size: 800x800 pixels.</small>
            </div>
          </div>
        </div>

        {/* Additional References Section */}
        <div className="form-section">
          <h2>Additional References</h2>
          <p className="section-description">Add additional reference images, artwork, or other visual content for your trainer.</p>

          {additionalRefs.length > 0 ? (
            <div className="additional-refs-list">
              {additionalRefs.map((ref, index) => (
                <div key={ref.id} className="additional-ref-item">
                  <div className="additional-ref-header">
                    <h3>Reference #{index + 1}</h3>
                    <button
                      type="button"
                      className="remove-ref-button"
                      onClick={() => handleRemoveAdditionalRef(ref.id)}
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>Title</label>
                      <input
                        type="text"
                        value={ref.title || ''}
                        onChange={(e) => handleAdditionalRefChange(ref.id, 'title', e.target.value)}
                        placeholder="Reference Title"
                      />
                    </div>

                    <div className="form-group full-width">
                      <label>Description</label>
                      <textarea
                        value={ref.description || ''}
                        onChange={(e) => handleAdditionalRefChange(ref.id, 'description', e.target.value)}
                        placeholder="Describe this reference"
                        rows="2"
                      ></textarea>
                    </div>

                    <div className="form-group full-width">
                      <label>Image</label>
                      <div className="file-upload-container">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleAdditionalRefImageUpload(ref.id, e.target.files[0])}
                          id={`additional-ref-upload-${ref.id}`}
                        />
                        <label htmlFor={`additional-ref-upload-${ref.id}`} className="file-upload-button">
                          {ref.image_file ? ref.image_file.name : 'Upload Reference Image'}
                        </label>
                        {(ref.image_url || ref.image_file) && (
                          <div className="image-preview">
                            <img 
                              src={ref.image_file ? URL.createObjectURL(ref.image_file) : ref.image_url} 
                              alt="Additional reference preview" 
                              style={{maxWidth: '200px', maxHeight: '200px', objectFit: 'cover'}}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-additional-refs">
              <i className="fas fa-images"></i>
              <p>No additional references added yet.</p>
            </div>
          )}

          <div className="add-ref-button-container">
            <button
              type="button"
              className="add-ref-button"
              onClick={handleAddAdditionalRef}
            >
              <i className="fas fa-plus"></i> Add Reference
            </button>
          </div>
        </div>

        {/* Mega Evolution Section */}
        <div className="form-section">
          <h2>Mega Evolution</h2>
          <div className="form-grid">
            <div className="form-group full-width">
              <label htmlFor="mega_ref">Mega Evolution Image</label>
              <div className="file-upload-container">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleMegaImageUpload(e.target.files[0])}
                  id="mega-ref-upload"
                />
                <label htmlFor="mega-ref-upload" className="file-upload-button">
                  {formData.mega_ref_file ? formData.mega_ref_file.name : 'Upload Mega Evolution Image'}
                </label>
                {(formData.mega_ref || formData.mega_ref_file) && (
                  <div className="image-preview">
                    <img 
                      src={formData.mega_ref_file ? URL.createObjectURL(formData.mega_ref_file) : formData.mega_ref} 
                      alt="Mega reference preview" 
                      style={{maxWidth: '200px', maxHeight: '200px', objectFit: 'cover'}}
                    />
                  </div>
                )}
              </div>
              <small className="field-note">Upload an image of your trainer's mega evolution form. Recommended size: 800x800 pixels.</small>
            </div>

            <div className="form-group">
              <label htmlFor="mega_artist">Mega Artist</label>
              <input
                type="text"
                id="mega_artist"
                name="mega_artist"
                value={formData.mega_artist || ''}
                onChange={handleChange}
              />
            </div>

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
              <AutocompleteInput
                id="mega_type1"
                name="mega_type1"
                label="Mega Primary Type"
                value={formData.mega_type1 || ''}
                onChange={handleChange}
                options={TYPES}
                placeholder="Mega primary type"
              />
            </div>

            <div className="form-group">
              <AutocompleteInput
                id="mega_type2"
                name="mega_type2"
                label="Mega Secondary Type"
                value={formData.mega_type2 || ''}
                onChange={handleChange}
                options={TYPES}
                placeholder="Mega secondary type"
              />
            </div>

            <div className="form-group">
              <AutocompleteInput
                id="mega_ability"
                name="mega_ability"
                label="Mega Ability"
                value={formData.mega_ability || ''}
                onChange={handleChange}
                options={abilities}
                placeholder="Mega ability"
                showDescriptionBelow={true}
              />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="cancel-button" onClick={() => navigate(`/trainers/${id}`)}>
            Cancel
          </button>
          <button type="submit" className="save-button" disabled={saving}>
            {saving ? <i className="fas fa-spinner fa-spin"></i> : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditTrainerPage;
