import { ReactNode, FormEvent, ChangeEvent } from 'react';
import { FormInput } from '../common/FormInput';
import { FormSelect } from '../common/FormSelect';
import { FormTextArea } from '../common/FormTextArea';
import { FormCheckbox } from '../common/FormCheckbox';
import { FileUpload } from '../common/FileUpload';
import { LoadingSpinner } from '../common/LoadingSpinner';

type FieldType = 'text' | 'number' | 'select' | 'textarea' | 'checkbox' | 'file' | 'custom';

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  helpText?: string;
  placeholder?: string;
  options?: { value: string | number; label: string }[];
  rows?: number;
  render?: (value: unknown, onChange: (value: unknown) => void, errors: Record<string, string>) => ReactNode;
  min?: number;
  max?: number;
  disabled?: boolean;
}

export interface FieldSection {
  title?: string;
  fields: FieldDef[];
}

interface AdminFormProps {
  title: string;
  sections: FieldSection[];
  values: Record<string, unknown>;
  errors: Record<string, string>;
  onChange: (key: string, value: unknown) => void;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
  submitting?: boolean;
  loading?: boolean;
  loadingMessage?: string;
  imagePreview?: string;
  imagePreviewLabel?: string;
  submitLabel?: string;
  children?: ReactNode;
}

function renderField(
  field: FieldDef,
  values: Record<string, unknown>,
  errors: Record<string, string>,
  onChange: (key: string, value: unknown) => void,
) {
  const value = values[field.key];
  const error = errors[field.key];

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target;
    if (target instanceof HTMLInputElement && target.type === 'checkbox') {
      onChange(field.key, target.checked);
    } else if (target instanceof HTMLInputElement && target.type === 'number') {
      onChange(field.key, target.value === '' ? '' : Number(target.value));
    } else {
      onChange(field.key, target.value);
    }
  };

  switch (field.type) {
    case 'text':
      return (
        <FormInput
          key={field.key}
          label={field.label}
          name={field.key}
          value={String(value ?? '')}
          onChange={handleChange}
          error={error}
          required={field.required}
          placeholder={field.placeholder}
          helpText={field.helpText}
          disabled={field.disabled}
        />
      );

    case 'number':
      return (
        <FormInput
          key={field.key}
          label={field.label}
          name={field.key}
          type="number"
          value={value === '' || value === null || value === undefined ? '' : String(value)}
          onChange={handleChange}
          error={error}
          required={field.required}
          placeholder={field.placeholder}
          helpText={field.helpText}
          min={field.min}
          max={field.max}
          disabled={field.disabled}
        />
      );

    case 'select':
      return (
        <FormSelect
          key={field.key}
          label={field.label}
          name={field.key}
          value={String(value ?? '')}
          onChange={handleChange}
          options={field.options ?? []}
          error={error}
          required={field.required}
          helpText={field.helpText}
          placeholder={field.placeholder}
          disabled={field.disabled}
        />
      );

    case 'textarea':
      return (
        <FormTextArea
          key={field.key}
          label={field.label}
          name={field.key}
          value={String(value ?? '')}
          onChange={handleChange}
          error={error}
          required={field.required}
          rows={field.rows}
          placeholder={field.placeholder}
          helpText={field.helpText}
          disabled={field.disabled}
        />
      );

    case 'checkbox':
      return (
        <FormCheckbox
          key={field.key}
          label={field.label}
          name={field.key}
          checked={Boolean(value)}
          onChange={handleChange}
          error={error}
          helpText={field.helpText}
          disabled={field.disabled}
        />
      );

    case 'file':
      return (
        <div key={field.key} className="form-group">
          <label className="form-label">
            {field.label}
            {field.required && <span className="required-indicator"> *</span>}
          </label>
          <FileUpload
            onUploadSuccess={(url) => onChange(field.key, url)}
            initialImageUrl={typeof value === 'string' ? value : null}
            disabled={field.disabled}
          />
          {error && <div className="form-error-text">{error}</div>}
          {field.helpText && !error && <div className="form-help-text">{field.helpText}</div>}
        </div>
      );

    case 'custom':
      return field.render?.(value, (v) => onChange(field.key, v), errors) ?? null;

    default:
      return null;
  }
}

export function AdminForm({
  title,
  sections,
  values,
  errors,
  onChange,
  onSubmit,
  onCancel,
  submitting = false,
  loading = false,
  loadingMessage = 'Loading...',
  imagePreview,
  imagePreviewLabel = 'Image Preview',
  submitLabel,
  children,
}: AdminFormProps) {
  if (loading) {
    return (
      <div className="admin-form">
        <LoadingSpinner message={loadingMessage} />
      </div>
    );
  }

  const useColumns = sections.length === 2;

  return (
    <div className="admin-form">
      <div className="admin-form__header">
        <h1>{title}</h1>
      </div>

      <form onSubmit={onSubmit}>
        <div className="admin-form__body">
          {useColumns ? (
            <div className="admin-form__columns">
              {sections.map((section, i) => (
                <div key={i} className="admin-form__column">
                  {section.title && <h3 className="admin-form__section-title">{section.title}</h3>}
                  {section.fields.map(field => renderField(field, values, errors, onChange))}
                </div>
              ))}
            </div>
          ) : (
            sections.map((section, i) => (
              <div key={i} className="admin-form__column">
                {section.title && <h3 className="admin-form__section-title">{section.title}</h3>}
                {section.fields.map(field => renderField(field, values, errors, onChange))}
              </div>
            ))
          )}

          {children}

          {imagePreview && (
            <div className="admin-form__preview">
              <h3>{imagePreviewLabel}</h3>
              <div className="image-container medium no-margin">
                <img src={imagePreview} alt="Preview" />
              </div>
            </div>
          )}
        </div>

        <div className="admin-form__actions">
          <button
            type="button"
            className="button secondary"
            onClick={onCancel}
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
              <><i className="fas fa-spinner fa-spin"></i> Saving...</>
            ) : (
              submitLabel ?? 'Save'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
