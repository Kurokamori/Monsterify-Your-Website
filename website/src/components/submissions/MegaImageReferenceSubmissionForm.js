import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import submissionService from '../../services/submissionService';
import trainerService from '../../services/trainerService';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import GiftRewards from './GiftRewards';


const MegaImageReferenceSubmissionForm = ({ onSubmissionComplete }) => {
  const { currentUser } = useAuth();

  // Form state
  const [references, setReferences] = useState([{
    trainerId: '',
    monsterName: '',
    referenceUrl: '',
    referenceFile: null,
    referencePreview: '',
    customLevels: 0,
    useCustomLevels: false
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
        monsterName: '',
        referenceUrl: '',
        referenceFile: null,
        referencePreview: '',
        customLevels: 0,
        useCustomLevels: false
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
    setError(null);
    setSuccess(null);

    // Validate references
    const validReferences = references.filter(ref => 
      ref.trainerId && 
      ref.monsterName && 
      (ref.referenceUrl || ref.referenceFile)
    );

    if (validReferences.length === 0) {
      setError('Please provide at least one complete reference with trainer, monster name, and image.');
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append('referenceType', 'mega image');

      // Add references
      validReferences.forEach((ref, index) => {
        formData.append(`trainerId_${index}`, ref.trainerId);
        formData.append(`monsterName_${index}`, ref.monsterName);

        if (ref.referenceFile) {
          formData.append(`referenceFile_${index}`, ref.referenceFile);
        } else if (ref.referenceUrl) {
          formData.append(`referenceUrl_${index}`, ref.referenceUrl);
        }

        if (ref.useCustomLevels) {
          formData.append(`customLevels_${index}`, ref.customLevels);
        }
      });

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
      console.error('Error submitting mega image references:', err);
      setError(err.response?.data?.message || 'Failed to submit references. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to handle submission completion
  const handleSubmissionComplete = (result) => {
    // Reset form
    setReferences([{
      trainerId: '',
      monsterName: '',
      referenceUrl: '',
      referenceFile: null,
      referencePreview: '',
      customLevels: 0,
      useCustomLevels: false
    }]);

    setSuccess('Mega image references submitted successfully!');
    
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

  if (loading && userTrainers.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="submission-form-container">
      <div className="submission-form-header">
        <h2>Mega Image Reference Submission</h2>
        <p>Submit mega evolution images for your monsters. These will be displayed in the mega evolution section of your monster's profile.</p>
      </div>

      {error && <ErrorMessage message={error} />}
      {success && (
        <div className="success-message">
          <i className="fas fa-check-circle"></i> {success}
        </div>
      )}

      <form className="submission-form" onSubmit={handleSubmit}>
        {/* Reference Entries */}
        <div className="form-section">
          <h3>Mega Image References</h3>
          <p className="form-description">
            Submit mega evolution images for your monsters. These images will be used to display your monster's mega evolution form.
          </p>

          {references.map((reference, index) => (
            <div key={index} className="reference-entry">
              <div className="reference-header">
                <h4>Reference #{index + 1}</h4>
                {index > 0 && (
                  <button
                    type="button"
                    className="button danger icon"
                    onClick={() => removeReference(index)}
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor={`trainer-${index}`}>Trainer</label>
                  <select
                    id={`trainer-${index}`}
                    value={reference.trainerId}
                    onChange={(e) => handleReferenceChange(index, 'trainerId', e.target.value)}
                    required
                  >
                    <option value="">Select a trainer</option>
                    {userTrainers.map(trainer => (
                      <option key={trainer.id} value={trainer.id}>
                        {trainer.name} (Lv. {trainer.level})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor={`monster-name-${index}`}>Monster Name</label>
                  <input
                    id={`monster-name-${index}`}
                    type="text"
                    value={reference.monsterName}
                    onChange={(e) => handleReferenceChange(index, 'monsterName', e.target.value)}
                    placeholder="Enter monster name"
                    required
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div className="form-group">
                <label>Mega Evolution Image</label>
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
                    <div className="upload-option">
                      <input
                        type="url"
                        placeholder="Enter image URL"
                        value={reference.referenceUrl}
                        onChange={(e) => handleUrlChange(index, e.target.value)}
                        className="url-input"
                      />
                    </div>
                  </div>

                  {/* Image Preview */}
                  {reference.referencePreview && (
                    <div className="image-container medium">
                      <img src={reference.referencePreview} alt="Mega evolution preview" />
                    </div>
                  )}
                </div>
              </div>

              {/* Custom Levels */}
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={reference.useCustomLevels}
                    onChange={(e) => handleReferenceChange(index, 'useCustomLevels', e.target.checked)}
                  />
                  Use custom level reward
                </label>
                {reference.useCustomLevels && (
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={reference.customLevels}
                    onChange={(e) => handleReferenceChange(index, 'customLevels', parseInt(e.target.value) || 0)}
                    placeholder="Custom levels (1-50)"
                    className="custom-levels-input"
                  />
                )}
              </div>
            </div>
          ))}

          <button
            type="button"
            className="button primary"
            onClick={addReference}
          >
            <i className="fas fa-plus"></i> Add Another Reference
          </button>
        </div>

        {/* Submit Button */}
        <div className="form-actions">
          <button
            type="submit"
            className="button success"
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Submitting...
              </>
            ) : (
              <>
                <i className="fas fa-paper-plane"></i> Submit References
              </>
            )}
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

export default MegaImageReferenceSubmissionForm;
