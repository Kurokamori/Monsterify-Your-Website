import { TextareaHTMLAttributes } from 'react';

interface FormTextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  label?: string;
  error?: string;
  helpText?: string;
}

export function FormTextArea({
  label,
  name,
  rows = 4,
  required = false,
  disabled = false,
  error,
  helpText,
  ...props
}: FormTextAreaProps) {
  return (
    <div className="form-group">
      {label && (
        <label htmlFor={name} className="form-label">
          {label}
          {required && <span className="required-indicator"> *</span>}
        </label>
      )}
      <textarea
        id={name}
        name={name}
        rows={rows}
        required={required}
        disabled={disabled}
        className={`textarea${error ? ' invalid' : ''}`}
        {...props}
      />
      {error && <div className="form-error-text">{error}</div>}
      {helpText && !error && <div className="form-help-text">{helpText}</div>}
    </div>
  );
}
