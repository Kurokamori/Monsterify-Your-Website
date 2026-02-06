import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import submissionService from '../../services/submissionService';
import trainerService from '../../services/trainerService';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import GiftRewards from './GiftRewards';


const TrainerMegaReferenceSubmissionForm = ({ onSubmissionComplete }) => {
  const { currentUser } = useAuth();

  // Form state
  const [references, setReferences] = useState([{
    trainerId: '',
    referenceUrl: '',
    referenceFile: null,
    referencePreview: '',
    customLevels: 0,
    useCustomLevels: false,
    // Mega info fields (optional)
    megaArtist: '',
    megaSpecies1: '',
    megaSpecies2: '',
    megaSpecies3: '',
    megaType1: '',
    megaType2: '',
    megaType3: '',
    megaType4: '',
    megaType5: '',
    megaType6: '',
    megaAbility: ''
  }]);

  const [userTrainers, setUserTrainers] = useState([]);
  const [userMonsters, setUserMonsters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Gift rewards state
  const [showGiftRewards, setShowGiftRewards] = useState(false);
  const [giftLevels, setGiftLevels] = useState(0);
  const [submissionResult, setSubmissionResult] = useState(null);

  // Type options for the mega form
  const typeOptions = [
    '', 'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison',
    'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'
  ];

  // Fetch user's trainers and monsters on component mount
  useEffect(() => {
    const fetchTrainersAndMonsters = async () => {
      try {
        const response = await trainerService.getUserTrainers(currentUser?.discord_id);
        setUserTrainers(response.trainers || []);

        // Fetch ALL monsters for ALL user trainers (for gift rewards)
        if (response.trainers && response.trainers.length > 0) {
          const allMonsters = [];

          for (const trainer of response.trainers) {
            try {
              // Fetch monsters for this trainer with high limit to get all
              const monstersResponse = await trainerService.getTrainerMonsters(trainer.id, { limit: 1000 });
              if (monstersResponse.monsters) {
                allMonsters.push(...monstersResponse.monsters);
              }
            } catch (monsterErr) {
              console.error(`Error fetching monsters for trainer ${trainer.id}:`, monsterErr);
            }
          }

          setUserMonsters(allMonsters);
          console.log(`Loaded ${allMonsters.length} total monsters for gift rewards`);
        }
      } catch (err) {
        console.error('Error fetching trainers:', err);
        setError('Failed to load trainers. Please try again.');
      }
    };

    if (currentUser?.discord_id && !loading) {
      fetchTrainersAndMonsters();
    }
  }, [currentUser]);

  // Add a new reference entry
  const addReference = () => {
    setReferences([
      ...references,
      {
        trainerId: '',
        referenceUrl: '',
        referenceFile: null,
        referencePreview: '',
        customLevels: 0,
        useCustomLevels: false,
        megaArtist: '',
        megaSpecies1: '',
        megaSpecies2: '',
        megaSpecies3: '',
        megaType1: '',
        megaType2: '',
        megaType3: '',
        megaType4: '',
        megaType5: '',
        megaType6: '',
        megaAbility: ''
      }
    ]);
  };

  // Remove a reference entry
  const removeReference = (index) => {
    const newReferences = [...references];
    newReferences.splice(index, 1);
    setReferences(newReferences);
  };

  // Handle reference field changes
  const handleReferenceChange = (index, field, value) => {
    const newReferences = [...references];
    newReferences[index][field] = value;
    setReferences(newReferences);
  };

  // Handle file upload
  const handleFileUpload = (index, file) => {
    if (file) {
      const newReferences = [...references];
      newReferences[index].referenceFile = file;
      newReferences[index].referenceUrl = '';
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      newReferences[index].referencePreview = previewUrl;
      
      setReferences(newReferences);
    }
  };

  // Handle URL input
  const handleUrlChange = (index, url) => {
    const newReferences = [...references];
    newReferences[index].referenceUrl = url;
    newReferences[index].referenceFile = null;
    newReferences[index].referencePreview = url;
    setReferences(newReferences);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate references
      const validReferences = references.filter(ref => 
        ref.trainerId && (ref.referenceUrl || ref.referenceFile)
      );

      if (validReferences.length === 0) {
        throw new Error('Please provide at least one trainer mega reference with a trainer and image.');
      }

      // Create FormData for submission
      const formData = new FormData();
      formData.append('title', 'Trainer Mega Reference Submission');
      formData.append('description', 'Submitted trainer mega reference images');
      formData.append('contentType', 'image');
      formData.append('submissionType', 'reference');
      formData.append('referenceType', 'trainer mega');
      formData.append('referenceCount', validReferences.length.toString());

      // Add each reference to FormData
      validReferences.forEach((reference, index) => {
        formData.append(`trainerId_${index}`, reference.trainerId);
        
        if (reference.referenceFile) {
          formData.append(`referenceFile_${index}`, reference.referenceFile);
        } else if (reference.referenceUrl) {
          formData.append(`referenceUrl_${index}`, reference.referenceUrl);
        }

        if (reference.useCustomLevels && reference.customLevels > 0) {
          formData.append(`customLevels_${index}`, reference.customLevels.toString());
        }

        // Add mega info fields (optional)
        if (reference.megaArtist) formData.append(`megaArtist_${index}`, reference.megaArtist);
        if (reference.megaSpecies1) formData.append(`megaSpecies1_${index}`, reference.megaSpecies1);
        if (reference.megaSpecies2) formData.append(`megaSpecies2_${index}`, reference.megaSpecies2);
        if (reference.megaSpecies3) formData.append(`megaSpecies3_${index}`, reference.megaSpecies3);
        if (reference.megaType1) formData.append(`megaType1_${index}`, reference.megaType1);
        if (reference.megaType2) formData.append(`megaType2_${index}`, reference.megaType2);
        if (reference.megaType3) formData.append(`megaType3_${index}`, reference.megaType3);
        if (reference.megaType4) formData.append(`megaType4_${index}`, reference.megaType4);
        if (reference.megaType5) formData.append(`megaType5_${index}`, reference.megaType5);
        if (reference.megaType6) formData.append(`megaType6_${index}`, reference.megaType6);
        if (reference.megaAbility) formData.append(`megaAbility_${index}`, reference.megaAbility);
      });

      // Submit the form
      const result = await submissionService.submitReference(formData);

      // Check if there are gift levels to distribute
      const totalGiftLevels = result.totalGiftLevels || result.rewards?.totalGiftLevels || 0;

      if (totalGiftLevels > 0) {
        // Show gift rewards interface
        setGiftLevels(totalGiftLevels);
        setSubmissionResult(result);
        setShowGiftRewards(true);
        console.log('Gift levels detected for reference submission:', {
          totalGiftLevels,
          giftItems: result.rewards?.giftItems?.length || 0,
          giftMonsters: result.rewards?.giftMonsters?.length || 0
        });
      } else {
        // No gift levels, proceed with normal completion
        handleSubmissionComplete(result);
      }
    } catch (err) {
      console.error('Error submitting trainer mega reference:', err);
      setError(err.message || 'Failed to submit trainer mega reference. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to handle submission completion
  const handleSubmissionComplete = (result) => {
    // Reset form
    setReferences([{
      trainerId: '',
      referenceUrl: '',
      referenceFile: null,
      referencePreview: '',
      customLevels: 0,
      useCustomLevels: false,
      megaArtist: '',
      megaSpecies1: '',
      megaSpecies2: '',
      megaSpecies3: '',
      megaType1: '',
      megaType2: '',
      megaType3: '',
      megaType4: '',
      megaType5: '',
      megaType6: '',
      megaAbility: ''
    }]);

    setSuccess(`Successfully submitted trainer mega reference(s)!`);
    
    // Notify parent component
    if (onSubmissionComplete) {
      onSubmissionComplete(result);
    }
  };

  // Handle gift rewards completion
  const handleGiftRewardsComplete = (giftRewardsResult) => {
    setShowGiftRewards(false);
    handleSubmissionComplete(submissionResult);
  };

  // Handle gift rewards cancellation
  const handleGiftRewardsCancel = () => {
    setShowGiftRewards(false);
    handleSubmissionComplete(submissionResult);
  };

  return (
    <div className="submission-form-container">
      <div className="submission-form-header">
        <h2>Submit Trainer Mega Reference</h2>
        <p>Submit reference images for trainer mega evolutions. You can optionally fill out the mega information for convenience.</p>
      </div>

      {error && <ErrorMessage message={error} />}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit} className="submission-form">
        {references.map((reference, index) => (
          <div key={index} className="reference-entry">
            <div className="reference-header">
              <h3>Trainer Mega Reference {index + 1}</h3>
              {references.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeReference(index)}
                  className="button danger sm"
                >
                  Remove
                </button>
              )}
            </div>

            {/* Trainer Selection */}
            <div className="form-group">
              <label htmlFor={`trainerId_${index}`}>Trainer *</label>
              <select
                id={`trainerId_${index}`}
                value={reference.trainerId}
                onChange={(e) => handleReferenceChange(index, 'trainerId', e.target.value)}
                required
              >
                <option value="">Select a trainer...</option>
                {userTrainers.map(trainer => (
                  <option key={trainer.id} value={trainer.id}>
                    {trainer.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Reference Image */}
            <div className="form-group">
              <label>Trainer Mega Reference Image *</label>
              <div className="image-upload-section">
                <div className="upload-options">
                  <div className="upload-option">
                    <label htmlFor={`file-${index}`} className="file-upload-label">
                      <i className="fas fa-upload"></i> Upload Image
                    </label>
                    <input
                      id={`file-${index}`}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(index, e.target.files[0])}
                      className="file-input"
                    />
                  </div>
                  <div className="upload-divider">OR</div>
                  <div className="url-option">
                    <input
                      type="url"
                      value={reference.referenceUrl}
                      onChange={(e) => handleUrlChange(index, e.target.value)}
                      placeholder="Enter image URL..."
                      className="url-input"
                    />
                  </div>
                </div>

                {/* Image Preview */}
                {reference.referencePreview && (
                  <div className="image-container medium">
                    <img src={reference.referencePreview} alt="Trainer mega reference preview" />
                    <div className="image-preview-overlay">
                      <span className="image-preview-label">Preview</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Custom Levels */}
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={reference.useCustomLevels}
                  onChange={(e) => handleReferenceChange(index, 'useCustomLevels', e.target.checked)}
                />
                Use custom level reward (default: 9 levels)
              </label>
              {reference.useCustomLevels && (
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={reference.customLevels}
                  onChange={(e) => handleReferenceChange(index, 'customLevels', parseInt(e.target.value) || 0)}
                  placeholder="Custom levels"
                />
              )}
            </div>

            {/* Mega Information (Optional) */}
            <div className="mega-info-section">
              <h4>Mega Information (Optional)</h4>
              <p className="section-description">Fill out these fields for convenience. This information will be stored with your trainer.</p>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor={`megaArtist_${index}`}>Mega Artist</label>
                  <input
                    type="text"
                    id={`megaArtist_${index}`}
                    value={reference.megaArtist}
                    onChange={(e) => handleReferenceChange(index, 'megaArtist', e.target.value)}
                    placeholder="Artist name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor={`megaAbility_${index}`}>Mega Ability</label>
                  <input
                    type="text"
                    id={`megaAbility_${index}`}
                    value={reference.megaAbility}
                    onChange={(e) => handleReferenceChange(index, 'megaAbility', e.target.value)}
                    placeholder="Ability name"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor={`megaSpecies1_${index}`}>Species 1</label>
                  <input
                    type="text"
                    id={`megaSpecies1_${index}`}
                    value={reference.megaSpecies1}
                    onChange={(e) => handleReferenceChange(index, 'megaSpecies1', e.target.value)}
                    placeholder="Primary species"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor={`megaSpecies2_${index}`}>Species 2</label>
                  <input
                    type="text"
                    id={`megaSpecies2_${index}`}
                    value={reference.megaSpecies2}
                    onChange={(e) => handleReferenceChange(index, 'megaSpecies2', e.target.value)}
                    placeholder="Secondary species"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor={`megaSpecies3_${index}`}>Species 3</label>
                  <input
                    type="text"
                    id={`megaSpecies3_${index}`}
                    value={reference.megaSpecies3}
                    onChange={(e) => handleReferenceChange(index, 'megaSpecies3', e.target.value)}
                    placeholder="Tertiary species"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor={`megaType1_${index}`}>Type 1</label>
                  <select
                    id={`megaType1_${index}`}
                    value={reference.megaType1}
                    onChange={(e) => handleReferenceChange(index, 'megaType1', e.target.value)}
                  >
                    {typeOptions.map(type => (
                      <option key={type} value={type}>{type || 'Select type...'}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor={`megaType2_${index}`}>Type 2</label>
                  <select
                    id={`megaType2_${index}`}
                    value={reference.megaType2}
                    onChange={(e) => handleReferenceChange(index, 'megaType2', e.target.value)}
                  >
                    {typeOptions.map(type => (
                      <option key={type} value={type}>{type || 'Select type...'}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor={`megaType3_${index}`}>Type 3</label>
                  <select
                    id={`megaType3_${index}`}
                    value={reference.megaType3}
                    onChange={(e) => handleReferenceChange(index, 'megaType3', e.target.value)}
                  >
                    {typeOptions.map(type => (
                      <option key={type} value={type}>{type || 'Select type...'}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor={`megaType4_${index}`}>Type 4</label>
                  <select
                    id={`megaType4_${index}`}
                    value={reference.megaType4}
                    onChange={(e) => handleReferenceChange(index, 'megaType4', e.target.value)}
                  >
                    {typeOptions.map(type => (
                      <option key={type} value={type}>{type || 'Select type...'}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor={`megaType5_${index}`}>Type 5</label>
                  <select
                    id={`megaType5_${index}`}
                    value={reference.megaType5}
                    onChange={(e) => handleReferenceChange(index, 'megaType5', e.target.value)}
                  >
                    {typeOptions.map(type => (
                      <option key={type} value={type}>{type || 'Select type...'}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor={`megaType6_${index}`}>Type 6</label>
                  <select
                    id={`megaType6_${index}`}
                    value={reference.megaType6}
                    onChange={(e) => handleReferenceChange(index, 'megaType6', e.target.value)}
                  >
                    {typeOptions.map(type => (
                      <option key={type} value={type}>{type || 'Select type...'}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        ))}

        <div className="form-actions">
          <button
            type="button"
            onClick={addReference}
            className="button secondary"
          >
            Add Another Reference
          </button>

          <button
            type="submit"
            disabled={loading}
            className="button primary"
          >
            {loading ? <LoadingSpinner /> : 'Submit Trainer Mega References'}
          </button>
        </div>
      </form>

      {showGiftRewards && (
        <GiftRewards
          giftLevels={giftLevels}
          userTrainers={userTrainers}
          userMonsters={userMonsters}
          onComplete={handleGiftRewardsComplete}
          onCancel={handleGiftRewardsCancel}
          submissionType="reference"
        />
      )}
    </div>
  );
};

export default TrainerMegaReferenceSubmissionForm;