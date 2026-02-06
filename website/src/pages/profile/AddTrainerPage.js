import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import AutocompleteInput from '../../components/common/AutocompleteInput';
import api from '../../services/api';
import trainerService from '../../services/trainerService';
import abilityService from '../../services/abilityService';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { calculateZodiac, calculateChineseZodiac } from '../../utils/zodiacUtils';
import { TYPES, FACTIONS, NATURES, CHARACTERISTICS, BERRIES } from '../../data/trainerFormOptions';

const AddTrainerPage = () => {
  useDocumentTitle('Add Trainer');

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [abilities, setAbilities] = useState([]);

  // Load abilities from backend
  useEffect(() => {
    const loadAbilities = async () => {
      const abilityData = await abilityService.getAbilityNames();
      setAbilities(abilityData);
    };
    loadAbilities();
  }, []);

  // Form state
  const [formData, setFormData] = useState({
    // Basic Information
    name: '',
    nickname: '',
    full_name: '',
    title: '',
    faction: '',

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

    // Personality
    fav_berry: '',
    quote: '',
    tldr: '',
    biography: '',

    // Character Information
    strengths: '',
    weaknesses: '',
    likes: '',
    dislikes: '',
    flaws: '',
    values: '',
    quirks: '',

    // Other
    race: 'Human'
  });

  // File uploads for multer
  const [mainRefFile, setMainRefFile] = useState(null);
  const [mainRefPreview, setMainRefPreview] = useState('');

  // Ref for scrolling to submit
  const submitRef = useRef(null);

  const handleJumpToSubmit = () => {
    submitRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Theme and voice claim fields
  const [themeDisplay, setThemeDisplay] = useState('');
  const [themeLink, setThemeLink] = useState('');
  const [voiceClaimDisplay, setVoiceClaimDisplay] = useState('');
  const [voiceClaimLink, setVoiceClaimLink] = useState('');

  // Additional references
  const [additionalRefs, setAdditionalRefs] = useState([
    { id: Date.now(), title: '', description: '', image_url: '' }
  ]);

  // Secrets and relations
  const [secrets, setSecrets] = useState([]);
  const [relations, setRelations] = useState([]);
  const [allTrainers, setAllTrainers] = useState([]);
  const [trainerMonsters, setTrainerMonsters] = useState({});

  // Form validation
  const [errors, setErrors] = useState({
    name: ''
  });

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/add_trainer' } });
      return;
    }
  }, [isAuthenticated, navigate]);

  // Handle form field changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    const newFormData = {
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    };

    // Auto-calculate zodiac when birthday changes
    if (name === 'birthday' && value) {
      newFormData.zodiac = calculateZodiac(value);
      newFormData.chinese_zodiac = calculateChineseZodiac(value);
    }

    setFormData(newFormData);
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
        
        return updatedRelation;
      }
      return relation;
    }));
  };

  // Handle main reference file upload
  const handleMainRefFileUpload = (file) => {
    setMainRefFile(file);
    if (file) {
      setMainRefPreview(URL.createObjectURL(file));
    } else {
      setMainRefPreview('');
    }
  };


  // Handle additional references
  const handleAddAdditionalRef = () => {
    setAdditionalRefs([
      ...additionalRefs,
      { id: Date.now(), title: '', description: '', image_url: '' }
    ]);
  };

  const handleRemoveAdditionalRef = (index) => {
    const newRefs = [...additionalRefs];
    newRefs.splice(index, 1);
    setAdditionalRefs(newRefs);
  };

  const handleAdditionalRefChange = (index, field, value) => {
    const newRefs = [...additionalRefs];
    newRefs[index][field] = value;
    setAdditionalRefs(newRefs);
  };


  const validateForm = () => {
    let isValid = true;
    const newErrors = {};

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Trainer name is required';
      isValid = false;
    } else if (formData.name.length < 3) {
      newErrors.name = 'Trainer name must be at least 3 characters';
      isValid = false;
    } else if (formData.name.length > 50) {
      newErrors.name = 'Trainer name must be at most 50 characters';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      // Scroll to the first error
      const firstErrorField = document.querySelector('.error');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Always use FormData for file uploads (even if no files, for consistency)
      const submitFormData = new FormData();

      // Add all trainer data fields (excluding theme and voice_claim which are handled separately)
      Object.keys(formData).forEach(key => {
        if (key !== 'theme' && key !== 'voice_claim' && formData[key] !== undefined && formData[key] !== null) {
          submitFormData.append(key, formData[key]);
        }
      });

      // Concatenate theme fields if both are provided
      const theme = themeLink && themeDisplay ? `${themeDisplay} || ${themeLink}` : themeDisplay;
      const voice_claim = voiceClaimLink && voiceClaimDisplay ? `${voiceClaimDisplay} || ${voiceClaimLink}` : voiceClaimDisplay;

      // Add stringified fields
      submitFormData.append('additional_refs', JSON.stringify(additionalRefs.filter(ref => ref.title || ref.description || ref.image_url)));
      submitFormData.append('secrets', JSON.stringify(secrets));
      submitFormData.append('relations', JSON.stringify(relations));
      submitFormData.append('theme', theme);
      submitFormData.append('voice_claim', voice_claim);

      // Add main ref file if present
      if (mainRefFile) {
        submitFormData.append('image', mainRefFile);
      }

      // Note: mega ref files will be handled separately after trainer creation
      // The current backend setup only handles one file per request

      const response = await trainerService.createTrainerWithFiles(submitFormData);

      if (response.success) {
        setSuccess('Trainer created successfully! Redirecting to starter selection...');

        // Redirect to starter selection page after a short delay
        setTimeout(() => {
          // Navigate to the starter selection page with the trainer ID
          navigate(`/profile/trainers/${response.data.id}/starter-selection`);
        }, 2000);
      } else {
        setError(response.message || 'Failed to create trainer. Please try again.');
      }
    } catch (err) {
      console.error('Error creating trainer:', err);
      setError(err.response?.data?.message || 'Failed to create trainer. Please try again.');
    } finally {
      setLoading(false);
    }
  };



  if (loading) {
    return <LoadingSpinner message="Loading..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        message={error}
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="add-trainer-container">
      <div className="add-trainer-header">
        <h1>Create New Trainer</h1>
        <Link to="/profile/trainers" className="button secondary">
          <i className="fas fa-arrow-left"></i> Back to Trainers
        </Link>
      </div>

      <button
        type="button"
        className="jump-to-submit-btn"
        onClick={handleJumpToSubmit}
      >
        <i className="fas fa-arrow-down"></i> Jump to Submit
      </button>

      {error && (
        <div className="form-error-message">
          <i className="fas fa-exclamation-circle"></i> {error}
        </div>
      )}

      {success && (
        <div className="form-success-message">
          <i className="fas fa-check-circle"></i> {success}
        </div>
      )}

      <form className="trainer-form" onSubmit={handleSubmit}>
        {/* Basic Information Section */}
        <div className="form-section">
          <h2 className="section-title">Trainer Creation Information</h2>
          <p className="section-description">
            Bellow you can create your very own trainer! The only required field is the Trainer Name, but feel free to fill out as much or as little as you like to make your trainer unique and personalized to your liking. Everything here can be editted later at any time.
          </p>
        </div>
        <div className="form-section">
          <h2 className="section-title">Basic Information</h2>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="name">Trainer Name <span className="required">*</span></label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`form-input ${errors.name ? 'error' : ''}`}
                placeholder="Enter trainer name"
              />
              {errors.name && <div className="input-error">{errors.name}</div>}
              <small className="field-note">The primary name of your trainer</small>
            </div>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="nickname">Nickname</label>
              <input
                type="text"
                id="nickname"
                name="nickname"
                value={formData.nickname}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter nickname "
              />
              <small className="field-note">A shorter or informal name</small>
            </div>

            <div className="form-group">
              <label htmlFor="full_name">Full Name</label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter full name "
              />
              <small className="field-note">The complete name of your trainer</small>
            </div>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter title "
              />
              <small className="field-note">A title or honorific for your trainer</small>
            </div>

            <div className="form-group">
              <label htmlFor="faction">Faction</label>
              <AutocompleteInput
                id="faction"
                name="faction"
                value={formData.faction}
                onChange={handleInputChange}
                options={FACTIONS}
                placeholder="Select or type faction"
              />
              <small className="field-note">The faction your trainer belongs to</small>
            </div>
          </div>
        </div>

        {/* Main Reference Image Section */}
        <div className="form-section">
          <h2 className="section-title">Main Reference Image</h2>
          <p className="section-description">
            Upload a reference image for your trainer. This will be the main image displayed on your trainer's profile.
          </p>

          <div className="main-ref-upload-area">
            <div className="upload-zone">
              <input
                type="file"
                id="main_ref"
                name="main_ref"
                accept="image/*"
                onChange={(e) => handleMainRefFileUpload(e.target.files[0])}
                className="file-input-hidden"
              />

              {mainRefPreview ? (
                <div className="main-ref-preview">
                  <img src={mainRefPreview} alt="Main reference preview" />
                  <div className="preview-overlay">
                    <label htmlFor="main_ref" className="change-image-btn">
                      <i className="fas fa-camera"></i> Change Image
                    </label>
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={() => {
                        setMainRefFile(null);
                        setMainRefPreview('');
                      }}
                    >
                      <i className="fas fa-trash"></i> Remove
                    </button>
                  </div>
                </div>
              ) : (
                <label htmlFor="main_ref" className="upload-placeholder">
                  <div className="upload-icon">
                    <i className="fas fa-cloud-upload-alt"></i>
                  </div>
                  <div className="upload-text">
                    <span className="upload-main-text">Click to upload trainer image</span>
                    <span className="upload-sub-text">PNG, JPG, or GIF (Recommended: 800x800px)</span>
                  </div>
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Species and Types Section */}
        <div className="form-section">
          <h2 className="section-title">Species and Types</h2>
          <p className="section-description">
            Here you can specify the species and types of your trainer. These are both optional. 
          </p>

          <h3 className="subsection-title">Species</h3>
          <p className="subsection-description">
            Species can be any species of a valid monster from the game (Pokemon, Digimon, Yokai, Nexomon, Pals, Fakemon, Final Fantasy, Monster Hunter). Yes, this includes mythicals, legendaries, etc.
          </p>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="species1">Primary Species</label>
              <input
                type="text"
                id="species1"
                name="species1"
                value={formData.species1}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter primary species"
              />
              <small className="field-note">The main species of your trainer.</small>
            </div>

            <div className="form-group">
              <label htmlFor="species2">Secondary Species</label>
              <input
                type="text"
                id="species2"
                name="species2"
                value={formData.species2}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter secondary species "
              />
              <small className="field-note">A secondary species if applicable</small>
            </div>

            <div className="form-group">
              <label htmlFor="species3">Tertiary Species</label>
              <input
                type="text"
                id="species3"
                name="species3"
                value={formData.species3}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter tertiary species "
              />
              <small className="field-note">A tertiary species if applicable</small>
            </div>
          </div>

            <h3 className="subsection-title">Types</h3>
          <p className="subsection-description">
            Types are the same as the types of monsters. You can choose up to 6 types for your trainer. Types are not required, and Humans cannot have types (only Alters and Catfolk can). 
          </p>
          <div className="form-grid">
            <div className="form-group">
              <AutocompleteInput
                id="type1"
                name="type1"
                label="Primary Type"
                value={formData.type1}
                onChange={handleInputChange}
                options={TYPES}
                placeholder="Enter primary type "
              />
            </div>

            <div className="form-group">
              <AutocompleteInput
                id="type2"
                name="type2"
                label="Type 2"
                value={formData.type2}
                onChange={handleInputChange}
                options={TYPES}
                placeholder="Enter type 2"
              />
            </div>

            <div className="form-group">
              <AutocompleteInput
                id="type3"
                name="type3"
                label="Type 3"
                value={formData.type3}
                onChange={handleInputChange}
                options={TYPES}
                placeholder="Enter type 3"
              />
            </div>

            <div className="form-group">
              <AutocompleteInput
                id="type4"
                name="type4"
                label="Type 4"
                value={formData.type4}
                onChange={handleInputChange}
                options={TYPES}
                placeholder="Enter type 4 "
              />
            </div>

            <div className="form-group">
              <AutocompleteInput
                id="type5"
                name="type5"
                label="Type 5"
                value={formData.type5}
                onChange={handleInputChange}
                options={TYPES}
                placeholder="Enter type 5 "
              />
            </div>

            <div className="form-group">
              <AutocompleteInput
                id="type6"
                name="type6"
                label="Type 6"
                value={formData.type6}
                onChange={handleInputChange}
                options={TYPES}
                placeholder="Enter type 6 "
              />
            </div>
          </div>
        </div>

        {/* Abilities and Characteristics Section */}
        <div className="form-section">
          <h2 className="section-title">Abilities and Characteristics</h2>

          <div className="form-grid">
            <div className="form-group">
              <AutocompleteInput
                id="ability"
                name="ability"
                label="Ability"
                value={formData.ability}
                onChange={handleInputChange}
                options={abilities}
                placeholder="Enter ability"
                helpText="The special ability of your trainer"
                showDescriptionBelow={true}
              />
            </div>

            <div className="form-group">
              <AutocompleteInput
                id="nature"
                name="nature"
                label="Nature"
                value={formData.nature}
                onChange={handleInputChange}
                options={NATURES}
                placeholder="Enter nature"
                helpText="The nature of your trainer (e.g., Brave, Timid, etc.)"
              />
            </div>

            <div className="form-group">
              <AutocompleteInput
                id="characteristic"
                name="characteristic"
                label="Characteristic"
                value={formData.characteristic}
                onChange={handleInputChange}
                options={CHARACTERISTICS}
                placeholder="Enter characteristic"
                helpText="A notable characteristic of your trainer"
              />
            </div>
          </div>
        </div>

        {/* Favorite Types Section */}
        <div className="form-section">
          <h2 className="section-title">Favorite Types</h2>

          <div className="form-grid">
            <div className="form-group">
              <AutocompleteInput
                id="fav_type1"
                name="fav_type1"
                label="Favorite Type 1"
                value={formData.fav_type1}
                onChange={handleInputChange}
                options={TYPES}
                placeholder="Enter favorite type 1"
                helpText="Your trainer's most preferred type"
              />
            </div>

            <div className="form-group">
              <AutocompleteInput
                id="fav_type2"
                name="fav_type2"
                label="Favorite Type 2"
                value={formData.fav_type2}
                onChange={handleInputChange}
                options={TYPES}
                placeholder="Enter favorite type 2 "
              />
            </div>

            <div className="form-group">
              <AutocompleteInput
                id="fav_type3"
                name="fav_type3"
                label="Favorite Type 3"
                value={formData.fav_type3}
                onChange={handleInputChange}
                options={TYPES}
                placeholder="Enter favorite type 3 "
              />
            </div>

            <div className="form-group">
              <AutocompleteInput
                id="fav_type4"
                name="fav_type4"
                label="Favorite Type 4"
                value={formData.fav_type4}
                onChange={handleInputChange}
                options={TYPES}
                placeholder="Enter favorite type 4 "
              />
            </div>

            <div className="form-group">
              <AutocompleteInput
                id="fav_type5"
                name="fav_type5"
                label="Favorite Type 5"
                value={formData.fav_type5}
                onChange={handleInputChange}
                options={TYPES}
                placeholder="Enter favorite type 5 "
              />
            </div>

            <div className="form-group">
              <AutocompleteInput
                id="fav_type6"
                name="fav_type6"
                label="Favorite Type 6"
                value={formData.fav_type6}
                onChange={handleInputChange}
                options={TYPES}
                placeholder="Enter favorite type 6 "
              />
            </div>
          </div>
        </div>

        {/* Personal Information Section */}
        <div className="form-section">
          <h2 className="section-title">Personal Information</h2>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="gender">Gender</label>
              <input
                type="text"
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter gender"
              />
              <small className="field-note">Your trainer's gender identity</small>
            </div>

            <div className="form-group">
              <label htmlFor="pronouns">Pronouns</label>
              <input
                type="text"
                id="pronouns"
                name="pronouns"
                value={formData.pronouns}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter pronouns"
              />
              <small className="field-note">Your trainer's preferred pronouns</small>
            </div>

                        <div className="form-group">
              <label htmlFor="race">Race</label>
              <select
                id="race"
                name="race"
                value={formData.race}
                onChange={handleInputChange}
                className="form-input"
              >
                <option value="Human">Human</option>
                <option value="Alter">Alter</option>
                <option value="Ultra Beast">Ultra Beast</option>
                <option value="Alter (Faller)">Alter (Faller)</option>
                <option value="Human (Faller)">Human (Faller)</option>
                <option value="Catfolk">Catfolk</option>
              </select>
              <small className="field-note">Select your trainer's race</small>
            </div>

            <div className="form-group">
              <label htmlFor="sexuality">Sexuality</label>
              <input
                type="text"
                id="sexuality"
                name="sexuality"
                value={formData.sexuality}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter sexuality "
              />
              <small className="field-note">Your trainer's sexual orientation</small>
            </div>

            <div className="form-group">
              <label htmlFor="age">Age</label>
              <input
                type="text"
                id="age"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter age"
              />
              <small className="field-note">Your trainer's age</small>
            </div>

            <div className="form-group">
              <label htmlFor="birthplace">Birthplace</label>
              <input
                type="text"
                id="birthplace"
                name="birthplace"
                value={formData.birthplace}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter birthplace"
              />
              <small className="field-note">Where your trainer was born</small>
            </div>

            <div className="form-group">
              <label htmlFor="residence">Current Residence</label>
              <input
                type="text"
                id="residence"
                name="residence"
                value={formData.residence}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter current residence"
              />
              <small className="field-note">Where your trainer currently lives</small>
            </div>
            
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="height">Height</label>
              <input
                type="text"
                id="height"
                name="height"
                value={formData.height}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter height"
              />
              <small className="field-note">Your trainer's height</small>
            </div>

            <div className="form-group">
              <label htmlFor="weight">Weight</label>
              <input
                type="text"
                id="weight"
                name="weight"
                value={formData.weight}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter weight"
              />
              <small className="field-note">Your trainer's weight</small>
            </div>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="theme_display">Theme Display Text</label>
              <input
                type="text"
                id="theme_display"
                name="theme_display"
                value={themeDisplay}
                onChange={(e) => setThemeDisplay(e.target.value)}
                className="form-input"
                placeholder="e.g., Pokémon Champion Theme"
              />
              <small className="field-note">The display text for your trainer's theme</small>
            </div>

            <div className="form-group">
              <label htmlFor="theme_link">Theme YouTube Link </label>
              <input
                type="url"
                id="theme_link"
                name="theme_link"
                value={themeLink}
                onChange={(e) => setThemeLink(e.target.value)}
                className="form-input"
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <small className="field-note">If provided, users will be able to expand and play the theme music</small>
            </div>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="voice_claim_display">Voice Claim Display Text</label>
              <input
                type="text"
                id="voice_claim_display"
                name="voice_claim_display"
                value={voiceClaimDisplay}
                onChange={(e) => setVoiceClaimDisplay(e.target.value)}
                className="form-input"
                placeholder="e.g., Character Name (Actor Name)"
              />
              <small className="field-note">The display text for your trainer's voice claim</small>
            </div>

            <div className="form-group">
              <label htmlFor="voice_claim_link">Voice Claim Video Link </label>
              <input
                type="url"
                id="voice_claim_link"
                name="voice_claim_link"
                value={voiceClaimLink}
                onChange={(e) => setVoiceClaimLink(e.target.value)}
                className="form-input"
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <small className="field-note">If provided, users will be able to expand and view the voice claim video</small>
            </div>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="occupation">Occupation</label>
              <input
                type="text"
                id="occupation"
                name="occupation"
                value={formData.occupation}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter occupation"
              />
              <small className="field-note">Your trainer's occupation</small>
            </div>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="birthday">Birthday</label>
              <input
                type="date"
                id="birthday"
                name="birthday"
                value={formData.birthday}
                onChange={handleInputChange}
                className="form-input"
              />
              <small className="field-note">Your trainer's birthday (zodiac will be calculated automatically)</small>
            </div>

            <div className="form-group">
              <label htmlFor="zodiac">Zodiac Sign</label>
              <input
                type="text"
                id="zodiac"
                name="zodiac"
                value={formData.zodiac}
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
                value={formData.chinese_zodiac}
                readOnly
                className="form-input readonly"
                placeholder="Will be calculated from birth year"
              />
              <small className="field-note">Automatically calculated from birth year</small>
            </div>
        </div>
</div>
        {/* Personality Section */}
        <div className="form-section">
          <h2 className="section-title">Personality</h2>
            <div className="form-group">
              <AutocompleteInput
                id="fav_berry"
                name="fav_berry"
                label="Favorite Berry"
                value={formData.fav_berry}
                onChange={handleInputChange}
                options={BERRIES}
                placeholder="Enter favorite berry"
                helpText="Your trainer's favorite berry"
              />
            </div>

            <div className="form-group">
              <label htmlFor="quote">Quote</label>
              <input
                type="text"
                id="quote"
                name="quote"
                value={formData.quote}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter a memorable quote"
              />
              <small className="field-note">A memorable quote from your trainer</small>
            </div>

            <div className="form-group full-width">
              <label htmlFor="tldr">TLDR</label>
              <textarea
                id="tldr"
                name="tldr"
                value={formData.tldr}
                onChange={handleInputChange}
                className="form-textarea"
                placeholder="Enter a brief summary about your trainer"
                rows={2}
              />
              <small className="field-note">A brief summary about your trainer</small>
            </div>

            <div className="form-group full-width">
              <label htmlFor="biography">Biography</label>
              <textarea
                id="biography"
                name="biography"
                value={formData.biography}
                onChange={handleInputChange}
                className="form-textarea"
                placeholder="Enter your trainer's biography (supports Markdown formatting)"
                rows={5}
              />
              <small className="field-note">Your trainer's life story and background. You can use Markdown formatting: **bold**, *italic*, [links](url), # headings, etc.</small>
            </div>
          </div>

        {/* Character Information Section */}
        <div className="form-section">
          <h2 className="section-title">Character Information</h2>
          <div className="form-grid">
            <div className="form-group full-width">
              <label htmlFor="strengths">Character Strengths</label>
              <textarea
                id="strengths"
                name="strengths"
                value={formData.strengths}
                onChange={handleInputChange}
                className="form-textarea"
                placeholder="List your character's strengths and positive traits"
                rows={3}
              />
              <small className="field-note">What are your character's best qualities?</small>
            </div>

            <div className="form-group full-width">
              <label htmlFor="weaknesses">Character Weaknesses</label>
              <textarea
                id="weaknesses"
                name="weaknesses"
                value={formData.weaknesses}
                onChange={handleInputChange}
                className="form-textarea"
                placeholder="List your character's weaknesses and areas for improvement"
                rows={3}
              />
              <small className="field-note">What are your character's flaws or challenges?</small>
            </div>

            <div className="form-group full-width">
              <label htmlFor="likes">Character Likes</label>
              <textarea
                id="likes"
                name="likes"
                value={formData.likes}
                onChange={handleInputChange}
                className="form-textarea"
                placeholder="What does your character enjoy and love?"
                rows={3}
              />
              <small className="field-note">Things your character enjoys</small>
            </div>

            <div className="form-group full-width">
              <label htmlFor="dislikes">Character Dislikes</label>
              <textarea
                id="dislikes"
                name="dislikes"
                value={formData.dislikes}
                onChange={handleInputChange}
                className="form-textarea"
                placeholder="What does your character dislike or hate?"
                rows={3}
              />
              <small className="field-note">Things your character dislikes</small>
            </div>

            <div className="form-group full-width">
              <label htmlFor="flaws">Flaws</label>
              <textarea
                id="flaws"
                name="flaws"
                value={formData.flaws}
                onChange={handleInputChange}
                className="form-textarea"
                placeholder="Character flaws and imperfections"
                rows={3}
              />
              <small className="field-note">Character flaws and imperfections</small>
            </div>

            <div className="form-group full-width">
              <label htmlFor="values">Core Values</label>
              <textarea
                id="values"
                name="values"
                value={formData.values}
                onChange={handleInputChange}
                className="form-textarea"
                placeholder="What principles and values does your character hold dear?"
                rows={3}
              />
              <small className="field-note">What principles guide your character?</small>
            </div>

            <div className="form-group full-width">
              <label htmlFor="quirks">Quirks</label>
              <textarea
                id="quirks"
                name="quirks"
                value={formData.quirks}
                onChange={handleInputChange}
                className="form-textarea"
                placeholder="Unique habits, behaviors, or characteristics"
                rows={3}
              />
              <small className="field-note">Unique habits or characteristics</small>
            </div>
          </div>
        </div>
        


        {/* Secrets Section */}
        <div className="form-section">
          <h2 className="section-title">Secrets</h2>
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
                      <i className="fas fa-trash-alt"></i> Remove
                    </button>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>Title</label>
                      <input
                        type="text"
                        value={secret.title || ''}
                        onChange={(e) => handleSecretChange(secret.id, 'title', e.target.value)}
                        className="form-input"
                        placeholder="Secret Title"
                      />
                    </div>

                    <div className="form-group full-width">
                      <label>Description</label>
                      <textarea
                        value={secret.description || ''}
                        onChange={(e) => handleSecretChange(secret.id, 'description', e.target.value)}
                        className="form-textarea"
                        placeholder="Describe the secret"
                        rows={3}
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

          <button
            type="button"
            className="add-secret-button"
            onClick={handleAddSecret}
          >
            <i className="fas fa-plus"></i> Add Secret
          </button>
        </div>

        {/* Relations Section */}
        <div className="form-section">
          <h2 className="section-title">Relations</h2>
          <p className="section-description">Add relationships with other trainers and their monsters.</p>

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
                      <i className="fas fa-trash-alt"></i> Remove
                    </button>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>Relation Type</label>
                      <select
                        value={relation.type || 'trainer'}
                        onChange={(e) => handleRelationChange(relation.id, 'type', e.target.value)}
                        className="form-input"
                      >
                        <option value="trainer">Trainer Relation</option>
                        <option value="monster">Monster Relation</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Relationship Name</label>
                      <input
                        type="text"
                        value={relation.name || ''}
                        onChange={(e) => handleRelationChange(relation.id, 'name', e.target.value)}
                        className="form-input"
                        placeholder={relation.type === 'monster' ? "e.g., Partner, Rival, Feared" : "e.g., Friend, Rival, Mentor"}
                      />
                    </div>

                    <div className="form-group full-width">
                      <label>Elaboration</label>
                      <textarea
                        value={relation.elaboration || ''}
                        onChange={(e) => handleRelationChange(relation.id, 'elaboration', e.target.value)}
                        className="form-textarea"
                        placeholder={relation.type === 'monster' ? "Describe how they interact with this monster" : "Describe how they interact with this trainer"}
                        rows={3}
                      ></textarea>
                      <small className="field-note">Note: Specific trainer/monster selection will be available after trainer creation</small>
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

          <button
            type="button"
            className="add-relation-button"
            onClick={handleAddRelation}
          >
            <i className="fas fa-plus"></i> Add Relation
          </button>
        </div>

        {/* Additional References Section */}
        <div className="form-section">
          <h2 className="section-title">Additional References</h2>

          {additionalRefs.map((ref, index) => (
            <div key={index} className="additional-ref-item">
              <div className="additional-ref-header">
                <h3>Reference {index + 1}</h3>
                {index > 0 && (
                  <button
                    type="button"
                    className="remove-ref-button"
                    onClick={() => handleRemoveAdditionalRef(index)}
                  >
                    <i className="fas fa-trash"></i> Remove
                  </button>
                )}
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor={`ref-title-${index}`}>Title</label>
                  <input
                    type="text"
                    id={`ref-title-${index}`}
                    value={ref.title}
                    onChange={(e) => handleAdditionalRefChange(index, 'title', e.target.value)}
                    className="form-input"
                    placeholder="Enter reference title"
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor={`ref-description-${index}`}>Description</label>
                  <textarea
                    id={`ref-description-${index}`}
                    value={ref.description}
                    onChange={(e) => handleAdditionalRefChange(index, 'description', e.target.value)}
                    className="form-textarea"
                    placeholder="Enter reference description"
                    rows={3}
                  />
                </div>

                <div className="form-group full-width">
                  <label>Image URL</label>
                  <input
                    type="url"
                    value={ref.image_url}
                    onChange={(e) => handleAdditionalRefChange(index, 'image_url', e.target.value)}
                    className="form-input"
                    placeholder="Enter image URL"
                  />
                  <small className="field-note">Enter a direct URL to the reference image</small>
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            className="add-ref-button"
            onClick={handleAddAdditionalRef}
          >
            <i className="fas fa-plus"></i> Add Another Reference
          </button>
        </div>

        {/* Starter Note Section */}
        <div className="form-section">
          <h2 className="section-title">Starter Monster</h2>
          <div className="starter-note">
            <p>
              <i className="fas fa-info-circle"></i> After creating your trainer, you'll be redirected to select your starter monster.
            </p>
          </div>
        </div>

        <div className="form-actions" ref={submitRef}>
          <Link to="/profile/trainers" className="button secondary">
            Cancel
          </Link>
          <button
            type="submit"
            className="button success"
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Creating...
              </>
            ) : (
              'Create Trainer'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddTrainerPage;
