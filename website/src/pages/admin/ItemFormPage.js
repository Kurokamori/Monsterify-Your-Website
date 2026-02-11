import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import itemsApi from '../../services/itemsApi';
import FormInput from '../../components/common/FormInput';
import FormSelect from '../../components/common/FormSelect';
import FormTextarea from '../../components/common/FormTextarea';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';

const ItemFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    category: '',
    type: '',
    rarity: '',
    effect: '',
    base_price: 0
  });

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [categories, setCategories] = useState([]);
  const [types, setTypes] = useState([]);
  const [rarities, setRarities] = useState([]);

  // Fetch filter options
  const fetchFilterOptions = async () => {
    try {
      const [categoriesResponse, typesResponse, raritiesResponse] = await Promise.all([
        itemsApi.getCategories(),
        itemsApi.getTypes(),
        itemsApi.getRarities()
      ]);

      setCategories(categoriesResponse.data);
      setTypes(typesResponse.data);
      setRarities(raritiesResponse.data);
    } catch (error) {
      console.error('Error fetching filter options:', error);
      toast.error('Failed to fetch filter options');
    }
  };

  // Fetch item data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      const fetchItem = async () => {
        try {
          setLoading(true);
          const response = await itemsApi.getItemById(id);
          setFormData(response.data);
          setImagePreview(response.data.image_url);
        } catch (error) {
          console.error('Error fetching item:', error);
          toast.error('Failed to fetch item data');
        } finally {
          setLoading(false);
        }
      };

      fetchItem();
    }

    fetchFilterOptions();
  }, [id, isEditMode]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === 'number' ? (value === '' ? 0 : parseInt(value)) : value
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
      const response = await itemsApi.uploadImage(imageFile);
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

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    if (formData.base_price < 0) {
      newErrors.base_price = 'Price cannot be negative';
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
      const itemData = {
        ...formData,
        image_url: imageUrl
      };

      if (isEditMode) {
        await itemsApi.updateItem(id, itemData);
        toast.success('Item updated successfully');
      } else {
        await itemsApi.createItem(itemData);
        toast.success('Item created successfully');
      }

      // Navigate back to the list page
      navigate('/admin/items');
    } catch (error) {
      console.error('Error saving item:', error);
      toast.error(error.response?.data?.message || 'Failed to save item');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate('/admin/items');
  };

  if (loading) {
    return (
      <div>
        <LoadingSpinner message="Loading item data..." />
      </div>
    );
  }

  return (
    <div>
      <div className="admin-page-header">
        <h1>{isEditMode ? 'Edit Item' : 'Add Item'}</h1>
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

              <FormTextarea
                label="Description"
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                rows={4}
              />

              <FormSelect
                label="Category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                options={[
                  { value: '', label: 'Select Category' },
                  ...categories.map(category => ({ value: category, label: category })),
                  { value: 'new', label: '+ Add New Category' }
                ]}
                error={errors.category}
                required
              />

              {formData.category === 'new' && (
                <FormInput
                  label="New Category"
                  name="new_category"
                  value={formData.new_category || ''}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      new_category: e.target.value,
                      category: e.target.value
                    }));
                  }}
                  required
                />
              )}
            </div>

            <div className="admin-form-column">
              <FormSelect
                label="Type"
                name="type"
                value={formData.type || ''}
                onChange={handleChange}
                options={[
                  { value: '', label: 'None' },
                  ...types.map(type => ({ value: type, label: type })),
                  { value: 'new', label: '+ Add New Type' }
                ]}
              />

              {formData.type === 'new' && (
                <FormInput
                  label="New Type"
                  name="new_type"
                  value={formData.new_type || ''}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      new_type: e.target.value,
                      type: e.target.value
                    }));
                  }}
                />
              )}

              <FormSelect
                label="Rarity"
                name="rarity"
                value={formData.rarity || ''}
                onChange={handleChange}
                options={[
                  { value: '', label: 'None' },
                  ...rarities.map(rarity => ({ value: rarity, label: rarity })),
                  { value: 'new', label: '+ Add New Rarity' }
                ]}
              />

              {formData.rarity === 'new' && (
                <FormInput
                  label="New Rarity"
                  name="new_rarity"
                  value={formData.new_rarity || ''}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      new_rarity: e.target.value,
                      rarity: e.target.value
                    }));
                  }}
                />
              )}

              <FormTextarea
                label="Effect"
                name="effect"
                value={formData.effect || ''}
                onChange={handleChange}
                rows={3}
              />

              <FormInput
                label="Price"
                name="base_price"
                type="number"
                value={formData.base_price}
                onChange={handleChange}
                error={errors.base_price}
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
                  Upload an image for this item. Supported formats: JPG, PNG, GIF.
                </div>
              </div>
            </div>
          </div>

          {imagePreview && (
            <div className="admin-form-preview">
              <h3>Image Preview</h3>
              <div className="image-container medium no-margin">
                <img
                  src={imagePreview}
                  alt={formData.name}
                />
              </div>
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

export default ItemFormPage;
