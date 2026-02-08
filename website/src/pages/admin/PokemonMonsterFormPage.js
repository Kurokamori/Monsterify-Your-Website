import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import monsterTypesApi from '../../services/monsterTypesApi';
import AdminLayout from '../../components/layouts/AdminLayout';
import FormInput from '../../components/common/FormInput';
import FormSelect from '../../components/common/FormSelect';
import FormCheckbox from '../../components/common/FormCheckbox';
import FormTextarea from '../../components/common/FormTextarea';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';

const PokemonMonsterFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    ndex: '',
    type_primary: '',
    type_secondary: '',
    evolves_from: '',
    evolves_to: '',
    breeding_results: '',
    stage: '',
    is_legendary: false,
    is_mythical: false,
    image_url: ''
  });

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Pokemon types for dropdown
  const pokemonTypes = [
    'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison',
    'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark',
    'Steel', 'Fairy'
  ];

  // Evolution stages for dropdown
  const evolutionStages = [
    'Base Stage', 'Middle Stage', 'Final Stage', "Doesn't Evolve"
  ];

  // Fetch Pokemon monster data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      const fetchPokemonMonster = async () => {
        try {
          setLoading(true);
          const response = await monsterTypesApi.getPokemonMonsterById(id);
          setFormData(response.data);
          setImagePreview(response.data.image_url);
        } catch (error) {
          console.error('Error fetching Pokemon monster:', error);
          toast.error('Failed to fetch Pokemon monster data');
        } finally {
          setLoading(false);
        }
      };

      fetchPokemonMonster();
    }
  }, [id, isEditMode]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle image file selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Upload image to Cloudinary
  const uploadImage = async () => {
    if (!imageFile) return null;

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/items/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload image');
      }

      return data.data.url;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.ndex) {
      newErrors.ndex = 'Pokedex number is required';
    } else if (isNaN(formData.ndex) || parseInt(formData.ndex) <= 0) {
      newErrors.ndex = 'Pokedex number must be a positive number';
    }

    if (!formData.type_primary) {
      newErrors.type_primary = 'Primary type is required';
    }

    if (!formData.stage) {
      newErrors.stage = 'Evolution stage is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      setSubmitting(true);

      // Upload image if selected
      let imageUrl = formData.image_url;
      if (imageFile) {
        imageUrl = await uploadImage();
        if (!imageUrl) {
          setSubmitting(false);
          return;
        }
      }

      // Prepare data for submission
      const pokemonData = {
        ...formData,
        ndex: parseInt(formData.ndex),
        image_url: imageUrl
      };

      if (isEditMode) {
        await monsterTypesApi.updatePokemonMonster(id, pokemonData);
        toast.success('Pokemon monster updated successfully');
      } else {
        await monsterTypesApi.createPokemonMonster(pokemonData);
        toast.success('Pokemon monster created successfully');
      }

      // Navigate back to the list page
      navigate('/admin/pokemon-monsters');
    } catch (error) {
      console.error('Error saving Pokemon monster:', error);
      toast.error(error.response?.data?.message || 'Failed to save Pokemon monster');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate('/admin/pokemon-monsters');
  };

  if (loading) {
    return (
      <div>
        <LoadingSpinner message="Loading Pokemon monster data..." />
      </div>
    );
  }

  return (
    <div>
      <div className="admin-page-header">
        <h1>{isEditMode ? 'Edit Pokemon Monster' : 'Add Pokemon Monster'}</h1>
      </div>

      <div className="bulk-monster-add-form">
        <form onSubmit={handleSubmit} className="reroller-content">
          <div className="reroller-content">
            <div className="admin-form-column">
              <FormInput
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
                required
              />

              <FormInput
                label="Pokedex Number"
                name="ndex"
                type="number"
                value={formData.ndex}
                onChange={handleChange}
                error={errors.ndex}
                required
              />

              <FormSelect
                label="Primary Type"
                name="type_primary"
                value={formData.type_primary}
                onChange={handleChange}
                options={pokemonTypes.map(type => ({ value: type, label: type }))}
                error={errors.type_primary}
                required
              />

              <FormSelect
                label="Secondary Type"
                name="type_secondary"
                value={formData.type_secondary || ''}
                onChange={handleChange}
                options={[
                  { value: '', label: 'None' },
                  ...pokemonTypes.map(type => ({ value: type, label: type }))
                ]}
              />

              <FormSelect
                label="Evolution Stage"
                name="stage"
                value={formData.stage}
                onChange={handleChange}
                options={evolutionStages.map(stage => ({ value: stage, label: stage }))}
                error={errors.stage}
                required
              />
            </div>

            <div className="admin-form-column">
              <FormInput
                label="Evolves From"
                name="evolves_from"
                value={formData.evolves_from || ''}
                onChange={handleChange}
                helpText="Comma-separated list of Pokemon names"
              />

              <FormInput
                label="Evolves To"
                name="evolves_to"
                value={formData.evolves_to || ''}
                onChange={handleChange}
                helpText="Comma-separated list of Pokemon names"
              />

              <FormInput
                label="Breeding Results"
                name="breeding_results"
                value={formData.breeding_results || ''}
                onChange={handleChange}
                helpText="Baby form resulting from breeding"
              />

              <div className="form-group">
                <label className="form-label">Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="form-input"
                />
                <div className="form-help">
                  Upload an image for this Pokemon. Supported formats: JPG, PNG, GIF.
                </div>
              </div>

              <FormInput
                label="Image URL"
                name="image_url"
                value={formData.image_url || ''}
                onChange={handleChange}
                placeholder="Or enter an image URL directly"
              />

              <div className="admin-form-checkboxes">
                <FormCheckbox
                  label="Legendary Pokemon"
                  name="is_legendary"
                  checked={formData.is_legendary}
                  onChange={handleChange}
                />

                <FormCheckbox
                  label="Mythical Pokemon"
                  name="is_mythical"
                  checked={formData.is_mythical}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {imagePreview && (
            <div className="admin-form-preview">
              <h3>Image Preview</h3>
              <img
                src={imagePreview}
                alt={formData.name}
                className="admin-form-image-preview"
              />
            </div>
          )}

          <div className="admin-form-actions">
            <button
              type="button"
              className="button secondary"
              onClick={handleCancel}
              disabled={submitting || uploadingImage}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button primary"
              disabled={submitting || uploadingImage}
            >
              {(submitting || uploadingImage) ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> {uploadingImage ? 'Uploading...' : 'Saving...'}
                </>
              ) : (
                <>Save</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PokemonMonsterFormPage;
