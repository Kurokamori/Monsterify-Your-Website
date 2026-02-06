import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import ErrorMessage from '../../../components/common/ErrorMessage';
import api from '../../../services/api';

const Nursery = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('hatch'); // 'hatch', 'nurture'

  // Trainer and egg data
  const [userTrainers, setUserTrainers] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [trainerEggs, setTrainerEggs] = useState({});
  const [eggItems, setEggItems] = useState({});

  // Hatch/Nurture state
  const [eggCount, setEggCount] = useState(1);
  const [useIncubator, setUseIncubator] = useState(false);
  const [useVoidStone, setUseVoidStone] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imageMode, setImageMode] = useState('url'); // 'url' or 'upload'
  const [selectedItems, setSelectedItems] = useState({});
  // For species/type slot inputs for special items
  const [speciesInputs, setSpeciesInputs] = useState({});

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch user's trainers first
      const trainersResponse = await api.get(`/trainers/user/${currentUser.discord_id}`);
      setUserTrainers(trainersResponse.data.data || []);

      if (trainersResponse.data.data && trainersResponse.data.data.length > 0) {
        const firstTrainer = trainersResponse.data.data[0];
        setSelectedTrainer(firstTrainer.id);

        // Fetch eggs and items for the first trainer
        await fetchTrainerData(firstTrainer.id);
      }

    } catch (err) {
      console.error('Error fetching nursery data:', err);
      setError('Failed to load nursery data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser, fetchData]);

  const fetchTrainerData = async (trainerId) => {
    try {
      // Fetch trainer's eggs
      const eggsResponse = await api.get(`/nursery/eggs/${trainerId}`);
      setTrainerEggs(eggsResponse.data.eggs || {});

      // Fetch trainer's egg items
      const itemsResponse = await api.get(`/nursery/egg-items/${trainerId}`);
      setEggItems(itemsResponse.data.items || {});

    } catch (err) {
      console.error('Error fetching trainer data:', err);
    }
  };

  const handleTrainerChange = async (trainerId) => {
    setSelectedTrainer(trainerId);
    if (trainerId) {
      await fetchTrainerData(trainerId);
    }
  };

  const handleHatch = async () => {
    if (!selectedTrainer) {
      setError('Please select a trainer.');
      return;
    }

    const standardEggs = trainerEggs['Standard Egg'] || 0;
    if (standardEggs < eggCount) {
      setError(`Not enough Standard Eggs. You have ${standardEggs}, need ${eggCount}.`);
      return;
    }

    if (!useIncubator && !useVoidStone && !imageUrl && !imageFile) {
      setError('Either an incubator, void stone, artwork URL, or uploaded image is required for hatching.');
      return;
    }

    if (useIncubator) {
      const incubators = trainerEggs['Incubator'] || 0;
      if (incubators < eggCount) {
        setError(`Not enough Incubators. You have ${incubators}, need ${eggCount}.`);
        return;
      }
    }

    if (useVoidStone) {
      const voidStones = eggItems['Void Evolution Stone'] || 0;
      if (voidStones < eggCount) {
        setError(`Not enough Void Evolution Stones. You have ${voidStones}, need ${eggCount}.`);
        return;
      }
    }

    try {
      setLoading(true);

      // Create FormData for file upload support
      const formData = new FormData();
      formData.append('trainerId', selectedTrainer);
      formData.append('eggCount', eggCount);
      formData.append('useIncubator', useIncubator);
      formData.append('useVoidStone', useVoidStone);

      if (imageFile) {
        formData.append('imageFile', imageFile);
      } else if (imageUrl) {
        formData.append('imageUrl', imageUrl);
      }

      const response = await api.post('/nursery/hatch', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        // Navigate to hatch session page
        navigate(`/nursery/session/${response.data.sessionId}`);
      }
    } catch (err) {
      console.error('Error starting hatch:', err);
      setError(err.response?.data?.message || 'Failed to start hatching. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNurture = async () => {
    if (!selectedTrainer) {
      setError('Please select a trainer.');
      return;
    }

    const standardEggs = trainerEggs['Standard Egg'] || 0;
    if (standardEggs < eggCount) {
      setError(`Not enough Standard Eggs. You have ${standardEggs}, need ${eggCount}.`);
      return;
    }

    if (!useIncubator && !useVoidStone && !imageUrl && !imageFile) {
      setError('Either an incubator, void stone, artwork URL, or uploaded image is required for nurturing.');
      return;
    }

    if (useIncubator) {
      const incubators = trainerEggs['Incubator'] || 0;
      if (incubators < eggCount) {
        setError(`Not enough Incubators. You have ${incubators}, need ${eggCount}.`);
        return;
      }
    }

    if (useVoidStone) {
      const voidStones = eggItems['Void Evolution Stone'] || 0;
      if (voidStones < eggCount) {
        setError(`Not enough Void Evolution Stones. You have ${voidStones}, need ${eggCount}.`);
        return;
      }
    }

    try {
      setLoading(true);

      // Create FormData for file upload support
      const formData = new FormData();
      formData.append('trainerId', selectedTrainer);
      formData.append('eggCount', eggCount);
      formData.append('useIncubator', useIncubator);
      formData.append('useVoidStone', useVoidStone);
      formData.append('selectedItems', JSON.stringify(selectedItems));
      formData.append('speciesInputs', JSON.stringify(speciesInputs));

      if (imageFile) {
        formData.append('imageFile', imageFile);
      } else if (imageUrl) {
        formData.append('imageUrl', imageUrl);
      }

      const response = await api.post('/nursery/nurture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        // Navigate to nurture session page
        navigate(`/nursery/session/${response.data.sessionId}`);
      }
    } catch (err) {
      console.error('Error starting nurture:', err);
      setError(err.response?.data?.message || 'Failed to start nurturing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleItemQuantityChange = (itemName, quantity) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemName]: Math.max(0, Math.min(quantity, eggItems[itemName] || 0))
    }));
  };

  const handleImageModeChange = (mode) => {
    setImageMode(mode);
    // Clear the other input when switching modes
    if (mode === 'url') {
      setImageFile(null);
    } else {
      setImageUrl('');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setError('Please select a valid image file (JPEG, PNG, GIF, or WebP).');
        return;
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > maxSize) {
        setError('Image file must be smaller than 10MB.');
        return;
      }

      setImageFile(file);
      setError(null); // Clear any previous errors
    }
  };





  if (!currentUser) {
    return <LoadingSpinner message="Authenticating..." />;
  }

  if (loading) {
    return <LoadingSpinner message="Loading nursery..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        message={error}
        onRetry={fetchData}
      />
    );
  }

  return (
    <div className="nursery-modern-container">
      {/* Hero Header */}
      <div className="nursery-hero">
        <div className="nursery-hero-background">
          <div className="nursery-hero-icon">
            <i className="fas fa-egg"></i>
          </div>
        </div>
        <div className="nursery-hero-content">
          <h1 className="nursery-title">Aurora Town Nursery</h1>
          <p className="nursery-subtitle">Where new life begins and dreams take flight</p>
          <div className="nursery-description">
            <p>Transform your precious eggs into magnificent monsters through the ancient arts of hatching and nurturing.</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="nursery-main-content">
        {/* Trainer Selection Card */}
        <div className="nursery-card trainer-selection-card">
          <div className="nursery-card-header">
            <h3><i className="fas fa-user-graduate"></i> Trainer Selection</h3>
            <span className="card-badge">Required</span>
          </div>
          <div className="nursery-card-body">
            <div className="trainer-select-container">
              <select
                className="modern-select"
                value={selectedTrainer}
                onChange={(e) => handleTrainerChange(e.target.value)}
              >
                <option value="">Choose your trainer...</option>
                {userTrainers.map((trainer) => (
                  <option key={trainer.id} value={trainer.id}>
                    {trainer.name}
                  </option>
                ))}
              </select>
              <i className="fas fa-chevron-down select-arrow"></i>
            </div>
          </div>
        </div>

        {selectedTrainer && (
          <>
            {/* Resources Overview */}
            <div className="nursery-card resources-card">
              <div className="nursery-card-header">
                <h3><i className="fas fa-inventory"></i> Your Resources</h3>
              </div>
              <div className="nursery-card-body">
                <div className="resources-grid">
                  <div className="resource-item">
                    <div className="resource-icon standard-egg">
                      <i className="fas fa-egg"></i>
                    </div>
                    <div className="resource-info">
                      <span className="resource-name">Standard Eggs</span>
                      <span className="resource-count">{trainerEggs['Standard Egg'] || 0}</span>
                    </div>
                  </div>
                  <div className="resource-item">
                    <div className="resource-icon incubator">
                      <i className="fas fa-fire"></i>
                    </div>
                    <div className="resource-info">
                      <span className="resource-name">Incubators</span>
                      <span className="resource-count">{trainerEggs['Incubator'] || 0}</span>
                    </div>
                  </div>
                  <div className="resource-item">
                    <div className="resource-icon void-stone">
                      <i className="fas fa-gem"></i>
                    </div>
                    <div className="resource-info">
                      <span className="resource-name">Void Stones</span>
                      <span className="resource-count">{eggItems['Void Evolution Stone'] || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Method Selection */}
            <div className="nursery-methods-container">
              <div className="method-selector">
                <button
                  className={`method-tab ${activeTab === 'hatch' ? 'active' : ''}`}
                  onClick={() => setActiveTab('hatch')}
                >
                  <div className="method-icon">
                    <i className="fas fa-magic"></i>
                  </div>
                  <div className="method-info">
                    <h4>Simple Hatch</h4>
                    <p>Quick and straightforward hatching</p>
                  </div>
                </button>

                <button
                  className={`method-tab ${activeTab === 'nurture' ? 'active' : ''}`}
                  onClick={() => setActiveTab('nurture')}
                >
                  <div className="method-icon">
                    <i className="fas fa-seedling"></i>
                  </div>
                  <div className="method-info">
                    <h4>Advanced Nurture</h4>
                    <p>Use items to influence outcomes</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Hatch Content */}
            {activeTab === 'hatch' && (
              <div className="nursery-card method-card">
                <div className="nursery-card-header">
                  <h3><i className="fas fa-magic"></i> Simple Hatching Process</h3>
                  <span className="method-badge hatch">Quick Method</span>
                </div>
                <div className="nursery-card-body">
                  <div className="method-description">
                    <p>The simple hatch method provides a straightforward approach to egg hatching with minimal configuration.</p>
                  </div>

                  <div className="form-section">
                    <div className="form-group modern-form-group">
                      <label className="form-label">
                        <i className="fas fa-hashtag"></i>
                        Number of Eggs
                      </label>
                      <div className="number-input-container">
                        <button 
                          type="button" 
                          className="button primary minus"
                          onClick={() => setEggCount(Math.max(1, eggCount - 1))}
                          disabled={eggCount <= 1}
                        >
                          <i className="fas fa-minus"></i>
                        </button>
                        <input
                          type="number"
                          className="modern-number-input"
                          min="1"
                          max="10"
                          value={eggCount}
                          onChange={(e) => setEggCount(parseInt(e.target.value) || 1)}
                        />
                        <button 
                          type="button" 
                          className="button primary plus"
                          onClick={() => setEggCount(Math.min(10, eggCount + 1))}
                          disabled={eggCount >= 10}
                        >
                          <i className="fas fa-plus"></i>
                        </button>
                      </div>
                    </div>

                    <div className="options-section">
                      <div className="checkbox-option modern-checkbox">
                        <input
                          type="checkbox"
                          id="use-incubator"
                          checked={useIncubator}
                          onChange={(e) => setUseIncubator(e.target.checked)}
                        />
                        <label htmlFor="use-incubator" className="checkbox-label">
                          <span className="checkbox-icon">
                            <i className="fas fa-fire"></i>
                          </span>
                          <div className="checkbox-text">
                            <span className="checkbox-title">Use Incubator</span>
                            <span className="checkbox-description">Bypass artwork requirements (uses {eggCount} incubator{eggCount > 1 ? 's' : ''})</span>
                          </div>
                        </label>
                      </div>

                      {!useIncubator && (
                        <div className="artwork-section">
                          <h5 className="section-title">
                            <i className="fas fa-palette"></i>
                            Artwork Inspiration
                          </h5>
                          <div className="artwork-tabs">
                            <button
                              type="button"
                              className={`artwork-tab ${imageMode === 'url' ? 'active' : ''}`}
                              onClick={() => handleImageModeChange('url')}
                            >
                              <i className="fas fa-link"></i>
                              URL
                            </button>
                            <button
                              type="button"
                              className={`artwork-tab ${imageMode === 'upload' ? 'active' : ''}`}
                              onClick={() => handleImageModeChange('upload')}
                            >
                              <i className="fas fa-upload"></i>
                              Upload
                            </button>
                          </div>

                          <div className="artwork-input-container">
                            {imageMode === 'url' ? (
                              <div className="url-input-container">
                                <i className="fas fa-globe input-icon"></i>
                                <input
                                  type="url"
                                  className="modern-text-input"
                                  value={imageUrl}
                                  onChange={(e) => setImageUrl(e.target.value)}
                                  placeholder="https://example.com/your-artwork.jpg"
                                />
                              </div>
                            ) : (
                              <div className="file-upload-modern">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleFileChange}
                                  className="file-input-hidden"
                                  id="hatch-image-upload"
                                />
                                <label htmlFor="hatch-image-upload" className="file-upload-modern-label">
                                  <div className="upload-icon">
                                    <i className="fas fa-cloud-upload-alt"></i>
                                  </div>
                                  <div className="upload-text">
                                    <span className="upload-title">
                                      {imageFile ? imageFile.name : 'Drop your artwork here'}
                                    </span>
                                    <span className="upload-subtitle">
                                      {imageFile 
                                        ? `${(imageFile.size / 1024 / 1024).toFixed(2)} MB`
                                        : 'or click to browse files'
                                      }
                                    </span>
                                  </div>
                                  {imageFile && (
                                    <button
                                      type="button"
                                      className="remove-file-modern"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        setImageFile(null);
                                      }}
                                    >
                                      <i className="fas fa-times"></i>
                                    </button>
                                  )}
                                </label>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="action-section">
                      <button
                        className="button primary"
                        onClick={handleHatch}
                        disabled={loading || !selectedTrainer}
                      >
                        <span className="icon">
                          {loading ? (
                            <i className="fas fa-spinner fa-spin"></i>
                          ) : (
                            <i className="fas fa-magic"></i>
                          )}
                        </span>
                        <span className="button-text">
                          {loading ? 'Hatching in Progress...' : 'Begin Hatching'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Nurture Content */}
            {activeTab === 'nurture' && (
              <div className="nursery-card method-card">
                <div className="nursery-card-header">
                  <h3><i className="fas fa-seedling"></i> Advanced Nurturing Process</h3>
                  <span className="method-badge nurture">Complex Method</span>
                </div>
                <div className="nursery-card-body">
                  <div className="method-description">
                    <p>The advanced nurturing method allows you to use various items and techniques to influence the hatching outcome.</p>
                  </div>

                  <div className="form-section">
                    <div className="form-group modern-form-group">
                      <label className="form-label">
                        <i className="fas fa-hashtag"></i>
                        Number of Eggs
                      </label>
                      <div className="number-input-container">
                        <button 
                          type="button" 
                          className="button primary minus"
                          onClick={() => setEggCount(Math.max(1, eggCount - 1))}
                          disabled={eggCount <= 1}
                        >
                          <i className="fas fa-minus"></i>
                        </button>
                        <input
                          type="number"
                          className="modern-number-input"
                          min="1"
                          max="10"
                          value={eggCount}
                          onChange={(e) => setEggCount(parseInt(e.target.value) || 1)}
                        />
                        <button 
                          type="button" 
                          className="button primary plus"
                          onClick={() => setEggCount(Math.min(10, eggCount + 1))}
                          disabled={eggCount >= 10}
                        >
                          <i className="fas fa-plus"></i>
                        </button>
                      </div>
                    </div>

                    <div className="options-section">
                      <div className="checkbox-option modern-checkbox">
                        <input
                          type="checkbox"
                          id="use-incubator-nurture"
                          checked={useIncubator}
                          onChange={(e) => setUseIncubator(e.target.checked)}
                        />
                        <label htmlFor="use-incubator-nurture" className="checkbox-label">
                          <span className="checkbox-icon">
                            <i className="fas fa-fire"></i>
                          </span>
                          <div className="checkbox-text">
                            <span className="checkbox-title">Use Incubator</span>
                            <span className="checkbox-description">Bypass artwork requirements (uses {eggCount} incubator{eggCount > 1 ? 's' : ''})</span>
                          </div>
                        </label>
                      </div>

                      {!useIncubator && (
                        <div className="artwork-section">
                          <h5 className="section-title">
                            <i className="fas fa-palette"></i>
                            Artwork Inspiration
                          </h5>
                          <div className="artwork-tabs">
                            <button
                              type="button"
                              className={`artwork-tab ${imageMode === 'url' ? 'active' : ''}`}
                              onClick={() => handleImageModeChange('url')}
                            >
                              <i className="fas fa-link"></i>
                              URL
                            </button>
                            <button
                              type="button"
                              className={`artwork-tab ${imageMode === 'upload' ? 'active' : ''}`}
                              onClick={() => handleImageModeChange('upload')}
                            >
                              <i className="fas fa-upload"></i>
                              Upload
                            </button>
                          </div>

                          <div className="artwork-input-container">
                            {imageMode === 'url' ? (
                              <div className="url-input-container">
                                <i className="fas fa-globe input-icon"></i>
                                <input
                                  type="url"
                                  className="modern-text-input"
                                  value={imageUrl}
                                  onChange={(e) => setImageUrl(e.target.value)}
                                  placeholder="https://example.com/your-artwork.jpg"
                                />
                              </div>
                            ) : (
                              <div className="file-upload-modern">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleFileChange}
                                  className="file-input-hidden"
                                  id="nurture-image-upload"
                                />
                                <label htmlFor="nurture-image-upload" className="file-upload-modern-label">
                                  <div className="upload-icon">
                                    <i className="fas fa-cloud-upload-alt"></i>
                                  </div>
                                  <div className="upload-text">
                                    <span className="upload-title">
                                      {imageFile ? imageFile.name : 'Drop your artwork here'}
                                    </span>
                                    <span className="upload-subtitle">
                                      {imageFile 
                                        ? `${(imageFile.size / 1024 / 1024).toFixed(2)} MB`
                                        : 'or click to browse files'
                                      }
                                    </span>
                                  </div>
                                  {imageFile && (
                                    <button
                                      type="button"
                                      className="remove-file-modern"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        setImageFile(null);
                                      }}
                                    >
                                      <i className="fas fa-times"></i>
                                    </button>
                                  )}
                                </label>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Item Selection */}
                    <div className="items-section">
                      <h5 className="section-title">
                        <i className="fas fa-flask"></i>
                        Nurturing Items
                      </h5>
                      <div className="items-grid">
                        {Object.entries(eggItems)
                          .filter(([itemName]) => itemName !== 'Incubator')
                          .map(([itemName, quantity]) => {
                          // Helper: render species/type slot inputs for special items
                          const renderSpecialInputs = () => {
                            // Species control items
                            if (itemName === 'Input Field' && selectedItems[itemName] > 0) {
                              return (
                                <div className="special-input-group">
                                  <label>Species 1:</label>
                                  <input
                                    type="text"
                                    className="special-input"
                                    value={speciesInputs.species1 || ''}
                                    onChange={e => setSpeciesInputs(inputs => ({ ...inputs, species1: e.target.value }))}
                                    placeholder="Enter species 1"
                                  />
                                </div>
                              );
                            }
                            if (itemName === 'Drop Down' && selectedItems[itemName] > 0) {
                              return (
                                <div className="special-input-group">
                                  <label>Species 1:</label>
                                  <input
                                    type="text"
                                    className="special-input"
                                    value={speciesInputs.species1 || ''}
                                    onChange={e => setSpeciesInputs(inputs => ({ ...inputs, species1: e.target.value }))}
                                    placeholder="Enter species 1"
                                  />
                                  <label>Species 2:</label>
                                  <input
                                    type="text"
                                    className="special-input"
                                    value={speciesInputs.species2 || ''}
                                    onChange={e => setSpeciesInputs(inputs => ({ ...inputs, species2: e.target.value }))}
                                    placeholder="Enter species 2"
                                  />
                                </div>
                              );
                            }
                            if (itemName === 'Radio Buttons' && selectedItems[itemName] > 0) {
                              return (
                                <div className="special-input-group">
                                  <label>Species 1:</label>
                                  <input
                                    type="text"
                                    className="special-input"
                                    value={speciesInputs.species1 || ''}
                                    onChange={e => setSpeciesInputs(inputs => ({ ...inputs, species1: e.target.value }))}
                                    placeholder="Enter species 1"
                                  />
                                  <label>Species 2:</label>
                                  <input
                                    type="text"
                                    className="special-input"
                                    value={speciesInputs.species2 || ''}
                                    onChange={e => setSpeciesInputs(inputs => ({ ...inputs, species2: e.target.value }))}
                                    placeholder="Enter species 2"
                                  />
                                  <label>Species 3:</label>
                                  <input
                                    type="text"
                                    className="special-input"
                                    value={speciesInputs.species3 || ''}
                                    onChange={e => setSpeciesInputs(inputs => ({ ...inputs, species3: e.target.value }))}
                                    placeholder="Enter species 3"
                                  />
                                </div>
                              );
                            }
                            // Ice Cream items: prompt for type slot
                            const iceCreamMap = {
                              'Vanilla Ice Cream': 'type1',
                              'Strawberry Ice Cream': 'type2',
                              'Chocolate Ice Cream': 'type3',
                              'Mint Ice Cream': 'type4',
                              'Pecan Ice Cream': 'type5'
                            };
                            if (iceCreamMap[itemName] && selectedItems[itemName] > 0) {
                              const typeKey = iceCreamMap[itemName];
                              return (
                                <div className="special-input-group">
                                  <label>{`Type Slot ${typeKey.replace('type', '')}:`}</label>
                                  <input
                                    type="text"
                                    className="special-input"
                                    value={speciesInputs[typeKey] || ''}
                                    onChange={e => setSpeciesInputs(inputs => ({ ...inputs, [typeKey]: e.target.value }))}
                                    placeholder={`Enter type for slot ${typeKey.replace('type', '')}`}
                                  />
                                </div>
                              );
                            }
                            return null;
                          };
                          return (
                            <div key={itemName} className="item-selection-card">
                              <div className="item-header">
                                <div className="item-icon">
                                  <i className="fas fa-vial"></i>
                                </div>
                                <div className="item-info">
                                  <span className="item-name">{itemName}</span>
                                  <span className="item-available">Available: {quantity}</span>
                                </div>
                              </div>
                              <div className="item-quantity-selector">
                                <button 
                                  type="button" 
                                  className="quantity-btn minus"
                                  onClick={() => handleItemQuantityChange(itemName, Math.max(0, (selectedItems[itemName] || 0) - 1))}
                                  disabled={!selectedItems[itemName] || selectedItems[itemName] <= 0}
                                >
                                  <i className="fas fa-minus"></i>
                                </button>
                                <input
                                  type="number"
                                  className="quantity-input"
                                  min="0"
                                  max={quantity}
                                  value={selectedItems[itemName] || 0}
                                  onChange={(e) => handleItemQuantityChange(itemName, parseInt(e.target.value) || 0)}
                                />
                                <button 
                                  type="button" 
                                  className="quantity-btn plus"
                                  onClick={() => handleItemQuantityChange(itemName, Math.min(quantity, (selectedItems[itemName] || 0) + 1))}
                                  disabled={(selectedItems[itemName] || 0) >= quantity}
                                >
                                  <i className="fas fa-plus"></i>
                                </button>
                              </div>
                              {/* Render special species/type slot inputs if needed */}
                              {renderSpecialInputs()}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="action-section">
                      <button
                        className="button primary"
                        onClick={handleNurture}
                        disabled={loading || !selectedTrainer}
                      >
                        <span className="icon">
                          {loading ? (
                            <i className="fas fa-spinner fa-spin"></i>
                          ) : (
                            <i className="fas fa-seedling"></i>
                          )}
                        </span>
                        <span className="button-text">
                          {loading ? 'Nurturing in Progress...' : 'Begin Nurturing'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Nursery;
