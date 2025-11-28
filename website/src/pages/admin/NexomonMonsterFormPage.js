import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import monsterTypesApi from '../../services/monsterTypesApi';
import FormInput from '../../components/common/FormInput';
import FormSelect from '../../components/common/FormSelect';
import FormCheckbox from '../../components/common/FormCheckbox';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';

const NexomonMonsterFormPage = () => {
  const { nr } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!nr;

  // Form state
  const [formData, setFormData] = useState({
    nr: '',
    name: '',
    is_legendary: false,
    type_primary: '',
    type_secondary: '',
    evolves_from: '',
    evolves_to: '',
    breeding_results: '',
    stage: '',
    image_url: ''
  });

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Nexomon types for dropdown
  const nexomonTypes = [
    'Normal', 'Fire', 'Water', 'Electric', 'Plant', 'Ice', 'Earth', 'Metal',
    'Wind', 'Ghost', 'Psychic', 'Dragon', 'Dark', 'Light'
  ];

  // Evolution stages for dropdown
  const evolutionStages = [
    'Base Stage', 'Middle Stage', 'Final Stage', "Doesn't Evolve"
  ];

  // Fetch Nexomon monster data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      const fetchNexomonMonster = async () => {
        try {
          setLoading(true);
          const response = await monsterTypesApi.getNexomonMonsterByNr(nr);
          setFormData(response.data);
        } catch (error) {
          console.error('Error fetching Nexomon monster:', error);
          toast.error('Failed to fetch Nexomon monster data');
        } finally {
          setLoading(false);
        }
      };

      fetchNexomonMonster();
    }
  }, [nr, isEditMode]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.nr) {
      newErrors.nr = 'Nexomon number is required';
    } else if (isNaN(formData.nr) || parseInt(formData.nr) <= 0) {
      newErrors.nr = 'Nexomon number must be a positive number';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
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

      // Prepare data for submission
      const nexomonData = {
        ...formData,
        nr: parseInt(formData.nr)
      };

      if (isEditMode) {
        await monsterTypesApi.updateNexomonMonster(nr, nexomonData);
        toast.success('Nexomon monster updated successfully');
      } else {
        await monsterTypesApi.createNexomonMonster(nexomonData);
        toast.success('Nexomon monster created successfully');
      }

      // Navigate back to the list page
      navigate('/admin/nexomon-monsters');
    } catch (error) {
      console.error('Error saving Nexomon monster:', error);
      toast.error(error.response?.data?.message || 'Failed to save Nexomon monster');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate('/admin/nexomon-monsters');
  };

  if (loading) {
    return (
      <div>
        <LoadingSpinner message="Loading Nexomon monster data..." />
      </div>
    );
  }

  return (
    <div>
      <div className="admin-page-header">
        <h1>{isEditMode ? 'Edit Nexomon Monster' : 'Add Nexomon Monster'}</h1>
      </div>

      <div className="admin-form-container">
        <form onSubmit={handleSubmit} className="admin-form">
          <div className="admin-form-grid">
            <div className="admin-form-column">
              <FormInput
                label="Nexomon Number"
                name="nr"
                type="number"
                value={formData.nr}
                onChange={handleChange}
                error={errors.nr}
                required
                disabled={isEditMode}
              />

              <FormInput
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
                required
              />

              <FormSelect
                label="Primary Type"
                name="type_primary"
                value={formData.type_primary}
                onChange={handleChange}
                options={nexomonTypes.map(type => ({ value: type, label: type }))}
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
                  ...nexomonTypes.map(type => ({ value: type, label: type }))
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
                helpText="Comma-separated list of Nexomon numbers"
              />

              <FormInput
                label="Evolves To"
                name="evolves_to"
                value={formData.evolves_to || ''}
                onChange={handleChange}
                helpText="Comma-separated list of Nexomon numbers"
              />

              <FormInput
                label="Breeding Results"
                name="breeding_results"
                value={formData.breeding_results || ''}
                onChange={handleChange}
                helpText="Nexomon number of baby form"
              />

              <FormInput
                label="Image URL"
                name="image_url"
                value={formData.image_url || ''}
                onChange={handleChange}
              />

              <div className="admin-form-checkboxes">
                <FormCheckbox
                  label="Legendary Nexomon"
                  name="is_legendary"
                  checked={formData.is_legendary}
                  onChange={handleChange}
                />
              </div>
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

export default NexomonMonsterFormPage;
