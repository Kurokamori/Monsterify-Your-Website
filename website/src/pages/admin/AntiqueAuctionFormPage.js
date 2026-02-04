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
    <div className="seasonal-adopt-form-page">
      <div className="admin-page-header">
        <h1>{isEditMode ? 'Edit Seasonal Adopt' : 'Add Seasonal Adopt'}</h1>
      </div>

      <div className="admin-form-container">
        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-section">
            <h2 className="form-section-title">
              <i className="fas fa-info-circle"></i> Basic Information
            </h2>

            <div className="admin-form-grid">
              <div className="admin-form-column">
                <FormInput
                  label="Monster Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  error={errors.name}
                  required
                  placeholder="e.g., Frosty Pikachu"
                />

                <div className="form-group">
                  <label className="form-label">
                    Antique <span className="required">*</span>
                  </label>
                  <select
                    name="antique"
                    value={formData.antique}
                    onChange={handleChange}
                    className={`form-select ${errors.antique ? 'error' : ''}`}
                    required
                  >
                    <option value="">Select an antique...</option>
                    {antiques.map((antique) => (
                      <option key={antique.name} value={antique.name}>
                        {antique.name} ({antique.holiday})
                      </option>
                    ))}
                  </select>
                  {errors.antique && <span className="error-message">{errors.antique}</span>}
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

              <div className="admin-form-column">
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

          <div className="form-section">
            <h2 className="form-section-title">
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

          <div className="form-section">
            <h2 className="form-section-title">
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
            {errors.type1 && <span className="error-message">{errors.type1}</span>}
          </div>

          <div className="form-section">
            <h2 className="form-section-title">
              <i className="fas fa-star"></i> Attribute
            </h2>

            <div className="admin-form-grid">
              <div className="admin-form-column">
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
                {errors.attribute && <span className="error-message">{errors.attribute}</span>}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2 className="form-section-title">
              <i className="fas fa-image"></i> Image
            </h2>

            <div className="image-upload-section">
              <div className="image-upload-input">
                <label className="form-label">Upload Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="form-input"
                />
                <p className="form-help-text">
                  Upload an image for this seasonal adopt. Supported formats: JPG, PNG, GIF, WebP.
                </p>
              </div>

              {imagePreview && (
                <div className="image-preview">
                  <h4>Preview</h4>
                  <img src={imagePreview} alt="Preview" />
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

      <style jsx>{`
        .seasonal-adopt-form-page {
          padding: 20px;
        }

        .form-section {
          margin-bottom: 30px;
          padding: 20px;
          background: var(--bg-secondary);
          border-radius: 10px;
          border: 1px solid var(--border-color);
        }

        .form-section-title {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0 0 20px 0;
          padding-bottom: 15px;
          border-bottom: 1px solid var(--border-color);
          font-size: 1.1rem;
          color: var(--text-primary);
        }

        .form-section-title i {
          color: var(--primary-color);
        }

        .admin-form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }

        .admin-form-grid.three-columns {
          grid-template-columns: repeat(3, 1fr);
        }

        .admin-form-grid.five-columns {
          grid-template-columns: repeat(5, 1fr);
        }

        @media (max-width: 1200px) {
          .admin-form-grid.five-columns {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 900px) {
          .admin-form-grid.five-columns,
          .admin-form-grid.three-columns {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 600px) {
          .admin-form-grid,
          .admin-form-grid.five-columns,
          .admin-form-grid.three-columns {
            grid-template-columns: 1fr;
          }
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
          color: var(--text-primary);
        }

        .form-label .required {
          color: var(--danger-color);
        }

        .form-select {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid var(--border-color);
          border-radius: 6px;
          background: var(--bg-primary);
          color: var(--text-primary);
          font-size: 0.95rem;
        }

        .form-select:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 2px rgba(var(--primary-rgb), 0.2);
        }

        .form-select.error {
          border-color: var(--danger-color);
        }

        .error-message {
          display: block;
          color: var(--danger-color);
          font-size: 0.85rem;
          margin-top: 5px;
        }

        .form-help-text {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-top: 5px;
        }

        .image-upload-section {
          display: flex;
          gap: 30px;
          align-items: flex-start;
        }

        .image-upload-input {
          flex: 1;
        }

        .image-preview {
          width: 200px;
          text-align: center;
        }

        .image-preview h4 {
          margin: 0 0 10px 0;
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        .image-preview img {
          max-width: 100%;
          max-height: 200px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          margin-bottom: 10px;
        }

        .admin-button.small {
          padding: 6px 12px;
          font-size: 0.85rem;
        }

        .admin-form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 15px;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid var(--border-color);
        }

        @media (max-width: 600px) {
          .image-upload-section {
            flex-direction: column;
          }

          .image-preview {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default AntiqueAuctionFormPage;
