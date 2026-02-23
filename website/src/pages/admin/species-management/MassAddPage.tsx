import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { AdminRoute } from '@components/common/AdminRoute';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import speciesService from '@services/speciesService';

interface FakemonCard {
  id: number;
  imageUrl: string;
  number: string;
  name: string;
  category: string;
  types: string[];
  attribute: string;
  errors: Record<string, string>;
}

const ATTRIBUTES = ['Virus', 'Vaccine', 'Data', 'Free', 'Variable'];

function MassAddContent() {
  useDocumentTitle('Mass Fakemon Add');
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Data from API
  const [types, setTypes] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [usedNumbers, setUsedNumbers] = useState<Record<string, number[]>>({});

  // Cards
  const [cards, setCards] = useState<FakemonCard[]>([]);

  // Upload
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [typesRes, categoriesRes] = await Promise.all([
          speciesService.getFakemonTypes(),
          speciesService.getFakemonCategories(),
        ]);
        setTypes(typesRes);
        setCategories(categoriesRes);
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError('Failed to load initial data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fetch numbers for a category
  const fetchNumbersForCategory = useCallback(async (category: string) => {
    if (!category || usedNumbers[category]) return;
    try {
      const numbers = await speciesService.getFakemonNumbersByCategory(category);
      setUsedNumbers(prev => ({ ...prev, [category]: numbers }));
    } catch (err) {
      console.error(`Error fetching numbers for ${category}:`, err);
    }
  }, [usedNumbers]);

  // Handle file selection - upload images via Cloudinary FileUpload pattern
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    const newCards: FakemonCard[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'fakemon');

        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
        const token = localStorage.getItem('token');
        const response = await fetch(
          `${apiBase}/upload`,
          {
            method: 'POST',
            body: formData,
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          }
        );
        const result = await response.json();

        if (result.secure_url) {
          newCards.push({
            id: Date.now() + i,
            imageUrl: result.secure_url,
            number: '',
            name: file.name.replace(/\.[^/.]+$/, ''),
            category: '',
            types: [''],
            attribute: '',
            errors: {},
          });
        }
      } catch (err) {
        console.error(`Error uploading ${file.name}:`, err);
      }

      setUploadProgress(Math.round(((i + 1) / files.length) * 100));
    }

    setCards(prev => [...prev, ...newCards]);
    setUploading(false);
    setUploadProgress(0);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Update card field
  const updateCard = useCallback((cardId: number, field: string, value: string) => {
    setCards(prev => prev.map(card => {
      if (card.id !== cardId) return card;
      const updated = { ...card, [field]: value };
      if (field === 'category' && value) {
        fetchNumbersForCategory(value);
      }
      // Clear field error
      if (updated.errors[field]) {
        updated.errors = { ...updated.errors };
        delete updated.errors[field];
      }
      return updated;
    }));
  }, [fetchNumbersForCategory]);

  // Update type at index
  const updateType = useCallback((cardId: number, typeIndex: number, value: string) => {
    setCards(prev => prev.map(card => {
      if (card.id !== cardId) return card;
      const newTypes = [...card.types];
      newTypes[typeIndex] = value;
      return { ...card, types: newTypes, errors: { ...card.errors, types: undefined as unknown as string } };
    }));
  }, []);

  // Add type slot
  const addTypeSlot = useCallback((cardId: number) => {
    setCards(prev => prev.map(card => {
      if (card.id !== cardId || card.types.length >= 5) return card;
      return { ...card, types: [...card.types, ''] };
    }));
  }, []);

  // Remove type slot
  const removeTypeSlot = useCallback((cardId: number, typeIndex: number) => {
    setCards(prev => prev.map(card => {
      if (card.id !== cardId || card.types.length <= 1) return card;
      return { ...card, types: card.types.filter((_, i) => i !== typeIndex) };
    }));
  }, []);

  // Remove card
  const removeCard = useCallback((cardId: number) => {
    setCards(prev => prev.filter(card => card.id !== cardId));
  }, []);

  // Validate single card
  const validateCard = useCallback((card: FakemonCard): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!card.number) {
      errors.number = 'Number is required';
    } else {
      const nums = usedNumbers[card.category] ?? [];
      if (nums.includes(parseInt(card.number))) {
        errors.number = `Number ${card.number} already exists in "${card.category}"`;
      }
      // Check duplicates in batch
      const dupes = cards.filter(c => c.id !== card.id && c.number === card.number && c.category === card.category);
      if (dupes.length > 0) {
        errors.number = `Number ${card.number} is duplicated in this batch`;
      }
    }

    if (!card.name) errors.name = 'Name is required';
    if (!card.category) errors.category = 'Category is required';

    const validTypes = card.types.filter(t => t.trim() !== '');
    if (validTypes.length === 0) errors.types = 'At least one type is required';

    return errors;
  }, [usedNumbers, cards]);

  // Submit
  const handleSubmit = useCallback(async () => {
    if (cards.length === 0) {
      setError('Please upload at least one image first');
      return;
    }

    // Validate all
    let hasErrors = false;
    setCards(prev => prev.map(card => {
      const errors = validateCard(card);
      if (Object.keys(errors).length > 0) hasErrors = true;
      return { ...card, errors };
    }));

    if (hasErrors) {
      setError('Please fix the errors before submitting');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const fakemonList = cards.map(card => {
        const validTypes = card.types.filter(t => t.trim() !== '');
        return {
          number: parseInt(card.number),
          name: card.name,
          category: card.category,
          type1: validTypes[0] || null,
          type2: validTypes[1] || null,
          type3: validTypes[2] || null,
          type4: validTypes[3] || null,
          type5: validTypes[4] || null,
          attribute: card.attribute || null,
          imageUrl: card.imageUrl,
        };
      });

      await speciesService.bulkCreateFakemon(fakemonList);
      setSuccessMessage(`Successfully created ${fakemonList.length} fakemon!`);
      setTimeout(() => navigate('/admin/species/fakemon'), 1500);
    } catch (err) {
      console.error('Error submitting fakemon:', err);
      const message = err instanceof Error ? err.message : 'Failed to create fakemon';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }, [cards, validateCard, navigate]);

  if (loading) {
    return <LoadingSpinner message="Loading..." />;
  }

  return (
    <div className="mass-add">
      <div className="mass-add__header">
        <div>
          <h1>Mass Fakemon Add</h1>
          <p style={{ color: 'var(--text-color-muted)', margin: 0 }}>
            Upload multiple images and fill in details for each fakemon
          </p>
        </div>
        <div className="mass-add__header-actions">
          <Link to="/admin/species/fakemon" className="button secondary">
            <i className="fas fa-arrow-left"></i> Back to List
          </Link>
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="mass-add__message mass-add__message--success">
          <i className="fas fa-check-circle"></i> {successMessage}
        </div>
      )}
      {error && (
        <div className="mass-add__message mass-add__message--error">
          <i className="fas fa-exclamation-circle"></i> {error}
        </div>
      )}

      {/* Upload Area */}
      <div className="mass-add__upload">
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
          className="button primary"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || submitting}
        >
          <i className="fas fa-images"></i> Select Images
        </button>
        <p className="mass-add__upload-hint">
          Select multiple images to create fakemon cards. Each image becomes a separate entry.
        </p>

        {uploading && (
          <div className="mass-add__upload-progress">
            <div className="progress" style={{ flex: 1 }}>
              <div className="progress-fill primary" style={{ width: `${uploadProgress}%` }} />
            </div>
            <span className="mass-add__upload-progress-label">{uploadProgress}% Uploading...</span>
          </div>
        )}
      </div>

      {/* Cards */}
      {cards.length > 0 && (
        <>
          <div className="mass-add__cards-header">
            <h2>Fakemon Cards ({cards.length})</h2>
          </div>

          <div className="mass-add__cards">
            {cards.map(card => {
              const hasErrors = Object.keys(card.errors).length > 0;
              return (
                <div key={card.id} className={`mass-add__card${hasErrors ? ' mass-add__card--error' : ''}`}>
                  <div className="mass-add__card-remove">
                    <button
                      type="button"
                      className="button danger sm no-flex"
                      onClick={() => removeCard(card.id)}
                      disabled={submitting}
                      title="Remove"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>

                  <img
                    src={card.imageUrl}
                    alt={card.name || 'Fakemon'}
                    className="mass-add__card-image"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/default_image.png';
                    }}
                  />

                  <div className="mass-add__card-fields">
                    {/* Number */}
                    <div className="form-group">
                      <label className="form-label">Number *</label>
                      <input
                        type="text"
                        className={`input${card.errors.number ? ' invalid' : ''}`}
                        value={card.number}
                        onChange={(e) => updateCard(card.id, 'number', e.target.value)}
                        placeholder="e.g., 001"
                        disabled={submitting}
                      />
                      {card.errors.number && <div className="form-error-text">{card.errors.number}</div>}
                    </div>

                    {/* Name */}
                    <div className="form-group">
                      <label className="form-label">Name *</label>
                      <input
                        type="text"
                        className={`input${card.errors.name ? ' invalid' : ''}`}
                        value={card.name}
                        onChange={(e) => updateCard(card.id, 'name', e.target.value)}
                        placeholder="e.g., Bulbasaur"
                        disabled={submitting}
                      />
                      {card.errors.name && <div className="form-error-text">{card.errors.name}</div>}
                    </div>

                    {/* Category */}
                    <div className="form-group">
                      <label className="form-label">Category *</label>
                      <input
                        type="text"
                        className={`input${card.errors.category ? ' invalid' : ''}`}
                        list={`categories-${card.id}`}
                        value={card.category}
                        onChange={(e) => updateCard(card.id, 'category', e.target.value)}
                        placeholder="e.g., Fakemon"
                        disabled={submitting}
                      />
                      <datalist id={`categories-${card.id}`}>
                        {categories.map(cat => (
                          <option key={cat} value={cat} />
                        ))}
                      </datalist>
                      {card.errors.category && <div className="form-error-text">{card.errors.category}</div>}
                    </div>

                    {/* Types */}
                    <div className="form-group">
                      <label className="form-label">Types * (1-5)</label>
                      {card.types.map((type, typeIndex) => (
                        <div key={typeIndex} className="mass-add__type-row">
                          <select
                            className="select"
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
                              className="button danger icon sm no-flex"
                              onClick={() => removeTypeSlot(card.id, typeIndex)}
                              disabled={submitting}
                            >
                              <i className="fas fa-minus"></i>
                            </button>
                          )}
                        </div>
                      ))}
                      {card.types.length < 5 && (
                        <button
                          type="button"
                          className="button primary sm"
                          onClick={() => addTypeSlot(card.id)}
                          disabled={submitting}
                          style={{ marginTop: 'var(--spacing-xxsmall)' }}
                        >
                          <i className="fas fa-plus"></i> Add Type
                        </button>
                      )}
                      {card.errors.types && <div className="form-error-text">{card.errors.types}</div>}
                    </div>

                    {/* Attribute */}
                    <div className="form-group">
                      <label className="form-label">Attribute</label>
                      <select
                        className="select"
                        value={card.attribute}
                        onChange={(e) => updateCard(card.id, 'attribute', e.target.value)}
                        disabled={submitting}
                      >
                        <option value="">None</option>
                        {ATTRIBUTES.map(attr => (
                          <option key={attr} value={attr}>{attr}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="mass-add__actions">
            <button
              type="button"
              className="button secondary"
              onClick={() => setCards([])}
              disabled={submitting}
            >
              <i className="fas fa-trash"></i> Clear All
            </button>
            <button
              type="button"
              className="button primary"
              onClick={handleSubmit}
              disabled={submitting || cards.length === 0}
            >
              {submitting ? (
                <><i className="fas fa-spinner fa-spin"></i> Creating...</>
              ) : (
                <><i className="fas fa-save"></i> Create {cards.length} Fakemon</>
              )}
            </button>
          </div>
        </>
      )}

      {/* Empty State */}
      {cards.length === 0 && !uploading && (
        <div className="mass-add__empty">
          <i className="fas fa-images"></i>
          <h3>No Images Uploaded</h3>
          <p>Upload images to start creating fakemon entries</p>
        </div>
      )}
    </div>
  );
}

export default function MassAddPage() {
  return (
    <AdminRoute>
      <MassAddContent />
    </AdminRoute>
  );
}
