import { SelectHTMLAttributes } from 'react';

interface SelectOption {
  value: string | number;
  label: string;
}

interface FormSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'> {
  label?: string;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  helpText?: string;
}

export function FormSelect({
  label,
  name,
  options,
  placeholder = 'Select an option',
  required = false,
  disabled = false,
  error,
  helpText,
  ...props
}: FormSelectProps) {
  return (
    <div className="form-group">
      {label && (
        <label htmlFor={name} className="form-label">
          {label}
          {required && <span className="required-indicator"> *</span>}
        </label>
      )}
      <select
        id={name}
        name={name}
        required={required}
        disabled={disabled}
        className={`select${error ? ' invalid' : ''}`}
        {...props}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <div className="form-error-text">{error}</div>}
      {helpText && !error && <div className="form-help-text">{helpText}</div>}
    </div>
  );
}
