import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { AdminRoute } from '@components/common/AdminRoute';
import { AdminForm } from '@components/admin/AdminForm';
import speciesService, {
  FRANCHISE_CONFIG,
} from '@services/speciesService';
import {
  SLUG_TO_FRANCHISE,
  getSpeciesAdminConfig,
} from './speciesFieldConfig';

function SpeciesFormContent() {
  const { franchise: slug, id } = useParams<{ franchise: string; id: string }>();
  const navigate = useNavigate();

  const franchiseKey = slug ? SLUG_TO_FRANCHISE[slug] : undefined;
  const config = franchiseKey ? getSpeciesAdminConfig(franchiseKey) : undefined;
  const franchiseConfig = franchiseKey ? FRANCHISE_CONFIG[franchiseKey] : undefined;
  const isEditMode = !!id;

  const title = config
    ? isEditMode ? `Edit ${config.label}` : `Add ${config.label}`
    : 'Species Form';
  useDocumentTitle(title);

  const [values, setValues] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);

  // Initialize default values
  useEffect(() => {
    if (config && !isEditMode) {
      setValues({ ...config.defaultValues });
    }
  }, [config, isEditMode]);

  // Fetch existing data in edit mode
  useEffect(() => {
    if (!isEditMode || !franchiseKey || !id) return;

    const fetchItem = async () => {
      setLoading(true);
      try {
        const data = await speciesService.getSpeciesById(franchiseKey, id);
        setValues(data as Record<string, unknown>);
      } catch (err) {
        console.error('Error fetching species:', err);
        setErrors({ _form: 'Failed to load species data.' });
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [isEditMode, franchiseKey, id]);

  const handleChange = useCallback((key: string, value: unknown) => {
    setValues(prev => ({ ...prev, [key]: value }));
    // Clear field error on change
    setErrors(prev => {
      if (prev[key]) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return prev;
    });
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!franchiseKey || !config) return;

    // Validate
    const validationErrors = config.validate(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      if (isEditMode && id) {
        await speciesService.updateSpecies(franchiseKey, id, values);
      } else {
        await speciesService.createSpecies(franchiseKey, values);
      }
      navigate(`/admin/species/${slug}`);
    } catch (err) {
      console.error('Error saving species:', err);
      const message = err instanceof Error ? err.message : 'Failed to save species.';
      setErrors({ _form: message });
    } finally {
      setSubmitting(false);
    }
  }, [franchiseKey, config, values, isEditMode, id, navigate, slug]);

  const handleCancel = useCallback(() => {
    navigate(`/admin/species/${slug}`);
  }, [navigate, slug]);

  if (!franchiseKey || !config || !franchiseConfig) {
    return (
      <div className="error-container">
        <p className="alert error">Unknown species type: {slug}</p>
        <Link to="/admin" className="button secondary">Back to Dashboard</Link>
      </div>
    );
  }

  // Determine image preview
  const imageField = franchiseConfig.imageField;
  const imagePreview = typeof values[imageField] === 'string' && values[imageField]
    ? values[imageField] as string
    : undefined;

  return (
    <>
      {errors._form && (
        <div className="alert error" style={{ marginBottom: 'var(--spacing-small)' }}>
          <i className="fas fa-exclamation-circle"></i> {errors._form}
        </div>
      )}

      <AdminForm
        title={title}
        sections={config.formSections}
        values={values}
        errors={errors}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        submitting={submitting}
        loading={loading}
        loadingMessage={`Loading ${config.label} data...`}
        imagePreview={imagePreview}
        imagePreviewLabel="Image Preview"
      />
    </>
  );
}

export default function SpeciesFormPage() {
  return (
    <AdminRoute>
      <SpeciesFormContent />
    </AdminRoute>
  );
}
