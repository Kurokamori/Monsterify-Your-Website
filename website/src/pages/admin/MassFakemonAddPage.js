import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import fakemonService from '../../services/fakemonService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import '../../styles/AdminStyles.css';

/**
 * Mass Fakemon Add Page
 * Allows bulk uploading of fakemon with image uploads
 */
const MassFakemonAddPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Data from API
  const [types, setTypes] = useState([]);
  const [existingCategories, setExistingCategories] = useState([]);
  const [usedNumbersByCategory, setUsedNumbersByCategory] = useState({});

  // Fakemon cards state
  const [fakemonCards, setFakemonCards] = useState([]);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const attributes = ['Normal', 'Mega', 'Legendary', 'Mythical', 'Ultra Beast'];

  // Fetch types and categories on mount
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [typesResponse, categoriesResponse] = await Promise.all([
        fakemonService.getAllTypes(),
        fakemonService.getAllCategories()
      ]);

      setTypes(typesResponse.types || []);
      setExistingCategories(categoriesResponse.categories || []);
    } catch (err) {
      console.error('Error fetching initial data:', err);
      setError('Failed to load initial data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch numbers for a specific category
  const fetchNumbersForCategory = async (category) => {
    if (!category || usedNumbersByCategory[category]) return;

    try {
      const response = await fakemonService.getNumbersByCategory(category);
      setUsedNumbersByCategory(prev => ({
        ...prev,
        [category]: response.numbers || []
      }));
    } catch (err) {
      console.error(`Error fetching numbers for category ${category}:`, err);
    }
  };

  // Handle file selection
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    const newCards = [];
    const totalFiles = files.length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file type
      if (!file.type.startsWith('image/')) {
        continue;
      }

      try {
        // Create FormData for upload
        const formData = new FormData();
        formData.append('image', file);

        // Upload to backend
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:4890/api';
        const token = localStorage.getItem('token');

        const response = await fetch(`${apiUrl}/fakedex/admin/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        const result = await response.json();

        if (result.success && result.data?.url) {
          newCards.push({
            id: Date.now() + i,
            image_url: result.data.url,
            number: '',
            name: file.name.replace(/\.[^/.]+$/, ''), // Use filename without extension as default name
            category: '',
            types: [''],
            attribute: '',
            errors: {}
          });
        }
      } catch (err) {
        console.error(`Error uploading ${file.name}:`, err);
      }

      setUploadProgress(Math.round(((i + 1) / totalFiles) * 100));
    }

    setFakemonCards(prev => [...prev, ...newCards]);
    setUploading(false);
    setUploadProgress(0);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Update a specific card field
  const updateCard = (cardId, field, value) => {
    setFakemonCards(prev => prev.map(card => {
      if (card.id !== cardId) return card;

      const updated = { ...card, [field]: value };

      // If category changed, fetch numbers for that category
      if (field === 'category' && value) {
        fetchNumbersForCategory(value);
      }

      // Clear error for this field
      if (updated.errors[field]) {
        updated.errors = { ...updated.errors };
        delete updated.errors[field];
      }

      return updated;
    }));
  };

  // Update type at specific index
  const updateType = (cardId, typeIndex, value) => {
    setFakemonCards(prev => prev.map(card => {
      if (card.id !== cardId) return card;

      const newTypes = [...card.types];
      newTypes[typeIndex] = value;

      return {
        ...card,
        types: newTypes,
        errors: { ...card.errors, types: undefined }
      };
    }));
  };

  // Add type slot to card
  const addTypeSlot = (cardId) => {
    setFakemonCards(prev => prev.map(card => {
      if (card.id !== cardId) return card;
      if (card.types.length >= 5) return card;

      return {
        ...card,
        types: [...card.types, '']
      };
    }));
  };

  // Remove type slot from card
  const removeTypeSlot = (cardId, typeIndex) => {
    setFakemonCards(prev => prev.map(card => {
      if (card.id !== cardId) return card;
      if (card.types.length <= 1) return card;

      const newTypes = card.types.filter((_, i) => i !== typeIndex);
      return {
        ...card,
        types: newTypes
      };
    }));
  };

  // Remove a card
  const removeCard = (cardId) => {
    setFakemonCards(prev => prev.filter(card => card.id !== cardId));
  };

  // Validate a single card
  const validateCard = (card) => {
    const errors = {};

    if (!card.number) {
      errors.number = 'Number is required';
    } else {
      // Check if number is already used in this category
      const usedNumbers = usedNumbersByCategory[card.category] || [];
      if (usedNumbers.includes(parseInt(card.number)) || usedNumbers.includes(card.number)) {
        errors.number = `Number ${card.number} already exists in "${card.category}"`;
      }

      // Check if number is duplicated in current batch
      const duplicateInBatch = fakemonCards.filter(c =>
        c.id !== card.id &&
        c.number === card.number &&
        c.category === card.category
      );
      if (duplicateInBatch.length > 0) {
        errors.number = `Number ${card.number} is duplicated in this batch`;
      }
    }

    if (!card.name) {
      errors.name = 'Name is required';
    }

    if (!card.category) {
      errors.category = 'Category is required';
    }

    const validTypes = card.types.filter(t => t && t.trim() !== '');
    if (validTypes.length === 0) {
      errors.types = 'At least one type is required';
    }

    return errors;
  };

  // Validate all cards
  const validateAllCards = () => {
    let hasErrors = false;

    setFakemonCards(prev => prev.map(card => {
      const errors = validateCard(card);
      if (Object.keys(errors).length > 0) {
        hasErrors = true;
      }
      return { ...card, errors };
    }));

    return !hasErrors;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (fakemonCards.length === 0) {
      setError('Please upload at least one image first');
      return;
    }

    if (!validateAllCards()) {
      setError('Please fix the errors in the cards before submitting');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Prepare data for API
      const fakemonList = fakemonCards.map(card => {
        const validTypes = card.types.filter(t => t && t.trim() !== '');
        return {
          number: card.number,
          name: card.name,
          category: card.category,
          type1: validTypes[0] || null,
          type2: validTypes[1] || null,
          type3: validTypes[2] || null,
          type4: validTypes[3] || null,
          type5: validTypes[4] || null,
          attribute: card.attribute || null,
          image_url: card.image_url
        };
      });

      const response = await fakemonService.bulkCreateFakemon(fakemonList);

      if (response.success) {
        const createdCount = response.created?.length || 0;
        const errorCount = response.errors?.length || 0;

        if (errorCount > 0) {
          // Some errors occurred
          setError(`Created ${createdCount} fakemon, but ${errorCount} failed. Check the console for details.`);
          console.error('Bulk creation errors:', response.errors);

          // Remove successfully created cards
          const createdNumbers = response.created.map(c => c.number);
          setFakemonCards(prev => prev.filter(card => !createdNumbers.includes(card.number)));
        } else {
          // All successful
          setSuccessMessage(`Successfully created ${createdCount} fakemon!`);
          setTimeout(() => {
            navigate('/admin/fakemon', {
              state: { successMessage: `Successfully created ${createdCount} fakemon!` }
            });
          }, 1500);
        }
      }
    } catch (err) {
      console.error('Error submitting fakemon:', err);
      setError(`Failed to create fakemon: ${err.response?.data?.message || err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading..." />;
  }

  return (
    <div className="container">
      <div className="admin-dashboard">
        <div className="admin-dashboard-header">
          <h1 className="admin-dashboard-title">Mass Fakemon Addition</h1>
          <p className="admin-dashboard-subtitle">
            Upload multiple images and fill in details for each fakemon
          </p>
        </div>

        {/* Messages */}
        {successMessage && (
          <div className="admin-alert success">
            <i className="fas fa-check-circle"></i> {successMessage}
          </div>
        )}

        {error && (
          <div className="admin-alert error">
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="admin-actions">
          <Link to="/admin/fakemon" className="admin-button secondary">
            <i className="fas fa-arrow-left"></i> Back to Fakemon List
          </Link>
        </div>

        {/* Upload Section */}
        <div className="admin-form-section">
          <h2 className="admin-form-section-title">
            <i className="fas fa-upload"></i> Upload Images
          </h2>
          <p className="admin-form-hint">
            Select multiple images to create fakemon cards. Each image will become a separate fakemon entry.
          </p>

          <div className="mass-upload-area">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              disabled={uploading || submitting}
            />

            <button
              type="button"
              className="admin-button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || submitting}
            >
              <i className="fas fa-images"></i> Select Images
            </button>

            {uploading && (
              <div className="upload-progress-container">
                <div className="upload-progress-bar">
                  <div
                    className="upload-progress-fill"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <span className="upload-progress-text">{uploadProgress}% Uploading...</span>
              </div>
            )}
          </div>
        </div>

        {/* Fakemon Cards */}
        {fakemonCards.length > 0 && (
          <div className="admin-form-section">
            <h2 className="admin-form-section-title">
              <i className="fas fa-list"></i> Fakemon Cards ({fakemonCards.length})
            </h2>

            <div className="mass-fakemon-grid">
              {fakemonCards.map((card) => (
                <div key={card.id} className="mass-fakemon-card">
                  {/* Card Header with Remove Button */}
                  <div className="mass-fakemon-card-header">
                    <button
                      type="button"
                      className="admin-button delete small"
                      onClick={() => removeCard(card.id)}
                      disabled={submitting}
                      title="Remove this card"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>

                  {/* Image Preview */}
                  <div className="mass-fakemon-image">
                    <img
                      src={card.image_url}
                      alt={card.name || 'Fakemon'}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/150?text=No+Image';
                      }}
                    />
                  </div>

                  {/* Form Fields */}
                  <div className="mass-fakemon-fields">
                    {/* Number */}
                    <div className={`mass-fakemon-field ${card.errors.number ? 'has-error' : ''}`}>
                      <label>Number *</label>
                      <input
                        type="text"
                        value={card.number}
                        onChange={(e) => updateCard(card.id, 'number', e.target.value)}
                        placeholder="e.g., 001"
                        disabled={submitting}
                      />
                      {card.errors.number && (
                        <span className="field-error">{card.errors.number}</span>
                      )}
                    </div>

                    {/* Name */}
                    <div className={`mass-fakemon-field ${card.errors.name ? 'has-error' : ''}`}>
                      <label>Name *</label>
                      <input
                        type="text"
                        value={card.name}
                        onChange={(e) => updateCard(card.id, 'name', e.target.value)}
                        placeholder="e.g., Bulbasaur"
                        disabled={submitting}
                      />
                      {card.errors.name && (
                        <span className="field-error">{card.errors.name}</span>
                      )}
                    </div>

                    {/* Category */}
                    <div className={`mass-fakemon-field ${card.errors.category ? 'has-error' : ''}`}>
                      <label>Category *</label>
                      <input
                        type="text"
                        list={`categories-${card.id}`}
                        value={card.category}
                        onChange={(e) => updateCard(card.id, 'category', e.target.value)}
                        placeholder="e.g., Pokemon"
                        disabled={submitting}
                      />
                      <datalist id={`categories-${card.id}`}>
                        {existingCategories.map(cat => (
                          <option key={cat} value={cat} />
                        ))}
                      </datalist>
                      {card.errors.category && (
                        <span className="field-error">{card.errors.category}</span>
                      )}
                    </div>

                    {/* Types */}
                    <div className={`mass-fakemon-field ${card.errors.types ? 'has-error' : ''}`}>
                      <label>Types * (min 1, max 5)</label>
                      <div className="types-container">
                        {card.types.map((type, typeIndex) => (
                          <div key={typeIndex} className="type-row">
                            <select
                              value={type}
                              onChange={(e) => updateType(card.id, typeIndex, e.target.value)}
                              disabled={submitting}
                            >
                              <option value="">Select Type</option>
                              {types.map(t => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                            {card.types.length > 1 && (
                              <button
                                type="button"
                                className="type-remove-btn"
                                onClick={() => removeTypeSlot(card.id, typeIndex)}
                                disabled={submitting}
                                title="Remove type"
                              >
                                <i className="fas fa-minus"></i>
                              </button>
                            )}
                          </div>
                        ))}
                        {card.types.length < 5 && (
                          <button
                            type="button"
                            className="type-add-btn"
                            onClick={() => addTypeSlot(card.id)}
                            disabled={submitting}
                          >
                            <i className="fas fa-plus"></i> Add Type
                          </button>
                        )}
                      </div>
                      {card.errors.types && (
                        <span className="field-error">{card.errors.types}</span>
                      )}
                    </div>

                    {/* Attribute */}
                    <div className="mass-fakemon-field">
                      <label>Attribute</label>
                      <select
                        value={card.attribute}
                        onChange={(e) => updateCard(card.id, 'attribute', e.target.value)}
                        disabled={submitting}
                      >
                        <option value="">None</option>
                        {attributes.map(attr => (
                          <option key={attr} value={attr}>{attr}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit Section */}
        {fakemonCards.length > 0 && (
          <div className="admin-form-actions">
            <button
              type="button"
              className="admin-button secondary"
              onClick={() => setFakemonCards([])}
              disabled={submitting}
            >
              <i className="fas fa-trash"></i> Clear All
            </button>
            <button
              type="button"
              className="admin-button"
              onClick={handleSubmit}
              disabled={submitting || fakemonCards.length === 0}
            >
              {submitting ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Creating...
                </>
              ) : (
                <>
                  <i className="fas fa-save"></i> Create {fakemonCards.length} Fakemon
                </>
              )}
            </button>
          </div>
        )}

        {/* Empty State */}
        {fakemonCards.length === 0 && !uploading && (
          <div className="admin-empty-state">
            <i className="fas fa-images"></i>
            <h3>No Images Uploaded</h3>
            <p>Upload images to start creating fakemon entries</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MassFakemonAddPage;
