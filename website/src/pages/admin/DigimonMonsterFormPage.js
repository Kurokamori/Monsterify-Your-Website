import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import monsterTypesApi from '../../services/monsterTypesApi';
import AdminLayout from '../../components/layouts/AdminLayout';
import FormInput from '../../components/common/FormInput';
import FormSelect from '../../components/common/FormSelect';
import FormTextarea from '../../components/common/FormTextarea';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';

const DigimonMonsterFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    rank: '',
    level_required: '',
    attribute: '',
    families: '',
    digimon_type: '',
    natural_attributes: '',
    digivolves_from: '',
    digivolves_to: '',
    breeding_results: '',
    image_url: ''
  });

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Digimon ranks for dropdown
  const digimonRanks = [
    'Fresh', 'In-Training', 'Rookie', 'Champion', 'Ultimate', 'Mega', 'Ultra', 'Armor'
  ];

  // Digimon attributes for dropdown
  const digimonAttributes = [
    'Vaccine', 'Data', 'Virus', 'Free', 'Variable'
  ];

  // Fetch Digimon monster data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      const fetchDigimonMonster = async () => {
        try {
          setLoading(true);
          const response = await monsterTypesApi.getDigimonMonsterById(id);
          setFormData(response.data);
        } catch (error) {
          console.error('Error fetching Digimon monster:', error);
          toast.error('Failed to fetch Digimon monster data');
        } finally {
          setLoading(false);
        }
      };

      fetchDigimonMonster();
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

    if (!formData.rank) {
      newErrors.rank = 'Rank is required';
    }

    if (!formData.attribute) {
      newErrors.attribute = 'Attribute is required';
    }

    if (formData.level_required && (isNaN(formData.level_required) || parseInt(formData.level_required) <= 0)) {
      newErrors.level_required = 'Level required must be a positive number';
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
      const digimonData = {
        ...formData,
        level_required: formData.level_required ? parseInt(formData.level_required) : null
      };

      if (isEditMode) {
        await monsterTypesApi.updateDigimonMonster(id, digimonData);
        toast.success('Digimon monster updated successfully');
      } else {
        await monsterTypesApi.createDigimonMonster(digimonData);
        toast.success('Digimon monster created successfully');
      }

      // Navigate back to the list page
      navigate('/admin/digimon-monsters');
    } catch (error) {
      console.error('Error saving Digimon monster:', error);
      toast.error(error.response?.data?.message || 'Failed to save Digimon monster');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate('/admin/digimon-monsters');
  };

  if (loading) {
    return (
      <div>
        <LoadingSpinner message="Loading Digimon monster data..." />
      </div>
    );
  }

  return (
    <div>
      <div className="admin-page-header">
        <h1>{isEditMode ? 'Edit Digimon Monster' : 'Add Digimon Monster'}</h1>
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

              <FormSelect
                label="Rank"
                name="rank"
                value={formData.rank}
                onChange={handleChange}
                options={digimonRanks.map(rank => ({ value: rank, label: rank }))}
                error={errors.rank}
                required
              />

              <FormInput
                label="Level Required"
                name="level_required"
                type="number"
                value={formData.level_required || ''}
                onChange={handleChange}
                error={errors.level_required}
                helpText="Minimum trainer level required to obtain this Digimon"
              />

              <FormSelect
                label="Attribute"
                name="attribute"
                value={formData.attribute}
                onChange={handleChange}
                options={digimonAttributes.map(attribute => ({ value: attribute, label: attribute }))}
                error={errors.attribute}
                required
              />

              <FormInput
                label="Digimon Type"
                name="digimon_type"
                value={formData.digimon_type || ''}
                onChange={handleChange}
                helpText="E.g., Holy Knight Digimon, Dragon Digimon, etc."
              />
            </div>

            <div className="admin-form-column">
              <FormInput
                label="Families"
                name="families"
                value={formData.families || ''}
                onChange={handleChange}
                helpText="Comma-separated list of families (e.g., Nature Spirits, Nightmare Soldiers)"
              />

              <FormInput
                label="Natural Attributes"
                name="natural_attributes"
                value={formData.natural_attributes || ''}
                onChange={handleChange}
                helpText="Comma-separated list of natural attributes (e.g., Fire, Wind)"
              />

              <FormInput
                label="Digivolves From"
                name="digivolves_from"
                value={formData.digivolves_from || ''}
                onChange={handleChange}
                helpText="Comma-separated list of Digimon names"
              />

              <FormInput
                label="Digivolves To"
                name="digivolves_to"
                value={formData.digivolves_to || ''}
                onChange={handleChange}
                helpText="Comma-separated list of Digimon names"
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

export default DigimonMonsterFormPage;
