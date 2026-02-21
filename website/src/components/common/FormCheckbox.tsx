import { InputHTMLAttributes } from 'react';

interface FormCheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'> {
  label: string;
  error?: string;
  helpText?: string;
}

export function FormCheckbox({
  label,
  name,
  disabled = false,
  error,
  helpText,
  ...props
}: FormCheckboxProps) {
  return (
    <div className="form-group">
      <label className="checkbox-label">
        <input
          type="checkbox"
          id={name}
          name={name}
          disabled={disabled}
          className="checkbox"
          {...props}
        />
        <span>{label}</span>
      </label>
      {error && <div className="form-error-text">{error}</div>}
      {helpText && !error && <div className="form-help-text">{helpText}</div>}
    </div>
  );
}
