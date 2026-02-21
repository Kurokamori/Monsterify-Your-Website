import { InputHTMLAttributes, ReactNode } from 'react';

interface FormInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label?: string;
  error?: string;
  helpText?: string;
  icon?: ReactNode;
}

export function FormInput({
  label,
  name,
  type = 'text',
  required = false,
  disabled = false,
  error,
  helpText,
  icon,
  ...props
}: FormInputProps) {
  return (
    <div className="form-group">
      {label && (
        <label htmlFor={name} className="form-label">
          {label}
          {required && <span className="required-indicator"> *</span>}
        </label>
      )}
      <div className={`input-wrapper${icon ? ' has-icon' : ''}`}>
        {icon && <span className="input-icon">{icon}</span>}
        <input
          id={name}
          name={name}
          type={type}
          required={required}
          disabled={disabled}
          className={`input${error ? ' invalid' : ''}`}
          {...props}
        />
      </div>
      {error && <div className="form-error-text">{error}</div>}
      {helpText && !error && <div className="form-help-text">{helpText}</div>}
    </div>
  );
}
