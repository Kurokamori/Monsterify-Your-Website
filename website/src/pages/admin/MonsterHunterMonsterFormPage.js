import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import monsterTypesApi from '../../services/monsterTypesApi';
import FormInput from '../../components/common/FormInput';
import FormSelect from '../../components/common/FormSelect';
import FormTextarea from '../../components/common/FormTextarea';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';

const MonsterHunterMonsterFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    monster_class: '',
    element_primary: '',
    element_secondary: '',
    weaknesses: '',
    description: '',
    habitat: '',
    image_url: ''
  });

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Monster Hunter classes
  const monsterClasses = [
    'Flying Wyvern', 'Brute Wyvern', 'Fanged Wyvern', 'Bird Wyvern',
    'Piscine Wyvern', 'Leviathan', 'Elder Dragon', 'Fanged Beast',
    'Neopteron', 'Carapaceon', 'Amphibian', 'Snake Wyvern', 'Temnoceran'
  ];

  // Monster Hunter elements
  const monsterElements = [
    'Fire', 'Water', 'Thunder', 'Ice', 'Dragon',
    'Poison', 'Sleep', 'Paralysis', 'Blast', 'None'
  ];

  // Fetch Monster Hunter monster data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      const fetchMonster = async () => {
        try {
          setLoading(true);
          const response = await monsterTypesApi.getMonsterHunterMonsterById(id);
          setFormData(response.data);
          setImagePreview(response.data.image_url);
        } catch (error) {
          console.error('Error fetching Monster Hunter monster:', error);
          toast.error('Failed to fetch Monster Hunter monster data');
        } finally {
          setLoading(false);
        }
      };

      fetchMonster();
    }
  }, [id, isEditMode]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value
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

    if (!formData.monster_class) {
      newErrors.monster_class = 'Monster class is required';
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
      const monsterData = {
        ...formData,
        image_url: imageUrl
      };

      if (isEditMode) {
        await monsterTypesApi.updateMonsterHunterMonster(id, monsterData);
        toast.success('Monster Hunter monster updated successfully');
      } else {
        await monsterTypesApi.createMonsterHunterMonster(monsterData);
        toast.success('Monster Hunter monster created successfully');
      }

      // Navigate back to the list page
      navigate('/admin/monsterhunter-monsters');
    } catch (error) {
      console.error('Error saving Monster Hunter monster:', error);
      toast.error(error.response?.data?.message || 'Failed to save Monster Hunter monster');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate('/admin/monsterhunter-monsters');
  };

  if (loading) {
    return (
      <div>
        <LoadingSpinner message="Loading Monster Hunter monster data..." />
      </div>
    );
  }

  return (
    <div>
      <div className="admin-page-header">
        <h1>{isEditMode ? 'Edit Monster Hunter Monster' : 'Add Monster Hunter Monster'}</h1>
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

              <FormSelect
                label="Monster Class"
                name="monster_class"
                value={formData.monster_class}
                onChange={handleChange}
                options={monsterClasses.map(cls => ({ value: cls, label: cls }))}
                error={errors.monster_class}
                required
              />

              <FormSelect
                label="Primary Element"
                name="element_primary"
                value={formData.element_primary || ''}
                onChange={handleChange}
                options={[
                  { value: '', label: 'None' },
                  ...monsterElements.map(el => ({ value: el, label: el }))
                ]}
              />

              <FormSelect
                label="Secondary Element"
                name="element_secondary"
                value={formData.element_secondary || ''}
                onChange={handleChange}
                options={[
                  { value: '', label: 'None' },
                  ...monsterElements.map(el => ({ value: el, label: el }))
                ]}
              />
            </div>

            <div className="admin-form-column">
              <FormInput
                label="Weaknesses"
                name="weaknesses"
                value={formData.weaknesses || ''}
                onChange={handleChange}
                helpText="Comma-separated list of weaknesses"
              />

              <FormInput
                label="Habitat"
                name="habitat"
                value={formData.habitat || ''}
                onChange={handleChange}
                helpText="Where this monster can be found"
              />

              <FormTextarea
                label="Description"
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                rows={4}
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
                  Upload an image for this monster. Supported formats: JPG, PNG, GIF.
                </div>
              </div>

              <FormInput
                label="Image URL"
                name="image_url"
                value={formData.image_url || ''}
                onChange={handleChange}
                placeholder="Or enter an image URL directly"
              />
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

export default MonsterHunterMonsterFormPage;
