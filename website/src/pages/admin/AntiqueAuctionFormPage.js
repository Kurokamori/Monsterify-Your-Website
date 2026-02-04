import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import antiqueService from '../../services/antiqueService';
import FormInput from '../../components/common/FormInput';
import FormTextarea from '../../components/common/FormTextarea';
import AutocompleteInput from '../../components/common/AutocompleteInput';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';

// Pokemon types for autocomplete
const POKEMON_TYPES = [
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
  'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
  'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'
];

// Attribute options for autocomplete
const ATTRIBUTES = ['Data', 'Vaccine', 'Variable', 'Free', 'Virus'];

const AntiqueAuctionFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    antique: '',
    image: '',
    species1: '',
    species2: '',
    species3: '',
    type1: '',
    type2: '',
    type3: '',
    type4: '',
    type5: '',
    attribute: '',
    description: '',
    family: '',
    creator: ''
  });

  const [antiques, setAntiques] = useState([]);
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Fetch antiques dropdown and existing data if editing
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch antiques dropdown
        const antiquesResponse = await antiqueService.getAllAntiquesDropdown();
        setAntiques(antiquesResponse.data || []);

        // If editing, fetch the existing auction
        if (isEditMode) {
          setLoading(true);
          const auctionResponse = await antiqueService.getAntiqueAuctionById(id);
          const auction = auctionResponse.data;

          setFormData({
            name: auction.name || '',
            antique: auction.antique || '',
            image: auction.image || '',
            species1: auction.species1 || '',
            species2: auction.species2 || '',
            species3: auction.species3 || '',
            type1: auction.type1 || '',
            type2: auction.type2 || '',
            type3: auction.type3 || '',
            type4: auction.type4 || '',
            type5: auction.type5 || '',
            attribute: auction.attribute || '',
            description: auction.description || '',
            family: auction.family || '',
            creator: auction.creator || ''
          });

          if (auction.image) {
            setImagePreview(auction.image);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isEditMode]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Handle image file selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Upload image
  const uploadImage = async () => {
    if (!imageFile) return null;

    try {
      setUploadingImage(true);
      const response = await antiqueService.uploadImage(imageFile);
      return response.data.url;
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

    if (!formData.antique) {
      newErrors.antique = 'Antique selection is required';
    }

    if (!formData.species1.trim()) {
      newErrors.species1 = 'At least one species is required';
    }

    if (!formData.type1.trim()) {
      newErrors.type1 = 'At least one type is required';
    }

    if (!formData.attribute.trim()) {
      newErrors.attribute = 'Attribute is required';
    }

    if (!formData.creator.trim()) {
      newErrors.creator = 'Creator is required';
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
      let imageUrl = formData.image;
      if (imageFile) {
        imageUrl = await uploadImage();
        if (!imageUrl && imageFile) {
          setSubmitting(false);
          return;
        }
      }

      // Prepare data for submission
      const auctionData = {
        ...formData,
        image: imageUrl || ''
      };

      if (isEditMode) {
        await antiqueService.updateAntiqueAuction(id, auctionData);
        toast.success('Seasonal adopt updated successfully');
      } else {
        await antiqueService.createAntiqueAuction(auctionData);
        toast.success('Seasonal adopt created successfully');
      }

      navigate('/admin/seasonal-adopts');
    } catch (error) {
      console.error('Error saving seasonal adopt:', error);
      toast.error(error.response?.data?.message || 'Failed to save seasonal adopt');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate('/admin/seasonal-adopts');
  };

  if (loading) {
    return <LoadingSpinner message="Loading data..." />;
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-header">
        <h1 className="admin-dashboard-title">{isEditMode ? 'Edit Seasonal Adopt' : 'Add Seasonal Adopt'}</h1>
      </div>

      <div className="admin-form-container">
        <form onSubmit={handleSubmit} className="admin-form">
          <div className="admin-form-section">
            <h2 className="admin-form-section-title">
              <i className="fas fa-info-circle"></i> Basic Information
            </h2>

            <div className="admin-form-grid">
              <div>
                <FormInput
                  label="Monster Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  error={errors.name}
                  required
                  placeholder="e.g., Frosty Pikachu"
                />

                <div className="admin-form-group">
                  <label className="admin-form-label">
                    Antique <span className="required">*</span>
                  </label>
                  <select
                    name="antique"
                    value={formData.antique}
                    onChange={handleChange}
                    className={`admin-form-select ${errors.antique ? 'error' : ''}`}
                    required
                  >
                    <option value="">Select an antique...</option>
                    {antiques.map((antique) => (
                      <option key={antique.name} value={antique.name}>
                        {antique.name} ({antique.holiday})
                      </option>
                    ))}
                  </select>
                  {errors.antique && <span className="admin-form-error">{errors.antique}</span>}
                </div>

                <FormInput
                  label="Creator"
                  name="creator"
                  value={formData.creator}
                  onChange={handleChange}
                  error={errors.creator}
                  required
                  placeholder="Username of the artist"
                />
              </div>

              <div>
                <FormInput
                  label="Family (Optional)"
                  name="family"
                  value={formData.family}
                  onChange={handleChange}
                  placeholder="Group name for evolution lines"
                  helpText="Use to group related adopts together"
                />

                <FormTextarea
                  label="Description (Optional)"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Flavor text or description..."
                />
              </div>
            </div>
          </div>

          <div className="admin-form-section">
            <h2 className="admin-form-section-title">
              <i className="fas fa-dna"></i> Species
            </h2>

            <div className="admin-form-grid three-columns">
              <FormInput
                label="Species 1"
                name="species1"
                value={formData.species1}
                onChange={handleChange}
                error={errors.species1}
                required
                placeholder="Primary species"
              />

              <FormInput
                label="Species 2 (Optional)"
                name="species2"
                value={formData.species2}
                onChange={handleChange}
                placeholder="Fusion species"
              />

              <FormInput
                label="Species 3 (Optional)"
                name="species3"
                value={formData.species3}
                onChange={handleChange}
                placeholder="Fusion species"
              />
            </div>
          </div>

          <div className="admin-form-section">
            <h2 className="admin-form-section-title">
              <i className="fas fa-fire"></i> Types
            </h2>

            <div className="admin-form-grid five-columns">
              <AutocompleteInput
                id="type1"
                name="type1"
                value={formData.type1}
                onChange={handleChange}
                options={POKEMON_TYPES}
                label="Type 1"
                required
                placeholder="Primary type"
              />

              <AutocompleteInput
                id="type2"
                name="type2"
                value={formData.type2}
                onChange={handleChange}
                options={POKEMON_TYPES}
                label="Type 2"
                placeholder="Secondary type"
              />

              <AutocompleteInput
                id="type3"
                name="type3"
                value={formData.type3}
                onChange={handleChange}
                options={POKEMON_TYPES}
                label="Type 3"
                placeholder="Additional type"
              />

              <AutocompleteInput
                id="type4"
                name="type4"
                value={formData.type4}
                onChange={handleChange}
                options={POKEMON_TYPES}
                label="Type 4"
                placeholder="Additional type"
              />

              <AutocompleteInput
                id="type5"
                name="type5"
                value={formData.type5}
                onChange={handleChange}
                options={POKEMON_TYPES}
                label="Type 5"
                placeholder="Additional type"
              />
            </div>
            {errors.type1 && <span className="admin-form-error">{errors.type1}</span>}
          </div>

          <div className="admin-form-section">
            <h2 className="admin-form-section-title">
              <i className="fas fa-star"></i> Attribute
            </h2>

            <div className="admin-form-grid">
              <div>
                <AutocompleteInput
                  id="attribute"
                  name="attribute"
                  value={formData.attribute}
                  onChange={handleChange}
                  options={ATTRIBUTES}
                  label="Attribute"
                  required
                  placeholder="Select attribute"
                />
                {errors.attribute && <span className="admin-form-error">{errors.attribute}</span>}
              </div>
            </div>
          </div>

          <div className="admin-form-section">
            <h2 className="admin-form-section-title">
              <i className="fas fa-image"></i> Image
            </h2>

            <div className="image-upload">
              <div className="image-controls">
                <label className="admin-form-label">Upload Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="admin-form-input"
                />
                <p className="admin-form-hint">
                  Upload an image for this seasonal adopt. Supported formats: JPG, PNG, GIF, WebP.
                </p>
              </div>

              {imagePreview && (
                <div>
                  <img src={imagePreview} alt="Preview" className="admin-form-image-preview" />
                  <button
                    type="button"
                    className="admin-button secondary small"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview('');
                      setFormData(prev => ({ ...prev, image: '' }));
                    }}
                  >
                    <i className="fas fa-times"></i> Remove
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="admin-form-actions">
            <button
              type="button"
              className="admin-button secondary"
              onClick={handleCancel}
              disabled={submitting || uploadingImage}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="admin-button primary"
              disabled={submitting || uploadingImage}
            >
              {(submitting || uploadingImage) ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  {uploadingImage ? ' Uploading...' : ' Saving...'}
                </>
              ) : (
                <>
                  <i className="fas fa-save"></i>
                  {isEditMode ? ' Update' : ' Create'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AntiqueAuctionFormPage;
