import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import monsterTypesApi from '../../services/monsterTypesApi';
import FormInput from '../../components/common/FormInput';
import FormSelect from '../../components/common/FormSelect';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';

const YokaiMonsterFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    tribe: '',
    rank: '',
    evolves_from: '',
    evolves_to: '',
    breeding_results: '',
    stage: '',
    image_url: ''
  });

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Yokai tribes for dropdown
  const yokaiTribes = [
    'Brave', 'Mysterious', 'Tough', 'Charming', 'Heartful', 
    'Shady', 'Eerie', 'Slippery', 'Wicked', 'Enma'
  ];

  // Yokai ranks for dropdown
  const yokaiRanks = [
    'E-Rank', 'D-Rank', 'C-Rank', 'B-Rank', 'A-Rank', 'S-Rank', 'SS-Rank'
  ];

  // Evolution stages for dropdown
  const evolutionStages = [
    'Base Stage', 'Middle Stage', 'Final Stage', "Doesn't Evolve"
  ];

  // Fetch Yokai monster data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      const fetchYokaiMonster = async () => {
        try {
          setLoading(true);
          const response = await monsterTypesApi.getYokaiMonsterById(id);
          setFormData(response.data);
        } catch (error) {
          console.error('Error fetching Yokai monster:', error);
          toast.error('Failed to fetch Yokai monster data');
        } finally {
          setLoading(false);
        }
      };

      fetchYokaiMonster();
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

    if (!formData.tribe) {
      newErrors.tribe = 'Tribe is required';
    }

    if (!formData.rank) {
      newErrors.rank = 'Rank is required';
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

      if (isEditMode) {
        await monsterTypesApi.updateYokaiMonster(id, formData);
        toast.success('Yokai monster updated successfully');
      } else {
        await monsterTypesApi.createYokaiMonster(formData);
        toast.success('Yokai monster created successfully');
      }

      // Navigate back to the list page
      navigate('/admin/yokai-monsters');
    } catch (error) {
      console.error('Error saving Yokai monster:', error);
      toast.error(error.response?.data?.message || 'Failed to save Yokai monster');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate('/admin/yokai-monsters');
  };

  if (loading) {
    return (
      <div>
        <LoadingSpinner message="Loading Yokai monster data..." />
      </div>
    );
  }

  return (
    <div>
      <div className="admin-page-header">
        <h1>{isEditMode ? 'Edit Yokai Monster' : 'Add Yokai Monster'}</h1>
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
                label="Tribe"
                name="tribe"
                value={formData.tribe}
                onChange={handleChange}
                options={yokaiTribes.map(tribe => ({ value: tribe, label: tribe }))}
                error={errors.tribe}
                required
              />

              <FormSelect
                label="Rank"
                name="rank"
                value={formData.rank}
                onChange={handleChange}
                options={yokaiRanks.map(rank => ({ value: rank, label: rank }))}
                error={errors.rank}
                required
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
                helpText="Comma-separated list of Yokai names"
              />

              <FormInput
                label="Evolves To"
                name="evolves_to"
                value={formData.evolves_to || ''}
                onChange={handleChange}
                helpText="Comma-separated list of Yokai names"
              />

              <FormInput
                label="Breeding Results"
                name="breeding_results"
                value={formData.breeding_results || ''}
                onChange={handleChange}
                helpText="Baby form resulting from breeding"
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
              <div className="image-container medium no-margin">
                <img
                  src={formData.image_url}
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
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button primary"
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

export default YokaiMonsterFormPage;
