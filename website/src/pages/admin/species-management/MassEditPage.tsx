import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { AdminRoute } from '@components/common/AdminRoute';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { Pagination } from '@components/common/Pagination';
import speciesService, { FRANCHISE_CONFIG } from '@services/speciesService';
import {
  SLUG_TO_FRANCHISE,
  getSpeciesAdminConfig,
  getIdField,
  getImageField,
  type SpeciesAdminConfig,
} from './speciesFieldConfig';
import type { FieldDef } from '@components/admin/AdminForm';

const DEFAULT_PER_PAGE = 25;
const CONCURRENT_SAVES = 5;

// Field types we can render inline (exclude 'custom' and 'file')
const INLINE_FIELD_TYPES = new Set(['text', 'number', 'select', 'textarea', 'checkbox']);

function getEditableFields(config: SpeciesAdminConfig): FieldDef[] {
  return config.formSections.flatMap(s => s.fields).filter(f => INLINE_FIELD_TYPES.has(f.type));
}

function MassEditContent() {
  const { franchise: slug } = useParams<{ franchise: string }>();
  const franchiseKey = slug ? SLUG_TO_FRANCHISE[slug] : undefined;
  const config = franchiseKey ? getSpeciesAdminConfig(franchiseKey) : undefined;
  const franchiseConfig = franchiseKey ? FRANCHISE_CONFIG[franchiseKey] : undefined;
  const idField = franchiseKey ? getIdField(franchiseKey) : 'id';
  const imageField = franchiseKey ? getImageField(franchiseKey) : 'imageUrl';

  useDocumentTitle(config ? `Mass Edit ${config.label}` : 'Mass Edit');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [species, setSpecies] = useState<Record<string, unknown>[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);

  // Edit tracking
  const editsRef = useRef<Map<string, Record<string, unknown>>>(new Map());
  const originalsRef = useRef<Map<string, Record<string, unknown>>>(new Map());
  const [modifiedIds, setModifiedIds] = useState<Set<string>>(new Set());

  // Save state
  const [saving, setSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState({ done: 0, total: 0 });
  const [saveResults, setSaveResults] = useState<{ successes: number; failures: string[] } | null>(null);

  const editableFields = config ? getEditableFields(config) : [];

  // Fetch species for current page
  const fetchPage = useCallback(async () => {
    if (!franchiseKey || !franchiseConfig) return;
    setLoading(true);
    setError(null);
    try {
      const result = await speciesService.getSpecies(franchiseKey, {
        page: currentPage,
        limit: perPage,
        sortBy: franchiseConfig.sortDefault,
        sortOrder: 'asc',
      });
      setSpecies(result.species);
      setTotalPages(result.totalPages);

      // Store originals for dirty-checking
      for (const s of result.species) {
        const id = String(s[idField]);
        if (!originalsRef.current.has(id)) {
          originalsRef.current.set(id, { ...s });
        }
      }
    } catch (err) {
      console.error('Error fetching species:', err);
      setError('Failed to load species data.');
    } finally {
      setLoading(false);
    }
  }, [franchiseKey, franchiseConfig, currentPage, idField, perPage]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  // Warn on unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (modifiedIds.size > 0) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [modifiedIds.size]);

  // Get the merged value for a species (original + edits overlay)
  const getMergedData = useCallback((original: Record<string, unknown>): Record<string, unknown> => {
    const id = String(original[idField]);
    const edits = editsRef.current.get(id);
    return edits ? { ...original, ...edits } : original;
  }, [idField]);

  // Handle field change
  const handleFieldChange = useCallback((speciesId: string, fieldKey: string, value: unknown) => {
    const current = editsRef.current.get(speciesId) || {};
    const updated = { ...current, [fieldKey]: value };
    editsRef.current.set(speciesId, updated);

    // Check if actually different from original
    const original = originalsRef.current.get(speciesId);
    if (original) {
      const isModified = Object.entries(updated).some(
        ([k, v]) => {
          const orig = original[k];
          // Normalize comparison: treat null/undefined/'' as equivalent for strings
          const normOrig = orig === null || orig === undefined ? '' : orig;
          const normVal = v === null || v === undefined ? '' : v;
          return String(normOrig) !== String(normVal);
        },
      );
      setModifiedIds(prev => {
        const next = new Set(prev);
        if (isModified) {
          next.add(speciesId);
        } else {
          next.delete(speciesId);
          editsRef.current.delete(speciesId);
        }
        return next;
      });
    } else {
      setModifiedIds(prev => new Set(prev).add(speciesId));
    }
  }, []);

  // Save all modified species
  const handleSave = useCallback(async () => {
    if (!franchiseKey || !config || modifiedIds.size === 0) return;

    // Validate all modified
    const toSave: { id: string; data: Record<string, unknown> }[] = [];
    const validationErrors: string[] = [];

    for (const id of modifiedIds) {
      const original = originalsRef.current.get(id) || {};
      const merged = { ...original, ...editsRef.current.get(id) };
      const errors = config.validate(merged);
      if (Object.keys(errors).length > 0) {
        const name = String(merged[franchiseConfig?.nameField || 'name'] || id);
        validationErrors.push(`${name}: ${Object.values(errors).join(', ')}`);
      } else {
        toSave.push({ id, data: editsRef.current.get(id)! });
      }
    }

    if (validationErrors.length > 0) {
      setError(`Validation errors:\n${validationErrors.join('\n')}`);
      return;
    }

    setSaving(true);
    setSaveProgress({ done: 0, total: toSave.length });
    setSaveResults(null);
    setError(null);

    let successes = 0;
    const failures: string[] = [];

    // Process in batches of CONCURRENT_SAVES
    for (let i = 0; i < toSave.length; i += CONCURRENT_SAVES) {
      const batch = toSave.slice(i, i + CONCURRENT_SAVES);
      const results = await Promise.allSettled(
        batch.map(({ id, data }) => speciesService.updateSpecies(franchiseKey, id, data)),
      );

      for (let j = 0; j < results.length; j++) {
        const result = results[j];
        const { id } = batch[j];
        if (result.status === 'fulfilled') {
          successes++;
          // Clear edits and update original
          editsRef.current.delete(id);
          const original = originalsRef.current.get(id);
          if (original) {
            Object.assign(original, batch[j].data);
          }
        } else {
          const original = originalsRef.current.get(id);
          const name = String(original?.[franchiseConfig?.nameField || 'name'] || id);
          failures.push(name);
        }
      }

      setSaveProgress({ done: i + batch.length, total: toSave.length });
    }

    // Update modified set
    setModifiedIds(prev => {
      const next = new Set(prev);
      for (const { id } of toSave) {
        if (!failures.some(f => {
          const orig = originalsRef.current.get(id);
          return f === String(orig?.[franchiseConfig?.nameField || 'name'] || id);
        })) {
          next.delete(id);
        }
      }
      return next;
    });

    setSaveResults({ successes, failures });
    setSaving(false);

    // Refresh current page data
    if (successes > 0) {
      fetchPage();
    }
  }, [franchiseKey, config, franchiseConfig, modifiedIds, fetchPage]);

  if (!franchiseKey || !config || !franchiseConfig) {
    return (
      <div className="error-container">
        <p className="alert error">Unknown species type: {slug}</p>
        <Link to="/admin" className="button secondary">Back to Dashboard</Link>
      </div>
    );
  }

  const basePath = `/admin/species/${slug}`;

  return (
    <div className="mass-edit">
      <div className="mass-edit__header">
        <div>
          <h1>Mass Edit {config.label}</h1>
          <p style={{ color: 'var(--text-color-muted)', margin: 0 }}>
            Edit fields inline across multiple species. Changes are tracked across pages.
          </p>
        </div>
        <div className="mass-edit__header-actions">
          <Link to={basePath} className="button secondary">
            <i className="fas fa-arrow-left"></i> Back to List
          </Link>
          {modifiedIds.size > 0 && (
            <button
              className="button primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <><i className="fas fa-spinner fa-spin"></i> Saving...</>
              ) : (
                <><i className="fas fa-save"></i> Save {modifiedIds.size} Change{modifiedIds.size !== 1 ? 's' : ''}</>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mass-edit__message mass-edit__message--error">
          <i className="fas fa-exclamation-circle"></i>
          <span style={{ whiteSpace: 'pre-line' }}>{error}</span>
        </div>
      )}
      {saveResults && (
        <div className={`mass-edit__message ${saveResults.failures.length > 0 ? 'mass-edit__message--error' : 'mass-edit__message--success'}`}>
          <i className={`fas ${saveResults.failures.length > 0 ? 'fa-exclamation-triangle' : 'fa-check-circle'}`}></i>
          <span>
            {saveResults.successes} saved successfully.
            {saveResults.failures.length > 0 && ` ${saveResults.failures.length} failed: ${saveResults.failures.join(', ')}`}
          </span>
        </div>
      )}

      {/* Save progress */}
      {saving && (
        <div className="mass-edit__progress">
          <div className="progress" style={{ flex: 1 }}>
            <div
              className="progress-fill primary"
              style={{ width: `${saveProgress.total > 0 ? (saveProgress.done / saveProgress.total) * 100 : 0}%` }}
            />
          </div>
          <span style={{ fontSize: 'var(--font-size-small)', color: 'var(--text-color-muted)' }}>
            {saveProgress.done}/{saveProgress.total}
          </span>
        </div>
      )}

      {loading ? (
        <LoadingSpinner message="Loading species..." />
      ) : (
        <>
          <div className="mass-edit__cards">
            {species.map(s => {
              const id = String(s[idField]);
              const merged = getMergedData(s);
              const isModified = modifiedIds.has(id);
              const imgUrl = merged[imageField] as string | null;

              return (
                <div key={id} className={`mass-edit__card${isModified ? ' mass-edit__card--modified' : ''}`}>
                  <div className="mass-edit__card-top">
                    {imgUrl && (
                      <img
                        src={imgUrl}
                        alt={String(merged[franchiseConfig.nameField] ?? '')}
                        className="mass-edit__card-image"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/images/default_image.png'; }}
                      />
                    )}
                    <Link
                      to={`${basePath}/edit/${id}`}
                      className="mass-edit__card-link"
                      title="Open full edit form"
                    >
                      <i className="fas fa-external-link-alt"></i>
                    </Link>
                  </div>

                  <div className="mass-edit__card-fields">
                    {editableFields.map(field => (
                      <MassEditField
                        key={field.key}
                        field={field}
                        value={merged[field.key]}
                        onChange={(val) => handleFieldChange(id, field.key, val)}
                        disabled={saving}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            perPage={perPage}
            onPerPageChange={(val) => { setPerPage(val); setCurrentPage(1); }}
          />
        </>
      )}

      {/* Sticky save bar */}
      {modifiedIds.size > 0 && !saving && (
        <div className="mass-edit__save-bar">
          <span>{modifiedIds.size} unsaved change{modifiedIds.size !== 1 ? 's' : ''}</span>
          <button className="button primary" onClick={handleSave}>
            <i className="fas fa-save"></i> Save All Changes
          </button>
        </div>
      )}
    </div>
  );
}

// -- Inline field renderer component --

interface MassEditFieldProps {
  field: FieldDef;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled: boolean;
}

function MassEditField({ field, value, onChange, disabled }: MassEditFieldProps) {
  const strVal = value === null || value === undefined ? '' : String(value);

  switch (field.type) {
    case 'text':
      return (
        <div className="mass-edit__field">
          <label className="mass-edit__field-label">
            {field.label}{field.required && ' *'}
          </label>
          <input
            type="text"
            className="input"
            value={strVal}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || field.label}
            disabled={disabled}
          />
        </div>
      );

    case 'number':
      return (
        <div className="mass-edit__field">
          <label className="mass-edit__field-label">
            {field.label}{field.required && ' *'}
          </label>
          <input
            type="number"
            className="input"
            value={strVal}
            onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
            min={field.min}
            max={field.max}
            disabled={disabled}
          />
        </div>
      );

    case 'select':
      return (
        <div className="mass-edit__field">
          <label className="mass-edit__field-label">
            {field.label}{field.required && ' *'}
          </label>
          <select
            className="select"
            value={strVal}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
          >
            {!field.required && <option value="">—</option>}
            {(field.options ?? []).map(opt => (
              <option key={String(opt.value)} value={String(opt.value)}>{opt.label}</option>
            ))}
          </select>
        </div>
      );

    case 'textarea':
      return (
        <div className="mass-edit__field">
          <label className="mass-edit__field-label">
            {field.label}{field.required && ' *'}
          </label>
          <textarea
            className="textarea"
            value={strVal}
            onChange={(e) => onChange(e.target.value)}
            rows={field.rows ?? 2}
            disabled={disabled}
          />
        </div>
      );

    case 'checkbox':
      return (
        <div className="mass-edit__field mass-edit__field--checkbox">
          <label className="mass-edit__field-label">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => onChange(e.target.checked)}
              disabled={disabled}
            />
            {' '}{field.label}
          </label>
        </div>
      );

    default:
      return null;
  }
}

export default function MassEditPage() {
  return (
    <AdminRoute>
      <MassEditContent />
    </AdminRoute>
  );
}
