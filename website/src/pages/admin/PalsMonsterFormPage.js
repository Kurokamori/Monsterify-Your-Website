import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import monsterTypesApi from '../../services/monsterTypesApi';
import FormInput from '../../components/common/FormInput';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';

const PalsMonsterFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    image_url: ''
  });

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Fetch Pals monster data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      const fetchPalsMonster = async () => {
        try {
          setLoading(true);
          const response = await monsterTypesApi.getPalsMonsterById(id);
          setFormData(response.data);
        } catch (error) {
          console.error('Error fetching Pals monster:', error);
          toast.error('Failed to fetch Pals monster data');
        } finally {
          setLoading(false);
        }
      };

      fetchPalsMonster();
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

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
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

      if (isEditMode) {
        await monsterTypesApi.updatePalsMonster(id, formData);
        toast.success('Pals monster updated successfully');
      } else {
        await monsterTypesApi.createPalsMonster(formData);
        toast.success('Pals monster created successfully');
      }

      // Navigate back to the list page
      navigate('/admin/pals-monsters');
    } catch (error) {
      console.error('Error saving Pals monster:', error);
      toast.error(error.response?.data?.message || 'Failed to save Pals monster');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate('/admin/pals-monsters');
  };

  if (loading) {
    return (
      <div>
        <LoadingSpinner message="Loading Pals monster data..." />
      </div>
    );
  }

  return (
    <div>
      <div className="admin-page-header">
        <h1>{isEditMode ? 'Edit Pals Monster' : 'Add Pals Monster'}</h1>
      </div>

      <div className="admin-form-container">
        <form onSubmit={handleSubmit} className="admin-form">
          <div className="admin-form-grid">
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
                label="Image URL"
                name="image_url"
                value={formData.image_url || ''}
                onChange={handleChange}
              />
            </div>
          </div>

          {formData.image_url && (
            <div className="admin-form-preview">
              <h3>Image Preview</h3>
              <img
                src={formData.image_url}
                alt={formData.name}
                className="admin-form-image-preview"
              />
            </div>
          )}

          <div className="admin-form-actions">
            <button
              type="button"
              className="admin-button secondary"
              onClick={handleCancel}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="admin-button primary"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Saving...
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

export default PalsMonsterFormPage;
